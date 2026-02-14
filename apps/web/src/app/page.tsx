'use client';

import Link from 'next/link';
import { Wallet, Radio, Zap, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { ParticlesBackground } from '@/components/ui/particles-background';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0D0D0F] relative">
      <ParticlesBackground />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden z-10">
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              <span className="text-purple-500">Expert</span> Skills
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-400">
              Plataforma de análise automatizada e gestão de banca para apostadores de eSoccer FIFA.
              <span className="block mt-2 text-purple-400">Você não precisa pensar, só seguir.</span>
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/login"
                className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-all"
              >
                Começar Agora
              </Link>
              <Link
                href="/planos"
                className="text-sm font-semibold leading-6 text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                Ver Planos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Análise + Gestão + Entradas prontas
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-6 hover:border-purple-500/50 transition-colors backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20">
                <Wallet className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Controle de Banca</h3>
              <p className="mt-2 text-sm text-gray-400">
                Gestão automática: Agressiva, Conservadora ou Personalizada. Stake calculado automaticamente.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-6 hover:border-purple-500/50 transition-colors backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20">
                <Radio className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Radar</h3>
              <p className="mt-2 text-sm text-gray-400">
                Análise em tempo real com classificação visual: <CheckCircle className="inline h-3 w-3 text-green-400" /> Operar, <AlertCircle className="inline h-3 w-3 text-amber-400" /> Cautela, <XCircle className="inline h-3 w-3 text-red-400" /> Evitar.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-6 hover:border-purple-500/50 transition-colors backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Entradas Expert</h3>
              <p className="mt-2 text-sm text-gray-400">
                Entradas prontas geradas por IA. Mercado, odd e stake já calculados para você.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 relative z-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Pronto para começar?
        </h2>
        <p className="mt-4 text-lg text-gray-300">
          Junte-se a centenas de apostadores que já usam o Expert Skills.
        </p>
        <Link
          href="/registro"
          className="mt-8 inline-block rounded-lg bg-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-purple-500 transition-all"
        >
          Criar Conta Grátis
        </Link>
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
