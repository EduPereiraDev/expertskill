'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { radarApi, RadarPartida, Liga, AnaliseDetalhada } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Radio, Lock, Check, Crown, CircleDot, Users, TrendingUp, Percent, Clock, BarChart3, Target, AlertTriangle, Zap } from 'lucide-react';

const ligas: { value: Liga | 'TODAS'; label: string }[] = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'GT_12MIN', label: 'GT 12min' },
  { value: 'VOLTA_6MIN', label: 'Volta 6min' },
  { value: 'GT_8MIN', label: 'Battle 8min' },
  { value: 'H2H', label: 'H2H' },
];

const classificacaoConfig = {
  OPERAR: { label: 'Operar', bg: 'bg-zinc-900', border: 'border-zinc-800', text: 'text-green-400', dotColor: 'bg-green-500', accent: 'border-l-green-500' },
  CAUTELA: { label: 'Cautela', bg: 'bg-zinc-900', border: 'border-zinc-800', text: 'text-yellow-400', dotColor: 'bg-yellow-500', accent: 'border-l-yellow-500' },
  EVITAR: { label: 'Evitar', bg: 'bg-zinc-900', border: 'border-zinc-800', text: 'text-red-400', dotColor: 'bg-red-500', accent: 'border-l-red-500' },
};

