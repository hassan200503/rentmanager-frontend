"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Aug", rate: 72 },
  { month: "Sep", rate: 75 },
  { month: "Oct", rate: 78 },
  { month: "Nov", rate: 76 },
  { month: "Dec", rate: 80 },
  { month: "Jan", rate: 82 },
  { month: "Feb", rate: 85 },
  { month: "Mar", rate: 83 },
  { month: "Apr", rate: 86 },
  { month: "May", rate: 84 },
  { month: "Jun", rate: 87 },
  { month: "Jul", rate: 89 },
];

interface OccupancyTrendChartProps {
  currentRate?: number | null;
}

export default function OccupancyTrendChart({ currentRate }: OccupancyTrendChartProps) {
  const chartData = currentRate != null
    ? [...data.slice(0, -1), { month: "Now", rate: currentRate }]
    : data;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} dy={6} />
          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} dx={-4} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip
            formatter={(value) => [`${value}%`, "Occupancy"]}
            contentStyle={{
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-dropdown)",
            }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="var(--color-brand)"
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0, fill: "var(--color-brand)" }}
            activeDot={{ r: 5, strokeWidth: 0, fill: "var(--color-brand)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}