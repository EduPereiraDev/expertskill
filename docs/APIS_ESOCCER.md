# 📊 Documentação de APIs para eSoccer/eSports

> **Última atualização:** Fevereiro 2026  
> **Objetivo:** Alimentar a aplicação Expert Skills com dados de eSoccer em tempo real  
> **Versão:** 2.0 - Análise Aprofundada

---

## 🚨 RESUMO EXECUTIVO

Após análise aprofundada, identificamos que **OddsMatrix** é a API mais completa para eSoccer, com **64 competições FIFA** e **36 mercados de apostas**. A **BetsAPI** continua sendo uma boa opção custo-benefício, mas com preços não transparentes.

---

## 🏆 Ranking Geral das APIs (ATUALIZADO)

| # | API | Cobertura eSoccer | Preço | Transparência | Recomendação |
|---|-----|-------------------|-------|---------------|--------------|
| 1 | **OddsMatrix** | ⭐⭐⭐⭐⭐ | Trial grátis | ⚠️ Sob consulta | 🥇 **MAIS COMPLETA** |
| 2 | **BetsAPI** | ⭐⭐⭐⭐⭐ | ~$50-100/mês | ❌ Não transparente | � **CUSTO-BENEFÍCIO** |
| 3 | **Football Betting Odds (RapidAPI)** | ⭐⭐⭐⭐ | $0-200/mês | ✅ Transparente | � **ALTERNATIVA** |
| 4 | **AllSportsAPI** | ⭐⭐⭐ | $74-149/mês | ✅ Transparente | Alternativa |
| 5 | **Sportradar** | ⭐⭐⭐⭐⭐ | $500+/mês | ⚠️ Enterprise | Enterprise |
| 6 | **Goalserve** | ⭐⭐⭐ | $100/mês | ✅ Transparente | Alternativa |
| 7 | **API-Football** | ⭐⭐ | $19/mês | ✅ Transparente | Futebol Real apenas |
| 8 | **PandaScore** | ⭐⭐⭐⭐ | €150/mês | ✅ Transparente | eSports (não FIFA) |

---

## 1. BetsAPI 🥇

**Website:** https://betsapi.com  
**Recomendação:** ⭐⭐⭐⭐⭐ **MELHOR OPÇÃO PARA NOSSO PROJETO**

### Cobertura eSoccer
- ✅ **eSoccer FIFA Esports** (Liga completa)
- ✅ **eSoccer Battle** (8, 10, 12 minutos)
- ✅ **Live Arena**
- ✅ **Liga Pro**
- ✅ Odds em tempo real (Bet365, Pinnacle, 1xBet)
- ✅ Resultados e estatísticas

### Preços
| Plano | Requests/dia | Preço |
|-------|--------------|-------|
| Free | 500 | $0 |
| Basic | 3.600 | $19/mês |
| Standard | 14.400 | $49/mês |
| Pro | 36.000 | $99/mês |
| Enterprise | Ilimitado | Sob consulta |

### Endpoints Relevantes
```
GET /v3/events/inplay          # Jogos ao vivo
GET /v3/events/upcoming        # Próximos jogos
GET /v3/event/odds             # Odds do evento
GET /v3/event/stats            # Estatísticas
GET /v3/event/history          # Histórico H2H
```

### Prós
- ✅ Cobertura específica de eSoccer FIFA
- ✅ Preço acessível
- ✅ Odds de múltiplas casas
- ✅ Dados em tempo real
- ✅ API REST simples

### Contras
- ❌ Documentação poderia ser melhor
- ❌ Sem WebSocket (polling necessário)

---

## 2. OddsMatrix 🥈

**Website:** https://oddsmatrix.com  
**Recomendação:** ⭐⭐⭐⭐⭐ **MAIS COMPLETA PARA eSoccer**

### Cobertura eSoccer
- ✅ **64 competições FIFA**
- ✅ **4.913 eventos live/ano**
- ✅ **4.224 eventos pre-live/ano**
- ✅ **36 mercados de apostas**
- ✅ eSoccer Battle (8, 10, 12 min)
- ✅ Live Arena
- ✅ Champions VOLTA League
- ✅ FC 24 Championships

