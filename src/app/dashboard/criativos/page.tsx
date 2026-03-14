"use client"

import { useEffect, useState, useMemo } from "react"
import { useConfig } from "@/lib/context/ConfigContext"
import { Header } from "@/components/layout/Header"
import { CreativeCard } from "@/components/dashboard/CreativeCard"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ImageIcon,
  Video,
  LayoutGrid,
  ArrowDownUp,
} from "lucide-react"
import type { CreativeData } from "@/lib/types"

type SortKey = "spend" | "roas" | "ctr" | "conversions" | "cpa"
type TypeFilter = "all" | "video" | "image" | "carousel"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "spend", label: "Gasto" },
  { key: "roas", label: "ROAS" },
  { key: "conversions", label: "Conversões" },
  { key: "ctr", label: "CTR" },
  { key: "cpa", label: "CPA" },
]

const TYPE_FILTERS: { key: TypeFilter; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "Todos", icon: LayoutGrid },
  { key: "video", label: "Vídeos", icon: Video },
  { key: "image", label: "Imagens", icon: ImageIcon },
  { key: "carousel", label: "Carrossel", icon: LayoutGrid },
]

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  )
}

export default function CriativosPage() {
  const { isConfigured, metaToken, metaAccounts, isHydrated } = useConfig()
  const [creatives, setCreatives] = useState<CreativeData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortKey>("spend")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")

  async function fetchCreatives() {
    if (!metaToken || metaAccounts.length === 0) return
    setIsLoading(true)
    setError(null)

    try {
      // Busca criativos de todas as contas em paralelo
      const results = await Promise.all(
        metaAccounts.map(async (account) => {
          const params = new URLSearchParams({
            account_id: account.id,
            token: metaToken,
          })
          const res = await fetch(`/api/meta/creatives?${params}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || "Erro ao buscar criativos")
          return data as CreativeData[]
        })
      )

      const all = results.flat().sort((a, b) => b.spend - a.spend)
      setCreatives(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isHydrated && isConfigured) {
      fetchCreatives()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, isConfigured])

  // Filtragem e ordenação
  const filtered = useMemo(() => {
    let list = creatives
    if (typeFilter !== "all") {
      list = list.filter((c) => c.type === typeFilter)
    }
    return [...list].sort((a, b) => {
      if (sortBy === "cpa") {
        // CPA: menor é melhor — colocar zeros no final
        if (a.cpa === 0 && b.cpa === 0) return 0
        if (a.cpa === 0) return 1
        if (b.cpa === 0) return -1
        return a.cpa - b.cpa
      }
      return b[sortBy] - a[sortBy]
    })
  }, [creatives, sortBy, typeFilter])

  // Stats resumidas
  const totalSpend = creatives.reduce((s, c) => s + c.spend, 0)
  const totalConversions = creatives.reduce((s, c) => s + c.conversions, 0)
  const avgROAS =
    totalSpend > 0
      ? creatives.reduce((s, c) => s + c.revenue, 0) / totalSpend
      : 0
  const videoCount = creatives.filter((c) => c.isVideo).length

  function formatBRL(v: number) {
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
    return `R$ ${v.toFixed(0)}`
  }

  // Guard: aguarda hidratação
  if (!isHydrated) return null

  // Não configurado
  if (!isConfigured) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Galeria de Criativos" subtitle="Dados reais da Meta" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-400" />
            <p className="text-sm text-muted-foreground">
              Configure suas credenciais Meta primeiro.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header
        title="Galeria de Criativos"
        subtitle={`Últimos 30 dias · ${metaAccounts.length} conta${metaAccounts.length !== 1 ? "s" : ""} Meta`}
      />

      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        {/* Loading inicial */}
        {isLoading && creatives.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Buscando criativos e métricas...
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && creatives.length === 0 && (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-sm rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
              <p className="mb-4 text-sm text-muted-foreground">{error}</p>
              <Button onClick={fetchCreatives} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        {/* Conteúdo */}
        {creatives.length > 0 && (
          <div className="flex flex-col gap-5">
            {/* Stats resumidas */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatPill
                label="Total de Criativos"
                value={`${creatives.length}`}
              />
              <StatPill
                label="Gasto Total"
                value={formatBRL(totalSpend)}
              />
              <StatPill
                label="ROAS Médio"
                value={avgROAS > 0 ? `${avgROAS.toFixed(2)}x` : "—"}
              />
              <StatPill
                label="Conversões"
                value={totalConversions > 0 ? String(totalConversions) : "—"}
              />
            </div>

            {/* Filtros e Sort */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Tipo */}
              <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
                {TYPE_FILTERS.map((f) => {
                  const count =
                    f.key === "all"
                      ? creatives.length
                      : creatives.filter((c) => c.type === f.key).length
                  if (count === 0 && f.key !== "all") return null
                  return (
                    <button
                      key={f.key}
                      onClick={() => setTypeFilter(f.key)}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        typeFilter === f.key
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <f.icon className="h-3 w-3" />
                      {f.label}
                      {count > 0 && (
                        <span className="rounded-full bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Sort */}
              <div className="ml-auto flex items-center gap-1.5">
                <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Ordenar:</span>
                <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        sortBy === opt.key
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão refresh */}
              <button
                onClick={fetchCreatives}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
                Atualizar
              </button>
            </div>

            {/* Aviso se filtro zerou */}
            {filtered.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">
                  Nenhum criativo nessa categoria.
                </p>
              </div>
            )}

            {/* Grid de criativos */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((creative, idx) => (
                <CreativeCard key={creative.id} creative={creative} rank={idx + 1} />
              ))}
            </div>

            {/* Rodapé info */}
            {videoCount > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                {videoCount} vídeo{videoCount !== 1 ? "s" : ""} com dados de retenção ·
                Retenção calculada relativa ao ponto de 25% (base = 100%)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
