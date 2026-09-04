import { useParams, Link } from "react-router-dom";
import Topbar from "../components/Topbar";
import { LoadingState, ErrorState } from "../components/StateViews";
import { useApiData } from "../hooks/useApiData";

export default function FormSubmitters() {
  const { formId } = useParams();
  const data = useApiData(`/api/form-submitters?formId=${formId}`);

  return (
    <div>
      <Topbar
        title={data.data ? data.data.formName : "Form Submitters"}
        subtitle="Everyone who submitted this form — First Name, Last Name, Email"
        onRefresh={data.refetch}
      />
      <div className="p-6 space-y-4">
        <Link to="/form-submissions" className="text-xs text-accent-blue hover:underline">
          ← Back to Form Submissions
        </Link>

        {data.loading && <LoadingState label="Loading submitters..." />}
        {data.error && <ErrorState message={data.error} />}

        {data.data && data.data.submissions.length === 0 && (
          <div className="card p-5 text-sm text-muted">No submissions found for this form yet.</div>
        )}

        {data.data && data.data.submissions.length > 0 && (
          <div className="card p-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs">
                  <th className="py-2 pr-4 font-medium">First Name</th>
                  <th className="py-2 pr-4 font-medium">Last Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {data.data.submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 pr-4 text-gray-200">{s.firstName || "—"}</td>
                    <td className="py-3 pr-4 text-gray-200">{s.lastName || "—"}</td>
                    <td className="py-3 pr-4 text-accent-blue">{s.email || "—"}</td>
                    <td className="py-3 text-gray-400">
                      {s.dateSubmitted ? new Date(s.dateSubmitted).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
