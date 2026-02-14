import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { BetsapiService } from './betsapi.service';
import { Bet365SyncService } from './bet365-sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('betsapi')
@UseGuards(JwtAuthGuard)
export class BetsapiController {
  constructor(
    private readonly betsapiService: BetsapiService,
    private readonly syncService: Bet365SyncService,
  ) {}

  // ==================== EVENTS API ====================

  @Get('events/inplay')
  async getInplayEvents(@Query('sport_id') sportId?: string) {
    return this.betsapiService.getInplayEvents(sportId);
  }

  @Get('events/upcoming')
  async getUpcomingEvents(
    @Query('sport_id') sportId?: string,
    @Query('league_id') leagueId?: string,
    @Query('day') day?: string,
    @Query('page') page?: string,
  ) {
    return this.betsapiService.getUpcomingEvents({ sportId, leagueId, day, page });
  }

  @Get('events/ended')
  async getEndedEvents(
    @Query('sport_id') sportId?: string,
    @Query('league_id') leagueId?: string,
    @Query('day') day?: string,
    @Query('page') page?: string,
  ) {
    return this.betsapiService.getEndedEvents({ sportId, leagueId, day, page });
  }

  @Get('events/search')
  async searchEvents(
    @Query('q') query: string,
    @Query('sport_id') sportId?: string,
  ) {
    return this.betsapiService.searchEvents(query, sportId);
  }

  @Get('event/:id')
  async getEventView(@Param('id') eventId: string) {
    return this.betsapiService.getEventView(eventId);
  }

  @Get('event/:id/history')
  async getEventHistory(@Param('id') eventId: string) {
    return this.betsapiService.getEventHistory(eventId);
  }

  @Get('event/:id/odds')
  async getEventOdds(
    @Param('id') eventId: string,
    @Query('source') source?: string,
  ) {
    return this.betsapiService.getEventOdds(eventId, source);
  }

  @Get('event/:id/odds-summary')
  async getEventOddsSummary(@Param('id') eventId: string) {
    return this.betsapiService.getEventOddsSummary(eventId);
  }

  @Get('event/:id/stats')
  async getEventStatsTrend(@Param('id') eventId: string) {
    return this.betsapiService.getEventStatsTrend(eventId);
  }

  @Get('event/:id/lineup')
  async getEventLineup(@Param('id') eventId: string) {
    return this.betsapiService.getEventLineup(eventId);
  }

  @Get('event/:id/full')
  async getEventWithOdds(@Param('id') eventId: string) {
    return this.betsapiService.getEventWithOdds(eventId);
  }

  // ==================== LEAGUE API ====================

  @Get('leagues')
  async getLeagues(
    @Query('sport_id') sportId?: string,
    @Query('page') page?: string,
  ) {
    return this.betsapiService.getLeagues(sportId, page);
  }

  @Get('leagues/ids')
  getLeagueIds() {
    return this.betsapiService.getLeagueIds();
  }

  @Get('league/:id/table')
  async getLeagueTable(@Param('id') leagueId: string) {
    return this.betsapiService.getLeagueTable(leagueId);
  }

  @Get('league/:id/toplist')
  async getLeagueToplist(@Param('id') leagueId: string) {
    return this.betsapiService.getLeagueToplist(leagueId);
  }

  // ==================== TEAM API ====================

  @Get('team/:id')
  async getTeam(@Param('id') teamId: string) {
    return this.betsapiService.getTeam(teamId);
  }

  @Get('team/:id/squad')
  async getTeamSquad(@Param('id') teamId: string) {
    return this.betsapiService.getTeamSquad(teamId);
  }

  @Get('team/:id/members')
  async getTeamMembers(@Param('id') teamId: string) {
    return this.betsapiService.getTeamMembers(teamId);
  }

  // ==================== PLAYER API ====================

  @Get('player/:id')
  async getPlayer(@Param('id') playerId: string) {
    return this.betsapiService.getPlayer(playerId);
  }

  // ==================== BET365 API ====================

  @Get('bet365/inplay')
  async getBet365Inplay(@Query('sport_id') sportId?: string) {
    return this.betsapiService.getBet365Inplay(sportId);
  }

  @Get('bet365/inplay-filter')
  async getBet365InplayFilter(@Query('sport_id') sportId?: string) {
    return this.betsapiService.getBet365InplayFilter(sportId);
  }

  @Get('bet365/upcoming')
  async getBet365Upcoming(
    @Query('sport_id') sportId?: string,
    @Query('league_id') leagueId?: string,
    @Query('day') day?: string,
  ) {
    return this.betsapiService.getBet365Upcoming(sportId, leagueId, day);
  }

  @Get('bet365/prematch/:fi')
  async getBet365Prematch(@Param('fi') fiId: string) {
    return this.betsapiService.getBet365Prematch(fiId);
  }

  @Get('bet365/event/:fi')
  async getBet365Event(@Param('fi') fiId: string) {
    return this.betsapiService.getBet365Event(fiId);
  }

  @Get('bet365/result/:id')
  async getBet365Result(@Param('id') eventId: string) {
    return this.betsapiService.getBet365Result(eventId);
  }

  // ==================== ESOCCER HELPERS ====================

  @Get('esoccer/inplay')
  async getEsoccerInplay() {
    return this.betsapiService.getEsoccerInplay();
  }

  @Get('esoccer/upcoming')
  async getEsoccerUpcoming() {
    return this.betsapiService.getEsoccerUpcoming();
  }

  @Get('esoccer/all')
  async getAllEsoccerEvents() {
    return this.betsapiService.getAllEsoccerEvents();
  }

  @Get('esoccer/battle-8min')
  async getEsoccerBattle8min() {
    return this.betsapiService.getEsoccerBattle8min();
  }

  @Get('esoccer/live-arena')
  async getEsoccerLiveArena() {
    return this.betsapiService.getEsoccerLiveArena();
  }

  @Get('esoccer/gt-leagues')
  async getEsoccerGTLeagues() {
    return this.betsapiService.getEsoccerGTLeagues();
  }

  @Get('esoccer/battle-volta')
  async getEsoccerBattleVolta() {
    return this.betsapiService.getEsoccerBattleVolta();
  }

  // ==================== SYNC API ====================

  @Post('sync/day')
  async syncDay(@Query('day') day?: string) {
    const dayStr = day || new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return this.syncService.syncDayEvents(dayStr);
  }

  @Post('sync/backfill')
  async backfill(@Query('days') days?: string) {
    const numDays = parseInt(days || '7') || 7;
    return this.syncService.backfillHistory(numDays);
  }

  @Post('sync/ht')
  async syncHT() {
    return this.syncService.syncMissingHTScores();
  }

  @Post('sync/full')
  async fullSync() {
    return this.syncService.fullSync();
  }

  @Get('sync/stats')
  async getSyncStats() {
    const partidas = await this.syncService['prisma'].partida.count();
    const jogadores = await this.syncService['prisma'].jogador.count();
    const finalizadas = await this.syncService['prisma'].partida.count({
      where: { status: 'FINALIZADA' },
    });
    const aoVivo = await this.syncService['prisma'].partida.count({
      where: { status: 'AO_VIVO' },
    });
    const comHT = await this.syncService['prisma'].partida.count({
      where: { golsHT1: { not: null } },
    });

    return {
      partidas: { total: partidas, finalizadas, aoVivo, comHT },
      jogadores,
    };
  }
}
