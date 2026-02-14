import { Injectable, Logger } from '@nestjs/common';
import { Bet365Service } from './bet365.service';

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES - ANÁLISE PROFISSIONAL DE MERCADO E-SOCCER
// ═══════════════════════════════════════════════════════════════════════════

// 1️⃣ Contexto do Confronto
export interface MatchContext {
  league: string;
  leagueType: 'GT_LEAGUE' | 'H2H_BATTLE' | 'VOLTA' | 'OTHER';
  duration: string; // "6 minutos", "8 minutos", "12 minutos"
  matchType: 'PARTIDA_UNICA' | 'IDA' | 'VOLTA' | 'UNKNOWN';
  competitiveContext: string;
  dataSource: 'API' | 'INFERRED';
}

// 2️⃣ Tabela e Posição - Calculada a partir do histórico (API não fornece tabela oficial)
export interface TablePosition {
  available: boolean;
  reason: string;
  // Forma recente calculada do histórico
  homeForm?: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    lastResults: string[]; // ['W', 'L', 'D', 'W', 'W']
    gamesAnalyzed: number;
  };
  awayForm?: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    lastResults: string[]; // ['W', 'L', 'D', 'W', 'W']
    gamesAnalyzed: number;
  };
  competitiveAssessment?: string;
}

// 3️⃣ Gols no HT e FT
export interface GoalsAnalysis {
  ht: { home: number; away: number; total: number };
  ft: { home: number; away: number; total: number };
  secondHalf: { home: number; away: number; total: number };
  concentration: 'RAPIDA' | 'NORMAL' | 'ESPALHADA' | 'SEM_GOLS';
  aggressivityPattern: 'ALTA_AGRESSIVIDADE' | 'NORMAL' | 'BAIXA_AGRESSIVIDADE' | 'PERIODOS_MORTOS';
  pattern: string;
  timeline: string;
}

// 4️⃣ Linhas Abertas no Mercado
export interface LineAnalysis {
  line: string;
  odds: number | null;
  oddsSource: 'API' | 'UNAVAILABLE';
  paid: boolean;
  margin: number;
  efficiency: 'high' | 'medium' | 'low' | 'none';
  coherentWithContext: boolean | null; // null se não temos dados de tabela
  marketAssessment: 'COERENTE' | 'FORCADA' | 'ESTICADA' | 'UNKNOWN';
}

// 5️⃣ Pagamento Real da Linha
export interface PaymentAnalysis {
  linesPaidHT: string[];
  linesPaidFT: string[];
  linesNotPaid: string[];
  excessGoalsWithoutPayment: boolean;
  marginBlockedProfit: boolean;
  paymentSummary: string;
}

// 6️⃣ Odd e Margem de Gols
export interface OddsMarginAnalysis {
  goalsInPayableOdds: number;
  visualGoals: number;
  marginMadeSense: boolean;
  lineControlled: boolean;
  assessment: string;
}

// 7️⃣ Risco de 0x0 (Leitura Anti-Armadilha)
export interface ZeroZeroRisk {
  htRisk: 'BAIXO' | 'MEDIO' | 'ALTO';
  ftRisk: 'BAIXO' | 'MEDIO' | 'ALTO';
  signals: string[];
  assessment: string;
}

// 8️⃣ Objetivo dos Gols
export interface GoalsObjective {
  classification: 'COMPETITIVO' | 'MERCADO' | 'VISUAL_ALEATORIO' | 'INDETERMINADO';
  reasoning: string;
  dataSource: 'INFERRED' | 'INSUFFICIENT_DATA';
}

// 9️⃣ Conclusão Técnica
export interface TechnicalConclusion {
  classification: 
    | 'LINHA_BEM_ESTRUTURADA'
    | 'LINHA_MAL_PAGA'
    | 'EXCESSO_GOLS_SEM_OBJETIVO'
    | 'JOGO_TRAVADO_PARA_MERCADO'
    | 'POSSIVEL_MANIPULACAO_VISUAL';
  summary: string;
  educationalNote: string;
}

// Interface Principal - Análise Completa
export interface FullMatchAnalysis {
  eventId: string;
  home: string;
  away: string;
  analyzedAt: Date;
  
  // 9 Seções do Prompt Profissional
  context: MatchContext;           // 1️⃣
  tablePosition: TablePosition;    // 2️⃣
  goals: GoalsAnalysis;            // 3️⃣
  linesHT: LineAnalysis[];         // 4️⃣
  linesFT: LineAnalysis[];         // 4️⃣
  payment: PaymentAnalysis;        // 5️⃣
  oddsMargin: OddsMarginAnalysis;  // 6️⃣
  zeroZeroRisk: ZeroZeroRisk;      // 7️⃣
  goalsObjective: GoalsObjective;  // 8️⃣
  conclusion: TechnicalConclusion; // 9️⃣
  
  // Métricas
  marketEfficiency: number;
  dataCompleteness: number; // % de dados disponíveis da API
}

