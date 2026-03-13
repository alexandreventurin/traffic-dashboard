"use client"

import { useRouter } from "next/navigation"
import { useConfig } from "@/lib/context/ConfigContext"
import { useMetaDashboard } from "@/lib/hooks/useMetaDashboard"
import { Header } from "@/components/layout/Header"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { AlertsPanel } from "@/components/dashboard/AlertsPanel"
import { CampaignTable } from "@/components/dashboard/CampaignTable"
import { SpendRevenueChart } from "@/components/charts/SpendRevenueChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { AlertCircle, Settings, Loader2, RefreshCw } from "lucide-react"
import type { Alert, Campaign } from "@/lib/types"

function formatBRL(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
  return `R$ ${v.toFixed(2)}`
}

function formatBRLFull(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v)
}

// Gera alertas automáticos a partir dos dados reais das campanhas
function generateAlerts(campaigns: Campaign[]): Alert[] {
  const alerts: Alert[] = []
  let id = 1

  for (const c of campaigns) {
    // Frequência alta (Meta) — risco de fadiga de audiência
    if (c.platform === "meta" && c.frequency && c.frequency > 3.5) {
      alerts.push({
        id: `auto_${id++}`,
        campaignId: c.id,
        campaignName: c.name,
        platform: c.platform,
        severity: c.frequency > 5 ? "critical" : "warning",
        type: "high_frequency",
        message: `Frequência em ${c.frequency.toFixed(1)} — risco de fadiga de audiência.`,
        metric: "frequency",
        value: c.frequency,
        threshold: 3.5,
        createdAt: new Date().toISOString(),
      })
    }

    // ROAS baixo — campanhas com gasto relevante
    if (c.spend > 500 && c.roas > 0 && c.roas < 2.0) {
      alerts.push({
        id: `auto_${id++}`,
        campaignId: c.id,
        campaignName: c.name,
        platform: c.platform,
        severity: c.roas < 1.0 ? "critical" : "warning",
        type: "roas_drop",
        message: `ROAS de ${c.roas.toFixed(2)}x abaixo do mínimo aceitável (2.0x).`,
        metric: "roas",
        value: c.roas,
        threshold: 2.0,
        createdAt: new Date().toISOString(),
      })
    }

    // Learning Limited (Meta)
    if (c.platform === "meta" && c.status === "LEARNING_LIMITED") {
      alerts.push({
        id: `auto_${id++}`,
        campaignId: c.id,
        campaignName: c.name,
        platform: c.platform,
        severity: "critical",
        type: "learning_limited",
        message: `Campanha em Learning Limited. Meta recomenda ≥50 eventos/semana.`,
        metric: "status",
        value: 0,
        threshold: 50,
        createdAt: new Date().toISOString(),
      })
    }

    // Impression Share perdido por budget (Google)
    if (
      c.platform === "google" &&
      c.impressionShareLostBudget !== undefined &&
      c.impressionShareLostBudget > 20
    ) {
      alerts.push({
        id: `auto_${id++}`,
        campaignId: c.id,
        campaignName: c.name,
        platform: "google",
        severity: c.impressionShareLostBudget > 40 ? "critical" : "warning",
        type: "budget_lost_impression_share",
        message: `${c.impressionShareLostBudget.toFixed(1)}% de impressões perdidas por orçamento insuficiente.`,
        metric: "impressionShareLostBudget",
        value: c.impressionShareLostBudget,
        threshold: 20,
        createdAt: new Date().toISOString(),
      })
    }
  }

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity]
  })
}

