import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { EntradasService, CreateEntradaDto, CreateEntradaManualDto, FinalizarEntradaDto, UpdateEntradaDto } from './entradas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('entradas')
@UseGuards(JwtAuthGuard)
export class EntradasController {
  constructor(private entradasService: EntradasService) {}

  @Get('expert')
  gerarEntradasExpert(@Request() req: any) {
    return this.entradasService.gerarEntradasExpert(req.user.userId);
  }

  @Get()
  getEntradasHoje(@Request() req: any) {
    return this.entradasService.getEntradasHoje(req.user.userId);
  }

  @Get('estatisticas')
  getEstatisticasHoje(@Request() req: any) {
    return this.entradasService.getEstatisticasHoje(req.user.userId);
  }

  @Post()
  criarEntrada(@Request() req: any, @Body() dto: CreateEntradaDto) {
    return this.entradasService.criarEntrada(req.user.userId, dto);
  }

  @Post('manual')
  criarEntradaManual(@Request() req: any, @Body() dto: CreateEntradaManualDto) {
    return this.entradasService.criarEntradaManual(req.user.userId, dto);
  }

  @Patch(':id/finalizar')
  finalizarEntrada(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: FinalizarEntradaDto,
  ) {
    return this.entradasService.finalizarEntrada(req.user.userId, id, dto);
  }

  @Get('historico')
  getHistorico(
    @Request() req: any,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('resultado') resultado?: string,
  ) {
    return this.entradasService.getHistorico(req.user.userId, {
      dataInicio,
      dataFim,
      resultado: resultado as any,
    });
  }

  @Get('estatisticas-gerais')
  getEstatisticasGerais(@Request() req: any) {
    return this.entradasService.getEstatisticasGerais(req.user.userId);
  }

  @Get('dashboard/ultimas')
  getUltimasEntradas(@Request() req: any, @Query('limit') limit?: string) {
    return this.entradasService.getUltimasEntradas(req.user.userId, limit ? parseInt(limit) : 5);
  }

  @Get('dashboard/heatmap')
  getHeatmapHorarios(@Request() req: any) {
    return this.entradasService.getHeatmapHorarios(req.user.userId);
  }

  @Get('dashboard/evolucao')
  getEvolucaoBanca(@Request() req: any, @Query('dias') dias?: string) {
    return this.entradasService.getEvolucaoBanca(req.user.userId, dias ? parseInt(dias) : 7);
  }

  @Get('dashboard/summary')
  async getDashboardSummary(@Request() req: any) {
    const userId = req.user.userId;
    const [estatisticas, ultimas, heatmap, evolucao] = await Promise.all([
      this.entradasService.getEstatisticasGerais(userId),
      this.entradasService.getUltimasEntradas(userId, 5),
      this.entradasService.getHeatmapHorarios(userId),
      this.entradasService.getEvolucaoBanca(userId, 7),
    ]);
    return { estatisticas, ultimas, heatmap, evolucao };
  }

  @Delete(':id')
  deletarEntrada(@Request() req: any, @Param('id') id: string) {
    return this.entradasService.deletarEntrada(req.user.userId, id);
  }

  @Patch(':id')
  atualizarEntrada(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateEntradaDto,
  ) {
    return this.entradasService.atualizarEntrada(req.user.userId, id, dto);
  }
}
