/**
 * Promo banner middleware (Cloudflare Pages Function) - SELF-SCHEDULING.
 *
 * Injects the promo banner for TODAY below the hero on / and /futures/ only.
 * The schedule below drives the whole July campaign automatically - each banner
 * shows on exactly its own date (US Eastern), gap days show nothing. No ongoing
 * management needed; it rotates itself.
 *
 * Page body is a React client component (SSR-injected HTML is wiped on hydration),
 * so we inject a small resilient script that inserts the banner after hydration
 * and re-inserts it if React removes it. Reuses the existing .promo-banner-section CSS.
 *
 * TO CHANGE THE CAMPAIGN: edit SCHEDULE (add/remove a date) and drop images in
 * /promo/. To preview any day: append ?_promoDate=YYYY-MM-DD to the URL.
 * All banners link to the signup CTA; the discount code is shown in the image.
 */

interface Env {}

const HREF = "https://crm.fewpips.com/auth/signup";
const TARGET_PATHS = new Set(["/", "/futures", "/futures/"]);

// date (US Eastern, YYYY-MM-DD) -> banner. July is entirely EDT (UTC-4).
const SCHEDULE: Record<string, { img: string; imgM: string; alt: string }> = {
  "2026-07-01": { img: "/promo/2026-07-01.png", imgM: "/promo/2026-07-01-m.png", alt: "Fewpips Free Reset promo" },
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
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q; // preview override
  return new Date(Date.now() - 14400000).toISOString().slice(0, 10); // -4h = EDT
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

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const res = await ctx.next();
  try {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return res;
    const path = new URL(ctx.request.url).pathname;
    if (!TARGET_PATHS.has(path)) return res;
    const b = SCHEDULE[pickDate(ctx.request.url)];
    if (!b) return res; // gap day -> no banner
    return new HTMLRewriter()
      .on("body", { element(el) { el.append(bannerScript(b), { html: true }); } })
      .transform(res);
  } catch (_e) {
    return res; // never break the page
  }
};
