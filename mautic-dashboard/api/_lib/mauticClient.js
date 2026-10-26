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

import { rangeConditions, isInRange } from "./dateRange.js";

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
 * Fetch daily Sent/Opened/Clicked/Bounced counts for one email between two exact
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

  // Every send in the window, paged — a single bulk send can be tens of
  // thousands of rows, so one capped request would drop most of them.
  // Clicks are link clicks made that day (page_hits), any send.
  const [rows, hits] = await Promise.all([
    statsRows("email_stats", [
      { col: "email_id", expr: "eq", val: emailId },
      { col: "date_sent", expr: "gte", val: sinceStr },
      { col: "date_sent", expr: "lt", val: untilStr },
    ]),
    statsRows("page_hits", [
      { col: "email_id", expr: "eq", val: emailId },
      { col: "date_hit", expr: "gte", val: sinceStr },
      { col: "date_hit", expr: "lt", val: untilStr },
    ]).catch(() => []),
  ]);

  // Start every day in the window at zero, so the chart is an accurate,
  // continuous daily timeline — not just the days that happened to have sends.
  const byDate = {};
  const cursor = new Date(from);
  while (cursor <= to) {
    const key = cursor.toISOString().slice(0, 10);
    byDate[key] = { date: key, sent: 0, opened: 0, clicked: 0, bounced: 0 };
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const row of rows) {
    const day = (row.date_sent || "").slice(0, 10);
    if (!day || !byDate[day]) continue;
    byDate[day].sent += 1;
    if (row.is_read === "1" || row.is_read === 1 || row.is_read === true) byDate[day].opened += 1;
    if (row.is_failed === "1" || row.is_failed === 1 || row.is_failed === true) byDate[day].bounced += 1;
  }

  // Unique contact per link per day, like the all-time click count.
  const clickedPerDay = new Set();
  for (const hit of hits) {
    const day = (hit.date_hit || "").slice(0, 10);
    const key = `${day}:${hit.redirect_id}:${hit.lead_id}`;
    if (!byDate[day] || clickedPerDay.has(key)) continue;
    clickedPerDay.add(key);
    byDate[day].clicked += 1;
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
    const err = new Error(`Mautic API error (${res.status}) on ${path}: ${text}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Mautic "where" query params from [{ col, expr, val }]. An array val
 * (for expr "in") is sent as val[]=1&val[]=2.
 */
function whereParams(conditions) {
  const params = new URLSearchParams();
  conditions.forEach((c, i) => {
    params.set(`where[${i}][col]`, c.col);
    params.set(`where[${i}][expr]`, c.expr);
    if (Array.isArray(c.val)) {
      for (const v of c.val) params.append(`where[${i}][val][]`, String(v));
    } else {
      params.set(`where[${i}][val]`, String(c.val));
    }
  });
  return params;
}

/** Number of rows in a Stats API table matching the conditions. */
async function statsTotal(table, conditions) {
  const params = whereParams(conditions);
  params.set("limit", "1");
  const data = await mauticFetch(`/api/stats/${table}?${params.toString()}`);
  return data?.total ? Number(data.total) : 0;
}

/** Every row in a Stats API table matching the conditions, paged. */
async function statsRows(table, conditions, pageSize = 5000, maxPages = 40) {
  const rows = [];
  for (let page = 0; page < maxPages; page++) {
    const params = whereParams(conditions);
    params.set("start", String(page * pageSize));
    params.set("limit", String(pageSize));
    const data = await mauticFetch(`/api/stats/${table}?${params.toString()}`);
    const batch = data?.stats || [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

/** Run fn over items with at most `limit` requests in flight. */
async function mapLimit(items, limit, fn) {
  const results = Array.from({ length: items.length });
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/**
 * Unique link clicks for one email within a date range, from page_hits
 * (each tracked link click is a hit with email_id set). Counted as
 * unique contact per link, matching channel_url_trackables.unique_hits
 * used for the all-time number.
 */
async function getEmailClickCountInRange(emailId, range) {
  try {
    const rows = await statsRows("page_hits", [
      { col: "email_id", expr: "eq", val: emailId },
      ...rangeConditions("date_hit", range),
    ]);
    return new Set(rows.map((r) => `${r.redirect_id}:${r.lead_id}`)).size;
  } catch (e) {
    return 0;
  }
}

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

/*
 * Bounces. Mautic keeps two records of a bounce, and its email page
 * subtracts both from Sent to get "Delivered" (the dashboard matches it):
 *  - failed sends: email_stats rows with is_failed=1; the bounce reason
 *    is inside open_details
 *  - bounced contacts: lead_donotcontact rows with reason 2 (= bounced);
 *    the bounce reason is in comments. channel_id is the email whose send
 *    bounced. A contact has one such row, for the first email that
 *    bounced — they aren't emailed again after that.
 * The same bounce usually appears in both, so the total counts most
 * bounces twice — that is how Mautic itself computes it.
 *
 * Hard vs soft comes from the reason text the sending server (Postal /
 * EmailIt) reports:
 *  - soft: "Maximum number of delivery attempts (5) has been reached"
 *    (a temporary problem — mailbox full, server busy — that never
 *    cleared after 5 tries) or "suppression list (too many soft fails)"
 *  - hard: everything else — "Permanent SMTP delivery error" (address
 *    or domain doesn't exist / rejected), "hard bounce", "too many hard
 *    fails"
 */
const SOFT_BOUNCE_MARKERS = ["delivery attempts", "soft fail"];
const HARD_BOUNCE_MARKERS = ["Permanent", "hard fail", "hard bounce"];

/** "hard" or "soft" for a bounce reason text. */
export function bounceType(reason) {
  const text = String(reason || "").toLowerCase();
  return SOFT_BOUNCE_MARKERS.some((m) => text.includes(m.toLowerCase())) ? "soft" : "hard";
}

/** Conditions keeping only hard (or soft) bounces, by reason column. */
function bounceTypeConditions(col, type) {
  if (type === "hard") {
    return SOFT_BOUNCE_MARKERS.map((m) => ({ col, expr: "notLike", val: `%${m}%` }));
  }
  if (type === "soft") {
    return HARD_BOUNCE_MARKERS.map((m) => ({ col, expr: "notLike", val: `%${m}%` }));
  }
  return [];
}

function failedSendConditions(emailId, range) {
  return [
    { col: "email_id", expr: "eq", val: emailId },
    { col: "is_failed", expr: "eq", val: 1 },
    ...rangeConditions("date_sent", range),
  ];
}

function bouncedContactConditions(range, emailId = null) {
  return [
    { col: "channel", expr: "eq", val: "email" },
    ...(emailId == null ? [] : [{ col: "channel_id", expr: "eq", val: emailId }]),
    { col: "reason", expr: "eq", val: 2 },
    ...rangeConditions("date_added", range),
  ];
}

/**
 * Total bounced count for one email, the way Mautic's email page counts
 * it (Delivered = Sent - this). With a date range, failed sends made in
 * it plus bounces recorded in it.
 */
async function getEmailBounceCount(emailId, range = null) {
  try {
    const [failed, bounced] = await Promise.all([
      statsTotal("email_stats", failedSendConditions(emailId, range)),
      statsTotal("lead_donotcontact", bouncedContactConditions(range, emailId)),
    ]);
    return failed + bounced;
  } catch {
    return 0;
  }
}

const emailNames = new Map(); // email id -> name, kept while the server runs

async function getEmailName(emailId) {
  if (!emailNames.has(emailId)) {
    try {
      const data = await mauticFetch(`/api/emails/${emailId}`);
      emailNames.set(emailId, data?.email?.name || `Email #${emailId}`);
    } catch {
      return `Email #${emailId}`;
    }
  }
  return emailNames.get(emailId);
}

