/* Selo "Verificada" do Reclame AQUI no topo, ao lado de "para tomar" no título. Se a tela não
   tiver espaço nessa linha, vai para o canto de cima da foto e a caixa "Garrafa a partir de"
   desce para o canto de baixo. O selo é o embed oficial do RA (modelo horizontal). */
(function (w, d) {
  "use strict";
  var RA_ID = "WGh5blpwdS14RGZ5M0xNMTpzdWN1cGlyYS1uYXR1cmFsZQ==";
  var RA_BUNDLE = "https://s3.amazonaws.com/raichu-beta/ra-verified/bundle.js";
  var LARGURA = 136, ALTURA = 48, ESCALA = 0.85, FOLGA = 8;
  var selo = null, carregado = false, agendado = false, preso = 0, cargas = 0, script = null;

  // A landing renderiza duas cópias (a dinâmica e a estática, escondida); vale a que está na tela.
  function visivel(seletor) {
    var todos = d.querySelectorAll(seletor);
    for (var i = 0; i < todos.length; i++) if (todos[i].getClientRects().length) return todos[i];
    return null;
  }
  function caixaPreco(p) {
    var filhos = p.children;
    for (var i = 0; i < filhos.length; i++) {
      if (filhos[i] !== selo && /Garrafa a partir de/.test(filhos[i].textContent || "")) return filhos[i];
    }
    return null;
  }
  function moverPreco(p, descer) {
    var preco = caixaPreco(p);
    if (!preco) return;
    var top = descer ? "auto" : "14px", bottom = descer ? "14px" : "";
    if (preco.style.top !== top) preco.style.top = top;
    if (preco.style.bottom !== bottom) preco.style.bottom = bottom;
  }
  // Última linha do título: retângulo do texto (sem o selo).
  function ultimaLinha(h) {
    var r = d.createRange(), ultima = null;
    for (var i = 0; i < h.childNodes.length; i++) {
      if (h.childNodes[i] === selo) continue;
      r.selectNodeContents(h.childNodes[i]);
      var rs = r.getClientRects();
      for (var j = 0; j < rs.length; j++) if (!ultima || rs[j].bottom > ultima.bottom + 1 || (Math.abs(rs[j].bottom - ultima.bottom) <= 1 && rs[j].right > ultima.right)) ultima = rs[j];
    }
    return ultima;
  }
  function estilo(lugar, topo) {
    var base = "position:absolute;right:" + (lugar === "titulo" ? "0" : "14px") + ";z-index:1;width:" + LARGURA + "px;height:" + ALTURA + "px;transform:scale(" + ESCALA + ");transform-origin:right center;background:#FFFFFF;border-radius:10px";
    return base + ";top:" + topo + "px" + (lugar === "foto" ? ";box-shadow:0 4px 14px rgba(29,59,35,.12)" : "");
  }
  // O script do RA procura o alvo pelo id uma vez só; se o topo estava sendo re-renderizado
  // naquele instante, o widget não sai. Confere depois e carrega de novo (até 3 vezes).
  function conferir() {
    if (selo.firstChild || cargas >= 3) return;
    carregado = false;
    agendar();
  }
  function carregarSelo() {
    carregado = true;
    cargas++;
    if (script && script.parentNode) script.parentNode.removeChild(script);
    var s = script = d.createElement("script");
    s.onload = s.onerror = function () { w.setTimeout(conferir, 2000); };
    s.id = "ra-embed-verified-seal";
    s.src = RA_BUNDLE;
    s.async = true;
    s.setAttribute("data-id", RA_ID);
    s.setAttribute("data-target", "ra-selo-hero");
    s.setAttribute("data-model", "2");
    d.body.appendChild(s);
  }
  // O runtime da landing re-renderiza o topo depois de montar; o mesmo nó do selo é recolocado,
  // com o widget já desenhado dentro.
  function aplicar() {
    agendado = false;
    var p = visivel(".hero-panel"), h = visivel("h1.a-title");
    if (!p || !h) return;
    if (!selo) { selo = d.createElement("div"); selo.id = "ra-selo-hero"; }

    var linha = ultimaLinha(h), caixa = h.getBoundingClientRect();
    var cabe = linha && caixa.right - linha.right >= LARGURA * ESCALA + FOLGA;
    var css;
    if (cabe) {
      if (h.style.position !== "relative") h.style.position = "relative";
      css = estilo("titulo", Math.round(linha.top - caixa.top + (linha.height - ALTURA) / 2));
      if (selo.parentNode !== h) { h.appendChild(selo); preso = Date.now(); }
    } else {
      css = estilo("foto", Math.round(14 - ALTURA * (1 - ESCALA) / 2));
      if (selo.parentNode !== p) { p.appendChild(selo); preso = Date.now(); }
    }
    if (selo.style.cssText !== css) selo.style.cssText = css;
    moverPreco(p, !cabe);
    // Só carrega o RA depois que o selo ficou no lugar por um tempo (o topo parou de re-renderizar).
    if (!carregado) {
      if (Date.now() - preso >= 800) carregarSelo();
      else w.setTimeout(agendar, 850 - (Date.now() - preso));
    }
  }
  function agendar() {
    if (agendado) return;
    agendado = true;
    w.setTimeout(aplicar, 50);
  }
  // Não espera DOMContentLoaded: o pacote da landing reescreve o documento e o listener se perde.
  aplicar();
  new w.MutationObserver(agendar).observe(d.documentElement, { childList: true, subtree: true });
  w.addEventListener("resize", agendar);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(agendar);
  var tentativas = 0;
  (function vigiar() { if (++tentativas > 40) return; agendar(); w.setTimeout(vigiar, 250); })();
})(window, document);
