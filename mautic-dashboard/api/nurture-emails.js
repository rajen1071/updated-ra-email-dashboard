import { withCache } from "./_lib/cache.js";
import { getEmailStatsIfExists, getEmailFirstSentDate } from "./_lib/mauticClient.js";
import { NURTURE_EMAILS } from "../src/config/mauticMapping.js";

// Stats + real send date for one variant, or null if it was deleted in Mautic.
async function loadVariant(id) {
  const stats = await getEmailStatsIfExists(id);
  if (!stats) return null;
  const dateSent = await getEmailFirstSentDate(id);
  const openRate = stats.sent ? (stats.opened / stats.sent) * 100 : 0;
  const clickRate = stats.sent ? (stats.clicked / stats.sent) * 100 : 0;
  return {
    id,
    sent: stats.sent,
    opened: stats.opened,
    clicked: stats.clicked,
    openRate: openRate.toFixed(1),
    clickRate: clickRate.toFixed(1),
    dateSent,
  };
}

async function handler(req, res) {
  try {
    const results = await Promise.all(
      NURTURE_EMAILS.map(async (n) => {
        const [a, b] = await Promise.all([loadVariant(n.variantA), loadVariant(n.variantB)]);
        // Only show steps that still exist in Mautic.
        if (!a && !b) return null;

        const winner =
          !a || !b || Number(a.clickRate) === Number(b.clickRate)
            ? "-"
            : Number(a.clickRate) > Number(b.clickRate) ? "A" : "B";

        // The step's send date is whichever variant went out first.
        const dateSent = [a?.dateSent, b?.dateSent].filter(Boolean).sort()[0] ?? null;

        return { step: n.step, name: n.name, variantA: a, variantB: b, dateSent, winner };
      })
    );
    const rows = results.filter(Boolean);
    const variants = rows.flatMap((r) => [r.variantA, r.variantB]).filter(Boolean);

    const totals = variants.reduce(
      (acc, v) => {
        acc.sent += v.sent;
        acc.opened += v.opened;
        acc.clicked += v.clicked;
        return acc;
      },
      { sent: 0, opened: 0, clicked: 0 }
    );

    const bWins = rows.filter((r) => r.winner === "B").length;
    const overallWinner = bWins >= rows.length / 2 ? "B" : "A";

    res.status(200).json({
      nurtureEmails: rows,
      totalNurtureEmails: rows.length,
      totalVariants: variants.length,
      totalSent: totals.sent,
      avgOpenRate: totals.sent ? ((totals.opened / totals.sent) * 100).toFixed(1) : "0",
      avgClickRate: totals.sent ? ((totals.clicked / totals.sent) * 100).toFixed(1) : "0",
      overallWinner,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default withCache(handler);
