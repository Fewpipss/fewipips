/* Fewpips help hub - the branded chat launcher and home panel.

   Replaces the unbranded LiveChat FAB with ONE mascot launcher that opens a hub, the way
   FundedNext's messenger works (the WhatsApp and Telegram FABs in that same React stack
   are already hidden by sticky-split.js, which owns the bottom Discord/Telegram bar):

     Home      mascot header, payout-proof block, "Send us a message", a promo card and
               a "Search for help" block wired to our own FAQ and blog
     Messages  click-by-click topic -> question -> answer, with a "talk to our team"
               hand-off into LiveChat at every step (never an empty text field)
     Help      live search across 73 FAQ answers, 46 blog guides and the key pages

   Content comes from /help-index.json, which scripts/build-help-index.py generates from
   the FAQ chunk and every blog post page - so the widget can never contradict the site.
   The index is fetched on the FIRST open, not on page load, so the hub costs one small
   deferred script and nothing else until someone actually clicks it.

   The bot itself is untouched: "talk to our team" opens the real LiveChat window and
   passes the topic and question as session variables, so the agent sees the context and
   every compliance rule in the bot still applies to the answer.

   Own non-React DOM, re-asserted after hydration and on client-side navigation. */
(function () {
  "use strict";

  var LAUNCH_ID = "fp-hub-launch";
  var PANEL_ID = "fp-hub";
  var AVATAR = "/fewpips-mascot-avatar.webp";
  var INDEX_URL = "/help-index.json";

  var data = null;        // /help-index.json once loaded
  var loading = false;
  var open = false;
  var tab = "home";       // home | msg | help
  var stack = [];         // pushed sub-views: {type:"cat"|"answer", ...}
  var query = "";

  /* ---------------------------------------------------------------- icons */
  function svg(path, fill) {
    return '<svg viewBox="0 0 24 24" fill="' + (fill ? "currentColor" : "none") +
      '" stroke="' + (fill ? "none" : "currentColor") +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + "</svg>";
  }
  var I = {
    close: svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
    back: svg('<polyline points="15 18 9 12 15 6"/>'),
    chev: svg('<polyline points="9 18 15 12 9 6"/>'),
    send: svg('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'),
    search: svg('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
    home: svg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
    msg: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
    help: svg('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    ext: svg('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>'),
    doc: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'),
    // category icons, keyed by the "i" field in help-index.json
    rocket: svg('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>'),
    target: svg('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
    bolt: svg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
    wallet: svg('<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>'),
    plus: svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>'),
    chart: svg('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'),
    users: svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>')
  };

  /* ----------------------------------------------------------------- css */
  function injectStyles() {
    if (document.getElementById("fp-hub-css")) return;
    var css = document.createElement("style");
    css.id = "fp-hub-css";
    css.textContent = [
      // the old three-FAB stack is replaced by the single mascot launcher
      ".chat-widgets{display:none!important}",

      "#" + LAUNCH_ID + "{position:fixed;right:22px;bottom:var(--fph-bottom,24px);z-index:999997;width:62px;height:62px;",
      "border-radius:50%;border:none;padding:0;cursor:pointer;background:linear-gradient(145deg,#00ffc2,#0fcd37);",
      "box-shadow:0 10px 30px #00000073,0 0 0 4px #00ffc21f;display:flex;align-items:center;justify-content:center;",
      "transition:transform .22s cubic-bezier(.2,1.3,.4,1),box-shadow .22s}",
      "#" + LAUNCH_ID + ":hover{transform:scale(1.07);box-shadow:0 14px 36px #0000008c,0 0 0 6px #00ffc22e}",
      "#" + LAUNCH_ID + " img{width:56px;height:56px;border-radius:50%;object-fit:cover;object-position:50% 12%;",
      "background:#06170f;display:block}",
      "#" + LAUNCH_ID + " .fph-x{width:26px;height:26px;color:#04231a;display:none}",
      "#" + LAUNCH_ID + ".is-open img{display:none}",
      "#" + LAUNCH_ID + ".is-open .fph-x{display:block}",

      "#" + PANEL_ID + "{position:fixed;right:22px;bottom:calc(var(--fph-bottom,24px) + 76px);z-index:999998;width:390px;max-width:calc(100vw - 32px);",
      "height:min(640px,calc(100vh - var(--fph-bottom,24px) - 116px));background:#0b0d0c;border:1px solid #ffffff17;border-radius:20px;",
      "box-shadow:0 28px 70px #000000b8,0 0 0 1px #00ffc214;overflow:hidden;display:flex;flex-direction:column;",
      "font-family:var(--font-b,Inter,system-ui,-apple-system,sans-serif);color:#fff;",
      "animation:fphIn .3s cubic-bezier(.2,.9,.3,1.15) both}",
      "@keyframes fphIn{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}",

      // header
      "#" + PANEL_ID + " .fph-head{position:relative;flex:0 0 auto;padding:18px 18px 20px;",
      "background:radial-gradient(130% 140% at 0% 0%,#00ffc23d 0%,transparent 58%),linear-gradient(140deg,#0c4231 0%,#07291f 52%,#04120e 100%);",
      "border-bottom:1px solid #ffffff10}",
      "#" + PANEL_ID + " .fph-head-top{display:flex;align-items:center;gap:10px}",
      "#" + PANEL_ID + " .fph-av{width:40px;height:40px;flex:0 0 40px;border-radius:50%;object-fit:cover;object-position:50% 12%;",
      "background:#06170f;border:1.5px solid #00ffc24d}",
      "#" + PANEL_ID + " .fph-who{flex:1;min-width:0;line-height:1.25}",
      "#" + PANEL_ID + " .fph-who b{display:block;font-size:.88rem;font-weight:800}",
      "#" + PANEL_ID + " .fph-who span{display:flex;align-items:center;gap:5px;font-size:.72rem;font-weight:600;color:#7ff0c9}",
      "#" + PANEL_ID + " .fph-who span::before{content:'';width:7px;height:7px;border-radius:50%;background:#22c55e;",
      "box-shadow:0 0 0 3px #22c55e33}",
      "#" + PANEL_ID + " .fph-ico{width:34px;height:34px;flex:0 0 34px;border-radius:50%;border:none;cursor:pointer;",
      "background:#ffffff14;color:#fff;display:flex;align-items:center;justify-content:center;transition:background .2s}",
      "#" + PANEL_ID + " .fph-ico:hover{background:#ffffff2b}",
      "#" + PANEL_ID + " .fph-ico svg{width:17px;height:17px}",
      "#" + PANEL_ID + " .fph-hi{margin:16px 0 0;font-family:var(--font-h,Poppins,Inter,sans-serif);font-size:1.5rem;",
      "font-weight:800;line-height:1.2;letter-spacing:-.01em}",
      "#" + PANEL_ID + " .fph-hi i{font-style:normal;background:linear-gradient(90deg,#00ffc2,#42ff00);",
      "-webkit-background-clip:text;background-clip:text;color:transparent}",
      "#" + PANEL_ID + " .fph-sub{margin:6px 0 0;font-size:.82rem;color:#ffffffa8;line-height:1.45}",

      // body
      "#" + PANEL_ID + " .fph-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:14px}",
      "#" + PANEL_ID + " .fph-body::-webkit-scrollbar{width:8px}",
      "#" + PANEL_ID + " .fph-body::-webkit-scrollbar-thumb{background:#ffffff1f;border-radius:4px}",

      // cards + rows
      "#" + PANEL_ID + " .fph-card{display:block;width:100%;text-align:left;background:#141716;border:1px solid #ffffff14;",
      "border-radius:15px;color:#fff;font:inherit;cursor:pointer;margin-bottom:10px;text-decoration:none;",
      "transition:border-color .2s,transform .12s,background .2s}",
      "#" + PANEL_ID + " a,#" + PANEL_ID + " a:hover{text-decoration:none;color:inherit}",
      "#" + PANEL_ID + " .fph-card:hover{border-color:#00ffc259;background:#171b19;transform:translateY(-1px)}",
      "#" + PANEL_ID + " .fph-row{display:flex;align-items:center;gap:12px;padding:15px 16px}",
      "#" + PANEL_ID + " .fph-row-t{flex:1;min-width:0}",
      "#" + PANEL_ID + " .fph-row-t b{display:block;font-size:.9rem;font-weight:700;line-height:1.3}",
      "#" + PANEL_ID + " .fph-row-t small{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;",
      "margin-top:3px;font-size:.76rem;color:#ffffff8f;line-height:1.4}",
      "#" + PANEL_ID + " .fph-row svg{width:17px;height:17px;flex:0 0 17px;color:#00ffc2}",
      "#" + PANEL_ID + " .fph-cico{width:34px;height:34px;flex:0 0 34px;border-radius:10px;display:flex;align-items:center;",
      "justify-content:center;background:#00ffc21c;color:#00ffc2}",
      "#" + PANEL_ID + " .fph-cico svg{width:17px;height:17px}",
      "#" + PANEL_ID + " .fph-chip{display:inline-block;padding:3px 8px;border-radius:999px;background:#00ffc21f;",
      "color:#00ffc2;font-size:.66rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;margin-right:6px}",

      // promo card
      "#" + PANEL_ID + " .fph-promo{padding:0;overflow:hidden}",
      "#" + PANEL_ID + " .fph-promo-art{position:relative;height:118px;display:flex;align-items:flex-end;justify-content:flex-end;",
      "background:radial-gradient(90% 120% at 15% 10%,#00ffc23d 0%,transparent 60%),linear-gradient(120deg,#0d3a2c,#061511)}",
      "#" + PANEL_ID + " .fph-promo-art img{height:126px;margin-right:6px;margin-bottom:-6px;filter:drop-shadow(0 8px 20px #000000a6)}",
      "#" + PANEL_ID + " .fph-promo-art b{position:absolute;left:16px;top:18px;max-width:60%;font-family:var(--font-h,Poppins,sans-serif);",
      "font-size:1.3rem;font-weight:900;line-height:1.1;background:linear-gradient(90deg,#00ffc2,#42ff00);",
      "-webkit-background-clip:text;background-clip:text;color:transparent}",
      "#" + PANEL_ID + " .fph-promo-art em{position:absolute;left:16px;top:50px;max-width:56%;font-style:normal;font-size:.72rem;",
      "font-weight:700;line-height:1.5;color:#ffffffb8}",
      "#" + PANEL_ID + " .fph-promo-txt{padding:13px 16px 15px}",

      // search
      "#" + PANEL_ID + " .fph-search{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#101312;",
      "border:1px solid #ffffff17;border-radius:13px;margin-bottom:10px}",
      "#" + PANEL_ID + " .fph-search svg{width:17px;height:17px;flex:0 0 17px;color:#00ffc2}",
      "#" + PANEL_ID + " .fph-search input{flex:1;min-width:0;background:none;border:none;outline:none;color:#fff;",
      "font:600 .88rem/1.3 inherit}",
      "#" + PANEL_ID + " .fph-search input::placeholder{color:#ffffff73;font-weight:600}",
      "#" + PANEL_ID + " .fph-sect{margin:16px 2px 8px;font-size:.68rem;font-weight:800;letter-spacing:.08em;",
      "text-transform:uppercase;color:#ffffff73}",
      "#" + PANEL_ID + " .fph-sect:first-child{margin-top:4px}",
      "#" + PANEL_ID + " .fph-empty{padding:26px 10px;text-align:center;color:#ffffff8f;font-size:.84rem;line-height:1.5}",

      // chat flow
      "#" + PANEL_ID + " .fph-bub{max-width:88%;padding:12px 14px;border-radius:15px 15px 15px 5px;background:#161a19;",
      "border:1px solid #ffffff12;font-size:.86rem;line-height:1.5;color:#eef2f0;margin-bottom:10px;",
      "animation:fphUp .26s ease both}",
      "@keyframes fphUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
      "#" + PANEL_ID + " .fph-bub.me{margin-left:auto;border-radius:15px 15px 5px;background:linear-gradient(135deg,#00ffc2,#0fcd37);",
      "color:#04231a;font-weight:700;border-color:transparent}",
      "#" + PANEL_ID + " .fph-meta{margin:-4px 0 12px;font-size:.68rem;color:#ffffff73;font-weight:600}",
      "#" + PANEL_ID + " .fph-opts{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-bottom:12px}",
      "#" + PANEL_ID + " .fph-opt{padding:9px 14px;border-radius:999px;border:1px solid #00ffc23d;background:#00ffc214;",
      "color:#00ffc2;font:700 .81rem/1.25 inherit;cursor:pointer;text-align:left;transition:background .18s,transform .12s}",
      "#" + PANEL_ID + " .fph-opt:hover{background:#00ffc229;transform:translateY(-1px)}",
      "#" + PANEL_ID + " .fph-opt.ghost{border-color:#ffffff24;background:#ffffff0d;color:#ffffffc7}",
      "#" + PANEL_ID + " .fph-opt.ghost:hover{background:#ffffff1a}",
      "#" + PANEL_ID + " .fph-opt.solid{background:linear-gradient(135deg,#00ffc2,#0fcd37);color:#04231a;border-color:transparent}",

      // nav
      "#" + PANEL_ID + " .fph-nav{flex:0 0 auto;display:flex;border-top:1px solid #ffffff12;background:#0a0c0b}",
      "#" + PANEL_ID + " .fph-nav button{flex:1;border:none;background:none;cursor:pointer;padding:10px 4px 11px;",
      "display:flex;flex-direction:column;align-items:center;gap:4px;color:#ffffff8a;font:700 .7rem/1 inherit;",
      "transition:color .18s}",
      "#" + PANEL_ID + " .fph-nav button svg{width:19px;height:19px}",
      "#" + PANEL_ID + " .fph-nav button.on,#" + PANEL_ID + " .fph-nav button:hover{color:#00ffc2}",

      "#fp-hub-veil{position:fixed;inset:0;z-index:999996;background:#000000a6;backdrop-filter:blur(2px);display:none}",

      "@media(max-width:560px){",
      "#" + PANEL_ID + "{right:0;left:0;bottom:0;width:auto;max-width:none;height:min(90vh,100% - 28px);",
      "border-radius:20px 20px 0 0;border-bottom:none}",
      "#" + LAUNCH_ID + "{right:16px;width:56px;height:56px}",
      "#" + LAUNCH_ID + " img{width:50px;height:50px}",
      "#" + LAUNCH_ID + ".is-open{display:none}",
      "#fp-hub-veil.on{display:block}",
      // the sheet owns the bottom edge on phones
      "html.fph-open #sd-split-bar{display:none!important}",
      "#" + PANEL_ID + " .fph-hi{font-size:1.35rem}",
      "}"
    ].join("");
    (document.head || document.documentElement).appendChild(css);
  }

  /* -------------------------------------------------------------- helpers */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function el(id) { return document.getElementById(id); }

  function catByName(name) {
    if (!data) return null;
    for (var i = 0; i < data.cats.length; i++) if (data.cats[i].n === name) return data.cats[i];
    return null;
  }

  function guide(slug) {
    for (var i = 0; i < data.guides.length; i++) if (data.guides[i].s === slug) return data.guides[i];
    return null;
  }

  // The four questions the home screen offers, one per core topic, with a safe fallback
  // if a category ever gets renamed in the FAQ.
  function topQuestions() {
    var wanted = ["Payouts & funded accounts", "Challenges & rules", "Getting started", "Instant accounts"];
    var out = [], i;
    for (i = 0; i < wanted.length; i++) {
      var c = catByName(wanted[i]);
      if (c && c.items.length) out.push({ cat: c, item: c.items[0] });
    }
    for (i = 0; out.length < 4 && i < data.cats.length; i++) {
      if (data.cats[i].items.length) out.push({ cat: data.cats[i], item: data.cats[i].items[0] });
    }
    return out.slice(0, 4);
  }

  /* ------------------------------------------------------------ live chat */
  // Only 7 pages carry the LiveChat embed in their HTML - the 46 blog posts and the
  // standalone /proof and /reviews pages have none, so a visitor reading a guide had no
  // way to reach support at all. Boot the official loader on demand (public license id,
  // same snippet as index.html): nothing is fetched until someone asks for a human.
  function bootLiveChat() {
    if (window.LiveChatWidget || window.__fphLcBooting) return;
    window.__fphLcBooting = true;
    window.__lc = window.__lc || {};
    window.__lc.license = 19503570;
    window.__lc.integration_name = "manual_channels";
    window.__lc.product_name = "livechat";
    (function (n, t, c) {
      function i(a) { return e._h ? e._h.apply(null, a) : e._q.push(a); }
      var e = {
        _q: [], _h: null, _v: "2.0",
        on: function () { i(["on", c.call(arguments)]); },
        once: function () { i(["once", c.call(arguments)]); },
        off: function () { i(["off", c.call(arguments)]); },
        get: function () {
          if (!e._h) throw new Error("[LiveChatWidget] You can't use getters before load.");
          return i(["get", c.call(arguments)]);
        },
        call: function () { i(["call", c.call(arguments)]); },
        init: function () {
          var s = t.createElement("script");
          s.async = !0; s.type = "text/javascript";
          s.src = "https://cdn.livechatinc.com/tracking.js";
          t.head.appendChild(s);
        }
      };
      e.init();
      n.LiveChatWidget = n.LiveChatWidget || e;
    })(window, document, [].slice);
  }

  // Hand off to the real LiveChat window. The topic and the question travel as session
  // variables so the agent opens the chat already knowing what was clicked.
  function toLiveChat(ctx, tries) {
    tries = tries || 0;
    if (!tries) bootLiveChat();
    if (window.LiveChatWidget && typeof window.LiveChatWidget.call === "function") {
      try {
        if (ctx && (ctx.topic || ctx.question)) {
          window.LiveChatWidget.call("set_session_variables", {
            source: "Help hub",
            topic: ctx.topic || "",
            question: ctx.question || "",
            page: location.pathname
          });
        }
        window.LiveChatWidget.call("maximize");
      } catch (e) {}
      closePanel();
      return;
    }
    if (tries < 40) setTimeout(function () { toLiveChat(ctx, tries + 1); }, 200);
  }

  // The site has a sticky Discord/Telegram bar pinned to the bottom edge (sticky-split.js).
  // Measure it instead of hardcoding a gap, so the launcher never sits on top of it.
  function fitToStickyBar() {
    // the bar is position:fixed, so offsetParent is null even when it is on screen -
    // measure the rect and read display instead
    var bar = document.getElementById("sd-split-bar");
    var h = bar && getComputedStyle(bar).display !== "none" ? Math.round(bar.getBoundingClientRect().height) : 0;
    var want = (h ? h + 16 : 24) + "px";
    if (document.documentElement.style.getPropertyValue("--fph-bottom") !== want) {
      document.documentElement.style.setProperty("--fph-bottom", want);
    }
  }

  // One launcher only: keep LiveChat's own bubble hidden whenever it is minimized.
  function tameLiveChat() {
    if (!window.LiveChatWidget || typeof window.LiveChatWidget.get !== "function") return;
    var st;
    try { st = window.LiveChatWidget.get("state"); } catch (e) { return; }
    if (st && st.visibility === "minimized") {
      try { window.LiveChatWidget.call("hide"); } catch (e) {}
    }
  }

  /* ---------------------------------------------------------------- views */
  function viewHome() {
    var h = "";
    var links = data.links || [];
    var proof = "";
    for (var i = 0; i < links.length; i++) if (links[i].u === "/proof/") proof = links[i].d;

    h += '<a class="fph-card" href="/proof/">' +
         '<div class="fph-row"><span class="fph-cico">' + I.wallet + '</span>' +
         '<span class="fph-row-t"><b>Payout proof - $800K+ paid out</b>' +
         '<small>' + esc(proof || "Every payout certificate we have issued.") + "</small></span>" +
         I.ext + "</div></a>";

    h += '<button class="fph-card" type="button" data-go="msg">' +
         '<div class="fph-row"><span class="fph-cico">' + I.msg + '</span>' +
         '<span class="fph-row-t"><b>Send us a message</b>' +
         "<small>Pick your topic, get the answer in one tap.</small></span>" +
         I.send + "</div></button>";

    h += '<div class="fph-card" style="cursor:default;padding:14px 14px 6px">' +
         '<div class="fph-search" data-go="help" style="margin-bottom:12px;cursor:pointer">' + I.search +
         '<input type="text" placeholder="Search for help" readonly tabindex="-1" aria-hidden="true" ' +
         'style="pointer-events:none;cursor:pointer"></div>';
    var tq = topQuestions();
    for (var j = 0; j < tq.length; j++) {
      h += '<button class="fph-qrow" type="button" data-cat="' + esc(tq[j].cat.n) + '" data-q="' + esc(tq[j].item.q) + '" ' +
           'style="display:flex;width:100%;gap:10px;align-items:center;background:none;border:none;border-top:1px solid #ffffff0f;' +
           'padding:12px 2px;color:#ffffffd6;font:600 .84rem/1.4 inherit;text-align:left;cursor:pointer">' +
           "<span style=\"flex:1\">" + esc(tq[j].item.q) + "</span>" +
           '<span style="flex:0 0 15px;color:#00ffc2;display:flex">' + I.chev + "</span></button>";
    }
    h += "</div>";

    h += '<a class="fph-card fph-promo" href="/reviews/">' +
         '<div class="fph-promo-art"><b>No time limits</b><em>Up to $200K &middot; 70%-90% split &middot; payouts in 24h or less</em>' +
         '<img src="/fewpips-mascot-briefcase-cut-b.webp" alt="" loading="lazy" width="126" height="126"></div>' +
         '<div class="fph-promo-txt"><span class="fph-chip">Reviews</span>' +
         '<div class="fph-row-t" style="margin-top:8px"><b>Rated by real funded traders</b>' +
         "<small>See what traders say about us on 12 independent review platforms.</small></div></div></a>";
    return h;
  }

  function viewMsg() {
    var top = stack.length ? stack[stack.length - 1] : null;
    var h = "";

    if (!top) {
      h += '<div class="fph-bub">Hi trader 👋 Welcome to Fewpips.<br><br>' +
           "Pick a topic and I will answer straight away. Prefer a human? Our team is one tap away at every step.</div>" +
           '<div class="fph-meta">Fewpips Assistant &middot; just now</div>' +
           '<div class="fph-opts">';
      for (var i = 0; i < data.cats.length; i++) {
        h += '<button class="fph-opt" type="button" data-cat="' + esc(data.cats[i].n) + '">' + esc(data.cats[i].n) + "</button>";
      }
      h += '<button class="fph-opt solid" type="button" data-lc="1">Talk to our team</button></div>';
      return h;
    }

    if (top.type === "cat") {
      var c = catByName(top.cat);
      if (!c) { stack = []; return viewMsg(); }
      var limit = top.all ? c.items.length : 8;
      h += '<div class="fph-bub me">' + esc(c.n) + "</div>";
      h += '<div class="fph-bub">Here is what traders ask most about ' + esc(c.n.toLowerCase()) + ". Tap a question for the answer.</div>";
      h += '<div class="fph-opts">';
      for (var k = 0; k < c.items.length && k < limit; k++) {
        h += '<button class="fph-opt" type="button" data-cat="' + esc(c.n) + '" data-q="' + esc(c.items[k].q) + '">' +
             esc(c.items[k].q) + "</button>";
      }
      if (c.items.length > limit) {
        h += '<button class="fph-opt ghost" type="button" data-cat="' + esc(c.n) + '" data-all="1">See all ' + c.items.length + " questions</button>";
      }
      h += '<button class="fph-opt solid" type="button" data-lc="1" data-topic="' + esc(c.n) + '">Ask our team instead</button></div>';
      return h;
    }

    // answer
    var cat = catByName(top.cat);
    h += '<div class="fph-bub me">' + esc(top.q) + "</div>";
    h += '<div class="fph-bub">' + esc(top.a) + "</div>";
    h += '<div class="fph-meta">Fewpips Assistant &middot; from our official rules</div>';
    if (cat && cat.g && cat.g.length) {
      h += '<div class="fph-sect">Read the full guide</div>';
      for (var g = 0; g < cat.g.length && g < 2; g++) {
        var gd = guide(cat.g[g]);
        if (!gd) continue;
        h += '<a class="fph-card" href="/blog/' + esc(gd.s) + '/"><div class="fph-row">' +
             '<span class="fph-cico">' + I.doc + '</span><span class="fph-row-t"><b>' + esc(gd.t) + "</b>" +
             "<small>" + esc(gd.d) + "</small></span>" + I.ext + "</div></a>";
      }
    }
    h += '<div class="fph-opts" style="margin-top:14px">' +
         '<button class="fph-opt ghost" type="button" data-cat="' + esc(top.cat) + '">More ' + esc(String(top.cat).toLowerCase()) + " questions</button>" +
         '<button class="fph-opt solid" type="button" data-lc="1" data-topic="' + esc(top.cat) + '" data-q2="' + esc(top.q) + '">Talk to our team</button></div>';
    return h;
  }

  function score(text, tokens, weight) {
    var t = text.toLowerCase(), s = 0;
    for (var i = 0; i < tokens.length; i++) if (t.indexOf(tokens[i]) !== -1) s += weight;
    return s;
  }

  function viewHelp() {
    return '<div class="fph-search">' + I.search +
           '<input id="fp-hub-q" type="text" placeholder="Search for help" value="' + esc(query) +
           '" autocomplete="off" aria-label="Search for help"></div>' +
           '<div id="fp-hub-res">' + helpResults() + "</div>";
  }

  function helpResults() {
    var h = "";
    var q = query.trim().toLowerCase();
    if (!q) {
      h += '<div class="fph-sect">Browse by topic</div>';
      for (var i = 0; i < data.cats.length; i++) {
        var c = data.cats[i];
        h += '<button class="fph-card" type="button" data-cat="' + esc(c.n) + '"><div class="fph-row">' +
             '<span class="fph-cico">' + (I[c.i] || I.help) + '</span>' +
             '<span class="fph-row-t"><b>' + esc(c.n) + "</b><small>" + c.items.length + " answers</small></span>" +
             I.chev + "</div></button>";
      }
      h += '<div class="fph-sect">Pages that help</div>';
      for (var p = 0; p < data.links.length; p++) {
        h += '<a class="fph-card" href="' + esc(data.links[p].u) + '"><div class="fph-row">' +
             '<span class="fph-cico">' + I.doc + '</span><span class="fph-row-t"><b>' + esc(data.links[p].t) + "</b>" +
             "<small>" + esc(data.links[p].d) + "</small></span>" + I.ext + "</div></a>";
      }
      return h;
    }

    var tokens = q.split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!tokens.length) tokens = [q];
    var answers = [], guides = [], links = [], ci, k;

    for (ci = 0; ci < data.cats.length; ci++) {
      var cat = data.cats[ci];
      for (k = 0; k < cat.items.length; k++) {
        var it = cat.items[k];
        var s = score(it.q, tokens, 4) + score(it.a, tokens, 1) + score(cat.n, tokens, 1);
        if (s) answers.push({ s: s, cat: cat.n, it: it });
      }
    }
    for (k = 0; k < data.guides.length; k++) {
      var g2 = data.guides[k];
      var gs = score(g2.t, tokens, 4) + score(g2.d, tokens, 1) + score(g2.s.replace(/-/g, " "), tokens, 2);
      if (gs) guides.push({ s: gs, g: g2 });
    }
    for (k = 0; k < data.links.length; k++) {
      var l = data.links[k];
      var ls = score(l.t, tokens, 4) + score(l.d, tokens, 1);
      if (ls) links.push({ s: ls, l: l });
    }
    function bys(a, b) { return b.s - a.s; }
    answers.sort(bys); guides.sort(bys); links.sort(bys);

    if (!answers.length && !guides.length && !links.length) {
      return h + '<div class="fph-empty">Nothing matched &ldquo;' + esc(query) + "&rdquo;.<br>Our team can answer it directly.</div>" +
        '<div class="fph-opts"><button class="fph-opt solid" type="button" data-lc="1" data-q2="' + esc(query) + '">Talk to our team</button></div>';
    }

    if (answers.length) {
      h += '<div class="fph-sect">Answers</div>';
      for (k = 0; k < answers.length && k < 6; k++) {
        h += '<button class="fph-card" type="button" data-cat="' + esc(answers[k].cat) + '" data-q="' + esc(answers[k].it.q) + '">' +
             '<div class="fph-row"><span class="fph-row-t"><b>' + esc(answers[k].it.q) + "</b>" +
             "<small>" + esc(answers[k].it.a.slice(0, 110)) + (answers[k].it.a.length > 110 ? "..." : "") + "</small></span>" +
             I.chev + "</div></button>";
      }
    }
    if (guides.length) {
      h += '<div class="fph-sect">Guides</div>';
      for (k = 0; k < guides.length && k < 5; k++) {
        h += '<a class="fph-card" href="/blog/' + esc(guides[k].g.s) + '/"><div class="fph-row">' +
             '<span class="fph-cico">' + I.doc + '</span><span class="fph-row-t"><b>' + esc(guides[k].g.t) + "</b>" +
             "<small>" + esc(guides[k].g.d) + "</small></span>" + I.ext + "</div></a>";
      }
    }
    if (links.length) {
      h += '<div class="fph-sect">Pages</div>';
      for (k = 0; k < links.length && k < 4; k++) {
        h += '<a class="fph-card" href="' + esc(links[k].l.u) + '"><div class="fph-row">' +
             '<span class="fph-cico">' + I.doc + '</span><span class="fph-row-t"><b>' + esc(links[k].l.t) + "</b>" +
             "<small>" + esc(links[k].l.d) + "</small></span>" + I.ext + "</div></a>";
      }
    }
    h += '<div class="fph-opts" style="margin-top:16px">' +
         '<button class="fph-opt solid" type="button" data-lc="1" data-q2="' + esc(query) + '">Still stuck? Talk to our team</button></div>';
    return h;
  }

  /* --------------------------------------------------------------- render */
  function render() {
    var p = el(PANEL_ID);
    if (!p) return;
    var head = p.querySelector(".fph-head");
    var body = p.querySelector(".fph-body");
    var back = stack.length > 0;

    head.querySelector(".fph-back").style.display = back ? "flex" : "none";
    var hi = head.querySelector(".fph-hi"), sub = head.querySelector(".fph-sub");
    if (tab === "home") {
      hi.innerHTML = "Hi trader 👋<br><i>How can we help?</i>";
      sub.textContent = "Answers from our own rules and guides, or a real person in a few minutes.";
      hi.style.display = ""; sub.style.display = "";
    } else if (tab === "msg") {
      hi.innerHTML = "<i>Send us a message</i>";
      sub.textContent = "Tap through to the answer, or hand over to our team at any point.";
      hi.style.display = ""; sub.style.display = "";
    } else {
      hi.innerHTML = "<i>Search for help</i>";
      sub.textContent = "73 answers, 46 guides and every help page on fewpips.com.";
      hi.style.display = ""; sub.style.display = "";
    }

    if (!data) {
      body.innerHTML = '<div class="fph-empty">Loading...</div>';
    } else {
      body.innerHTML = tab === "home" ? viewHome() : tab === "msg" ? viewMsg() : viewHelp();
      body.scrollTop = 0;
    }

    var navs = p.querySelectorAll(".fph-nav button");
    for (var i = 0; i < navs.length; i++) {
      navs[i].classList.toggle("on", navs[i].getAttribute("data-tab") === tab);
    }

    var input = el("fp-hub-q");
    if (input && tab === "help" && !("ontouchstart" in window)) input.focus();
  }

  function go(next) {
    if (next !== tab) { stack = []; }
    tab = next;
    render();
  }

  function showAnswer(catName, qText) {
    var c = catByName(catName);
    if (!c) return;
    for (var i = 0; i < c.items.length; i++) {
      if (c.items[i].q === qText) {
        tab = "msg";
        stack = [{ type: "cat", cat: catName }, { type: "answer", cat: catName, q: c.items[i].q, a: c.items[i].a }];
        render();
        return;
      }
    }
  }

  /* ----------------------------------------------------------------- shell */
  function build() {
    if (el(PANEL_ID)) return;
    injectStyles();

    var veil = document.createElement("div");
    veil.id = "fp-hub-veil";
    veil.addEventListener("click", closePanel);
    document.body.appendChild(veil);

    var p = document.createElement("div");
    p.id = PANEL_ID;
    p.setAttribute("role", "dialog");
    p.setAttribute("aria-label", "Fewpips help");
    p.style.display = "none";
    p.innerHTML =
      '<div class="fph-head">' +
        '<div class="fph-head-top">' +
          '<button class="fph-ico fph-back" type="button" aria-label="Back" style="display:none">' + I.back + "</button>" +
          '<img class="fph-av" src="' + AVATAR + '" alt="" width="40" height="40">' +
          '<span class="fph-who"><b>Fewpips Support</b><span>Online - replies in a few minutes</span></span>' +
          '<button class="fph-ico fph-close" type="button" aria-label="Close">' + I.close + "</button>" +
        "</div>" +
        '<h2 class="fph-hi"></h2><p class="fph-sub"></p>' +
      "</div>" +
      '<div class="fph-body"></div>' +
      '<div class="fph-nav">' +
        '<button type="button" data-tab="home">' + I.home + "Home</button>" +
        '<button type="button" data-tab="msg">' + I.msg + "Messages</button>" +
        '<button type="button" data-tab="help">' + I.help + "Help</button>" +
      "</div>";
    document.body.appendChild(p);

    p.querySelector(".fph-close").addEventListener("click", closePanel);
    p.querySelector(".fph-back").addEventListener("click", function () {
      if (stack.length) { stack.pop(); render(); } else { go("home"); }
    });

    p.addEventListener("click", function (e) {
      var t = e.target.closest("[data-tab],[data-go],[data-lc],[data-cat],[data-q]");
      if (!t || !p.contains(t)) return;

      if (t.hasAttribute("data-tab")) { go(t.getAttribute("data-tab")); return; }
      if (t.hasAttribute("data-go")) { query = ""; go(t.getAttribute("data-go")); return; }
      if (t.hasAttribute("data-lc")) {
        toLiveChat({ topic: t.getAttribute("data-topic") || "", question: t.getAttribute("data-q2") || "" });
        return;
      }
      var cat = t.getAttribute("data-cat");
      var q = t.getAttribute("data-q");
      if (cat && q) { showAnswer(cat, q); return; }
      if (cat) { tab = "msg"; stack = [{ type: "cat", cat: cat, all: t.hasAttribute("data-all") }]; render(); }
    });

    // typing only swaps the results, so the caret and focus stay put
    p.addEventListener("input", function (e) {
      if (!e.target || e.target.id !== "fp-hub-q") return;
      query = e.target.value;
      var res = el("fp-hub-res");
      if (res) res.innerHTML = helpResults();
    });

    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) closePanel(); });
  }

  function ensureLauncher() {
    if (el(LAUNCH_ID)) return;
    if (!document.body) return;
    injectStyles();
    var b = document.createElement("button");
    b.id = LAUNCH_ID;
    b.type = "button";
    b.setAttribute("aria-label", "Open Fewpips help");
    b.innerHTML = '<img src="' + AVATAR + '" alt="" width="56" height="56">' +
                  '<span class="fph-x">' + I.close + "</span>";
    b.addEventListener("click", toggle);
    document.body.appendChild(b);
  }

  function loadData() {
    if (data || loading) return;
    loading = true;
    fetch(INDEX_URL, { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (j) { data = j; loading = false; render(); })
      .catch(function () { loading = false; });
  }

  function openPanel() {
    build();
    var p = el(PANEL_ID);
    p.style.display = "flex";
    open = true;
    var l = el(LAUNCH_ID);
    if (l) l.classList.add("is-open");
    if (window.innerWidth <= 560) el("fp-hub-veil").classList.add("on");
    document.documentElement.classList.add("fph-open");
    loadData();
    render();
  }

  function closePanel() {
    var p = el(PANEL_ID);
    if (p) p.style.display = "none";
    var v = el("fp-hub-veil");
    if (v) v.classList.remove("on");
    open = false;
    document.documentElement.classList.remove("fph-open");
    var l = el(LAUNCH_ID);
    if (l) l.classList.remove("is-open");
  }

  function toggle() { if (open) closePanel(); else openPanel(); }

  // Public handle: livechat-greeting.js and any CTA on the site can open the hub.
  window.FewpipsHub = { open: openPanel, close: closePanel, toggle: toggle, chat: function (ctx) { toLiveChat(ctx || {}); } };

  fitToStickyBar();
  ensureLauncher();
  window.addEventListener("resize", fitToStickyBar);
  document.addEventListener("DOMContentLoaded", ensureLauncher);
  window.addEventListener("load", ensureLauncher);

  // survive Next.js client-side navigation + late hydration
  ["pushState", "replaceState"].forEach(function (m) {
    var orig = history[m];
    if (orig && !orig.__fphPatched) {
      var patched = function () { var r = orig.apply(this, arguments); setTimeout(ensureLauncher, 60); return r; };
      patched.__fphPatched = true;
      history[m] = patched;
    }
  });
  window.addEventListener("popstate", ensureLauncher);
  window.addEventListener("pageshow", ensureLauncher);
  setInterval(function () { ensureLauncher(); fitToStickyBar(); tameLiveChat(); }, 800);
})();
