import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { Plan, StatusAssinatura } from '@prisma/client';

interface CreateCheckoutDto {
  plano: 'PRO' | 'EXPERT';
  successUrl: string;
  cancelUrl: string;
}

@Injectable()
export class PagamentosService {
  private readonly logger = new Logger(PagamentosService.name);
  private stripe: Stripe;

  private readonly PLANOS: Record<string, { priceId: string; valor: number; nome: string }>;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada');
    }
    this.stripe = new Stripe(stripeKey);

    // C4: Price IDs via ConfigService (nunca process.env direto)
    this.PLANOS = {
      PRO: {
        priceId: this.configService.get<string>('STRIPE_PRO_PRICE_ID') || '',
        valor: 16999,
        nome: 'Plano Pro',
      },
      EXPERT: {
        priceId: this.configService.get<string>('STRIPE_EXPERT_PRICE_ID') || '',
        valor: 24999,
        nome: 'Plano Expert',
      },
    };
  }

  async createCheckoutSession(userId: string, dto: CreateCheckoutDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const planoConfig = this.PLANOS[dto.plano];
    if (!planoConfig) {
      throw new BadRequestException('Plano inválido');
    }

    if (!planoConfig.priceId) {
      throw new BadRequestException('Plano não configurado corretamente');
    }

    // Validar URLs de redirect (prevenir open redirect)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const allowedOrigins = frontendUrl.split(',').map(o => o.trim());
    const isValidUrl = (url: string) => {
      try {
        const parsed = new URL(url);
        return allowedOrigins.some(o => {
          const origin = new URL(o);
          return parsed.origin === origin.origin;
        });
      } catch { return false; }
    };

    if (!isValidUrl(dto.successUrl) || !isValidUrl(dto.cancelUrl)) {
      throw new BadRequestException('URLs de redirect inválidas');
    }

    // Verificar se já tem assinatura ativa
    const assinaturaAtiva = await this.prisma.assinatura.findFirst({
      where: {
        userId,
        status: StatusAssinatura.ATIVA,
        fimEm: { gt: new Date() },
      },
    });

    if (assinaturaAtiva) {
      throw new BadRequestException('Você já possui uma assinatura ativa');
    }

    // Criar ou recuperar customer no Stripe
    let customerId = await this.getOrCreateStripeCustomer({
      id: user.id,
      email: user.email,
      name: user.name || undefined,
    });

    // Criar sessão de checkout
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planoConfig.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      metadata: {
        userId: user.id,
        plano: dto.plano,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret não configurado');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message || 'Assinatura inválida'}`);
    }

    this.logger.log(`Webhook recebido: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
      }
    } catch (err: any) {
      this.logger.error(`Erro ao processar webhook ${event.type}: ${err.message}`, err.stack);
      // Retornar 200 para o Stripe não retentar indefinidamente
      // O erro já foi logado para investigação
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const plano = session.metadata?.plano as Plan;

    if (!userId || !plano) return;

    const subscriptionId = session.subscription as string;
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

    // Criar assinatura no banco
    await this.prisma.assinatura.create({
      data: {
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId,
        plano,
        status: StatusAssinatura.ATIVA,
        inicioEm: new Date(subscription.current_period_start * 1000),
        fimEm: new Date(subscription.current_period_end * 1000),
      },
    });

    // Atualizar plano do usuário
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan: plano,
        planExpiresAt: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription updated: ${subscription.id} -> status: ${subscription.status}`);
    
    const assinatura = await this.prisma.assinatura.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!assinatura) {
      this.logger.warn(`Assinatura ${subscription.id} não encontrada no banco - pode ser evento anterior ao checkout.session.completed`);
      return;
    }

    const status = this.mapStripeStatus(subscription.status);
    
    await this.prisma.assinatura.update({
      where: { id: assinatura.id },
      data: {
        status,
        fimEm: new Date(subscription.current_period_end * 1000),
      },
    });

    // Atualizar plano do usuário se cancelado
    if (status === StatusAssinatura.CANCELADA || status === StatusAssinatura.EXPIRADA) {
      await this.prisma.user.update({
        where: { id: assinatura.userId },
        data: {
          plan: Plan.FREE,
          planExpiresAt: null,
        },
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const assinatura = await this.prisma.assinatura.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!assinatura) return;

    await this.prisma.assinatura.update({
      where: { id: assinatura.id },
      data: { status: StatusAssinatura.CANCELADA },
    });

    await this.prisma.user.update({
      where: { id: assinatura.userId },
      data: {
        plan: Plan.FREE,
        planExpiresAt: null,
      },
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const assinatura = await this.prisma.assinatura.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!assinatura) return;

    await this.prisma.assinatura.update({
      where: { id: assinatura.id },
      data: { status: StatusAssinatura.PENDENTE },
    });
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): StatusAssinatura {
    const statusMap: Record<string, StatusAssinatura> = {
      active: StatusAssinatura.ATIVA,
      canceled: StatusAssinatura.CANCELADA,
      incomplete: StatusAssinatura.PENDENTE,
      incomplete_expired: StatusAssinatura.EXPIRADA,
      past_due: StatusAssinatura.PENDENTE,
      trialing: StatusAssinatura.ATIVA,
      unpaid: StatusAssinatura.PENDENTE,
    };
    return statusMap[status] || StatusAssinatura.PENDENTE;
  }

  private async getOrCreateStripeCustomer(user: { id: string; email: string; name?: string }) {
    // Verificar se já existe customer
    const existingAssinatura = await this.prisma.assinatura.findFirst({
      where: { userId: user.id, stripeCustomerId: { not: null } },
    });

    if (existingAssinatura?.stripeCustomerId) {
      return existingAssinatura.stripeCustomerId;
    }

    // Criar novo customer
    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });

    return customer.id;
  }

  async getAssinaturaAtiva(userId: string) {
    return this.prisma.assinatura.findFirst({
      where: {
        userId,
        status: StatusAssinatura.ATIVA,
        fimEm: { gt: new Date() },
      },
    });
  }

  async cancelarAssinatura(userId: string) {
    const assinatura = await this.getAssinaturaAtiva(userId);
    
    if (!assinatura || !assinatura.stripeSubscriptionId) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    // Cancelar no Stripe (ao final do período)
    await this.stripe.subscriptions.update(assinatura.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return { message: 'Assinatura será cancelada ao final do período atual' };
  }

  async getPortalUrl(userId: string) {
    const assinatura = await this.prisma.assinatura.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
    });

    if (!assinatura?.stripeCustomerId) {
      throw new NotFoundException('Nenhuma assinatura encontrada');
    }

    const frontendUrl = (this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000').split(',')[0].trim();
    const session = await this.stripe.billingPortal.sessions.create({
      customer: assinatura.stripeCustomerId,
      return_url: `${frontendUrl}/dashboard/planos`,
    });

    return { url: session.url };
  }
}
