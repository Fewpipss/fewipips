/* Fewpips - proactive LiveChat greeting.
   On EVERY page load / refresh / client-side navigation the LiveChat FAB gets a red "1"
   badge (as if a message arrived) and a greeting bubble pops up next to it. Clicking either
   opens the real LiveChat window (window.LiveChatWidget "maximize"). The bubble has its own
   X to dismiss - that only hides it for the current view; it comes back on the next refresh
   or navigation. Own non-React DOM so it survives Next.js hydration + client-side routing. */
(function () {
  var BADGE_ID = "fp-lc-badge";
  var BUBBLE_ID = "fp-lc-greet";
  var FAB_SEL = ".chat-fab--livechat";
  var GREET_DELAY = 2600;          // ms after landing before the bubble pops
  var dismissed = false;           // per-view close; reset on navigation/refresh

  var GREETING =
    "Hey there, welcome to Fewpips! Got a question about our challenges, rules or payouts? " +
    "Our team is online - tap here and we'll help you out.";

  var X_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var CHAT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  function injectStyles() {
    if (document.getElementById(BADGE_ID + "-css")) return;
    var css = document.createElement("style");
    css.id = BADGE_ID + "-css";
    css.textContent = [
      // red unread badge on the LiveChat FAB
      "#" + BADGE_ID + "{position:absolute;top:-5px;right:-5px;min-width:22px;height:22px;padding:0 6px;",
      "border-radius:11px;background:#ff3b30;color:#fff;font:800 12px/22px var(--font-b,Inter,system-ui,sans-serif);",
      "text-align:center;box-shadow:0 2px 8px #00000059,0 0 0 2px #050505;pointer-events:none;z-index:2;",
      "animation:fpLcPop .35s cubic-bezier(.2,1.4,.4,1) both}",
      "@keyframes fpLcPop{from{transform:scale(0)}to{transform:scale(1)}}",
      // greeting bubble
      "#" + BUBBLE_ID + "{position:fixed;right:22px;bottom:170px;z-index:9999;width:300px;max-width:calc(100vw - 44px);",
      "background:#0d0f0e;color:#fff;border:1px solid #ffffff1f;border-radius:16px;",
      "box-shadow:0 18px 50px #000000a6,0 0 0 1px #00ffc21f;padding:14px 14px 15px;",
      "font-family:var(--font-b,Inter,system-ui,sans-serif);cursor:pointer;",
      "animation:fpLcUp .45s cubic-bezier(.2,.9,.3,1.2) both}",
      "@keyframes fpLcUp{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}",
      "#" + BUBBLE_ID + " .fp-head{display:flex;align-items:center;gap:9px;margin-bottom:9px}",
      "#" + BUBBLE_ID + " .fp-av{width:34px;height:34px;flex:0 0 34px;border-radius:50%;display:flex;align-items:center;",
      "justify-content:center;color:#001a0d;background:linear-gradient(135deg,#00ffc2,#0fcd37);position:relative}",
      "#" + BUBBLE_ID + " .fp-av svg{width:19px;height:19px}",
      "#" + BUBBLE_ID + " .fp-av::after{content:'';position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;",
      "border-radius:50%;background:#22c55e;border:2px solid #0d0f0e}",
      "#" + BUBBLE_ID + " .fp-name{font-size:.9rem;font-weight:800;line-height:1.1}",
      "#" + BUBBLE_ID + " .fp-status{font-size:.72rem;font-weight:600;color:#22c55e}",
      "#" + BUBBLE_ID + " .fp-msg{font-size:.86rem;line-height:1.45;color:#e7e9e8}",
      "#" + BUBBLE_ID + " .fp-x{position:absolute;top:8px;right:9px;width:26px;height:26px;border-radius:50%;",
      "border:none;background:#ffffff14;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;",
      "transition:background .2s,transform .2s}",
      "#" + BUBBLE_ID + " .fp-x:hover{background:#ffffff2b;transform:rotate(90deg)}",
      "#" + BUBBLE_ID + " .fp-x svg{width:15px;height:15px}",
      "#" + BUBBLE_ID + "::after{content:'';position:absolute;right:34px;bottom:-8px;width:16px;height:16px;",
      "background:#0d0f0e;border-right:1px solid #ffffff1f;border-bottom:1px solid #ffffff1f;transform:rotate(45deg)}",
      "@media(max-width:560px){#" + BUBBLE_ID + "{right:14px;bottom:150px;width:270px}}"
    ].join("");
    (document.head || document.documentElement).appendChild(css);
  }

  // Open the real LiveChat window, retrying while the widget script boots.
  function openChat(tries) {
    tries = tries || 0;
    if (window.LiveChatWidget && typeof window.LiveChatWidget.call === "function") {
      try { window.LiveChatWidget.call("maximize"); } catch (e) {}
      dismissForView();
      return;
    }
    if (tries < 30) setTimeout(function () { openChat(tries + 1); }, 200);
  }

  // Hide badge + bubble for the CURRENT view only. They return on the next nav / refresh.
  function dismissForView() {
    dismissed = true;
    clearBadge();
    hideBubble();
  }

  function clearBadge() {
    var b = document.getElementById(BADGE_ID);
    if (b) b.remove();
  }

  function ensureBadge() {
    if (dismissed) return;
    var fab = document.querySelector(FAB_SEL);
    if (!fab) return;
    if (document.getElementById(BADGE_ID)) return;
    if (getComputedStyle(fab).position === "static") fab.style.position = "relative";
    var badge = document.createElement("span");
    badge.id = BADGE_ID;
    badge.textContent = "1";
    badge.setAttribute("aria-hidden", "true");
    fab.appendChild(badge);
  }

  function hideBubble() {
    var el = document.getElementById(BUBBLE_ID);
    if (el) el.remove();
  }

  function showBubble() {
    if (dismissed) return;
    if (!document.querySelector(FAB_SEL)) return; // wait for the FAB to mount
    if (document.getElementById(BUBBLE_ID)) return;
    if (!document.body) return;
    injectStyles();
    var box = document.createElement("div");
    box.id = BUBBLE_ID;
    box.setAttribute("role", "button");
    box.setAttribute("aria-label", "Open live chat");
    box.innerHTML =
      '<button type="button" class="fp-x" aria-label="Dismiss">' + X_SVG + '</button>' +
      '<div class="fp-head"><span class="fp-av">' + CHAT_SVG + '</span>' +
        '<span><span class="fp-name">Fewpips Support</span><br><span class="fp-status">Online now</span></span></div>' +
      '<div class="fp-msg">' + GREETING + '</div>';
    box.addEventListener("click", function (e) {
      if (e.target.closest(".fp-x")) return;
      openChat();
    });
    box.querySelector(".fp-x").addEventListener("click", function (e) {
      e.stopPropagation();
      dismissForView(); // only for this view - comes back on next refresh / navigation
    });
    document.body.appendChild(box);
  }

  // Show badge now + schedule the bubble. Used on first load and on every navigation.
  function present() {
    injectStyles();
    ensureBadge();
    setTimeout(showBubble, GREET_DELAY);
  }

  // On a real page change the greeting must reappear (reset the per-view dismiss).
  function reset() { dismissed = false; present(); }

  // Re-show ONLY when the pathname actually changes (a real page like /futures or / (CFD)).
  // In-page navbar section links (/#about, /#challenges, ...) keep the same pathname and
  // must NOT re-pop the greeting.
  var lastPath = location.pathname;
  function onRouteChange() {
    if (location.pathname === lastPath) return; // same page (section anchor / hash) - ignore
    lastPath = location.pathname;
    reset();
  }

  injectStyles();
  ensureBadge();
  if (document.readyState === "complete") present();
  else window.addEventListener("load", present);
  document.addEventListener("DOMContentLoaded", present);

  // Next.js does client-side routing via the history API - re-show only on real page changes.
  ["pushState", "replaceState"].forEach(function (m) {
    var orig = history[m];
    if (orig && !orig.__fpLcPatched) {
      var patched = function () { var r = orig.apply(this, arguments); setTimeout(onRouteChange, 40); return r; };
      patched.__fpLcPatched = true;
      history[m] = patched;
    }
  });
  window.addEventListener("popstate", onRouteChange);
  window.addEventListener("pageshow", function (e) { if (e && e.persisted) reset(); }); // bfcache restore

  // Fallback guard: keep the badge asserted unless the visitor dismissed it in this view.
  setInterval(ensureBadge, 500);
})();
