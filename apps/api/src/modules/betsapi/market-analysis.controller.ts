import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { MarketAnalysisService } from './market-analysis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analysis')
@UseGuards(JwtAuthGuard)
export class MarketAnalysisController {
  constructor(private readonly analysisService: MarketAnalysisService) {}

  /**
   * Análise básica de mercado (legado)
   */
  @Get('match/:eventId')
  async analyzeMatch(@Param('eventId') eventId: string) {
    return this.analysisService.analyzeMatch(eventId);
  }

  /**
   * Análise completa com as 9 seções do prompt profissional:
   * 1️⃣ Contexto do confronto
   * 2️⃣ Tabela e posição (não disponível na API)
   * 3️⃣ Gols no HT e FT
   * 4️⃣ Linhas abertas no mercado
   * 5️⃣ Pagamento real da linha
   * 6️⃣ Odd e margem de gols
   * 7️⃣ Risco de 0x0
   * 8️⃣ Objetivo dos gols
   * 9️⃣ Conclusão técnica
   */
  @Get('full/:eventId')
  async analyzeMatchFull(@Param('eventId') eventId: string) {
    return this.analysisService.analyzeMatchFull(eventId);
  }

  @Post('batch')
  async analyzeMultiple(@Body() body: { eventIds: string[] }) {
    return this.analysisService.analyzeMultipleMatches(body.eventIds);
  }
}