export function DashboardClient() {
  const router = useRouter()
  const { isConfigured, metaAccounts, isHydrated } = useConfig()
  const { accounts, campaigns, dailyMetrics, isLoading, error, refetch } =
    useMetaDashboard()

  // Aguarda ConfigContext terminar de ler o localStorage
  if (!isHydrated) {
    return <div className="h-screen bg-background" />
  }

  // Se não configurado, mostrar aviso
  if (!isConfigured) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <Header
          title="Overview Geral"
          subtitle="Configure suas contas Meta antes de começar"
        />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Configuração Necessária
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Adicione seu token Meta e as contas de anúncios para ver os dados em
              tempo real.
            </p>
            <Button
              onClick={() => router.push("/dashboard/configuracoes")}
              className="w-full"
            >
              <Settings className="mr-2 h-4 w-4" />
              Ir para Configurações
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Loading inicial (nenhum dado ainda)
  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Overview Geral" subtitle="Buscando dados da Meta..." />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Consultando Meta Marketing API...
            </p>
            <p className="text-xs text-muted-foreground opacity-60">
              Isso pode levar alguns segundos
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Erro sem nenhum dado
  if (error && accounts.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Overview Geral" subtitle="Erro ao carregar dados" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Erro ao buscar dados
            </h2>
            <p className="mb-1 text-sm text-muted-foreground">{error}</p>
            <p className="mb-6 text-xs text-muted-foreground">
              Verifique se o token e o ID da conta estão corretos.
            </p>
            <div className="flex gap-2">
              <Button onClick={refetch} variant="outline" className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
              <Button
                onClick={() => router.push("/dashboard/configuracoes")}
                variant="outline"
                className="flex-1"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dados carregados — calcular agregados
  const totalSpend = accounts.reduce((s, a) => s + a.spend, 0)
  const totalRevenue = accounts.reduce((s, a) => s + a.revenue, 0)
  const totalConversions = accounts.reduce((s, a) => s + a.conversions, 0)
  const totalBudget = accounts.reduce((s, a) => s + a.monthBudget, 0)
  const totalProjected = accounts.reduce((s, a) => s + a.monthSpendProjected, 0)
  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const overallCPA = totalConversions > 0 ? totalSpend / totalConversions : 0
  const avgSpendDelta =
    accounts.length > 0
      ? accounts.reduce((s, a) => s + a.spendDelta, 0) / accounts.length
      : 0
  const avgROASDelta =
    accounts.length > 0
      ? accounts.reduce((s, a) => s + a.roasDelta, 0) / accounts.length
      : 0
  const avgCPADelta =
    accounts.length > 0
      ? accounts.reduce((s, a) => s + a.cpaDelta, 0) / accounts.length
      : 0
  const avgConvDelta =
    accounts.length > 0
      ? accounts.reduce((s, a) => s + a.conversionsDelta, 0) / accounts.length
      : 0

  const paceStatus: "ok" | "warning" | "danger" =
    totalBudget === 0
      ? "ok"
      : totalProjected > totalBudget * 1.1
      ? "danger"
      : totalProjected > totalBudget
      ? "warning"
      : "ok"

  const alerts = generateAlerts(campaigns)
  const criticalCount = alerts.filter((a) => a.severity === "critical").length

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header
        title="Overview Geral"
        subtitle={`${metaAccounts.length} conta${metaAccounts.length !== 1 ? "s" : ""} Meta · Últimos 30 dias${isLoading ? " · Atualizando..." : ""}`}
      />

      {/* Banner de erro com dados parciais ainda exibidos */}
      {error && accounts.length > 0 && (
        <div className="mx-6 mt-4 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="flex-1 text-xs text-destructive">{error}</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={refetch}
            className="h-7 gap-1.5 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">

          {/* KPI Row */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Resumo Consolidado
              </h2>
              <span className="text-[10px] text-muted-foreground">
                · {accounts.length} conta{accounts.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={refetch}
                className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
                />
                Atualizar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                label="Gasto Total"
                value={formatBRLFull(totalSpend)}
                delta={avgSpendDelta}
                deltaLabel="vs 30d ant."
                subValue={
                  totalBudget > 0
                    ? `Projeção: ${formatBRLFull(totalProjected)} de ${formatBRLFull(totalBudget)}`
                    : undefined
                }
                subValueStatus={paceStatus}
              />
              <MetricCard
                label="Receita Total"
                value={formatBRLFull(totalRevenue)}
                delta={avgConvDelta}
                deltaLabel="vs 30d ant."
              />
              <MetricCard
                label="ROAS Geral"
                value={overallROAS > 0 ? `${overallROAS.toFixed(2)}x` : "—"}
                delta={avgROASDelta}
                deltaLabel="vs 30d ant."
                highlight={overallROAS >= 4}
              />
              <MetricCard
                label="CPA Médio"
                value={overallCPA > 0 ? formatBRL(overallCPA) : "—"}
                delta={-avgCPADelta}
                deltaLabel="vs 30d ant."
              />
            </div>
          </section>

          {/* Accounts row */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Por Conta
              </h2>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {accounts.map((account) => (
                <div
                  key={account.accountId}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-2 w-2 rounded-full ${
                          account.platform === "meta"
                            ? "bg-blue-400"
                            : "bg-red-400"
                        }`}
                      />
                      <span className="text-xs font-semibold text-foreground">
                        {account.accountName}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        account.platform === "meta"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {account.platform === "meta" ? "Meta" : "Google"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Gasto</p>
                      <p className="text-sm font-bold text-foreground">
                        {formatBRL(account.spend)}
                      </p>
                      <p
                        className={`text-[10px] font-medium ${
                          account.spendDelta > 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {account.spendDelta > 0 ? "+" : ""}
                        {account.spendDelta.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">ROAS</p>
                      <p
                        className={`text-sm font-bold ${
                          account.roas >= 4
                            ? "text-emerald-400"
                            : account.roas >= 2
                            ? "text-amber-400"
                            : account.roas > 0
                            ? "text-red-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {account.roas > 0
                          ? `${account.roas.toFixed(2)}x`
                          : "—"}
                      </p>
                      <p
                        className={`text-[10px] font-medium ${
                          account.roasDelta > 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {account.roasDelta > 0 ? "+" : ""}
                        {account.roasDelta.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">CPA</p>
                      <p className="text-sm font-bold text-foreground">
                        {account.cpa > 0
                          ? `R$ ${account.cpa.toFixed(0)}`
                          : "—"}
                      </p>
                      <p
                        className={`text-[10px] font-medium ${
                          account.cpaDelta < 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {account.cpaDelta > 0 ? "+" : ""}
                        {account.cpaDelta.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Pace bar — só mostra se tiver budget configurado */}
                  {account.monthBudget > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                        <span>Pace do mês</span>
                        <span
                          className={
                            account.monthSpendProjected > account.monthBudget
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }
                        >
                          {formatBRL(account.monthSpendProjected)} /{" "}
                          {formatBRL(account.monthBudget)}
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            account.monthSpendProjected >
                            account.monthBudget * 1.05
                              ? "bg-red-400"
                              : account.monthSpendProjected > account.monthBudget
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`}
                          style={{
                            width: `${Math.min(
                              (account.monthSpendProjected /
                                account.monthBudget) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Chart */}
          <section>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Gasto × Receita × ROAS
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Últimos 30 dias · Todas as contas combinadas
                  </p>
                </div>
              </div>
              {dailyMetrics.length > 0 ? (
                <SpendRevenueChart data={dailyMetrics} />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  {isLoading ? "Carregando gráfico..." : "Sem dados no período"}
                </div>
              )}
            </div>
          </section>

          {/* Campaign table */}
          <section>
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Performance por Campanha
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {campaigns.length > 0
                        ? `${campaigns.length} campanha${campaigns.length !== 1 ? "s" : ""} ativas`
                        : isLoading
                        ? "Carregando..."
                        : "Nenhuma campanha ativa"}
                    </p>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="all" className="px-5 py-4">
                <TabsList className="mb-4 h-8 gap-0.5 rounded-lg bg-muted p-0.5">
                  <TabsTrigger value="all" className="h-7 px-3 text-xs">
                    Todas ({campaigns.length})
                  </TabsTrigger>
                  <TabsTrigger value="meta" className="h-7 px-3 text-xs">
                    Meta (
                    {campaigns.filter((c) => c.platform === "meta").length})
                  </TabsTrigger>
                  <TabsTrigger value="google" className="h-7 px-3 text-xs">
                    Google (
                    {campaigns.filter((c) => c.platform === "google").length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <CampaignTable campaigns={campaigns} platform="all" />
                </TabsContent>
                <TabsContent value="meta">
                  <CampaignTable campaigns={campaigns} platform="meta" />
                </TabsContent>
                <TabsContent value="google">
                  <CampaignTable campaigns={campaigns} platform="google" />
                </TabsContent>
              </Tabs>
            </div>
          </section>
        </div>

        {/* Alerts sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-border bg-card p-4 xl:flex">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Alertas Ativos
            </h2>
            {criticalCount > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {alerts.length > 0 ? (
            <AlertsPanel alerts={alerts} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-center text-xs text-muted-foreground">
                {isLoading
                  ? "Verificando alertas..."
                  : "Nenhum alerta ativo 🎉"}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
