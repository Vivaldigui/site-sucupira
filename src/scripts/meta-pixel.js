// Pixel da Meta na landing seudesconto. É o mesmo pixel da loja (integração
// nativa da Loja Integrada), para que visita na landing e compra na loja caiam no
// mesmo conjunto de dados. Só PageView: a loja já envia ViewContent, carrinho e
// compra, com deduplicação pela API de Conversões. Os cookies _fbp/_fbc ficam em
// .sucupiranaturale.com.br e são lidos pela loja.
(function () {
  var PIXEL_ID = '1431254330835872';
  if (window.location.hostname !== 'seudesconto.sucupiranaturale.com.br' || window.fbq) return;

  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
    n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
})();
