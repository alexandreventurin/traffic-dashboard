import { NextRequest, NextResponse } from "next/server"
import { getActionValue, parseROAS, normalizeAccountId } from "@/lib/meta/parse"

// Extrai valor de action de vídeo (retorna número ou 0)
function getVideoAction(
  actions: Array<{ action_type: string; value: string }> | undefined,
  type: string
): number {
  if (!actions) return 0
  const found = actions.find((a) => a.action_type === type)
  return found ? parseInt(found.value) || 0 : 0
}

export interface CreativeData {
  id: string
  name: string
  type: "image" | "video" | "carousel" | "unknown"
  thumbnailUrl: string
  title?: string
  body?: string
  // KPIs
  spend: number
  impressions: number
  reach: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  revenue: number
  roas: number
  cpa: number
  // Vídeo
  isVideo: boolean
  video3SecViews: number
  videoThruplay: number
  videoP25: number
  videoP50: number
  videoP75: number
  videoP100: number
  // Retenção relativa (% que assistiu cada ponto vs total que iniciou)
  retentionP25: number
  retentionP50: number
  retentionP75: number
  retentionP100: number
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
    // Busca ads com creative embutido + insights dos últimos 30d
    // A nested insights sintaxe do Meta API permite trazer tudo em 1 chamada
    const params = new URLSearchParams({
      fields: [
        "id",
        "name",
        "effective_status",
        // Creative com thumbnail e tipo
        "creative{id,name,thumbnail_url,image_url,object_type,title,body}",
        // Insights aninhados
        "insights.date_preset(last_30d){" +
          "spend,impressions,reach,clicks,ctr,cpc," +
          "actions,action_values,purchase_roas,cost_per_action_type," +
          // Métricas de vídeo
          "video_p25_watched_actions," +
          "video_p50_watched_actions," +
          "video_p75_watched_actions," +
          "video_p100_watched_actions," +
          "video_thruplay_watched_actions," +
          "video_play_actions" +
          "}",
      ].join(","),
      limit: "100",
      effective_status: JSON.stringify(["ACTIVE", "PAUSED"]),
      access_token: token,
    })

    const res = await fetch(
      `https://graph.facebook.com/v22.0/${normalizedId}/ads?${params}`
    )

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json(
        { error: err.error?.message || "Erro ao buscar criativos" },
        { status: res.status }
      )
    }

    const json = await res.json()

    const creatives: CreativeData[] = (json.data ?? [])
      .filter((ad: Record<string, unknown>) => {
        // Remove ads sem nenhum gasto (insights vazios)
        const ins = (ad.insights as { data?: unknown[] } | undefined)?.data?.[0] as Record<string, unknown> | undefined
        return ins && parseFloat((ins.spend as string) ?? "0") > 0
      })
      .map((ad: Record<string, unknown>) => {
        const ins = ((ad.insights as { data?: unknown[] } | undefined)?.data?.[0] ?? {}) as Record<string, unknown>
        const creative = (ad.creative ?? {}) as Record<string, unknown>

        const spend = parseFloat((ins.spend as string) ?? "0")
        const impressions = parseInt((ins.impressions as string) ?? "0")
        const reach = parseInt((ins.reach as string) ?? "0")
        const clicks = parseInt((ins.clicks as string) ?? "0")
        const conversions = getActionValue(ins.actions as never)
        const revenue = getActionValue(ins.action_values as never)
        const roas =
          parseROAS(ins.purchase_roas as never) ||
          (spend > 0 && revenue > 0 ? revenue / spend : 0)
        const cpa =
          getActionValue(ins.cost_per_action_type as never) ||
          (conversions > 0 ? spend / conversions : 0)

        // Métricas de vídeo
        const v3sec = getVideoAction(ins.video_play_actions as never, "video_view")
        const vThruplay = getVideoAction(ins.video_thruplay_watched_actions as never, "video_view")
        const vP25 = getVideoAction(ins.video_p25_watched_actions as never, "video_view")
        const vP50 = getVideoAction(ins.video_p50_watched_actions as never, "video_view")
        const vP75 = getVideoAction(ins.video_p75_watched_actions as never, "video_view")
        const vP100 = getVideoAction(ins.video_p100_watched_actions as never, "video_view")

        const isVideo = v3sec > 0 || vP25 > 0

        // Retenção relativa: usa vP25 como base (100%) para mostrar drop-off progressivo
        const base = vP25 > 0 ? vP25 : 1
        const retentionP25 = vP25 > 0 ? 100 : 0
        const retentionP50 = vP25 > 0 ? Math.round((vP50 / base) * 100) : 0
        const retentionP75 = vP25 > 0 ? Math.round((vP75 / base) * 100) : 0
        const retentionP100 = vP25 > 0 ? Math.round((vP100 / base) * 100) : 0

        // Tipo de criativo
        const objectType = (creative.object_type as string | undefined)?.toLowerCase() ?? ""
        let type: CreativeData["type"] = "unknown"
        if (objectType.includes("video") || isVideo) type = "video"
        else if (objectType.includes("photo") || objectType.includes("image")) type = "image"
        else if (objectType.includes("carousel") || objectType.includes("share")) type = "carousel"
        else type = "image" // fallback

        // Thumbnail: prefere image_url, depois thumbnail_url
        const thumbnailUrl =
          (creative.image_url as string | undefined) ||
          (creative.thumbnail_url as string | undefined) ||
          ""

        return {
          id: ad.id as string,
          name: (creative.name as string | undefined) || (ad.name as string) || "Criativo",
          type,
          thumbnailUrl,
          title: creative.title as string | undefined,
          body: creative.body as string | undefined,
          spend,
          impressions,
          reach,
          clicks,
          ctr: parseFloat((ins.ctr as string) ?? "0"),
          cpc: parseFloat((ins.cpc as string) ?? "0"),
          conversions,
          revenue,
          roas,
          cpa,
          isVideo,
          video3SecViews: v3sec,
          videoThruplay: vThruplay,
          videoP25: vP25,
          videoP50: vP50,
          videoP75: vP75,
          videoP100: vP100,
          retentionP25,
          retentionP50,
          retentionP75,
          retentionP100,
        } satisfies CreativeData
      })

    // Ordenar por gasto decrescente
    creatives.sort((a, b) => b.spend - a.spend)

    return NextResponse.json(creatives)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
