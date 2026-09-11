/**
 * Promo banner middleware (Cloudflare Pages Function) - SELF-SCHEDULING.
 *
 * Injects the promo banner for TODAY below the hero on / and /futures/ only.
 * The schedule below drives the whole July campaign automatically - each banner
 * shows on its own date (US Eastern, EDT/UTC-4 in July). Days NOT in SCHEDULE are
 * true blank fillers (Jul 7, 8, 11, 18). FREESET is the baseline offer shown on
 * teaser/filler days (Jul 1, 2, 14, 16, 19) + the Free Reset launch. Win-back
 * (Jul 9) is email-only, so the site shows the FREESET baseline. Zero ongoing
 * management; it rotates itself.
 *
 * Page body is a React client component (SSR-injected HTML is wiped on hydration),
 * so we inject a small resilient script that inserts the banner after hydration
 * and re-inserts it if React removes it. Reuses the existing .promo-banner-section CSS.
 *
 * TO EDIT: change SCHEDULE (add/remove a date) + drop images in /promo/. For a banner
 * that must start or end at a specific TIME rather than a whole day, add an entry to
 * ANNOUNCEMENTS instead - it wins over SCHEDULE while its window is open.
 * Preview any day: append ?_promoDate=YYYY-MM-DD to the URL (it drives both maps).
 */

interface Env {}

const HREF = "https://crm.fewpips.com/auth/signup";
const TARGET_PATHS = new Set(["/", "/futures", "/futures/"]);

