// deploy-marker: popup capture v2 — sheet creds moved to env vars (2026-06-24)
/**
 * Fewpips Discount Popup — Signup endpoint (ActiveCampaign)
 *
 * Cloudflare Pages Function. Front-end POSTs to /api/popup-signup with
 *   { first_name, email, timezone, source, url, referrer }
 * and expects 200 { ok: true } on success, 4xx/5xx { error } otherwise.
 *
 * On success this:
 *   1. Forwards the lead to the contacts sheet (primary capture, gates the 200).
 *   2. Best-effort upserts the contact into ActiveCampaign + triggers the
 *      welcome automation that delivers the discount code (only if CRM_* set).
 *
 * Required env vars (set encrypted in the Cloudflare Pages project):
 *   - SHEET_WEBHOOK_URL  Google Apps Script contacts-sheet endpoint (primary capture)
 *   - SHEET_TOKEN        shared token the Apps Script checks
 * Optional (enables the welcome-email automation):
 *   - CRM_API_URL   e.g. https://fewpips.api-us1.com   (AC account base URL)
 *   - CRM_API_KEY   ActiveCampaign API key (Settings → Developer)
 *   - CRM_LIST_ID   numeric list id the welcome automation listens on, and/or
 *   - CRM_TAG_ID    numeric tag id the welcome automation listens on
 *   - RATE_LIMIT_KV KV namespace for per-IP rate limiting (falls open if absent).
 */

interface SignupBody {
  first_name?: string;
  email?: string;
  timezone?: string;
  source?: string;
  url?: string;
  referrer?: string;
}

interface Env {
  SHEET_WEBHOOK_URL?: string;
  SHEET_TOKEN?: string;
  CRM_API_URL?: string;
  CRM_API_KEY?: string;
  CRM_LIST_ID?: string;
  CRM_TAG_ID?: string;
  RATE_LIMIT_KV?: KVNamespace;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function rateLimitOk(env: Env, ip: string): Promise<boolean> {
  if (!env.RATE_LIMIT_KV) return true;
  const key = `pop:${ip}`;
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const cap = 10;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const arr: number[] = raw ? JSON.parse(raw) : [];
  const recent = arr.filter((t) => now - t < windowMs);
  if (recent.length >= cap) return false;
  recent.push(now);
  await env.RATE_LIMIT_KV.put(key, JSON.stringify(recent), { expirationTtl: 700 });
  return true;
}

/**
 * ActiveCampaign upsert + trigger. Returns ok:false with a reason so the
 * caller can log it; the front-end only ever sees a generic error.
 */
async function pushToCrm(
  env: Env,
  payload: SignupBody,
): Promise<{ ok: boolean; error?: string }> {
  const base = (env.CRM_API_URL || "").replace(/\/+$/, "");
  const apiKey = env.CRM_API_KEY || "";
  if (!base || !apiKey) {
    return { ok: false, error: "CRM_API_URL / CRM_API_KEY not configured" };
  }

  const headers = {
    "Api-Token": apiKey,
    "content-type": "application/json",
    accept: "application/json",
  };

  // 1. Upsert the contact.
  const syncRes = await fetch(`${base}/api/3/contact/sync`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      contact: {
        email: payload.email,
        firstName: payload.first_name,
      },
    }),
  });

  if (!syncRes.ok) {
    const detail = await syncRes.text().catch(() => "");
    return { ok: false, error: `contact/sync ${syncRes.status}: ${detail.slice(0, 200)}` };
  }

  const syncJson = (await syncRes.json().catch(() => null)) as
    | { contact?: { id?: string | number } }
    | null;
  const contactId = syncJson?.contact?.id;
  if (!contactId) {
    return { ok: false, error: "contact/sync returned no contact id" };
  }

  // 2. Trigger the welcome automation by subscribing to the list and/or
  //    applying the tag. Either is enough depending on how the automation
  //    is configured; we do whichever env vars are present.
  const triggers: Promise<Response>[] = [];

  if (env.CRM_LIST_ID) {
    triggers.push(
      fetch(`${base}/api/3/contactLists`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          contactList: { list: Number(env.CRM_LIST_ID), contact: contactId, status: 1 },
        }),
      }),
    );
  }

  if (env.CRM_TAG_ID) {
    triggers.push(
      fetch(`${base}/api/3/contactTags`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          contactTag: { contact: contactId, tag: Number(env.CRM_TAG_ID) },
        }),
      }),
    );
  }

  if (triggers.length === 0) {
    return { ok: false, error: "neither CRM_LIST_ID nor CRM_TAG_ID configured" };
  }

  const results = await Promise.all(triggers);
  const failed = results.find((r) => !r.ok);
  if (failed) {
    const detail = await failed.text().catch(() => "");
    return { ok: false, error: `trigger ${failed.status}: ${detail.slice(0, 200)}` };
  }

  return { ok: true };
}

/**
 * Forward the lead to the Google Apps Script contacts sheet. Primary capture
 * that makes the popup functional. Endpoint + token come from env vars
 * (SHEET_WEBHOOK_URL / SHEET_TOKEN) so no secret lives in this (public) repo.
 */
async function forwardToSheet(
  payload: SignupBody,
  env: Env,
): Promise<{ ok: boolean; error?: string }> {
  const url = env.SHEET_WEBHOOK_URL || "";
  const token = env.SHEET_TOKEN || "";
  if (!url || !token) {
    return { ok: false, error: "SHEET_WEBHOOK_URL / SHEET_TOKEN not configured" };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "follow",
      body: JSON.stringify({
        token,
        first_name: payload.first_name,
        email: payload.email,
        timezone: payload.timezone,
        source: payload.source,
        url: payload.url,
        referrer: payload.referrer,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `sheet ${res.status}: ${detail.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `sheet fetch failed: ${String(e).slice(0, 200)}` };
  }
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: SignupBody;
  try {
    body = (await ctx.request.json()) as SignupBody;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const first_name = String(body.first_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const timezone = String(body.timezone || "").trim();
  const source = String(body.source || "site_popup_v2").trim();
  const url = String(body.url || "").trim();
  const referrer = String(body.referrer || "").trim();

  if (!first_name) return json({ error: "Missing first_name" }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: "Invalid email" }, 400);

  const ip =
    ctx.request.headers.get("cf-connecting-ip") ||
    ctx.request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "0.0.0.0";

  if (!(await rateLimitOk(ctx.env, ip))) {
    return json({ error: "Too many requests" }, 429);
  }

  const lead: SignupBody = { first_name, email, timezone, source, url, referrer };

  // Primary capture: forward the lead to the contacts sheet. Awaited and gates
  // the response, so the user only sees success when the lead was captured.
  const sheet = await forwardToSheet(lead, ctx.env);
  if (!sheet.ok) {
    console.error("popup-signup sheet forward failed:", sheet.error);
    return json({ error: "Signup failed" }, 502);
  }

  // Best-effort: also upsert into ActiveCampaign + trigger the welcome
  // automation when the CRM env vars are configured. Never blocks the
  // user-facing response, so a missing/failed CRM never breaks the popup.
  ctx.waitUntil(
    pushToCrm(ctx.env, lead)
      .then((r) => {
        if (!r.ok) console.error("popup-signup CRM push (non-blocking) failed:", r.error);
      })
      .catch((e) => console.error("popup-signup CRM push threw:", e)),
  );

  return json({ ok: true });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });
