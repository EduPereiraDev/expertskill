import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RadarService } from '../radar/radar.service';
import { NivelConfianca, StatusEntrada, ResultadoEntrada } from '@prisma/client';

export interface EntradaExpert {
  id: string;
  partida: {
    id: string;
    jogador1: string;
    jogador2: string;
    liga: string;
    dataHora: Date;
  };
  mercado: string;
  odd: number;
  stake: number;
  confianca: NivelConfianca;
  analiseIA: string;
  status: StatusEntrada;
  resultado?: ResultadoEntrada;
  lucro?: number;
}

export interface CreateEntradaDto {
  partidaId: string;
  mercado: string;
  odd: number;
}

export interface CreateEntradaManualDto {
  data: string;
  horario: string;
  liga: string;
  mercado: string;
  jogador1: string;
  jogador2: string;
  valor: number;
  odd: number;
  status: string;
}

export interface FinalizarEntradaDto {
  resultado: ResultadoEntrada;
}

export interface UpdateEntradaDto {
  mercado?: string;
  odd?: number;
  stake?: number;
  resultado?: ResultadoEntrada;
  analiseIA?: string;
}

@Injectable()
export class EntradasService {
  constructor(
    private prisma: PrismaService,
    private radarService: RadarService,
  ) {}

  async gerarEntradasExpert(userId: string): Promise<EntradaExpert[]> {
    // Buscar banca ativa do usuário
    const banca = await this.prisma.banca.findFirst({
      where: { userId, ativa: true },
    });

    if (!banca) {
      throw new BadRequestException('Configure sua banca antes de receber entradas');
    }

    // Buscar partidas classificadas como OPERAR
    const partidas = await this.radarService.getPartidas();
    const partidasOperar = partidas.filter(p => p.classificacao === 'OPERAR').slice(0, 5);

    // Gerar entradas baseadas nas partidas
    const entradas: EntradaExpert[] = partidasOperar.map(partida => {
      const mercado = this.gerarMercado(partida.indicadores.mediaTotal);
      const odd = this.calcularOdd(partida.indicadores.probabilidadeOver25);
      const confianca = this.calcularConfianca(partida.indicadores);
      const analise = this.gerarAnaliseIA(partida, mercado);

      return {
        id: partida.id,
        partida: {
          id: partida.id,
          jogador1: partida.jogador1.nome,
          jogador2: partida.jogador2.nome,
          liga: partida.liga,
          dataHora: partida.dataHora,
        },
        mercado,
        odd,
        stake: banca.stake,
        confianca,
        analiseIA: analise,
        status: StatusEntrada.PENDENTE,
      };
    });

    return entradas;
  }

