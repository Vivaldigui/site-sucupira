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
const config = 'window.SN_TRACK = { endpoint: "https://sucupira-naturale-crmapi.kip816.easypanel.host/t/v1/s", disabled: window.location.hostname !== "seudesconto.sucupiranaturale.com.br" };';
const injection = '\n<!-- SN - Tracking first-party seudesconto -->\n<script>' + config + '</script>\n<script src="/sn-tracking.js"></script>\n<script src="/seudesconto-links.js"></script>\n<script src="/seudesconto-events.js"></script>\n<!-- Pixel da Meta (mesmo da loja) -->\n<script src="/meta-pixel.js"></script>\n';
const updated = template.replace(/<head[^>]*>/i, (head) => head + injection);
const output = html.replace(marker, (_, open, text, close) => open + '\n' + JSON.stringify(updated).replace(/</g, '\\u003c') + '\n' + close);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), output);
for (const name of ['sn-tracking', 'seudesconto-links', 'seudesconto-events', 'meta-pixel']) {
  const script = readFileSync(join(root, 'src', 'scripts', name + '.js'), 'utf8');
  new Script(script, { filename: name + '.js' });
  writeFileSync(join(out, name + '.js'), script);
}
for (const name of ['robots.txt', 'sitemap.xml']) copyFileSync(join(source, name), join(out, name));
if (existsSync(join(source, 'assets'))) cpSync(join(source, 'assets'), join(out, 'assets'), { recursive: true });
if (updated.replace(injection, '') !== template) throw new Error('O conteúdo original foi alterado');
console.log('Landing gerada: conteúdo original preservado; tracking e links adicionados.');
