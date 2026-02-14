# 📋 REQUISITOS COMPLETOS - Expert Skills

> **Documento consolidado com TODOS os requisitos extraídos das fontes originais**

---

## 📚 Fontes de Informação

| Fonte | Descrição |
|-------|-----------|
| `reuniao.md` | Transcrição da reunião de briefing |
| `conversartion.md` | Conversas no Telegram sobre features |
| `5082848311665231640.txt` | Áudio transcrito com insights adicionais |
| Screenshots | Interface do Caveira Tips (referência) |

---

## 🎮 DOMÍNIO: eSoccer FIFA - Bet365

### Ligas/Grades Disponíveis

| Liga | Duração | Características | Usar? |
|------|---------|-----------------|-------|
| **Volta** | 6 min (3+3) | Futsal, sem saída/lateral | ❌ Não |
| **H2H** | Variável | Sem auxílio de IA, manual | ❌ Não |
| **GT 8min** | 8 min | Overall 95, muito inconsistente, "roleta" | ❌ Não |
| **GT 12min** | 12 min (6+6) | **FOCO PRINCIPAL** - Tempo para análise pré-live | ✅ SIM |

> **IMPORTANTE**: O produto foca APENAS na grade GT 12 minutos.

### Mercados de Apostas (Bet365)

| Mercado | Descrição | Exemplo |
|---------|-----------|---------|
| Gols Partida (FT) | Total de gols no jogo | Over/Under 2.5 |
| Gols HT | Total de gols no 1º tempo | Over/Under 1.5 |
| Resultado Correto | Placar exato | 2-1, 3-0 |
| Handicap -1 | Vantagem de 1 gol | Jogador -1 |
| Handicap HT -1 | Handicap no 1º tempo | Jogador -1 HT |
| Empate HT | 0x0 ou 1x1 no HT | Sim/Não |
| Ambas FT | Ambos marcam no jogo | Sim/Não |
| Ambas HT | Ambos marcam no HT | Sim/Não |
| +1.5 Gol Jogador | Jogador faz 2+ gols | Over 1.5 jogador |

### Jogadores de Referência (Exemplos)

- Kevin
- Hussein
- Zohri
- McShield
- Rubik's
- Inquisitor

---

## 💡 PROPOSTA DE VALOR

### Problema do Mercado

> "Esse mercado já está estagnado, tem muito site de análise"

- Muitos sites oferecem apenas estatísticas
- Usuário precisa analisar manualmente
- Sem gestão de banca integrada
- Experiência fragmentada

### Solução Diferenciada

> "O nosso site seria tipo um painel de hack... ele ia entregar a entrada e a gestão"

**Conceito "Hack"**: Usuário não precisa pensar, só seguir.

- ✅ Análise automatizada
- ✅ Gestão de banca integrada
- ✅ Entradas prontas
- ✅ "Pegar na mão do cara"

---

## 🧩 MÓDULOS DO SISTEMA

### 1. Controle de Banca

**Fonte**: reuniao.md linhas 45-57, conversartion.md linha 11

**Funcionalidades**:

- Input: Valor da banca (ex: R$100)
- Input: Meta do dia
- Seleção de gestão:
  - **Agressiva**: Divide por 10 (10 entradas)
  - **Conservadora**: Divide por 20 (20 entradas)
  - **Personalizada**: Usuário define divisor
- Output automático:
  - Stake por entrada
  - Quantidade de entradas necessárias
  - Odd mínima sugerida

**Exemplo citado**:
> "Banca 100 reais, gestão agressiva = 10 entradas de 10 reais"
> "Conservadora = 20 entradas de 5 reais"

---

### 2. Radar (Termômetro)

**Fonte**: reuniao.md linhas 61-85, conversartion.md linhas 45-70

**Nome oficial**: "Radar" (não "Termômetro")

**Funcionalidades**:

