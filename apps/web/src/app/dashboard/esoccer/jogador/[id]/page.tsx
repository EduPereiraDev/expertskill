'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { radarApi } from '@/lib/api';
import Link from 'next/link';
import { 
  ArrowLeft, TrendingUp, Target, Shield, BarChart3, 
  Swords, Clock, ChevronRight, Trophy, Percent
} from 'lucide-react';

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

const LIGA_LABELS: Record<string, string> = {
  GT_12MIN: 'GT 12min',
  GT_8MIN: 'Battle 8min',
  VOLTA_6MIN: 'Volta 6min',
  H2H: 'H2H 8min',
};

export default function JogadorPage() {
  const params = useParams();
  const router = useRouter();
  const [jogador, setJogador] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await radarApi.getJogadorCompleto(params.id as string);
        setJogador(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <p className="text-zinc-400">Carregando jogador...</p>
        </div>
      </div>
    );
  }

  if (!jogador) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 mb-4">Jogador nao encontrado</p>
        <button onClick={() => router.back()} className="text-cyan-400 hover:underline text-sm">Voltar</button>
      </div>
    );
  }

  const s = jogador.stats;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-[#1e293b] hover:bg-zinc-700 transition-colors">
          <ArrowLeft className="h-5 w-5 text-zinc-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{jogador.nickname}</h1>
          <p className="text-zinc-500 text-sm">{jogador.nome} - {LIGA_LABELS[jogador.liga] || jogador.liga}</p>
        </div>
      </div>

      {/* Stats principais */}
      <div className="bg-[#1e293b] rounded-xl p-5 border border-zinc-700/50">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
          Estatisticas ({s.totalJogos} jogos)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0f172a] rounded-lg p-3">
            <span className="text-zinc-500 text-xs">Vitorias</span>
            <p className="text-green-400 text-xl font-bold">{s.vitorias}</p>
          </div>
          <div className="bg-[#0f172a] rounded-lg p-3">
            <span className="text-zinc-500 text-xs">Derrotas</span>
            <p className="text-red-400 text-xl font-bold">{s.derrotas}</p>
          </div>
          <div className="bg-[#0f172a] rounded-lg p-3">
            <span className="text-zinc-500 text-xs">Media de gols</span>
            <p className="text-cyan-400 text-xl font-bold">{s.mediaGolsFT.toFixed(1)}</p>
          </div>
          <div className="bg-[#0f172a] rounded-lg p-3">
            <span className="text-zinc-500 text-xs">Media sofrida</span>
            <p className="text-orange-400 text-xl font-bold">{s.mediaGolsSofridos.toFixed(1)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-[#0f172a] rounded-lg p-3">
            <span className="text-zinc-500 text-xs">Over 2.5</span>
            <p className={`text-xl font-bold ${s.percentualOver >= 65 ? 'text-green-400' : s.percentualOver >= 45 ? 'text-yellow-400' : 'text-red-400'}`}>
              {s.percentualOver.toFixed(0)}%
            </p>
          </div>
          <div className="bg-[#0f172a] rounded-lg p-3">
            <span className="text-zinc-500 text-xs">BTTS</span>
            <p className="text-purple-400 text-xl font-bold">{s.percentualBTTS.toFixed(0)}%</p>
          </div>
          <div className="bg-[#0f172a] rounded-lg p-3">
            <span className="text-zinc-500 text-xs">Over 0.5 HT</span>
            <p className="text-cyan-400 text-xl font-bold">{s.percentualOver05HT.toFixed(0)}%</p>
          </div>
          <div className="bg-[#0f172a] rounded-lg p-3">
            <span className="text-zinc-500 text-xs">Clean sheets</span>
            <p className="text-zinc-300 text-xl font-bold">{s.percentual0x0.toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Forma recente */}
      <div className="bg-[#1e293b] rounded-xl p-5 border border-zinc-700/50">
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          Forma recente
        </h2>
        <div className="flex gap-1.5 flex-wrap">
          {jogador.formaRecente.map((r: string, i: number) => (
            <span
              key={i}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                r === 'V' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                r === 'D' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
              }`}
            >
              {r}
            </span>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-zinc-500">
          <span>Streak Over: <span className="text-cyan-400 font-medium">{s.streakOver}</span></span>
          <span>Streak Under: <span className="text-orange-400 font-medium">{s.streakUnder}</span></span>
          <span>Consistencia: <span className={`font-medium ${
            s.consistencia === 'ALTA' ? 'text-green-400' : s.consistencia === 'MEDIA' ? 'text-yellow-400' : 'text-red-400'
          }`}>{s.consistencia}</span></span>
        </div>
      </div>

      {/* Ultimos 20 jogos */}
      <div className="bg-[#1e293b] rounded-xl border border-zinc-700/50">
        <div className="p-4 border-b border-zinc-700/50">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            Ultimos {jogador.ultimasPartidas.length} jogos
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700/50 text-zinc-500 text-xs">
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Adversario</th>
                <th className="px-4 py-2 text-center">Placar</th>
                <th className="px-4 py-2 text-center">Total</th>
                <th className="px-4 py-2 text-center">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {jogador.ultimasPartidas.map((p: any, i: number) => (
                <tr key={i} className="border-b border-zinc-700/20 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-2.5 text-zinc-400 text-xs">{formatDate(p.data)}</td>
                  <td className="px-4 py-2.5 text-white">{p.adversario}</td>
                  <td className="px-4 py-2.5 text-center font-bold text-white">{p.golsPro} - {p.golsContra}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={p.totalGols > 2 ? 'text-green-400' : 'text-red-400'}>
                      {p.totalGols}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      p.resultado === 'V' ? 'bg-green-500/20 text-green-400' :
                      p.resultado === 'D' ? 'bg-red-500/20 text-red-400' :
                      'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {p.resultado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
