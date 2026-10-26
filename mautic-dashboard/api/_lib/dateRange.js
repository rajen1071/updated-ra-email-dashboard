/**
 * dateRange.js
 * ------------------------------------------------------------------
 * The dashboard's date filter arrives on every endpoint as
 * ?from=YYYY-MM-DD&to=YYYY-MM-DD (both inclusive, UTC days — Mautic
 * stores dates in UTC). No params = "All time".
 * ------------------------------------------------------------------
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** { from, to } from a request's query, or null for "All time". */
export function rangeFromQuery(query = {}) {
  let { from, to } = query;
  if (!DATE_RE.test(from || "") || !DATE_RE.test(to || "")) return null;
  if (from > to) [from, to] = [to, from];
  return { from, to };
}

/** The day after "to", so "< untilExclusive" includes all of "to". */
function dayAfter(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Mautic "where" conditions limiting a date column to the range.
 * Mautic compares full datetimes, so the upper bound is the start of
 * the day after "to".
 */
export function rangeConditions(col, range) {
  if (!range) return [];
  return [
    { col, expr: "gte", val: range.from },
    { col, expr: "lt", val: dayAfter(range.to) },
  ];
}

/** Whether an ISO/Mautic date string falls inside the range. */
export function isInRange(dateStr, range) {
  if (!range) return true;
  const day = (dateStr || "").slice(0, 10);
  return day >= range.from && day <= range.to;
}
