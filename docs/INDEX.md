# 📚 ÍNDICE DA DOCUMENTAÇÃO - Expert Skills

> **Central de documentação do projeto**

---

## 🗂️ Estrutura de Documentos

```
docs/
├── INDEX.md                 # Este arquivo (índice geral)
├── README.md → ../README.md # Documento principal do projeto
│
├── 📋 PLANEJAMENTO
│   ├── REQUISITOS.md        # Todos os requisitos das fontes originais
│   ├── ROADMAP.md           # Timeline de 12 semanas
│   └── TASKLIST.md          # 100 tarefas do 0 ao 100
│
├── 🔧 TÉCNICO
│   ├── SPECS.md             # Especificações técnicas (arquitetura, código)
│   ├── DATABASE.md          # Schema do banco de dados
│   └── API.md               # Documentação da API REST
│
├── 🎨 DESIGN
│   └── DESIGN_SYSTEM.md     # Cores, tipografia, componentes
│
├── 📖 REFERÊNCIA
│   └── GLOSSARIO.md         # Termos do domínio eSoccer
│
├── 📁 fontes/               # Documentos originais (fonte de verdade)
│   ├── reuniao.md           # Transcrição da reunião
│   ├── conversartion.md     # Conversas do Telegram
│   └── 5082848311665231640.txt  # Áudio transcrito
│
└── 🖼️ assets/               # Screenshots de referência
    └── *.png                # Interface do Caveira Tips
```

---

## 📄 Descrição dos Documentos

### Planejamento

| Documento | Descrição | Quando usar |
|-----------|-----------|-------------|
| **REQUISITOS.md** | Consolidação de TODOS os requisitos extraídos das fontes | Validar se algo foi esquecido |
| **ROADMAP.md** | Timeline de 12 semanas com 5 fases | Planejamento de sprints |
| **TASKLIST.md** | 100 tarefas numeradas com critérios de aceite | Execução diária |

### Técnico

| Documento | Descrição | Quando usar |
|-----------|-----------|-------------|
| **SPECS.md** | Arquitetura, schemas Prisma, lógica de negócio | Implementação de código |
| **DATABASE.md** | Tabelas, índices, queries comuns | Modelagem de dados |
| **API.md** | Endpoints, request/response, autenticação | Desenvolvimento de API |

### Design

| Documento | Descrição | Quando usar |
|-----------|-----------|-------------|
| **DESIGN_SYSTEM.md** | Paleta de cores, tipografia, componentes | Desenvolvimento de UI |

### Referência

| Documento | Descrição | Quando usar |
|-----------|-----------|-------------|
| **GLOSSARIO.md** | Termos de eSoccer, apostas, gestão de banca | Entender o domínio |

---

## 🔗 Links Rápidos

### Para Começar
1. [README.md](../README.md) - Visão geral do projeto
2. [REQUISITOS.md](./REQUISITOS.md) - O que precisa ser feito
3. [TASKLIST.md](./TASKLIST.md) - Por onde começar

### Para Desenvolver
1. [SPECS.md](./SPECS.md) - Como implementar
2. [API.md](./API.md) - Endpoints disponíveis
3. [DATABASE.md](./DATABASE.md) - Estrutura de dados

### Para Design
1. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Padrões visuais
2. [assets/](./assets/) - Screenshots de referência

---

## ✅ Checklist de Revisão

Antes de começar a implementação, verifique:

- [ ] Li o README.md e entendi o projeto
- [ ] Li o REQUISITOS.md e validei com o cliente
- [ ] Revisei o ROADMAP.md e concordo com o timeline
- [ ] Entendi o GLOSSARIO.md e os termos do domínio
- [ ] Revisei o DESIGN_SYSTEM.md e as cores/componentes
- [ ] Validei o DATABASE.md e o schema
- [ ] Entendi a API.md e os endpoints

---

## 📝 Notas de Manutenção

### Atualizando Documentação

1. **Novos requisitos**: Adicionar em REQUISITOS.md
2. **Mudanças de prazo**: Atualizar ROADMAP.md
3. **Tarefas concluídas**: Marcar em TASKLIST.md
4. **Novos endpoints**: Documentar em API.md
5. **Mudanças no banco**: Atualizar DATABASE.md

### Versionamento

- Manter data de última atualização em cada documento
- Usar commits semânticos: `docs: atualiza REQUISITOS.md`

---

*Última atualização: 03/02/2025*
