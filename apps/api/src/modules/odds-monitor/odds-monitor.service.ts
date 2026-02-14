import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Bet365Service } from '../betsapi/bet365.service';
import { Liga, StatusPartida, Prisma } from '@prisma/client';

export interface PartidaAoVivo {
  id: string;
  jogador1: string;
  jogador2: string;
  liga: Liga;
  placarHome: number;
  placarAway: number;
  minuto: number;
  status: string;
  odds: {
    over05HT?: number;
    over15HT?: number;
    over25HT?: number;
    over15FT?: number;
    over25FT?: number;
    over35FT?: number;
    over45FT?: number;
  };
  oddsHistory: {
    minuto: number;
    placar: string;
    over25HT?: number;
    over25FT?: number;
    linhaFechada?: string;
  }[];
}

export interface AnaliseManipulacao {
  partidaId: string;
  jogador1: string;
  jogador2: string;
  alertas: {
    tipo: 'LINHA_FECHOU_ANTES_GOL' | 'QUEDA_BRUSCA_ODD' | 'ODD_SUSPENSA' | 'PADRAO_SUSPEITO';
    descricao: string;
    minuto: number;
    evidencia: string;
  }[];
  risco: 'BAIXO' | 'MEDIO' | 'ALTO';
  recomendacao: string;
}

@Injectable()
export class OddsMonitorService {
  private readonly logger = new Logger(OddsMonitorService.name);

  constructor(
    private prisma: PrismaService,
    private bet365Service: Bet365Service,
  ) {}

  async getPartidasAoVivo(liga?: Liga): Promise<PartidaAoVivo[]> {
    const partidas = await this.prisma.partida.findMany({
      where: {
        status: StatusPartida.AO_VIVO,
        ...(liga && { liga }),
      },
      include: {
        jogador1: true,
        jogador2: true,
      },
      orderBy: { dataHora: 'desc' },
      take: 50,
    }) as any[];

    // Buscar snapshots separadamente
    const partidasComSnapshots = await Promise.all(
      partidas.map(async (p) => {
        const snapshots = await (this.prisma as any).oddsSnapshot.findMany({
          where: { partidaId: p.id },
          orderBy: { minuto: 'asc' },
          take: 20,
        });
        return { ...p, oddsSnapshots: snapshots };
      })
    );

    return partidasComSnapshots.map((p: any) => ({
      id: p.id,
      jogador1: p.jogador1.nome,
      jogador2: p.jogador2.nome,
      liga: p.liga,
      placarHome: p.golsFT1 || 0,
      placarAway: p.golsFT2 || 0,
      minuto: this.calcularMinuto(p.dataHora),
      status: p.status,
      odds: this.getLatestOdds(p.oddsSnapshots || []),
      oddsHistory: (p.oddsSnapshots || []).map((s: any) => ({
        minuto: s.minuto,
        placar: `${s.placarHome}x${s.placarAway}`,
        over25HT: s.over25HT || undefined,
        over25FT: s.over25FT || undefined,
        linhaFechada: s.linhaFechada || undefined,
      })),
    }));
  }

  async buscarPartida(jogador1Nome: string, jogador2Nome: string): Promise<PartidaAoVivo | null> {
    const partida = await this.prisma.partida.findFirst({
      where: {
        OR: [
          {
            jogador1: { nome: { contains: jogador1Nome, mode: 'insensitive' } },
            jogador2: { nome: { contains: jogador2Nome, mode: 'insensitive' } },
          },
          {
            jogador1: { nome: { contains: jogador2Nome, mode: 'insensitive' } },
            jogador2: { nome: { contains: jogador1Nome, mode: 'insensitive' } },
          },
        ],
        status: { in: [StatusPartida.AO_VIVO, StatusPartida.FINALIZADA] },
      },
      include: {
        jogador1: true,
        jogador2: true,
      },
      orderBy: { dataHora: 'desc' },
    }) as any;

    if (!partida) return null;

    const snapshots = await (this.prisma as any).oddsSnapshot.findMany({
      where: { partidaId: partida.id },
      orderBy: { minuto: 'asc' },
    });

    return {
      id: partida.id,
      jogador1: partida.jogador1.nome,
      jogador2: partida.jogador2.nome,
      liga: partida.liga,
      placarHome: partida.golsFT1 || 0,
      placarAway: partida.golsFT2 || 0,
      minuto: this.calcularMinuto(partida.dataHora),
      status: partida.status,
      odds: this.getLatestOdds(snapshots),
      oddsHistory: snapshots.map((s: any) => ({
        minuto: s.minuto,
        placar: `${s.placarHome}x${s.placarAway}`,
        over25HT: s.over25HT || undefined,
        over25FT: s.over25FT || undefined,
        linhaFechada: s.linhaFechada || undefined,
      })),
    };
  }

