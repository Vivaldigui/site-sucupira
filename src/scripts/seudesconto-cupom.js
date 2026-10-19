/* Cupom para copiar: o link do kit não aplica mais o SEUDESCONTO no carrinho; quem quiser o
   desconto toca no cupom, copia e cola no carrinho. Escuta no document porque a landing
   re-renderiza os botões depois de montar.
   Quem chega pelo e-mail ou pelo WhatsApp com ?cupom= vê esse cupom, com o desconto dele, no
   lugar do SEUDESCONTO. Só códigos da lista; a escolha vale até o fim da visita.
   Desde 19/10/2026 o e-mail do CRM manda um cupom pessoal: o código da lista seguido de 6 letras
   sem I nem O (VOLTA10KQMXTZ), com o desconto do código da lista. */
(function (w, d) {
  "use strict";
  var TEMPO = 2500;
  var PADRAO = "SEUDESCONTO", CHAVE = "sn_cupom";
  var CUPONS = { VOLTA10: 10, FELIZANIVER: 10, BEMVINDO10: 10, RECOMPRA10: 10, SUCUPIRA10: 10 };

  function lista(codigo) { return Object.prototype.hasOwnProperty.call(CUPONS, codigo) ? CUPONS[codigo] : 0; }
  function descontoDe(codigo) {
    if (lista(codigo)) return lista(codigo);
    return codigo.length > 6 && /^[A-HJ-NP-Z]{6}$/.test(codigo.slice(-6)) ? lista(codigo.slice(0, -6)) : 0;
  }
  function valido(codigo) { return descontoDe(codigo) > 0; }
  function cupomDaEntrada() {
    var codigo = "";
    try { codigo = (new w.URL(w.location.href).searchParams.get("cupom") || "").trim().toUpperCase(); } catch (e) {}
    try {
      if (valido(codigo)) w.sessionStorage.setItem(CHAVE, codigo);
      else codigo = w.sessionStorage.getItem(CHAVE) || "";
    } catch (e) {}
    return valido(codigo) ? codigo : "";
  }
  /* Troca só texto: o código vem da lista, nunca vira marcação. */
  function trocar(no, de, para, fundo) {
    var filhos = no.childNodes || [];
    for (var i = 0; i < filhos.length; i++) {
      var filho = filhos[i];
      if (filho.nodeType === 3) { if (filho.nodeValue.indexOf(de) >= 0) filho.nodeValue = filho.nodeValue.split(de).join(para); }
      else if (fundo) trocar(filho, de, para, true);
    }
  }
  var cupom = cupomDaEntrada();
  function aplicar() {
    var botoes = d.querySelectorAll('[data-cupom="' + PADRAO + '"]');
    for (var i = 0; i < botoes.length; i++) {
      var botao = botoes[i], desconto = descontoDe(cupom);
      botao.setAttribute("data-cupom", cupom);
      botao.setAttribute("aria-label", "Copiar o cupom " + cupom);
      trocar(botao, PADRAO, cupom, true);
      trocar(botao, "5% OFF", desconto + "% OFF", true);
      // "+5% OFF com o cupom" fica no parágrafo em volta do botão.
      if (botao.parentNode) trocar(botao.parentNode, "+5% OFF", "+" + desconto + "% OFF", false);
    }
  }
  if (cupom) {
    aplicar();
    if (w.MutationObserver) new w.MutationObserver(aplicar).observe(d.documentElement, { childList: true, subtree: true });
  }

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
