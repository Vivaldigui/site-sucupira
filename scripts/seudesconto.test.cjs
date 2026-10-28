const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
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

test('CRM registra visita e clique com cookie curto, sem impedir Ctrl ou botão do meio',()=>{
  const source=readFileSync(join(root,'src/scripts/seudesconto-events.js'),'utf8');
  for(const [type,button] of [['click',0],['auxclick',1]]) {
    const a=link('https://www.sucupiranaturale.com.br/combos?gclid=PRIVATE');
    a.getAttribute=name=>name==='data-cta'?'cta_kit_3':a.href;
    const b=browser(landing,[a]);b.window.SN_TRACK_IDS={vid:'vvvvvvvvvvvvvvvv',sid:'ssssssssssssssss'};
    const sent=[];b.window.navigator={sendBeacon:(url,body)=>{sent.push(body);return true;}};
    const queued=[];b.window.SN_DELIVERY={create:()=>({send:(route,payload)=>queued.push(payload)})};
    b.run(source);b.listeners[type]({type,button,ctrlKey:true,target:a,preventDefault:()=>assert.fail('não interceptar')});
    assert.equal(queued.length,2);assert.equal(queued[1].destination_path,'/combos');
    assert.equal(queued[1].button_id,'cta_kit_3');assert.equal(b.jar.get('sn_hop'),queued[1].event_id);
    assert.match(b.writes[0],/Max-Age=600; SameSite=Lax; Secure/);
    assert.equal(JSON.stringify(queued).includes('PRIVATE'),false);assert.equal(sent.length,2);
  }
  const outside=browser('http://localhost/');outside.run(source);assert.equal(outside.writes.length,0);
});

test('links à loja sem data-cta registram clique e chegada; destinos recusados continuam fora', () => {
  const source = readFileSync(join(root, 'src/scripts/seudesconto-events.js'), 'utf8');
  for (const type of ['click', 'auxclick']) {
    for (const href of ['https://www.sucupiranaturale.com.br/', 'https://sucupiranaturale.com.br/combos']) {
      const a = link(href); a.getAttribute = name => name === 'data-cta' ? null : a.href;
      const b = browser(landing, [a]); b.window.SN_TRACK_IDS = {vid:'vvvvvvvvvvvvvvvv',sid:'ssssssssssssssss'};
      b.window.navigator = {}; const queued = [];
      b.window.SN_DELIVERY = {create:()=>({send:(_,payload)=>queued.push(payload)})};
      b.run(source); b.listeners[type]({type,button:type==='click'?0:1,target:a,preventDefault:()=>assert.fail('navegação deve continuar')});
      assert.equal(queued[1].kind, 'shop_click'); assert.equal(queued[1].button_id, 'link_loja');
      assert.equal(b.jar.get('sn_hop'), queued[1].event_id);
    }
  }
  for (const href of ['https://wa.me/123', 'http://www.sucupiranaturale.com.br/', 'https://www.sucupiranaturale.com.br.evil.test/', 'https://www.sucupiranaturale.com.br/checkout']) {
    const a = link(href); a.getAttribute = name => name === 'data-cta' ? null : a.href;
    const b = browser(landing, [a]); b.window.SN_TRACK_IDS = {vid:'vvvvvvvvvvvvvvvv',sid:'ssssssssssssssss'};
    b.window.navigator = {}; const queued = [];
    b.window.SN_DELIVERY = {create:()=>({send:(_,payload)=>queued.push(payload)})};
    b.run(source); b.listeners.click({type:'click',button:0,target:a});
    assert.equal(queued.length, 1); assert.equal(b.jar.has('sn_hop'), false);
  }
});

