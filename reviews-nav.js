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

  function add() {
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