/**
 * Contact fields for those of `ids` that carry the tag, keyed by id,
 * from one "tag:X ids:..." search.
 */
async function getTaggedContactsAmong(tag, ids) {
  if (ids.length === 0) return {};
  const params = new URLSearchParams({
    search: `tag:${tag} ids:${ids.join(",")}`,
    limit: String(ids.length),
    minimal: "1",
  });
  const data = await mauticFetch(`/api/contacts?${params.toString()}`);
  const contacts = {};
  for (const c of Object.values(data?.contacts || {})) contacts[String(c.id)] = c.fields?.all || {};
  return contacts;
}

/**
 * One page of bounced contacts that carry `tag` (all emails), newest
 * first, with the bounce reason, its hard/soft type and the email that
 * bounced. type: "all" | "hard" | "soft".
 *
 * There's no way to ask Mautic for "bounced AND tagged" directly, so
 * bounce records are read in date order, 100 at a time, keeping the
 * tagged contacts until the page is full. `cursor` is the record offset
 * to continue from; the result's nextCursor (null at the end) is the
 * cursor for the next page.
 */
export async function getBouncedContacts({ tag, range = null, type = "all", cursor = 0, pageSize = 50 }) {
  const batchSize = 100;
  const where = [
    ...bouncedContactConditions(range),
    ...bounceTypeConditions("comments", type === "all" ? null : type),
  ];

  const kept = [];
  let offset = cursor;
  let done = false;
  for (let batch = 0; batch < 10 && kept.length < pageSize && !done; batch++) {
    const params = whereParams(where);
    params.set("start", String(offset));
    params.set("limit", String(batchSize));
    params.set("order[0][col]", "date_added");
    params.set("order[0][dir]", "desc");
    params.set("order[1][col]", "id");
    params.set("order[1][dir]", "desc");
    const data = await mauticFetch(`/api/stats/lead_donotcontact?${params.toString()}`);
    const records = data?.stats || [];

    const ids = [...new Set(records.map((r) => String(r.lead_id)))];
    const contacts = await getTaggedContactsAmong(tag, ids);

    let used = 0;
    for (const r of records) {
      used++;
      const contact = contacts[String(r.lead_id)];
      if (contact) kept.push({ record: r, contact });
      if (kept.length === pageSize) break;
    }
    offset += used;
    done = records.length < batchSize && used === records.length;
  }

  const names = await Promise.all(kept.map(({ record }) => getEmailName(record.channel_id)));
  const rows = kept.map(({ record: r, contact }, i) => ({
    id: r.id,
    contactId: r.lead_id,
    firstName: contact.firstname || "",
    lastName: contact.lastname || "",
    email: contact.email || "",
    type: bounceType(r.comments),
    reason: r.comments || "",
    emailId: r.channel_id,
    emailName: names[i],
    date: r.date_added ? `${r.date_added.replace(" ", "T")}Z` : null,
  }));

  return { rows, pageSize, nextCursor: done ? null : offset };
}