// Interface legada para compatibilidade
export interface MarketAnalysis {
  eventId: string;
  home: string;
  away: string;
  league: string;
  goals: GoalsAnalysis;
  linesHT: LineAnalysis[];
  linesFT: LineAnalysis[];
  marketEfficiency: number;
  classification: 
    | 'LINHA_BEM_PAGA'
    | 'LINHA_MAL_PAGA'
    | 'EXCESSO_GOLS_SEM_PAGAMENTO'
    | 'LINHA_CONTROLADA'
    | 'PADRAO_MANIPULACAO_VISUAL';
  technicalConclusion: string;
  educationalNote: string;
}

export interface HistoricalPattern {
  avgGoalsHT: number | null;
  avgGoalsFT: number | null;
  overHTPct: number | null;
  overFTPct: number | null;
  gamesAnalyzed: number;
  dataSource: 'API' | 'INSUFFICIENT_DATA';
}

@Injectable()
export class MarketAnalysisService {
  private readonly logger = new Logger(MarketAnalysisService.name);

  private readonly STANDARD_LINES_HT = [0.5, 1.5, 2.5, 3.5];
  private readonly STANDARD_LINES_FT = [1.5, 2.5, 3.5, 4.5, 5.5, 6.5];

  constructor(private readonly bet365Service: Bet365Service) {}

  async analyzeMatch(eventId: string): Promise<MarketAnalysis> {
    const [resultData, oddsData, historyData] = await Promise.all([
      this.bet365Service.getResult(eventId),
      this.bet365Service.getPrematch(eventId).catch(() => null),
      this.bet365Service.getEventHistory(eventId),
    ]);

    const result = resultData.results?.[0] as any;
    if (!result) {
      throw new Error('Event not found or not finished');
    }

    const goals = this.analyzeGoals(result);
    const historicalPattern = this.calculateHistoricalPattern(historyData);
    const linesHT = this.analyzeLinesHT(goals, oddsData, historicalPattern);
    const linesFT = this.analyzeLinesFT(goals, oddsData, historicalPattern);
    const marketEfficiency = this.calculateMarketEfficiency(linesHT, linesFT);
    const classification = this.classifyMatch(goals, linesHT, linesFT, marketEfficiency);
    const technicalConclusion = this.generateTechnicalConclusion(goals, linesHT, linesFT, classification);
    const educationalNote = this.generateEducationalNote(classification);

    return {
      eventId,
      home: result.home?.name || '',
      away: result.away?.name || '',
      league: result.league?.name || '',
      goals,
      linesHT,
      linesFT,
      marketEfficiency,
      classification,
      technicalConclusion,
      educationalNote,
    };
  }

  private analyzeGoals(result: any): GoalsAnalysis {
    const scores = result.scores || {};
    const htScore = scores['1'] || { home: '0', away: '0' };
    const ftParts = (result.ss || '0-0').split('-');

    const ht = {
      home: parseInt(htScore.home) || 0,
      away: parseInt(htScore.away) || 0,
      total: 0,
    };
    ht.total = ht.home + ht.away;

    const ft = {
      home: parseInt(ftParts[0]) || 0,
      away: parseInt(ftParts[1]) || 0,
      total: 0,
    };
    ft.total = ft.home + ft.away;

    const secondHalf = {
      home: ft.home - ht.home,
      away: ft.away - ht.away,
      total: ft.total - ht.total,
    };

    const concentration = this.analyzeGoalConcentration(ht.total, secondHalf.total, result.events);
    const pattern = this.identifyGoalPattern(ht, ft, secondHalf);
    const aggressivityPattern = this.analyzeAggressivity(ht.total, secondHalf.total, result.stats);
    const timeline = this.generateTimeline(ht, secondHalf);

    return { ht, ft, secondHalf, concentration, aggressivityPattern, pattern, timeline };
  }

  private analyzeGoalConcentration(
    htGoals: number,
    shGoals: number,
    events?: any[],
  ): GoalsAnalysis['concentration'] {
    const totalGoals = htGoals + shGoals;
    if (totalGoals === 0) return 'SEM_GOLS';
    
    if (!events || events.length === 0) {
      const diff = Math.abs(htGoals - shGoals);
      if (diff >= 3) return 'RAPIDA';
      if (htGoals > 0 && shGoals > 0) return 'ESPALHADA';
      return 'NORMAL';
    }

    const goalEvents = events.filter((e) => e.text?.includes('Goal'));
    if (goalEvents.length < 2) return 'NORMAL';

    return 'NORMAL';
  }

