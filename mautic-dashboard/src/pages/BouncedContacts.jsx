import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import BouncedVsDnc from "../components/BouncedVsDnc";
import { METRICS } from "../config/metricDefinitions";
import { LoadingState, ErrorState } from "../components/StateViews";
import { useApiData } from "../hooks/useApiData";
import { useDateRange } from "../context/DateRangeContext";
import { cleanEmailTitle } from "../lib/text";

const TABS = [
  { id: "all", label: "All" },
  { id: "hard", label: "Hard" },
  { id: "soft", label: "Soft" },
];

function TypeBadge({ type }) {
  const color =
    type === "hard" ? "bg-accent-red/15 text-accent-red" : "bg-accent-orange/15 text-accent-orange";
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${color}`}>{type}</span>
  );
}

export default function BouncedContacts() {
  const { range, withRange } = useDateRange();
  const [type, setType] = useState("all");
  // Where each page starts (from the previous page's nextCursor); the
  // last entry is the page showing.
  const [cursors, setCursors] = useState([0]);
  // Back to page 1 whenever the filter or date range changes.
  const [lastFilter, setLastFilter] = useState({ type, range });
  if (lastFilter.type !== type || lastFilter.range !== range) {
    setLastFilter({ type, range });
    setCursors([0]);
  }
  const page = cursors.length;
  const cursor = cursors[cursors.length - 1];

  const bounced = useApiData(withRange(`/api/bounced-contacts?type=${type}&cursor=${cursor}`));
  // Totals per type come from the Deliverability numbers.
  const del = useApiData(withRange("/api/deliverability"));
  const d = bounced.data;
  const t = del.data;
  const counts = t?.dncBreakdown
    ? { all: t.hardBounce + t.softBounce, hard: t.hardBounce, soft: t.softBounce }
    : null;
  const refreshAll = () => [bounced, del].forEach((x) => x.refetch());

  return (
    <div>
      <Topbar
        title="Bounced Contacts"
        subtitle="Unique Sign_Up contacts marked Do Not Contact because an email bounced, with the reason the mail server gave"
        onRefresh={refreshAll}
        refreshing={bounced.loading}
        lastUpdated={d?.cachedAt}
      />

      <div className="p-6 space-y-6">
        {counts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label={METRICS.bouncedContacts.label} info={METRICS.bouncedContacts.info} value={counts.all.toLocaleString()} sub="Sign_Up, DNC because of a bounce" color="red" />
            <StatCard
              label={METRICS.hardBounced.label}
              info={METRICS.hardBounced.info}
              value={counts.hard.toLocaleString()}
              sub={counts.all ? `${((counts.hard / counts.all) * 100).toFixed(1)}% — permanent` : null}
              color="red"
            />
            <StatCard
              label={METRICS.softBounced.label}
              info={METRICS.softBounced.info}
              value={counts.soft.toLocaleString()}
              sub={counts.all ? `${((counts.soft / counts.all) * 100).toFixed(1)}% — temporary, gave up after 5 tries` : null}
              color="orange"
            />
          </div>
        ) : (
          del.loading && <div className="text-xs text-muted">Counting bounced Sign_Up contacts... this can take about a minute the first time.</div>
        )}

        <BouncedVsDnc compact />

        <div className="card p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex gap-1" data-export-ignore>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setType(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    type === tab.id ? "bg-brand/15 text-brand font-medium" : "text-muted hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                  {counts && ` (${counts[tab.id].toLocaleString()})`}
                </button>
              ))}
            </div>
            {d && d.rows.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>
                  {((page - 1) * d.pageSize + 1).toLocaleString()}–
                  {((page - 1) * d.pageSize + d.rows.length).toLocaleString()}
                  {counts && ` of ${counts[type].toLocaleString()}`}
                </span>
                <button
                  onClick={() => setCursors((c) => c.slice(0, -1))}
                  disabled={page <= 1 || bounced.loading}
                  className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-40"
                  aria-label="Previous page"
                  data-export-ignore
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => setCursors((c) => [...c, d.nextCursor])}
                  disabled={d.nextCursor == null || bounced.loading}
                  className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-40"
                  aria-label="Next page"
                  data-export-ignore
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>

          {bounced.loading && <LoadingState label="Loading bounced contacts..." />}
          {bounced.error && <ErrorState message={bounced.error} />}
          {d && !bounced.loading && d.rows.length === 0 && (
            <div className="text-sm text-muted py-8 text-center">No bounced contacts for this filter.</div>
          )}
          {d && !bounced.loading && d.rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted text-xs border-b border-border">
                    <th className="py-2 pr-4 font-medium">Contact</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 font-medium">Reason</th>
                    <th className="py-2 pr-4 font-medium">Bounced On</th>
                    <th className="py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {d.rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 hover:bg-white/[0.02] align-top">
                      <td className="py-3 pr-4 text-gray-200 whitespace-nowrap">
                        {[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="py-3 pr-4 text-accent-blue">{r.email || "—"}</td>
                      <td className="py-3 pr-4"><TypeBadge type={r.type} /></td>
                      <td className="py-3 pr-4 text-gray-300 min-w-[280px]">{r.reason || "—"}</td>
                      <td className="py-3 pr-4 text-gray-300 min-w-[180px]">{cleanEmailTitle(r.emailName)}</td>
                      <td className="py-3 text-muted whitespace-nowrap">
                        {r.date ? new Date(r.date).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
