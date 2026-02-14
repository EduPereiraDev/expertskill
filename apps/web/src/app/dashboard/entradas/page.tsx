'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { entradasApi, EntradaExpert, Entrada, EstatisticasHoje, ResultadoEntrada, bancaApi, Banca } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Zap, Lock, Check, Bot, FileText, Crown, CheckCircle, XCircle, BarChart3, Target, TrendingUp, Plus, Calendar, Clock, DollarSign, Percent } from 'lucide-react';

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

const mercadosOptions = [
  'Over 0.5 HT', 'Over 1.5 HT', 'Over 2.5 HT',
  'Over 1.5 FT', 'Over 2.5 FT', 'Over 3.5 FT', 'Over 4.5 FT',
  'Under 2.5 FT', 'Under 3.5 FT', 'Under 4.5 FT',
  'Ambas Marcam HT', 'Ambas Marcam FT',
  'Resultado Final', 'Handicap',
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
  
  // Modal de registro manual
  const [banca, setBanca] = useState<Banca | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
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
          {entradasExpert.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-zinc-400">Nenhuma entrada disponível no momento</p>
                <p className="text-sm text-zinc-500 mt-2">Aguarde novas partidas classificadas como OPERAR</p>
              </CardContent>
            </Card>
          ) : (
            entradasExpert.map((entrada) => {
              const config = confiancaConfig[entrada.confianca];
              
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
                          <span className="text-xs text-zinc-500">
                            {formatTime(entrada.partida.dataHora)} • {entrada.partida.liga.replace('_', ' ')}
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
            })
          )}
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
                              ? `${formatTime(entrada.partida.dataHora)} • ${entrada.partida.liga.replace('_', ' ')}`
                              : formatTime(entrada.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                          {entrada.partida 
                            ? `${entrada.partida.jogador1.nome} vs ${entrada.partida.jogador2.nome}`
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
                      {!isFinalizada && (
                        <div className="flex gap-2">
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
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

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
    </div>
  );
}
