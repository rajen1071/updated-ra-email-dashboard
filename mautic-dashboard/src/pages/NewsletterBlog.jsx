import Topbar from "../components/Topbar";
import { LoadingState, ErrorState } from "../components/StateViews";
import { useApiData } from "../hooks/useApiData";

function EmailTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-muted py-8 text-center">No matching emails found in Mautic.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted text-xs border-b border-border">
            <th className="py-3 pr-4 font-medium">Email Name</th>
            <th className="py-3 pr-4 font-medium">Date</th>
            <th className="py-3 pr-4 font-medium">Sent</th>
            <th className="py-3 pr-4 font-medium">Delivered</th>
            <th className="py-3 pr-4 font-medium">Opened</th>
            <th className="py-3 pr-4 font-medium">Clicked</th>
            <th className="py-3 pr-4 font-medium">Open Rate</th>
            <th className="py-3 font-medium">Click Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/60 hover:bg-white/[0.02]">
              <td className="py-3 pr-4 text-gray-200">{r.name}</td>
              <td className="py-3 pr-4 text-muted">{r.dateAdded ? new Date(r.dateAdded).toLocaleDateString() : "—"}</td>
              <td className="py-3 pr-4 text-gray-300">{r.sent.toLocaleString()}</td>
              <td className="py-3 pr-4 text-gray-300">{r.delivered.toLocaleString()}</td>
              <td className="py-3 pr-4 text-gray-300">{r.opened.toLocaleString()}</td>
              <td className="py-3 pr-4 text-gray-300">{r.clicked.toLocaleString()}</td>
              <td className="py-3 pr-4 text-accent-green font-medium">{r.openRate}</td>
              <td className="py-3 text-accent-purple font-medium">{r.clickRate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function NewsletterBlog() {
  const nb = useApiData("/api/newsletter-blog");

  return (
    <div>
      <Topbar
        title="Newsletter & Blog"
        subtitle="Newsletter (every Wednesday) and Blog (every Monday) — matched by email name"
        onRefresh={nb.refetch}
      />

      <div className="p-6 space-y-6">
        {nb.loading && <LoadingState />}
        {nb.error && <ErrorState message={nb.error} />}

        {nb.data && (
          <>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Newsletter (Weekly — Wednesday)</h3>
              <EmailTable rows={nb.data.newsletter} />
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Blog (Weekly — Monday)</h3>
              <EmailTable rows={nb.data.blog} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
