/* Fewpips - add "Blog" and "Reviews" to the Resources nav bubble (desktop + mobile
   menu). The navbar is React-hydrated, so an HTML-only link would be wiped on
   hydration - re-insert after hydration and on client-side navigation, same pattern
   as social-tiktok.js. Own DOM, idempotent. Blog added per Nick (TG #11403). */
(function () {
  var LINKS = [
    { href: "/blog/", label: "Blog" },
    { href: "/reviews/", label: "Reviews" }
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
