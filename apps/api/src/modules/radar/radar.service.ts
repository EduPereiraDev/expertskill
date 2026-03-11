import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Liga, StatusPartida, Cenario } from '@prisma/client';

/**
 * Contexto de analise:
 * - DIARIO: Radar ao vivo, stats rapidas (ultimas 15 partidas)
 * - HISTORICO: Analise detalhada, pre-live, recomendacoes (ultimas 30 partidas)
 */
export type ContextoAnalise = 'DIARIO' | 'HISTORICO';

const LIMITE_PARTIDAS: Record<ContextoAnalise, number> = {
  DIARIO: 15,
  HISTORICO: 40,
};

export interface RadarPartida {
  id: string;
  jogador1: { nome: string; mediaGolsFT: number; percentualOver: number; gols?: number };
  jogador2: { nome: string; mediaGolsFT: number; percentualOver: number; gols?: number };
  liga: Liga;
  dataHora: Date;
  status: StatusPartida;
  cenario: Cenario;
  cenarioMsg: string;
  classificacao: 'OPERAR' | 'CAUTELA' | 'EVITAR';
  placar?: { home: number; away: number };
  indicadores: {
    mediaTotal: number;
    overMedio: number;
    probabilidadeOver25: number;
  };
  veredicto: {
    acao: 'ENTRA' | 'NAO_ENTRA' | 'ESPERA';
    linha: string;
    confianca: number;
    motivo: string;
  };
}

export interface HistoricoPartida {
  id: string;
  data: Date;
  adversario: string;
  golsPro: number;
  golsContra: number;
  totalGols: number;
  resultado: 'V' | 'E' | 'D';
  over25: boolean;
  golsHT: number;
  golsHTContra?: number;
  totalGolsHT?: number;
  golsFT: number;
  btts?: boolean;
  mesmoTime?: boolean;
}

export interface JogadorStatsDetalhado {
  nome: string;
  nomeCompleto: string;
  ultimasPartidas: HistoricoPartida[];
  mediaGolsHT: number;
  mediaGolsFT: number;
  percentualOver: number;
  percentual0x0: number;
  golsPorTempo: { ht: number; segundoTempo: number };
  sequencia: string[];
  // Novas métricas para mercado
  streakOver: number; // Quantos jogos seguidos com Over 2.5
  streakUnder: number; // Quantos jogos seguidos com Under 2.5
  mediaGolsSofridos: number;
  percentualOver15HT: number; // Over 1.5 no HT
  percentualOver05HT: number; // Over 0.5 no HT (gol no 1T)
  percentualBTTS: number; // Both Teams To Score
  maiorGoleada: { pro: number; contra: number };
  consistencia: 'ALTA' | 'MEDIA' | 'BAIXA'; // Variação nos resultados
}

export interface AnaliseDetalhada {
  partida: RadarPartida;
  jogador1Stats: JogadorStatsDetalhado;
  jogador2Stats: JogadorStatsDetalhado;
  h2h: {
    confrontosDiretos: HistoricoPartida[];
    totalJogos: number;
    vitoriasJ1: number;
    vitoriasJ2: number;
    empates: number;
    mediaGolsH2H: number;
    over25H2H: number;
    over15HTH2H: number; // Over 1.5 HT nos H2H
    bttsH2H: number; // BTTS nos H2H
  };
  padroes: {
    tendenciaHT: 'GOL_PROVAVEL' | 'LENTO' | 'NEUTRO';
    tendenciaFT: 'OVER' | 'UNDER' | 'NEUTRO';
    risco0x0: 'BAIXO' | 'MEDIO' | 'ALTO';
    melhorMomento: string;
  };
  mercado: {
    linhaSegura: string; // Linha com maior probabilidade
    linhaValor: string; // Linha com melhor value
    riscoPrincipal: string;
    confianca: number; // 0-100
    alertas: string[];
  };
  recomendacao: {
    classificacao: 'OPERAR' | 'CAUTELA' | 'EVITAR';
    motivo: string;
    linhasSugeridas: string[];
  };
}

@Injectable()
export class RadarService {
  constructor(private prisma: PrismaService) {}

  async getPartidas(liga?: Liga, status?: StatusPartida): Promise<RadarPartida[]> {
    // Incluir AO_VIVO + AGENDADAS nos proximos 5 minutos (pre-live)
    const agora = new Date();
    const em5Min = new Date(agora.getTime() + 5 * 60 * 1000);

    const partidas = await this.prisma.partida.findMany({
      where: {
        ...(liga && { liga }),
        OR: [
          { status: StatusPartida.AO_VIVO },
          {
            status: StatusPartida.AGENDADA,
            dataHora: { gte: agora, lte: em5Min },
          },
        ],
      },
      include: {
        jogador1: true,
        jogador2: true,
      },
      orderBy: [
        { status: 'asc' }, // AO_VIVO vem antes de AGENDADA alfabeticamente
        { dataHora: 'asc' },
      ],
      take: 50,
    });

    // Mapear para RadarPartida primeiro para ter acesso à classificação
    const mapped = partidas.map((p) => this.mapPartidaToRadar(p));

    // Ordenar: OPERAR > CAUTELA > EVITAR, dentro de cada grupo por status (AO_VIVO primeiro)
    const ordemClassificacao = { OPERAR: 0, CAUTELA: 1, EVITAR: 2 };
    const ordenadas = mapped.sort((a, b) => {
      // Primeiro por classificação (melhor para pior)
      const diffClass = ordemClassificacao[a.classificacao] - ordemClassificacao[b.classificacao];
      if (diffClass !== 0) return diffClass;
      
      // Depois AO_VIVO primeiro
      if (a.status === 'AO_VIVO' && b.status !== 'AO_VIVO') return -1;
      if (a.status !== 'AO_VIVO' && b.status === 'AO_VIVO') return 1;
      
      // Por fim, por horário
      return new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
    });

    return ordenadas;
  }

