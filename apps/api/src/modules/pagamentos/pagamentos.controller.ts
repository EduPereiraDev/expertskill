import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  Req,
  Logger,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PagamentosService } from './pagamentos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pagamentos')
export class PagamentosController {
  private readonly logger = new Logger(PagamentosController.name);

  constructor(private pagamentosService: PagamentosService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(
    @Request() req: any,
    @Body() body: { plano: 'PRO' | 'EXPERT'; successUrl: string; cancelUrl: string },
  ) {
    return this.pagamentosService.createCheckoutSession(req.user.userId, body);
  }

  // I3: Webhook do Stripe não pode ter rate limit
  @SkipThrottle()
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      this.logger.error('Webhook recebido sem rawBody');
      throw new Error('Raw body is required for webhook verification');
    }
    return this.pagamentosService.handleWebhook(req.rawBody, signature);
  }

  @UseGuards(JwtAuthGuard)
  @Get('assinatura')
  getAssinatura(@Request() req: any) {
    return this.pagamentosService.getAssinaturaAtiva(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancelar')
  cancelarAssinatura(@Request() req: any) {
    return this.pagamentosService.cancelarAssinatura(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('portal')
  getPortal(@Request() req: any) {
    return this.pagamentosService.getPortalUrl(req.user.userId);
  }
}
