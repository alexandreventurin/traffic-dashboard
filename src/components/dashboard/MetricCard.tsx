import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string
  delta?: number        // % variação vs período anterior
  deltaLabel?: string   // ex: "vs ontem", "vs 30d anterior"
  prefix?: string       // ex: "R$"
  suffix?: string       // ex: "x", "%"
  highlight?: boolean   // destaque azul no card
  subValue?: string     // linha secundária, ex: "de R$ 60.000 de budget"
  subValueStatus?: "ok" | "warning" | "danger"
}

function DeltaBadge({ delta, label }: { delta: number; label?: string }) {
  const isPositive = delta > 0
  const isNeutral = delta === 0

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isNeutral
          ? "bg-muted text-muted-foreground"
          : isPositive
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      )}
    >
      {isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>{isPositive ? "+" : ""}{delta.toFixed(1)}%</span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
  highlight,
  subValue,
  subValueStatus = "ok",
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors",
        highlight && "border-primary/30 bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        {delta !== undefined && (
          <DeltaBadge delta={delta} label={deltaLabel} />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        {subValue && (
          <p
            className={cn(
              "text-xs",
              subValueStatus === "ok" && "text-muted-foreground",
              subValueStatus === "warning" && "text-amber-400",
              subValueStatus === "danger" && "text-red-400"
            )}
          >
            {subValue}
          </p>
        )}
      </div>
    </div>
  )
}