export default function RadarPage() {
  const { user } = useAuthStore();
  const [partidas, setPartidas] = useState<RadarPartida[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ligaSelecionada, setLigaSelecionada] = useState<Liga | 'TODAS'>('TODAS');
  const [error, setError] = useState('');
  const [analiseAberta, setAnaliseAberta] = useState<AnaliseDetalhada | null>(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const [filtroH2H, setFiltroH2H] = useState(false);
  const [filtroDesempenho, setFiltroDesempenho] = useState<'todos' | 'time' | 'jogador'>('todos');

  const isPro = user?.plan === 'PRO' || user?.plan === 'EXPERT';

  const abrirAnalise = async (partidaId: string) => {
    setLoadingAnalise(true);
    try {
      const { data } = await radarApi.getAnaliseDetalhada(partidaId);
      setAnaliseAberta(data);
    } catch (err) {
      console.error('Erro ao carregar análise:', err);
    } finally {
      setLoadingAnalise(false);
    }
  };

  useEffect(() => {
    if (!isPro) return;
    
    let isFirst = true;
    const fetchPartidas = async () => {
      if (isFirst) setIsLoading(true);
      setError('');
      try {
        const liga = ligaSelecionada === 'TODAS' ? undefined : ligaSelecionada;
        const { data } = await radarApi.getPartidas(liga);
        setPartidas(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar partidas');
      } finally {
        if (isFirst) { setIsLoading(false); isFirst = false; }
      }
    };

    fetchPartidas();
    const interval = setInterval(fetchPartidas, 10000); // Atualiza a cada 10s (silencioso)
    return () => clearInterval(interval);
  }, [ligaSelecionada, isPro]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatLiga = (liga: Liga) => {
    const map: Record<Liga, string> = {
      GT_12MIN: 'GT 12min',
      VOLTA_6MIN: 'Volta 6min',
      GT_8MIN: 'Battle 8min',
      H2H: 'H2H',
    };
    return map[liga];
  };

  // Usuário FREE - mostrar upgrade
  if (!isPro) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Radio className="h-8 w-8 text-purple-400" />
            Radar
          </h1>
          <p className="mt-1 text-zinc-400">Análise de jogos em tempo real</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/20">
              <Lock className="h-8 w-8 text-purple-400" />
            </div>
            <CardTitle>Recurso Exclusivo PRO</CardTitle>
            <CardDescription>
              O Radar está disponível apenas para assinantes PRO e EXPERT
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6 space-y-2 text-sm text-zinc-400">
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Análise em tempo real de todas as partidas</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Classificação visual: Operar, Cautela, Evitar</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Indicadores de probabilidade de Over 2.5</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Filtros por liga e atualização automática</p>
            </div>
            <Link href="/dashboard/planos">
              <Button size="lg" className="w-full max-w-xs">
                <Crown className="h-4 w-4 mr-2" />
                Fazer Upgrade para PRO
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
              <div className="relative h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
                <Radio className="h-5 w-5 text-white" />
              </div>
            </div>
            Radar
          </h1>
        </div>
        
        {/* Filtro de Liga */}
        <div className="flex gap-2 flex-wrap">
          {ligas.map((liga) => (
            <button
              key={liga.value}
              onClick={() => setLigaSelecionada(liga.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                ligaSelecionada === liga.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              )}
            >
              {liga.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex gap-3 text-sm font-medium">
        <span className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800/50 text-green-400">
          <span className="h-3 w-3 rounded-sm bg-green-500" /> Operar
        </span>
        <span className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800/50 text-yellow-400">
          <span className="h-3 w-3 rounded-sm bg-yellow-500" /> Cautela
        </span>
        <span className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800/50 text-red-400">
          <span className="h-3 w-3 rounded-sm bg-red-500" /> Evitar
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            <p className="text-zinc-400">Carregando partidas...</p>
          </div>
        </div>
      ) : partidas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-400">Nenhuma partida ao vivo no momento</p>
          </CardContent>
        </Card>
      ) : (
        /* Lista de Partidas */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partidas.map((partida) => {
            const config = classificacaoConfig[partida.classificacao];
            
            return (
              <Card 
                key={partida.id} 
                className={cn(
                  'transition-all hover:translate-y-[-2px] border-l-4', 
                  config.bg, 
                  config.border,
                  config.accent
                )}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {partida.status === 'AO_VIVO' && (
                        <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          AO VIVO
                        </span>
                      )}
                      <span className={cn('text-xs font-medium', config.text)}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>{formatLiga(partida.liga)}</span>
                      <span className="text-zinc-400">{formatTime(partida.dataHora)}</span>
                    </div>
                  </div>

                  {/* Jogadores com Placar */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-200">{partida.jogador1.nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">{partida.jogador1.mediaGolsFT.toFixed(1)}g</span>
                        {partida.placar && (
                          <span className="w-6 text-center text-sm font-semibold text-white">
                            {partida.placar.home}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-200">{partida.jogador2.nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">{partida.jogador2.mediaGolsFT.toFixed(1)}g</span>
                        {partida.placar && (
                          <span className="w-6 text-center text-sm font-semibold text-white">
                            {partida.placar.away}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Indicadores - Linha única */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-500">Média: <span className="text-zinc-300 font-medium">{partida.indicadores.mediaTotal.toFixed(1)}</span></span>
                      <span className="text-zinc-500">Over: <span className="text-zinc-300 font-medium">{partida.indicadores.overMedio.toFixed(0)}%</span></span>
                    </div>
                    <span className={cn('font-semibold', config.text)}>
                      {partida.indicadores.probabilidadeOver25}%
                    </span>
                  </div>

                  {/* Botão Analisar */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    onClick={() => abrirAnalise(partida.id)}
                    disabled={loadingAnalise}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {loadingAnalise ? 'Carregando...' : 'Analisar Detalhado'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Análise Detalhada */}
      <Dialog open={!!analiseAberta} onOpenChange={() => setAnaliseAberta(null)}>
        <DialogContent className="p-0 max-w-2xl" onClose={() => setAnaliseAberta(null)}>
          {analiseAberta && (() => {
            const a = analiseAberta;
            const j1 = a.jogador1Stats;
            const j2 = a.jogador2Stats;
            const nomeJ1 = j1.nome.match(/\(([^)]+)\)/)?.[1] || j1.nome;
            const nomeJ2 = j2.nome.match(/\(([^)]+)\)/)?.[1] || j2.nome;
            const mediaGeral = a.partida.indicadores.mediaTotal;
            const probOver = a.partida.indicadores.overMedio;
            const bttsMedio = (j1.percentualBTTS + j2.percentualBTTS) / 2;
            const over15FT = Math.min(100, probOver * 1.3);
            const overHT = (j1.percentualOver05HT + j2.percentualOver05HT) / 2;
            const nivelRisco = a.mercado.confianca >= 70 ? 'Baixo' : a.mercado.confianca >= 50 ? 'Medio' : 'Alto';
            const riskColor = nivelRisco === 'Baixo' ? 'text-green-400' : nivelRisco === 'Medio' ? 'text-yellow-400' : 'text-red-400';
            const golsHT = j1.golsPorTempo.ht + j2.golsPorTempo.ht;
            const gols2T = j1.golsPorTempo.segundoTempo + j2.golsPorTempo.segundoTempo;
            const totalGolsTempo = golsHT + gols2T || 1;
            const pctHT = Math.round((golsHT / totalGolsTempo) * 100);
            const pct2T = 100 - pctHT;
            const stakeBase = a.mercado.confianca >= 70 ? 3 : a.mercado.confianca >= 50 ? 2 : 1;

            // Função Poisson
            const poisson = (k: number, lambda: number) => {
              const fatorial = k <= 1 ? 1 : Array.from({length: k}, (_, i) => i + 1).reduce((a, b) => a * b, 1);
              return (Math.pow(lambda, k) * Math.exp(-lambda)) / fatorial;
            };

            // Placares FT mais prováveis
            const placaresFT = (() => {
              const m1 = j1.mediaGolsFT;
              const m2 = j2.mediaGolsFT;
              const scores: { placar: string; prob: number }[] = [];
              for (let g1 = 0; g1 <= 5; g1++) {
                for (let g2 = 0; g2 <= 5; g2++) {
                  scores.push({ placar: `${g1} x ${g2}`, prob: Math.round(poisson(g1, m1) * poisson(g2, m2) * 100) });
                }
              }
              return scores.sort((a, b) => b.prob - a.prob).slice(0, 5);
            })();

            // Placares HT mais prováveis
            const placaresHT = (() => {
              const m1ht = j1.golsPorTempo.ht;
              const m2ht = j2.golsPorTempo.ht;
              const scores: { placar: string; prob: number }[] = [];
              for (let g1 = 0; g1 <= 4; g1++) {
                for (let g2 = 0; g2 <= 4; g2++) {
                  scores.push({ placar: `${g1} x ${g2}`, prob: Math.round(poisson(g1, m1ht) * poisson(g2, m2ht) * 100) });
                }
              }
              return scores.sort((a, b) => b.prob - a.prob).slice(0, 5);
            })();

            // Nomes dos times (antes do parêntese)
            const timeJ1 = j1.nome.match(/^([^(]+)/)?.[1]?.trim() || j1.nome;
            const timeJ2 = j2.nome.match(/^([^(]+)/)?.[1]?.trim() || j2.nome;

            // Taxa de acerto real baseada no histórico com filtro
            const todasPartidasRaw = [...j1.ultimasPartidas, ...j2.ultimasPartidas];
            const todasPartidas = filtroDesempenho === 'time'
              ? todasPartidasRaw.filter(p => {
                  const advTime = p.adversario.match(/^([^(]+)/)?.[1]?.trim() || p.adversario;
                  return advTime === timeJ1 || advTime === timeJ2;
                })
              : filtroDesempenho === 'jogador'
              ? todasPartidasRaw.filter(p => {
                  const advPlayer = p.adversario.match(/\(([^)]+)\)/)?.[1] || p.adversario;
                  return advPlayer.toLowerCase() === nomeJ1.toLowerCase() || advPlayer.toLowerCase() === nomeJ2.toLowerCase();
                })
              : todasPartidasRaw;
            const totalPartidas = todasPartidas.length;
            const mercadoPrincipal = a.mercado.linhaSegura;
            const acertosReais = todasPartidas.filter(p => {
              if (mercadoPrincipal.includes('Over 0.5 HT')) return (p.totalGolsHT || (p.golsHT + (p.golsHTContra || 0))) > 0;
              if (mercadoPrincipal.includes('Over 1.5 HT')) return (p.totalGolsHT || (p.golsHT + (p.golsHTContra || 0))) > 1;
              if (mercadoPrincipal.includes('Over 1.5 FT')) return p.totalGols > 1;
              if (mercadoPrincipal.includes('Over 2.5 FT')) return p.totalGols > 2;
              if (mercadoPrincipal.includes('Under 2.5 FT')) return p.totalGols < 3;
              if (mercadoPrincipal.includes('Under 1.5 HT')) return (p.totalGolsHT || (p.golsHT + (p.golsHTContra || 0))) < 2;
              if (mercadoPrincipal.includes('BTTS') || mercadoPrincipal.includes('Ambos')) return p.btts === true;
              return p.totalGols > 2;
            }).length;
            const acertoBase = totalPartidas > 0 ? Math.round((acertosReais / totalPartidas) * 100) : 0;

            return (
              <>
                <DialogHeader className="border-b border-zinc-800">
                  <DialogTitle className="flex items-center gap-2 text-lg px-6 py-4">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                    Analise Detalhada
                  </DialogTitle>
                  <p className="text-sm text-zinc-400 px-6 pb-3">
                    {j1.nome} vs {j2.nome}
                    {a.partida.status === 'AO_VIVO' && (
                      <span className="ml-2 text-green-400 font-medium">
                        — <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse mr-1" />Ao Vivo
                      </span>
                    )}
                  </p>
                  {/* Filtros gerais da analise */}
                  <div className="flex gap-2 px-6 pb-3">
                    <button
                      onClick={() => setFiltroH2H(!filtroH2H)}
                      className={cn(
                        'px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5',
                        filtroH2H 
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                      )}
                    >
                      <Users className="h-3 w-3" />
                      So confrontos
                    </button>
                  </div>
                </DialogHeader>
                <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                  {filtroH2H && a.h2h.totalJogos === 0 && (
                    <p className="text-xs text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded">Sem confrontos diretos registrados entre esses jogadores.</p>
                  )}

                  {/* 4.5) ANÁLISE DE CONFRONTO */}
                  {(() => {
                    const calcStats = (partidas: any[]) => {
                      if (partidas.length === 0) return null;
                      const over25 = partidas.filter((p: any) => p.totalGols > 2).length;
                      const overHT = partidas.filter((p: any) => (p.totalGolsHT || (p.golsHT + (p.golsHTContra || 0))) > 0).length;
                      const media = partidas.reduce((s: number, p: any) => s + p.totalGols, 0) / partidas.length;
                      const btts = partidas.filter((p: any) => p.golsPro > 0 && p.golsContra > 0).length;
                      return {
                        total: partidas.length,
                        over25, over25Pct: Math.round((over25 / partidas.length) * 100),
                        overHT, overHTPct: Math.round((overHT / partidas.length) * 100),
                        btts, bttsPct: Math.round((btts / partidas.length) * 100),
                        media: media.toFixed(1),
                      };
                    };
                    const j1ComTime = j1.ultimasPartidas.filter((p: any) => (p.adversario.match(/^([^(]+)/)?.[1]?.trim() || '') === timeJ2);
                    const j2ComTime = j2.ultimasPartidas.filter((p: any) => (p.adversario.match(/^([^(]+)/)?.[1]?.trim() || '') === timeJ1);
                    const statsTime = calcStats([...j1ComTime, ...j2ComTime]);
                    const j1VsPlayer = j1.ultimasPartidas.filter((p: any) => (p.adversario.match(/\(([^)]+)\)/)?.[1] || '').toLowerCase() === nomeJ2.toLowerCase());
                    const j2VsPlayer = j2.ultimasPartidas.filter((p: any) => (p.adversario.match(/\(([^)]+)\)/)?.[1] || '').toLowerCase() === nomeJ1.toLowerCase());
                    const statsPlayer = calcStats([...j1VsPlayer, ...j2VsPlayer]);
                    const h2hJogos = a.h2h.confrontosDiretos || [];
                    const placaresH2Hx = h2hJogos.map((p: any) => `${p.golsPro}-${p.golsContra}`);
                    const placarCount: Record<string, number> = {};
                    placaresH2Hx.forEach((pl: string) => { placarCount[pl] = (placarCount[pl] || 0) + 1; });
                    const placaresRepetidos = Object.entries(placarCount).filter(([_, c]) => c >= 2);
                    const temTroia = placaresRepetidos.length > 0;
                    const idaVolta = h2hJogos.length >= 2 ? (() => {
                      const ida = h2hJogos[h2hJogos.length - 1];
                      const volta = h2hJogos[h2hJogos.length - 2];
                      if (!ida || !volta) return null;
                      return { tipo: 'ambos' as const, idaGols: ida.totalGols, voltaGols: volta.totalGols, idaOver: ida.totalGols > 2, voltaOver: volta.totalGols > 2 };
                    })() : h2hJogos.length === 1 ? (() => {
                      const ida = h2hJogos[0];
                      if (!ida) return null;
                      return { tipo: 'somente_ida' as const, idaGols: ida.totalGols, voltaGols: 0, idaOver: ida.totalGols > 2, voltaOver: false };
                    })() : null;
                    const StatsCard = ({ title, stats, color }: { title: string; stats: any; color: string }) => (
                      <div className={cn('p-3 bg-zinc-900/40 rounded border', stats ? 'border-zinc-800' : 'border-zinc-800/50')}>
                        <p className={cn('text-[10px] font-medium mb-2', color)}>{title}</p>
                        {stats ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-500">Média gols:</span>
                              <span className="text-sm font-bold text-white">{stats.media}</span>
                            </div>
                            <div className="space-y-1">
                              {[
                                { label: 'Over 2.5 FT', val: stats.over25, total: stats.total, pct: stats.over25Pct },
                                { label: 'Gol no HT', val: stats.overHT, total: stats.total, pct: stats.overHTPct },
                                { label: 'Ambos marcam', val: stats.btts, total: stats.total, pct: stats.bttsPct },
                              ].map(({ label, val, total, pct }) => (
                                <div key={label} className="flex items-center gap-2">
                                  <span className="text-[10px] text-zinc-500 w-20">{label}</span>
                                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className={cn('h-full rounded-full', pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className={cn('text-[10px] font-bold w-12 text-right', pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400')}>
                                    {val}/{total}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-1">
                              {stats.over25Pct >= 70 ? 'Forte tendência Over neste contexto'
                                : stats.over25Pct >= 50 ? 'Tendência moderada para Over'
                                : stats.over25Pct >= 30 ? 'Tendência neutra — avaliar com cautela'
                                : 'Tendência Under — cuidado com entradas Over'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-600 py-2">Sem dados suficientes</p>
                        )}
                      </div>
                    );
                    return (
                      <div className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700">
                        <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" /> ANÁLISE DE CONFRONTO
                        </h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <StatsCard title={`Por time: ${timeJ1} vs ${timeJ2}`} stats={statsTime} color="text-blue-400" />
                            <StatsCard title={`Por jogador: ${nomeJ1} vs ${nomeJ2}`} stats={statsPlayer} color="text-purple-400" />
                          </div>
                          {statsTime && statsPlayer && (
                            <div className="p-2 bg-zinc-900/40 rounded border border-zinc-800">
                              <p className="text-[10px] text-zinc-600 mb-1">Comparativo: Time vs Jogador</p>
                              <p className="text-[10px] text-zinc-400">
                                {statsTime.over25Pct > statsPlayer.over25Pct + 15
                                  ? `Os times (${statsTime.over25Pct}%) fazem mais Over que os jogadores entre si (${statsPlayer.over25Pct}%). O time influencia mais.`
                                  : statsPlayer.over25Pct > statsTime.over25Pct + 15
                                  ? `Os jogadores (${statsPlayer.over25Pct}%) fazem mais Over que os times (${statsTime.over25Pct}%). O estilo do jogador pesa mais.`
                                  : `Times (${statsTime.over25Pct}%) e jogadores (${statsPlayer.over25Pct}%) têm tendência similar. Confronto consistente.`}
                              </p>
                            </div>
                          )}
                          {idaVolta && idaVolta.tipo === 'ambos' && (() => {
                            const mediaIdaVolta = (idaVolta.idaGols + idaVolta.voltaGols) / 2;
                            const melhor = idaVolta.idaGols > idaVolta.voltaGols ? 'IDA' : idaVolta.voltaGols > idaVolta.idaGols ? 'VOLTA' : 'IGUAL';
                            const operaVolta = idaVolta.voltaOver || mediaIdaVolta >= 2.5;
                            return (
                            <div className="p-2 bg-zinc-900/40 rounded border border-zinc-800">
                              <p className="text-[10px] text-zinc-600 mb-1">Ida vs Volta (ultimos 2 confrontos)</p>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className={cn('p-1.5 rounded text-center', idaVolta.idaOver ? 'bg-green-500/10' : 'bg-red-500/10')}>
                                  <p className="text-zinc-500 text-[10px]">Ida {melhor === 'IDA' && <span className="text-green-400">MELHOR</span>}</p>
                                  <p className={cn('text-sm font-bold', idaVolta.idaOver ? 'text-green-400' : 'text-red-400')}>{idaVolta.idaGols} gols</p>
                                  <p className={cn('text-[10px]', idaVolta.idaOver ? 'text-green-500' : 'text-red-500')}>{idaVolta.idaOver ? 'OVER' : 'UNDER'}</p>
                                </div>
                                <div className={cn('p-1.5 rounded text-center', idaVolta.voltaOver ? 'bg-green-500/10' : 'bg-red-500/10')}>
                                  <p className="text-zinc-500 text-[10px]">Volta {melhor === 'VOLTA' && <span className="text-green-400">MELHOR</span>}</p>
                                  <p className={cn('text-sm font-bold', idaVolta.voltaOver ? 'text-green-400' : 'text-red-400')}>{idaVolta.voltaGols} gols</p>
                                  <p className={cn('text-[10px]', idaVolta.voltaOver ? 'text-green-500' : 'text-red-500')}>{idaVolta.voltaOver ? 'OVER' : 'UNDER'}</p>
                                </div>
                              </div>
                              <div className={cn('mt-2 p-1.5 rounded text-[10px] font-medium', operaVolta ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
                                {operaVolta
                                  ? idaVolta.idaOver && idaVolta.voltaOver
                                    ? `OPERA — Ambos jogos Over. Ida ${idaVolta.idaGols}g, Volta ${idaVolta.voltaGols}g. Padrao consistente de gols.`
                                    : melhor === 'VOLTA'
                                    ? `OPERA COM CAUTELA — Volta (${idaVolta.voltaGols}g) foi melhor que Ida (${idaVolta.idaGols}g). Tendencia de melhora.`
                                    : `OPERA COM CAUTELA — Media de ${mediaIdaVolta.toFixed(1)} gols nos confrontos. Ida foi melhor.`
                                  : `EVITAR — ${!idaVolta.idaOver && !idaVolta.voltaOver ? 'Ambos jogos Under. Confronto fechado.' : `Volta teve apenas ${idaVolta.voltaGols} gols. Risco alto.`}`
                                }
                              </div>
                            </div>
                            );
                          })()}
                          {idaVolta && idaVolta.tipo === 'somente_ida' && (() => {
                            const operaVolta = idaVolta.idaOver;
                            return (
                            <div className="p-2 bg-zinc-900/40 rounded border border-zinc-800">
                              <p className="text-[10px] text-zinc-600 mb-1">Jogo de IDA (1 confronto registrado)</p>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className={cn('p-1.5 rounded text-center', idaVolta.idaOver ? 'bg-green-500/10' : 'bg-red-500/10')}>
                                  <p className="text-zinc-500 text-[10px]">Ida</p>
                                  <p className={cn('text-sm font-bold', idaVolta.idaOver ? 'text-green-400' : 'text-red-400')}>{idaVolta.idaGols} gols</p>
                                  <p className={cn('text-[10px]', idaVolta.idaOver ? 'text-green-500' : 'text-red-500')}>{idaVolta.idaOver ? 'OVER' : 'UNDER'}</p>
                                </div>
                                <div className="p-1.5 rounded text-center bg-zinc-800/50">
                                  <p className="text-zinc-500 text-[10px]">Volta</p>
                                  <p className="text-sm font-bold text-zinc-500">--</p>
                                  <p className="text-[10px] text-zinc-600">Pendente</p>
                                </div>
                              </div>
                              <div className={cn('mt-2 p-1.5 rounded text-[10px] font-medium', operaVolta ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20')}>
                                {operaVolta
                                  ? `OPERA — Ida teve ${idaVolta.idaGols} gols (Over). Volta tende a ter mais gols quando ida foi movimentada.`
                                  : `CAUTELA — Ida teve apenas ${idaVolta.idaGols} gols (Under). Volta pode compensar, mas sem garantia.`
                                }
                              </div>
                            </div>
                            );
                          })()}
                          {!idaVolta && h2hJogos.length === 0 && (
                            <div className="p-2 bg-zinc-900/40 rounded border border-zinc-800">
                              <p className="text-[10px] text-zinc-600 mb-1">Ida vs Volta</p>
                              <p className="text-[10px] text-zinc-500">Primeiro confronto entre esses jogadores. Sem historico de ida/volta.</p>
                              <div className="mt-1.5 p-1.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                CAUTELA — Primeiro confronto. Sem dados de ida/volta para basear decisao.
                              </div>
                            </div>
                          )}
                          {temTroia && (
                            <div className="p-2.5 bg-red-500/10 rounded border border-red-500/30">
                              <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5" /> ALERTA TROIA
                              </p>
                              <div className="mt-1.5 space-y-1">
                                {placaresRepetidos.map(([placar, count]) => (
                                  <div key={placar} className="flex items-center gap-2">
                                    <span className="text-sm font-mono font-bold text-red-300 bg-red-500/10 px-2 py-0.5 rounded">{placar}</span>
                                    <span className="text-[10px] text-red-400">repetiu {count}x nos confrontos</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-red-400/70 mt-1.5">
                                Placares repetidos podem indicar padrão viciado. Avalie com cuidado antes de entrar.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 4.7) ANÁLISE TÁTICA INDIVIDUAL */}
                  {(() => {
                    const analisarJogador = (stats: typeof j1, nome: string, outroNome: string) => {
                      const p = stats.ultimasPartidas;
                      if (p.length < 3) return null;

                      // Ida ou volta: verificar se já enfrentou o adversário recentemente
                      const confrontosRecentes = p.filter((g: any) => {
                        const adv = g.adversario.match(/\(([^)]+)\)/)?.[1] || g.adversario;
                        return adv.toLowerCase() === outroNome.toLowerCase();
                      });
                      const isVolta = confrontosRecentes.length > 0;

                      // Padrão de gols
                      const mediaGols = p.reduce((s: number, g: any) => s + g.totalGols, 0) / p.length;
                      const over25Count = p.filter((g: any) => g.totalGols > 2).length;
                      const under25Count = p.length - over25Count;
                      const bttsCount = p.filter((g: any) => g.golsPro > 0 && g.golsContra > 0).length;
                      const over25Pct = Math.round((over25Count / p.length) * 100);
                      const bttsPct = Math.round((bttsCount / p.length) * 100);
                      const golNoHTCount = p.filter((g: any) => (g.golsHT || 0) + (g.golsHTContra || 0) > 0 || (g.totalGolsHT || 0) > 0).length;
                      const golNoHTPct = Math.round((golNoHTCount / p.length) * 100);

                      // Postura ofensiva vs defensiva
                      const mediaGolsPro = p.reduce((s: number, g: any) => s + g.golsPro, 0) / p.length;
                      const mediaGolsContra = p.reduce((s: number, g: any) => s + g.golsContra, 0) / p.length;
                      const postura = mediaGolsPro >= 2.5 && mediaGolsContra >= 1.5
                        ? 'OFENSIVO_VULNERAVEL'
                        : mediaGolsPro >= 2
                        ? 'OFENSIVO'
                        : mediaGolsContra <= 0.8
                        ? 'DEFENSIVO'
                        : 'EQUILIBRADO';

                      // Tendência ML (Money Line) — vitórias, empates, derrotas recentes
                      const vitorias = p.filter((g: any) => g.resultado === 'V').length;
                      const empates = p.filter((g: any) => g.resultado === 'E').length;
                      const derrotas = p.filter((g: any) => g.resultado === 'D').length;
                      const winRate = Math.round((vitorias / p.length) * 100);

                      // Mudança tática: comparar 1o tempo vs 2o tempo
                      const golsHT = p.reduce((s: number, g: any) => s + (g.golsHT || 0), 0);
                      const gols2T = p.reduce((s: number, g: any) => s + (g.golsFT || g.golsPro) - (g.golsHT || 0), 0);
                      const pctHT = Math.round((golsHT / (golsHT + gols2T || 1)) * 100);
                      const mudancaTatica = pctHT >= 65
                        ? 'FORTE_INICIO'
                        : pctHT <= 35
                        ? 'CRESCE_NO_JOGO'
                        : 'CONSTANTE';

                      // Sequência recente (últimos 3)
                      const ultimos3 = p.slice(0, 3);
                      const seqOver = ultimos3.filter((g: any) => g.totalGols > 2).length;
                      const tendenciaRecente = seqOver >= 2 ? 'OVER' : seqOver === 0 ? 'UNDER' : 'MISTO';

                      // Padrões avançados
                      const golsArray = p.map((g: any) => g.totalGols);
                      const golsProArray = p.map((g: any) => g.golsPro);
                      const golsContraArray = p.map((g: any) => g.golsContra);

                      // Streak (sequência atual)
                      let streakOver = 0;
                      let streakUnder = 0;
                      let streakWin = 0;
                      let streakLoss = 0;
                      for (const g of p) {
                        if (g.totalGols > 2) { streakOver++; } else break;
                      }
                      if (streakOver === 0) {
                        for (const g of p) {
                          if (g.totalGols <= 2) { streakUnder++; } else break;
                        }
                      }
                      for (const g of p) {
                        if (g.resultado === 'V') { streakWin++; } else break;
                      }
                      if (streakWin === 0) {
                        for (const g of p) {
                          if (g.resultado === 'D') { streakLoss++; } else break;
                        }
                      }

                      // Anomalias: jogos fora do padrão (gols > media + 2 ou gols = 0)
                      const anomalias = p.filter((g: any) => g.totalGols >= mediaGols + 3 || g.totalGols === 0).length;
                      const anomaliaPct = Math.round((anomalias / p.length) * 100);

                      // Padrão de placar: placares mais frequentes
                      const placarFreq: Record<string, number> = {};
                      p.forEach((g: any) => {
                        const pl = `${g.golsPro}-${g.golsContra}`;
                        placarFreq[pl] = (placarFreq[pl] || 0) + 1;
                      });
                      const placarMaisFreq = Object.entries(placarFreq).sort(([,a], [,b]) => b - a).slice(0, 2);

                      // Variância de gols (consistência)
                      const variancia = golsArray.reduce((s: number, g: number) => s + Math.pow(g - mediaGols, 2), 0) / p.length;
                      const desvio = Math.sqrt(variancia);
                      const consistencia = desvio <= 0.8 ? 'ALTA' : desvio <= 1.5 ? 'MEDIA' : 'BAIXA';

                      // Tendência crescente ou decrescente (últimos 5 vs anteriores)
                      const metade1 = p.slice(0, Math.floor(p.length / 2));
                      const metade2 = p.slice(Math.floor(p.length / 2));
                      const mediaRecente = metade1.length > 0 ? metade1.reduce((s: number, g: any) => s + g.totalGols, 0) / metade1.length : 0;
                      const mediaAntiga = metade2.length > 0 ? metade2.reduce((s: number, g: any) => s + g.totalGols, 0) / metade2.length : 0;
                      const tendenciaGols = mediaRecente > mediaAntiga + 0.5 ? 'SUBINDO' : mediaRecente < mediaAntiga - 0.5 ? 'CAINDO' : 'ESTAVEL';

                      // Clean sheet e goleadas
                      const cleanSheets = p.filter((g: any) => g.golsContra === 0).length;
                      const goleadas = p.filter((g: any) => Math.abs(g.golsPro - g.golsContra) >= 3).length;

                      return {
                        isVolta, mediaGols: mediaGols.toFixed(1), over25Pct, bttsPct, golNoHTPct,
                        postura, mediaGolsPro: mediaGolsPro.toFixed(1), mediaGolsContra: mediaGolsContra.toFixed(1),
                        vitorias, empates, derrotas, winRate,
                        mudancaTatica, pctHT, tendenciaRecente, totalJogos: p.length,
                        streakOver, streakUnder, streakWin, streakLoss,
                        anomaliaPct, anomalias, placarMaisFreq, consistencia, desvio: desvio.toFixed(1),
                        tendenciaGols, mediaRecente: mediaRecente.toFixed(1), mediaAntiga: mediaAntiga.toFixed(1),
                        cleanSheets, goleadas,
                      };
                    };

                    const analiseJ1 = analisarJogador(j1, nomeJ1, nomeJ2);
                    const analiseJ2 = analisarJogador(j2, nomeJ2, nomeJ1);

                    if (!analiseJ1 || !analiseJ2) return null;

                    const posturaLabel = (p: string) => ({
                      OFENSIVO_VULNERAVEL: 'Ofensivo mas vulnerável',
                      OFENSIVO: 'Ofensivo',
                      DEFENSIVO: 'Defensivo / Retranca',
                      EQUILIBRADO: 'Equilibrado',
                    }[p] || p);

                    const posturaColor = (p: string) => ({
                      OFENSIVO_VULNERAVEL: 'text-orange-400',
                      OFENSIVO: 'text-green-400',
                      DEFENSIVO: 'text-blue-400',
                      EQUILIBRADO: 'text-zinc-400',
                    }[p] || 'text-zinc-400');

                    const taticaLabel = (t: string) => ({
                      FORTE_INICIO: 'Começa forte, recua depois',
                      CRESCE_NO_JOGO: 'Começa lento, cresce no 2T',
                      CONSTANTE: 'Ritmo constante',
                    }[t] || t);

                    const JogadorTatico = ({ nome, analise }: { nome: string; analise: any }) => (
                      <div className="p-3 bg-zinc-900/40 rounded border border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white">{nome}</span>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', posturaColor(analise.postura))}>
                            {posturaLabel(analise.postura)}
                          </span>
                        </div>
                        <div className="space-y-2 text-[11px]">
                          {/* Gols */}
                          <div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Média gols/jogo:</span>
                              <span className="text-white font-medium">{analise.mediaGols}</span>
                            </div>
                            <p className="text-[9px] text-zinc-600 mt-0.5">
                              {parseFloat(analise.mediaGols) >= 3.5 ? 'Jogos muito movimentados — forte indicativo de Over'
                                : parseFloat(analise.mediaGols) >= 2.5 ? 'Média saudável para mercados de Over 2.5'
                                : parseFloat(analise.mediaGols) >= 1.5 ? 'Média moderada — Over 1.5 mais seguro'
                                : 'Média baixa — jogos tendem a ser fechados'}
                            </p>
                          </div>

                          {/* Faz / Sofre */}
                          <div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Faz / Sofre:</span>
                              <span className="text-zinc-300">{analise.mediaGolsPro} / {analise.mediaGolsContra}</span>
                            </div>
                            <p className="text-[9px] text-zinc-600 mt-0.5">
                              {parseFloat(analise.mediaGolsPro) >= 2 && parseFloat(analise.mediaGolsContra) >= 1.5
                                ? 'Ataca muito mas sofre bastante — jogo aberto, bom para Over e BTTS'
                                : parseFloat(analise.mediaGolsPro) >= 2
                                ? 'Forte no ataque e seguro atras — pode dominar e abrir o placar'
                                : parseFloat(analise.mediaGolsContra) <= 0.8
                                ? 'Defesa solida, dificil de vazarem — cuidado com Under'
                                : 'Equilibrio entre ataque e defesa'}
                            </p>
                          </div>

                          {/* Over e BTTS */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-1.5 bg-zinc-800/50 rounded">
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Over 2.5:</span>
                                <span className={cn('font-medium', analise.over25Pct >= 60 ? 'text-green-400' : analise.over25Pct >= 40 ? 'text-yellow-400' : 'text-red-400')}>
                                  {analise.over25Pct}%
                                </span>
                              </div>
                              <p className="text-[9px] text-zinc-600 mt-0.5">
                                {analise.over25Pct >= 70 ? 'Padrao forte de Over' : analise.over25Pct >= 50 ? 'Tendencia moderada' : 'Mais Under que Over'}
                              </p>
                            </div>
                            <div className="p-1.5 bg-zinc-800/50 rounded">
                              <div className="flex justify-between">
                                <span className="text-zinc-500">BTTS:</span>
                                <span className={cn('font-medium', analise.bttsPct >= 60 ? 'text-green-400' : analise.bttsPct >= 40 ? 'text-yellow-400' : 'text-red-400')}>
                                  {analise.bttsPct}%
                                </span>
                              </div>
                              <p className="text-[9px] text-zinc-600 mt-0.5">
                                {analise.bttsPct >= 70 ? 'Ambos marcam com frequencia' : analise.bttsPct >= 50 ? 'BTTS moderado' : 'Dificil ambos marcarem'}
                              </p>
                            </div>
                          </div>

                          {/* ML */}
                          <div className="pt-1.5 border-t border-zinc-800">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">ML recente ({analise.totalJogos}j):</span>
                              <span className="text-zinc-300">
                                <span className="text-green-400">{analise.vitorias}V</span> / <span className="text-zinc-400">{analise.empates}E</span> / <span className="text-red-400">{analise.derrotas}D</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                                <div className="h-full bg-green-500" style={{ width: `${analise.winRate}%` }} />
                                <div className="h-full bg-zinc-500" style={{ width: `${Math.round((analise.empates / analise.totalJogos) * 100)}%` }} />
                                <div className="h-full bg-red-500" style={{ width: `${Math.round((analise.derrotas / analise.totalJogos) * 100)}%` }} />
                              </div>
                              <span className="text-[9px] text-zinc-500">{analise.winRate}% win</span>
                            </div>
                            <p className="text-[9px] text-zinc-600 mt-0.5">
                              {analise.winRate >= 70 ? 'Dominante — pressiona adversarios e abre jogos'
                                : analise.winRate >= 50 ? 'Vence mais do que perde — confiavel'
                                : analise.winRate >= 30 ? 'Fase irregular — resultados imprevisíveis'
                                : 'Fase ruim — pode jogar retrancado ou desmotivado'}
                            </p>
                          </div>

                          {/* Ritmo tático */}
                          <div className="pt-1.5 border-t border-zinc-800">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Ritmo tatico:</span>
                              <span className={cn('font-medium',
                                analise.mudancaTatica === 'FORTE_INICIO' ? 'text-orange-400' :
                                analise.mudancaTatica === 'CRESCE_NO_JOGO' ? 'text-blue-400' : 'text-zinc-300'
                              )}>{taticaLabel(analise.mudancaTatica)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-zinc-600">HT</span>
                              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                                <div className="h-full bg-blue-500 rounded-l-full" style={{ width: `${analise.pctHT}%` }} />
                                <div className="h-full bg-purple-500 rounded-r-full" style={{ width: `${100 - analise.pctHT}%` }} />
                              </div>
                              <span className="text-[9px] text-zinc-600">2T</span>
                            </div>
                            <p className="text-[9px] text-zinc-600 mt-0.5">
                              {analise.pctHT >= 65 ? `${analise.pctHT}% dos gols no 1T — começa agressivo e depois recua`
                                : analise.pctHT <= 35 ? `So ${analise.pctHT}% no 1T — jogo esquenta no 2o tempo`
                                : `Distribuicao equilibrada (${analise.pctHT}% HT / ${100 - analise.pctHT}% 2T)`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );

                    return (
                      <div className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700">
                        <h3 className="text-sm font-semibold text-purple-400 mb-1 flex items-center gap-2">
                          <CircleDot className="h-4 w-4" /> ANÁLISE TÁTICA
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={cn('text-[10px] px-2 py-0.5 rounded font-medium',
                            analiseJ1.isVolta || analiseJ2.isVolta
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          )}>
                            {analiseJ1.isVolta || analiseJ2.isVolta ? 'Jogo de VOLTA' : 'Jogo de IDA'}
                          </span>
                          <span className={cn('text-[10px] px-2 py-0.5 rounded',
                            analiseJ1.tendenciaRecente === 'OVER' && analiseJ2.tendenciaRecente === 'OVER'
                              ? 'bg-green-500/10 text-green-400'
                              : analiseJ1.tendenciaRecente === 'UNDER' && analiseJ2.tendenciaRecente === 'UNDER'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-zinc-700 text-zinc-400'
                          )}>
                            {analiseJ1.tendenciaRecente === 'OVER' && analiseJ2.tendenciaRecente === 'OVER'
                              ? 'Ambos em fase Over'
                              : analiseJ1.tendenciaRecente === 'UNDER' && analiseJ2.tendenciaRecente === 'UNDER'
                              ? 'Ambos em fase Under'
                              : 'Fases distintas'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <JogadorTatico nome={nomeJ1} analise={analiseJ1} />
                          <JogadorTatico nome={nomeJ2} analise={analiseJ2} />
                        </div>

                        {/* Veredito: quem leva vantagem + Over ou Under */}
                        {(() => {
                          // Pontuação para determinar favorito
                          let pontosJ1 = 0;
                          let pontosJ2 = 0;

                          // Win rate
                          if (analiseJ1.winRate > analiseJ2.winRate + 10) pontosJ1 += 2;
                          else if (analiseJ2.winRate > analiseJ1.winRate + 10) pontosJ2 += 2;

                          // Postura ofensiva
                          if (analiseJ1.postura === 'OFENSIVO' || analiseJ1.postura === 'OFENSIVO_VULNERAVEL') pontosJ1 += 1;
                          if (analiseJ2.postura === 'OFENSIVO' || analiseJ2.postura === 'OFENSIVO_VULNERAVEL') pontosJ2 += 1;

                          // Média de gols pro
                          if (parseFloat(analiseJ1.mediaGolsPro) > parseFloat(analiseJ2.mediaGolsPro) + 0.3) pontosJ1 += 1;
                          else if (parseFloat(analiseJ2.mediaGolsPro) > parseFloat(analiseJ1.mediaGolsPro) + 0.3) pontosJ2 += 1;

                          // Consistência
                          if (analiseJ1.consistencia === 'ALTA' && analiseJ2.consistencia !== 'ALTA') pontosJ1 += 1;
                          if (analiseJ2.consistencia === 'ALTA' && analiseJ1.consistencia !== 'ALTA') pontosJ2 += 1;

                          // Streak positiva
                          if (analiseJ1.streakWin >= 3) pontosJ1 += 1;
                          if (analiseJ2.streakWin >= 3) pontosJ2 += 1;
                          if (analiseJ1.streakLoss >= 3) pontosJ1 -= 1;
                          if (analiseJ2.streakLoss >= 3) pontosJ2 -= 1;

                          // Tendência de gols
                          if (analiseJ1.tendenciaGols === 'SUBINDO') pontosJ1 += 1;
                          if (analiseJ2.tendenciaGols === 'SUBINDO') pontosJ2 += 1;

                          const favorito = pontosJ1 > pontosJ2 ? nomeJ1 : pontosJ2 > pontosJ1 ? nomeJ2 : null;
                          const favPontos = Math.max(pontosJ1, pontosJ2);
                          const diffPontos = Math.abs(pontosJ1 - pontosJ2);
                          const confiancaFav = diffPontos >= 4 ? 'Alta' : diffPontos >= 2 ? 'Moderada' : 'Baixa';

                          // Over ou Under
                          let pontosOver = 0;
                          const mediaCombi = (parseFloat(analiseJ1.mediaGols) + parseFloat(analiseJ2.mediaGols)) / 2;
                          if (mediaCombi >= 3.5) pontosOver += 3;
                          else if (mediaCombi >= 2.5) pontosOver += 1;
                          else pontosOver -= 2;

                          if (analiseJ1.over25Pct >= 60) pontosOver += 1;
                          if (analiseJ2.over25Pct >= 60) pontosOver += 1;
                          if (analiseJ1.over25Pct < 40) pontosOver -= 1;
                          if (analiseJ2.over25Pct < 40) pontosOver -= 1;

                          if (analiseJ1.bttsPct >= 60 && analiseJ2.bttsPct >= 60) pontosOver += 2;
                          if (analiseJ1.tendenciaRecente === 'OVER') pontosOver += 1;
                          if (analiseJ2.tendenciaRecente === 'OVER') pontosOver += 1;
                          if (analiseJ1.tendenciaRecente === 'UNDER') pontosOver -= 1;
                          if (analiseJ2.tendenciaRecente === 'UNDER') pontosOver -= 1;

                          if (analiseJ1.postura === 'OFENSIVO_VULNERAVEL' || analiseJ2.postura === 'OFENSIVO_VULNERAVEL') pontosOver += 2;
                          if (analiseJ1.postura === 'DEFENSIVO' && analiseJ2.postura === 'DEFENSIVO') pontosOver -= 3;

                          const tendenciaJogo = pontosOver >= 4 ? 'FORTE_OVER' : pontosOver >= 2 ? 'OVER' : pontosOver <= -3 ? 'FORTE_UNDER' : pontosOver <= -1 ? 'UNDER' : 'EQUILIBRADO';

                          return (
                            <div className="mt-3 p-3 bg-gradient-to-r from-zinc-900/80 to-zinc-800/40 rounded-lg border border-zinc-700">
                              <p className="text-[10px] text-purple-400 font-semibold mb-2">Veredito da analise</p>
                              <div className="grid grid-cols-2 gap-3">
                                {/* Favorito */}
                                <div className="space-y-1.5">
                                  <p className="text-[10px] text-zinc-500">Quem leva vantagem</p>
                                  {favorito ? (
                                    <div>
                                      <p className="text-sm font-bold text-white">{favorito}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                                          <div className={cn('h-full rounded-l-full', pontosJ1 >= pontosJ2 ? 'bg-green-500' : 'bg-zinc-600')} style={{ width: `${Math.round((pontosJ1 / (pontosJ1 + pontosJ2 || 1)) * 100)}%` }} />
                                          <div className={cn('h-full rounded-r-full', pontosJ2 > pontosJ1 ? 'bg-green-500' : 'bg-zinc-600')} style={{ width: `${Math.round((pontosJ2 / (pontosJ1 + pontosJ2 || 1)) * 100)}%` }} />
                                        </div>
                                      </div>
                                      <div className="flex justify-between text-[9px] mt-0.5">
                                        <span className={pontosJ1 >= pontosJ2 ? 'text-green-400' : 'text-zinc-600'}>{nomeJ1} ({pontosJ1}pts)</span>
                                        <span className={pontosJ2 > pontosJ1 ? 'text-green-400' : 'text-zinc-600'}>{nomeJ2} ({pontosJ2}pts)</span>
                                      </div>
                                      <p className="text-[9px] text-zinc-500 mt-0.5">
                                        Confianca: <span className={cn('font-medium', confiancaFav === 'Alta' ? 'text-green-400' : confiancaFav === 'Moderada' ? 'text-yellow-400' : 'text-red-400')}>{confiancaFav}</span>
                                        {confiancaFav === 'Baixa' && ' — confronto muito equilibrado'}
                                      </p>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-sm font-bold text-yellow-400">Equilibrado</p>
                                      <p className="text-[9px] text-zinc-500">Nenhum jogador tem vantagem clara. Jogo imprevisivel.</p>
                                    </div>
                                  )}
                                </div>

                                {/* Over ou Under */}
                                <div className="space-y-1.5">
                                  <p className="text-[10px] text-zinc-500">Tendencia do confronto</p>
                                  <p className={cn('text-sm font-bold',
                                    tendenciaJogo === 'FORTE_OVER' ? 'text-green-400' :
                                    tendenciaJogo === 'OVER' ? 'text-green-500' :
                                    tendenciaJogo === 'FORTE_UNDER' ? 'text-red-400' :
                                    tendenciaJogo === 'UNDER' ? 'text-red-500' : 'text-yellow-400'
                                  )}>
                                    {tendenciaJogo === 'FORTE_OVER' ? 'Forte tendencia OVER' :
                                      tendenciaJogo === 'OVER' ? 'Tendencia OVER' :
                                      tendenciaJogo === 'FORTE_UNDER' ? 'Forte tendencia UNDER' :
                                      tendenciaJogo === 'UNDER' ? 'Tendencia UNDER' : 'Equilibrado'}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-[9px] text-red-400">Under</span>
                                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-px h-full bg-zinc-600" />
                                      </div>
                                      <div className={cn('h-full rounded-full absolute',
                                        pontosOver >= 0 ? 'bg-green-500 left-1/2' : 'bg-red-500 right-1/2'
                                      )} style={{
                                        width: `${Math.min(50, Math.abs(pontosOver) * 5)}%`,
                                        ...(pontosOver < 0 ? { right: '50%' } : {})
                                      }} />
                                    </div>
                                    <span className="text-[9px] text-green-400">Over</span>
                                  </div>
                                  <p className="text-[9px] text-zinc-500 mt-0.5">
                                    Media combinada: <span className="text-white font-medium">{mediaCombi.toFixed(1)} gols</span>
                                    {mediaCombi >= 3 && ' — favorece Over 2.5'}
                                    {mediaCombi < 2.5 && ' — favorece Under 2.5'}
                                  </p>
                                  <p className="text-[9px] text-zinc-600">
                                    {tendenciaJogo.includes('OVER')
                                      ? 'Dados apontam para jogo com gols. Over e BTTS sao opcoes validas.'
                                      : tendenciaJogo.includes('UNDER')
                                      ? 'Dados apontam para jogo fechado. Under ou mercado de poucos gols.'
                                      : 'Sem tendencia clara. Avalie outros fatores antes de entrar.'}
                                  </p>
                                </div>
                              </div>

                              {/* Onde os gols tendem a sair: HT ou FT */}
                              {(() => {
                                const pctHTJ1 = analiseJ1.pctHT;
                                const pctHTJ2 = analiseJ2.pctHT;
                                const mediaHTpct = Math.round((pctHTJ1 + pctHTJ2) / 2);
                                const media2Tpct = 100 - mediaHTpct;
                                const tempoForte = mediaHTpct >= 60 ? 'HT' : media2Tpct >= 60 ? '2T' : 'EQUILIBRADO';
                                return (
                                  <div className="mt-3 pt-3 border-t border-zinc-700">
                                    <p className="text-[10px] text-zinc-500 mb-1.5">Onde os gols tendem a sair</p>
                                    <div className="flex items-center gap-2">
                                      <span className={cn('text-xs font-bold', tempoForte === 'HT' ? 'text-blue-400' : 'text-zinc-500')}>HT</span>
                                      <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-blue-500 rounded-l-full transition-all" style={{ width: `${mediaHTpct}%` }} />
                                        <div className="h-full bg-purple-500 rounded-r-full transition-all" style={{ width: `${media2Tpct}%` }} />
                                      </div>
                                      <span className={cn('text-xs font-bold', tempoForte === '2T' ? 'text-purple-400' : 'text-zinc-500')}>FT</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] mt-1">
                                      <span className="text-blue-400">{mediaHTpct}% no 1o tempo</span>
                                      <span className="text-purple-400">{media2Tpct}% no 2o tempo</span>
                                    </div>
                                    <p className="text-[9px] text-zinc-500 mt-1">
                                      {tempoForte === 'HT'
                                        ? `Gols concentrados no HT (${mediaHTpct}%). Linhas de HT sao mais seguras — Over 0.5 HT tem boa chance.`
                                        : tempoForte === '2T'
                                        ? `Gols concentrados no 2T (${media2Tpct}%). Jogo esquenta depois do intervalo — considere entrar ao vivo.`
                                        : `Distribuicao equilibrada (${mediaHTpct}% HT / ${media2Tpct}% 2T). Gols podem sair em qualquer momento.`}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 mt-1.5 text-[9px]">
                                      <div className="flex justify-between">
                                        <span className="text-zinc-600">{nomeJ1}:</span>
                                        <span className={cn(pctHTJ1 >= 60 ? 'text-blue-400' : pctHTJ1 <= 40 ? 'text-purple-400' : 'text-zinc-500')}>
                                          {pctHTJ1}% HT / {100 - pctHTJ1}% 2T
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-zinc-600">{nomeJ2}:</span>
                                        <span className={cn(pctHTJ2 >= 60 ? 'text-blue-400' : pctHTJ2 <= 40 ? 'text-purple-400' : 'text-zinc-500')}>
                                          {pctHTJ2}% HT / {100 - pctHTJ2}% 2T
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })()}

                        {/* Padrões detectados */}
                        <div className="mt-3 space-y-2">
                          <p className="text-[10px] text-zinc-600 font-medium">Padroes detectados</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[analiseJ1, analiseJ2].map((an, idx) => {
                              const nome = idx === 0 ? nomeJ1 : nomeJ2;
                              return (
                                <div key={idx} className="p-2 bg-zinc-900/40 rounded border border-zinc-800 space-y-1">
                                  <p className="text-[10px] text-white font-medium">{nome}</p>
                                  {/* Streaks */}
                                  {an.streakOver >= 3 && (
                                    <p className="text-[9px] text-green-400">Sequencia de {an.streakOver} jogos Over seguidos</p>
                                  )}
                                  {an.streakUnder >= 3 && (
                                    <p className="text-[9px] text-red-400">Sequencia de {an.streakUnder} jogos Under seguidos</p>
                                  )}
                                  {an.streakWin >= 3 && (
                                    <p className="text-[9px] text-green-400">Embalado: {an.streakWin} vitorias seguidas</p>
                                  )}
                                  {an.streakLoss >= 3 && (
                                    <p className="text-[9px] text-red-400">Crise: {an.streakLoss} derrotas seguidas</p>
                                  )}
                                  {/* Tendência de gols */}
                                  <p className={cn('text-[9px]',
                                    an.tendenciaGols === 'SUBINDO' ? 'text-green-400' :
                                    an.tendenciaGols === 'CAINDO' ? 'text-red-400' : 'text-zinc-500'
                                  )}>
                                    {an.tendenciaGols === 'SUBINDO' ? `Gols subindo: ${an.mediaAntiga} → ${an.mediaRecente} media`
                                      : an.tendenciaGols === 'CAINDO' ? `Gols caindo: ${an.mediaAntiga} → ${an.mediaRecente} media`
                                      : `Media estavel em ${an.mediaGols} gols`}
                                  </p>
                                  {/* Consistência */}
                                  <p className={cn('text-[9px]',
                                    an.consistencia === 'ALTA' ? 'text-green-500' :
                                    an.consistencia === 'BAIXA' ? 'text-orange-400' : 'text-zinc-500'
                                  )}>
                                    {an.consistencia === 'ALTA' ? `Consistente (desvio ${an.desvio}) — resultados previsiveis`
                                      : an.consistencia === 'BAIXA' ? `Imprevisivel (desvio ${an.desvio}) — resultados oscilam muito`
                                      : `Consistencia media (desvio ${an.desvio})`}
                                  </p>
                                  {/* Placar mais frequente */}
                                  {an.placarMaisFreq.length > 0 && (
                                    <p className="text-[9px] text-zinc-500">
                                      Placar favorito: {an.placarMaisFreq.map(([pl, c]: [string, number]) => `${pl} (${c}x)`).join(', ')}
                                    </p>
                                  )}
                                  {/* Anomalias */}
                                  {an.anomaliaPct >= 20 && (
                                    <p className="text-[9px] text-orange-400">
                                      {an.anomaliaPct}% de anomalias ({an.anomalias} jogos fora do padrao)
                                    </p>
                                  )}
                                  {/* Clean sheets e goleadas */}
                                  {an.cleanSheets >= 2 && (
                                    <p className="text-[9px] text-blue-400">{an.cleanSheets} clean sheets — defesa solida</p>
                                  )}
                                  {an.goleadas >= 2 && (
                                    <p className="text-[9px] text-purple-400">{an.goleadas} goleadas — pode abrir placar largo</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Sugestões de Mercado */}
                        <div className="mt-3 p-3 bg-gradient-to-b from-purple-900/20 to-zinc-900/60 rounded border border-purple-500/30">
                          <p className="text-[10px] text-purple-400 font-semibold mb-3">🎯 Sugestoes de Mercado</p>
                          
                          {(() => {
                            const mediaTotal = parseFloat(analiseJ1.mediaGolsPro) + parseFloat(analiseJ1.mediaGolsContra) + parseFloat(analiseJ2.mediaGolsPro) + parseFloat(analiseJ2.mediaGolsContra);
                            const mediaFTCombinada = (parseFloat(analiseJ1.mediaGolsPro) + parseFloat(analiseJ2.mediaGolsPro));
                            const over25Medio = (analiseJ1.over25Pct + analiseJ2.over25Pct) / 2;
                            const bttsMedio = (analiseJ1.bttsPct + analiseJ2.bttsPct) / 2;
                            const golHT1 = analiseJ1.golNoHTPct || 0;
                            const golHT2 = analiseJ2.golNoHTPct || 0;
                            const over05HTMedio = (golHT1 + golHT2) / 2;
                            const ambosOfensivos = analiseJ1.postura === 'OFENSIVO' && analiseJ2.postura === 'OFENSIVO';
                            const ambosDefensivos = analiseJ1.postura === 'DEFENSIVO' && analiseJ2.postura === 'DEFENSIVO';
                            const streakOverForte = analiseJ1.streakOver >= 2 && analiseJ2.streakOver >= 2;
                            const streakUnderForte = analiseJ1.streakUnder >= 2 && analiseJ2.streakUnder >= 2;
                            const ambosConsistentes = analiseJ1.consistencia === 'ALTA' && analiseJ2.consistencia === 'ALTA';
                            const algumInconsistente = analiseJ1.consistencia === 'BAIXA' || analiseJ2.consistencia === 'BAIXA';

                            interface Sugestao {
                              mercado: string;
                              confianca: number;
                              stake: string;
                              motivo: string;
                              tipo: 'principal' | 'alternativa' | 'arriscada';
                            }
                            const sugestoes: Sugestao[] = [];

                            // === CENÁRIO OVER FORTE ===
                            if (mediaFTCombinada >= 4 && over25Medio >= 65) {
                              sugestoes.push({
                                mercado: 'Over 2.5 FT',
                                confianca: Math.min(95, 60 + Math.round(over25Medio - 50) + (streakOverForte ? 10 : 0) + (ambosConsistentes ? 5 : 0)),
                                stake: ambosConsistentes ? 'Normal a Alta' : 'Normal',
                                motivo: `Media combinada de ${mediaFTCombinada.toFixed(1)} gols. ${over25Medio.toFixed(0)}% Over 2.5 recente.`,
                                tipo: 'principal',
                              });
                              if (mediaFTCombinada >= 5.5) {
                                sugestoes.push({
                                  mercado: 'Over 3.5 FT',
                                  confianca: Math.min(85, 45 + Math.round((mediaFTCombinada - 4) * 10)),
                                  stake: 'Baixa a Normal',
                                  motivo: `Media alta (${mediaFTCombinada.toFixed(1)}). Potencial de goleada.`,
                                  tipo: 'alternativa',
                                });
                              }
                            } else if (mediaFTCombinada >= 3 && over25Medio >= 50) {
                              sugestoes.push({
                                mercado: 'Over 1.5 FT',
                                confianca: Math.min(90, 55 + Math.round(over25Medio - 40)),
                                stake: 'Normal',
                                motivo: `Media de ${mediaFTCombinada.toFixed(1)} gols. Linha mais segura para este cenario.`,
                                tipo: 'principal',
                              });
                            }

                            // === CENÁRIO HT ===
                            if (over05HTMedio >= 70 || (analiseJ1.mudancaTatica === 'FORTE_INICIO' && analiseJ2.mudancaTatica === 'FORTE_INICIO')) {
                              sugestoes.push({
                                mercado: 'Over 0.5 HT',
                                confianca: Math.min(92, 60 + Math.round((over05HTMedio - 50) * 0.5) + (analiseJ1.mudancaTatica === 'FORTE_INICIO' ? 5 : 0)),
                                stake: over05HTMedio >= 80 ? 'Normal a Alta' : 'Normal',
                                motivo: `${over05HTMedio.toFixed(0)}% dos jogos tem gol no HT.${analiseJ1.mudancaTatica === 'FORTE_INICIO' && analiseJ2.mudancaTatica === 'FORTE_INICIO' ? ' Ambos começam forte.' : ''}`,
                                tipo: sugestoes.length === 0 ? 'principal' : 'alternativa',
                              });
                            }

                            // === CENÁRIO BTTS ===
                            if (bttsMedio >= 55 && (ambosOfensivos || analiseJ1.postura === 'OFENSIVO_VULNERAVEL' || analiseJ2.postura === 'OFENSIVO_VULNERAVEL')) {
                              sugestoes.push({
                                mercado: 'Ambas Marcam (BTTS)',
                                confianca: Math.min(88, 50 + Math.round(bttsMedio - 40) + (ambosOfensivos ? 8 : 0)),
                                stake: bttsMedio >= 65 ? 'Normal' : 'Baixa',
                                motivo: `BTTS em ${bttsMedio.toFixed(0)}% dos jogos.${analiseJ1.postura === 'OFENSIVO_VULNERAVEL' || analiseJ2.postura === 'OFENSIVO_VULNERAVEL' ? ' Jogador ofensivo mas vulneravel — gols dos dois lados.' : ' Ambos atacam bastante.'}`,
                                tipo: sugestoes.length === 0 ? 'principal' : 'alternativa',
                              });
                            }

                            // === CENÁRIO UNDER ===
                            if (over25Medio < 40 || ambosDefensivos || streakUnderForte) {
                              sugestoes.push({
                                mercado: mediaFTCombinada < 2.5 ? 'Under 2.5 FT' : 'Under 3.5 FT',
                                confianca: Math.min(85, 50 + Math.round((100 - over25Medio) - 50) + (ambosDefensivos ? 10 : 0) + (streakUnderForte ? 8 : 0)),
                                stake: ambosDefensivos && streakUnderForte ? 'Normal' : 'Baixa a Normal',
                                motivo: `Apenas ${over25Medio.toFixed(0)}% Over 2.5.${ambosDefensivos ? ' Ambos defensivos.' : ''}${streakUnderForte ? ' Sequencia Under ativa.' : ''}`,
                                tipo: sugestoes.length === 0 ? 'principal' : 'alternativa',
                              });
                            }

                            // === CENÁRIO ML (Resultado) ===
                            if (analiseJ1.winRate >= 70 && analiseJ2.winRate <= 35) {
                              sugestoes.push({
                                mercado: `Dupla Hipotese ${nomeJ1}`,
                                confianca: Math.min(80, 50 + Math.round((analiseJ1.winRate - analiseJ2.winRate) * 0.3)),
                                stake: 'Baixa',
                                motivo: `${nomeJ1} com ${analiseJ1.winRate}% win vs ${nomeJ2} com ${analiseJ2.winRate}%.`,
                                tipo: 'arriscada',
                              });
                            } else if (analiseJ2.winRate >= 70 && analiseJ1.winRate <= 35) {
                              sugestoes.push({
                                mercado: `Dupla Hipotese ${nomeJ2}`,
                                confianca: Math.min(80, 50 + Math.round((analiseJ2.winRate - analiseJ1.winRate) * 0.3)),
                                stake: 'Baixa',
                                motivo: `${nomeJ2} com ${analiseJ2.winRate}% win vs ${nomeJ1} com ${analiseJ1.winRate}%.`,
                                tipo: 'arriscada',
                              });
                            }

                            // Se nenhuma sugestão forte
                            if (sugestoes.length === 0) {
                              sugestoes.push({
                                mercado: 'Aguardar ao vivo',
                                confianca: 0,
                                stake: 'Nenhuma',
                                motivo: 'Dados inconclusivos. Aguarde o jogo iniciar e observe o ritmo antes de entrar.',
                                tipo: 'principal',
                              });
                            }

                            // Ordenar: principal > alternativa > arriscada, depois por confiança
                            const ordem = { principal: 0, alternativa: 1, arriscada: 2 };
                            sugestoes.sort((a, b) => ordem[a.tipo] - ordem[b.tipo] || b.confianca - a.confianca);

                            return (
                              <div className="space-y-2">
                                {sugestoes.map((s, i) => (
                                  <div key={i} className={cn(
                                    'p-2.5 rounded-lg border',
                                    s.tipo === 'principal' ? 'bg-purple-500/10 border-purple-500/30' :
                                    s.tipo === 'alternativa' ? 'bg-zinc-800/50 border-zinc-700' :
                                    'bg-orange-500/5 border-orange-500/20'
                                  )}>
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-bold uppercase',
                                          s.tipo === 'principal' ? 'bg-purple-500/20 text-purple-300' :
                                          s.tipo === 'alternativa' ? 'bg-zinc-700 text-zinc-300' :
                                          'bg-orange-500/20 text-orange-300'
                                        )}>
                                          {s.tipo === 'principal' ? '★ Principal' : s.tipo === 'alternativa' ? 'Alternativa' : '⚡ Valor'}
                                        </span>
                                        <span className="text-xs font-bold text-white">{s.mercado}</span>
                                      </div>
                                      {s.confianca > 0 && (
                                        <span className={cn('text-[10px] font-bold',
                                          s.confianca >= 75 ? 'text-green-400' :
                                          s.confianca >= 55 ? 'text-yellow-400' : 'text-orange-400'
                                        )}>
                                          {s.confianca}%
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-zinc-400 leading-relaxed">{s.motivo}</p>
                                    {s.confianca > 0 && (
                                      <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px] text-zinc-600">Stake:</span>
                                          <span className={cn('text-[9px] font-medium',
                                            s.stake.includes('Alta') ? 'text-green-400' :
                                            s.stake === 'Normal' ? 'text-blue-400' : 'text-yellow-400'
                                          )}>{s.stake}</span>
                                        </div>
                                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                          <div className={cn('h-full rounded-full',
                                            s.confianca >= 75 ? 'bg-green-500' :
                                            s.confianca >= 55 ? 'bg-yellow-500' : 'bg-orange-500'
                                          )} style={{ width: `${s.confianca}%` }} />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Contexto do jogo */}
                        <div className="mt-2 p-3 bg-zinc-900/40 rounded border border-zinc-700/50">
                          <p className="text-[10px] text-zinc-500 font-semibold mb-2">📋 Contexto do jogo</p>
                          <div className="space-y-1.5">
                            {(() => {
                              const insights: { text: string; type: 'positive' | 'negative' | 'neutral' | 'warning' }[] = [];

                              if (analiseJ1.isVolta || analiseJ2.isVolta) {
                                insights.push({ text: 'Jogo de volta — jogadores ja se conhecem. Quem perdeu tende a atacar mais.', type: 'neutral' });
                              } else {
                                insights.push({ text: 'Jogo de ida — primeiro confronto recente.', type: 'neutral' });
                              }

                              if (analiseJ1.streakOver >= 3 && analiseJ2.streakOver >= 3) {
                                insights.push({ text: `Ambos em sequencia Over (${nomeJ1}: ${analiseJ1.streakOver}x, ${nomeJ2}: ${analiseJ2.streakOver}x). Momento quente!`, type: 'positive' });
                              } else if (analiseJ1.streakUnder >= 3 && analiseJ2.streakUnder >= 3) {
                                insights.push({ text: `Ambos em sequencia Under. Jogo tende a ser fechado.`, type: 'negative' });
                              }

                              if (analiseJ1.tendenciaGols === 'SUBINDO' && analiseJ2.tendenciaGols === 'SUBINDO') {
                                insights.push({ text: 'Media de gols subindo para ambos. Momento favoravel.', type: 'positive' });
                              } else if (analiseJ1.tendenciaGols === 'CAINDO' && analiseJ2.tendenciaGols === 'CAINDO') {
                                insights.push({ text: 'Media de gols caindo para ambos. Cautela.', type: 'negative' });
                              }

                              if (analiseJ1.anomaliaPct >= 30 || analiseJ2.anomaliaPct >= 30) {
                                const anomalo = analiseJ1.anomaliaPct >= 30 ? nomeJ1 : nomeJ2;
                                const pctAn = analiseJ1.anomaliaPct >= 30 ? analiseJ1.anomaliaPct : analiseJ2.anomaliaPct;
                                insights.push({ text: `${anomalo} com ${pctAn}% de anomalias — pode fugir do padrao.`, type: 'warning' });
                              }

                              if (analiseJ1.consistencia === 'BAIXA' && analiseJ2.consistencia === 'BAIXA') {
                                insights.push({ text: 'Ambos imprevisiveis. Stake minima recomendada.', type: 'warning' });
                              }

                              return insights.map((insight, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <span className={cn('text-[9px] mt-0.5 shrink-0',
                                    insight.type === 'positive' ? 'text-green-500' :
                                    insight.type === 'negative' ? 'text-red-500' :
                                    insight.type === 'warning' ? 'text-orange-500' : 'text-zinc-600'
                                  )}>
                                    {insight.type === 'positive' ? '▲' : insight.type === 'negative' ? '▼' : insight.type === 'warning' ? '!' : '—'}
                                  </span>
                                  <p className={cn('text-[10px]',
                                    insight.type === 'positive' ? 'text-zinc-300' :
                                    insight.type === 'negative' ? 'text-zinc-400' :
                                    insight.type === 'warning' ? 'text-orange-300' : 'text-zinc-500'
                                  )}>
                                    {insight.text}
                                  </p>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 6) DESEMPENHO DO MODELO */}
                  <div className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                        <Zap className="h-4 w-4" /> TAXA DE ACERTO POR LINHA
                      </h3>
                      <div className="flex gap-1">
                        {([
                          { key: 'todos', label: 'Todos' },
                          { key: 'time', label: `Por Time` },
                          { key: 'jogador', label: `Por Jogador` },
                        ] as const).map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setFiltroDesempenho(key)}
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                              filtroDesempenho === key
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-600'
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-600 mb-3">
                      {filtroDesempenho === 'todos' && `Baseado nas últimas ${totalPartidas} partidas dos dois jogadores`}
                      {filtroDesempenho === 'time' && `Filtrando jogos contra ${timeJ1} e ${timeJ2} (${totalPartidas} partidas)`}
                      {filtroDesempenho === 'jogador' && `Filtrando jogos contra ${nomeJ1} e ${nomeJ2} (${totalPartidas} partidas)`}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {/* HT */}
                      <div>
                        <p className="text-xs text-zinc-500 mb-2 font-medium">1º Tempo (HT)</p>
                        <div className="space-y-1.5">
                          {[
                            { label: 'Over 0.5 HT', check: (p: any) => (p.totalGolsHT || (p.golsHT + (p.golsHTContra || 0))) > 0 },
                            { label: 'Over 1.5 HT', check: (p: any) => (p.totalGolsHT || (p.golsHT + (p.golsHTContra || 0))) > 1 },
                            { label: 'Over 2.5 HT', check: (p: any) => (p.totalGolsHT || (p.golsHT + (p.golsHTContra || 0))) > 2 },
                            { label: 'Over 3.5 HT', check: (p: any) => (p.totalGolsHT || (p.golsHT + (p.golsHTContra || 0))) > 3 },
                          ].map(({ label, check }) => {
                            const hits = todasPartidas.filter(check).length;
                            const pct = totalPartidas > 0 ? Math.round((hits / totalPartidas) * 100) : 0;
                            const isRecomendado = a.mercado.linhaSegura === label;
                            return (
                              <div key={label} className={cn('flex items-center gap-2 text-[11px] px-2 py-1 rounded', isRecomendado ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-zinc-900/30')}>
                                <span className={cn('w-20', isRecomendado ? 'text-purple-300 font-medium' : 'text-zinc-400')}>{label}</span>
                                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                  <div className={cn('h-full rounded-full', pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${pct}%` }} />
                                </div>
                                <span className={cn('font-bold w-10 text-right', pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400')}>{hits}/{totalPartidas}</span>
                                <span className="text-zinc-600 w-8 text-right">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* FT */}
                      <div>
                        <p className="text-xs text-zinc-500 mb-2 font-medium">Final (FT)</p>
                        <div className="space-y-1.5">
                          {[
                            { label: 'Over 1.5 FT', check: (p: any) => p.totalGols > 1 },
                            { label: 'Over 2.5 FT', check: (p: any) => p.totalGols > 2 },
                            { label: 'Over 3.5 FT', check: (p: any) => p.totalGols > 3 },
                            { label: 'Over 4.5 FT', check: (p: any) => p.totalGols > 4 },
                          ].map(({ label, check }) => {
                            const hits = todasPartidas.filter(check).length;
                            const pct = totalPartidas > 0 ? Math.round((hits / totalPartidas) * 100) : 0;
                            const isRecomendado = a.mercado.linhaSegura === label;
                            return (
                              <div key={label} className={cn('flex items-center gap-2 text-[11px] px-2 py-1 rounded', isRecomendado ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-zinc-900/30')}>
                                <span className={cn('w-20', isRecomendado ? 'text-purple-300 font-medium' : 'text-zinc-400')}>{label}</span>
                                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                  <div className={cn('h-full rounded-full', pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${pct}%` }} />
                                </div>
                                <span className={cn('font-bold w-10 text-right', pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400')}>{hits}/{totalPartidas}</span>
                                <span className="text-zinc-600 w-8 text-right">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7) GESTÃO DE BANCA SUGERIDA */}
                  <div className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700">
                    <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                      <Percent className="h-4 w-4" /> GESTÃO DE BANCA SUGERIDA
                    </h3>
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-xs text-zinc-500">Stake recomendada</span>
                        <p className="text-lg font-bold text-white">{stakeBase}% <span className="text-xs text-zinc-500 font-normal">da banca</span></p>
                      </div>
                      <div className="flex-1 p-2 bg-zinc-900/50 rounded border border-zinc-800">
                        <p className="text-xs text-zinc-400">
                          {stakeBase >= 3 
                            ? 'Confiança alta. Stake padrão de 3% é adequada para esta entrada.'
                            : stakeBase >= 2
                            ? 'Confiança moderada. Stake conservadora de 2% recomendada.'
                            : 'Confiança baixa. Stake mínima de 1% ou aguardar melhor oportunidade.'}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-2">Não há garantia de ganho. Gerencie sua banca com responsabilidade.</p>
                  </div>

                  {/* Jogadores Stats + Ultimos Jogos */}
                  <div className="space-y-3">
                    <span className="text-sm text-zinc-400">Estatisticas dos Jogadores</span>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[{ stats: j1, nome: nomeJ1, outroNome: nomeJ2 }, { stats: j2, nome: nomeJ2, outroNome: nomeJ1 }].map(({ stats, nome, outroNome }, idx) => {
                      const partidasFiltradas = filtroH2H 
                        ? stats.ultimasPartidas.filter((p: any) => {
                            const adv = p.adversario.match(/\(([^)]+)\)/)?.[1] || p.adversario;
                            return adv.toLowerCase() === outroNome.toLowerCase();
                          })
                        : stats.ultimasPartidas;
                      // Recalcular stats com base nas partidas filtradas quando "So confrontos" ativo
                      const pf = partidasFiltradas;
                      const pfCount = pf.length || 1;
                      const calcStats = filtroH2H && pf.length > 0 ? {
                        mediaGolsFT: pf.reduce((s: number, p: any) => s + p.golsPro, 0) / pfCount,
                        mediaGolsHT: pf.reduce((s: number, p: any) => s + p.golsHT, 0) / pfCount,
                        mediaGolsSofridos: pf.reduce((s: number, p: any) => s + p.golsContra, 0) / pfCount,
                        percentualOver: (pf.filter((p: any) => p.totalGols > 2).length / pfCount) * 100,
                        percentualOver05HT: (pf.filter((p: any) => (p.totalGolsHT || (p.golsHT + (p.golsHTContra || 0))) > 0).length / pfCount) * 100,
                        percentualOver15HT: (pf.filter((p: any) => (p.totalGolsHT || (p.golsHT + (p.golsHTContra || 0))) > 1).length / pfCount) * 100,
                        percentualBTTS: (pf.filter((p: any) => p.btts).length / pfCount) * 100,
                        percentual0x0: (pf.filter((p: any) => p.totalGols === 0).length / pfCount) * 100,
                        fazSofre: `${(pf.reduce((s: number, p: any) => s + p.golsPro, 0) / pfCount).toFixed(1)} / ${(pf.reduce((s: number, p: any) => s + p.golsContra, 0) / pfCount).toFixed(1)}`,
                      } : {
                        mediaGolsFT: stats.mediaGolsFT,
                        mediaGolsHT: stats.mediaGolsHT,
                        mediaGolsSofridos: stats.mediaGolsSofridos,
                        percentualOver: stats.percentualOver,
                        percentualOver05HT: stats.percentualOver05HT,
                        percentualOver15HT: stats.percentualOver15HT,
                        percentualBTTS: stats.percentualBTTS,
                        percentual0x0: stats.percentual0x0,
                        fazSofre: `${stats.mediaGolsFT.toFixed(1)} / ${stats.mediaGolsSofridos.toFixed(1)}`,
                      };
                      const s = calcStats;
                      // Perfil tatico
                      const perfilOfensivo = s.mediaGolsFT >= 2.5;
                      const perfilVulneravel = s.mediaGolsSofridos >= 2;
                      const perfil = perfilOfensivo && perfilVulneravel ? 'Ofensivo mas vulneravel'
                        : perfilOfensivo ? 'Ofensivo'
                        : perfilVulneravel ? 'Defensivo mas vulneravel'
                        : 'Equilibrado';
                      return (
                      <div key={idx} className="p-3 bg-zinc-800/30 rounded border border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white text-sm">{nome} {filtroH2H && <span className="text-zinc-500 text-[10px] font-normal">vs {outroNome}</span>}</span>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded',
                            perfilOfensivo ? 'text-green-400' : 'text-zinc-400'
                          )}>
                            {perfil}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
                          <div><span className="text-zinc-500">Media gols/jogo:</span> <span className="text-white">{s.mediaGolsFT.toFixed(1)}</span></div>
                          <div className="col-span-2"><span className="text-zinc-500">Faz / Sofre:</span> <span className="text-zinc-300">{s.fazSofre}</span>
                            <span className="text-zinc-600 text-[10px] ml-1">
                              {s.mediaGolsFT > s.mediaGolsSofridos + 0.5 ? '— Ataca mais' 
                                : s.mediaGolsSofridos > s.mediaGolsFT + 0.5 ? '— Sofre bastante'
                                : '— Equilibrio entre ataque e defesa'}
                            </span>
                          </div>
                        </div>
                        {filtroH2H && pf.length > 0 && (
                          <p className="text-[10px] text-zinc-500 mt-1">
                            {s.mediaGolsFT >= 2 && s.mediaGolsSofridos >= 2
                              ? 'Ataca muito mas sofre bastante — jogo aberto, bom para Over e BTTS'
                              : s.mediaGolsFT >= 2
                              ? 'Jogos muito movimentados — forte indicativo de Over'
                              : s.mediaGolsSofridos >= 2
                              ? 'Sofre muitos gols nesse confronto — adversario domina'
                              : 'Confronto equilibrado sem padrao claro'}
                          </p>
                        )}
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-1.5 bg-zinc-900/40 rounded border border-zinc-800">
                            <p className="text-zinc-600 text-[10px] mb-1">1o Tempo (HT)</p>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Gol no HT:</span>
                              <span className={cn('font-medium', s.percentualOver05HT >= 70 ? 'text-green-400' : s.percentualOver05HT >= 50 ? 'text-yellow-400' : 'text-red-400')}>{s.percentualOver05HT.toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Over 1.5 HT:</span>
                              <span className={cn('font-medium', s.percentualOver15HT >= 50 ? 'text-green-400' : s.percentualOver15HT >= 30 ? 'text-yellow-400' : 'text-red-400')}>{s.percentualOver15HT.toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Media HT:</span>
                              <span className="text-zinc-300">{s.mediaGolsHT.toFixed(1)} gols</span>
                            </div>
                          </div>
                          <div className="p-1.5 bg-zinc-900/40 rounded border border-zinc-800">
                            <p className="text-zinc-600 text-[10px] mb-1">Final (FT)</p>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Over 2.5:</span>
                              <span className={cn('font-medium', s.percentualOver >= 70 ? 'text-green-400' : s.percentualOver >= 50 ? 'text-yellow-400' : 'text-red-400')}>{s.percentualOver.toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">BTTS:</span>
                              <span className={cn('font-medium', s.percentualBTTS >= 60 ? 'text-green-400' : s.percentualBTTS >= 40 ? 'text-yellow-400' : 'text-red-400')}>{s.percentualBTTS.toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Media FT:</span>
                              <span className="text-zinc-300">{s.mediaGolsFT.toFixed(1)} gols</span>
                            </div>
                          </div>
                        </div>
                        {/* ML recente */}
                        {pf.length >= 3 && (() => {
                          const v = pf.filter((p: any) => p.resultado === 'V').length;
                          const e = pf.filter((p: any) => p.resultado === 'E').length;
                          const d = pf.filter((p: any) => p.resultado === 'D').length;
                          const winRate = Math.round((v / pf.length) * 100);
                          return (
                            <div className="mt-2 text-[10px]">
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-500">ML recente ({pf.length}j):</span>
                                <span className="text-zinc-300">{v}V / {e}E / {d}D</span>
                              </div>
                              <div className="mt-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                                {v > 0 && <div className="bg-green-500 h-full" style={{ width: `${(v/pf.length)*100}%` }} />}
                                {e > 0 && <div className="bg-yellow-500 h-full" style={{ width: `${(e/pf.length)*100}%` }} />}
                                {d > 0 && <div className="bg-red-500 h-full" style={{ width: `${(d/pf.length)*100}%` }} />}
                              </div>
                              <p className="text-zinc-600 mt-0.5">{winRate}% win</p>
                              {filtroH2H && (
                                <p className="text-zinc-500 mt-0.5">
                                  {winRate >= 60 ? 'Fase boa — pode jogar mais confiante neste confronto'
                                    : winRate <= 30 ? 'Fase ruim — pode jogar retraido ou diferente do normal'
                                    : 'Fase irregular — resultados variam'}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                        <div className="mt-2 pt-2 border-t border-zinc-800 space-y-0.5">
                          <div className="flex items-center justify-between text-[10px] text-zinc-600 px-1 mb-1">
                            <span className="w-16">Ultimos jogos</span>
                            <span>HT</span>
                            <span>FT</span>
                            <span>Total</span>
                          </div>
                          {partidasFiltradas.slice(0, 5).map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-[11px] px-1 py-0.5 bg-zinc-900/30 rounded">
                              <span className="text-zinc-500 truncate w-16">{p.adversario.match(/\(([^)]+)\)/)?.[1] || p.adversario}</span>
                              <span className="text-zinc-400 font-mono">{p.golsHT}-{p.golsHTContra || 0}</span>
                              <span className={cn('font-mono font-medium', p.resultado === 'V' ? 'text-green-400' : p.resultado === 'D' ? 'text-red-400' : 'text-zinc-400')}>{p.golsPro}-{p.golsContra}</span>
                              <span className="text-zinc-500">{p.totalGols}g</span>
                            </div>
                          ))}
                          {filtroH2H && partidasFiltradas.length === 0 && (
                            <p className="text-[10px] text-zinc-600 text-center py-1">Sem confrontos</p>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                  </div>

                  {/* H2H */}
                  {a.h2h.totalJogos > 0 && (
                    <div className="p-3 bg-zinc-800/30 rounded border border-zinc-800">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-zinc-400">H2H ({a.h2h.totalJogos} jogos)</span>
                        <div className="flex items-center gap-4">
                          <span><span className="text-green-400">{a.h2h.vitoriasJ1}V</span> - <span className="text-zinc-400">{a.h2h.empates}E</span> - <span className="text-red-400">{a.h2h.vitoriasJ2}D</span></span>
                          <span className="text-zinc-500">Media: <span className="text-white">{a.h2h.mediaGolsH2H.toFixed(1)}</span></span>
                          <span className="text-zinc-500">Over 2.5: <span className="text-zinc-300">{a.h2h.over25H2H.toFixed(0)}%</span></span>
                        </div>
                      </div>
                      {a.h2h.confrontosDiretos && a.h2h.confrontosDiretos.length > 0 && (
                        <div className="space-y-0.5 mt-2 pt-2 border-t border-zinc-700">
                          {a.h2h.confrontosDiretos.slice(0, 5).map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-[11px] px-2 py-1 bg-zinc-900/50 rounded">
                              <span className="text-zinc-500 w-16">{new Date(p.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                              <span className="text-zinc-400 font-mono">{p.golsHT}-{(p.totalGolsHT || 0) - (p.golsHT || 0)}</span>
                              <span className={cn('font-mono font-medium', p.resultado === 'V' ? 'text-green-400' : p.resultado === 'D' ? 'text-red-400' : 'text-zinc-400')}>{p.golsPro}-{p.golsContra}</span>
                              <span className="text-zinc-500">{p.totalGols} gols</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
