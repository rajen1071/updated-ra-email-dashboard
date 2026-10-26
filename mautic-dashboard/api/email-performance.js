import { withCache } from "./_lib/cache.js";
import { rangeFromQuery } from "./_lib/dateRange.js";
import { getEmailStats, getEmailDailyTrend, getEmailLastSentDate } from "./_lib/mauticClient.js";
import { PRIMARY_DASHBOARD_EMAIL_ID } from "../src/config/mauticMapping.js";

const TREND_DAYS = 90;

async function handler(req, res) {
  try {
    const range = rangeFromQuery(req.query);
    const stats = await getEmailStats(PRIMARY_DASHBOARD_EMAIL_ID, range);

    // Funnel = single snapshot of the primary email
    const funnel = [
      { stage: "Sent", value: stats.sent, pct: 100 },
      { stage: "Delivered", value: stats.delivered, pct: stats.sent ? (stats.delivered / stats.sent) * 100 : 0 },
      { stage: "Opened", value: stats.opened, pct: stats.sent ? (stats.opened / stats.sent) * 100 : 0 },
      { stage: "Clicked", value: stats.clicked, pct: stats.sent ? (stats.clicked / stats.sent) * 100 : 0 },
      { stage: "Bounced Emails", value: stats.bounced, pct: stats.sent ? (stats.bounced / stats.sent) * 100 : 0 },
    ];

    // Trend = daily Sent/Opened/Bounced counts, built from Mautic's generic
    // Stats API (raw email_stats rows, aggregated by day). Mautic has no
    // public per-email time-series endpoint, so this is the closest
    // public-API equivalent. The window is the date filter's range (capped
    // to its last 90 days). With "All time" it's the 90 days up to the
    // email's last send — this email goes out in bursts, so "the last few
    // days" is usually empty.
    const lastSent = await getEmailLastSentDate(PRIMARY_DASHBOARD_EMAIL_ID).catch(() => null);
    let { from, to } = range || {};
    if (!range && lastSent) {
      to = lastSent.slice(0, 10);
      const start = new Date(`${to}T00:00:00Z`);
      start.setUTCDate(start.getUTCDate() - (TREND_DAYS - 1));
      from = start.toISOString().slice(0, 10);
    }
    const trend = await getEmailDailyTrend(PRIMARY_DASHBOARD_EMAIL_ID, from, to).catch(() => []);

    res.status(200).json({
      funnel,
      trend,
      trendFrom: trend[0]?.date ?? null,
      trendTo: trend[trend.length - 1]?.date ?? null,
      lastSent,
      emailId: PRIMARY_DASHBOARD_EMAIL_ID,
      emailName: stats.name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default withCache(handler);
