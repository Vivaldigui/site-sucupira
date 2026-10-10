# Plano de medição do blog

Atualizado em 2026-10-08 (anúncios da loja e parâmetro `criativo`). Referência para qualquer análise ou implementação futura com dados do GA4.

> De 05 a 08/10/2026 o blog ficou em `guiadasucupira.com.br`, sem cookie compartilhado com a loja. Nesses dias, na propriedade da loja, as visitas vindas do blog aparecem como `guiadasucupira.com.br / referral`, e `sn_blog_origem` não foi gravado. Em análises que cruzem esse período, somar os dois hosts.

## As perguntas que a medição responde

1. **Estão lendo?** Até onde rolam e se chegam ao fim com tempo real de leitura.
2. **Estão indo para a loja?** De qual artigo e por qual link.
3. **Está virando venda?** Qual artigo esteve no caminho de uma compra.

E, de quebra: artigo de marca rende mais que artigo de condição? O que os leitores buscam e não acham? Qual página está lenta?

## Onde os dados chegam

| Propriedade | ID | Recebe |
|---|---|---|
| `blog-sucupira` (properties/543095152) | `G-L27DL7MMTY` | tudo do blog |
| loja oficial | `G-LZDYVCN9FV` | tudo do blog (menos Web Vitals) **e** tudo da loja, incluindo `purchase` |

- O GA4 só carrega em `blog.sucupiranaturale.com.br` (`src/components/GoogleAnalytics.astro`). Em `localhost`, no preview e no domínio padrão do Firebase, `gtag` só escreve no console, com o prefixo `[GA4 desligado fora de produção]`.
- Blog e loja dividem o cookie `_ga` no domínio `.sucupiranaturale.com.br`. Por isso a propriedade da loja enxerga a visita inteira — entrada no artigo, clique, compra — numa sessão só. Não é poluição: é o que liga artigo e venda. Para separar, filtrar por **Nome do host**.
- O checkout fica no mesmo domínio da loja (`/carrinho`, `/checkout`). O `purchase` sai do GTM da loja (`GTM-P2NH5DR8`).

## Eventos

| Evento | Quando | Parâmetros | Arquivo |
|---|---|---|---|
| `page_view` (automático) | toda página | `content_group` + dados do artigo (abaixo) | `GoogleAnalytics.astro` |
| `leitura_artigo` | passou de 25, 50, 75 e 100% do corpo do texto | `percentual` | `ReadingTracking.astro` |
| `artigo_lido` | chegou em "Perguntas frequentes" (ou ao fim do texto) com ≥ 30 s de página visível | `chegou_em`, `segundos_visiveis` | `ReadingTracking.astro` |
| `clique_para_loja` | clique em link da loja | `destino_path`, `posicao_link`, `texto_link`, `criativo` (só nos anúncios da loja) | `LinkTracking.astro` |
| `clique_interno` | clique para outra página do blog | `destino_path`, `posicao_link`, `texto_link` | `LinkTracking.astro` |
| `clique_indice` | clique no índice "Neste artigo" | `secao` | `LinkTracking.astro` |
| `clique_contato` | WhatsApp, telefone ou e-mail | `canal`, `posicao_link` | `LinkTracking.astro` |
| `search` | 1,5 s depois de parar de digitar na busca (≥ 3 caracteres) | `search_term`, `resultados` | `SearchTracking.astro` |
| `web_vitals` | LCP, INP e CLS do leitor real (só propriedade do blog) | `metric_name`, `metric_value`, `metric_rating`, `metric_id` | `WebVitalsTracking.astro` |

Da medição otimizada do GA4, sem código nosso: `scroll` (só 90% da página inteira), `click` (links de saída), `user_engagement`.

O artigo de origem **não** vai como parâmetro em nenhum evento: todo evento já traz o caminho da página (dimensão **Caminho da página e classe de tela**).

### Dados do artigo (seguem com todos os eventos da página)

| Parâmetro | Valores |
|---|---|
| `content_group` | `artigo`, `listagem`, `institucional` |
| `artigo_tipo` | `marca` (título cita sucupira) ou `condicao` |
| `artigo_tag_principal` | primeira tag que não seja "Sucupira" |
| `artigo_tags` | todas as tags, separadas por " \| " (até 100 caracteres) |
| `artigo_publicado_em` | `AAAA-MM` |
| `artigo_atualizado` | `sim` / `nao` (tem `updatedDate`) |
| `artigo_faq` | `sim` / `nao` |
| `artigo_palavras` | `ate-799`, `800-1499`, `1500-2499`, `2500-ou-mais` (aproximado) |

