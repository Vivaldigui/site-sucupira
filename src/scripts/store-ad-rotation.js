/* Distribuição 50/50 por navegador, estável por 30 dias; sem troca durante leitura. */
(function (w, d) {
  "use strict";
  function start() {
    var experiment = "blog-combos-20261009-v2", key = "sn_ads_" + experiment, variant;
    try {var saved = JSON.parse(w.localStorage.getItem(key)); if (saved && saved.until > Date.now() && (saved.variant === 0 || saved.variant === 1)) variant = saved.variant;} catch (_) {}
    if (variant === undefined) {
      var bytes = new Uint8Array(1); w.crypto.getRandomValues(bytes); variant = bytes[0] & 1;
      try {w.localStorage.setItem(key, JSON.stringify({variant:variant,until:Date.now()+30*86400000}));} catch (_) {}
    }
    d.querySelectorAll('[data-variants]').forEach(function (card) {
      try {
        var variants = JSON.parse(card.getAttribute('data-variants'));
        var initial = variants.findIndex(function (v) {return v.id === card.getAttribute('data-criativo');});
        var creative = variants[(Math.max(0,initial) + variant) % variants.length];
        var img = card.querySelector('img');
        img.src = creative.image; img.alt = creative.alt;
        img.width = creative.width; img.height = creative.height;
        card.querySelector('.store-ad-title').textContent = creative.title;
        card.querySelector('.store-ad-text').textContent = creative.text;
        card.querySelector('.store-ad-cta').textContent = creative.cta;
        card.setAttribute('data-criativo',creative.id);
        card.setAttribute('data-experimento',experiment);
        card.setAttribute('data-variante',String(variant));
      } catch (_) { /* HTML inicial continua utilizável */ }
    });
    if (!w.IntersectionObserver) return;
    var visible = new Set(), sent = new Set(), timers = new Map();
    function cancel(card) {if(timers.has(card)) w.clearTimeout(timers.get(card));timers.delete(card);}
    function schedule(card) {
      if (d.hidden || sent.has(card) || timers.has(card)) return;
      timers.set(card,w.setTimeout(function () {
        timers.delete(card);
        if(d.hidden || !visible.has(card) || sent.has(card)) return;
        if(typeof w.gtag !== 'function') return;
        w.gtag('event','anuncio_loja_visto',{criativo:card.getAttribute('data-criativo'),posicao_link:card.getAttribute('data-posicao'),
          experimento:card.getAttribute('data-experimento')||'fixo-v2',variante:card.getAttribute('data-variante')||'fixa'});
        sent.add(card);
      },1000));
    }
    var observer = new w.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if(entry.isIntersecting && entry.intersectionRatio >= 0.5) {visible.add(entry.target);schedule(entry.target);}
        else {visible.delete(entry.target);cancel(entry.target);}
      });
    },{threshold:[0,0.5]});
    d.querySelectorAll('[data-criativo][data-posicao]').forEach(function(card){observer.observe(card);});
    d.addEventListener('visibilitychange',function(){visible.forEach(function(card){if(d.hidden)cancel(card);else schedule(card);});});
  }
  if(d.readyState === 'loading') d.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})(window,document);
