const fs = require('node:fs');
const path = require('node:path');
const { Script } = require('node:vm');
const root = path.resolve(__dirname, '..');
const endpoint = 'https://sucupira-naturale-crmapi.kip816.easypanel.host/t/v1/s';
const markers = ['sn_context', 'sn_link', 'SN_DELIVERY', 'blogTracking', 'linkRequest("l"', 'linkRequest("r"'];
const source = fs.readFileSync(path.join(root, 'src/scripts/sn-tracking.js'), 'utf8');
new Script(source);
for (const marker of markers) {
  if (!source.includes(marker)) throw new Error('Tracking incompleto: ' + marker);
}
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const file = path.join(dir, item.name);
    return item.isDirectory() ? files(file) : item.name.endsWith('.html') ? [file] : [];
  });
}
let checked = 0;
for (const file of files(path.join(root, 'dist'))) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1]).filter(s => s.includes('window.SN_TRACK'));
  if (!scripts.length) continue;
  if (scripts.length !== 1) throw new Error('Tracking duplicado: ' + path.relative(root, file));
  const script = scripts[0];
  if (!script.includes(endpoint) || !script.includes('guiadasucupira.com.br') || !script.includes(source))
    throw new Error('Tracking gerado divergente: ' + path.relative(root, file));
  checked++;
}
if (!checked || !fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8').includes(source))
  throw new Error('Tracking ausente na página inicial');
console.log('Ligação blog → loja e recuperação de sessão verificadas em ' + checked + ' páginas.');