  async getProximasPartidas(liga?: Liga): Promise<RadarPartida[]> {
    const agora = new Date();
    const em2Horas = new Date(agora.getTime() + 2 * 60 * 60 * 1000);

    const partidas = await this.prisma.partida.findMany({
      where: {
        ...(liga && { liga }),
        dataHora: {
          gte: agora,
          lte: em2Horas,
        },
        status: StatusPartida.AGENDADA,
      },
      include: {
        jogador1: true,
        jogador2: true,
      },
      orderBy: { dataHora: 'asc' },
      take: 20,
    });

    return partidas.map((p) => this.mapPartidaToRadar(p));
  }

  async getPartidasAoVivo(): Promise<RadarPartida[]> {
    const partidas = await this.prisma.partida.findMany({
      where: {
        status: StatusPartida.AO_VIVO,
      },
      include: {
        jogador1: true,
        jogador2: true,
      },
      orderBy: { dataHora: 'asc' },
    });

    return partidas.map((p) => this.mapPartidaToRadar(p));
  }

  private mapPartidaToRadar(partida: any): RadarPartida {
    const { jogador1, jogador2 } = partida;
    
    const mediaTotal = jogador1.mediaGolsFT + jogador2.mediaGolsFT;
    const overMedio = (jogador1.percentualOver + jogador2.percentualOver) / 2;
    const probabilidadeOver25 = this.calcularProbabilidadeOver(mediaTotal, overMedio);
    const classificacao = this.classificarPartida(mediaTotal, overMedio, probabilidadeOver25);

    // Deteccao dinamica de cenario com mensagem
    const placarHome = partida.golsFT1 ?? 0;
    const placarAway = partida.golsFT2 ?? 0;
    const totalGolsAtual = placarHome + placarAway;
    const isAoVivo = partida.status === 'AO_VIVO';
    const pct0x0 = (jogador1.percentual0x0 + jogador2.percentual0x0) / 2;

    const { cenario, cenarioMsg } = this.detectarCenario(
      mediaTotal, overMedio, pct0x0, totalGolsAtual, isAoVivo, classificacao,
    );

    // Gerar veredicto decisivo
    const veredicto = this.gerarVeredicto(mediaTotal, overMedio, probabilidadeOver25, pct0x0, classificacao, cenario, isAoVivo, totalGolsAtual);

    return {
      id: partida.id,
      jogador1: {
        nome: jogador1.nome,
        mediaGolsFT: jogador1.mediaGolsFT,
        percentualOver: jogador1.percentualOver,
        gols: partida.golsFT1 ?? undefined,
      },
      jogador2: {
        nome: jogador2.nome,
        mediaGolsFT: jogador2.mediaGolsFT,
        percentualOver: jogador2.percentualOver,
        gols: partida.golsFT2 ?? undefined,
      },
      liga: partida.liga,
      dataHora: partida.dataHora,
      status: partida.status,
      cenario,
      cenarioMsg,
      classificacao,
      placar: isAoVivo ? { home: placarHome, away: placarAway } : undefined,
      indicadores: {
        mediaTotal,
        overMedio,
        probabilidadeOver25,
      },
      veredicto,
    };
  }

