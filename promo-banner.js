/* Fewpips - Claim Week promo banner (Sept 1-4, Nick's creative, approved TG
   #12290 + Dj). The pages are React-hydrated, so the element is injected with
   the standard keep-alive pattern - BUT its space is pre-reserved by a static
   body::before spacer in each page's <head> (id="promo-space" style), so the
   late insert causes ZERO layout shift. The banner is absolutely positioned
   into that reserved slot. Remove after Sept 4: delete the script tags, the
   promo-space styles and the durable checks together. */
(function () {
  var ID = "promo-claim200";
  function injectStyles() {
    if (document.getElementById(ID + "-css")) return;
    var css = document.createElement("style");
    css.id = ID + "-css";
    css.textContent = [
      "#" + ID + "{position:absolute;top:88px;left:0;right:0;z-index:5;display:block;",
      "max-width:900px;margin:0 auto;padding:0 16px}",
      "#" + ID + " img{width:100%;height:auto;display:block;border-radius:14px;",
      "border:1px solid #ffffff14;transition:transform .3s var(--ease,ease),box-shadow .3s ease}",
      "#" + ID + ":hover img{transform:translateY(-2px);box-shadow:0 14px 44px #00000080,0 0 34px #00ffc21f}"
    ].join("");
    document.head.appendChild(css);
  }
  function build() {
    var a = document.createElement("a");
    a.id = ID;
    a.href = "https://crm.fewpips.com/auth/signup";
    a.innerHTML =
      '<img src="/promo-claim200.webp" width="960" height="540" fetchpriority="high" ' +
      'alt="Claim Week is open - $200 order = a free account, your pick. Code CLAIM200. Closes Fri Sep 4, 23:59 ET">';
    return a;
  }
  function place() {
    if (document.getElementById(ID)) return;
    injectStyles();
    if (document.body) document.body.appendChild(build());
  }
  function run() {
    place();
    var mo = new MutationObserver(function () { place(); });
    if (document.body) mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(place, 1200);
    setTimeout(place, 4000);
  }
  if (document.readyState !== "loading") run();
  else window.addEventListener("DOMContentLoaded", run);
})();