- Análise em tempo real das grades
- Classificação visual com cores:
  - 🟢 **Verde** = Operar
  - 🟡 **Amarelo** = Cautela
  - 🔴 **Vermelho** = Evitar
- Puxa histórico dos últimos 10 jogos
- Filtro por liga (mostrar todas, mas foco GT 12min)

**Nomes alternativos sugeridos** (para marketing):
- Impact Score
- Mercado Vivo
- Pulso do Jogo
- Market Power
- Heat Risk Bar (HRB)

**Indicador por Liga**:
- Volta — 🔥 Alta lucratividade
- GT — ⚠️ Jogos travados
- H2H — 🛑 Poucos gols

---

### 3. Entradas Expert (Bot)

**Fonte**: conversartion.md linhas 96-101

**Nome oficial**: "Entradas Expert" (NÃO "Bot")

**Funcionalidades**:

- Geração automática de entradas
- Integração com IA para análise avançada
- Botão "IA Call" que escolhe:
  - Qual mercado
  - Qual stake
  - Qual momento ideal
- "O usuário não precisa pensar"

---

### 4. Oportunidades Imediatas

**Fonte**: conversartion.md linhas 72-76

**Funcionalidade**:
- Bloco mostrando os melhores jogos do momento
- Destaque visual para oportunidades

---

## 📊 ALGORITMO DE CLASSIFICAÇÃO

### 3 Cenários de Análise

**Fonte**: reuniao.md linhas 77-84, conversartion.md linhas 123-170

#### CENÁRIO 1 - Jogo Fraco (🔴 Evitar Over)

**Identificar partidas com**:
- Alta incidência de 0x0
- 0x0 na HT (primeira análise)
- 0x0 na FT (segunda análise)
- Gol saindo muito rápido e não saindo mais
- HT fraco (poucos ou nenhum gol)
- Ritmo lento e baixa criação ofensiva
- Histórico recente com poucos gols

**Sinalização**: Evitar over / Buscar under / Jogo sem valor ofensivo

---

#### CENÁRIO 2 - Over Segurando (🟡 Cautela)

**Identificar partidas onde**:
- Jogadores possuem histórico over
- Odds indicam tendência ofensiva
- Porém o jogo está travado/segurado
- Padrão de gols tardios
- Controle de resultado
- Divergência entre histórico e andamento atual

**Sinalização**: Atenção para entrada tardia / Over pós-HT / Break de padrão

---

#### CENÁRIO 3 - Melhor Jogo (🟢 Operar)

**Identificar**:
- Top jogadores do dia (5 jogadores por grade)
- Jogadores com maior taxa de over/gols
- Alto volume de gols no histórico
- Histórico favorável
- Odds atrativas para over
- Consistência recente (últimos jogos)

**Sinalização**: Jogo forte para over / Entrada pré ou ao vivo

**Exemplo citado**:
> "Rubik's tá marcando 1.5 em todos os jogos, Inquisitor tá tomando... pegar a favor do Rubik's"

---

### Padrões Adicionais a Identificar

**Fonte**: reuniao.md linhas 87-95, áudio transcrito

**Para EVITAR (Troias)**:
- Jogadores "over" segurando o jogo
- Jogadores bons não pagando "ambas"
- Jogadores bons perdendo para zebra
- Grade ruim (um jogo pagando, outro não)

**Para SEGUIR**:
- Analisar últimas **8-12 horas** de confrontos
- Identificar confrontos com mais gols do dia
- Ranking de jogador mais vitorioso

**Exemplo citado**:
> "Jogador Zohri tá matando 2.5 em 8/9 partidas"

---

## 📈 DADOS A SEREM ANALISADOS

**Fonte**: conversartion.md linhas 174-182

- Histórico de partidas (HT / FT)
- Média de gols por jogador
- Percentual de over/under
- Odds iniciais e variação ao vivo (Bet365)
- Confrontos diretos (H2H)
- Frequência de 0x0
- Padrões de gols tardios

---