### Mercados Disponíveis
- Total Goals Over/Under
- Home – Draw – Away
- Both Teams to Score
- Asian Handicap
- Correct Score
- Double Chance
- Half Time / Full Time
- Race To X Goals
- E mais 28 mercados...

### Preços
| Plano | Descrição | Preço |
|-------|-----------|-------|
| Trial | 30 dias grátis | $0 |
| Standard | Sob consulta | ~$200-500/mês |
| Enterprise | Sob consulta | $1000+/mês |

### Formatos
- XML Feeds
- JSON API
- Push (real-time)
- Pull (on-demand)

### Prós
- ✅ Cobertura mais completa de eSoccer
- ✅ 36 mercados de apostas
- ✅ Dados pre-match e live
- ✅ Alta precisão
- ✅ Suporte 24/7

### Contras
- ❌ Preço não transparente
- ❌ Necessita contato comercial
- ❌ Mais voltado para B2B

---

## 3. The Odds API 🥉

**Website:** https://the-odds-api.com  
**Recomendação:** ⭐⭐⭐⭐ **MELHOR PARA COMPARAÇÃO DE ODDS**

### Cobertura
- ✅ Odds de 40+ casas de apostas
- ✅ Esports (limitado)
- ⚠️ eSoccer não é foco principal

### Casas de Apostas
- DraftKings, FanDuel, BetMGM (US)
- Bet365, William Hill, Ladbrokes (UK)
- Pinnacle, 1xBet, Betfair (EU)
- Sportsbet, TAB, Neds (AU)

### Preços
| Plano | Requests/mês | Preço |
|-------|--------------|-------|
| Free | 500 | $0 |
| Starter | 10.000 | $19/mês |
| Standard | 50.000 | $49/mês |
| Pro | 250.000 | $149/mês |

### Prós
- ✅ Muitas casas de apostas
- ✅ Preço acessível
- ✅ API simples
- ✅ Histórico de odds

### Contras
- ❌ Cobertura limitada de eSoccer
- ❌ Foco em esportes tradicionais

---

## 4. Sportradar

**Website:** https://sportradar.com  
**Recomendação:** ⭐⭐⭐⭐⭐ **ENTERPRISE - LÍDER DE MERCADO**

### Cobertura
- ✅ 80+ esportes
- ✅ 500+ ligas
- ✅ 750.000+ eventos/ano
- ✅ eSports incluído
- ✅ Dados oficiais de ligas

### Preços
| Plano | Descrição | Preço |
|-------|-----------|-------|
| Trial | 30 dias | Grátis |
| Starter | Básico | ~$500/mês |
| Pro | Completo | ~$1.000-5.000/mês |
| Enterprise | Custom | Sob consulta |

### Prós
- ✅ Líder mundial em dados esportivos
- ✅ Dados oficiais
- ✅ Suporte 24/7
- ✅ Alta confiabilidade

### Contras
- ❌ Preço muito alto
- ❌ Overkill para projetos menores
- ❌ Processo de contratação longo

---

## 5. Goalserve

**Website:** https://goalserve.com  
**Recomendação:** ⭐⭐⭐ **ALTERNATIVA ACESSÍVEL**

### Cobertura eSports
- ✅ CS:GO
- ✅ Dota 2
- ✅ League of Legends
- ⚠️ FIFA/eSoccer limitado

### Preços
| Plano | Duração | Preço |
|-------|---------|-------|
| Mensal | 1 mês | $100 |
| Semestral | 6 meses | $500 |
| Anual | 12 meses | $1.000 |

### Prós
- ✅ Preço fixo
- ✅ Suporte 24/7
- ✅ Dados de odds

### Contras
- ❌ Cobertura eSoccer limitada
- ❌ Foco em outros eSports

---

## 6. API-Football

**Website:** https://api-football.com  
**Recomendação:** ⭐⭐ **APENAS FUTEBOL REAL**

### Cobertura
- ✅ 1.000+ ligas de futebol real
- ❌ **NÃO COBRE eSoccer**

### Preços
| Plano | Requests/dia | Preço |
|-------|--------------|-------|
| Free | 100 | $0 |
| Pro | 7.500 | $19/mês |
| Ultra | 75.000 | $29/mês |
| Mega | 150.000 | $39/mês |

### Nota
Útil apenas se quisermos adicionar dados de futebol real para comparação ou análise complementar.

