# Plano: conversão da landing seudesconto

Página: `seudesconto.sucupiranaturale.com.br`
Fonte: `landing-seudesconto/source.html`. É um export empacotado e o conteúdo fica no bloco `__bundler/template`, que tem a página **duas vezes**; toda edição precisa ser feita nas duas cópias.
Build: `npm run build:seudesconto`.
Deploy: Firebase, projeto `sucupira-seudesconto`.

## Ponto de partida (GA4 da loja, 01 a 11/10/2026)

| Métrica | Valor |
|---|---|
| Sessões | 19 |
| Cliques para a loja (`clique_para_loja`) | 1 |
| Rolagem até 90% | 5 |

Com esse volume não dá para fazer teste A/B. A comparação vai ser antes e depois, por cliques para a loja por sessão e pedidos com origem seudesconto no CRM. Para medir alguma coisa, a página precisa receber tráfego de anúncio.

## O que muda, na ordem da página

### 1. Topo (hero) e barra fixa

- **Sai:** "Kits a partir de R$ 117,99".
- **Entra:** "Garrafa a partir de **R$ 27,92**", com a linha de baixo "no kit de 12 garrafas · avulsa sai R$ 74,99".
- **Barra fixa:** a que fica no rodapé ao rolar troca o mesmo texto ("Garrafa a partir de R$ 27,92 · Ver kits").
- **Por quê:** o menor preço por garrafa é a âncora mais forte que a loja tem. O texto atual destaca justamente o kit mais caro por garrafa.

### 2. Seção curta sobre o produto (nova)

Logo depois da faixa de confiança, para quem chega sem saber o que é sucupira. São quatro blocos de uma linha, com ícone:

- **O que é:** extrato líquido da semente graúda branca de sucupira, pronto para tomar.
- **Por que procuram:** usada há gerações no uso popular para desconforto nas articulações.
- **Como usa:** mede na tampinha, de 3 a 10 por dia, puro ou com mel ou suco.
- **Quem faz:** empresa familiar de Itanhandu (MG), com o líquido desde 2016.

A frase de abertura atual, "A sucupira, sem todo o preparo", continua, mas a seção dela fica mais curta, porque a explicação básica passa a estar aqui.

### 3. "Onde o desconforto mais atrapalha você?"

Abaixo dos seis botões entra uma linha curta:

> A sucupira líquida, pronta para tomar, é conhecida no uso popular como um anti-inflamatório natural.

O aviso "não é medicamento" que já está ali continua.

### 4. Carrossel de kits

| Kit | Preço | Por garrafa | Economia vs. avulsas | Selo |
|---|---|---|---|---|
| 1 garrafa | R$ 74,99 | R$ 74,99 | — | para experimentar |
| 2 garrafas | R$ 117,99 | R$ 59,00 | R$ 31,99 | prevenção · ~1 mês |
| 3 garrafas | R$ 144,99 | R$ 48,33 | R$ 79,98 | **mais vendido** · dor moderada · ~1 mês |
| 4 garrafas | R$ 157,99 | R$ 39,50 | R$ 141,97 | |
| 5 garrafas | R$ 183,99 | R$ 36,80 | R$ 190,96 | |
| 6 garrafas | R$ 199,99 | R$ 33,33 | R$ 249,95 | dor intensa · ~1 mês |
| 9 garrafas | R$ 271,99 | R$ 30,22 | R$ 402,92 | |
| 12 garrafas | R$ 334,99 | **R$ 27,92** | R$ 564,89 | **maior economia** |

- **Todos os kits:** entram os 9 kits que a loja vende (1, 2, 3, 4, 5, 6, 9, 10 e 12), contra 4 hoje. O kit de 10 (R$ 283,99, R$ 28,40 por garrafa) existe e está ativo; o bot é que não o oferece. O link "Ver outras quantidades" sai.
- **Destaque do cartão:** o preço **por garrafa** vira o número maior. O total do kit fica embaixo, menor.
- **Indicação por dor:** os kits de 2, 3 e 6 ganham o selo de indicação, que liga a tabela de tampinhas da página ao kit certo. O bot usa a mesma regra.
- **Movimento automático:**
  - passa sozinho a cada 5 segundos;
  - para quando a pessoa toca, arrasta ou passa o mouse, e não volta a girar depois disso;
  - fica parado para quem pediu menos animação no sistema (`prefers-reduced-motion`);
  - tem setas e bolinhas;
  - abre no kit de 3, que é o mais vendido.

  O público tem mais de 50 anos e um cartão que foge do dedo atrapalha a compra; por isso essas travas.
- **Implementação:** um script novo, `src/scripts/seudesconto-carrossel.js`, injetado pelo build como os outros. O empacotador do export não muda.

### 5. Botão de comprar leva direto ao carrinho

O botão "Quero este kit" deixa de abrir a página do produto. Passa a usar o mesmo link de carrinho que o bot usa:

