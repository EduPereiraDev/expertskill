'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { pagamentosApi, Assinatura } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Check, X, Loader2, CreditCard, ExternalLink } from 'lucide-react';

const planos = [
  {
    id: 'FREE',
    nome: 'Free',
    preco: 0,
    periodo: 'para sempre',
    descricao: 'Comece a organizar suas apostas',
    destaque: false,
    recursos: [
      { nome: 'Dashboard básico', incluido: true },
      { nome: 'Controle de banca', incluido: true },
      { nome: 'Histórico de entradas', incluido: true },
      { nome: 'Radar de partidas', incluido: false },
      { nome: 'Entradas Expert (IA)', incluido: false },
      { nome: 'Suporte prioritário', incluido: false },
    ],
  },
  {
    id: 'PRO',
    nome: 'Pro',
    preco: 169.99,
    periodo: '/mês',
    descricao: 'Para apostadores que querem mais',
    destaque: true,
    recursos: [
      { nome: 'Dashboard completo', incluido: true },
      { nome: 'Controle de banca avançado', incluido: true },
      { nome: 'Histórico completo', incluido: true },
      { nome: 'Radar de partidas em tempo real', incluido: true },
      { nome: 'Entradas Expert (IA)', incluido: false },
      { nome: 'Suporte prioritário', incluido: true },
    ],
  },
  {
    id: 'EXPERT',
    nome: 'Expert',
    preco: 249.99,
    periodo: '/mês',
    descricao: 'Máximo desempenho com IA',
    destaque: false,
    recursos: [
      { nome: 'Tudo do plano Pro', incluido: true },
      { nome: 'Entradas Expert geradas por IA', incluido: true },
      { nome: 'Análise detalhada de cada entrada', incluido: true },
      { nome: 'Níveis de confiança calculados', incluido: true },
      { nome: 'Alertas de oportunidades', incluido: true },
      { nome: 'Suporte VIP 24/7', incluido: true },
    ],
  },
];

export default function PlanosPage() {
  const { user, checkAuth } = useAuthStore();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Verificar parâmetros de retorno do Stripe
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setMessage({ type: 'success', text: 'Pagamento realizado com sucesso! Seu plano foi atualizado.' });
      checkAuth(); // Atualizar dados do usuário
    } else if (canceled === 'true') {
      setMessage({ type: 'error', text: 'Pagamento cancelado. Você pode tentar novamente.' });
    }

    // Buscar assinatura atual
    fetchAssinatura();
  }, [searchParams, checkAuth]);

  const fetchAssinatura = async () => {
    try {
      const { data } = await pagamentosApi.getAssinatura();
      setAssinatura(data);
    } catch (err) {
      // Usuário não tem assinatura
    }
  };

  const handleUpgrade = async (planoId: string) => {
    if (planoId === user?.plan || planoId === 'FREE') return;
    
    setIsLoading(planoId);
    setMessage(null);
    
    try {
      const { data } = await pagamentosApi.createCheckout(planoId as 'PRO' | 'EXPERT');
      
      // Redirecionar para o Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '';
      // Verificar se é erro de configuração do Stripe
      const isStripeConfigError = errorMessage.includes('API Key') || errorMessage.includes('Stripe');
      
      setMessage({ 
        type: 'error', 
        text: isStripeConfigError 
          ? 'Sistema de pagamentos em manutenção. Tente novamente mais tarde.'
          : errorMessage || 'Erro ao processar pagamento. Tente novamente.' 
      });
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data } = await pagamentosApi.getPortalUrl();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao acessar portal de assinatura.' });
    }
  };

  const formatCurrency = (value: number) => {
    if (value === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Mensagem de feedback */}
      {message && (
        <div className={cn(
          'max-w-2xl mx-auto p-4 rounded-lg text-center',
          message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
        )}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white">Escolha seu Plano</h1>
        <p className="mt-2 text-zinc-400">
          Desbloqueie recursos avançados e maximize seus resultados no eSoccer
        </p>
        
        {/* Botão de gerenciar assinatura */}
        {assinatura && assinatura.status === 'ATIVA' && (
          <Button
            variant="outline"
            className="mt-4"
            onClick={handleManageSubscription}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Gerenciar Assinatura
            <ExternalLink className="h-3 w-3 ml-2" />
          </Button>
        )}
      </div>

      {/* Planos */}
      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {planos.map((plano) => {
          const isCurrentPlan = user?.plan === plano.id;
          const canUpgrade = !isCurrentPlan && (
            (user?.plan === 'FREE') ||
            (user?.plan === 'BASICO' && plano.id !== 'FREE') ||
            (user?.plan === 'PRO' && plano.id === 'EXPERT')
          );

          return (
            <Card
              key={plano.id}
              className={cn(
                'relative overflow-hidden transition-all',
                plano.destaque && 'border-purple-500 shadow-lg shadow-purple-500/20',
                isCurrentPlan && 'border-green-500'
              )}
            >
              {/* Badge de destaque */}
              {plano.destaque && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MAIS POPULAR
                </div>
              )}

              {/* Badge de plano atual */}
              {isCurrentPlan && (
                <div className="absolute top-0 left-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                  SEU PLANO
                </div>
              )}

              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl">{plano.nome}</CardTitle>
                <CardDescription>{plano.descricao}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">
                    {formatCurrency(plano.preco)}
                  </span>
                  {plano.preco > 0 && (
                    <span className="text-zinc-400 ml-1">{plano.periodo}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Lista de recursos */}
                <ul className="space-y-3">
                  {plano.recursos.map((recurso, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {recurso.incluido ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <X className="h-4 w-4 text-zinc-600" />
                      )}
                      <span className={cn(
                        'text-sm',
                        recurso.incluido ? 'text-zinc-300' : 'text-zinc-600'
                      )}>
                        {recurso.nome}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Botão de ação */}
                <Button
                  className={cn(
                    'w-full',
                    plano.destaque && 'bg-purple-600 hover:bg-purple-700',
                    isCurrentPlan && 'bg-green-600 hover:bg-green-600 cursor-default'
                  )}
                  disabled={isCurrentPlan || isLoading !== null}
                  onClick={() => canUpgrade && handleUpgrade(plano.id)}
                >
                  {isLoading === plano.id ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando...
                    </span>
                  ) : isCurrentPlan ? (
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Plano Atual
                    </span>
                  ) : canUpgrade ? (
                    'Fazer Upgrade'
                  ) : (
                    'Indisponível'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-12">
        <h2 className="text-xl font-bold text-white text-center mb-6">Perguntas Frequentes</h2>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-white">Posso cancelar a qualquer momento?</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Sim! Você pode cancelar sua assinatura a qualquer momento. O acesso continua até o fim do período pago.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-white">Como funciona o Radar?</h3>
              <p className="text-sm text-zinc-400 mt-1">
                O Radar analisa partidas de eSoccer em tempo real e classifica cada jogo como Operar, Cautela ou Evitar.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-white">O que são Entradas Expert?</h3>
              <p className="text-sm text-zinc-400 mt-1">
                São entradas geradas automaticamente por nossa IA, com mercado, odd e stake já definidos, além de análise detalhada.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
