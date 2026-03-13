"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Megaphone,
  Bell,
  Palette,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Campanhas",
    href: "/dashboard/campanhas",
    icon: Megaphone,
  },
  {
    label: "Alertas",
    href: "/dashboard/alertas",
    icon: Bell,
    badge: 3,
  },
  {
    label: "Criativos",
    href: "/dashboard/criativos",
    icon: Palette,
    comingSoon: true,
  },
  {
    label: "Análise IA",
    href: "/dashboard/ia",
    icon: Zap,
    comingSoon: true,
  },
  {
    label: "Relatórios",
    href: "/dashboard/relatorios",
    icon: BarChart3,
    comingSoon: true,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <BarChart3 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          TrafficDesk
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.comingSoon ? "#" : item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                item.comingSoon && "cursor-not-allowed opacity-50"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge className="h-4 min-w-4 rounded-full px-1 text-[10px] bg-destructive text-destructive-foreground">
                  {item.badge}
                </Badge>
              )}
              {item.comingSoon && (
                <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                  Em breve
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-2 py-3">
        <Link
          href="/dashboard/configuracoes"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
      </div>
    </aside>
  )
}
