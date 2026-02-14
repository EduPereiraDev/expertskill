import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CacheService } from '../cache/cache.service';

export interface Bet365Event {
  id: string;
  sport_id: string;
  time: string;
  time_status: string;
  league: {
    id: string;
    name: string;
    cc?: string;
  };
  home: {
    id: string;
    name: string;
    image_id?: string;
  };
  away: {
    id: string;
    name: string;
    image_id?: string;
  };
  ss?: string;
  our_event_id?: string;
  bet365_id?: string;
  r_id?: string;
  updated_at?: string;
}

export interface Bet365OddsMarket {
  id: string;
  name: string;
  odds: string;
  header?: string;
  handicap?: string;
}

export interface Bet365EventOdds {
  FI: string;
  event_id: string;
  main?: {
    sp?: Record<string, Bet365OddsMarket[]>;
  };
  schedule?: {
    sp?: Record<string, Bet365OddsMarket[]>;
  };
  stats?: Record<string, any>;
  timer?: {
    tm: number;
    ts: number;
    tt: string;
  };
}

export interface Bet365Result {
  event_id: string;
  ss: string;
  scores?: Record<string, any>;
  time_status: string;
}

interface RateLimitState {
  requestsThisHour: number;
  hourStartedAt: Date;
  maxRequestsPerHour: number;
}

@Injectable()
export class Bet365Service {
  private readonly logger = new Logger(Bet365Service.name);
  private readonly baseUrl: string;
  private readonly token: string;

  private rateLimit: RateLimitState = {
    requestsThisHour: 0,
    hourStartedAt: new Date(),
    maxRequestsPerHour: 3600,
  };

  private readonly SOCCER_SPORT_ID = '1';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.baseUrl = 'https://api.betsapi.com/v3';
    this.token = this.configService.get<string>('BETSAPI_TOKEN') || '';

    if (!this.token) {
      this.logger.warn('BETSAPI_TOKEN não configurado!');
    }
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

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Try again later.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const queryParams = new URLSearchParams({
      token: this.token,
      ...params,
    });