  private gerarVeredicto(
    mediaTotal: number,
    overMedio: number,
    probOver25: number,
    pct0x0: number,
    classificacao: string,
    cenario: Cenario,
    isAoVivo: boolean,
    totalGolsAtual: number,
  ): { acao: 'ENTRA' | 'NAO_ENTRA' | 'ESPERA'; linha: string; confianca: number; motivo: string } {
    // EVITAR: jogo fraco
    if (cenario === Cenario.JOGO_FRACO || classificacao === 'EVITAR') {
      // Verificar se Under tem valor
      if (pct0x0 >= 20 && mediaTotal < 2.5) {
        return {
          acao: 'ENTRA',
          linha: 'Under 2.5 FT',
          confianca: Math.min(85, Math.round(50 + pct0x0)),
          motivo: `Jogo travado com ${pct0x0.toFixed(0)}% de 0x0. Media ${mediaTotal.toFixed(1)} gols favorece Under.`,
        };
      }
      if (mediaTotal < 3 && overMedio < 35) {
        return {
          acao: 'ENTRA',
          linha: 'Under 3.5 FT',
          confianca: Math.min(80, Math.round(40 + (100 - overMedio) * 0.5)),
          motivo: `Media baixa (${mediaTotal.toFixed(1)}) e apenas ${overMedio.toFixed(0)}% Over. Tendencia Under clara.`,
        };
      }
      return {
        acao: 'NAO_ENTRA',
        linha: '--',
        confianca: 0,
        motivo: `Jogo sem valor. Media ${mediaTotal.toFixed(1)} gols, ${overMedio.toFixed(0)}% Over. Sem linha segura.`,
      };
    }

    // AO VIVO: Over Segurando (0x0 com media alta)
    if (isAoVivo && cenario === Cenario.OVER_SEGURANDO && totalGolsAtual === 0 && mediaTotal >= 5) {
      return {
        acao: 'ESPERA',
        linha: 'Over 0.5 HT (aguardar)',
        confianca: Math.min(75, Math.round(overMedio * 0.8)),
        motivo: `Placar 0x0 mas media ${mediaTotal.toFixed(1)}. Aguardar gol para confirmar tendencia antes de entrar.`,
      };
    }

    // OVER FORTE: media >= 6 e over >= 75%
    if (mediaTotal >= 6 && overMedio >= 75) {
      return {
        acao: 'ENTRA',
        linha: mediaTotal >= 7 ? 'Over 2.5 FT' : 'Over 1.5 FT',
        confianca: Math.min(95, Math.round(overMedio * 0.95 + (mediaTotal - 5) * 3)),
        motivo: `Confronto explosivo. Media ${mediaTotal.toFixed(1)} gols, ${overMedio.toFixed(0)}% Over. Alta probabilidade de gols.`,
      };
    }

    // OVER BOM: media >= 5 e over >= 65%
    if (mediaTotal >= 5 && overMedio >= 65) {
      const linha = mediaTotal >= 5.5 ? 'Over 1.5 FT' : 'Over 0.5 HT';
      return {
        acao: 'ENTRA',
        linha,
        confianca: Math.min(85, Math.round(overMedio * 0.85 + (mediaTotal - 4) * 2)),
        motivo: `Bom confronto Over. Media ${mediaTotal.toFixed(1)} gols, ${overMedio.toFixed(0)}% Over. Linha segura: ${linha}.`,
      };
    }

    // MODERADO: media >= 4 e over >= 55%
    if (mediaTotal >= 4 && overMedio >= 55) {
      return {
        acao: 'ENTRA',
        linha: 'Over 0.5 HT',
        confianca: Math.min(72, Math.round(overMedio * 0.7 + (mediaTotal - 3) * 3)),
        motivo: `Confronto moderado. Media ${mediaTotal.toFixed(1)} gols. Linha conservadora com boa margem.`,
      };
    }

    // ZONA CINZA: media entre 3 e 4 ou over entre 45-55%
    if (mediaTotal >= 3 && overMedio >= 45) {
      return {
        acao: 'ESPERA',
        linha: 'Over 0.5 HT (se abrir)',
        confianca: Math.min(55, Math.round(overMedio * 0.6)),
        motivo: `Zona neutra. Media ${mediaTotal.toFixed(1)} gols, ${overMedio.toFixed(0)}% Over. Aguardar sinal ao vivo.`,
      };
    }

    // UNDER: media < 3.5 e over < 45%
    if (mediaTotal < 3.5 && overMedio < 45) {
      return {
        acao: 'ENTRA',
        linha: 'Under 2.5 FT',
        confianca: Math.min(78, Math.round((100 - overMedio) * 0.7 + (4 - mediaTotal) * 5)),
        motivo: `Tendencia Under. Media ${mediaTotal.toFixed(1)} gols, apenas ${overMedio.toFixed(0)}% Over. Under com valor.`,
      };
    }

    // DEFAULT: cautela
    return {
      acao: 'ESPERA',
      linha: '--',
      confianca: Math.min(40, Math.round(overMedio * 0.4)),
      motivo: `Dados inconclusivos. Media ${mediaTotal.toFixed(1)} gols, ${overMedio.toFixed(0)}% Over. Sem vantagem clara.`,
    };
  }

  private detectarCenario(
    mediaTotal: number,
    overMedio: number,
    pct0x0: number,
    totalGolsAtual: number,
    isAoVivo: boolean,
    classificacao: string,
  ): { cenario: Cenario; cenarioMsg: string } {
    // CENARIO 2: Over Segurando — goleadores em 0x0 ao vivo (oportunidade oculta)
    if (isAoVivo && totalGolsAtual <= 1 && mediaTotal >= 5 && overMedio >= 65) {
      return {
        cenario: Cenario.OVER_SEGURANDO,
        cenarioMsg: `Jogo de Over travado. Media ${mediaTotal.toFixed(1)} gols mas placar ${totalGolsAtual}. Possivel quebra de padrao.`,
      };
    }

    // CENARIO 3: Jogo do Dia — confronto de titãs
    if (mediaTotal >= 6 && overMedio >= 75) {
      return {
        cenario: Cenario.MELHOR_JOGO,
        cenarioMsg: `Jogo Forte. Media ${mediaTotal.toFixed(1)} gols, ${overMedio.toFixed(0)}% Over. Alta probabilidade de Over HT/FT.`,
      };
    }

    // CENARIO 1: Anti-Jogo — jogo travado
    if (mediaTotal < 3 || overMedio < 40 || pct0x0 >= 25) {
      return {
        cenario: Cenario.JOGO_FRACO,
        cenarioMsg: pct0x0 >= 25
          ? `Alerta: Jogo Travado. ${pct0x0.toFixed(0)}% de chance de 0x0. Tendencia Under.`
          : `Alerta: Media baixa (${mediaTotal.toFixed(1)} gols). Tendencia Under ou 0x0.`,
      };
    }

    // Cenario intermediario
    if (classificacao === 'OPERAR') {
      return {
        cenario: Cenario.MELHOR_JOGO,
        cenarioMsg: `Bom confronto. Media ${mediaTotal.toFixed(1)} gols com ${overMedio.toFixed(0)}% Over.`,
      };
    }

    return {
      cenario: Cenario.OVER_SEGURANDO,
      cenarioMsg: `Confronto moderado. Media ${mediaTotal.toFixed(1)} gols. Avalie antes de entrar.`,
    };
  }

  private calcularProbabilidadeOver(mediaTotal: number, overMedio: number): number {
    // Usa diretamente o percentual de over do histórico real dos jogadores
    // overMedio já é calculado a partir de partidas reais finalizadas
    return Math.round(overMedio);
  }

