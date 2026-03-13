import { NextRequest, NextResponse } from "next/server"
import {
  getActionValue,
  parseROAS,
  normalizeAccountId,
} from "@/lib/meta/parse"
import type { Campaign, CampaignStatus } from "@/lib/types"

function mapStatus(metaStatus: string): CampaignStatus {
  switch (metaStatus) {
    case "ACTIVE":
      return "ACTIVE"
    case "PAUSED":
    case "CAMPAIGN_PAUSED":
    case "WITH_ISSUES":
      return "PAUSED"
    case "ARCHIVED":
    case "DELETED":
      return "ARCHIVED"
    default:
      return "ACTIVE"
  }
}

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("account_id")
  const token = request.nextUrl.searchParams.get("token")

  if (!accountId || !token) {
    return NextResponse.json(
      { error: "account_id e token são obrigatórios" },
      { status: 400 }
    )
  }

  const normalizedId = normalizeAccountId(accountId)

  try {
    // Busca em paralelo: lista de campanhas + insights por campanha (últimos 30d)
    const [campaignsRes, insightsRes] = await Promise.all([
      fetch(
        `https://graph.facebook.com/v22.0/${normalizedId}/campaigns?` +
          new URLSearchParams({
            fields: "id,name,effective_status,objective,daily_budget,lifetime_budget",
            limit: "200",
            effective_status: JSON.stringify(["ACTIVE", "PAUSED"]),
            access_token: token,
          })
      ),
      fetch(
        `https://graph.facebook.com/v22.0/${normalizedId}/insights?` +
          new URLSearchParams({
            fields: [
              "campaign_id",
              "campaign_name",
              "spend",
              "impressions",
              "reach",
              "frequency",
              "clicks",
              "ctr",
              "cpc",
              "actions",
              "action_values",
              "purchase_roas",
              "cost_per_action_type",
            ].join(","),
            level: "campaign",
            date_preset: "last_30d",
            limit: "200",
            access_token: token,
          })
      ),
    ])

    if (!campaignsRes.ok) {
      const err = await campaignsRes.json()
      return NextResponse.json(
        { error: err.error?.message || "Erro ao buscar campanhas" },
        { status: campaignsRes.status }
      )
    }
    if (!insightsRes.ok) {
      const err = await insightsRes.json()
      return NextResponse.json(
        { error: err.error?.message || "Erro ao buscar insights" },
        { status: insightsRes.status }
      )
    }

    const campaignsJson = await campaignsRes.json()
    const insightsJson = await insightsRes.json()

    // Mapa de insights por campaign_id
    const insightsMap = new Map<string, Record<string, unknown>>()
    for (const row of insightsJson.data ?? []) {
      insightsMap.set(row.campaign_id as string, row)
    }

    const campaigns: Campaign[] = (campaignsJson.data ?? []).map(
      (c: Record<string, unknown>) => {
        const ins = insightsMap.get(c.id as string) ?? {}

        const spend = parseFloat((ins.spend as string) ?? "0")
        const conversions = getActionValue(ins.actions as never)
        const revenue = getActionValue(ins.action_values as never)
        const roas =
          parseROAS(ins.purchase_roas as never) ||
          (spend > 0 && revenue > 0 ? revenue / spend : 0)
        const cpa =
          getActionValue(ins.cost_per_action_type as never) ||
          (conversions > 0 ? spend / conversions : 0)

        // Orçamento diário: Meta retorna em centavos
        const dailyBudgetCents = parseInt((c.daily_budget as string) ?? "0")
        const lifetimeBudgetCents = parseInt((c.lifetime_budget as string) ?? "0")
        const budgetDaily = dailyBudgetCents
          ? dailyBudgetCents / 100
          : lifetimeBudgetCents
          ? lifetimeBudgetCents / 100
          : 0

        return {
          id: c.id as string,
          name: c.name as string,
          platform: "meta" as const,
          status: mapStatus(c.effective_status as string),
          objective: (c.objective as string) || "OUTCOME_SALES",
          budgetDaily,
          spend,
          impressions: parseInt((ins.impressions as string) ?? "0"),
          reach: parseInt((ins.reach as string) ?? "0"),
          frequency: parseFloat((ins.frequency as string) ?? "0"),
          clicks: parseInt((ins.clicks as string) ?? "0"),
          ctr: parseFloat((ins.ctr as string) ?? "0"),
          cpc: parseFloat((ins.cpc as string) ?? "0"),
          conversions,
          revenue,
          roas,
          cpa,
          trend: "neutral" as const,
          sparklineData: Array(7).fill(roas),
        } satisfies Campaign
      }
    )

    // Ordenar por gasto (maior primeiro)
    campaigns.sort((a, b) => b.spend - a.spend)

    return NextResponse.json(campaigns)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
