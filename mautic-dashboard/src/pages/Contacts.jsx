import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import { LoadingState, ErrorState } from "../components/StateViews";
import { useApiData } from "../hooks/useApiData";

export default function Contacts() {
  const summary = useApiData("/api/dashboard-summary");

  return (
    <div>
      <Topbar
        title="Contacts"
        subtitle="Contacts carrying the Sign_Up tag"
        onRefresh={summary.refetch}
      />
      <div className="p-6 space-y-6">
        {summary.loading && <LoadingState />}
        {summary.error && <ErrorState message={summary.error} />}
        {summary.data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="TOTAL CONTACTS" value={summary.data.totalContacts.toLocaleString()} color="blue" />
            <StatCard label="DNC CONTACTS" value={summary.data.dnc.toLocaleString()} color="gray" />
          </div>
        )}
        <div className="card p-5 text-sm text-muted">
          A full contact list/table can be added here by calling{" "}
          <code className="text-gray-300">/api/contacts</code> against Mautic's{" "}
          <code className="text-gray-300">/api/contacts</code> endpoint with pagination — not built
          yet since the original brief focused on form/category/nurture/newsletter reporting.
        </div>
      </div>
    </div>
  );
}
