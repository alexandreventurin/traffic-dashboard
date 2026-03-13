import { AlertTriangle, XCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Alert } from "@/lib/types"

const severityConfig = {
  critical: {
    icon: XCircle,
    className: "text-red-400",
    bg: "bg-red-500/8 border-red-500/20",
    dot: "bg-red-400",
  },
  warning: {
    icon: AlertTriangle,
    className: "text-amber-400",
    bg: "bg-amber-500/8 border-amber-500/20",
    dot: "bg-amber-400",
  },
  info: {
    icon: Info,
    className: "text-blue-400",
    bg: "bg-blue-500/8 border-blue-500/20",
    dot: "bg-blue-400",
  },
}

interface AlertsPanelProps {
  alerts: Alert[]
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const critical = alerts.filter((a) => a.severity === "critical")
  const others = alerts.filter((a) => a.severity !== "critical")

  return (
    <div className="flex flex-col gap-2">
      {[...critical, ...others].map((alert) => {
        const config = severityConfig[alert.severity]
        const Icon = config.icon
        return (
          <div
            key={alert.id}
            className={cn(
              "flex gap-3 rounded-lg border p-3",
              config.bg
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.className)} />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {alert.campaignName}
                </span>
                <span
                  className={cn(
                    "inline-flex h-1.5 w-1.5 rounded-full",
                    alert.platform === "meta" ? "bg-blue-400" : "bg-red-400"
                  )}
                />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {alert.platform === "meta" ? "Meta" : "Google"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {alert.message}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
