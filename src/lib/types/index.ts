// ============================================================
// TYPES — Espelham os campos reais das APIs Meta e Google Ads
// Quando o backend estiver pronto, esses tipos servem de contrato
// ============================================================

export type Platform = "meta" | "google"
export type TrendDirection = "up" | "down" | "neutral"
export type CampaignStatus = "ACTIVE" | "PAUSED" | "LEARNING" | "LEARNING_LIMITED" | "ARCHIVED"
export type AlertSeverity = "critical" | "warning" | "info"

// ------ CONTA ------
export interface AdAccount {
  id: string
  name: string
  platform: Platform
  currency: string
  timezone: string
}

// ------ OVERVIEW ------
export interface AccountOverview {
  accountId: string
  accountName: string
  platform: Platform
  currency: string
  spend: number
  revenue: number
  roas: number
  cpa: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  // Variação vs período anterior
  spendDelta: number       // % variação
  roasDelta: number
  cpaDelta: number
  conversionsDelta: number
  // Pace do mês
  monthBudget: number
  monthSpendProjected: number
  daysRemaining: number
}

// ------ CAMPANHA ------
export interface Campaign {
  id: string
  name: string
  platform: Platform
  status: CampaignStatus
  objective: string
  budgetDaily: number
  // Métricas — Meta: insights, Google: metrics.*
  spend: number
  impressions: number
  reach?: number          // Meta only
  frequency?: number      // Meta only: impressions/reach
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  revenue: number
  roas: number
  cpa: number
  // Google only
  impressionShare?: number
  impressionShareLostBudget?: number
  impressionShareLostRank?: number
  qualityScore?: number
  // Meta only — rankings 1-3 (1=above avg, 2=avg, 3=below avg)
  qualityRanking?: number
  engagementRateRanking?: number
  conversionRateRanking?: number
  // Trend (7 dias)
  trend: TrendDirection
  sparklineData: number[] // últimos 7 dias de ROAS
}

// ------ ALERTA ------
export interface Alert {
  id: string
  campaignId: string
  campaignName: string
  platform: Platform
  severity: AlertSeverity
  type: AlertType
  message: string
  metric?: string
  value?: number
  threshold?: number
  createdAt: string
}

export type AlertType =
  | "high_frequency"
  | "learning_limited"
  | "cpa_spike"
  | "roas_drop"
  | "budget_lost_impression_share"
  | "rank_lost_impression_share"
  | "low_quality_score"
  | "cpm_spike"

// ------ CREATIVE (Meta) ------
export interface Creative {
  id: string
  name: string
  type: "image" | "video" | "carousel"
  thumbnailUrl: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  roas: number
  cpa: number
  // Video only
  video3SecViews?: number
  videoThruplayViews?: number
  videoRetentionP25?: number
  videoRetentionP50?: number
  videoRetentionP75?: number
  videoRetentionP100?: number
  qualityRanking?: number
  engagementRateRanking?: number
}

// ------ BREAKDOWN ------
export interface BreakdownRow {
  dimension: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  roas: number
  cpa: number
  ctr: number
}

// ------ PERFORMANCE HISTÓRICA ------
export interface DailyMetric {
  date: string  // YYYY-MM-DD
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
}

// ------ CRIATIVO ------
export interface CreativeData {
  id: string
  name: string
  type: "image" | "video" | "carousel" | "unknown"
  thumbnailUrl: string
  title?: string
  body?: string
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
  isVideo: boolean
  video3SecViews: number
  videoThruplay: number
  videoP25: number
  videoP50: number
  videoP75: number
  videoP100: number
  retentionP25: number
  retentionP50: number
  retentionP75: number
  retentionP100: number
}
