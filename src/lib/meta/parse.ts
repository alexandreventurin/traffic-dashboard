// ============================================================
// Utilitários para parsing de respostas da Meta Marketing API
// Todos os campos numéricos da Meta vêm como strings — parseFloat/parseInt sempre
// ============================================================

export type MetaActionItem = { action_type: string; value: string }
export type MetaActions = MetaActionItem[]

// Tipos de conversão de compra — do mais genérico ao mais específico
const PURCHASE_TYPES = [
  "omni_purchase",
  "purchase",
  "offsite_conversion.fb_pixel_purchase",
]

/**
 * Extrai o valor numérico de um campo de actions/action_values
 * Testa cada action_type em ordem de prioridade
 */
export function getActionValue(
  actions: MetaActions | undefined,
  types: string[] = PURCHASE_TYPES
): number {
  if (!actions || actions.length === 0) return 0
  for (const type of types) {
    const found = actions.find((a) => a.action_type === type)
    if (found) return parseFloat(found.value) || 0
  }
  return 0
}

/**
 * Extrai ROAS do campo purchase_roas
 * Prefere omni_purchase, cai em outros tipos se não encontrar
 */
export function parseROAS(purchaseRoas: MetaActions | undefined): number {
  if (!purchaseRoas || purchaseRoas.length === 0) return 0
  const omni = purchaseRoas.find((a) => a.action_type === "omni_purchase")
  if (omni) return parseFloat(omni.value) || 0
  return parseFloat(purchaseRoas[0]?.value) || 0
}

/**
 * Calcula variação percentual entre dois períodos
 * Retorna 0 se o período anterior for 0 (evita divisão por zero)
 */
export function calcDelta(current: number, previous: number): number {
  if (previous === 0) return 0
  return parseFloat((((current - previous) / previous) * 100).toFixed(1))
}

/**
 * Normaliza ID de conta Meta — garante prefixo act_
 */
export function normalizeAccountId(id: string): string {
  return id.startsWith("act_") ? id : `act_${id}`
}

/**
 * Retorna os intervalos de data para período atual (últimos 30d) e anterior (30d antes)
 */
export function getDateRanges(): {
  current: { since: string; until: string }
  previous: { since: string; until: string }
} {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split("T")[0]
  const sub = (days: number): Date => {
    const d = new Date(today)
    d.setDate(d.getDate() - days)
    return d
  }
  return {
    current: { since: fmt(sub(30)), until: fmt(sub(1)) },
    previous: { since: fmt(sub(60)), until: fmt(sub(31)) },
  }
}

/**
 * Retorna dias restantes no mês atual
 */
export function getDaysRemainingInMonth(): number {
  const today = new Date()
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  return lastDay - today.getDate()
}
