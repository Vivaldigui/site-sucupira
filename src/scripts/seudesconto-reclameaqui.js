/* Selo "Verificada por Reclame AQUI" no topo, ao lado de "para tomar" no título. Se a tela não
   tiver espaço nessa linha, vai para o canto de cima da foto e a caixa "Garrafa a partir de"
   desce para o canto de baixo.
   O selo é desenhado aqui, igual ao modelo horizontal do embed do RA, com as imagens do RA
   servidas pela landing (pré-carregadas no head). O embed oficial só aparecia ~1 s depois da
   página: dependia do script, da API e do CSS do RA. */
(function (w, d) {
  "use strict";
  var LINK = "https://www.reclameaqui.com.br/empresa/sucupira-naturale/?utm_source=rav&utm_medium=embed&utm_campaign=horizontal";
  var LARGURA = 136, ALTURA = 48, ESCALA = 0.85, FOLGA = 8;
  var selo = null, agendado = false;

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
  function criarSelo() {
    var el = d.createElement("div");
    el.id = "ra-selo-hero";
    el.innerHTML =
      '<a href="' + LINK + '" target="_blank" rel="noopener noreferrer" title="Selo RA Verificada"' +
      ' style="display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;width:100%;height:100%;padding:6px;border:1px solid #1E40AF;border-radius:8px;background:#FFFFFF;text-decoration:none">' +
      '<img src="/assets/ra/verified.svg" alt="Selo RA Verificada" width="36" height="36" style="width:36px;height:36px;display:block">' +
      '<span style="display:flex;flex-direction:column;align-items:flex-start;gap:2px">' +
      '<span style="font:400 12px/16px \'Open Sans\',Arial,sans-serif;color:#0F172B;white-space:nowrap">Verificada por</span>' +
      '<img src="/assets/ra/ra-logo.svg" alt="Reclame AQUI" width="74" height="14" style="width:74px;height:14px;display:block">' +
      '</span></a>';
    return el;
  }
  // O runtime da landing re-renderiza o topo depois de montar; o mesmo nó do selo é recolocado.
  function aplicar() {
    agendado = false;
    var p = visivel(".hero-panel"), h = visivel("h1.a-title");
    if (!p || !h) return;
    if (!selo) selo = criarSelo();

    var linha = ultimaLinha(h), caixa = h.getBoundingClientRect();
    var cabe = linha && caixa.right - linha.right >= LARGURA * ESCALA + FOLGA;
    var css;
    if (cabe) {
      if (h.style.position !== "relative") h.style.position = "relative";
      css = estilo("titulo", Math.round(linha.top - caixa.top + (linha.height - ALTURA) / 2));
      if (selo.parentNode !== h) h.appendChild(selo);
    } else {
      css = estilo("foto", Math.round(14 - ALTURA * (1 - ESCALA) / 2));
      if (selo.parentNode !== p) p.appendChild(selo);
    }
    if (selo.style.cssText !== css) selo.style.cssText = css;
    moverPreco(p, !cabe);
  }
  function agendar() {
    if (agendado) return;
    agendado = true;
    w.setTimeout(aplicar, 0);
  }
  // Não espera DOMContentLoaded: o pacote da landing reescreve o documento e o listener se perde.
  aplicar();
  new w.MutationObserver(agendar).observe(d.documentElement, { childList: true, subtree: true });
  w.addEventListener("resize", agendar);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(agendar);
  var tentativas = 0;
  (function vigiar() { if (++tentativas > 40) return; agendar(); w.setTimeout(vigiar, 250); })();
})(window, document);
