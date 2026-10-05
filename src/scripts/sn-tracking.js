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
  /* SN_DELIVERY_START */
/* Entrega compartilhada, embutida nos snippets pelo build-delivery.cjs. */
(function (w, d) {
  "use strict";
  if (w.SN_DELIVERY) return;
  var clients = {}, ROOT = "sucupiranaturale.com.br", DAY = 86400000;
  function cookie(name) {
    var m = (d.cookie || "").match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    try { return m ? decodeURIComponent(m[1]) : ""; } catch (e) { return ""; }
  }
  function writeCookie(name, value, age) {
    var host = w.location.hostname || "";
    d.cookie = name + "=" + encodeURIComponent(value) + "; path=/; max-age=" + age + "; SameSite=Lax" +
      (host === ROOT || host.slice(-(ROOT.length + 1)) === "." + ROOT ? "; domain=." + ROOT : "") +
      (w.location.protocol === "https:" ? "; Secure" : "");
  }
  function fingerprint(value) {
    var h = 5381;
    for (var i = 0; i < value.length; i++) h = ((h << 5) + h + value.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  w.SN_DELIVERY = { create: function (endpoint) {
    var base = endpoint.replace(/\/[sebf]$/, "");
    if (clients[base]) return clients[base];
    var prefix = "sn_q_v1:" + fingerprint(base) + ":", entries = {}, busy = false, timer = null;
    var storage;
    try { storage = w.localStorage; } catch (e) { /* memória se armazenamento bloqueado */ }
    var contextKey = "sn_context_v1:" + fingerprint(base);
    function context(sid) {
      var values = [cookie("sn_context")];
      try { if (storage) values.push(storage.getItem(contextKey)); } catch (e) { /* cookie */ }
      for (var i = 0; i < values.length; i++) try {
        var p = JSON.parse(values[i] || "null");
        if (p && p.sid === sid && p.vid === cookie("sn_vid") &&
            valid({ route: "s", payload: p, created: Date.parse(p.occurred_at) })) return p;
      } catch (e) { /* contexto inválido */ }
      return null;
    }
    function remember(payload) {
      if (cookie("sn_s").split(".")[0] !== payload.sid) return;
      if (context(payload.sid)) return;
      var raw = JSON.stringify(payload);
      try { if (storage) storage.setItem(contextKey, raw); } catch (e) { /* cookie */ }
      // O contexto confirmado conserva só a entrada filtrada, nunca identidade de checkout.
      writeCookie("sn_context", encodeURIComponent(raw).length <= 3000 ? raw : "", encodeURIComponent(raw).length <= 3000 ? 86400 : 0);
    }
    function valid(entry) {
      return entry && /^[sebf]$/.test(entry.route) && entry.payload && entry.payload.v === 1 &&
        /^[a-z2-7]{16}$/.test(entry.payload.sid) && /^[a-z2-7]{16}$/.test(entry.payload.vid) &&
        typeof entry.created === "number" && entry.created <= Date.now() + 10000 &&
        Date.now() - entry.created < (entry.payload.kind === "checkout_identified" ? 900000 : DAY) &&
        JSON.stringify(entry.payload).length <= 3800;
    }
    function remove(key) {
      delete entries[key];
      try { if (storage) storage.removeItem(prefix + key); } catch (e) { /* memória */ }
    }
    function load() {
      try {
        if (storage) for (var i = storage.length - 1; i >= 0; i--) {
          var name = storage.key(i);
          if (!name || name.indexOf(prefix) !== 0) continue;
          var key = name.slice(prefix.length), entry;
          try { entry = JSON.parse(storage.getItem(name)); } catch (e) { entry = null; }
          // Identificação do checkout nunca pode vir do armazenamento persistente.
          if (!valid(entry) || entry.payload.kind === "checkout_identified") { storage.removeItem(name); continue; }
          if (!entries[key]) entries[key] = entry;
        }
      } catch (e) { /* armazenamento indisponível */ }
      var keys = Object.keys(entries).sort(function (a, b) { return entries[a].created - entries[b].created; });
      for (var j = 0; j < keys.length; j++) if (!valid(entries[keys[j]]) || j < keys.length - 50) remove(keys[j]);
    }
    function persist(key, entry) {
      if (entry.payload.kind === "checkout_identified") return;
      try { if (storage) storage.setItem(prefix + key, JSON.stringify(entry)); } catch (e) { /* memória */ }
    }
    function schedule(delay) {
      if (timer !== null || !w.setTimeout) return;
      timer = w.setTimeout(function () { timer = null; flush(); }, delay);
    }
    function settle(key, entry, accepted, retry) {
      busy = false;
      if (!retry) {
        remove(key);
        if (entry.route === "s") {
          if (accepted && (cookie("sn_s").split(".")[0] === entry.payload.sid)) writeCookie("sn_a", entry.payload.sid, 1800);
          try { if (JSON.parse(cookie("sn_pending") || "null").sid === entry.payload.sid) writeCookie("sn_pending", "", 0); } catch (e) { /* vazio */ }
        }
      } else {
        entry.attempt = Math.min((entry.attempt || 0) + 1, 4);
        entry.next = Date.now() + [1000, 5000, 30000, 60000][entry.attempt - 1];
        persist(key, entry);
      }
      flush();
    }
    function flush() {
      if (busy) return;
      load();
      var keys = Object.keys(entries).sort(function (a, b) {
        return (entries[a].route === "s" ? 0 : 1) - (entries[b].route === "s" ? 0 : 1) || entries[a].created - entries[b].created;
      });
      if (!keys.length) return;
      if (w.navigator && w.navigator.onLine === false) { schedule(5000); return; }
      var due = keys.filter(function (k) { return !entries[k].next || entries[k].next <= Date.now(); });
      if (!due.length) { schedule(Math.max(100, Math.min.apply(null, keys.map(function (k) { return entries[k].next; })) - Date.now())); return; }
      var key = due[0], entry = entries[key], body = JSON.stringify(entry.payload);
      busy = true;
      // sendBeacon confirma somente a fila do navegador, nunca a gravação no servidor.
      if (!w.fetch) {
        try { if (w.navigator.sendBeacon) w.navigator.sendBeacon(base + "/" + entry.route + "?ack=1", new Blob([body], { type: "text/plain" })); } catch (e) { /* reenvia */ }
        settle(key, entry, false, true); return;
      }
      var done = false, timeout, controller = w.AbortController ? new w.AbortController() : null;
      function finish(accepted, retry) {
        if (done) return;
        done = true;
        if (timeout && w.clearTimeout) w.clearTimeout(timeout);
        settle(key, entry, accepted, retry);
      }
      if (w.setTimeout) timeout = w.setTimeout(function () { if (controller) controller.abort(); finish(false, true); }, 10000);
      try {
        w.fetch(base + "/" + entry.route + "?ack=1", { method: "POST", body: body, keepalive: true,
          mode: "cors", credentials: "omit", headers: { "Content-Type": "text/plain" }, signal: controller ? controller.signal : undefined
        }).then(function (res) {
          if (res.status === 200) return res.json().then(function (ack) { finish(ack && ack.accepted === true, !(ack && ack.accepted === true)); });
          finish(false, res.status === 408 || res.status === 409 || res.status === 429 || res.status >= 500 || (res.status >= 200 && res.status !== 204 && res.status < 400));
        })["catch"](function () { finish(false, true); });
      } catch (e) { finish(false, true); }
    }
    var client = { send: function (route, payload) {
      if (!/^[sebf]$/.test(route)) return;
      payload = JSON.parse(JSON.stringify(payload));
      if ((route === "s" || route === "e") && !payload.occurred_at) payload.occurred_at = new Date().toISOString();
      var key = route + ":" + (payload.event_id || (payload.sid + ":" + (payload.kind || "session") + ":" + (payload.order_number || payload.email_sha256 || "")));
      var entry = { route: route, payload: payload, created: payload.occurred_at ? Date.parse(payload.occurred_at) : Date.now(), next: 0, attempt: 0 };
      if (!valid(entry)) return;
      if (route === "s") remember(payload);
      load();
      if (!entries[key]) { entries[key] = entry; persist(key, entry); }
      if (route === "s" && cookie("sn_s").split(".")[0] === payload.sid && encodeURIComponent(JSON.stringify(payload)).length <= 3000) writeCookie("sn_pending", JSON.stringify(payload), 86400);
      load(); flush();
    }, context: context, check: function (sid, vid, done) {
      var finished = false, timer;
      function finish(exists) { if (finished) return; finished = true; if (timer && w.clearTimeout) w.clearTimeout(timer); done(exists); }
      if (!w.fetch) { finish(null); return; }
      if (w.setTimeout) timer = w.setTimeout(function () { finish(null); }, 3000);
      try {
        w.fetch(base + "/c", { method: "POST", body: JSON.stringify({ v: 1, sid: sid, vid: vid }),
          mode: "cors", credentials: "omit", keepalive: true, headers: { "Content-Type": "text/plain" }
        }).then(function (res) {
          if (res.status !== 200) { finish(null); return; }
          return res.json().then(function (body) { finish(body && typeof body.exists === "boolean" ? body.exists : null); });
        })["catch"](function () { finish(null); });
      } catch (e) { finish(null); }
    }, acknowledged: function (sid) { return cookie("sn_a") === sid; }, pending: function (sid) {
      try { var p = JSON.parse(cookie("sn_pending") || "null"); return p && p.sid === sid ? p : null; } catch (e) { return null; }
    }, flush: flush };
    clients[base] = client;
    // A loja e o checkout podem recuperar a primeira chegada que falhou no blog.
    var pending = client.pending(cookie("sn_s").split(".")[0]);
    var original = context(cookie("sn_s").split(".")[0]);
    if (original) client.send("s", original);
    else if (pending && pending.vid === cookie("sn_vid") && !client.acknowledged(pending.sid)) client.send("s", pending);
    if (w.addEventListener) {
      w.addEventListener("online", function () { for (var k in entries) entries[k].next = 0; flush(); });
      w.addEventListener("pageshow", function (event) {
        if (event && event.persisted) { var p = context(cookie("sn_s").split(".")[0]); if (p) client.send("s", p); }
        flush();
      });
      w.addEventListener("pagehide", function () {
        load(); Object.keys(entries).slice(0, 10).forEach(function (key) {
          var e = entries[key];
          try { if (w.navigator.sendBeacon) w.navigator.sendBeacon(base + "/" + e.route + "?ack=1", new Blob([JSON.stringify(e.payload)], { type: "text/plain" })); } catch (error) { /* permanece na fila */ }
        });
      });
    }
    flush(); return client;
  } };
})(window, document);
/* SN_DELIVERY_END */
  var delivery = w.SN_DELIVERY.create(cfg.endpoint);

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

  function stampLiCampaign(sid) {
    if (!cfg.stamp || w.location.hostname !== "www." + ROOT) return;
    function writeStamp() {
      try {
        // O tema da LI grava utm_campaign no DOMContentLoaded. Este timer roda depois dele.
        var base = (getCookie("utm_campaign") || "").replace(/~s[a-z2-7]{16}$/, "") || "sn";
        var value = base.slice(0, 8) + "~s" + sid;
        d.cookie = "utm_campaign=" + encodeURIComponent(value) + "; path=/; max-age=604800; SameSite=Lax" +
          (w.location.protocol === "https:" ? "; Secure" : "");
      } catch (e) { /* não interfere na página */ }
    }
    if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", function () { w.setTimeout(writeStamp, 0); });
    else w.setTimeout(writeStamp, 0);
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

  function send(payload, endpoint) {
    delivery.send((endpoint || cfg.endpoint).slice(-1), payload);
  }

  function blogTracking(vid, sid) {
    // O blog saiu de blog.sucupiranaturale.com.br em 10/2026; o host vem da config da página.
    if (w.location.hostname !== (cfg.blogHost || "blog." + ROOT)) return;
    var article = w.location.pathname;
    if (!/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]*$/.test(article) || article.length > 250) return;
    var endpoint = cfg.endpoint.replace(/\/s$/, "/b");
    if (endpoint === cfg.endpoint) return;
    function event(kind, extra) {
      var payload = { v: 1, event_id: newId(), vid: vid, sid: sid, kind: kind, article_path: article };
      for (var key in extra) if (Object.prototype.hasOwnProperty.call(extra, key)) payload[key] = extra[key];
      send(payload, endpoint);
    }
    event("page_view", {});
    function click(e) {
      try {
        if ((e.type === "auxclick" && e.button !== 1) || (e.type === "click" && e.button !== 0)) return;
        var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
        if (!a) return;
        var url = new w.URL(a.href, w.location.href);
        if (url.protocol !== "https:" || url.username || url.password || (url.hostname !== ROOT && url.hostname !== "www." + ROOT)) return;
        var path = url.pathname;
        if (path.length > 200 || !/^\/(?:[a-z0-9][a-z0-9-]*\/?)?$/.test(path) || /^\/(checkout|carrinho|conta|minha-conta)(\/|$)/.test(path)) return;
        var button = a.getAttribute("data-sn-cta") || (a.closest(".mobile-sticky-cta") ? "barra-fixa" : a.closest(".product-cta") ? "bloco-cta" : a.closest(".blog-header") ? "cabecalho" : a.closest(".blog-footer") ? "rodape" : "link-artigo");
        if (!/^[a-z0-9_-]{1,60}$/.test(button)) button = "link-artigo";
        var links = d.querySelectorAll("a[href]");
        var index = 0; for (var i = 0; i < links.length; i++) if (links[i] === a) { index = i + 1; break; }
        event("shop_click", { button_id: button + "-" + index, destination_path: path });
      } catch (error) { /* nunca impede a navegação */ }
    }
    d.addEventListener("click", click, true);
    d.addEventListener("auxclick", click, true);
  }

  function funnelTracking(vid, sid) {
    if (w.location.hostname !== ROOT && w.location.hostname !== "www." + ROOT) return;
    if (cfg.funnel === false) return;
    var endpoint = cfg.endpoint.replace(/\/s$/, "/f");
    if (endpoint === cfg.endpoint) return;
    var registered = false, seen = {};
    function register() {
      if (registered || !w.jQuery) return;
      registered = true;
      // Native LI success notification, emitted by both AJAX and redirect cart flows.
      // Ignore its product/customer payload completely.
      w.jQuery(d).on("li_add_to_cart.snFunnel", function (_, eventId) {
        try {
          if (typeof eventId === "string" && eventId.length < 150) {
            if (seen["e:" + eventId]) return;
            seen["e:" + eventId] = true;
          }
          send({ v: 1, event_id: newId(), vid: vid, sid: sid, kind: "add_to_cart" }, endpoint);
        } catch (error) { /* never interrupts cart */ }
      });
    }
    register();
    if (!registered && d.readyState === "loading") d.addEventListener("DOMContentLoaded", register);
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

    function start(exists) {
    if (exists === false) {
      // Sem a entrada original, abre uma chegada observada agora; não reescreve a origem apagada.
      sid = newId(); isNew = true;
      setCookie("sn_s", sid + "." + (campaignHash || storedHash), SESSION_MAX_AGE);
    }
    w.SN_TRACK_IDS = { vid: vid, sid: sid };
    stampLiCampaign(sid);

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
    blogTracking(vid, sid);
    funnelTracking(vid, sid);
    }
    if (!isNew && !delivery.context(sid) && !delivery.pending(sid)) delivery.check(sid, vid, start);
    else start(true);
  } catch (e) { /* o tracking nunca pode quebrar a página */ }
})(window, document);
