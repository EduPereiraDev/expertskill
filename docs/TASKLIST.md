# ✅ TASKLIST - Expert Skills

> **Checklist completo do 0 ao 100 para implementação do MVP**

---

## 📊 Progresso Geral

```
[░░░░░░░░░░░░░░░░░░░░] 0% - Não iniciado
```

**Total de Tarefas**: 100
**Concluídas**: 0
**Em Progresso**: 0
**Pendentes**: 100

---

## 🏗️ FASE 1 - FUNDAÇÃO (Tarefas 1-20)

### 1.1 Setup do Projeto

- [ ] **001** - Criar repositório Git
- [ ] **002** - Inicializar monorepo com pnpm workspaces
- [ ] **003** - Configurar estrutura de pastas
- [ ] **004** - Criar package.json raiz com scripts
- [ ] **005** - Configurar TypeScript (tsconfig base)
- [ ] **006** - Configurar ESLint + Prettier
- [ ] **007** - Configurar Husky + lint-staged
- [ ] **008** - Criar .env.example com variáveis necessárias
- [ ] **009** - Configurar .gitignore
- [ ] **010** - Criar docker-compose.yml (PostgreSQL + Redis)

### 1.2 Frontend Base

- [ ] **011** - Criar app Next.js 14 (App Router)
- [ ] **012** - Configurar Tailwind CSS
- [ ] **013** - Instalar e configurar shadcn/ui
- [ ] **014** - Criar tema customizado (cores do Design System)
- [ ] **015** - Criar layout base (Sidebar + Main)
- [ ] **016** - Implementar componente Sidebar
- [ ] **017** - Implementar navegação responsiva
- [ ] **018** - Criar página de loading/skeleton

### 1.3 Backend Base

- [ ] **019** - Criar app NestJS
- [ ] **020** - Configurar Prisma + PostgreSQL

---

## 🔐 FASE 2 - AUTENTICAÇÃO (Tarefas 21-35)

### 2.1 Backend Auth

- [ ] **021** - Criar schema Prisma para User
- [ ] **022** - Implementar módulo de Auth (NestJS)
- [ ] **023** - Criar endpoint POST /auth/register
- [ ] **024** - Criar endpoint POST /auth/login
- [ ] **025** - Implementar JWT (access + refresh tokens)
- [ ] **026** - Criar middleware de autenticação
- [ ] **027** - Implementar endpoint GET /auth/me
- [ ] **028** - Criar endpoint POST /auth/refresh
- [ ] **029** - Implementar logout (invalidar token)

### 2.2 Frontend Auth

- [ ] **030** - Criar página de Login
- [ ] **031** - Criar página de Registro
- [ ] **032** - Implementar formulários com validação (react-hook-form + zod)
- [ ] **033** - Criar contexto/store de autenticação
- [ ] **034** - Implementar proteção de rotas (middleware Next.js)
- [ ] **035** - Criar componente de perfil do usuário

---

## 💰 FASE 3 - CONTROLE DE BANCA (Tarefas 36-50)

### 3.1 Backend Banca

- [ ] **036** - Criar schema Prisma para Banca
- [ ] **037** - Criar schema Prisma para Entrada (histórico)
- [ ] **038** - Implementar módulo de Banca (NestJS)
- [ ] **039** - Criar endpoint POST /banca (criar/atualizar banca)
- [ ] **040** - Criar endpoint GET /banca (obter banca atual)
- [ ] **041** - Criar endpoint GET /banca/historico
- [ ] **042** - Implementar lógica de cálculo de gestão
- [ ] **043** - Criar endpoint POST /banca/entrada (registrar entrada)

### 3.2 Frontend Banca

- [ ] **044** - Criar página de Controle de Banca
- [ ] **045** - Implementar formulário de configuração de banca
- [ ] **046** - Criar seletor de tipo de gestão (Agressiva/Conservadora/Personalizada)
- [ ] **047** - Implementar cálculo automático de stake
- [ ] **048** - Criar componente de exibição de meta/progresso
- [ ] **049** - Implementar histórico de entradas
- [ ] **050** - Criar gráfico de evolução da banca

---

## 📡 FASE 4 - RADAR/TERMÔMETRO (Tarefas 51-70)

### 4.1 Integração de Dados

