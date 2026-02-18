'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analiseApi, AnaliseDiaria, ConfrontoAnalise, JogadorRanking, JogadorSelecao, AnaliseAoVivoResult, oddsMonitorApi, HistoricoConfronto, JogadorPerfil } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  Clock,
  BarChart3,
  Users,
  Flame,
  Snowflake,
  CircleDot,
  ArrowUp,
  Sparkles,
  Eye,
  ArrowDown,
  Minus,
  Calendar,
  Radio,
  X,
  Shield,
  Trophy,
  Zap,
  ChevronRight
} from 'lucide-react';

const formatLiga = (liga: string) => {
  const ligas: Record<string, string> = {
    GT_12MIN: 'GT 12min',
    VOLTA_6MIN: 'Volta 6min',
    GT_8MIN: 'Battle 8min',
    H2H: 'H2H',
  };
  return ligas[liga] || liga;
};

const ClassificacaoBadge = ({ classificacao }: { classificacao: string }) => {
  const config = {
    OVER: { bg: 'bg-green-500/20', text: 'text-green-400', icon: ArrowUp },
    UNDER: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: ArrowDown },
    NEUTRO: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', icon: Minus },
  }[classificacao] || { bg: 'bg-zinc-500/20', text: 'text-zinc-400', icon: Minus };

  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', config.bg, config.text)}>
      <Icon className="h-3 w-3" />
      {classificacao}
    </span>
  );
};

const IndicadorHTBadge = ({ indicador }: { indicador: string }) => {
  const config = {
    GOL_PROVAVEL: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Gol HT Provável' },
    LENTO: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Início Lento' },
    NEUTRO: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: 'Neutro' },
  }[indicador] || { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: indicador };

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs', config.bg, config.text)}>
      {config.label}
    </span>
  );
};

