/* Fewpips - "What traders say" auto-sliding review strip on both landing pages
   (Nick TG #11387, placement per Professorheseinberg TG #11397: right after the
   About fold). Cards are hand-picked short reviews from the /reviews/ page data.
   Injected after hydration with the same keep-alive pattern as proof-peek.js.
   Marquee pauses on hover (matches the /reviews/ carousel behaviour). */
(function () {
  var ID = "reviews-strip";
  var PAGE = "/reviews/";

  var CARDS = [
    { p: "Myfxbook", c: "#3b9df7", rec: 1, n: "JoshuaWMB", t: "Prop firms aren't designed for traders who want to operate without restrictions. fewpips gives traders a defined framework, which can be beneficial for someone who already follows a consistent strategy and respects risk parameters." },
    { p: "ProvenExpert", c: "#ffb329", n: "Verified client", t: "Fewpips encourages repeatable performance instead of gambling on a single winning trade. For traders focused on long-term success, that's a major advantage." },
    { p: "Cryptwerk", c: "#7c5cff", n: "HansLaurentis", t: "The biggest reason to consider fewpips is the opportunity to trade under a prop-firm model rather than relying exclusively on personal trading capital." },
    { p: "ProvenExpert", c: "#ffb329", n: "Verified client", t: "For traders who've been knocked out of challenges by the clock rather than their performance, Fewpips is worth a serious look. The unlimited evaluation period alone separates it from most of the competition." },
    { p: "Myfxbook", c: "#3b9df7", rec: 1, n: "Gabby21I", t: "One target, no multiple phases - I picked the Fewpips 1-step program because I didn't want to deal with resetting my psychology between stages. Passed it and got funded." }
  ];

  function injectStyles() {
    if (document.getElementById(ID + "-css")) return;
    var css = document.createElement("style");
    css.id = ID + "-css";
    css.textContent = [
      "#" + ID + " .rs-row{display:flex;gap:16px;overflow-x:auto;padding:8px 24px 14px;scrollbar-width:none}",
      "#" + ID + " .rs-row::-webkit-scrollbar{display:none}",
      "#" + ID + " .rs-card{flex:0 0 340px;background:var(--bg-2,#0a0a0a);border:1px solid var(--glass-b,#ffffff0f);",
      "border-radius:14px;padding:18px 20px;text-decoration:none;display:block;transition:border-color .3s,transform .3s}",
      "#" + ID + " .rs-card:hover{border-color:#00ffc23d;transform:translateY(-4px)}",
      "#" + ID + " .rs-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}",
      "#" + ID + " .rs-plat{font:700 11px var(--font-b,Inter,sans-serif);letter-spacing:.06em;text-transform:uppercase;",
      "padding:4px 9px;border-radius:7px}",
      "#" + ID + " .rs-stars{color:#ffb329;font-size:13px;letter-spacing:2px}",
      "#" + ID + " .rs-rec{font:700 10px var(--font-b,Inter,sans-serif);letter-spacing:.05em;color:#42ff00;",
      "background:#42ff0014;border:1px solid #42ff0030;padding:3px 8px;border-radius:6px;white-space:nowrap}",
      "#" + ID + " .rs-txt{margin:0;font:400 13.5px/1.6 var(--font-b,Inter,sans-serif);color:var(--t2,#fffc);display:-webkit-box;",
      "-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}",
      "#" + ID + " .rs-who{margin-top:12px;font:600 12px var(--font-b,Inter,sans-serif);color:var(--t3,#fff7)}",
      "@media(max-width:640px){#" + ID + " .rs-card{flex-basis:78vw}}"
    ].join("");
    document.head.appendChild(css);
  }

  function build() {
    var sec = document.createElement("section");
    sec.className = "sec";
    sec.id = ID;
    var cards = CARDS.map(function (x) {
      return '<a class="rs-card" href="' + PAGE + '">' +
        '<div class="rs-top"><span class="rs-plat" style="color:' + x.c + ';background:' + x.c + '22">' + x.p + '</span>' +
        (x.rec ? '<span class="rs-rec">&#10003; Recommends</span></div>' : '<span class="rs-stars">★★★★★</span></div>') +
        '<p class="rs-txt">' + x.t + '</p>' +
        '<div class="rs-who">' + x.n + '</div></a>';
    }).join("");
    sec.innerHTML =
      '<div class="c"><div class="sec-hd ctr">' +
        '<div class="sec-label">Reviews</div>' +
        '<h2>What traders say about us</h2>' +
        '<p>Real reviews from independent platforms - hover to pause, click to read all of them.</p>' +
      '</div></div>' +
      '<div class="rs-row" id="rs-row">' + cards + cards + '</div>' +
      '<div class="proof-cta" style="text-align:center;margin-top:6px">' +
        '<a class="proof-btn" href="' + PAGE + '">Read all reviews ' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="width:16px;height:16px"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>';
    return sec;
  }

  function marquee() {
    var row = document.getElementById("rs-row");
    if (!row || row.__armed) return;
    row.__armed = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    row.__paused = false;
    row.addEventListener("mouseenter", function () { row.__paused = true; });
    row.addEventListener("mouseleave", function () { row.__paused = false; });
    row.addEventListener("touchstart", function () { row.__hold = Date.now() + 5000; }, { passive: true });
    var last = 0;
    function tick(t) {
      if (!document.getElementById("rs-row")) return; // section removed, stop
      requestAnimationFrame(tick);
      if (document.hidden || t - last < 25) return;
      last = t;
      if (row.__paused || Date.now() < (row.__hold || 0)) return;
      row.scrollLeft += 0.7;
      var half = row.scrollWidth / 2;
      if (row.scrollLeft >= half) row.scrollLeft -= half;
    }
    requestAnimationFrame(tick);
  }

  function place() {
    if (document.getElementById(ID)) return true;
    injectStyles();
    // Home: right after the About fold (host section of .about-promise).
    var tag = document.querySelector(".about-promise");
    if (tag) {
      var host = tag.closest("section") || tag.parentElement;
      if (host && host.parentNode) {
        host.parentNode.insertBefore(build(), host.nextSibling);
        marquee();
        return true;
      }
    }
    // Futures: above the leaderboard pair (falls back to FAQ / final CTA).
    var before = document.getElementById("proof-lb") ||
                 document.querySelector("section.faq") || document.querySelector(".fcta");
    if (before && before.parentNode) {
      before.parentNode.insertBefore(build(), before);
      marquee();
      return true;
    }
    return false;
  }

  // proof-peek.js races us for the slot after the About fold - keep the order
  // deterministic: this section always sits directly ABOVE the leaderboard.
  function ensurePosition() {
    var sec = document.getElementById(ID);
    var lb = document.getElementById("proof-lb");
    if (sec && lb && sec.nextElementSibling !== lb && lb.parentNode) {
      lb.parentNode.insertBefore(sec, lb);
    }
  }

  function run() {
    place();
    var mo = new MutationObserver(function () {
      if (!document.getElementById(ID)) place();
      ensurePosition();
    });
    if (document.body) mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { place(); ensurePosition(); }, 1200);
    setTimeout(function () { place(); ensurePosition(); }, 4000);
  }

  if (document.readyState === "complete") run();
  else window.addEventListener("load", run);
})();
