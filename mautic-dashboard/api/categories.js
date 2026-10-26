import { withCache } from "./_lib/cache.js";
import { rangeFromQuery } from "./_lib/dateRange.js";
import { getEmailStats, countContactsByTag } from "./_lib/mauticClient.js";
import { CATEGORY_EMAILS } from "../src/config/mauticMapping.js";

async function handler(req, res) {
  try {
    const range = rangeFromQuery(req.query);
    const rows = await Promise.all(
      CATEGORY_EMAILS.map(async (cat) => {
        const [stats, contacts] = await Promise.all([
          getEmailStats(cat.emailId, range),
          countContactsByTag(cat.tag, range),
        ]);
        return {
          category: cat.category,
          contacts,
          emailsSent: stats.sent,
          delivered: stats.delivered,
          opened: stats.opened,
          clicked: stats.clicked,
          openRate: stats.sent ? ((stats.opened / stats.sent) * 100).toFixed(1) + "%" : "0%",
          clickRate: stats.sent ? ((stats.clicked / stats.sent) * 100).toFixed(1) + "%" : "0%",
        };
      })
    );

    res.status(200).json({ categories: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default withCache(handler);
