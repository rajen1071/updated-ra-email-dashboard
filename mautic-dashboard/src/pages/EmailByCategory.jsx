import Topbar from "../components/Topbar";
import { LoadingState, ErrorState } from "../components/StateViews";
import { useApiData } from "../hooks/useApiData";

export default function EmailByCategory() {
  const categories = useApiData("/api/categories");

  return (
    <div>
      <Topbar
        title="Email By Category"
        subtitle="Interest-based emails triggered by website navigation tags"
        onRefresh={categories.refetch}
      />
      <div className="p-6">
        <div className="card p-5">
          {categories.loading && <LoadingState label="Loading category data..." />}
          {categories.error && <ErrorState message={categories.error} />}
          {categories.data && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted text-xs border-b border-border">
                    <th className="py-3 pr-4 font-medium">Category</th>
                    <th className="py-3 pr-4 font-medium">Contacts (Tagged)</th>
                    <th className="py-3 pr-4 font-medium">Emails Sent</th>
                    <th className="py-3 pr-4 font-medium">Delivered</th>
                    <th className="py-3 pr-4 font-medium">Opened</th>
                    <th className="py-3 pr-4 font-medium">Clicked</th>
                    <th className="py-3 pr-4 font-medium">Open Rate</th>
                    <th className="py-3 font-medium">Click Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.data.categories.map((c) => (
                    <tr key={c.category} className="border-b border-border/60 hover:bg-white/[0.02]">
                      <td className="py-3 pr-4 text-accent-blue font-medium">{c.category}</td>
                      <td className="py-3 pr-4 text-gray-200">{c.contacts.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-gray-300">{c.emailsSent.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-gray-300">{c.delivered.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-gray-300">{c.opened.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-gray-300">{c.clicked.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-accent-green font-medium">{c.openRate}</td>
                      <td className="py-3 text-accent-purple font-medium">{c.clickRate}</td>
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
