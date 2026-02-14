import { Controller, Get, Post, Query, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnaliseService, AnaliseAoVivoDto } from './analise.service';
import { Liga } from '@prisma/client';

@Controller('analise')
@UseGuards(JwtAuthGuard)
export class AnaliseController {
  constructor(private readonly analiseService: AnaliseService) {}

  @Get('diaria')
  getAnaliseDiaria(
    @Query('data') data?: string,
    @Query('liga') liga?: Liga,
    @Query('horas') horas?: string,
  ) {
    const dataAnalise = data ? new Date(data) : undefined;
    const horasNum = horas ? parseInt(horas, 10) : undefined;
    return this.analiseService.getAnaliseDiaria(dataAnalise, liga, horasNum);
  }

  @Get('ranking')
  getRankingJogadores(
    @Query('liga') liga?: Liga,
    @Query('limite') limite?: string,
  ) {
    return this.analiseService.getRankingJogadores(
      liga,
      limite ? parseInt(limite, 10) : 20,
    );
  }

  @Get('confrontos')
  getConfrontosHoje(@Query('liga') liga?: Liga) {
    return this.analiseService.getConfrontosHoje(liga);
  }

  @Post('ao-vivo')
  analisarAoVivo(@Body() dto: AnaliseAoVivoDto) {
    return this.analiseService.analisarAoVivo(dto);
  }

  @Get('jogadores')
  getJogadores(@Query('liga') liga?: Liga) {
    return this.analiseService.getJogadoresParaSelecao(liga);
  }

  @Get('nicknames')
  getNicknames(@Query('liga') liga?: Liga) {
    return this.analiseService.getNicknamesComTimes(liga);
  }

  @Get('jogador/:id')
  getJogadorPerfil(@Param('id') id: string, @Query('time') time?: string, @Query('horas') horas?: string) {
    return this.analiseService.getJogadorPerfil(id, time, horas ? parseInt(horas) : undefined);
  }
}
