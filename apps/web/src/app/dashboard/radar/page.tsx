'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { radarApi, RadarPartida, Liga, AnaliseDetalhada, RadarLinhasResponse } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Radio, Lock, Check, Crown, CircleDot, Users, TrendingUp, Percent, Clock, BarChart3, Target, AlertTriangle, Zap, Flame, ShieldAlert, Octagon, Search, X, ChevronDown } from 'lucide-react';

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

const cenarioConfig = {
  JOGO_FRACO: { label: 'Anti-Jogo', icon: Octagon, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  OVER_SEGURANDO: { label: 'Over Segurando', icon: ShieldAlert, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  MELHOR_JOGO: { label: 'Jogo do Dia', icon: Flame, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
};

export default function RadarPage() {
  const { user } = useAuthStore();
  const [partidas, setPartidas] = useState<RadarPartida[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ligaSelecionada, setLigaSelecionada] = useState<Liga | 'TODAS'>('TODAS');
  const [error, setError] = useState('');
  const [analiseAberta, setAnaliseAberta] = useState<AnaliseDetalhada | null>(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const [filtroH2H, setFiltroH2H] = useState<'geral' | 'time' | 'jogador'>('geral');
  const [filtroDesempenho, setFiltroDesempenho] = useState<'todos' | 'time' | 'jogador'>('todos');
  const [buscaJogador, setBuscaJogador] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [radarLinhas, setRadarLinhas] = useState<RadarLinhasResponse | null>(null);
  const [loadingLinhas, setLoadingLinhas] = useState(false);
  const [mostrarRadarLinhas, setMostrarRadarLinhas] = useState(false);
  const [linhasSelecionadas, setLinhasSelecionadas] = useState<string[]>([]);
  const [mostrarSeletorLinhas, setMostrarSeletorLinhas] = useState(false);
  const [linhasAbertasCard, setLinhasAbertasCard] = useState<Record<string, boolean>>({});
  const [scrollToJogadores, setScrollToJogadores] = useState(false);
  const [ligaExpandida, setLigaExpandida] = useState<string | null>(null);
  const [linhasPorLiga, setLinhasPorLiga] = useState<Record<string, { melhor: { linha: string; pagou: number; total: number; taxa: number } | null; pior: { linha: string; pagou: number; total: number; taxa: number } | null }>>({});
  const jogadoresRef = useRef<HTMLDivElement>(null);

  const isPro = user?.plan === 'PRO' || user?.plan === 'EXPERT';

  const abrirAnalise = async (partidaId: string, focusJogadores = false, contexto: 'DIARIO' | 'HISTORICO' = 'DIARIO') => {
    setLoadingAnalise(true);
    setScrollToJogadores(focusJogadores);
    try {
      const { data } = await radarApi.getAnaliseDetalhada(partidaId, contexto);
      setAnaliseAberta(data);
      setFiltroH2H('geral');
    } catch (err) {
      console.error('Erro ao carregar análise:', err);
    } finally {
      setLoadingAnalise(false);
    }
  };

  const handleBuscaJogador = async (nome: string) => {
    setBuscaJogador(nome);
    if (nome.length < 2) { setResultadosBusca([]); return; }
    setLoadingBusca(true);
    try {
      const { data } = await radarApi.buscarJogador(nome);
      setResultadosBusca(data);
    } catch { setResultadosBusca([]); }
    finally { setLoadingBusca(false); }
  };

  const fetchRadarLinhas = async () => {
    setLoadingLinhas(true);
    try {
      const liga = ligaSelecionada === 'TODAS' ? undefined : ligaSelecionada;
      const { data } = await radarApi.getLinhas(liga);
      setRadarLinhas(data);
    } catch { setRadarLinhas(null); }
    finally { setLoadingLinhas(false); }
  };

  const toggleRadarLinhas = () => {
    const next = !mostrarRadarLinhas;
    setMostrarRadarLinhas(next);
    if (next) fetchRadarLinhas(); // Sempre recarrega ao abrir
  };

  const toggleLigaExpandida = async (liga: string) => {
    if (ligaExpandida === liga) { setLigaExpandida(null); return; }
    setLigaExpandida(liga);
    if (linhasPorLiga[liga]) return; // ja tem cache
    try {
      const { data } = await radarApi.getLinhas(liga as Liga);
      const linhas = data.linhas || [];
      // Filtrar linhas com total > 0 e ordenar por taxa
      const validas = linhas.filter((l: any) => l.total > 0);
      const ordenadas = [...validas].sort((a: any, b: any) => b.taxa - a.taxa);
      const melhor = ordenadas.length > 0 ? ordenadas[0] : null;
      const pior = ordenadas.length > 0 ? ordenadas[ordenadas.length - 1] : null;
      setLinhasPorLiga(prev => ({ ...prev, [liga]: { melhor, pior } }));
    } catch {
      setLinhasPorLiga(prev => ({ ...prev, [liga]: { melhor: null, pior: null } }));
    }
  };

  useEffect(() => {
    if (scrollToJogadores && analiseAberta && jogadoresRef.current) {
      setTimeout(() => {
        jogadoresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setScrollToJogadores(false);
      }, 300);
    }
  }, [scrollToJogadores, analiseAberta]);

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
    const interval = setInterval(fetchPartidas, 10000);
    return () => clearInterval(interval);
  }, [ligaSelecionada, isPro]);

  // Radar de Linha: recarregar ao mudar liga + polling 15s quando aberto
  useEffect(() => {
    if (!mostrarRadarLinhas || !isPro) return;
    fetchRadarLinhas();
    const interval = setInterval(fetchRadarLinhas, 15000);
    return () => clearInterval(interval);
  }, [ligaSelecionada, mostrarRadarLinhas, isPro]);

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

      {/* Busca de Jogador */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-zinc-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar jogador... (ex: Kril, Yerema, Fantazer)"
            value={buscaJogador}
            onChange={(e) => handleBuscaJogador(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-zinc-500 outline-none w-full"
          />
          {buscaJogador && (
            <button onClick={() => { setBuscaJogador(''); setResultadosBusca([]); }}>
              <X className="h-4 w-4 text-zinc-500 hover:text-white" />
            </button>
          )}
        </div>

        {/* Resultados da Busca */}
        {(loadingBusca || resultadosBusca.length > 0) && (
          <div className="mt-2 space-y-2">
            {loadingBusca ? (
              <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 text-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mx-auto" />
              </div>
            ) : resultadosBusca.map((j) => {
              const tendenciaConfig: Record<string, { label: string; color: string; bg: string }> = {
                OVER_FORTE: { label: 'OVER FORTE', color: 'text-green-400', bg: 'bg-green-500/10' },
                OVER: { label: 'OVER', color: 'text-green-400', bg: 'bg-green-500/10' },
                NEUTRO: { label: 'NEUTRO', color: 'text-zinc-400', bg: 'bg-zinc-800' },
                UNDER: { label: 'UNDER', color: 'text-red-400', bg: 'bg-red-500/10' },
                UNDER_FORTE: { label: 'UNDER FORTE', color: 'text-red-400', bg: 'bg-red-500/10' },
              };
              const classConfig: Record<string, { label: string; color: string }> = {
                AGRESSIVO: { label: 'Agressivo', color: 'text-red-400 border-red-500/30' },
                EQUILIBRADO: { label: 'Equilibrado', color: 'text-yellow-400 border-yellow-500/30' },
                CONTROLADOR: { label: 'Controlador', color: 'text-blue-400 border-blue-500/30' },
              };
              const t = tendenciaConfig[j.tendencia] || tendenciaConfig.NEUTRO;
              const c = classConfig[j.classificacao] || classConfig.EQUILIBRADO;
              return (
                <div key={j.id} className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{j.nome}</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', c.color)}>{c.label}</span>
                    </div>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded', t.color, t.bg)}>{t.label}</span>
                  </div>

                  {/* Stats principais */}
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <div className="text-center p-1.5 bg-zinc-800/50 rounded">
                      <p className="text-lg font-bold text-white">{j.mediaGolsFT.toFixed(1)}</p>
                      <p className="text-[10px] text-zinc-500">Media FT</p>
                    </div>
                    <div className="text-center p-1.5 bg-zinc-800/50 rounded">
                      <p className="text-lg font-bold text-white">{j.mediaGolsHT.toFixed(1)}</p>
                      <p className="text-[10px] text-zinc-500">Media HT</p>
                    </div>
                    <div className="text-center p-1.5 bg-zinc-800/50 rounded">
                      <p className={cn('text-lg font-bold', j.overPct >= 60 ? 'text-green-400' : j.overPct >= 40 ? 'text-yellow-400' : 'text-red-400')}>{j.overPct}%</p>
                      <p className="text-[10px] text-zinc-500">Over 2.5</p>
                    </div>
                    <div className="text-center p-1.5 bg-zinc-800/50 rounded">
                      <p className="text-lg font-bold text-zinc-300">{j.percentual0x0.toFixed(0)}%</p>
                      <p className="text-[10px] text-zinc-500">0x0</p>
                    </div>
                  </div>

                  {/* Barra Over vs Under */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-green-400 font-medium">Over {j.overCount}/{j.totalJogos}</span>
                      <span className="text-red-400 font-medium">Under {j.underCount}/{j.totalJogos}</span>
                    </div>
                    <div className="h-2.5 bg-red-500/30 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${j.overPct}%` }} />
                    </div>
                  </div>

                  {/* Detalhes extras */}
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">BTTS:</span>
                      <span className={cn('font-medium', j.percentualBTTS >= 60 ? 'text-green-400' : 'text-zinc-300')}>{j.percentualBTTS.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Gol HT:</span>
                      <span className={cn('font-medium', j.percentualOver05HT >= 70 ? 'text-green-400' : 'text-zinc-300')}>{j.percentualOver05HT.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Sofre:</span>
                      <span className="text-zinc-300 font-medium">{j.mediaGolsSofridos.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Sequencia */}
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[10px] text-zinc-500 mr-1">Ultimos:</span>
                    {j.sequencia.map((r: string, i: number) => (
                      <span key={i} className={cn('h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center',
                        r === 'V' ? 'bg-green-500/20 text-green-400' : r === 'D' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-700 text-zinc-400'
                      )}>{r}</span>
                    ))}
                    {j.streakOver > 0 && <span className="text-[10px] text-green-400 ml-2">{j.streakOver} Over seguidos</span>}
                    {j.streakUnder > 0 && <span className="text-[10px] text-red-400 ml-2">{j.streakUnder} Under seguidos</span>}
                  </div>

                  {/* Ultimas partidas */}
                  <div className="mt-2 space-y-0.5">
                    {j.ultimasPartidas.slice(0, 5).map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-[10px] py-0.5 border-b border-zinc-800/50 last:border-0">
                        <span className="text-zinc-500 truncate max-w-[160px]">{p.adversario}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono">{p.golsPro}-{p.golsContra}</span>
                          <span className={cn('font-medium', p.totalGols > 2 ? 'text-green-400' : 'text-red-400')}>
                            {p.totalGols > 2 ? 'Over' : 'Under'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Radar de Linha — Toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleRadarLinhas}
          className={cn(
            'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10',
            mostrarRadarLinhas && 'bg-cyan-500/10 border-cyan-500/50'
          )}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Radar de Linha
        </Button>
        {mostrarRadarLinhas && (
          <Button variant="ghost" size="sm" onClick={fetchRadarLinhas} disabled={loadingLinhas} className="text-zinc-400 hover:text-white h-7 px-2">
            <Radio className={cn('h-3.5 w-3.5', loadingLinhas && 'animate-spin')} />
          </Button>
        )}
      </div>

      {/* Radar de Linha — Conteudo */}
      {mostrarRadarLinhas && (
        <div className="space-y-4">
          {loadingLinhas && !radarLinhas ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            </div>
          ) : radarLinhas ? (
            <>
              {/* Header info */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  Baseado nas ultimas {radarLinhas.totalPartidas} partidas
                  {radarLinhas.liga !== 'TODAS' && ` (${formatLiga(radarLinhas.liga as Liga)})`}
                  {linhasSelecionadas.length > 0 && ` — ${linhasSelecionadas.length} linha(s) selecionada(s)`}
                </p>
                {linhasSelecionadas.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setLinhasSelecionadas([])} className="text-zinc-500 hover:text-white h-6 text-[10px] px-2">
                    Limpar
                  </Button>
                )}
              </div>

              {/* Seletor de linhas por categoria */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarSeletorLinhas(!mostrarSeletorLinhas)}
                  className="text-cyan-400 hover:text-cyan-300 h-7 text-xs px-2"
                >
                  <Target className="h-3.5 w-3.5 mr-1.5" />
                  {mostrarSeletorLinhas ? 'Fechar seletor' : 'Selecionar linhas para analisar'}
                </Button>

                {mostrarSeletorLinhas && (() => {
                  const categorias = [
                    { label: 'Over HT', linhas: radarLinhas.linhas.filter(l => l.linha.startsWith('Over') && l.linha.endsWith('HT')) },
                    { label: 'Over FT', linhas: radarLinhas.linhas.filter(l => l.linha.startsWith('Over') && l.linha.endsWith('FT')) },
                    { label: 'Under HT', linhas: radarLinhas.linhas.filter(l => l.linha.startsWith('Under') && l.linha.endsWith('HT')) },
                    { label: 'Under FT', linhas: radarLinhas.linhas.filter(l => l.linha.startsWith('Under') && l.linha.endsWith('FT')) },
                    { label: 'Outros', linhas: radarLinhas.linhas.filter(l => l.linha === 'BTTS') },
                  ];
                  const toggleLinha = (nome: string) => {
                    setLinhasSelecionadas(prev =>
                      prev.includes(nome) ? prev.filter(l => l !== nome) : [...prev, nome]
                    );
                  };
                  return (
                    <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-900/50 space-y-3">
                      {categorias.map(cat => (
                        <div key={cat.label}>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5">{cat.label}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cat.linhas.map(l => {
                              const selected = linhasSelecionadas.includes(l.linha);
                              return (
                                <button
                                  key={l.linha}
                                  onClick={() => toggleLinha(l.linha)}
                                  className={cn(
                                    'text-xs px-2.5 py-1.5 rounded-md border transition-all font-semibold',
                                    selected
                                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                  )}
                                >
                                  {l.linha === 'BTTS' ? 'BTTS' : l.linha.match(/[\d.]+/)?.[0] || l.linha}
                                  <span className={cn('ml-1', l.taxa >= 70 ? 'text-green-400' : l.taxa >= 50 ? 'text-yellow-400' : 'text-red-400')}>
                                    {l.taxa}%
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Cards das linhas selecionadas */}
              {linhasSelecionadas.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {radarLinhas.linhas
                    .filter(l => linhasSelecionadas.includes(l.linha))
                    .map((l) => {
                      const tendConfig = {
                        QUENTE: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', label: 'QUENTE' },
                        MORNA: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'MORNA' },
                        FRIA: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'FRIA' },
                      };
                      const tc = tendConfig[l.tendencia];
                      return (
                        <div key={l.linha} className={cn('p-3 rounded-lg border', tc.bg, tc.border)}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-white">{l.linha}</span>
                            <div className="flex items-center gap-1.5">
                              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', tc.text, tc.bg)}>{tc.label}</span>
                              <button onClick={() => setLinhasSelecionadas(prev => prev.filter(x => x !== l.linha))} className="text-zinc-500 hover:text-white">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className={cn('text-3xl font-black', l.taxa >= 70 ? 'text-green-400' : l.taxa >= 50 ? 'text-yellow-400' : 'text-red-400')}>{l.taxa}%</span>
                            <span className="text-xs text-zinc-500">{l.pagou}/{l.total} pagou</span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                            <div className={cn('h-full rounded-full', l.taxa >= 70 ? 'bg-green-500' : l.taxa >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${l.taxa}%` }} />
                          </div>
                          <div className="flex gap-0.5 flex-wrap mb-1.5">
                            {l.sequencia.map((r, i) => (
                              <div key={i} className={cn('h-3 w-3 rounded-sm', r === 'GREEN' ? 'bg-green-500' : 'bg-red-500')} title={`Partida ${i + 1}: ${r}`} />
                            ))}
                          </div>
                          {l.streakAtual >= 2 && (
                            <p className={cn('text-[10px] font-medium', l.streakTipo === 'GREEN' ? 'text-green-400' : 'text-red-400')}>
                              {l.streakAtual}x {l.streakTipo === 'GREEN' ? 'GREEN seguidos' : 'RED seguidos'}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Analise ao vivo das linhas selecionadas */}
              {linhasSelecionadas.length > 0 && radarLinhas.aoVivo.length > 0 && (
                <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold text-cyan-400">Ao vivo — {radarLinhas.aoVivo.length} jogos</span>
                  </div>

                  {/* Resumo por linha selecionada */}
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {linhasSelecionadas.map(nome => {
                      const pagouCount = radarLinhas.aoVivo.filter(av => av.linhasPagas.includes(nome)).length;
                      const pendenteCount = radarLinhas.aoVivo.filter(av => av.linhasPendentes.includes(nome)).length;
                      const total = radarLinhas.aoVivo.length;
                      const taxa = total > 0 ? Math.round((pagouCount / total) * 100) : 0;
                      return (
                        <div key={nome} className="flex items-center justify-between p-2 rounded bg-zinc-800/50 border border-zinc-700/50">
                          <span className="text-xs font-bold text-white">{nome}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-green-400 font-bold">{pagouCount} GREEN</span>
                            <span className="text-[10px] text-zinc-500">|</span>
                            <span className="text-[10px] text-red-400 font-bold">{pendenteCount} RED</span>
                            <span className={cn('text-[10px] font-black ml-1', taxa >= 60 ? 'text-green-400' : taxa >= 40 ? 'text-yellow-400' : 'text-red-400')}>{taxa}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Lista de jogos ao vivo — ordenados por maior probabilidade */}
                  <div className="space-y-1.5">
                    {radarLinhas.aoVivo
                      .map((av) => {
                        const pagas = linhasSelecionadas.filter(n => av.linhasPagas.includes(n));
                        const pendentes = linhasSelecionadas.filter(n => av.linhasPendentes.includes(n));
                        // Poisson: P(X > k) = 1 - sum(P(X=i), i=0..k)
                        const poisson = (k: number, lambda: number) => {
                          if (lambda <= 0) return 0;
                          let sum = 0;
                          for (let i = 0; i <= k; i++) {
                            const f = i <= 1 ? 1 : Array.from({length: i}, (_, x) => x + 1).reduce((a, b) => a * b, 1);
                            sum += (Math.pow(lambda, i) * Math.exp(-lambda)) / f;
                          }
                          return sum;
                        };
                        // Calcular prob para cada linha selecionada
                        const probs = linhasSelecionadas.map(nome => {
                          const isHT = nome.endsWith('HT');
                          const media = isHT ? av.mediaHT : av.mediaFT;
                          const numMatch = nome.match(/[\d.]+/);
                          const threshold = numMatch ? parseFloat(numMatch[0]) : 0;
                          const isOver = nome.startsWith('Over');
                          const isUnder = nome.startsWith('Under');
                          let prob = 0;
                          if (isOver) prob = Math.round((1 - poisson(Math.floor(threshold), media)) * 100);
                          else if (isUnder) prob = Math.round(poisson(Math.floor(threshold), media) * 100);
                          else if (nome === 'BTTS') prob = Math.round((1 - poisson(0, av.mediaFT / 2)) * (1 - poisson(0, av.mediaFT / 2)) * 100);
                          return { nome, prob: Math.min(99, Math.max(1, prob)) };
                        });
                        const maxProb = Math.max(...probs.map(p => p.prob));
                        return { av, pagas, pendentes, probs, maxProb };
                      })
                      .sort((a, b) => b.maxProb - a.maxProb)
                      .map(({ av, pagas, pendentes, probs }) => (
                        <div key={av.partidaId} className="p-2.5 rounded-lg border border-zinc-700 bg-zinc-900/50">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-white font-medium">
                              {av.jogador1.match(/\(([^)]+)\)/)?.[1] || av.jogador1} vs {av.jogador2.match(/\(([^)]+)\)/)?.[1] || av.jogador2}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-500">Media {av.mediaFT.toFixed(1)}</span>
                              <span className="text-xs font-mono text-white">{av.placar.home}-{av.placar.away}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {probs.map(({ nome, prob }) => {
                              const pago = pagas.includes(nome);
                              return (
                                <div key={nome} className={cn(
                                  'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold',
                                  pago ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'
                                )}>
                                  {pago ? <Check className="h-2.5 w-2.5" /> : null}
                                  <span>{nome.endsWith('HT') || nome.endsWith('FT') ? nome : nome}</span>
                                  <span className={cn('font-black', prob >= 70 ? 'text-green-400' : prob >= 40 ? 'text-yellow-400' : 'text-red-400')}>
                                    {prob}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Hint quando nenhuma linha selecionada */}
              {linhasSelecionadas.length === 0 && !mostrarSeletorLinhas && (
                <p className="text-xs text-zinc-500 text-center py-2">
                  Clique em &quot;Selecionar linhas para analisar&quot; para escolher as linhas que deseja acompanhar ao vivo
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-zinc-500 text-center py-4">Erro ao carregar dados. Tente novamente.</p>
          )}
        </div>
      )}

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

      {/* Indicadores por Liga + Termometro */}
      {partidas.length > 0 && (() => {
        const ligasAtivas = ['GT_12MIN', 'VOLTA_6MIN', 'GT_8MIN', 'H2H'] as Liga[];
        const ligaStats = ligasAtivas.map(liga => {
          const jogos = partidas.filter(p => p.liga === liga);
          if (jogos.length === 0) return null;
          const mediaGols = jogos.reduce((s, p) => s + p.indicadores.mediaTotal, 0) / jogos.length;
          const overMedio = jogos.reduce((s, p) => s + p.indicadores.overMedio, 0) / jogos.length;
          const jogosFracos = jogos.filter(p => p.cenario === 'JOGO_FRACO').length;
          const jogosBons = jogos.filter(p => p.cenario === 'MELHOR_JOGO').length;
          const pctFracos = Math.round((jogosFracos / jogos.length) * 100);
          const status = mediaGols >= 5 && pctFracos < 30 ? 'QUENTE'
            : pctFracos >= 50 ? 'FRIO'
            : 'MISTO';
          return { liga, jogos: jogos.length, mediaGols, overMedio, jogosFracos, jogosBons, pctFracos, status };
        }).filter(Boolean) as any[];

        // Termometro geral
        const totalJogos = partidas.length;
        const mediaGeralGols = partidas.reduce((s, p) => s + p.indicadores.mediaTotal, 0) / totalJogos;
        const pctOperar = Math.round((partidas.filter(p => p.classificacao === 'OPERAR').length / totalJogos) * 100);
        const pctEvitar = Math.round((partidas.filter(p => p.classificacao === 'EVITAR').length / totalJogos) * 100);
        const termometro = pctOperar >= 40 ? 'OPERAR' : pctEvitar >= 50 ? 'EVITAR' : 'CAUTELA';
        const termometroLabel = termometro === 'OPERAR' ? 'Mercado Quente' : termometro === 'EVITAR' ? 'Grade Suja' : 'Mercado Misto';
        const termometroPct = termometro === 'OPERAR' ? Math.min(100, pctOperar + 30) : termometro === 'EVITAR' ? Math.max(10, 100 - pctEvitar) : 50;

        return (
          <div className="space-y-3">
            {/* Termometro do Mercado */}
            <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-400">Termometro do Mercado</span>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded',
                  termometro === 'OPERAR' ? 'text-green-400 bg-green-500/10' :
                  termometro === 'EVITAR' ? 'text-red-400 bg-red-500/10' :
                  'text-yellow-400 bg-yellow-500/10'
                )}>{termometroLabel}</span>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all',
                  termometro === 'OPERAR' ? 'bg-gradient-to-r from-green-600 to-green-400' :
                  termometro === 'EVITAR' ? 'bg-gradient-to-r from-red-600 to-red-400' :
                  'bg-gradient-to-r from-yellow-600 to-yellow-400'
                )} style={{ width: `${termometroPct}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-zinc-600">
                <span>Evitar</span>
                <span>Media {mediaGeralGols.toFixed(1)} gols | {pctOperar}% Operar | {pctEvitar}% Evitar</span>
                <span>Operar</span>
              </div>
            </div>

            {/* Indicadores por Liga */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ligaStats.map(ls => {
                const ligaLabel = ligas.find(l => l.value === ls.liga)?.label || ls.liga;
                const isExpanded = ligaExpandida === ls.liga;
                const linhasInfo = linhasPorLiga[ls.liga];
                return (
                  <div
                    key={ls.liga}
                    onClick={() => toggleLigaExpandida(ls.liga)}
                    className={cn(
                      'p-2.5 bg-zinc-900 rounded-lg border cursor-pointer transition-all',
                      isExpanded ? 'border-cyan-500/50 bg-zinc-900/80' : 'border-zinc-800 hover:border-zinc-700'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-zinc-300">{ligaLabel}</span>
                      {ls.status === 'QUENTE' && <Flame className="h-3.5 w-3.5 text-orange-400" />}
                      {ls.status === 'MISTO' && <ShieldAlert className="h-3.5 w-3.5 text-yellow-400" />}
                      {ls.status === 'FRIO' && <Octagon className="h-3.5 w-3.5 text-red-400" />}
                    </div>
                    <div className="text-lg font-bold text-white">{ls.mediaGols.toFixed(1)}<span className="text-[10px] text-zinc-500 font-normal ml-0.5">gols</span></div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      <span className="text-zinc-500">{ls.jogos}j</span>
                      <span className={cn(ls.overMedio >= 65 ? 'text-green-400' : ls.overMedio >= 45 ? 'text-yellow-400' : 'text-red-400')}>
                        {ls.overMedio.toFixed(0)}% Over
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-zinc-800 space-y-1.5">
                        {!linhasInfo ? (
                          <div className="flex items-center justify-center py-1">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                          </div>
                        ) : (
                          <>
                            {linhasInfo.melhor && (
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-green-400 font-medium">Melhor</span>
                                <span className="text-[10px] text-white font-bold">
                                  {linhasInfo.melhor.linha} <span className="text-green-400">{linhasInfo.melhor.pagou}/{linhasInfo.melhor.total}</span>
                                </span>
                              </div>
                            )}
                            {linhasInfo.pior && (
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-red-400 font-medium">Pior</span>
                                <span className="text-[10px] text-white font-bold">
                                  {linhasInfo.pior.linha} <span className="text-red-400">{linhasInfo.pior.pagou}/{linhasInfo.pior.total}</span>
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        );
      })()}

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
                      {partida.status === 'AO_VIVO' ? (
                        <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          AO VIVO
                        </span>
                      ) : partida.status === 'AGENDADA' && (
                        <span className="flex items-center gap-1.5 text-blue-400 text-xs font-medium">
                          <Clock className="h-3 w-3" />
                          PRE-LIVE
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

                  {/* Cenario */}
                  {(() => {
                    const cen = cenarioConfig[partida.cenario];
                    const CenIcon = cen.icon;
                    return (
                      <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded text-[10px] mb-2', cen.bg, 'border', cen.border)}>
                        <CenIcon className={cn('h-3 w-3', cen.color)} />
                        <span className={cn('font-medium', cen.color)}>{cen.label}</span>
                        {partida.cenarioMsg && <span className="text-zinc-500 truncate ml-1">— {partida.cenarioMsg.split('.')[0]}</span>}
                      </div>
                    );
                  })()}

                  {/* Indicadores - Linha única */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-500">Media: <span className="text-zinc-300 font-medium">{partida.indicadores.mediaTotal.toFixed(1)}</span></span>
                      <span className="text-zinc-500">Over: <span className="text-zinc-300 font-medium">{partida.indicadores.overMedio.toFixed(0)}%</span></span>
                    </div>
                    <span className={cn('font-semibold', config.text)}>
                      {partida.indicadores.probabilidadeOver25}%
                    </span>
                  </div>

                  {/* Linhas Abertas (expansível) */}
                  <div className="mt-3">
                    <button
                      onClick={() => setLinhasAbertasCard(prev => ({ ...prev, [partida.id]: !prev[partida.id] }))}
                      className="flex items-center justify-center gap-1.5 w-full text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors py-1"
                    >
                      <ChevronDown className={cn('h-3 w-3 transition-transform', linhasAbertasCard[partida.id] && 'rotate-180')} />
                      LINHAS ABERTAS
                    </button>
                    {linhasAbertasCard[partida.id] && (
                      <div className="mt-1.5 space-y-1 text-[11px]">
                        {[
                          { label: 'Over 0.5 HT', pct: ((partida.jogador1.percentualOver + partida.jogador2.percentualOver) / 2 * 0.85) },
                          { label: 'Over 1.5 FT', pct: ((partida.jogador1.percentualOver + partida.jogador2.percentualOver) / 2 * 0.95) },
                          { label: 'Over 2.5 FT', pct: partida.indicadores.overMedio },
                          { label: 'BTTS', pct: partida.indicadores.overMedio * 0.8 },
                        ].map(({ label, pct }) => {
                          const p = Math.min(99, Math.round(pct));
                          return (
                            <div key={label} className="flex items-center gap-2 px-2 py-1 bg-zinc-900/50 rounded">
                              <span className="text-zinc-400 w-20">{label}</span>
                              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className={cn('h-full rounded-full', p >= 65 ? 'bg-green-500' : p >= 45 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${p}%` }} />
                              </div>
                              <span className={cn('font-bold w-8 text-right', p >= 65 ? 'text-green-400' : p >= 45 ? 'text-yellow-400' : 'text-red-400')}>{p}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Botões Analisar */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                      onClick={() => abrirAnalise(partida.id, false, 'DIARIO')}
                      disabled={loadingAnalise}
                    >
                      {loadingAnalise ? 'Carregando...' : 'Analisar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                      onClick={() => abrirAnalise(partida.id, true, 'HISTORICO')}
                      disabled={loadingAnalise}
                    >
                      {loadingAnalise ? '...' : 'Analisar + Times'}
                    </Button>
                  </div>
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

            // Nomes dos times (antes do parêntese) — usar nomeCompleto que tem "Time (Nickname)"
            const timeJ1 = (j1.nomeCompleto || j1.nome).match(/^([^(]+)/)?.[1]?.trim() || j1.nome;
            const timeJ2 = (j2.nomeCompleto || j2.nome).match(/^([^(]+)/)?.[1]?.trim() || j2.nome;

            // H2H unificado (backend + nickname) — escopo compartilhado entre blocos
            const h2hJogosGlobal = a.h2h.confrontosDiretos || [];
            const j1VsJ2ByNickGlobal = j1.ultimasPartidas.filter((p: any) => {
              const adv = p.adversario.match(/\(([^)]+)\)/)?.[1] || p.adversario;
              return adv.toLowerCase() === nomeJ2.toLowerCase();
            });
            const j2VsJ1ByNickGlobal = j2.ultimasPartidas.filter((p: any) => {
              const adv = p.adversario.match(/\(([^)]+)\)/)?.[1] || p.adversario;
              return adv.toLowerCase() === nomeJ1.toLowerCase();
            });
            const h2hIdsGlobal = new Set(h2hJogosGlobal.map((p: any) => p.id));
            const confrontosNickGlobal = [...j1VsJ2ByNickGlobal, ...j2VsJ1ByNickGlobal].filter((p: any) => !h2hIdsGlobal.has(p.id));
            const todosConfrontos = [
              ...h2hJogosGlobal,
              ...confrontosNickGlobal.map((p: any) => ({ ...p, totalGols: p.totalGols ?? ((p.golsPro || 0) + (p.golsContra || 0)) })),
            ].sort((a: any, b: any) => new Date(a.data || 0).getTime() - new Date(b.data || 0).getTime());
            const idaVolta = todosConfrontos.length >= 2 ? (() => {
              const ida = todosConfrontos[todosConfrontos.length - 2];
              const volta = todosConfrontos[todosConfrontos.length - 1];
              if (!ida || !volta) return null;
              const idaGols = ida.totalGols ?? ((ida.golsPro || 0) + (ida.golsContra || 0));
              const voltaGols = volta.totalGols ?? ((volta.golsPro || 0) + (volta.golsContra || 0));
              return { tipo: 'ambos' as const, idaGols, voltaGols, idaOver: idaGols > 2, voltaOver: voltaGols > 2 };
            })() : todosConfrontos.length === 1 ? (() => {
              const ida = todosConfrontos[0];
              if (!ida) return null;
              const idaGols = ida.totalGols ?? ((ida.golsPro || 0) + (ida.golsContra || 0));
              return { tipo: 'somente_ida' as const, idaGols, voltaGols: 0, idaOver: idaGols > 2, voltaOver: false };
            })() : null;

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
                    {a.partida.status === 'AO_VIVO' ? (
                      <span className="ml-2 text-green-400 font-medium">
                        — <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse mr-1" />Ao Vivo
                      </span>
                    ) : a.partida.status === 'AGENDADA' && (
                      <span className="ml-2 text-blue-400 font-medium">— Pre-Live</span>
                    )}
                  </p>
                  {/* Filtros de contexto da analise */}
                  <div className="flex gap-1.5 px-6 pb-3">
                    {([
                      { key: 'geral' as const, label: 'Geral' },
                      { key: 'time' as const, label: 'Por time' },
                      { key: 'jogador' as const, label: 'So confrontos' },
                    ]).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setFiltroH2H(key)}
                        className={cn(
                          'px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1',
                          filtroH2H === key
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                        )}
                      >
                        {key === 'jogador' && <Users className="h-3 w-3" />}
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-600 px-6 -mt-2 pb-2">
                    {filtroH2H === 'geral' && `Stats gerais — ultimas 40 partidas de cada jogador`}
                    {filtroH2H === 'time' && `Stats por time — partidas de ${nomeJ1} vs ${timeJ2} e ${nomeJ2} vs ${timeJ1}`}
                    {filtroH2H === 'jogador' && `So confrontos diretos — ${nomeJ1} vs ${nomeJ2}`}
                  </p>
                </DialogHeader>
                <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* VEREDICTO PRINCIPAL — Bloco decisivo no topo */}
                  {a.partida.veredicto && (() => {
                    const v = a.partida.veredicto;
                    const acaoConfig = {
                      ENTRA: { bg: 'bg-green-500/10', border: 'border-green-500/40', text: 'text-green-400', glow: 'shadow-green-500/10', label: 'ENTRA' },
                      NAO_ENTRA: { bg: 'bg-red-500/10', border: 'border-red-500/40', text: 'text-red-400', glow: 'shadow-red-500/10', label: 'NAO ENTRA' },
                      ESPERA: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', text: 'text-yellow-400', glow: 'shadow-yellow-500/10', label: 'ESPERA' },
                    };
                    const ac = acaoConfig[v.acao];
                    return (
                      <div className={cn('p-4 rounded-xl border-2 shadow-lg', ac.bg, ac.border, ac.glow)}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={cn('text-2xl font-black tracking-tight', ac.text)}>{ac.label}</span>
                            {v.linha !== '--' && (
                              <span className="text-sm font-bold text-white bg-zinc-800 px-3 py-1 rounded-lg">{v.linha}</span>
                            )}
                          </div>
                          {v.confianca > 0 && (
                            <div className="text-right">
                              <p className={cn('text-2xl font-black', ac.text)}>{v.confianca}%</p>
                              <p className="text-[10px] text-zinc-500">confianca</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-zinc-300">{v.motivo}</p>
                        {v.confianca > 0 && (
                          <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all',
                              v.acao === 'ENTRA' ? 'bg-green-500' : v.acao === 'ESPERA' ? 'bg-yellow-500' : 'bg-red-500'
                            )} style={{ width: `${v.confianca}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {filtroH2H === 'jogador' && a.h2h.totalJogos === 0 && (
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
                    // todosConfrontos e idaVolta ja declarados no escopo pai
                    const placaresH2Hx = todosConfrontos.map((p: any) => `${p.golsPro}-${p.golsContra}`);
                    const placarCount: Record<string, number> = {};
                    placaresH2Hx.forEach((pl: string) => { placarCount[pl] = (placarCount[pl] || 0) + 1; });
                    const placaresRepetidos = Object.entries(placarCount).filter(([_, c]) => c >= 2);
                    // Alerta Troia so aparece se placares repetidos forem Under (soma <= 2)
                    const placaresRepetidosUnder = placaresRepetidos.filter(([placar]) => {
                      const [g1, g2] = placar.split('-').map(Number);
                      return (g1 + g2) <= 2;
                    });
                    const temTroia = placaresRepetidosUnder.length > 0;
                    const StatsCard = ({ title, stats, color }: { title: string; stats: any; color: string }) => (
                      <div className={cn('p-3 bg-zinc-900/40 rounded border', stats ? 'border-zinc-800' : 'border-zinc-800/50')}>
                        <p className={cn('text-xs font-semibold mb-2', color)}>{title}</p>
                        {stats ? (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-zinc-300 font-medium">Media gols:</span>
                              <span className="text-xl font-bold text-white">{stats.media}</span>
                            </div>
                            <div className="space-y-1.5">
                              {[
                                { label: 'Over 2.5 FT', val: stats.over25, total: stats.total, pct: stats.over25Pct },
                                { label: 'Gol no HT', val: stats.overHT, total: stats.total, pct: stats.overHTPct },
                                { label: 'Ambos marcam', val: stats.btts, total: stats.total, pct: stats.bttsPct },
                              ].map(({ label, val, total, pct }) => (
                                <div key={label} className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-300 w-24">{label}</span>
                                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className={cn('h-full rounded-full', pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className={cn('text-xs font-bold w-10 text-right', pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400')}>
                                    {val}/{total}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className={cn('text-xs font-medium mt-1 px-2 py-1 rounded',
                              stats.over25Pct >= 70 ? 'text-green-400 bg-green-500/10' 
                                : stats.over25Pct >= 50 ? 'text-yellow-400 bg-yellow-500/10'
                                : stats.over25Pct >= 30 ? 'text-zinc-400 bg-zinc-800'
                                : 'text-red-400 bg-red-500/10'
                            )}>
                              {stats.over25Pct >= 70 ? 'Forte tendencia Over neste contexto'
                                : stats.over25Pct >= 50 ? 'Tendencia moderada para Over'
                                : stats.over25Pct >= 30 ? 'Tendencia neutra — avaliar com cautela'
                                : 'Tendencia Under — cuidado com entradas Over'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500 py-4 text-center">Sem dados suficientes</p>
                        )}
                      </div>
                    );
                    // Stats gerais (todas as partidas de cada jogador)
                    const statsGeral = calcStats([...j1.ultimasPartidas, ...j2.ultimasPartidas]);

                    return (
                      <div className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700">
                        <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" /> ANÁLISE DE CONFRONTO
                        </h3>
                        <div className="space-y-3">
                          {/* GERAL: confrontos por time + por jogador */}
                          {filtroH2H === 'geral' && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <StatsCard title={`Por time: ${timeJ1} vs ${timeJ2}`} stats={statsTime} color="text-blue-400" />
                                <StatsCard title={`Por jogador: ${nomeJ1} vs ${nomeJ2}`} stats={statsPlayer} color="text-purple-400" />
                              </div>
                            </>
                          )}

                          {/* POR TIME: stats filtradas por partidas contra o time adversario */}
                          {filtroH2H === 'time' && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <StatsCard title={`${nomeJ1} vs ${timeJ2}`} stats={calcStats(j1ComTime)} color="text-blue-400" />
                                <StatsCard title={`${nomeJ2} vs ${timeJ1}`} stats={calcStats(j2ComTime)} color="text-blue-400" />
                              </div>
                              {statsTime && (
                                <StatsCard title={`${timeJ1} vs ${timeJ2} (qualquer jogador)`} stats={statsTime} color="text-cyan-400" />
                              )}
                              {!statsTime && (
                                <div className="p-2 bg-zinc-900/40 rounded border border-zinc-800">
                                  <p className="text-xs text-zinc-500 text-center py-2">Sem partidas registradas entre os times {timeJ1} e {timeJ2}</p>
                                </div>
                              )}
                            </>
                          )}

                          {/* SO CONFRONTOS: stats diretos entre os jogadores */}
                          {filtroH2H === 'jogador' && (
                            <StatsCard title={`Confronto direto: ${nomeJ1} vs ${nomeJ2}`} stats={statsPlayer} color="text-purple-400" />
                          )}

                          {/* Ida/Volta — mostra em geral e so confrontos */}
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
                          {(filtroH2H === 'geral' || filtroH2H === 'jogador') && !idaVolta && todosConfrontos.length === 0 && (
                            <div className="p-2 bg-zinc-900/40 rounded border border-zinc-800">
                              <p className="text-[10px] text-zinc-600 mb-1">Ida vs Volta</p>
                              <p className="text-[10px] text-zinc-500">Primeiro confronto entre esses jogadores. Sem historico de ida/volta.</p>
                              <div className="mt-1.5 p-1.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                CAUTELA — Primeiro confronto. Sem dados de ida/volta para basear decisao.
                              </div>
                            </div>
                          )}
                          {(filtroH2H === 'geral' || filtroH2H === 'jogador') && temTroia && (
                            <div className="p-2.5 bg-red-500/10 rounded border border-red-500/30">
                              <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5" /> ALERTA TROIA
                              </p>
                              <div className="mt-1.5 space-y-1">
                                {placaresRepetidosUnder.map(([placar, count]) => (
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


                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
