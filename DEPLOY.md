# ExpertSkill — Guia de Deploy Completo (Produção)

> **Stack**: Next.js 14 (Vercel) + NestJS 10 (DigitalOcean) + PostgreSQL 16 + Redis 7
> **Domínio**: Hostinger → expertskill.com.br
> **Pagamentos**: Stripe (checkout + webhooks + portal)

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [DigitalOcean — Criar Droplet](#2-digitalocean--criar-droplet)
3. [Servidor — Setup Inicial (SSH)](#3-servidor--setup-inicial-ssh)
4. [PostgreSQL 16 — Instalar e Configurar](#4-postgresql-16--instalar-e-configurar)
5. [Redis 7 — Instalar e Configurar](#5-redis-7--instalar-e-configurar)
6. [Backend (API) — Deploy no Servidor](#6-backend-api--deploy-no-servidor)
7. [PM2 — Gerenciar Processo da API](#7-pm2--gerenciar-processo-da-api)
8. [Nginx — Reverse Proxy + SSL](#8-nginx--reverse-proxy--ssl)
9. [Hostinger — Configurar DNS](#9-hostinger--configurar-dns)
10. [SSL — Let's Encrypt (Certbot)](#10-ssl--lets-encrypt-certbot)
11. [Vercel — Deploy do Frontend](#11-vercel--deploy-do-frontend)
12. [Stripe — Configurar Produção](#12-stripe--configurar-produção)
13. [Variáveis de Ambiente — Checklist Final](#13-variáveis-de-ambiente--checklist-final)
14. [Validação Pós-Deploy](#14-validação-pós-deploy)
15. [Manutenção e Monitoramento](#15-manutenção-e-monitoramento)

---

## 1. Pré-requisitos

Antes de começar, tenha em mãos:

- [ ] Conta na **DigitalOcean** (https://cloud.digitalocean.com)
- [ ] Conta na **Vercel** (https://vercel.com) — conectada ao GitHub
- [ ] Conta na **Hostinger** com domínio `expertskill.com.br` ativo
- [ ] Conta na **Stripe** (https://dashboard.stripe.com)
- [ ] Repositório no **GitHub** com o código do ExpertSkill
- [ ] Chave SSH local gerada (`ssh-keygen -t ed25519`)

### Push do código para o GitHub

```bash
cd /Users/edupereira/Projetos/expertskill
git add .
git commit -m "production ready: audit completo + indexes + migrations"
git push origin main
```

---

## 2. DigitalOcean — Criar Droplet

1. Acesse **DigitalOcean** → Create → Droplets
2. Configuração recomendada:

| Campo | Valor |
|---|---|
| **Region** | NYC1 ou GRU1 (São Paulo, se disponível) |
| **Image** | Ubuntu 22.04 LTS |
| **Size** | Basic → Regular → **$12/mês** (2 vCPU, 2GB RAM, 50GB SSD) |
| **Authentication** | SSH Key (adicione sua chave pública) |
| **Hostname** | `expertskill-api` |

3. Clique em **Create Droplet**
4. Anote o **IP do droplet** (ex: `164.90.xxx.xxx`)

> 💡 **Por que $12/mês?** A API tem cron jobs a cada 30s + PostgreSQL + Redis. 1GB RAM não é suficiente.

---

## 3. Servidor — Setup Inicial (SSH)

### 3.1 Conectar ao servidor

```bash
ssh root@SEU_IP_DROPLET
```

### 3.2 Atualizar sistema

```bash
apt update && apt upgrade -y
```

### 3.3 Criar usuário deploy (nunca rodar app como root)

```bash
adduser deploy
usermod -aG sudo deploy

# Copiar chave SSH para o novo usuário
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 3.4 Configurar firewall

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

### 3.5 Instalar Node.js 20 LTS

```bash
# Ainda como root
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # Deve mostrar v20.x.x
npm -v
```

### 3.6 Instalar ferramentas essenciais

```bash
npm install -g pm2
apt install -y git build-essential nginx certbot python3-certbot-nginx
```

### 3.7 Trocar para usuário deploy

```bash
# A partir daqui, SEMPRE usar o usuário deploy
su - deploy
```

---

## 4. PostgreSQL 16 — Instalar e Configurar

### 4.1 Instalar PostgreSQL 16

```bash
# Como root (sudo)
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16
```

### 4.2 Criar banco e usuário

```bash
sudo -u postgres psql
```

```sql
-- Dentro do psql:
CREATE USER expertskill WITH PASSWORD 'GERAR_SENHA_FORTE_AQUI';
CREATE DATABASE expertskill OWNER expertskill;
GRANT ALL PRIVILEGES ON DATABASE expertskill TO expertskill;
\q
```

> ⚠️ **GERAR SENHA FORTE**: `openssl rand -base64 32`

### 4.3 Configurar acesso local

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Adicione a linha (antes das outras regras):
```
local   expertskill   expertskill   md5
```

```bash
sudo systemctl restart postgresql
```

### 4.4 Testar conexão

```bash
psql -U expertskill -d expertskill -h localhost
# Deve pedir a senha e conectar
\q
```

### 4.5 Anotar a DATABASE_URL

```
DATABASE_URL="postgresql://expertskill:SUA_SENHA@localhost:5432/expertskill?connection_limit=10&connect_timeout=30"
```

---

## 5. Redis 7 — Instalar e Configurar

### 5.1 Instalar Redis

```bash
sudo apt install -y redis-server
```

### 5.2 Configurar para produção

```bash
sudo nano /etc/redis/redis.conf
```

Altere estas linhas:
```
# Bind apenas localhost (segurança)
bind 127.0.0.1 ::1

# Modo supervised pelo systemd
supervised systemd

# Limite de memória (512MB é suficiente)
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### 5.3 Reiniciar e testar

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
redis-cli ping
# Deve retornar: PONG
```

### 5.4 Anotar a REDIS_URL

```
REDIS_URL="redis://localhost:6379"
```

---

## 6. Backend (API) — Deploy no Servidor

### 6.1 Clonar repositório (como usuário deploy)

```bash
su - deploy
cd ~
git clone https://github.com/SEU_USUARIO/expertskill.git
cd expertskill/apps/api
```

### 6.2 Instalar dependências

```bash
npm install
```

### 6.3 Criar arquivo .env de produção

```bash
nano .env
```

Cole o conteúdo abaixo (substitua os valores reais):

```env
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL="postgresql://expertskill:SUA_SENHA@localhost:5432/expertskill?connection_limit=10&connect_timeout=30"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT (gerar com: openssl rand -base64 64)
JWT_SECRET="COLE_AQUI_O_RESULTADO_DO_OPENSSL"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Stripe (PRODUÇÃO — chaves sk_live_ e whsec_)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_EXPERT_PRICE_ID="price_..."

# BetsAPI
BETSAPI_TOKEN="SEU_TOKEN_BETSAPI"

# URLs
FRONTEND_URL="https://expertskill.com.br,https://www.expertskill.com.br"
```

### 6.4 Gerar JWT_SECRET

```bash
openssl rand -base64 64
# Copie o resultado e cole no JWT_SECRET do .env
```

### 6.5 Rodar migrations no banco de produção

```bash
npx prisma migrate deploy
```

> ⚠️ **`migrate deploy`** (não `migrate dev`!) — aplica migrations sem interação.

### 6.6 Gerar Prisma Client

```bash
npx prisma generate
```

### 6.7 Build da API

```bash
npm run build
```

### 6.8 Testar se sobe

```bash
npm run start:prod
# Deve mostrar: "API running on port 3001 [production]"
# Ctrl+C para parar
```

---

## 7. PM2 — Gerenciar Processo da API

### 7.1 Criar arquivo de configuração PM2

```bash
nano ~/expertskill/apps/api/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'expertskill-api',
    script: 'dist/main.js',
    cwd: '/home/deploy/expertskill/apps/api',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    // Restart automático
    max_memory_restart: '1G',
    restart_delay: 5000,
    max_restarts: 10,
    // Logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/home/deploy/logs/api-error.log',
    out_file: '/home/deploy/logs/api-out.log',
    merge_logs: true,
    // Watch (desabilitado em produção)
    watch: false,
  }],
};
```

### 7.2 Criar pasta de logs

```bash
mkdir -p ~/logs
```

### 7.3 Iniciar com PM2

```bash
cd ~/expertskill/apps/api
pm2 start ecosystem.config.js
pm2 save
```

### 7.4 Configurar PM2 para iniciar no boot

```bash
pm2 startup
# Copie e execute o comando que o PM2 mostrar (começa com sudo)
pm2 save
```

### 7.5 Verificar status

```bash
pm2 status
pm2 logs expertskill-api --lines 20
```

---

## 8. Nginx — Reverse Proxy + SSL

### 8.1 Criar configuração do Nginx

```bash
sudo nano /etc/nginx/sites-available/expertskill-api
```

```nginx
server {
    listen 80;
    server_name api.expertskill.com.br;

    # Limite de tamanho do body (para uploads futuros)
    client_max_body_size 10M;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check direto (sem proxy headers desnecessários)
    location /api/health {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
}
```

### 8.2 Ativar o site

```bash
sudo ln -s /etc/nginx/sites-available/expertskill-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 9. Hostinger — Configurar DNS

Acesse o **painel da Hostinger** → DNS Zone Editor para `expertskill.com.br`.

### 9.1 Registros DNS necessários

| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| **A** | `api` | `SEU_IP_DROPLET` (ex: 164.90.xxx.xxx) | 3600 |
| **CNAME** | `www` | `cname.vercel-dns.com.` | 3600 |
| **A** | `@` | `76.76.21.21` (Vercel) | 3600 |

> **Explicação**:
> - `api.expertskill.com.br` → aponta para o DigitalOcean (backend)
> - `expertskill.com.br` e `www.expertskill.com.br` → apontam para a Vercel (frontend)

### 9.2 Remover registros conflitantes

Se existirem registros A ou CNAME antigos para `@`, `www` ou `api`, **remova-os** antes de adicionar os novos.

### 9.3 Aguardar propagação

```bash
# Testar propagação (do seu computador local)
dig api.expertskill.com.br +short
# Deve retornar o IP do droplet

dig expertskill.com.br +short
# Deve retornar 76.76.21.21
```

> ⏳ A propagação DNS pode levar de 5 minutos a 48 horas. Normalmente 15-30 min.

---

## 10. SSL — Let's Encrypt (Certbot)

### 10.1 Gerar certificado SSL para a API

> ⚠️ **Só execute após o DNS estar propagado** (passo 9.3 funcionando).

```bash
sudo certbot --nginx -d api.expertskill.com.br
```

- Informe seu email
- Aceite os termos
- Escolha **redirect HTTP → HTTPS** (opção 2)

### 10.2 Testar renovação automática

```bash
sudo certbot renew --dry-run
```

### 10.3 Verificar HTTPS

```bash
curl -I https://api.expertskill.com.br/api/health
# Deve retornar HTTP/2 200
```

---

## 11. Vercel — Deploy do Frontend

### 11.1 Importar projeto na Vercel

1. Acesse https://vercel.com/new
2. **Import Git Repository** → selecione `expertskill`
3. Configure:

| Campo | Valor |
|---|---|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/web` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

### 11.2 Configurar variáveis de ambiente

Na Vercel, vá em **Settings → Environment Variables** e adicione:

| Variável | Valor | Ambiente |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.expertskill.com.br` | Production |

> ⚠️ **Sem barra no final!** `https://api.expertskill.com.br` (não `https://api.expertskill.com.br/`)

### 11.3 Deploy

Clique em **Deploy**. A Vercel fará o build automaticamente.

### 11.4 Configurar domínio customizado na Vercel

1. Vá em **Settings → Domains**
2. Adicione: `expertskill.com.br`
3. Adicione: `www.expertskill.com.br`
4. A Vercel vai verificar os registros DNS (configurados no passo 9)
5. O SSL é automático na Vercel ✅

### 11.5 Verificar

Acesse `https://expertskill.com.br` — deve carregar o frontend.

---

## 12. Stripe — Configurar Produção

### 12.1 Ativar modo Live no Stripe

1. Acesse https://dashboard.stripe.com
2. No canto superior direito, desative o **Test Mode** (toggle para Live)
3. Complete a verificação da conta (dados bancários, documentos)

### 12.2 Obter chaves de produção

1. Vá em **Developers → API Keys**
2. Copie a **Secret Key** (`sk_live_...`)
3. Anote — será usada no `.env` do servidor

### 12.3 Criar produtos e preços

1. Vá em **Products → Add Product**

**Plano Pro:**
| Campo | Valor |
|---|---|
| Name | Plano Pro |
| Pricing | R$ 169,99 / mês (recurring) |

**Plano Expert:**
| Campo | Valor |
|---|---|
| Name | Plano Expert |
| Pricing | R$ 249,99 / mês (recurring) |

2. Após criar, copie o **Price ID** de cada plano (`price_...`)
3. Anote — serão usados no `.env` do servidor como `STRIPE_PRO_PRICE_ID` e `STRIPE_EXPERT_PRICE_ID`

### 12.4 Configurar Webhook de produção

1. Vá em **Developers → Webhooks → Add Endpoint**
2. Configure:

| Campo | Valor |
|---|---|
| **Endpoint URL** | `https://api.expertskill.com.br/api/pagamentos/webhook` |
| **Events** | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` |

3. Após criar, clique no webhook → **Signing Secret** → Reveal
4. Copie o `whsec_...`
5. Anote — será usado no `.env` do servidor como `STRIPE_WEBHOOK_SECRET`

### 12.5 Configurar Customer Portal

1. Vá em **Settings → Billing → Customer Portal**
2. Ative:
   - [x] Customers can update payment methods
   - [x] Customers can cancel subscriptions
   - [x] Customers can view invoice history
3. Em **Business information**, adicione o link: `https://expertskill.com.br`

### 12.6 Atualizar .env no servidor com as chaves Live

```bash
ssh deploy@SEU_IP_DROPLET
nano ~/expertskill/apps/api/.env
```

Atualize:
```env
STRIPE_SECRET_KEY="sk_live_COLE_AQUI"
STRIPE_WEBHOOK_SECRET="whsec_COLE_AQUI"
STRIPE_PRO_PRICE_ID="price_COLE_AQUI"
STRIPE_EXPERT_PRICE_ID="price_COLE_AQUI"
```

Reinicie a API:
```bash
cd ~/expertskill/apps/api
pm2 restart expertskill-api
```

---

## 13. Variáveis de Ambiente — Checklist Final

### Backend (.env no servidor)

| Variável | Exemplo | Status |
|---|---|---|
| `NODE_ENV` | `production` | ☐ |
| `PORT` | `3001` | ☐ |
| `DATABASE_URL` | `postgresql://expertskill:SENHA@localhost:5432/expertskill?connection_limit=10&connect_timeout=30` | ☐ |
| `REDIS_URL` | `redis://localhost:6379` | ☐ |
| `JWT_SECRET` | (resultado do `openssl rand -base64 64`) | ☐ |
| `JWT_EXPIRES_IN` | `15m` | ☐ |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | ☐ |
| `STRIPE_SECRET_KEY` | `sk_live_...` | ☐ |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ☐ |
| `STRIPE_PRO_PRICE_ID` | `price_...` | ☐ |
| `STRIPE_EXPERT_PRICE_ID` | `price_...` | ☐ |
| `BETSAPI_TOKEN` | (seu token da BetsAPI) | ☐ |
| `FRONTEND_URL` | `https://expertskill.com.br,https://www.expertskill.com.br` | ☐ |

### Frontend (Vercel Environment Variables)

| Variável | Valor | Status |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.expertskill.com.br` | ☐ |

---

## 14. Validação Pós-Deploy

Execute cada teste na ordem. **Todos devem passar antes de considerar o deploy completo.**

### 14.1 Health Check da API

```bash
curl https://api.expertskill.com.br/api/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### 14.2 Health Check Liveness

```bash
curl https://api.expertskill.com.br/api/health/live
# Esperado: { "status": "ok" }
```

### 14.3 Health Check Readiness

```bash
curl https://api.expertskill.com.br/api/health/ready
# Esperado: { "status": "ready" }
```

### 14.4 Testar registro de usuário

```bash
curl -X POST https://api.expertskill.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"123456","name":"Teste"}'
```

### 14.5 Testar login

```bash
curl -X POST https://api.expertskill.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"123456"}'
# Deve retornar accessToken e refreshToken
```

### 14.6 Testar CORS (do frontend)

Abra `https://expertskill.com.br` no navegador → Console → Network tab:
- As requisições para `api.expertskill.com.br` devem funcionar sem erros de CORS

### 14.7 Testar Stripe Webhook

```bash
# No painel do Stripe → Webhooks → seu endpoint → Send test webhook
# Selecione "checkout.session.completed" → Send
# Verifique nos logs:
ssh deploy@SEU_IP_DROPLET
pm2 logs expertskill-api --lines 10
```

### 14.8 Testar fluxo completo de pagamento

1. Acesse `https://expertskill.com.br`
2. Faça login
3. Vá em Planos → Assinar Pro
4. Complete o checkout com cartão de teste Stripe: `4242 4242 4242 4242`
5. Verifique se o plano foi atualizado no dashboard

### 14.9 Testar cron jobs

```bash
ssh deploy@SEU_IP_DROPLET
pm2 logs expertskill-api --lines 50
# Deve mostrar logs de sync a cada 30 segundos:
# "Bet365 Sync completed: X events synced, 0 errors"
```

### 14.10 Deletar usuário de teste

```bash
ssh deploy@SEU_IP_DROPLET
cd ~/expertskill/apps/api
npx prisma studio
# Abra no navegador e delete o usuário teste@teste.com
```

---

## 15. Manutenção e Monitoramento

### 15.1 Atualizar código (deploy de novas versões)

```bash
ssh deploy@SEU_IP_DROPLET
cd ~/expertskill

# Puxar código novo
git pull origin main

# Backend
cd apps/api
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart expertskill-api

# Verificar
pm2 logs expertskill-api --lines 10
```

> O **frontend** atualiza automaticamente na Vercel ao fazer `git push`.

### 15.2 Comandos úteis PM2

```bash
pm2 status                          # Ver status
pm2 logs expertskill-api            # Ver logs em tempo real
pm2 logs expertskill-api --lines 50 # Últimas 50 linhas
pm2 restart expertskill-api         # Reiniciar
pm2 stop expertskill-api            # Parar
pm2 monit                           # Monitor interativo (CPU/RAM)
```

### 15.3 Backup do banco (cron automático)

```bash
# Como root, criar script de backup
sudo nano /opt/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U expertskill -h localhost expertskill | gzip > "$BACKUP_DIR/expertskill_$TIMESTAMP.sql.gz"

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup criado: expertskill_$TIMESTAMP.sql.gz"
```

```bash
sudo chmod +x /opt/backup-db.sh

# Agendar backup diário às 3h
sudo crontab -e
# Adicione:
0 3 * * * /opt/backup-db.sh >> /home/deploy/logs/backup.log 2>&1
```

### 15.4 Monitorar espaço em disco

```bash
df -h          # Espaço geral
du -sh ~/logs  # Tamanho dos logs
```

### 15.5 Rotação de logs PM2

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 15.6 Monitorar certificado SSL

```bash
# Verificar data de expiração
sudo certbot certificates

# Renovação automática já está configurada via cron do certbot
# Testar renovação:
sudo certbot renew --dry-run
```

---

## Resumo da Arquitetura Final

```
                    ┌─────────────────────┐
                    │   Hostinger DNS     │
                    │  expertskill.com.br │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │                               │
              ▼                               ▼
   ┌──────────────────┐           ┌──────────────────┐
   │     Vercel        │           │  DigitalOcean    │
   │   (Frontend)      │           │   (Backend)      │
   │                   │           │                  │
   │  Next.js 14       │  HTTPS   │  Nginx (SSL)     │
   │  expertskill      │ -------> │    ↓              │
   │  .com.br          │  API     │  PM2 → NestJS    │
   │                   │  calls   │    ↓       ↓      │
   │  Auto-deploy      │           │  PostgreSQL Redis│
   │  via git push     │           │                  │
   └──────────────────┘           └──────────────────┘
                                          │
                                          ▼
                                  ┌──────────────┐
                                  │   Stripe     │
                                  │  Webhooks    │
                                  │  → /api/     │
                                  │  pagamentos/ │
                                  │  webhook     │
                                  └──────────────┘
```

---

## Troubleshooting

### API não responde

```bash
pm2 logs expertskill-api --lines 50  # Ver erros
pm2 restart expertskill-api          # Reiniciar
sudo systemctl status nginx          # Nginx rodando?
sudo nginx -t                        # Config válida?
```

### Banco não conecta

```bash
sudo systemctl status postgresql     # PostgreSQL rodando?
psql -U expertskill -d expertskill -h localhost  # Testar conexão
```

### Redis não conecta

```bash
sudo systemctl status redis-server   # Redis rodando?
redis-cli ping                       # Deve retornar PONG
```

### CORS bloqueando requisições

Verifique no `.env` do servidor:
```bash
grep FRONTEND_URL ~/expertskill/apps/api/.env
# Deve conter: https://expertskill.com.br,https://www.expertskill.com.br
```

### Stripe webhook falhando

1. Verifique no Stripe Dashboard → Webhooks → Recent Events
2. Verifique se o `STRIPE_WEBHOOK_SECRET` no `.env` corresponde ao do Stripe
3. Verifique logs: `pm2 logs expertskill-api --lines 20`

### SSL expirou

```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

> **Documento criado em**: 14/02/2026
> **Última revisão**: Código auditado e 100% production-ready
> **Autor**: ExpertSkill Team
