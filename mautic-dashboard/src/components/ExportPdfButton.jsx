import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useDateRange } from "../context/DateRangeContext";
import { exportPdf } from "../lib/exportPdf";

export default function ExportPdfButton({ title }) {
  const { label } = useDateRange();
  const [busy, setBusy] = useState(false);

  const onExport = async () => {
    const page = document.getElementById("page-content");
    if (!page || busy) return;
    setBusy(true);
    try {
      const name = `${title} ${label}`.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim();
      await exportPdf(page, `${name}.pdf`);
    } catch (err) {
      console.error(err);
      alert(`Could not export PDF: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const Icon = busy ? Loader2 : Download;

  return (
    <button
      onClick={onExport}
      disabled={busy}
      className="flex items-center gap-2 px-3 py-2 rounded-lg card text-sm text-gray-300 hover:bg-white/5 disabled:opacity-60 whitespace-nowrap"
      title="Download this page as a PDF"
      data-export-ignore
    >
      <Icon size={15} className={busy ? "animate-spin" : ""} />
      {busy ? "Exporting..." : "Export PDF"}
    </button>
  );
}
