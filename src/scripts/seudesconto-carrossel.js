/* Carrossel de kits: abre no kit de 4 (o mais vendido), passa sozinho a cada 5 s e para de vez quando a pessoa mexe. */
(function (w, d) {
  "use strict";
  var INTERVALO = 5000, KIT_INICIAL = "4";
  var parado = !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var pausado = false, visivel = false, iniciado = null, observado = null, mexeu = false;

  // A landing renderiza duas cópias (a dinâmica e a estática, escondida); vale a que está na tela.
  function trilho() {
    var todos = d.querySelectorAll(".kc-track");
    for (var i = 0; i < todos.length; i++) if (todos[i].offsetParent !== null && todos[i].clientWidth > 0) return todos[i];
    return null;
  }
  function cartoes(t) { return t.querySelectorAll(".kc-card"); }
  function atual(t) {
    var c = cartoes(t), meio = t.scrollLeft + t.clientWidth / 2, melhor = 0, dist = Infinity;
    for (var i = 0; i < c.length; i++) {
      var x = c[i].offsetLeft + c[i].offsetWidth / 2, dd = Math.abs(x - meio);
      if (dd < dist) { dist = dd; melhor = i; }
    }
    return melhor;
  }
  function ir(t, i, suave) {
    var c = cartoes(t); if (!c.length) return;
    i = (i + c.length) % c.length;
    var alvo = c[i].offsetLeft - (t.clientWidth - c[i].offsetWidth) / 2;
    if (t.scrollTo) t.scrollTo({ left: Math.max(0, alvo), behavior: suave ? "smooth" : "auto" });
    else t.scrollLeft = Math.max(0, alvo);
  }
  function marcarPontos(t) {
    var sec = t.closest("section"); if (!sec) return;
    var i = atual(t), pts = sec.querySelectorAll(".kc-dot");
    for (var k = 0; k < pts.length; k++) {
      if (k === i) { pts[k].classList.add("is-on"); pts[k].setAttribute("aria-current", "true"); }
      else { pts[k].classList.remove("is-on"); pts[k].removeAttribute("aria-current"); }
    }
  }
  function parar() { parado = true; mexeu = true; }

  function preparar(t) {
    if (iniciado === t) return;
    iniciado = t;
    var c = cartoes(t);
    // A página pode trocar o trilho ao terminar de montar; enquanto ninguém mexeu, ele volta ao kit de 4.
    if (!mexeu) {
      for (var i = 0; i < c.length; i++) if (c[i].getAttribute("data-kit") === KIT_INICIAL) { ir(t, i, false); break; }
    }
    marcarPontos(t);
    // Toque, arrasto, roda do mouse, teclado e foco param o giro de vez; passar o mouse só pausa.
    ["pointerdown", "touchstart", "wheel", "keydown", "focusin"].forEach(function (ev) {
      t.addEventListener(ev, parar, { passive: true });
    });
    t.addEventListener("mouseenter", function () { pausado = true; });
    t.addEventListener("mouseleave", function () { pausado = false; });
    var espera = null;
    t.addEventListener("scroll", function () {
      if (espera) w.clearTimeout(espera);
      espera = w.setTimeout(function () { marcarPontos(t); }, 80);
    }, { passive: true });
    if (w.IntersectionObserver) {
      if (observado) observado.disconnect();
      observado = new w.IntersectionObserver(function (es) { visivel = es[0].isIntersecting; }, { threshold: 0.5 });
      observado.observe(t);
    } else visivel = true;
  }

  // Setas e pontos: delegação no documento, para sobreviver a uma nova renderização da página.
  d.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest(".kc-arrow, .kc-dot") : null;
    if (!b) return;
    var sec = b.closest("section"), t = sec ? sec.querySelector(".kc-track") : null;
    if (!t) return;
    parar();
    if (b.classList.contains("kc-arrow")) ir(t, atual(t) + Number(b.getAttribute("data-dir") || 1), true);
    else ir(t, Number(b.getAttribute("data-i") || 0), true);
  });

  w.setInterval(function () {
    var t = trilho();
    if (!t) return;
    preparar(t);
    if (parado || pausado || !visivel || d.hidden) return;
    ir(t, atual(t) + 1, true);
  }, INTERVALO);

  // Posiciona no kit de 4 assim que a landing termina de montar (e de novo se ela trocar o trilho), sem esperar o giro.
  var tentativas = 0;
  (function esperar() {
    var t = trilho();
    if (t) preparar(t);
    if (++tentativas < 60) w.setTimeout(esperar, 150);
  })();
})(window, document);
