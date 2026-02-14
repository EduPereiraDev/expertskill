import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SEED DE PRODUÇÃO - Expert Skills
 * 
 * Este seed NÃO cria dados mockados.
 * Em produção, todos os dados devem vir da API Bet365/BetsAPI.
 * 
 * Para popular o banco com dados reais, use:
 * - POST /api/bet365-sync/sync - Sincroniza eventos da Bet365
 * - POST /api/bet365-sync/full - Sincronização completa (eventos + resultados + stats)
 * 
 * Este seed apenas verifica a conexão com o banco.
 */

async function main() {
  console.log('🌱 Expert Skills - Seed de Produção');
  console.log('');
  console.log('⚠️  ATENÇÃO: Este seed NÃO cria dados mockados.');
  console.log('   Em produção, todos os dados devem vir da API Bet365.');
  console.log('');
  
  // Verificar conexão com o banco
  const jogadoresCount = await prisma.jogador.count();
  const partidasCount = await prisma.partida.count();
  const entradasCount = await prisma.entrada.count();
  
  console.log('📊 Estado atual do banco:');
  console.log(`   Jogadores: ${jogadoresCount}`);
  console.log(`   Partidas: ${partidasCount}`);
  console.log(`   Entradas: ${entradasCount}`);
  console.log('');
  
  if (jogadoresCount === 0 && partidasCount === 0) {
    console.log('📡 Banco vazio. Para popular com dados reais:');
    console.log('   1. Inicie a API: npm run start:dev');
    console.log('   2. Faça login para obter token JWT');
    console.log('   3. Execute: POST /api/bet365-sync/full');
    console.log('');
    console.log('   Ou use o script de sync direto:');
    console.log('   npx ts-node scripts/test-sync.ts');
  }
  
  console.log('✅ Seed concluído - Nenhum dado mockado criado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
