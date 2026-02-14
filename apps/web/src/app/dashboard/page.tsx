'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { bancaApi, Banca } from '@/lib/api';
import Link from 'next/link';
import { LayoutDashboard, Wallet, Radio, Zap, ArrowRight, TrendingUp, Target, Award, BarChart3, Clock, CheckCircle, XCircle, Flame } from 'lucide-react';
import { entradasApi, EstatisticasGerais, UltimaEntrada, HeatmapHorarios, EvolucaoBanca } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

// Lazy load do componente de gráfico
const EvolucaoChart = dynamic(() => import('@/components/dashboard/evolucao-chart'), {
  loading: () => (
    <div className="h-40 flex items-center justify-center">
      <div className="animate-pulse bg-zinc-800 rounded w-full h-full" />
    </div>
  ),
  ssr: false,
});

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [banca, setBanca] = useState<Banca | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais | null>(null);
  const [ultimasEntradas, setUltimasEntradas] = useState<UltimaEntrada[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapHorarios | null>(null);
  const [evolucao, setEvolucao] = useState<EvolucaoBanca[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Chamadas paralelas otimizadas: banca separada + summary unificado
        const [bancaRes, summaryRes] = await Promise.all([
          bancaApi.get(),
          entradasApi.getDashboardSummary(),
        ]);
        setBanca(bancaRes.data);
        setEstatisticas(summaryRes.data.estatisticas);
        setUltimasEntradas(summaryRes.data.ultimas);
        setHeatmap(summaryRes.data.heatmap);
        setEvolucao(summaryRes.data.evolucao);
      } catch {
        setBanca(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <LayoutDashboard className="h-8 w-8 text-purple-400" />
          Olá, {user?.name?.split(' ')[0] || 'Apostador'}!
        </h1>
        <p className="mt-1 text-zinc-400">
          Bem-vindo ao seu painel de controle
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{banca?.nome || 'Banca Atual'}</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? '...' : banca ? formatCurrency(banca.valor) : 'Não configurada'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">
              {banca ? `Gestão ${banca.tipoGestao.toLowerCase()}` : 'Configure sua banca'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Stake por Entrada</CardDescription>
            <CardTitle className="text-2xl text-purple-400">
              {isLoading ? '...' : banca ? formatCurrency(banca.stake) : '-'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">
              {banca ? `${banca.calculado.entradasNecessarias} entradas disponíveis` : '-'}
            </p>
          </CardContent>
        </Card>

        {/* Meta do Dia com Barra de Progresso */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Meta do Dia
            </CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? '...' : banca ? formatCurrency(banca.metaDiaria) : '-'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {banca && banca.progressoHoje && (
              <>
                {(() => {
                  const progresso = Math.min((banca.progressoHoje.lucro / banca.metaDiaria) * 100, 100);
                  const atingiuMeta = progresso >= 100;
                  return (
                    <>
                      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            atingiuMeta 
                              ? "bg-gradient-to-r from-green-500 to-emerald-400 animate-pulse shadow-lg shadow-green-500/50" 
                              : "bg-gradient-to-r from-purple-600 to-purple-400"
                          )}
                          style={{ width: `${Math.max(progresso, 0)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={cn(
                          "text-xs font-medium",
                          atingiuMeta ? "text-green-400" : "text-zinc-400"
                        )}>
                          {progresso.toFixed(0)}%
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatCurrency(banca.progressoHoje.lucro)} / {formatCurrency(banca.metaDiaria)}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
            {(!banca || !banca.progressoHoje) && (
              <p className="text-xs text-zinc-500">
                {banca ? `Odd mínima: ${banca.calculado.oddMinima}` : '-'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Progresso Hoje */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              Progresso Hoje
            </CardDescription>
            <CardTitle className={cn(
              "text-2xl",
              banca?.progressoHoje?.lucro && banca.progressoHoje.lucro >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {isLoading ? '...' : banca?.progressoHoje 
                ? formatCurrency(banca.progressoHoje.lucro) 
                : formatCurrency(0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="h-3 w-3" />
                {banca?.progressoHoje?.greens || 0}G
              </span>
              <span className="text-zinc-600">/</span>
              <span className="flex items-center gap-1 text-red-400">
                <XCircle className="h-3 w-3" />
                {banca?.progressoHoje?.reds || 0}R
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      {estatisticas && estatisticas.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Resumo de Performance
            </CardTitle>
            <CardDescription>Suas estatísticas gerais de apostas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-zinc-800/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-4 w-4 text-zinc-400" />
                </div>
                <p className="text-2xl font-bold text-white">{estatisticas.total}</p>
                <p className="text-xs text-zinc-400">Total Entradas</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-zinc-800/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Award className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-400">{estatisticas.taxaAcerto.toFixed(1)}%</p>
                <p className="text-xs text-zinc-400">Taxa de Acerto</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-zinc-800/50">
                <p className={`text-2xl font-bold ${estatisticas.lucroTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {estatisticas.lucroTotal >= 0 ? '+' : ''}{formatCurrency(estatisticas.lucroTotal)}
                </p>
                <p className="text-xs text-zinc-400">Lucro Total</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-zinc-800/50">
                <p className={`text-2xl font-bold ${estatisticas.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {estatisticas.roi >= 0 ? '+' : ''}{estatisticas.roi.toFixed(1)}%
                </p>
                <p className="text-xs text-zinc-400">ROI</p>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <Link href="/dashboard/historico">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  Ver Histórico Completo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos de Gestão */}
      {estatisticas && estatisticas.total > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico Radar - Performance Geral */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Radio className="h-5 w-5 text-purple-400" />
                Radar de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                {/* Gráfico Radar SVG */}
                <div className="relative w-64 h-64">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <defs>
                      <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
                      </linearGradient>
                      {/* Animação de pulso para ondas */}
                      <style>{`
                        @keyframes radarPulse {
                          0% { opacity: 0.6; transform: scale(0.2); transform-origin: center; }
                          100% { opacity: 0; transform: scale(1); transform-origin: center; }
                        }
                        .radar-wave { animation: radarPulse 3s ease-out infinite; }
                        .radar-wave-1 { animation-delay: 0s; }
                        .radar-wave-2 { animation-delay: 1s; }
                        .radar-wave-3 { animation-delay: 2s; }
                      `}</style>
                    </defs>
                    {/* Ondas de radar animadas */}
                    <polygon
                      className="radar-wave radar-wave-1"
                      points="100,0 186.6,50 186.6,150 100,200 13.4,150 13.4,50"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="1"
                      strokeOpacity="0.5"
                    />
                    <polygon
                      className="radar-wave radar-wave-2"
                      points="100,0 186.6,50 186.6,150 100,200 13.4,150 13.4,50"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="1"
                      strokeOpacity="0.5"
                    />
                    <polygon
                      className="radar-wave radar-wave-3"
                      points="100,0 186.6,50 186.6,150 100,200 13.4,150 13.4,50"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="1"
                      strokeOpacity="0.5"
                    />
                    {/* Grid hexagonal */}
                    {[100, 75, 50, 25].map((r, i) => (
                      <polygon
                        key={i}
                        points={`100,${100-r} ${100+r*0.866},${100-r*0.5} ${100+r*0.866},${100+r*0.5} 100,${100+r} ${100-r*0.866},${100+r*0.5} ${100-r*0.866},${100-r*0.5}`}
                        fill="none"
                        stroke="#27272a"
                        strokeWidth="1"
                      />
                    ))}
                    {/* Linhas do centro */}
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                      <line
                        key={i}
                        x1="100"
                        y1="100"
                        x2={100 + 100 * Math.cos((angle - 90) * Math.PI / 180)}
                        y2={100 + 100 * Math.sin((angle - 90) * Math.PI / 180)}
                        stroke="#27272a"
                        strokeWidth="1"
                      />
                    ))}
                    <polygon
                      points={`
                        100,${100 - Math.min(estatisticas.taxaAcerto, 100)}
                        ${100 + Math.min(Math.abs(estatisticas.roi) + 20, 100) * 0.866},${100 - Math.min(Math.abs(estatisticas.roi) + 20, 100) * 0.5}
                        ${100 + Math.min((estatisticas.greens / Math.max(estatisticas.total, 1)) * 100, 100) * 0.866},${100 + Math.min((estatisticas.greens / Math.max(estatisticas.total, 1)) * 100, 100) * 0.5}
                        100,${100 + Math.min(estatisticas.total * 5, 100)}
                        ${100 - Math.min((1 - estatisticas.reds / Math.max(estatisticas.total, 1)) * 100, 100) * 0.866},${100 + Math.min((1 - estatisticas.reds / Math.max(estatisticas.total, 1)) * 100, 100) * 0.5}
                        ${100 - Math.min(estatisticas.taxaAcerto * 0.8, 100) * 0.866},${100 - Math.min(estatisticas.taxaAcerto * 0.8, 100) * 0.5}
                      `}
                      fill="url(#radarGradient)"
                      fillOpacity="0.3"
                      stroke="url(#radarGradient)"
                      strokeWidth="2"
                      className="transition-all duration-1000"
                    />
                    {/* Pontos nos vértices */}
                    <circle cx="100" cy={100 - Math.min(estatisticas.taxaAcerto, 100)} r="4" fill="#a855f7" />
                    <circle cx={100 + Math.min(Math.abs(estatisticas.roi) + 20, 100) * 0.866} cy={100 - Math.min(Math.abs(estatisticas.roi) + 20, 100) * 0.5} r="4" fill="#22c55e" />
                    <circle cx={100 + Math.min((estatisticas.greens / Math.max(estatisticas.total, 1)) * 100, 100) * 0.866} cy={100 + Math.min((estatisticas.greens / Math.max(estatisticas.total, 1)) * 100, 100) * 0.5} r="4" fill="#22c55e" />
                    {/* Labels */}
                    <text x="100" y="12" textAnchor="middle" className="fill-zinc-400 text-[10px]">Acerto</text>
                    <text x="190" y="55" textAnchor="end" className="fill-zinc-400 text-[10px]">ROI</text>
                    <text x="190" y="155" textAnchor="end" className="fill-zinc-400 text-[10px]">Greens</text>
                    <text x="100" y="195" textAnchor="middle" className="fill-zinc-400 text-[10px]">Volume</text>
                    <text x="10" y="155" textAnchor="start" className="fill-zinc-400 text-[10px]">Consistência</text>
                    <text x="10" y="55" textAnchor="start" className="fill-zinc-400 text-[10px]">Eficiência</text>
                  </svg>
                  {/* Centro com valor principal */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-purple-400">{estatisticas.taxaAcerto.toFixed(0)}%</span>
                      <p className="text-[10px] text-zinc-500">Taxa Acerto</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Mini stats abaixo */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-800">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">{estatisticas.greens}</p>
                  <p className="text-[10px] text-zinc-500">Greens</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-400">{estatisticas.reds}</p>
                  <p className="text-[10px] text-zinc-500">Reds</p>
                </div>
                <div className="text-center">
                  <p className={cn('text-lg font-bold', estatisticas.roi >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {estatisticas.roi >= 0 ? '+' : ''}{estatisticas.roi.toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-zinc-500">ROI</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico Gauge - Performance Avançado */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Métricas de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Gauge Principal - Taxa de Acerto */}
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-24">
                    <svg viewBox="0 0 200 100" className="w-full h-full">
                      {/* Background arc */}
                      <path
                        d="M 20 90 A 80 80 0 0 1 180 90"
                        fill="none"
                        stroke="#27272a"
                        strokeWidth="16"
                        strokeLinecap="round"
                      />
                      {/* Progress arc */}
                      <path
                        d="M 20 90 A 80 80 0 0 1 180 90"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="16"
                        strokeLinecap="round"
                        strokeDasharray={`${(estatisticas.taxaAcerto / 100) * 251.2} 251.2`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="50%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                      </defs>
                      {/* Marcadores */}
                      <text x="20" y="98" className="fill-zinc-500 text-[8px]">0%</text>
                      <text x="95" y="15" className="fill-zinc-500 text-[8px]">50%</text>
                      <text x="170" y="98" className="fill-zinc-500 text-[8px]">100%</text>
                    </svg>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                      <span className="text-3xl font-bold text-white">{estatisticas.taxaAcerto.toFixed(0)}%</span>
                      <p className="text-[10px] text-zinc-500">Taxa de Acerto</p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* ROI */}
                  <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-500">ROI</span>
                      <TrendingUp className={cn('h-4 w-4', estatisticas.roi >= 0 ? 'text-green-400' : 'text-red-400')} />
                    </div>
                    <p className={cn('text-xl font-bold', estatisticas.roi >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {estatisticas.roi >= 0 ? '+' : ''}{estatisticas.roi.toFixed(1)}%
                    </p>
                    <div className="mt-2 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all duration-1000',
                          estatisticas.roi >= 0 ? 'bg-green-500' : 'bg-red-500'
                        )}
                        style={{ width: `${Math.min(Math.abs(estatisticas.roi), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Lucro/Prejuízo */}
                  <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-500">Lucro/Prejuízo</span>
                      <Wallet className={cn('h-4 w-4', estatisticas.lucroTotal >= 0 ? 'text-green-400' : 'text-red-400')} />
                    </div>
                    <p className={cn('text-xl font-bold', estatisticas.lucroTotal >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {estatisticas.lucroTotal >= 0 ? '+' : ''}{formatCurrency(estatisticas.lucroTotal)}
                    </p>
                  </div>
                </div>

                {/* Greens vs Reds Visual */}
                <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-zinc-500">Distribuição de Resultados</span>
                    <span className="text-xs text-zinc-400">{estatisticas.total} entradas</span>
                  </div>
                  {/* Barra horizontal única */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-400 font-medium">{estatisticas.greens} Greens</span>
                      <span className="text-red-400 font-medium">{estatisticas.reds} Reds</span>
                    </div>
                    <div className="h-3 bg-zinc-700 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000"
                        style={{ width: `${(estatisticas.greens / Math.max(estatisticas.total, 1)) * 100}%` }}
                      />
                      <div 
                        className="bg-gradient-to-r from-red-500 to-red-400 transition-all duration-1000"
                        style={{ width: `${(estatisticas.reds / Math.max(estatisticas.total, 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500">
                      <span>{estatisticas.total > 0 ? ((estatisticas.greens / estatisticas.total) * 100).toFixed(0) : 0}% acerto</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Nova Seção: Evolução da Banca + Heatmap + Últimas Entradas */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico Sparkline - Evolução da Banca */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Evolução da Banca (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EvolucaoChart data={evolucao} />
          </CardContent>
        </Card>

        {/* Heatmap de Horários */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-purple-400" />
              Melhor Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            {heatmap && heatmap.melhorHorario.taxaAcerto > 0 ? (
              <div className="space-y-3">
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30">
                  <p className="text-3xl font-bold text-green-400">
                    {heatmap.melhorHorario.inicio}h - {heatmap.melhorHorario.fim}h
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {heatmap.melhorHorario.taxaAcerto.toFixed(0)}% de acerto
                  </p>
                </div>
                {/* Mini heatmap visual */}
                <div className="grid grid-cols-12 gap-0.5">
                  {heatmap.horarios.filter(h => h.hora >= 6 && h.hora <= 23).map((h) => (
                    <div 
                      key={h.hora}
                      className={cn(
                        "h-4 rounded-sm transition-all",
                        h.total === 0 && "bg-zinc-800",
                        h.total > 0 && h.taxaAcerto >= 70 && "bg-green-500",
                        h.total > 0 && h.taxaAcerto >= 50 && h.taxaAcerto < 70 && "bg-yellow-500",
                        h.total > 0 && h.taxaAcerto < 50 && "bg-red-500/70"
                      )}
                      title={`${h.hora}h: ${h.greens}G/${h.reds}R (${h.taxaAcerto.toFixed(0)}%)`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 text-center">6h - 23h (verde = melhor)</p>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-zinc-500 text-sm">
                Sem dados suficientes
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feed de Últimas Entradas */}
      {ultimasEntradas.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              Últimas Entradas Resolvidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ultimasEntradas.map((entrada) => (
                <div 
                  key={entrada.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                    entrada.resultado === 'GREEN' 
                      ? "bg-green-500/10 border-green-500/30" 
                      : "bg-red-500/10 border-red-500/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {entrada.resultado === 'GREEN' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {entrada.jogador1} vs {entrada.jogador2}
                      </p>
                      <p className="text-xs text-zinc-400">{entrada.mercado} @ {entrada.odd.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      entrada.lucro >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {entrada.lucro >= 0 ? '+' : ''}{formatCurrency(entrada.lucro)}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {new Date(entrada.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-center">
              <Link href="/dashboard/historico">
                <Button variant="outline" size="sm" className="text-xs">
                  Ver Histórico Completo
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Banca Setup */}
        {!banca && !isLoading && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Configure sua Banca</CardTitle>
              <CardDescription>
                Para começar a usar o Expert Skills, configure sua banca e gestão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/banca">
                <Button size="lg">
                  Configurar Banca
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Radar Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-purple-400" />
                  Radar
                </CardTitle>
                <CardDescription>Jogos classificados em tempo real</CardDescription>
              </div>
              {user?.plan === 'FREE' && (
                <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                  PRO+
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {user?.plan === 'FREE' ? (
              <div className="text-center py-8">
                <p className="text-zinc-400 mb-4">
                  Faça upgrade para acessar o Radar em tempo real
                </p>
                <Link href="/dashboard/planos">
                  <Button variant="outline">Ver Planos</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400 text-center py-4">
                  Acesse o Radar para ver partidas em tempo real
                </p>
                <Link href="/dashboard/radar">
                  <Button variant="outline" className="w-full">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Ir para o Radar
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entradas Expert Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-400" />
                  Entradas Expert
                </CardTitle>
                <CardDescription>Entradas geradas por IA</CardDescription>
              </div>
              {user?.plan !== 'EXPERT' && (
                <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                  EXPERT
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {user?.plan !== 'EXPERT' ? (
              <div className="text-center py-8">
                <p className="text-zinc-400 mb-4">
                  Faça upgrade para receber entradas automáticas
                </p>
                <Link href="/dashboard/planos">
                  <Button variant="outline">Ver Planos</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400 text-center py-4">
                  Acesse as Entradas para ver sugestões em tempo real
                </p>
                <Link href="/dashboard/entradas">
                  <Button variant="outline" className="w-full">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Ir para Entradas
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
