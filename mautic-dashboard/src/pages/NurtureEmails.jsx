import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import { LoadingState, ErrorState } from "../components/StateViews";
import { useApiData } from "../hooks/useApiData";

function WinnerBadge({ winner }) {
  if (winner === "-") return <span className="text-xs text-muted">—</span>;
  const color = winner === "A" ? "bg-accent-blue/15 text-accent-blue" : "bg-accent-green/15 text-accent-green";
  return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>{winner}</span>;
}

export default function NurtureEmails() {
  const nurture = useApiData("/api/nurture-emails");
  const d = nurture.data;

  return (
    <div>
      <Topbar
        title="Nurture Emails"
        subtitle="14 weekly nurture emails, each with a 2-variant A/B test"
        onRefresh={nurture.refetch}
      />

      <div className="p-6 space-y-6">
        {nurture.loading && <LoadingState />}
        {nurture.error && <ErrorState message={nurture.error} />}

        {d && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="TOTAL NURTURE EMAILS" value={d.totalNurtureEmails} color="blue" />
            <StatCard label="TOTAL VARIANTS" value={d.totalVariants} color="purple" />
            <StatCard label="TOTAL SENT" value={d.totalSent.toLocaleString()} color="teal" />
            <StatCard label="AVG OPEN RATE" value={`${d.avgOpenRate}%`} color="orange" />
            <StatCard label="OVERALL WINNER" value={d.overallWinner} color="green" />
          </div>
        )}

        {d && (
          <div className="card p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted text-xs">
                    <th className="py-2 pr-4 font-medium" rowSpan={2}>#</th>
                    <th className="py-2 pr-4 font-medium" rowSpan={2}>Nurture Email</th>
                    <th className="py-2 pr-4 font-bold text-accent-blue text-center" colSpan={5}>
                      Variant A
                    </th>
                    <th className="py-2 pr-4 font-bold text-accent-pink text-center" colSpan={5}>
                      Variant B
                    </th>
                    <th className="py-2 font-medium" rowSpan={2}>Winner</th>
                  </tr>
                  <tr className="text-left text-muted text-xs">
                    <th className="pb-2 pr-4 font-medium">Sent</th>
                    <th className="pb-2 pr-4 font-medium">Open</th>
                    <th className="pb-2 pr-4 font-medium">Open %</th>
                    <th className="pb-2 pr-4 font-medium">Click</th>
                    <th className="pb-2 pr-4 font-medium">Click %</th>
                    <th className="pb-2 pr-4 font-medium">Sent</th>
                    <th className="pb-2 pr-4 font-medium">Open</th>
                    <th className="pb-2 pr-4 font-medium">Open %</th>
                    <th className="pb-2 pr-4 font-medium">Click</th>
                    <th className="pb-2 pr-4 font-medium">Click %</th>
                  </tr>
                </thead>
                <tbody>
                  {d.nurtureEmails.map((n) => (
                    <tr key={n.step} className="hover:bg-white/[0.02]">
                      <td className="py-3 pr-4 text-muted">{n.step}</td>
                      <td className="py-3 pr-4 text-gray-200 font-medium">{n.name}</td>
                      <td className="py-3 pr-4 text-gray-300">{n.variantA.sent}</td>
                      <td className="py-3 pr-4 text-gray-300">{n.variantA.opened}</td>
                      <td className="py-3 pr-4 text-gray-300">{n.variantA.openRate}%</td>
                      <td className="py-3 pr-4 text-gray-300">{n.variantA.clicked}</td>
                      <td className="py-3 pr-4 text-gray-300">{n.variantA.clickRate}%</td>
                      <td className="py-3 pr-4 text-gray-300">{n.variantB.sent}</td>
                      <td className="py-3 pr-4 text-gray-300">{n.variantB.opened}</td>
                      <td className="py-3 pr-4 text-gray-300">{n.variantB.openRate}%</td>
                      <td className="py-3 pr-4 text-gray-300">{n.variantB.clicked}</td>
                      <td className="py-3 pr-4 text-gray-300">{n.variantB.clickRate}%</td>
                      <td className="py-3"><WinnerBadge winner={n.winner} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
