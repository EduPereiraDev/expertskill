import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Bet365Service } from '../betsapi/bet365.service';
import { Liga, StatusPartida } from '@prisma/client';

export interface JogadorRanking {
  id: string;
  nome: string;
  liga: Liga;
  mediaGolsFT: number;
  mediaGolsHT: number;
  percentualOver: number;
  percentual0x0: number;
  totalPartidas?: number;
}

export interface ConfrontoAnalise {
  id: string;
  jogador1: JogadorRanking;
  jogador2: JogadorRanking;
  liga: Liga;
  dataHora: Date;
  mediaTotal: number;
  probabilidadeOver25: number;
  probabilidadeUnder25: number;
  probabilidade0x0: number;
  classificacao: 'OVER' | 'UNDER' | 'NEUTRO';
  indicadorHT: 'GOL_PROVAVEL' | 'LENTO' | 'NEUTRO';
}

export interface Insight {
  tipo: string;
  titulo: string;
  descricao: string;
  nivel: 'info' | 'alerta' | 'oportunidade';
}

export interface MonitoramentoOdds {
  id: string;
  jogador1: string;
  jogador2: string;
  liga: Liga;
  placarHT: string;
  placarFT: string;
  golsMinutos: string[];
  linhaAberta: string | null;
  linhaStatus: 'PAGO' | 'PERDIDO' | 'ABERTO' | 'SEM_LINHA';
  oportunidade: boolean;
  analise: string;
  dataHora: Date;
}

export interface AnaliseAoVivoDto {
  jogador1Id?: string;
  jogador2Id?: string;
  jogador1Nome?: string;
  jogador2Nome?: string;
  jogador1Time?: string;
  jogador2Time?: string;
  gols1: number;
  gols2: number;
  minuto: number;
  isHT: boolean; // true = primeiro tempo, false = segundo tempo
}

export interface AnaliseAoVivoResult {
  jogador1: string;
  jogador2: string;
  placar: string;
  minuto: number;
  periodo: string;
  totalGols: number;
  linhasAnalisadas: {
    linha: string;
    status: 'PAGO' | 'PENDENTE' | 'IMPOSSIVEL';
    valorizado: boolean;
    explicacao: string;
  }[];
  recomendacao: string;
  alertas: string[];
  historico?: {
    totalPartidas: number;
    mediaGols: number;
    percentualOver15: number;
    percentualOver25: number;
    ultimasPartidas: { 
      placarHT: string; 
      placarFT: string; 
      totalGols: number; 
      data: string;
      jogador1: string;
      jogador2: string;
      gols1: number;
      gols2: number;
      golsHT1: number;
      golsHT2: number;
    }[];
  };
  analiseManipulacao?: {
    risco: 'BAIXO' | 'MEDIO' | 'ALTO';
    indicadores: string[];
    recomendacao: string;
  };
}

export interface AnaliseDiaria {
  data: string;
  jogadorMaisOver: JogadorRanking | null;
  jogadorMenosOver: JogadorRanking | null;
  confrontoMaisOver: ConfrontoAnalise | null;
  confrontoMaisUnder: ConfrontoAnalise | null;
  confrontosMais0x0: ConfrontoAnalise[];
  jogosGolHTMorrendoFT: ConfrontoAnalise[];
  jogos0x0HTGolFT: ConfrontoAnalise[];
  primeiroJogoGrade: ConfrontoAnalise | null;
  ultimosJogosGrade: ConfrontoAnalise[];
  proximosJogos: ConfrontoAnalise[];
  insights: Insight[];
  monitoramentoOdds: MonitoramentoOdds[];
  estatisticas: {
    totalPartidas: number;
    partidasOver25: number;
    partidasUnder25: number;
    partidas0x0: number;
    mediaGolsDia: number;
  };
}

@Injectable()
export class AnaliseService {
  private readonly logger = new Logger(AnaliseService.name);

  constructor(
    private prisma: PrismaService,
    private bet365Service: Bet365Service,
  ) {}

