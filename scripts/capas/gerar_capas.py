"""Gera as capas dos posts (1200x675, webp) em public/assets/blog/.

Uso, na raiz do site-sucupira:
    python scripts/capas/gerar_capas.py                 # todos os posts
    python scripts/capas/gerar_capas.py slug-a slug-b   # só esses
    python scripts/capas/gerar_capas.py --amostra       # grava em scripts/capas/amostra/

Cada post usa a imagem do próprio `ogImage`, sobrescrevendo o arquivo, e ganha
ao lado uma `<nome>-topo.webp`: só a foto, sem texto, que o topo do artigo usa
(ArticleHeader.astro). Sem ela, o título desenhado na capa aparece atrás do H1. O texto
vem do frontmatter: `seoTitle` (ou `title`) e a primeira tag que não seja
"Sucupira". Os fundos em `fundos/` não mostram o produto: a capa é editorial,
não anúncio. O texto fica num painel opaco de altura inteira à esquerda: ele
esconde o cartão da versão anterior, que os fundos ainda trazem, e deixa à mostra
só a faixa da direita.

Requer Pillow. Fontes do Windows (Georgia e Segoe UI); em outro sistema, ajuste
FONTES.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = Path(__file__).resolve().parents[2]
POSTS = RAIZ / "src" / "content" / "blog"
PUBLIC = RAIZ / "public"
FUNDOS = Path(__file__).resolve().parent / "fundos"
AMOSTRA = Path(__file__).resolve().parent / "amostra"

NOME_DO_SITE = "Guia da Sucupira"
LARGURA, ALTURA = 1200, 675

FONTES = {
    "titulo": "C:/Windows/Fonts/georgiab.ttf",
    "rotulo": "C:/Windows/Fonts/segoeuib.ttf",
}

CREME = (250, 246, 238)
VERDE = (34, 96, 58)
VERDE_ESCURO = (27, 77, 47)
TINTA = (38, 30, 24)

# Fundo por assunto. O que não estiver nas listas usa a compressa com mel,
# que serve aos posts de dor e de condição.
SEMENTES = {
    "o-que-e-sucupira-branca", "como-fazer-cha-de-sucupira", "como-tomar-extrato-de-sucupira",
    "quantas-tampinhas-de-sucupira-por-dia-guia-de-doses", "sucupira-em-capsulas",
    "cha-de-sucupira-capsula-ou-extrato", "como-escolher-produto-de-sucupira", "sucupira-e-confiavel",
    "sucupira-composta", "garrafada-de-sucupira-o-que-e", "sucupira-no-vinho-para-que-serve-e-cuidados-importantes",
    "oleo-de-sucupira-para-que-serve", "sucupira-para-a-pele", "sucupira-para-que-serve",
    "sucupira-alivia-dores-cronicas-o-que-a-ciencia-diz", "quanto-tempo-a-sucupira-leva-para-fazer-efeito",
    "sucupira-ou-canela-de-velho-qual-e-melhor-para-dor-nas-articulacoes",
}
PILAO = {
    "sucupira-contraindicacoes", "sucupira-e-medicamentos", "sucupira-faz-mal-para-quem-toma-anticoagulante",
    "sucupira-e-pressao-alta", "sucupira-e-colesterol", "sucupira-e-diabetes", "sucupira-na-gravidez",
    "sucupira-na-menopausa", "sucupira-para-idosos", "sucupira-faz-mal-para-os-rins-ou-figado",
    "efeitos-colaterais-da-sucupira", "sucupira-engorda-ou-emagrece", "produto-natural-tambem-precisa-de-cuidado",
}

# Painel de texto: altura inteira, até x = 760. Os fundos têm o cartão antigo até x ~ 740.
PAINEL = 760
MARGEM = 88
LARGURA_TEXTO = PAINEL - MARGEM - 64


def frontmatter(texto: str) -> dict[str, str]:
    bloco = re.match(r"^---\s*\n(.*?)\n---", texto.replace("\r\n", "\n"), re.S)
    if not bloco:
        return {}
    campos: dict[str, str] = {}
    for linha in bloco.group(1).splitlines():
        m = re.match(r"^(\w+):\s*(.*)$", linha)
        if m:
            campos[m.group(1)] = m.group(2).strip()
    return campos


def sem_aspas(valor: str) -> str:
    valor = valor.strip()
    if len(valor) >= 2 and valor[0] == valor[-1] and valor[0] in "\"'":
        return valor[1:-1]
    return valor


def tag_principal(valor: str) -> str:
    tags = re.findall(r'"([^"]+)"', valor)
    for tag in tags:
        if tag != "Sucupira":
            return tag
    return tags[0] if tags else "Uso tradicional"


def quebrar(texto: str, fonte: ImageFont.FreeTypeFont, largura: int) -> list[str]:
    linhas: list[str] = []
    atual = ""
    # Número no começo ("7 anti-inflamatórios") não fica sozinho na linha.
    texto = re.sub(r"^(\d+) ", lambda m: m.group(1) + "\u00a0", texto)
    for palavra in texto.split(" "):
        tentativa = f"{atual} {palavra}".strip()
        if fonte.getlength(tentativa) <= largura:
            atual = tentativa
        else:
            if atual:
                linhas.append(atual)
            atual = palavra
    if atual:
        linhas.append(atual)
    return linhas


def titulo_que_cabe(texto: str) -> tuple[ImageFont.FreeTypeFont, list[str], int]:
    for tamanho in (64, 60, 56, 52, 48, 44, 40):
        fonte = ImageFont.truetype(FONTES["titulo"], tamanho)
        linhas = quebrar(texto, fonte, LARGURA_TEXTO)
        if len(linhas) <= 4:
            return fonte, linhas, int(tamanho * 1.2)
    fonte = ImageFont.truetype(FONTES["titulo"], 40)
    return fonte, quebrar(texto, fonte, LARGURA_TEXTO)[:5], 48


def fundo_para(slug: str) -> Image.Image:
    nome = "sementes" if slug in SEMENTES else "pilao-e-sementes" if slug in PILAO else "compressa-e-mel"
    return Image.open(FUNDOS / f"{nome}.webp").convert("RGB").resize((LARGURA, ALTURA))


def capa(slug: str, titulo: str, tag: str) -> Image.Image:
    imagem = fundo_para(slug)

    # Sombra suave na borda do painel, para separar texto e foto.
    sombra = Image.new("L", (LARGURA, ALTURA), 0)
    ImageDraw.Draw(sombra).rectangle((0, 0, PAINEL + 8, ALTURA), fill=110)
    sombra = sombra.filter(ImageFilter.GaussianBlur(16))
    imagem.paste((0, 0, 0), (0, 0), sombra)

    desenho = ImageDraw.Draw(imagem)
    desenho.rectangle((0, 0, PAINEL, ALTURA), fill=CREME)
    desenho.rectangle((0, 0, 14, ALTURA), fill=VERDE)

    x = MARGEM
    fonte_rotulo = ImageFont.truetype(FONTES["rotulo"], 28)
    desenho.text((x, 92), NOME_DO_SITE, font=fonte_rotulo, fill=VERDE)
    desenho.rectangle((x, 140, x + 56, 144), fill=VERDE)

    fonte_titulo, linhas, entrelinha = titulo_que_cabe(titulo)
    y = 186
    for linha in linhas:
        desenho.text((x, y), linha, font=fonte_titulo, fill=TINTA)
        y += entrelinha

    fonte_tag = ImageFont.truetype(FONTES["rotulo"], 24)
    largura_tag = int(fonte_tag.getlength(tag)) + 48
    topo_tag = ALTURA - 92 - 46
    desenho.rounded_rectangle((x, topo_tag, x + largura_tag, topo_tag + 46), radius=23, fill=VERDE_ESCURO)
    desenho.text((x + 24, topo_tag + 23), tag, font=fonte_tag, fill=(255, 255, 255), anchor="lm")
    return imagem


def main(argumentos: list[str]) -> int:
    amostra = "--amostra" in argumentos
    pedidos = {a for a in argumentos if not a.startswith("--")}
    feitas = 0
    for arquivo in sorted(POSTS.glob("*.md")):
        slug = arquivo.stem
        if pedidos and slug not in pedidos:
            continue
        campos = frontmatter(arquivo.read_text(encoding="utf-8"))
        og = sem_aspas(campos.get("ogImage", ""))
        if not og:
            print(f"sem ogImage, pulado: {slug}")
            continue
        titulo = sem_aspas(campos.get("seoTitle") or campos.get("title", slug))
        destino = (AMOSTRA / Path(og).name) if amostra else PUBLIC / og.lstrip("/")
        destino.parent.mkdir(parents=True, exist_ok=True)
        capa(slug, titulo, tag_principal(campos.get("tags", ""))).save(destino, "WEBP", quality=82, method=6)
        faixa = fundo_para(slug).crop((PAINEL + 10, 0, LARGURA, ALTURA))
        faixa.save(destino.with_name(destino.stem + "-topo.webp"), "WEBP", quality=80, method=6)
        feitas += 1
        print(f"{slug} -> {destino.relative_to(RAIZ)}")
    print(f"{feitas} capa(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
