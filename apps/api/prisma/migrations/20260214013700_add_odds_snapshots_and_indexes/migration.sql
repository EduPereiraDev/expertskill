-- CreateTable (if not exists - odds_snapshots may already exist from db push)
CREATE TABLE IF NOT EXISTS "odds_snapshots" (
    "id" TEXT NOT NULL,
    "partidaId" TEXT NOT NULL,
    "minuto" INTEGER NOT NULL,
    "placarHome" INTEGER NOT NULL,
    "placarAway" INTEGER NOT NULL,
    "over05HT" DOUBLE PRECISION,
    "over15HT" DOUBLE PRECISION,
    "over25HT" DOUBLE PRECISION,
    "over15FT" DOUBLE PRECISION,
    "over25FT" DOUBLE PRECISION,
    "over35FT" DOUBLE PRECISION,
    "over45FT" DOUBLE PRECISION,
    "linhaFechada" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "odds_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "odds_snapshots_partidaId_minuto_idx" ON "odds_snapshots"("partidaId", "minuto");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "odds_snapshots_createdAt_idx" ON "odds_snapshots"("createdAt");

-- AddForeignKey (skip if exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'odds_snapshots_partidaId_fkey') THEN
        ALTER TABLE "odds_snapshots" ADD CONSTRAINT "odds_snapshots_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "partidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- New indexes for production performance (Revisão 3)
-- Index on assinaturas.stripeSubscriptionId for webhook handler lookups
CREATE INDEX IF NOT EXISTS "assinaturas_stripeSubscriptionId_idx" ON "assinaturas"("stripeSubscriptionId");

-- Index on refresh_tokens.expiresAt for cleanup cron job
CREATE INDEX IF NOT EXISTS "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- Drop redundant index (token already has unique constraint which creates an index)
DROP INDEX IF EXISTS "refresh_tokens_token_idx";
