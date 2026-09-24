// Cópia de tracking-snippet/sn.js do repositório crm-sucupira-naturale (fonte da verdade). Não editar aqui.
/*
 * Sucupira Naturale - tracking first-party (docs/tracking/architecture.md).
 * Configuração antes deste script: window.SN_TRACK = { endpoint: "https://.../t/v1/s" }.
 * Cria sn_vid (visitante, 400 dias) e sn_s (sessão, 30 min deslizantes) no domínio raiz e envia
 * um evento só quando uma sessão começa. Não lê nem envia dado pessoal; a query string é filtrada
 * pela lista de parâmetros permitidos e o referrer vai só como host.
 */
(function (w, d) {
  "use strict";
  var cfg = w.SN_TRACK || {};
  if (!cfg.endpoint || cfg.disabled || w.__snTrackLoaded) return;
  w.__snTrackLoaded = true;

  var ROOT = "sucupiranaturale.com.br";
  var VID_MAX_AGE = 400 * 24 * 3600;
  var SESSION_MAX_AGE = 30 * 60;
  var ID_RE = /^[a-z2-7]{16}$/;
  var PARAMS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id",
    "gclid", "gbraid", "wbraid", "gad_source", "gad_campaignid", "fbclid",
    "sn_ag", "sn_mt", "sn_net", "sn_dev"
  ];
  // Mudança em qualquer um destes no meio da navegação = clique novo = sessão nova.
  var CAMPAIGN_KEYS = ["gclid", "gbraid", "wbraid", "fbclid", "gad_campaignid", "utm_source", "utm_medium", "utm_campaign"];

  function onRootDomain() {
    var h = w.location.hostname;
    return h === ROOT || h.slice(-(ROOT.length + 1)) === "." + ROOT;
  }

  function getCookie(name) {
    var m = d.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    if (!m) return null;
    try { return decodeURIComponent(m[1]); } catch (e) { return null; }
  }

  function setCookie(name, value, maxAge) {
    d.cookie = name + "=" + encodeURIComponent(value) + "; path=/; max-age=" + maxAge +
      (onRootDomain() ? "; domain=." + ROOT : "") + "; SameSite=Lax" +
      (w.location.protocol === "https:" ? "; Secure" : "");
  }

  function newId() {
    var alphabet = "abcdefghijklmnopqrstuvwxyz234567";
    var bytes = new Uint8Array(16);
    (w.crypto || w.msCrypto).getRandomValues(bytes);
    var id = "";
    for (var i = 0; i < 16; i++) id += alphabet.charAt(bytes[i] & 31);
    return id;
  }

  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function queryParams() {
    var out = {};
    var q = w.location.search.replace(/^\?/, "");
    if (!q) return out;
    var pairs = q.split("&");
    for (var i = 0; i < pairs.length; i++) {
      var idx = pairs[i].indexOf("=");
      var key = idx < 0 ? pairs[i] : pairs[i].slice(0, idx);
      var val = idx < 0 ? "" : pairs[i].slice(idx + 1);
      try {
        key = decodeURIComponent(key);
        val = decodeURIComponent(val.replace(/\+/g, " "));
      } catch (e) { continue; }
      if (PARAMS.indexOf(key) >= 0 && val && !(key in out)) out[key] = val;
    }
    return out;
  }

  function referrerHost() {
    var r = d.referrer;
    if (!r) return null;
    var m = /^https?:\/\/([^\/?#:]+)/i.exec(r);
    return m ? m[1].toLowerCase() : null;
  }

  function send(payload) {
    var body = JSON.stringify(payload);
    try {
      if (w.navigator.sendBeacon && w.navigator.sendBeacon(cfg.endpoint, new Blob([body], { type: "text/plain" }))) return;
    } catch (e) { /* cai no fetch */ }
    try {
      w.fetch(cfg.endpoint, {
        method: "POST", body: body, keepalive: true, mode: "cors", credentials: "omit",
        headers: { "Content-Type": "text/plain" }
      })["catch"](function () {});
    } catch (e) { /* sem rede ou navegador antigo: a sessão fica sem registro */ }
  }

  try {
    var params = queryParams();

    var vid = getCookie("sn_vid");
    if (!ID_RE.test(vid || "")) vid = newId();
    setCookie("sn_vid", vid, VID_MAX_AGE);

    var campaign = "";
    for (var i = 0; i < CAMPAIGN_KEYS.length; i++) if (params[CAMPAIGN_KEYS[i]]) campaign += CAMPAIGN_KEYS[i] + "=" + params[CAMPAIGN_KEYS[i]] + "&";
    var campaignHash = campaign ? hash(campaign) : "";

    var stored = (getCookie("sn_s") || "").split(".");
    var sid = stored[0];
    var storedHash = stored[1] || "";
    var isNew = !ID_RE.test(sid || "") || (campaignHash !== "" && campaignHash !== storedHash);
    if (isNew) sid = newId();
    setCookie("sn_s", sid + "." + (campaignHash || storedHash), SESSION_MAX_AGE);

    w.SN_TRACK_IDS = { vid: vid, sid: sid };

    if (isNew) {
      var qs = [];
      for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k)) qs.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
      var payload = {
        v: 1,
        vid: vid,
        sid: sid,
        url: w.location.protocol + "//" + w.location.host + w.location.pathname + (qs.length ? "?" + qs.join("&") : ""),
        ref: referrerHost()
      };
      if (!params.gclid && !params.gbraid && !params.wbraid) {
        var aw = getCookie("_gcl_aw");
        var gb = getCookie("_gcl_gb");
        if (aw || gb) {
          payload.gcl = {};
          if (aw) payload.gcl.aw = aw.slice(0, 300);
          if (gb) payload.gcl.gb = gb.slice(0, 300);
        }
      }
      send(payload);
    }
  } catch (e) { /* o tracking nunca pode quebrar a página */ }
})(window, document);