/**
 * Fetch full stats for a single email by ID.
 * Returns normalized { id, name, subject, sent, delivered, opened,
 * clicked, bounced }.
 *
 * With a date range ({ from, to }), only emails SENT in that range are
 * counted (and how many of those were opened / bounced), counted from
 * email_stats rows; clicks are link clicks made in that range.
 */
export async function getEmailStats(emailId, range = null) {
  const data = await mauticFetch(`/api/emails/${emailId}`);
  const email = data.email || {};

  let sent, opened, clicked, bounced;
  if (range) {
    const sentInRange = [
      { col: "email_id", expr: "eq", val: emailId },
      ...rangeConditions("date_sent", range),
    ];
    [sent, opened, bounced, clicked] = await Promise.all([
      statsTotal("email_stats", sentInRange),
      statsTotal("email_stats", [...sentInRange, { col: "is_read", expr: "eq", val: 1 }]),
      getEmailBounceCount(emailId, range),
      getEmailClickCountInRange(emailId, range),
    ]);
  } else {
    sent = email.sentCount ?? 0;
    opened = email.readCount ?? 0;
    [clicked, bounced] = await Promise.all([
      getEmailClickCount(emailId),
      getEmailBounceCount(emailId),
    ]);
  }

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
 * Like getEmailStats, but returns null when the email no longer exists
 * in Mautic (deleted → 404) instead of throwing. Other errors still throw.
 */
export async function getEmailStatsIfExists(emailId, range = null) {
  try {
    return await getEmailStats(emailId, range);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

/**
 * When an email was actually first sent, as an ISO string (UTC), or null
 * if it has never been sent. Taken from the earliest email_stats row —
 * the email object's dateAdded is only when it was created.
 */
export async function getEmailFirstSentDate(emailId) {
  const params = new URLSearchParams();
  params.set("where[0][col]", "email_id");
  params.set("where[0][expr]", "eq");
  params.set("where[0][val]", String(emailId));
  params.set("order[0][col]", "date_sent");
  params.set("order[0][dir]", "asc");
  params.set("limit", "1");

  const data = await mauticFetch(`/api/stats/email_stats?${params.toString()}`);
  const dateSent = data?.stats?.[0]?.date_sent;
  // Mautic stores date_sent in UTC as "YYYY-MM-DD HH:MM:SS".
  return dateSent ? `${dateSent.replace(" ", "T")}Z` : null;
}

/** When an email was last sent, as an ISO string (UTC), or null. */
export async function getEmailLastSentDate(emailId) {
  const params = whereParams([{ col: "email_id", expr: "eq", val: emailId }]);
  params.set("order[0][col]", "date_sent");
  params.set("order[0][dir]", "desc");
  params.set("limit", "1");

  const data = await mauticFetch(`/api/stats/email_stats?${params.toString()}`);
  const dateSent = data?.stats?.[0]?.date_sent;
  return dateSent ? `${dateSent.replace(" ", "T")}Z` : null;
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
 * Count contacts that carry a given tag. With a date range, only
 * contacts created in that range.
 */
export async function countContactsByTag(tag, range = null) {
  const params = whereParams(rangeConditions("date_added", range));
  params.set("search", `tag:${tag}`);
  params.set("limit", "1");
  params.set("minimal", "1");
  const data = await mauticFetch(`/api/contacts?${params.toString()}`);
  return data.total ? Number(data.total) : 0;
}

/**
 * Get submission count for a Mautic form. With a date range, only
 * submissions made in that range (from the form_submissions table).
 */
export async function getFormSubmissionCount(formId, range = null) {
  if (range) {
    return statsTotal("form_submissions", [
      { col: "form_id", expr: "eq", val: formId },
      ...rangeConditions("date_submitted", range),
    ]);
  }
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

export async function getFormSubmissions(formId, range = null, limit = 500) {
  const data = await mauticFetch(`/api/forms/${formId}/submissions?limit=${limit}`);
  const rows = (data?.submissions || []).filter((row) => isInRange(row.dateSubmitted, range));

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

/** Contacts matching a Mautic contact search, e.g. "tag:Sign_Up dnc:email". */
async function countContactsBySearch(search) {
  const params = new URLSearchParams({ search, limit: "1", minimal: "1" });
  const data = await mauticFetch(`/api/contacts?${params.toString()}`);
  return data?.total ? Number(data.total) : 0;
}

/** Unique contact IDs with an email DNC row matching the conditions. */
async function getDncContactIds(conditions) {
  const rows = await statsRows("lead_donotcontact", [
    { col: "channel", expr: "eq", val: "email" },
    ...conditions,
  ]);
  return [...new Set(rows.map((r) => String(r.lead_id)).filter((id) => id && id !== "null"))];
}

/** How many of the given contact IDs carry the tag, 500 IDs per request. */
async function countTaggedAmong(tag, ids) {
  const counts = await mapLimit(chunk(ids, 500), 5, (part) =>
    countContactsBySearch(`tag:${tag} ids:${part.join(",")}`)
  );
  return counts.reduce((sum, c) => sum + c, 0);
}

/**
 * Get DNC (do-not-contact) count for the email channel, counting only
 * contacts that carry `tag` (e.g. Sign_Up) — one "tag:X dnc:email"
 * contact search.
 *
 * With a date range, only contacts marked DNC in that range: their IDs
 * come from the lead_donotcontact table (Stats API) and "tag:X ids:..."
 * searches count the tagged ones. There are ~100k DNC rows, so when the
 * range holds most of them it's cheaper to count the ones OUTSIDE the
 * range and subtract from the all-time count.
 */
export async function getDncCount(tag, range = null) {
  const allTime = await countContactsBySearch(`tag:${tag} dnc:email`);
  if (!range) return allTime;

  const inRange = rangeConditions("date_added", range);
  const channel = [{ col: "channel", expr: "eq", val: "email" }];
  const [rowsInRange, rowsTotal] = await Promise.all([
    statsTotal("lead_donotcontact", [...channel, ...inRange]),
    statsTotal("lead_donotcontact", channel),
  ]);
  if (rowsInRange === 0) return 0;

  if (rowsInRange <= rowsTotal / 2) {
    return countTaggedAmong(tag, await getDncContactIds(inRange));
  }

  const [before, after] = await Promise.all([
    getDncContactIds([{ col: "date_added", expr: "lt", val: range.from }]),
    getDncContactIds([{ col: "date_added", expr: "gte", val: inRange[1].val }]),
  ]);
  const outside = [...new Set([...before, ...after])];
  return allTime - (outside.length ? await countTaggedAmong(tag, outside) : 0);
}

/**
 * Where the DNC count comes from. Every email do-not-contact record in
 * Mautic (lead_donotcontact, channel "email") has a reason code:
 *   1 = unsubscribed (clicked unsubscribe)
 *   2 = bounced (hard or soft, by the bounce reason text)
 *   3 = manual (added by a user, an import or a campaign action)
 * Returns how many contacts carrying `tag` are in each group:
 * { unsubscribed, hard, soft, manual }. hard + soft = unique bounced
 * contacts ("Bounced Contacts"). With a date range, only records
 * added in it. Every record has to be read and the tag checked 500 IDs
 * per request, so this is slow (~1 min for all ~100k records) — the
 * response is cached.
 */
export async function getDncBreakdown(tag, range = null) {
  const rows = await statsRows("lead_donotcontact", [
    { col: "channel", expr: "eq", val: "email" },
    ...rangeConditions("date_added", range),
  ]);

  const groups = { unsubscribed: new Set(), hard: new Set(), soft: new Set(), manual: new Set() };
  for (const r of rows) {
    if (!r.lead_id) continue;
    const reason = Number(r.reason);
    const group = reason === 1 ? "unsubscribed" : reason === 2 ? bounceType(r.comments) : "manual";
    groups[group].add(String(r.lead_id));
  }
  // Bounced Contacts are unique: a contact with both a hard and a soft
  // bounce record counts once, as hard (the permanent failure wins).
  for (const id of groups.hard) groups.soft.delete(id);

  // One group at a time, so Mautic gets at most 5 requests at once.
  const counts = {};
  for (const [group, ids] of Object.entries(groups)) {
    counts[group] = ids.size ? await countTaggedAmong(tag, [...ids]) : 0;
  }
  return counts;
}
