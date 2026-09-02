import { Calendar, Download, RefreshCw } from "lucide-react";

export default function Topbar({ title, subtitle, onRefresh }) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-border">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg card text-sm text-gray-300">
          <Calendar size={15} />
          <span>01-01-2026 – 31-08-2026</span>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg card text-sm text-gray-300 hover:bg-white/5">
          <Download size={15} />
          Export PDF
        </button>
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg card text-gray-300 hover:bg-white/5"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>
    </div>
  );
}
