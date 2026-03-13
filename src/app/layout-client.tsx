"use client"

import { ConfigProvider } from "@/lib/context/ConfigContext"

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return <ConfigProvider>{children}</ConfigProvider>
}
