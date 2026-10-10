// GA4 da loja na landing seudesconto. Mesma propriedade (G-LZDYVCN9FV) e mesmo
// cookie _ga da loja, em .sucupiranaturale.com.br: entrada pelo anúncio, seções
// vistas, clique e compra caem na mesma sessão. dataLayer próprio para não colidir
// com o Firebase Analytics que vem dentro do export. Não envia texto de botão nem
// query do link de destino; a URL da página segue como o GA4 manda por padrão,
// porque é dela que sai a origem da sessão (gclid, UTMs).
(function (w, d) {
  'use strict';
  var ID = 'G-LZDYVCN9FV', LAYER = 'snDataLayer';
  var STORE = ['sucupiranaturale.com.br', 'www.sucupiranaturale.com.br'];
  if (w.snGtag) return;
  var live = w.location.hostname === 'seudesconto.sucupiranaturale.com.br';
  var layer = w[LAYER] = w[LAYER] || [];
  w.snGtag = live ? function () { layer.push(arguments); } : function () {
    if (w.console) w.console.log('[GA4 desligado fora de produção]', Array.prototype.slice.call(arguments));
  };
  if (live) {
    var tag = d.createElement('script'), first = d.getElementsByTagName('script')[0];
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID + '&l=' + LAYER;
    first.parentNode.insertBefore(tag, first);
  }
  w.snGtag('js', new Date());
  w.snGtag('config', ID, { content_group: 'landing' });

  function send(name, params) { w.snGtag('event', name, params); }
  function cta(a) {
    var value = a.getAttribute('data-cta');
    return /^[a-z0-9_-]{1,40}$/.test(value || '') ? value : 'outro';
  }

  function click(e) {
    if ((e.type === 'click' && e.button !== 0) || (e.type === 'auxclick' && e.button !== 1)) return;
    try {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var url = new w.URL(a.href, w.location.href);
      if (url.protocol === 'https:' && STORE.indexOf(url.hostname) >= 0) {
        send('clique_para_loja', { posicao_link: cta(a), destino_path: url.pathname });
      } else if (url.hostname === 'wa.me' || url.hostname === 'api.whatsapp.com') {
        send('clique_contato', { canal: 'whatsapp', posicao_link: cta(a) });
      } else if (url.protocol === 'mailto:' || url.protocol === 'tel:') {
        send('clique_contato', { canal: url.protocol === 'tel:' ? 'telefone' : 'email', posicao_link: cta(a) });
      }
    } catch (_) { /* nunca impede o clique */ }
  }
  d.addEventListener('click', click, true);
  d.addEventListener('auxclick', click, true);

  // Uma vez por seção, quando o topo dela entra nos 60% de cima da tela. A ordem
  // mostra até onde o visitante desceu; o nome, o que ele viu antes de clicar.
  if (!w.IntersectionObserver) return;
  var observed = [];
  function sections() { return Array.prototype.slice.call(d.querySelectorAll('section')); }
  function label(section, index) {
    var heading = section.querySelector('h1, h2, h3');
    var text = section.id || section.getAttribute('aria-label') ||
      (heading && heading.textContent ? heading.textContent.replace(/\s+/g, ' ').trim() : '');
    return text ? text.slice(0, 60) : 'secao-' + (index + 1);
  }
  var io = new w.IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      var index = sections().indexOf(entry.target);
      send('secao_vista', { secao: label(entry.target, index), ordem: index + 1 });
    });
  }, { rootMargin: '0px 0px -40% 0px' });
  function scan() {
    sections().forEach(function (section) {
      if (observed.indexOf(section) >= 0) return;
      observed.push(section);
      io.observe(section);
    });
  }
  scan();
  // O export monta a página por JavaScript depois que este script roda.
  if (w.MutationObserver) new w.MutationObserver(scan).observe(d.documentElement, { childList: true, subtree: true });
  w.addEventListener('load', scan);
})(window, document);
