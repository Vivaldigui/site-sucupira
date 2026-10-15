/* Cupom para copiar: o link do kit não aplica mais o SEUDESCONTO no carrinho; quem quiser o
   desconto toca no cupom, copia e cola no carrinho. Escuta no document porque a landing
   re-renderiza os botões depois de montar. */
(function (w, d) {
  "use strict";
  var TEMPO = 2500;

  function copiarFallback(texto) {
    var t = d.createElement("textarea");
    t.value = texto;
    t.setAttribute("readonly", "");
    t.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    d.body.appendChild(t);
    t.select();
    var ok = false;
    try { ok = d.execCommand("copy"); } catch (e) {}
    d.body.removeChild(t);
    return ok;
  }
  function copiar(texto) {
    if (w.navigator.clipboard && w.isSecureContext) {
      return w.navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return copiarFallback(texto); });
    }
    return Promise.resolve(copiarFallback(texto));
  }
  function avisar(botao, ok) {
    var status = botao.querySelector("[data-cupom-status]");
    if (!status) return;
    if (!botao.snTexto) botao.snTexto = status.textContent;
    status.textContent = ok ? "copiado ✓" : "copie: " + botao.getAttribute("data-cupom");
    w.clearTimeout(botao.snTimer);
    botao.snTimer = w.setTimeout(function () { status.textContent = botao.snTexto; }, TEMPO);
  }
  d.addEventListener("click", function (e) {
    var botao = e.target && e.target.closest ? e.target.closest("[data-cupom]") : null;
    if (!botao) return;
    e.preventDefault();
    var cupom = botao.getAttribute("data-cupom");
    copiar(cupom).then(function (ok) {
      avisar(botao, ok);
      if (ok && w.snGtag) w.snGtag("event", "copiar_cupom", { cupom: cupom });
    });
  });
})(window, document);