const SCHEDULE: Record<string, { img: string; imgM: string; alt: string }> = {
  "2026-07-01": { img: "/promo/2026-07-01.png", imgM: "/promo/2026-07-01-m.png", alt: "Fewpips Free Reset promo" },
  "2026-07-02": { img: "/promo/2026-07-01.png", imgM: "/promo/2026-07-01-m.png", alt: "Fewpips Free Reset promo" },
  "2026-07-03": { img: "/promo/2026-07-03.png", imgM: "/promo/2026-07-03-m.png", alt: "Fewpips Independence Sale promo" },
  "2026-07-04": { img: "/promo/2026-07-04.png", imgM: "/promo/2026-07-04-m.png", alt: "Fewpips Independence Day promo" },
  "2026-07-05": { img: "/promo/2026-07-05.png", imgM: "/promo/2026-07-05-m.png", alt: "Fewpips Last Full Day promo" },
  "2026-07-06": { img: "/promo/2026-07-06.png", imgM: "/promo/2026-07-06-m.png", alt: "Fewpips Final Hours promo" },
  "2026-07-10": { img: "/promo/2026-07-10.png", imgM: "/promo/2026-07-10-m.png", alt: "Fewpips Flash Friday promo" },
  "2026-07-12": { img: "/promo/2026-07-12.png", imgM: "/promo/2026-07-12-m.png", alt: "Fewpips Power-Up Weekend promo" },
  "2026-07-13": { img: "/promo/2026-07-13.png", imgM: "/promo/2026-07-13-m.png", alt: "Fewpips Power-Up · Final Day promo" },
  "2026-07-15": { img: "/promo/2026-07-15.png", imgM: "/promo/2026-07-15-m.png", alt: "Fewpips Mid-Year Flash promo" },
  "2026-07-17": { img: "/promo/2026-07-17.png", imgM: "/promo/2026-07-17-m.png", alt: "Fewpips Flash Friday promo" },
  "2026-07-20": { img: "/promo/2026-07-20.png", imgM: "/promo/2026-07-20-m.png", alt: "Fewpips Whale Week promo" },
  "2026-07-21": { img: "/promo/2026-07-21.png", imgM: "/promo/2026-07-21-m.png", alt: "Fewpips Whale Week promo" },
  "2026-07-22": { img: "/promo/2026-07-22.png", imgM: "/promo/2026-07-22-m.png", alt: "Fewpips Whale Week · Halfway promo" },
  "2026-07-23": { img: "/promo/2026-07-23.png", imgM: "/promo/2026-07-23-m.png", alt: "Fewpips Whale Week promo" },
  "2026-07-24": { img: "/promo/2026-07-24.png", imgM: "/promo/2026-07-24-m.png", alt: "Fewpips Flash Friday × Whale Week promo" },
  "2026-07-25": { img: "/promo/2026-07-25.png", imgM: "/promo/2026-07-25-m.png", alt: "Fewpips Whale Week · 24 Hours Left promo" },
  "2026-07-26": { img: "/promo/2026-07-26.png", imgM: "/promo/2026-07-26-m.png", alt: "Fewpips Whale Week · Last Call promo" },
  "2026-07-27": { img: "/promo/2026-07-27.png", imgM: "/promo/2026-07-27-m.png", alt: "Fewpips Month-End Close promo" },
  "2026-07-28": { img: "/promo/2026-07-28.png", imgM: "/promo/2026-07-28-m.png", alt: "Fewpips Month-End Close promo" },
  "2026-07-29": { img: "/promo/2026-07-29.png", imgM: "/promo/2026-07-29-m.png", alt: "Fewpips Month-End · Last Full Day promo" },
  "2026-07-30": { img: "/promo/2026-07-30.png", imgM: "/promo/2026-07-30-m.png", alt: "Fewpips Day Of Friendship promo" },
  "2026-07-31": { img: "/promo/2026-07-31.png", imgM: "/promo/2026-07-31-m.png", alt: "Fewpips Last Call promo" },
  // Claim Week (Nick's creative, approved TG #12290): one $200+ order = a free
  // account, code CLAIM200, closes Fri Sep 4 23:59 ET. Self-expires after the 4th.
  "2026-09-01": { img: "/promo/2026-09-01.png", imgM: "/promo/2026-09-01-m.png", alt: "Fewpips Claim Week promo - code CLAIM200" },
  "2026-09-02": { img: "/promo/2026-09-01.png", imgM: "/promo/2026-09-01-m.png", alt: "Fewpips Claim Week promo - code CLAIM200" },
  "2026-09-03": { img: "/promo/2026-09-01.png", imgM: "/promo/2026-09-01-m.png", alt: "Fewpips Claim Week promo - code CLAIM200" },
  "2026-09-04": { img: "/promo/2026-09-01.png", imgM: "/promo/2026-09-01-m.png", alt: "Fewpips Claim Week promo - code CLAIM200" },
};

/**
 * ANNOUNCEMENTS - short campaign banners with an exact start/end TIMESTAMP.
 * SCHEDULE above is whole-day only (US Eastern), which cannot express "ends Friday
 * 18:00". An announcement whose window covers "now" WINS over SCHEDULE for that day;
 * outside its window the daily SCHEDULE takes over again with nothing else to change.
 * Timestamps carry their own offset (-04:00 = EDT), so no timezone maths here.
 */
const ANNOUNCEMENTS: { start: string; end: string; img: string; imgM: string; alt: string }[] = [
  {
    // Instant $100K launch. Live from deploy, auto-hides Fri 5 Sep 2026 18:00 US Eastern.
    // While it runs it supersedes the Claim Week banner on 3 and 4 Sep.
    start: "2026-09-03T00:00:00-04:00",
    end: "2026-09-05T18:00:00-04:00",
    img: "/promo/instant100k-banner-v2.png",
    imgM: "/promo/instant100k-banner-v2-m.png",
    alt: "Fewpips Instant $100K is live - funded from day one",
  },
  {
    // STRIKE Week extension (Nick, Sep 9 call): originally sealed Fri Sep 11 23:59 ET,
    // extended to Fri Sep 18 23:59 ET. Self-expires at the new seal.
    start: "2026-09-09T00:00:00-04:00",
    end: "2026-09-18T23:59:59-04:00",
    img: "/promo/strike-ext-2026.jpg",
    imgM: "/promo/strike-ext-2026-m.jpg",
    alt: "Fewpips STRIKE promo extended - buy one get one free, code STRIKE, ends Sep 18 23:59 ET",
  },
];

