import { withCache } from "./_lib/cache.js";
import { rangeFromQuery } from "./_lib/dateRange.js";
import { findEmailsByNameContains, getEmailStats, getEmailFirstSentDate } from "./_lib/mauticClient.js";
import { NEWSLETTER_NAME_CONTAINS, BLOG_NAME_CONTAINS } from "../src/config/mauticMapping.js";

async function buildRows(nameContains, range) {
  const matches = await findEmailsByNameContains(nameContains);
  const rows = await Promise.all(
    matches.map(async (email) => {
      const [stats, dateSent] = await Promise.all([
        getEmailStats(email.id, range),
        getEmailFirstSentDate(email.id),
      ]);
      return {
        id: email.id,
        name: email.name,
        dateAdded: email.dateAdded,
        dateSent,
        sent: stats.sent,
        delivered: stats.delivered,
        opened: stats.opened,
        clicked: stats.clicked,
        openRate: stats.sent ? ((stats.opened / stats.sent) * 100).toFixed(1) + "%" : "0%",
        clickRate: stats.sent ? ((stats.clicked / stats.sent) * 100).toFixed(1) + "%" : "0%",
      };
    })
  );
  // With a date range, only emails that went out in it.
  const shown = range ? rows.filter((r) => r.sent > 0) : rows;

  // Most recently sent first; not-yet-sent emails go last (newest created first).
  return shown.sort((a, b) => {
    if (a.dateSent && b.dateSent) return new Date(b.dateSent) - new Date(a.dateSent);
    if (a.dateSent || b.dateSent) return a.dateSent ? -1 : 1;
    return new Date(b.dateAdded) - new Date(a.dateAdded);
  });
}

async function handler(req, res) {
  try {
    const range = rangeFromQuery(req.query);
    const [newsletter, blog] = await Promise.all([
      buildRows(NEWSLETTER_NAME_CONTAINS, range),
      buildRows(BLOG_NAME_CONTAINS, range),
    ]);

    res.status(200).json({ newsletter, blog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default withCache(handler);
