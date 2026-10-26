import { Link } from "react-router-dom";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import BouncedVsDnc from "../components/BouncedVsDnc";
import { METRICS } from "../config/metricDefinitions";
import { LoadingState, ErrorState } from "../components/StateViews";
import { useApiData } from "../hooks/useApiData";
import { useDateRange } from "../context/DateRangeContext";
import { cleanEmailTitle } from "../lib/text";

// Each email DNC record in Mautic has a reason code; this shows how the
// Sign_Up DNC total splits across them.
function DncBreakdown({ d }) {
  const b = d.dncBreakdown;
  const parts = [
    { label: "Bounced — hard", value: b.hard, color: "bg-accent-red", note: "address can't receive email" },
    { label: "Bounced — soft", value: b.soft, color: "bg-accent-orange", note: "failed 5 delivery attempts" },
    { label: "Unsubscribed", value: b.unsubscribed, color: "bg-accent-blue", note: "clicked unsubscribe" },
    { label: "Manual", value: b.manual, color: "bg-gray-400", note: "added by a user, import or campaign" },
  ];
  const total = parts.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="card p-5 text-sm space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-1">Where the DNC number comes from</h3>
        <p className="text-muted">
          DNC (Do Not Contact) is Mautic's list of contacts it must not email. Every entry is a
          record on the contact with a reason. The DNC card counts Sign_Up contacts with an email
          DNC record ({d.dnc.toLocaleString()}); by reason:
        </p>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-surface">
        {parts.map((p) => (
          <div key={p.label} className={p.color} style={{ width: `${total ? (p.value / total) * 100 : 0}%` }} />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {parts.map((p) => (
          <div key={p.label}>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className={`w-2 h-2 rounded-full ${p.color}`} />
              {p.label}
            </div>
            <div className="text-lg font-bold text-white mt-0.5">{p.value.toLocaleString()}</div>
            <div className="text-xs text-muted">
              {total ? ((p.value / total) * 100).toFixed(1) : "0"}% · {p.note}
            </div>
          </div>
        ))}
      </div>
      {total !== d.dnc && (
        <p className="text-xs text-muted">
          The reasons add up to {total.toLocaleString()}: a contact with records for two reasons is
          counted under each.
        </p>
      )}
    </div>
  );
}

export default function Deliverability() {
  const { withRange } = useDateRange();
  const del = useApiData(withRange("/api/deliverability"));
  const d = del.data;

  return (
    <div>
      <Topbar
        title="Deliverability Overview"
        subtitle="Bounce rate, hard/soft bounce split, and DNC (Do Not Contact) tracking"
        onRefresh={del.refetch}
        refreshing={del.loading}
        lastUpdated={del.data?.cachedAt}
      />

      <div className="p-6 space-y-6">
        {del.loading && (
          <LoadingState label="Loading deliverability... the first load reads every DNC record and can take about a minute." />
        )}
        {del.error && <ErrorState message={del.error} />}

        {d && (
          <>
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-muted mb-2">
                DASHBOARD EMAIL — email-level, all recipients
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label={METRICS.bouncedEmails.label} info={METRICS.bouncedEmails.info} value={(d.bounced ?? 0).toLocaleString()} sub={`of ${(d.sent ?? 0).toLocaleString()} sent`} color="red" />
                <StatCard label={METRICS.bounceRate.label} info={METRICS.bounceRate.info} value={d.bounceRate} color="red" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-muted mb-2">
                SIGN_UP CONTACTS — unique contacts
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label={METRICS.dncContacts.label} info={METRICS.dncContacts.info} value={d.dnc.toLocaleString()} sub="any reason" color="gray" />
                <StatCard label={METRICS.bouncedContacts.label} info={METRICS.bouncedContacts.info} value={(d.bouncedContacts ?? 0).toLocaleString()} sub="DNC because of a bounce" color="red" />
                <StatCard label={METRICS.hardBounced.label} info={METRICS.hardBounced.info} value={d.hardBounce.toLocaleString()} sub={`${d.hardBouncePct} of Bounced Contacts — permanent`} color="red" />
                <StatCard label={METRICS.softBounced.label} info={METRICS.softBounced.info} value={d.softBounce.toLocaleString()} sub={`${d.softBouncePct} of Bounced Contacts — temporary`} color="orange" />
              </div>
            </div>
            <BouncedVsDnc />
          </>
        )}

        {d?.dncBreakdown && <DncBreakdown d={d} />}

        {d && (
          <div className="card p-5 text-sm text-gray-300 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">How Bounced Emails is counted</h3>
              <p className="text-muted">
                For {cleanEmailTitle(d.emailName) || "the dashboard email"}, Bounced ={" "}
                <span className="text-gray-200">sends that failed</span> +{" "}
                <span className="text-gray-200">contacts marked "bounced"</span> afterwards. That's{" "}
                {(d.bounced ?? 0).toLocaleString()} of {(d.sent ?? 0).toLocaleString()} sent ={" "}
                <span className="text-gray-200">{d.bounceRate}</span>, and Delivered = Sent − Bounced.
                This matches the Delivered figure on Mautic's own email page. Mautic usually records
                the same bounce in both places, so most bounces are counted twice there, and here too.
              </p>
              <p className="text-muted mt-2">
                Bounced Contacts (and its Hard/Soft split) counts contacts instead: unique Sign_Up
                contacts that Mautic marked Do Not Contact because an email to them bounced (any
                email, not just this one). Each is counted once, as hard or soft.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-accent-red mb-1">Hard bounce — permanent</h4>
                <p className="text-muted">
                  The address can never receive email: the mailbox or domain doesn't exist, or the
                  server rejected it outright ("Permanent SMTP delivery error"). Mautic stops
                  emailing these contacts.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-accent-orange mb-1">Soft bounce — temporary</h4>
                <p className="text-muted">
                  The address exists but couldn't take the email at that time (mailbox full, server
                  busy or down). The mail server retried 5 times before giving up ("Maximum number of
                  delivery attempts (5) has been reached").
                </p>
              </div>
            </div>
            <p className="text-xs text-muted">
              Hard/soft is read from the reason the mail server reported for each bounce. See every
              bounced contact and its reason on{" "}
              <Link to="/bounced-contacts" className="text-brand hover:underline">Bounced Contacts</Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
