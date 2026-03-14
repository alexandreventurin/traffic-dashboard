"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Zap,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Campaign } from "@/lib/types"
import type { DiagnosisResult } from "@/app/api/ai/diagnose/route"

interface AccountContext {
  avgROAS: number
  avgCPA: number
  totalSpend: number
}

interface DiagnoseModalProps {
  campaign: Campaign
  accountContext: AccountContext
  open: boolean
  onClose: () => void
}

const URGENCIA: Record<
  DiagnosisResult["urgencia"],
  { label: string; className: string; icon: React.ElementType }
> = {
  baixa: {
    label: "Baixa",
    className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    icon: CheckCircle2,
  },
  media: {
    label: "Média",
    className: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    icon: AlertCircle,
  },
  alta: {
    label: "Alta",
    className: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    icon: TriangleAlert,
  },
  critica: {
    label: "Crítica",
    className: "text-red-400 bg-red-400/10 border-red-400/30",
    icon: TriangleAlert,
  },
}

export function DiagnoseModal({
  campaign,
  accountContext,
  open,
  onClose,
}: DiagnoseModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function fetchDiagnosis() {
    setIsLoading(true)
    setError(null)
    setDiagnosis(null)

    try {
      const res = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign, accountContext }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao diagnosticar")
      setDiagnosis(data as DiagnosisResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  // Inicia diagnóstico automaticamente ao abrir
  useEffect(() => {
    if (open && !diagnosis && !isLoading) {
      fetchDiagnosis()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const urgConfig = diagnosis ? URGENCIA[diagnosis.urgencia] : null
  const UrgIcon = urgConfig?.icon

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
              <Zap className="h-3 w-3 text-primary" />
            </div>
            Diagnóstico IA
          </DialogTitle>
          <p className="truncate text-xs text-muted-foreground" title={campaign.name}>
            {campaign.name}
          </p>
        </DialogHeader>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando campanha...</p>
            <p className="text-xs text-muted-foreground opacity-60">
              Consultando IA com os dados dos últimos 30 dias
            </p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
            <Button onClick={fetchDiagnosis} variant="outline" size="sm" className="w-full">
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Resultado */}
        {diagnosis && !isLoading && (
          <div className="flex flex-col gap-4">
            {/* Badge de urgência */}
            {urgConfig && UrgIcon && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Urgência:</span>
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    urgConfig.className
                  )}
                >
                  <UrgIcon className="h-3 w-3" />
                  {urgConfig.label}
                </span>
              </div>
            )}

            {/* Situação atual */}
            <div className="rounded-lg bg-muted/50 px-3.5 py-3">
              <p className="text-xs leading-relaxed text-foreground">
                {diagnosis.situacao}
              </p>
            </div>

            {/* Problemas */}
            {diagnosis.problemas?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground">
                  Problemas identificados
                </p>
                <ul className="flex flex-col gap-1.5">
                  {diagnosis.problemas.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Causa raiz */}
            {diagnosis.causas && (
              <div>
                <p className="mb-1 text-xs font-semibold text-foreground">
                  Causa raiz
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {diagnosis.causas}
                </p>
              </div>
            )}

            {/* Recomendações */}
            {diagnosis.recomendacoes?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground">
                  Recomendações
                </p>
                <ul className="flex flex-col gap-2">
                  {diagnosis.recomendacoes.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-2.5 text-xs text-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reanalisar */}
            <Button
              onClick={fetchDiagnosis}
              variant="outline"
              size="sm"
              className="mt-1 w-full text-xs"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Reanalisar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
