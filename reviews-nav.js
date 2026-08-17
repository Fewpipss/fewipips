/* Fewpips - add "Reviews" to the Resources nav bubble (desktop + mobile menu),
   linking to the /reviews/ landing. The navbar is React-hydrated, so an HTML-only
   link would be wiped on hydration - re-insert after hydration and on client-side
   navigation, same pattern as social-tiktok.js. Own DOM, idempotent. */
(function () {
  var URL = "/reviews/";

  function add() {
    var groups = document.querySelectorAll('.nav-toggle[aria-label="Resources"]');
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      if (g.querySelector('a[href="' + URL + '"]')) continue; // already added
      var a = document.createElement("a");
      a.href = URL;
      a.textContent = "Reviews";
      a.className = location.pathname.replace(/\/+$/, "/") === URL ? "active" : "";
      g.appendChild(a);
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
