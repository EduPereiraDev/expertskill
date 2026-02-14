# 🗄️ DATABASE - Expert Skills

> **Documentação do banco de dados e schemas**

---

## 📊 Diagrama ER

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │     Banca       │       │    Entrada      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │──┐    │ id (PK)         │
│ email           │  │    │ userId (FK)     │◄─┘    │ userId (FK)     │
│ password        │  │    │ valor           │  │    │ bancaId (FK)    │
│ name            │  └───►│ metaDiaria      │  │    │ partidaId (FK)  │
│ plan            │       │ tipoGestao      │  └───►│ mercado         │
│ createdAt       │       │ stake           │       │ odd             │
└─────────────────┘       └─────────────────┘       │ stake           │
        │                                           │ resultado       │
        │                                           │ status          │
        │                                           └─────────────────┘
        │                                                   │
        │                                                   │
        ▼                                                   ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Assinatura    │       │    Jogador      │       │    Partida      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │◄──────│ id (PK)         │
│ userId (FK)     │       │ nome            │       │ jogador1Id (FK) │
│ stripeId        │       │ liga            │       │ jogador2Id (FK) │
│ plano           │       │ mediaGolsHT     │       │ liga            │
│ status          │       │ mediaGolsFT     │       │ dataHora        │
│ inicioEm        │       │ percentualOver  │       │ golsHT1/HT2     │
│ fimEm           │       └─────────────────┘       │ golsFT1/FT2     │
└─────────────────┘                                 │ cenario         │
                                                    └─────────────────┘
```

---

## 📋 Tabelas

### users

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | CUID | PK | Identificador único |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email do usuário |
| password | VARCHAR(255) | NOT NULL | Hash da senha (bcrypt) |
| name | VARCHAR(100) | NULL | Nome do usuário |
| avatar | VARCHAR(500) | NULL | URL do avatar |
| role | ENUM | DEFAULT 'USER' | USER, ADMIN |
| plan | ENUM | DEFAULT 'FREE' | FREE, BASICO, PRO, EXPERT |
| plan_expires_at | TIMESTAMP | NULL | Data de expiração do plano |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMP | AUTO UPDATE | Data de atualização |

### bancas

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | CUID | PK | Identificador único |
| user_id | CUID | FK users(id) | Usuário dono da banca |
| valor | DECIMAL(10,2) | NOT NULL | Valor total da banca |
| meta_diaria | DECIMAL(10,2) | NOT NULL | Meta de lucro diário |
| tipo_gestao | ENUM | NOT NULL | AGRESSIVA, CONSERVADORA, PERSONALIZADA |
| divisor | INT | NULL | Divisor para gestão personalizada |
| stake | DECIMAL(10,2) | NOT NULL | Valor calculado por entrada |
| ativa | BOOLEAN | DEFAULT true | Se é a banca ativa |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMP | AUTO UPDATE | Data de atualização |

### entradas

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | CUID | PK | Identificador único |
| user_id | CUID | FK users(id) | Usuário |
| banca_id | CUID | FK bancas(id) | Banca utilizada |
| partida_id | CUID | FK partidas(id), NULL | Partida relacionada |
| mercado | VARCHAR(100) | NOT NULL | Ex: "Over 2.5 FT" |
| odd | DECIMAL(5,2) | NOT NULL | Odd da entrada |
| stake | DECIMAL(10,2) | NOT NULL | Valor apostado |
| resultado | ENUM | NULL | GREEN, RED, REEMBOLSO |
| lucro | DECIMAL(10,2) | NULL | Lucro/prejuízo |
| status | ENUM | DEFAULT 'PENDENTE' | PENDENTE, CONFIRMADA, FINALIZADA, CANCELADA |
| confianca | ENUM | NOT NULL | BAIXA, MEDIA, ALTA |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMP | AUTO UPDATE | Data de atualização |

### jogadores

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | CUID | PK | Identificador único |
| nome | VARCHAR(100) | NOT NULL | Nome do jogador |
| apelido | VARCHAR(50) | NULL | Apelido/nick |
| liga | ENUM | NOT NULL | GT_12MIN, VOLTA_6MIN, H2H, GT_8MIN |
| media_gols_ht | DECIMAL(4,2) | DEFAULT 0 | Média de gols no HT |
| media_gols_ft | DECIMAL(4,2) | DEFAULT 0 | Média de gols no FT |
| percentual_over | DECIMAL(5,2) | DEFAULT 0 | % de jogos over 2.5 |
| percentual_0x0 | DECIMAL(5,2) | DEFAULT 0 | % de jogos 0x0 |
| ultima_atualizacao | TIMESTAMP | DEFAULT NOW() | Última atualização de stats |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMP | AUTO UPDATE | Data de atualização |

**Índice único**: (nome, liga)

### partidas

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | CUID | PK | Identificador único |
| jogador1_id | CUID | FK jogadores(id) | Jogador 1 |
| jogador2_id | CUID | FK jogadores(id) | Jogador 2 |
| liga | ENUM | NOT NULL | Liga da partida |
| data_hora | TIMESTAMP | NOT NULL | Data e hora da partida |
| gols_ht1 | INT | NULL | Gols jogador 1 no HT |
| gols_ht2 | INT | NULL | Gols jogador 2 no HT |
| gols_ft1 | INT | NULL | Gols jogador 1 no FT |
| gols_ft2 | INT | NULL | Gols jogador 2 no FT |
| status | ENUM | DEFAULT 'AGENDADA' | AGENDADA, AO_VIVO, FINALIZADA, CANCELADA |
| cenario | ENUM | NULL | JOGO_FRACO, OVER_SEGURANDO, MELHOR_JOGO |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMP | AUTO UPDATE | Data de atualização |

### assinaturas

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | CUID | PK | Identificador único |
| user_id | CUID | FK users(id) | Usuário |
| stripe_customer_id | VARCHAR(100) | NULL | ID do cliente no Stripe |
| stripe_subscription_id | VARCHAR(100) | NULL | ID da assinatura no Stripe |
| plano | ENUM | NOT NULL | Plano assinado |
| status | ENUM | NOT NULL | ATIVA, CANCELADA, EXPIRADA, PENDENTE |
| inicio_em | TIMESTAMP | NOT NULL | Início da assinatura |
| fim_em | TIMESTAMP | NOT NULL | Fim da assinatura |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |
| updated_at | TIMESTAMP | AUTO UPDATE | Data de atualização |

### refresh_tokens

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | CUID | PK | Identificador único |
| token | VARCHAR(500) | UNIQUE, NOT NULL | Token de refresh |
| user_id | CUID | FK users(id) | Usuário |
| expires_at | TIMESTAMP | NOT NULL | Data de expiração |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |

---

## 🔑 Índices

```sql
-- Performance queries
CREATE INDEX idx_entradas_user_created ON entradas(user_id, created_at DESC);
CREATE INDEX idx_entradas_banca ON entradas(banca_id);
CREATE INDEX idx_entradas_status ON entradas(status);

