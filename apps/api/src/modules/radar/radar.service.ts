import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Liga, StatusPartida, Cenario } from '@prisma/client';

export interface RadarPartida {
  id: string;
  jogador1: { nome: string; mediaGolsFT: number; percentualOver: number; gols?: number };
  jogador2: { nome: string; mediaGolsFT: number; percentualOver: number; gols?: number };
  liga: Liga;
  dataHora: Date;
  status: StatusPartida;
  cenario: Cenario;
  classificacao: 'OPERAR' | 'CAUTELA' | 'EVITAR';
  placar?: { home: number; away: number };
  indicadores: {
    mediaTotal: number;
    overMedio: number;
    probabilidadeOver25: number;
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
}

export interface JogadorStatsDetalhado {
  nome: string;
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
    const agora = new Date();
    // Só partidas AO_VIVO que começaram há menos de 10 min (eSoccer dura 6-12 min)
    const limiteAoVivo = new Date(agora.getTime() - 10 * 60 * 1000);

    const partidas = await this.prisma.partida.findMany({
      where: {
        ...(liga && { liga }),
        status: StatusPartida.AO_VIVO,
        dataHora: { gte: limiteAoVivo },
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
    const em30Min = new Date(agora.getTime() + 30 * 60 * 1000);

    const partidas = await this.prisma.partida.findMany({
      where: {
        ...(liga && { liga }),
        dataHora: {
          gte: agora,
          lte: em30Min,
        },
        status: StatusPartida.AGENDADA,
      },
      include: {
        jogador1: true,
        jogador2: true,
      },
      orderBy: { dataHora: 'asc' },
      take: 10,
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
      cenario: partida.cenario,
      classificacao,
      placar: partida.status === 'AO_VIVO' ? {
        home: partida.golsFT1 ?? 0,
        away: partida.golsFT2 ?? 0,
      } : undefined,
      indicadores: {
        mediaTotal,
        overMedio,
        probabilidadeOver25,
      },
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
    // OPERAR: Alta probabilidade de gols
    if (mediaTotal >= 6 && overMedio >= 75 && probOver >= 70) {
      return 'OPERAR';
    }
    
    // CAUTELA: Probabilidade média
    if (mediaTotal >= 4 && overMedio >= 55 && probOver >= 50) {
      return 'CAUTELA';
    }
    
    // EVITAR: Baixa probabilidade ou jogadores defensivos
    return 'EVITAR';
  }

  async getAnaliseDetalhada(partidaId: string): Promise<AnaliseDetalhada> {
    const partida = await this.prisma.partida.findUnique({
      where: { id: partidaId },
      include: { jogador1: true, jogador2: true },
    });

    if (!partida) {
      throw new Error('Partida não encontrada');
    }

    const radarPartida = this.mapPartidaToRadar(partida);

    // Buscar histórico do jogador 1
    const jogador1Stats = await this.getJogadorStats(partida.jogador1, partida.jogador1Id);
    
    // Buscar histórico do jogador 2
    const jogador2Stats = await this.getJogadorStats(partida.jogador2, partida.jogador2Id);

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

  private async getJogadorStats(jogador: any, jogadorId: string): Promise<JogadorStatsDetalhado> {
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

    const partidas = await this.prisma.partida.findMany({
      where: {
        OR: [
          { jogador1Id: { in: jogadorIds } },
          { jogador2Id: { in: jogadorIds } },
        ],
        status: StatusPartida.FINALIZADA,
      },
      include: { jogador1: true, jogador2: true },
      orderBy: { dataHora: 'desc' },
      take: 15,
    });

    const ultimasPartidas: HistoricoPartida[] = partidas.map(p => {
      // Verificar se o jogador está como home ou away (considerando todos os IDs do mesmo nickname)
      const isHome = jogadorIds.includes(p.jogador1Id);
      const golsPro = isHome ? (p.golsFT1 || 0) : (p.golsFT2 || 0);
      const golsContra = isHome ? (p.golsFT2 || 0) : (p.golsFT1 || 0);
      const golsHTPro = isHome ? (p.golsHT1 || 0) : (p.golsHT2 || 0);
      const golsHTContra = isHome ? (p.golsHT2 || 0) : (p.golsHT1 || 0);
      const totalGols = (p.golsFT1 || 0) + (p.golsFT2 || 0);
      const totalGolsHT = (p.golsHT1 || 0) + (p.golsHT2 || 0);
      // Mostrar o nickname do adversário, não o time
      const adversarioNome = isHome ? p.jogador2.nome : p.jogador1.nome;
      const adversarioNickname = this.extractNickname(adversarioNome) || adversarioNome;
      const adversario = adversarioNickname;

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
      };
    });

    const count = ultimasPartidas.length || 1;
    const totalGolsHT = ultimasPartidas.reduce((acc, p) => acc + p.golsHT, 0);
    const totalGolsFT = ultimasPartidas.reduce((acc, p) => acc + p.golsFT, 0);
    const totalGolsSofridos = ultimasPartidas.reduce((acc, p) => acc + p.golsContra, 0);

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

    // Calcular percentuais de linhas
    const over15HT = ultimasPartidas.filter(p => (p.totalGolsHT || 0) > 1).length;
    const over05HT = ultimasPartidas.filter(p => (p.totalGolsHT || 0) > 0).length;
    const bttsCount = ultimasPartidas.filter(p => p.btts).length;

    // Maior goleada
    let maiorPro = 0, maiorContra = 0;
    for (const p of ultimasPartidas) {
      if (p.golsPro > maiorPro) maiorPro = p.golsPro;
      if (p.golsContra > maiorContra) maiorContra = p.golsContra;
    }

    // Consistência (variação nos gols)
    const golsArray = ultimasPartidas.map(p => p.golsPro);
    const media = totalGolsFT / count;
    const variancia = golsArray.reduce((acc, g) => acc + Math.pow(g - media, 2), 0) / count;
    const desvio = Math.sqrt(variancia);
    let consistencia: 'ALTA' | 'MEDIA' | 'BAIXA' = 'MEDIA';
    if (desvio < 0.8) consistencia = 'ALTA';
    else if (desvio > 1.5) consistencia = 'BAIXA';

    // Retornar nickname como nome principal
    const nomeJogador = nickname || jogador.nome;

    return {
      nome: nomeJogador,
      ultimasPartidas: ultimasPartidas.slice(0, 10),
      mediaGolsHT: jogador.mediaGolsHT || totalGolsHT / count,
      mediaGolsFT: jogador.mediaGolsFT || totalGolsFT / count,
      percentualOver: jogador.percentualOver,
      percentual0x0: jogador.percentual0x0,
      golsPorTempo: {
        ht: totalGolsHT / count,
        segundoTempo: (totalGolsFT - totalGolsHT) / count,
      },
      sequencia: ultimasPartidas.slice(0, 5).map(p => p.resultado),
      // Novas métricas
      streakOver,
      streakUnder,
      mediaGolsSofridos: totalGolsSofridos / count,
      percentualOver15HT: (over15HT / count) * 100,
      percentualOver05HT: (over05HT / count) * 100,
      percentualBTTS: (bttsCount / count) * 100,
      maiorGoleada: { pro: maiorPro, contra: maiorContra },
      consistencia,
    };
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
