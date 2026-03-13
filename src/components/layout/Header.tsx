"use client"

import { Bell, RefreshCw, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Date range */}
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Últimos 30 dias</span>
        </div>

        {/* Refresh */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Atualizar dados"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>

        {/* Alerts bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Alertas"
        >
          <Bell className="h-3.5 w-3.5" />
          <Badge className="absolute -right-0.5 -top-0.5 h-3.5 min-w-3.5 rounded-full px-0.5 text-[9px] bg-destructive text-destructive-foreground flex items-center justify-center">
            3
          </Badge>
        </Button>

        {/* Account avatar */}
        <div className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          G
        </div>
      </div>
    </header>
  )
}
