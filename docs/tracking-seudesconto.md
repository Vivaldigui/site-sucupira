# Tracking da landing seudesconto

Em 01/10/2026, a landing ativa foi identificada no Firebase Hosting, projeto/site
`sucupira-seudesconto`, domínio `seudesconto.sucupiranaturale.com.br`. É um export
HTML empacotado diferente do `index.html` antigo da raiz deste repositório.

`landing-seudesconto/source.html` preserva o export ativo antes do tracking. Não
editar os recursos base64 à mão. Para substituir o design, importar o novo export
nesse arquivo e executar novamente o build. O build injeta os scripts no template
interno, pois o export substitui o documento externo ao renderizar.

## Fluxo

1. O snippet compartilhado `src/scripts/sn-tracking.js` captura os identificadores
   Google e UTMs da entrada e registra a sessão no CRM, com entrega confirmada e
   tentativas automáticas. Cookies `sn_vid` e `sn_s` usam `.sucupiranaturale.com.br`.
2. `src/scripts/seudesconto-links.js` copia somente os parâmetros publicitários
   permitidos da entrada para links HTTPS dos hosts exatos da loja. Preserva
   caminho, cupom e fragmento. Não copia e-mail, telefone, token ou outros
   parâmetros da entrada. Links internos e WhatsApp ficam intactos. Os botões
   renderizados dinamicamente também são tratados.
3. Na loja, o snippet já instalado reutiliza o visitante/sessão e grava o carimbo
   da sessão no `utm_campaign` da Loja Integrada. Se a sessão expirar, o mesmo
   visitante permite ao CRM localizar a sessão Google anterior.
4. Um pedido pago com vínculo e identificador válido segue o fluxo server
   existente, pela ação `Compra - Server Sucupira` (`7796339027`), conta
   `3385013943`. A landing não dispara conversão de compra ao clicar no botão.

O CRM permite esse domínio pelas origens padrão. Modo Google verificado `live`;
envio de dados do cliente permanece `false`. Não foi criada campanha, conversão
adicional ou compra de teste no Google. Para validar o relatório final é necessária
uma compra real após um clique real de anúncio.

## Testar e publicar

```powershell
npm run test:seudesconto
npm run build:seudesconto
firebase.cmd deploy --only hosting --config firebase.seudesconto.json --project sucupira-seudesconto --non-interactive
```

Esse arquivo de configuração publica somente a landing. O fluxo de publicação
do blog (`firebase.json`, projeto `blog-sucupira`) permanece separado. O build
verifica que, retirando a injeção, o template é idêntico ao original e preserva
`robots.txt` e `sitemap.xml`.

Também preserva os arquivos de `landing-seudesconto/assets`, incluindo a imagem
do kit de 2 garrafas e os ícones adicionados na atualização da landing.

Versão anterior do Firebase: `8b89eeca82fa2462`, release
`1790897149402000`. Pode ser restaurada pelo histórico de releases do Hosting.

Os sete testes cobrem passagem de identificadores/UTMs, exclusão de parâmetros
privados, destinos permitidos, botões dinâmicos e nova aba, tráfego direto,
compartilhamento da sessão com carimbo LI e novo clique para o mesmo visitante.

## Publicação verificada

Versão `7d019b021551024f` publicada em 01/10/2026 às 20h36 de Brasília.
O HTML e os dois scripts públicos foram comparados com a saída do build; o CRM
aceitou a origem da landing e recebeu uma sessão direta. No navegador, o
parâmetro de teste `utm_content=sn_tracking_check` apareceu nos botões e chegou
à página do produto na loja. Nenhum identificador de anúncio falso ou pedido
de teste foi enviado ao Google. Não houve erro no console da landing.

### Reinstalação após publicação externa

Às 20h42, uma publicação substituiu a versão instrumentada e removeu os scripts.
Às 20h47 foi publicada a versão `385968e8d2e92abb`, com o novo kit de 2 garrafas
e três arquivos em `/assets`. Essa versão foi importada como nova base, sem
reverter o conteúdo. O tracking foi reinstalado às **20h49** na versão
`61c89a7292e664ad`.

HTML, scripts, imagem do kit de 2 e ícones foram conferidos na URL pública contra
o build. No navegador, os scripts carregaram sem erro; o botão do kit de 2 levou
à loja preservando `utm_content=sn_tracking_recheck`. Os sete testes passaram.

Próximas alterações da landing devem usar `npm run build:seudesconto` e
`firebase.seudesconto.json`. Publicar um export isolado sem essa etapa retira
novamente o tracking. Ao importar um novo export, preservar também seus assets.

## Pixel da Meta (07/10/2026)

`src/scripts/meta-pixel.js` carrega o pixel `1431254330835872`, o mesmo que a
integração nativa da Loja Integrada usa na loja, e envia somente `PageView`.
ViewContent, carrinho e compra continuam vindo da loja, que já deduplica
navegador e API de Conversões. Os cookies `_fbp`/`_fbc` ficam em
`.sucupiranaturale.com.br`; quem chega por anúncio da Meta na landing e compra
na loja mantém o vínculo com o clique, e o `fbclid` também segue nos links.

O script só roda em `seudesconto.sucupiranaturale.com.br`. Não instalar outro
pixel na loja (GTM ou bloco SN): duplicaria as compras.

O blog (`guiadasucupira.com.br`) não recebe o pixel de propósito: os caminhos
dos artigos citam doenças (artrite, pressão alta), e a Meta restringe dados de
saúde. Enviar essas URLs ao mesmo pixel arriscaria restringir o conjunto de
dados que otimiza as campanhas de compra.

Conferência após publicar: Gerenciador de Eventos → pixel → Visão geral → PageView
filtrado pelo host `seudesconto.sucupiranaturale.com.br`.

## GA4 da loja (10/10/2026)

`src/scripts/seudesconto-ga4.js` carrega o GA4 da loja (`G-LZDYVCN9FV`) com
dataLayer próprio (`snDataLayer`), para não colidir com o Firebase Analytics
(`G-V74H9LPVJD`) que vem dentro do export. O cookie `_ga` fica em
`.sucupiranaturale.com.br`, o mesmo da loja: entrada pelo anúncio, seções vistas,
clique e compra caem na mesma sessão da propriedade da loja. A origem da sessão
sai do `gclid`/UTMs da URL da landing.

| Evento | Quando | Parâmetros |
|---|---|---|
| `page_view` | automático | `content_group` = `landing` |
| `secao_vista` | topo da seção entra nos 60% de cima da tela, uma vez por seção | `secao` (id, `aria-label` ou título, até 60 caracteres), `ordem` (1 = hero) |
| `clique_para_loja` | clique em link da loja | `posicao_link` (= `data-cta`, ex. `cta_kit_2`), `destino_path` (sem query) |
| `clique_contato` | WhatsApp, e-mail ou telefone | `canal`, `posicao_link` |

Os nomes seguem o [plano de medição do blog](plano-de-medicao.md); na propriedade
da loja, separar landing e blog por **Nome do host**. Fora do host de produção o
script só escreve no console, com o prefixo `[GA4 desligado fora de produção]`.
Aba oculta não dispara `secao_vista` (o IntersectionObserver não roda).

O Firebase Analytics do export continua enviando `cta_click` com `link_url`
completo, que leva `gclid` e UTMs para `G-V74H9LPVJD`. Está dentro do template e
o build não o altera; tirar no próximo export, junto com o próprio Firebase
Analytics, que fica redundante.
