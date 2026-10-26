import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Info } from "lucide-react";

const POINTS = [
  {
    term: "Bounced",
    text:
      "an email couldn't be delivered. It's about an email, not a person: the same person " +
      "can bounce more than once.",
  },
  {
    term: "DNC (Do Not Contact)",
    text: "Mautic has stopped emailing this person. It's about the person.",
  },
  {
    term: "How they connect",
    text:
      "a bounce is one reason someone becomes DNC. People also become DNC when they " +
      "unsubscribe, or when someone blocks them manually.",
  },
];

const TERMS = [
  ["Bounced Emails", "how many times one email bounced (all recipients)"],
  ["Bounced Contacts", "Sign_Up people we stopped emailing because of a bounce"],
  ["DNC Contacts", "Sign_Up people we stopped emailing, for any reason"],
];

/**
 * Explains why the Bounced and DNC numbers differ. Starts open where the
 * page is about deliverability; `compact` starts it collapsed.
 */
export default function BouncedVsDnc({ compact = false }) {
  const [open, setOpen] = useState(!compact);

  return (
    <div className="card text-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-semibold text-white">
          <Info size={15} className="text-brand" />
          Bounced vs DNC — why the numbers differ
        </span>
        <ChevronDown size={15} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          <ul className="space-y-1.5 text-muted">
            {POINTS.map((p) => (
              <li key={p.term}>
                <span className="text-gray-200 font-medium">{p.term}</span> — {p.text}
              </li>
            ))}
          </ul>
          <p className="text-muted">
            So the two are related, but they count different things, and their numbers won't
            match.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {TERMS.map(([term, text]) => (
              <div key={term} className="rounded-lg bg-white/[0.03] border border-border px-3 py-2">
                <div className="text-xs font-semibold text-gray-200">{term}</div>
                <div className="text-xs text-muted mt-0.5">{text}</div>
              </div>
            ))}
          </div>
          {compact && (
            <p className="text-xs text-muted">
              More detail on{" "}
              <Link to="/deliverability" className="text-brand hover:underline">Deliverability</Link>{" "}
              and{" "}
              <Link to="/bounced-contacts" className="text-brand hover:underline">Bounced Contacts</Link>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
