import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { Bet365Service, Bet365Event } from './bet365.service';
import { Liga, StatusPartida, Cenario } from '@prisma/client';

@Injectable()
export class Bet365SyncService implements OnModuleInit {
  private readonly logger = new Logger(Bet365SyncService.name);
  private isSyncing = false;
  private isUpdatingStats = false;

  private readonly ESOCCER_LEAGUE_MAPPING: Record<string, Liga> = {
    'esoccer gt leagues - 12 mins play': Liga.GT_12MIN,
    'esoccer battle volta - 6 mins play': Liga.VOLTA_6MIN,
    'esoccer h2h gg league - 8 mins play': Liga.H2H,
    'esoccer battle - 8 mins play': Liga.GT_8MIN,
    'esoccer live arena - 10 mins play': Liga.GT_8MIN,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly bet365Service: Bet365Service,
  ) {}

  async onModuleInit() {
    this.logger.log('Bet365 Sync Service initialized - Fonte: Bet365 ONLY');
    this.logger.log('Cron jobs ativos:');
    this.logger.log('  - A cada 10s: sync events + finalizar antigas (tempo real)');
    this.logger.log('  - A cada 2min: stats jogadores + HT scores');
    this.logger.log('Crons desabilitados (/events/ended requer plano superior):');
    this.logger.log('  - Horario, Diario, Semanal (backfill/syncDay)');

    // Sync inicial ao iniciar
    this.initialSync().catch(err => this.logger.error('Initial sync failed', err));
  }

