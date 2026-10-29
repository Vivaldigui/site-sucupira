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
// Versão leve (28/10/2026): o export embute imagens, fontes e runtime em base64 no HTML (~925 KB por visita,
// estourando os 10 GB do plano Spark). Cada recurso vira arquivo em /assets/b/ (nome com hash, cache longo),
// as imagens pequenas na tela foram reduzidas e o logo é o redondo inteiro (o do export corta o círculo).
// React e ReactDOM saem do manifesto: o runtime busca do jsDelivr com SRI. A d57b6d67 não é usada no template.
const ARQUIVOS = {
  'c2d95b11-ba9e-41a8-8ce8-5a02e33297d6': 'garrafas-hero.3d56714a5e.webp',
  'fbbcc2bd-62f9-4100-a67a-28a6fc2d7e55': 'semente.f71a007fa2.webp',
  '17ad6507-bd02-458e-93aa-836891945de3': 'garrafa-pequena.0fc122a6ec.webp',
  'e719babb-3882-4d0a-9748-0430aeac8bc1': 'kit3.7d400829af.webp',
  '431b1e19-cd5b-4758-bebf-dfc66349a531': 'kit4.857046673c.webp',
  'c2513760-1188-4b72-bf9c-3a942922a6f3': 'kit6.1ab731b6d7.webp',
  '3ee05f17-7774-441a-928c-ab90d7f38a81': 'logo.072931cde9.webp',
  '700e2fc6-a27e-441e-90fd-71a220d4fa0e': 'dc-runtime.ffb137b73e.js',
  'f3a5db25-0c51-4df2-9cb1-69db8d91fed4': 'atkinson-400.d64ba838ef.woff2',
  'f1f9f2e3-1c6a-45e0-9d6e-f1cae0e9afbd': 'atkinson-700.140e2bd25a.woff2',
};
const FORA = ['d57b6d67-c4c4-4291-ab4a-5f10d35f1340', 'cbe24360-68b4-4b28-8d61-3c2e0883db72', '00da66c3-651b-4dbb-85e5-103446cac56c'];
const manifestMarker = /(<script type="__bundler\/manifest">)([\s\S]*?)(<\/script>)/;
const manifest = JSON.parse(html.match(manifestMarker)[2]);
let leve = updated;
for (const [uuid, arquivo] of Object.entries(ARQUIVOS)) {
  if (!manifest[uuid]) throw new Error('Recurso ' + uuid + ' não está no manifesto do export');
  if (!existsSync(join(source, 'assets', 'b', arquivo))) throw new Error('Falta landing-seudesconto/assets/b/' + arquivo);
  if (!leve.includes(uuid)) throw new Error('Recurso ' + uuid + ' não aparece no template');
  leve = leve.split(uuid).join('/assets/b/' + arquivo);
  delete manifest[uuid];
}
// Fotos dos kits que o export já lia de /assets/: reduzidas para 480×300 (o dobro da caixa do carrossel).
const KITS = { 1: '61a52cf052', 2: '21dc38f9ce', 5: '131a4eedf9', 9: 'bdf6466f63', 10: '7ab47f7a57', 12: '8813b488d2' };
for (const [kit, hash] of Object.entries(KITS)) {
  const de = '/assets/kit' + kit + '.webp', arquivo = 'kit' + kit + '.' + hash + '.webp';
  const n = leve.split(de).length - 1;
  if (n !== 2) throw new Error('Foto ' + de + ' casou ' + n + ' vez(es), esperado 2');
  if (!existsSync(join(source, 'assets', 'b', arquivo))) throw new Error('Falta landing-seudesconto/assets/b/' + arquivo);
  leve = leve.split(de).join('/assets/b/' + arquivo);
}
for (const uuid of FORA) {
  if (leve.includes(uuid)) throw new Error('Recurso ' + uuid + ' é usado no template');
  delete manifest[uuid];
}
if (Object.keys(manifest).length) throw new Error('Sobrou recurso embutido: ' + Object.keys(manifest).join(', '));
const output = html
  .replace(manifestMarker, (_, open, text, close) => open + JSON.stringify(manifest) + close)
  .replace(marker, (_, open, text, close) => open + '\n' + JSON.stringify(leve).replace(/</g, '\\u003c') + '\n' + close);
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
