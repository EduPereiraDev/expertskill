import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BancaService, TipoGestao } from './banca.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('banca')
@UseGuards(JwtAuthGuard)
export class BancaController {
  constructor(private bancaService: BancaService) {}

  @Get()
  getBanca(@Request() req: any) {
    return this.bancaService.getBancaAtiva(req.user.userId);
  }

  @Post()
  criarBanca(
    @Request() req: any,
    @Body() body: { valor: number; metaDiaria: number; tipoGestao: TipoGestao; divisor?: number },
  ) {
    return this.bancaService.criarOuAtualizar(req.user.userId, body);
  }
}
