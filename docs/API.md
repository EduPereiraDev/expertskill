# 🔌 API Documentation - Expert Skills

> **Documentação completa da API REST**

---

## 📋 Informações Gerais

### Base URL

| Ambiente | URL |
|----------|-----|
| Desenvolvimento | `http://localhost:3001/api` |
| Produção | `https://api.expertskills.com.br/api` |

### Headers Padrão

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

### Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Acesso negado (plano insuficiente) |
| 404 | Não encontrado |
| 429 | Rate limit excedido |
| 500 | Erro interno |

### Rate Limiting

- **100 requisições por minuto** por IP/usuário
- Header `X-RateLimit-Remaining` indica requisições restantes

---

## 🔐 Autenticação

### POST /auth/register

Criar nova conta de usuário.

**Request:**

```json
{
  "email": "usuario@email.com",
  "password": "senhaSegura123",
  "name": "João Silva"
}
```

**Response (201):**

```json
{
  "message": "Conta criada com sucesso",
  "user": {
    "id": "clx123abc",
    "email": "usuario@email.com",
    "name": "João Silva",
    "plan": "FREE"
  }
}
```

**Erros:**

| Código | Mensagem |
|--------|----------|
| 400 | Email já cadastrado |
| 400 | Senha deve ter no mínimo 8 caracteres |

---

### POST /auth/login

Autenticar usuário.

**Request:**

```json
{
  "email": "usuario@email.com",
  "password": "senhaSegura123"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": {
    "id": "clx123abc",
    "email": "usuario@email.com",
    "name": "João Silva",
    "plan": "PRO",
    "avatar": null
  }
}
```

---

### POST /auth/refresh

Renovar access token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

---

### GET /auth/me

Obter dados do usuário autenticado.

**Response (200):**

```json
{
  "id": "clx123abc",
  "email": "usuario@email.com",
  "name": "João Silva",
  "avatar": null,
  "plan": "PRO",
  "planExpiresAt": "2025-03-03T00:00:00Z",
  "createdAt": "2025-02-03T00:00:00Z"
}
```

---

### POST /auth/logout

Invalidar refresh token.

**Response (200):**

```json
{
  "message": "Logout realizado com sucesso"
}
```

---

## 💰 Banca

### GET /banca

Obter banca ativa do usuário.

**Response (200):**

```json
{
  "id": "clx456def",
  "valor": 100.00,
  "metaDiaria": 30.00,
  "tipoGestao": "AGRESSIVA",
  "divisor": null,
  "stake": 10.00,
  "ativa": true,
  "calculado": {
    "entradasNecessarias": 3,
    "oddMinima": 1.50,
    "lucroEsperado": 8.00
  },
  "progressoHoje": {
    "entradas": 2,
    "greens": 1,
    "reds": 1,
    "lucro": 5.00,
    "percentualMeta": 16.67
  },
  "createdAt": "2025-02-03T10:00:00Z"
}
```

---

### POST /banca

Criar ou atualizar banca.

**Request:**

```json
{
  "valor": 100.00,
  "metaDiaria": 30.00,
  "tipoGestao": "AGRESSIVA"
}
```

**Tipos de Gestão:**

| Tipo | Divisor | Descrição |
|------|---------|-----------|
| AGRESSIVA | 10 | Divide banca por 10 |
| CONSERVADORA | 20 | Divide banca por 20 |
| PERSONALIZADA | custom | Usa divisor informado |

**Request (Personalizada):**

```json
{
  "valor": 100.00,
  "metaDiaria": 30.00,
  "tipoGestao": "PERSONALIZADA",
  "divisor": 15
}
```

**Response (201):**

```json
{
  "id": "clx456def",
  "valor": 100.00,
  "metaDiaria": 30.00,
  "tipoGestao": "AGRESSIVA",
  "stake": 10.00,
  "calculado": {
    "entradasNecessarias": 3,
    "oddMinima": 1.50
  }
}
```

---

### GET /banca/historico

Histórico de bancas do usuário.

**Query Parameters:**

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| page | number | 1 | Página |
| limit | number | 10 | Itens por página |

**Response (200):**

