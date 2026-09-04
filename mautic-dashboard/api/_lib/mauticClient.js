/**
 * mauticClient.js
 * ------------------------------------------------------------------
 * Runs ONLY on the server (Vercel serverless function), never in the
 * browser. Handles OAuth2 authentication against Mautic and exposes a
 * small helper to call any Mautic REST endpoint.
 *
 * Required environment variables (set these in Vercel → Settings →
 * Environment Variables, never commit real values to git):
 *   MAUTIC_BASE_URL      e.g. https://g1.restaurantassociation.com
 *   MAUTIC_CLIENT_ID
 *   MAUTIC_CLIENT_SECRET
 * ------------------------------------------------------------------
 */

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry) {
    return cachedToken;
  }

  const baseUrl = (process.env.MAUTIC_BASE_URL || "").replace(/\/+$/, "");
  const clientId = process.env.MAUTIC_CLIENT_ID;
  const clientSecret = process.env.MAUTIC_CLIENT_SECRET;

  if (!baseUrl || !clientId || !clientSecret) {
    throw new Error(
      "Missing Mautic credentials. Set MAUTIC_BASE_URL, MAUTIC_CLIENT_ID, MAUTIC_CLIENT_SECRET in your environment."
    );
  }

  const res = await fetch(`${baseUrl}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mautic auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Refresh a little before actual expiry
  cachedTokenExpiry = now + (data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * Fetch daily Sent/Opened/Bounced counts for one email over the last
 * N days, using Mautic's generic Stats API (GET /api/stats/email_stats).
 * NOTE: Mautic does NOT expose a public "/api/emails/{id}/stats"
 * time-series endpoint — the daily chart in the Mautic admin UI is
 * built internally. This is the public-API equivalent: pull the raw
 * email_stats rows for a bounded date window and aggregate by day
 * ourselves (pulling ALL-time rows for a high-volume email would be
 * far too slow/large for a live request).
 */
/**
 * Fetch daily Sent/Opened/Bounced counts for one email between two exact
 * dates (inclusive), using Mautic's generic Stats API
 * (GET /api/stats/email_stats). NOTE: Mautic does NOT expose a public
 * "/api/emails/{id}/stats" time-series endpoint — the daily chart in the
 * Mautic admin UI is built internally. This is the public-API equivalent:
 * pull the raw email_stats rows for the chosen date window and aggregate
 * by day ourselves (pulling ALL-time rows for a high-volume email would
 * be far too slow/large for a live request, so the range is capped).
 */
export async function getEmailDailyTrend(emailId, fromStr, toStr) {
  const today = new Date();
  const defaultFrom = new Date(today);
  defaultFrom.setDate(defaultFrom.getDate() - 15);

  let from = fromStr ? new Date(fromStr) : defaultFrom;
  let to = toStr ? new Date(toStr) : today;
  if (isNaN(from.getTime())) from = defaultFrom;
  if (isNaN(to.getTime())) to = today;
  if (from > to) [from, to] = [to, from]; // swap if picked backwards

  // Cap the range to 90 days so a live request can never time out.
  const maxRangeMs = 90 * 24 * 60 * 60 * 1000;
  if (to.getTime() - from.getTime() > maxRangeMs) {
    from = new Date(to.getTime() - maxRangeMs);
  }

  const sinceStr = from.toISOString().slice(0, 10);
  // Mautic's "gte/lte" on date_sent compares full datetimes, so push the
  // upper bound to the start of the day AFTER "to" to include all of "to".
  const untilExclusive = new Date(to);
  untilExclusive.setDate(untilExclusive.getDate() + 1);
  const untilStr = untilExclusive.toISOString().slice(0, 10);

  const params = new URLSearchParams();
  params.set("where[0][col]", "email_id");
  params.set("where[0][expr]", "eq");
  params.set("where[0][val]", String(emailId));
  params.set("where[1][col]", "date_sent");
  params.set("where[1][expr]", "gte");
  params.set("where[1][val]", sinceStr);
  params.set("where[2][col]", "date_sent");
  params.set("where[2][expr]", "lt");
  params.set("where[2][val]", untilStr);
  params.set("order[0][col]", "date_sent");
  params.set("order[0][dir]", "asc");
  params.set("limit", "5000");

  const data = await mauticFetch(`/api/stats/email_stats?${params.toString()}`);
  const rows = data?.stats || [];

  // Start every day in the window at zero, so the chart is an accurate,
  // continuous daily timeline — not just the days that happened to have sends.
  const byDate = {};
  const cursor = new Date(from);
  while (cursor <= to) {
    const key = cursor.toISOString().slice(0, 10);
    byDate[key] = { date: key, sent: 0, opened: 0, bounced: 0 };
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const row of rows) {
    const day = (row.date_sent || "").slice(0, 10);
    if (!day || !byDate[day]) continue;
    byDate[day].sent += 1;
    if (row.is_read === "1" || row.is_read === 1 || row.is_read === true) byDate[day].opened += 1;
    if (row.is_failed === "1" || row.is_failed === 1 || row.is_failed === true) byDate[day].bounced += 1;
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Call any Mautic REST API path, e.g. mauticFetch("/api/contacts?limit=1")
 */
export async function mauticFetch(path) {
  const baseUrl = (process.env.MAUTIC_BASE_URL || "").replace(/\/+$/, "");
  const token = await getAccessToken();

  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mautic API error (${res.status}) on ${path}: ${text}`);
  }

  return res.json();
}

