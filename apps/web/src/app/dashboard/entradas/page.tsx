'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { entradasApi, EntradaExpert, Entrada, EstatisticasHoje, ResultadoEntrada, bancaApi, Banca } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Zap, Lock, Check, Bot, FileText, Crown, CheckCircle, XCircle, BarChart3, Target, TrendingUp, Plus, Calendar, Clock, DollarSign, Percent, Pencil, Trash2 } from 'lucide-react';

const confiancaConfig = {
  ALTA: { label: 'Alta Confiança', bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
  MEDIA: { label: 'Média Confiança', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  BAIXA: { label: 'Baixa Confiança', bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' },
};

const ligasOptions = [
  { value: 'GT_12MIN', label: 'GT 12min' },
  { value: 'VOLTA_6MIN', label: 'Volta 6min' },
  { value: 'GT_8MIN', label: 'Battle 8min' },
  { value: 'H2H', label: 'H2H' },
];

const formatLiga = (liga: string) => {
  const map: Record<string, string> = {
    GT_12MIN: 'GT 12min',
    VOLTA_6MIN: 'Volta 6min',
    GT_8MIN: 'Battle 8min',
    H2H: 'H2H',
  };
  return map[liga] || liga.replace('_', ' ');
};

const mercadosOptions = [
  'Over 0.5 HT', 'Over 1.5 HT', 'Over 2.5 HT',
  'Over 1.5 FT', 'Over 2.5 FT', 'Over 3.5 FT', 'Over 4.5 FT',
  'Under 2.5 FT', 'Under 3.5 FT', 'Under 4.5 FT',
  'Ambas Marcam HT', 'Ambas Marcam FT',
  'Resultado Final', 'Handicap', 'Dupla Hipótese',
];

const valoresRapidos = [50, 100, 150, 200, 250, 300];

export default function EntradasPage() {
  const { user } = useAuthStore();
  const [entradasExpert, setEntradasExpert] = useState<EntradaExpert[]>([]);
  const [entradasHoje, setEntradasHoje] = useState<Entrada[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasHoje | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'expert' | 'minhas'>('expert');
  const [filtroExpert, setFiltroExpert] = useState<'todas' | 'ao_vivo' | 'pre_live'>('todas');
  
  // Modal de registro manual
  const [banca, setBanca] = useState<Banca | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoEntrada, setEditandoEntrada] = useState<Entrada | null>(null);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    liga: 'GT_12MIN',
    mercado: 'Over 2.5 FT',
    jogador1: '',
    jogador2: '',
    odd: 1.80,
    stake: 100,
    status: 'PENDENTE' as 'PENDENTE' | 'GREEN' | 'RED' | 'MEIO_GREEN' | 'MEIO_RED' | 'REEMBOLSO',
  });
  const [novaEntrada, setNovaEntrada] = useState({
    data: new Date().toISOString().split('T')[0],
    horario: new Date().toTimeString().slice(0, 5),
    liga: 'GT_12MIN',
    mercado: 'Over 2.5 FT',
    jogador1: '',
    jogador2: '',
    valor: 100,
    odd: 1.80,
    status: 'PENDENTE' as 'PENDENTE' | 'GREEN' | 'RED' | 'MEIO_GREEN' | 'MEIO_RED' | 'REEMBOLSO',
  });

  const isExpert = user?.plan === 'EXPERT';

  useEffect(() => {
    if (!isExpert) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [expertRes, hojeRes, statsRes, bancaRes] = await Promise.all([
          entradasApi.getExpert(),
          entradasApi.getHoje(),
          entradasApi.getEstatisticas(),
          bancaApi.get().catch(() => ({ data: null })),
        ]);
        setEntradasExpert(expertRes.data);
        setEntradasHoje(hojeRes.data);
        setEstatisticas(statsRes.data);
        setBanca(bancaRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar entradas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isExpert]);

  const handleCopiarEntrada = async (entrada: EntradaExpert) => {
    try {
      await entradasApi.criar({
        partidaId: entrada.partida.id,
        mercado: entrada.mercado,
        odd: entrada.odd,
      });
      const [hojeRes, statsRes] = await Promise.all([
        entradasApi.getHoje(),
        entradasApi.getEstatisticas(),
      ]);
      setEntradasHoje(hojeRes.data);
      setEstatisticas(statsRes.data);
      setTab('minhas');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao copiar entrada');
    }
  };

  const handleFinalizarEntrada = async (entradaId: string, resultado: ResultadoEntrada) => {
    try {
      await entradasApi.finalizar(entradaId, resultado);
      const [hojeRes, statsRes] = await Promise.all([
        entradasApi.getHoje(),
        entradasApi.getEstatisticas(),
      ]);
      setEntradasHoje(hojeRes.data);
      setEstatisticas(statsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao finalizar entrada');
    }
  };

  const handleAbrirEdicao = (entrada: Entrada) => {
    // Extrair jogadores e liga do analiseIA para entradas manuais
    let jogador1 = '';
    let jogador2 = '';
    let liga = 'GT_12MIN';

    if (entrada.partida) {
      jogador1 = entrada.partida.jogador1?.nome || '';
      jogador2 = entrada.partida.jogador2?.nome || '';
      liga = entrada.partida.liga || 'GT_12MIN';
    } else if (entrada.analiseIA) {
      const matchJogadores = entrada.analiseIA.match(/: (.+?) vs (.+?) -/);
      if (matchJogadores) {
        jogador1 = matchJogadores[1];
        jogador2 = matchJogadores[2];
      }
      const matchLiga = entrada.analiseIA.match(/ - (.+)$/);
      if (matchLiga) {
        liga = matchLiga[1];
      }
    }

    setEditForm({
      liga,
      mercado: entrada.mercado,
      jogador1,
      jogador2,
      odd: entrada.odd,
      stake: entrada.stake,
      status: entrada.resultado || 'PENDENTE',
    });
    setEditandoEntrada(entrada);
  };

  const handleSalvarEdicao = async () => {
    if (!editandoEntrada) return;
    try {
      const analiseIA = `Entrada manual: ${editForm.jogador1} vs ${editForm.jogador2} - ${editForm.liga}`;
      
      let resultado: ResultadoEntrada | undefined;
      if (editForm.status === 'GREEN' || editForm.status === 'MEIO_GREEN') {
        resultado = 'GREEN' as ResultadoEntrada;
      } else if (editForm.status === 'RED' || editForm.status === 'MEIO_RED') {
        resultado = 'RED' as ResultadoEntrada;
      } else if (editForm.status === 'REEMBOLSO') {
        resultado = 'REEMBOLSO' as ResultadoEntrada;
      }

      await entradasApi.atualizar(editandoEntrada.id, {
        mercado: editForm.mercado,
        odd: editForm.odd,
        stake: editForm.stake,
        analiseIA,
        ...(resultado && { resultado }),
      });

      const [hojeRes, statsRes] = await Promise.all([
        entradasApi.getHoje(),
        entradasApi.getEstatisticas(),
      ]);
      setEntradasHoje(hojeRes.data);
      setEstatisticas(statsRes.data);
      setEditandoEntrada(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar edição');
    }
  };

  const handleDeletarEntrada = async () => {
    if (!deletandoId) return;
    try {
      await entradasApi.deletar(deletandoId);
      const [hojeRes, statsRes] = await Promise.all([
        entradasApi.getHoje(),
        entradasApi.getEstatisticas(),
      ]);
      setEntradasHoje(hojeRes.data);
      setEstatisticas(statsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir entrada');
    } finally {
      setDeletandoId(null);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Usuário não EXPERT - mostrar upgrade
  if (!isExpert) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Zap className="h-8 w-8 text-purple-400" />
            Entradas Expert
          </h1>
          <p className="mt-1 text-zinc-400">Entradas geradas por IA</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/20">
              <Lock className="h-8 w-8 text-purple-400" />
            </div>
            <CardTitle>Recurso Exclusivo EXPERT</CardTitle>
            <CardDescription>
              As Entradas Expert estão disponíveis apenas para assinantes EXPERT
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6 space-y-2 text-sm text-zinc-400">
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Entradas geradas automaticamente por IA</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Análise detalhada de cada entrada</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Nível de confiança calculado</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Mercado, odd e stake já definidos</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Histórico completo de entradas</p>
            </div>
            <Link href="/dashboard/planos">
              <Button size="lg" className="w-full max-w-xs">
                <Crown className="h-4 w-4 mr-2" />
                Fazer Upgrade para EXPERT
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
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Zap className="h-8 w-8 text-purple-400" />
            Entradas Expert
          </h1>
        </div>
      </div>

      {/* Estatísticas do Dia */}
      {estatisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-400">Entradas Hoje</p>
              <p className="text-2xl font-bold text-white">{estatisticas.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-400">Greens</p>
              <p className="text-2xl font-bold text-green-400">{estatisticas.greens}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-400">Reds</p>
              <p className="text-2xl font-bold text-red-400">{estatisticas.reds}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-400">Lucro/Prejuízo</p>
              <p className={cn(
                'text-2xl font-bold',
                estatisticas.lucroTotal >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {formatCurrency(estatisticas.lucroTotal)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs + Botão Nova Entrada */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('expert')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center',
              tab === 'expert'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            )}
          >
            <Bot className="h-4 w-4 mr-1" />
            Entradas Expert
          </button>
          <button
            onClick={() => setTab('minhas')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center',
              tab === 'minhas'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            )}
          >
            <FileText className="h-4 w-4 mr-1" />
            Minhas Entradas ({entradasHoje.length})
          </button>
        </div>
        <Button 
          onClick={() => setModalAberto(true)} 
          className={cn(
            'bg-green-600 hover:bg-green-700',
            !banca && 'opacity-50 cursor-not-allowed'
          )}
          disabled={!banca}
          title={!banca ? 'Configure sua banca primeiro' : undefined}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nova Entrada
        </Button>
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
            <p className="text-zinc-400">Carregando entradas...</p>
          </div>
        </div>
      ) : tab === 'expert' ? (
        /* Entradas Expert */
        <div className="space-y-4">
          {/* Filtro Ao Vivo / Pré-Live */}
          <div className="flex gap-2">
            {([
              { value: 'todas', label: 'Todas' },
              { value: 'ao_vivo', label: 'Ao Vivo' },
              { value: 'pre_live', label: 'Pre-Live' },
            ] as const).map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltroExpert(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filtroExpert === f.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {(() => {
            const filtradas = entradasExpert.filter((e) => {
              if (filtroExpert === 'todas') return true;
              if (filtroExpert === 'ao_vivo') return e.partida.statusPartida === 'AO_VIVO';
              return e.partida.statusPartida === 'AGENDADA';
            });
            if (filtradas.length === 0) return (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-zinc-400">Nenhuma entrada disponível no momento</p>
                  <p className="text-sm text-zinc-500 mt-2">Aguarde novas partidas classificadas como OPERAR</p>
                </CardContent>
              </Card>
            );
            return filtradas.map((entrada) => {
              const config = confiancaConfig[entrada.confianca];
              const isAoVivo = entrada.partida.statusPartida === 'AO_VIVO';
              return (
                <Card key={entrada.id} className={cn(config.bg, config.border)}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Info Principal */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn('text-xs px-2 py-0.5 rounded font-medium', config.bg, config.text)}>
                            {config.label}
                          </span>
                          {isAoVivo && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> AO VIVO
                            </span>
                          )}
                          {!isAoVivo && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                              PRE-LIVE
                            </span>
                          )}
                          <span className="text-xs text-zinc-500">
                            {formatTime(entrada.partida.dataHora)} • {formatLiga(entrada.partida.liga)}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                          {entrada.partida.jogador1} vs {entrada.partida.jogador2}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" /> <span className="text-white font-medium">{entrada.mercado}</span>
                          </span>
                          <span className="text-zinc-400 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" /> Odd <span className="text-white font-medium">{entrada.odd.toFixed(2)}</span>
                          </span>
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Target className="h-4 w-4" /> Stake <span className="text-white font-medium">{formatCurrency(entrada.stake)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <Button onClick={() => handleCopiarEntrada(entrada)}>
                          Copiar Entrada
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            });
          })()}
        </div>
      ) : (
        /* Minhas Entradas */
        <div className="space-y-4">
          {entradasHoje.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-zinc-400">Você ainda não copiou nenhuma entrada hoje</p>
                <p className="text-sm text-zinc-500 mt-2">Vá para a aba &quot;Entradas Expert&quot; e copie uma entrada</p>
              </CardContent>
            </Card>
          ) : (
            entradasHoje.map((entrada) => {
              const config = confiancaConfig[entrada.confianca];
              const isFinalizada = entrada.status === 'FINALIZADA';
              
              return (
                <Card key={entrada.id} className={cn(
                  isFinalizada 
                    ? entrada.resultado === 'GREEN' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                    : 'bg-zinc-800/50'
                )}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Info Principal */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {isFinalizada ? (
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded font-medium',
                              entrada.resultado === 'GREEN' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            )}>
                              {entrada.resultado === 'GREEN' ? <><CheckCircle className="h-3 w-3 inline mr-1" />GREEN</> : <><XCircle className="h-3 w-3 inline mr-1" />RED</>}
                            </span>
                          ) : (
                            <span className={cn('text-xs px-2 py-0.5 rounded font-medium', config.bg, config.text)}>
                              {config.label}
                            </span>
                          )}
                          <span className="text-xs text-zinc-500">
                            {entrada.partida 
                              ? `${formatTime(entrada.partida.dataHora)} • ${formatLiga(entrada.partida.liga)}`
                              : `${formatTime(entrada.createdAt)}${entrada.analiseIA?.match(/ - (.+)$/) ? ` • ${formatLiga(entrada.analiseIA.match(/ - (.+)$/)![1])}` : ''}`}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                          {entrada.partida 
                            ? `${entrada.partida.jogador1.nome} vs ${entrada.partida.jogador2.nome}`
                            : entrada.analiseIA?.match(/: (.+?) vs (.+?) -/)
                              ? `${entrada.analiseIA.match(/: (.+?) vs (.+?) -/)![1]} vs ${entrada.analiseIA.match(/: (.+?) vs (.+?) -/)![2]}`
                              : entrada.mercado}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" /> <span className="text-white font-medium">{entrada.mercado}</span>
                          </span>
                          <span className="text-zinc-400 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" /> Odd <span className="text-white font-medium">{entrada.odd.toFixed(2)}</span>
                          </span>
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Target className="h-4 w-4" /> Stake <span className="text-white font-medium">{formatCurrency(entrada.stake)}</span>
                          </span>
                          {isFinalizada && entrada.lucro !== undefined && (
                            <span className={cn(
                              'font-medium',
                              entrada.lucro >= 0 ? 'text-green-400' : 'text-red-400'
                            )}>
                              {entrada.lucro >= 0 ? '+' : ''}{formatCurrency(entrada.lucro)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 flex-wrap">
                        {!isFinalizada && (
                          <>
                            <Button 
                              variant="outline" 
                              className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                              onClick={() => handleFinalizarEntrada(entrada.id, 'GREEN')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Green
                            </Button>
                            <Button 
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                              onClick={() => handleFinalizarEntrada(entrada.id, 'RED')}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Red
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-zinc-600 text-zinc-400 hover:bg-zinc-700"
                          onClick={() => handleAbrirEdicao(entrada)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                          onClick={() => setDeletandoId(entrada.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={!!editandoEntrada} onOpenChange={(open) => !open && setEditandoEntrada(null)}>
        <DialogContent className="max-w-lg p-0 border-purple-500/20">
          <DialogHeader className="p-5 border-b border-zinc-800 bg-gradient-to-r from-purple-500/10 to-transparent relative">
            <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Pencil className="h-5 w-5 text-purple-400" />
              Editar Entrada
            </DialogTitle>
            <button
              onClick={() => setEditandoEntrada(null)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </DialogHeader>
          
          <div className="p-5 space-y-5">
            <div>
              <p className="text-xs text-purple-400 font-semibold mb-3 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" /> DETALHES DO JOGO
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Liga</label>
                  <select
                    value={editForm.liga}
                    onChange={(e) => setEditForm({ ...editForm, liga: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                  >
                    {ligasOptions.map((liga) => (
                      <option key={liga.value} value={liga.value}>{liga.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Mercado</label>
                  <select
                    value={editForm.mercado}
                    onChange={(e) => setEditForm({ ...editForm, mercado: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                  >
                    {mercadosOptions.map((mercado) => (
                      <option key={mercado} value={mercado}>{mercado}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Jogador 1</label>
                  <input
                    type="text"
                    value={editForm.jogador1}
                    onChange={(e) => setEditForm({ ...editForm, jogador1: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Jogador 2</label>
                  <input
                    type="text"
                    value={editForm.jogador2}
                    onChange={(e) => setEditForm({ ...editForm, jogador2: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-purple-400 font-semibold mb-3 flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> DETALHES DA APOSTA
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Valor (R$)</label>
                  <input
                    type="number"
                    value={editForm.stake}
                    onChange={(e) => setEditForm({ ...editForm, stake: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">ODD</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.odd}
                    onChange={(e) => setEditForm({ ...editForm, odd: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-purple-400 font-semibold mb-3 flex items-center gap-1">
                <Target className="h-3 w-3" /> RESULTADO
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'PENDENTE', label: 'Andamento' },
                  { value: 'GREEN', label: 'Green' },
                  { value: 'RED', label: 'Red' },
                  { value: 'MEIO_GREEN', label: 'Meio Green' },
                  { value: 'MEIO_RED', label: 'Meio Red' },
                  { value: 'REEMBOLSO', label: 'Reembolso' },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setEditForm({ ...editForm, status: status.value as any })}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                      editForm.status === status.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    )}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 mt-2"
              onClick={handleSalvarEdicao}
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Registro de Nova Aposta */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg p-0 border-purple-500/20">
          <DialogHeader className="p-5 border-b border-zinc-800 bg-gradient-to-r from-purple-500/10 to-transparent relative">
            <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-400" />
              Nova Entrada
            </DialogTitle>
            <button
              onClick={() => setModalAberto(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </DialogHeader>
          
          <div className="p-5 space-y-5">
            {/* Detalhes do Jogo */}
            <div>
              <p className="text-xs text-purple-400 font-semibold mb-3 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" /> DETALHES DO JOGO
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Data</label>
                  <input
                    type="date"
                    value={novaEntrada.data}
                    onChange={(e) => setNovaEntrada({ ...novaEntrada, data: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Horário</label>
                  <input
                    type="time"
                    value={novaEntrada.horario}
                    onChange={(e) => setNovaEntrada({ ...novaEntrada, horario: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Liga</label>
                  <select
                    value={novaEntrada.liga}
                    onChange={(e) => setNovaEntrada({ ...novaEntrada, liga: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                  >
                    {ligasOptions.map((liga) => (
                      <option key={liga.value} value={liga.value}>{liga.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Mercado</label>
                  <select
                    value={novaEntrada.mercado}
                    onChange={(e) => setNovaEntrada({ ...novaEntrada, mercado: e.target.value })}
                    className="w-full bg-zinc-900 border border-purple-500/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    {mercadosOptions.map((mercado) => (
                      <option key={mercado} value={mercado}>{mercado}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Jogador 1</label>
                  <input
                    type="text"
                    placeholder="Ex: ODYSSEY"
                    value={novaEntrada.jogador1}
                    onChange={(e) => setNovaEntrada({ ...novaEntrada, jogador1: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Jogador 2</label>
                  <input
                    type="text"
                    placeholder="Ex: HAYMAKER"
                    value={novaEntrada.jogador2}
                    onChange={(e) => setNovaEntrada({ ...novaEntrada, jogador2: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Detalhes da Aposta */}
            <div>
              <p className="text-xs text-purple-400 font-semibold mb-3 flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> DETALHES DA APOSTA
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Valor (R$)</label>
                  <input
                    type="number"
                    value={novaEntrada.valor}
                    onChange={(e) => setNovaEntrada({ ...novaEntrada, valor: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">ODD</label>
                  <input
                    type="number"
                    step="0.01"
                    value={novaEntrada.odd}
                    onChange={(e) => setNovaEntrada({ ...novaEntrada, odd: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-purple-500/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
              
              {/* Valores Rápidos */}
              <div className="flex flex-wrap gap-2 mt-3">
                {valoresRapidos.map((valor) => (
                  <button
                    key={valor}
                    onClick={() => setNovaEntrada({ ...novaEntrada, valor })}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      novaEntrada.valor === valor
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    )}
                  >
                    R$ {valor}
                  </button>
                ))}
              </div>
            </div>

            {/* Status/Resultado */}
            <div>
              <p className="text-xs text-purple-400 font-semibold mb-3 flex items-center gap-1">
                <Target className="h-3 w-3" /> RESULTADO
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'PENDENTE', label: 'Andamento' },
                  { value: 'GREEN', label: 'Green' },
                  { value: 'RED', label: 'Red' },
                  { value: 'MEIO_GREEN', label: 'Meio Green' },
                  { value: 'MEIO_RED', label: 'Meio Red' },
                  { value: 'REEMBOLSO', label: 'Reembolso' },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setNovaEntrada({ ...novaEntrada, status: status.value as any })}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                      novaEntrada.status === status.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    )}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Botão Salvar */}
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 mt-2"
              onClick={async () => {
                try {
                  await entradasApi.criarManual({
                    data: novaEntrada.data,
                    horario: novaEntrada.horario,
                    liga: novaEntrada.liga,
                    mercado: novaEntrada.mercado,
                    jogador1: novaEntrada.jogador1,
                    jogador2: novaEntrada.jogador2,
                    valor: novaEntrada.valor,
                    odd: novaEntrada.odd,
                    status: novaEntrada.status,
                  });
                  // Recarregar entradas
                  const [hojeRes, statsRes] = await Promise.all([
                    entradasApi.getHoje(),
                    entradasApi.getEstatisticas(),
                  ]);
                  setEntradasHoje(hojeRes.data);
                  setEstatisticas(statsRes.data);
                  // Resetar formulário
                  setNovaEntrada({
                    data: new Date().toISOString().split('T')[0],
                    horario: new Date().toTimeString().slice(0, 5),
                    liga: 'GT_12MIN',
                    mercado: 'Over 2.5 FT',
                    jogador1: '',
                    jogador2: '',
                    valor: 100,
                    odd: 1.80,
                    status: 'PENDENTE' as 'PENDENTE' | 'GREEN' | 'RED' | 'MEIO_GREEN' | 'MEIO_RED' | 'REEMBOLSO',
                  });
                  setModalAberto(false);
                  setTab('minhas');
                } catch (err: any) {
                  setError(err.response?.data?.message || 'Erro ao salvar entrada');
                }
              }}
            >
              Salvar Entrada
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={!!deletandoId} onOpenChange={(open) => !open && setDeletandoId(null)}>
        <DialogContent className="max-w-sm p-0 border-red-500/20">
          <DialogHeader className="p-5 border-b border-zinc-800 bg-gradient-to-r from-red-500/10 to-transparent">
            <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Excluir Entrada
            </DialogTitle>
          </DialogHeader>
          <div className="p-5 space-y-4">
            <p className="text-zinc-400 text-sm">Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400" onClick={() => setDeletandoId(null)}>
                Cancelar
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeletarEntrada}>
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