  private analyzeAggressivity(
    htGoals: number, 
    shGoals: number,
    stats?: { attacks?: [string, string]; dangerous_attacks?: [string, string] }
  ): GoalsAnalysis['aggressivityPattern'] {
    const total = htGoals + shGoals;
    
    // Se temos stats do Event View, usar para análise mais precisa
    if (stats?.dangerous_attacks) {
      const totalDangerousAttacks = parseInt(stats.dangerous_attacks[0] || '0') + parseInt(stats.dangerous_attacks[1] || '0');
      if (totalDangerousAttacks >= 50 && total >= 4) return 'ALTA_AGRESSIVIDADE';
      if (totalDangerousAttacks < 20 && total <= 1) return 'BAIXA_AGRESSIVIDADE';
    }
    
    if (total === 0) return 'BAIXA_AGRESSIVIDADE';
    if (total >= 6) return 'ALTA_AGRESSIVIDADE';
    if ((htGoals === 0 && shGoals > 0) || (htGoals > 0 && shGoals === 0)) return 'PERIODOS_MORTOS';
    return 'NORMAL';
  }

  private generateTimeline(
    ht: { home: number; away: number; total: number },
    sh: { home: number; away: number; total: number },
  ): string {
    if (ht.total === 0 && sh.total === 0) return '0x0 no HT → 0x0 no FT';
    if (ht.total >= 2 && sh.total === 0) return `${ht.total} gols no HT → Jogo morreu no 2T`;
    if (ht.total === 0 && sh.total >= 2) return `0x0 no HT → ${sh.total} gols no 2T`;
    return `${ht.total} gols no HT → ${sh.total} gols no 2T`;
  }

  private identifyGoalPattern(
    ht: { home: number; away: number; total: number },
    ft: { home: number; away: number; total: number },
    sh: { home: number; away: number; total: number },
  ): string {
    if (ht.total >= 3 && sh.total <= 1) {
      return 'EXPLOSAO_HT_MORTO_SH';
    }
    if (ht.total <= 1 && sh.total >= 3) {
      return 'LENTO_HT_EXPLOSAO_SH';
    }
    if (ht.total >= 2 && sh.total >= 2) {
      return 'EQUILIBRADO_ALTO';
    }
    if (ht.total <= 1 && sh.total <= 1) {
      return 'BAIXO_GERAL';
    }
    return 'NORMAL';
  }

  private calculateHistoricalPattern(historyData: any): HistoricalPattern {
    const h2h = historyData.h2h || [];
    
    if (h2h.length === 0) {
      return {
        avgGoalsHT: null,
        avgGoalsFT: null,
        overHTPct: null,
        overFTPct: null,
        gamesAnalyzed: 0,
        dataSource: 'INSUFFICIENT_DATA',
      };
    }

    let totalGoalsFT = 0;
    let totalGoalsHT = 0;
    let over25FTCount = 0;
    let over15HTCount = 0;
    let gamesWithHTData = 0;

    for (const game of h2h) {
      const parts = (game.score || game.ss || '0-0').split('-');
      const goalsFT = (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0);
      totalGoalsFT += goalsFT;
      if (goalsFT > 2) over25FTCount++;
      
      // Se tiver dados de HT no histórico
      if (game.scores?.['1']) {
        const htHome = parseInt(game.scores['1'].home) || 0;
        const htAway = parseInt(game.scores['1'].away) || 0;
        totalGoalsHT += htHome + htAway;
        if (htHome + htAway > 1) over15HTCount++;
        gamesWithHTData++;
      }
    }

    const avgGoalsFT = totalGoalsFT / h2h.length;
    const overFTPct = (over25FTCount / h2h.length) * 100;
    
    // HT só se tiver dados reais
    const avgGoalsHT = gamesWithHTData > 0 ? totalGoalsHT / gamesWithHTData : null;
    const overHTPct = gamesWithHTData > 0 ? (over15HTCount / gamesWithHTData) * 100 : null;

    return {
      avgGoalsHT,
      avgGoalsFT,
      overHTPct,
      overFTPct,
      gamesAnalyzed: h2h.length,
      dataSource: 'API',
    };
  }


  private analyzeLinesHT(
    goals: GoalsAnalysis,
    oddsData: any,
    _pattern: HistoricalPattern,
  ): LineAnalysis[] {
    const lines: LineAnalysis[] = [];
    const htGoals = goals.ht.total;

    for (const line of this.STANDARD_LINES_HT) {
      const paid = htGoals > line;
      const margin = htGoals - line;
      const odds = this.extractOddsForLine(oddsData, `over_${line}_ht`);
      
      lines.push({
        line: `Over ${line} HT`,
        odds,
        oddsSource: odds !== null ? 'API' : 'UNAVAILABLE',
        paid,
        margin,
        efficiency: this.calculateLineEfficiency(paid, margin, odds),
        coherentWithContext: null, // Sem dados de tabela disponíveis
        marketAssessment: 'UNKNOWN' as const,
      });
    }

    return lines;
  }

  private analyzeLinesFT(
    goals: GoalsAnalysis,
    oddsData: any,
    _pattern: HistoricalPattern,
  ): LineAnalysis[] {
    const lines: LineAnalysis[] = [];
    const ftGoals = goals.ft.total;

    for (const line of this.STANDARD_LINES_FT) {
      const paid = ftGoals > line;
      const margin = ftGoals - line;
      const odds = this.extractOddsForLine(oddsData, `over_${line}_ft`);
      
      lines.push({
        line: `Over ${line} FT`,
        odds,
        oddsSource: odds !== null ? 'API' : 'UNAVAILABLE',
        paid,
        margin,
        efficiency: this.calculateLineEfficiency(paid, margin, odds),
        coherentWithContext: null, // Sem dados de tabela disponíveis
        marketAssessment: 'UNKNOWN' as const,
      });
    }

    return lines;
  }