`texto_link` é o texto visível do link, até 100 caracteres. Em card inteiro clicável (listagem, "Leia também"), é só o título do card.

### Valores de `posicao_link`

`indice` · `cabecalho` · `rodape` · `breadcrumb` · `barra-fixa` · `bloco-cta` · `leia-tambem` · `paginacao` · `listagem` · `corpo-do-texto` · `outro`

Desde 08/10/2026, anúncios da loja (sem anúncio de terceiros no blog): `anuncio-topo` (faixa em todas as páginas) · `anuncio-meio` (card no meio do texto) · `anuncio-fim` (card depois do texto) · `anuncio-listagem` (card na grade da home e das páginas) · `anuncio-busca` (busca sem resultado) · `anuncio-404`. A posição vem do `data-posicao` do bloco.

### Valores de `criativo`

Vem do `data-criativo` e identifica a peça. Os ids estão em `src/config/store-ads.ts`: `A-pronta-para-tomar`, `A-pronta-alivio`, `B-kit-tempo-de-uso`, `C-composicao`, `D-pronta-alivio`, `D-tres-beneficios`, `D-pronta-para-tomar`, `topo-kits`, `listagem-combos`, `link-primeira-mencao` e `barra-A` a `barra-D`. A letra é o grupo do post. Ao trocar uma peça, trocar o id, senão o relatório mistura as duas.

A seleção fixa por slug é o fallback sem JavaScript. A proposta de 09/10 abaixo adiciona distribuição estável por navegador: usar exposições visíveis, não page_view, como denominador dos anúncios. Não trocar peças automaticamente por poucos cliques.

### Cookie de origem para a loja

No clique para a loja, `LinkTracking.astro` grava `sn_blog_origem` = caminho do artigo, no domínio `.sucupiranaturale.com.br`, por 30 dias. O nome é próprio porque o GTM da loja já usa `sn_origem` (valor `seudesconto`). **Hoje nada lê esse cookie** — ver "Pendência na loja".

## Configuração manual no GA4

Nada disto se faz pelo código. Dimensão personalizada **não é retroativa**: o dado só aparece a partir do dia do registro.

**Dimensões personalizadas (escopo de evento)** — nas duas propriedades, exceto as de Web Vitals (só blog):

`posicao_link` · `destino_path` · `texto_link` · `criativo` · `percentual` · `chegou_em` · `canal` · `secao` · `resultados` · `artigo_tipo` · `artigo_tag_principal` · `artigo_tags` · `artigo_publicado_em` · `artigo_atualizado` · `artigo_faq` · `artigo_palavras` · `metric_name` · `metric_rating`

**Métricas personalizadas:** `segundos_visiveis` (unidade: segundos) · `metric_value` (padrão; só blog)

**Eventos-chave:** `clique_para_loja` e `artigo_lido` no blog; `purchase` na loja.

**Propriedade (Admin):**
- Retenção de dados: **14 meses** nas duas (o padrão é 2, e explorações não enxergam além disso).
- Vincular ao **BigQuery** (exportação diária gratuita), para guardar o evento bruto sem limite de prazo.
- Fluxo `G-L27DL7MMTY` → Medição otimizada → **desligar "alterações de página com base em eventos do histórico do navegador"**. O site não é SPA, e a busca troca a URL a cada tecla.
- Excluir os fluxos órfãos `G-VQRPRKP7X8` e `G-LKJ941JYSH`, depois de confirmar que não recebem dados.
- Moeda da propriedade do blog: BRL.

**Não fazer:** UTM em link do blog para a loja, nem incluir o blog em "referências indesejadas" na loja. As duas coisas quebram a atribuição.

## Onde olhar cada pergunta

| Pergunta | Propriedade | Exploração |
|---|---|---|
| Estão lendo? | blog | `leitura_artigo` por Caminho da página × `percentual`; taxa = `artigo_lido` ÷ `page_view` do artigo |
| Vão para a loja? | blog | `clique_para_loja` por Caminho da página × `posicao_link` |
| Qual anúncio da loja funciona | blog | `clique_para_loja` por `criativo` × `posicao_link` |
| Está vendendo? | **loja** | Nome do host + Página de destino × Sessões, Transações, Receita, filtro host = `blog.sucupiranaturale.com.br` |
| Marca × condição | blog | qualquer métrica acima por `artigo_tipo` |
| O que buscam e não acham | blog | `search` por Termo de pesquisa, filtro `resultados` = 0 |
| Qual página está lenta | blog | `web_vitals` por Caminho da página × `metric_name`, filtro `metric_rating` = `poor` |
| Qual link interno funciona | blog | `clique_interno` por `posicao_link` × `destino_path` |