```
https://www.sucupiranaturale.com.br/carrinho/produto/adicionar?substituir_itens=true&<id>=1
```

IDs: 1 → 219531792 · 2 → 219532312 · 3 → 219532524 · 4 → 219532627 · 5 → 363854870 · 6 → 292177203 · 9 → 292183880 · 12 → 292186850. Foram conferidos em 10/10.

- **Parâmetros do anúncio:** o `seudesconto-links.js` já repassa os do anúncio (utm, gclid, fbclid) para links de `www.sucupiranaturale.com.br`; o carrinho está nesse domínio, então nada muda ali.
- **Cupom:** depende da decisão D1.
- **Etiqueta do cartão:** cada botão ganha `utm_content=kit_<n>`, para o CRM saber qual cartão foi clicado.
- **Conferir no teste:** o evento `clique_para_loja` e o `sn_hop` continuam disparando com o link de carrinho.

### 6. Outros ajustes

1. **Contraindicações:** o FAQ e o aviso final dizem que quem tem "doenças pré-existentes ou usa medicamentos de uso contínuo" deve consultar o médico. Isso cobre quase todo o público de mais de 50 anos e afasta quem ia comprar. Também diverge do bot. A proposta é usar o mesmo texto do bot: grávidas, lactantes, menores de 13 anos, doença renal ou hepática crônica, uso de anticoagulante (decisão D3).
2. **Botão de WhatsApp flutuante** com mensagem pronta ("Oi, vim pela página e tenho uma dúvida"). O bot agora recomenda o kit e manda o link do carrinho. Falta confirmar se o número da página (35 99169-6906) é o do bot (decisão D4).
3. **Faixa de confiança:** a avaliação continua escondida (`mostrarAvaliacao: false`) até existir número real.

## Ordem de execução

1. Você decide D1 a D4.
2. Faço as mudanças 1 a 6 no `source.html` (nas duas cópias) e o carrossel, com cópia de segurança do arquivo atual.
3. Rodo `npm run build:seudesconto` e os testes (`scripts/seudesconto.test.cjs`, mais testes novos para os 8 links de carrinho e o carrossel).
4. Abro a página no navegador, em largura de celular (390 px) e de computador:
   - giro automático, parada ao toque e setas;
   - cada botão abre o carrinho com o kit certo;
   - os eventos chegam ao CRM e ao GA4.
5. Mando um print para aprovação e publico no Firebase.
6. Duas semanas depois, comparo cliques para a loja por sessão e pedidos com origem seudesconto, antes e depois.

## Decisões

| # | Decisão | Recomendação |
|---|---|---|
| D1 | Cupom no link do carrinho | Sim. A página se chama "seu desconto" e hoje não mostra nenhum desconto. Criar um cupom próprio (por exemplo, `SEUDESCONTO`, 10%), separado do ZAP15, para medir o canal, e mostrar "com o cupom aplicado no carrinho" nos cartões. |
| D2 | Em qual kit o carrossel abre | No de 3 (mais vendido). |
| D3 | Texto de contraindicação | O mesmo do bot. Passar pela responsável técnica. |
| D4 | WhatsApp flutuante | Sim, se 35 99169-6906 for o número do bot. |

## Decisões tomadas em 11/10/2026

- **D1:** cupom `SEUDESCONTO`, que já existia na loja (5%, sem validade). Botões vão para `/carrinho/produto/adicionar` com `cupom=SEUDESCONTO` e `utm_source=seudesconto&utm_medium=landing&utm_campaign=umaunidade|kitcom<N>unidades`, o padrão que o CRM já classifica (regras 4 e 8, `other_paid`). Parâmetros de anúncio que chegam na página (utm, gclid) continuam passando por cima.
- **D2:** carrossel abre no kit de 3.
- **D3:** contraindicações iguais às do bot.
- **D4:** WhatsApp flutuante para (35) 99852-1010. Os contatos do rodapé seguem com (35) 99169-6906.

## Implementação

- Edição: `landing-seudesconto/source.html` (as duas cópias do template), imagens novas `landing-seudesconto/assets/kit{1,5,9,10,12}.webp` (da própria loja).
- Carrossel: `src/scripts/seudesconto-carrossel.js`, injetado pelo `build-seudesconto.cjs`.
- Eventos: no clique para o carrinho, `seudesconto-events.js` e `seudesconto-ga4.js` registram a página do produto (`data-destino`), porque o CRM não aceita `/carrinho` como destino.
- Testes: 4 novos em `scripts/seudesconto.test.cjs`. No navegador (Edge headless, 390 px e 1366 px): abre no kit de 3, gira 3 → 4 → 5 → 6, a seta avança e para o giro, "menos animação" fica parado, e o botão do kit de 3 abre o carrinho com o cupom aplicado (R$ 137,74).
