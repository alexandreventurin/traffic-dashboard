# Traffic Dashboard

Dashboard para gestores de tráfego acompanharem campanhas **Meta Ads** + **Google Ads** em tempo real.

**Diferencial:** Alertas proativos, análise de IA, diagnóstico em linguagem natural.

---

## 🚀 Features MVP

- ✅ **Overview Geral** — Spend, Revenue, ROAS, CPA consolidados
- ✅ **Performance por Campanha** — Meta + Google com KPIs e trending
- ✅ **Gráfico de Gasto × Receita × ROAS** — Últimos 30 dias
- ✅ **Alertas Automáticos** — Frequência alta, Learning Limited, Budget/Rank Lost IS
- ✅ **Configuração Dinâmica** — Token Meta + Contas salvas em localStorage
- ✅ **Multi-conta** — Suporta múltiplas contas Meta e Google

---

## 🛠️ Stack

- **Frontend:** React 19 + Next.js 16 + TypeScript + Tailwind CSS v4
- **UI:** shadcn/ui
- **Charts:** Recharts
- **State:** Context API + localStorage
- **Backend:** Next.js API Routes (pronto pra integração Supabase)

---

## 📦 Instalação

```bash
git clone https://github.com/alexandreventurin/traffic-dashboard
cd traffic-dashboard
npm install
```

---

## 🔑 Configuração

### 1. Gerar Token Meta

1. Acesse [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Selecione seu App Business
3. Permissões: `ads_read`
4. Copie o token (começa com `EAAT...`)

### 2. Encontrar Ad Account ID

No **Ads Manager:**
- Configurações da Conta → Informações da Conta
- ID está no formato: `act_123456789`

### 3. Adicionar no Dashboard

1. Abra [http://localhost:3000/dashboard/configuracoes](http://localhost:3000/dashboard/configuracoes)
2. Cole o token Meta
3. Adicione o ID da conta
4. Clique "Salvar e Voltar"

---

## 🏃 Rodar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 🚢 Deploy no Vercel

### Opção 1: Conectar Repositório (Mais Fácil)

1. Acesse [Vercel](https://vercel.com)
2. Clique "New Project"
3. Selecione o repositório `traffic-dashboard`
4. Vercel detecta Next.js automaticamente
5. Deploy em 1 clique!

### Opção 2: CLI

```bash
npm i -g vercel
vercel
```

---

## 📝 Arquitetura

```
src/
├── app/
│   ├── dashboard/          # Páginas do dashboard
│   ├── api/meta/           # Endpoints que chamam Meta API
│   └── layout.tsx          # Root layout com ConfigProvider
├── components/
│   ├── dashboard/          # Componentes do dashboard
│   ├── charts/             # Gráficos (Recharts)
│   └── layout/             # Sidebar, Header
├── lib/
│   ├── context/            # ConfigContext (token + contas)
│   ├── hooks/              # useAccountInsights
│   ├── mock/               # Dados mockados pra testes
│   └── types/              # TypeScript types
```

---

## 🔮 Próximos Passos (V2)

- [ ] Funil de conversão por campanha
- [ ] Galeria de criativos com retenção de vídeo
- [ ] Heatmap hora × dia (Google)
- [ ] Search terms com sugestão de negativar
- [ ] Budget optimizer automático
- [ ] Copy analyzer (IA)

---

## 📊 Dados Mockados

O dashboard começa com dados mockados realistas. Quando você configurar o token Meta, ele busca dados reais via `/api/meta/insights`.

**Arquivos mock:**
- `src/lib/mock/data.ts` — Todos os dados de exemplo

---

## 🐛 Troubleshooting

**"Configuração Necessária"?**
- Cole o token e adicione uma conta em `/dashboard/configuracoes`

**Erro ao buscar dados Meta?**
- Verifique se o token tem permissão `ads_read`
- Confirme se o `ad_account_id` está correto (formato: `act_XXXXXXXXX`)

---

## 📄 Licença

MIT

---

**Feito com ❤️ para gestores de tráfego.**