    try {
      this.trackRequest();
      const response = await firstValueFrom(
        this.httpService.get<T>(`${url}?${queryParams.toString()}`),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Erro na requisição Bet365: ${endpoint}`, error);
      throw error;
    }
  }

  async getInplay(): Promise<{ success: number; pager: any; results: Bet365Event[] }> {
    return this.request('/bet365/inplay', {
      sport_id: this.SOCCER_SPORT_ID,
    });
  }

  async getInplayFilter(): Promise<{ success: number; pager: any; results: Bet365Event[] }> {
    return this.request('/bet365/inplay_filter', {
      sport_id: this.SOCCER_SPORT_ID,
    });
  }

  async getUpcoming(params?: { 
    leagueId?: string; 
    day?: string; 
    page?: string 
  }): Promise<{ success: number; pager: any; results: Bet365Event[] }> {
    const queryParams: Record<string, string> = {
      sport_id: this.SOCCER_SPORT_ID,
    };

    if (params?.leagueId) queryParams.league_id = params.leagueId;
    if (params?.day) queryParams.day = params.day;
    if (params?.page) queryParams.page = params.page;

    return this.request('/bet365/upcoming', queryParams);
  }

  async getLeague(): Promise<{ success: number; pager: any; results: Array<{ id: string; name: string }> }> {
    return this.request('/bet365/league', {
      sport_id: this.SOCCER_SPORT_ID,
    });
  }

  async getPrematch(fiId: string): Promise<{ success: number; results: Bet365EventOdds }> {
    return this.request('/bet365/prematch', { FI: fiId });
  }

  async getEvent(fiId: string): Promise<{ success: number; results: Bet365EventOdds }> {
    // /bet365/event não funciona, usar /bet365/prematch
    return this.request('/bet365/prematch', { FI: fiId });
  }

  async getResult(eventId: string): Promise<{ success: number; results: Bet365Result[] }> {
    return this.request('/bet365/result', { event_id: eventId });
  }

  async getEsoccerInplay(): Promise<Bet365Event[]> {
    // Tentar cache primeiro (TTL: 10s)
    const cached = await this.cacheService.getInplayEvents<Bet365Event[]>();
    if (cached) {
      this.logger.debug('Cache HIT: inplay events');
      return cached;
    }

    const response = await this.getInplayFilter();
    const filtered = (response.results || []).filter((e) =>
      e.league?.name?.toLowerCase().includes('soccer') ||
      e.league?.name?.toLowerCase().includes('esoccer')
    );

    // Salvar no cache
    await this.cacheService.setInplayEvents(filtered);
    this.logger.debug('Cache SET: inplay events');
    return filtered;
  }

  async getEsoccerUpcoming(): Promise<Bet365Event[]> {
    // Tentar cache primeiro (TTL: 30s)
    const cached = await this.cacheService.getUpcomingEvents<Bet365Event[]>();
    if (cached) {
      this.logger.debug('Cache HIT: upcoming events');
      return cached;
    }

    const response = await this.getUpcoming();
    const filtered = (response.results || []).filter((e) =>
      e.league?.name?.toLowerCase().includes('soccer') ||
      e.league?.name?.toLowerCase().includes('esoccer')
    );

    // Salvar no cache
    await this.cacheService.setUpcomingEvents(filtered);
    this.logger.debug('Cache SET: upcoming events');
    return filtered;
  }

  async getEsoccerLeagues(): Promise<Array<{ id: string; name: string }>> {
    // Tentar cache primeiro (TTL: 1h)
    const cached = await this.cacheService.getLeagues<Array<{ id: string; name: string }>>();
    if (cached) {
      this.logger.debug('Cache HIT: leagues');
      return cached;
    }

    const response = await this.getLeague();
    const filtered = (response.results || []).filter((l) =>
      l.name?.toLowerCase().includes('soccer') ||
      l.name?.toLowerCase().includes('esoccer')
    );

    // Salvar no cache
    await this.cacheService.setLeagues(filtered);
    this.logger.debug('Cache SET: leagues');
    return filtered;
  }

  async getEventWithOdds(bet365Id: string): Promise<{
    event: Bet365EventOdds | null;
    odds: {
      fullTime1x2?: Bet365OddsMarket[];
      overUnder?: Bet365OddsMarket[];
      bothTeamsToScore?: Bet365OddsMarket[];
      asianHandicap?: Bet365OddsMarket[];
    };
  }> {
    try {
      const response = await this.getPrematch(bet365Id);
      const eventData = response.results;

      if (!eventData) {
        return { event: null, odds: {} };
      }

      const mainOdds = eventData.main?.sp || {};
      const scheduleOdds = eventData.schedule?.sp || {};
      const allOdds = { ...mainOdds, ...scheduleOdds };

      return {
        event: eventData,
        odds: {
          fullTime1x2: allOdds['full_time_result'] || allOdds['to_win_match'] || [],
          overUnder: allOdds['goals_over_under'] || allOdds['total_goals'] || [],
          bothTeamsToScore: allOdds['both_teams_to_score'] || [],
          asianHandicap: allOdds['asian_handicap'] || [],
        },
      };
    } catch (error) {
      this.logger.error(`Error getting odds for ${bet365Id}:`, error);
      return { event: null, odds: {} };
    }
  }

  /**
   * Busca detalhes completos do evento incluindo stats
   * Para e-soccer retorna: attacks, corners, dangerous_attacks, goals
   */
  async getEventView(eventId: string): Promise<{
    success: number;
    results: Array<{
      id: string;
      ss: string;
      scores?: Record<string, { home: string; away: string }>;
      stats?: {
        attacks?: [string, string];
        corners?: [string, string];
        dangerous_attacks?: [string, string];
        goals?: [string, string];
        ball_safe?: [string, string];
      };
      extra?: {
        home_pos?: string;
        away_pos?: string;
        length?: number;
      };
    }>;
  }> {
    return this.request('/event/view', { event_id: eventId });
  }

  async getEventHistory(eventId: string): Promise<{
    h2h: Array<{ home: string; away: string; score: string; date: Date }>;
    homeHistory: Array<{ home: string; away: string; score: string; date: Date }>;
    awayHistory: Array<{ home: string; away: string; score: string; date: Date }>;
  }> {
    try {
      const response = await this.request<any>('/event/history', { event_id: eventId });
      const results = response.results || {};

      const mapGame = (g: any) => ({
        home: g.home?.name || '',
        away: g.away?.name || '',
        score: g.ss || '',
        date: new Date(parseInt(g.time) * 1000),
      });

      return {
        h2h: (results.h2h || []).map(mapGame),
        homeHistory: (results.home || []).map(mapGame),
        awayHistory: (results.away || []).map(mapGame),
      };
    } catch (error) {
      this.logger.error(`Error getting history for ${eventId}:`, error);
      return { h2h: [], homeHistory: [], awayHistory: [] };
    }
  }

  async getEventResult(eventId: string): Promise<{
    homeScore: number;
    awayScore: number;
    homeScoreHT: number;
    awayScoreHT: number;
    status: 'finished' | 'live' | 'upcoming' | 'unknown';
  }> {
    try {
      const response = await this.getResult(eventId);
      const result = response.results?.[0] as any;

      if (!result) {
        return { homeScore: 0, awayScore: 0, homeScoreHT: 0, awayScoreHT: 0, status: 'unknown' };
      }

      const scores = result.ss?.split('-') || [];
      const homeScore = parseInt(scores[0]) || 0;
      const awayScore = parseInt(scores[1]) || 0;

      // Extrair placar do HT do campo scores (formato: { "1": { home: "1", away: "0" }, "2": {...} })
      let homeScoreHT = 0;
      let awayScoreHT = 0;
      if (result.scores && result.scores['1']) {
        homeScoreHT = parseInt(result.scores['1'].home) || 0;
        awayScoreHT = parseInt(result.scores['1'].away) || 0;
      }

      let status: 'finished' | 'live' | 'upcoming' | 'unknown' = 'unknown';
      switch (result.time_status) {
        case '3':
          status = 'finished';
          break;
        case '1':
          status = 'live';
          break;
        case '0':
          status = 'upcoming';
          break;
      }

      return { homeScore, awayScore, homeScoreHT, awayScoreHT, status };
    } catch (error) {
      this.logger.error(`Error getting result for ${eventId}:`, error);
      return { homeScore: 0, awayScore: 0, homeScoreHT: 0, awayScoreHT: 0, status: 'unknown' };
    }
  }

  async getAllEsoccerData(): Promise<{
    inplay: Bet365Event[];
    upcoming: Bet365Event[];
    leagues: Array<{ id: string; name: string }>;
    rateLimit: { used: number; remaining: number };
  }> {
    const [inplay, upcoming, leagues] = await Promise.all([
      this.getEsoccerInplay(),
      this.getEsoccerUpcoming(),
      this.getEsoccerLeagues(),
    ]);

    const rateLimitStatus = this.getRateLimitStatus();

    return {
      inplay,
      upcoming,
      leagues,
      rateLimit: {
        used: rateLimitStatus.used,
        remaining: rateLimitStatus.remaining,
      },
    };
  }

  /**
   * Busca eventos finalizados de uma liga (para construir tabela)
   * Nota: Ligas de e-soccer não têm tabela oficial (has_leaguetable=0)
   * Por isso calculamos a partir dos resultados
   */
  async getEndedEvents(leagueId: string, day?: string): Promise<{
    success: number;
    pager: any;
    results: Array<{
      id: string;
      home: { id: string; name: string };
      away: { id: string; name: string };
      ss: string;
      time: string;
      time_status: string;
      scores?: Record<string, { home: string; away: string }>;
    }>;
  }> {
    const params: Record<string, string> = {
      sport_id: this.SOCCER_SPORT_ID,
      league_id: leagueId,
    };
    if (day) params.day = day;

    return this.request('/events/ended', params);
  }

  /**
   * Constrói tabela da liga a partir dos eventos finalizados
   * Usado para ligas de e-soccer que não têm tabela oficial
   */
  async buildLeagueTable(leagueId: string, days: number = 3): Promise<{
    available: boolean;
    table: Array<{
      position: number;
      teamId: string;
      teamName: string;
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDiff: number;
      points: number;
      form: string[];
    }>;
    gamesAnalyzed: number;
    dataSource: 'CALCULATED_FROM_RESULTS';
  }> {
    const allEvents: any[] = [];

    // Buscar últimos N dias
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toISOString().split('T')[0].replace(/-/g, '');

      try {
        const response = await this.getEndedEvents(leagueId, day);
        if (response.results) {
          allEvents.push(...response.results);
        }
      } catch (error) {
        this.logger.warn(`Error fetching ended events for day ${day}`);
      }
    }

    if (allEvents.length === 0) {
      return { available: false, table: [], gamesAnalyzed: 0, dataSource: 'CALCULATED_FROM_RESULTS' };
    }

    // Agregar estatísticas por time
    const teamStats = new Map<string, {
      teamId: string;
      teamName: string;
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      results: { time: number; result: 'W' | 'D' | 'L' }[];
    }>();

    for (const event of allEvents) {
      if (event.time_status !== '3' || !event.ss) continue;

      const [homeGoals, awayGoals] = event.ss.split('-').map((s: string) => parseInt(s) || 0);
      const homeId = event.home?.id;
      const awayId = event.away?.id;
      const homeName = event.home?.name || '';
      const awayName = event.away?.name || '';
      const eventTime = parseInt(event.time) || 0;

      // Inicializar times
      if (!teamStats.has(homeId)) {
        teamStats.set(homeId, {
          teamId: homeId, teamName: homeName,
          played: 0, wins: 0, draws: 0, losses: 0,
          goalsFor: 0, goalsAgainst: 0, results: [],
        });
      }
      if (!teamStats.has(awayId)) {
        teamStats.set(awayId, {
          teamId: awayId, teamName: awayName,
          played: 0, wins: 0, draws: 0, losses: 0,
          goalsFor: 0, goalsAgainst: 0, results: [],
        });
      }

      const home = teamStats.get(homeId)!;
      const away = teamStats.get(awayId)!;

      home.played++; away.played++;
      home.goalsFor += homeGoals; home.goalsAgainst += awayGoals;
      away.goalsFor += awayGoals; away.goalsAgainst += homeGoals;

      if (homeGoals > awayGoals) {
        home.wins++; away.losses++;
        home.results.push({ time: eventTime, result: 'W' });
        away.results.push({ time: eventTime, result: 'L' });
      } else if (homeGoals < awayGoals) {
        home.losses++; away.wins++;
        home.results.push({ time: eventTime, result: 'L' });
        away.results.push({ time: eventTime, result: 'W' });
      } else {
        home.draws++; away.draws++;
        home.results.push({ time: eventTime, result: 'D' });
        away.results.push({ time: eventTime, result: 'D' });
      }
    }

    // Converter para array ordenado por pontos
    const table = Array.from(teamStats.values())
      .map(t => ({
        position: 0,
        teamId: t.teamId,
        teamName: t.teamName,
        played: t.played,
        wins: t.wins,
        draws: t.draws,
        losses: t.losses,
        goalsFor: t.goalsFor,
        goalsAgainst: t.goalsAgainst,
        goalDiff: t.goalsFor - t.goalsAgainst,
        points: t.wins * 3 + t.draws,
        form: t.results
          .sort((a, b) => b.time - a.time)
          .slice(0, 5)
          .map(r => r.result),
      }))
      .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff)
      .map((t, i) => ({ ...t, position: i + 1 }));

    return {
      available: true,
      table,
      gamesAnalyzed: allEvents.filter(e => e.time_status === '3').length,
      dataSource: 'CALCULATED_FROM_RESULTS',
    };
  }
}
