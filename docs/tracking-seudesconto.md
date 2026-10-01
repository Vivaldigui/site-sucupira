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
