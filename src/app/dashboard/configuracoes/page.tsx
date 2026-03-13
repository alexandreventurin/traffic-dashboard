"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useConfig, type MetaAccount } from "@/lib/context/ConfigContext"
import { Trash2, Plus } from "lucide-react"

export default function ConfigPage() {
  const router = useRouter()
  const { metaToken, setMetaToken, metaAccounts, setMetaAccounts } = useConfig()
  const [newToken, setNewToken] = useState(metaToken)
  const [newAccountId, setNewAccountId] = useState("")
  const [newAccountName, setNewAccountName] = useState("")
  const [saved, setSaved] = useState(false)

  const handleAddAccount = () => {
    if (!newAccountId.trim()) {
      alert("ID da conta é obrigatório")
      return
    }

    const newAccount: MetaAccount = {
      id: newAccountId.trim(),
      name: newAccountName.trim() || newAccountId.trim(),
    }

    setMetaAccounts([...metaAccounts, newAccount])
    setNewAccountId("")
    setNewAccountName("")
  }

  const handleRemoveAccount = (id: string) => {
    setMetaAccounts(metaAccounts.filter((acc) => acc.id !== id))
  }

  const handleSave = () => {
    if (!newToken.trim()) {
      alert("Token Meta é obrigatório")
      return
    }

    if (metaAccounts.length === 0) {
      alert("Adicione pelo menos uma conta Meta")
      return
    }

    setMetaToken(newToken)
    setSaved(true)
    setTimeout(() => {
      router.push("/dashboard")
    }, 1500)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header title="Configurações" subtitle="Adicione suas credenciais Meta" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {/* Token Meta */}
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Token da Meta Marketing API
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Gere um token no{" "}
              <a
                href="https://developers.facebook.com/tools/explorer/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Graph API Explorer
              </a>{" "}
              com permissões: <code className="bg-muted px-1 py-0.5">ads_read</code>
            </p>
            <textarea
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              placeholder="EAAT..."
              className="h-24 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Card>

          {/* Contas Meta */}
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Contas Meta Ads
            </h2>

            {metaAccounts.length > 0 && (
              <div className="mb-4 flex flex-col gap-2">
                {metaAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <p className="text-xs font-medium text-foreground">
                        {acc.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {acc.id}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveAccount(acc.id)}
                      className="rounded p-1 hover:bg-destructive/20"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  ID da Conta (act_XXXXXXXXX)
                </label>
                <input
                  type="text"
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(e.target.value)}
                  placeholder="act_123456789"
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Nome da Conta (opcional)
                </label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="ex: Marca X — Meta Ads"
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <Button
                onClick={handleAddAccount}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Adicionar Conta
              </Button>
            </div>
          </Card>

          {/* Info */}
          <Card className="border-primary/20 bg-primary/5 p-4">
            <p className="text-xs text-foreground">
              <strong>Como encontrar o ID da conta?</strong>
              <br />
              No Ads Manager, vá em Configurações da Conta → Informações da Conta.
              O ID está no formato <code className="bg-muted px-1">act_123456789</code>
            </p>
          </Card>
        </div>
      </div>

      {/* Footer com botão salvar */}
      <div className="border-t border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {metaAccounts.length} conta{metaAccounts.length !== 1 ? "s" : ""} adicionada
            {metaAccounts.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            {saved && (
              <p className="text-xs font-medium text-emerald-400">✓ Salvo!</p>
            )}
            <Button onClick={handleSave} disabled={!newToken || metaAccounts.length === 0}>
              Salvar e Voltar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