  private classificarPartida(
    mediaTotal: number,
    overMedio: number,
    probOver: number
  ): 'OPERAR' | 'CAUTELA' | 'EVITAR' {
    // OPERAR: Confronto forte — media alta E over consistente
    if (mediaTotal >= 5 && overMedio >= 65) {
      return 'OPERAR';
    }
    
    // CAUTELA: Perfil moderado
    if (mediaTotal >= 3.5 && overMedio >= 50) {
      return 'CAUTELA';
    }
    
    // EVITAR: Baixa probabilidade ou jogadores defensivos
    return 'EVITAR';
  }

  async getAnaliseDetalhada(partidaId: string, contexto: ContextoAnalise = 'HISTORICO'): Promise<AnaliseDetalhada> {
    const partida = await this.prisma.partida.findUnique({
      where: { id: partidaId },
      include: { jogador1: true, jogador2: true },
    });

    if (!partida) {
      throw new Error('Partida não encontrada');
    }

    const radarPartida = this.mapPartidaToRadar(partida);

    const jogador1Stats = await this.getJogadorStats(partida.jogador1, partida.jogador1Id, contexto);
    const jogador2Stats = await this.getJogadorStats(partida.jogador2, partida.jogador2Id, contexto);

    // Buscar confrontos diretos (H2H)
    const h2h = await this.getH2H(partida.jogador1Id, partida.jogador2Id, partida.jogador1.nome, partida.jogador2.nome);

    // Analisar padrões
    const padroes = this.analisarPadroes(jogador1Stats, jogador2Stats, h2h);

    // Análise de mercado
    const mercado = this.analisarMercado(radarPartida, jogador1Stats, jogador2Stats, h2h, padroes);

    // Gerar recomendação
    const recomendacao = this.gerarRecomendacao(radarPartida, jogador1Stats, jogador2Stats, h2h, padroes);

    return {
      partida: radarPartida,
      jogador1Stats,
      jogador2Stats,
      h2h,
      padroes,
      mercado,
      recomendacao,
    };
  }

