'use client';

import { useEffect, useState, useCallback } from 'react';
import { radarApi } from '@/lib/api';
import Link from 'next/link';
import { 
  Search, Trophy, BarChart3, Radio, Clock, 
  TrendingUp, Swords, ChevronRight, Users, Activity
} from 'lucide-react';

interface Resultado {
  id: string;
  jogador1: { id: string; nome: string };
  jogador2: { id: string; nome: string };
  golsHome: number;
  golsAway: number;
  liga: string;
  dataHora: string;
}

interface RankingItem {
  id: string;
  nome: string;
  nickname: string;
  liga: string;
  mediaGolsFT: number;
  percentualOver: number;
  totalPartidas: number;
}

interface StatsGerais {
  totalPartidas: number;
  mediaGols: number;
  percentualOver25: number;
  percentualBTTS: number;
}

interface PartidaAoVivo {
  id: string;
  jogador1: { nome: string; mediaGolsFT: number; percentualOver: number; gols?: number };
  jogador2: { nome: string; mediaGolsFT: number; percentualOver: number; gols?: number };
  liga: string;
  placar?: { home: number; away: number };
  status: string;
}

const LIGA_LABELS: Record<string, string> = {
  GT_12MIN: 'GT 12min',
  GT_8MIN: 'Battle 8min',
  VOLTA_6MIN: 'Volta 6min',
  H2H: 'H2H 8min',
};

function extractNick(nome: string) {
  const m = nome.match(/\(([^)]+)\)/);
  return m ? m[1] : nome;
}

