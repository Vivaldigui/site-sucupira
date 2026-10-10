/* Eventos públicos da landing. Não envia URL completa, query nem texto de botão. */
(function (w, d) {
  "use strict";
  if (w.location.hostname !== "seudesconto.sucupiranaturale.com.br") return;
  var endpoint = "https://sucupira-naturale-crmapi.kip816.easypanel.host/t/v1/b";
  var seen = false, tries = 0;
  function id() {
    var bytes = new Uint8Array(16), out = "", alphabet = "abcdefghijklmnopqrstuvwxyz234567";
    w.crypto.getRandomValues(bytes);
    for (var i = 0; i < bytes.length; i++) out += alphabet[bytes[i] & 31];
    return out;
  }
  function ids() {
    var current = w.SN_TRACK_IDS;
    return current && /^[a-z2-7]{16}$/.test(current.vid) && /^[a-z2-7]{16}$/.test(current.sid) ? current : null;
  }
  function send(kind, extra) {
    var current = ids(); if (!current) return null;
    var payload = {v:1,event_id:id(),vid:current.vid,sid:current.sid,kind:kind,article_path:"/"};
    Object.keys(extra || {}).forEach(function (key) {payload[key] = extra[key];});
    // Fila persistente com confirmação; o beacon protege o clique que sai imediatamente.
    if (w.SN_DELIVERY) w.SN_DELIVERY.create(endpoint.replace(/b$/, "s")).send("b", payload);
    try { if (w.navigator.sendBeacon) w.navigator.sendBeacon(endpoint, new Blob([JSON.stringify(payload)], {type:"text/plain"})); } catch (_) {}
    return payload.event_id;
  }
  function page() {
    if (seen) return;
    if (ids()) {seen = true; send("page_view");}
    else if (++tries < 50) w.setTimeout(page, 100);
  }
  function click(e) {
    if ((e.type === "click" && e.button !== 0) || (e.type === "auxclick" && e.button !== 1)) return;
    try {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var url = new w.URL(a.href, w.location.href), button = a.getAttribute("data-cta");
      if (url.protocol !== "https:" || url.username || url.password || url.port ||
          ["sucupiranaturale.com.br", "www.sucupiranaturale.com.br"].indexOf(url.hostname) < 0 ||
          !/^[a-z0-9_-]{1,80}$/.test(button || "") || url.pathname.length > 200 ||
          !/^\/(?:[a-z0-9][a-z0-9-]*\/?)?$/.test(url.pathname) || /^\/(checkout|carrinho|conta|minha-conta)(\/|$)/.test(url.pathname)) return;
      page();
      var hop = send("shop_click", {button_id:button,destination_path:url.pathname});
      if (hop) d.cookie = "sn_hop=" + hop + "; Domain=.sucupiranaturale.com.br; Path=/; Max-Age=600; SameSite=Lax; Secure";
    } catch (_) { /* nunca impede clique normal, Ctrl/Cmd ou botão do meio */ }
  }
  d.addEventListener("click", click, true);
  d.addEventListener("auxclick", click, true);
  page();
})(window, document);
