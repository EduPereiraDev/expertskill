import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BetsapiSyncService } from './betsapi-sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('betsapi/sync')
@UseGuards(JwtAuthGuard)
export class BetsapiSyncController {
  constructor(private readonly syncService: BetsapiSyncService) {}

  @Get('status')
  getRateLimitStatus() {
    return this.syncService.getRateLimitStatus();
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
    const events = await this.syncService.syncEsoccerEvents();
    const ended = await this.syncService.syncEndedEvents();
    const stats = await this.syncService.updatePlayerStats();
    
    return {
      events,
      ended,
      stats,
      rateLimit: this.syncService.getRateLimitStatus(),
    };
  }
}
