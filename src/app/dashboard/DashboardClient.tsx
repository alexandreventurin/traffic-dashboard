"use client"

import { useRouter } from "next/navigation"
import { useConfig } from "@/lib/context/ConfigContext"
import { useAccountInsights } from "@/lib/hooks/useAccountInsights"
import { Header } from "@/components/layout/Header"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { AlertsPanel } from "@/components/dashboard/AlertsPanel"
import { CampaignTable } from "@/components/dashboard/CampaignTable"
import { SpendRevenueChart } from "@/components/charts/SpendRevenueChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { AlertCircle, Settings } from "lucide-react"
import {
  mockAccounts,
  mockCampaigns,
  mockAlerts,
  mockDailyMetrics,
} from "@/lib/mock/data"

function formatBRL(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
  return `R$ ${v.toFixed(2)}`
}

function formatBRLFull(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}

export function DashboardClient() {
  const router = useRouter()
  const { isConfigured, metaAccounts, isHydrated } = useConfig()

  // Aguarda o ConfigContext terminar de ler o localStorage antes de renderizar
  // (evita flash de "Configuração Necessária" enquanto o localStorage ainda está carregando)
  if (!isHydrated) {
    return <div className="h-screen bg-background" />
  }

  // Se não estiver configurado, mostrar aviso
  if (!isConfigured) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <Header title="Overview Geral" subtitle="Configure suas contas Meta antes de começar" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Configuração Necessária
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Você precisa adicionar seu token Meta e as contas de anúncios antes de ver os dados em tempo real.
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

  // Usar dados mockados por enquanto (substituir quando pulear dados reais)
  const accounts = mockAccounts
  const campaigns = mockCampaigns
  const alerts = mockAlerts
  const dailyMetrics = mockDailyMetrics

  // Agregados
  const totalSpend = accounts.reduce((s, a) => s + a.spend, 0)
  const totalRevenue = accounts.reduce((s, a) => s + a.revenue, 0)
  const totalConversions = accounts.reduce((s, a) => s + a.conversions, 0)
  const totalBudget = accounts.reduce((s, a) => s + a.monthBudget, 0)
  const totalProjected = accounts.reduce((s, a) => s + a.monthSpendProjected, 0)
  const overallROAS = totalRevenue / totalSpend
  const overallCPA = totalSpend / totalConversions
  const avgSpendDelta =
    accounts.reduce((s, a) => s + a.spendDelta, 0) / accounts.length
  const avgROASDelta =
    accounts.reduce((s, a) => s + a.roasDelta, 0) / accounts.length
  const avgCPADelta = accounts.reduce((s, a) => s + a.cpaDelta, 0) / accounts.length
  const avgConvDelta =
    accounts.reduce((s, a) => s + a.conversionsDelta, 0) / accounts.length

  const paceStatus: "ok" | "warning" | "danger" =
    totalProjected > totalBudget * 1.1
      ? "danger"
      : totalProjected > totalBudget
      ? "warning"
      : "ok"

  const criticalCount = alerts.filter((a) => a.severity === "critical").length

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header
        title="Overview Geral"
        subtitle={`${metaAccounts.length} conta${metaAccounts.length !== 1 ? "s" : ""} configurada${metaAccounts.length !== 1 ? "s" : ""} · Últimos 30 dias`}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">

          {/* KPI Row */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Resumo Consolidado
              </h2>
              <span className="text-[10px] text-muted-foreground">· {accounts.length} contas</span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                label="Gasto Total"
                value={formatBRLFull(totalSpend)}
                delta={avgSpendDelta}
                deltaLabel="vs 30d"
                subValue={`Projeção: ${formatBRLFull(totalProjected)} de ${formatBRLFull(totalBudget)}`}
                subValueStatus={paceStatus}
              />
              <MetricCard
                label="Receita Total"
                value={formatBRLFull(totalRevenue)}
                delta={avgROASDelta > 0 ? avgConvDelta : avgROASDelta}
                deltaLabel="vs 30d"
              />
              <MetricCard
                label="ROAS Geral"
                value={`${overallROAS.toFixed(2)}x`}
                delta={avgROASDelta}
                deltaLabel="vs 30d"
                highlight={overallROAS >= 4}
              />
              <MetricCard
                label="CPA Médio"
                value={formatBRL(overallCPA)}
                delta={-avgCPADelta}
                deltaLabel="vs 30d"
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
                            : "text-red-400"
                        }`}
                      >
                        {account.roas.toFixed(2)}x
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
                        R$ {account.cpa.toFixed(0)}
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

                  {/* Pace bar */}
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
                          account.monthSpendProjected > account.monthBudget * 1.05
                            ? "bg-red-400"
                            : account.monthSpendProjected > account.monthBudget
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                        style={{
                          width: `${Math.min(
                            (account.monthSpendProjected / account.monthBudget) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
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
              <SpendRevenueChart data={dailyMetrics} />
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
                      {campaigns.length} campanhas ativas
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
                    Meta ({campaigns.filter((c) => c.platform === "meta").length})
                  </TabsTrigger>
                  <TabsTrigger value="google" className="h-7 px-3 text-xs">
                    Google ({campaigns.filter((c) => c.platform === "google").length})
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
          <AlertsPanel alerts={alerts} />
        </aside>
      </div>
    </div>
  )
}
