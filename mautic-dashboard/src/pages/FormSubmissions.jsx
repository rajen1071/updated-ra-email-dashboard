import { CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import { LoadingState, ErrorState } from "../components/StateViews";
import { useApiData } from "../hooks/useApiData";

function EmailStatusBadge({ status }) {
  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-accent-green bg-accent-green/10 px-2 py-1 rounded-full">
        <CheckCircle2 size={12} /> Configured
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted bg-white/5 px-2 py-1 rounded-full">
      <XCircle size={12} /> No email
    </span>
  );
}

export default function FormSubmissions() {
  const forms = useApiData("/api/form-submissions");
  const t = forms.data?.totals;

  return (
    <div>
      <Topbar
        title="Form Submissions"
        subtitle="Sign Up, Contact Us, Job Post, Job Apply — submissions & confirmation/internal email tracking"
        onRefresh={forms.refetch}
      />

      <div className="p-6 space-y-6">
        {forms.loading && <LoadingState />}
        {forms.error && <ErrorState message={forms.error} />}

        {t && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="TOTAL SUBMISSIONS" value={t.submissions.toLocaleString()} color="purple" />
            <StatCard label="USER EMAILS SENT" value={t.userSent.toLocaleString()} color="blue" />
            <StatCard label="USER OPENED" value={t.userOpened.toLocaleString()} color="orange" />
            <StatCard label="INTERNAL SENT" value={t.internalSent.toLocaleString()} color="teal" />
            <StatCard label="INTERNAL OPENED" value={t.internalOpened.toLocaleString()} color="green" />
          </div>
        )}

        {forms.data && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Form-wise Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted text-xs">
                    <th className="py-2 pr-4 font-medium" rowSpan={2}>Form Name</th>
                    <th className="py-2 pr-4 font-medium" rowSpan={2}>Submissions</th>
                    <th className="py-2 pr-4 font-medium" rowSpan={2}>Email Status</th>
                    <th className="py-2 pr-4 font-bold text-accent-blue text-center" colSpan={4}>
                      User
                    </th>
                    <th className="py-2 font-bold text-accent-teal text-center" colSpan={4}>
                      Internal
                    </th>
                  </tr>
                  <tr className="text-left text-muted text-xs">
                    <th className="pb-2 pr-4 font-medium">Sent</th>
                    <th className="pb-2 pr-4 font-medium">Delivered</th>
                    <th className="pb-2 pr-4 font-medium">Opened</th>
                    <th className="pb-2 pr-4 font-medium">Clicked</th>
                    <th className="pb-2 pr-4 font-medium">Sent</th>
                    <th className="pb-2 pr-4 font-medium">Delivered</th>
                    <th className="pb-2 pr-4 font-medium">Opened</th>
                    <th className="pb-2 font-medium">Clicked</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.data.forms.map((f) => (
                    <tr key={f.formId} className="hover:bg-white/[0.02]">
                      <td className="py-3 pr-4 font-medium">
                        <Link to={`/form-submissions/${f.formId}`} className="text-accent-blue hover:underline">
                          {f.formName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-gray-200">{f.submissions.toLocaleString()}</td>
                      <td className="py-3 pr-4"><EmailStatusBadge status={f.emailStatus} /></td>
                      <td className="py-3 pr-4 text-gray-300">{f.userEmail ? f.userEmail.sent : "—"}</td>
                      <td className="py-3 pr-4 text-gray-300">{f.userEmail ? f.userEmail.delivered : "—"}</td>
                      <td className="py-3 pr-4 text-gray-300">{f.userEmail ? f.userEmail.opened : "—"}</td>
                      <td className="py-3 pr-4 text-gray-300">{f.userEmail ? f.userEmail.clicked : "—"}</td>
                      <td className="py-3 pr-4 text-gray-300">{f.internalEmail ? f.internalEmail.sent : "—"}</td>
                      <td className="py-3 pr-4 text-gray-300">{f.internalEmail ? f.internalEmail.delivered : "—"}</td>
                      <td className="py-3 pr-4 text-gray-300">{f.internalEmail ? f.internalEmail.opened : "—"}</td>
                      <td className="py-3 text-gray-300">{f.internalEmail ? f.internalEmail.clicked : "—"}</td>
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
