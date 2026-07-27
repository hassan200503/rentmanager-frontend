"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Aug", properties: 8, units: 24, leases: 18 },
  { month: "Sep", properties: 10, units: 30, leases: 22 },
  { month: "Oct", properties: 12, units: 36, leases: 28 },
  { month: "Nov", properties: 14, units: 42, leases: 33 },
  { month: "Dec", properties: 16, units: 48, leases: 38 },
  { month: "Jan", properties: 18, units: 54, leases: 42 },
  { month: "Feb", properties: 20, units: 60, leases: 47 },
  { month: "Mar", properties: 22, units: 66, leases: 52 },
  { month: "Apr", properties: 24, units: 72, leases: 56 },
  { month: "May", properties: 26, units: 78, leases: 61 },
  { month: "Jun", properties: 28, units: 84, leases: 65 },
  { month: "Jul", properties: 30, units: 90, leases: 70 },
];

interface PortfolioGrowthChartProps {
  currentProperties?: number;
  currentUnits?: number;
}

export default function PortfolioGrowthChart({}: PortfolioGrowthChartProps) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="pgProperties" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pgUnits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-info)" stopOpacity={0.12} />
              <stop offset="95%" stopColor="var(--color-info)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pgLeases" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-brand-400)" stopOpacity={0.1} />
              <stop offset="95%" stopColor="var(--color-brand-400)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} dy={6} />
          <YAxis axisLine={false} tickLine={false} dx={-4} />
          <Tooltip
            contentStyle={{
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-dropdown)",
            }}
          />
          <Area
            type="monotone"
            dataKey="properties"
            stroke="var(--color-brand)"
            strokeWidth={2}
            fill="url(#pgProperties)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-brand)" }}
          />
          <Area
            type="monotone"
            dataKey="units"
            stroke="var(--color-info)"
            strokeWidth={2}
            fill="url(#pgUnits)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-info)" }}
          />
          <Area
            type="monotone"
            dataKey="leases"
            stroke="var(--color-brand-400)"
            strokeWidth={2}
            fill="url(#pgLeases)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-brand-400)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}