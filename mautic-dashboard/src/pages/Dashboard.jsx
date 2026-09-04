import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, FileText, Send, MailCheck, Eye, MousePointerClick, MailX, UserX } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import { LoadingState, ErrorState } from "../components/StateViews";
import { useApiData } from "../hooks/useApiData";
import { cleanEmailTitle } from "../lib/text";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function Dashboard() {
  // "applied" range is what's actually sent to the API; "draft" is what the
  // user is currently picking in the two date inputs, before hitting Save.
  const [appliedRange, setAppliedRange] = useState({ from: daysAgoStr(15), to: todayStr() });
  const [draftRange, setDraftRange] = useState(appliedRange);

  const summary = useApiData("/api/dashboard-summary");
  const perf = useApiData(`/api/email-performance?from=${appliedRange.from}&to=${appliedRange.to}`);
  const categories = useApiData("/api/categories");
  const forms = useApiData("/api/form-submissions");
  const nurture = useApiData("/api/nurture-emails");
  const newsletterBlog = useApiData("/api/newsletter-blog");

  const s = summary.data;

  return (
    <div>
      <Topbar
        title="Mautic Email Dashboard"
        subtitle="Track, Analyze & Optimize Your Email Performance"
        onRefresh={summary.refetch}
      />

      <div className="p-6 space-y-6">
        {/* Top stat cards */}
        {summary.loading && <LoadingState />}
        {summary.error && <ErrorState message={summary.error} />}
        {s && (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            <StatCard label="TOTAL CONTACTS" value={s.totalContacts.toLocaleString()} color="blue" icon={Users} />
            <StatCard label="FORM SUBMISSIONS" value={s.formSubmissions.toLocaleString()} color="purple" icon={FileText} />
            <StatCard label="EMAILS SENT" value={s.emailsSent.toLocaleString()} color="blue" icon={Send} />
            <StatCard label="DELIVERED" value={s.delivered.toLocaleString()} sub={`${s.deliveryRate}% Delivery Rate`} color="green" icon={MailCheck} />
            <StatCard label="OPENED" value={s.opened.toLocaleString()} sub={`${s.openRate}% Open Rate`} color="orange" icon={Eye} />
            <StatCard label="CLICKED" value={s.clicked.toLocaleString()} sub={`${s.clickRate}% Click Rate`} color="purple" icon={MousePointerClick} />
            <StatCard label="BOUNCED" value={s.bounced.toLocaleString()} sub={`${s.bounceRate}% Bounce Rate`} color="red" icon={MailX} />
            <StatCard label="DNC" value={s.dnc.toLocaleString()} color="gray" icon={UserX} />
          </div>
        )}

        {/* Funnel + Trend */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="card p-5 xl:col-span-1">
            <h3 className="text-sm font-semibold text-white mb-4">Email Performance Funnel</h3>
            {perf.loading && <LoadingState label="Loading funnel..." />}
            {perf.error && <ErrorState message={perf.error} />}
            {perf.data && (
              <div className="space-y-2">
                {perf.data.funnel.map((row, i) => {
                  const colors = ["bg-accent-blue", "bg-accent-green", "bg-accent-orange", "bg-accent-purple", "bg-accent-red"];
                  return (
                    <div key={row.stage} className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${colors[i]}`} />
                      <span className="text-sm text-gray-300 w-20">{row.stage}</span>
                      <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                        <div className={`h-full ${colors[i]} rounded-full`} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                      </div>
                      <span className="text-sm text-gray-200 w-16 text-right">{row.value.toLocaleString()}</span>
                      <span className="text-xs text-muted w-14 text-right">{row.pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card p-5 xl:col-span-2">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-white">Email Performance Trend</h3>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-muted">From</span>
                <input
                  type="date"
                  value={draftRange.from}
                  max={draftRange.to}
                  onChange={(e) => setDraftRange((r) => ({ ...r, from: e.target.value }))}
                  className="bg-white/5 border border-border rounded-md px-2 py-1"
                />
                <span className="text-muted">To</span>
                <input
                  type="date"
                  value={draftRange.to}
                  min={draftRange.from}
                  max={todayStr()}
                  onChange={(e) => setDraftRange((r) => ({ ...r, to: e.target.value }))}
                  className="bg-white/5 border border-border rounded-md px-2 py-1"
                />
                <button
                  onClick={() => setAppliedRange(draftRange)}
                  className="text-accent-blue font-medium hover:underline px-1"
                >
                  Save
                </button>
              </div>
            </div>
            {perf.loading && <LoadingState label="Loading trend..." />}
            {perf.error && <ErrorState message={perf.error} />}
            {perf.data && perf.data.trend.length === 0 && (
              <div className="text-sm text-muted py-16 text-center">
                No time-series stat data returned by Mautic for this email yet.
              </div>
            )}
            {perf.data && perf.data.trend.length > 0 && (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={perf.data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2C42" />
                  <XAxis dataKey="date" stroke="#8593A8" fontSize={11} />
                  <YAxis stroke="#8593A8" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#111D30", border: "1px solid #1E2C42" }} />
                  <Legend />
                  <Bar dataKey="sent" fill="#3B82F6" name="Sent" />
                  <Bar dataKey="opened" fill="#22C55E" name="Opened" />
                  <Bar dataKey="bounced" fill="#F97316" name="Bounced" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Summary tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Form Submission Overview</h3>
              <Link to="/form-submissions" className="text-xs text-accent-blue hover:underline">View All</Link>
            </div>
            {forms.loading && <LoadingState label="Loading forms..." />}
            {forms.error && <ErrorState message={forms.error} />}
            {forms.data && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted text-xs border-b border-border">
                      <th className="py-2 pr-3 font-medium">Form</th>
                      <th className="py-2 pr-3 font-medium">Submissions</th>
                      <th className="py-2 pr-3 font-medium">User Sent</th>
                      <th className="py-2 pr-3 font-medium">User Opened</th>
                      <th className="py-2 font-medium">Internal Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forms.data.forms.map((f) => (
                      <tr key={f.formId} className="border-b border-border/60">
                        <td className="py-2 pr-3">
                          <Link to={`/form-submissions/${f.formId}`} className="text-accent-blue hover:underline">
                            {f.formName}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 text-gray-200">{f.submissions.toLocaleString()}</td>
                        <td className="py-2 pr-3 text-gray-300">{f.userEmail ? f.userEmail.sent.toLocaleString() : "—"}</td>
                        <td className="py-2 pr-3 text-gray-300">{f.userEmail ? f.userEmail.opened.toLocaleString() : "—"}</td>
                        <td className="py-2 text-gray-300">{f.internalEmail ? f.internalEmail.sent.toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Top Categories (Interest Based Emails)</h3>
              <Link to="/email-by-category" className="text-xs text-accent-blue hover:underline">View All</Link>
            </div>
            {categories.loading && <LoadingState label="Loading categories..." />}
            {categories.error && <ErrorState message={categories.error} />}
            {categories.data && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted text-xs border-b border-border">
                      <th className="py-2 pr-3 font-medium">Category</th>
                      <th className="py-2 pr-3 font-medium">Contacts</th>
                      <th className="py-2 pr-3 font-medium">Sent</th>
                      <th className="py-2 pr-3 font-medium">Open Rate</th>
                      <th className="py-2 font-medium">Click Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.data.categories.slice(0, 6).map((c) => (
                      <tr key={c.category} className="border-b border-border/60">
                        <td className="py-2 pr-3 text-gray-200">{c.category}</td>
                        <td className="py-2 pr-3 text-gray-300">{c.contacts.toLocaleString()}</td>
                        <td className="py-2 pr-3 text-gray-300">{c.emailsSent.toLocaleString()}</td>
                        <td className="py-2 pr-3 text-accent-green">{c.openRate}</td>
                        <td className="py-2 text-accent-purple">{c.clickRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Nurture Email Overview</h3>
              <Link to="/nurture-emails" className="text-xs text-accent-blue hover:underline">View All</Link>
            </div>
            {nurture.loading && <LoadingState label="Loading nurture emails..." />}
            {nurture.error && <ErrorState message={nurture.error} />}
            {nurture.data && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{nurture.data.totalNurtureEmails}</div>
                  <div className="text-[11px] text-muted">Total Emails</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{nurture.data.totalVariants}</div>
                  <div className="text-[11px] text-muted">Total Variants</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-accent-orange">{nurture.data.avgOpenRate}%</div>
                  <div className="text-[11px] text-muted">Avg Open Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-accent-green">{nurture.data.avgClickRate}%</div>
                  <div className="text-[11px] text-muted">Avg Click Rate</div>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Newsletter & Blog Overview</h3>
              <Link to="/newsletter-blog" className="text-xs text-accent-blue hover:underline">View All</Link>
            </div>
            {newsletterBlog.loading && <LoadingState label="Loading newsletter/blog..." />}
            {newsletterBlog.error && <ErrorState message={newsletterBlog.error} />}
            {newsletterBlog.data && (
              <div className="text-sm space-y-2">
                <div className="flex justify-between text-gray-300">
                  <span>Latest Newsletter</span>
                  <span className="text-gray-200">{cleanEmailTitle(newsletterBlog.data.newsletter[0]?.name) || "—"}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Latest Blog</span>
                  <span className="text-gray-200">{cleanEmailTitle(newsletterBlog.data.blog[0]?.name) || "—"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