  async getAnaliseDiaria(data?: Date, liga?: Liga, horas?: number): Promise<AnaliseDiaria> {
    const dataAnalise = data || new Date();
    
    let inicioDia: Date;
    let fimDia: Date;
    
    if (horas && horas > 0) {
      // Filtrar pelas últimas X horas
      fimDia = new Date();
      inicioDia = new Date(fimDia.getTime() - (horas * 60 * 60 * 1000));
    } else {
      // Usar UTC para evitar problemas de timezone - dia inteiro
      inicioDia = new Date(Date.UTC(
        dataAnalise.getFullYear(),
        dataAnalise.getMonth(),
        dataAnalise.getDate(),
        0, 0, 0, 0
      ));
      fimDia = new Date(Date.UTC(
        dataAnalise.getFullYear(),
        dataAnalise.getMonth(),
        dataAnalise.getDate(),
        23, 59, 59, 999
      ));
    }

    // Buscar todos os jogadores ativos (filtrado por liga se especificado)
    const jogadores = await this.prisma.jogador.findMany({
      where: liga ? { liga } : undefined,
      orderBy: { mediaGolsFT: 'desc' },
    });

    // Buscar partidas do dia (filtrado por liga se especificado)
    const partidas = await this.prisma.partida.findMany({
      where: {
        dataHora: { gte: inicioDia, lte: fimDia },
        ...(liga && { liga }),
      },
      include: {
        jogador1: true,
        jogador2: true,
      },
      orderBy: { dataHora: 'asc' },
    });

    // Jogador mais OVER do dia
    const jogadorMaisOver = jogadores.length > 0 ? this.mapJogador(jogadores[0]) : null;

    // Jogador menos OVER (pior) do dia
    const jogadorMenosOver = jogadores.length > 0 
      ? this.mapJogador(jogadores[jogadores.length - 1]) 
      : null;

    // Analisar confrontos
    const confrontosAnalisados = partidas.map(p => this.analisarConfronto(p));

    // Confronto mais OVER (maior probabilidade de over)
    const confrontoMaisOver = confrontosAnalisados
      .sort((a, b) => b.probabilidadeOver25 - a.probabilidadeOver25)[0] || null;

    // Confronto mais UNDER (menor probabilidade de over = maior probabilidade de under)
    // Pega o confronto com MENOR probabilidade de over, independente da classificação
    const confrontoMaisUnder = confrontosAnalisados
      .sort((a, b) => a.probabilidadeOver25 - b.probabilidadeOver25)[0] || null;

    // Confrontos com mais chance de 0x0
    const confrontosMais0x0 = confrontosAnalisados
      .filter(c => c.probabilidade0x0 > 20)
      .sort((a, b) => b.probabilidade0x0 - a.probabilidade0x0)
      .slice(0, 3);

    // Jogos com padrão GOL no HT e morrendo no FT (baseado em histórico)
    const jogosGolHTMorrendoFT = confrontosAnalisados
      .filter(c => c.indicadorHT === 'GOL_PROVAVEL' && c.probabilidadeOver25 < 60)
      .slice(0, 3);

    // Jogos com padrão 0x0 no HT e gol no FT
    const jogos0x0HTGolFT = confrontosAnalisados
      .filter(c => c.indicadorHT === 'LENTO' && c.probabilidadeOver25 > 50)
      .slice(0, 3);

    // Primeiro jogo da grade
    const primeiroJogoGrade = confrontosAnalisados[0] || null;

    // Últimos jogos da grade
    const ultimosJogosGrade = confrontosAnalisados.slice(-3);

    // Estatísticas do dia (partidas finalizadas)
    const partidasFinalizadas = partidas.filter(p => p.status === StatusPartida.FINALIZADA);
    const totalGols = partidasFinalizadas.reduce((acc, p) => {
      return acc + (p.golsFT1 || 0) + (p.golsFT2 || 0);
    }, 0);

    const partidasOver25 = partidasFinalizadas.filter(p => {
      const totalGolsPartida = (p.golsFT1 || 0) + (p.golsFT2 || 0);
      return totalGolsPartida > 2;
    }).length;

    const partidas0x0 = partidasFinalizadas.filter(p => {
      return (p.golsFT1 || 0) === 0 && (p.golsFT2 || 0) === 0;
    }).length;

    // Gerar insights inteligentes
    const insights = this.gerarInsights(
      confrontosAnalisados,
      partidasFinalizadas,
      partidasOver25,
      partidas0x0,
      totalGols,
      jogadores
    );

    // Gerar monitoramento de odds das partidas ao vivo
    const partidasAoVivo = partidas.filter(p => p.status === StatusPartida.AO_VIVO);
    const monitoramentoOdds = this.gerarMonitoramentoOdds(partidasAoVivo);

    // Próximos jogos - buscar da API em tempo real (com filtro de liga)
    const proximosJogos = await this.getProximosJogosAPI(liga);

    return {
      data: inicioDia.toISOString().split('T')[0],
      jogadorMaisOver,
      jogadorMenosOver,
      confrontoMaisOver,
      confrontoMaisUnder,
      confrontosMais0x0,
      jogosGolHTMorrendoFT,
      jogos0x0HTGolFT,
      primeiroJogoGrade,
      ultimosJogosGrade,
      proximosJogos,
      insights,
      monitoramentoOdds,
      estatisticas: {
        totalPartidas: partidas.length,
        partidasOver25,
        partidasUnder25: partidasFinalizadas.length - partidasOver25,
        partidas0x0,
        mediaGolsDia: partidasFinalizadas.length > 0 
          ? totalGols / partidasFinalizadas.length 
          : 0,
      },
    };
  }

  private gerarInsights(
    confrontos: ConfrontoAnalise[],
    partidasFinalizadas: any[],
    partidasOver25: number,
    partidas0x0: number,
    totalGols: number,
    jogadores: any[]
  ): { tipo: string; titulo: string; descricao: string; nivel: 'info' | 'alerta' | 'oportunidade' }[] {
    const insights: { tipo: string; titulo: string; descricao: string; nivel: 'info' | 'alerta' | 'oportunidade' }[] = [];
    
    const totalFinalizadas = partidasFinalizadas.length;
    if (totalFinalizadas === 0) return insights;

    const taxaOver = (partidasOver25 / totalFinalizadas) * 100;
    const taxa0x0 = (partidas0x0 / totalFinalizadas) * 100;
    const mediaGols = totalGols / totalFinalizadas;

    // Insight: Liga muito OVER
    if (taxaOver >= 70) {
      insights.push({
        tipo: 'TENDENCIA_OVER',
        titulo: 'Liga em Alta de Gols',
        descricao: `${taxaOver.toFixed(0)}% das partidas terminaram Over 2.5. Momento favorável para entradas em Over.`,
        nivel: 'oportunidade',
      });
    }

    // Insight: Liga fria (muitos unders)
    if (taxaOver <= 40) {
      insights.push({
        tipo: 'TENDENCIA_UNDER',
        titulo: 'Liga Fria',
        descricao: `Apenas ${taxaOver.toFixed(0)}% Over 2.5. Considere entradas em Under ou aguarde mudança de padrão.`,
        nivel: 'alerta',
      });
    }

    // Insight: Alta taxa de 0x0
    if (taxa0x0 >= 10) {
      insights.push({
        tipo: 'ALTA_0X0',
        titulo: 'Muitos 0x0 Detectados',
        descricao: `${taxa0x0.toFixed(0)}% das partidas terminaram 0x0. Cuidado com entradas em Over no início.`,
        nivel: 'alerta',
      });
    }

    // Insight: Média de gols alta
    if (mediaGols >= 4.5) {
      insights.push({
        tipo: 'MEDIA_ALTA',
        titulo: 'Média de Gols Explosiva',
        descricao: `Média de ${mediaGols.toFixed(1)} gols por partida. Oportunidade para Over 3.5 e 4.5.`,
        nivel: 'oportunidade',
      });
    }

    // Insight: Jogadores em forma
    const jogadoresEmForma = jogadores.filter(j => j.percentualOver >= 80);
    if (jogadoresEmForma.length >= 3) {
      insights.push({
        tipo: 'JOGADORES_FORMA',
        titulo: 'Jogadores em Ótima Forma',
        descricao: `${jogadoresEmForma.length} jogadores com +80% de Over. Fique atento aos confrontos deles.`,
        nivel: 'oportunidade',
      });
    }

    // Insight: Muitos confrontos OVER
    const confrontosOver = confrontos.filter(c => c.classificacao === 'OVER').length;
    const percentualConfrontosOver = (confrontosOver / Math.max(confrontos.length, 1)) * 100;
    if (percentualConfrontosOver >= 60) {
      insights.push({
        tipo: 'GRADE_FAVORAVEL',
        titulo: 'Grade Favorável para Over',
        descricao: `${percentualConfrontosOver.toFixed(0)}% dos confrontos classificados como OVER. Bom momento para operar.`,
        nivel: 'oportunidade',
      });
    }

    // Insight: Poucos confrontos bons
    if (confrontosOver < 3 && confrontos.length >= 10) {
      insights.push({
        tipo: 'GRADE_FRACA',
        titulo: 'Grade com Poucos Confrontos Bons',
        descricao: `Apenas ${confrontosOver} confrontos classificados como OVER. Considere aguardar melhores oportunidades.`,
        nivel: 'alerta',
      });
    }

    // Insight: Horário de pico (se houver muitas partidas)
    if (confrontos.length >= 20) {
      insights.push({
        tipo: 'VOLUME_ALTO',
        titulo: 'Alto Volume de Partidas',
        descricao: `${confrontos.length} partidas no período. Mais opções para selecionar as melhores entradas.`,
        nivel: 'info',
      });
    }

    return insights;
  }

