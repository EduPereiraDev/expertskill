import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OddsMonitorService } from './odds-monitor.service';
import { Liga } from '@prisma/client';

@Controller('odds-monitor')
@UseGuards(JwtAuthGuard)
export class OddsMonitorController {
  constructor(private readonly oddsMonitorService: OddsMonitorService) {}

  @Get('ao-vivo')
  getPartidasAoVivo(@Query('liga') liga?: Liga) {
    return this.oddsMonitorService.getPartidasAoVivo(liga);
  }

  @Get('buscar')
  buscarPartida(
    @Query('jogador1') jogador1: string,
    @Query('jogador2') jogador2: string,
  ) {
    return this.oddsMonitorService.buscarPartida(jogador1, jogador2);
  }

  @Get('historico')
  getHistoricoConfronto(
    @Query('jogador1') jogador1: string,
    @Query('jogador2') jogador2: string,
  ) {
    return this.oddsMonitorService.getHistoricoConfronto(jogador1, jogador2);
  }

  @Get('analise/:id')
  analisarManipulacao(@Param('id') partidaId: string) {
    return this.oddsMonitorService.analisarManipulacao(partidaId);
  }

  @Post('snapshot')
  registrarSnapshot(
    @Body() body: {
      partidaId: string;
      minuto: number;
      placarHome: number;
      placarAway: number;
      odds: {
        over05HT?: number;
        over15HT?: number;
        over25HT?: number;
        over15FT?: number;
        over25FT?: number;
        over35FT?: number;
        over45FT?: number;
      };
      linhaFechada?: string;
    },
  ) {
    return this.oddsMonitorService.registrarOddsSnapshot(
      body.partidaId,
      body.minuto,
      body.placarHome,
      body.placarAway,
      body.odds,
      body.linhaFechada,
    );
  }
}
