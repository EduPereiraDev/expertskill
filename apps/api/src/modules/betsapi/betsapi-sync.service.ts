import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BetsapiService, Bet365Event, BetsApiEvent } from './betsapi.service';
import { Liga, StatusPartida, Cenario } from '@prisma/client';

interface RateLimitState {
  requestsThisHour: number;
  hourStartedAt: Date;
  maxRequestsPerHour: number;
}

@Injectable()
export class BetsapiSyncService implements OnModuleInit {
  private readonly logger = new Logger(BetsapiSyncService.name);
  
  private rateLimit: RateLimitState = {
    requestsThisHour: 0,
    hourStartedAt: new Date(),
    maxRequestsPerHour: 3600,
  };

  private readonly ESOCCER_LEAGUE_MAPPING: Record<string, Liga> = {
    'esoccer gt leagues - 12 mins play': Liga.GT_12MIN,
    'esoccer battle volta - 6 mins play': Liga.VOLTA_6MIN,
    'esoccer h2h gg league - 8 mins play': Liga.H2H,
    'esoccer battle - 8 mins play': Liga.GT_8MIN,
    'esoccer live arena - 10 mins play': Liga.GT_8MIN,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly betsapiService: BetsapiService,
  ) {}

  async onModuleInit() {
    this.logger.log('BetsAPI Sync Service initialized');
    this.logger.log(`Rate limit: ${this.rateLimit.maxRequestsPerHour} requests/hour`);
  }

  private canMakeRequest(): boolean {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    if (this.rateLimit.hourStartedAt < hourAgo) {
      this.rateLimit.requestsThisHour = 0;
      this.rateLimit.hourStartedAt = now;
    }
    
    return this.rateLimit.requestsThisHour < this.rateLimit.maxRequestsPerHour;
  }

  private trackRequest(): void {
    this.rateLimit.requestsThisHour++;
  }

  getRateLimitStatus(): { used: number; remaining: number; resetAt: Date } {
    const resetAt = new Date(this.rateLimit.hourStartedAt.getTime() + 60 * 60 * 1000);
    return {
      used: this.rateLimit.requestsThisHour,
      remaining: this.rateLimit.maxRequestsPerHour - this.rateLimit.requestsThisHour,
      resetAt,
    };
  }

  async syncEsoccerEvents(): Promise<{ synced: number; errors: number }> {
    if (!this.canMakeRequest()) {
      this.logger.warn('Rate limit reached, skipping sync');
      return { synced: 0, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    try {
      this.trackRequest();
      const upcomingResponse = await this.betsapiService.getEsoccerUpcoming();
      
      for (const event of upcomingResponse.results || []) {
        try {
          await this.syncEvent(event);
          synced++;
        } catch (error) {
          this.logger.error(`Error syncing event ${event.id}:`, error);
          errors++;
        }
      }

      this.trackRequest();
      const inplayResponse = await this.betsapiService.getEsoccerInplay();
      
      for (const event of inplayResponse.results || []) {
        try {
          await this.syncEvent(event, true);
          synced++;
        } catch (error) {
          this.logger.error(`Error syncing inplay event ${event.id}:`, error);
          errors++;
        }
      }

      this.logger.log(`Sync completed: ${synced} events synced, ${errors} errors`);
    } catch (error) {
      this.logger.error('Error during sync:', error);
    }

    return { synced, errors };
  }

  private async syncEvent(event: Bet365Event, isLive = false): Promise<void> {
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

    await this.prisma.partida.upsert({
      where: {
        id: `betsapi_${event.id}`,
      },
      create: {
        id: `betsapi_${event.id}`,
        jogador1Id: jogador1.id,
        jogador2Id: jogador2.id,
        liga,
        dataHora: eventTime,
        status: isLive ? StatusPartida.AO_VIVO : StatusPartida.AGENDADA,
        golsHT1: score.ht1,
        golsHT2: score.ht2,
        golsFT1: score.ft1,
        golsFT2: score.ft2,
        cenario: this.determineCenario(jogador1, jogador2),
      },
      update: {
        status: isLive ? StatusPartida.AO_VIVO : StatusPartida.AGENDADA,
        golsHT1: score.ht1,
        golsHT2: score.ht2,
        golsFT1: score.ft1,
        golsFT2: score.ft2,
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
    const match = fullName.match(/^(.+?)\s*\(/);
    if (match) {
      return match[1].trim();
    }
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
    if (!this.canMakeRequest()) {
      return { updated: 0 };
    }

    let updated = 0;

    try {
      this.trackRequest();
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const endedResponse = await this.betsapiService.getEndedEvents({ day: today });

      for (const event of endedResponse.results || []) {
        const leagueName = (event.league?.name || '').toLowerCase();
        if (!leagueName.includes('soccer')) continue;

        const score = this.parseScore(event.ss);
        if (score.ft1 === undefined) continue;

        const result = await this.prisma.partida.updateMany({
          where: {
            id: `betsapi_${event.id}`,
          },
          data: {
            status: StatusPartida.FINALIZADA,
            golsFT1: score.ft1,
            golsFT2: score.ft2,
          },
        });

        if (result.count > 0) {
          updated++;
        }
      }

      this.logger.log(`Updated ${updated} ended events`);
    } catch (error) {
      this.logger.error('Error syncing ended events:', error);
    }

    return { updated };
  }

  async updatePlayerStats(): Promise<{ updated: number }> {
    const jogadores = await this.prisma.jogador.findMany();
    let updated = 0;

    for (const jogador of jogadores) {
      const partidas = await this.prisma.partida.findMany({
        where: {
          OR: [
            { jogador1Id: jogador.id },
            { jogador2Id: jogador.id },
          ],
          status: StatusPartida.FINALIZADA,
        },
        orderBy: { dataHora: 'desc' },
        take: 20,
      });

      if (partidas.length < 3) continue;

      let totalGolsFT = 0;
      let totalGolsHT = 0;
      let over25Count = 0;
      let zeroZeroCount = 0;

      for (const partida of partidas) {
        const isHome = partida.jogador1Id === jogador.id;
        const golsFT = isHome ? (partida.golsFT1 || 0) : (partida.golsFT2 || 0);
        const golsHT = isHome ? (partida.golsHT1 || 0) : (partida.golsHT2 || 0);
        const totalGols = (partida.golsFT1 || 0) + (partida.golsFT2 || 0);

        totalGolsFT += golsFT;
        totalGolsHT += golsHT;
        
        if (totalGols > 2) over25Count++;
        if (totalGols === 0) zeroZeroCount++;
      }

      await this.prisma.jogador.update({
        where: { id: jogador.id },
        data: {
          mediaGolsFT: totalGolsFT / partidas.length,
          mediaGolsHT: totalGolsHT / partidas.length,
          percentualOver: (over25Count / partidas.length) * 100,
          percentual0x0: (zeroZeroCount / partidas.length) * 100,
          ultimaAtualizacao: new Date(),
        },
      });

      updated++;
    }

    this.logger.log(`Updated stats for ${updated} players`);
    return { updated };
  }

  async getEventOddsWithRateLimit(eventId: string): Promise<any> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit reached');
    }

    this.trackRequest();
    return this.betsapiService.getEventOdds(eventId);
  }

  async getEventHistoryWithRateLimit(eventId: string): Promise<any> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit reached');
    }

    this.trackRequest();
    return this.betsapiService.getEventHistory(eventId);
  }
}