- [ ] **051** - Pesquisar e definir fonte de dados (API/Scraping)
- [ ] **052** - Criar serviço de coleta de dados
- [ ] **053** - Criar schema Prisma para Jogador
- [ ] **054** - Criar schema Prisma para Partida
- [ ] **055** - Criar schema Prisma para Confronto
- [ ] **056** - Implementar job de sincronização de dados
- [ ] **057** - Criar cache Redis para dados em tempo real

### 4.2 Backend Radar

- [ ] **058** - Implementar módulo de Radar (NestJS)
- [ ] **059** - Criar algoritmo de classificação (Cenário 1, 2, 3)
- [ ] **060** - Implementar análise de histórico HT/FT
- [ ] **061** - Implementar análise de média de gols
- [ ] **062** - Implementar análise de confrontos diretos
- [ ] **063** - Criar endpoint GET /radar/jogos (jogos classificados)
- [ ] **064** - Criar endpoint GET /radar/jogadores (ranking)
- [ ] **065** - Implementar WebSocket para atualizações em tempo real

### 4.3 Frontend Radar

- [ ] **066** - Criar página do Radar
- [ ] **067** - Implementar componente RadarCard (jogo individual)
- [ ] **068** - Criar indicadores visuais (🟢🟡🔴)
- [ ] **069** - Implementar filtros por liga
- [ ] **070** - Criar ranking de jogadores do dia

---

## 🤖 FASE 5 - ENTRADAS EXPERT (Tarefas 71-85)

### 5.1 Backend Entradas

- [ ] **071** - Implementar módulo de Entradas (NestJS)
- [ ] **072** - Criar engine de geração de entradas
- [ ] **073** - Integrar com módulo de Banca (stake automático)
- [ ] **074** - Integrar com OpenAI API para análise avançada
- [ ] **075** - Criar endpoint GET /entradas (entradas ativas)
- [ ] **076** - Criar endpoint POST /entradas/:id/confirmar
- [ ] **077** - Implementar histórico de entradas com resultado

### 5.2 Frontend Entradas

- [ ] **078** - Criar página de Entradas Expert
- [ ] **079** - Implementar componente EntradaCard
- [ ] **080** - Criar botão "Copiar Entrada"
- [ ] **081** - Implementar marcação de entrada como feita
- [ ] **082** - Criar histórico de entradas com filtros
- [ ] **083** - Implementar estatísticas de acerto
- [ ] **084** - Criar integração com Telegram (notificações)
- [ ] **085** - Implementar configurações de alertas

---

## 💳 FASE 6 - PAGAMENTOS E PLANOS (Tarefas 86-95)

### 6.1 Backend Pagamentos

- [ ] **086** - Criar schema Prisma para Plano e Assinatura
- [ ] **087** - Integrar Stripe
- [ ] **088** - Criar endpoint POST /checkout (criar sessão)
- [ ] **089** - Implementar webhook do Stripe
- [ ] **090** - Criar middleware de verificação de plano
- [ ] **091** - Implementar lógica de features por plano

### 6.2 Frontend Pagamentos

- [ ] **092** - Criar página de Planos
- [ ] **093** - Implementar cards de planos com features
- [ ] **094** - Criar fluxo de checkout
- [ ] **095** - Implementar página de sucesso/erro

---

## 🚀 FASE 7 - FINALIZAÇÃO (Tarefas 96-100)

### 7.1 Testes e Deploy

- [ ] **096** - Escrever testes unitários (Jest)
- [ ] **097** - Escrever testes E2E (Playwright)
- [ ] **098** - Configurar CI/CD (GitHub Actions)
- [ ] **099** - Deploy frontend (Vercel)
- [ ] **100** - Deploy backend (Railway)

---

## 📋 Detalhamento das Tarefas Críticas

### Tarefa 001 - Criar repositório Git

**Descrição**: Inicializar repositório Git local e remoto

**Comandos**:

```bash
git init
git remote add origin https://github.com/seu-usuario/expertskill.git
git add .
git commit -m "chore: initial commit"
git push -u origin main
```

**Critérios de Aceite**:

- [ ] Repositório criado no GitHub
- [ ] Branch main protegida
- [ ] README.md inicial commitado

---

### Tarefa 011 - Criar app Next.js 14

**Descrição**: Inicializar aplicação Next.js com App Router

**Comandos**:

```bash
cd apps
pnpm create next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Critérios de Aceite**:

- [ ] App rodando em localhost:3000
- [ ] TypeScript configurado
- [ ] Tailwind funcionando

---

### Tarefa 042 - Implementar lógica de cálculo de gestão

**Descrição**: Criar função que calcula stake baseado no tipo de gestão

**Lógica**:

```typescript
type GestaoType = 'agressiva' | 'conservadora' | 'personalizada';

