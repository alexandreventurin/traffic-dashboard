"use client"

import { useEffect, useState } from "react"
import { useConfig } from "@/lib/context/ConfigContext"
import type { Campaign } from "@/lib/types"

interface MetaInsightsResponse {
  spend: number
  impressions: number
  reach?: number
  frequency?: number
  clicks: number
  ctr: number
  cpc: number
  actions?: Array<{ action_type: string; value: number }>
  action_values?: number
  purchase_roas?: number
  cost_per_action_type?: Array<{ action_type: string; value: number }>
  quality_ranking?: string
  engagement_rate_ranking?: string
  conversion_rate_ranking?: string
}

export function useAccountInsights(accountId: string) {
  const { metaToken } = useConfig()
  const [data, setData] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!metaToken || !accountId) {
      setData(null)
      return
    }

    const fetchInsights = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/meta/insights?ad_account_id=${accountId}&token=${encodeURIComponent(metaToken)}&date_preset=last_30d`
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erro ao buscar dados da Meta")
        }

        const rawData = await response.json()
        const insights = rawData.data?.[0] || rawData

        // Converter resposta da Meta para nosso formato de Campaign
        const campaign: Campaign = {
          id: accountId,
          name: "Dados da Conta",
          platform: "meta",
          status: "ACTIVE",
          objective: "OUTCOME_SALES",
          budgetDaily: 0,
          spend: parseFloat(insights.spend) || 0,
          impressions: parseInt(insights.impressions) || 0,
          reach: parseInt(insights.reach) || 0,
          frequency: parseFloat(insights.frequency) || 0,
          clicks: parseInt(insights.clicks) || 0,
          ctr: parseFloat(insights.ctr) || 0,
          cpc: parseFloat(insights.cpc) || 0,
          conversions: 0,
          revenue: 0,
          roas: parseFloat(insights.purchase_roas) || 0,
          cpa: 0,
          qualityRanking: 1,
          engagementRateRanking: 1,
          conversionRateRanking: 1,
          trend: "neutral",
          sparklineData: [1, 1.1, 1.2, 1.15, 1.3, 1.25, 1.2],
        }

        setData(campaign)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
        console.error("Erro ao buscar insights:", err)
      } finally {
        setLoading(false)
      }
    }

    // Debounce de 500ms pra não fazer muitas requisições
    const timer = setTimeout(fetchInsights, 500)
    return () => clearTimeout(timer)
  }, [metaToken, accountId])

  return { data, loading, error }
}
