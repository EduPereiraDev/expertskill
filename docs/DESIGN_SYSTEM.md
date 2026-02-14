# 🎨 Design System - Expert Skills

> **Referências**: Site modelo (Caveira Tips) + Paleta de cores do portfólio

---

## 📸 Análise do Site Modelo (Caveira Tips)

### Estrutura de Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (Banner de promoção)                                    │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│  SIDEBAR │              MAIN CONTENT                            │
│  (Menu)  │                                                      │
│          │                                                      │
│  - Logo  │  ┌────────────────────────────────────────────────┐  │
│  - CTA   │  │  Título da Página                              │  │
│  - Nav   │  ├────────────────────────────────────────────────┤  │
│          │  │  Filtros / Seleção de Liga                     │  │
│          │  ├────────────────────────────────────────────────┤  │
│          │  │  Tabela de Dados / Cards                       │  │
│          │  │  (Jogos, Jogadores, Resultados)                │  │
│          │  └────────────────────────────────────────────────┘  │
│          │                                                      │
├──────────┴──────────────────────────────────────────────────────┤
│  CHAT WIDGET (canto inferior direito)                           │
└─────────────────────────────────────────────────────────────────┘
```

### Seções Identificadas no Caveira Tips

| Seção | Descrição | Equivalente Expert Skills |
|-------|-----------|---------------------------|
| Jogos ao vivo | Lista de partidas em andamento | Dashboard / Radar |
| Jogos Passados | Histórico com placares | Histórico de Entradas |
| Jogos Futuros | Próximas partidas | Radar (pré-análise) |
| e-Soccer | Seleção de liga/jogadores | Configuração de Análise |
| Gerenciar bancas | Gestão financeira | **Controle de Banca** |
| Pagamentos | Planos e assinaturas | Planos |
| Planos | Tipos de assinatura | Planos |
| Bots ESoccer | Automação de entradas | **Entradas Expert** |
| Time Machine | Análise histórica | Histórico |

---

## 🎨 Paleta de Cores (Baseada no Portfólio)

### Cores Principais

| Nome | Hex | Uso |
|------|-----|-----|
| **Background Dark** | `#0D0D0F` | Fundo principal |
| **Background Card** | `#1A1A1D` | Cards e sidebar |
| **Purple Primary** | `#A855F7` | Cor de destaque principal |
| **Purple Light** | `#C084FC` | Hover e gradientes |
| **Purple Dark** | `#7C3AED` | Botões secundários |

### Cores de Status (do Radar)

| Nome | Hex | Uso |
|------|-----|-----|
| **Green (Operar)** | `#22C55E` | Sinal positivo |
| **Yellow (Cautela)** | `#EAB308` | Sinal de atenção |
| **Red (Evitar)** | `#EF4444` | Sinal negativo |

### Cores de Texto

| Nome | Hex | Uso |
|------|-----|-----|
| **Text Primary** | `#FFFFFF` | Títulos e texto principal |
| **Text Secondary** | `#A1A1AA` | Texto secundário |
| **Text Muted** | `#71717A` | Labels e placeholders |

### CSS Variables

```css
:root {
  /* Background */
  --bg-primary: #0D0D0F;
  --bg-secondary: #1A1A1D;
  --bg-card: #27272A;
  --bg-hover: #3F3F46;
  
  /* Purple (Brand) */
  --purple-50: #FAF5FF;
  --purple-100: #F3E8FF;
  --purple-200: #E9D5FF;
  --purple-300: #D8B4FE;
  --purple-400: #C084FC;
  --purple-500: #A855F7;
  --purple-600: #9333EA;
  --purple-700: #7C3AED;
  --purple-800: #6B21A8;
  --purple-900: #581C87;
  
  /* Status */
  --green-500: #22C55E;
  --green-600: #16A34A;
  --yellow-500: #EAB308;
  --yellow-600: #CA8A04;
  --red-500: #EF4444;
  --red-600: #DC2626;
  
  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #A1A1AA;
  --text-muted: #71717A;
  
  /* Border */
  --border-color: #27272A;
  --border-hover: #3F3F46;
}
```

---

## 🔤 Tipografia

### Font Family

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Escala Tipográfica

| Elemento | Size | Weight | Line Height |
|----------|------|--------|-------------|
| H1 | 2.5rem (40px) | 700 | 1.2 |
| H2 | 2rem (32px) | 600 | 1.3 |
| H3 | 1.5rem (24px) | 600 | 1.4 |
| H4 | 1.25rem (20px) | 500 | 1.4 |
| Body | 1rem (16px) | 400 | 1.5 |
| Small | 0.875rem (14px) | 400 | 1.5 |
| XSmall | 0.75rem (12px) | 400 | 1.4 |

