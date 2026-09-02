const colorMap = {
  blue: { text: "text-accent-blue", icon: "text-accent-blue" },
  green: { text: "text-accent-green", icon: "text-accent-green" },
  purple: { text: "text-accent-purple", icon: "text-accent-purple" },
  orange: { text: "text-accent-orange", icon: "text-accent-orange" },
  red: { text: "text-accent-red", icon: "text-accent-red" },
  teal: { text: "text-accent-teal", icon: "text-accent-teal" },
  gray: { text: "text-gray-300", icon: "text-gray-400" },
};

export default function StatCard({ label, value, sub, color = "blue", icon: Icon }) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="card p-4 flex-1 min-w-[140px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] tracking-wide text-muted">{label}</span>
        {Icon && <Icon size={16} className={c.icon} />}
      </div>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}
