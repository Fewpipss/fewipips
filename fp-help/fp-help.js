/* Fewpips - chat help panel LOADER (the FundedNext/Intercom-style help in front of LiveChat).
   Kept tiny on purpose: it skins the LiveChat FAB with the mascot and catches its click.
   The panel (fp-help/panel.js) and its search index (fp-help/index.json) load on the first
   hover/click of the FAB, so a page pays nothing for them until someone opens the chat.
   If panel.js cannot load, the click falls back to opening LiveChat directly, as before.
   Deep link / QA: ?fphelp=home | message | message:<topic> | news | help | help:<query> | faq:<n> */
(function () {
  if (window.FPHelp) return;

  var BASE = "/fp-help/";
  var FAB_SEL = ".chat-fab--livechat";
  var pending = null;

  function load() {
    if (window.__fphPanel) return Promise.resolve(window.__fphPanel);
    if (!pending) {
      pending = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = BASE + "panel.js";
        s.async = true;
        s.onload = function () { if (window.__fphPanel) resolve(window.__fphPanel); else reject(); };
        s.onerror = function () { pending = null; reject(); };
        document.head.appendChild(s);
      });
    }
    return pending;
  }
  function liveChat() {
    try { window.LiveChatWidget.call("maximize"); } catch (e) {}
  }
  function open(view, arg, instant) {
    return load().then(function (P) { P.open(view, arg, instant); }, liveChat);
  }
  function close() { if (window.__fphPanel) window.__fphPanel.close(); }

  // the mascot replaces the generic chat bubble before anyone clicks
  var css = document.createElement("style");
  css.id = "fph-fab-css";
  css.textContent = FAB_SEL + "{background:#050505 url(" + BASE + "mascot-head.webp) center/cover no-repeat!important;" +
    "box-shadow:inset 0 0 0 3px #0fcd37,0 8px 28px #00000073!important}" + FAB_SEL + ">svg{opacity:0}";
  (document.head || document.documentElement).appendChild(css);

  // The FAB belongs to React (ChatWidgets) and calls LiveChat "maximize" on click. Catch the
  // click first (window, capture phase) so the panel opens instead.
  window.addEventListener("click", function (e) {
    var fab = e.target && e.target.closest && e.target.closest(FAB_SEL);
    if (!fab) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    var P = window.__fphPanel;
    if (P && P.isOpen()) P.close(); else open("home");
  }, true);
  // warm up on hover/focus so the first click opens at once
  ["pointerover", "focusin"].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (e.target && e.target.closest && e.target.closest(FAB_SEL)) load().catch(function () {});
    }, { passive: true });
  });

  window.FPHelp = { open: open, close: close };

  var m = /[?&]fphelp=([^&#]+)/.exec(location.search);
  if (m) {
    var p = decodeURIComponent(m[1].replace(/\+/g, " ")).split(":"), tries = 0;
    // wait for the FAB: it mounts after hydration, which would drop a node added earlier
    (function start() {
      if (document.querySelector(FAB_SEL) || ++tries > 50) open(p[0], p.slice(1).join(":"), true);
      else setTimeout(start, 100);
    })();
  }
})();
