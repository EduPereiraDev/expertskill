'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { entradasApi, Entrada, EstatisticasGerais, ResultadoEntrada } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { History, CheckCircle, XCircle, BarChart3, TrendingUp, Target, Download, Trash2, MoreVertical, DollarSign } from 'lucide-react';

export default function HistoricoPage() {
  const { user } = useAuthStore();
  const { confirm } = useConfirm();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroResultado, setFiltroResultado] = useState<ResultadoEntrada | ''>('');

  useEffect(() => {
    fetchData({});
  }, []);

  const fetchData = async (filtros: { dataInicio?: string; dataFim?: string; resultado?: ResultadoEntrada | '' }) => {
    setIsLoading(true);
    setError('');
    try {
      const [historicoRes, statsRes] = await Promise.all([
        entradasApi.getHistorico({
          dataInicio: filtros.dataInicio || undefined,
          dataFim: filtros.dataFim || undefined,
          resultado: filtros.resultado || undefined,
        }),
        entradasApi.getEstatisticasGerais(),
      ]);
      setEntradas(historicoRes.data);
      setEstatisticas(statsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar histórico');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltrar = () => {
    fetchData({ dataInicio, dataFim, resultado: filtroResultado });
  };

  const handleLimparFiltros = () => {
    setDataInicio('');
    setDataFim('');
    setFiltroResultado('');
    fetchData({});
  };

  const handleDeletarEntrada = async (entradaId: string) => {
    const confirmed = await confirm({
      title: 'Excluir Entrada',
      message: 'Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      await entradasApi.deletar(entradaId);
      setEntradas(entradas.filter(e => e.id !== entradaId));
      // Atualizar estatísticas
      const statsRes = await entradasApi.getEstatisticasGerais();
      setEstatisticas(statsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir entrada');
    }
  };

  const handleExportCSV = () => {
    if (entradas.length === 0) return;

    const headers = ['Data', 'Partida', 'Mercado', 'Odd', 'Stake', 'Resultado', 'Lucro'];
    const rows = entradas.map((entrada) => [
      formatDate(entrada.createdAt),
      entrada.partida 
        ? `${entrada.partida.jogador1.nome} vs ${entrada.partida.jogador2.nome}` 
        : '-',
      entrada.mercado,
      entrada.odd.toFixed(2),
      entrada.stake.toFixed(2),
      entrada.resultado || '-',
      (entrada.lucro || 0).toFixed(2),
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_entradas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <History className="h-8 w-8 text-purple-400" />
            Histórico
          </h1>
          <p className="mt-1 text-zinc-400">Todas as suas entradas finalizadas</p>
        </div>
        {entradas.length > 0 && (
          <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      {/* Estatísticas Gerais */}
      {estatisticas && (
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Total</p>
              <p className="text-xl font-bold text-white">{estatisticas.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Greens</p>
              <p className="text-xl font-bold text-green-400">{estatisticas.greens}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Reds</p>
              <p className="text-xl font-bold text-red-400">{estatisticas.reds}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Taxa Acerto</p>
              <p className="text-xl font-bold text-white">{estatisticas.taxaAcerto.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Lucro Total</p>
              <p className={cn(
                'text-xl font-bold',
                estatisticas.lucroTotal >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {formatCurrency(estatisticas.lucroTotal)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">ROI</p>
              <p className={cn(
                'text-xl font-bold',
                estatisticas.roi >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {estatisticas.roi.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Seq. Greens</p>
              <p className="text-xl font-bold text-green-400">{estatisticas.maiorSequenciaGreens}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400">Seq. Reds</p>
              <p className="text-xl font-bold text-red-400">{estatisticas.maiorSequenciaReds}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm text-zinc-400 mb-1 block">Data Início</label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm text-zinc-400 mb-1 block">Data Fim</label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm text-zinc-400 mb-1 block">Resultado</label>
              <select
                id="filtro-resultado"
                value={filtroResultado}
                onChange={(e) => {
                  const value = e.target.value as ResultadoEntrada | '';
                  setFiltroResultado(value);
                }}
                className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todos</option>
                <option value="GREEN">Green</option>
                <option value="RED">Red</option>
                <option value="REEMBOLSO">Reembolso</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFiltrar}>Filtrar</Button>
              <Button variant="outline" onClick={handleLimparFiltros}>Limpar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <p className="text-zinc-400">Carregando histórico...</p>
          </div>
        </div>
      ) : entradas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-400">Nenhuma entrada encontrada</p>
            <p className="text-sm text-zinc-500 mt-2">
              {dataInicio || dataFim || filtroResultado
                ? 'Tente ajustar os filtros'
                : 'Suas entradas finalizadas aparecerão aqui'}
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Lista de Entradas */
        <div className="space-y-3">
          {entradas.map((entrada) => (
            <Card
              key={entrada.id}
              className={cn(
                entrada.resultado === 'GREEN'
                  ? 'bg-green-500/5 border-green-500/20'
                  : entrada.resultado === 'RED'
                  ? 'bg-red-500/5 border-red-500/20'
                  : entrada.resultado === 'REEMBOLSO'
                  ? 'bg-zinc-700/20 border-zinc-500/20'
                  : 'bg-zinc-800/50'
              )}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Resultado */}
                  <div className="flex items-center gap-3">
                    {entrada.resultado === 'GREEN' ? (
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    ) : entrada.resultado === 'REEMBOLSO' ? (
                      <DollarSign className="h-6 w-6 text-zinc-400" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-400" />
                    )}
                    <div>
                      <p className="font-medium text-white">
                        {entrada.partida
                          ? `${entrada.partida.jogador1.nome} vs ${entrada.partida.jogador2.nome}`
                          : entrada.mercado}
                      </p>
                      <p className="text-xs text-zinc-500">{formatDate(entrada.createdAt)}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-wrap gap-4 text-sm">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" /> <span className="text-white">{entrada.mercado}</span>
                    </span>
                    <span className="text-zinc-400 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" /> Odd <span className="text-white">{entrada.odd.toFixed(2)}</span>
                    </span>
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Target className="h-4 w-4" /> Stake <span className="text-white">{formatCurrency(entrada.stake)}</span>
                    </span>
                  </div>

                  {/* Lucro */}
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-lg font-bold',
                        entrada.resultado === 'REEMBOLSO' ? 'text-zinc-400' : (entrada.lucro || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {entrada.resultado === 'REEMBOLSO' ? 'R$ 0,00' : `${(entrada.lucro || 0) >= 0 ? '+' : ''}${formatCurrency(entrada.lucro || 0)}`}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeletarEntrada(entrada.id)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Excluir entrada"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