```json
{
  "data": [
    {
      "id": "clx456def",
      "valor": 100.00,
      "metaDiaria": 30.00,
      "tipoGestao": "AGRESSIVA",
      "ativa": true,
      "createdAt": "2025-02-03T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### POST /banca/entrada

Registrar entrada na banca.

**Request:**

```json
{
  "partidaId": "clx789ghi",
  "mercado": "Over 2.5 FT",
  "odd": 1.85,
  "resultado": "GREEN"
}
```

**Resultados:**

| Valor | Descrição |
|-------|-----------|
| GREEN | Entrada ganha |
| RED | Entrada perdida |
| REEMBOLSO | Entrada devolvida |

**Response (201):**

```json
{
  "id": "clx999xyz",
  "mercado": "Over 2.5 FT",
  "odd": 1.85,
  "stake": 10.00,
  "resultado": "GREEN",
  "lucro": 8.50,
  "bancaAtualizada": {
    "valorAtual": 108.50,
    "progressoMeta": 28.33
  }
}
```

---

## 📡 Radar

### GET /radar/jogos

Listar jogos classificados pelo radar.

**Query Parameters:**

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| liga | string | GT_12MIN | Liga a filtrar |
| status | string | - | AGENDADA, AO_VIVO, FINALIZADA |
| cenario | string | - | JOGO_FRACO, OVER_SEGURANDO, MELHOR_JOGO |

**Response (200):**

```json
{
  "jogos": [
    {
      "id": "clx789ghi",
      "jogador1": {
        "id": "clxj1",
        "nome": "Zohri",
        "mediaGolsFT": 2.8,
        "percentualOver": 78
      },
      "jogador2": {
        "id": "clxj2",
        "nome": "McShield",
        "mediaGolsFT": 2.5,
        "percentualOver": 72
      },
      "liga": "GT_12MIN",
      "dataHora": "2025-02-03T14:00:00Z",
      "status": "AGENDADA",
      "cenario": "MELHOR_JOGO",
      "indicador": "🟢",
      "analise": {
        "mediaGolsH2H": 3.2,
        "percentualOver": 78,
        "percentual0x0": 5,
        "ultimosResultados": ["3-2", "2-1", "4-0", "1-2", "3-1"]
      }
    }
  ],
  "atualizadoEm": "2025-02-03T13:55:00Z",
  "proximaAtualizacao": "2025-02-03T13:55:30Z"
}
```

---

### GET /radar/jogadores

Ranking de jogadores.

**Query Parameters:**

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| liga | string | GT_12MIN | Liga |
| limit | number | 10 | Quantidade |
| orderBy | string | mediaGolsFT | Campo para ordenar |

**Response (200):**

```json
{
  "jogadores": [
    {
      "posicao": 1,
      "id": "clxj1",
      "nome": "Zohri",
      "mediaGolsHT": 1.2,
      "mediaGolsFT": 2.8,
      "percentualOver": 78,
      "percentual0x0": 5,
      "ultimasPartidas": [
        { "resultado": "3-1", "data": "2025-02-03" },
        { "resultado": "2-0", "data": "2025-02-02" }
      ]
    }
  ],
  "atualizadoEm": "2025-02-03T13:55:00Z"
}
```

---

### GET /radar/confronto/:id

Detalhes de um confronto específico.

**Response (200):**

```json
{
  "id": "clx789ghi",
  "jogador1": {
    "nome": "Zohri",
    "mediaGolsFT": 2.8,
    "formRecente": ["W", "W", "L", "W", "W"]
  },
  "jogador2": {
    "nome": "McShield",
    "mediaGolsFT": 2.5,
    "formRecente": ["W", "L", "W", "W", "L"]
  },
  "historicoH2H": [
    {
      "data": "2025-02-01",
      "placar": "3-2",
      "golsHT": "1-1",
      "golsFT": "3-2"
    }
  ],
  "estatisticas": {
    "totalJogos": 15,
    "mediaGols": 3.2,
    "percentualOver25": 78,
    "percentual0x0": 5,
    "golsTardios": 23
  },
  "cenario": "MELHOR_JOGO",
  "recomendacao": {
    "mercado": "Over 2.5 FT",
    "confianca": "ALTA",
    "motivo": "Histórico favorável com média de 3.2 gols"
  }
}
```

---

## 🤖 Entradas

> **Requer plano PRO ou superior**

### GET /entradas

Listar entradas ativas/pendentes.

**Response (200):**

```json
{
  "entradas": [
    {
      "id": "clxe1",
      "partida": {
        "id": "clx789ghi",
        "jogador1": "Zohri",
        "jogador2": "McShield",
        "dataHora": "2025-02-03T14:00:00Z"
      },
      "mercado": "Over 2.5 FT",
      "odd": 1.85,
      "stake": 10.00,
      "confianca": "ALTA",
      "status": "PENDENTE",
      "analiseIA": "Confronto com histórico favorável...",
      "criadaEm": "2025-02-03T13:50:00Z"
    }
  ]
}
```

---

### GET /entradas/historico

Histórico de entradas.

**Query Parameters:**

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| page | number | 1 | Página |
| limit | number | 20 | Itens por página |
| resultado | string | - | GREEN, RED, REEMBOLSO |
| dataInicio | date | - | Filtro data início |
| dataFim | date | - | Filtro data fim |

**Response (200):**

```json
{
  "data": [
    {
      "id": "clxe1",
      "mercado": "Over 2.5 FT",
      "odd": 1.85,
      "stake": 10.00,
      "resultado": "GREEN",
      "lucro": 8.50,
      "partida": {
        "jogador1": "Zohri",
        "jogador2": "McShield",
        "placar": "3-1"
      },
      "criadaEm": "2025-02-03T13:50:00Z"
    }
  ],
  "estatisticas": {
    "totalEntradas": 50,
    "greens": 35,
    "reds": 15,
    "taxaAcerto": 70,
    "lucroTotal": 250.00,
    "roi": 25.00
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### POST /entradas/:id/confirmar

Confirmar que vai fazer a entrada.

**Response (200):**

```json
{
  "id": "clxe1",
  "status": "CONFIRMADA",
  "confirmedAt": "2025-02-03T13:55:00Z"
}
```

---

### POST /entradas/:id/resultado

Registrar resultado da entrada.

**Request:**

```json
{
  "resultado": "GREEN"
}
```

**Response (200):**

```json
{
  "id": "clxe1",
  "resultado": "GREEN",
  "lucro": 8.50,
  "status": "FINALIZADA",
  "bancaAtualizada": {
    "valor": 108.50,
    "progressoMeta": 28.33
  }
}
```

---

## 💳 Planos e Pagamentos

### GET /planos

Listar planos disponíveis.

**Response (200):**

```json
{
  "planos": [
    {
      "id": "BASICO",
      "nome": "Básico",
      "preco": 79.99,
      "features": [
        "Controle de Banca",
        "Dashboard",
        "Histórico de entradas"
      ]
    },
    {
      "id": "PRO",
      "nome": "Pro",
      "preco": 99.99,
      "popular": true,
      "features": [
        "Tudo do Básico",
        "Radar em tempo real",
        "Alertas Telegram"
      ]
    },
    {
      "id": "EXPERT",
      "nome": "Expert",
      "preco": 149.99,
      "features": [
        "Tudo do Pro",
        "Entradas Expert (Bot)",
        "Análise com IA",
        "Suporte prioritário"
      ]
    }
  ]
}
```

---

### POST /checkout

Criar sessão de checkout (Stripe).

**Request:**

```json
{
  "plano": "PRO"
}
```

**Response (200):**

```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

---

### GET /assinatura

Obter assinatura atual.

**Response (200):**

```json
{
  "id": "clxa1",
  "plano": "PRO",
  "status": "ATIVA",
  "inicioEm": "2025-02-03T00:00:00Z",
  "fimEm": "2025-03-03T00:00:00Z",
  "proximaCobranca": "2025-03-03T00:00:00Z",
  "cancelarEm": null
}
```

---

### POST /assinatura/cancelar

Cancelar assinatura (ao final do período).

**Response (200):**

```json
{
  "message": "Assinatura será cancelada em 2025-03-03",
  "cancelarEm": "2025-03-03T00:00:00Z"
}
```

---

## 🔔 Webhooks

### POST /webhook/stripe

Webhook para eventos do Stripe.

**Headers:**

```http
Stripe-Signature: t=1234567890,v1=...
```

**Eventos tratados:**

| Evento | Ação |
|--------|------|
| checkout.session.completed | Ativa assinatura |
| customer.subscription.updated | Atualiza plano |
| customer.subscription.deleted | Cancela assinatura |
| invoice.payment_failed | Marca como pendente |

---

## 📊 Tipos e Enums

### TipoGestao

```typescript
enum TipoGestao {
  AGRESSIVA = "AGRESSIVA",
  CONSERVADORA = "CONSERVADORA",
  PERSONALIZADA = "PERSONALIZADA"
}
```

### Liga

```typescript
enum Liga {
  GT_12MIN = "GT_12MIN",
  VOLTA_6MIN = "VOLTA_6MIN",
  H2H = "H2H",
  GT_8MIN = "GT_8MIN"
}
```

### Cenario

```typescript
enum Cenario {
  JOGO_FRACO = "JOGO_FRACO",       // 🔴
  OVER_SEGURANDO = "OVER_SEGURANDO", // 🟡
  MELHOR_JOGO = "MELHOR_JOGO"      // 🟢
}
```

### NivelConfianca

```typescript
enum NivelConfianca {
  BAIXA = "BAIXA",
  MEDIA = "MEDIA",
  ALTA = "ALTA"
}
```

### ResultadoEntrada

```typescript
enum ResultadoEntrada {
  GREEN = "GREEN",
  RED = "RED",
  REEMBOLSO = "REEMBOLSO"
}
```

### Plan

```typescript
enum Plan {
  FREE = "FREE",
  BASICO = "BASICO",
  PRO = "PRO",
  EXPERT = "EXPERT"
}
```

---

## 🔒 Permissões por Plano

| Endpoint | FREE | BÁSICO | PRO | EXPERT |
|----------|------|--------|-----|--------|
| /auth/* | ✅ | ✅ | ✅ | ✅ |
| /banca | ❌ | ✅ | ✅ | ✅ |
| /radar/jogos | ❌ | ❌ | ✅ | ✅ |
| /radar/jogadores | ❌ | ❌ | ✅ | ✅ |
| /entradas | ❌ | ❌ | ❌ | ✅ |
| /entradas (com IA) | ❌ | ❌ | ❌ | ✅ |

---

*Última atualização: 03/02/2025*
