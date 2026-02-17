'use client';

import Link from 'next/link';
import { Check, X, ArrowLeft } from 'lucide-react';
import { ParticlesBackground } from '@/components/ui/particles-background';
import { cn } from '@/lib/utils';

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

export default function PlanosPublicPage() {
  const formatCurrency = (value: number) => {
    if (value === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <main className="min-h-screen bg-[#0D0D0F] relative">
      <ParticlesBackground />
      
      {/* Header */}
      <div className="relative z-10 pt-8 px-6">
        <div className="max-w-7xl mx-auto">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white">
              Escolha seu <span className="text-purple-500">Plano</span>
            </h1>
            <p className="mt-4 text-lg text-zinc-400">
              Desbloqueie recursos avançados e maximize seus resultados no eSoccer
            </p>
          </div>

          {/* Planos */}
          <div className="grid gap-6 md:grid-cols-3">
            {planos.map((plano) => (
              <div
                key={plano.id}
                className={cn(
                  'relative rounded-xl bg-zinc-900/80 border p-6 backdrop-blur-sm transition-all hover:scale-[1.02]',
                  plano.destaque 
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                    : 'border-zinc-800 hover:border-zinc-700'
                )}
              >
                {/* Badge de destaque */}
                {plano.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MAIS POPULAR
                  </div>
                )}

                <div className="text-center pt-4">
                  <h3 className="text-2xl font-bold text-white">{plano.nome}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{plano.descricao}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">
                      {formatCurrency(plano.preco)}
                    </span>
                    {plano.preco > 0 && (
                      <span className="text-zinc-400 ml-1">{plano.periodo}</span>
                    )}
                  </div>
                </div>

                {/* Lista de recursos */}
                <ul className="mt-6 space-y-3">
                  {plano.recursos.map((recurso, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {recurso.incluido ? (
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-zinc-600 flex-shrink-0" />
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

                {/* Botão */}
                <Link
                  href="/registro"
                  className={cn(
                    'mt-6 block w-full text-center py-3 rounded-lg font-semibold transition-all',
                    plano.destaque 
                      ? 'bg-purple-600 text-white hover:bg-purple-500' 
                      : 'bg-zinc-800 text-white hover:bg-zinc-700'
                  )}
                >
                  Começar Agora
                </Link>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-white text-center mb-6">Perguntas Frequentes</h2>
            <div className="space-y-4">
              <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4 backdrop-blur-sm">
                <h3 className="font-medium text-white">Posso cancelar a qualquer momento?</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Sim! Você pode cancelar sua assinatura a qualquer momento. O acesso continua até o fim do período pago.
                </p>
              </div>
              <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4 backdrop-blur-sm">
                <h3 className="font-medium text-white">Como funciona o Radar?</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  O Radar analisa partidas de eSoccer em tempo real e classifica cada jogo como Operar, Cautela ou Evitar.
                </p>
              </div>
              <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4 backdrop-blur-sm">
                <h3 className="font-medium text-white">O que são Entradas Expert?</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  São entradas geradas automaticamente por nossa IA, com mercado, odd e stake já definidos, além de análise detalhada.
                </p>
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2026 Expert Skills. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
