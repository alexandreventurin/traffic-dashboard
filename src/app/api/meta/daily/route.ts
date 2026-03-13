import { NextRequest, NextResponse } from "next/server"
import { getActionValue, parseROAS, normalizeAccountId } from "@/lib/meta/parse"
import type { DailyMetric } from "@/lib/types"

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
    const res = await fetch(
      `https://graph.facebook.com/v22.0/${normalizedId}/insights?` +
        new URLSearchParams({
          fields: [
            "spend",
            "impressions",
            "clicks",
            "actions",
            "action_values",
            "purchase_roas",
          ].join(","),
          date_preset: "last_30d",
          time_increment: "1", // Breakdown diário
          access_token: token,
        })
    )

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json(
        { error: err.error?.message || "Erro ao buscar dados diários" },
        { status: res.status }
      )
    }

    const json = await res.json()

    const metrics: DailyMetric[] = (json.data ?? []).map(
      (d: Record<string, unknown>) => {
        const spend = parseFloat((d.spend as string) ?? "0")
        const revenue = getActionValue(d.action_values as never)
        const conversions = getActionValue(d.actions as never)
        const roas =
          parseROAS(d.purchase_roas as never) ||
          (spend > 0 && revenue > 0 ? revenue / spend : 0)

        return {
          date: d.date_start as string,
          spend,
          revenue,
          roas,
          conversions,
          impressions: parseInt((d.impressions as string) ?? "0"),
          clicks: parseInt((d.clicks as string) ?? "0"),
        } satisfies DailyMetric
      }
    )

    // Garantir ordem cronológica
    metrics.sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(metrics)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