  private gerarMonitoramentoOdds(partidasAoVivo: any[]): MonitoramentoOdds[] {
    return partidasAoVivo.slice(0, 10).map(partida => {
      const golsHT = (partida.golsHT1 || 0) + (partida.golsHT2 || 0);
      const golsFT = (partida.golsFT1 || 0) + (partida.golsFT2 || 0);
      const totalGols = golsFT > 0 ? golsFT : golsHT;
      
      // Não mostrar minutos - removido
      const golsMinutos: string[] = [];

      // Determinar linha e status para jogos ao vivo
      let linhaAberta: string | null = null;
      let linhaStatus: 'PAGO' | 'PERDIDO' | 'ABERTO' | 'SEM_LINHA' = 'SEM_LINHA';
      let oportunidade = false;
      let analise = '';

      // Lógica para jogos ao vivo - focar em linhas que ainda dá tempo de pegar
      if (totalGols === 0) {
        // 0x0 - Over 0.5 ainda aberto
        linhaAberta = 'Over 0.5 FT';
        linhaStatus = 'ABERTO';
        oportunidade = true;
        analise = 'Jogo 0x0. Over 0.5 ainda disponível.';
      } else if (totalGols === 1) {
        // 1 gol - Over 1.5 ainda aberto
        linhaAberta = 'Over 1.5 FT';
        linhaStatus = 'ABERTO';
        oportunidade = true;
        analise = 'Falta 1 gol para Over 1.5 FT.';
      } else if (totalGols === 2) {
        // 2 gols - Over 1.5 pago, Over 2.5 aberto
        linhaAberta = 'Over 2.5 FT';
        linhaStatus = 'ABERTO';
        oportunidade = true;
        analise = 'Over 1.5 pago. Over 2.5 ainda disponível.';
      } else if (totalGols >= 3) {
        // 3+ gols - Over 2.5 pago
        linhaAberta = 'Over 2.5 FT';
        linhaStatus = 'PAGO';
        oportunidade = false;
        analise = 'Over 2.5 FT pago! Jogo com muitos gols.';
      }

      return {
        id: partida.id,
        jogador1: partida.jogador1?.nome || 'Jogador 1',
        jogador2: partida.jogador2?.nome || 'Jogador 2',
        liga: partida.liga,
        placarHT: `${partida.golsHT1 || 0}x${partida.golsHT2 || 0}`,
        placarFT: `${partida.golsFT1 || 0}x${partida.golsFT2 || 0}`,
        golsMinutos,
        linhaAberta,
        linhaStatus,
        oportunidade,
        analise,
        dataHora: partida.dataHora,
      };
    });
  }

  async getRankingJogadores(liga?: Liga, limite = 20): Promise<{
    maisOver: JogadorRanking[];
    menosOver: JogadorRanking[];
    mais0x0: JogadorRanking[];
  }> {
    const where = liga ? { liga } : {};

    const jogadoresMaisOver = await this.prisma.jogador.findMany({
      where,
      orderBy: { mediaGolsFT: 'desc' },
      take: limite,
    });

    const jogadoresMenosOver = await this.prisma.jogador.findMany({
      where,
      orderBy: { mediaGolsFT: 'asc' },
      take: limite,
    });

    const jogadoresMais0x0 = await this.prisma.jogador.findMany({
      where,
      orderBy: { percentual0x0: 'desc' },
      take: limite,
    });

    return {
      maisOver: jogadoresMaisOver.map(j => this.mapJogador(j)),
      menosOver: jogadoresMenosOver.map(j => this.mapJogador(j)),
      mais0x0: jogadoresMais0x0.map(j => this.mapJogador(j)),
    };
  }

