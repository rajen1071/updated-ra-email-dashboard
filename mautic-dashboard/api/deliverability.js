import { withCache } from "./_lib/cache.js";
import { rangeFromQuery } from "./_lib/dateRange.js";
import { getEmailStats, getDncCount, getDncBreakdown } from "./_lib/mauticClient.js";
import { PRIMARY_DASHBOARD_EMAIL_ID, TOTAL_CONTACTS_TAG } from "../src/config/mauticMapping.js";

function pct(part, whole) {
  return whole ? ((part / whole) * 100).toFixed(1) + "%" : "0%";
}

async function handler(req, res) {
  try {
    const range = rangeFromQuery(req.query);
    const [stats, dnc, breakdown] = await Promise.all([
      getEmailStats(PRIMARY_DASHBOARD_EMAIL_ID, range),
      getDncCount(TOTAL_CONTACTS_TAG, range),
      getDncBreakdown(TOTAL_CONTACTS_TAG, range),
    ]);

    // Hard/soft = Sign_Up contacts marked DNC because they bounced, split
    // by the bounce reason (see bounceType in api/_lib/mauticClient.js).
    const bouncedContacts = breakdown.hard + breakdown.soft;

    res.status(200).json({
      // Bounce rate is for the dashboard email, counted like Mautic's email page.
      emailName: stats.name,
      sent: stats.sent,
      bounced: stats.bounced,
      bounceRate: stats.sent ? ((stats.bounced / stats.sent) * 100).toFixed(2) + "%" : "0%",
      bouncedContacts,
      hardBounce: breakdown.hard,
      hardBouncePct: pct(breakdown.hard, bouncedContacts),
      softBounce: breakdown.soft,
      softBouncePct: pct(breakdown.soft, bouncedContacts),
      dnc,
      dncBreakdown: breakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default withCache(handler);
