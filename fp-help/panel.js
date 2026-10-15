/* Fewpips - chat help panel (the FundedNext/Intercom-style "home" in front of LiveChat).
   Loaded on demand by fp-help/fp-help.js (the tiny loader that skins the FAB and catches its
   click), so pages pay nothing for it until the chat is opened.
   The LiveChat FAB opens this panel instead of a bare pre-chat form:
     Home      - Trustpilot review card, "Send us a message", "Search for help", Discord
     Messages  - the REAL LiveChat window, placed inside the panel body (no second window):
                 history, bots, attachments, pre-chat form, routing all stay LiveChat's own
     News      - the promotion live right now + the 3 newest blog posts
     Help      - live search over every FAQ answer and every blog post (fp-help/index.json)
   The promo card (Home + News) reads fp-help/promo.json: the site middleware proxies the
   bot's /promo, which returns ONLY the entry live at this moment from the monthly marketing
   calendar schedule (never a future code). It is re-checked against the visitor's clock.
   A topic or "Chat with our team" opens Messages with the topic as a session variable +
   message draft. The bot and its rules are untouched. Embedding = CSS on LiveChat's own
   #chat-widget-container (the site already resizes it the same way), pinned to the panel's
   chat slot; the panel's tab bar stays under it.
   index.json is rebuilt from the FAQ chunk + blog pages by scripts/help-index.py (deploy gate).
   Own non-React DOM, so it survives hydration + client-side routing. z-index is the max so the
   panel sits above the Discord/Telegram bar (sticky-split.js); it closes before LiveChat opens. */
