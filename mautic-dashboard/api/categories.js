import { getEmailStats, countContactsByTag } from "./_lib/mauticClient.js";
import { CATEGORY_EMAILS } from "../src/config/mauticMapping.js";

export default async function handler(req, res) {
  try {
    const rows = await Promise.all(
      CATEGORY_EMAILS.map(async (cat) => {
        const [stats, contacts] = await Promise.all([
          getEmailStats(cat.emailId),
          countContactsByTag(cat.tag),
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
