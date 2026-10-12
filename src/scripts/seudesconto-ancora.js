/* Âncora vinda de fora (ex.: blog → /#kits): a página é montada por JavaScript depois do
   carregamento, então o navegador não acha o alvo a tempo e fica no topo. Espera o alvo
   visível aparecer e rola até ele; desiste se a pessoa já rolou ou após 6 s. */
(function (w, d) {
  "use strict";
  var id = w.location.hash.slice(1);
  if (!id) return;
  try { id = decodeURIComponent(id); } catch (e) {}
  var inicio = Date.now(), mexeu = false;
  function parar() { mexeu = true; }
  w.addEventListener("wheel", parar, { passive: true, once: true });
  w.addEventListener("touchmove", parar, { passive: true, once: true });
  w.addEventListener("keydown", parar, { once: true });

  // A landing renderiza duas cópias (a dinâmica e a estática, escondida); vale a que está na tela.
  function alvo() {
    var todos = w.document.querySelectorAll("[id]");
    for (var i = 0; i < todos.length; i++) {
      if (todos[i].id === id && todos[i].getClientRects().length) return todos[i];
    }
    return null;
  }
  function tentar() {
    if (mexeu || Date.now() - inicio > 6000) return;
    var el = alvo();
    if (!el) { w.setTimeout(tentar, 100); return; }
    // Imagens acima do alvo ainda podem empurrá-lo; confere de novo logo depois.
    el.scrollIntoView({ block: "start" });
    w.setTimeout(function () { if (!mexeu) el.scrollIntoView({ block: "start" }); }, 600);
  }
  // Não espera DOMContentLoaded: o pacote da landing reescreve o documento e o listener se perde.
  tentar();
})(window, document);
