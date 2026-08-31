/* Fewpips - "Leaderboard top-3" + "Proof of Payouts" sneak-peek sections.
   Injected after hydration so they survive Next.js client render.
   Reuses the site's own design tokens (--g1, --g2, --grad, --glass...) and classes (.sec .c .sec-label). */
(function () {
  var SECTION_ID = "proof-peek";
  var LB_ID = "proof-lb";
  var PROOF_URL = "https://www.fewpips.com/proof/";

  // Real payout certificates. To swap/add: drop a webp in /certs and edit this list.
  // 17-24 Aug 2026 batch (Nick, 25 Aug 2026). Retired certs live on the proof page.
  var CERTS = [
    { img: "/certs/catalina-fuentes.webp", amount: "$12,135.43" },
    { img: "/certs/martin-escobar.webp",   amount: "$11,024.19" },
    { img: "/certs/alejandro-pena.webp",   amount: "$9,427.77" },
    { img: "/certs/alejandra-pinto.webp",  amount: "$7,811.37" },
    { img: "/certs/yasmin-ortega.webp",    amount: "$7,650.64" }
  ];

  // Top 3 performers (17-24 August 2026). Full leaderboard lives on the proof page.
  var LEADERS = [
    { rank: 1, name: "Catalina Fuentes", amount: "$12,135.43", account: "Future Based CFD · Instant" },
    { rank: 2, name: "Martín Escobar",   amount: "$11,024.19", account: "Future Based CFD · Instant" },
    { rank: 3, name: "Alejandro Peña",   amount: "$9,427.77",  account: "Future Based CFD · 1-Step" }
  ];

  function injectStyles() {
    if (document.getElementById(SECTION_ID + "-css")) return;
    var css = document.createElement("style");
    css.id = SECTION_ID + "-css";
    css.textContent = [
      /* ---- certs sneak peek ---- */
      "#" + SECTION_ID + " .peek-row{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin:0 0 40px}",
      "#" + SECTION_ID + " .peek-card{position:relative;aspect-ratio:1280/900;border-radius:14px;overflow:hidden;",
      "background:var(--bg-2,#0a0a0a);border:1px solid var(--glass-b,#ffffff0f);transition:transform .3s var(--ease,ease),box-shadow .3s ease;transform:translateZ(0)}",
      "#" + SECTION_ID + " .peek-card:hover{transform:translateY(-6px);box-shadow:0 18px 50px #00000080,0 0 40px #00ffc21f}",
      "#" + SECTION_ID + " .peek-card img{width:100%;height:100%;object-fit:cover;display:block}",
      "#" + SECTION_ID + " .peek-badge{position:absolute;bottom:10px;right:10px;z-index:3;display:inline-flex;align-items:center;gap:5px;",
      "font:700 .62rem/1 var(--font-b,Inter,sans-serif);letter-spacing:.04em;color:var(--g2,#42ff00);",
      "background:#00000073;backdrop-filter:blur(6px);padding:5px 8px;border-radius:7px;border:1px solid #42ff0033}",
      "#" + SECTION_ID + " .peek-badge svg{width:11px;height:11px}",
      /* ---- shared CTA button (both sections) ---- */
      ".proof-cta{text-align:center}",
      ".proof-btn{display:inline-flex;align-items:center;gap:9px;padding:15px 42px;border-radius:999px;",
      "font:700 .95rem/1 var(--font-b,Inter,sans-serif);color:#000;background:var(--grad,linear-gradient(135deg,#00ffc2,#42ff00));",
      "text-decoration:none;position:relative;overflow:hidden;transition:transform .25s ease,box-shadow .25s ease}",
      ".proof-btn:hover{transform:translateY(-3px);box-shadow:0 0 60px #00ffc247,0 8px 30px #00000080}",
      ".proof-btn svg{width:17px;height:17px}",
      /* ---- leaderboard top-3 sneak peek ---- */
      "#" + LB_ID + " .plb-row{display:grid;grid-template-columns:1fr 1.12fr 1fr;gap:16px;align-items:end;max-width:720px;margin:0 auto 34px}",
      "#" + LB_ID + " .plb-card{position:relative;border-radius:16px;padding:24px 16px 22px;text-align:center;",
      "background:var(--bg-2,#0a0a0a);border:1px solid var(--glass-b,#ffffff0f);transition:transform .3s var(--ease,ease),box-shadow .3s ease}",
      "#" + LB_ID + " .plb-card:hover{transform:translateY(-5px);box-shadow:0 16px 44px #00000080,0 0 34px #00ffc21a}",
      "#" + LB_ID + " .plb-1{padding-top:32px;padding-bottom:28px;border-color:transparent;position:relative;isolation:isolate;overflow:hidden}",
      "#" + LB_ID + " .plb-1::before{content:'';position:absolute;width:250%;aspect-ratio:1;top:50%;left:50%;",
      "background:conic-gradient(from 0deg,transparent 0%,#00ffc2 12%,transparent 30%,transparent 60%,#42ff00 76%,transparent 96%);",
      "transform:translate(-50%,-50%);animation:plbSpin 4s linear infinite;z-index:-2;filter:blur(3px);will-change:transform}",
      "#" + LB_ID + " .plb-1::after{content:'';position:absolute;inset:1.5px;border-radius:14.5px;background:var(--bg-2,#0a0a0a);z-index:-1}",
      "@keyframes plbSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}",
      "@media (prefers-reduced-motion:reduce){#" + LB_ID + " .plb-1::before{animation:none}}",
      "#" + LB_ID + " .plb-medal{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;",
      "font:900 15px/1 var(--font-h,Poppins,sans-serif);color:#0a0a0a;margin:0 auto 12px}",
      "#" + LB_ID + " .plb-1 .plb-medal{background:linear-gradient(135deg,#ffe68a,#ffb329);box-shadow:0 0 16px #ffb32980}",
      "#" + LB_ID + " .plb-2 .plb-medal{background:linear-gradient(135deg,#eef1f7,#aab2c4)}",
      "#" + LB_ID + " .plb-3 .plb-medal{background:linear-gradient(135deg,#f0b590,#c77b48)}",
      "#" + LB_ID + " .plb-av{width:56px;height:56px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;",
      "font:800 20px/1 var(--font-h,Poppins,sans-serif);color:#0a0a0a;background:var(--grad,linear-gradient(135deg,#00ffc2,#42ff00))}",
      "#" + LB_ID + " .plb-1 .plb-av{background:linear-gradient(135deg,#ffe68a,#ffb329)}",
      "#" + LB_ID + " .plb-2 .plb-av{background:linear-gradient(135deg,#eef1f7,#aab2c4)}",
      "#" + LB_ID + " .plb-3 .plb-av{background:linear-gradient(135deg,#f0b590,#c77b48)}",
      "#" + LB_ID + " .plb-name{font:800 16px/1.2 var(--font-h,Poppins,sans-serif);color:var(--t1,#fff)}",
      "#" + LB_ID + " .plb-acct{font:500 12px/1.4 var(--font-b,Inter,sans-serif);color:var(--t3,#fff6);margin-top:4px}",
      "#" + LB_ID + " .plb-amt{font:900 clamp(20px,2.2vw,25px)/1 var(--font-h,Poppins,sans-serif);margin-top:12px;",
      "background:var(--grad,linear-gradient(135deg,#00ffc2,#42ff00));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}",
      "#" + LB_ID + " .plb-1 .plb-amt{background:linear-gradient(135deg,#ffe68a,#ffb329);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}",
      "@media(max-width:640px){#" + LB_ID + " .plb-row{grid-template-columns:1fr;gap:12px}#" + LB_ID + " .plb-1{order:-1}",
      "#" + SECTION_ID + " .peek-row{grid-auto-flow:column;grid-template-columns:none;grid-auto-columns:64%;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:6px}",
      "#" + SECTION_ID + " .peek-card{scroll-snap-align:center}}"
    ].join("");
    document.head.appendChild(css);
  }

  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>';
  var ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function initials(name) {
    var p = name.split(" ").filter(Boolean);
    return (p[0].charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : "")).toUpperCase();
  }

  function buildLeaderboard() {
    var sec = document.createElement("section");
    sec.className = "sec";
    sec.id = LB_ID;

    function card(l) {
      return '<div class="plb-card plb-' + l.rank + '">' +
        '<div class="plb-medal">' + l.rank + '</div>' +
        '<div class="plb-av">' + initials(l.name) + '</div>' +
        '<div class="plb-name">' + l.name + '</div>' +
        '<div class="plb-acct">' + l.account + '</div>' +
        '<div class="plb-amt">' + l.amount + '</div>' +
        '</div>';
    }
    // podium order: 2nd, 1st (center), 3rd
    var order = [LEADERS[1], LEADERS[0], LEADERS[2]].map(card).join("");

    sec.innerHTML =
      '<div class="c">' +
        '<div class="sec-hd ctr">' +
          '<div class="sec-label">Leaderboard</div>' +
          '<h2>Latest top performers</h2>' +
          '<p>The highest-paid funded Fewpips traders in August - see where you could rank.</p>' +
        '</div>' +
        '<div class="plb-row">' + order + '</div>' +
        '<div class="proof-cta">' +
          '<a class="proof-btn" href="' + PROOF_URL + '">Click here to see the full leaderboard ' + ARROW_SVG + '</a>' +
        '</div>' +
      '</div>';
    return sec;
  }

  function buildSection() {
    var sec = document.createElement("section");
    sec.className = "sec";
    sec.id = SECTION_ID;

    var cards = CERTS.map(function (c) {
      return '<div class="peek-card">' +
        '<img src="' + c.img + '" alt="Fewpips payout certificate - ' + c.amount + '" loading="lazy"/>' +
        '<span class="peek-badge">' + CHECK_SVG + 'Verified</span></div>';
    }).join("");

    sec.innerHTML =
      '<div class="c">' +
        '<div class="sec-hd ctr">' +
          '<div class="sec-label">Proof of Payouts</div>' +
          '<h2>Real traders. Real withdrawals.</h2>' +
          '<p>A sneak peek at the payout certificates we issue every month - verified, dated, and paid out to funded Fewpips traders.</p>' +
        '</div>' +
        '<div class="peek-row">' + cards + '</div>' +
        '<div class="proof-cta">' +
          '<a class="proof-btn" href="' + PROOF_URL + '">View all certificates ' + ARROW_SVG + '</a>' +
        '</div>' +
      '</div>';
    return sec;
  }

  // Insert leaderboard first, then certs right after it (leaderboard sits above certs).
  function insertPair(ref, mode) {
    injectStyles();
    var lb = buildLeaderboard();
    var certs = buildSection();
    if (mode === "after") {
      ref.parentNode.insertBefore(lb, ref.nextSibling);
      lb.parentNode.insertBefore(certs, lb.nextSibling);
    } else { // before
      ref.parentNode.insertBefore(lb, ref);
      ref.parentNode.insertBefore(certs, ref);
    }
  }

  function place() {
    var certs = document.getElementById(SECTION_ID);
    var lb = document.getElementById(LB_ID);
    if (certs && lb) return true;
    // Partial leftovers (React wiped one sibling): clear and re-insert the pair.
    if (certs) certs.remove();
    if (lb) lb.remove();
    // CFD / home landing: insert right after the "OUR PROMISE" section.
    var tag = document.querySelector(".about-promise");
    if (tag) {
      var host = tag.closest("section") || tag.parentElement;
      if (host && host.parentNode) { insertPair(host, "after"); return true; }
    }
    // Futures landing (no .about-promise): insert just above the FAQ section
    // (fall back to the final CTA if the FAQ section isn't found).
    var before = document.querySelector("section.faq") || document.querySelector(".fcta");
    if (before && before.parentNode) { insertPair(before, "before"); return true; }
    return false;
  }

  // React 19 hydration can commit AFTER we insert and wipe the sections (or the
  // anchor can appear late on slow devices) - insert-once was a race that showed
  // up as "leaderboard missing" for some visitors. Keep them alive the same way
  // the promo banner does: try on load, then re-place on every DOM change.
  function run() {
    place();
    var mo = new MutationObserver(function () {
      if (!document.getElementById(SECTION_ID) || !document.getElementById(LB_ID)) place();
    });
    if (document.body) mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(place, 1200);
    setTimeout(place, 4000);
  }

  if (document.readyState === "complete") run();
  else window.addEventListener("load", run);
})();