## Pendência na loja (GTM)

Para a venda ficar ligada ao artigo mesmo quando a sessão se quebra (leitor volta dias depois), o GTM da loja precisa:

1. criar uma variável de cookie `sn_blog_origem`;
2. enviá-la como parâmetro `origem_blog` nos eventos `begin_checkout` e `purchase` para `G-LZDYVCN9FV`;
3. registrar `origem_blog` como dimensão personalizada na propriedade da loja.

Na mesma visita, conferir no DebugView se o `purchase` sai com `transaction_id`, `value` e `currency: BRL`. Sem `transaction_id`, o GA4 não conta transação.

## Histórico e ressalvas do dado

- **Entre 2026-09-08 e a publicação desta versão**, `clique_para_loja` também contou cliques internos do blog (a loja era reconhecida por sufixo de domínio, e o blog tem o mesmo sufixo). Ignorar esse evento nesse período.
- Até esta versão, os parâmetros eram `origem_path`, `posicao_cta` e `destino_url`. Foram trocados por caminho da página, `posicao_link` e `destino_path`. Se já tiverem sido registrados, podem ser arquivados.
- Pageviews de `localhost` entraram nos relatórios antes da trava de domínio. Filtrar por Nome do host.
- `artigo_palavras` conta a marcação de Markdown junto: serve como faixa, não como contagem.

## Como testar

- **Local:** `npm run dev`, abrir um artigo e o console do navegador. Cada evento aparece como `[GA4 desligado fora de produção]` com nome e parâmetros. Nada é enviado.
- **Produção:** Google Tag Assistant ou DebugView do GA4.


## Proposta de 09/10/2026: combos e comparação de peças

Todos os anúncios, banner do rodapé, ProductCTA e primeira menção levam diretamente a `/combos`,
sem UTM. IDs novos `*-v2`; novas posições `anuncio-rodape` e `primeira-mencao`.
O rodapé tem `data-sn-cta="anuncio-rodape"`, que tem precedência sobre a classificação genérica rodape.
A barra móvel começa oculta, aparece após 35% de rolagem do corpo do artigo e some quando um
card da loja/topo/final/rodapé entra na tela. Fechamento vale 7 dias em localStorage; não há barra
nos dois slugs sensíveis. Sem IntersectionObserver ela fica oculta.

Experimento `blog-combos-20261009-v2`: distribuição 50/50 entre duas variantes, persistida por
30 dias no navegador (localStorage `sn_ads_blog-combos-20261009-v2`). Sem armazenamento,
a variante dura só aquela página. A peça não muda durante a leitura; não é carrossel.
Imagens quadradas, com dimensões e espaço reservado, impedem troca de proporção entre variantes.

`anuncio_loja_visto` exige pelo menos 50% do anúncio por 1 segundo contínuo com a aba visível,
no máximo uma vez por bloco e carregamento. Envia `criativo`, `posicao_link`, `experimento`, `variante`.
`clique_para_loja` envia os mesmos identificadores da peça **efetivamente exibida**. Registrar
`experimento` e `variante` como dimensões de evento nas duas propriedades GA4 após publicação.
Não houve alteração da conta GA4 neste PR. Cliques rápidos antes da exposição podem existir.

No CRM, o button_id passa a ser `posicao__criativo-indice`. O schema existente já aceita isso:
relatório de participação do blog liga compras ao último clique do visitante na janela existente
(90 dias). O painel mostra o ID no campo do botão, permitindo comparar compra e receita por peça.
Não são conversões incrementais nem prova de causa; não se deve somar a assistência do blog ao
canal de origem e tratar como duas vendas. Não há novo envio de conversão ao Google.

Comparação em 4 semanas: CTR = cliques / exposições visíveis, segmentado por peça × posição ×
artigo/aparelho; no CRM, compradores/pedidos e receita assistida por button_id (remover o sufixo
numérico de posição do link para agregar). Não escolher vencedor por curtidas do Instagram.
Linha de base informada: **23 cliques à loja/semana no CRM em 03–09/10/2026**. Comparar também
`artigo_lido / page_view` dos mesmos artigos e aparelhos: sucesso é aumentar cliques a combos
sem reduzir leitura. O valor numérico da taxa de leitura da linha de base ainda precisa ser
extraído do GA4; não foi inventado aqui. Pouca amostra pede mais tempo, não rotação automática do vencedor.

Seleção e fontes: [catálogo de criativos](criativos-blog-2026-10-09.md).
