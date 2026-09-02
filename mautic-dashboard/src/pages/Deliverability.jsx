import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import { LoadingState, ErrorState } from "../components/StateViews";
import { useApiData } from "../hooks/useApiData";

export default function Deliverability() {
  const del = useApiData("/api/deliverability");
  const d = del.data;

  return (
    <div>
      <Topbar
        title="Deliverability Overview"
        subtitle="Bounce rate, hard/soft bounce split, and DNC (Do Not Contact) tracking"
        onRefresh={del.refetch}
      />

      <div className="p-6 space-y-6">
        {del.loading && <LoadingState />}
        {del.error && <ErrorState message={del.error} />}

        {d && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="BOUNCE RATE" value={d.bounceRate} color="red" />
            <StatCard label="HARD BOUNCE" value={d.hardBounce.toLocaleString()} sub={d.hardBouncePct} color="orange" />
            <StatCard label="SOFT BOUNCE" value={d.softBounce.toLocaleString()} sub={d.softBouncePct} color="teal" />
            <StatCard label="DNC" value={d.dnc.toLocaleString()} color="gray" />
          </div>
        )}

        {d && (
          <div className="card p-5 text-xs text-muted">
            Note: Mautic's default email stats don't separate hard vs soft bounce out of the box.
            The split shown here is estimated — if your Mautic has a bounce-tracking plugin or
            table, update <code className="text-gray-300">/api/deliverability.js</code> to source
            the real numbers.
          </div>
        )}
      </div>
    </div>
  );
}
