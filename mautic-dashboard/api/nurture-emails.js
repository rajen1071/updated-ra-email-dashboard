import { getEmailStats } from "./_lib/mauticClient.js";
import { NURTURE_EMAILS } from "../src/config/mauticMapping.js";

export default async function handler(req, res) {
  try {
    const rows = await Promise.all(
      NURTURE_EMAILS.map(async (n) => {
        const [a, b] = await Promise.all([getEmailStats(n.variantA), getEmailStats(n.variantB)]);

        const openRateA = a.sent ? (a.opened / a.sent) * 100 : 0;
        const openRateB = b.sent ? (b.opened / b.sent) * 100 : 0;
        const clickRateA = a.sent ? (a.clicked / a.sent) * 100 : 0;
        const clickRateB = b.sent ? (b.clicked / b.sent) * 100 : 0;

        const winner = clickRateA === clickRateB ? "-" : clickRateA > clickRateB ? "A" : "B";

        return {
          step: n.step,
          name: n.name,
          variantA: { id: n.variantA, sent: a.sent, opened: a.opened, clicked: a.clicked, openRate: openRateA.toFixed(1), clickRate: clickRateA.toFixed(1) },
          variantB: { id: n.variantB, sent: b.sent, opened: b.opened, clicked: b.clicked, openRate: openRateB.toFixed(1), clickRate: clickRateB.toFixed(1) },
          winner,
        };
      })
    );

    const totals = rows.reduce(
      (acc, r) => {
        acc.sent += r.variantA.sent + r.variantB.sent;
        acc.opened += r.variantA.opened + r.variantB.opened;
        acc.clicked += r.variantA.clicked + r.variantB.clicked;
        return acc;
      },
      { sent: 0, opened: 0, clicked: 0 }
    );

    const bWins = rows.filter((r) => r.winner === "B").length;
    const overallWinner = bWins >= rows.length / 2 ? "B" : "A";

    res.status(200).json({
      nurtureEmails: rows,
      totalNurtureEmails: rows.length,
      totalVariants: rows.length * 2,
      totalSent: totals.sent,
      avgOpenRate: totals.sent ? ((totals.opened / totals.sent) * 100).toFixed(1) : "0",
      avgClickRate: totals.sent ? ((totals.clicked / totals.sent) * 100).toFixed(1) : "0",
      overallWinner,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
