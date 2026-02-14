import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface BetsApiEvent {
  id: string;
  sport_id: string;
  time: number;
  time_status: string;
  league: {
    id: string;
    name: string;
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
  scores?: Record<string, any>;
  timer?: {
    tm: number;
    ts: number;
    tt: string;
  };
  bet365_id?: string;
  our_event_id?: string;
}

export interface BetsApiOdds {
  event_id: string;
  odds: {
    [market: string]: {
      [bookmaker: string]: Array<{
        id: string;
        odds: string;
        name?: string;
        handicap?: string;
      }>;
    };
  };
}

export interface Bet365Event {
  id: string;
  sport_id: string;
  time: string;
  time_status: string;
  league: { id: string; name: string };
  home: { id: string; name: string };
  away: { id: string; name: string };
  ss?: string;
  our_event_id?: string;
  r_id?: string;
  ev_id?: string;
  updated_at?: string;
}

export interface Bet365Odds {
  FI: string;
  event_id: string;
  odds?: Record<string, any>;
  stats?: Record<string, any>;
}

export interface EventHistory {
  id: string;
  sport_id: string;
  home: { id: string; name: string };
  away: { id: string; name: string };
  ss: string;
  time: string;
  league: { id: string; name: string };
}

export interface StatsTrend {
  home: Record<string, any>;
  away: Record<string, any>;
}

@Injectable()
export class BetsapiService {
  private readonly logger = new Logger(BetsapiService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  private readonly SOCCER_SPORT_ID = '1';
  private readonly ESPORTS_SPORT_ID = '151';

  private readonly ESOCCER_LEAGUES = {
    FIFA_ESPORTS: '23000',
    BATTLE_8MIN: '22614',
    LIVE_ARENA_10MIN: '22821',
    GT_LEAGUES_12MIN: '23114',
    BATTLE_VOLTA_6MIN: '38439',
    H2H_GG_LEAGUE: '40000',
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('BETSAPI_BASE_URL') || 'https://api.betsapi.com/v3';
    this.token = this.configService.get<string>('BETSAPI_TOKEN') || '';
    
    if (!this.token) {
      this.logger.warn('BETSAPI_TOKEN não configurado!');
    }
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const queryParams = new URLSearchParams({
      token: this.token,
      ...params,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(`${url}?${queryParams.toString()}`),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Erro na requisição BetsAPI: ${endpoint}`, error);
      throw error;
    }
  }

  // ==================== EVENTS API ====================

  async getInplayEvents(sportId?: string): Promise<{ success: number; results: BetsApiEvent[] }> {
    return this.request('/events/inplay', {
      sport_id: sportId || this.SOCCER_SPORT_ID,
    });
  }

  async getUpcomingEvents(params?: { sportId?: string; leagueId?: string; day?: string; page?: string }): Promise<{ success: number; pager: any; results: BetsApiEvent[] }> {
    const queryParams: Record<string, string> = {
      sport_id: params?.sportId || this.SOCCER_SPORT_ID,
    };
    
    if (params?.leagueId) queryParams.league_id = params.leagueId;
    if (params?.day) queryParams.day = params.day;
    if (params?.page) queryParams.page = params.page;

    return this.request('/events/upcoming', queryParams);
  }

  async getEndedEvents(params?: { sportId?: string; leagueId?: string; day?: string; page?: string }): Promise<{ success: number; pager: any; results: BetsApiEvent[] }> {
    const queryParams: Record<string, string> = {
      sport_id: params?.sportId || this.SOCCER_SPORT_ID,
    };
    
    if (params?.leagueId) queryParams.league_id = params.leagueId;
    if (params?.day) queryParams.day = params.day;
    if (params?.page) queryParams.page = params.page;

    return this.request('/events/ended', queryParams);
  }

  async searchEvents(query: string, sportId?: string): Promise<{ success: number; results: BetsApiEvent[] }> {
    return this.request('/events/search', {
      sport_id: sportId || this.SOCCER_SPORT_ID,
      home: query,
    });
  }

  async getEventView(eventId: string): Promise<{ success: number; results: BetsApiEvent[] }> {
    return this.request('/event/view', { event_id: eventId });
  }

  async getEventHistory(eventId: string): Promise<{ success: number; results: EventHistory[] }> {
    return this.request('/event/history', { event_id: eventId });
  }

  async getEventOdds(eventId: string, source?: string): Promise<{ success: number; results: BetsApiOdds }> {
    const params: Record<string, string> = { event_id: eventId };
    if (source) params.source = source;
    return this.request('/event/odds', params);
  }

  async getEventOddsSummary(eventId: string): Promise<{ success: number; results: any }> {
    return this.request('/event/odds/summary', { event_id: eventId });
  }

  async getEventStatsTrend(eventId: string): Promise<{ success: number; results: StatsTrend }> {
    return this.request('/event/stats_trend', { event_id: eventId });
  }

  async getEventLineup(eventId: string): Promise<{ success: number; results: any }> {
    return this.request('/event/lineup', { event_id: eventId });
  }

  // ==================== LEAGUE API ====================

  async getLeagues(sportId?: string, page?: string): Promise<{ success: number; pager: any; results: Array<{ id: string; name: string; cc?: string }> }> {
    const params: Record<string, string> = { sport_id: sportId || this.SOCCER_SPORT_ID };
    if (page) params.page = page;
    return this.request('/league', params);
  }

  async getLeagueTable(leagueId: string): Promise<{ success: number; results: any }> {
    return this.request('/league/table', { league_id: leagueId });
  }

  async getLeagueToplist(leagueId: string): Promise<{ success: number; results: any }> {
    return this.request('/league/toplist', { league_id: leagueId });
  }

  // ==================== TEAM API ====================

  async getTeam(teamId: string): Promise<{ success: number; results: any }> {
    return this.request('/team', { team_id: teamId });
  }

  async getTeamSquad(teamId: string): Promise<{ success: number; results: any }> {
    return this.request('/team/squad', { team_id: teamId });
  }

  async getTeamMembers(teamId: string): Promise<{ success: number; results: any }> {
    return this.request('/team/members', { team_id: teamId });
  }

  // ==================== PLAYER API ====================

  async getPlayer(playerId: string): Promise<{ success: number; results: any }> {
    return this.request('/player', { player_id: playerId });
  }

  // ==================== BET365 API ====================

  async getBet365Inplay(sportId?: string): Promise<{ success: number; pager: any; results: Bet365Event[] }> {
    return this.request('/bet365/inplay', {
      sport_id: sportId || this.SOCCER_SPORT_ID,
    });
  }

  async getBet365InplayFilter(sportId?: string): Promise<{ success: number; pager: any; results: Bet365Event[] }> {
    return this.request('/bet365/inplay_filter', {
      sport_id: sportId || this.SOCCER_SPORT_ID,
    });
  }

  async getBet365Upcoming(sportId?: string, leagueId?: string, day?: string): Promise<{ success: number; pager: any; results: Bet365Event[] }> {
    const params: Record<string, string> = { sport_id: sportId || this.SOCCER_SPORT_ID };
    if (leagueId) params.league_id = leagueId;
    if (day) params.day = day;
    return this.request('/bet365/upcoming', params);
  }

  async getBet365Prematch(fiId: string): Promise<{ success: number; results: Bet365Odds }> {
    return this.request('/bet365/prematch', { FI: fiId });
  }

  async getBet365Event(fiId: string): Promise<{ success: number; results: Bet365Odds }> {
    return this.request('/bet365/event', { FI: fiId });
  }

  async getBet365Result(eventId: string): Promise<{ success: number; results: any }> {
    return this.request('/bet365/result', { event_id: eventId });
  }

  // ==================== ESOCCER HELPERS ====================

  async getEsoccerInplay(): Promise<{ success: number; results: Bet365Event[] }> {
    const response = await this.getBet365Inplay(this.SOCCER_SPORT_ID);
    const esoccerEvents = (response.results || []).filter(
      (e) => e.league?.name?.toLowerCase().includes('soccer') || 
             e.league?.name?.toLowerCase().includes('esoccer')
    );
    return { success: response.success, results: esoccerEvents };
  }

  async getEsoccerUpcoming(): Promise<{ success: number; results: Bet365Event[] }> {
    const response = await this.getBet365Upcoming(this.SOCCER_SPORT_ID);
    const esoccerEvents = (response.results || []).filter(
      (e) => e.league?.name?.toLowerCase().includes('soccer') || 
             e.league?.name?.toLowerCase().includes('esoccer')
    );
    return { success: response.success, results: esoccerEvents };
  }

  async getEsoccerBattle8min(): Promise<{ success: number; pager: any; results: BetsApiEvent[] }> {
    return this.getUpcomingEvents({ leagueId: this.ESOCCER_LEAGUES.BATTLE_8MIN });
  }

  async getEsoccerLiveArena(): Promise<{ success: number; pager: any; results: BetsApiEvent[] }> {
    return this.getUpcomingEvents({ leagueId: this.ESOCCER_LEAGUES.LIVE_ARENA_10MIN });
  }

  async getEsoccerGTLeagues(): Promise<{ success: number; pager: any; results: BetsApiEvent[] }> {
    return this.getUpcomingEvents({ leagueId: this.ESOCCER_LEAGUES.GT_LEAGUES_12MIN });
  }

  async getEsoccerBattleVolta(): Promise<{ success: number; pager: any; results: BetsApiEvent[] }> {
    return this.getUpcomingEvents({ leagueId: this.ESOCCER_LEAGUES.BATTLE_VOLTA_6MIN });
  }

  async getAllEsoccerEvents(): Promise<{
    inplay: Bet365Event[];
    upcoming: Bet365Event[];
  }> {
    const [inplayResponse, upcomingResponse] = await Promise.all([
      this.getEsoccerInplay(),
      this.getEsoccerUpcoming(),
    ]);

    return {
      inplay: inplayResponse.results || [],
      upcoming: upcomingResponse.results || [],
    };
  }

  async getEventWithOdds(eventId: string): Promise<{
    event: BetsApiEvent | null;
    odds: BetsApiOdds | null;
    history: EventHistory[];
    stats: StatsTrend | null;
  }> {
    const [eventResponse, oddsResponse, historyResponse, statsResponse] = await Promise.all([
      this.getEventView(eventId),
      this.getEventOdds(eventId),
      this.getEventHistory(eventId).catch(() => ({ success: 0, results: [] })),
      this.getEventStatsTrend(eventId).catch(() => ({ success: 0, results: null })),
    ]);

    return {
      event: eventResponse.results?.[0] || null,
      odds: oddsResponse.results || null,
      history: historyResponse.results || [],
      stats: statsResponse.results || null,
    };
  }

  getLeagueIds(): typeof this.ESOCCER_LEAGUES {
    return this.ESOCCER_LEAGUES;
  }
}
