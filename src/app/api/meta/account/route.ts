import { NextRequest, NextResponse } from "next/server"
import {
  getActionValue,
  parseROAS,
  calcDelta,
  normalizeAccountId,
  getDateRanges,
  getDaysRemainingInMonth,
} from "@/lib/meta/parse"
import type { AccountOverview } from "@/lib/types"

const INSIGHT_FIELDS = [
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
].join(",")

async function fetchInsights(
  accountId: string,
  token: string,
  timeRange: { since: string; until: string }
) {
  const params = new URLSearchParams({
    fields: INSIGHT_FIELDS,
    time_range: JSON.stringify(timeRange),
    access_token: token,
  })
  const res = await fetch(
    `https://graph.facebook.com/v22.0/${accountId}/insights?${params}`
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || "Erro ao buscar insights")
  }
  const json = await res.json()
  return json.data?.[0] ?? null
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
  const { current, previous } = getDateRanges()

  try {
    // Busca em paralelo: info da conta + insights atuais + insights anteriores
    const [accountRes, currentData, previousData] = await Promise.all([
      fetch(
        `https://graph.facebook.com/v22.0/${normalizedId}?` +
          new URLSearchParams({
            fields: "name,currency,account_id",
            access_token: token,
          })
      ),
      fetchInsights(normalizedId, token, current),
      fetchInsights(normalizedId, token, previous),
    ])

    if (!accountRes.ok) {
      const err = await accountRes.json()
      return NextResponse.json(
        { error: err.error?.message || "Token inválido ou conta não encontrada" },
        { status: accountRes.status }
      )
    }

    const account = await accountRes.json()

    // Período atual
    const curSpend = parseFloat(currentData?.spend ?? "0")
    const curConversions = getActionValue(currentData?.actions)
    const curRevenue = getActionValue(currentData?.action_values)
    const curRoas =
      parseROAS(currentData?.purchase_roas) ||
      (curSpend > 0 && curRevenue > 0 ? curRevenue / curSpend : 0)
    const curCPA =
      getActionValue(currentData?.cost_per_action_type) ||
      (curConversions > 0 ? curSpend / curConversions : 0)

    // Período anterior (para deltas)
    const prevSpend = parseFloat(previousData?.spend ?? "0")
    const prevConversions = getActionValue(previousData?.actions)
    const prevRevenue = getActionValue(previousData?.action_values)
    const prevRoas =
      parseROAS(previousData?.purchase_roas) ||
      (prevSpend > 0 && prevRevenue > 0 ? prevRevenue / prevSpend : 0)
    const prevCPA =
      getActionValue(previousData?.cost_per_action_type) ||
      (prevConversions > 0 ? prevSpend / prevConversions : 0)

    // Estimativa de pace mensal: média diária dos últimos 30d × dias no mês
    const today = new Date()
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate()
    const dailyAvg = curSpend / 30
    const monthSpendProjected = dailyAvg * daysInMonth

    const overview: AccountOverview = {
      accountId: account.account_id || accountId,
      accountName: account.name || accountId,
      platform: "meta",
      currency: account.currency || "BRL",
      spend: curSpend,
      revenue: curRevenue,
      roas: curRoas,
      cpa: curCPA,
      conversions: curConversions,
      impressions: parseInt(currentData?.impressions ?? "0"),
      clicks: parseInt(currentData?.clicks ?? "0"),
      ctr: parseFloat(currentData?.ctr ?? "0"),
      spendDelta: calcDelta(curSpend, prevSpend),
      roasDelta: calcDelta(curRoas, prevRoas),
      cpaDelta: calcDelta(curCPA, prevCPA),
      conversionsDelta: calcDelta(curConversions, prevConversions),
      monthBudget: 0, // Preenchido pelo hook após buscar campanhas
      monthSpendProjected,
      daysRemaining: getDaysRemainingInMonth(),
    }

    return NextResponse.json(overview)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