const JogadorCard = ({ jogador, tipo, onClickJogador }: { jogador: JogadorRanking; tipo: 'over' | 'under'; onClickJogador?: (id: string) => void }) => {
  const isOver = tipo === 'over';
  return (
    <div 
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.01]',
        isOver ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40' : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
      )}
      onClick={() => onClickJogador?.(jogador.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-white">{jogador.nome}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {formatLiga(jogador.liga)}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-zinc-500">Média FT:</span>
          <span className={cn('ml-1 font-medium', isOver ? 'text-green-400' : 'text-red-400')}>
            {jogador.mediaGolsFT.toFixed(1)}
          </span>
        </div>
        <div>
          <span className="text-zinc-500">Média HT:</span>
          <span className="ml-1 text-white">{jogador.mediaGolsHT.toFixed(1)}</span>
        </div>
        <div>
          <span className="text-zinc-500">Over %:</span>
          <span className={cn('ml-1 font-medium', isOver ? 'text-green-400' : 'text-red-400')}>
            {jogador.percentualOver.toFixed(0)}%
          </span>
        </div>
        <div>
          <span className="text-zinc-500">0x0 %:</span>
          <span className="ml-1 text-white">{jogador.percentual0x0.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

const ConfrontoCard = ({ confronto, destaque }: { confronto: ConfrontoAnalise; destaque?: 'over' | 'under' | '0x0' }) => {
  const hora = new Date(confronto.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Calcular linha com valor para operar
  const mediaHT = (confronto.jogador1.mediaGolsFT + confronto.jogador2.mediaGolsFT) / 2;
  const linhasOver: { linha: string; prob: number }[] = [];
  const linhasUnder: { linha: string; prob: number }[] = [];

  if (confronto.mediaTotal >= 6) linhasOver.push({ linha: 'Over 2.5 FT', prob: confronto.probabilidadeOver25 });
  if (confronto.mediaTotal >= 4.5) linhasOver.push({ linha: 'Over 1.5 FT', prob: Math.min(99, confronto.probabilidadeOver25 + 20) });
  if (confronto.mediaTotal >= 3) linhasOver.push({ linha: 'Over 0.5 HT', prob: Math.min(99, confronto.probabilidadeOver25 + 10) });
  if (confronto.mediaTotal >= 5) linhasOver.push({ linha: 'Over 1.5 HT', prob: Math.max(30, confronto.probabilidadeOver25 - 15) });

  if (confronto.mediaTotal < 3.5) linhasUnder.push({ linha: 'Under 2.5 FT', prob: 100 - confronto.probabilidadeOver25 });
  if (confronto.mediaTotal < 4.5) linhasUnder.push({ linha: 'Under 3.5 FT', prob: Math.min(95, 100 - confronto.probabilidadeOver25 + 15) });
  if (confronto.probabilidade0x0 >= 15) linhasUnder.push({ linha: 'Under 0.5 HT', prob: Math.min(80, confronto.probabilidade0x0 * 2.5) });

  const melhorOver = linhasOver.sort((a, b) => b.prob - a.prob)[0];
  const melhorUnder = linhasUnder.sort((a, b) => b.prob - a.prob)[0];
  const linhaRecomendada = destaque === 'under' ? (melhorUnder || melhorOver) : (melhorOver || melhorUnder);

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      destaque === 'over' && 'bg-green-500/5 border-green-500/20',
      destaque === 'under' && 'bg-blue-500/5 border-blue-500/20',
      destaque === '0x0' && 'bg-zinc-500/5 border-zinc-500/20',
      !destaque && 'bg-zinc-800/50 border-zinc-700'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClassificacaoBadge classificacao={confronto.classificacao} />
          <IndicadorHTBadge indicador={confronto.indicadorHT} />
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="h-3 w-3" />
          {hora} • {formatLiga(confronto.liga)}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div className="text-center flex-1">
          <p className="font-semibold text-white">{confronto.jogador1.nome}</p>
          <p className="text-xs text-zinc-400">{confronto.jogador1.mediaGolsFT.toFixed(1)} gols</p>
        </div>
        <span className="text-zinc-600 font-bold px-3">VS</span>
        <div className="text-center flex-1">
          <p className="font-semibold text-white">{confronto.jogador2.nome}</p>
          <p className="text-xs text-zinc-400">{confronto.jogador2.mediaGolsFT.toFixed(1)} gols</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="p-2 rounded bg-zinc-800/50">
          <p className="text-lg font-bold text-white">{confronto.mediaTotal.toFixed(1)}</p>
          <p className="text-xs text-zinc-500">Media Total</p>
        </div>
        <div className="p-2 rounded bg-zinc-800/50">
          <p className={cn('text-lg font-bold', confronto.probabilidadeOver25 >= 60 ? 'text-green-400' : 'text-zinc-400')}>
            {confronto.probabilidadeOver25.toFixed(0)}%
          </p>
          <p className="text-xs text-zinc-500">Over 2.5</p>
        </div>
        <div className="p-2 rounded bg-zinc-800/50">
          <p className={cn('text-lg font-bold', confronto.probabilidade0x0 >= 20 ? 'text-cyan-400' : 'text-zinc-400')}>
            {confronto.probabilidade0x0.toFixed(0)}%
          </p>
          <p className="text-xs text-zinc-500">0x0</p>
        </div>
      </div>

      {/* Linha recomendada para operar */}
      {linhaRecomendada && (
        <div className={cn('mt-3 p-2.5 rounded-lg border text-center',
          destaque === 'under' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-green-500/10 border-green-500/30'
        )}>
          <p className="text-[10px] text-zinc-400 mb-0.5">Linha com valor</p>
          <p className={cn('text-sm font-bold', destaque === 'under' ? 'text-blue-400' : 'text-green-400')}>
            {linhaRecomendada.linha}
          </p>
          <p className="text-[10px] text-zinc-500">{linhaRecomendada.prob.toFixed(0)}% probabilidade</p>
        </div>
      )}

      {/* Todas as linhas disponiveis */}
      {(linhasOver.length > 0 || linhasUnder.length > 0) && (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {linhasOver.slice(0, 2).map(l => (
            <div key={l.linha} className="flex items-center justify-between px-2 py-1 rounded bg-green-500/5 border border-green-500/10">
              <span className="text-[10px] text-green-400">{l.linha}</span>
              <span className="text-[10px] font-bold text-green-400">{l.prob.toFixed(0)}%</span>
            </div>
          ))}
          {linhasUnder.slice(0, 2).map(l => (
            <div key={l.linha} className="flex items-center justify-between px-2 py-1 rounded bg-blue-500/5 border border-blue-500/10">
              <span className="text-[10px] text-blue-400">{l.linha}</span>
              <span className="text-[10px] font-bold text-blue-400">{l.prob.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ligasFiltro = [
  { value: 'TODAS', label: 'Todas as Ligas' },
  { value: 'GT_12MIN', label: 'GT 12min' },
  { value: 'VOLTA_6MIN', label: 'Volta 6min' },
  { value: 'GT_8MIN', label: 'Battle 8min' },
  { value: 'H2H', label: 'H2H' },
];


export default function AnalisePage() {
  const { user } = useAuthStore();
  const [analise, setAnalise] = useState<AnaliseDiaria | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [ligaSelecionada, setLigaSelecionada] = useState('TODAS');
  
  // Estado para análise ao vivo
  const [jogadores, setJogadores] = useState<JogadorSelecao[]>([]);
  const [nicknames, setNicknames] = useState<{ nickname: string; times: string[] }[]>([]);
  const [aoVivoForm, setAoVivoForm] = useState({
    jogador1Nome: '',
    jogador1Time: '',
    jogador2Nome: '',
    jogador2Time: '',
    gols1: 0,
    gols2: 0,
    minuto: 0,
    isHT: true,
  });
  const [aoVivoResult, setAoVivoResult] = useState<AnaliseAoVivoResult | null>(null);
  const [aoVivoLoading, setAoVivoLoading] = useState(false);
  const [historicoConfronto, setHistoricoConfronto] = useState<HistoricoConfronto | null>(null);

  // Estado para modal de perfil do jogador
  const [jogadorPerfil, setJogadorPerfil] = useState<JogadorPerfil | null>(null);
  const [jogadorPerfilLoading, setJogadorPerfilLoading] = useState(false);
  const [showJogadorModal, setShowJogadorModal] = useState(false);

  // Estado para análise individual
  const [individualNick, setIndividualNick] = useState('');
  const [individualTime, setIndividualTime] = useState('');
  const [individualLiga, setIndividualLiga] = useState('TODAS');
  const [individualPreview, setIndividualPreview] = useState<JogadorPerfil | null>(null);
  const [individualPreviewLoading, setIndividualPreviewLoading] = useState(false);
  const [individualHoras, setIndividualHoras] = useState<number | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchAnalise();
      fetchJogadores();
      fetchNicknames();
    }
  }, [mounted, ligaSelecionada]);

  // Atualização automática a cada 15 segundos
  useEffect(() => {
    if (!mounted) return;
    
    const fetchData = async () => {
      try {
        const liga = ligaSelecionada !== 'TODAS' ? ligaSelecionada : undefined;
        const { data } = await analiseApi.getDiaria(liga);
        setAnalise(data);
      } catch (err) {
        // Silenciar erros de atualização automática
      }
    };
    
    const interval = setInterval(fetchData, 15000);
    
    return () => clearInterval(interval);
  }, [mounted, ligaSelecionada]);

  const fetchJogadores = async () => {
    try {
      const liga = ligaSelecionada !== 'TODAS' ? ligaSelecionada as any : undefined;
      const { data } = await analiseApi.getJogadores(liga);
      setJogadores(data);
    } catch (err) {
      console.error('Erro ao carregar jogadores:', err);
    }
  };

  const fetchNicknames = async () => {
    try {
      const liga = ligaSelecionada !== 'TODAS' ? ligaSelecionada as any : undefined;
      const { data } = await analiseApi.getNicknames(liga);
      setNicknames(data);
    } catch (err) {
      console.error('Erro ao carregar nicknames:', err);
    }
  };

  const fetchIndividualPreview = async (nick: string, time: string, horas?: number) => {
    if (!nick) { setIndividualPreview(null); return; }
    const jogador = jogadores.find(j =>
      time ? j.nome === `${time} (${nick})` : j.nome.includes(`(${nick})`)
    );
    if (!jogador) { setIndividualPreview(null); return; }
    setIndividualPreviewLoading(true);
    try {
      const { data } = await analiseApi.getJogadorPerfil(jogador.id, time || undefined, horas);
      setIndividualPreview(data);
    } catch { setIndividualPreview(null); }
    finally { setIndividualPreviewLoading(false); }
  };

  const handleClickJogador = async (jogadorId: string, time?: string, horas?: number) => {
    setJogadorPerfilLoading(true);
    setShowJogadorModal(true);
    setJogadorPerfil(null);
    try {
      const { data } = await analiseApi.getJogadorPerfil(jogadorId, time, horas);
      setJogadorPerfil(data);
    } catch (err) {
      console.error('Erro ao carregar perfil do jogador:', err);
    } finally {
      setJogadorPerfilLoading(false);
    }
  };

  const handleAnalisarAoVivo = async () => {
    if (!aoVivoForm.jogador1Nome || !aoVivoForm.jogador2Nome) return;
    
    setAoVivoLoading(true);
    try {
      // Montar nome completo: Time (Nickname) ou só Nickname
      const jogador1Completo = aoVivoForm.jogador1Time 
        ? `${aoVivoForm.jogador1Time} (${aoVivoForm.jogador1Nome})`
        : aoVivoForm.jogador1Nome;
      const jogador2Completo = aoVivoForm.jogador2Time 
        ? `${aoVivoForm.jogador2Time} (${aoVivoForm.jogador2Nome})`
        : aoVivoForm.jogador2Nome;
      
      // Buscar análise de linhas
      const { data } = await analiseApi.analisarAoVivo({
        jogador1Nome: jogador1Completo,
        jogador2Nome: jogador2Completo,
        jogador1Time: aoVivoForm.jogador1Time || undefined,
        jogador2Time: aoVivoForm.jogador2Time || undefined,
        gols1: aoVivoForm.gols1,
        gols2: aoVivoForm.gols2,
        minuto: aoVivoForm.minuto,
        isHT: aoVivoForm.isHT,
      });
      setAoVivoResult(data);
      
      // Buscar histórico do confronto
      try {
        const { data: historico } = await oddsMonitorApi.getHistorico(
          aoVivoForm.jogador1Nome,
          aoVivoForm.jogador2Nome
        );
        setHistoricoConfronto(historico);
      } catch {
        setHistoricoConfronto(null);
      }
    } catch (err: any) {
      console.error('Erro ao analisar:', err);
    } finally {
      setAoVivoLoading(false);
    }
  };

  const fetchAnalise = async () => {
    try {
      setIsLoading(true);
      setError('');
      const liga = ligaSelecionada !== 'TODAS' ? ligaSelecionada : undefined;
      const { data } = await analiseApi.getDiaria(liga);
      setAnalise(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar análise');
    } finally {
      setIsLoading(false);
    }
  };

  // Aguardar montagem do componente
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  // Verificar acesso PRO+
  if (user?.plan === 'FREE') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-purple-400" />
            Análise Diária
          </h1>
          <p className="text-zinc-400">Insights avançados para suas apostas</p>
        </div>

        <Card className="border-purple-500/20">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Recurso exclusivo PRO+
              </h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                A Análise Diária oferece insights avançados como ranking de jogadores, 
                confrontos mais over/under, padrões de 0x0 e muito mais.
              </p>
              <a href="/dashboard/planos">
                <Button>Fazer Upgrade</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <p className="text-zinc-400">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
        {error}
      </div>
    );
  }

  if (!analise) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-purple-400" />
              Análise Diária
            </h1>
            <p className="text-zinc-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(analise.data).toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
          <Button variant="outline" onClick={fetchAnalise}>
            Atualizar
          </Button>
        </div>
        
        {/* Filtros de Liga */}
        <div className="flex flex-wrap gap-2">
          {ligasFiltro.map((liga) => (
            <button
              key={liga.value}
              onClick={() => setLigaSelecionada(liga.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
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

      {/* Estatísticas do Dia */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-zinc-800/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <Target className="h-4 w-4" />
              Total Partidas
            </div>
            <p className="text-2xl font-bold text-white">{analise.estatisticas.totalPartidas}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Over 2.5
            </div>
            <p className="text-2xl font-bold text-green-400">{analise.estatisticas.partidasOver25}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
              <TrendingDown className="h-4 w-4" />
              Under 2.5
            </div>
            <p className="text-2xl font-bold text-blue-400">{analise.estatisticas.partidasUnder25}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
              <Snowflake className="h-4 w-4" />
              0x0
            </div>
            <p className="text-2xl font-bold text-cyan-400">{analise.estatisticas.partidas0x0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
              <BarChart3 className="h-4 w-4" />
              Média Gols
            </div>
            <p className="text-2xl font-bold text-purple-400">{analise.estatisticas.mediaGolsDia.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Análise ao Vivo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Radio className="h-5 w-5 text-purple-400" />
            Análise ao Vivo
          </CardTitle>
          <CardDescription>Informe o placar atual e veja quais linhas foram pagas</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Formulário compacto no topo */}
          <div className="grid md:grid-cols-[1fr_1fr_auto_1fr_1fr_auto_auto_auto] gap-2 items-end mb-6 p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
            {/* Jogador 1 - Nickname */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Jogador 1</label>
              <select
                value={aoVivoForm.jogador1Nome}
                onChange={(e) => setAoVivoForm({ ...aoVivoForm, jogador1Nome: e.target.value, jogador1Time: '' })}
                className="w-full h-9 px-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
              >
                <option value="">Selecione...</option>
                {nicknames.map((n) => (
                  <option key={n.nickname} value={n.nickname}>{n.nickname}</option>
                ))}
              </select>
            </div>
            {/* Jogador 1 - Time */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Time</label>
              <select
                value={aoVivoForm.jogador1Time}
                onChange={(e) => setAoVivoForm({ ...aoVivoForm, jogador1Time: e.target.value })}
                className="w-full h-9 px-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
                disabled={!aoVivoForm.jogador1Nome}
              >
                <option value="">Todos</option>
                {nicknames.find(n => n.nickname === aoVivoForm.jogador1Nome)?.times.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <span className="text-zinc-500 pb-2">vs</span>
            {/* Jogador 2 - Nickname */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Jogador 2</label>
              <select
                value={aoVivoForm.jogador2Nome}
                onChange={(e) => setAoVivoForm({ ...aoVivoForm, jogador2Nome: e.target.value, jogador2Time: '' })}
                className="w-full h-9 px-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
              >
                <option value="">Selecione...</option>
                {nicknames.map((n) => (
                  <option key={n.nickname} value={n.nickname}>{n.nickname}</option>
                ))}
              </select>
            </div>
            {/* Jogador 2 - Time */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Time</label>
              <select
                value={aoVivoForm.jogador2Time}
                onChange={(e) => setAoVivoForm({ ...aoVivoForm, jogador2Time: e.target.value })}
                className="w-full h-9 px-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
                disabled={!aoVivoForm.jogador2Nome}
              >
                <option value="">Todos</option>
                {nicknames.find(n => n.nickname === aoVivoForm.jogador2Nome)?.times.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Placar</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={aoVivoForm.gols1}
                    onChange={(e) => setAoVivoForm({ ...aoVivoForm, gols1: parseInt(e.target.value) || 0 })}
                    className="w-12 h-9 px-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-center font-bold"
                  />
                  <span className="text-zinc-500">x</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={aoVivoForm.gols2}
                    onChange={(e) => setAoVivoForm({ ...aoVivoForm, gols2: parseInt(e.target.value) || 0 })}
                    className="w-12 h-9 px-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-center font-bold"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Min</label>
              <input
                type="number"
                min="0"
                max="90"
                value={aoVivoForm.minuto}
                onChange={(e) => setAoVivoForm({ ...aoVivoForm, minuto: parseInt(e.target.value) || 0 })}
                className="w-14 h-9 px-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-center font-bold"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                <button
                  onClick={() => setAoVivoForm({ ...aoVivoForm, isHT: true })}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-all',
                    aoVivoForm.isHT ? 'bg-purple-600 text-white' : 'bg-zinc-700 text-zinc-400'
                  )}
                >
                  HT
                </button>
                <button
                  onClick={() => setAoVivoForm({ ...aoVivoForm, isHT: false })}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-all',
                    !aoVivoForm.isHT ? 'bg-purple-600 text-white' : 'bg-zinc-700 text-zinc-400'
                  )}
                >
                  FT
                </button>
              </div>
              <Button 
                onClick={handleAnalisarAoVivo} 
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 h-7 text-xs"
                disabled={aoVivoLoading || !aoVivoForm.jogador1Nome || !aoVivoForm.jogador2Nome}
              >
                {aoVivoLoading ? '...' : 'Analisar'}
              </Button>
            </div>
          </div>

          {/* Resultado */}
          {aoVivoResult ? (
            <div className="space-y-4">
              {/* Cabeçalho com placar - compacto */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-300">{aoVivoResult.jogador1} vs {aoVivoResult.jogador2}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                    {aoVivoResult.periodo} - {aoVivoResult.minuto}'
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-white">{aoVivoResult.placar}</p>
                  <span className="text-xs text-zinc-500">({aoVivoResult.totalGols} gols)</span>
                </div>
              </div>

                  {/* Grid: Linhas + Análise lado a lado */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Linhas de Apostas - Melhorado com histórico */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Linhas de Apostas</h4>
                      {(() => {
                        const hist = aoVivoResult.historico;
                        const partidas = hist?.ultimasPartidas || [];
                        const totalH = partidas.length;

                        // Calcular taxa de acerto por linha baseado no histórico
                        const calcTaxa = (check: (p: any) => boolean) => {
                          if (totalH === 0) return { hits: 0, total: 0, pct: 0 };
                          const hits = partidas.filter(check).length;
                          return { hits, total: totalH, pct: Math.round((hits / totalH) * 100) };
                        };

                        const taxasPorLinha: Record<string, { hits: number; total: number; pct: number }> = {
                          'Over 0.5 HT': calcTaxa((p) => (p.golsHT1 + p.golsHT2) > 0),
                          'Over 1.5 HT': calcTaxa((p) => (p.golsHT1 + p.golsHT2) > 1),
                          'Over 2.5 HT': calcTaxa((p) => (p.golsHT1 + p.golsHT2) > 2),
                          'Over 1.5 FT': calcTaxa((p) => p.totalGols > 1),
                          'Over 2.5 FT': calcTaxa((p) => p.totalGols > 2),
                          'Over 3.5 FT': calcTaxa((p) => p.totalGols > 3),
                          'Over 4.5 FT': calcTaxa((p) => p.totalGols > 4),
                        };

                        // Encontrar melhor linha pendente
                        const linhasPendentes = aoVivoResult.linhasAnalisadas.filter(l => l.status === 'PENDENTE');
                        const melhorLinha = linhasPendentes.reduce((best, l) => {
                          const taxa = taxasPorLinha[l.linha];
                          if (!taxa) return best;
                          if (!best || taxa.pct > (taxasPorLinha[best.linha]?.pct || 0)) return l;
                          return best;
                        }, null as typeof linhasPendentes[0] | null);

                        return (
                          <>
                            {aoVivoResult.linhasAnalisadas.map((linha, i) => {
                              const taxa = taxasPorLinha[linha.linha];
                              const isMelhor = melhorLinha && linha.linha === melhorLinha.linha && linha.status === 'PENDENTE';
                              const confianca = taxa ? (taxa.pct >= 80 ? 'ALTA' : taxa.pct >= 60 ? 'MEDIA' : taxa.pct >= 40 ? 'BAIXA' : 'MUITO_BAIXA') : null;

                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    'p-3 rounded-lg border transition-all',
                                    linha.status === 'PAGO' && 'bg-green-950/30 border-green-500/30',
                                    linha.status === 'IMPOSSIVEL' && 'bg-red-950/20 border-red-500/20 opacity-60',
                                    linha.status === 'PENDENTE' && isMelhor && 'bg-purple-500/10 border-purple-500/40',
                                    linha.status === 'PENDENTE' && !isMelhor && 'bg-zinc-800/50 border-zinc-700',
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-white">{linha.linha}</span>
                                      {isMelhor && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500 text-white font-bold">RECOMENDADA</span>
                                      )}
                                      {linha.valorizado && !isMelhor && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/80 text-white">VALOR</span>
                                      )}
                                    </div>
                                    <span className={cn(
                                      'text-xs px-2 py-1 rounded font-bold shrink-0',
                                      linha.status === 'PAGO' && 'bg-green-600 text-white',
                                      linha.status === 'PENDENTE' && 'bg-zinc-600 text-zinc-300',
                                      linha.status === 'IMPOSSIVEL' && 'bg-red-600/50 text-red-300'
                                    )}>
                                      {linha.status}
                                    </span>
                                  </div>

                                  {/* Barra de taxa histórica */}
                                  {taxa && taxa.total > 0 && linha.status !== 'IMPOSSIVEL' && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                          className={cn('h-full rounded-full',
                                            taxa.pct >= 80 ? 'bg-green-500' : taxa.pct >= 60 ? 'bg-yellow-500' : taxa.pct >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                          )}
                                          style={{ width: `${taxa.pct}%` }}
                                        />
                                      </div>
                                      <span className={cn('text-[10px] font-bold w-16 text-right',
                                        taxa.pct >= 80 ? 'text-green-400' : taxa.pct >= 60 ? 'text-yellow-400' : taxa.pct >= 40 ? 'text-orange-400' : 'text-red-400'
                                      )}>
                                        {taxa.hits}/{taxa.total} ({taxa.pct}%)
                                      </span>
                                    </div>
                                  )}

                                  {/* Explicação contextual */}
                                  <p className="text-[10px] text-zinc-500 mt-1">
                                    {linha.status === 'PAGO'
                                      ? linha.explicacao
                                      : linha.status === 'IMPOSSIVEL'
                                      ? linha.explicacao
                                      : taxa && taxa.total > 0
                                      ? (taxa.pct >= 80
                                          ? `Historico forte: ${taxa.pct}% das vezes bateu. ${linha.explicacao}`
                                          : taxa.pct >= 60
                                          ? `Historico favoravel (${taxa.pct}%). ${linha.explicacao}`
                                          : taxa.pct >= 40
                                          ? `Historico moderado (${taxa.pct}%). Avalie com cautela. ${linha.explicacao}`
                                          : `Historico desfavoravel (${taxa.pct}%). Risco alto. ${linha.explicacao}`)
                                      : linha.explicacao
                                    }
                                  </p>

                                  {/* Confiança */}
                                  {confianca && linha.status === 'PENDENTE' && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-[9px] text-zinc-600">Confianca:</span>
                                      <span className={cn('text-[9px] font-bold',
                                        confianca === 'ALTA' ? 'text-green-400' :
                                        confianca === 'MEDIA' ? 'text-yellow-400' :
                                        confianca === 'BAIXA' ? 'text-orange-400' : 'text-red-400'
                                      )}>
                                        {confianca === 'ALTA' ? 'Alta' : confianca === 'MEDIA' ? 'Media' : confianca === 'BAIXA' ? 'Baixa' : 'Muito baixa'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Resumo das melhores linhas */}
                            {totalH > 0 && linhasPendentes.length > 0 && (
                              <div className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/20">
                                <p className="text-[10px] text-purple-400 font-semibold mb-1">Melhores linhas para este confronto</p>
                                <div className="space-y-1">
                                  {linhasPendentes
                                    .filter(l => taxasPorLinha[l.linha] && taxasPorLinha[l.linha].pct >= 60)
                                    .sort((a, b) => (taxasPorLinha[b.linha]?.pct || 0) - (taxasPorLinha[a.linha]?.pct || 0))
                                    .slice(0, 3)
                                    .map((l, i) => {
                                      const t = taxasPorLinha[l.linha];
                                      return (
                                        <div key={i} className="flex items-center justify-between text-[10px]">
                                          <span className="text-zinc-300">{l.linha}</span>
                                          <span className={cn('font-bold', t.pct >= 80 ? 'text-green-400' : 'text-yellow-400')}>
                                            {t.pct}% historico ({t.hits}/{t.total})
                                          </span>
                                        </div>
                                      );
                                    })}
                                  {linhasPendentes.filter(l => taxasPorLinha[l.linha] && taxasPorLinha[l.linha].pct >= 60).length === 0 && (
                                    <p className="text-[10px] text-zinc-500">Nenhuma linha com historico acima de 60%. Cautela recomendada.</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Recomendação + Análise de Risco compactos */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30">
                        <span className="text-[10px] text-purple-400 uppercase">Recomendação</span>
                        <p className="text-xs text-purple-300 mt-0.5">{aoVivoResult.recomendacao}</p>
                      </div>
                      {aoVivoResult.analiseManipulacao && (
                        <div className={cn(
                          "p-2 rounded border",
                          aoVivoResult.analiseManipulacao.risco === 'BAIXO' && 'bg-green-500/10 border-green-500/30',
                          aoVivoResult.analiseManipulacao.risco === 'MEDIO' && 'bg-amber-500/10 border-amber-500/30',
                          aoVivoResult.analiseManipulacao.risco === 'ALTO' && 'bg-red-500/10 border-red-500/30'
                        )}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400 uppercase">Risco</span>
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded font-bold',
                              aoVivoResult.analiseManipulacao.risco === 'BAIXO' && 'bg-green-600 text-white',
                              aoVivoResult.analiseManipulacao.risco === 'MEDIO' && 'bg-amber-600 text-white',
                              aoVivoResult.analiseManipulacao.risco === 'ALTO' && 'bg-red-600 text-white'
                            )}>{aoVivoResult.analiseManipulacao.risco}</span>
                          </div>
                          <p className={cn(
                            'text-xs mt-0.5',
                            aoVivoResult.analiseManipulacao.risco === 'BAIXO' && 'text-green-400',
                            aoVivoResult.analiseManipulacao.risco === 'MEDIO' && 'text-amber-400',
                            aoVivoResult.analiseManipulacao.risco === 'ALTO' && 'text-red-400'
                          )}>{aoVivoResult.analiseManipulacao.recomendacao}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Histórico do Confronto - Full width */}
                  {aoVivoResult.historico && aoVivoResult.historico.totalPartidas > 0 && (
                    <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Histórico do Confronto</h4>
                      <div className="grid grid-cols-4 gap-2 text-center mb-3">
                        <div className="p-2 rounded bg-zinc-900">
                          <p className="text-xl font-bold text-white">{aoVivoResult.historico.totalPartidas}</p>
                          <p className="text-[10px] text-zinc-500">Partidas</p>
                        </div>
                        <div className="p-2 rounded bg-zinc-900">
                          <p className="text-xl font-bold text-purple-400">{aoVivoResult.historico.mediaGols}</p>
                          <p className="text-[10px] text-zinc-500">Média Gols</p>
                        </div>
                        <div className="p-2 rounded bg-zinc-900">
                          <p className="text-xl font-bold text-amber-400">{aoVivoResult.historico.percentualOver15}%</p>
                          <p className="text-[10px] text-zinc-500">Over 1.5</p>
                        </div>
                        <div className="p-2 rounded bg-zinc-900">
                          <p className="text-xl font-bold text-green-400">{aoVivoResult.historico.percentualOver25}%</p>
                          <p className="text-[10px] text-zinc-500">Over 2.5</p>
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-zinc-800">
                            <tr className="text-zinc-500">
                              <th className="text-left py-1.5 px-2 font-medium w-16">Data</th>
                              <th className="text-center py-1.5 px-2 font-medium" colSpan={3}>HT</th>
                              <th className="text-center py-1.5 px-2 font-medium" colSpan={3}>FT</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aoVivoResult.historico.ultimasPartidas.map((p, i) => (
                              <tr key={i} className="border-t border-zinc-800/50 hover:bg-zinc-800/30">
                                <td className="py-1.5 px-2 text-[10px]">
                                  <span className="text-zinc-400">{p.data.split(' ')[0]}</span>
                                  <br />
                                  <span className="text-purple-400">{p.data.split(' ')[1]}</span>
                                </td>
                                {/* HT: Time1 placar Time2 */}
                                <td className="py-1.5 px-1 text-right">
                                  <span className={cn(
                                    'text-[10px]',
                                    p.golsHT1 > p.golsHT2 ? 'text-green-400 font-bold' : p.golsHT1 < p.golsHT2 ? 'text-red-400' : 'text-amber-400'
                                  )}>{p.jogador1 || '-'}</span>
                                </td>
                                <td className="py-1.5 px-1 text-center whitespace-nowrap">
                                  <span className={cn(
                                    'font-bold',
                                    p.golsHT1 > p.golsHT2 ? 'text-green-400' : p.golsHT1 < p.golsHT2 ? 'text-red-400' : 'text-amber-400'
                                  )}>{p.golsHT1}</span>
                                  <span className="text-zinc-500 mx-0.5">x</span>
                                  <span className={cn(
                                    'font-bold',
                                    p.golsHT2 > p.golsHT1 ? 'text-green-400' : p.golsHT2 < p.golsHT1 ? 'text-red-400' : 'text-amber-400'
                                  )}>{p.golsHT2}</span>
                                </td>
                                <td className="py-1.5 px-1 text-left">
                                  <span className={cn(
                                    'text-[10px]',
                                    p.golsHT2 > p.golsHT1 ? 'text-green-400 font-bold' : p.golsHT2 < p.golsHT1 ? 'text-red-400' : 'text-amber-400'
                                  )}>{p.jogador2 || '-'}</span>
                                </td>
                                {/* FT: Time1 placar Time2 */}
                                <td className="py-1.5 px-1 text-right">
                                  <span className={cn(
                                    'text-[10px]',
                                    p.gols1 > p.gols2 ? 'text-green-400 font-bold' : p.gols1 < p.gols2 ? 'text-red-400' : 'text-amber-400'
                                  )}>{p.jogador1 || '-'}</span>
                                </td>
                                <td className="py-1.5 px-1 text-center whitespace-nowrap">
                                  <span className={cn(
                                    'font-bold',
                                    p.gols1 > p.gols2 ? 'text-green-400' : p.gols1 < p.gols2 ? 'text-red-400' : 'text-amber-400'
                                  )}>{p.gols1}</span>
                                  <span className="text-zinc-500 mx-0.5">x</span>
                                  <span className={cn(
                                    'font-bold',
                                    p.gols2 > p.gols1 ? 'text-green-400' : p.gols2 < p.gols1 ? 'text-red-400' : 'text-amber-400'
                                  )}>{p.gols2}</span>
                                </td>
                                <td className="py-1.5 px-1 text-left">
                                  <span className={cn(
                                    'text-[10px]',
                                    p.gols2 > p.gols1 ? 'text-green-400 font-bold' : p.gols2 < p.gols1 ? 'text-red-400' : 'text-amber-400'
                                  )}>{p.jogador2 || '-'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Alertas */}
                  {aoVivoResult.alertas.length > 0 && (
                    <div className="space-y-1">
                      {aoVivoResult.alertas.map((alerta, i) => (
                        <div key={i} className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                          {alerta}
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-zinc-500 text-sm border border-dashed border-zinc-700 rounded-lg">
              Preencha os dados acima e clique em "Analisar"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análise Individual do Jogador */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-purple-400" />
            Análise Individual
          </CardTitle>
          <CardDescription>Selecione um jogador para ver sua análise completa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtro de período */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500 mr-1">Período:</span>
              {[
                { label: 'Geral', value: undefined },
                { label: '24h', value: 24 },
                { label: '12h', value: 12 },
                { label: '6h', value: 6 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    setIndividualHoras(opt.value);
                    if (individualNick) fetchIndividualPreview(individualNick, individualTime, opt.value);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all',
                    individualHoras === opt.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              {/* Filtro Liga */}
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Liga</label>
                <select
                  value={individualLiga}
                  onChange={(e) => { setIndividualLiga(e.target.value); setIndividualNick(''); setIndividualTime(''); setIndividualPreview(null); }}
                  className="w-full h-8 px-2 text-sm rounded bg-zinc-800 border border-zinc-700 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="TODAS">Todas</option>
                  <option value="GT_8MIN">Battle 8min</option>
                  <option value="GT_12MIN">GT 12min</option>
                  <option value="VOLTA_6MIN">Volta 6min</option>
                  <option value="H2H">H2H</option>
                </select>
              </div>

              {/* Selecionar Jogador */}
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Jogador</label>
                <select
                  value={individualNick}
                  onChange={(e) => { const nick = e.target.value; setIndividualNick(nick); setIndividualTime(''); if (nick) fetchIndividualPreview(nick, '', individualHoras); else setIndividualPreview(null); }}
                  className="w-full h-8 px-2 text-sm rounded bg-zinc-800 border border-zinc-700 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {nicknames
                    .filter(n => {
                      if (individualLiga === 'TODAS') return true;
                      return jogadores.some(j => {
                        const nickMatch = j.nome.match(/\(([^)]+)\)/);
                        const nick = nickMatch ? nickMatch[1] : '';
                        return nick === n.nickname && j.liga === individualLiga;
                      });
                    })
                    .sort((a, b) => a.nickname.localeCompare(b.nickname))
                    .map(n => (
                      <option key={n.nickname} value={n.nickname}>
                        {n.nickname} ({n.times.length} {n.times.length === 1 ? 'time' : 'times'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Selecionar Time */}
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Time <span className="text-zinc-600">(opcional)</span></label>
                <select
                  value={individualTime}
                  onChange={(e) => { const t = e.target.value; setIndividualTime(t); if (individualNick) fetchIndividualPreview(individualNick, t, individualHoras); }}
                  disabled={!individualNick}
                  className="w-full h-8 px-2 text-sm rounded bg-zinc-800 border border-zinc-700 text-white focus:border-purple-500 focus:outline-none disabled:opacity-40"
                >
                  <option value="">Todos os times</option>
                  {(nicknames.find(n => n.nickname === individualNick)?.times || []).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Botão */}
              <Button
                onClick={() => {
                  if (!individualNick) return;
                  const jogador = jogadores.find(j =>
                    individualTime
                      ? j.nome === `${individualTime} (${individualNick})`
                      : j.nome.includes(`(${individualNick})`)
                  );
                  if (jogador) handleClickJogador(jogador.id, individualTime || undefined, individualHoras);
                }}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 h-8 text-xs"
                disabled={!individualNick}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Analisar
              </Button>
            </div>

            {/* Preview do jogador selecionado */}
            {individualNick && (
              individualPreviewLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                  <span className="ml-2 text-xs text-zinc-500">Carregando dados...</span>
                </div>
              ) : individualPreview ? (
                <div
                  className="rounded-xl border border-zinc-700 bg-zinc-800/20 overflow-hidden cursor-pointer hover:border-purple-500/30 transition-all"
                  onClick={() => {
                    const jogador = jogadores.find(j =>
                      individualTime ? j.nome === `${individualTime} (${individualNick})` : j.nome.includes(`(${individualNick})`)
                    );
                    if (jogador) handleClickJogador(jogador.id, individualTime || undefined, individualHoras);
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{individualPreview.jogador.nickname}</p>
                        <p className="text-[10px] text-zinc-500">{individualTime || 'Todos os times'} · {formatLiga(individualPreview.jogador.liga)} · <span className="text-purple-400">{individualPreview.filtro?.periodo || 'Geral'}</span> · {individualPreview.stats.totalPartidas} jogos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold',
                        individualPreview.tendencia === 'SUBINDO' ? 'bg-green-500/20 text-green-400' :
                        individualPreview.tendencia === 'CAINDO' ? 'bg-red-500/20 text-red-400' :
                        'bg-zinc-700 text-zinc-400'
                      )}>
                        {individualPreview.tendencia === 'SUBINDO' ? 'Em alta' : individualPreview.tendencia === 'CAINDO' ? 'Em baixa' : 'Estável'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-zinc-600" />
                    </div>
                  </div>

                  {/* Médias gerais */}
                  <div className="grid grid-cols-4 gap-px bg-zinc-800">
                    <div className="bg-zinc-900 p-2.5 text-center">
                      <p className="text-lg font-bold text-purple-400">{individualPreview.stats.mediaGolsFT.toFixed(1)}</p>
                      <p className="text-[9px] text-zinc-500">Média FT</p>
                    </div>
                    <div className="bg-zinc-900 p-2.5 text-center">
                      <p className="text-lg font-bold text-white">{individualPreview.stats.mediaGolsHT.toFixed(1)}</p>
                      <p className="text-[9px] text-zinc-500">Média HT</p>
                    </div>
                    <div className="bg-zinc-900 p-2.5 text-center">
                      <p className="text-lg font-bold text-orange-400">{individualPreview.stats.mediaGolsSofridos.toFixed(1)}</p>
                      <p className="text-[9px] text-zinc-500">Sofridos</p>
                    </div>
                    <div className="bg-zinc-900 p-2.5 text-center">
                      <p className={cn('text-lg font-bold', individualPreview.stats.winRate >= 50 ? 'text-green-400' : 'text-red-400')}>
                        {individualPreview.stats.vitorias}/{individualPreview.stats.totalPartidas}
                      </p>
                      <p className="text-[9px] text-zinc-500">Vitórias</p>
                    </div>
                  </div>

                  {/* Stats do Dia */}
                  {individualPreview.diaStats && individualPreview.diaStats.totalPartidas > 0 ? (
                    <div className={cn('p-3 border-t',
                      individualPreview.diaStats.comportamento === 'EM_FORMA' ? 'bg-green-500/5 border-green-500/20' :
                      individualPreview.diaStats.comportamento === 'PAGANDO_GOL' ? 'bg-red-500/5 border-red-500/20' :
                      individualPreview.diaStats.comportamento === 'RETRANCANDO' ? 'bg-blue-500/5 border-blue-500/20' :
                      'bg-zinc-800/30 border-zinc-800'
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase">Hoje</span>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold',
                          individualPreview.diaStats.comportamento === 'EM_FORMA' ? 'bg-green-500/20 text-green-400' :
                          individualPreview.diaStats.comportamento === 'PAGANDO_GOL' ? 'bg-red-500/20 text-red-400' :
                          individualPreview.diaStats.comportamento === 'RETRANCANDO' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-zinc-700 text-zinc-400'
                        )}>
                          {individualPreview.diaStats.comportamento === 'EM_FORMA' ? '🔥 Em Forma' :
                           individualPreview.diaStats.comportamento === 'PAGANDO_GOL' ? '⚠️ Pagando Gol' :
                           individualPreview.diaStats.comportamento === 'RETRANCANDO' ? '🧱 Retrancando' : '➖ Normal'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-white font-medium">{individualPreview.diaStats.totalPartidas} jogos</span>
                        <span className="text-green-400">{individualPreview.diaStats.golsMarcados} gols marcados</span>
                        <span className="text-red-400">{individualPreview.diaStats.golsSofridos} gols sofridos</span>
                        <span className="text-zinc-500">{individualPreview.diaStats.over25} com +2 gols</span>
                      </div>
                      {individualPreview.diaStats.partidas.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {individualPreview.diaStats.partidas.map((p, i) => (
                            <span key={i} className={cn('text-[10px] px-2 py-0.5 rounded-full font-mono font-bold',
                              p.resultado === 'V' ? 'bg-green-500/20 text-green-400' :
                              p.resultado === 'D' ? 'bg-red-500/20 text-red-400' :
                              'bg-zinc-700 text-zinc-400'
                            )}>
                              {p.placarFT}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 border-t border-zinc-800 bg-zinc-800/20">
                      <span className="text-[10px] text-zinc-600">Sem jogos finalizados hoje</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-zinc-600 text-xs">
                  Jogador não encontrado com esse filtro
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights Inteligentes */}
      {analise.insights && analise.insights.length > 0 && (
        <Card className="border-purple-500/30 bg-gradient-to-br from-zinc-900 to-purple-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Insights da Grade
            </CardTitle>
            <CardDescription>Padrões identificados pela análise inteligente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {analise.insights.map((insight, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-4 rounded-lg border transition-all hover:scale-[1.02]',
                    insight.nivel === 'oportunidade' && 'bg-green-950/30 border-green-500/30',
                    insight.nivel === 'alerta' && 'bg-amber-950/30 border-amber-500/30',
                    insight.nivel === 'info' && 'bg-blue-950/30 border-blue-500/30'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      insight.nivel === 'oportunidade' && 'bg-green-500/20',
                      insight.nivel === 'alerta' && 'bg-amber-500/20',
                      insight.nivel === 'info' && 'bg-blue-500/20'
                    )}>
                      {insight.nivel === 'oportunidade' && <TrendingUp className="h-5 w-5 text-green-400" />}
                      {insight.nivel === 'alerta' && <AlertTriangle className="h-5 w-5 text-amber-400" />}
                      {insight.nivel === 'info' && <Eye className="h-5 w-5 text-blue-400" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white text-sm">{insight.titulo}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{insight.descricao}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Jogadores Destaque */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Jogador Mais Over */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-400" />
              Jogador MAIS OVER do Dia
            </CardTitle>
            <CardDescription>Maior média de gols e percentual over</CardDescription>
          </CardHeader>
          <CardContent>
            {analise.jogadorMaisOver ? (
              <JogadorCard jogador={analise.jogadorMaisOver} tipo="over" onClickJogador={handleClickJogador} />
            ) : (
              <p className="text-zinc-500 text-center py-4">Nenhum jogador encontrado</p>
            )}
          </CardContent>
        </Card>

        {/* Jogador Menos Over (Pior) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              PIOR Jogador do Dia
            </CardTitle>
            <CardDescription>Menor média de gols - evitar</CardDescription>
          </CardHeader>
          <CardContent>
            {analise.jogadorMenosOver ? (
              <JogadorCard jogador={analise.jogadorMenosOver} tipo="under" onClickJogador={handleClickJogador} />
            ) : (
              <p className="text-zinc-500 text-center py-4">Nenhum jogador encontrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confrontos Destaque */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Confronto Mais Over */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Confronto MAIS OVER
            </CardTitle>
            <CardDescription>Maior probabilidade de gols</CardDescription>
          </CardHeader>
          <CardContent>
            {analise.confrontoMaisOver ? (
              <ConfrontoCard confronto={analise.confrontoMaisOver} destaque="over" />
            ) : (
              <p className="text-zinc-500 text-center py-4">Nenhum confronto encontrado</p>
            )}
          </CardContent>
        </Card>

        {/* Confronto Mais Under */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-blue-400" />
              Confronto MAIS UNDER
            </CardTitle>
            <CardDescription>Maior probabilidade de poucos gols</CardDescription>
          </CardHeader>
          <CardContent>
            {analise.confrontoMaisUnder ? (
              <ConfrontoCard confronto={analise.confrontoMaisUnder} destaque="under" />
            ) : (
              <p className="text-zinc-500 text-center py-4">Nenhum confronto encontrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Jogos com mais 0x0 */}
      {analise.confrontosMais0x0.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Snowflake className="h-5 w-5 text-cyan-400" />
              Jogos com MAIS 0x0
            </CardTitle>
            <CardDescription>Confrontos com maior chance de empate sem gols</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {analise.confrontosMais0x0.map((confronto) => (
                <ConfrontoCard key={confronto.id} confronto={confronto} destaque="0x0" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Padrões HT/FT */}
      {(analise.jogosGolHTMorrendoFT.length > 0 || analise.jogos0x0HTGolFT.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-cyan-400" />
              0x0 no HT, GOL no FT
            </CardTitle>
            <CardDescription>Jogos que costumam demorar para sair gol</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analise.jogos0x0HTGolFT.slice(0, 3).map((confronto) => (
                <ConfrontoCard key={confronto.id} confronto={confronto} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximos Jogos da Grade */}
      {analise.proximosJogos && analise.proximosJogos.length > 0 && (
        <Card className="border-purple-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-purple-400" />
                  Próximos Jogos da Grade
                </CardTitle>
                <CardDescription>Atualiza automaticamente a cada 15 segundos</CardDescription>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                {analise.proximosJogos.length} jogos
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {analise.proximosJogos.map((confronto) => (
                <ConfrontoCard key={confronto.id} confronto={confronto} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Perfil do Jogador */}
      <Dialog open={showJogadorModal} onOpenChange={setShowJogadorModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {jogadorPerfilLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            </div>
          ) : jogadorPerfil ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{jogadorPerfil.jogador.nickname}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-400">{jogadorPerfil.jogador.times.join(', ')}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{formatLiga(jogadorPerfil.jogador.liga)}</span>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded font-bold',
                        jogadorPerfil.tendencia === 'SUBINDO' ? 'bg-green-500/20 text-green-400' :
                        jogadorPerfil.tendencia === 'CAINDO' ? 'bg-red-500/20 text-red-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      )}>
                        {jogadorPerfil.tendencia === 'SUBINDO' ? 'Em alta' : jogadorPerfil.tendencia === 'CAINDO' ? 'Em baixa' : 'Estavel'}
                      </span>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Tags de status */}
                <div className="flex flex-wrap items-center gap-2">
                  {jogadorPerfil.streakAtual > 0 && (
                    <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold',
                      jogadorPerfil.streakTipo === 'V' ? 'bg-green-500/20 text-green-400' :
                      jogadorPerfil.streakTipo === 'D' ? 'bg-red-500/20 text-red-400' :
                      'bg-zinc-500/20 text-zinc-400'
                    )}>
                      <Zap className="h-3.5 w-3.5" />
                      {jogadorPerfil.streakAtual} {jogadorPerfil.streakTipo === 'V' ? 'vitórias' : jogadorPerfil.streakTipo === 'D' ? 'derrotas' : 'empates'} seguidas
                    </div>
                  )}
                  <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2.5 py-1 rounded-full">{jogadorPerfil.stats.totalPartidas} jogos analisados</span>
                </div>

                {/* Performance do Dia */}
                {jogadorPerfil.diaStats && jogadorPerfil.diaStats.totalPartidas > 0 && (
                  <div className={cn('p-4 rounded-xl border',
                    jogadorPerfil.diaStats.comportamento === 'EM_FORMA' ? 'bg-green-500/5 border-green-500/30' :
                    jogadorPerfil.diaStats.comportamento === 'PAGANDO_GOL' ? 'bg-red-500/5 border-red-500/30' :
                    jogadorPerfil.diaStats.comportamento === 'RETRANCANDO' ? 'bg-blue-500/5 border-blue-500/30' :
                    'bg-zinc-800/30 border-zinc-700'
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        <p className="text-sm font-semibold text-white">Hoje</p>
                      </div>
                      <span className={cn('text-xs px-3 py-1 rounded-full font-bold',
                        jogadorPerfil.diaStats.comportamento === 'EM_FORMA' ? 'bg-green-500/20 text-green-400' :
                        jogadorPerfil.diaStats.comportamento === 'PAGANDO_GOL' ? 'bg-red-500/20 text-red-400' :
                        jogadorPerfil.diaStats.comportamento === 'RETRANCANDO' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-zinc-700 text-zinc-400'
                      )}>
                        {jogadorPerfil.diaStats.comportamento === 'EM_FORMA' ? '🔥 Em Forma' :
                         jogadorPerfil.diaStats.comportamento === 'PAGANDO_GOL' ? '⚠️ Pagando Gol' :
                         jogadorPerfil.diaStats.comportamento === 'RETRANCANDO' ? '🧱 Retrancando' : '➖ Normal'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2.5 rounded-lg bg-black/20 text-center">
                        <p className="text-2xl font-bold text-white">{jogadorPerfil.diaStats.totalPartidas}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">jogos hoje</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/20 text-center">
                        <p className="text-2xl font-bold text-green-400">{jogadorPerfil.diaStats.golsMarcados}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">gols marcados</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/20 text-center">
                        <p className="text-2xl font-bold text-red-400">{jogadorPerfil.diaStats.golsSofridos}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">gols sofridos</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <div className="flex gap-3">
                        <span className="text-green-400 font-medium">{jogadorPerfil.diaStats.vitorias} vitória{jogadorPerfil.diaStats.vitorias !== 1 ? 's' : ''}</span>
                        <span className="text-zinc-500">{jogadorPerfil.diaStats.empates} empate{jogadorPerfil.diaStats.empates !== 1 ? 's' : ''}</span>
                        <span className="text-red-400">{jogadorPerfil.diaStats.derrotas} derrota{jogadorPerfil.diaStats.derrotas !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-zinc-500">{jogadorPerfil.diaStats.over25} de {jogadorPerfil.diaStats.totalPartidas} com +2 gols</span>
                    </div>
                    {jogadorPerfil.diaStats.partidas.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {jogadorPerfil.diaStats.partidas.map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-black/20">
                            <div className="flex items-center gap-2">
                              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold',
                                p.resultado === 'V' ? 'bg-green-500 text-white' :
                                p.resultado === 'D' ? 'bg-red-500 text-white' :
                                'bg-zinc-600 text-white'
                              )}>{p.resultado}</span>
                              <span className="text-zinc-300 truncate max-w-[160px]">{p.adversario}</span>
                            </div>
                            <span className="text-white font-mono font-bold">{p.placarFT}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Médias Gerais - Cards grandes e claros */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Médias Gerais</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold text-purple-400">{jogadorPerfil.stats.mediaGolsFT.toFixed(1)}</p>
                        <p className="text-xs text-zinc-500">gols/jogo</p>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">Média no Tempo Total</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/50">
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold text-white">{jogadorPerfil.stats.mediaGolsHT.toFixed(1)}</p>
                        <p className="text-xs text-zinc-500">gols/jogo</p>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">Média no 1º Tempo</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/50">
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold text-orange-400">{jogadorPerfil.stats.mediaGolsSofridos.toFixed(1)}</p>
                        <p className="text-xs text-zinc-500">gols/jogo</p>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">Gols Sofridos</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/50">
                      <div className="flex items-center gap-2">
                        <p className={cn('text-3xl font-bold', jogadorPerfil.stats.winRate >= 50 ? 'text-green-400' : 'text-red-400')}>
                          {jogadorPerfil.stats.vitorias}
                        </p>
                        <div className="text-xs text-zinc-500 leading-tight">
                          <p>vitórias em</p>
                          <p>{jogadorPerfil.stats.totalPartidas} jogos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden flex bg-zinc-800">
                          <div className="bg-green-500 h-full rounded-l-full" style={{ width: `${(jogadorPerfil.stats.vitorias / jogadorPerfil.stats.totalPartidas) * 100}%` }} />
                          <div className="bg-zinc-600 h-full" style={{ width: `${(jogadorPerfil.stats.empates / jogadorPerfil.stats.totalPartidas) * 100}%` }} />
                          <div className="bg-red-500 h-full rounded-r-full" style={{ width: `${(jogadorPerfil.stats.derrotas / jogadorPerfil.stats.totalPartidas) * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-1 text-[10px]">
                        <span className="text-green-400">{jogadorPerfil.stats.vitorias}V</span>
                        <span className="text-zinc-500">{jogadorPerfil.stats.empates}E</span>
                        <span className="text-red-400">{jogadorPerfil.stats.derrotas}D</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chance de sair gol - linguagem simples */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Chance de sair gol</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Sai gol no 1º tempo?', sub: 'Over 0.5 HT', pct: jogadorPerfil.stats.over05HT },
                      { label: 'Sai 2+ gols no 1º tempo?', sub: 'Over 1.5 HT', pct: jogadorPerfil.stats.over15HT },
                      { label: 'Sai 2+ gols no jogo?', sub: 'Over 1.5 FT', pct: jogadorPerfil.stats.over15FT },
                      { label: 'Sai 3+ gols no jogo?', sub: 'Over 2.5 FT', pct: jogadorPerfil.stats.over25FT },
                      { label: 'Sai 4+ gols no jogo?', sub: 'Over 3.5 FT', pct: jogadorPerfil.stats.over35FT },
                    ].map((linha) => {
                      const descricao = linha.pct >= 80 ? 'Quase sempre' : linha.pct >= 60 ? 'Frequente' : linha.pct >= 40 ? 'Às vezes' : linha.pct >= 20 ? 'Raro' : 'Muito raro';
                      return (
                        <div key={linha.sub} className="p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-800">
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <p className="text-xs font-medium text-white">{linha.label}</p>
                              <p className="text-[10px] text-zinc-600">{linha.sub}</p>
                            </div>
                            <div className="text-right">
                              <span className={cn('text-sm font-bold',
                                linha.pct >= 80 ? 'text-green-400' : linha.pct >= 60 ? 'text-yellow-400' : linha.pct >= 40 ? 'text-orange-400' : 'text-red-400'
                              )}>
                                {descricao}
                              </span>
                              <p className="text-[10px] text-zinc-600">{linha.pct} em cada 100</p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all',
                                linha.pct >= 80 ? 'bg-green-500' : linha.pct >= 60 ? 'bg-yellow-500' : linha.pct >= 40 ? 'bg-orange-500' : 'bg-red-500'
                              )}
                              style={{ width: `${linha.pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Curiosidades */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Curiosidades</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center">
                      <Shield className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                      <p className="text-sm font-bold text-blue-400">
                        {jogadorPerfil.stats.cleanSheets > 0
                          ? `${Math.round(jogadorPerfil.stats.cleanSheets * jogadorPerfil.stats.totalPartidas / 100)} de ${jogadorPerfil.stats.totalPartidas}`
                          : 'Nenhum'}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">jogos sem sofrer gol</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/50 text-center">
                      <Minus className="h-4 w-4 text-zinc-400 mx-auto mb-1" />
                      <p className="text-sm font-bold text-zinc-400">
                        {jogadorPerfil.stats.zeroZero > 0
                          ? `${Math.round(jogadorPerfil.stats.zeroZero * jogadorPerfil.stats.totalPartidas / 100)} de ${jogadorPerfil.stats.totalPartidas}`
                          : 'Nenhum'}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">jogos 0x0</p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 text-center">
                      <Flame className="h-4 w-4 text-orange-400 mx-auto mb-1" />
                      <p className="text-sm font-bold text-orange-400">{jogadorPerfil.stats.goleadas}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">goleadas (5+ gols)</p>
                    </div>
                  </div>
                </div>

                {/* Placares mais comuns */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Placares mais comuns</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-zinc-500 mb-1.5">Resultado Final</p>
                      <div className="space-y-1">
                        {jogadorPerfil.topPlacaresFT.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-zinc-800/30">
                            <span className="text-white font-mono font-bold text-sm">{p.placar}</span>
                            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${p.pct}%` }} />
                            </div>
                            <span className="text-zinc-500 text-[10px] shrink-0">{p.count}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 mb-1.5">Intervalo (HT)</p>
                      <div className="space-y-1">
                        {jogadorPerfil.topPlacaresHT.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-zinc-800/30">
                            <span className="text-white font-mono font-bold text-sm">{p.placar}</span>
                            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${p.pct}%` }} />
                            </div>
                            <span className="text-zinc-500 text-[10px] shrink-0">{p.count}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Últimas Partidas */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Últimas Partidas</p>
                  <div className="space-y-1 max-h-52 overflow-y-auto">
                    {jogadorPerfil.ultimasPartidas.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-zinc-800/20 hover:bg-zinc-800/40 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                            p.resultado === 'V' ? 'bg-green-500 text-white' :
                            p.resultado === 'D' ? 'bg-red-500 text-white' :
                            'bg-zinc-600 text-white'
                          )}>
                            {p.resultado}
                          </span>
                          <span className="text-zinc-300 truncate max-w-[180px]">{p.adversario}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-600 text-[10px]">{p.placarHT}</span>
                          <span className="text-white font-mono font-bold text-sm">{p.placarFT}</span>
                          <span className="text-zinc-600 text-[10px] w-12 text-right">
                            {new Date(p.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-zinc-500">Erro ao carregar perfil</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
