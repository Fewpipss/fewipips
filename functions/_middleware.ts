/**
 * Promo banner middleware (Cloudflare Pages Function).
 *
 * Injects the current promo banner just below the hero on the homepage (CFDs)
 * and the Futures page. Runs at the edge on every request, so it is independent
 * of the static build and survives re-exports. The page body is a React client
 * component (server-injected HTML gets wiped on hydration), so we inject a tiny
 * resilient script that inserts the banner after hydration and re-inserts it if
 * React ever removes it.
 *
 * ============================================================================
 * TO SWAP THE BANNER (the ONLY thing you edit for the July campaign):
 *   1. Drop the new images in the repo root (e.g. /promo-<name>.png + -mobile).
 *   2. Update the PROMO object below (image, imageMobile, href, alt, dates).
 *   3. To turn the banner OFF entirely, set enabled: false (or let endsAt pass).
 *   Deploy the normal way (branch -> gate -> PR -> merge). That's it.
 * ============================================================================
 */

interface Env {}

const PROMO = {
  enabled: true,
  image: "/promo-freereset.png",
  imageMobile: "/promo-freereset-mobile.png",
  href: "https://crm.fewpips.com/auth/signup", // TODO: confirm real Free Reset destination
  alt: "Fewpips Free Reset promo",
  ariaLabel: "Free Reset promo",
  startsAt: "", // optional ISO date (UTC), "" = no start bound
  endsAt: "",   // optional ISO date (UTC), "" = no end bound
};

// Only inject on these page paths (leave assets, /api/*, other routes untouched).
const TARGET_PATHS = new Set(["/", "/futures", "/futures/"]);

function active(): boolean {
  if (!PROMO.enabled) return false;
  const now = Date.now();
  if (PROMO.startsAt && now < Date.parse(PROMO.startsAt)) return false;
  if (PROMO.endsAt && now > Date.parse(PROMO.endsAt)) return false;
  return true;
}

function bannerScript(): string {
  const p = PROMO;
  // Single-quoted innerHTML; values are our own config (no user input).
  return (
    "<script>(function(){var S='.promo-banner-section';" +
    "function mk(){var d=document.createElement('div');d.innerHTML='" +
    '<section class="promo-banner-section" aria-label="' + p.ariaLabel + '">' +
    '<div class="c"><a href="' + p.href + '" class="promo-banner" aria-label="' + p.alt + '">' +
    '<picture><source media="(max-width:640px)" srcset="' + p.imageMobile + '">' +
    '<img src="' + p.image + '" alt="' + p.alt + '" loading="eager" decoding="async"></picture></a></div></section>' +
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
    if (!active()) return res;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return res;
    const path = new URL(ctx.request.url).pathname;
    if (!TARGET_PATHS.has(path)) return res;
    return new HTMLRewriter()
      .on("body", {
        element(el) {
          el.append(bannerScript(), { html: true });
        },
      })
      .transform(res);
  } catch (_e) {
    return res; // never break the page on a banner error
  }
};