function pickDate(reqUrl: string): string {
  const q = new URL(reqUrl).searchParams.get("_promoDate");
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
  return new Date(Date.now() - 14400000).toISOString().slice(0, 10);
}

// ?_promoDate=YYYY-MM-DD also drives the announcement windows (evaluated at noon ET
// of that day) so a scheduled banner can be previewed before and after it expires.
function pickNow(reqUrl: string): number {
  const q = new URL(reqUrl).searchParams.get("_promoDate");
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return Date.parse(q + "T12:00:00-04:00");
  return Date.now();
}

function pickBanner(reqUrl: string): { img: string; imgM: string; alt: string } | null {
  const now = pickNow(reqUrl);
  for (const a of ANNOUNCEMENTS) {
    if (now >= Date.parse(a.start) && now < Date.parse(a.end)) return a;
  }
  return SCHEDULE[pickDate(reqUrl)] || null;
}

function bannerScript(b: { img: string; imgM: string; alt: string }): string {
  return (
    "<script>(function(){var S='.promo-banner-section';" +
    "function mk(){var d=document.createElement('div');d.innerHTML='" +
    '<section class="promo-banner-section" aria-label="Promo"><div class="c">' +
    '<a href="' + HREF + '" class="promo-banner" aria-label="' + b.alt + '">' +
    '<picture>' +
    '<source media="(max-width:640px)" type="image/webp" srcset="' + b.imgM.replace(/\.(png|jpg)$/, ".webp") + '">' +
    '<source media="(max-width:640px)" srcset="' + b.imgM + '">' +
    '<source type="image/webp" srcset="' + b.img.replace(/\.(png|jpg)$/, ".webp") + '">' +
    '<img src="' + b.img + '" alt="' + b.alt + '" loading="eager" decoding="async"></picture></a></div></section>' +
    "';return d.firstChild}" +
    "function place(){if(document.querySelector(S))return;var h=document.querySelector('.funded-hero');" +
    "if(h&&h.parentNode){h.parentNode.insertBefore(mk(),h.nextSibling)}}" +
    "var o=new MutationObserver(function(){if(!document.querySelector(S))place()});" +
    "if(document.body){o.observe(document.body,{childList:!0,subtree:!0})}" +
    "place();setTimeout(place,1200);document.addEventListener('DOMContentLoaded',place)})();</script>"
  );
}

/**
 * STRIKE WEEK top bar - SITE-WIDE, TEXT-ONLY, ZERO-CLS.
 *
 * Separate from the image promo banner above (which is hero-slot, / and /futures only).
 * This is a slim announcement bar pinned to the top of every page for the extended
 * STRIKE window. It self-expires at the `end` timestamp - nothing to remove afterwards.
 *
 * WHY A TOP BAR AND NOT A HERO IMAGE: the hero banner is injected into the document
 * flow AFTER hydration, so it pushes the page down and costs real CLS. This bar is
 * `position:fixed` (out of flow), and the space it occupies is reserved by CSS that
 * ships in the initial <head> - so the layout is correct from the FIRST paint and the
 * bar's later insertion moves nothing. CLS contribution is 0 by construction, and if
 * JS never runs the page still lays out correctly (just a dark strip, no jump).
 *
 * DISMISS: choice is stored in localStorage. A tiny SYNCHRONOUS head script re-applies
 * it before first paint (html.fp-sb-off), so a returning dismissed visitor never gets
 * the space reserved and then removed - which would itself have been a layout shift.
 *
 * Preview any date with ?_promoDate=YYYY-MM-DD (drives the same clock as the banners).
 */