---

## 7. PandaScore

**Website:** https://pandascore.co  
**Recomendação:** ⭐⭐⭐⭐ **MELHOR PARA eSPORTS (não FIFA)**

### Cobertura
- ✅ League of Legends
- ✅ CS:GO / CS2
- ✅ Dota 2
- ✅ Valorant
- ⚠️ **FIFA limitado**

### Preços
| Plano | Requests/hora | Preço |
|-------|---------------|-------|
| Free | 1.000 | $0 |
| Historical | 10.000 | €150/mês |
| Real-time | 10.000+ | €500/mês |
| Betting | Custom | Sob consulta |

### Nota
⚠️ **Planos de estatísticas NÃO são permitidos para uso em apostas.** Necessário contato comercial para uso betting-related.

---

## 📋 Recomendação Final

### Para o Expert Skills, recomendo:

#### Opção 1: **BetsAPI** (Recomendado)
- **Custo:** $19-99/mês
- **Motivo:** Melhor custo-benefício, cobertura específica de eSoccer FIFA, odds em tempo real
- **Implementação:** Fácil, API REST

#### Opção 2: **OddsMatrix** (Premium)
- **Custo:** ~$200-500/mês
- **Motivo:** Cobertura mais completa, 36 mercados, dados precisos
- **Implementação:** Média, necessita contato comercial

#### Opção 3: **Combinação**
- **BetsAPI** para dados de jogos e odds básicas
- **The Odds API** para comparação de odds entre casas

---

## 🔧 Próximos Passos

1. **Criar conta trial** na BetsAPI
2. **Testar endpoints** de eSoccer
3. **Validar cobertura** das ligas que precisamos
4. **Implementar integração** no backend
5. **Configurar cache** para otimizar requests

---

## 📞 Contatos

