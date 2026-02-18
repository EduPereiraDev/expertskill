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

  @Get('jogador/busca')
  buscarJogador(@Query('nome') nome: string) {
    if (!nome || nome.length < 2) return [];
    return this.radarService.buscarJogador(nome);
  }

  @Get('analise/:id')
  getAnaliseDetalhada(@Param('id') partidaId: string) {
    return this.radarService.getAnaliseDetalhada(partidaId);
  }
}
