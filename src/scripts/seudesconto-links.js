/* Preserva somente os parâmetros publicitários da entrada nos links para a loja. */
(function (w, d) {
  "use strict";
  if (w.location.hostname !== "seudesconto.sucupiranaturale.com.br") return;
  var allowed = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id",
    "gclid", "gbraid", "wbraid", "gad_source", "gad_campaignid", "fbclid", "sn_ag", "sn_mt", "sn_net", "sn_dev"];
  var source = new w.URL(w.location.href).searchParams;
  var params = {};
  allowed.forEach(function (key) {
    var value = source.get(key);
    if (value) params[key] = value;
  });
  if (!Object.keys(params).length) return;

  function decorate(link) {
    try {
      var url = new w.URL(link.getAttribute("href"), w.location.href);
      if (url.protocol !== "https:" || url.username || url.password || url.port ||
          (url.hostname !== "sucupiranaturale.com.br" && url.hostname !== "www.sucupiranaturale.com.br")) return;
      Object.keys(params).forEach(function (key) { url.searchParams.set(key, params[key]); });
      if (link.href !== url.href) link.setAttribute("href", url.href);
    } catch (e) { /* Um link inválido não interfere na navegação. */ }
  }
  function decorateAll() {
    d.querySelectorAll("a[href]").forEach(decorate);
  }
  decorateAll();
  // A landing renderiza os componentes depois de carregar os scripts.
  if (w.MutationObserver) new w.MutationObserver(decorateAll).observe(d.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["href"]
  });
  function onClick(e) {
    var link = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (link) decorate(link);
  }
  d.addEventListener("click", onClick, true);
  d.addEventListener("auxclick", onClick, true);
})(window, document);