(function () {
  if (window.__fphPanel) return;

  var BASE = "/fp-help/";
  var FAB_SEL = ".chat-fab--livechat";
  var TP_URL = "https://www.trustpilot.com/evaluate/fewpips.com";
  var DISCORD_URL = "https://discord.gg/hSyvuVYeRN";
  var POPULAR = [
    "When can I request a payout?",
    "What are the core rules for the 1-Step Challenge?",
    "What account sizes are available?",
    "How long does payout processing take?"
  ];
  // Send us a message: each topic maps to a FAQ category (answers) + blog keywords (reading)
  var TOPICS = [
    { id: "buying", label: "Buying an account", cat: "Getting started", kw: "account sizes pay challenge" },
    { id: "rules", label: "Challenge rules", cat: "Challenges & rules", kw: "challenge rules drawdown" },
    { id: "instant", label: "Instant accounts", cat: "Instant accounts", kw: "instant" },
    { id: "payouts", label: "Payouts", cat: "Payouts & funded accounts", kw: "payout withdrawal" },
    { id: "futures", label: "Futures", cat: "Futures", kw: "futures" },
    { id: "addons", label: "Add-ons", cat: "Add-ons", kw: "add-on" },
    { id: "affiliate", label: "Affiliate program", cat: "Affiliate program", kw: "affiliate" },
    { id: "other", label: "Something else", cat: null, kw: "" }
  ];
  var SYN = { withdraw: "payout", withdrawal: "payout", withdrawals: "payout", payouts: "payout",
    ea: "expert", eas: "expert", bot: "expert", dd: "drawdown", crypto: "btc", bitcoin: "btc",
    ethereum: "eth", price: "cost", prices: "cost", fee: "cost", fees: "cost", refund: "refund" };
  var STOP = " a an the is are am do does did can i my me we you your our of to in on for and or with what how when where which who why it its be at as by from this that there any have has will about ".split(" ")
    .reduce(function (o, w) { if (w) o[w] = 1; return o; }, {});

  var S = { open: false, stack: [], idx: null, idxP: null, promo: null, promoP: null, topic: null, built: false,
    chat: false, quiet: false, lcBound: false, slide: 0, timer: null };
  var root, panel;

  var I = {
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.5M12 17.5h.01"/></svg>',
    news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h5"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path fill="#fff" d="m12 3 2.6 6.1 6.6.5-5 4.3 1.5 6.5L12 16.9l-5.7 3.5 1.5-6.5-5-4.3 6.6-.5z"/></svg>',
    discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18 18 0 0 0-5.6 0L8.6 3a19.6 19.6 0 0 0-4.9 1.5C.6 9.1-.3 13.7.1 18.2a19.8 19.8 0 0 0 6 3l1.3-2a12.7 12.7 0 0 1-2-1l.5-.4a14 14 0 0 0 12.2 0l.5.4a12.7 12.7 0 0 1-2 1l1.3 2a19.7 19.7 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.8M8 15.4c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.6 8 10.6s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4m8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4"/></svg>'
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(id) { return document.getElementById(id); }
  function avatar(cls) { return '<span class="fph-av ' + (cls || "") + '"></span>'; }

  // ---- styles ----
  function injectStyles() {
    if (el("fph-css")) return;
    var F = "var(--font-b,Inter,system-ui,sans-serif)", H = "var(--font-h,Poppins,system-ui,sans-serif)";
    var css = document.createElement("style");
    css.id = "fph-css";
    css.textContent = [
      // launcher while the panel is open (its mascot skin lives in the loader)
      FAB_SEL + " .fph-fab-x{position:absolute;inset:0;display:none;align-items:center;justify-content:center;color:#001a0d}",
      FAB_SEL + " .fph-fab-x svg{width:30px;height:30px;opacity:1}",
      FAB_SEL + ".fph-on{background:linear-gradient(135deg,#00ffc2 0%,#0fcd37 100%)!important;box-shadow:0 8px 28px #00000073!important}",
      FAB_SEL + ".fph-on .fph-fab-x{display:flex}",
      // panel shell
      "#fph{position:fixed;right:105px;bottom:90px;z-index:2147483647;width:384px;height:min(680px,calc(100vh - 110px));",
      "display:flex;flex-direction:column;overflow:hidden;background:#0a0a0a;color:#fff;font-family:" + F + ";",
      "border:1px solid #ffffff17;border-radius:20px;box-shadow:0 24px 70px #000000c4,0 0 0 1px #00ffc214;",
      "transform-origin:100% 100%;animation:fphIn .28s cubic-bezier(.2,.9,.3,1.1) both}",
      "@keyframes fphIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}",
      "#fph *{box-sizing:border-box}#fph button{font:inherit;color:inherit;cursor:pointer}",
      "#fph a{color:inherit;text-decoration:none}",
      "#fph .fph-scroll{flex:1;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#ffffff26 transparent}",
      "#fph .fph-ic{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}",
      "#fph .fph-ic svg{width:100%;height:100%}",
      "#fph .fph-iconbtn{width:34px;height:34px;border-radius:50%;border:none;background:#ffffff12;display:flex;align-items:center;justify-content:center;transition:background .2s}",
      "#fph .fph-iconbtn:hover{background:#ffffff26}#fph .fph-iconbtn svg{width:18px;height:18px}",
      "#fph .fph-av{display:inline-block;width:36px;height:36px;border-radius:50%;flex:0 0 auto;",
      "background:#050505 url(" + BASE + "mascot-head.webp) center/cover no-repeat;box-shadow:0 0 0 2px #0fcd37}",
      "#fph .fph-av.sm{width:28px;height:28px}#fph .fph-av.lg{width:42px;height:42px}",
      "#fph .fph-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-right:6px;box-shadow:0 0 0 3px #22c55e2e}",
      "#fph .fph-dot.off{background:#9ca3af;box-shadow:0 0 0 3px #9ca3af26}",
      // home
      "#fph .fph-hero{padding:20px 20px 64px;background:radial-gradient(120% 90% at 90% -10%,#0fcd3766 0%,transparent 58%),radial-gradient(90% 80% at -10% -20%,#00ffc233 0%,transparent 60%),#050505}",
      "#fph .fph-top{display:flex;align-items:center;justify-content:space-between}",
      "#fph .fph-logo{height:22px;width:auto;display:block}",
      "#fph .fph-hero{position:relative;overflow:hidden}",
      "#fph .fph-mascot{position:absolute;right:8px;bottom:44px;width:128px;height:auto;pointer-events:none;filter:drop-shadow(0 10px 24px #0fcd3740)}",
      "#fph .fph-htext{position:relative;max-width:64%;margin-top:28px}",
      "#fph .fph-tagl{display:block;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#00ffc2;margin-bottom:8px}",
      "#fph .fph-pill{display:inline-flex;align-items:center;margin-top:12px;font-size:12px;font-weight:700;color:#ffffffcc;background:#ffffff0f;border:1px solid #ffffff1a;border-radius:999px;padding:5px 10px}",
      "#fph h2.fph-hi{margin:0;font:600 27px/1.2 " + H + ";color:#ffffff8c;letter-spacing:-.01em}",
      "#fph h2.fph-hi b{display:block;color:#fff;font-weight:700}",
      "#fph .fph-cards{padding:0 14px 16px;margin-top:-44px;display:flex;flex-direction:column;gap:12px}",
      "#fph .fph-card{display:block;width:100%;text-align:left;background:#131313;border:1px solid #ffffff14;border-radius:14px;",
      "padding:14px 16px;transition:border-color .2s,transform .2s,background .2s;box-shadow:0 8px 24px #00000059}",
      "#fph a.fph-card:hover,#fph button.fph-card:hover{border-color:#00ffc259;transform:translateY(-1px);background:#161616}",
      "#fph .fph-row{display:flex;align-items:center;gap:12px}",
      "#fph .fph-grow{flex:1;min-width:0}",
      "#fph .fph-t{font-weight:700;font-size:15px;line-height:1.3}",
      "#fph .fph-s{font-size:13px;color:#ffffff99;line-height:1.4;margin-top:2px}",
      "#fph .fph-tp{width:38px;height:38px;border-radius:9px;background:#00b67a;padding:7px}",
      "#fph .fph-go{width:18px;height:18px;color:#ffffff73}",
      "#fph .fph-send{width:38px;height:38px;border-radius:50%;padding:9px;color:#001a0d;background:linear-gradient(135deg,#00ffc2,#0fcd37)}",
      "#fph .fph-dc{width:38px;height:38px;border-radius:9px;padding:8px;background:#5865f2;color:#fff}",
      "#fph .fph-sbox{display:flex;align-items:center;gap:10px;width:100%;border:1px solid #ffffff17;background:#0c0c0c;border-radius:11px;",
      "padding:11px 12px;font-weight:600;font-size:14px;color:#ffffffb3}",
      "#fph .fph-sbox .fph-ic{width:18px;height:18px;color:#00ffc2}",
      "#fph .fph-list{margin:8px 0 0;padding:0;list-style:none}",
      "#fph .fph-li{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:none;background:none;",
      "padding:11px 4px;border-top:1px solid #ffffff0f;font-size:14px;line-height:1.35;color:#ffffffde;border-radius:8px;transition:background .15s,color .15s}",
      "#fph .fph-li:first-child{border-top:none}",
      "#fph .fph-li:hover{color:#00ffc2;background:#ffffff08}",
      "#fph .fph-li .fph-go{width:16px;height:16px}",
      "#fph .fph-li .fph-kind{width:18px;height:18px;color:#ffffff66}",
      // headers for inner views
      "#fph .fph-hd{display:flex;align-items:center;gap:10px;padding:14px 14px 12px;background:#050505;border-bottom:1px solid #ffffff12}",
      "#fph .fph-hd .fph-ht{font:700 16px/1.2 " + H + "}",
      "#fph .fph-hd .fph-hs{font-size:12px;color:#ffffff99;margin-top:2px;display:flex;align-items:center}",
      "#fph .fph-hd.center{justify-content:space-between}",
      "#fph .fph-sinput{display:flex;align-items:center;gap:10px;margin:0 14px 12px;border:1px solid #ffffff1f;background:#121212;border-radius:12px;padding:0 12px;height:46px}",
      "#fph .fph-sinput:focus-within{border-color:#00ffc28c;box-shadow:0 0 0 3px #00ffc21f}",
      "#fph .fph-sinput .fph-ic{width:18px;height:18px;color:#00ffc2}",
      "#fph .fph-sinput input{flex:1;min-width:0;background:none;border:none;outline:none;color:#fff;font:500 15px " + F + "}",
      "#fph .fph-sinput input::placeholder{color:#ffffff73}",
      "#fph .fph-sinput input::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}",
      "#fph .fph-sec{padding:6px 16px 14px}",
      "#fph .fph-lbl{font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ffffff73;margin:12px 0 4px}",
      "#fph .fph-cat{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:#121212;border:1px solid #ffffff12;",
      "border-radius:12px;padding:12px 14px;margin-top:8px;transition:border-color .2s}",
      "#fph .fph-cat:hover{border-color:#00ffc259}",
      "#fph .fph-cnt{font-size:12.5px;color:#ffffff80;font-weight:500}",
      "#fph .fph-post{display:block;background:#121212;border:1px solid #ffffff12;border-radius:12px;padding:12px 14px;margin-top:8px;transition:border-color .2s}",
      "#fph .fph-post:hover{border-color:#00ffc259}",
      "#fph .fph-post .fph-t{font-size:14px}",
      "#fph .fph-post .fph-s{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      "#fph .fph-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.04em;color:#00ffc2;background:#00ffc214;border:1px solid #00ffc233;border-radius:999px;padding:3px 9px}",
      "#fph mark{background:#00ffc22e;color:#fff;border-radius:3px;padding:0 1px}",
      "#fph .fph-empty{padding:24px 8px;text-align:center;color:#ffffffa6;font-size:14px;line-height:1.5}",
      // article
      "#fph .fph-art{padding:18px 18px 8px}",
      "#fph .fph-art h3{margin:12px 0 10px;font:700 20px/1.3 " + H + "}",
      "#fph .fph-art p{margin:0 0 12px;font-size:15px;line-height:1.62;color:#ffffffd9}",
      "#fph .fph-more{display:inline-flex;align-items:center;gap:6px;font-size:13.5px;font-weight:600;color:#00ffc2!important}",
      "#fph .fph-more .fph-ic{width:15px;height:15px}",
      "#fph .fph-foot{padding:12px 14px 14px;border-top:1px solid #ffffff12;background:#0a0a0a}",
      "#fph .fph-foot .fph-s{text-align:center;margin:0 0 9px}",
      "#fph .fph-cta{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;border:none;border-radius:12px;padding:13px 16px;",
      "font-weight:800!important;font-size:15px;color:#001a0d!important;background:linear-gradient(135deg,#00ffc2,#0fcd37);box-shadow:0 8px 22px #0fcd3740;transition:transform .2s,box-shadow .2s}",
      "#fph .fph-cta:hover{transform:translateY(-1px);box-shadow:0 12px 28px #0fcd3759}",
      "#fph .fph-cta .fph-ic{width:18px;height:18px}",
      "#fph .fph-b{display:flex;gap:8px;align-items:flex-end;max-width:92%}",
      "#fph .fph-chips{display:flex;flex-wrap:wrap;gap:8px;padding-left:36px}",
      "#fph .fph-chip{border:1px solid #00ffc259;background:#00ffc20d;color:#00ffc2!important;border-radius:999px;padding:9px 14px;font-weight:700;font-size:13.5px;transition:background .15s,transform .15s}",
      "#fph .fph-chip:hover{background:#00ffc226;transform:translateY(-1px)}",
      "#fph .fph-chip.solid{background:linear-gradient(135deg,#00ffc2,#0fcd37);color:#001a0d!important;border-color:transparent}",
      // promo card (Home + News): the offer live right now
      "#fph .fph-promo{padding:0;overflow:hidden;border-color:#00ffc240}",
      "#fph .fph-pb{display:block;position:relative;padding:16px 16px 14px;background:radial-gradient(110% 120% at 100% 0%,#0fcd3773 0%,transparent 60%),radial-gradient(80% 100% at 0% 100%,#00ffc233 0%,transparent 65%),#06120b;border-bottom:1px solid #00ffc226}",
      "#fph .fph-live{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#001a0d;background:#00ffc2;border-radius:999px;padding:4px 9px}",
      "#fph .fph-live:before{content:'';width:6px;height:6px;border-radius:50%;background:#001a0d;animation:fphPulse 1.6s ease-in-out infinite}",
      "@keyframes fphPulse{50%{opacity:.25}}",
      "#fph .fph-ptitle{display:block;margin:10px 0 10px;font:800 19px/1.2 " + H + ";letter-spacing:.01em;color:#fff}",
      "#fph .fph-code{display:inline-flex;align-items:center;gap:7px;border:1px dashed #00ffc28c;border-radius:9px;padding:6px 10px;background:#00ffc214;color:#00ffc2;font:800 15px/1 " + F + ";letter-spacing:.08em}",
      "#fph .fph-code .fph-ic{width:15px;height:15px}",
      "#fph .fph-code small{font-size:10.5px;font-weight:700;letter-spacing:.1em;color:#00ffc2b3}",
      "#fph .fph-pbody{display:block;padding:12px 16px 14px}",
      "#fph .fph-pline{display:block;font-size:13.5px;line-height:1.5;color:#ffffffd1}",
      "#fph .fph-pfoot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}",
      "#fph .fph-pclose{font-size:12px;color:#ffffff8c;font-weight:600}",
      "#fph .fph-pcta{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:8px 14px;font-weight:800;font-size:13px;color:#001a0d;background:linear-gradient(135deg,#00ffc2,#0fcd37);white-space:nowrap}",
      "#fph .fph-pcta .fph-ic{width:14px;height:14px}",
      // news
      "#fph .fph-nhd{display:flex;align-items:center;justify-content:space-between;padding:16px 16px 12px;background:#050505;border-bottom:1px solid #ffffff12}",
      "#fph .fph-nhd b{display:block;font:700 18px/1.2 " + H + "}#fph .fph-nhd span{font-size:12.5px;color:#ffffff99}",
      "#fph .fph-news{padding:14px 14px 18px;display:flex;flex-direction:column;gap:12px}",
      "#fph .fph-ni{display:block;background:#131313;border:1px solid #ffffff14;border-radius:14px;padding:14px 16px;transition:border-color .2s,transform .2s}",
      "#fph .fph-ni:hover{border-color:#00ffc259;transform:translateY(-1px)}",
      "#fph .fph-tags{display:flex;gap:6px;margin-bottom:8px}",
      "#fph .fph-tg{font-size:11px;font-weight:700;border-radius:999px;padding:3px 9px;color:#00ffc2;background:#00ffc214;border:1px solid #00ffc233}",
      "#fph .fph-tg.dim{color:#ffffffa6;background:#ffffff0d;border-color:#ffffff1a}",
      "#fph .fph-ni .fph-t{display:block;font-size:15px}",
      "#fph .fph-ni .fph-s{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      "#fph .fph-nread{display:inline-flex;align-items:center;gap:4px;margin-top:9px;font-size:13px;font-weight:700;color:#00ffc2}",
      "#fph .fph-nread .fph-ic{width:14px;height:14px}",
      "#fph .fph-tab{position:relative}",
      "#fph .fph-tab .fph-pip{position:absolute;top:5px;left:calc(50% + 7px);width:8px;height:8px;border-radius:50%;background:#ff3b3b;box-shadow:0 0 0 2px #080808}",
      // home: promo carousel
      "#fph .fph-car{position:relative;width:100%;min-width:0}",
      "#fph .fph-track{display:flex;width:100%;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;border-radius:14px}",
      "#fph .fph-track::-webkit-scrollbar{display:none}",
      "#fph .fph-track>*{flex:0 0 100%;min-width:100%;scroll-snap-align:start;margin:0;box-shadow:none}",
      "#fph .fph-dots{display:flex;justify-content:center;gap:6px;margin-top:9px}",
      "#fph .fph-dotb{width:7px;height:7px;padding:0;border:none;border-radius:999px;background:#ffffff33;transition:width .2s,background .2s}",
      "#fph .fph-dotb.on{width:20px;background:#00ffc2}",
      "#fph .fph-bn{display:flex;flex-direction:column;padding:0;overflow:hidden}",
      "#fph .fph-bn picture,#fph .fph-bn img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;background:#06120b}",
      "#fph .fph-bn .fph-pfoot{margin:0;padding:11px 16px 13px}",
      "#fph .fph-bn .fph-pclose{color:#ffffffc7;font-size:12.5px;line-height:1.35}",
      // home: topics that open the chat with the question started
      "#fph .fph-topics{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}",
      "#fph .fph-topics .fph-chip{padding:7px 11px;font-size:12.5px}",
      // messages = the real LiveChat window inside the panel
      "#fph .fph-chat{flex:1;display:flex;flex-direction:column;min-height:0;background:#0a0a0a}",
      "#fph .fph-strip{display:flex;align-items:center;gap:9px;padding:9px 12px;background:#06120b;border-bottom:1px solid #00ffc226;font-size:12.5px;line-height:1.35;color:#eafff6}",
      "#fph .fph-strip .fph-live{flex:0 0 auto;font-size:10px;padding:3px 7px}",
      "#fph .fph-strip .fph-pcta{padding:6px 11px;font-size:12px}",
      "#fph .fph-slot{flex:1;min-height:0;position:relative;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:#ffffffa6;font-size:14px}",
      "#fph .fph-spin{display:block;width:26px;height:26px;margin:0 auto 12px;border-radius:50%;border:3px solid #00ffc233;border-top-color:#00ffc2;animation:fphSpin .8s linear infinite}",
      "@keyframes fphSpin{to{transform:rotate(360deg)}}",
      "html.fph-chat-on #fph{z-index:2147483646}",
      "html.fph-chat-on #chat-widget-container{left:var(--fph-cx)!important;top:var(--fph-cy)!important;right:auto!important;bottom:auto!important;" +
        "width:var(--fph-cw)!important;height:var(--fph-ch)!important;max-width:none!important;max-height:none!important;min-height:0!important;z-index:2147483647!important}",
      // bottom tabs
      "#fph .fph-nav{display:flex;border-top:1px solid #ffffff12;background:#080808;padding:6px 8px 8px}",
      "#fph .fph-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;border:none;background:none;padding:7px 0 3px;",
      "font-size:12px;font-weight:700;color:#ffff;opacity:.55;border-radius:10px;transition:opacity .15s,background .15s}",
      "#fph .fph-tab .fph-ic{width:22px;height:22px}",
      "#fph .fph-tab:hover{opacity:.85;background:#ffffff08}",
      "#fph .fph-tab.on{opacity:1;color:#00ffc2}",
      "@media(max-width:768px){#fph{right:86px;bottom:80px;width:360px;height:min(680px,calc(100vh - 100px))}}",
      "@media(max-width:560px){#fph{inset:0;width:100%;height:100%;height:100dvh;border-radius:0;border:none;animation-name:fphUp}",
      "html.fph-lock,html.fph-lock body{overflow:hidden!important}}",
      "@keyframes fphUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}",
      "@media(prefers-reduced-motion:reduce){#fph{animation:none}#fph .fph-live:before{animation:none}#fph .fph-track{scroll-behavior:auto}}"
    ].join("");
    (document.head || document.documentElement).appendChild(css);
  }

  // ---- data ----
  function loadIndex() {
    if (S.idx) return Promise.resolve(S.idx);
    if (!S.idxP) {
      S.idxP = fetch(BASE + "index.json").then(function (r) { return r.json(); })
        .then(function (d) { S.idx = d; return d; })
        .catch(function () { S.idxP = null; return null; });
    }
    return S.idxP;
  }
  // The live promotion, or null. The endpoint already returns only the live entry; the
  // visitor's clock is checked again so a cached response never shows an expired code.
  function livePromos() {
    var now = Date.now();
    return (S.promo || []).filter(function (p) {
      return p && (p.code || p.img) && Date.parse(p.active_from) <= now && now < Date.parse(p.active_until);
    });
  }
  function livePromo() { return livePromos()[0] || null; }
  function codePromo() { return livePromos().filter(function (p) { return p.code; })[0] || null; }
  function loadPromo() {
    if (S.promo) return Promise.resolve(livePromo());
    if (!S.promoP) {
      S.promoP = fetch(BASE + "promo.json", { credentials: "omit" }).then(function (r) { return r.ok ? r.json() : []; })
        .then(function (d) { S.promo = Array.isArray(d) ? d : []; return livePromo(); })
        .catch(function () { S.promo = []; return null; });
    }
    return S.promoP;
  }
  function faqIndex(q) {
    if (!S.idx) return -1;
    for (var i = 0; i < S.idx.faq.length; i++) if (S.idx.faq[i].q === q) return i;
    return -1;
  }
  function tokens(s) {
    return String(s).toLowerCase().replace(/[’']/g, "").split(/[^a-z0-9%$.+-]+/)
      .map(function (t) { return t.replace(/^[.+-]+|[.+-]+$/g, ""); })
      .filter(function (t) { return t.length > 1 && !STOP[t]; })
      .map(function (t) { return SYN[t] || t; });
  }
  function score(title, body, qt) {
    var T = title.toLowerCase(), B = body.toLowerCase(), s = 0, hit = 0;
    qt.forEach(function (t) {
      if (T.indexOf(t) > -1) { s += 4; hit++; } else if (B.indexOf(t) > -1) { s += 1; hit++; }
    });
    if (!hit || hit < Math.ceil(qt.length / 2)) return 0;
    return s + hit * 2;
  }
  function search(q, limitFaq, limitPost) {
    var qt = tokens(q), faq = [], posts = [];
    if (!qt.length || !S.idx) return { faq: faq, posts: posts };
    var seen = {};
    S.idx.faq.forEach(function (f, i) {
      if (seen[f.q]) return; // a few answers sit in two categories (CFD + Futures)
      seen[f.q] = 1;
      var sc = score(f.q, f.a, qt);
      if (sc) faq.push({ i: i, sc: sc });
    });
    S.idx.blog.forEach(function (b, i) { var sc = score(b.t, b.d, qt); if (sc) posts.push({ i: i, sc: sc }); });
    var by = function (a, b) { return b.sc - a.sc || a.i - b.i; };
    return { faq: faq.sort(by).slice(0, limitFaq), posts: posts.sort(by).slice(0, limitPost) };
  }
  function mark(text, q) {
    var out = esc(text), qt = tokens(q || "");
    qt.forEach(function (t) {
      if (t.length < 3) return;
      out = out.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>");
    });
    return out;
  }

  // ---- LiveChat ----
  function chatStatus() {
    try {
      var st = window.LiveChatWidget && window.LiveChatWidget.get && window.LiveChatWidget.get("state");
      if (st && st.availability) return st.availability;
    } catch (e) {}
    return null;
  }
  function statusHtml() {
    var a = chatStatus();
    if (a === "online") return '<span class="fph-dot"></span>Our team is online';
    if (a === "offline") return '<span class="fph-dot off"></span>Leave us a message, we reply by email';
    return '<span class="fph-dot"></span>We are here to help';
  }
  // ---- the real LiveChat window, inside the panel ----
  function lc() { return window.LiveChatWidget; }
  function placeChat() {
    var slot = el("fph-chat-slot");
    if (!slot) return;
    var r = slot.getBoundingClientRect(), d = document.documentElement.style;
    d.setProperty("--fph-cx", Math.round(r.left) + "px");
    d.setProperty("--fph-cy", Math.round(r.top) + "px");
    d.setProperty("--fph-cw", Math.round(r.width) + "px");
    d.setProperty("--fph-ch", Math.round(r.height) + "px");
  }
  function bindLc() {
    var w = lc();
    if (S.lcBound || !w || !w.on) return;
    S.lcBound = true;
    // LiveChat's own minimize button = the visitor is done: close the whole panel
    w.on("visibility_changed", function (d) {
      if (d && d.visibility === "minimized" && S.chat && !S.quiet) close();
    });
  }
  function mountChat() {
    var w = lc(), topic = S.topic;
    S.topic = null;
    S.chat = true;
    placeChat();
    document.documentElement.classList.add("fph-chat-on");
    // LiveChat loads on the first pointer/scroll/key event (site perf snippet). Opening the chat
    // is that intent, so fire the snippet's own trigger once instead of loading it a second time.
    if (!document.querySelector('script[src*="livechatinc.com/tracking.js"]')) {
      try { window.dispatchEvent(new Event("pointermove")); } catch (e) {}
    }
    if (!w || typeof w.call !== "function") return chatFallback();
    bindLc();
    try {
      if (topic) w.call("set_session_variables", { help_topic: topic });
      w.call("maximize", topic ? { messageDraft: "Hi, I have a question about " + topic.toLowerCase() + ": " } : undefined);
    } catch (e) { return chatFallback(); }
    setTimeout(function () {             // LiveChat never showed up (blocked, offline network)
      if (!S.chat) return;
      var c = document.getElementById("chat-widget-container");
      if (!c || c.offsetHeight < 50) chatFallback();
    }, 12000);
  }
  function unmountChat() {
    if (!S.chat) return;
    S.chat = false;
    document.documentElement.classList.remove("fph-chat-on");
    var w = lc();
    S.quiet = true; // our own minimize must not close the panel
    try { w && w.call && w.call("minimize"); } catch (e) {}
    setTimeout(function () { S.quiet = false; }, 400);
  }
  function chatFallback() {
    var slot = el("fph-chat-slot");
    if (slot) slot.innerHTML = '<div><div class="fph-s" style="margin:0 0 12px">The chat is taking longer than usual to load.</div>' +
      '<a class="fph-more" href="/contact/">Contact the team<span class="fph-ic">' + I.chev + "</span></a></div>";
  }
  window.addEventListener("resize", function () { if (S.chat) placeChat(); });

  // ---- views ----
  function nav(tab) {
    function t(id, icon, label) {
      var pip = id === "news" && tab !== "news" && livePromo() ? '<span class="fph-pip" aria-hidden="true"></span>' : "";
      return '<button type="button" class="fph-tab' + (tab === id ? " on" : "") + '" data-a="tab" data-v="' + id + '">' +
        '<span class="fph-ic">' + I[icon] + "</span>" + label + pip + "</button>";
    }
    return '<nav class="fph-nav">' + t("home", "home", "Home") + t("message", "chat", "Messages") + t("news", "news", "News") + t("help", "help", "Help") + "</nav>";
  }
  function promoCard(p) {
    return '<a class="fph-card fph-promo" href="' + esc(p.url) + '" target="_blank" rel="noopener" data-promo="' + esc(p.id) + '">' +
      '<span class="fph-pb"><span class="fph-live">Live offer</span><span class="fph-ptitle">' + esc(p.title || p.code) + "</span>" +
      '<span class="fph-code"><span class="fph-ic">' + I.tag + "</span><small>CODE</small>" + esc(p.code) + "</span></span>" +
      '<span class="fph-pbody"><span class="fph-pline">' + esc(p.line) + "</span>" +
      '<span class="fph-pfoot"><span class="fph-pclose">' + (p.closes ? "Ends " + esc(p.closes) : "") + "</span>" +
      '<span class="fph-pcta">' + esc(p.cta || "Get funded") + '<span class="fph-ic">' + I.chev + "</span></span></span></span></a>";
  }
  function bannerCard(p, lazy) {
    var webp = function (u) { return String(u || "").replace(/\.(png|jpe?g)$/, ".webp"); };
    var src = p.imgM || p.img;
    return '<a class="fph-card fph-bn" href="' + esc(p.url) + '" target="_blank" rel="noopener" data-promo="' + esc(p.id) + '">' +
      '<picture><source type="image/webp" srcset="' + esc(webp(src)) + '"><img src="' + esc(src) + '" alt="' + esc(p.title || "") + '"' +
      (lazy ? ' loading="lazy"' : "") + ' decoding="async"></picture>' +
      '<span class="fph-pfoot"><span class="fph-pclose">' + esc(p.title || "") + '</span><span class="fph-pcta">' + esc(p.cta || "Get funded") +
      '<span class="fph-ic">' + I.chev + "</span></span></span></a>";
  }
  function anyCard(p, i) { return p.code ? promoCard(p) : bannerCard(p, i > 0); }
  function carousel() {
    var ps = livePromos();
    if (!ps.length) return "";
    if (ps.length === 1) return anyCard(ps[0], 0);
    return '<div class="fph-car"><div class="fph-track" id="fph-track">' + ps.map(anyCard).join("") + "</div>" +
      '<div class="fph-dots">' + ps.map(function (_, i) {
        return '<button type="button" class="fph-dotb' + (i === 0 ? " on" : "") + '" data-a="slide" data-v="' + i + '" aria-label="Offer ' + (i + 1) + '"></button>';
      }).join("") + "</div></div>";
  }
  function startCarousel() {
    clearInterval(S.timer);
    var tr = el("fph-track");
    if (!tr) return;
    var n = tr.children.length, paused = false;
    function dots() {
      var i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth));
      [].forEach.call(root.querySelectorAll(".fph-dotb"), function (b, k) { b.classList.toggle("on", k === i); });
      S.slide = i;
    }
    tr.addEventListener("scroll", function () { requestAnimationFrame(dots); }, { passive: true });
    ["pointerenter", "touchstart", "focusin"].forEach(function (t) { tr.addEventListener(t, function () { paused = true; }, { passive: true }); });
    tr.addEventListener("pointerleave", function () { paused = false; });
    if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    S.timer = setInterval(function () {
      if (paused || !el("fph-track")) return;
      tr.scrollTo({ left: ((S.slide + 1) % n) * tr.clientWidth, behavior: "smooth" });
    }, 6000);
  }
  function promoStrip(p) {
    return '<a class="fph-strip" href="' + esc(p.url) + '" target="_blank" rel="noopener"><span class="fph-live">Live</span>' +
      '<span class="fph-grow">' + esc(p.short || p.line) + '</span><span class="fph-pcta">' + esc(p.cta || "Get funded") + "</span></a>";
  }
  function fmtDate(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || "");
    if (!m) return "";
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+m[2] - 1] + " " + (+m[3]) + ", " + m[1];
  }
  function vNews() {
    var items = livePromos().map(anyCard).join("");
    if (S.idx) {
      S.idx.blog.slice().sort(function (a, b) { return a.p < b.p ? 1 : a.p > b.p ? -1 : 0; }).slice(0, 3).forEach(function (b) {
        items += '<a class="fph-ni" href="' + esc(b.u) + '"><span class="fph-tags"><span class="fph-tg">Blog</span>' +
          (b.p ? '<span class="fph-tg dim">' + fmtDate(b.p) + "</span>" : "") + "</span>" +
          '<span class="fph-t">' + esc(b.t) + '</span><span class="fph-s">' + esc(b.d) + "</span>" +
          '<span class="fph-nread">Read the article<span class="fph-ic">' + I.chev + "</span></span></a>";
      });
    } else items += '<div class="fph-empty">Loading the latest...</div>';
    return '<div class="fph-nhd"><span class="fph-row" style="gap:10px">' + avatar() + '<span><b>Latest</b><span>From the Fewpips team</span></span></span>' + closeBtn() + "</div>" +
      '<div class="fph-scroll"><div class="fph-news">' + items +
      '<a class="fph-more" href="/blog/" style="justify-content:center;margin-top:4px">All articles<span class="fph-ic">' + I.chev + "</span></a></div></div>" + nav("news");
  }
  function closeBtn() { return '<button type="button" class="fph-iconbtn" data-a="close" aria-label="Close">' + I.x + "</button>"; }
  function backBtn() { return '<button type="button" class="fph-iconbtn" data-a="back" aria-label="Back">' + I.back + "</button>"; }

  function vHome() {
    var pop = POPULAR.map(function (q) {
      return '<li><button type="button" class="fph-li" data-a="faqq" data-q="' + esc(q) + '"><span class="fph-grow">' + esc(q) +
        '</span><span class="fph-ic fph-go">' + I.chev + "</span></button></li>";
    }).join("");
    var topics = TOPICS.filter(function (t) { return t.cat; }).map(function (t) {
      return '<button type="button" class="fph-chip" data-a="topic" data-v="' + t.id + '">' + esc(t.label) + "</button>";
    }).join("");
    return '<div class="fph-scroll"><div class="fph-hero"><div class="fph-top"><img class="fph-logo" src="/fewpips-logo.png" alt="Fewpips">' + closeBtn() + "</div>" +
      '<img class="fph-mascot" src="' + BASE + 'mascot-hero.webp" alt="" aria-hidden="true" width="152" height="180">' +
      '<div class="fph-htext"><span class="fph-tagl">Funded by discipline</span>' +
      '<h2 class="fph-hi">Hey trader <span aria-hidden="true">👋</span><b>How can we help?</b></h2>' +
      '<span class="fph-pill fph-st">' + statusHtml() + "</span></div></div>" +
      '<div class="fph-cards">' + carousel() +
        '<div class="fph-card"><button type="button" class="fph-row" data-a="tab" data-v="message" style="width:100%;border:none;background:none;padding:0;text-align:left">' +
          '<span class="fph-grow"><span class="fph-t" style="display:block">Send us a message</span>' +
          '<span class="fph-s fph-st" style="display:flex;align-items:center">' + statusHtml() + '</span></span><span class="fph-ic fph-send">' + I.send + "</span></button>" +
          '<div class="fph-topics">' + topics + "</div></div>" +
        '<div class="fph-card"><button type="button" class="fph-sbox" data-a="tab" data-v="help"><span class="fph-grow" style="text-align:left">Search for help</span><span class="fph-ic">' + I.search + "</span></button>" +
          '<ul class="fph-list">' + pop + "</ul></div>" +
        '<a class="fph-card fph-row" href="' + TP_URL + '" target="_blank" rel="noopener"><span class="fph-ic fph-tp">' + I.star + '</span>' +
          '<span class="fph-grow"><span class="fph-t" style="display:block">Enjoying Fewpips?</span><span class="fph-s" style="display:block">Leave us a review on Trustpilot</span></span>' +
          '<span class="fph-ic fph-go">' + I.out + "</span></a>" +
        '<a class="fph-card fph-row" href="' + DISCORD_URL + '" target="_blank" rel="noopener"><span class="fph-ic fph-dc">' + I.discord + '</span>' +
          '<span class="fph-grow"><span class="fph-t" style="display:block">Join our Discord</span><span class="fph-s" style="display:block">Talk with other Fewpips traders</span></span>' +
          '<span class="fph-ic fph-go">' + I.out + "</span></a>" +
      "</div></div>" + nav("home");
  }

  function vMessage() {
    var p = codePromo();
    return '<div class="fph-chat">' + (p ? promoStrip(p) : "") +
      '<div class="fph-slot" id="fph-chat-slot"><div><span class="fph-spin"></span>Opening the chat with the Fewpips team...</div></div></div>' + nav("message");
  }

  function postCard(b, q) {
    return '<a class="fph-post" href="' + esc(b.u) + '"><span class="fph-row" style="gap:8px;margin-bottom:4px"><span class="fph-ic" style="width:15px;height:15px;color:#00ffc2">' + I.doc +
      '</span><span class="fph-cnt">Article</span></span><span class="fph-t" style="display:block">' + mark(b.t, q) + '</span><span class="fph-s">' + esc(b.d) + "</span></a>";
  }

  function vHelp(st) {
    return '<div class="fph-hd center" style="border-bottom:none;padding-bottom:12px"><span style="width:34px"></span><div class="fph-ht">Help</div>' + closeBtn() + "</div>" +
      '<div style="background:#050505;padding-top:2px;border-bottom:1px solid #ffffff12"><label class="fph-sinput"><span class="fph-ic">' + I.search + '</span>' +
      '<input id="fph-q" type="search" placeholder="Search for help" autocomplete="off" value="' + esc(st.q || "") + '" aria-label="Search for help"></label></div>' +
      '<div class="fph-scroll"><div class="fph-sec" id="fph-results"></div></div>' + nav("help");
  }
  function renderResults(q) {
    var box = el("fph-results");
    if (!box) return;
    if (!S.idx) {
      box.innerHTML = '<div class="fph-empty">Loading answers...</div>';
      loadIndex().then(function (d) { if (d) renderResults(q); else box.innerHTML = '<div class="fph-empty">Could not load help right now.<br><a class="fph-more" href="/faq/">Open the FAQ</a></div>'; });
      return;
    }
    if (!q || !tokens(q).length) {
      var cats = [];
      S.idx.faq.forEach(function (f) { if (cats.indexOf(f.c) < 0) cats.push(f.c); });
      var latest = S.idx.blog.slice().sort(function (a, b) { return a.p < b.p ? 1 : a.p > b.p ? -1 : 0; }).slice(0, 4);
      box.innerHTML = '<div class="fph-lbl">Browse by topic</div>' + cats.map(function (c) {
        var n = S.idx.faq.filter(function (f) { return f.c === c; }).length;
        return '<button type="button" class="fph-cat" data-a="cat" data-v="' + esc(c) + '"><span class="fph-grow"><span class="fph-t" style="display:block;font-size:14.5px">' + esc(c) +
          '</span><span class="fph-cnt">' + n + " answers</span></span><span class=\"fph-ic fph-go\">" + I.chev + "</span></button>";
      }).join("") + '<div class="fph-lbl" style="margin-top:20px">Latest from the blog</div>' + latest.map(function (b) { return postCard(b); }).join("");
      return;
    }
    var r = search(q, 5, 4), h = "";
    if (r.faq.length) {
      h += '<div class="fph-lbl">Answers</div><ul class="fph-list" style="margin:0">' + r.faq.map(function (x) {
        var f = S.idx.faq[x.i];
        return '<li><button type="button" class="fph-li" data-a="faq" data-v="' + x.i + '"><span class="fph-ic fph-kind">' + I.help + '</span><span class="fph-grow">' + mark(f.q, q) +
          '<span class="fph-cnt" style="display:block;margin-top:2px">' + esc(f.c) + "</span></span><span class=\"fph-ic fph-go\">" + I.chev + "</span></button></li>";
      }).join("") + "</ul>";
    }
    if (r.posts.length) h += '<div class="fph-lbl" style="margin-top:18px">Articles</div>' + r.posts.map(function (x) { return postCard(S.idx.blog[x.i], q); }).join("");
    if (!h) h = '<div class="fph-empty">No results for "' + esc(q) + '".<br>Our team can help with that.</div>';
    h += '<div style="margin-top:18px"><button type="button" class="fph-cta" data-a="chat"><span class="fph-ic">' + I.chat + "</span>Chat with our team</button></div>";
    box.innerHTML = h;
  }

  function vCat(st) {
    var list = "";
    if (S.idx) S.idx.faq.forEach(function (f, i) {
      if (f.c === st.c) list += '<li><button type="button" class="fph-li" data-a="faq" data-v="' + i + '"><span class="fph-grow">' + esc(f.q) +
        '</span><span class="fph-ic fph-go">' + I.chev + "</span></button></li>";
    });
    return '<div class="fph-hd">' + backBtn() + '<div class="fph-grow fph-ht">' + esc(st.c) + "</div>" + closeBtn() + "</div>" +
      '<div class="fph-scroll"><div class="fph-sec"><ul class="fph-list">' + list + "</ul></div></div>" + nav(st.tab);
  }

  function vFaq(st) {
    var f = S.idx && S.idx.faq[st.i];
    if (!f) return vHelp({ q: "" });
    var paras = esc(f.a).replace(/\s(\d\))\s/g, "\n$1 ").split(/\n+/).map(function (p) { return "<p>" + p + "</p>"; }).join("");
    var hits = search(f.q, 0, 2).posts;
    if (!hits.length) TOPICS.forEach(function (t) { if (t.cat === f.c) hits = search(t.kw, 0, 2).posts; });
    var rel = hits.map(function (p) { return postCard(S.idx.blog[p.i]); }).join("");
    return '<div class="fph-hd">' + backBtn() + '<div class="fph-grow"></div>' + closeBtn() + "</div>" +
      '<div class="fph-scroll"><div class="fph-art"><span class="fph-tag">' + esc(f.c) + "</span><h3>" + esc(f.q) + "</h3>" + paras +
      '<a class="fph-more" href="/faq/">Read the full FAQ<span class="fph-ic">' + I.chev + "</span></a>" +
      (rel ? '<div class="fph-lbl" style="margin-top:22px">Related reading</div>' + rel : "") + "</div></div>" +
      '<div class="fph-foot"><div class="fph-s">Still need help?</div><button type="button" class="fph-cta" data-a="chat"><span class="fph-ic">' + I.chat + "</span>Chat with our team</button></div>";
  }

  // ---- navigation ----
  function top() { return S.stack[S.stack.length - 1]; }
  function go(st, replace) {
    if (replace) S.stack = [st]; else S.stack.push(st);
    render();
  }
  function render() {
    var st = top();
    if (st.v !== "message") unmountChat();
    clearInterval(S.timer);
    panel.setAttribute("data-view", st.v);
    panel.innerHTML = st.v === "home" ? vHome() : st.v === "message" ? vMessage() : st.v === "news" ? vNews() : st.v === "help" ? vHelp(st) :
      st.v === "cat" ? vCat(st) : vFaq(st);
    if (st.v === "help") {
      var inp = el("fph-q");
      renderResults(st.q || "");
      inp.addEventListener("input", function () { st.q = inp.value; renderResults(inp.value); });
      if (st.focus !== false && window.matchMedia("(min-width:561px)").matches) setTimeout(function () { inp.focus(); }, 30);
    }
    if (st.v === "message") mountChat();
    if (st.v === "home") startCarousel();
    if ((st.v === "faq" || st.v === "cat" || st.v === "news") && !S.idx) loadIndex().then(function () { if (top() === st) render(); });
    // the promo arrives after the first paint of the panel: redraw once it is known
    // (whole view only on Home/News; elsewhere just the tab bar, so a search in progress keeps its text)
    if (!S.promo) loadPromo().then(function (p) {
      if (!p || !S.open || top() !== st) return;
      if (st.v === "home" || st.v === "news") return render();
      if (st.v === "message" && !el("fph-chat-slot").previousElementSibling && codePromo()) {
        el("fph-chat-slot").insertAdjacentHTML("beforebegin", promoStrip(codePromo()));
        placeChat();
      }
      var n = panel.querySelector(".fph-nav");
      if (n) n.outerHTML = nav(st.tab);
    });
  }
  function onClick(e) {
    var b = e.target.closest("[data-a]");
    if (!b) return;
    var a = b.getAttribute("data-a"), v = b.getAttribute("data-v");
    if (a === "close") close();
    else if (a === "tab") go({ v: v, tab: v }, true);
    else if (a === "back") { if (S.stack.length > 1) { S.stack.pop(); render(); } else go({ v: "home", tab: "home" }, true); }
    else if (a === "topic") { S.topic = topicLabel(v); go({ v: "message", tab: "message" }, true); }
    else if (a === "chat") { S.topic = S.topic || (top().v === "faq" && S.idx && S.idx.faq[top().i] ? S.idx.faq[top().i].c : null); go({ v: "message", tab: "message" }, true); }
    else if (a === "slide") { var tr = el("fph-track"); if (tr) tr.scrollTo({ left: +v * tr.clientWidth, behavior: "smooth" }); }
    else if (a === "cat") go({ v: "cat", c: v, tab: top().tab });
    else if (a === "faq") go({ v: "faq", i: +v, tab: top().tab });
    else if (a === "faqq") loadIndex().then(function () { var i = faqIndex(b.getAttribute("data-q")); if (i > -1) go({ v: "faq", i: i, tab: "home" }); });
  }

  function topicLabel(id) {
    var t = TOPICS.filter(function (x) { return x.id === id || x.label.toLowerCase() === String(id).toLowerCase(); })[0];
    return t ? t.label : null;
  }

  // ---- open / close ----
  function build() {
    if (S.built) return;
    injectStyles();
    root = document.createElement("div");
    root.id = "fph";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "Fewpips help");
    panel = root;
    root.addEventListener("click", onClick);
    S.built = true;
  }
  function fabState(on) {
    var fab = document.querySelector(FAB_SEL);
    if (!fab) return;
    if (!fab.querySelector(".fph-fab-x")) {
      var x = document.createElement("span");
      x.className = "fph-fab-x";
      x.innerHTML = I.down;
      fab.appendChild(x);
    }
    fab.classList.toggle("fph-on", on);
    fab.setAttribute("aria-expanded", on ? "true" : "false");
  }
  function open(view, arg, instant) {
    build();
    root.style.animation = instant ? "none" : ""; // a deep link lands open, no entrance animation
    loadIndex();
    loadPromo();
    if (window.FPGreeting && window.FPGreeting.dismiss) window.FPGreeting.dismiss();
    var v = view || "home", st = { v: v, tab: v };
    if (v === "message" && arg) S.topic = topicLabel(arg);
    if (v === "help") st.q = arg || "";
    if (v === "faq") st = { v: "faq", i: +arg || 0, tab: "help" };
    S.stack = v === "faq" ? [{ v: "help", tab: "help", q: "", focus: false }, st] : [st];
    if (!root.parentNode) document.body.appendChild(root);
    S.open = true;
    document.documentElement.classList.add("fph-lock");
    fabState(true);
    render();

  }
  function close() {
    unmountChat();
    clearInterval(S.timer);
    S.open = false;
    if (root && root.parentNode) root.parentNode.removeChild(root);
    document.documentElement.classList.remove("fph-lock");
    fabState(false);
  }

  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && S.open) close(); });

  // LiveChat boots on the first interaction, so the status line may render before it knows
  // whether the team is online - refresh it once LiveChat reports in
  function refreshStatus() {
    if (!root) return;
    [].forEach.call(root.querySelectorAll(".fph-st"), function (n) { n.innerHTML = statusHtml(); });
  }
  try {
    if (window.LiveChatWidget && window.LiveChatWidget.on) {
      window.LiveChatWidget.on("ready", refreshStatus);
      window.LiveChatWidget.on("availability_changed", refreshStatus);
    }
  } catch (e) {}

  // the loader (fp-help.js) owns the FAB click and the deep links, and calls in here
  window.__fphPanel = { open: open, close: close, isOpen: function () { return S.open; } };
  loadPromo(); // panel.js itself loads on the first FAB hover, so the offer is usually ready by the click
  injectStyles();
  loadIndex(); // this file loads on the first hover/click, so warm the index up with it
})();