---

## 🧩 Componentes Base

### Botões

```css
/* Primary Button (Purple) */
.btn-primary {
  background: linear-gradient(135deg, var(--purple-500), var(--purple-600));
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--purple-400), var(--purple-500));
  transform: translateY(-1px);
}

/* Secondary Button (Outline) */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
}

/* Status Buttons */
.btn-success { background: var(--green-500); }
.btn-warning { background: var(--yellow-500); }
.btn-danger { background: var(--red-500); }
```

### Cards

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.card-hover:hover {
  border-color: var(--purple-500);
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.1);
}
```

### Inputs

```css
.input {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
}

.input:focus {
  border-color: var(--purple-500);
  outline: none;
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
}
```

### Badges de Status (Radar)

```css
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-green {
  background: rgba(34, 197, 94, 0.2);
  color: var(--green-500);
  border: 1px solid var(--green-500);
}

.badge-yellow {
  background: rgba(234, 179, 8, 0.2);
  color: var(--yellow-500);
  border: 1px solid var(--yellow-500);
}

.badge-red {
  background: rgba(239, 68, 68, 0.2);
  color: var(--red-500);
  border: 1px solid var(--red-500);
}
```

---

## 📐 Layout

### Sidebar

- **Largura**: 240px (desktop) / colapsável (mobile)
- **Background**: `var(--bg-secondary)`
- **Logo**: Topo, centralizado
- **CTA (SEJA PRO)**: Botão destacado abaixo do logo
- **Navegação**: Agrupada por categorias

### Main Content

- **Padding**: 1.5rem
- **Max-width**: 1400px
- **Background**: `var(--bg-primary)`

### Tabelas (Jogos)

- **Header**: Background mais escuro, texto uppercase
- **Rows**: Alternância sutil de cores
- **Hover**: Destaque com borda purple

---

## 📱 Responsividade

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

### Mobile First

- Sidebar vira menu hamburguer
- Tabelas viram cards empilhados
- Botões ocupam largura total

---

## 🎯 Componentes Específicos Expert Skills

### 1. Radar Card

```
┌─────────────────────────────────────────┐
│  🟢 OPERAR                              │
│  ─────────────────────────────────────  │
│  Confronto: Zohri vs McShield           │
│  Liga: GT 12min                         │
│  ─────────────────────────────────────  │
│  📊 Over 2.5: 8/9 partidas              │
│  ⏱️ Média gols HT: 1.8                  │
│  ─────────────────────────────────────  │
│  [Ver Detalhes]  [Entrar Agora]         │
└─────────────────────────────────────────┘
```

### 2. Controle de Banca

```
┌─────────────────────────────────────────┐
│  💰 Controle de Banca                   │
│  ─────────────────────────────────────  │
│  Banca: R$ [____100,00____]             │
│  Meta do dia: R$ [____30,00____]        │
│  ─────────────────────────────────────  │
│  Gestão:                                │
│  [🔥 Agressiva] [⚖️ Conservadora] [⚙️]  │
│  ─────────────────────────────────────  │
│  ✅ Stake sugerido: R$ 10,00            │
│  ✅ Entradas necessárias: 3             │
│  ✅ Odd mínima: 1.50                    │
└─────────────────────────────────────────┘
```

### 3. Entrada Expert Card

```
┌─────────────────────────────────────────┐
│  ⚡ ENTRADA EXPERT                      │
│  ─────────────────────────────────────  │
│  🎮 Zohri vs McShield                   │
│  📍 Liga GT 12min                       │
│  ─────────────────────────────────────  │
│  📈 Mercado: Over 2.5 FT                │
│  💰 Odd: 1.85                           │
│  🎯 Stake: R$ 10,00                     │
│  ─────────────────────────────────────  │
│  🟢 Confiança: ALTA                     │
│  ─────────────────────────────────────  │
│  [Copiar Entrada]  [Marcar como Feita]  │
└─────────────────────────────────────────┘
```

---

## 🔧 Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0D0D0F',
          secondary: '#1A1A1D',
          card: '#27272A',
        },
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7C3AED',
          800: '#6B21A8',
          900: '#581C87',
        },
        status: {
          green: '#22C55E',
          yellow: '#EAB308',
          red: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

---

## 📋 Checklist de Implementação

- [ ] Configurar Tailwind com cores customizadas
- [ ] Criar componentes base (Button, Card, Input, Badge)
- [ ] Implementar layout com Sidebar
- [ ] Criar componentes de status (Radar indicators)
- [ ] Implementar tabelas responsivas
- [ ] Adicionar animações e transições
- [ ] Testar responsividade

---

*Documento criado em: 03/02/2025*
*Versão: 1.0*
