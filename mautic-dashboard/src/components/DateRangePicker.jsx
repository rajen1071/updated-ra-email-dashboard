import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { PRESETS, dayStr, useDateRange } from "../context/DateRangeContext";

export default function DateRangePicker() {
  const { selection, setSelection, range, label } = useDateRange();
  const [open, setOpen] = useState(false);
  // Custom dates being picked, before Apply.
  const [draft, setDraft] = useState({ from: "", to: "" });
  const rootRef = useRef(null);
  const today = dayStr(new Date());

  const toggle = () => {
    // Start the custom inputs from whatever range is showing now.
    if (!open) setDraft(range ? { ...range } : { from: "", to: today });
    setOpen(!open);
  };

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pickPreset = (id) => {
    setSelection({ preset: id });
    setOpen(false);
  };

  const applyCustom = () => {
    setSelection({ preset: "custom", from: draft.from, to: draft.to });
    setOpen(false);
  };

  const customValid = draft.from && draft.to && draft.from <= draft.to;

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={toggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg card text-sm text-gray-300 hover:bg-white/5 whitespace-nowrap"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Filter every section by date"
      >
        <Calendar size={15} />
        <span>{label}</span>
        <ChevronDown size={14} className="text-muted" data-export-ignore />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Date range"
          className="absolute right-0 top-full mt-2 z-30 w-72 card shadow-card p-2 text-sm"
          data-export-ignore
        >
          {PRESETS.filter((p) => p.id !== "custom").map((p) => (
            <button
              key={p.id}
              onClick={() => pickPreset(p.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/5 ${
                selection.preset === p.id ? "text-brand font-medium" : "text-gray-300"
              }`}
            >
              {p.label}
              {selection.preset === p.id && <Check size={14} />}
            </button>
          ))}

          <div className="border-t border-border mt-2 pt-3 px-3 pb-1 space-y-2">
            <div className={`text-xs ${selection.preset === "custom" ? "text-brand" : "text-muted"}`}>
              Custom range
            </div>
            <label className="flex items-center justify-between gap-2 text-xs text-muted">
              From
              <input
                type="date"
                value={draft.from}
                max={draft.to || today}
                onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                className="bg-white/5 border border-border rounded-md px-2 py-1 text-gray-300"
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs text-muted">
              To
              <input
                type="date"
                value={draft.to}
                min={draft.from}
                max={today}
                onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                className="bg-white/5 border border-border rounded-md px-2 py-1 text-gray-300"
              />
            </label>
            <button
              onClick={applyCustom}
              disabled={!customValid}
              className="w-full mt-1 py-1.5 rounded-md bg-brand/15 text-brand font-medium hover:bg-brand/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
