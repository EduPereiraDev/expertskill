import { PrismaClient, Liga, StatusPartida, Cenario } from '@prisma/client';

const prisma = new PrismaClient();

interface Bet365Event {
  id: string;
  time: string;
  league: { id: string; name: string };
  home: { id: string; name: string };
  away: { id: string; name: string };
  ss?: string;
}

const ESOCCER_LEAGUE_MAPPING: Record<string, Liga> = {
  'esoccer gt leagues - 12 mins play': Liga.GT_12MIN,
  'esoccer battle volta - 6 mins play': Liga.VOLTA_6MIN,
  'esoccer h2h gg league - 8 mins play': Liga.H2H,
  'esoccer battle - 8 mins play': Liga.GT_8MIN,
};

function mapLeague(leagueName: string): Liga | null {
  const normalized = leagueName.toLowerCase().trim();
  
  for (const [pattern, liga] of Object.entries(ESOCCER_LEAGUE_MAPPING)) {
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return liga;
    }
  }

  if (normalized.includes('esoccer') || normalized.includes('e-soccer')) {
    if (normalized.includes('12')) return Liga.GT_12MIN;
    if (normalized.includes('volta') || normalized.includes('6')) return Liga.VOLTA_6MIN;
    if (normalized.includes('h2h')) return Liga.H2H;
    return Liga.GT_8MIN;
  }

  return null;
}

function extractPlayerName(fullName: string): string {
  const match = fullName.match(/^(.+?)\s*\(/);
  if (match) {
    return match[1].trim();
  }
  return fullName.trim();
}

async function syncEvents() {
  const token = process.env.BETSAPI_TOKEN || '245160-qRznxf8SuJ2n55';
  const url = `https://api.betsapi.com/v3/bet365/upcoming?sport_id=1&token=${token}`;
  
  console.log('🔄 Fetching eSoccer events from BetsAPI...');
  
  const response = await fetch(url);
  const data = await response.json();
  
  const esoccerEvents = (data.results || []).filter(
    (e: Bet365Event) => e.league?.name?.toLowerCase().includes('soccer')
  );
  
  console.log(`📊 Found ${esoccerEvents.length} eSoccer events`);
  
  let synced = 0;
  let errors = 0;
  
  for (const event of esoccerEvents) {
    try {
      const liga = mapLeague(event.league?.name || '');
      if (!liga) {
        console.log(`⚠️ Unknown league: ${event.league?.name}`);
        continue;
      }
      
      const homeName = extractPlayerName(event.home?.name || '');
      const awayName = extractPlayerName(event.away?.name || '');
      
      if (!homeName || !awayName) continue;
      
      // Upsert jogador1 - começa com 0, stats serão calculados de partidas reais
      const jogador1 = await prisma.jogador.upsert({
        where: { nome_liga: { nome: homeName, liga } },
        create: {
          nome: homeName,
          liga,
          mediaGolsHT: 0,
          mediaGolsFT: 0,
          percentualOver: 0,
          percentual0x0: 0,
        },
        update: { ultimaAtualizacao: new Date() },
      });
      
      // Upsert jogador2 - começa com 0, stats serão calculados de partidas reais
      const jogador2 = await prisma.jogador.upsert({
        where: { nome_liga: { nome: awayName, liga } },
        create: {
          nome: awayName,
          liga,
          mediaGolsHT: 0,
          mediaGolsFT: 0,
          percentualOver: 0,
          percentual0x0: 0,
        },
        update: { ultimaAtualizacao: new Date() },
      });
      
      const eventTime = new Date(parseInt(event.time) * 1000);
      
      // Determine cenario
      const mediaTotal = jogador1.mediaGolsFT + jogador2.mediaGolsFT;
      const overMedio = (jogador1.percentualOver + jogador2.percentualOver) / 2;
      let cenario: Cenario = Cenario.JOGO_FRACO;
      if (mediaTotal >= 6 && overMedio >= 70) cenario = Cenario.MELHOR_JOGO;
      else if (mediaTotal >= 4 && overMedio >= 55) cenario = Cenario.OVER_SEGURANDO;
      
      // Upsert partida
      await prisma.partida.upsert({
        where: { id: `betsapi_${event.id}` },
        create: {
          id: `betsapi_${event.id}`,
          jogador1Id: jogador1.id,
          jogador2Id: jogador2.id,
          liga,
          dataHora: eventTime,
          status: StatusPartida.AGENDADA,
          cenario,
        },
        update: {
          status: StatusPartida.AGENDADA,
          dataHora: eventTime,
        },
      });
      
      console.log(`✅ Synced: ${homeName} vs ${awayName} (${liga})`);
      synced++;
    } catch (error) {
      console.error(`❌ Error syncing event ${event.id}:`, error);
      errors++;
    }
  }
  
  console.log(`\n📈 Sync completed: ${synced} synced, ${errors} errors`);
  
  // Show stats
  const jogadoresCount = await prisma.jogador.count();
  const partidasCount = await prisma.partida.count();
  
  console.log(`\n📊 Database stats:`);
  console.log(`   Jogadores: ${jogadoresCount}`);
  console.log(`   Partidas: ${partidasCount}`);
}

async function main() {
  try {
    await syncEvents();
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
