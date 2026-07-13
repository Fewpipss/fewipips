/* Fewpips - add the TikTok icon to the footer social row (@few.pips) and keep the brand
   Instagram link pointing at instagram.com/few.pips. The footer is React-hydrated, so a new
   icon added to the HTML would be wiped on hydration - we (re)insert it after hydration and
   on every client-side navigation. Own DOM, idempotent. */
(function () {
  var TT_URL = "https://www.tiktok.com/@few.pips";
  var IG_URL = "https://instagram.com/few.pips";
  var TT_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M16.5 3c.26 1.94 1.35 3.28 3.02 3.86.66.23 1.36.34 2.08.35v2.86c-1.53.02-3.03-.36-4.36-1.11v6.02c0 1.34-.36 2.63-1.06 3.75a6.36 6.36 0 0 1-5.4 3.02 6.28 6.28 0 0 1-4.02-1.45 6.4 6.4 0 0 1-2.26-4.24 6.5 6.5 0 0 1 .35-2.86 6.36 6.36 0 0 1 6-4.05c.33 0 .66.03.99.08v2.94a3.5 3.5 0 0 0-1.06-.16 3.46 3.46 0 0 0-3.35 2.61 3.5 3.5 0 0 0 .34 2.55 3.46 3.46 0 0 0 6.5-1.66V3h2.69z"/></svg>';

  // The footer has two identical Telegram icons (Support + Fewpips Traders). Label the Support
  // one with a small always-on bubble so visitors can tell them apart.
  function injectStyles() {
    if (document.getElementById("fp-social-css")) return;
    var css = document.createElement("style");
    css.id = "fp-social-css";
    css.textContent = [
      '.ft-brand-soc a[aria-label="Telegram Support"]{overflow:visible}',
      '.fp-tg-tip{position:absolute;bottom:calc(100% + 9px);left:50%;transform:translateX(-50%);',
      'background:linear-gradient(135deg,#2aabee,#229ed9);color:#fff;font-size:.62rem;font-weight:700;',
      'line-height:1;white-space:nowrap;padding:5px 8px;border-radius:7px;pointer-events:none;',
      'box-shadow:0 4px 14px #00000066;letter-spacing:.02em;z-index:3}',
      '.fp-tg-tip::after{content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);',
      'border:5px solid transparent;border-top-color:#229ed9}'
    ].join("");
    (document.head || document.documentElement).appendChild(css);
  }

  function applyTgTip() {
    var tgs = document.querySelectorAll('.ft-brand-soc a[aria-label="Telegram Support"]');
    for (var i = 0; i < tgs.length; i++) {
      var a = tgs[i];
      if (a.querySelector(".fp-tg-tip")) continue;
      if (getComputedStyle(a).position === "static") a.style.position = "relative";
      var tip = document.createElement("span");
      tip.className = "fp-tg-tip";
      tip.textContent = "Telegram support";
      a.appendChild(tip);
    }
  }

  // Footer social row: keep brand IG on few.pips + add the TikTok icon after Instagram.
  function applyFooter() {
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

  // Contact page: the body uses bigger .contact-card blocks. Add a TikTok card (clone of the
  // Instagram card so the styling matches exactly) and keep the IG card href/handle correct.
  function applyContactCards() {
    var igCard = document.querySelector('a.contact-card[href*="instagram.com"]');
    if (!igCard) return;
    igCard.setAttribute("href", IG_URL);
    var desc = igCard.querySelector(".contact-card-desc");
    if (desc && /officialfewpips/i.test(desc.textContent)) desc.textContent = "@few.pips";
    var grid = igCard.parentNode;
    if (!grid || grid.querySelector('a.contact-card[href*="tiktok.com"]')) return;
    var card = igCard.cloneNode(true);
    card.setAttribute("href", TT_URL);
    var ic = card.querySelector(".contact-card-icon");
    if (ic) ic.innerHTML = TT_SVG;
    var ti = card.querySelector(".contact-card-title");
    if (ti) ti.textContent = "TikTok";
    var de = card.querySelector(".contact-card-desc");
    if (de) de.textContent = "@few.pips";
    grid.insertBefore(card, igCard.nextSibling);
  }

  function apply() { injectStyles(); applyFooter(); applyContactCards(); applyTgTip(); }

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
