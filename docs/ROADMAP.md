# 🎯 ROADMAP MVP - Expert Skills

> **Plataforma de Análise e Gestão para eSoccer (FIFA) - Bet365**

---

## 📋 Sumário Executivo

### Visão do Produto
Criar uma plataforma SaaS que entrega **análises automatizadas** e **gestão de banca inteligente** para apostadores de eSoccer FIFA na Bet365, diferenciando-se do mercado ao oferecer uma experiência "hands-off" onde o usuário apenas segue as recomendações.

### Proposta de Valor
- **Diferencial**: Combina análise de dados + gestão de banca + IA em um único painel
- **Público**: Apostadores de eSoccer FIFA (grade de 12 minutos GT)
- **Modelo de Negócio**: SaaS com 3 planos (R$79,99 / R$99 / R$149)

---

## 🏗️ Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Dashboard │ │  Radar   │ │ Entradas │ │  Banca   │           │
│  │  Home    │ │ (Termo)  │ │  Expert  │ │ Control  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/NestJS)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   API    │ │  Scraper │ │AnalysisAI│ │  Auth    │           │
│  │  REST    │ │  Service │ │  Engine  │ │ Service  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │PostgreSQL│ │  Redis   │ │ External │                        │
│  │ (dados)  │ │ (cache)  │ │  APIs    │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Módulos do MVP

### 1. **Controle de Banca** (Core Feature)
- Input: Valor da banca (ex: R$100)
- Input: Meta do dia
- Seleção de gestão: **Agressiva** (÷10) | **Conservadora** (÷20) | **Personalizada**
- Output automático: Stake por entrada, número de entradas necessárias

### 2. **Radar (Termômetro)**
- Análise em tempo real das grades
- Classificação visual: 🟢 Operar | 🟡 Cautela | 🔴 Evitar
- Dados analisados:
  - Histórico HT/FT dos jogadores
  - Média de gols por partida
  - Percentual over/under
  - Confrontos diretos (H2H)
  - Frequência de 0x0
  - Padrões de gols tardios

### 3. **Entradas Expert (Bot)**
- Gerador automático de entradas
- Integração com IA para análise
- 3 cenários de classificação:
  - **Cenário 1**: Jogo Fraco (evitar over, buscar under)
  - **Cenário 2**: Over Segurando (entrada tardia, pós-HT)
  - **Cenário 3**: Melhores Jogadores (entrada pré ou ao vivo)

### 4. **Dashboard**
- Visão consolidada
- Ranking dos melhores jogadores do dia
- Top confrontos do dia
- Histórico de entradas e resultados

---

## 🗓️ Fases de Desenvolvimento

### **FASE 1 - Fundação (Semanas 1-2)**
> Setup técnico e estrutura base

| Sprint | Tarefa | Prioridade | Estimativa |
|--------|--------|------------|------------|
| 1.1 | Setup do projeto (monorepo: frontend + backend) | 🔴 Alta | 2 dias |
| 1.2 | Configuração de ambiente (Docker, CI/CD básico) | 🔴 Alta | 1 dia |
| 1.3 | Design System base (cores, tipografia, componentes) | 🔴 Alta | 2 dias |
| 1.4 | Autenticação (login, registro, JWT) | 🔴 Alta | 3 dias |
| 1.5 | Estrutura do banco de dados | 🔴 Alta | 2 dias |

**Entregáveis:**
- [ ] Repositório configurado
- [ ] Login/Registro funcional
- [ ] Layout base do painel

---

### **FASE 2 - Controle de Banca (Semanas 3-4)**
> Feature core de gestão financeira

| Sprint | Tarefa | Prioridade | Estimativa |
|--------|--------|------------|------------|
| 2.1 | UI do módulo de banca | 🔴 Alta | 2 dias |
| 2.2 | Lógica de cálculo de gestão (agressiva/conservadora/personalizada) | 🔴 Alta | 2 dias |
| 2.3 | Persistência de configurações do usuário | 🟡 Média | 1 dia |
| 2.4 | Histórico de bancas e metas | 🟡 Média | 2 dias |
| 2.5 | Dashboard de progresso diário | 🟡 Média | 2 dias |

