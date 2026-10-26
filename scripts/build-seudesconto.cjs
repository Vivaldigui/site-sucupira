// Mantém o export publicado e injeta os scripts no documento efetivamente renderizado.
const { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, cpSync } = require('node:fs');
const { join } = require('node:path');
const { Script } = require('node:vm');
const root = join(__dirname, '..');
const source = join(root, 'landing-seudesconto');
const out = join(source, 'dist');
const html = readFileSync(join(source, 'source.html'), 'utf8');
const marker = /(<script type="__bundler\/template">)([\s\S]*?)(<\/script>)/;
const match = html.match(marker);
if (!match) throw new Error('Export da landing sem template reconhecido');
const template = JSON.parse(match[2]);
if (!/<head[^>]*>/i.test(template)) throw new Error('Documento da landing sem head');
const config = 'window.SN_TRACK = { endpoint: "https://api.sucupiranaturale.com.br/t/v1/s", disabled: window.location.hostname !== "seudesconto.sucupiranaturale.com.br" };';
const injection = '\n<!-- SN - Tracking first-party seudesconto -->\n<script>' + config + '</script>\n<script src="/sn-tracking.js"></script>\n<script src="/seudesconto-links.js"></script>\n<script src="/seudesconto-events.js"></script>\n<script src="/seudesconto-carrossel.js" defer></script>\n<script src="/seudesconto-ancora.js" defer></script>\n<link rel="preload" as="image" href="/assets/ra/verified.svg">\n<link rel="preload" as="image" href="/assets/ra/ra-logo.svg">\n<script src="/seudesconto-reclameaqui.js" defer></script>\n<script src="/seudesconto-cupom.js" defer></script>\n<!-- GA4 da loja (mesma sessão da compra) -->\n<script src="/seudesconto-ga4.js"></script>\n<!-- Pixel da Meta (mesmo da loja) -->\n<script src="/meta-pixel.js"></script>\n';
// Cupom: não vai mais aplicado no carrinho pelo link; a pessoa copia (seudesconto-cupom.js) e cola.
// Cada troca confere quantas vezes casou (as duas cópias da página) para não passar em branco.
const CUPOM_STATUS = '<span data-cupom-status style="font-size:.8em;font-weight:400;text-decoration:underline">copiar</span>';
const cupomBotao = (style, conteudo) => '<button type="button" data-cupom="SEUDESCONTO" aria-label="Copiar o cupom SEUDESCONTO" style="font:inherit;color:#1D3B23;background:#FFFFFF;border:2px dashed #2C6634;cursor:pointer;' + style + '">' + conteudo + '</button>';
// Selo "Mais vendido" e borda de destaque saem do kit de 3 e vão para o de 4 (pedido da loja em 26/10/2026).
const cartaoKit = (kit, borda) => '<article class="kc-card" data-kit="' + kit + '" style="background:#FFFFFF;' + borda + ';border-radius:22px;padding:20px;padding-top:28px;position:relative">';
const DESTAQUE = 'border:3px solid #2C6634;box-shadow:0 10px 28px rgba(29,59,35,.14)', COMUM = 'border:2px solid #D6E2D0';
const SELO = '<span style="position:absolute;top:-17px;left:50%;transform:translateX(-50%);background:#2C6634;color:#FFFFFF;font-size:17px;font-weight:700;border-radius:999px;padding:6px 18px;white-space:nowrap">Mais vendido</span>';
const edits = [
  ['&amp;cupom=SEUDESCONTO&amp;', '&amp;', 18],
  ['<p style="font-size:17px;font-weight:700;color:#1D3B23;text-align:center">+5% OFF com o cupom SEUDESCONTO, já aplicado no carrinho</p>',
   '<p style="font-size:17px;font-weight:700;color:#1D3B23;text-align:center">+5% OFF com o cupom ' +
   cupomBotao('font-weight:700;border-radius:8px;padding:2px 10px;display:inline-flex;align-items:baseline;gap:8px', '<span>SEUDESCONTO</span>' + CUPOM_STATUS) +
   '</p><p style="font-size:15px;color:#4A4E47;text-align:center">Toque no cupom para copiar e cole no carrinho</p>', 2],
  ['<p style="align-self:center;font-size:18px;font-weight:700;color:#1D3B23;background:#FFFFFF;border:2px dashed #2C6634;border-radius:12px;padding:8px 16px">Cupom <strong>SEUDESCONTO</strong>: 5% OFF, já aplicado no carrinho</p>',
   cupomBotao('align-self:center;font-size:18px;font-weight:700;border-radius:12px;padding:8px 16px;line-height:1.35;text-align:center', 'Cupom <strong>SEUDESCONTO</strong>: 5% OFF' + CUPOM_STATUS.replace('style="', 'style="display:block;').replace('>copiar<', '>toque para copiar<')) +
   '<p style="align-self:center;font-size:15px;color:#4A4E47;text-align:center">Cole o cupom no carrinho, antes de finalizar</p>', 2],
  [cartaoKit(3, DESTAQUE) + SELO, cartaoKit(3, COMUM), 2],
  [cartaoKit(4, COMUM), cartaoKit(4, DESTAQUE) + SELO, 2],
];
let editado = template;
for (const [de, para, vezes] of edits) {
  const n = editado.split(de).length - 1;
  if (n !== vezes) throw new Error('Troca casou ' + n + ' vez(es), esperado ' + vezes + ': ' + de.slice(0, 60));
  editado = editado.split(de).join(para);
}
if (/[?&;]cupom=|já aplicado/i.test(editado)) throw new Error('Ainda há cupom aplicado automaticamente na landing');
const updated = editado.replace(/<head[^>]*>/i, (head) => head + injection);
// O logo do export é um recorte quadrado que corta as bordas do círculo; usa o logo redondo inteiro.
const LOGO = '3ee05f17-7774-441a-928c-ab90d7f38a81';
const manifestMarker = /(<script type="__bundler\/manifest">)([\s\S]*?)(<\/script>)/;
const manifest = JSON.parse(html.match(manifestMarker)[2]);
if (!manifest[LOGO]) throw new Error('Logo não encontrado no manifesto do export');
manifest[LOGO] = { mime: 'image/webp', compressed: false, data: readFileSync(join(source, 'assets', 'logo.webp')).toString('base64') };
const output = html
  .replace(manifestMarker, (_, open, text, close) => open + JSON.stringify(manifest) + close)
  .replace(marker, (_, open, text, close) => open + '\n' + JSON.stringify(updated).replace(/</g, '\\u003c') + '\n' + close);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), output);
for (const name of ['sn-tracking', 'seudesconto-links', 'seudesconto-events', 'seudesconto-carrossel', 'seudesconto-ancora', 'seudesconto-reclameaqui', 'seudesconto-cupom', 'seudesconto-ga4', 'meta-pixel']) {
  const script = readFileSync(join(root, 'src', 'scripts', name + '.js'), 'utf8');
  new Script(script, { filename: name + '.js' });
  writeFileSync(join(out, name + '.js'), script);
}
for (const name of ['robots.txt', 'sitemap.xml']) copyFileSync(join(source, name), join(out, name));
if (existsSync(join(source, 'assets'))) cpSync(join(source, 'assets'), join(out, 'assets'), { recursive: true });
if (updated.replace(injection, '') !== editado) throw new Error('O conteúdo original foi alterado');
console.log('Landing gerada: conteúdo original preservado (fora o cupom e o selo de mais vendido); tracking e links adicionados.');
