import { withCache } from "./_lib/cache.js";
import { findEmailsByNameContains, getEmailStats, getEmailFirstSentDate } from "./_lib/mauticClient.js";
import { NEWSLETTER_NAME_CONTAINS, BLOG_NAME_CONTAINS } from "../src/config/mauticMapping.js";

async function buildRows(nameContains) {
  const matches = await findEmailsByNameContains(nameContains);
  const rows = await Promise.all(
    matches.map(async (email) => {
      const [stats, dateSent] = await Promise.all([
        getEmailStats(email.id),
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
  // Most recently sent first; not-yet-sent emails go last (newest created first).
  return rows.sort((a, b) => {
    if (a.dateSent && b.dateSent) return new Date(b.dateSent) - new Date(a.dateSent);
    if (a.dateSent || b.dateSent) return a.dateSent ? -1 : 1;
    return new Date(b.dateAdded) - new Date(a.dateAdded);
  });
}

async function handler(req, res) {
  try {
    const [newsletter, blog] = await Promise.all([
      buildRows(NEWSLETTER_NAME_CONTAINS),
      buildRows(BLOG_NAME_CONTAINS),
    ]);

    res.status(200).json({ newsletter, blog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default withCache(handler);