  private extractOddsForLine(oddsData: any, lineKey: string): number | null {
    if (!oddsData?.results?.[0]?.main?.sp?.goals_over_under?.odds) {
      return null;
    }

    const odds = oddsData.results[0].main.sp.goals_over_under.odds;
    const lineNum = lineKey.match(/\d+\.?\d*/)?.[0];
    
    for (const odd of odds) {
      if (odd.header === 'Over' && odd.name === lineNum) {
        return parseFloat(odd.odds);
      }
    }

    return null;
  }


  private calculateLineEfficiency(paid: boolean, margin: number, odds: number | null): 'high' | 'medium' | 'low' | 'none' {
    if (!paid) return 'none';
    
    // Se não temos odds da API, classificamos apenas pela margem
    if (odds === null) {
      if (margin >= 2) return 'medium';
      if (margin >= 1) return 'low';
      return 'low';
    }
    
    if (margin >= 2 && odds >= 1.5) return 'high';
    if (margin >= 1 && odds >= 1.3) return 'medium';
    return 'low';
  }

  private calculateMarketEfficiency(linesHT: LineAnalysis[], linesFT: LineAnalysis[]): number {
    const allLines = [...linesHT, ...linesFT];
    const paidLines = allLines.filter((l) => l.paid);
    
    if (paidLines.length === 0) return 0;

    const efficiencyScore = paidLines.reduce((acc, line) => {
      switch (line.efficiency) {
        case 'high': return acc + 3;
        case 'medium': return acc + 2;
        case 'low': return acc + 1;
        default: return acc;
      }
    }, 0);

    return Math.round((efficiencyScore / (allLines.length * 3)) * 100);
  }

  private classifyMatch(
    goals: GoalsAnalysis,
    linesHT: LineAnalysis[],
    linesFT: LineAnalysis[],
    efficiency: number,
  ): MarketAnalysis['classification'] {
    const totalGoals = goals.ft.total;
    const paidLinesHT = linesHT.filter((l) => l.paid).length;
    const paidLinesFT = linesFT.filter((l) => l.paid).length;
    const totalPaid = paidLinesHT + paidLinesFT;

    if (totalGoals >= 5 && totalPaid <= 2) {
      return 'EXCESSO_GOLS_SEM_PAGAMENTO';
    }

    if (totalGoals >= 4 && efficiency < 30) {
      return 'PADRAO_MANIPULACAO_VISUAL';
    }

    if (goals.pattern === 'EXPLOSAO_HT_MORTO_SH' || goals.pattern === 'LENTO_HT_EXPLOSAO_SH') {
      if (efficiency < 40) {
        return 'LINHA_CONTROLADA';
      }
    }

    if (efficiency >= 60) {
      return 'LINHA_BEM_PAGA';
    }

    return 'LINHA_MAL_PAGA';
  }

  private generateTechnicalConclusion(
    goals: GoalsAnalysis,
    linesHT: LineAnalysis[],
    linesFT: LineAnalysis[],
    classification: MarketAnalysis['classification'],
  ): string {
    const htPaid = linesHT.filter((l) => l.paid).map((l) => l.line).join(', ') || 'Nenhuma';
    const ftPaid = linesFT.filter((l) => l.paid).map((l) => l.line).join(', ') || 'Nenhuma';

    let conclusion = `📊 **ANÁLISE TÉCNICA**\n\n`;
    conclusion += `**Gols HT:** ${goals.ht.total} (${goals.ht.home}-${goals.ht.away})\n`;
    conclusion += `**Gols FT:** ${goals.ft.total} (${goals.ft.home}-${goals.ft.away})\n`;
    conclusion += `**Padrão:** ${goals.pattern}\n\n`;
    conclusion += `**Linhas pagas HT:** ${htPaid}\n`;
    conclusion += `**Linhas pagas FT:** ${ftPaid}\n\n`;

    switch (classification) {
      case 'LINHA_BEM_PAGA':
        conclusion += `✅ **Conclusão:** Jogo com boa eficiência de mercado. Os gols ocorreram em momentos que pagaram linhas relevantes com odds atrativas.`;
        break;
      case 'LINHA_MAL_PAGA':
        conclusion += `⚠️ **Conclusão:** Jogo com baixa eficiência. Apesar dos gols, as linhas principais não foram pagas ou tiveram margem insuficiente.`;
        break;
      case 'EXCESSO_GOLS_SEM_PAGAMENTO':
        conclusion += `❌ **Conclusão:** Muitos gols (${goals.ft.total}), mas sem pagamento real de mercado. Os gols foram "visuais" - não converteram em lucro para linhas padrão.`;
        break;
      case 'LINHA_CONTROLADA':
        conclusion += `🎯 **Conclusão:** Padrão de linha controlada. A concentração de gols em um período específico sugere controle de mercado pela casa.`;
        break;
      case 'PADRAO_MANIPULACAO_VISUAL':
        conclusion += `🚨 **Conclusão:** Padrão suspeito. Alto volume de gols com baixíssima eficiência de pagamento. Possível manipulação visual de mercado.`;
        break;
    }

    return conclusion;
  }