  async getEntradasHoje(userId: string): Promise<any[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    return this.prisma.entrada.findMany({
      where: {
        userId,
        createdAt: {
          gte: hoje,
          lt: amanha,
        },
      },
      include: {
        partida: {
          include: {
            jogador1: true,
            jogador2: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async criarEntrada(userId: string, dto: CreateEntradaDto): Promise<any> {
    const banca = await this.prisma.banca.findFirst({
      where: { userId, ativa: true },
    });

    if (!banca) {
      throw new BadRequestException('Configure sua banca antes de criar entradas');
    }

    const partida = await this.prisma.partida.findUnique({
      where: { id: dto.partidaId },
      include: { jogador1: true, jogador2: true },
    });

    if (!partida) {
      throw new BadRequestException('Partida não encontrada');
    }

    // Calcular confiança baseada nos indicadores
    const mediaTotal = partida.jogador1.mediaGolsFT + partida.jogador2.mediaGolsFT;
    const overMedio = (partida.jogador1.percentualOver + partida.jogador2.percentualOver) / 2;
    const confianca = this.calcularConfiancaSimples(mediaTotal, overMedio);

    return this.prisma.entrada.create({
      data: {
        userId,
        bancaId: banca.id,
        partidaId: dto.partidaId,
        mercado: dto.mercado,
        odd: dto.odd,
        stake: banca.stake,
        confianca,
        analiseIA: `Entrada em ${partida.jogador1.nome} vs ${partida.jogador2.nome}. Média total: ${mediaTotal.toFixed(1)} gols.`,
        status: StatusEntrada.CONFIRMADA,
      },
      include: {
        partida: {
          include: { jogador1: true, jogador2: true },
        },
      },
    });
  }

  async criarEntradaManual(userId: string, dto: CreateEntradaManualDto): Promise<any> {
    const banca = await this.prisma.banca.findFirst({
      where: { userId, ativa: true },
    });

    if (!banca) {
      throw new BadRequestException('Configure sua banca antes de criar entradas');
    }

    // Mapear status para resultado
    let resultado: ResultadoEntrada | null = null;
    let status: StatusEntrada = StatusEntrada.CONFIRMADA;
    let lucro = 0;

    if (dto.status === 'GREEN') {
      resultado = ResultadoEntrada.GREEN;
      status = StatusEntrada.FINALIZADA;
      lucro = dto.valor * (dto.odd - 1);
    } else if (dto.status === 'RED') {
      resultado = ResultadoEntrada.RED;
      status = StatusEntrada.FINALIZADA;
      lucro = -dto.valor;
    } else if (dto.status === 'REEMBOLSO') {
      resultado = ResultadoEntrada.REEMBOLSO;
      status = StatusEntrada.FINALIZADA;
      lucro = 0;
    }
    // MEIO_GREEN e MEIO_RED tratados como GREEN/RED parcial
    else if (dto.status === 'MEIO_GREEN') {
      resultado = ResultadoEntrada.GREEN;
      status = StatusEntrada.FINALIZADA;
      lucro = dto.valor * (dto.odd - 1) * 0.5;
    } else if (dto.status === 'MEIO_RED') {
      resultado = ResultadoEntrada.RED;
      status = StatusEntrada.FINALIZADA;
      lucro = -dto.valor * 0.5;
    }

    // Criar entrada manual (sem partida vinculada)
    return this.prisma.entrada.create({
      data: {
        userId,
        bancaId: banca.id,
        mercado: dto.mercado,
        odd: dto.odd,
        stake: dto.valor,
        confianca: NivelConfianca.MEDIA,
        analiseIA: `Entrada manual: ${dto.jogador1} vs ${dto.jogador2} - ${dto.liga}`,
        status,
        resultado,
        lucro,
      },
    });
  }

  async finalizarEntrada(userId: string, entradaId: string, dto: FinalizarEntradaDto): Promise<any> {
    const entrada = await this.prisma.entrada.findFirst({
      where: { id: entradaId, userId },
    });

    if (!entrada) {
      throw new BadRequestException('Entrada não encontrada');
    }

    let lucro = 0;
    if (dto.resultado === ResultadoEntrada.GREEN) {
      lucro = entrada.stake * (entrada.odd - 1);
    } else if (dto.resultado === ResultadoEntrada.RED) {
      lucro = -entrada.stake;
    }

    return this.prisma.entrada.update({
      where: { id: entradaId },
      data: {
        resultado: dto.resultado,
        lucro,
        status: StatusEntrada.FINALIZADA,
      },
      include: {
        partida: {
          include: { jogador1: true, jogador2: true },
        },
      },
    });
  }

  async getEstatisticasHoje(userId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const entradas = await this.prisma.entrada.findMany({
      where: {
        userId,
        createdAt: { gte: hoje, lt: amanha },
        status: StatusEntrada.FINALIZADA,
      },
    });

    const greens = entradas.filter(e => e.resultado === ResultadoEntrada.GREEN).length;
    const reds = entradas.filter(e => e.resultado === ResultadoEntrada.RED).length;
    const lucroTotal = entradas.reduce((acc, e) => acc + (e.lucro || 0), 0);

    return {
      total: entradas.length,
      greens,
      reds,
      lucroTotal,
      taxaAcerto: entradas.length > 0 ? (greens / entradas.length) * 100 : 0,
    };
  }

  async getHistorico(
    userId: string,
    filtros?: { dataInicio?: string; dataFim?: string; resultado?: ResultadoEntrada },
  ) {
    const where: any = { userId, status: StatusEntrada.FINALIZADA };

    if (filtros?.dataInicio) {
      where.createdAt = { ...where.createdAt, gte: new Date(filtros.dataInicio) };
    }
    if (filtros?.dataFim) {
      const dataFim = new Date(filtros.dataFim);
      dataFim.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: dataFim };
    }
    if (filtros?.resultado) {
      where.resultado = filtros.resultado;
    }

    const entradas = await this.prisma.entrada.findMany({
      where,
      include: {
        partida: {
          include: { jogador1: true, jogador2: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return entradas;
  }

  async getEstatisticasGerais(userId: string) {
    const entradas = await this.prisma.entrada.findMany({
      where: { userId, status: StatusEntrada.FINALIZADA },
    });

    const greens = entradas.filter(e => e.resultado === ResultadoEntrada.GREEN).length;
    const reds = entradas.filter(e => e.resultado === ResultadoEntrada.RED).length;
    const lucroTotal = entradas.reduce((acc, e) => acc + (e.lucro || 0), 0);
    const stakeTotal = entradas.reduce((acc, e) => acc + e.stake, 0);

    // Calcular sequências
    let maiorSequenciaGreens = 0;
    let maiorSequenciaReds = 0;
    let sequenciaAtualGreens = 0;
    let sequenciaAtualReds = 0;

    entradas.forEach(e => {
      if (e.resultado === ResultadoEntrada.GREEN) {
        sequenciaAtualGreens++;
        sequenciaAtualReds = 0;
        if (sequenciaAtualGreens > maiorSequenciaGreens) {
          maiorSequenciaGreens = sequenciaAtualGreens;
        }
      } else if (e.resultado === ResultadoEntrada.RED) {
        sequenciaAtualReds++;
        sequenciaAtualGreens = 0;
        if (sequenciaAtualReds > maiorSequenciaReds) {
          maiorSequenciaReds = sequenciaAtualReds;
        }
      }
    });

    return {
      total: entradas.length,
      greens,
      reds,
      lucroTotal,
      stakeTotal,
      roi: stakeTotal > 0 ? (lucroTotal / stakeTotal) * 100 : 0,
      taxaAcerto: entradas.length > 0 ? (greens / entradas.length) * 100 : 0,
      maiorSequenciaGreens,
      maiorSequenciaReds,
    };
  }

  async deletarEntrada(userId: string, entradaId: string): Promise<void> {
    const entrada = await this.prisma.entrada.findFirst({
      where: { id: entradaId, userId },
    });

    if (!entrada) {
      throw new BadRequestException('Entrada não encontrada');
    }

    await this.prisma.entrada.delete({
      where: { id: entradaId },
    });
  }

  async atualizarEntrada(userId: string, entradaId: string, dto: UpdateEntradaDto): Promise<any> {
    const entrada = await this.prisma.entrada.findFirst({
      where: { id: entradaId, userId },
    });

    if (!entrada) {
      throw new BadRequestException('Entrada não encontrada');
    }

    // Recalcular lucro se resultado ou stake/odd mudaram
    let lucro = entrada.lucro;
    const novoStake = dto.stake ?? entrada.stake;
    const novaOdd = dto.odd ?? entrada.odd;
    const novoResultado = dto.resultado ?? entrada.resultado;

    if (novoResultado) {
      if (novoResultado === ResultadoEntrada.GREEN) {
        lucro = novoStake * (novaOdd - 1);
      } else if (novoResultado === ResultadoEntrada.RED) {
        lucro = -novoStake;
      } else {
        lucro = 0;
      }
    }

    return this.prisma.entrada.update({
      where: { id: entradaId },
      data: {
        ...(dto.mercado && { mercado: dto.mercado }),
        ...(dto.odd && { odd: dto.odd }),
        ...(dto.stake && { stake: dto.stake }),
        ...(dto.analiseIA && { analiseIA: dto.analiseIA }),
        ...(dto.resultado && { resultado: dto.resultado, status: StatusEntrada.FINALIZADA }),
        lucro,
      },
      include: {
        partida: {
          include: { jogador1: true, jogador2: true },
        },
      },
    });
  }

  // Dashboard: Últimas 5 entradas resolvidas
  async getUltimasEntradas(userId: string, limit = 5) {
    const entradas = await this.prisma.entrada.findMany({
      where: { 
        userId, 
        status: StatusEntrada.FINALIZADA,
        resultado: { not: null }
      },
      include: {
        partida: {
          include: { jogador1: true, jogador2: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return entradas.map(e => ({
      id: e.id,
      jogador1: e.partida?.jogador1?.nome || 'Manual',
      jogador2: e.partida?.jogador2?.nome || '',
      mercado: e.mercado,
      odd: e.odd,
      stake: e.stake,
      resultado: e.resultado,
      lucro: e.lucro || 0,
      data: e.updatedAt,
    }));
  }

  // Dashboard: Heatmap de horários com mais greens
  async getHeatmapHorarios(userId: string) {
    const entradas = await this.prisma.entrada.findMany({
      where: { 
        userId, 
        status: StatusEntrada.FINALIZADA,
        resultado: { not: null }
      },
      select: {
        resultado: true,
        createdAt: true,
      },
    });

    // Agrupar por hora (0-23)
    const horarios: Record<number, { greens: number; reds: number; total: number }> = {};
    for (let i = 0; i < 24; i++) {
      horarios[i] = { greens: 0, reds: 0, total: 0 };
    }

    entradas.forEach(e => {
      const hora = new Date(e.createdAt).getHours();
      horarios[hora].total++;
      if (e.resultado === ResultadoEntrada.GREEN) {
        horarios[hora].greens++;
      } else if (e.resultado === ResultadoEntrada.RED) {
        horarios[hora].reds++;
      }
    });

    // Encontrar melhor horário
    let melhorHorario = { inicio: 0, fim: 0, taxaAcerto: 0 };
    for (let i = 0; i < 24; i++) {
      const h = horarios[i];
      if (h.total >= 1) {
        const taxa = (h.greens / h.total) * 100;
        if (taxa > melhorHorario.taxaAcerto) {
          melhorHorario = { inicio: i, fim: i + 2, taxaAcerto: taxa };
        }
      }
    }

    return {
      horarios: Object.entries(horarios).map(([hora, stats]) => ({
        hora: parseInt(hora),
        ...stats,
        taxaAcerto: stats.total > 0 ? (stats.greens / stats.total) * 100 : 0,
      })),
      melhorHorario,
    };
  }

  // Dashboard: Evolução da banca (últimos 7 ou 30 dias)
  async getEvolucaoBanca(userId: string, dias = 7) {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);
    dataInicio.setHours(0, 0, 0, 0);

    const entradas = await this.prisma.entrada.findMany({
      where: {
        userId,
        status: StatusEntrada.FINALIZADA,
        resultado: { not: null },
        updatedAt: { gte: dataInicio },
      },
      select: {
        lucro: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'asc' },
    });

    // Agrupar por dia
    const evolucao: Record<string, number> = {};
    let acumulado = 0;

    // Inicializar todos os dias com 0
    for (let i = 0; i < dias; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (dias - 1 - i));
      const key = d.toISOString().split('T')[0];
      evolucao[key] = 0;
    }

    // Somar lucros por dia
    entradas.forEach(e => {
      const key = new Date(e.updatedAt).toISOString().split('T')[0];
      if (evolucao[key] !== undefined) {
        evolucao[key] += e.lucro || 0;
      }
    });

    // Converter para array com acumulado
    const resultado = Object.entries(evolucao).map(([data, lucro]) => {
      acumulado += lucro;
      return { data, lucro, acumulado };
    });

    return resultado;
  }

  private gerarMercado(mediaTotal: number): string {
    // Mercado baseado na média real de gols dos jogadores
    if (mediaTotal >= 7) return 'Over 3.5 FT';
    if (mediaTotal >= 5.5) return 'Over 2.5 FT';
    if (mediaTotal >= 4) return 'Over 1.5 FT';
    return 'Over 0.5 HT';
  }

  private calcularOdd(_probabilidade: number): number {
    // Retorna null/0 - odds devem vir da API Bet365, não calculadas
    // O frontend deve buscar odds reais via /api/bet365/prematch/:fi
    return 0;
  }

  private calcularConfianca(indicadores: { mediaTotal: number; overMedio: number; probabilidadeOver25: number }): NivelConfianca {
    const score = (indicadores.mediaTotal / 8) * 30 + 
                  (indicadores.overMedio / 100) * 35 + 
                  (indicadores.probabilidadeOver25 / 100) * 35;
    
    if (score >= 80) return NivelConfianca.ALTA;
    if (score >= 60) return NivelConfianca.MEDIA;
    return NivelConfianca.BAIXA;
  }

  private calcularConfiancaSimples(mediaTotal: number, overMedio: number): NivelConfianca {
    if (mediaTotal >= 6 && overMedio >= 75) return NivelConfianca.ALTA;
    if (mediaTotal >= 4 && overMedio >= 55) return NivelConfianca.MEDIA;
    return NivelConfianca.BAIXA;
  }

  private gerarAnaliseIA(partida: any, mercado: string): string {
    const { jogador1, jogador2, indicadores } = partida;
    
    return `🤖 **Análise Expert**\n\n` +
      `📊 **${jogador1.nome}** média ${jogador1.mediaGolsFT.toFixed(1)} gols/jogo (${jogador1.percentualOver}% over)\n` +
      `📊 **${jogador2.nome}** média ${jogador2.mediaGolsFT.toFixed(1)} gols/jogo (${jogador2.percentualOver}% over)\n\n` +
      `🎯 **Mercado:** ${mercado}\n` +
      `📈 **Probabilidade:** ${indicadores.probabilidadeOver25}%\n` +
      `⚡ **Média combinada:** ${indicadores.mediaTotal.toFixed(1)} gols`;
  }
}