function extractTeam(nome: string) {
  const m = nome.match(/^([^(]+)/);
  return m ? m[1].trim() : nome;
}

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ESoccerPage() {
  const [busca, setBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [stats, setStats] = useState<StatsGerais | null>(null);
  const [aoVivo, setAoVivo] = useState<PartidaAoVivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'inicio' | 'ao-vivo' | 'ranking' | 'stats'>('inicio');

  // Confronto direto
  const [confrontoJ1, setConfrontoJ1] = useState('');
  const [confrontoJ2, setConfrontoJ2] = useState('');
  const [confrontoResult, setConfrontoResult] = useState<any>(null);
  const [confrontoLoading, setConfrontoLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [resRes, rankRes, statsRes, liveRes] = await Promise.all([
          radarApi.getUltimosResultados(20),
          radarApi.getRanking(20),
          radarApi.getStatsGerais(),
          radarApi.getAoVivo(),
        ]);
        setResultados(resRes.data);
        setRanking(rankRes.data);
        setStats(statsRes.data);
        setAoVivo(liveRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Polling ao vivo
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data } = await radarApi.getAoVivo();
        setAoVivo(data);
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBusca = useCallback(async (nome: string) => {
    setBusca(nome);
    if (nome.length < 2) { setResultadosBusca([]); return; }
    setBuscando(true);
    try {
      const { data } = await radarApi.buscarJogador(nome);
      setResultadosBusca(data);
    } catch {} finally {
      setBuscando(false);
    }
  }, []);

  const handleConfronto = async () => {
    if (!confrontoJ1 || !confrontoJ2) return;
    setConfrontoLoading(true);
    try {
      const { data } = await radarApi.getConfrontoDireto(confrontoJ1, confrontoJ2);
      setConfrontoResult(data);
    } catch {} finally {
      setConfrontoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <p className="text-zinc-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">
          <span className="text-cyan-400">eSoccer</span> Analysis
        </h1>
        <p className="text-zinc-400 text-sm">Dados em tempo real e estatisticas de eSoccer FIFA</p>
      </div>

      {/* Tabs de navegacao */}
      <div className="flex gap-2 justify-center flex-wrap">
        {[
          { key: 'inicio', label: 'Inicio', icon: Activity },
          { key: 'ao-vivo', label: 'Ao Vivo', icon: Radio },
          { key: 'ranking', label: 'Ranking', icon: Trophy },
          { key: 'stats', label: 'Estatisticas', icon: BarChart3 },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-[#1e293b] text-zinc-400 hover:bg-[#1e293b]/80 hover:text-white border border-transparent'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.key === 'ao-vivo' && aoVivo.length > 0 && (
              <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{aoVivo.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Buscar jogador */}
      <div className="bg-[#1e293b] rounded-xl p-4 border border-zinc-700/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar jogador ou time..."
            value={busca}
            onChange={(e) => handleBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#0f172a] border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        {resultadosBusca.length > 0 && (
          <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
            {resultadosBusca.map((j: any) => (
              <Link
                key={j.id}
                href={`/dashboard/esoccer/jogador/${j.id}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0f172a] hover:bg-zinc-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                    {j.nickname?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{j.nickname || j.nome}</p>
                    <p className="text-zinc-500 text-xs">{j.nome} - Media: {j.mediaGolsFT?.toFixed(1)} gols</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-cyan-400">Over: {j.percentualOver?.toFixed(0)}%</span>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
        {busca.length >= 2 && resultadosBusca.length === 0 && !buscando && (
          <p className="mt-2 text-zinc-500 text-sm text-center">Nenhum jogador encontrado</p>
        )}
      </div>

      {tab === 'inicio' && (
        <>
          {/* Stats do dia */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Partidas hoje" value={stats.totalPartidas.toString()} icon={<Clock className="h-5 w-5" />} />
              <StatCard label="Media de gols" value={stats.mediaGols.toFixed(1)} icon={<TrendingUp className="h-5 w-5" />} color="cyan" />
              <StatCard label="Over 2.5 hoje" value={`${stats.percentualOver25.toFixed(0)}%`} icon={<BarChart3 className="h-5 w-5" />} color="green" />
              <StatCard label="Ambos marcam" value={`${stats.percentualBTTS.toFixed(0)}%`} icon={<Users className="h-5 w-5" />} color="purple" />
            </div>
          )}

          {/* Jogos ao vivo (resumo) */}
          {aoVivo.length > 0 && (
            <div className="bg-[#1e293b] rounded-xl border border-zinc-700/50">
              <div className="p-4 border-b border-zinc-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <h2 className="text-white font-semibold">Jogos ao vivo</h2>
                  <span className="text-zinc-500 text-sm">({aoVivo.length})</span>
                </div>
                <button onClick={() => setTab('ao-vivo')} className="text-cyan-400 text-sm hover:underline flex items-center gap-1">
                  Ver todos <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="divide-y divide-zinc-700/30">
                {aoVivo.slice(0, 5).map(p => (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 text-right">
                      <span className="text-white text-sm font-medium">{extractNick(p.jogador1.nome)}</span>
                      <span className="text-zinc-500 text-xs block">{extractTeam(p.jogador1.nome)}</span>
                    </div>
                    <div className="px-4 text-center min-w-[80px]">
                      <span className="text-xl font-bold text-white">
                        {p.placar?.home ?? 0} - {p.placar?.away ?? 0}
                      </span>
                      <span className="block text-[10px] text-green-400 font-medium">AO VIVO</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-white text-sm font-medium">{extractNick(p.jogador2.nome)}</span>
                      <span className="text-zinc-500 text-xs block">{extractTeam(p.jogador2.nome)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confronto direto */}
          <div className="bg-[#1e293b] rounded-xl p-4 border border-zinc-700/50">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
              <Swords className="h-5 w-5 text-cyan-400" />
              Confronto direto
            </h2>
            <div className="flex gap-2 flex-col sm:flex-row">
              <input
                type="text"
                placeholder="Jogador 1 (ex: vladl3n)"
                value={confrontoJ1}
                onChange={(e) => setConfrontoJ1(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-[#0f172a] border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
              <span className="text-zinc-500 self-center text-sm font-bold">VS</span>
              <input
                type="text"
                placeholder="Jogador 2 (ex: trush99)"
                value={confrontoJ2}
                onChange={(e) => setConfrontoJ2(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-[#0f172a] border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
              <button
                onClick={handleConfronto}
                disabled={confrontoLoading || !confrontoJ1 || !confrontoJ2}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {confrontoLoading ? 'Analisando...' : 'Analisar'}
              </button>
            </div>

            {confrontoResult && confrontoResult.encontrado && (
              <div className="mt-4 space-y-4">
                {/* Previsao IA */}
                <div className="bg-[#0f172a] rounded-lg p-4">
                  <h3 className="text-sm font-medium text-zinc-400 mb-3">Probabilidade</h3>
                  <div className="flex items-center gap-2">
                    <div className="text-right flex-1">
                      <span className="text-white text-sm font-medium">{confrontoResult.jogador1?.nickname}</span>
                      <span className="block text-cyan-400 text-lg font-bold">{confrontoResult.previsao?.probVitoriaJ1}%</span>
                    </div>
                    <div className="w-full max-w-xs h-3 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className="bg-cyan-500 h-full" style={{ width: `${confrontoResult.previsao?.probVitoriaJ1}%` }} />
                      <div className="bg-zinc-600 h-full" style={{ width: `${confrontoResult.previsao?.probEmpate}%` }} />
                      <div className="bg-red-500 h-full" style={{ width: `${confrontoResult.previsao?.probVitoriaJ2}%` }} />
                    </div>
                    <div className="flex-1">
                      <span className="text-white text-sm font-medium">{confrontoResult.jogador2?.nickname}</span>
                      <span className="block text-red-400 text-lg font-bold">{confrontoResult.previsao?.probVitoriaJ2}%</span>
                    </div>
                  </div>
                  <p className="text-center text-zinc-500 text-xs mt-1">Empate: {confrontoResult.previsao?.probEmpate}%</p>
                </div>

                {/* Melhor mercado */}
                <div className="bg-[#0f172a] rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400">Melhor mercado</h3>
                    <p className="text-white font-bold text-lg">{confrontoResult.melhorMercado?.mercado}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    confrontoResult.melhorMercado?.confianca === 'Alta' ? 'bg-green-500/20 text-green-400' :
                    confrontoResult.melhorMercado?.confianca === 'Media' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    Confianca: {confrontoResult.melhorMercado?.confianca}
                  </span>
                </div>

                {/* Historico H2H */}
                {confrontoResult.confrontos?.length > 0 && (
                  <div className="bg-[#0f172a] rounded-lg p-4">
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">
                      Ultimos confrontos ({confrontoResult.totalConfrontos})
                    </h3>
                    <div className="flex gap-4 text-center mb-3">
                      <div className="flex-1">
                        <span className="text-cyan-400 text-2xl font-bold">{confrontoResult.vitoriasJ1}</span>
                        <span className="block text-zinc-500 text-xs">Vitorias {confrontoResult.jogador1?.nickname}</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-zinc-400 text-2xl font-bold">{confrontoResult.empates}</span>
                        <span className="block text-zinc-500 text-xs">Empates</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-red-400 text-2xl font-bold">{confrontoResult.vitoriasJ2}</span>
                        <span className="block text-zinc-500 text-xs">Vitorias {confrontoResult.jogador2?.nickname}</span>
                      </div>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {confrontoResult.confrontos.slice(0, 10).map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded bg-zinc-800/50 text-sm">
                          <span className="text-zinc-300">{extractNick(c.jogador1)}</span>
                          <span className="text-white font-bold">{c.golsJ1} - {c.golsJ2}</span>
                          <span className="text-zinc-300">{extractNick(c.jogador2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {confrontoResult && !confrontoResult.encontrado && (
              <p className="mt-3 text-zinc-500 text-sm text-center">Nenhum confronto encontrado entre esses jogadores</p>
            )}
          </div>

          {/* Ultimos resultados */}
          <div className="bg-[#1e293b] rounded-xl border border-zinc-700/50">
            <div className="p-4 border-b border-zinc-700/50">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                Ultimos Resultados
              </h2>
            </div>
            <div className="divide-y divide-zinc-700/30">
              {resultados.map(r => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                  <div className="flex-1 text-right">
                    <Link href={`/dashboard/esoccer/jogador/${r.jogador1.id}`} className="text-white text-sm font-medium hover:text-cyan-400 transition-colors">
                      {extractNick(r.jogador1.nome)}
                    </Link>
                    <span className="text-zinc-500 text-xs block">{extractTeam(r.jogador1.nome)}</span>
                  </div>
                  <div className="px-4 text-center min-w-[80px]">
                    <span className="text-lg font-bold text-white">{r.golsHome} - {r.golsAway}</span>
                    <span className="block text-zinc-500 text-[10px]">{formatDate(r.dataHora)}</span>
                  </div>
                  <div className="flex-1">
                    <Link href={`/dashboard/esoccer/jogador/${r.jogador2.id}`} className="text-white text-sm font-medium hover:text-cyan-400 transition-colors">
                      {extractNick(r.jogador2.nome)}
                    </Link>
                    <span className="text-zinc-500 text-xs block">{extractTeam(r.jogador2.nome)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'ao-vivo' && (
        <div className="bg-[#1e293b] rounded-xl border border-zinc-700/50">
          <div className="p-4 border-b border-zinc-700/50 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-white font-semibold">Jogos ao vivo</h2>
            <span className="text-zinc-500 text-sm">({aoVivo.length})</span>
          </div>
          {aoVivo.length === 0 ? (
            <div className="p-8 text-center">
              <Radio className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">Nenhum jogo ao vivo no momento</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-700/30">
              {aoVivo.map(p => (
                <div key={p.id} className="px-4 py-4 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-right">
                      <span className="text-white font-medium">{extractNick(p.jogador1.nome)}</span>
                      <span className="text-zinc-500 text-xs block">{extractTeam(p.jogador1.nome)}</span>
                      <span className="text-zinc-500 text-xs">Media: {p.jogador1.mediaGolsFT?.toFixed(1)}</span>
                    </div>
                    <div className="px-6 text-center">
                      <div className="text-2xl font-bold text-white">
                        {p.placar?.home ?? 0} - {p.placar?.away ?? 0}
                      </div>
                      <span className="text-green-400 text-xs font-medium">AO VIVO</span>
                      <span className="block text-zinc-500 text-[10px]">{LIGA_LABELS[p.liga] || p.liga}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-white font-medium">{extractNick(p.jogador2.nome)}</span>
                      <span className="text-zinc-500 text-xs block">{extractTeam(p.jogador2.nome)}</span>
                      <span className="text-zinc-500 text-xs">Media: {p.jogador2.mediaGolsFT?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'ranking' && (
        <div className="bg-[#1e293b] rounded-xl border border-zinc-700/50">
          <div className="p-4 border-b border-zinc-700/50">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Ranking de Jogadores
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700/50 text-zinc-500">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Jogador</th>
                  <th className="px-4 py-3 text-center">Liga</th>
                  <th className="px-4 py-3 text-center">Media gols</th>
                  <th className="px-4 py-3 text-center">Over 2.5</th>
                  <th className="px-4 py-3 text-center">Partidas</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((j, i) => (
                  <tr key={j.id} className="border-b border-zinc-700/20 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`font-bold ${i < 3 ? 'text-yellow-400' : 'text-zinc-500'}`}>{i + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/esoccer/jogador/${j.id}`} className="text-white font-medium hover:text-cyan-400 transition-colors">
                        {j.nickname}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-300">{LIGA_LABELS[j.liga] || j.liga}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-cyan-400 font-bold">{j.mediaGolsFT.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={j.percentualOver >= 65 ? 'text-green-400' : j.percentualOver >= 45 ? 'text-yellow-400' : 'text-red-400'}>
                        {j.percentualOver.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-400">{j.totalPartidas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Partidas hoje" value={stats.totalPartidas.toString()} icon={<Clock className="h-5 w-5" />} />
            <StatCard label="Media de gols" value={stats.mediaGols.toFixed(1)} icon={<TrendingUp className="h-5 w-5" />} color="cyan" />
            <StatCard label="Over 2.5 hoje" value={`${stats.percentualOver25.toFixed(0)}%`} icon={<BarChart3 className="h-5 w-5" />} color="green" />
            <StatCard label="Ambos marcam" value={`${stats.percentualBTTS.toFixed(0)}%`} icon={<Users className="h-5 w-5" />} color="purple" />
          </div>

          {/* Top ranking resumido */}
          <div className="bg-[#1e293b] rounded-xl border border-zinc-700/50 p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Top 10 Goleadores
            </h3>
            <div className="space-y-2">
              {ranking.slice(0, 10).map((j, i) => (
                <div key={j.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0f172a]">
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm w-6 ${i < 3 ? 'text-yellow-400' : 'text-zinc-500'}`}>{i + 1}</span>
                    <Link href={`/dashboard/esoccer/jogador/${j.id}`} className="text-white text-sm font-medium hover:text-cyan-400">
                      {j.nickname}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-cyan-400 font-bold">{j.mediaGolsFT.toFixed(1)} gols/jogo</span>
                    <span className="text-zinc-500">{j.totalPartidas} jogos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  const c = color ? colors[color] : 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20';

  return (
    <div className={`rounded-xl p-4 border ${c}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium opacity-70">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
