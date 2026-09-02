import { getEmailStats, getDncCount } from "./_lib/mauticClient.js";
import { PRIMARY_DASHBOARD_EMAIL_ID } from "../src/config/mauticMapping.js";

export default async function handler(req, res) {
  try {
    const [stats, dnc] = await Promise.all([
      getEmailStats(PRIMARY_DASHBOARD_EMAIL_ID),
      getDncCount(),
    ]);

    // NOTE: Mautic doesn't split "hard" vs "soft" bounce in the standard
    // email stats payload by default. If your Mautic has bounce-type
    // tracking (via a plugin or bounce log table), swap this block to
    // call that endpoint instead. For now hard/soft are estimated from
    // the total bounce count using a configurable split so the UI has
    // something to render — replace once you confirm the real source.
    const totalBounces = stats.bounced;
    const hardBounce = Math.round(totalBounces * 0.63); // placeholder ratio
    const softBounce = totalBounces - hardBounce;

    res.status(200).json({
      bounceRate: stats.sent ? ((totalBounces / stats.sent) * 100).toFixed(2) + "%" : "0%",
      hardBounce,
      hardBouncePct: totalBounces ? ((hardBounce / totalBounces) * 100).toFixed(1) + "%" : "0%",
      softBounce,
      softBouncePct: totalBounces ? ((softBounce / totalBounces) * 100).toFixed(1) + "%" : "0%",
      dnc,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