  async registrarOddsSnapshot(
    partidaId: string,
    minuto: number,
    placarHome: number,
    placarAway: number,
    odds: {
      over05HT?: number;
      over15HT?: number;
      over25HT?: number;
      over15FT?: number;
      over25FT?: number;
      over35FT?: number;
      over45FT?: number;
    },
    linhaFechada?: string,
  ) {
    return (this.prisma as any).oddsSnapshot.create({
      data: {
        partidaId,
        minuto,
        placarHome,
        placarAway,
        over05HT: odds.over05HT,
        over15HT: odds.over15HT,
        over25HT: odds.over25HT,
        over15FT: odds.over15FT,
        over25FT: odds.over25FT,
        over35FT: odds.over35FT,
        over45FT: odds.over45FT,
        linhaFechada,
      },
    });
  }

  async analisarManipulacao(partidaId: string): Promise<AnaliseManipulacao> {
    const partida = await this.prisma.partida.findUnique({
      where: { id: partidaId },
      include: {
        jogador1: true,
        jogador2: true,
      },
    }) as any;

    if (!partida) {
      throw new Error('Partida não encontrada');
    }

    const snapshots = await (this.prisma as any).oddsSnapshot.findMany({
      where: { partidaId },
      orderBy: { minuto: 'asc' },
    });

    const alertas: AnaliseManipulacao['alertas'] = [];

    // Analisar padrões de manipulação
    for (let i = 1; i < snapshots.length; i++) {
      const anterior = snapshots[i - 1];
      const atual = snapshots[i];

      // Detectar queda brusca de odd (>30% em 1 minuto)
      if (anterior.over25FT && atual.over25FT) {
        const queda = ((anterior.over25FT - atual.over25FT) / anterior.over25FT) * 100;
        if (queda > 30) {
          alertas.push({
            tipo: 'QUEDA_BRUSCA_ODD',
            descricao: `Odd Over 2.5 FT caiu ${queda.toFixed(0)}% em 1 minuto`,
            minuto: atual.minuto,
            evidencia: `${anterior.over25FT.toFixed(2)} → ${atual.over25FT.toFixed(2)}`,
          });
        }
      }

      // Detectar linha que fechou antes de gol
      if (atual.linhaFechada && !anterior.linhaFechada) {
        const golsAntes = anterior.placarHome + anterior.placarAway;
        const golsDepois = atual.placarHome + atual.placarAway;
        
        if (golsDepois > golsAntes) {
          alertas.push({
            tipo: 'LINHA_FECHOU_ANTES_GOL',
            descricao: `Linha ${atual.linhaFechada} fechou e logo depois saiu gol`,
            minuto: atual.minuto,
            evidencia: `Placar mudou de ${anterior.placarHome}x${anterior.placarAway} para ${atual.placarHome}x${atual.placarAway}`,
          });
        }
      }

      // Detectar odd suspensa (null após ter valor)
      if (anterior.over25FT && !atual.over25FT) {
        alertas.push({
          tipo: 'ODD_SUSPENSA',
          descricao: 'Odd Over 2.5 FT foi suspensa',
          minuto: atual.minuto,
          evidencia: `Odd era ${anterior.over25FT.toFixed(2)} e foi removida`,
        });
      }
    }

    // Detectar padrão suspeito: muitos gols em poucos minutos
    const totalGols = (partida.golsFT1 || 0) + (partida.golsFT2 || 0);
    const minutoAtual = this.calcularMinuto(partida.dataHora);
    if (totalGols >= 4 && minutoAtual <= 20) {
      alertas.push({
        tipo: 'PADRAO_SUSPEITO',
        descricao: 'Muitos gols em pouco tempo',
        minuto: minutoAtual,
        evidencia: `${totalGols} gols em ${minutoAtual} minutos`,
      });
    }

    // Determinar nível de risco
    let risco: 'BAIXO' | 'MEDIO' | 'ALTO' = 'BAIXO';
    if (alertas.length >= 3) risco = 'ALTO';
    else if (alertas.length >= 1) risco = 'MEDIO';

    // Gerar recomendação
    let recomendacao = 'Partida parece normal. Pode operar.';
    if (risco === 'MEDIO') {
      recomendacao = 'Alguns padrões suspeitos detectados. Opere com cautela.';
    } else if (risco === 'ALTO') {
      recomendacao = 'Alto risco de manipulação. Recomendado NÃO operar nesta partida.';
    }

    return {
      partidaId: partida.id,
      jogador1: partida.jogador1.nome,
      jogador2: partida.jogador2.nome,
      alertas,
      risco,
      recomendacao,
    };
  }

