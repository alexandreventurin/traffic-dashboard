"use client"

import { TrendingUp, TrendingDown, Minus, AlertTriangle, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Campaign } from "@/lib/types"

function PlatformDot({ platform }: { platform: "meta" | "google" }) {
  return (
    <span
      className={cn(
        "inline-flex h-1.5 w-1.5 rounded-full",
        platform === "meta" ? "bg-blue-400" : "bg-red-400"
      )}
    />
  )
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const map: Record<Campaign["status"], { label: string; className: string }> = {
    ACTIVE: { label: "Ativo", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    PAUSED: { label: "Pausado", className: "bg-muted text-muted-foreground border-border" },
    LEARNING: { label: "Aprendendo", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    LEARNING_LIMITED: { label: "Aprendizado Limitado", className: "bg-red-500/10 text-red-400 border-red-500/20" },
    ARCHIVED: { label: "Arquivado", className: "bg-muted text-muted-foreground border-border" },
  }
  const config = map[status]
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", config.className)}>
      {status === "LEARNING_LIMITED" && <AlertTriangle className="mr-1 h-2.5 w-2.5" />}
      {config.label}
    </span>
  )
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const h = 24
  const w = 56
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    })
    .join(" ")

  const last = data[data.length - 1]
  const first = data[0]
  const isUp = last >= first

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "oklch(0.65 0.18 145)" : "oklch(0.62 0.22 25)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FrequencyBar({ value }: { value: number }) {
  const pct = Math.min((value / 6) * 100, 100)
  const color =
    value >= 4 ? "bg-red-400" : value >= 3 ? "bg-amber-400" : "bg-emerald-400"
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{value.toFixed(2)}</span>
    </div>
  )
}

function IS({ lost, type }: { lost?: number; type: "budget" | "rank" }) {
  if (lost === undefined) return <span className="text-muted-foreground">—</span>
  const isHigh = lost > 20
  return (
    <div className="flex items-center gap-1">
      <span
        className={cn(
          "text-xs font-medium",
          isHigh
            ? type === "budget"
              ? "text-amber-400"
              : "text-red-400"
            : "text-muted-foreground"
        )}
      >
        {lost.toFixed(1)}%
      </span>
      {isHigh && <AlertTriangle className="h-3 w-3 text-amber-400" />}
    </div>
  )
}

function TrendIcon({ dir }: { dir: Campaign["trend"] }) {
  if (dir === "up") return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
  if (dir === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-400" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

function formatBRL(v: number) {
  return v >= 1000
    ? `R$ ${(v / 1000).toFixed(1)}k`
    : `R$ ${v.toFixed(0)}`
}

interface CampaignTableProps {
  campaigns: Campaign[]
  platform?: "meta" | "google" | "all"
  onDiagnose?: (campaign: Campaign) => void
}

export function CampaignTable({ campaigns, platform = "all", onDiagnose }: CampaignTableProps) {
  const filtered =
    platform === "all" ? campaigns : campaigns.filter((c) => c.platform === platform)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-xs">
        <thead>
          <tr className="border-b border-border">
            {[
              "Campanha",
              "Status",
              "Gasto",
              "Receita",
              "ROAS",
              "CPA",
              "CTR",
              "Conv.",
              platform === "meta" ? "Freq." : "IS Budget",
              platform === "meta" ? "Trend" : "IS Rank",
              "", // coluna do botão IA
            ].map((col, i) => (
              <th
                key={i}
                className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground first:pl-1"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.map((c) => (
            <tr
              key={c.id}
              className="group transition-colors hover:bg-muted/30"
            >
              {/* Name */}
              <td className="py-3 pl-1 pr-4">
                <div className="flex items-center gap-2">
                  <PlatformDot platform={c.platform} />
                  <span className="max-w-[220px] truncate font-medium text-foreground" title={c.name}>
                    {c.name}
                  </span>
                </div>
              </td>

              {/* Status */}
              <td className="py-3 pr-4">
                <StatusBadge status={c.status} />
              </td>

              {/* Spend */}
              <td className="py-3 pr-4 text-foreground font-medium">
                {formatBRL(c.spend)}
              </td>

              {/* Revenue */}
              <td className="py-3 pr-4 text-foreground">
                {formatBRL(c.revenue)}
              </td>

              {/* ROAS */}
              <td className="py-3 pr-4">
                <span
                  className={cn(
                    "font-semibold",
                    c.roas >= 4
                      ? "text-emerald-400"
                      : c.roas >= 2
                      ? "text-amber-400"
                      : "text-red-400"
                  )}
                >
                  {c.roas.toFixed(2)}x
                </span>
              </td>

              {/* CPA */}
              <td className="py-3 pr-4 text-foreground">
                R$ {c.cpa.toFixed(0)}
              </td>

              {/* CTR */}
              <td className="py-3 pr-4 text-muted-foreground">
                {c.ctr.toFixed(2)}%
              </td>

              {/* Conversions */}
              <td className="py-3 pr-4 text-foreground">{c.conversions}</td>

              {/* Freq / IS Budget */}
              <td className="py-3 pr-4">
                {c.platform === "meta" ? (
                  c.frequency !== undefined ? (
                    <FrequencyBar value={c.frequency} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                ) : (
                  <IS lost={c.impressionShareLostBudget} type="budget" />
                )}
              </td>

              {/* Trend / IS Rank */}
              <td className="py-3 pr-4">
                {c.platform === "meta" ? (
                  <div className="flex items-center gap-1.5">
                    <TrendIcon dir={c.trend} />
                    <Sparkline data={c.sparklineData} />
                  </div>
                ) : (
                  <IS lost={c.impressionShareLostRank} type="rank" />
                )}
              </td>

              {/* Botão diagnóstico IA */}
              <td className="py-3">
                {onDiagnose && (
                  <button
                    onClick={() => onDiagnose(c)}
                    title="Diagnosticar com IA"
                    className="flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-medium text-primary opacity-0 transition-all hover:bg-primary/10 group-hover:opacity-100"
                  >
                    <Zap className="h-3 w-3" />
                    IA
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
