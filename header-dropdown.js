/* Fewpips - group the Challenges / Compare / How It Works / Instruments nav
   links into one "Explore" dropdown (header redesign, Veljko TG #11404, Nick
   agreed #11405, design reference from Dj). Desktop nav only - the mobile
   hamburger menu (.mm) keeps the flat links. The navbar is React-hydrated, so
   the dropdown is injected with the same keep-alive pattern as reviews-nav.js
   and the original links are hidden with pure CSS (:has), which survives any
   re-render with no flash. Vanilla JS + CSS transitions only. */
(function () {
  var ID = "hd-li";

  // browsers without :has() keep the original flat nav untouched
  try {
    if (!CSS.supports("selector(li:has(a))")) return;
  } catch (e) { return; }

  var ICONS = {
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    candle: '<path d="M9 5v4"/><rect width="4" height="6" x="7" y="9" rx="1"/><path d="M9 15v2"/><path d="M17 3v2"/><rect width="4" height="8" x="15" y="5" rx="1"/><path d="M17 13v3"/><path d="M3 3v18h18"/>'
  };

  // label -> icon + one-line description; hrefs are harvested from the links
  // being replaced so home / futures / subpage variants all keep working
  var META = {
    "Challenges":   { icon: "trophy", d: "Pick a challenge and get funded" },
    "Compare":      { icon: "chart",  d: "See how Fewpips stacks up" },
    "How It Works": { icon: "route",  d: "From signup to payout, step by step" },
    "Instruments":  { icon: "candle", d: "Every market you can trade" }
  };
  var LABELS = ["Challenges", "Compare", "How It Works", "Instruments"];

  function injectStyles() {
    if (document.getElementById(ID + "-css")) return;
    var css = document.createElement("style");
    css.id = ID + "-css";
    css.textContent = [
      // hide the flat links (desktop nav only; > keeps the dropdown li safe)
      'ul.nav-c>li:has(>a[href$="#challenges"]),ul.nav-c>li:has(>a[href$="#compare"]),',
      'ul.nav-c>li:has(>a[href$="#how"]),ul.nav-c>li:has(>a[href$="#instruments"]),',
      'ul.nav-c>li:has(>a[href$="#compare-plans"]){display:none}',
      // layout (Dj): product toggle hugs the logo, Explore stays centered,
      // Resources bubble slides toward the CTA; nav labels +10%
      "@media(min-width:769px){ul.nav-c{flex:1;justify-content:space-between;margin:0 18px 0 26px}}",
      // pull both bubbles ~20% of the gap toward the Explore dropdown
      "@media(min-width:1100px){ul.nav-c>li:first-child{margin-left:3%}ul.nav-c>li:last-child{margin-right:3%}}",
      "ul.nav-c a{font-size:.86rem}",
      "ul.nav-c .nav-toggle a{font-size:.86rem}",
      ".nav-r .nav-login,.nav-r .nav-cta{font-size:.86rem}",
      "#" + ID + "{position:relative}",
      "#" + ID + " .hd-btn{cursor:pointer;background:0 0;border:none;display:inline-flex;align-items:center;gap:4px;",
      "color:#fff;font:700 .95rem var(--font-b,Inter,sans-serif);padding:6px 11px;border-radius:99px;",
      "transition:all .3s var(--ease,ease);white-space:nowrap}",
      "#" + ID + " .hd-btn:hover,#" + ID + ".hd-open .hd-btn{color:#fff;background:#ffffff0a}",
      "#" + ID + " .hd-chev{width:13px;height:13px;transition:transform .3s var(--ease,ease)}",
      "#" + ID + ".hd-open .hd-chev{transform:rotate(180deg)}",
      // hoverable bridge between button and panel
      "#" + ID + " .hd-wrap{position:absolute;left:0;top:100%;padding-top:10px;z-index:1001;",
      "opacity:0;visibility:hidden;transform:translateY(8px) scale(.97);transform-origin:top left;",
      "transition:opacity .28s var(--ease,ease),transform .28s var(--ease,ease),visibility .28s}",
      "#" + ID + ".hd-open .hd-wrap{opacity:1;visibility:visible;transform:translateY(0) scale(1)}",
      "#" + ID + " .hd-panel{background:#0a0a0af5;-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);",
      "border:1px solid #ffffff14;border-radius:16px;padding:8px;width:290px;box-shadow:0 24px 60px #000000b3}",
      "#" + ID + " .hd-item{display:flex;align-items:flex-start;gap:12px;padding:10px;border-radius:10px;transition:background .3s}",
      "#" + ID + " .hd-item:hover{background:#ffffff08}",
      "#" + ID + " .hd-ic{flex:0 0 34px;height:34px;display:flex;align-items:center;justify-content:center;",
      "border:1px solid #ffffff14;border-radius:9px;color:var(--t2,#fffc);transition:all .3s}",
      "#" + ID + " .hd-item:hover .hd-ic{color:#00ffc2;border-color:#00ffc23d;background:#00ffc214}",
      "#" + ID + " .hd-ic svg{width:17px;height:17px}",
      "#" + ID + " .hd-item b{display:block;font:600 .82rem var(--font-b,Inter,sans-serif);color:var(--t1,#fff);line-height:1.3}",
      "#" + ID + " .hd-d{display:block;font:400 .72rem var(--font-b,Inter,sans-serif);color:var(--t3,#fff9);",
      "margin-top:2px;transition:color .3s}",
      "#" + ID + " .hd-item:hover .hd-d{color:var(--t2,#fffc)}"
    ].join("");
    document.head.appendChild(css);
  }

  function harvest(ul) {
    // read hrefs from the (now hidden) flat links so every page variant works
    var items = [];
    var links = ul.querySelectorAll(":scope>li>a");
    for (var i = 0; i < links.length; i++) {
      var lbl = (links[i].textContent || "").trim();
      if (META[lbl]) items.push({ label: lbl, href: links[i].getAttribute("href") });
    }
    items.sort(function (a, b) { return LABELS.indexOf(a.label) - LABELS.indexOf(b.label); });
    return items;
  }

  function build(items) {
    var li = document.createElement("li");
    li.id = ID;
    var rows = items.map(function (x) {
      var m = META[x.label];
      return '<a class="hd-item" href="' + x.href + '">' +
        '<span class="hd-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[m.icon] + "</svg></span>" +
        '<span class="hd-tx"><b>' + x.label + '</b><span class="hd-d">' + m.d + "</span></span></a>";
    }).join("");
    li.innerHTML =
      '<button class="hd-btn" type="button" aria-haspopup="true" aria-expanded="false">Explore' +
      '<svg class="hd-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>' +
      '<div class="hd-wrap"><div class="hd-panel">' + rows + "</div></div>";

    var closeT = null;
    function setOpen(v) {
      clearTimeout(closeT);
      li.classList.toggle("hd-open", v);
      li.querySelector(".hd-btn").setAttribute("aria-expanded", v ? "true" : "false");
    }
    li.addEventListener("mouseenter", function () { setOpen(true); });
    li.addEventListener("mouseleave", function () {
      closeT = setTimeout(function () { setOpen(false); }, 140);
    });
    li.querySelector(".hd-btn").addEventListener("click", function () {
      setOpen(!li.classList.contains("hd-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
    document.addEventListener("click", function (e) {
      if (!li.contains(e.target)) setOpen(false);
    });
    li.querySelector(".hd-wrap").addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a.hd-item");
      if (a) setOpen(false); // let anchor scroll, just fold the panel
    });
    return li;
  }

  function place() {
    if (document.getElementById(ID)) return;
    injectStyles();
    var ul = document.querySelector("ul.nav-c");
    if (!ul) return;
    var items = harvest(ul);
    if (!items.length) return;
    var li = build(items);
    // sits where Challenges used to be: right before the Resources bubble
    var res = ul.querySelector('.nav-toggle[aria-label="Resources"]');
    var anchor = res ? res.closest("li") : null;
    if (anchor) ul.insertBefore(li, anchor);
    else ul.appendChild(li);
    if (/[?&]hd-demo=1/.test(location.search)) li.classList.add("hd-open");
  }

  place();
  document.addEventListener("DOMContentLoaded", place);
  window.addEventListener("load", place);

  // survive Next.js client-side navigation + late hydration re-mounts
  ["pushState", "replaceState"].forEach(function (m) {
    var orig = history[m];
    if (orig && !orig.__hdPatched) {
      var patched = function () { var r = orig.apply(this, arguments); setTimeout(place, 60); return r; };
      patched.__hdPatched = true;
      history[m] = patched;
    }
  });
  window.addEventListener("popstate", place);
  window.addEventListener("pageshow", place);
  setInterval(place, 700);
})();