CREATE INDEX idx_partidas_data ON partidas(data_hora);
CREATE INDEX idx_partidas_status ON partidas(status);
CREATE INDEX idx_partidas_liga ON partidas(liga);
CREATE INDEX idx_partidas_jogadores ON partidas(jogador1_id, jogador2_id);

CREATE INDEX idx_jogadores_liga ON jogadores(liga);
CREATE INDEX idx_jogadores_media ON jogadores(media_gols_ft DESC);

CREATE INDEX idx_bancas_user_ativa ON bancas(user_id, ativa);

CREATE INDEX idx_assinaturas_user ON assinaturas(user_id);
CREATE INDEX idx_assinaturas_status ON assinaturas(status);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

---

## 🔄 Migrations

### Criar banco inicial

```bash
# Gerar migration
npx prisma migrate dev --name init

# Aplicar em produção
npx prisma migrate deploy
```

### Seed de dados

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Criar usuário admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@expertskills.com' },
    update: {},
    create: {
      email: 'admin@expertskills.com',
      password: '$2b$10$...', // hash de 'admin123'
      name: 'Admin',
      role: 'ADMIN',
      plan: 'EXPERT'
    }
  });

  // Criar jogadores de exemplo
  const jogadores = [
    { nome: 'Zohri', liga: 'GT_12MIN', mediaGolsFT: 2.8, percentualOver: 78 },
    { nome: 'McShield', liga: 'GT_12MIN', mediaGolsFT: 2.5, percentualOver: 72 },
    { nome: 'Kevin', liga: 'GT_12MIN', mediaGolsFT: 2.3, percentualOver: 68 },
    { nome: 'Hussein', liga: 'GT_12MIN', mediaGolsFT: 2.1, percentualOver: 65 },
  ];

  for (const jogador of jogadores) {
    await prisma.jogador.upsert({
      where: { nome_liga: { nome: jogador.nome, liga: jogador.liga } },
      update: jogador,
      create: jogador
    });
  }

  console.log('Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 📈 Queries Comuns

### Buscar banca ativa do usuário

```typescript
const banca = await prisma.banca.findFirst({
  where: {
    userId: userId,
    ativa: true
  }
});
```

### Buscar entradas do dia

```typescript
const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

const entradas = await prisma.entrada.findMany({
  where: {
    userId: userId,
    createdAt: { gte: hoje }
  },
  include: {
    partida: {
      include: {
        jogador1: true,
        jogador2: true
      }
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

### Ranking de jogadores

```typescript
const ranking = await prisma.jogador.findMany({
  where: { liga: 'GT_12MIN' },
  orderBy: { mediaGolsFT: 'desc' },
  take: 10,
  select: {
    id: true,
    nome: true,
    mediaGolsFT: true,
    percentualOver: true
  }
});
```

### Histórico H2H

```typescript
const historico = await prisma.partida.findMany({
  where: {
    OR: [
      { jogador1Id: jogador1Id, jogador2Id: jogador2Id },
      { jogador1Id: jogador2Id, jogador2Id: jogador1Id }
    ],
    status: 'FINALIZADA'
  },
  orderBy: { dataHora: 'desc' },
  take: 10
});
```

### Estatísticas do usuário

```typescript
const stats = await prisma.entrada.groupBy({
  by: ['resultado'],
  where: {
    userId: userId,
    status: 'FINALIZADA'
  },
  _count: true,
  _sum: { lucro: true }
});
```

---

## 🔒 Backup e Recovery

### Backup automático (Supabase)

O Supabase faz backup automático diário. Para backup manual:

```bash
# Exportar
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Importar
psql $DATABASE_URL < backup_20250203.sql
```

### Point-in-time Recovery

Disponível no plano Pro do Supabase.

---

*Última atualização: 03/02/2025*
