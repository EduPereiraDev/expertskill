# 📐 ESPECIFICAÇÕES TÉCNICAS - Expert Skills

> **Documento de especificações técnicas detalhadas para implementação**

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Banco de Dados](#banco-de-dados)
3. [API REST](#api-rest)
4. [Módulos do Sistema](#módulos-do-sistema)
5. [Integrações](#integrações)
6. [Segurança](#segurança)
7. [Performance](#performance)

---

## 🏗️ Visão Geral da Arquitetura

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Next.js 14 (Vercel)                         │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │  Auth    │ │Dashboard │ │  Banca   │ │  Radar   │           │    │
│  │  │  Pages   │ │  Home    │ │  Module  │ │  Module  │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  │                         │                                       │    │
│  │  ┌──────────────────────┴──────────────────────────┐           │    │
│  │  │              Zustand + React Query               │           │    │
│  │  └──────────────────────┬──────────────────────────┘           │    │
│  └─────────────────────────┼───────────────────────────────────────┘    │
└────────────────────────────┼────────────────────────────────────────────┘
                             │ HTTPS/WSS
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              SERVIDOR                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     NestJS (Railway)                            │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │  Auth    │ │  Banca   │ │  Radar   │ │ Entradas │           │    │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  │                         │                                       │    │
│  │  ┌──────────────────────┴──────────────────────────┐           │    │
│  │  │                    Prisma ORM                    │           │    │
│  │  └──────────────────────┬──────────────────────────┘           │    │
│  └─────────────────────────┼───────────────────────────────────────┘    │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   PostgreSQL     │ │    Redis     │ │   External APIs  │
│   (Supabase)     │ │  (Upstash)   │ │  (OpenAI, etc)   │
└──────────────────┘ └──────────────┘ └──────────────────┘
```

### Fluxo de Dados

```
1. Usuário acessa o frontend (Next.js)
2. Frontend faz requisição para API (NestJS)
3. API valida JWT e processa requisição
4. Prisma executa queries no PostgreSQL
5. Redis cacheia dados frequentes
6. Resposta retorna ao frontend
7. Zustand/React Query atualiza estado
```

---

## 🗄️ Banco de Dados

### Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== USUÁRIOS ====================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String?
  avatar        String?
  role          Role      @default(USER)
  plan          Plan      @default(FREE)
  planExpiresAt DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relações
  bancas        Banca[]
  entradas      Entrada[]
  assinaturas   Assinatura[]
  refreshTokens RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}

enum Role {
  USER
  ADMIN
}

enum Plan {
  FREE
  BASICO
  PRO
  EXPERT
}

// ==================== BANCA ====================

model Banca {
  id           String      @id @default(cuid())
  userId       String
  valor        Float
  metaDiaria   Float
  tipoGestao   TipoGestao
  divisor      Int?        // Para gestão personalizada
  stake        Float       // Calculado automaticamente
  ativa        Boolean     @default(true)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  entradas Entrada[]

  @@map("bancas")
}

enum TipoGestao {
  AGRESSIVA     // Divide por 10
  CONSERVADORA  // Divide por 20
  PERSONALIZADA // Divisor customizado
}

// ==================== ENTRADAS ====================

model Entrada {
  id           String         @id @default(cuid())
  userId       String
  bancaId      String
  partidaId    String?
  mercado      String         // Ex: "Over 2.5 FT"
  odd          Float
  stake        Float
  resultado    ResultadoEntrada?
  lucro        Float?
  status       StatusEntrada  @default(PENDENTE)
  confianca    NivelConfianca
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  banca   Banca    @relation(fields: [bancaId], references: [id])
  partida Partida? @relation(fields: [partidaId], references: [id])

  @@map("entradas")
}

enum StatusEntrada {
  PENDENTE
  CONFIRMADA
  FINALIZADA
  CANCELADA
}

enum ResultadoEntrada {
  GREEN
  RED
  REEMBOLSO
}

enum NivelConfianca {
  BAIXA
  MEDIA
  ALTA
}

// ==================== JOGADORES E PARTIDAS ====================

model Jogador {
  id              String    @id @default(cuid())
  nome            String
  apelido         String?
  liga            Liga
  mediaGolsHT     Float     @default(0)
  mediaGolsFT     Float     @default(0)
  percentualOver  Float     @default(0)
  percentual0x0   Float     @default(0)
  ultimaAtualizacao DateTime @default(now())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  partidasComoJogador1 Partida[] @relation("Jogador1")
  partidasComoJogador2 Partida[] @relation("Jogador2")

  @@unique([nome, liga])
  @@map("jogadores")
}

model Partida {
  id           String        @id @default(cuid())
  jogador1Id   String
  jogador2Id   String
  liga         Liga
  dataHora     DateTime
  golsHT1      Int?          // Gols jogador 1 no HT
  golsHT2      Int?          // Gols jogador 2 no HT
  golsFT1      Int?          // Gols jogador 1 no FT
  golsFT2      Int?          // Gols jogador 2 no FT
  status       StatusPartida @default(AGENDADA)
  cenario      Cenario?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  jogador1 Jogador   @relation("Jogador1", fields: [jogador1Id], references: [id])
  jogador2 Jogador   @relation("Jogador2", fields: [jogador2Id], references: [id])
  entradas Entrada[]

  @@map("partidas")
}

enum Liga {
  GT_12MIN      // Grade principal (12 minutos)
  VOLTA_6MIN    // Grade volta (6 minutos)
  H2H           // Head to Head
  GT_8MIN       // Grade 8 minutos (não usar)
}

enum StatusPartida {
  AGENDADA
  AO_VIVO
  FINALIZADA
  CANCELADA
}

enum Cenario {
  JOGO_FRACO      // 🔴 Evitar
  OVER_SEGURANDO  // 🟡 Cautela
  MELHOR_JOGO     // 🟢 Operar
}

// ==================== PAGAMENTOS ====================

model Assinatura {
  id                String   @id @default(cuid())
  userId            String
  stripeCustomerId  String?
  stripeSubscriptionId String?
  plano             Plan
  status            StatusAssinatura
  inicioEm          DateTime
  fimEm             DateTime
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("assinaturas")
}

enum StatusAssinatura {
  ATIVA
  CANCELADA
  EXPIRADA
  PENDENTE
}
```

### Índices Recomendados

```sql
-- Índices para performance
CREATE INDEX idx_entradas_user_created ON entradas(user_id, created_at DESC);
CREATE INDEX idx_partidas_data ON partidas(data_hora);
CREATE INDEX idx_partidas_status ON partidas(status);
CREATE INDEX idx_jogadores_liga ON jogadores(liga);
```

---

## 🔌 API REST

### Base URL

- **Desenvolvimento**: `http://localhost:3001/api`
- **Produção**: `https://api.expertskills.com.br/api`

### Autenticação

Todas as rotas (exceto auth) requerem header:

```
Authorization: Bearer <access_token>
```

### Endpoints

#### Auth

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| POST | `/auth/register` | Criar conta | `{ email, password, name }` |
| POST | `/auth/login` | Login | `{ email, password }` |
| POST | `/auth/refresh` | Renovar token | `{ refreshToken }` |
| POST | `/auth/logout` | Logout | - |
| GET | `/auth/me` | Dados do usuário | - |

**Response Login**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx123...",
    "email": "user@email.com",
    "name": "João",
    "plan": "PRO"
  }
}
```

#### Banca

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| GET | `/banca` | Obter banca ativa | - |
| POST | `/banca` | Criar/atualizar banca | `{ valor, metaDiaria, tipoGestao, divisor? }` |
| GET | `/banca/historico` | Histórico de bancas | - |
| POST | `/banca/entrada` | Registrar entrada | `{ partidaId, mercado, odd, resultado? }` |

**Response Banca**:

```json
{
  "id": "clx123...",
  "valor": 100.00,
  "metaDiaria": 30.00,
  "tipoGestao": "AGRESSIVA",
  "stake": 10.00,
  "entradasNecessarias": 3,
  "oddMinima": 1.50,
  "progressoHoje": {
    "entradas": 2,
    "lucro": 15.00,
    "percentual": 50
  }
}
```

#### Radar

| Método | Endpoint | Descrição | Query |
|--------|----------|-----------|-------|
| GET | `/radar/jogos` | Jogos classificados | `?liga=GT_12MIN&status=AO_VIVO` |
| GET | `/radar/jogadores` | Ranking jogadores | `?liga=GT_12MIN&limit=10` |
| GET | `/radar/confronto/:id` | Detalhes do confronto | - |

**Response Jogos**:

```json
{
  "jogos": [
    {
      "id": "clx123...",
      "jogador1": { "nome": "Zohri", "mediaGols": 2.8 },
      "jogador2": { "nome": "McShield", "mediaGols": 2.5 },
      "liga": "GT_12MIN",
      "dataHora": "2025-02-03T14:00:00Z",
      "cenario": "MELHOR_JOGO",
      "indicador": "🟢",
      "analise": {
        "mediaGolsH2H": 3.2,
        "percentualOver": 78,
        "ultimosResultados": ["3-2", "2-1", "4-0"]
      }
    }
  ],
  "atualizadoEm": "2025-02-03T13:55:00Z"
}
```

#### Entradas

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| GET | `/entradas` | Entradas ativas | - |
| GET | `/entradas/historico` | Histórico | `?page=1&limit=20` |
| POST | `/entradas/:id/confirmar` | Confirmar entrada | - |
| POST | `/entradas/:id/resultado` | Registrar resultado | `{ resultado: "GREEN" }` |

**Response Entradas**:

```json
{
  "entradas": [
    {
      "id": "clx123...",
      "partida": {
        "jogador1": "Zohri",
        "jogador2": "McShield"
      },
      "mercado": "Over 2.5 FT",
      "odd": 1.85,
      "stake": 10.00,
      "confianca": "ALTA",
      "status": "PENDENTE",
      "criadaEm": "2025-02-03T13:50:00Z"
    }
  ]
}
```

#### Planos

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| GET | `/planos` | Listar planos | - |
| POST | `/checkout` | Criar sessão Stripe | `{ plano: "PRO" }` |
| POST | `/webhook/stripe` | Webhook Stripe | - |

---

## 🧩 Módulos do Sistema

### Módulo de Banca - Lógica de Negócio

```typescript
// src/modules/banca/banca.service.ts

interface ConfiguracaoBanca {
  valor: number;
  metaDiaria: number;
  tipoGestao: TipoGestao;
  divisor?: number;
}

interface CalculoGestao {
  stake: number;
  entradasNecessarias: number;
  oddMinima: number;
}

class BancaService {
  calcularGestao(config: ConfiguracaoBanca): CalculoGestao {
    // Determinar divisor baseado no tipo de gestão
    const divisor = this.getDivisor(config);
    
    // Calcular stake
    const stake = config.valor / divisor;
    
    // Calcular entradas necessárias (assumindo 80% de lucro médio)
    const lucroMedioPorEntrada = stake * 0.8;
    const entradasNecessarias = Math.ceil(config.metaDiaria / lucroMedioPorEntrada);
    
    // Calcular odd mínima para atingir meta
    const oddMinima = 1 + (config.metaDiaria / (stake * entradasNecessarias));
    
    return {
      stake: Number(stake.toFixed(2)),
      entradasNecessarias,
      oddMinima: Number(oddMinima.toFixed(2))
    };
  }

  private getDivisor(config: ConfiguracaoBanca): number {
    switch (config.tipoGestao) {
      case 'AGRESSIVA':
        return 10;
      case 'CONSERVADORA':
        return 20;
      case 'PERSONALIZADA':
        return config.divisor || 10;
      default:
        return 10;
    }
  }
}
```

### Módulo de Radar - Algoritmo de Classificação

```typescript
// src/modules/radar/radar.service.ts

interface DadosAnalise {
  jogador1: Jogador;
  jogador2: Jogador;
  historicoH2H: Partida[];
  ultimasPartidasJ1: Partida[];
  ultimasPartidasJ2: Partida[];
}

class RadarService {
  classificarJogo(dados: DadosAnalise): Cenario {
    const metricas = this.calcularMetricas(dados);
    
    // CENÁRIO 1: Jogo Fraco (🔴 Evitar)
    if (this.isJogoFraco(metricas)) {
      return Cenario.JOGO_FRACO;
    }
    
    // CENÁRIO 3: Melhor Jogo (🟢 Operar)
    if (this.isMelhorJogo(metricas)) {
      return Cenario.MELHOR_JOGO;
    }
    
    // CENÁRIO 2: Over Segurando (🟡 Cautela)
    return Cenario.OVER_SEGURANDO;
  }

  private calcularMetricas(dados: DadosAnalise) {
    return {
      mediaGolsH2H: this.calcularMediaGols(dados.historicoH2H),
      percentual0x0: this.calcularPercentual0x0(dados.historicoH2H),
      tendenciaOver: this.calcularTendenciaOver(dados),
      consistencia: this.calcularConsistencia(dados),
      golsTardios: this.identificarGolsTardios(dados.historicoH2H)
    };
  }

  private isJogoFraco(metricas: any): boolean {
    return (
      metricas.percentual0x0 > 30 ||
      metricas.mediaGolsH2H < 1.5 ||
      metricas.consistencia < 40
    );
  }

  private isMelhorJogo(metricas: any): boolean {
    return (
      metricas.mediaGolsH2H > 3 &&
      metricas.tendenciaOver > 70 &&
      metricas.consistencia > 70
    );
  }

  private calcularMediaGols(partidas: Partida[]): number {
    if (partidas.length === 0) return 0;
    
    const totalGols = partidas.reduce((acc, p) => {
      return acc + (p.golsFT1 || 0) + (p.golsFT2 || 0);
    }, 0);
    
    return totalGols / partidas.length;
  }

  private calcularPercentual0x0(partidas: Partida[]): number {
    if (partidas.length === 0) return 0;
    
    const jogos0x0 = partidas.filter(p => 
      p.golsFT1 === 0 && p.golsFT2 === 0
    ).length;
    
    return (jogos0x0 / partidas.length) * 100;
  }

  private calcularTendenciaOver(dados: DadosAnalise): number {
    const todasPartidas = [
      ...dados.ultimasPartidasJ1,
      ...dados.ultimasPartidasJ2
    ];
    
    const partidasOver = todasPartidas.filter(p => 
      (p.golsFT1 || 0) + (p.golsFT2 || 0) > 2.5
    ).length;
    
    return (partidasOver / todasPartidas.length) * 100;
  }
}
```

### Módulo de Entradas - Geração com IA

```typescript
// src/modules/entradas/entradas.service.ts

import OpenAI from 'openai';

class EntradasService {
  private openai: OpenAI;

  async gerarEntrada(partidaId: string, userId: string): Promise<Entrada> {
    // 1. Buscar dados da partida e jogadores
    const partida = await this.getPartidaComDados(partidaId);
    
    // 2. Buscar configuração de banca do usuário
    const banca = await this.bancaService.getBancaAtiva(userId);
    
    // 3. Classificar jogo
    const cenario = await this.radarService.classificarJogo(partida);
    
    // 4. Gerar análise com IA (opcional, para plano Expert)
    const analiseIA = await this.analisarComIA(partida);
    
    // 5. Determinar mercado e odd
    const { mercado, odd } = this.determinarMercado(partida, cenario);
    
    // 6. Criar entrada
    return this.prisma.entrada.create({
      data: {
        userId,
        bancaId: banca.id,
        partidaId,
        mercado,
        odd,
        stake: banca.stake,
        confianca: this.mapCenarioParaConfianca(cenario),
        status: 'PENDENTE'
      }
    });
  }

  private async analisarComIA(partida: any): Promise<string> {
    const prompt = `
      Analise a partida de eSoccer FIFA:
      Jogador 1: ${partida.jogador1.nome} (média ${partida.jogador1.mediaGolsFT} gols)
      Jogador 2: ${partida.jogador2.nome} (média ${partida.jogador2.mediaGolsFT} gols)
      Histórico H2H: ${JSON.stringify(partida.historicoH2H.slice(0, 5))}
      
      Forneça uma análise breve (máximo 100 palavras) sobre:
      1. Tendência de gols
      2. Melhor mercado para entrada
      3. Nível de confiança
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200
    });

    return response.choices[0].message.content || '';
  }

  private determinarMercado(partida: any, cenario: Cenario): { mercado: string; odd: number } {
    switch (cenario) {
      case Cenario.MELHOR_JOGO:
        return { mercado: 'Over 2.5 FT', odd: 1.85 };
      case Cenario.OVER_SEGURANDO:
        return { mercado: 'Over 1.5 FT', odd: 1.45 };
      case Cenario.JOGO_FRACO:
        return { mercado: 'Under 2.5 FT', odd: 1.90 };
      default:
        return { mercado: 'Over 2.5 FT', odd: 1.85 };
    }
  }
}
```

---

## 🔗 Integrações

### OpenAI API

```typescript
// src/common/openai.service.ts

import OpenAI from 'openai';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analisar(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Você é um analista especializado em eSoccer FIFA. Forneça análises objetivas e concisas.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    return response.choices[0].message.content || '';
  }
}
```

### Stripe

```typescript
// src/modules/pagamentos/stripe.service.ts

import Stripe from 'stripe';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
  }

  async criarCheckoutSession(userId: string, plano: Plan): Promise<string> {
    const precos = {
      BASICO: process.env.STRIPE_PRICE_BASICO,
      PRO: process.env.STRIPE_PRICE_PRO,
      EXPERT: process.env.STRIPE_PRICE_EXPERT
    };

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: precos[plano],
          quantity: 1
        }
      ],
      success_url: `${process.env.FRONTEND_URL}/pagamento/sucesso`,
      cancel_url: `${process.env.FRONTEND_URL}/pagamento/cancelado`,
      metadata: { userId, plano }
    });

    return session.url!;
  }

  async processarWebhook(payload: Buffer, signature: string): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.ativarAssinatura(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.cancelarAssinatura(event.data.object);
        break;
    }
  }
}
```

### Telegram Bot

```typescript
// src/modules/notificacoes/telegram.service.ts

import TelegramBot from 'node-telegram-bot-api';

export class TelegramService {
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
      polling: false
    });
  }

  async enviarEntrada(chatId: string, entrada: Entrada): Promise<void> {
    const mensagem = `
⚡ *ENTRADA EXPERT*

🎮 ${entrada.partida.jogador1.nome} vs ${entrada.partida.jogador2.nome}
📍 Liga: GT 12min

📈 *Mercado*: ${entrada.mercado}
💰 *Odd*: ${entrada.odd}
🎯 *Stake*: R$ ${entrada.stake.toFixed(2)}

${this.getIndicadorConfianca(entrada.confianca)}

_Boa sorte! 🍀_
    `;

    await this.bot.sendMessage(chatId, mensagem, {
      parse_mode: 'Markdown'
    });
  }

  private getIndicadorConfianca(confianca: NivelConfianca): string {
    switch (confianca) {
      case 'ALTA':
        return '🟢 Confiança: ALTA';
      case 'MEDIA':
        return '🟡 Confiança: MÉDIA';
      case 'BAIXA':
        return '🔴 Confiança: BAIXA';
    }
  }
}
```

---

## 🔒 Segurança

### Autenticação JWT

```typescript
// src/modules/auth/jwt.strategy.ts

import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      plan: payload.plan
    };
  }
}
```

### Rate Limiting

```typescript
// src/common/rate-limit.guard.ts

import { ThrottlerGuard } from '@nestjs/throttler';

// Configuração no app.module.ts
ThrottlerModule.forRoot({
  ttl: 60,      // 60 segundos
  limit: 100    // 100 requisições por minuto
})
```

### Variáveis de Ambiente

```env
# .env.example

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/expertskill"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="sua-chave-secreta-muito-segura"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_BASICO="price_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_EXPERT="price_..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Telegram
TELEGRAM_BOT_TOKEN="123456:ABC..."

# URLs
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"
```

---

## ⚡ Performance

### Caching com Redis

```typescript
// src/common/cache.service.ts

import { Redis } from 'ioredis';

export class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Uso no RadarService
async getJogosClassificados(liga: Liga) {
  const cacheKey = `radar:jogos:${liga}`;
  
  // Tentar cache primeiro
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;
  
  // Buscar do banco
  const jogos = await this.buscarEClassificarJogos(liga);
  
  // Cachear por 30 segundos
  await this.cache.set(cacheKey, jogos, 30);
  
  return jogos;
}
```

### Otimizações de Query

```typescript
// Usar select para trazer apenas campos necessários
const jogadores = await prisma.jogador.findMany({
  where: { liga: 'GT_12MIN' },
  select: {
    id: true,
    nome: true,
    mediaGolsFT: true
  },
  orderBy: { mediaGolsFT: 'desc' },
  take: 10
});

// Usar include com cuidado
const partida = await prisma.partida.findUnique({
  where: { id: partidaId },
  include: {
    jogador1: {
      select: { nome: true, mediaGolsFT: true }
    },
    jogador2: {
      select: { nome: true, mediaGolsFT: true }
    }
  }
});
```

---

## 📊 Métricas e Monitoramento

### Health Check

```typescript
// src/health/health.controller.ts

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  @Get('db')
  async checkDb() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: 'ok' };
    } catch {
      return { database: 'error' };
    }
  }
}
```

---

*Última atualização: 03/02/2025*