const STRIKE_BAR = {
  // RETIRED Sep 9 (Veljko): replaced by the STRIKE hero-slot graphic banner in
  // ANNOUNCEMENTS above. Window closed so the bar never renders; code kept as the
  // reusable zero-CLS top-bar pattern.
  start: "2026-09-07T09:00:00-04:00",
  end: "2026-09-07T09:00:00-04:00",
  href: HREF,
  h: 44, // desktop bar height (px) - must match the CSS below
  hM: 48, // mobile bar height (px)
};

function strikeBarOn(reqUrl: string): boolean {
  const now = pickNow(reqUrl);
  return now >= Date.parse(STRIKE_BAR.start) && now < Date.parse(STRIKE_BAR.end);
}

// Reserved space + styling. Injected into <head> so it is applied at first paint.
// Everything is scoped to `html:not(.fp-sb-off)` so dismissing collapses the space.
function strikeBarStyle(): string {
  const { h, hM } = STRIKE_BAR;
  return (
    "<style>" +
    // --- reserved space (this is what makes CLS zero) ---
    "html:not(.fp-sb-off) body{padding-top:" + h + "px}" +
    "html:not(.fp-sb-off) .nav{top:" + h + "px}" +
    // --- the bar itself ---
    ".fp-sb{position:fixed;top:0;left:0;right:0;height:" + h + "px;z-index:1001;" +
    "background:#0a0a0a;border-bottom:1px solid rgba(66,255,0,.28);" +
    "box-shadow:0 2px 18px rgba(66,255,0,.10);" +
    "display:flex;align-items:center;justify-content:center;gap:14px;padding:0 44px 0 16px;" +
    "font-family:var(--font-b),system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
    "-webkit-font-smoothing:antialiased}" +
    ".fp-sb-off .fp-sb{display:none}" +
    ".fp-sb a.fp-sb-l{display:flex;align-items:center;gap:12px;text-decoration:none;color:#e9ffe2;" +
    "font-size:13.5px;line-height:1.25;letter-spacing:.01em;min-width:0}" +
    ".fp-sb-tag{color:#0a0a0a;background:#42ff00;border-radius:4px;padding:3px 7px;" +
    "font-size:10.5px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;white-space:nowrap;flex:none}" +
    ".fp-sb-msg{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".fp-sb-msg b{color:#fff;font-weight:700}" +
    ".fp-sb-meta{color:#9bb694;font-size:12px;white-space:nowrap;flex:none}" +
    ".fp-sb-code{color:#FFC02E;font-weight:700;letter-spacing:.06em}" +
    ".fp-sb-dot{color:#3f5c3a;padding:0 2px}" +
    ".fp-sb-cta{color:#42ff00;font-weight:700;font-size:12.5px;white-space:nowrap;flex:none;" +
    "border:1px solid rgba(66,255,0,.45);border-radius:999px;padding:5px 12px;" +
    "transition:background .25s ease,color .25s ease}" +
    ".fp-sb a.fp-sb-l:hover .fp-sb-cta{background:#42ff00;color:#0a0a0a}" +
    ".fp-sb-x{position:absolute;top:50%;right:10px;transform:translateY(-50%);" +
    "background:none;border:0;cursor:pointer;color:#6d8567;font-size:19px;line-height:1;" +
    "padding:6px 8px;border-radius:6px;transition:color .2s ease}" +
    ".fp-sb-x:hover{color:#e9ffe2}" +
    ".fp-sb-m{display:none}" +
    ".fp-sb-tm{display:none}" +
    // --- mobile: two compact lines, keeps the deadline visible ---
    "@media(max-width:768px){" +
    "html:not(.fp-sb-off) body{padding-top:" + hM + "px}" +
    "html:not(.fp-sb-off) .nav{top:" + hM + "px}" +
    ".fp-sb{height:" + hM + "px;padding:0 34px 0 10px;gap:0;justify-content:flex-start}" +
    ".fp-sb a.fp-sb-l{gap:8px;width:100%;align-items:center}" +
    ".fp-sb-d{display:none}" +
    ".fp-sb-td{display:none}" +
    ".fp-sb-tm{display:inline}" +
    ".fp-sb-m{display:block;min-width:0;flex:1 1 auto}" +
    ".fp-sb-m1{display:block;font-size:11.5px;font-weight:600;color:#e9ffe2;" +
    "white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".fp-sb-m2{display:block;font-size:10.5px;color:#9bb694;margin-top:2px;" +
    "white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".fp-sb-tag{font-size:9.5px;padding:3px 6px;align-self:center}" +
    "}" +
    "@media(prefers-reduced-motion:reduce){.fp-sb-cta{transition:none}}" +
    "</style>"
  );
}

/**
 * Synchronous, inline, no network: re-applies a stored dismissal BEFORE first paint.
 * React owns <html>'s className and overwrites it during hydration, which silently wiped
 * the flag and brought a dismissed bar back (caught in preview testing). So the flag also
 * lives on window.__fpSbOff and an attribute observer re-asserts the class if React drops
 * it - the observer fires as a microtask, so the padding never repaints wrong.
 */
const strikeBarBoot =
  "<script>(function(){var d=false;" +
  "try{d=localStorage.getItem('fp_sb_strike')==='1'}catch(e){}" +
  "window.__fpSbOff=d;var H=document.documentElement;" +
  "function ap(){if(window.__fpSbOff&&H.className.indexOf('fp-sb-off')<0){H.className+=' fp-sb-off'}}" +
  "window.__fpSbApply=ap;ap();" +
  "try{new MutationObserver(ap).observe(H,{attributes:!0,attributeFilter:['class']})}catch(e){}" +
  "})();</script>";

function strikeBarScript(): string {
  const html =
    '<div class="fp-sb" role="region" aria-label="STRIKE promo">' +
    '<a class="fp-sb-l" href="' + STRIKE_BAR.href + '">' +
    '<span class="fp-sb-tag"><span class="fp-sb-td">Strike Week</span>' +
    '<span class="fp-sb-tm">Strike</span></span>' +
    // desktop copy
    '<span class="fp-sb-d fp-sb-msg">Buy one, <b>get one free</b> on every account size' +
    '<span class="fp-sb-dot">&middot;</span>two free at $50k and above</span>' +
    '<span class="fp-sb-d fp-sb-meta">Code <span class="fp-sb-code">STRIKE</span>' +
    '<span class="fp-sb-dot">&middot;</span>ends Sep 18, 23:59 ET</span>' +
    '<span class="fp-sb-d fp-sb-cta">Claim now</span>' +
    // mobile copy
    '<span class="fp-sb-m">' +
    '<span class="fp-sb-m1">Buy one, get one free' +
    '<span class="fp-sb-dot">&middot;</span>two free at $50k+</span>' +
    '<span class="fp-sb-m2">Code <span class="fp-sb-code">STRIKE</span>' +
    '<span class="fp-sb-dot">&middot;</span>ends Sep 18, 23:59 ET</span>' +
    '</span>' +
    '</a>' +
    '<button class="fp-sb-x" type="button" aria-label="Dismiss promo">&times;</button>' +
    '</div>';
  return (
    "<script>(function(){var S='.fp-sb';" +
    "function mk(){var d=document.createElement('div');d.innerHTML=" + JSON.stringify(html) + ";" +
    "var n=d.firstChild;" +
    "n.querySelector('.fp-sb-x').addEventListener('click',function(e){" +
    "e.preventDefault();e.stopPropagation();" +
    "window.__fpSbOff=!0;if(window.__fpSbApply){window.__fpSbApply()}" +
    "else{document.documentElement.className+=' fp-sb-off'}" +
    "try{localStorage.setItem('fp_sb_strike','1')}catch(_){}" +
    "});return n}" +
    "function place(){if(window.__fpSbOff)return;" +
    "if(document.querySelector(S))return;" +
    "if(document.body){document.body.appendChild(mk())}}" +
    "var o=new MutationObserver(function(){place()});" +
    "if(document.body){o.observe(document.body,{childList:!0})}" +
    "place();setTimeout(place,1200);document.addEventListener('DOMContentLoaded',place)})();</script>"
  );
}

// Official Fewpips Traders Community - added to the footer social row on every page.
// The footer is client-hydrated (its socials render from JS chunks), so we inject a
// resilient script that appends the Telegram icon to .ft-brand-soc after hydration.
const TELEGRAM = "https://t.me/fewpips_traders";

function footerScript(): string {
  const svg =
    "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' " +
    "stroke-linecap='round' stroke-linejoin='round'>" +
    "<line x1='22' y1='2' x2='11' y2='13'></line>" +
    "<polygon points='22 2 15 22 11 13 2 9 22 2'></polygon></svg>";
  return (
    "<script>(function(){var TG=" + JSON.stringify(TELEGRAM) + ";" +
    "function ic(){var a=document.createElement('a');a.href=TG;a.target='_blank';a.rel='noopener';" +
    "a.className='ft-tg';a.setAttribute('aria-label','Telegram');a.innerHTML=" + JSON.stringify(svg) + ";return a}" +
    "function add(){var r=document.querySelectorAll('.ft-brand-soc');" +
    "for(var i=0;i<r.length;i++){if(!r[i].querySelector('.ft-tg')){r[i].appendChild(ic())}}}" +
    "var o=new MutationObserver(function(){add()});" +
    "if(document.body){o.observe(document.body,{childList:!0,subtree:!0})}" +
    "add();setTimeout(add,1200);document.addEventListener('DOMContentLoaded',add)})();</script>"
  );
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const res = await ctx.next();
  try {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return res;
    const path = new URL(ctx.request.url).pathname;
    const b = TARGET_PATHS.has(path) ? pickBanner(ctx.request.url) : null;
    const sb = strikeBarOn(ctx.request.url); // top bar: every page, not just the landings

    const transformed = new HTMLRewriter()
      .on("head", {
        element(el) {
          // Reserved space ships with the initial HTML -> correct layout at first paint.
          // The boot script must stay SYNCHRONOUS and BEFORE paint, or a dismissed bar
          // would reserve space and then collapse it (a layout shift).
          if (sb) {
            el.append(strikeBarStyle(), { html: true });
            el.append(strikeBarBoot, { html: true });
          }
          // The promo banner is the mobile LCP element and its markup is injected by
          // script AFTER hydration - preload today's image so it paints instantly.
          if (b) {
            el.append(
              '<link rel="preload" as="image" href="' + b.imgM.replace(/\.(png|jpg)$/, ".webp") +
                '" media="(max-width:640px)" fetchpriority="high">',
              { html: true },
            );
            el.append(
              '<link rel="preload" as="image" href="' + b.img.replace(/\.(png|jpg)$/, ".webp") +
                '" media="(min-width:641px)" fetchpriority="high">',
              { html: true },
            );
          }
        },
      })
      .on("body", {
        element(el) {
          el.append(footerScript(), { html: true });         // Telegram community link, ALL pages
          if (b) el.append(bannerScript(b), { html: true });  // promo banner, / and /futures only
          if (sb) el.append(strikeBarScript(), { html: true }); // STRIKE top bar, ALL pages
        },
      })
      .transform(res);

    const out = new Response(transformed.body, transformed);
    // Banner pages change daily at midnight ET -> never serve stale across the date
    // boundary. The STRIKE bar has a hard expiry too, so any page carrying it must not
    // be served from cache past that moment.
    if (b || sb) out.headers.set("cache-control", "no-store");
    return out;
  } catch (_e) { return res; }
};