  /**
   * Sync inicial robusto ao subir a aplicacao
   * Garante que o banco tenha dados mesmo na primeira execucao
   */
  private async initialSync() {
    this.logger.log('Iniciando sync inicial...');

    // 1. Sync eventos atuais (upcoming + inplay)
    const events = await this.syncEsoccerEvents();
    this.logger.log(`Sync inicial: ${events.synced} eventos sincronizados`);

    // 2. Verificar se o banco tem historico suficiente
    const totalPartidas = await this.prisma.partida.count({
      where: { status: StatusPartida.FINALIZADA },
    });

    this.logger.log(`Banco possui ${totalPartidas} partidas finalizadas`);

    // Backfill/syncDayEvents desabilitado - /events/ended requer plano superior da BetsAPI
    // Stats são atualizadas com base nos jogos ao vivo sincronizados pelo cron de 30s

    // 3. Atualizar stats dos jogadores
    await this.updatePlayerStats();

    const totalFinal = await this.prisma.partida.count({
      where: { status: StatusPartida.FINALIZADA },
    });
    this.logger.log(`Sync inicial completo. Total de partidas finalizadas: ${totalFinal}`);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCronSync() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      await this.syncEsoccerEvents();
      await this.finalizarPartidasAntigas();
    } catch (err) {
      this.logger.error('Cron sync failed', err);
    } finally {
      this.isSyncing = false;
    }
  }

  @Cron('*/2 * * * *') // A cada 2 minutos — stats e HT (pesado)
  async handleStatsSync() {
    if (this.isUpdatingStats) return;
    this.isUpdatingStats = true;
    try {
      await this.updatePlayerStats();
      if (new Date().getMinutes() % 5 === 0) {
        await this.syncMissingHTScores();
      }
    } catch (err) {
      this.logger.error('Stats sync failed', err);
    } finally {
      this.isUpdatingStats = false;
    }
  }

  private async finalizarPartidasAntigas() {
    // Timeout por liga: cada liga tem duração diferente
    const timeouts: { liga: Liga; minutos: number }[] = [
      { liga: Liga.VOLTA_6MIN, minutos: 8 },
      { liga: Liga.GT_8MIN, minutos: 10 },
      { liga: Liga.H2H, minutos: 10 },
      { liga: Liga.GT_12MIN, minutos: 14 },
    ];

    let totalFinalizado = 0;
    for (const { liga, minutos } of timeouts) {
      const limite = new Date(Date.now() - minutos * 60 * 1000);
      const result = await this.prisma.partida.updateMany({
        where: {
          status: StatusPartida.AO_VIVO,
          liga,
          dataHora: { lt: limite },
        },
        data: {
          status: StatusPartida.FINALIZADA,
        },
      });
      totalFinalizado += result.count;
    }

    if (totalFinalizado > 0) {
      this.logger.log(`Finalizadas ${totalFinalizado} partidas antigas que estavam como AO_VIVO`);
    }
  }

  async syncEsoccerEvents(): Promise<{ 
    synced: number; 
    errors: number; 
    rateLimit: { used: number; remaining: number } 
  }> {
    let synced = 0;
    let errors = 0;

    try {
      const upcomingEvents = await this.bet365Service.getEsoccerUpcoming();
      this.logger.log(`Found ${upcomingEvents.length} eSoccer upcoming events from Bet365`);

      for (const event of upcomingEvents) {
        try {
          await this.syncEvent(event, false);
          synced++;
        } catch (error) {
          this.logger.error(`Error syncing event ${event.id}:`, error);
          errors++;
        }
      }

      const inplayEvents = await this.bet365Service.getEsoccerInplay();
      this.logger.log(`Found ${inplayEvents.length} eSoccer inplay events from Bet365`);

      for (const event of inplayEvents) {
        try {
          await this.syncEvent(event, true);
          synced++;
        } catch (error) {
          this.logger.error(`Error syncing inplay event ${event.id}:`, error);
          errors++;
        }
      }

      this.logger.log(`Bet365 Sync completed: ${synced} events synced, ${errors} errors`);
    } catch (error) {
      this.logger.error('Error during Bet365 sync:', error);
    }

    const rateLimitStatus = this.bet365Service.getRateLimitStatus();
    return { 
      synced, 
      errors, 
      rateLimit: { 
        used: rateLimitStatus.used, 
        remaining: rateLimitStatus.remaining 
      } 
    };
  }

  private async syncEvent(event: Bet365Event, isLive: boolean): Promise<void> {
    const liga = this.mapLeague(event.league?.name || '');
    if (!liga) {
      return;
    }

    const homeName = this.extractPlayerName(event.home?.name || '');
    const awayName = this.extractPlayerName(event.away?.name || '');

    if (!homeName || !awayName) {
      return;
    }

    const jogador1 = await this.upsertJogador(homeName, liga);
    const jogador2 = await this.upsertJogador(awayName, liga);

    const eventTime = new Date(parseInt(event.time) * 1000);
    const score = this.parseScore(event.ss);

    const cenario = this.determineCenario(jogador1, jogador2);

    await this.prisma.partida.upsert({
      where: {
        id: `bet365_${event.id}`,
      },
      create: {
        id: `bet365_${event.id}`,
        jogador1Id: jogador1.id,
        jogador2Id: jogador2.id,
        liga,
        dataHora: eventTime,
        status: isLive ? StatusPartida.AO_VIVO : StatusPartida.AGENDADA,
        golsHT1: score.ht1,
        golsHT2: score.ht2,
        golsFT1: score.ft1,
        golsFT2: score.ft2,
        cenario,
      },
      update: {
        status: isLive ? StatusPartida.AO_VIVO : StatusPartida.AGENDADA,
        golsHT1: score.ht1,
        golsHT2: score.ht2,
        golsFT1: score.ft1,
        golsFT2: score.ft2,
        dataHora: eventTime,
      },
    });
  }

  private async upsertJogador(nome: string, liga: Liga) {
    return this.prisma.jogador.upsert({
      where: {
        nome_liga: { nome, liga },
      },
      create: {
        nome,
        liga,
        mediaGolsHT: 0,
        mediaGolsFT: 0,
        percentualOver: 0,
        percentual0x0: 0,
      },
      update: {
        ultimaAtualizacao: new Date(),
      },
    });
  }

  private mapLeague(leagueName: string): Liga | null {
    const normalized = leagueName.toLowerCase().trim();

    for (const [pattern, liga] of Object.entries(this.ESOCCER_LEAGUE_MAPPING)) {
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

  private extractPlayerName(fullName: string): string {
    // Mantém o nome completo com o jogador: "Man City (Kevin)"
    return fullName.trim();
  }

  private parseScore(ss?: string): { ht1?: number; ht2?: number; ft1?: number; ft2?: number } {
    if (!ss) return {};

    const parts = ss.split('-');
    if (parts.length === 2) {
      return {
        ft1: parseInt(parts[0]) || 0,
        ft2: parseInt(parts[1]) || 0,
      };
    }
    return {};
  }

  private determineCenario(jogador1: any, jogador2: any): Cenario {
    const mediaTotal = jogador1.mediaGolsFT + jogador2.mediaGolsFT;
    const overMedio = (jogador1.percentualOver + jogador2.percentualOver) / 2;

    if (mediaTotal >= 6 && overMedio >= 70) {
      return Cenario.MELHOR_JOGO;
    } else if (mediaTotal >= 4 && overMedio >= 55) {
      return Cenario.OVER_SEGURANDO;
    }
    return Cenario.JOGO_FRACO;
  }

  async syncEndedEvents(): Promise<{ updated: number }> {
    let updated = 0;

    try {
      const partidasAoVivo = await this.prisma.partida.findMany({
        where: { status: StatusPartida.AO_VIVO },
      });

      for (const partida of partidasAoVivo) {
        const eventId = partida.id.replace('bet365_', '');
        
        try {
          const result = await this.bet365Service.getEventResult(eventId);
          
          if (result.status === 'finished') {
            await this.prisma.partida.update({
              where: { id: partida.id },
              data: {
                status: StatusPartida.FINALIZADA,
                golsFT1: result.homeScore,
                golsFT2: result.awayScore,
                golsHT1: result.homeScoreHT,
                golsHT2: result.awayScoreHT,
              },
            });
            updated++;
          }
        } catch (error) {
          this.logger.error(`Error checking result for ${eventId}:`, error);
        }
      }

      this.logger.log(`Updated ${updated} ended events`);
    } catch (error) {
      this.logger.error('Error syncing ended events:', error);
    }

    return { updated };
  }

  async syncMissingHTScores(): Promise<{ updated: number; errors: number }> {
    let updated = 0;
    let errors = 0;

    try {
      // Buscar partidas finalizadas sem HT (em lotes de 50 para respeitar rate limit)
      const partidasSemHT = await this.prisma.partida.findMany({
        where: {
          status: StatusPartida.FINALIZADA,
          OR: [
            { golsHT1: null },
            { golsHT2: null },
          ],
        },
        take: 50, // Processar em lotes
        orderBy: { dataHora: 'desc' },
      });

      this.logger.log(`Buscando HT real para ${partidasSemHT.length} partidas...`);

      for (const partida of partidasSemHT) {
        const eventId = partida.id.replace('bet365_', '');
        
        try {
          const result = await this.bet365Service.getEventResult(eventId);
          
          await this.prisma.partida.update({
            where: { id: partida.id },
            data: {
              golsHT1: result.homeScoreHT,
              golsHT2: result.awayScoreHT,
            },
          });
          updated++;
        } catch (error) {
          errors++;
          this.logger.error(`Erro ao buscar HT para ${eventId}`);
        }

        // Delay para respeitar rate limit
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.logger.log(`HT Sync: ${updated} atualizados, ${errors} erros`);
    } catch (error) {
      this.logger.error('Erro no syncMissingHTScores:', error);
    }

    return { updated, errors };
  }

  async updatePlayerStats(): Promise<{ updated: number }> {
    const jogadores = await this.prisma.jogador.findMany();
    let updated = 0;

    for (const jogador of jogadores) {
      // Extrair nickname do jogador: "Man City (Kevin)" -> "Kevin"
      const nickname = this.extractPlayerNickname(jogador.nome);
      
      // Buscar TODOS os jogadores com o mesmo nickname
      // Ex: Kevin joga com Man City, Bayern, Roma - agregar todas as partidas
      const allPlayersWithNickname = nickname 
        ? await this.prisma.jogador.findMany({
            where: { nome: { contains: `(${nickname})` } },
          })
        : [jogador];

      // Buscar partidas de TODOS os jogadores com esse nickname
      let partidas: any[] = [];
      for (const player of allPlayersWithNickname) {
        const playerPartidas = await this.prisma.partida.findMany({
          where: {
            OR: [
              { jogador1Id: player.id },
              { jogador2Id: player.id },
            ],
            status: StatusPartida.FINALIZADA,
          },
          include: {
            jogador1: true,
            jogador2: true,
          },
          orderBy: { dataHora: 'desc' },
          take: 20,
        });
        partidas.push(...playerPartidas.map(p => ({ ...p, playerId: player.id })));
      }

      if (partidas.length === 0) continue;

      let totalGolsFT = 0;
      let totalGolsHT = 0;
      let over25Count = 0;
      let zeroZeroCount = 0;

      // Usar Set para evitar contar mesma partida múltiplas vezes
      const processedIds = new Set<string>();
      for (const partida of partidas) {
        if (processedIds.has(partida.id)) continue;
        processedIds.add(partida.id);

        // Usar playerId do jogador que participou dessa partida
        const isHome = partida.jogador1Id === partida.playerId;
        const golsFT = isHome ? (partida.golsFT1 || 0) : (partida.golsFT2 || 0);
        const golsHT = isHome ? (partida.golsHT1 || 0) : (partida.golsHT2 || 0);
        const totalGols = (partida.golsFT1 || 0) + (partida.golsFT2 || 0);

        totalGolsFT += golsFT;
        totalGolsHT += golsHT;

        if (totalGols > 2) over25Count++;
        if (totalGols === 0) zeroZeroCount++;
      }

      const count = processedIds.size;
      await this.prisma.jogador.update({
        where: { id: jogador.id },
        data: {
          mediaGolsFT: totalGolsFT / count,
          mediaGolsHT: totalGolsHT / count,
          percentualOver: (over25Count / count) * 100,
          percentual0x0: (zeroZeroCount / count) * 100,
          ultimaAtualizacao: new Date(),
        },
      });

      updated++;
    }

    this.logger.log(`Updated stats for ${updated} players`);
    return { updated };
  }

  private extractTeamName(fullName: string): string | null {
    // Extrai nome do time: "Man City (Kevin)" -> "Man City"
    const match = fullName.match(/^(.+?)\s*\(/);
    return match ? match[1].trim() : null;
  }

  private extractPlayerNickname(fullName: string): string | null {
    // Extrai nickname do jogador: "Man City (Kevin)" -> "Kevin"
    const match = fullName.match(/\(([^)]+)\)/);
    return match ? match[1].trim() : null;
  }

  async getEventOdds(eventId: string): Promise<any> {
    const fiId = eventId.replace('bet365_', '');
    return this.bet365Service.getEventWithOdds(fiId);
  }

  async fullSync(): Promise<{
    events: { synced: number; errors: number };
    ended: { updated: number };
    stats: { updated: number };
    rateLimit: { used: number; remaining: number };
  }> {
    const events = await this.syncEsoccerEvents();
    const ended = await this.syncEndedEvents();
    const stats = await this.updatePlayerStats();
    const rateLimitStatus = this.bet365Service.getRateLimitStatus();

    return {
      events: { synced: events.synced, errors: events.errors },
      ended,
      stats,
      rateLimit: {
        used: rateLimitStatus.used,
        remaining: rateLimitStatus.remaining,
      },
    };
  }

  /**
   * Sincroniza histórico de partidas finalizadas da API
   * Usa /events/ended que retorna partidas com placar HT/FT
   */
  async syncHistoricalEvents(pages: number = 3): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    // IDs das ligas de e-soccer (IDs antigos que funcionam com /events/ended)
    const leagueMapping = [
      { id: '38439', liga: Liga.VOLTA_6MIN }, // Esoccer Battle Volta - 6 mins play
      { id: '22614', liga: Liga.GT_8MIN },    // Esoccer Battle - 8 mins play
      { id: '23114', liga: Liga.GT_12MIN },   // Esoccer GT Leagues - 12 mins play
      { id: '37298', liga: Liga.H2H },        // Esoccer H2H GG League - 8 mins play
    ];

    this.logger.log(`Sincronizando histórico de ${pages} páginas por liga...`);

    for (const { id: leagueId, liga } of leagueMapping) {
      for (let page = 1; page <= pages; page++) {
        try {
          const response = await this.bet365Service.getEndedEvents(leagueId);
          
          if (!response.results || response.results.length === 0) continue;

          for (const event of response.results) {
            try {
              if (!event.ss || event.time_status !== '3') continue;

              const homeName = event.home?.name || '';
              const awayName = event.away?.name || '';
              
              if (!homeName || !awayName) continue;

              const jogador1 = await this.upsertJogador(homeName, liga);
              const jogador2 = await this.upsertJogador(awayName, liga);

              const eventTime = new Date(parseInt(event.time) * 1000);
              const [ft1, ft2] = (event.ss || '0-0').split('-').map((s: string) => parseInt(s) || 0);

              // Extrair HT do scores
              let ht1: number | undefined;
              let ht2: number | undefined;
              if (event.scores && event.scores['1']) {
                ht1 = parseInt(event.scores['1'].home) || 0;
                ht2 = parseInt(event.scores['1'].away) || 0;
              }

              await this.prisma.partida.upsert({
                where: { id: `bet365_${event.id}` },
                create: {
                  id: `bet365_${event.id}`,
                  jogador1Id: jogador1.id,
                  jogador2Id: jogador2.id,
                  liga,
                  dataHora: eventTime,
                  status: StatusPartida.FINALIZADA,
                  golsFT1: ft1,
                  golsFT2: ft2,
                  golsHT1: ht1,
                  golsHT2: ht2,
                  cenario: this.determineCenario(jogador1, jogador2),
                },
                update: {
                  status: StatusPartida.FINALIZADA,
                  golsFT1: ft1,
                  golsFT2: ft2,
                  golsHT1: ht1 ?? undefined,
                  golsHT2: ht2 ?? undefined,
                },
              });
              synced++;
            } catch (err) {
              errors++;
            }
          }
        } catch (err) {
          this.logger.error(`Erro ao buscar histórico da liga ${leagueId}:`, err);
          errors++;
        }
      }
    }

    this.logger.log(`Histórico sincronizado: ${synced} partidas, ${errors} erros`);
    return { synced, errors };
  }

  /**
   * Sincroniza todos os jogos de um dia específico
   * @param day - Data no formato YYYYMMDD (ex: 20260205)
   */
  async syncDayEvents(day: string): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    const leagueMapping = [
      { id: '38439', liga: Liga.VOLTA_6MIN },
      { id: '22614', liga: Liga.GT_8MIN },
      { id: '23114', liga: Liga.GT_12MIN },
      { id: '37298', liga: Liga.H2H },
    ];

    this.logger.log(`Sincronizando jogos do dia ${day}...`);

    for (const { id: leagueId, liga } of leagueMapping) {
      try {
        const response = await this.bet365Service.getEndedEvents(leagueId, day);
        
        if (!response.results || response.results.length === 0) continue;

        for (const event of response.results) {
          try {
            if (!event.ss || event.time_status !== '3') continue;

            const homeName = event.home?.name || '';
            const awayName = event.away?.name || '';
            
            if (!homeName || !awayName) continue;

            const jogador1 = await this.upsertJogador(homeName, liga);
            const jogador2 = await this.upsertJogador(awayName, liga);

            const eventTime = new Date(parseInt(event.time) * 1000);
            const [ft1, ft2] = (event.ss || '0-0').split('-').map((s: string) => parseInt(s) || 0);

            let ht1: number | undefined;
            let ht2: number | undefined;
            if (event.scores && event.scores['1']) {
              ht1 = parseInt(event.scores['1'].home) || 0;
              ht2 = parseInt(event.scores['1'].away) || 0;
            }

            await this.prisma.partida.upsert({
              where: { id: `bet365_${event.id}` },
              create: {
                id: `bet365_${event.id}`,
                jogador1Id: jogador1.id,
                jogador2Id: jogador2.id,
                liga,
                dataHora: eventTime,
                status: StatusPartida.FINALIZADA,
                golsFT1: ft1,
                golsFT2: ft2,
                golsHT1: ht1,
                golsHT2: ht2,
                cenario: this.determineCenario(jogador1, jogador2),
              },
              update: {
                status: StatusPartida.FINALIZADA,
                golsFT1: ft1,
                golsFT2: ft2,
                golsHT1: ht1 ?? undefined,
                golsHT2: ht2 ?? undefined,
              },
            });
            synced++;
          } catch (err) {
            errors++;
          }
        }
      } catch (err) {
        this.logger.error(`Erro ao buscar jogos da liga ${leagueId} do dia ${day}:`, err);
        errors++;
      }
    }

    this.logger.log(`Dia ${day}: ${synced} partidas sincronizadas, ${errors} erros`);
    return { synced, errors };
  }

  /**
   * Sync a cada hora - busca jogos finalizados das últimas horas
   * Garante que nenhum jogo seja perdido
   */
  // @Cron('0 * * * *') // Desabilitado - /events/ended requer plano superior da BetsAPI
  async handleHourlySync() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.logger.log(`Sync horário: buscando jogos do dia ${today}...`);
    await this.syncDayEvents(today);
  }

  /**
   * Cron job diário às 4h - sync completo do dia anterior
   * Garante dados completos mesmo se houve downtime
   */
  // @Cron('0 4 * * *') // Desabilitado - /events/ended requer plano superior da BetsAPI
  async handleDailySync() {
    this.logger.log('Iniciando sync diario completo...');
    
    // Sync dos ultimos 2 dias (garantia contra downtime curto)
    for (let i = 1; i <= 2; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      this.logger.log(`Sync diario: dia ${dayStr}...`);
      await this.syncDayEvents(dayStr);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    await this.syncMissingHTScores();
    await this.updatePlayerStats();
    
    const total = await this.prisma.partida.count({ where: { status: StatusPartida.FINALIZADA } });
    this.logger.log(`Sync diario completo. Total partidas finalizadas: ${total}`);
  }

  /**
   * Cron semanal - domingo às 3h - backfill profundo de 7 dias
   * Garante que o banco acumule historico completo continuamente
   */
  // @Cron('0 3 * * 0') // Desabilitado - /events/ended requer plano superior da BetsAPI
  async handleWeeklyBackfill() {
    this.logger.log('Iniciando backfill semanal (7 dias)...');
    await this.backfillHistory(7);
    this.logger.log('Backfill semanal finalizado');
  }

  /**
   * Backfill - sincroniza últimos N dias de histórico
   * Usar para popular banco inicial ou após downtime longo
   */
  async backfillHistory(days: number = 7): Promise<{ totalSynced: number; totalErrors: number }> {
    let totalSynced = 0;
    let totalErrors = 0;

    this.logger.log(`Iniciando backfill de ${days} dias...`);

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      
      const result = await this.syncDayEvents(dayStr);
      totalSynced += result.synced;
      totalErrors += result.errors;
      
      // Delay entre dias para não estourar rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await this.syncMissingHTScores();
    await this.updatePlayerStats();

    this.logger.log(`Backfill completo: ${totalSynced} partidas, ${totalErrors} erros`);
    return { totalSynced, totalErrors };
  }
}
