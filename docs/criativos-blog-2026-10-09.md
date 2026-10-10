# Criativos do blog — proposta de 09/10/2026

A escolha prioriza produto legível, apresentação da empresa e variedade visual. Não é um ranking de conversão: ainda não há exposição real do experimento. O pedido posterior do dono ampliou as opções e permitiu a peça com jaleco. Novos títulos/textos permanecem editáveis em HTML.

Fonte nova: [empresa familiar no Instagram](https://www.instagram.com/p/DdMbZ-cuTR8/), baixada em JPEG 1440×1440. Também baixamos [colagem dos frascos](https://www.instagram.com/sucupira_naturale/p/DdjVMltOu9C/), guardada nos originais, mas não incluída nesta primeira rotação por legibilidade. Outros três visuais vieram dos assets já existentes no repositório (frasco, kit e pronta para tomar). Os originais ficam em material-instagram/, ignorados no Git; os WebPs têm versões 720 e 1200, todos abaixo de 90 KB.

Vídeos candidatos: [apresentação do produto](https://www.instagram.com/sucupira_naturale/reel/DaqSd1uuBU-/) e [demonstração com copo](https://www.instagram.com/sucupira_naturale/reel/DeSRgrQvs4F/). O player abriu, mas o download do vídeo/stream falhou nas ferramentas do navegador. **Nenhum vídeo foi incluído nem declarado baixado.** Para adicioná-los à rotação, é necessário obter o arquivo original; não há embed do Instagram nem autoplay nesta entrega.

## Catálogo

| ID | Grupo | Imagem | Título | Texto |
|---|---|---|---|---|
| a-pronta-v2 | A | /assets/loja/pronta-v2-720.webp | Sucupira pronta para tomar | Frasco de 400 ml, sem preparar chá ou garrafada em casa. |
| a-familia-v2 | A | /assets/loja/familia-instagram-720.webp | Do preparo da nossa família para a sua rotina | Conheça a Sucupira Naturale líquida e as opções de kits. |
| b-kits-v2 | B | /assets/loja/kit-v2-720.webp | Escolha seu combo | Opções de 2 a 12 frascos de Sucupira Naturale líquida, de 400 ml cada. |
| b-frasco-v2 | B | /assets/loja/frasco-v2-720.webp | Conheça as opções da loja | Sucupira líquida pronta para tomar, em frasco de 400 ml. |
| c-familia-v2 | C | /assets/loja/familia-instagram-720.webp | Uma empresa familiar desde 2016 | Conheça a Sucupira Naturale, de Itanhandu (MG). |
| c-composicao-v2 | C | /assets/loja/frasco-v2-720.webp | Composição declarada | 49,75% semente de sucupira, 49,75% água mineral e 0,5% álcool de cereais. |
| d-frasco-v2 | D | /assets/loja/frasco-v2-720.webp | Sucupira Naturale Líquida | Conheça o frasco de 400 ml e as opções disponíveis na loja. |
| d-familia-v2 | D | /assets/loja/familia-instagram-720.webp | Conheça nossa empresa familiar | Sucupira líquida pronta para tomar, produzida em Itanhandu (MG). |

Fixos: rodape-familia-v2 (imagem familia-instagram-1200; “Conheça os combos da Sucupira Naturale”; “Uma empresa familiar desde 2016. Frascos de 400 ml, prontos para tomar.”), topo-kits-v2, listagem-combos-v2, primeira-mencao-v2, produto-combos-v2 e barra-a-v2 até barra-d-v2. Todos levam a /combos. Configuração completa em src/config/store-ads.ts.

## Evidências visuais

| Página | Celular 390×844 | Computador 1366×900 |
|---|---|---|
| Artigo A | [Print](prints-anuncios/a-mobile.png) | [Print](prints-anuncios/a-desktop.png) |
| Artigo C | [Print](prints-anuncios/c-mobile.png) | [Print](prints-anuncios/c-desktop.png) |
| Artigo D | [Print](prints-anuncios/d-mobile.png) | [Print](prints-anuncios/d-desktop.png) |
| Home | [Print](prints-anuncios/home-mobile.png) | [Print](prints-anuncios/home-desktop.png) |
| 404 | [Print](prints-anuncios/404-mobile.png) | [Print](prints-anuncios/404-desktop.png) |

[Banner no rodapé — computador](prints-anuncios/rodape-desktop.png) · [celular](prints-anuncios/rodape-mobile.png). Capturas locais, sem enviar eventos de teste à produção.

## Lighthouse e validação

Lighthouse 13.5.0, modo mobile, Edge headless, artigo /como-fazer-cha-de-sucupira/, localhost. Uma execução antes e depois em 09/10/2026 (BRT). Base visual: origin/main 09df34e, usando build do PR de sinais de publicidade (as alterações desse PR só afetam GA4, desligado em localhost).

| Métrica | Antes | Depois |
|---|---:|---:|
| Performance | 100 | 100 |
| CLS | 0 | 0 |
| LCP | 1,212 s | 1,282 s |
| TBT | 0 ms | 0 ms |

Resultado de laboratório, não estimativa de produção; medições após publicação devem usar web_vitals. Build de 56 páginas verifica destino, identificação, dimensões e limites. Teste da rotação cobre persistência, impressão visível, troca de aba e deduplicação. Revisão manual no celular/computador sem abrir links de compra. A barra foi fechada e continuou oculta após recarregar; foco de teclado ficou visível no card. Console local sem erros.

## Após merge pelo dono

O merge na main publica o blog via Actions; não houve merge nem deploy nesta entrega. Registrar dimensões experimento/variante no GA4 e conferir em celular: barra após 35%, ocultação ao alcançar cards/rodapé, fechamento persistente e navegação por Tab. No CRM conferir button_id com posicao__criativo; compras assistidas usarão o último clique conforme regra existente, sem somar de novo à receita do canal. Reavaliar após 4 semanas com exposições, cliques, compras/receita assistida e leitura. Rollback: reverter o commit; os novos IDs preservam a separação histórica.