  private generateEducationalNote(classification: MarketAnalysis['classification']): string {
    return `📚 **NOTA EDUCATIVA**\n\n` +
      `❌ "Muito gol" ≠ linha paga\n` +
      `✅ O que importa é: **linha aberta + margem + odd + timing**\n\n` +
      `O mercado é definido pela **linha e pela margem**, não apenas pelo placar. ` +
      `Um jogo com 6 gols pode não pagar nenhuma linha relevante se os gols ocorreram ` +
      `em momentos que não ultrapassaram as linhas abertas com odds atrativas.`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANÁLISE COMPLETA - 9 SEÇÕES DO PROMPT PROFISSIONAL
  // ═══════════════════════════════════════════════════════════════════════════

  async analyzeMatchFull(eventId: string): Promise<FullMatchAnalysis> {
    const [resultData, oddsData, historyData, eventViewData] = await Promise.all([
      this.bet365Service.getResult(eventId),
      this.bet365Service.getPrematch(eventId).catch(() => null),
      this.bet365Service.getEventHistory(eventId),
      this.bet365Service.getEventView(eventId).catch(() => null),
    ]);

    const result = resultData.results?.[0] as any;
    if (!result) {
      throw new Error('Event not found or not finished');
    }

    // Enriquecer result com stats do Event View
    const eventView = eventViewData?.results?.[0];
    if (eventView?.stats) {
      result.stats = eventView.stats;
    }
    if (eventView?.scores) {
      result.scores = eventView.scores;
    }

    // 1️⃣ Contexto do Confronto
    const context = this.analyzeContext(result);

    // 2️⃣ Tabela e Posição - Calculada do histórico
    const tablePosition = this.analyzeTablePosition(historyData, result);

    // 3️⃣ Gols no HT e FT
    const goals = this.analyzeGoals(result);

    // 4️⃣ Linhas Abertas no Mercado
    const historicalPattern = this.calculateHistoricalPattern(historyData);
    const linesHT = this.analyzeLinesHT(goals, oddsData, historicalPattern);
    const linesFT = this.analyzeLinesFT(goals, oddsData, historicalPattern);

    // 5️⃣ Pagamento Real da Linha
    const payment = this.analyzePayment(goals, linesHT, linesFT);

    // 6️⃣ Odd e Margem de Gols
    const oddsMargin = this.analyzeOddsMargin(goals, linesHT, linesFT);

    // 7️⃣ Risco de 0x0
    const zeroZeroRisk = this.analyzeZeroZeroRisk(goals, historicalPattern);

    // 8️⃣ Objetivo dos Gols
    const goalsObjective = this.analyzeGoalsObjective(goals, payment);

    // 9️⃣ Conclusão Técnica
    const marketEfficiency = this.calculateMarketEfficiency(linesHT, linesFT);
    const conclusion = this.generateFullConclusion(goals, linesHT, linesFT, payment, marketEfficiency);

    // Calcular completude dos dados
    const dataCompleteness = this.calculateDataCompleteness(oddsData, historyData);

    return {
      eventId,
      home: result.home?.name || '',
      away: result.away?.name || '',
      analyzedAt: new Date(),
      context,
      tablePosition,
      goals,
      linesHT,
      linesFT,
      payment,
      oddsMargin,
      zeroZeroRisk,
      goalsObjective,
      conclusion,
      marketEfficiency,
      dataCompleteness,
    };
  }

  // 2️⃣ Análise de Tabela/Forma Recente (calculada do histórico)
  private analyzeTablePosition(historyData: any, result: any): TablePosition {
    const homeHistory = historyData?.homeHistory || [];
    const awayHistory = historyData?.awayHistory || [];
    const homeName = result.home?.name || '';
    const awayName = result.away?.name || '';

    if (homeHistory.length === 0 && awayHistory.length === 0) {
      return {
        available: false,
        reason: 'Histórico insuficiente para calcular forma recente. API não fornece tabela oficial para ligas de e-soccer.',
      };
    }

    const calculateForm = (history: any[], teamName: string) => {
      const lastGames = history.slice(0, 10); // Últimos 10 jogos
      let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
      const lastResults: string[] = [];

      for (const game of lastGames) {
        const score = game.score || '';
        const parts = score.split('-');
        if (parts.length !== 2) continue;

        const homeGoals = parseInt(parts[0]) || 0;
        const awayGoals = parseInt(parts[1]) || 0;
        const isHome = game.home?.toLowerCase().includes(teamName.split(' ')[0]?.toLowerCase());

        const myGoals = isHome ? homeGoals : awayGoals;
        const theirGoals = isHome ? awayGoals : homeGoals;

        goalsFor += myGoals;
        goalsAgainst += theirGoals;

        if (myGoals > theirGoals) {
          wins++;
          lastResults.push('W');
        } else if (myGoals < theirGoals) {
          losses++;
          lastResults.push('L');
        } else {
          draws++;
          lastResults.push('D');
        }
      }

      return {
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        points: wins * 3 + draws,
        lastResults: lastResults.slice(0, 5),
        gamesAnalyzed: lastGames.length,
      };
    };

    const homeForm = calculateForm(homeHistory, homeName);
    const awayForm = calculateForm(awayHistory, awayName);

    // Avaliação competitiva
    let competitiveAssessment = '';
    if (homeForm.gamesAnalyzed >= 3 && awayForm.gamesAnalyzed >= 3) {
      const homeWinRate = homeForm.wins / homeForm.gamesAnalyzed;
      const awayWinRate = awayForm.wins / awayForm.gamesAnalyzed;
      
      if (homeWinRate > 0.6 && awayWinRate > 0.6) {
        competitiveAssessment = '🔥 Ambos jogadores em boa forma. Jogo tende a ser competitivo.';
      } else if (homeWinRate > 0.6 && awayWinRate < 0.4) {
        competitiveAssessment = `📊 ${homeName.split('(')[0]} em melhor forma. Pode buscar vitória.`;
      } else if (awayWinRate > 0.6 && homeWinRate < 0.4) {
        competitiveAssessment = `📊 ${awayName.split('(')[0]} em melhor forma. Pode buscar vitória.`;
      } else if (homeWinRate < 0.4 && awayWinRate < 0.4) {
        competitiveAssessment = '⚠️ Ambos jogadores em má forma. Jogo pode ser travado.';
      } else {
        competitiveAssessment = 'Formas equilibradas. Sem vantagem clara.';
      }
    } else {
      competitiveAssessment = 'Histórico insuficiente para avaliação competitiva completa.';
    }

    return {
      available: homeForm.gamesAnalyzed >= 3 || awayForm.gamesAnalyzed >= 3,
      reason: 'Forma recente calculada a partir do histórico de jogos. API não fornece tabela oficial para e-soccer.',
      homeForm: homeForm.gamesAnalyzed > 0 ? homeForm : undefined,
      awayForm: awayForm.gamesAnalyzed > 0 ? awayForm : undefined,
      competitiveAssessment,
    };
  }

  // 1️⃣ Análise de Contexto
  private analyzeContext(result: any): MatchContext {
    const leagueName = result.league?.name || '';
    const leagueLower = leagueName.toLowerCase();

    let leagueType: MatchContext['leagueType'] = 'OTHER';
    let duration = 'Desconhecido';

    if (leagueLower.includes('gt') || leagueLower.includes('league')) {
      leagueType = 'GT_LEAGUE';
      if (leagueLower.includes('12')) duration = '12 minutos';
      else if (leagueLower.includes('8')) duration = '8 minutos';
      else if (leagueLower.includes('10')) duration = '10 minutos';
    } else if (leagueLower.includes('h2h') || leagueLower.includes('battle')) {
      leagueType = 'H2H_BATTLE';
      if (leagueLower.includes('6')) duration = '6 minutos';
      else if (leagueLower.includes('8')) duration = '8 minutos';
    } else if (leagueLower.includes('volta')) {
      leagueType = 'VOLTA';
      duration = '6 minutos';
    }

    return {
      league: leagueName,
      leagueType,
      duration,
      matchType: 'UNKNOWN', // Não temos dados para determinar ida/volta
      competitiveContext: `Liga: ${leagueName}. Duração: ${duration}. Sem dados de tabela disponíveis para avaliar contexto competitivo.`,
      dataSource: 'API',
    };
  }

  // 5️⃣ Análise de Pagamento
  private analyzePayment(
    goals: GoalsAnalysis,
    linesHT: LineAnalysis[],
    linesFT: LineAnalysis[],
  ): PaymentAnalysis {
    const linesPaidHT = linesHT.filter(l => l.paid).map(l => l.line);
    const linesPaidFT = linesFT.filter(l => l.paid).map(l => l.line);
    const linesNotPaid = [
      ...linesHT.filter(l => !l.paid).map(l => l.line),
      ...linesFT.filter(l => !l.paid).map(l => l.line),
    ];

    const totalGoals = goals.ft.total;
    const totalPaid = linesPaidHT.length + linesPaidFT.length;
    const excessGoalsWithoutPayment = totalGoals >= 5 && totalPaid <= 2;
    
    // Verifica se margem bloqueou lucro (muitos gols mas poucas linhas pagas)
    const marginBlockedProfit = totalGoals >= 4 && totalPaid <= 1;

    let paymentSummary = '';
    if (excessGoalsWithoutPayment) {
      paymentSummary = `⚠️ ${totalGoals} gols no jogo, mas apenas ${totalPaid} linhas pagas. Muitos gols foram "visuais" sem pagamento real.`;
    } else if (marginBlockedProfit) {
      paymentSummary = `⚠️ A margem impediu ganho mesmo com placar alto (${totalGoals} gols).`;
    } else if (totalPaid >= 4) {
      paymentSummary = `✅ Bom pagamento: ${totalPaid} linhas pagas com ${totalGoals} gols.`;
    } else {
      paymentSummary = `${totalPaid} linhas pagas de ${linesHT.length + linesFT.length} disponíveis.`;
    }

    return {
      linesPaidHT,
      linesPaidFT,
      linesNotPaid,
      excessGoalsWithoutPayment,
      marginBlockedProfit,
      paymentSummary,
    };
  }

  // 6️⃣ Análise de Odd e Margem
  private analyzeOddsMargin(
    goals: GoalsAnalysis,
    linesHT: LineAnalysis[],
    linesFT: LineAnalysis[],
  ): OddsMarginAnalysis {
    const allLines = [...linesHT, ...linesFT];
    const paidWithGoodOdds = allLines.filter(l => l.paid && l.odds !== null && l.odds >= 1.5).length;
    const paidWithBadOdds = allLines.filter(l => l.paid && (l.odds === null || l.odds < 1.3)).length;
    
    const goalsInPayableOdds = paidWithGoodOdds;
    const visualGoals = goals.ft.total - goalsInPayableOdds;
    
    const marginMadeSense = paidWithGoodOdds >= paidWithBadOdds;
    const lineControlled = goals.ft.total >= 4 && paidWithGoodOdds <= 1;

    let assessment = '';
    if (lineControlled) {
      assessment = '🎯 Linha claramente controlada. Alto volume de gols com baixo pagamento em odds atrativas.';
    } else if (visualGoals > goalsInPayableOdds) {
      assessment = `⚠️ Excesso de gols visuais (${visualGoals}) sem vantagem real para o apostador.`;
    } else if (marginMadeSense) {
      assessment = '✅ Margem de gols fez sentido para as linhas abertas.';
    } else {
      assessment = 'Análise inconclusiva - odds não disponíveis para todas as linhas.';
    }

    return {
      goalsInPayableOdds,
      visualGoals: Math.max(0, visualGoals),
      marginMadeSense,
      lineControlled,
      assessment,
    };
  }

  // 7️⃣ Análise de Risco 0x0
  private analyzeZeroZeroRisk(
    goals: GoalsAnalysis,
    pattern: HistoricalPattern,
  ): ZeroZeroRisk {
    const signals: string[] = [];
    
    // Análise baseada no histórico real
    let htRisk: ZeroZeroRisk['htRisk'] = 'MEDIO';
    let ftRisk: ZeroZeroRisk['ftRisk'] = 'BAIXO';

    if (pattern.dataSource === 'API' && pattern.avgGoalsFT !== null) {
      if (pattern.avgGoalsFT < 2) {
        signals.push('Média histórica baixa de gols');
        htRisk = 'ALTO';
        ftRisk = 'MEDIO';
      } else if (pattern.avgGoalsFT >= 4) {
        signals.push('Média histórica alta de gols');
        htRisk = 'BAIXO';
        ftRisk = 'BAIXO';
      }
    }

    // Análise baseada no jogo atual (se já finalizado)
    if (goals.ht.total === 0) {
      signals.push('HT terminou 0x0');
    }
    if (goals.aggressivityPattern === 'BAIXA_AGRESSIVIDADE') {
      signals.push('Baixa agressividade detectada');
      htRisk = 'ALTO';
    }
    if (goals.aggressivityPattern === 'PERIODOS_MORTOS') {
      signals.push('Períodos mortos no jogo');
    }

    let assessment = '';
    if (htRisk === 'ALTO') {
      assessment = '🚨 Alto risco de 0x0 no HT. Sinais de baixa agressividade e/ou histórico desfavorável.';
    } else if (htRisk === 'MEDIO') {
      assessment = '⚠️ Risco moderado de 0x0 no HT. Avaliar com cautela.';
    } else {
      assessment = '✅ Baixo risco de 0x0. Histórico e padrões indicam jogo com gols.';
    }

    return { htRisk, ftRisk, signals, assessment };
  }

  // 8️⃣ Análise de Objetivo dos Gols
  private analyzeGoalsObjective(
    goals: GoalsAnalysis,
    payment: PaymentAnalysis,
  ): GoalsObjective {
    // Sem dados de tabela, inferimos baseado no padrão de gols e pagamento
    let classification: GoalsObjective['classification'] = 'INDETERMINADO';
    let reasoning = '';

    if (payment.excessGoalsWithoutPayment) {
      classification = 'VISUAL_ALEATORIO';
      reasoning = 'Muitos gols sem pagamento real de linhas sugere gols sem objetivo de mercado.';
    } else if (goals.aggressivityPattern === 'ALTA_AGRESSIVIDADE' && !payment.marginBlockedProfit) {
      classification = 'COMPETITIVO';
      reasoning = 'Alta agressividade com bom pagamento sugere jogo competitivo.';
    } else if (payment.marginBlockedProfit) {
      classification = 'MERCADO';
      reasoning = 'Padrão de gols que bloqueou pagamento sugere possível controle de mercado.';
    } else {
      classification = 'INDETERMINADO';
      reasoning = 'Sem dados de tabela/classificação, não é possível determinar objetivo competitivo com certeza.';
    }

    return {
      classification,
      reasoning,
      dataSource: 'INFERRED',
    };
  }

  // 9️⃣ Conclusão Técnica Completa
  private generateFullConclusion(
    goals: GoalsAnalysis,
    linesHT: LineAnalysis[],
    linesFT: LineAnalysis[],
    payment: PaymentAnalysis,
    efficiency: number,
  ): TechnicalConclusion {
    let classification: TechnicalConclusion['classification'];
    
    if (payment.excessGoalsWithoutPayment) {
      classification = 'EXCESSO_GOLS_SEM_OBJETIVO';
    } else if (payment.marginBlockedProfit && efficiency < 30) {
      classification = 'POSSIVEL_MANIPULACAO_VISUAL';
    } else if (goals.aggressivityPattern === 'PERIODOS_MORTOS' && efficiency < 40) {
      classification = 'JOGO_TRAVADO_PARA_MERCADO';
    } else if (efficiency >= 50) {
      classification = 'LINHA_BEM_ESTRUTURADA';
    } else {
      classification = 'LINHA_MAL_PAGA';
    }

    const htPaid = linesHT.filter(l => l.paid).map(l => l.line).join(', ') || 'Nenhuma';
    const ftPaid = linesFT.filter(l => l.paid).map(l => l.line).join(', ') || 'Nenhuma';

    const summary = `
📊 **CONCLUSÃO TÉCNICA**

**Placar:** ${goals.ft.home}-${goals.ft.away} (HT: ${goals.ht.home}-${goals.ht.away})
**Padrão:** ${goals.pattern}
**Timeline:** ${goals.timeline}

**Linhas pagas HT:** ${htPaid}
**Linhas pagas FT:** ${ftPaid}
**Eficiência de mercado:** ${efficiency}%

**Classificação:** ${classification.replace(/_/g, ' ')}

${payment.paymentSummary}
    `.trim();

    const educationalNote = `
📚 **NOTA EDUCATIVA**

❌ "Muito gol" ≠ linha paga
✅ O que importa: **linha aberta + margem + odd + contexto competitivo**

O mercado é definido pela **linha e pela margem**, não apenas pelo placar.
Quantidade de gols não significa pagamento, pois o mercado depende de:
- Linha aberta no momento
- Margem de gols sobre a linha
- Odd disponível
- Contexto competitivo (tabela, necessidade de vitória)

Use linguagem técnica e neutra ao avaliar jogos.
    `.trim();

    return { classification, summary, educationalNote };
  }

  // Calcular completude dos dados
  private calculateDataCompleteness(oddsData: any, historyData: any): number {
    let score = 0;
    let total = 4;

    // Resultado sempre disponível (já validamos antes)
    score += 1;

    // Odds
    if (oddsData?.results?.[0]?.main?.sp?.goals_over_under) {
      score += 1;
    }

    // Histórico H2H
    if (historyData?.h2h?.length > 0) {
      score += 1;
    }

    // Tabela (nunca disponível)
    // score += 0;

    return Math.round((score / total) * 100);
  }

  async analyzeMultipleMatches(eventIds: string[]): Promise<{
    analyses: MarketAnalysis[];
    summary: {
      totalMatches: number;
      linhasBemPagas: number;
      linhasMalPagas: number;
      excessoSemPagamento: number;
      linhasControladas: number;
      manipulacaoVisual: number;
      avgEfficiency: number;
    };
  }> {
    const analyses: MarketAnalysis[] = [];

    for (const eventId of eventIds) {
      try {
        const analysis = await this.analyzeMatch(eventId);
        analyses.push(analysis);
      } catch (error) {
        this.logger.error(`Error analyzing match ${eventId}:`, error);
      }
    }

    const summary = {
      totalMatches: analyses.length,
      linhasBemPagas: analyses.filter((a) => a.classification === 'LINHA_BEM_PAGA').length,
      linhasMalPagas: analyses.filter((a) => a.classification === 'LINHA_MAL_PAGA').length,
      excessoSemPagamento: analyses.filter((a) => a.classification === 'EXCESSO_GOLS_SEM_PAGAMENTO').length,
      linhasControladas: analyses.filter((a) => a.classification === 'LINHA_CONTROLADA').length,
      manipulacaoVisual: analyses.filter((a) => a.classification === 'PADRAO_MANIPULACAO_VISUAL').length,
      avgEfficiency: analyses.length > 0
        ? Math.round(analyses.reduce((acc, a) => acc + a.marketEfficiency, 0) / analyses.length)
        : 0,
    };

    return { analyses, summary };
  }
}