| API | Email | Trial |
|-----|-------|-------|
| BetsAPI | support@betsapi.com | [Dashboard](https://betsapi.com/mm/vip) |
| OddsMatrix | sales@oddsmatrix.com | [Free Trial](https://oddsmatrix.com/) |
| The Odds API | team@the-odds-api.com | [Sign Up](https://the-odds-api.com/) |
| Sportradar | - | [Marketplace](https://marketplace.sportradar.com/) |

---

---

## 🆕 NOVAS ALTERNATIVAS DESCOBERTAS

### Football Betting Odds (RapidAPI)

**Website:** https://rapidapi.com/betodds-betodds-default/api/football-betting-odds1  
**Recomendação:** ⭐⭐⭐⭐ **PREÇOS TRANSPARENTES**

#### Preços (RapidAPI)

| Plano | Requests/mês | Preço |
|-------|--------------|-------|
| BASIC | 1.000 | $0 (grátis) |
| PRO | 500.000/dia | $100/mês |
| ULTRA | 1.000.000/dia | $150/mês |
| MEGA | 2.000.000/dia | $200/mês |

#### Endpoints

```
GET /{provider}/live/inplaying    # Jogos ao vivo
GET /{provider}/live/upcoming     # Próximos jogos
GET /{provider}/live/match/{id}   # Detalhes do jogo
```

#### Prós

- ✅ Preços 100% transparentes
- ✅ Plano gratuito disponível
- ✅ Via RapidAPI (fácil integração)
- ✅ Odds de múltiplos providers

#### Contras

- ❌ Cobertura eSoccer não confirmada
- ❌ Documentação limitada

---

### AllSportsAPI

**Website:** https://allsportsapi.com  
**Recomendação:** ⭐⭐⭐ **ALTERNATIVA ACESSÍVEL**

#### Preços

| Plano | Requests/hora | Preço |
|-------|---------------|-------|
| FREE | 260 | $0 |
| EUROPEAN | 2.000 | $74/mês |
| WORLD WIDE | 2.000 | $111/mês |
| ULTIMATE | 100.000 | $149/mês |

#### Recursos

- ✅ WebSockets disponível
- ✅ Live Odds
- ✅ 800+ ligas
- ✅ Trial de 14 dias

#### Contras

- ❌ Foco em futebol real
- ❌ eSoccer não confirmado

---

### OddsMatrix - ANÁLISE DETALHADA 🥇

**Website:** https://oddsmatrix.com/esports/fifa/  
**Recomendação:** ⭐⭐⭐⭐⭐ **MAIS COMPLETA PARA eSoccer**

#### Cobertura FIFA Confirmada

- **64 competições FIFA**
- **4.913 eventos live/ano**
- **4.224 eventos pre-live/ano**
- **36 mercados de apostas**

#### Torneios Disponíveis

- eSoccer Battle (8, 10, 12 min)
- eSoccer Live Arena
- Champions VOLTA League
- Cyber Live! Arena
- FC 24 Champions League
- FC 24 World Championship
- ESPORT PRO CLUB
- FIFA 22/23 Championships

#### 36 Mercados de Apostas

1. Total Goals Over/Under
2. Home – Draw – Away
3. Both Teams to Score
4. Asian Handicap
5. Correct Score
6. Double Chance
7. Draw No Bet
8. Half Time / Full Time
9. Race To X Goals
10. Team To Score
11. Odd/Even
12. E mais 25 mercados...

#### Preços

| Plano | Descrição | Preço |
|-------|-----------|-------|
| **Trial** | 1 mês grátis | $0 |
| Standard | Sob consulta | ~$200-500/mês |
| Enterprise | Sob consulta | $1000+/mês |

#### Prós

- ✅ **Cobertura mais completa de eSoccer**
- ✅ **36 mercados de apostas**
- ✅ **Trial de 1 mês grátis**
- ✅ Push e Pull data
- ✅ XML e JSON API

#### Contras

- ❌ Preços não transparentes
- ❌ Necessita contato comercial

---

## 📋 COMPARATIVO FINAL

### Para eSoccer FIFA - O que cada API oferece:

| Recurso | OddsMatrix | BetsAPI | RapidAPI | AllSports |
|---------|------------|---------|----------|-----------|
| eSoccer Battle | ✅ | ✅ | ❓ | ❌ |
| Live Arena | ✅ | ✅ | ❓ | ❌ |
| FIFA Esports | ✅ | ✅ | ❓ | ❌ |
| Odds Bet365 | ✅ | ✅ | ✅ | ❌ |
| Odds múltiplas | ✅ | ✅ | ✅ | ✅ |
| Live data | ✅ | ✅ | ✅ | ✅ |
| Trial grátis | ✅ 1 mês | ❌ | ✅ | ✅ 14 dias |
| Preço transparente | ❌ | ❌ | ✅ | ✅ |
| WebSocket | ✅ | ❌ | ❌ | ✅ |

---

## 🎯 RECOMENDAÇÃO FINAL ATUALIZADA

### Opção 1: OddsMatrix (RECOMENDADO)

**Por quê?**
- Cobertura mais completa de eSoccer (64 competições)
- 36 mercados de apostas
- Trial de 1 mês grátis para testar
- Dados precisos e em tempo real

**Próximo passo:** Solicitar trial grátis em https://oddsmatrix.com/contact/

### Opção 2: BetsAPI (Alternativa)

**Por quê?**
- Boa cobertura de eSoccer
- Preço potencialmente menor
- API REST simples

**Próximo passo:** Contatar para obter preços reais

### Opção 3: Combinação

- **OddsMatrix** para dados de jogos e mercados
- **Football Betting Odds (RapidAPI)** para odds adicionais (plano grátis)

---

## 📞 Contatos Atualizados

| API | Contato | Trial |
|-----|---------|-------|
| OddsMatrix | https://oddsmatrix.com/contact/ | ✅ 1 mês grátis |
| BetsAPI | support@betsapi.com | ❌ Pago |
| RapidAPI | Via plataforma | ✅ Plano grátis |
| AllSportsAPI | Via site | ✅ 14 dias |

---

## 📚 Documentação Técnica

- **OddsMatrix Docs:** https://oddsmatrix.com/integration/
- **BetsAPI Docs:** https://betsapi.com/docs/
- **RapidAPI Docs:** https://rapidapi.com/betodds-betodds-default/api/football-betting-odds1
- **AllSportsAPI Docs:** https://allsportsapi.com/soccer-football-api-documentation
- **The Odds API Docs:** https://the-odds-api.com/liveapi/guides/v4/
- **Sportradar Docs:** https://developer.sportradar.com/

