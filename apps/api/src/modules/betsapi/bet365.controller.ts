import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Bet365Service } from './bet365.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bet365')
@UseGuards(JwtAuthGuard)
export class Bet365Controller {
  constructor(private readonly bet365Service: Bet365Service) {}

  @Get('status')
  getRateLimitStatus() {
    return this.bet365Service.getRateLimitStatus();
  }

  @Get('inplay')
  async getInplay() {
    return this.bet365Service.getInplay();
  }

  @Get('inplay/filter')
  async getInplayFilter() {
    return this.bet365Service.getInplayFilter();
  }

  @Get('upcoming')
  async getUpcoming(
    @Query('league_id') leagueId?: string,
    @Query('day') day?: string,
    @Query('page') page?: string,
  ) {
    return this.bet365Service.getUpcoming({ leagueId, day, page });
  }

  @Get('leagues')
  async getLeagues() {
    return this.bet365Service.getLeague();
  }

  @Get('prematch/:fi')
  async getPrematch(@Param('fi') fiId: string) {
    return this.bet365Service.getPrematch(fiId);
  }

  @Get('event/:fi')
  async getEvent(@Param('fi') fiId: string) {
    return this.bet365Service.getEvent(fiId);
  }

  @Get('event/:fi/odds')
  async getEventWithOdds(@Param('fi') fiId: string) {
    return this.bet365Service.getEventWithOdds(fiId);
  }

  @Get('result/:id')
  async getResult(@Param('id') eventId: string) {
    return this.bet365Service.getResult(eventId);
  }

  @Get('history/:id')
  async getEventHistory(@Param('id') eventId: string) {
    return this.bet365Service.getEventHistory(eventId);
  }

  @Get('esoccer/inplay')
  async getEsoccerInplay() {
    return this.bet365Service.getEsoccerInplay();
  }

  @Get('esoccer/upcoming')
  async getEsoccerUpcoming() {
    return this.bet365Service.getEsoccerUpcoming();
  }

  @Get('esoccer/leagues')
  async getEsoccerLeagues() {
    return this.bet365Service.getEsoccerLeagues();
  }

  @Get('esoccer/all')
  async getAllEsoccerData() {
    return this.bet365Service.getAllEsoccerData();
  }
}
