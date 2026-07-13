/* Fewpips - fix cross-page hash navigation.
   The header links are plain <a href="/#compare"> etc. On a subpage (e.g. /futures) the
   Next.js App Router intercepts the click and soft-navigates to "/", but it does NOT scroll
   to the #section afterwards - it dumps you at the top (hero). We intercept such clicks in
   the CAPTURE phase (before Next's handler) and do a real navigation, so the browser scrolls
   to the target section natively on the destination page.

   Only acts on same-origin links that (a) have a hash and (b) point to a DIFFERENT pathname
   than the current page. Same-page anchors (/#x while already on /, or #x) are left untouched
   so in-page smooth scroll keeps working. */
(function () {
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab / modified
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    if (a.hasAttribute("download")) return;
    var t = a.getAttribute("target");
    if (t && t !== "" && t !== "_self") return; // opens elsewhere
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#") return; // pure same-page anchor - native handles it
    if (href.indexOf("#") === -1) return;         // no hash - normal navigation
    var url;
    try { url = new URL(href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin) return;   // external
    if (!url.hash || url.hash === "#") return;
    if (url.pathname === location.pathname) return; // same page - let native/smooth scroll run
    // Cross-page hash link: force a real navigation so the destination scrolls to the section.
    e.preventDefault();
    e.stopPropagation();
    window.location.assign(url.pathname + url.search + url.hash);
  }, true);
})();
