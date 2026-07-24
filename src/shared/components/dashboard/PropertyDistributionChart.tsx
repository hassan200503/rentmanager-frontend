"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { type: "Apartment", count: 8 },
  { type: "Bedsitter", count: 5 },
  { type: "Villa", count: 3 },
  { type: "Maisonette", count: 4 },
  { type: "Hostel", count: 2 },
  { type: "Studio", count: 2 },
  { type: "Commercial", count: 1 },
];

export default function PropertyDistributionChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" axisLine={false} tickLine={false} dx={4} />
          <YAxis type="category" dataKey="type" axisLine={false} tickLine={false} width={80} />
          <Tooltip
            contentStyle={{
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-dropdown)",
            }}
          />
          <Bar
            dataKey="count"
            fill="var(--color-brand)"
            radius={[0, 4, 4, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}