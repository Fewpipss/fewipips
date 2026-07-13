/* Fewpips - add the TikTok icon to the footer social row (@few.pips) and keep the brand
   Instagram link pointing at instagram.com/few.pips. The footer is React-hydrated, so a new
   icon added to the HTML would be wiped on hydration - we (re)insert it after hydration and
   on every client-side navigation. Own DOM, idempotent. */
(function () {
  var TT_URL = "https://www.tiktok.com/@few.pips";
  var IG_URL = "https://instagram.com/few.pips";
  var TT_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M16.5 3c.26 1.94 1.35 3.28 3.02 3.86.66.23 1.36.34 2.08.35v2.86c-1.53.02-3.03-.36-4.36-1.11v6.02c0 1.34-.36 2.63-1.06 3.75a6.36 6.36 0 0 1-5.4 3.02 6.28 6.28 0 0 1-4.02-1.45 6.4 6.4 0 0 1-2.26-4.24 6.5 6.5 0 0 1 .35-2.86 6.36 6.36 0 0 1 6-4.05c.33 0 .66.03.99.08v2.94a3.5 3.5 0 0 0-1.06-.16 3.46 3.46 0 0 0-3.35 2.61 3.5 3.5 0 0 0 .34 2.55 3.46 3.46 0 0 0 6.5-1.66V3h2.69z"/></svg>';

  function apply() {
    var rows = document.querySelectorAll(".ft-brand-soc");
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var ig = row.querySelector('a[aria-label="Instagram"]');
      if (ig) ig.setAttribute("href", IG_URL); // keep brand IG correct even after a re-export
      if (row.querySelector('a[aria-label="TikTok"]')) continue; // already added
      var tt = document.createElement("a");
      tt.href = TT_URL;
      tt.target = "_blank";
      tt.rel = "noopener";
      tt.setAttribute("aria-label", "TikTok");
      tt.innerHTML = TT_SVG;
      if (ig && ig.parentNode) ig.parentNode.insertBefore(tt, ig.nextSibling);
      else row.appendChild(tt);
    }
  }

  apply();
  document.addEventListener("DOMContentLoaded", apply);
  window.addEventListener("load", apply);

  // survive Next.js client-side navigation (footer re-mounts) + late hydration
  ["pushState", "replaceState"].forEach(function (m) {
    var orig = history[m];
    if (orig && !orig.__ttPatched) {
      var patched = function () { var r = orig.apply(this, arguments); setTimeout(apply, 60); return r; };
      patched.__ttPatched = true;
      history[m] = patched;
    }
  });
  window.addEventListener("popstate", apply);
  window.addEventListener("pageshow", apply);
  setInterval(apply, 700);
})();