function ga4Page(href, sections = []) {
  const inserted = [], listeners = {}, logs = [];
  const first = { parentNode: { insertBefore: node => inserted.push(node) } };
  const document = {
    documentElement: {},
    createElement: tag => ({ tag }), getElementsByTagName: () => [first],
    querySelectorAll: () => sections,
    addEventListener: (name, fn) => { listeners[name] = fn; }
  };
  const window = {
    location: new URL(href), URL, console: { log: (...args) => logs.push(args) },
    addEventListener: () => {},
    IntersectionObserver: class { constructor(fn) { window.io = { fn, watched: [] }; } observe(el) { window.io.watched.push(el); } unobserve() {} }
  };
  runInNewContext(readFileSync(join(root, 'src/scripts/seudesconto-ga4.js'), 'utf8'), { window, document, Date });
  const calls = () => JSON.parse(JSON.stringify((window.snDataLayer || []).map(args => Array.from(args))));
  return { window, inserted, listeners, logs, calls };
}
function section(id, heading) {
  return { id, getAttribute: () => null, querySelector: () => heading ? { textContent: heading } : null };
}
test('GA4 da loja carrega com dataLayer próprio e conta o clique para a loja sem query', () => {
  const page = ga4Page(landing + '?gclid=TEST_CLICK');
  assert.equal(page.inserted.length, 1);
  assert.equal(page.inserted[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-LZDYVCN9FV&l=snDataLayer');
  assert.equal(page.window.dataLayer, undefined);
  const a = link('https://www.sucupiranaturale.com.br/combos?cupom=SEUDESCONTO&gclid=TEST_CLICK');
  a.getAttribute = name => name === 'data-cta' ? 'cta_kit_2' : a.href;
  page.listeners.click({ type: 'click', button: 0, target: a });
  const whats = link('https://wa.me/5535991696906');
  whats.getAttribute = name => name === 'data-cta' ? 'link_whatsapp' : whats.href;
  page.listeners.auxclick({ type: 'auxclick', button: 1, target: whats });
  page.listeners.click({ type: 'click', button: 2, target: a });
  const calls = page.calls();
  assert.deepEqual(calls[1], ['config', 'G-LZDYVCN9FV', { content_group: 'landing' }]);
  assert.deepEqual(calls.slice(2), [
    ['event', 'clique_para_loja', { posicao_link: 'cta_kit_2', destino_path: '/combos' }],
    ['event', 'clique_contato', { canal: 'whatsapp', posicao_link: 'link_whatsapp' }]
  ]);
});
test('GA4 da loja registra cada seção vista uma vez, com nome e ordem', () => {
  const sections = [section('hero'), section('', '  Como   usar  '), section('')];
  const page = ga4Page(landing, sections);
  assert.equal(page.window.io.watched.length, 3);
  page.window.io.fn(sections.map((target, i) => ({ target, isIntersecting: i !== 0 })));
  const events = page.calls().filter(c => c[0] === 'event');
  assert.deepEqual(events, [
    ['event', 'secao_vista', { secao: 'Como usar', ordem: 2 }],
    ['event', 'secao_vista', { secao: 'secao-3', ordem: 3 }]
  ]);
});
test('GA4 da loja não envia nada fora do domínio da landing', () => {
  for (const href of ['http://localhost:4321/', 'https://sucupira-seudesconto.web.app/']) {
    const page = ga4Page(href);
    assert.equal(page.inserted.length, 0);
    assert.equal(page.window.snDataLayer.length, 0);
    assert.ok(page.logs.length >= 2);
  }
});
test('build injeta o GA4 da loja antes do pixel', () => {
  const build = readFileSync(join(root, 'scripts/build-seudesconto.cjs'), 'utf8');
  const order = ['/seudesconto-events.js', '/seudesconto-ga4.js', '/meta-pixel.js'].map(src => build.indexOf(src));
  assert.ok(order.every(i => i > 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test('botão de kit vai ao carrinho e o CRM recebe a página do produto como destino', () => {
  const source = readFileSync(join(root, 'src/scripts/seudesconto-events.js'), 'utf8');
  const cart = 'https://www.sucupiranaturale.com.br/carrinho/produto/adicionar?utm_source=seudesconto&cupom=SEUDESCONTO&substituir_itens=true&292186850=1';
  for (const [destino, esperado] of [['/12-sucupiras-naturale-liquida', 1], [null, 0], ['/carrinho', 0]]) {
    const a = link(cart);
    a.getAttribute = name => name === 'data-cta' ? 'cta_kit_12' : name === 'data-destino' ? destino : a.href;
    const b = browser(landing, [a]); b.window.SN_TRACK_IDS = {vid:'vvvvvvvvvvvvvvvv',sid:'ssssssssssssssss'};
    b.window.navigator = {}; const queued = [];
    b.window.SN_DELIVERY = {create:()=>({send:(_,payload)=>queued.push(payload)})};
    b.run(source); b.listeners.click({type:'click',button:0,target:a});
    const clicks = queued.filter(e => e.kind === 'shop_click');
    assert.equal(clicks.length, esperado);
    if (esperado) {
      assert.equal(clicks[0].destination_path, destino); assert.equal(clicks[0].button_id, 'cta_kit_12');
      assert.equal(b.jar.get('sn_hop'), clicks[0].event_id);
    }
  }
});

test('GA4 registra o clique no carrinho com a página do produto', () => {
  const page = ga4Page(landing);
  const a = link('https://www.sucupiranaturale.com.br/carrinho/produto/adicionar?cupom=SEUDESCONTO&219532524=1');
  a.getAttribute = name => name === 'data-cta' ? 'cta_kit_3' : name === 'data-destino' ? '/combo-3-sucupiras-naturale-liquida' : a.href;
  page.listeners.click({ type: 'click', button: 0, target: a });
  assert.deepEqual(page.calls().slice(2), [['event', 'clique_para_loja', { posicao_link: 'cta_kit_3', destino_path: '/combo-3-sucupiras-naturale-liquida' }]]);
});

test('landing tem os 9 kits com carrinho e UTM, sem cupom aplicado no link, nas duas cópias', () => {
  const html = readFileSync(join(root, 'landing-seudesconto/dist/index.html'), 'utf8');
  const template = JSON.parse(html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1]);
  const ids = { 1: '219531792', 2: '219532312', 3: '219532524', 4: '219532627', 5: '363854870', 6: '292177203', 9: '292183880', 10: '239029656', 12: '292186850' };
  for (const [kit, id] of Object.entries(ids)) {
    const re = new RegExp('<a class="btn kit-btn" href="([^"]+)" data-cta="cta_kit_' + kit + '" data-destino="(/[a-z0-9-]+)"', 'g');
    const found = [...template.matchAll(re)];
    assert.equal(found.length, 2, 'kit ' + kit);
    for (const [, href] of found) {
      const url = new URL(href.replace(/&amp;/g, '&'));
      assert.equal(url.origin + url.pathname, 'https://www.sucupiranaturale.com.br/carrinho/produto/adicionar');
      assert.equal(url.searchParams.has('cupom'), false);
      assert.equal(url.searchParams.get(id), '1');
      assert.equal(url.searchParams.get('utm_source'), 'seudesconto');
      assert.match(url.searchParams.get('utm_campaign'), kit === '1' ? /^umaunidade$/ : new RegExp('^kitcom' + kit + 'unidades$'));
    }
  }
  assert.equal(template.includes('cta_outras_quantidades'), false);
  assert.equal(template.includes('Kits a partir de'), false);
  assert.equal((template.match(/wa\.me\/5535998521010/g) || []).length, 2);
});

test('selo "Mais vendido" e borda de destaque ficam no kit de 4, nas duas cópias, e o carrossel abre nele', () => {
  const html = readFileSync(join(root, 'landing-seudesconto/dist/index.html'), 'utf8');
  const template = JSON.parse(html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1]);
  const cards = [...template.matchAll(/<article class="kc-card" data-kit="(\d+)" style="([^"]*)">([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length, 18);
  assert.deepEqual(cards.filter(([, , , body]) => body.includes('>Mais vendido<')).map(([, kit]) => kit), ['4', '4']);
  for (const [, kit, style] of cards.filter(([, kit]) => kit === '3' || kit === '4')) {
    assert.equal(style.includes('border:3px solid #2C6634;box-shadow:'), kit === '4', 'kit ' + kit);
  }
  assert.match(readFileSync(join(root, 'landing-seudesconto/dist/seudesconto-carrossel.js'), 'utf8'), /KIT_INICIAL = "4"/);
});

test('build injeta o carrossel depois dos eventos', () => {
  const build = readFileSync(join(root, 'landing-seudesconto/dist/index.html'), 'utf8');
  const order = ['/seudesconto-events.js', '/seudesconto-carrossel.js', '/seudesconto-ga4.js'].map(src => build.indexOf(src));
  assert.ok(order.every(i => i > 0) && order[0] < order[1] && order[1] < order[2]);
});

test('build injeta a âncora para links de fora (#kits)', () => {
  const build = readFileSync(join(root, 'landing-seudesconto/dist/index.html'), 'utf8');
  assert.ok(build.indexOf('/seudesconto-ancora.js') > 0);
  assert.ok(existsSync(join(root, 'landing-seudesconto/dist/seudesconto-ancora.js')));
});
test('build injeta o selo do Reclame AQUI no topo', () => {
  const build = readFileSync(join(root, 'landing-seudesconto/dist/index.html'), 'utf8');
  assert.ok(build.indexOf('/seudesconto-reclameaqui.js') > 0);
  assert.ok(existsSync(join(root, 'landing-seudesconto/dist/seudesconto-reclameaqui.js')));
});
test('build tira os recursos do HTML: manifesto vazio e arquivos em /assets/b/', () => {
  const build = readFileSync(join(root, 'landing-seudesconto/dist/index.html'), 'utf8');
  const manifest = JSON.parse(build.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(manifest, {});
  assert.ok(build.length < 250000, 'index.html com ' + build.length + ' bytes');
  const template = JSON.parse(build.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1]);
  const usados = [...new Set(template.match(/\/assets\/b\/[\w.-]+/g))];
  assert.equal(usados.length, 16);
  for (const caminho of usados) assert.ok(existsSync(join(root, 'landing-seudesconto/dist', caminho)), caminho);
  assert.ok(template.includes('/assets/b/logo.072931cde9.webp'), 'logo redondo inteiro');
});
test('cupom SEUDESCONTO fica para copiar: dois botões por cópia, sem "já aplicado"', () => {
  const html = readFileSync(join(root, 'landing-seudesconto/dist/index.html'), 'utf8');
  const template = JSON.parse(html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1]);
  assert.equal((template.match(/<button type="button" data-cupom="SEUDESCONTO"/g) || []).length, 4);
  assert.equal(/já aplicado|[?&;]cupom=/i.test(template), false);
  assert.ok(template.indexOf('/seudesconto-cupom.js') > 0);
  assert.ok(existsSync(join(root, 'landing-seudesconto/dist/seudesconto-cupom.js')));
});
test('cupom do e-mail (?cupom=) aparece no lugar do SEUDESCONTO, com o desconto dele, e vale na visita', () => {
  const script = readFileSync(join(root, 'src/scripts/seudesconto-cupom.js'), 'utf8');
  const text = value => ({ nodeType: 3, nodeValue: value });
  const el = (attrs, childNodes = []) => {
    const node = { nodeType: 1, attrs: { ...attrs }, childNodes, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }, setAttribute(k, v) { this.attrs[k] = String(v); } };
    childNodes.forEach(child => { child.parentNode = node; });
    return node;
  };
  const page = () => {
    const inline = el({ 'data-cupom': 'SEUDESCONTO' }, [el({}, [text('SEUDESCONTO')]), el({ 'data-cupom-status': '' }, [text('copiar')])]);
    const paragraph = el({}, [text('+5% OFF com o cupom '), inline]);
    const box = el({ 'data-cupom': 'SEUDESCONTO' }, [text('Cupom '), el({}, [text('SEUDESCONTO')]), text(': 5% OFF'), el({ 'data-cupom-status': '' }, [text('toque para copiar')])]);
    el({}, [box]);
    return { inline, paragraph, box };
  };
  const visit = (href, store) => {
    const nodes = page(), observers = [];
    const document = { documentElement: {}, addEventListener() {},
      querySelectorAll: sel => sel === '[data-cupom="SEUDESCONTO"]' ? [nodes.inline, nodes.box].filter(b => b.attrs['data-cupom'] === 'SEUDESCONTO') : [] };
    const window = { location: new URL(href), URL, navigator: {}, setTimeout() {}, clearTimeout() {},
      sessionStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
      MutationObserver: class { constructor(fn) { observers.push(fn); } observe() {} } };
    runInNewContext(script, { window, document });
    return { ...nodes, observers };
  };
  const store = new Map();
  const email = visit(landing + '?cupom=volta10&utm_source=email', store);
  assert.equal(email.inline.attrs['data-cupom'], 'VOLTA10'); assert.equal(email.inline.attrs['aria-label'], 'Copiar o cupom VOLTA10');
  assert.equal(email.paragraph.childNodes[0].nodeValue, '+10% OFF com o cupom ');
  assert.equal(email.inline.childNodes[0].childNodes[0].nodeValue, 'VOLTA10');
  assert.deepEqual(email.box.childNodes.filter(n => n.nodeType === 3).map(n => n.nodeValue), ['Cupom ', ': 10% OFF']);
  assert.equal(email.box.childNodes[1].childNodes[0].nodeValue, 'VOLTA10');
  assert.equal(email.box.childNodes[3].childNodes[0].nodeValue, 'toque para copiar');
  assert.equal(email.observers.length, 1);
  // Sem o parâmetro, a mesma visita continua com o cupom do e-mail.
  assert.equal(visit(landing + '#kits', store).box.attrs['data-cupom'], 'VOLTA10');
  // Código fora da lista não troca nada: ninguém escreve o que quiser na página pelo link.
  const other = visit(landing + '?cupom=GRATIS100', new Map());
  assert.equal(other.box.attrs['data-cupom'], 'SEUDESCONTO'); assert.equal(other.paragraph.childNodes[0].nodeValue, '+5% OFF com o cupom ');
  assert.equal(other.observers.length, 0);
  // Cupom pessoal do e-mail do CRM: código da lista + 6 letras sem I nem O, com o desconto do código da lista.
  const personal = visit(landing + '?cupom=volta10kqmxtz', new Map());
  assert.equal(personal.box.attrs['data-cupom'], 'VOLTA10KQMXTZ'); assert.equal(personal.paragraph.childNodes[0].nodeValue, '+10% OFF com o cupom ');
  assert.equal(personal.box.childNodes[1].childNodes[0].nodeValue, 'VOLTA10KQMXTZ');
  assert.equal(visit(landing + '?cupom=FELIZANIVERABCDEF', new Map()).box.attrs['data-cupom'], 'FELIZANIVERABCDEF');
  for (const code of ['VOLTA10KQMXTI', 'VOLTA10KQMXT1', 'VOLTA10KQMXT', 'GRATIS100ABCDEF', 'ABCDEF'])
    assert.equal(visit(landing + '?cupom=' + code, new Map()).box.attrs['data-cupom'], 'SEUDESCONTO', code);
});
