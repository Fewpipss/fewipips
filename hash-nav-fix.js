/* Fewpips - deterministic section navigation for the header links.
   The header links are plain <a> tags. Depending on the page they point to a section on the
   SAME page (/#compare on home, /futures#compare on futures) or a DIFFERENT page. Native +
   Next.js hash handling here is unreliable (trailing-slash mismatch, fixed navbar with no
   scroll-padding, soft-nav that lands on the hero). This makes every nav option land on the
   right section, on the right page.

   - Same page (trailing slash ignored): smooth-scroll to the section, offset by the fixed
     navbar height so the heading isn't hidden under it, and update the URL hash.
   - Different page: do a real navigation; on arrival we re-scroll to the section with the
     same offset (native scroll would tuck it under the fixed navbar).
   Links without a hash (the CFDs / Futures page toggle) are left completely alone. */
(function () {
  function normPath(p) { return (p || "/").replace(/\/+$/, "") || "/"; }

  function navOffset() {
    var nav = document.querySelector(".nav");
    var h = nav ? nav.getBoundingClientRect().height : 0;
    return h + 14;
  }

  function scrollToId(id) {
    var el = document.getElementById(id) || (document.getElementsByName(id)[0]);
    if (!el) return false;
    var y = el.getBoundingClientRect().top + window.pageYOffset - navOffset();
    window.scrollTo({ top: y < 0 ? 0 : y, behavior: "smooth" });
    return true;
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    if (a.hasAttribute("download")) return;
    var tgt = a.getAttribute("target");
    if (tgt && tgt !== "" && tgt !== "_self") return;
    var href = a.getAttribute("href");
    if (!href) return;
    var url;
    try { url = new URL(href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin) return;
    if (!url.hash || url.hash === "#") return;             // no section target
    var id = decodeURIComponent(url.hash.slice(1));

    if (normPath(url.pathname) === normPath(location.pathname)) {
      // Same page: take over the scroll ourselves (deterministic, beats native/Next quirks).
      if (document.getElementById(id) || document.getElementsByName(id)[0]) {
        e.preventDefault();
        e.stopPropagation();
        scrollToId(id);
        try { history.pushState(null, "", url.hash); } catch (_) {}
      }
      return;
    }
    // Different page: real navigation; the destination re-scrolls with the navbar offset.
    e.preventDefault();
    e.stopPropagation();
    window.location.assign(url.pathname + url.search + url.hash);
  }, true);

  // On arrival with a hash (cross-page nav or a shared link), re-scroll with the navbar offset
  // so the section isn't tucked under the fixed navbar.
  function fixInitialHash() {
    if (!location.hash || location.hash === "#") return;
    var id = decodeURIComponent(location.hash.slice(1));
    var tries = 0;
    (function attempt() {
      if (scrollToId(id)) return;      // element found + scrolled
      if (tries++ < 20) setTimeout(attempt, 100); // wait for late-hydrating sections
    })();
  }
  if (document.readyState === "complete") setTimeout(fixInitialHash, 60);
  else window.addEventListener("load", function () { setTimeout(fixInitialHash, 60); });
})();
