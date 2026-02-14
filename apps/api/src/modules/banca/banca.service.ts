import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export enum TipoGestao {
  AGRESSIVA = 'AGRESSIVA',
  CONSERVADORA = 'CONSERVADORA',
  PERSONALIZADA = 'PERSONALIZADA',
}

@Injectable()
export class BancaService {
  constructor(private prisma: PrismaService) {}

  async getBancaAtiva(userId: string) {
    const banca = await this.prisma.banca.findFirst({
      where: { userId, ativa: true },
    });

    if (!banca) return null;

    const progressoHoje = await this.getProgressoHoje(userId, banca.id);
    const calculado = this.calcularMeta(banca.valor, banca.metaDiaria, banca.stake);

    return { ...banca, calculado, progressoHoje };
  }

  async criarOuAtualizar(userId: string, data: {
    nome?: string;
    valor: number;
    metaDiaria: number;
    tipoGestao: TipoGestao;
    divisor?: number;
  }) {
    await this.prisma.banca.updateMany({
      where: { userId, ativa: true },
      data: { ativa: false },
    });

    const divisor = this.getDivisor(data.tipoGestao, data.divisor);
    const stake = data.valor / divisor;

    const banca = await this.prisma.banca.create({
      data: {
        userId,
        nome: data.nome || 'Minha Banca',
        valor: data.valor,
        metaDiaria: data.metaDiaria,
        tipoGestao: data.tipoGestao,
        divisor: data.divisor,
        stake,
        ativa: true,
      },
    });

    return {
      ...banca,
      calculado: this.calcularMeta(banca.valor, banca.metaDiaria, stake),
    };
  }

  private getDivisor(tipoGestao: TipoGestao, divisorCustom?: number): number {
    switch (tipoGestao) {
      case TipoGestao.AGRESSIVA: return 10;
      case TipoGestao.CONSERVADORA: return 20;
      case TipoGestao.PERSONALIZADA: return divisorCustom || 15;
    }
  }

  private calcularMeta(valor: number, meta: number, stake: number) {
    let oddMinima = 1 + (meta / valor);
    // Limitar odd mínima entre 1.50 e 2.20
    oddMinima = Math.max(1.50, Math.min(2.20, oddMinima));
    const oddMaxima = 2.20;
    const entradasNecessarias = Math.ceil(meta / (stake * (oddMinima - 1)));
    const lucroEsperado = stake * (oddMinima - 1);

    return { entradasNecessarias, oddMinima: Number(oddMinima.toFixed(2)), oddMaxima, lucroEsperado };
  }

  private async getProgressoHoje(userId: string, bancaId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const entradas = await this.prisma.entrada.findMany({
      where: { userId, bancaId, createdAt: { gte: hoje } },
    });

    const greens = entradas.filter(e => e.resultado === 'GREEN').length;
    const reds = entradas.filter(e => e.resultado === 'RED').length;
    const lucro = entradas.reduce((acc, e) => acc + (e.lucro || 0), 0);

    return { entradas: entradas.length, greens, reds, lucro };
  }
}
