/* Fewpips - add "Blog" and "Reviews" to the Resources nav bubble (desktop + mobile
   menu). The navbar is React-hydrated, so an HTML-only link would be wiped on
   hydration - re-insert after hydration and on client-side navigation, same pattern
   as social-tiktok.js. Own DOM, idempotent. Blog added per Nick (TG #11403). */
(function () {
  var LINKS = [
    { href: "/blog/", label: "Blog" },
    { href: "/reviews/", label: "Reviews" },
    { href: "/proof/", label: "Proof" }
  ];

  /* The Resources bubble is a single nowrap row. Four links fit a phone; the three
     added below push it to 641px inside a 390px viewport, so FAQ and Proof end up
     off-screen and Contact/Reviews are sliced (Dj, mobile menu screenshot 25.9).
     Let it wrap inside the hamburger menu only - the desktop bar has the room and
     must stay one row. Injected here so the fix travels with the links that cause
     it, same self-contained pattern as header-dropdown.js. */
  function injectStyles() {
    if (document.getElementById("rv-mm-css")) return;
    var css = document.createElement("style");
    css.id = "rv-mm-css";
    css.textContent = [
      ".mm .nav-toggle--mm{flex-wrap:wrap;justify-content:center;gap:4px;",
      "max-width:calc(100vw - 32px);border-radius:22px;padding:6px}",
      // .mm a is width:100% with a divider - fine for the stacked links, but it
      // would drop every pill onto its own line the moment wrapping is allowed
      ".mm .nav-toggle--mm a{width:auto!important;border-bottom:none!important;",
      "padding:9px 16px!important}"
    ].join("");
    document.head.appendChild(css);
  }

  function add() {
    injectStyles();
    var groups = document.querySelectorAll('.nav-toggle[aria-label="Resources"]');
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      for (var j = 0; j < LINKS.length; j++) {
        var l = LINKS[j];
        if (g.querySelector('a[href="' + l.href + '"]')) continue; // already added
        var a = document.createElement("a");
        a.href = l.href;
        a.textContent = l.label;
        a.className = location.pathname.replace(/\/+$/, "/") === l.href ? "active" : "";
        g.appendChild(a);
      }
    }
  }

  // Footer: Nick wants "Blogs" spelled out in the footer link (TG #11386),
  // and the Proof of Payouts page gets an internal link for SEO (Veljko 31.8).
  function footerLabel() {
    var links = document.querySelectorAll('.ft-col a[href="/blog/"]');
    for (var i = 0; i < links.length; i++) {
      if (links[i].textContent !== "Blogs") links[i].textContent = "Blogs";
      var col = links[i].parentElement;
      // Both links are in the static HTML now (crawlable). Re-add them only if a
      // hydration pass dropped them, so the footer always carries them.
      if (col && !col.querySelector('a[href="/reviews/"]')) {
        var r = document.createElement("a");
        r.href = "/reviews/";
        r.textContent = "Reviews";
        col.appendChild(r);
      }
      if (col && !col.querySelector('a[href="/proof/"]')) {
        var a = document.createElement("a");
        a.href = "/proof/";
        a.textContent = "Proof of Payouts";
        col.appendChild(a);
      }
    }
  }
  var _add = add;
  add = function () { _add(); footerLabel(); };

  add();
  document.addEventListener("DOMContentLoaded", add);
  window.addEventListener("load", add);

  // survive Next.js client-side navigation (nav re-mounts) + late hydration
  ["pushState", "replaceState"].forEach(function (m) {
    var orig = history[m];
    if (orig && !orig.__rvPatched) {
      var patched = function () { var r = orig.apply(this, arguments); setTimeout(add, 60); return r; };
      patched.__rvPatched = true;
      history[m] = patched;
    }
  });
  window.addEventListener("popstate", add);
  window.addEventListener("pageshow", add);
  setInterval(add, 700);
})();