/**
 * Fetch full stats for a single email by ID.
 * Returns normalized { id, name, sentCount, deliveredCount, readCount (opened),
 * clickCount, bounceCount, unsubscribeCount }
 */
/**
 * Fetch total link-click count for one email using Mautic's generic
 * Stats API against channel_url_trackables (the table that actually
 * tracks link clicks; the /api/emails/{id} object has no click field).
 */
async function getEmailClickCount(emailId) {
  const params = new URLSearchParams();
  params.set("where[0][col]", "channel");
  params.set("where[0][expr]", "eq");
  params.set("where[0][val]", "email");
  params.set("where[1][col]", "channel_id");
  params.set("where[1][expr]", "eq");
  params.set("where[1][val]", String(emailId));
  params.set("limit", "500");

  try {
    const data = await mauticFetch(`/api/stats/channel_url_trackables?${params.toString()}`);
    const rows = data?.stats || [];
    return rows.reduce((sum, r) => sum + (parseInt(r.unique_hits, 10) || 0), 0);
  } catch (e) {
    return 0;
  }
}

/**
 * Fetch full stats for a single email by ID.
 * Returns normalized { id, name, sentCount, deliveredCount, readCount (opened),
 * clickCount, bounceCount, unsubscribeCount }
 */
export async function getEmailStats(emailId) {
  const data = await mauticFetch(`/api/emails/${emailId}`);
  const email = data.email || {};

  const sent = email.sentCount ?? 0;
  const opened = email.readCount ?? 0;
  const clicked = await getEmailClickCount(emailId);
  const bounced = email.stats?.bounceCount ?? email.bounceCount ?? 0;

  return {
    id: email.id,
    name: email.name,
    subject: email.subject,
    sent,
    delivered: sent - bounced,
    opened,
    clicked,
    bounced,
  };
}

/**
 * Fetch multiple emails' stats in parallel.
 */
export async function getManyEmailStats(emailIds) {
  const results = await Promise.all(
    emailIds.map((id) => getEmailStats(id).catch((err) => ({ id, error: err.message })))
  );
  return results;
}

/**
 * Search emails whose name contains a given substring
 * (used for Newsletter / Blog which don't have fixed IDs).
 */
export async function findEmailsByNameContains(substring) {
  const data = await mauticFetch(
    `/api/emails?search=${encodeURIComponent(substring)}&limit=100`
  );
  const emails = data.emails ? Object.values(data.emails) : [];
  return emails.filter((e) => e.name && e.name.includes(substring));
}

/**
 * Count contacts that carry a given tag.
 */
export async function countContactsByTag(tag) {
  const data = await mauticFetch(
    `/api/contacts?search=${encodeURIComponent(`tag:${tag}`)}&limit=1`
  );
  return data.total ? Number(data.total) : 0;
}

/**
 * Get submission count for a Mautic form.
 */
export async function getFormSubmissionCount(formId) {
  const data = await mauticFetch(`/api/forms/${formId}/submissions?limit=1`);
  return data.total ? Number(data.total) : 0;
}

/**
 * Get individual submitters for a form: First Name, Last Name, Email,
 * and submission date, pulled from Mautic's form submissions endpoint.
 * Field aliases vary by form builder setup, so we try the common ones.
 */
function pickField(results, aliases) {
  if (!results) return "";
  for (const alias of aliases) {
    if (results[alias] != null && results[alias] !== "") return results[alias];
  }
  return "";
}

export async function getFormSubmissions(formId, limit = 500) {
  const data = await mauticFetch(`/api/forms/${formId}/submissions?limit=${limit}`);
  const rows = data?.submissions || [];

  return rows.map((row) => {
    const results = row.results || {};
    return {
      id: row.id,
      firstName: pickField(results, ["first_name", "firstname", "fname", "First Name"]),
      lastName: pickField(results, ["last_name", "lastname", "lname", "Last Name"]),
      email: pickField(results, ["email", "e_mail", "Email"]),
      dateSubmitted: row.dateSubmitted || null,
    };
  });
}

/**
 * Get a form's basic details (currently just the name).
 */
export async function getFormName(formId) {
  const data = await mauticFetch(`/api/forms/${formId}`);
  return data?.form?.name || "";
}

/**
 * Get DNC (do-not-contact) contact count.
 */
export async function getDncCount() {
  const data = await mauticFetch(`/api/contacts?search=${encodeURIComponent("dnc:email")}&limit=1`);
  return data.total ? Number(data.total) : 0;
}
