import { Link } from "react-router-dom";
import { Users, FileText, Send, MailCheck, Eye, MousePointerClick, MailX, UserX } from "lucide-react";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import TrendChart from "../components/TrendChart";
import BouncedVsDnc from "../components/BouncedVsDnc";
import { LoadingState, ErrorState } from "../components/StateViews";
import { useApiData } from "../hooks/useApiData";
import { useDateRange, dayStr, displayDay } from "../context/DateRangeContext";
import { cleanEmailTitle } from "../lib/text";
import { METRICS } from "../config/metricDefinitions";

// The trend chart is daily, so the API caps it at 90 days
// (api/email-performance.js); with "All time" it shows the 90 days up to
// the email's last send. Say which days are charted, and why.
const MAX_TREND_DAYS = 90;

function trendNote(range, data) {
  if (!data?.trendFrom) return null;
  const shown = `${displayDay(data.trendFrom)} – ${displayDay(data.trendTo)}`;
  if (!range) return `${shown} · 90 days up to the last send`;
  const days = (new Date(range.to) - new Date(range.from)) / 86400000 + 1;
  return days > MAX_TREND_DAYS ? `${shown} · last ${MAX_TREND_DAYS} days of the selected range` : shown;
}

export default function Dashboard() {
  const { range, withRange } = useDateRange();

  const summary = useApiData(withRange("/api/dashboard-summary"));
  const perf = useApiData(withRange("/api/email-performance"));
  const categories = useApiData(withRange("/api/categories"));
  const forms = useApiData(withRange("/api/form-submissions"));
  const nurture = useApiData(withRange("/api/nurture-emails"));
  const newsletterBlog = useApiData(withRange("/api/newsletter-blog"));

  const s = summary.data;
  // An all-zero window would draw an empty grid that only shows 0s on hover.
  const trendHasActivity = perf.data?.trend?.some((d) => d.sent || d.opened || d.clicked || d.bounced) ?? false;
  const refreshAll = () =>
    [summary, perf, categories, forms, nurture, newsletterBlog].forEach((d) => d.refetch());

  return (
    <div>
      <Topbar
        title="Mautic Email Dashboard"
        subtitle="Track, Analyze & Optimize Your Email Performance"
        onRefresh={refreshAll}
        refreshing={summary.loading}
        lastUpdated={s?.cachedAt}
        showBack={false}
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
            <StatCard label={METRICS.bouncedEmails.label} info={METRICS.bouncedEmails.info} value={s.bounced.toLocaleString()} sub={`${s.bounceRate}% Bounce Rate`} color="red" icon={MailX} />
            <StatCard label={METRICS.dncContacts.label} info={METRICS.dncContacts.info} value={s.dnc.toLocaleString()} sub="Sign_Up, any reason" color="gray" icon={UserX} />
          </div>
        )}
        {s && <BouncedVsDnc compact />}

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
                      <span className="text-sm text-gray-300 w-28">{row.stage}</span>
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
              {trendNote(range, perf.data) && <span className="text-xs text-muted">{trendNote(range, perf.data)}</span>}
            </div>
            {perf.loading && <LoadingState label="Loading trend..." />}
            {perf.error && <ErrorState message={perf.error} />}
            {perf.data && !trendHasActivity && (
              <div className="text-sm text-muted py-16 text-center space-y-1">
                <div>This email wasn't sent on any day in this period, so there's nothing to chart.</div>
                {perf.data.lastSent && (
                  <div className="text-xs">
                    Last sent {displayDay(dayStr(new Date(perf.data.lastSent)))} — pick a date
                    range that includes it to see its activity.
                  </div>
                )}
              </div>
            )}
            {perf.data && trendHasActivity && (
              <TrendChart data={perf.data.trend} />
            )}
          </div>
        </div>

        {/* Summary tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Form Submission Overview</h3>
              <Link to="/form-submissions" className="text-xs text-brand hover:underline">View All</Link>
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
              <Link to="/email-by-category" className="text-xs text-brand hover:underline">View All</Link>
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
              <Link to="/nurture-emails" className="text-xs text-brand hover:underline">View All</Link>
            </div>
            {nurture.loading && <LoadingState label="Loading nurture emails..." />}
            {nurture.error && <ErrorState message={nurture.error} />}
            {nurture.data && (
              <>
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

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted text-xs border-b border-border">
                      <th className="py-2 pr-3 font-medium">#</th>
                      <th className="py-2 pr-3 font-medium">Nurture Email</th>
                      <th className="py-2 pr-3 font-medium">Sent (A+B)</th>
                      <th className="py-2 pr-3 font-medium">Opened (A+B)</th>
                      <th className="py-2 font-medium">Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nurture.data.nurtureEmails.slice(0, 5).map((n) => (
                      <tr key={n.step} className="border-b border-border/60">
                        <td className="py-2 pr-3 text-muted">{n.step}</td>
                        <td className="py-2 pr-3 text-gray-200">{n.name}</td>
                        <td className="py-2 pr-3 text-gray-300">
                          {((n.variantA?.sent ?? 0) + (n.variantB?.sent ?? 0)).toLocaleString()}
                        </td>
                        <td className="py-2 pr-3 text-gray-300">
                          {((n.variantA?.opened ?? 0) + (n.variantB?.opened ?? 0)).toLocaleString()}
                        </td>
                        <td className="py-2">
                          {n.winner === "-" ? (
                            <span className="text-muted">—</span>
                          ) : (
                            <span className="text-accent-green font-medium">Variant {n.winner}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Newsletter & Blog Overview</h3>
              <Link to="/newsletter-blog" className="text-xs text-brand hover:underline">View All</Link>
            </div>
            {newsletterBlog.loading && <LoadingState label="Loading newsletter/blog..." />}
            {newsletterBlog.error && <ErrorState message={newsletterBlog.error} />}
            {newsletterBlog.data && (
              <div className="text-sm space-y-5">
                <div>
                  <div className="text-muted text-xs uppercase tracking-wide mb-2">Latest Newsletter</div>
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="text-left text-muted text-xs">
                        <th className="pb-1.5 pr-3 font-medium w-[34%]">Name</th>
                        <th className="pb-1.5 pr-3 font-medium w-[13%]">Sent</th>
                        <th className="pb-1.5 pr-3 font-medium w-[13%]">Opened</th>
                        <th className="pb-1.5 pr-3 font-medium w-[13%]">Open %</th>
                        <th className="pb-1.5 pr-3 font-medium w-[13%]">Clicked</th>
                        <th className="pb-1.5 font-medium w-[14%]">Click %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-1 pr-3 text-gray-100 whitespace-normal break-words align-top">
                          {cleanEmailTitle(newsletterBlog.data.newsletter[0]?.name) || "—"}
                        </td>
                        <td className="py-1 pr-3 text-gray-300 align-top">
                          {newsletterBlog.data.newsletter[0]?.sent.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-1 pr-3 text-gray-300 align-top">
                          {newsletterBlog.data.newsletter[0]?.opened.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-1 pr-3 text-gray-300 align-top">
                          {newsletterBlog.data.newsletter[0]?.openRate ?? "—"}
                        </td>
                        <td className="py-1 pr-3 text-gray-300 align-top">
                          {newsletterBlog.data.newsletter[0]?.clicked.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-1 text-gray-300 align-top">
                          {newsletterBlog.data.newsletter[0]?.clickRate ?? "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="text-muted text-xs uppercase tracking-wide mb-2">Latest Blog</div>
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="text-left text-muted text-xs">
                        <th className="pb-1.5 pr-3 font-medium w-[34%]">Name</th>
                        <th className="pb-1.5 pr-3 font-medium w-[13%]">Sent</th>
                        <th className="pb-1.5 pr-3 font-medium w-[13%]">Opened</th>
                        <th className="pb-1.5 pr-3 font-medium w-[13%]">Open %</th>
                        <th className="pb-1.5 pr-3 font-medium w-[13%]">Clicked</th>
                        <th className="pb-1.5 font-medium w-[14%]">Click %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-1 pr-3 text-gray-100 whitespace-normal break-words align-top">
                          {cleanEmailTitle(newsletterBlog.data.blog[0]?.name) || "—"}
                        </td>
                        <td className="py-1 pr-3 text-gray-300 align-top">
                          {newsletterBlog.data.blog[0]?.sent.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-1 pr-3 text-gray-300 align-top">
                          {newsletterBlog.data.blog[0]?.opened.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-1 pr-3 text-gray-300 align-top">
                          {newsletterBlog.data.blog[0]?.openRate ?? "—"}
                        </td>
                        <td className="py-1 pr-3 text-gray-300 align-top">
                          {newsletterBlog.data.blog[0]?.clicked.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-1 text-gray-300 align-top">
                          {newsletterBlog.data.blog[0]?.clickRate ?? "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