**Entregáveis:**
- [ ] Usuário configura banca e meta
- [ ] Sistema calcula stake automaticamente
- [ ] Visualização de progresso

---

### **FASE 3 - Radar/Termômetro (Semanas 5-7)**
> Sistema de análise e classificação de jogos

| Sprint | Tarefa | Prioridade | Estimativa |
|--------|--------|------------|------------|
| 3.1 | Pesquisa e integração com fonte de dados (API/Scraping) | 🔴 Alta | 4 dias |
| 3.2 | Modelagem de dados históricos (jogadores, partidas) | 🔴 Alta | 2 dias |
| 3.3 | Algoritmo de classificação (Cenários 1, 2, 3) | 🔴 Alta | 4 dias |
| 3.4 | UI do Radar com indicadores visuais | 🔴 Alta | 3 dias |
| 3.5 | Sistema de alertas em tempo real | 🟡 Média | 2 dias |

**Entregáveis:**
- [ ] Radar funcional com classificação de jogos
- [ ] Indicadores visuais (🟢🟡🔴)
- [ ] Dados históricos dos jogadores

---

### **FASE 4 - Entradas Expert (Semanas 8-10)**
> Bot de geração de entradas

| Sprint | Tarefa | Prioridade | Estimativa |
|--------|--------|------------|------------|
| 4.1 | Engine de análise de entradas | 🔴 Alta | 4 dias |
| 4.2 | Integração com módulo de banca (stake automático) | 🔴 Alta | 2 dias |
| 4.3 | UI de exibição de entradas recomendadas | 🔴 Alta | 2 dias |
| 4.4 | Integração com IA (OpenAI/Claude) para análise avançada | 🟡 Média | 3 dias |
| 4.5 | Histórico de entradas e performance | 🟡 Média | 2 dias |

**Entregáveis:**
- [ ] Bot gerando entradas automaticamente
- [ ] Integração com gestão de banca
- [ ] Histórico de acertos/erros

---

### **FASE 5 - Integração e Polish (Semanas 11-12)**
> Refinamento e preparação para lançamento

| Sprint | Tarefa | Prioridade | Estimativa |
|--------|--------|------------|------------|
| 5.1 | Integração completa dos módulos | 🔴 Alta | 3 dias |
| 5.2 | Sistema de planos/assinaturas (Stripe) | 🔴 Alta | 3 dias |
| 5.3 | Testes E2E e correção de bugs | 🔴 Alta | 3 dias |
| 5.4 | Otimização de performance | 🟡 Média | 2 dias |
| 5.5 | Documentação e onboarding do usuário | 🟡 Média | 2 dias |

**Entregáveis:**
- [ ] MVP completo e funcional
- [ ] Sistema de pagamentos
- [ ] Onboarding do usuário

---

## 💰 Modelo de Monetização

### Planos Propostos

| Plano | Preço | Features |
|-------|-------|----------|
| **Básico** | R$ 79,99/mês | Controle de Banca + Dashboard |
| **Pro** | R$ 99,99/mês | Básico + Radar + Alertas |
| **Expert** | R$ 149,99/mês | Pro + Entradas Expert (Bot) + IA |

### Projeção Inicial
- Live com ~1.500 viewers
- Conversão conservadora: 200 vendas
- Ticket médio: R$ 99
- **Receita mensal projetada: ~R$ 20.000**

---

## 🛠️ Stack Tecnológica Recomendada

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand ou React Query
- **Charts**: Recharts ou Tremor

### Backend
- **Runtime**: Node.js
- **Framework**: NestJS (estrutura enterprise)
- **ORM**: Prisma
- **Auth**: NextAuth.js ou Clerk

### Infraestrutura
- **Database**: PostgreSQL (Supabase ou Railway)
- **Cache**: Redis (Upstash)
- **Deploy**: Vercel (frontend) + Railway (backend)
- **Pagamentos**: Stripe

### Integrações
- **Dados eSoccer**: API própria ou scraping de sites de estatísticas
- **IA**: OpenAI API (GPT-4) para análises avançadas
- **Notificações**: Telegram Bot API

