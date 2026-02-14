'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bancaApi, Banca } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Wallet, TrendingUp, Target, AlertTriangle, Check } from 'lucide-react';

type TipoGestao = 'AGRESSIVA' | 'CONSERVADORA' | 'PERSONALIZADA';

const gestaoOptions = [
  { 
    value: 'AGRESSIVA' as TipoGestao, 
    label: 'Agressiva', 
    description: 'Divide por 10 (10 entradas)',
    divisor: 10
  },
  { 
    value: 'CONSERVADORA' as TipoGestao, 
    label: 'Conservadora', 
    description: 'Divide por 20 (20 entradas)',
    divisor: 20
  },
  { 
    value: 'PERSONALIZADA' as TipoGestao, 
    label: 'Personalizada', 
    description: 'Defina seu próprio divisor',
    divisor: null
  },
];

export default function BancaPage() {
  const [banca, setBanca] = useState<Banca | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    metaDiaria: '',
    stopLoss: '',
    tipoGestao: 'AGRESSIVA' as TipoGestao,
    divisor: '',
    oddMinimaCustom: '',
    oddMaximaCustom: '',
    oddPersonalizada: false,
  });

  useEffect(() => {
    const fetchBanca = async () => {
      try {
        const { data } = await bancaApi.get();
        setBanca(data);
        if (data) {
          setFormData({
            nome: data.nome || '',
            valor: data.valor.toString(),
            metaDiaria: data.metaDiaria.toString(),
            stopLoss: data.stopLoss?.toString() || '',
            tipoGestao: data.tipoGestao,
            divisor: data.divisor?.toString() || '',
            oddMinimaCustom: '',
            oddMaximaCustom: '',
            oddPersonalizada: false,
          });
        }
      } catch {
        setBanca(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanca();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const payload = {
        nome: formData.nome || 'Minha Banca',
        valor: parseFloat(formData.valor),
        metaDiaria: parseFloat(formData.metaDiaria),
        stopLoss: parseFloat(formData.stopLoss) || parseFloat(formData.metaDiaria) || 0,
        tipoGestao: formData.tipoGestao,
        ...(formData.tipoGestao === 'PERSONALIZADA' && { divisor: parseInt(formData.divisor) }),
      };

      const { data } = await bancaApi.create(payload);
      setBanca(data);
      setSuccess('Banca configurada com sucesso!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar banca');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculatePreview = () => {
    const valor = parseFloat(formData.valor) || 0;
    const meta = parseFloat(formData.metaDiaria) || 0;
    const stopLoss = parseFloat(formData.stopLoss) || meta;
    let divisor = 10;

    if (formData.tipoGestao === 'CONSERVADORA') divisor = 20;
    if (formData.tipoGestao === 'PERSONALIZADA') divisor = parseInt(formData.divisor) || 15;

    const stake = valor / divisor;
    let oddMinimaSugerida = meta > 0 ? 1 + (meta / valor) : 1.50;
    oddMinimaSugerida = Math.max(1.50, Math.min(2.20, oddMinimaSugerida));
    const oddMaximaSugerida = 2.20;

    const oddMinima = formData.oddPersonalizada && formData.oddMinimaCustom
      ? parseFloat(formData.oddMinimaCustom)
      : oddMinimaSugerida;
    const oddMaxima = formData.oddPersonalizada && formData.oddMaximaCustom
      ? parseFloat(formData.oddMaximaCustom)
      : oddMaximaSugerida;
    
    // Calcular entradas necessárias para cada odd
    const entradasOddMin = stake > 0 ? Math.ceil(meta / (stake * (oddMinima - 1))) : 0;
    const entradasOddMax = stake > 0 ? Math.ceil(meta / (stake * (oddMaxima - 1))) : 0;

    // Stop loss: quantos reds seguidos até atingir
    const redsParaStop = stake > 0 ? Math.floor(stopLoss / stake) : 0;
    const stopPctBanca = valor > 0 ? Math.round((stopLoss / valor) * 100) : 0;

    return { stake, oddMinima, oddMaxima, entradasOddMin, entradasOddMax, divisor, stopLoss, redsParaStop, stopPctBanca };
  };

  const preview = calculatePreview();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          Gestão de Banca
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configurar Banca</CardTitle>
            <CardDescription>
              Defina o valor da sua banca e tipo de gestão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                  {success}
                </div>
              )}

              <Input
                label="Nome da Banca"
                type="text"
                placeholder="Minha Banca Principal"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />

              <Input
                label="Valor da Banca (R$)"
                type="number"
                placeholder="100.00"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                required
              />

              <Input
                label="Meta Diária (R$)"
                type="number"
                placeholder="30.00"
                step="0.01"
                min="0"
                value={formData.metaDiaria}
                onChange={(e) => setFormData({ ...formData, metaDiaria: e.target.value })}
                required
              />

              <div className="space-y-1">
                <Input
                  label="Stop Loss Diário (R$)"
                  type="number"
                  placeholder={formData.metaDiaria || '30.00'}
                  step="0.01"
                  min="0"
                  value={formData.stopLoss}
                  onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                />
                <p className="text-[10px] text-zinc-500">
                  Limite máximo de perda no dia. Se vazio, usa o valor da meta diária.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Tipo de Gestão</label>
                <div className="grid gap-3">
                  {gestaoOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipoGestao: option.value })}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border text-left transition-all',
                        formData.tipoGestao === option.value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-zinc-700 hover:border-zinc-600'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        formData.tipoGestao === option.value
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-zinc-500'
                      )}>
                        {formData.tipoGestao === option.value && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{option.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {formData.tipoGestao === 'PERSONALIZADA' && (
                <Input
                  label="Divisor Personalizado"
                  type="number"
                  placeholder="15"
                  min="1"
                  value={formData.divisor}
                  onChange={(e) => setFormData({ ...formData, divisor: e.target.value })}
                  required
                />
              )}

              {/* Odd Personalizada */}
              <div className="space-y-3">
                <div 
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                    formData.oddPersonalizada 
                      ? 'bg-purple-500/10 border-purple-500/30' 
                      : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                  )}
                  onClick={() => setFormData({ ...formData, oddPersonalizada: !formData.oddPersonalizada })}
                >
                  <div>
                    <p className="text-sm font-medium text-white">Personalizar Odds</p>
                    <p className="text-xs text-zinc-500">
                      {formData.oddPersonalizada ? 'Usando suas odds' : 'Usando odds sugeridas pelo sistema'}
                    </p>
                  </div>
                  <div className={cn(
                    'h-5 w-9 rounded-full transition-colors flex items-center px-0.5',
                    formData.oddPersonalizada ? 'bg-purple-500 justify-end' : 'bg-zinc-600 justify-start'
                  )}>
                    <div className="h-4 w-4 rounded-full bg-white" />
                  </div>
                </div>

                {formData.oddPersonalizada && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Odd Mínima"
                      type="number"
                      placeholder="1.50"
                      step="0.01"
                      min="1.01"
                      value={formData.oddMinimaCustom}
                      onChange={(e) => setFormData({ ...formData, oddMinimaCustom: e.target.value })}
                    />
                    <Input
                      label="Odd Máxima"
                      type="number"
                      placeholder="2.20"
                      step="0.01"
                      min="1.01"
                      value={formData.oddMaximaCustom}
                      onChange={(e) => setFormData({ ...formData, oddMaximaCustom: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isSaving}>
                {banca ? 'Atualizar Banca' : 'Criar Banca'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prévia dos Cálculos</CardTitle>
              <CardDescription>
                Veja como sua banca será gerenciada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <p className="text-sm text-zinc-400">Stake por Entrada</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {formatCurrency(preview.stake)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <p className="text-sm text-zinc-400">Entradas Disponíveis</p>
                  <p className="text-2xl font-bold text-white">
                    {preview.divisor}
                  </p>
                </div>
                <div className={cn('p-4 rounded-lg', formData.oddPersonalizada && formData.oddMinimaCustom ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-zinc-800/50')}>
                  <p className="text-sm text-zinc-400">Odd Mínima {formData.oddPersonalizada && formData.oddMinimaCustom && <span className="text-purple-400 text-[10px]">(sua)</span>}</p>
                  <p className="text-2xl font-bold text-white">
                    {preview.oddMinima.toFixed(2)}
                  </p>
                  <p className="text-xs text-purple-400 mt-1">
                    {preview.entradasOddMin} entradas para meta
                  </p>
                </div>
                <div className={cn('p-4 rounded-lg', formData.oddPersonalizada && formData.oddMaximaCustom ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-zinc-800/50')}>
                  <p className="text-sm text-zinc-400">Odd Máxima {formData.oddPersonalizada && formData.oddMaximaCustom && <span className="text-purple-400 text-[10px]">(sua)</span>}</p>
                  <p className="text-2xl font-bold text-white">
                    {preview.oddMaxima.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    {preview.entradasOddMax} entradas para meta
                  </p>
                </div>
              </div>

              {/* Stop Loss Preview */}
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> Stop Loss
                    </p>
                    <p className="text-2xl font-bold text-red-400 mt-1">
                      {formatCurrency(preview.stopLoss)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">{preview.stopPctBanca}% da banca</p>
                    <p className="text-xs text-red-400 mt-0.5">{preview.redsParaStop} reds seguidos</p>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">
                  {preview.stopPctBanca <= 10
                    ? 'Stop conservador — protege bem a banca'
                    : preview.stopPctBanca <= 20
                    ? 'Stop moderado — equilibrio entre risco e retorno'
                    : preview.stopPctBanca <= 30
                    ? 'Stop agressivo — risco elevado de comprometer a banca'
                    : 'Stop muito alto — risco critico, considere reduzir'}
                </p>
              </div>
            </CardContent>
          </Card>

          {banca && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  Progresso de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Barra de Progresso da Meta */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Target className="h-4 w-4" /> Meta Diária
                      </span>
                      <span className="text-white font-medium">
                        {formatCurrency(banca.progressoHoje?.lucro || 0)} / {formatCurrency(banca.metaDiaria)}
                      </span>
                    </div>
                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          (banca.progressoHoje?.lucro || 0) >= banca.metaDiaria 
                            ? 'bg-green-500' 
                            : (banca.progressoHoje?.lucro || 0) >= 0 
                              ? 'bg-purple-500' 
                              : 'bg-red-500'
                        )}
                        style={{ 
                          width: `${Math.min(100, Math.max(0, ((banca.progressoHoje?.lucro || 0) / banca.metaDiaria) * 100))}%` 
                        }}
                      />
                    </div>
                    {(banca.progressoHoje?.lucro || 0) >= banca.metaDiaria && (
                      <p className="text-green-400 text-sm font-medium text-center">
                        Meta batida! Considere parar por hoje.
                      </p>
                    )}
                    {(banca.progressoHoje?.lucro || 0) < 0 && (banca.progressoHoje?.lucro || 0) > -(preview.stopLoss) && (
                      <p className="text-yellow-400 text-sm flex items-center justify-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Dia negativo - mantenha a gestão
                      </p>
                    )}
                    {(banca.progressoHoje?.lucro || 0) <= -(preview.stopLoss) && preview.stopLoss > 0 && (
                      <p className="text-red-400 text-sm font-semibold flex items-center justify-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> STOP LOSS ATINGIDO — pare de operar hoje!
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="text-center p-3 rounded-lg bg-zinc-800/50">
                      <p className="text-2xl font-bold text-white">{banca.progressoHoje?.entradas || 0}</p>
                      <p className="text-xs text-zinc-400">Entradas</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-2xl font-bold text-green-400">{banca.progressoHoje?.greens || 0}</p>
                      <p className="text-xs text-zinc-400">Greens</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-2xl font-bold text-red-400">{banca.progressoHoje?.reds || 0}</p>
                      <p className="text-xs text-zinc-400">Reds</p>
                    </div>
                  </div>

                  {/* Barra de Stop Loss */}
                  {preview.stopLoss > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-red-400" /> Stop Loss
                        </span>
                        <span className="text-white font-medium">
                          {formatCurrency(Math.abs(Math.min(0, banca.progressoHoje?.lucro || 0)))} / {formatCurrency(preview.stopLoss)}
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, (Math.abs(Math.min(0, banca.progressoHoje?.lucro || 0)) / preview.stopLoss) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Lucro/Prejuízo</span>
                      <span className={cn(
                        'text-2xl font-bold',
                        (banca.progressoHoje?.lucro || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {(banca.progressoHoje?.lucro || 0) >= 0 ? '+' : ''}
                        {formatCurrency(banca.progressoHoje?.lucro || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
