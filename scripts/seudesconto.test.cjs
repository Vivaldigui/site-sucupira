const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const { webcrypto } = require('node:crypto');
const root = join(__dirname, '..');
const linksScript = readFileSync(join(root, 'src/scripts/seudesconto-links.js'), 'utf8');
const tracking = readFileSync(join(root, 'src/scripts/sn-tracking.js'), 'utf8');
const landing = 'https://seudesconto.sucupiranaturale.com.br/';
function link(href) { return {
  href, getAttribute() { return this.href; }, setAttribute(_, value) { this.href = value; },
  closest(selector) { return selector === 'a[href]' ? this : null; }
}; }
function browser(href, links = [], jar = new Map()) {
  const listeners = {}, writes = [], events = [];
  const document = {
    readyState: 'complete', referrer: '', documentElement: {},
    querySelectorAll: () => links,
    addEventListener: (name, fn) => { listeners[name] = fn; },
    get cookie() { return [...jar].map(([k, v]) => k + '=' + v).join('; '); },
    set cookie(raw) { writes.push(raw); const pair = raw.split(';')[0]; const i = pair.indexOf('='); jar.set(pair.slice(0, i), pair.slice(i + 1)); }
  };
  const location = new URL(href);
  const window = {
    location, URL, crypto: webcrypto, SN_TRACK: { endpoint: 'https://test.invalid/t/v1/s', stamp: true },
    setTimeout: fn => { window.timer = fn; return 1; }, clearTimeout: () => {},
    fetch: (_, options) => { events.push(JSON.parse(options.body)); return Promise.resolve({status:200,json:async()=>({accepted:true})}); },
    MutationObserver: class { constructor(fn) { window.mutate = fn; } observe() {} }
  };
  return { window, document, jar, writes, events, listeners,
    run: script => runInNewContext(script, {window, document, Blob, Uint8Array, URL}),
    flush: () => window.timer?.() };
}
test('Google IDs, UTMs e ValueTrack chegam à loja; parâmetros privados da entrada não são copiados', () => {
  const a = link('https://www.sucupiranaturale.com.br/combos?cupom=SEUDESCONTO#kits');
  const b = browser(landing + '?gclid=TEST_CLICK&utm_source=google&utm_medium=cpc&utm_campaign=gads_123&sn_ag=456&email=private@example.com&token=private', [a]);
  b.run(linksScript); const url = new URL(a.href);
  assert.equal(url.searchParams.get('gclid'), 'TEST_CLICK');
  assert.equal(url.searchParams.get('utm_campaign'), 'gads_123');
  assert.equal(url.searchParams.get('sn_ag'), '456');
  assert.equal(url.searchParams.get('cupom'), 'SEUDESCONTO');
  assert.equal(url.hash, '#kits');
  assert.equal(url.searchParams.has('email'), false); assert.equal(url.searchParams.has('token'), false);
});
test('GBRAID e WBRAID são preservados, sem inventar GCLID', () => {
  for (const id of ['gbraid', 'wbraid']) {
    const a = link('https://sucupiranaturale.com.br/combos');
    browser(landing + '?' + id + '=TEST_IOS', [a]).run(linksScript);
    assert.equal(new URL(a.href).searchParams.get(id), 'TEST_IOS');
    assert.equal(new URL(a.href).searchParams.has('gclid'), false);
  }
});
test('links internos, WhatsApp e hosts parecidos ficam intactos', () => {
  const urls = ['#kits','https://wa.me/5535991696906','https://www.sucupiranaturale.com.br.evil.test/','http://www.sucupiranaturale.com.br/','https://user:password@www.sucupiranaturale.com.br/'];
  const links = urls.map(link); browser(landing + '?gclid=TEST', links).run(linksScript);
  assert.deepEqual(links.map(a => a.href), urls);
});
test('botões renderizados depois, novas abas e href atualizado recebem a origem', () => {
  const links = []; const b = browser(landing + '?gclid=TEST', links); b.run(linksScript);
  const a = link('https://www.sucupiranaturale.com.br/combo-3-sucupiras-naturale-liquida');
  links.push(a); b.window.mutate(); assert.equal(new URL(a.href).searchParams.get('gclid'), 'TEST');
  a.href = 'https://www.sucupiranaturale.com.br/6-sucupiras-naturale-liquida';
  b.listeners.auxclick({target:a}); assert.equal(new URL(a.href).searchParams.get('gclid'), 'TEST');
  const once = a.href; b.window.mutate(); assert.equal(a.href, once);
});
test('tráfego direto não recebe origem Google e o script não modifica outros sites', () => {
  const a = link('https://www.sucupiranaturale.com.br/combos'); const original = a.href;
  browser(landing, [a]).run(linksScript); assert.equal(a.href, original);
  browser('https://blog.sucupiranaturale.com.br/?gclid=TEST', [a]).run(linksScript); assert.equal(a.href, original);
});
test('landing e loja compartilham visitante e sessão; a LI recebe o carimbo dessa sessão', async () => {
  const a = link('https://www.sucupiranaturale.com.br/combos');
  const b = browser(landing + '?gclid=TEST_CLICK&utm_source=google&utm_medium=cpc&utm_campaign=gads_123', [a]);
  b.run(tracking); b.run(linksScript);
  for (let i = 0; i < 30; i++) await Promise.resolve();
  assert.equal(b.events.length, 1);
  assert.ok(b.events[0].url.startsWith(landing));
  assert.ok(b.writes.every(raw => raw.includes('domain=.sucupiranaturale.com.br')));
  const store = browser(a.href, [], b.jar); store.run(tracking); store.flush();
  assert.deepEqual(JSON.parse(JSON.stringify(store.window.SN_TRACK_IDS)), JSON.parse(JSON.stringify(b.window.SN_TRACK_IDS)));
  assert.ok(decodeURIComponent(store.jar.get('utm_campaign')).endsWith('~s' + b.window.SN_TRACK_IDS.sid));
  assert.equal(store.events.length, 1);
  assert.deepEqual(store.events[0], b.events[0]);
});
test('blog e seudesconto revalidam a entrada confirmada após restauração sem alterar origem ou horário', async () => {
  for (const entry of [landing, 'https://blog.sucupiranaturale.com.br/artigo']) {
    const first = browser(entry + '?gclid=REAL_IN_LOCAL_TEST&email=private@example.com'); first.run(tracking);
    for (let i = 0; i < 40; i++) await Promise.resolve();
    const original = first.events[0];
    assert.equal(first.jar.get('sn_a'), original.sid);
    assert.ok(first.jar.get('sn_context'));
    const next = browser('https://www.sucupiranaturale.com.br/combos', [], first.jar); next.run(tracking);
    for (let i = 0; i < 40; i++) await Promise.resolve();
    assert.deepEqual(next.events[0], original);
    assert.equal(next.window.SN_TRACK_IDS.sid, original.sid);
    assert.equal(next.events.filter(e => !e.kind).length, 1);
    assert.equal(JSON.stringify(next.events).includes('private@example.com'), false);
  }
});
test('um novo clique de campanha abre nova sessão para o mesmo visitante', async () => {
  const first = browser(landing + '?gclid=FIRST'); first.run(tracking);
  const second = browser(landing + '?gclid=SECOND', [], first.jar); second.run(tracking);
  assert.equal(first.window.SN_TRACK_IDS.vid, second.window.SN_TRACK_IDS.vid);
  assert.notEqual(first.window.SN_TRACK_IDS.sid, second.window.SN_TRACK_IDS.sid);
});
function pixelPage(href) {
  const inserted = [];
  const first = { parentNode: { insertBefore: node => inserted.push(node) } };
  const document = { createElement: tag => ({ tag }), getElementsByTagName: () => [first] };
  const window = { location: new URL(href) };
  runInNewContext(readFileSync(join(root, 'src/scripts/meta-pixel.js'), 'utf8'), { window, document });
  return { window, inserted };
}
test('pixel da Meta usa o pixel da loja e envia só PageView na landing', () => {
  const page = pixelPage(landing + '?fbclid=TEST_FB');
  assert.equal(page.inserted.length, 1);
  assert.equal(page.inserted[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
  const calls = JSON.parse(JSON.stringify(page.window.fbq.queue.map(args => Array.from(args))));
  assert.deepEqual(calls, [['init', '1431254330835872'], ['track', 'PageView']]);
});
test('pixel da Meta fica desligado fora do domínio da landing', () => {
  for (const href of ['http://localhost:4321/', 'https://sucupira-seudesconto.web.app/']) {
    const page = pixelPage(href);
    assert.equal(page.inserted.length, 0);
    assert.equal(page.window.fbq, undefined);
  }
});
test('build injeta o pixel depois do tracking first-party', () => {
  const build = readFileSync(join(root, 'scripts/build-seudesconto.cjs'), 'utf8');
  const order = ['/sn-tracking.js', '/seudesconto-links.js', '/meta-pixel.js'].map(src => build.indexOf(src));
  assert.ok(order.every(i => i > 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});
