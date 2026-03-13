"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import type { DailyMetric } from "@/lib/types"

interface SpendRevenueChartProps {
  data: DailyMetric[]
}

function formatBRL(value: number) {
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`
  return `R$${value.toFixed(0)}`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return `${d.getDate()}/${d.getMonth() + 1}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-xl text-xs">
      <p className="mb-2 font-semibold text-foreground">{label}</p>
      {payload.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {entry.dataKey === "roas"
                ? `${Number(entry.value).toFixed(2)}x`
                : formatBRL(entry.value)}
            </span>
          </div>
        )
      )}
    </div>
  )
}

export function SpendRevenueChart({ data }: SpendRevenueChartProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    spend: d.spend,
    revenue: d.revenue,
    roas: d.roas,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="oklch(1 0 0 / 6%)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "oklch(0.55 0.01 250)" }}
          axisLine={false}
          tickLine={false}
          interval={4}
        />
        <YAxis
          yAxisId="money"
          tick={{ fontSize: 10, fill: "oklch(0.55 0.01 250)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatBRL}
          width={42}
        />
        <YAxis
          yAxisId="roas"
          orientation="right"
          tick={{ fontSize: 10, fill: "oklch(0.55 0.01 250)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}x`}
          width={30}
          domain={[0, 8]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
        />
        <Line
          yAxisId="money"
          type="monotone"
          dataKey="revenue"
          name="Receita"
          stroke="oklch(0.65 0.18 145)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Line
          yAxisId="money"
          type="monotone"
          dataKey="spend"
          name="Gasto"
          stroke="oklch(0.62 0.19 255)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Line
          yAxisId="roas"
          type="monotone"
          dataKey="roas"
          name="ROAS"
          stroke="oklch(0.75 0.16 75)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
