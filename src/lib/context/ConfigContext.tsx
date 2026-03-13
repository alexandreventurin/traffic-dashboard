"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export interface MetaAccount {
  id: string
  name: string
}

export interface ConfigContextType {
  metaToken: string
  googleToken: string
  metaAccounts: MetaAccount[]
  setMetaToken: (token: string) => void
  setGoogleToken: (token: string) => void
  setMetaAccounts: (accounts: MetaAccount[]) => void
  isConfigured: boolean
  isHydrated: boolean
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [metaToken, setMetaToken] = useState("")
  const [googleToken, setGoogleToken] = useState("")
  const [metaAccounts, setMetaAccounts] = useState<MetaAccount[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Carregar do localStorage na montagem
  useEffect(() => {
    const saved = localStorage.getItem("traffic-dashboard-config")
    if (saved) {
      try {
        const config = JSON.parse(saved)
        setMetaToken(config.metaToken || "")
        setGoogleToken(config.googleToken || "")
        setMetaAccounts(config.metaAccounts || [])
      } catch (e) {
        console.error("Erro ao carregar config:", e)
      }
    }
    setIsHydrated(true)
  }, [])

  // Salvar no localStorage quando muda
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(
        "traffic-dashboard-config",
        JSON.stringify({
          metaToken,
          googleToken,
          metaAccounts,
        })
      )
    }
  }, [metaToken, googleToken, metaAccounts, isHydrated])

  const isConfigured = !!metaToken && metaAccounts.length > 0

  return (
    <ConfigContext.Provider
      value={{
        metaToken,
        googleToken,
        metaAccounts,
        setMetaToken,
        setGoogleToken,
        setMetaAccounts,
        isConfigured,
        isHydrated,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error("useConfig deve ser usado dentro de ConfigProvider")
  }
  return context
}
