# Plano de medição do blog

Atualizado em 2026-09-10. Referência para qualquer análise ou implementação futura com dados do GA4.

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
| `clique_para_loja` | clique em link da loja | `destino_path`, `posicao_link`, `texto_link` | `LinkTracking.astro` |
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

### Cookie de origem para a loja

No clique para a loja, `LinkTracking.astro` grava `sn_blog_origem` = caminho do artigo, no domínio `.sucupiranaturale.com.br`, por 30 dias. O nome é próprio porque o GTM da loja já usa `sn_origem` (valor `seudesconto`). **Hoje nada lê esse cookie** — ver "Pendência na loja".

## Configuração manual no GA4

Nada disto se faz pelo código. Dimensão personalizada **não é retroativa**: o dado só aparece a partir do dia do registro.

**Dimensões personalizadas (escopo de evento)** — nas duas propriedades, exceto as de Web Vitals (só blog):

`posicao_link` · `destino_path` · `texto_link` · `percentual` · `chegou_em` · `canal` · `secao` · `resultados` · `artigo_tipo` · `artigo_tag_principal` · `artigo_tags` · `artigo_publicado_em` · `artigo_atualizado` · `artigo_faq` · `artigo_palavras` · `metric_name` · `metric_rating`

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
