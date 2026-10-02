// Carrega as unidades de anúncio da página.
//
// Cada unidade roda dentro de um iframe próprio, com o HTML do fornecedor igual
// ao original. Três motivos:
//   1. `atOptions` é uma global lida pelo script do banner. Com um documento por
//      unidade, uma configuração nunca alcança o script da outra.
//   2. Os scripts do fornecedor, quando rodam direto na página, carregam scripts
//      extras de outros domínios e têm um trecho que só age na janela principal.
//      Dentro de um iframe esse trecho se desliga sozinho e os extras ficam
//      presos ao quadro do anúncio, fora do artigo.
//   3. Script lento ou quebrado do fornecedor não trava a leitura.
// O iframe só é criado quando a unidade se aproxima da tela.
import { AD_LOADING, AD_MOBILE_MAX_WIDTH, AD_UNITS, vendorSnippet, type AdUnitName } from '../config/ads';

type SlotState = 'idle' | 'loading' | 'filled' | 'collapsed';

interface AdMessage {
  source: 'sn-ad';
  status: 'filled' | 'error' | 'empty';
  height?: number;
  // Native: base de cada linha de itens do widget, de cima para baixo.
  rows?: number[];
}

const slots = Array.from(document.querySelectorAll<HTMLElement>('[data-ad-unit]'));
const framesBySlot = new Map<HTMLElement, HTMLIFrameElement>();

function setState(slot: HTMLElement, state: SlotState) {
  slot.dataset.adState = state;
}

// Anúncio bloqueado, fora do ar ou sem preenchimento: o espaço some.
function collapse(slot: HTMLElement) {
  if (slot.dataset.adState === 'filled') return;
  setState(slot, 'collapsed');
  slot.hidden = true;
  framesBySlot.get(slot)?.remove();
  framesBySlot.delete(slot);
}

// Roda dentro do iframe, antes do código do fornecedor. Avisa a página quando o
// anúncio apareceu (e com que altura), quando o script falhou e quando o prazo
// acabou sem nada na tela.
function reporterScript() {
  return `(function () {
  var lastHeight = -1;
  function send(status, height, rows) {
    parent.postMessage({ source: 'sn-ad', status: status, height: height, rows: rows }, '*');
  }
  function rowBottoms(body) {
    var items = body.querySelectorAll('[class*="__bn-container"]');
    var bottoms = [];
    for (var i = 0; i < items.length; i++) {
      var bottom = Math.ceil(items[i].getBoundingClientRect().bottom);
      if (bottoms.indexOf(bottom) < 0) bottoms.push(bottom);
    }
    return bottoms.sort(function (a, b) { return a - b; });
  }
  window.addEventListener('error', function (event) {
    var target = event.target;
    if (target && target.tagName === 'SCRIPT') send('error');
  }, true);
  function check() {
    var body = document.body;
    if (!body || !body.querySelector('iframe, img, a')) return;
    var height = Math.ceil(body.getBoundingClientRect().height);
    if (height > 0 && height !== lastHeight) {
      lastHeight = height;
      send('filled', height, rowBottoms(body));
    }
  }
  document.addEventListener('DOMContentLoaded', function () {
    new MutationObserver(check).observe(document.body, { childList: true, subtree: true, attributes: true });
    if ('ResizeObserver' in window) new ResizeObserver(check).observe(document.body);
    check();
  });
  window.addEventListener('load', check);
  setTimeout(function () { if (lastHeight < 0) send('empty'); }, ${AD_LOADING.emptyTimeoutMs});
})();`;
}

function buildDocument(unitName: AdUnitName) {
  return (
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<base target="_blank">' +
    '<style>html,body{margin:0;padding:0;background:transparent}body{display:flow-root;overflow:hidden}</style>' +
    `<script>${reporterScript()}</script>` +
    `</head><body>${vendorSnippet(AD_UNITS[unitName])}</body></html>`
  );
}

function load(slot: HTMLElement) {
  if (slot.dataset.adState && slot.dataset.adState !== 'idle') return;

  const unitName = slot.dataset.adUnit as AdUnitName;
  const unit = AD_UNITS[unitName];
  const frame = slot.querySelector<HTMLElement>('.ad-frame');
  if (!unit || !frame) return;

  setState(slot, 'loading');

  const iframe = document.createElement('iframe');
  iframe.title = 'Publicidade';
  iframe.loading = 'eager';
  iframe.scrolling = 'no';
  // Sem `allow-top-navigation`: o anúncio não redireciona a aba, só abre o
  // destino em aba nova, por clique. `allow-same-origin` é exigência do script
  // do fornecedor, que aborta sem acesso a cookie e localStorage — por isso o
  // sandbox aqui é contenção de comportamento, não barreira de segurança.
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  iframe.srcdoc = buildDocument(unitName);

  framesBySlot.set(slot, iframe);
  frame.appendChild(iframe);
}

function onAdMessage(event: MessageEvent) {
  const data = event.data as AdMessage | undefined;
  if (!data || data.source !== 'sn-ad') return;

  for (const [slot, iframe] of framesBySlot) {
    if (iframe.contentWindow !== event.source) continue;

    if (data.status === 'filled') {
      setState(slot, 'filled');
      // Só o Native é fluido; os banners têm o tamanho já reservado.
      const unit = AD_UNITS[slot.dataset.adUnit as AdUnitName];
      if (unit.kind === 'native' && data.height) {
        const rows = data.rows ?? [];
        const limited = unit.maxRows > 0 && rows.length > unit.maxRows;
        const height = limited ? rows[unit.maxRows - 1] : data.height;
        slot.querySelector<HTMLElement>('.ad-frame')?.style.setProperty('height', `${height}px`);
      }
    } else {
      collapse(slot);
    }
    return;
  }
}

if (slots.length > 0) {
  window.addEventListener('message', onAdMessage);

  // Unidade escondida pelo CSS (320x50 no desktop, 728x90 no celular) nunca
  // intersecta, então nunca é pedida.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          load(entry.target as HTMLElement);
        }
      },
      { rootMargin: AD_LOADING.lazyRootMargin }
    );
    slots.forEach((slot) => observer.observe(slot));
  } else {
    const isMobile = window.matchMedia(`(max-width: ${AD_MOBILE_MAX_WIDTH}px)`).matches;
    slots
      .filter((slot) => slot.dataset.adUnit !== (isMobile ? 'desktopBanner' : 'mobileBanner'))
      .forEach(load);
  }
}