  private extractNickname(nome: string): string | null {
    const match = nome.match(/\(([^)]+)\)/);
    return match ? match[1] : null;
  }

  private async getJogadorStats(jogador: any, jogadorId: string, contexto: ContextoAnalise = 'DIARIO'): Promise<JogadorStatsDetalhado> {
    // Extrair nickname do jogador: "PSG (Delpiero)" -> "Delpiero"
    const nickname = this.extractNickname(jogador.nome);
    
    // Buscar TODOS os jogadores com o mesmo nickname (mesmo jogador em times diferentes)
    let jogadorIds = [jogadorId];
    if (nickname) {
      const jogadoresComNickname = await this.prisma.jogador.findMany({
        where: { nome: { contains: `(${nickname})` } },
        select: { id: true },
      });
      jogadorIds = jogadoresComNickname.map(j => j.id);
    }

    const limite = LIMITE_PARTIDAS[contexto];
    // DIARIO: filtra apenas partidas das ultimas 24h
    const whereDate = contexto === 'DIARIO'
      ? { dataHora: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      : {};
    const partidas = await this.prisma.partida.findMany({
      where: {
        OR: [
          { jogador1Id: { in: jogadorIds } },
          { jogador2Id: { in: jogadorIds } },
        ],
        status: StatusPartida.FINALIZADA,
        ...whereDate,
      },
      include: { jogador1: true, jogador2: true },
      orderBy: { dataHora: 'desc' },
      take: limite,
    });

    // Extrair time atual: "PSG (Delpiero)" -> "PSG"
    const timeAtual = jogador.nome.match(/^([^(]+)/)?.[1]?.trim() || '';

    const ultimasPartidas: HistoricoPartida[] = partidas.map(p => {
      // Verificar se o jogador está como home ou away (considerando todos os IDs do mesmo nickname)
      const isHome = jogadorIds.includes(p.jogador1Id);
      const golsPro = isHome ? (p.golsFT1 || 0) : (p.golsFT2 || 0);
      const golsContra = isHome ? (p.golsFT2 || 0) : (p.golsFT1 || 0);
      const golsHTPro = isHome ? (p.golsHT1 || 0) : (p.golsHT2 || 0);
      const golsHTContra = isHome ? (p.golsHT2 || 0) : (p.golsHT1 || 0);
      const totalGols = (p.golsFT1 || 0) + (p.golsFT2 || 0);
      const totalGolsHT = (p.golsHT1 || 0) + (p.golsHT2 || 0);
      // Retornar nome completo do adversário (Time (Nickname)) para filtros por time funcionarem
      const adversario = isHome ? p.jogador2.nome : p.jogador1.nome;
      // Verificar se esta partida é do time atual (peso 2x) ou de outro time (peso 1x)
      const nomeNaPartida = isHome ? p.jogador1.nome : p.jogador2.nome;
      const timeNaPartida = nomeNaPartida.match(/^([^(]+)/)?.[1]?.trim() || '';
      const mesmoTime = timeAtual !== '' && timeNaPartida === timeAtual;

      let resultado: 'V' | 'E' | 'D' = 'E';
      if (golsPro > golsContra) resultado = 'V';
      else if (golsPro < golsContra) resultado = 'D';

      return {
        id: p.id,
        data: p.dataHora,
        adversario,
        golsPro,
        golsContra,
        totalGols,
        resultado,
        over25: totalGols > 2,
        golsHT: golsHTPro,
        golsHTContra,
        totalGolsHT,
        golsFT: golsPro,
        btts: golsPro > 0 && golsContra > 0,
        mesmoTime,
      };
    });

    // Contagem simples — ponderacao por time distorcia os percentuais
    const count = ultimasPartidas.length || 1;

    const totalGolsFT = ultimasPartidas.reduce((acc, p) => acc + p.golsFT, 0);
    const totalGolsSofridos = ultimasPartidas.reduce((acc, p) => acc + p.golsContra, 0);

    // HT: filtrar apenas partidas com dados de HT reais (nao-null)
    // Partidas sem HT (null no banco) teriam totalGolsHT=0 e distorceriam stats
    const partidasComHT = ultimasPartidas.filter(p => p.totalGolsHT !== null && p.totalGolsHT !== undefined);
    const countHT = partidasComHT.length || 1;
    const totalGolsHT = partidasComHT.reduce((acc, p) => acc + p.golsHT, 0);

    // Calcular streak de Over/Under
    let streakOver = 0;
    let streakUnder = 0;
    for (const p of ultimasPartidas) {
      if (p.over25) {
        if (streakUnder === 0) streakOver++;
        else break;
      } else {
        if (streakOver === 0) streakUnder++;
        else break;
      }
    }

    // Calcular percentuais de linhas HT (usando apenas partidas COM dados de HT)
    const over15HT = partidasComHT.filter(p => (p.totalGolsHT || 0) > 1).length;
    const over05HT = partidasComHT.filter(p => (p.totalGolsHT || 0) > 0).length;
    const bttsCount = ultimasPartidas.filter(p => p.btts).length;

    // Maior goleada
    let maiorPro = 0, maiorContra = 0;
    for (const p of ultimasPartidas) {
      if (p.golsPro > maiorPro) maiorPro = p.golsPro;
      if (p.golsContra > maiorContra) maiorContra = p.golsContra;
    }

    // Consistência (variação nos gols)
    const mediaP = totalGolsFT / count;
    const varPond = ultimasPartidas.reduce((acc, p) => acc + Math.pow(p.golsFT - mediaP, 2), 0) / count;
    const desvio = Math.sqrt(varPond);
    let consistencia: 'ALTA' | 'MEDIA' | 'BAIXA' = 'MEDIA';
    if (desvio < 0.8) consistencia = 'ALTA';
    else if (desvio > 1.5) consistencia = 'BAIXA';

    // Retornar nickname como nome principal
    const nomeJogador = nickname || jogador.nome;

    // Percentuais simples
    const over25Count = ultimasPartidas.filter(p => p.over25).length;
    const zeroZeroCount = ultimasPartidas.filter(p => p.totalGols === 0).length;
    const useCalculated = contexto === 'HISTORICO' && ultimasPartidas.length >= 5;

    return {
      nome: nomeJogador,
      nomeCompleto: jogador.nome,
      ultimasPartidas,
      mediaGolsHT: useCalculated ? totalGolsHT / countHT : (jogador.mediaGolsHT || totalGolsHT / countHT),
      mediaGolsFT: useCalculated ? totalGolsFT / count : (jogador.mediaGolsFT || totalGolsFT / count),
      percentualOver: useCalculated ? (over25Count / count) * 100 : jogador.percentualOver,
      percentual0x0: useCalculated ? (zeroZeroCount / count) * 100 : jogador.percentual0x0,
      golsPorTempo: {
        ht: totalGolsHT / countHT,
        segundoTempo: (totalGolsFT / count) - (totalGolsHT / countHT),
      },
      sequencia: ultimasPartidas.slice(0, 5).map(p => p.resultado),
      // Novas métricas
      streakOver,
      streakUnder,
      mediaGolsSofridos: totalGolsSofridos / count,
      percentualOver15HT: (over15HT / countHT) * 100,
      percentualOver05HT: (over05HT / countHT) * 100,
      percentualBTTS: (bttsCount / count) * 100,
      maiorGoleada: { pro: maiorPro, contra: maiorContra },
      consistencia,
    };
  }

  async buscarJogador(nome: string) {
    // Buscar jogadores que contenham o nome (case insensitive)
    const jogadores = await this.prisma.jogador.findMany({
      where: {
        nome: { contains: nome, mode: 'insensitive' },
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    if (jogadores.length === 0) return [];

    // Para cada jogador, buscar stats historicas
    const resultados = await Promise.all(
      jogadores.map(async (jogador) => {
        const stats = await this.getJogadorStats(jogador, jogador.id, 'HISTORICO');
        const totalJogos = stats.ultimasPartidas.length;
        const overCount = stats.ultimasPartidas.filter(p => p.over25).length;
        const underCount = totalJogos - overCount;
        const overPct = totalJogos > 0 ? Math.round((overCount / totalJogos) * 100) : 0;
        const underPct = 100 - overPct;

        // Tendencia: ultimos 5 jogos
        const ultimos5 = stats.ultimasPartidas.slice(0, 5);
        const overRecente = ultimos5.filter(p => p.over25).length;
        const tendencia = overRecente >= 4 ? 'OVER_FORTE'
          : overRecente >= 3 ? 'OVER'
          : overRecente <= 1 ? 'UNDER_FORTE'
          : overRecente <= 2 ? 'UNDER'
          : 'NEUTRO';

        // Classificacao
        const classificacao = stats.mediaGolsFT >= 3 ? 'AGRESSIVO'
          : stats.mediaGolsFT >= 2 ? 'EQUILIBRADO'
          : 'CONTROLADOR';

        return {
          id: jogador.id,
          nome: jogador.nome,
          nickname: this.extractNickname(jogador.nome) || jogador.nome,
          mediaGolsFT: stats.mediaGolsFT,
          mediaGolsHT: stats.mediaGolsHT,
          mediaGolsSofridos: stats.mediaGolsSofridos,
          percentualOver: stats.percentualOver,
          percentual0x0: stats.percentual0x0,
          percentualBTTS: stats.percentualBTTS,
          percentualOver05HT: stats.percentualOver05HT,
          percentualOver15HT: stats.percentualOver15HT,
          streakOver: stats.streakOver,
          streakUnder: stats.streakUnder,
          consistencia: stats.consistencia,
          sequencia: stats.sequencia,
          totalJogos,
          overCount,
          underCount,
          overPct,
          underPct,
          tendencia,
          classificacao,
          ultimasPartidas: stats.ultimasPartidas.slice(0, 10),
        };
      })
    );

    return resultados;
  }

  private async getH2H(jogador1Id: string, jogador2Id: string, nome1: string, nome2: string) {
    // Buscar confrontos diretos entre os dois jogadores
    const confrontos = await this.prisma.partida.findMany({
      where: {
        OR: [
          { jogador1Id: jogador1Id, jogador2Id: jogador2Id },
          { jogador1Id: jogador2Id, jogador2Id: jogador1Id },
        ],
        status: StatusPartida.FINALIZADA,
      },
      include: { jogador1: true, jogador2: true },
      orderBy: { dataHora: 'desc' },
      take: 10,
    });

    let vitoriasJ1 = 0, vitoriasJ2 = 0, empates = 0;
    let totalGols = 0;
    let over25Count = 0;
    let over15HTCount = 0;
    let bttsCount = 0;

    const confrontosDiretos: HistoricoPartida[] = confrontos.map(p => {
      const j1IsHome = p.jogador1Id === jogador1Id;
      const golsJ1 = j1IsHome ? (p.golsFT1 || 0) : (p.golsFT2 || 0);
      const golsJ2 = j1IsHome ? (p.golsFT2 || 0) : (p.golsFT1 || 0);
      const total = (p.golsFT1 || 0) + (p.golsFT2 || 0);
      const totalHT = (p.golsHT1 || 0) + (p.golsHT2 || 0);
      const btts = golsJ1 > 0 && golsJ2 > 0;

      totalGols += total;
      if (total > 2) over25Count++;
      if (totalHT > 1) over15HTCount++;
      if (btts) bttsCount++;

      let resultado: 'V' | 'E' | 'D' = 'E';
      if (golsJ1 > golsJ2) { vitoriasJ1++; resultado = 'V'; }
      else if (golsJ1 < golsJ2) { vitoriasJ2++; resultado = 'D'; }
      else { empates++; }

      return {
        id: p.id,
        data: p.dataHora,
        adversario: nome2,
        golsPro: golsJ1,
        golsContra: golsJ2,
        totalGols: total,
        resultado,
        over25: total > 2,
        golsHT: j1IsHome ? (p.golsHT1 || 0) : (p.golsHT2 || 0),
        totalGolsHT: totalHT,
        golsFT: golsJ1,
        btts,
      };
    });

    const count = confrontos.length || 1;
    return {
      confrontosDiretos,
      totalJogos: confrontos.length,
      vitoriasJ1,
      vitoriasJ2,
      empates,
      mediaGolsH2H: totalGols / count,
      over25H2H: (over25Count / count) * 100,
      over15HTH2H: (over15HTCount / count) * 100,
      bttsH2H: (bttsCount / count) * 100,
    };
  }

  private analisarPadroes(jogador1Stats: any, jogador2Stats: any, h2h: any) {
    const mediaHTTotal = jogador1Stats.golsPorTempo.ht + jogador2Stats.golsPorTempo.ht;
    const mediaFTTotal = jogador1Stats.mediaGolsFT + jogador2Stats.mediaGolsFT;
    const media0x0 = (jogador1Stats.percentual0x0 + jogador2Stats.percentual0x0) / 2;

    let tendenciaHT: 'GOL_PROVAVEL' | 'LENTO' | 'NEUTRO' = 'NEUTRO';
    if (mediaHTTotal >= 1.5) tendenciaHT = 'GOL_PROVAVEL';
    else if (mediaHTTotal < 0.8) tendenciaHT = 'LENTO';

    let tendenciaFT: 'OVER' | 'UNDER' | 'NEUTRO' = 'NEUTRO';
    const overMedio = (jogador1Stats.percentualOver + jogador2Stats.percentualOver) / 2;
    if (overMedio >= 65) tendenciaFT = 'OVER';
    else if (overMedio < 40) tendenciaFT = 'UNDER';

    let risco0x0: 'BAIXO' | 'MEDIO' | 'ALTO' = 'MEDIO';
    if (media0x0 < 5) risco0x0 = 'BAIXO';
    else if (media0x0 > 15) risco0x0 = 'ALTO';

    let melhorMomento = 'Sem padrão definido';
    if (tendenciaHT === 'GOL_PROVAVEL') {
      melhorMomento = 'Gols tendem a sair no 1º tempo';
    } else if (tendenciaHT === 'LENTO') {
      melhorMomento = 'Gols tendem a sair no 2º tempo';
    }

    return { tendenciaHT, tendenciaFT, risco0x0, melhorMomento };
  }

  private analisarMercado(
    partida: RadarPartida,
    jogador1Stats: JogadorStatsDetalhado,
    jogador2Stats: JogadorStatsDetalhado,
    h2h: any,
    padroes: any
  ) {
    const alertas: string[] = [];
    let confianca = 50;
    let linhaSegura = 'Over 2.5 FT';
    let linhaValor = 'Over 1.5 HT';
    let riscoPrincipal = 'Sem risco identificado';

    const mediaTotal = partida.indicadores.mediaTotal;
    const overMedio = partida.indicadores.overMedio;
    const over05HTMedio = (jogador1Stats.percentualOver05HT + jogador2Stats.percentualOver05HT) / 2;
    const bttsMedio = (jogador1Stats.percentualBTTS + jogador2Stats.percentualBTTS) / 2;

    // Análise de linha segura
    if (over05HTMedio >= 80) {
      linhaSegura = 'Over 0.5 HT';
      confianca += 15;
    } else if (overMedio >= 70) {
      linhaSegura = 'Over 2.5 FT';
      confianca += 10;
    } else if (overMedio >= 50) {
      linhaSegura = 'Over 1.5 FT';
      confianca += 5;
    } else {
      linhaSegura = 'Under 2.5 FT';
    }

    // Análise de linha valor (melhor risco/retorno)
    if (mediaTotal >= 5 && over05HTMedio >= 70) {
      linhaValor = 'Over 1.5 HT';
      confianca += 10;
    } else if (bttsMedio >= 60) {
      linhaValor = 'BTTS Sim';
      confianca += 5;
    } else if (mediaTotal >= 4) {
      linhaValor = 'Over 2.5 FT';
    } else {
      linhaValor = 'Under 3.5 FT';
    }

    // Alertas de risco
    if (jogador1Stats.streakUnder >= 3 || jogador2Stats.streakUnder >= 3) {
      alertas.push('Jogador em sequência de Under');
      confianca -= 15;
      riscoPrincipal = 'Sequência de jogos com poucos gols';
    }

    if (padroes.risco0x0 === 'ALTO') {
      alertas.push('Alto risco de 0x0 no HT');
      confianca -= 20;
      riscoPrincipal = 'Risco elevado de 0x0';
    }

    if (jogador1Stats.consistencia === 'BAIXA' || jogador2Stats.consistencia === 'BAIXA') {
      alertas.push('Jogador inconsistente (resultados variam muito)');
      confianca -= 10;
    }

    if (h2h.totalJogos >= 3 && h2h.over25H2H < 40) {
      alertas.push('H2H com poucos gols historicamente');
      confianca -= 10;
    }

    if (jogador1Stats.streakOver >= 3 && jogador2Stats.streakOver >= 3) {
      alertas.push('Ambos em sequência de Over - momento quente!');
      confianca += 15;
    }

    // Limitar confiança entre 0 e 100
    confianca = Math.max(0, Math.min(100, confianca));

    return {
      linhaSegura,
      linhaValor,
      riscoPrincipal,
      confianca,
      alertas,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // RADAR DE LINHA — Assertividade de cada linha por liga
  // ═══════════════════════════════════════════════════════════════════

  async getRadarLinhas(liga?: Liga): Promise<{
    linhas: {
      linha: string;
      pagou: number;
      total: number;
      taxa: number;
      tendencia: 'QUENTE' | 'MORNA' | 'FRIA';
      sequencia: ('GREEN' | 'RED')[];
      streakAtual: number;
      streakTipo: 'GREEN' | 'RED';
    }[];
    aoVivo: {
      partidaId: string;
      jogador1: string;
      jogador2: string;
      liga: Liga;
      placar: { home: number; away: number };
      golsHT: number;
      linhasPagas: string[];
      linhasPendentes: string[];
    }[];
    totalPartidas: number;
    liga: string;
  }> {
    // 1) Buscar ultimas partidas FINALIZADAS da liga
    const partidas = await this.prisma.partida.findMany({
      where: {
        ...(liga && { liga }),
        status: StatusPartida.FINALIZADA,
        golsFT1: { not: null },
        golsFT2: { not: null },
      },
      orderBy: { dataHora: 'desc' },
      take: 50,
    });

    // 2) Gerar TODAS as linhas (HT 0.5-6.5, FT 0.5-10.5, Under, BTTS)
    type LinhaCheck = (ht: number, ft: number, g1: number, g2: number) => boolean;
    const linhasDef: { nome: string; requiresHT: boolean; check: LinhaCheck }[] = [];
    for (let v = 0; v <= 6; v++) linhasDef.push({ nome: `Over ${v + 0.5} HT`, requiresHT: true, check: (ht) => ht > v });
    for (let v = 0; v <= 10; v++) linhasDef.push({ nome: `Over ${v + 0.5} FT`, requiresHT: false, check: (_ht, ft) => ft > v });
    for (let v = 0; v <= 4; v++) linhasDef.push({ nome: `Under ${v + 0.5} HT`, requiresHT: true, check: (ht) => ht < v + 1 });
    for (let v = 0; v <= 6; v++) linhasDef.push({ nome: `Under ${v + 0.5} FT`, requiresHT: false, check: (_ht, ft) => ft < v + 1 });
    linhasDef.push({ nome: 'BTTS', requiresHT: false, check: (_ht, _ft, g1, g2) => g1 > 0 && g2 > 0 });

    // 3) Calcular assertividade de cada linha
    const linhas = linhasDef.map((def) => {
      const resultados: ('GREEN' | 'RED')[] = [];

      for (const p of partidas) {
        // Pular partidas sem dados de HT para linhas que exigem HT
        if (def.requiresHT && p.golsHT1 === null && p.golsHT2 === null) continue;

        const golsHT = (p.golsHT1 ?? 0) + (p.golsHT2 ?? 0);
        const golsFT = (p.golsFT1 ?? 0) + (p.golsFT2 ?? 0);
        const pagou = def.check(golsHT, golsFT, p.golsFT1 ?? 0, p.golsFT2 ?? 0);
        resultados.push(pagou ? 'GREEN' : 'RED');
      }

      const pagou = resultados.filter((r) => r === 'GREEN').length;
      const total = resultados.length;
      const taxa = total > 0 ? Math.round((pagou / total) * 100) : 0;

      // Streak atual
      let streakAtual = 0;
      const streakTipo = resultados[0] || 'RED';
      for (const r of resultados) {
        if (r === streakTipo) streakAtual++;
        else break;
      }

      // Tendencia baseada nos ultimos 10
      const ultimos10 = resultados.slice(0, 10);
      const greenUltimos10 = ultimos10.filter((r) => r === 'GREEN').length;
      const taxaRecente = ultimos10.length > 0 ? greenUltimos10 / ultimos10.length : 0;
      const tendencia: 'QUENTE' | 'MORNA' | 'FRIA' =
        taxaRecente >= 0.7 ? 'QUENTE' : taxaRecente >= 0.4 ? 'MORNA' : 'FRIA';

      return {
        linha: def.nome,
        pagou,
        total,
        taxa,
        tendencia,
        sequencia: resultados.slice(0, 20), // Ultimos 20 para visualizacao
        streakAtual,
        streakTipo,
      };
    });

    // 4) Jogos AO VIVO — quais linhas ja pagaram
    const aoVivoPartidas = await this.prisma.partida.findMany({
      where: {
        ...(liga && { liga }),
        status: StatusPartida.AO_VIVO,
      },
      include: { jogador1: true, jogador2: true },
    });

    const aoVivo = aoVivoPartidas.map((p) => {
      const golsHT = (p.golsHT1 ?? 0) + (p.golsHT2 ?? 0);
      const golsFT = (p.golsFT1 ?? 0) + (p.golsFT2 ?? 0);
      const g1 = p.golsFT1 ?? 0;
      const g2 = p.golsFT2 ?? 0;

      const linhasPagas: string[] = [];
      const linhasPendentes: string[] = [];

      for (const def of linhasDef) {
        if (def.check(golsHT, golsFT, g1, g2)) {
          linhasPagas.push(def.nome);
        } else {
          linhasPendentes.push(def.nome);
        }
      }

      const j1 = p as any;
      return {
        partidaId: p.id,
        jogador1: j1.jogador1.nome,
        jogador2: j1.jogador2.nome,
        liga: p.liga,
        placar: { home: g1, away: g2 },
        golsHT,
        linhasPagas,
        linhasPendentes,
        mediaFT: (j1.jogador1.mediaGolsFT || 0) + (j1.jogador2.mediaGolsFT || 0),
        mediaHT: (j1.jogador1.mediaGolsHT || 0) + (j1.jogador2.mediaGolsHT || 0),
      };
    });

    return {
      linhas: linhas.sort((a, b) => b.taxa - a.taxa),
      aoVivo,
      totalPartidas: partidas.length,
      liga: liga || 'TODAS',
    };
  }

  private gerarRecomendacao(
    partida: RadarPartida,
    jogador1Stats: any,
    jogador2Stats: any,
    h2h: any,
    padroes: any
  ) {
    const mediaTotal = partida.indicadores.mediaTotal;
    const overMedio = partida.indicadores.overMedio;
    const linhasSugeridas: string[] = [];
    let motivo = '';

    if (mediaTotal >= 6 && overMedio >= 75) {
      linhasSugeridas.push('Over 2.5 FT', 'Over 1.5 HT');
      motivo = `Juntos, os jogadores têm média de ${mediaTotal.toFixed(1)} gols por partida (soma dos dois). ${overMedio.toFixed(0)}% das partidas recentes terminaram com Over 2.5.`;
    } else if (mediaTotal >= 4 && overMedio >= 55) {
      linhasSugeridas.push('Over 2.5 FT');
      if (padroes.tendenciaHT === 'GOL_PROVAVEL') {
        linhasSugeridas.push('Over 0.5 HT');
        motivo = `Média combinada de ${mediaTotal.toFixed(1)} gols por jogo (somando os dois jogadores). Historicamente, gols tendem a sair já no 1º tempo neste perfil de confronto.`;
      } else {
        motivo = `Média combinada de ${mediaTotal.toFixed(1)} gols por jogo (somando os dois jogadores). ${overMedio.toFixed(0)}% dos jogos recentes tiveram Over 2.5.`;
      }
    } else if (padroes.risco0x0 === 'ALTO') {
      linhasSugeridas.push('Under 2.5 FT', 'Under 1.5 HT');
      motivo = `Risco alto de 0x0 (${((jogador1Stats.percentual0x0 + jogador2Stats.percentual0x0) / 2).toFixed(0)}% de chance). Perfil defensivo dos jogadores indica poucos gols.`;
    } else {
      linhasSugeridas.push('Aguardar ao vivo');
      motivo = 'Dados inconclusivos para uma entrada segura. Recomenda-se aguardar o jogo começar e observar o ritmo antes de entrar.';
    }

    if (h2h.totalJogos >= 3) {
      motivo += ` Nos ${h2h.totalJogos} confrontos diretos, a média foi de ${h2h.mediaGolsH2H.toFixed(1)} gols por jogo.`;
    }

    return {
      classificacao: partida.classificacao,
      motivo,
      linhasSugeridas,
    };
  }
}
