import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Daily email activity as smooth lines; Sent gets a soft gradient fill.
const SERIES = [
  { key: "sent", name: "Sent", color: "#3B82F6", fill: true },
  { key: "opened", name: "Opened", color: "#22C55E" },
  { key: "clicked", name: "Email Clicks", color: "#F5A623" },
  { key: "bounced", name: "Bounced (failed sends)", color: "#EF4444" },
];

// Dates are UTC calendar days ("2026-10-16"), so format them in UTC.
const shortDay = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longDay = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

// 85 -> "85", 25000 -> "25k", 1500000 -> "1.5M"
function compact(n) {
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}k`;
  return String(n);
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card shadow-card px-4 py-3 text-sm space-y-1.5 min-w-[170px]">
      <div className="font-semibold text-white">{longDay(label)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name} : {Number(p.value).toLocaleString()}
        </div>
      ))}
    </div>
  );
}

export default function TrendChart({ data }) {
  // Dots only when there are few enough days to tell them apart.
  const dot = data.length <= 31 ? { r: 3, strokeWidth: 0 } : false;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trend-sent-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgb(var(--color-border))" />
        <XAxis
          dataKey="date"
          tickFormatter={shortDay}
          stroke="#8593A8"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          tickMargin={8}
        />
        <YAxis
          tickFormatter={compact}
          stroke="#8593A8"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={44}
        />
        <Tooltip
          content={<TrendTooltip />}
          cursor={{ stroke: "#8593A8", strokeDasharray: "4 4" }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {SERIES.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2.5}
            fill={s.fill ? "url(#trend-sent-fill)" : "none"}
            dot={dot && { ...dot, fill: s.color }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "rgb(var(--color-panel))", fill: s.color }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