---

## 📈 Métricas de Sucesso do MVP

### KPIs Técnicos
- [ ] Tempo de resposta do Radar < 2s
- [ ] Uptime > 99%
- [ ] Zero bugs críticos em produção

### KPIs de Negócio
- [ ] 100 usuários pagantes no primeiro mês
- [ ] Taxa de churn < 10%
- [ ] NPS > 50

---

## ⚠️ Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Fonte de dados instável | Alto | Múltiplas fontes + cache agressivo |
| Complexidade da IA | Médio | MVP com regras simples, IA como enhancement |
| Concorrência | Médio | Foco no diferencial (gestão + análise integrada) |
| Regulamentação | Alto | Termos de uso claros, não é casa de apostas |

---

## 🚀 Próximos Passos Imediatos

1. **Validar stack tecnológica** - Confirmar escolhas com base na experiência do time
2. **Definir fonte de dados** - Pesquisar APIs disponíveis ou estratégia de scraping
3. **Criar wireframes** - Desenhar fluxo do usuário antes de codar
4. **Setup inicial** - Criar repositório e estrutura base do projeto

---

## 📁 Estrutura de Pastas Sugerida

```
expertskill/
├── apps/
│   ├── web/                    # Frontend Next.js
│   │   ├── app/
│   │   │   ├── (auth)/         # Rotas de autenticação
│   │   │   ├── (dashboard)/    # Rotas do painel
│   │   │   │   ├── banca/      # Controle de banca
│   │   │   │   ├── radar/      # Termômetro
│   │   │   │   ├── entradas/   # Bot de entradas
│   │   │   │   └── page.tsx    # Dashboard home
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/             # Componentes base (shadcn)
│   │   │   └── features/       # Componentes de features
│   │   └── lib/
│   │       ├── api/            # Clients de API
│   │       └── utils/          # Utilitários
│   │
│   └── api/                    # Backend NestJS
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── banca/
│       │   │   ├── radar/
│       │   │   ├── entradas/
│       │   │   └── users/
│       │   ├── common/
│       │   └── main.ts
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   ├── shared/                 # Tipos e utils compartilhados
│   └── config/                 # Configs compartilhadas
│
├── docs/                       # Documentação
├── docker-compose.yml
└── README.md
```

---

## 🎙️ Transcrição do Áudio (Insights Adicionais)

> **Arquivo**: `5082848311665231640.mp3`

### Cenário Padrão (Jogos Ruins - EVITAR)
- Grade ruim: um jogo pagando, outro não
- **0x0 na HT** (primeira análise)
- **0x0 na FT** (segunda análise)
- Gol saindo muito rápido e não saindo mais
- Jogadores "over" segurando o jogo, segurando resultados
- Jogadores bons não pagando "ambas"
- Jogadores bons perdendo pra zebra

### Entradas Recomendadas (SEGUIR)
- Analisar **últimas 8-12 horas** de confrontos do dia
- Bot analisa e identifica confrontos com mais gols
- Exemplo: *"Confronto Zohri e McShield são os confrontos mais over do dia"*
- Mandaria todos os confrontos bons do dia

### Feature: Radar de Jogadores
- Mostrar na aba Radar o desempenho individual
- Exemplo: *"Jogador Zohri tá matando 2.5 em 8/9 partidas"*
- Identificar **jogador mais vitorioso** do momento

---

## 📝 Notas da Reunião

### Pontos-Chave Extraídos
1. **Foco na grade GT (12 minutos)** - Única grade de interesse real
2. **Mercado saturado de análise** - Diferencial é a gestão integrada
3. **Experiência "hack"** - Usuário não precisa pensar, só seguir
4. **Análise visual** - Leitura corporal dos jogadores (feature futura com IA de vídeo?)
5. **Telegram** - Canal de comunicação importante para alertas

### Sites de Referência Mencionados
- Sites de análise de eSoccer existentes (concorrência)
- Bet365 como fonte primária de odds

---

*Documento criado em: 03/02/2025*
*Versão: 1.0*
*Status: Aguardando validação*