## 🎨 INTERFACE E UX

### Análise Visual/Corporal

**Fonte**: reuniao.md linhas 17-21

> "Dá para fazer uma análise no olho... leitura corporal"

**Exemplo citado**:
> "Kevin aqui já mostra que ele tá querendo jogar, tá prestando atenção no jogo. Hussein você vê que ele nem tá ligando pro jogo, já tá se balançando na cadeira"

**Feature futura**: Possível integração com IA de vídeo para análise comportamental.

### Layout de Referência (Caveira Tips)

**Estrutura identificada nos screenshots**:
- Sidebar esquerda com menu
- Logo no topo
- Botão CTA "SEJA PRO"
- Seções: Jogos ao vivo, Passados, Futuros
- Tabela com dados de jogadores
- Badges de liga coloridos
- Modal de paywall para features premium

---

## 💰 MODELO DE NEGÓCIO

### Preços de Referência (Concorrência)

**Fonte**: reuniao.md linha 31

| Plano | Preço |
|-------|-------|
| Mensal básico | R$ 99 |
| Mensal premium | R$ 149 |
| Anual | R$ 597 |

### Projeção de Receita

**Fonte**: reuniao.md linhas 31-33

- Pico de live: **1.500 viewers**
- Conversão estimada: **200 vendas**
- Ticket médio: R$ 99
- **Receita mensal projetada: ~R$ 20.000**

### Planos Propostos

| Plano | Preço | Features |
|-------|-------|----------|
| **Básico** | R$ 79,99/mês | Controle de Banca + Dashboard |
| **Pro** | R$ 99,99/mês | Básico + Radar + Alertas |
| **Expert** | R$ 149,99/mês | Pro + Entradas Expert + IA |

---

## 🔗 INTEGRAÇÕES

### Telegram

**Fonte**: reuniao.md linhas 41, 95

- Canal de comunicação com usuários
- Envio de alertas de entradas
- Notificações do bot

### Bet365

**Fonte**: reuniao.md linha 77

- Fonte primária de odds
- Variação ao vivo

### IA (OpenAI/Claude)

**Fonte**: reuniao.md linhas 63, 75

- Análise avançada de partidas
- Auxílio no termômetro
- Geração de entradas

---

## 📱 FLUXO DO USUÁRIO

**Fonte**: reuniao.md linhas 73-75

1. Usuário entra no site
2. Clica para começar análise
3. Sistema pergunta: "Qual sua banca?"
4. Usuário informa (ex: R$ 100)
5. Sistema pergunta: "Gestão agressiva, moderada ou personalizada?"
6. Usuário escolhe
7. Sistema pergunta: "Qual sua meta?"
8. Usuário informa
9. Sistema indica:
   - Quantas entradas pegar
   - Qual odd pegar
   - Valor da entrada
10. Ao clicar em "Entrada", bot analisa e busca entrada
11. Usuário segue a recomendação

---

## ✅ SAÍDAS DO SISTEMA

**Fonte**: reuniao.md linhas 85, conversartion.md linhas 186-190

- Classificação automática do jogo (Cenário 1, 2 ou 3)
- Alerta/Radar em tempo real
- Ranking dos melhores jogos do dia
- Ranking dos melhores jogadores do dia

---

## 🎯 RESUMO EXECUTIVO

### O que é

Plataforma SaaS de análise e gestão para apostadores de eSoccer FIFA na Bet365.

### Diferencial

Combina análise automatizada + gestão de banca + entradas prontas em um único painel "hands-off".

### Público

Apostadores de eSoccer que acompanham lives (1.500 viewers de pico).

### Foco técnico

Grade GT 12 minutos - única grade com tempo suficiente para análise pré-live.

### Filosofia

> "Como se a gente pegasse na mão do cara"

---

*Documento consolidado em: 03/02/2025*
*Fontes: reuniao.md, conversartion.md, 5082848311665231640.txt, screenshots*