  async getHistoricoConfronto(jogador1Nome: string, jogador2Nome: string): Promise<{
    partidas: {
      id: string;
      data: Date;
      placarFT: string;
      placarHT: string;
      liga: Liga;
      totalGols: number;
      over25: boolean;
    }[];
    estatisticas: {
      totalPartidas: number;
      mediaGols: number;
      percentualOver25: number;
      percentual0x0: number;
    };
  }> {
    const partidas = await this.prisma.partida.findMany({
      where: {
        OR: [
          {
            jogador1: { nome: { contains: jogador1Nome, mode: 'insensitive' } },
            jogador2: { nome: { contains: jogador2Nome, mode: 'insensitive' } },
          },
          {
            jogador1: { nome: { contains: jogador2Nome, mode: 'insensitive' } },
            jogador2: { nome: { contains: jogador1Nome, mode: 'insensitive' } },
          },
        ],
        status: StatusPartida.FINALIZADA,
      },
      include: {
        jogador1: true,
        jogador2: true,
      },
      orderBy: { dataHora: 'desc' },
      take: 20,
    });

    const partidasFormatadas = partidas.map(p => {
      const totalGols = (p.golsFT1 || 0) + (p.golsFT2 || 0);
      return {
        id: p.id,
        data: p.dataHora,
        placarFT: `${p.golsFT1 || 0}x${p.golsFT2 || 0}`,
        placarHT: `${p.golsHT1 || 0}x${p.golsHT2 || 0}`,
        liga: p.liga,
        totalGols,
        over25: totalGols >= 3,
      };
    });

    const totalPartidas = partidasFormatadas.length;
    const totalGols = partidasFormatadas.reduce((sum, p) => sum + p.totalGols, 0);
    const over25Count = partidasFormatadas.filter(p => p.over25).length;
    const zeroZeroCount = partidasFormatadas.filter(p => p.totalGols === 0).length;

    return {
      partidas: partidasFormatadas,
      estatisticas: {
        totalPartidas,
        mediaGols: totalPartidas > 0 ? totalGols / totalPartidas : 0,
        percentualOver25: totalPartidas > 0 ? (over25Count / totalPartidas) * 100 : 0,
        percentual0x0: totalPartidas > 0 ? (zeroZeroCount / totalPartidas) * 100 : 0,
      },
    };
  }

  private calcularMinuto(dataHora: Date): number {
    const agora = new Date();
    const diff = agora.getTime() - dataHora.getTime();
    return Math.floor(diff / 60000);
  }

  private getLatestOdds(snapshots: any[]): PartidaAoVivo['odds'] {
    if (snapshots.length === 0) return {};
    const latest = snapshots[snapshots.length - 1];
    return {
      over05HT: latest.over05HT || undefined,
      over15HT: latest.over15HT || undefined,
      over25HT: latest.over25HT || undefined,
      over15FT: latest.over15FT || undefined,
      over25FT: latest.over25FT || undefined,
      over35FT: latest.over35FT || undefined,
      over45FT: latest.over45FT || undefined,
    };
  }
}
