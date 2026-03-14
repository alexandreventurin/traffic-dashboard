import { NextRequest, NextResponse } from "next/server"

export interface DiagnosisResult {
  situacao: string
  problemas: string[]
  causas: string
  recomendacoes: string[]
  urgencia: "baixa" | "media" | "alta" | "critica"
}

const SYSTEM_PROMPT = `Você é um especialista sênior em tráfego pago com 10+ anos de experiência em Meta Ads e Google Ads no mercado brasileiro.

Analise os dados de performance fornecidos e retorne um JSON com EXATAMENTE esta estrutura:

{
  "situacao": "Resumo objetivo de 1-2 frases do estado atual da campanha com base nos números",
  "problemas": ["problema específico 1 com número", "problema específico 2 com número"],
  "causas": "Explicação técnica das causas raiz identificadas, conectando os números",
  "recomendacoes": [
    "Ação concreta e específica 1 (ex: Ampliar público de retargeting de 30 para 60 dias)",
    "Ação concreta e específica 2",
    "Ação concreta e específica 3"
  ],
  "urgencia": "baixa" | "media" | "alta" | "critica"
}

Regras:
- Use sempre números reais dos dados fornecidos (não invente)
- Recomendações devem ser acionáveis imediatamente, não genéricas
- Urgência "critica" = campanha sangrando dinheiro ou em learning limited
- Urgência "alta" = ROAS abaixo de 2x ou frequência acima de 5
- Urgência "media" = métricas com tendência negativa, atenção necessária
- Urgência "baixa" = campanha saudável com oportunidades de otimização
- Responda APENAS com o JSON, sem texto adicional`

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada. Adicione nas variáveis de ambiente do Vercel." },
      { status: 500 }
    )
  }

  const body = await request.json()
  const { campaign, accountContext } = body

  // Monta o contexto da campanha em linguagem natural
  const lines = [
    `Campanha: ${campaign.name}`,
    `Plataforma: ${campaign.platform === "meta" ? "Meta Ads" : "Google Ads"}`,
    `Status: ${campaign.status}`,
    ``,
    `MÉTRICAS — Últimos 30 dias:`,
    `- Gasto: R$ ${campaign.spend.toFixed(2)}`,
    campaign.revenue > 0 ? `- Receita atribuída: R$ ${campaign.revenue.toFixed(2)}` : null,
    campaign.roas > 0
      ? `- ROAS: ${campaign.roas.toFixed(2)}x (média da conta: ${accountContext.avgROAS.toFixed(2)}x)`
      : `- ROAS: sem dados de conversão`,
    campaign.cpa > 0
      ? `- CPA: R$ ${campaign.cpa.toFixed(2)} (média da conta: R$ ${accountContext.avgCPA.toFixed(2)})`
      : `- CPA: sem dados de conversão`,
    `- Conversões: ${campaign.conversions}`,
    `- Impressões: ${campaign.impressions.toLocaleString("pt-BR")}`,
    `- Cliques: ${campaign.clicks.toLocaleString("pt-BR")}`,
    `- CTR: ${campaign.ctr.toFixed(2)}%`,
    `- CPC: R$ ${campaign.cpc.toFixed(2)}`,
    campaign.frequency != null ? `- Frequência: ${campaign.frequency.toFixed(2)}` : null,
    campaign.reach != null ? `- Alcance: ${campaign.reach.toLocaleString("pt-BR")}` : null,
    campaign.impressionShare != null
      ? `- Impression Share: ${campaign.impressionShare.toFixed(1)}%`
      : null,
    campaign.impressionShareLostBudget != null
      ? `- IS perdido por budget: ${campaign.impressionShareLostBudget.toFixed(1)}%`
      : null,
    campaign.impressionShareLostRank != null
      ? `- IS perdido por rank: ${campaign.impressionShareLostRank.toFixed(1)}%`
      : null,
    ``,
    `CONTEXTO DA CONTA:`,
    `- Esta campanha representa ${((campaign.spend / accountContext.totalSpend) * 100).toFixed(1)}% do gasto total da conta`,
    `- Gasto total da conta (30d): R$ ${accountContext.totalSpend.toFixed(2)}`,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: lines },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 600,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error?.message || `OpenAI error ${res.status}`)
    }

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content ?? "{}"
    const diagnosis = JSON.parse(content) as DiagnosisResult

    return NextResponse.json(diagnosis)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao chamar OpenAI"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
