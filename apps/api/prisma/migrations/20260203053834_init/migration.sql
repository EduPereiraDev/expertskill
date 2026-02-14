-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'BASICO', 'PRO', 'EXPERT');

-- CreateEnum
CREATE TYPE "TipoGestao" AS ENUM ('AGRESSIVA', 'CONSERVADORA', 'PERSONALIZADA');

-- CreateEnum
CREATE TYPE "Liga" AS ENUM ('GT_12MIN', 'VOLTA_6MIN', 'H2H', 'GT_8MIN');

-- CreateEnum
CREATE TYPE "StatusPartida" AS ENUM ('AGENDADA', 'AO_VIVO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "Cenario" AS ENUM ('JOGO_FRACO', 'OVER_SEGURANDO', 'MELHOR_JOGO');

-- CreateEnum
CREATE TYPE "StatusEntrada" AS ENUM ('PENDENTE', 'CONFIRMADA', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ResultadoEntrada" AS ENUM ('GREEN', 'RED', 'REEMBOLSO');

-- CreateEnum
CREATE TYPE "NivelConfianca" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('ATIVA', 'CANCELADA', 'EXPIRADA', 'PENDENTE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "planExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bancas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "metaDiaria" DOUBLE PRECISION NOT NULL,
    "tipoGestao" "TipoGestao" NOT NULL,
    "divisor" INTEGER,
    "stake" DOUBLE PRECISION NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bancas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jogadores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "apelido" TEXT,
    "liga" "Liga" NOT NULL,
    "mediaGolsHT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mediaGolsFT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentualOver" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentual0x0" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ultimaAtualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jogadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partidas" (
    "id" TEXT NOT NULL,
    "jogador1Id" TEXT NOT NULL,
    "jogador2Id" TEXT NOT NULL,
    "liga" "Liga" NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "golsHT1" INTEGER,
    "golsHT2" INTEGER,
    "golsFT1" INTEGER,
    "golsFT2" INTEGER,
    "status" "StatusPartida" NOT NULL DEFAULT 'AGENDADA',
    "cenario" "Cenario",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entradas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bancaId" TEXT NOT NULL,
    "partidaId" TEXT,
    "mercado" TEXT NOT NULL,
    "odd" DOUBLE PRECISION NOT NULL,
    "stake" DOUBLE PRECISION NOT NULL,
    "resultado" "ResultadoEntrada",
    "lucro" DOUBLE PRECISION,
    "status" "StatusEntrada" NOT NULL DEFAULT 'PENDENTE',
    "confianca" "NivelConfianca" NOT NULL,
    "analiseIA" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entradas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "plano" "Plan" NOT NULL,
    "status" "StatusAssinatura" NOT NULL,
    "inicioEm" TIMESTAMP(3) NOT NULL,
    "fimEm" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "bancas_userId_ativa_idx" ON "bancas"("userId", "ativa");

-- CreateIndex
CREATE INDEX "jogadores_liga_idx" ON "jogadores"("liga");

-- CreateIndex
CREATE INDEX "jogadores_mediaGolsFT_idx" ON "jogadores"("mediaGolsFT" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "jogadores_nome_liga_key" ON "jogadores"("nome", "liga");

-- CreateIndex
CREATE INDEX "partidas_dataHora_idx" ON "partidas"("dataHora");

-- CreateIndex
CREATE INDEX "partidas_status_idx" ON "partidas"("status");

-- CreateIndex
CREATE INDEX "partidas_liga_idx" ON "partidas"("liga");

-- CreateIndex
CREATE INDEX "partidas_jogador1Id_jogador2Id_idx" ON "partidas"("jogador1Id", "jogador2Id");

-- CreateIndex
CREATE INDEX "entradas_userId_createdAt_idx" ON "entradas"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "entradas_bancaId_idx" ON "entradas"("bancaId");

-- CreateIndex
CREATE INDEX "entradas_status_idx" ON "entradas"("status");

-- CreateIndex
CREATE INDEX "assinaturas_userId_idx" ON "assinaturas"("userId");

-- CreateIndex
CREATE INDEX "assinaturas_status_idx" ON "assinaturas"("status");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- AddForeignKey
ALTER TABLE "bancas" ADD CONSTRAINT "bancas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_jogador1Id_fkey" FOREIGN KEY ("jogador1Id") REFERENCES "jogadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_jogador2Id_fkey" FOREIGN KEY ("jogador2Id") REFERENCES "jogadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_bancaId_fkey" FOREIGN KEY ("bancaId") REFERENCES "bancas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "partidas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
