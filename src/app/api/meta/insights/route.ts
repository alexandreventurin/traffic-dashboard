import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const adAccountId = request.nextUrl.searchParams.get("ad_account_id")
  const token = request.nextUrl.searchParams.get("token")
  const datePreset = request.nextUrl.searchParams.get("date_preset") || "last_30d"

  if (!adAccountId || !token) {
    return NextResponse.json(
      { error: "ad_account_id e token são obrigatórios" },
      { status: 400 }
    )
  }

  try {
    // Chamada à Meta Marketing API v22.0
    const url = `https://graph.facebook.com/v22.0/${adAccountId}/insights`
    const params = new URLSearchParams({
      fields: [
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
        "quality_ranking",
        "engagement_rate_ranking",
        "conversion_rate_ranking",
      ].join(","),
      date_preset: datePreset,
      access_token: token,
    })

    const response = await fetch(`${url}?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Meta API error:", error)
      return NextResponse.json(
        { error: error.error?.message || "Erro na API da Meta" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error calling Meta API:", error)
    return NextResponse.json(
      { error: "Erro interno ao chamar API da Meta" },
      { status: 500 }
    )
  }
}
