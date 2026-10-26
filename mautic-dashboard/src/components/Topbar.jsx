import { Link } from "react-router-dom";
import { RefreshCw, ArrowLeft } from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import DateRangePicker from "./DateRangePicker";
import ExportPdfButton from "./ExportPdfButton";

export default function Topbar({ title, subtitle, onRefresh, refreshing = false, lastUpdated, showBack = true }) {
  return (
    <div className="border-b border-border">
      {showBack && (
        <div className="px-6 pt-3" data-export-ignore>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline"
          >
            <ArrowLeft size={13} />
            Back to Dashboard
          </Link>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3 px-6 py-5">
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center flex-wrap gap-3">
          <div data-export-ignore>
            <ThemeSwitcher />
          </div>
          <DateRangePicker />
          <ExportPdfButton title={title} />
          {lastUpdated && (
            <span className="text-xs text-muted">
              Updated {new Date(lastUpdated).toLocaleString()}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg card text-gray-300 hover:bg-white/5 disabled:opacity-60"
            title="Refresh data from Mautic"
            data-export-ignore
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