interface CalculoGestao {
  banca: number;
  meta: number;
  tipo: GestaoType;
  divisor?: number; // para personalizada
}

function calcularStake(config: CalculoGestao): {
  stake: number;
  entradasNecessarias: number;
  oddMinima: number;
} {
  const divisor = 
    config.tipo === 'agressiva' ? 10 :
    config.tipo === 'conservadora' ? 20 :
    config.divisor || 10;
  
  const stake = config.banca / divisor;
  const entradasNecessarias = Math.ceil(config.meta / (stake * 0.8)); // 80% de lucro médio
  const oddMinima = 1 + (config.meta / (stake * entradasNecessarias));
  
  return { stake, entradasNecessarias, oddMinima };
}
```

**Critérios de Aceite**:

- [ ] Função testada com diferentes cenários
- [ ] Retorna stake correto para cada tipo de gestão
- [ ] Calcula entradas necessárias corretamente

---

### Tarefa 059 - Criar algoritmo de classificação

**Descrição**: Implementar lógica que classifica jogos em 3 cenários

**Lógica**:

```typescript
enum Cenario {
  JOGO_FRACO = 1,      // 🔴 Evitar
  OVER_SEGURANDO = 2,  // 🟡 Cautela
  MELHOR_JOGO = 3      // 🟢 Operar
}

interface AnaliseJogo {
  jogador1: Jogador;
  jogador2: Jogador;
  historicoH2H: Partida[];
  ultimasPartidas: Partida[];
}

function classificarJogo(analise: AnaliseJogo): Cenario {
  const mediaGols = calcularMediaGols(analise.ultimasPartidas);
  const percentual0x0 = calcularPercentual0x0(analise.historicoH2H);
  const tendenciaOver = calcularTendenciaOver(analise);
  
  // Cenário 1: Jogo Fraco
  if (percentual0x0 > 30 || mediaGols < 1.5) {
    return Cenario.JOGO_FRACO;
  }
  
  // Cenário 3: Melhor Jogo
  if (mediaGols > 3 && tendenciaOver > 70) {
    return Cenario.MELHOR_JOGO;
  }
  
  // Cenário 2: Over Segurando
  return Cenario.OVER_SEGURANDO;
}
```

**Critérios de Aceite**:

- [ ] Classifica corretamente jogos de teste
- [ ] Considera histórico HT e FT
- [ ] Identifica padrões de gols tardios

---

## 🎯 Marcos (Milestones)

| Marco | Tarefas | Data Alvo | Status |
|-------|---------|-----------|--------|
| **M1** - Setup Completo | 1-20 | Semana 2 | ⏳ Pendente |
| **M2** - Auth Funcional | 21-35 | Semana 3 | ⏳ Pendente |
| **M3** - Banca MVP | 36-50 | Semana 5 | ⏳ Pendente |
| **M4** - Radar MVP | 51-70 | Semana 8 | ⏳ Pendente |
| **M5** - Entradas MVP | 71-85 | Semana 10 | ⏳ Pendente |
| **M6** - Pagamentos | 86-95 | Semana 11 | ⏳ Pendente |
| **M7** - Lançamento | 96-100 | Semana 12 | ⏳ Pendente |

---

## 📝 Notas de Implementação

### Prioridades

1. **P0 (Crítico)**: Tarefas que bloqueiam outras
2. **P1 (Alto)**: Core features do MVP
3. **P2 (Médio)**: Features importantes mas não bloqueantes
4. **P3 (Baixo)**: Nice to have

### Dependências entre Tarefas

```
001-010 → 011-020 → 021-035 → 036-050 → 51-70 → 71-85 → 86-95 → 96-100
   ↓          ↓          ↓          ↓         ↓         ↓
 Setup    Frontend    Auth      Banca     Radar   Entradas
```

### Convenções de Commit

```
feat: nova funcionalidade
fix: correção de bug
chore: tarefas de manutenção
docs: documentação
style: formatação
refactor: refatoração
test: testes
```

---

## 🔄 Atualizações

| Data | Tarefa | Status | Observação |
|------|--------|--------|------------|
| 03/02/2025 | Documento criado | ✅ | Tasklist inicial |

---

*Última atualização: 03/02/2025*
