import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TimelineStats {
  time: string;
  attacks: number;
}

interface TimelineProps {
  data: TimelineStats[];
}

export default function Timeline({ data }: TimelineProps) {
  return (
    <div style={{ height: 185, marginTop: 15 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="threatFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#27a9ed" stopOpacity={0.42} />
              <stop offset="100%" stopColor="#27a9ed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fill: "#71819a", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "#0b1422",
              border: "1px solid #2a4562",
              borderRadius: 8,
              fontSize: 11
            }}
          />
          <Area
            type="monotone"
            dataKey="attacks"
            stroke="#3ab7f5"
            strokeWidth={2}
            fill="url(#threatFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}