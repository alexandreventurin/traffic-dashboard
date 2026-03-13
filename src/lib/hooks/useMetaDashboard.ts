"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useConfig } from "@/lib/context/ConfigContext"
import type { AccountOverview, Campaign, DailyMetric } from "@/lib/types"

export interface MetaDashboardData {
  accounts: AccountOverview[]
  campaigns: Campaign[]
  dailyMetrics: DailyMetric[]
}

export interface UseMetaDashboardResult extends MetaDashboardData {
  isLoading: boolean
  error: string | null
  refetch: () => void
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  }
  return data as T
}

export function useMetaDashboard(): UseMetaDashboardResult {
  const { metaToken, metaAccounts } = useConfig()
  const [data, setData] = useState<MetaDashboardData>({
    accounts: [],
    campaigns: [],
    dailyMetrics: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchVersion = useRef(0)

  const refetch = useCallback(() => {
    fetchVersion.current += 1
    // Força re-render para triggerar o useEffect
    setError(null)
    setData({ accounts: [], campaigns: [], dailyMetrics: [] })
  }, [])

  useEffect(() => {
    if (!metaToken || metaAccounts.length === 0) return

    const version = ++fetchVersion.current
    const controller = new AbortController()

    async function fetchAll() {
      setIsLoading(true)
      setError(null)

      try {
        // Para cada conta Meta configurada, busca as 3 fontes de dados em paralelo
        const results = await Promise.all(
          metaAccounts.map(async (account) => {
            const params = new URLSearchParams({
              account_id: account.id,
              token: metaToken,
            })

            const [overview, campaigns, daily] = await Promise.all([
              fetchJSON<AccountOverview>(`/api/meta/account?${params}`),
              fetchJSON<Campaign[]>(`/api/meta/campaigns?${params}`),
              fetchJSON<DailyMetric[]>(`/api/meta/daily?${params}`),
            ])

            // monthBudget = soma dos orçamentos diários de todas as campanhas ativas × 30
            const activeBudgetDaily = campaigns
              .filter((c) => c.status === "ACTIVE")
              .reduce((sum, c) => sum + c.budgetDaily, 0)

            const today = new Date()
            const daysInMonth = new Date(
              today.getFullYear(),
              today.getMonth() + 1,
              0
            ).getDate()

            return {
              overview: {
                ...overview,
                accountName: account.name !== account.id
                  ? account.name
                  : overview.accountName, // Usa nome do usuário se foi personalizado
                monthBudget: activeBudgetDaily * daysInMonth,
              },
              campaigns,
              daily,
            }
          })
        )

        // Verificar se o request ainda é válido (evita race condition)
        if (version !== fetchVersion.current || controller.signal.aborted) return

        const accounts = results.map((r) => r.overview)
        const campaigns = results.flatMap((r) => r.campaigns)

        // Agregar métricas diárias somando por data (para múltiplas contas)
        const dailyMap = new Map<string, DailyMetric>()
        for (const { daily } of results) {
          for (const d of daily) {
            const existing = dailyMap.get(d.date)
            if (existing) {
              existing.spend += d.spend
              existing.revenue += d.revenue
              existing.conversions += d.conversions
              existing.impressions += d.impressions
              existing.clicks += d.clicks
              existing.roas =
                existing.spend > 0 ? existing.revenue / existing.spend : 0
            } else {
              dailyMap.set(d.date, { ...d })
            }
          }
        }

        const dailyMetrics = Array.from(dailyMap.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        )

        setData({ accounts, campaigns, dailyMetrics })
      } catch (err) {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error ? err.message : "Erro desconhecido"
        setError(message)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchAll()

    return () => {
      controller.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaToken, metaAccounts])

  return { ...data, isLoading, error, refetch }
}
