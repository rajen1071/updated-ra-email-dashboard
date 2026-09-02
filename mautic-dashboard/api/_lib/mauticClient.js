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
export async function getEmailStats(emailId) {
  const data = await mauticFetch(`/api/emails/${emailId}`);
  const email = data.email || {};
  const stats = email.stats || {};

  const sent = email.sentCount ?? stats.sentCount ?? 0;
  const opened = email.readCount ?? stats.readCount ?? 0;
  const clicked = email.stats?.uniqueClickCount ?? email.clickCount ?? 0;
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
 * Get DNC (do-not-contact) contact count.
 */
export async function getDncCount() {
  const data = await mauticFetch(`/api/contacts?search=${encodeURIComponent("dnc:email")}&limit=1`);
  return data.total ? Number(data.total) : 0;
}
