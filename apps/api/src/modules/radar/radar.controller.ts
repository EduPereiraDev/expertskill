import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RadarService } from './radar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Liga, StatusPartida } from '@prisma/client';

@Controller('radar')
@UseGuards(JwtAuthGuard)
export class RadarController {
  constructor(private radarService: RadarService) {}

  @Get()
  getPartidas(
    @Query('liga') liga?: Liga,
    @Query('status') status?: StatusPartida,
  ) {
    return this.radarService.getPartidas(liga, status);
  }

  @Get('proximas')
  getProximasPartidas(@Query('liga') liga?: Liga) {
    return this.radarService.getProximasPartidas(liga);
  }

  @Get('ao-vivo')
  getPartidasAoVivo() {
    return this.radarService.getPartidasAoVivo();
  }

  @Get('linhas')
  getRadarLinhas(@Query('liga') liga?: Liga) {
    return this.radarService.getRadarLinhas(liga);
  }

  @Get('jogador/busca')
  buscarJogador(@Query('nome') nome: string) {
    if (!nome || nome.length < 2) return [];
    return this.radarService.buscarJogador(nome);
  }

  @Get('analise/:id')
  getAnaliseDetalhada(
    @Param('id') partidaId: string,
    @Query('contexto') contexto?: 'DIARIO' | 'HISTORICO',
  ) {
    return this.radarService.getAnaliseDetalhada(partidaId, contexto || 'HISTORICO');
  }

  @Get('ultimos-resultados')
  getUltimosResultados(@Query('limite') limite?: string) {
    return this.radarService.getUltimosResultados(limite ? parseInt(limite) : 20);
  }

  @Get('ranking')
  getRankingJogadores(@Query('limite') limite?: string) {
    return this.radarService.getRankingJogadores(limite ? parseInt(limite) : 20);
  }

  @Get('stats-gerais')
  getStatsGerais() {
    return this.radarService.getStatsGerais();
  }

  @Get('confronto')
  getConfrontoDireto(
    @Query('jogador1') jogador1: string,
    @Query('jogador2') jogador2: string,
  ) {
    if (!jogador1 || !jogador2) return { encontrado: false };
    return this.radarService.getConfrontoDireto(jogador1, jogador2);
  }

  @Get('jogador/:id')
  getJogadorCompleto(@Param('id') jogadorId: string) {
    return this.radarService.getJogadorCompleto(jogadorId);
  }
}
