import { findEmailsByNameContains, getEmailStats } from "./_lib/mauticClient.js";
import { NEWSLETTER_NAME_CONTAINS, BLOG_NAME_CONTAINS } from "../src/config/mauticMapping.js";

async function buildRows(nameContains) {
  const matches = await findEmailsByNameContains(nameContains);
  const rows = await Promise.all(
    matches.map(async (email) => {
      const stats = await getEmailStats(email.id);
      return {
        id: email.id,
        name: email.name,
        dateAdded: email.dateAdded,
        sent: stats.sent,
        delivered: stats.delivered,
        opened: stats.opened,
        clicked: stats.clicked,
        openRate: stats.sent ? ((stats.opened / stats.sent) * 100).toFixed(1) + "%" : "0%",
        clickRate: stats.sent ? ((stats.clicked / stats.sent) * 100).toFixed(1) + "%" : "0%",
      };
    })
  );
  // Most recent first
  return rows.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
}

export default async function handler(req, res) {
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