  async analisarAoVivo(dto: AnaliseAoVivoDto): Promise<AnaliseAoVivoResult> {
    const { gols1, gols2, minuto, isHT } = dto;
    const totalGols = gols1 + gols2;
    const periodo = isHT ? 'Primeiro Tempo' : 'Segundo Tempo';
    
    // Buscar nomes dos jogadores se IDs fornecidos
    let jogador1Nome = dto.jogador1Nome || 'Jogador 1';
    let jogador2Nome = dto.jogador2Nome || 'Jogador 2';
    
    if (dto.jogador1Id) {
      const j1 = await this.prisma.jogador.findUnique({ where: { id: dto.jogador1Id } });
      if (j1) jogador1Nome = j1.nome;
    }
    if (dto.jogador2Id) {
      const j2 = await this.prisma.jogador.findUnique({ where: { id: dto.jogador2Id } });
      if (j2) jogador2Nome = j2.nome;
    }

    const linhasAnalisadas: AnaliseAoVivoResult['linhasAnalisadas'] = [];
    const alertas: string[] = [];

    // Análise de linhas HT (primeiro tempo)
    if (isHT) {
      // Over 0.5 HT - valorizado se gol entre 5' e 20'
      const over05Valorizado = totalGols >= 1 && minuto >= 5 && minuto <= 20;
      linhasAnalisadas.push({
        linha: 'Over 0.5 HT',
        status: totalGols >= 1 ? 'PAGO' : 'PENDENTE',
        valorizado: over05Valorizado,
        explicacao: totalGols >= 1 
          ? `Pago aos ${minuto}'. ${minuto < 5 ? 'Gol muito cedo, mercado pode não ter aberto.' : 'Linha válida.'}`
          : `Ainda 0x0 aos ${minuto}'. Aguardando gol.`,
      });

      // Over 1.5 HT - valorizado se 2+ gols entre 10' e 40'
      const over15Valorizado = totalGols >= 2 && minuto >= 10 && minuto <= 40;
      linhasAnalisadas.push({
        linha: 'Over 1.5 HT',
        status: totalGols >= 2 ? 'PAGO' : (minuto > 40 && totalGols < 2 ? 'IMPOSSIVEL' : 'PENDENTE'),
        valorizado: over15Valorizado,
        explicacao: totalGols >= 2 
          ? `Pago com ${totalGols} gols aos ${minuto}'.${minuto < 10 ? ' Gols muito cedo.' : ''}`
          : minuto > 40 ? 'Tempo esgotando, difícil bater.' : `Faltam ${2 - totalGols} gol(s).`,
      });

      // Over 2.5 HT - valorizado se 3+ gols entre 15' e 45'
      const over25Valorizado = totalGols >= 3 && minuto >= 15;
      linhasAnalisadas.push({
        linha: 'Over 2.5 HT',
        status: totalGols >= 3 ? 'PAGO' : (minuto > 35 && totalGols < 2 ? 'IMPOSSIVEL' : 'PENDENTE'),
        valorizado: over25Valorizado,
        explicacao: totalGols >= 3 
          ? `Pago! Jogo explosivo com ${totalGols} gols no HT.${minuto < 15 ? ' Mas gols vieram cedo.' : ''}`
          : `Faltam ${3 - totalGols} gol(s). ${minuto < 30 ? 'Ainda há tempo.' : 'Tempo curto.'}`,
      });

      // Alertas HT
      if (totalGols >= 2 && minuto < 5) {
        alertas.push('Gols muito cedo! Mercado pode ter estourado antes de abrir linha valorizada.');
      }
      if (totalGols === 0 && minuto >= 35) {
        alertas.push('Jogo travado. Considere Under ou aguarde o segundo tempo.');
      }
    } else {
      // Análise FT (segundo tempo)
      // Over 1.5 FT
      linhasAnalisadas.push({
        linha: 'Over 1.5 FT',
        status: totalGols >= 2 ? 'PAGO' : 'PENDENTE',
        valorizado: totalGols >= 2,
        explicacao: totalGols >= 2 ? 'Linha paga!' : `Falta ${2 - totalGols} gol(s).`,
      });

      // Over 2.5 FT
      linhasAnalisadas.push({
        linha: 'Over 2.5 FT',
        status: totalGols >= 3 ? 'PAGO' : (minuto > 80 && totalGols < 2 ? 'IMPOSSIVEL' : 'PENDENTE'),
        valorizado: totalGols >= 3,
        explicacao: totalGols >= 3 
          ? 'Linha paga! Jogo com muitos gols.'
          : `Faltam ${3 - totalGols} gol(s). ${minuto < 70 ? 'Ainda dá tempo.' : 'Tempo curto.'}`,
      });

      // Over 3.5 FT
      linhasAnalisadas.push({
        linha: 'Over 3.5 FT',
        status: totalGols >= 4 ? 'PAGO' : (minuto > 75 && totalGols < 3 ? 'IMPOSSIVEL' : 'PENDENTE'),
        valorizado: totalGols >= 4,
        explicacao: totalGols >= 4 
          ? 'Linha paga! Jogo explosivo.'
          : `Faltam ${4 - totalGols} gol(s).`,
      });

      // Over 4.5 FT
      linhasAnalisadas.push({
        linha: 'Over 4.5 FT',
        status: totalGols >= 5 ? 'PAGO' : 'PENDENTE',
        valorizado: totalGols >= 5,
        explicacao: totalGols >= 5 ? 'Linha paga!' : `Faltam ${5 - totalGols} gol(s).`,
      });
    }

    // Gerar recomendação
    const linhasPagas = linhasAnalisadas.filter(l => l.status === 'PAGO');
    const linhasValorizadas = linhasAnalisadas.filter(l => l.valorizado);
    
    let recomendacao = '';
    if (linhasValorizadas.length > 0) {
      recomendacao = `${linhasValorizadas.length} linha(s) paga(s) com valor: ${linhasValorizadas.map(l => l.linha).join(', ')}.`;
    } else if (linhasPagas.length > 0) {
      recomendacao = `${linhasPagas.length} linha(s) paga(s), mas gols vieram cedo demais para aproveitar.`;
    } else if (totalGols === 0) {
      recomendacao = isHT 
        ? 'Jogo sem gols. Aguarde ou considere Under.'
        : 'Jogo travado. Difícil recuperar para Over.';
    } else {
      recomendacao = 'Linhas ainda pendentes. Acompanhe o jogo.';
    }

    // Buscar histórico do confronto
    let historico: AnaliseAoVivoResult['historico'] = undefined;
    let analiseManipulacao: AnaliseAoVivoResult['analiseManipulacao'] = undefined;

    try {
      // Extrair nickname do jogador: "FC Porto (Klaus)" -> "Klaus"
      const extractNickname = (name: string): string => {
        const match = name.match(/\(([^)]+)\)/);
        return match ? match[1].trim() : name.split(' ')[0];
      };
      
      const nick1 = extractNickname(jogador1Nome);
      const nick2 = extractNickname(jogador2Nome);

      // Se times foram selecionados, buscar confrontos diretos entre os dois jogadores
      // Se não, buscar histórico geral do jogador 1
      const temTime1 = dto.jogador1Time && dto.jogador1Time.length > 0;
      const temTime2 = dto.jogador2Time && dto.jogador2Time.length > 0;
      
      let whereClause: any;
      
      if (temTime1 && temTime2) {
        // Confronto direto com times específicos
        const nomeCompleto1 = `${dto.jogador1Time} (${nick1})`;
        const nomeCompleto2 = `${dto.jogador2Time} (${nick2})`;
        whereClause = {
          OR: [
            {
              jogador1: { nome: { contains: nomeCompleto1, mode: 'insensitive' } },
              jogador2: { nome: { contains: nomeCompleto2, mode: 'insensitive' } },
            },
            {
              jogador1: { nome: { contains: nomeCompleto2, mode: 'insensitive' } },
              jogador2: { nome: { contains: nomeCompleto1, mode: 'insensitive' } },
            },
          ],
          status: StatusPartida.FINALIZADA,
        };
      } else {
        // Histórico geral do jogador 1 (todas as partidas)
        whereClause = {
          OR: [
            { jogador1: { nome: { contains: `(${nick1})`, mode: 'insensitive' } } },
            { jogador2: { nome: { contains: `(${nick1})`, mode: 'insensitive' } } },
          ],
          status: StatusPartida.FINALIZADA,
        };
      }
      
      const partidasAnteriores = await this.prisma.partida.findMany({
        where: whereClause,
        include: {
          jogador1: true,
          jogador2: true,
        },
        orderBy: { dataHora: 'desc' },
        take: 20,
      });

      if (partidasAnteriores.length > 0) {
        const golsTotais = partidasAnteriores.map(p => (p.golsFT1 || 0) + (p.golsFT2 || 0));
        const mediaGols = golsTotais.reduce((a, b) => a + b, 0) / golsTotais.length;
        const over15Count = golsTotais.filter(g => g >= 2).length;
        const over25Count = golsTotais.filter(g => g >= 3).length;

        historico = {
          totalPartidas: partidasAnteriores.length,
          mediaGols: Math.round(mediaGols * 10) / 10,
          percentualOver15: Math.round((over15Count / partidasAnteriores.length) * 100),
          percentualOver25: Math.round((over25Count / partidasAnteriores.length) * 100),
          ultimasPartidas: partidasAnteriores.slice(0, 20).map(p => ({
            placarHT: p.golsHT1 !== null && p.golsHT2 !== null ? `${p.golsHT1}x${p.golsHT2}` : '-',
            placarFT: `${p.golsFT1 || 0}x${p.golsFT2 || 0}`,
            totalGols: (p.golsFT1 || 0) + (p.golsFT2 || 0),
            data: p.dataHora.toISOString().replace('T', ' ').substring(0, 16),
            jogador1: p.jogador1?.nome || 'Jogador 1',
            jogador2: p.jogador2?.nome || 'Jogador 2',
            gols1: p.golsFT1 || 0,
            gols2: p.golsFT2 || 0,
            golsHT1: p.golsHT1 || 0,
            golsHT2: p.golsHT2 || 0,
          })),
        };

        // Análise de padrões e anomalias baseada no histórico
        const indicadores: string[] = [];
        let risco: 'BAIXO' | 'MEDIO' | 'ALTO' = 'BAIXO';

        // Calcular ritmo esperado de gols
        const tempoTotal = isHT ? 45 : 90;
        const golsEsperadosAteAgora = mediaGols * (minuto / tempoTotal);
        const ritmoAtual = minuto > 0 ? (totalGols / minuto) * tempoTotal : 0;

        // Verificar cenários anômalos
        
        // 1. Jogo travado quando histórico é de muitos gols
        if (totalGols === 0 && minuto > 25 && mediaGols > 2.5) {
          indicadores.push(`0x0 aos ${minuto}' mas média histórica é ${mediaGols} gols - ANOMALIA`);
          risco = 'MEDIO';
        }

        // 2. Explosão de gols cedo quando histórico é de poucos gols
        if (totalGols >= 3 && minuto < 15 && mediaGols < 2.5) {
          indicadores.push(`${totalGols} gols aos ${minuto}' mas média histórica é só ${mediaGols} - MANIPULAÇÃO PROVÁVEL`);
          risco = 'ALTO';
        }

        // 3. Gols demais muito cedo (padrão clássico de manipulação)
        if (totalGols >= 4 && minuto < 20) {
          indicadores.push(`${totalGols} gols em ${minuto}' - padrão suspeito de manipulação Over`);
          risco = 'ALTO';
        }

        // 4. Ritmo muito acima do esperado
        if (ritmoAtual > mediaGols * 1.8 && minuto > 10 && totalGols >= 2) {
          indicadores.push(`Ritmo projetado: ${ritmoAtual.toFixed(1)} gols (histórico: ${mediaGols})`);
          if (risco === 'BAIXO') risco = 'MEDIO';
        }

        // 5. Ritmo muito abaixo do esperado
        if (totalGols < golsEsperadosAteAgora * 0.5 && minuto > 30 && mediaGols > 2) {
          indicadores.push(`Apenas ${totalGols} gol(s) aos ${minuto}' - esperado ~${Math.round(golsEsperadosAteAgora)}`);
        }

        // Gerar recomendação de apostas baseada no cenário
        let recomendacaoManip = '';
        const apostasRecomendadas: string[] = [];

        if (risco === 'ALTO') {
          recomendacaoManip = 'ANOMALIA DETECTADA - NÃO apostar neste jogo.';
        } else if (risco === 'MEDIO') {
          recomendacaoManip = 'Padrão atípico. Se entrar, use stake mínima.';
        } else {
          // Recomendar apostas baseadas no histórico e momento atual
          if (totalGols === 0 && minuto < 20 && historico.percentualOver15 >= 70) {
            apostasRecomendadas.push(`Over 1.5 FT (${historico.percentualOver15}% histórico)`);
          }
          if (totalGols === 1 && minuto < 30 && historico.percentualOver25 >= 60) {
            apostasRecomendadas.push(`Over 2.5 FT (${historico.percentualOver25}% histórico)`);
          }
          if (totalGols >= 2 && minuto < 25 && mediaGols > 3) {
            apostasRecomendadas.push(`Over 3.5 FT (média ${mediaGols} gols)`);
          }
          if (totalGols === 0 && minuto > 35 && historico.percentualOver15 < 50) {
            apostasRecomendadas.push(`Under 1.5 FT (jogo travado, histórico ${historico.percentualOver15}% Over)`);
          }

          if (apostasRecomendadas.length > 0) {
            recomendacaoManip = `Apostas recomendadas: ${apostasRecomendadas.join(' | ')}`;
          } else {
            recomendacaoManip = 'Cenário dentro do esperado. Aguarde melhor momento.';
          }
        }

        analiseManipulacao = { risco, indicadores, recomendacao: recomendacaoManip };
      }
    } catch (err) {
      // Ignora erros na busca de histórico
    }

