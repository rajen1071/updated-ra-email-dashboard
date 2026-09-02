import { mauticFetch, getEmailStats, getEmailDailyTrend } from "./_lib/mauticClient.js";
import { PRIMARY_DASHBOARD_EMAIL_ID } from "../src/config/mauticMapping.js";

export default async function handler(req, res) {
  try {
    const stats = await getEmailStats(PRIMARY_DASHBOARD_EMAIL_ID);

    // Funnel = single snapshot of the primary email
    const funnel = [
      { stage: "Sent", value: stats.sent, pct: 100 },
      { stage: "Delivered", value: stats.delivered, pct: stats.sent ? (stats.delivered / stats.sent) * 100 : 0 },
      { stage: "Opened", value: stats.opened, pct: stats.sent ? (stats.opened / stats.sent) * 100 : 0 },
      { stage: "Clicked", value: stats.clicked, pct: stats.sent ? (stats.clicked / stats.sent) * 100 : 0 },
      { stage: "Bounced", value: stats.bounced, pct: stats.sent ? (stats.bounced / stats.sent) * 100 : 0 },
    ];

    // Trend = daily Sent/Opened/Bounced counts for the last 30 days,
    // built from Mautic's generic Stats API (raw email_stats rows,
    // aggregated by day). Mautic has no public per-email time-series
    // endpoint, so this is the closest public-API equivalent.
    let trend = [];
    try {
      trend = await getEmailDailyTrend(PRIMARY_DASHBOARD_EMAIL_ID, 30);
    } catch (e) {
      trend = [];
    }

    res.status(200).json({ funnel, trend, emailId: PRIMARY_DASHBOARD_EMAIL_ID, emailName: stats.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
