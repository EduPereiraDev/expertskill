import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { Bet365SyncService } from './bet365-sync.service';
import { Bet365Service } from './bet365.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bet365/sync')
@UseGuards(JwtAuthGuard)
export class Bet365SyncController {
  constructor(
    private readonly syncService: Bet365SyncService,
    private readonly bet365Service: Bet365Service,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  getRateLimitStatus() {
    return this.bet365Service.getRateLimitStatus();
  }

  @Post('events')
  async syncEvents() {
    return this.syncService.syncEsoccerEvents();
  }

  @Post('ended')
  async syncEndedEvents() {
    return this.syncService.syncEndedEvents();
  }

  @Post('player-stats')
  async updatePlayerStats() {
    return this.syncService.updatePlayerStats();
  }

  @Post('full')
  async fullSync() {
    return this.syncService.fullSync();
  }

  @Post('historical')
  async syncHistorical() {
    return this.syncService.syncHistoricalEvents(7);
  }

  @Post('backfill/:days')
  async backfill(@Param('days') days: string) {
    const numDays = Math.min(parseInt(days) || 7, 30);
    return this.syncService.backfillHistory(numDays);
  }

  @Post('ht-scores')
  async syncHTScores() {
    return this.syncService.syncMissingHTScores();
  }

  @Get('event/:id/odds')
  async getEventOdds(@Param('id') eventId: string) {
    return this.syncService.getEventOdds(eventId);
  }

  @Get('health')
  async syncHealth() {
    const [total, finalizadas, aoVivo, agendadas, jogadores] = await Promise.all([
      this.prisma.partida.count(),
      this.prisma.partida.count({ where: { status: 'FINALIZADA' } }),
      this.prisma.partida.count({ where: { status: 'AO_VIVO' } }),
      this.prisma.partida.count({ where: { status: 'AGENDADA' } }),
      this.prisma.jogador.count(),
    ]);

    return {
      status: 'running',
      crons: {
        every30s: 'sync events + finalizar antigas + stats',
        every5min: 'sync HT scores faltantes',
        everyHour: 'sync completo do dia',
        daily4am: 'sync ultimos 2 dias + HT + stats',
        weeklySun3am: 'backfill 7 dias de historico',
      },
      database: {
        totalPartidas: total,
        finalizadas,
        aoVivo,
        agendadas,
        jogadores,
      },
      rateLimit: this.bet365Service.getRateLimitStatus(),
    };
  }
}
