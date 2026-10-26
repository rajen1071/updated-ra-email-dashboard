import { useRef, useState } from "react";
import { Info } from "lucide-react";

const colorMap = {
  blue: { text: "text-accent-blue", icon: "text-accent-blue" },
  green: { text: "text-accent-green", icon: "text-accent-green" },
  purple: { text: "text-accent-purple", icon: "text-accent-purple" },
  orange: { text: "text-accent-orange", icon: "text-accent-orange" },
  red: { text: "text-accent-red", icon: "text-accent-red" },
  teal: { text: "text-accent-teal", icon: "text-accent-teal" },
  gray: { text: "text-gray-300", icon: "text-gray-400" },
};

const TIP_WIDTH = 256;

/**
 * Info icon that shows `text` on hover or keyboard focus. The tooltip is
 * placed under the icon but kept inside the window, wherever the card is.
 */
export function InfoTip({ text }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  const show = () => {
    const r = ref.current.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.left - 12), window.innerWidth - TIP_WIDTH - 8);
    setPos({ top: r.bottom + 8, left });
  };
  const hide = () => setPos(null);

  return (
    <span className="inline-flex" data-export-ignore>
      <button
        ref={ref}
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="text-muted hover:text-gray-200 focus:text-gray-200 outline-none"
        aria-label={text}
      >
        <Info size={13} />
      </button>
      {pos && (
        <span
          role="tooltip"
          style={{ top: pos.top, left: pos.left, width: TIP_WIDTH }}
          className="fixed z-50 card shadow-card p-3 text-xs leading-relaxed text-gray-300 tracking-normal font-normal pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default function StatCard({ label, value, sub, color = "blue", icon: Icon, info }) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="card p-4 flex-1 min-w-[140px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted">
          {label}
          {info && <InfoTip text={info} />}
        </span>
        {Icon && <Icon size={16} className={`${c.icon} shrink-0`} />}
      </div>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}
