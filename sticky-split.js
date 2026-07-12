/* Fewpips - split the bottom Discord sticky bar into two halves:
   left = Discord, right = Telegram. Also removes the circular Telegram chat FAB.
   Injected after hydration; replaces the React sticky with an own (non-React) bar so it stays put. */
(function () {
  var BAR_ID = "sd-split-bar";
  var DISCORD_URL = "https://discord.gg/3UTqHFJPAC";
  var TELEGRAM_URL = "https://t.me/FewpipsSupport";
  var STORE_KEY = "fewpips_sd_split_closed";

  var DISCORD_SVG = '<svg class="sd-ic" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/></svg>';
  var TELEGRAM_SVG = '<svg class="sd-ic" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>';
  var X_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  function injectStyles() {
    if (document.getElementById(BAR_ID + "-css")) return;
    var css = document.createElement("style");
    css.id = BAR_ID + "-css";
    css.textContent = [
      // hide the original React Discord bar and the circular Telegram FAB
      ".sticky-discord{display:none!important}",
      ".chat-fab--telegram{display:none!important}",
      // remove WhatsApp: from the chat FAB (bottom-right) and the Contact page card
      ".chat-fab--whatsapp{display:none!important}",
      "a.contact-card[href*='wa.me']{display:none!important}",
      // own split bar
      "#" + BAR_ID + "{position:fixed;left:0;right:0;bottom:0;z-index:2147483646;display:flex;",
      "font-family:var(--font-b,Inter,system-ui,sans-serif);box-shadow:0 -4px 30px #00000073;animation:sdSplitUp .5s .2s both}",
      "@keyframes sdSplitUp{from{transform:translateY(100%)}to{transform:translateY(0)}}",
      "#" + BAR_ID + " .sd-half{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:12px;",
      "padding:13px 20px;color:#fff;text-decoration:none;transition:filter .2s ease}",
      "#" + BAR_ID + " .sd-half:hover{filter:brightness(1.08)}",
      "#" + BAR_ID + " .sd-discord{background:linear-gradient(135deg,#5865f2,#7289da)}",
      "#" + BAR_ID + " .sd-telegram{background:linear-gradient(135deg,#2aabee,#229ed9);padding-right:54px}",
      "#" + BAR_ID + " .sd-ic{width:26px;height:26px;flex-shrink:0}",
      "#" + BAR_ID + " .sd-txt{display:flex;flex-direction:column;line-height:1.15;min-width:0}",
      "#" + BAR_ID + " .sd-txt b{font-size:.95rem;font-weight:800;letter-spacing:.01em}",
      "#" + BAR_ID + " .sd-txt small{font-size:.72rem;opacity:.9;font-weight:500}",
      "#" + BAR_ID + " .sd-x{position:absolute;top:50%;right:12px;transform:translateY(-50%);width:34px;height:34px;",
      "border-radius:50%;border:1px solid #ffffff45;background:#ffffff26;color:#fff;cursor:pointer;",
      "display:flex;align-items:center;justify-content:center;transition:background .2s,transform .2s}",
      "#" + BAR_ID + " .sd-x:hover{background:#ffffff40;transform:translateY(-50%) rotate(90deg)}",
      "#" + BAR_ID + " .sd-x svg{width:18px;height:18px}",
      "@media(max-width:560px){#" + BAR_ID + " .sd-txt small{display:none}#" + BAR_ID + " .sd-half{padding:12px 10px;gap:8px}#" + BAR_ID + " .sd-telegram{padding-right:46px}#" + BAR_ID + " .sd-txt b{font-size:.85rem}}"
    ].join("");
    document.head.appendChild(css);
  }

  function build() {
    var bar = document.createElement("div");
    bar.id = BAR_ID;
    bar.setAttribute("aria-label", "Join Fewpips on Discord or Telegram");
    bar.innerHTML =
      '<a class="sd-half sd-discord" href="' + DISCORD_URL + '" target="_blank" rel="noopener">' +
        DISCORD_SVG +
        '<span class="sd-txt"><b>Join our Discord</b><small>Free signals, giveaways &amp; support</small></span>' +
      '</a>' +
      '<a class="sd-half sd-telegram" href="' + TELEGRAM_URL + '" target="_blank" rel="noopener">' +
        TELEGRAM_SVG +
        '<span class="sd-txt"><b>Join our Telegram</b><small>Alerts &amp; direct support</small></span>' +
      '</a>' +
      '<button type="button" class="sd-x" aria-label="Close">' + X_SVG + '</button>';
    bar.querySelector(".sd-x").addEventListener("click", function () {
      bar.remove();
      try { localStorage.setItem(STORE_KEY, "1"); } catch (e) {}
    });
    return bar;
  }

  function place() {
    injectStyles(); // always hide original sticky + telegram FAB
    try { if (localStorage.getItem(STORE_KEY) === "1") return true; } catch (e) {}
    if (document.getElementById(BAR_ID)) return true;
    document.body.appendChild(build());
    return true;
  }

  function run() {
    place();
    // re-assert a few times in case the React sticky mounts late
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      injectStyles();
      if (tries > 20) clearInterval(t);
    }, 300);
  }

  if (document.readyState === "complete") run();
  else window.addEventListener("load", run);
})();
