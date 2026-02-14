# 🎯 Expert Skills

> **Plataforma de Análise e Gestão para eSoccer (FIFA) - Bet365**

[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)]()
[![Versão](https://img.shields.io/badge/Versão-0.0.1-blue)]()

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Proposta de Valor](#proposta-de-valor)
- [Funcionalidades](#funcionalidades)
- [Stack Tecnológica](#stack-tecnológica)
- [Documentação](#documentação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Começar](#como-começar)
- [Roadmap](#roadmap)
- [Contribuição](#contribuição)

---

## 🎮 Sobre o Projeto

**Expert Skills** é uma plataforma SaaS que entrega análises automatizadas e gestão de banca inteligente para apostadores de eSoccer FIFA na Bet365.

### O Problema

O mercado de análise de eSoccer está saturado de sites que oferecem apenas estatísticas. Os apostadores precisam:

- Analisar dados manualmente
- Calcular gestão de banca por conta própria
- Decidir quando e onde entrar
- Gerenciar múltiplas fontes de informação

### A Solução

Uma plataforma "hands-off" onde o usuário **apenas segue as recomendações**:

- ✅ Análise automatizada com IA
- ✅ Gestão de banca integrada
- ✅ Entradas prontas para copiar
- ✅ Radar em tempo real

---

## 💎 Proposta de Valor

| Concorrência | Expert Skills |
|--------------|---------------|
| Apenas estatísticas | Análise + Gestão + Entradas |
| Usuário analisa | Sistema analisa |
| Múltiplas ferramentas | Tudo em um painel |
| Sem gestão de banca | Gestão automática |

**Diferencial**: Experiência "hack" - o usuário não precisa pensar, só seguir.

---

## 🚀 Funcionalidades

### 1. Controle de Banca

- Configuração de banca inicial
- Meta diária
- Gestão automática: **Agressiva** (÷10) | **Conservadora** (÷20) | **Personalizada**
- Cálculo automático de stake

### 2. Radar (Termômetro)

- Análise em tempo real das grades
- Classificação visual:
  - 🟢 **Operar** - Condições favoráveis
  - 🟡 **Cautela** - Atenção redobrada
  - 🔴 **Evitar** - Não entrar

### 3. Entradas Expert (Bot)

- Geração automática de entradas
- Integração com IA
- 3 cenários de classificação:
  - **Cenário 1**: Jogo Fraco (evitar over)
  - **Cenário 2**: Over Segurando (entrada tardia)
  - **Cenário 3**: Melhores Jogadores (entrada pré/ao vivo)

### 4. Dashboard

- Visão consolidada
- Ranking de jogadores do dia
- Top confrontos
- Histórico de entradas

---

## 🛠️ Stack Tecnológica

### Frontend

| Tecnologia | Uso |
|------------|-----|
| Next.js 14 | Framework React |
| TypeScript | Tipagem |
| Tailwind CSS | Estilização |
| shadcn/ui | Componentes |
| Zustand | Estado global |
| React Query | Cache e fetching |

### Backend

| Tecnologia | Uso |
|------------|-----|
| Node.js | Runtime |
| NestJS | Framework |
| Prisma | ORM |
| PostgreSQL | Banco de dados |
| Redis | Cache |

### Infraestrutura

| Tecnologia | Uso |
|------------|-----|
| Vercel | Deploy frontend |
| Railway | Deploy backend |
| Supabase | Database hosting |
| Stripe | Pagamentos |

### Integrações

| Tecnologia | Uso |
|------------|-----|
| OpenAI API | Análise com IA |
| Telegram Bot | Notificações |
| API de dados | Estatísticas eSoccer |

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [INDEX.md](./docs/INDEX.md) | Índice geral da documentação |
| [REQUISITOS.md](./docs/REQUISITOS.md) | Requisitos consolidados das fontes |
| [TASKLIST.md](./docs/TASKLIST.md) | Checklist completo do 0 ao 100 |
| [ROADMAP.md](./docs/ROADMAP.md) | Timeline de desenvolvimento |
| [SPECS.md](./docs/SPECS.md) | Especificações técnicas |
| [DATABASE.md](./docs/DATABASE.md) | Schema do banco de dados |
| [API.md](./docs/API.md) | Documentação da API |
| [DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | Cores, tipografia, componentes |
| [GLOSSARIO.md](./docs/GLOSSARIO.md) | Termos do domínio eSoccer |

---

## 📁 Estrutura do Projeto

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
│   ├── TASKLIST.md
│   ├── SPECS.md
│   ├── DESIGN_SYSTEM.md
│   ├── ROADMAP.md
│   ├── API.md
│   └── DATABASE.md
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🏁 Como Começar

### Pré-requisitos

- Node.js 18+
- pnpm 8+
- Docker (opcional)
- PostgreSQL

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/expertskill.git

# Entre na pasta
cd expertskill

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env

# Rode as migrations
pnpm db:migrate

# Inicie o desenvolvimento
pnpm dev
```

### Scripts Disponíveis

```bash
pnpm dev          # Inicia frontend e backend
pnpm build        # Build de produção
pnpm test         # Roda os testes
pnpm lint         # Verifica código
pnpm db:migrate   # Roda migrations
pnpm db:seed      # Popula banco com dados de teste
```

---

## 📈 Roadmap

### Fase 1 - Fundação (Semanas 1-2)

- [ ] Setup do projeto (monorepo)
- [ ] Autenticação
- [ ] Design System base

### Fase 2 - Controle de Banca (Semanas 3-4)

- [ ] UI do módulo
- [ ] Lógica de gestão
- [ ] Dashboard de progresso

### Fase 3 - Radar (Semanas 5-7)

- [ ] Integração com fonte de dados
- [ ] Algoritmo de classificação
- [ ] UI com indicadores

### Fase 4 - Entradas Expert (Semanas 8-10)

- [ ] Engine de análise
- [ ] Integração com IA
- [ ] UI de entradas

### Fase 5 - Lançamento (Semanas 11-12)

- [ ] Sistema de pagamentos
- [ ] Testes E2E
- [ ] Deploy produção

---

## 💰 Modelo de Negócio

| Plano | Preço | Features |
|-------|-------|----------|
| **Básico** | R$ 79,99/mês | Controle de Banca + Dashboard |
| **Pro** | R$ 99,99/mês | Básico + Radar + Alertas |
| **Expert** | R$ 149,99/mês | Pro + Entradas Expert + IA |

### Projeção

- Live com ~1.500 viewers
- Conversão: 200 vendas
- **Receita mensal: ~R$ 20.000**

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é privado e proprietário.

---

## 📞 Contato

- **Projeto**: Expert Skills
- **Status**: Em desenvolvimento
- **Início**: Fevereiro 2025

---

*Última atualização: 03/02/2025*
