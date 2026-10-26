import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * One date filter shared by every module. Sent to the API as
 * ?from=YYYY-MM-DD&to=YYYY-MM-DD; "All time" sends nothing.
 * Relative presets (Last 30 days, ...) are stored by name so they
 * stay relative to today. Remembered per browser, like the sidebar.
 */
export const PRESETS = [
  { id: "all", label: "All time" },
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "ytd", label: "This year" },
  { id: "custom", label: "Custom range" },
];

const STORAGE_KEY = "date-range";
const DEFAULT = { preset: "all" };

// Local calendar day as YYYY-MM-DD.
export function dayStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// YYYY-MM-DD -> DD-MM-YYYY for display.
export function displayDay(str) {
  const [y, m, d] = str.split("-");
  return `${d}-${m}-${y}`;
}

/** The { from, to } a selection stands for today, or null for All time. */
function resolve(selection) {
  const today = new Date();
  const preset = PRESETS.find((p) => p.id === selection.preset);
  if (preset?.days) {
    const from = new Date(today);
    from.setDate(from.getDate() - (preset.days - 1));
    return { from: dayStr(from), to: dayStr(today) };
  }
  if (selection.preset === "ytd") {
    return { from: `${today.getFullYear()}-01-01`, to: dayStr(today) };
  }
  if (selection.preset === "custom" && selection.from && selection.to) {
    return { from: selection.from, to: selection.to };
  }
  return null;
}

function readStored() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored && PRESETS.some((p) => p.id === stored.preset) ? stored : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

const DateRangeContext = createContext(null);

export function DateRangeProvider({ children }) {
  const [selection, setSelection] = useState(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch {
      // Storage unavailable (e.g. private mode) — just don't remember it.
    }
  }, [selection]);

  const range = useMemo(() => resolve(selection), [selection]);

  const label = range
    ? `${displayDay(range.from)} – ${displayDay(range.to)}`
    : PRESETS[0].label;

  // Add the range to an /api path, e.g. "/api/categories?from=...&to=...".
  const withRange = useCallback(
    (path) => {
      if (!range) return path;
      const sep = path.includes("?") ? "&" : "?";
      return `${path}${sep}from=${range.from}&to=${range.to}`;
    },
    [range]
  );

  const value = { selection, setSelection, range, label, withRange };
  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within a DateRangeProvider");
  return ctx;
}
