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
 * TO EDIT: change SCHEDULE (add/remove a date) + drop images in /promo/.
 * Preview any day: append ?_promoDate=YYYY-MM-DD to the URL.
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
};

function pickDate(reqUrl: string): string {
  const q = new URL(reqUrl).searchParams.get("_promoDate");
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
  return new Date(Date.now() - 14400000).toISOString().slice(0, 10);
}

function bannerScript(b: { img: string; imgM: string; alt: string }): string {
  return (
    "<script>(function(){var S='.promo-banner-section';" +
    "function mk(){var d=document.createElement('div');d.innerHTML='" +
    '<section class="promo-banner-section" aria-label="Promo"><div class="c">' +
    '<a href="' + HREF + '" class="promo-banner" aria-label="' + b.alt + '">' +
    '<picture><source media="(max-width:640px)" srcset="' + b.imgM + '">' +
    '<img src="' + b.img + '" alt="' + b.alt + '" loading="eager" decoding="async"></picture></a></div></section>' +
    "';return d.firstChild}" +
    "function place(){if(document.querySelector(S))return;var h=document.querySelector('.funded-hero');" +
    "if(h&&h.parentNode){h.parentNode.insertBefore(mk(),h.nextSibling)}}" +
    "var o=new MutationObserver(function(){if(!document.querySelector(S))place()});" +
    "if(document.body){o.observe(document.body,{childList:!0,subtree:!0})}" +
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
    const b = TARGET_PATHS.has(path) ? SCHEDULE[pickDate(ctx.request.url)] : null;

    const transformed = new HTMLRewriter()
      .on("body", {
        element(el) {
          el.append(footerScript(), { html: true });         // Telegram community link, ALL pages
          if (b) el.append(bannerScript(b), { html: true });  // promo banner, / and /futures only
        },
      })
      .transform(res);

    const out = new Response(transformed.body, transformed);
    // Banner pages change daily at midnight ET -> never serve stale across the date
    // boundary. The footer link is static, so other pages keep normal caching.
    if (b) out.headers.set("cache-control", "no-store");
    return out;
  } catch (_e) { return res; }
};