    return {
      jogador1: jogador1Nome,
      jogador2: jogador2Nome,
      placar: `${gols1}x${gols2}`,
      minuto,
      periodo,
      totalGols,
      linhasAnalisadas,
      recomendacao,
      alertas,
      historico,
      analiseManipulacao,
    };
  }

  async getJogadoresParaSelecao(liga?: Liga) {
    const jogadores = await this.prisma.jogador.findMany({
      where: liga ? { liga } : undefined,
      select: { id: true, nome: true, liga: true, mediaGolsFT: true, mediaGolsHT: true, percentualOver: true, percentual0x0: true },
      orderBy: { nome: 'asc' },
      take: 500,
    });
    return jogadores;
  }

  async getConfrontosHoje(liga?: Liga): Promise<ConfrontoAnalise[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const partidas = await this.prisma.partida.findMany({
      where: {
        dataHora: { gte: hoje, lt: amanha },
        ...(liga && { liga }),
      },
      include: {
        jogador1: true,
        jogador2: true,
      },
      orderBy: { dataHora: 'asc' },
    });

    return partidas.map(p => this.analisarConfronto(p));
  }

  private mapJogador(jogador: any): JogadorRanking {
    return {
      id: jogador.id,
      nome: jogador.nome,
      liga: jogador.liga,
      mediaGolsFT: jogador.mediaGolsFT,
      mediaGolsHT: jogador.mediaGolsHT,
      percentualOver: jogador.percentualOver,
      percentual0x0: jogador.percentual0x0,
    };
  }

  async getNicknamesComTimes(liga?: Liga): Promise<{ nickname: string; times: string[] }[]> {
    const where = liga ? { liga } : {};
    const jogadores = await this.prisma.jogador.findMany({ where });
    
    const nicknameMap = new Map<string, Set<string>>();
    
    for (const j of jogadores) {
      const match = j.nome.match(/\(([^)]+)\)/);
      if (match) {
        const nickname = match[1];
        const time = j.nome.split('(')[0].trim();
        if (!nicknameMap.has(nickname)) {
          nicknameMap.set(nickname, new Set());
        }
        nicknameMap.get(nickname)!.add(time);
      }
    }
    
    return Array.from(nicknameMap.entries())
      .map(([nickname, times]) => ({
        nickname,
        times: Array.from(times).sort(),
      }))
      .sort((a, b) => a.nickname.localeCompare(b.nickname));
  }

  private analisarConfronto(partida: any): ConfrontoAnalise {
    const { jogador1, jogador2 } = partida;

    const mediaTotal = jogador1.mediaGolsFT + jogador2.mediaGolsFT;
    const mediaHT = jogador1.mediaGolsHT + jogador2.mediaGolsHT;
    const media0x0 = (jogador1.percentual0x0 + jogador2.percentual0x0) / 2;

    // Calcular probabilidades usando dados reais do histórico
    const probabilidadeOver25 = this.calcularProbOver(mediaTotal, jogador1.percentualOver, jogador2.percentualOver);
    const probabilidadeUnder25 = 100 - probabilidadeOver25;
    // Usa diretamente a média do percentual de 0x0 dos jogadores (dados reais)
    const probabilidade0x0 = Math.round(media0x0);

    // Classificação
    let classificacao: 'OVER' | 'UNDER' | 'NEUTRO' = 'NEUTRO';
    if (probabilidadeOver25 >= 65) classificacao = 'OVER';
    else if (probabilidadeUnder25 >= 65) classificacao = 'UNDER';

    // Indicador HT
    let indicadorHT: 'GOL_PROVAVEL' | 'LENTO' | 'NEUTRO' = 'NEUTRO';
    if (mediaHT >= 1.5) indicadorHT = 'GOL_PROVAVEL';
    else if (mediaHT < 0.8) indicadorHT = 'LENTO';

    return {
      id: partida.id,
      jogador1: this.mapJogador(jogador1),
      jogador2: this.mapJogador(jogador2),
      liga: partida.liga,
      dataHora: partida.dataHora,
      mediaTotal,
      probabilidadeOver25,
      probabilidadeUnder25,
      probabilidade0x0,
      classificacao,
      indicadorHT,
    };
  }

  private calcularProbOver(_mediaTotal: number, over1: number, over2: number): number {
    // Usa diretamente a média do percentual de over dos jogadores
    // Esses valores vêm do histórico real de partidas finalizadas
    const overMedio = (over1 + over2) / 2;
    return Math.round(overMedio);
  }

  private async getProximosJogosAPI(ligaFiltro?: Liga): Promise<ConfrontoAnalise[]> {
    try {
      const response = await this.bet365Service.getUpcoming();
      
      if (!response.results || response.results.length === 0) {
        return [];
      }

      // Filtrar apenas e-soccer
      let esoccerEvents = response.results.filter((e: any) => 
        e.league?.name?.toLowerCase().includes('esoccer') ||
        e.league?.name?.toLowerCase().includes('e-soccer')
      );

      // Aplicar filtro de liga se especificado
      if (ligaFiltro) {
        esoccerEvents = esoccerEvents.filter((e: any) => {
          const leagueName = e.league?.name?.toLowerCase() || '';
          switch (ligaFiltro) {
            case Liga.VOLTA_6MIN:
              return leagueName.includes('volta') || leagueName.includes('6 min');
            case Liga.GT_8MIN:
              return leagueName.includes('8 min') && !leagueName.includes('12');
            case Liga.GT_12MIN:
              return leagueName.includes('12 min');
            case Liga.H2H:
              return leagueName.includes('h2h');
            default:
              return true;
          }
        });
      }

      const proximosJogos: ConfrontoAnalise[] = [];

      // Pegar pelo menos 6 jogos (ou todos disponíveis se menos de 6)
      const limit = Math.max(6, esoccerEvents.length);
      for (const event of esoccerEvents.slice(0, limit)) {
        const homeName = event.home?.name || '';
        const awayName = event.away?.name || '';
        
        if (!homeName || !awayName) continue;

        // Determinar liga
        let liga: Liga = Liga.GT_12MIN;
        const leagueName = event.league?.name?.toLowerCase() || '';
        if (leagueName.includes('volta') || leagueName.includes('6 min')) {
          liga = Liga.VOLTA_6MIN;
        } else if (leagueName.includes('8 min')) {
          liga = Liga.GT_8MIN;
        } else if (leagueName.includes('h2h')) {
          liga = Liga.H2H;
        }

        // Buscar jogadores do banco
        const jogador1 = await this.prisma.jogador.findFirst({
          where: { nome: { contains: homeName.split('(')[0].trim(), mode: 'insensitive' } }
        });
        const jogador2 = await this.prisma.jogador.findFirst({
          where: { nome: { contains: awayName.split('(')[0].trim(), mode: 'insensitive' } }
        });

        const j1Stats: JogadorRanking = jogador1 ? {
          id: jogador1.id,
          nome: homeName,
          liga,
          mediaGolsFT: jogador1.mediaGolsFT,
          mediaGolsHT: jogador1.mediaGolsHT,
          percentualOver: jogador1.percentualOver,
          percentual0x0: jogador1.percentual0x0,
        } : {
          id: 'temp_' + homeName,
          nome: homeName,
          liga,
          mediaGolsFT: 1.5,
          mediaGolsHT: 0.7,
          percentualOver: 50,
          percentual0x0: 5,
        };

        const j2Stats: JogadorRanking = jogador2 ? {
          id: jogador2.id,
          nome: awayName,
          liga,
          mediaGolsFT: jogador2.mediaGolsFT,
          mediaGolsHT: jogador2.mediaGolsHT,
          percentualOver: jogador2.percentualOver,
          percentual0x0: jogador2.percentual0x0,
        } : {
          id: 'temp_' + awayName,
          nome: awayName,
          liga,
          mediaGolsFT: 1.5,
          mediaGolsHT: 0.7,
          percentualOver: 50,
          percentual0x0: 5,
        };

        const confronto = this.analisarConfronto({
          id: event.id,
          jogador1: j1Stats,
          jogador2: j2Stats,
          liga,
          dataHora: new Date(parseInt(event.time) * 1000),
        });

        proximosJogos.push(confronto);
      }

      return proximosJogos;
    } catch (error) {
      this.logger.error('Erro ao buscar próximos jogos da API:', error);
      return [];
    }
  }

  async getJogadorPerfil(jogadorId: string, time?: string, horas?: number) {
    const jogador = await this.prisma.jogador.findUnique({
      where: { id: jogadorId },
    });

    if (!jogador) {
      throw new Error('Jogador não encontrado');
    }

    // Extrair nickname: "France (Bomb1to)" -> "Bomb1to"
    const nickMatch = jogador.nome.match(/\(([^)]+)\)/);
    const nickname = nickMatch ? nickMatch[1].trim() : jogador.nome;

    // Buscar jogadores com o mesmo nickname, filtrar por time se especificado
    let allPlayers = nickname
      ? await this.prisma.jogador.findMany({
          where: { nome: { contains: `(${nickname})` } },
        })
      : [jogador];

    // Se um time específico foi selecionado, filtrar só esse jogador+time
    if (time) {
      const filtered = allPlayers.filter(p => p.nome.startsWith(`${time} (`));
      if (filtered.length > 0) allPlayers = filtered;
    }

    const allPlayerIds = allPlayers.map(p => p.id);

    // Filtro de período (horas)
    const dataLimite = horas ? new Date(Date.now() - horas * 60 * 60 * 1000) : undefined;

    // Buscar todas as partidas do jogador (por nickname)
    const partidas = await this.prisma.partida.findMany({
      where: {
        OR: [
          { jogador1Id: { in: allPlayerIds } },
          { jogador2Id: { in: allPlayerIds } },
        ],
        status: StatusPartida.FINALIZADA,
        ...(dataLimite && { dataHora: { gte: dataLimite } }),
      },
      include: { jogador1: true, jogador2: true },
      orderBy: { dataHora: 'desc' },
      take: dataLimite ? 200 : 30,
    });

    // Calcular stats detalhadas
    let totalGolsFT = 0, totalGolsHT = 0, totalGolsSofridos = 0;
    let over15HT = 0, over05HT = 0, over25FT = 0, over35FT = 0, over15FT = 0;
    let cleanSheets = 0, goleadas = 0, zeroZero = 0;
    let vitorias = 0, derrotas = 0, empates = 0;
    const golsPorPartida: number[] = [];
    const golsHTporPartida: number[] = [];
    const placaresFT: Record<string, number> = {};
    const placaresHT: Record<string, number> = {};

    const ultimasPartidas = partidas.map(p => {
      const isHome = allPlayerIds.includes(p.jogador1Id);
      const golsProprios = isHome ? (p.golsFT1 || 0) : (p.golsFT2 || 0);
      const golsAdversario = isHome ? (p.golsFT2 || 0) : (p.golsFT1 || 0);
      const golsHTproprios = isHome ? (p.golsHT1 || 0) : (p.golsHT2 || 0);
      const golsHTadversario = isHome ? (p.golsHT2 || 0) : (p.golsHT1 || 0);
      const totalGols = (p.golsFT1 || 0) + (p.golsFT2 || 0);
      const totalGolsHT_ = (p.golsHT1 || 0) + (p.golsHT2 || 0);

      totalGolsFT += golsProprios;
      totalGolsHT += golsHTproprios;
      totalGolsSofridos += golsAdversario;
      golsPorPartida.push(totalGols);
      golsHTporPartida.push(totalGolsHT_);

      if (totalGolsHT_ > 0) over05HT++;
      if (totalGolsHT_ > 1) over15HT++;
      if (totalGols > 1) over15FT++;
      if (totalGols > 2) over25FT++;
      if (totalGols > 3) over35FT++;
      if (golsAdversario === 0) cleanSheets++;
      if (totalGols >= 5) goleadas++;
      if (totalGols === 0) zeroZero++;

      if (golsProprios > golsAdversario) vitorias++;
      else if (golsProprios < golsAdversario) derrotas++;
      else empates++;

      const placarFT = `${p.golsFT1 || 0}x${p.golsFT2 || 0}`;
      const placarHT = `${p.golsHT1 || 0}x${p.golsHT2 || 0}`;
      placaresFT[placarFT] = (placaresFT[placarFT] || 0) + 1;
      placaresHT[placarHT] = (placaresHT[placarHT] || 0) + 1;

      return {
        id: p.id,
        adversario: isHome ? p.jogador2.nome : p.jogador1.nome,
        placarHT: `${p.golsHT1 || 0}x${p.golsHT2 || 0}`,
        placarFT: `${p.golsFT1 || 0}x${p.golsFT2 || 0}`,
        totalGols,
        golsProprios,
        golsAdversario,
        resultado: golsProprios > golsAdversario ? 'V' : golsProprios < golsAdversario ? 'D' : 'E',
        data: p.dataHora.toISOString(),
        liga: p.liga,
      };
    });

    const total = partidas.length || 1;

    // Streak atual
    let streakAtual = 0;
    let streakTipo = '';
    if (ultimasPartidas.length > 0) {
      streakTipo = ultimasPartidas[0].resultado;
      for (const p of ultimasPartidas) {
        if (p.resultado === streakTipo) streakAtual++;
        else break;
      }
    }

    // Placares mais frequentes
    const topPlacaresFT = Object.entries(placaresFT)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([placar, count]) => ({ placar, count, pct: Math.round((count / total) * 100) }));

    const topPlacaresHT = Object.entries(placaresHT)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([placar, count]) => ({ placar, count, pct: Math.round((count / total) * 100) }));

    // Tendência (últimos 5 vs anteriores 5)
    const ultimos5 = golsPorPartida.slice(0, 5);
    const anteriores5 = golsPorPartida.slice(5, 10);
    const mediaUltimos5 = ultimos5.length > 0 ? ultimos5.reduce((a, b) => a + b, 0) / ultimos5.length : 0;
    const mediaAnteriores5 = anteriores5.length > 0 ? anteriores5.reduce((a, b) => a + b, 0) / anteriores5.length : 0;
    const tendencia = mediaUltimos5 > mediaAnteriores5 + 0.5 ? 'SUBINDO' : mediaUltimos5 < mediaAnteriores5 - 0.5 ? 'CAINDO' : 'ESTAVEL';

    // Times que joga
    const timesSet = new Set(allPlayers.map(p => {
      const teamMatch = p.nome.match(/^(.+?)\s*\(/);
      return teamMatch ? teamMatch[1].trim() : p.nome;
    }));

    // Stats do dia (partidas de hoje)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const partidasHoje = await this.prisma.partida.findMany({
      where: {
        OR: [
          { jogador1Id: { in: allPlayerIds } },
          { jogador2Id: { in: allPlayerIds } },
        ],
        dataHora: { gte: hoje, lt: amanha },
        status: StatusPartida.FINALIZADA,
      },
      include: { jogador1: true, jogador2: true },
      orderBy: { dataHora: 'desc' },
    });

    let diaGolsMarcados = 0, diaGolsSofridos = 0, diaVitorias = 0, diaDerrotas = 0, diaEmpates = 0;
    let diaOver25 = 0, diaCleanSheets = 0;
    const diaPartidas = partidasHoje.map(p => {
      const isHome = allPlayerIds.includes(p.jogador1Id);
      const golsProprios = isHome ? (p.golsFT1 || 0) : (p.golsFT2 || 0);
      const golsAdversario = isHome ? (p.golsFT2 || 0) : (p.golsFT1 || 0);
      const totalG = (p.golsFT1 || 0) + (p.golsFT2 || 0);

      diaGolsMarcados += golsProprios;
      diaGolsSofridos += golsAdversario;
      if (totalG > 2) diaOver25++;
      if (golsAdversario === 0) diaCleanSheets++;
      if (golsProprios > golsAdversario) diaVitorias++;
      else if (golsProprios < golsAdversario) diaDerrotas++;
      else diaEmpates++;

      return {
        adversario: isHome ? p.jogador2.nome : p.jogador1.nome,
        placarFT: `${p.golsFT1 || 0}x${p.golsFT2 || 0}`,
        golsProprios,
        golsAdversario,
        resultado: golsProprios > golsAdversario ? 'V' : golsProprios < golsAdversario ? 'D' : 'E',
      };
    });

    const totalHoje = partidasHoje.length || 1;
    const diaMediaMarcados = diaGolsMarcados / totalHoje;
    const diaMediaSofridos = diaGolsSofridos / totalHoje;

    // Comparar com média geral para determinar comportamento do dia
    const mediaGeralMarcados = partidas.length > 0 ? totalGolsFT / total : 0;
    const mediaGeralSofridos = partidas.length > 0 ? totalGolsSofridos / total : 0;

    let comportamentoDia: 'RETRANCANDO' | 'PAGANDO_GOL' | 'NORMAL' | 'EM_FORMA' | 'SEM_DADOS' = 'SEM_DADOS';
    if (partidasHoje.length > 0) {
      if (diaMediaMarcados > mediaGeralMarcados + 0.5 && diaMediaSofridos <= mediaGeralSofridos) {
        comportamentoDia = 'EM_FORMA';
      } else if (diaMediaSofridos > mediaGeralSofridos + 0.5) {
        comportamentoDia = 'PAGANDO_GOL';
      } else if (diaMediaMarcados < mediaGeralMarcados - 0.5 && diaMediaSofridos <= mediaGeralSofridos) {
        comportamentoDia = 'RETRANCANDO';
      } else {
        comportamentoDia = 'NORMAL';
      }
    }

    return {
      filtro: {
        horas: horas || null,
        time: time || null,
        periodo: horas ? `Últimas ${horas}h` : 'Geral',
      },
      jogador: {
        id: jogador.id,
        nome: jogador.nome,
        nickname,
        liga: jogador.liga,
        mediaGolsFT: jogador.mediaGolsFT,
        mediaGolsHT: jogador.mediaGolsHT,
        percentualOver: jogador.percentualOver,
        percentual0x0: jogador.percentual0x0,
        times: Array.from(timesSet),
      },
      stats: {
        totalPartidas: partidas.length,
        mediaGolsFT: partidas.length > 0 ? totalGolsFT / total : 0,
        mediaGolsHT: partidas.length > 0 ? totalGolsHT / total : 0,
        mediaGolsSofridos: partidas.length > 0 ? totalGolsSofridos / total : 0,
        vitorias,
        derrotas,
        empates,
        winRate: Math.round((vitorias / total) * 100),
        over05HT: Math.round((over05HT / total) * 100),
        over15HT: Math.round((over15HT / total) * 100),
        over15FT: Math.round((over15FT / total) * 100),
        over25FT: Math.round((over25FT / total) * 100),
        over35FT: Math.round((over35FT / total) * 100),
        cleanSheets: Math.round((cleanSheets / total) * 100),
        goleadas,
        zeroZero: Math.round((zeroZero / total) * 100),
      },
      tendencia,
      streakAtual,
      streakTipo,
      topPlacaresFT,
      topPlacaresHT,
      ultimasPartidas: ultimasPartidas.slice(0, 15),
      diaStats: {
        totalPartidas: partidasHoje.length,
        golsMarcados: diaGolsMarcados,
        golsSofridos: diaGolsSofridos,
        mediaMarcados: parseFloat(diaMediaMarcados.toFixed(1)),
        mediaSofridos: parseFloat(diaMediaSofridos.toFixed(1)),
        vitorias: diaVitorias,
        derrotas: diaDerrotas,
        empates: diaEmpates,
        over25: diaOver25,
        cleanSheets: diaCleanSheets,
        comportamento: comportamentoDia,
        partidas: diaPartidas,
      },
    };
  }
}
