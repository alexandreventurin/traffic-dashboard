"use client"

import { useState } from "react"
import { ImageIcon, Video, LayoutGrid, TrendingUp } from "lucide-react"
import type { CreativeData } from "@/app/api/meta/creatives/route"

function formatBRL(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
  return `R$ ${v.toFixed(0)}`
}

function formatNum(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return String(v)
}

const TYPE_CONFIG = {
  video: { label: "Vídeo", icon: Video, color: "text-purple-400 bg-purple-400/10" },
  image: { label: "Imagem", icon: ImageIcon, color: "text-blue-400 bg-blue-400/10" },
  carousel: { label: "Carrossel", icon: LayoutGrid, color: "text-amber-400 bg-amber-400/10" },
  unknown: { label: "Ad", icon: ImageIcon, color: "text-muted-foreground bg-muted" },
} as const

// Barra de retenção de vídeo: mostra drop-off em 4 pontos
function RetentionBar({
  p25,
  p50,
  p75,
  p100,
}: {
  p25: number
  p50: number
  p75: number
  p100: number
}) {
  const points = [
    { label: "25%", value: p25, color: "bg-emerald-400" },
    { label: "50%", value: p50, color: "bg-blue-400" },
    { label: "75%", value: p75, color: "bg-amber-400" },
    { label: "100%", value: p100, color: "bg-red-400" },
  ]

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Retenção de Vídeo
      </p>
      <div className="flex flex-col gap-1.5">
        {points.map((pt) => (
          <div key={pt.label} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-[10px] text-muted-foreground">
              {pt.label}
            </span>
            <div className="relative flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`absolute left-0 top-0 h-full rounded-full ${pt.color} transition-all`}
                style={{ width: `${Math.min(pt.value, 100)}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-[10px] font-medium text-foreground">
              {pt.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface CreativeCardProps {
  creative: CreativeData
  rank: number
}

export function CreativeCard({ creative, rank }: CreativeCardProps) {
  const [imgError, setImgError] = useState(false)
  const typeConfig = TYPE_CONFIG[creative.type]
  const TypeIcon = typeConfig.icon

  const roasColor =
    creative.roas >= 4
      ? "text-emerald-400"
      : creative.roas >= 2
      ? "text-amber-400"
      : creative.roas > 0
      ? "text-red-400"
      : "text-muted-foreground"

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg hover:shadow-black/10">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {creative.thumbnailUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creative.thumbnailUrl}
            alt={creative.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <TypeIcon className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Badges sobrepostos na thumbnail */}
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          {/* Rank */}
          {rank <= 3 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white backdrop-blur-sm">
              {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
            </span>
          )}
          {/* Tipo */}
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${typeConfig.color}`}
          >
            <TypeIcon className="h-2.5 w-2.5" />
            {typeConfig.label}
          </span>
        </div>

        {/* Gasto (canto direito) */}
        <div className="absolute bottom-2 right-2">
          <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {formatBRL(creative.spend)}
          </span>
        </div>
      </div>

      {/* Corpo do card */}
      <div className="flex flex-1 flex-col p-4">
        {/* Nome */}
        <p className="mb-3 line-clamp-2 text-xs font-semibold text-foreground leading-relaxed">
          {creative.name}
        </p>

        {/* Métricas principais: 2x2 grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <div>
            <p className="text-[10px] text-muted-foreground">ROAS</p>
            <p className={`text-sm font-bold ${roasColor}`}>
              {creative.roas > 0 ? `${creative.roas.toFixed(2)}x` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">CPA</p>
            <p className="text-sm font-bold text-foreground">
              {creative.cpa > 0 ? formatBRL(creative.cpa) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">CTR</p>
            <p className="text-sm font-bold text-foreground">
              {creative.ctr > 0 ? `${creative.ctr.toFixed(2)}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Conversões</p>
            <p className="text-sm font-bold text-foreground">
              {creative.conversions > 0 ? formatNum(creative.conversions) : "—"}
            </p>
          </div>
        </div>

        {/* Linha divisória */}
        <div className="my-3 border-t border-border" />

        {/* Métricas secundárias */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{formatNum(creative.impressions)} impressões</span>
          <span>{formatNum(creative.clicks)} cliques</span>
          {creative.reach > 0 && <span>{formatNum(creative.reach)} alcance</span>}
        </div>

        {/* Vídeo: exibe retenção */}
        {creative.isVideo && creative.retentionP25 > 0 && (
          <RetentionBar
            p25={creative.retentionP25}
            p50={creative.retentionP50}
            p75={creative.retentionP75}
            p100={creative.retentionP100}
          />
        )}

        {/* Vídeo: Thruplay */}
        {creative.isVideo && creative.videoThruplay > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground">
                {formatNum(creative.videoThruplay)}
              </span>{" "}
              Thruplay ·{" "}
              <span className="font-medium text-foreground">
                {creative.video3SecViews > 0
                  ? `${Math.round((creative.videoThruplay / creative.video3SecViews) * 100)}%`
                  : "—"}
              </span>{" "}
              completaram
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
