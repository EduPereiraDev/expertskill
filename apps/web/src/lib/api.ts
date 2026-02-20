import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  plan: 'FREE' | 'BASICO' | 'PRO' | 'EXPERT';
  planExpiresAt: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post<{ message: string; user: User }>('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get<User>('/auth/me'),

  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put<{ message: string; user: User }>('/auth/profile', data),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<{ message: string }>('/auth/password', data),

  forgotPassword: (data: { email: string }) =>
    api.post<{ message: string }>('/auth/forgot-password', data),

  resetPassword: (data: { token: string; password: string }) =>
    api.post<{ message: string }>('/auth/reset-password', data),
};

export interface Banca {
  id: string;
  nome: string;
  valor: number;
  metaDiaria: number;
  stopLoss: number | null;
  tipoGestao: 'AGRESSIVA' | 'CONSERVADORA' | 'PERSONALIZADA';
  divisor: number | null;
  stake: number;
  ativa: boolean;
  calculado: {
    entradasNecessarias: number;
    oddMinima: number;
    lucroEsperado: number;
  };
  progressoHoje?: {
    entradas: number;
    greens: number;
    reds: number;
    lucro: number;
  };
}

export const bancaApi = {
  get: () => api.get<Banca>('/banca'),
  
  create: (data: { valor: number; metaDiaria: number; tipoGestao: string; divisor?: number }) =>
    api.post<Banca>('/banca', data),
};

export type Liga = 'GT_12MIN' | 'VOLTA_6MIN' | 'H2H' | 'GT_8MIN';
export type Classificacao = 'OPERAR' | 'CAUTELA' | 'EVITAR';

export interface RadarPartida {
  id: string;
  jogador1: { nome: string; mediaGolsFT: number; percentualOver: number; gols?: number };
  jogador2: { nome: string; mediaGolsFT: number; percentualOver: number; gols?: number };
  liga: Liga;
  dataHora: string;
  status: 'AGENDADA' | 'AO_VIVO' | 'FINALIZADA' | 'CANCELADA';
  cenario: 'JOGO_FRACO' | 'OVER_SEGURANDO' | 'MELHOR_JOGO';
  cenarioMsg?: string;
  classificacao: Classificacao;
  placar?: { home: number; away: number };
  indicadores: {
    mediaTotal: number;
    overMedio: number;
    probabilidadeOver25: number;
  };
  veredicto: {
    acao: 'ENTRA' | 'NAO_ENTRA' | 'ESPERA';
    linha: string;
    confianca: number;
    motivo: string;
  };
}

export interface HistoricoPartida {
  id: string;
  data: string;
  adversario: string;
  golsPro: number;
  golsContra: number;
  totalGols: number;
  resultado: 'V' | 'E' | 'D';
  over25: boolean;
  golsHT: number;
  golsHTContra?: number;
  totalGolsHT?: number;
  golsFT: number;
  btts?: boolean;
}

export interface JogadorStatsDetalhado {
  nome: string;
  ultimasPartidas: HistoricoPartida[];
  mediaGolsHT: number;
  mediaGolsFT: number;
  percentualOver: number;
  percentual0x0: number;
  golsPorTempo: { ht: number; segundoTempo: number };
  sequencia: string[];
  streakOver: number;
  streakUnder: number;
  mediaGolsSofridos: number;
  percentualOver15HT: number;
  percentualOver05HT: number;
  percentualBTTS: number;
  maiorGoleada: { pro: number; contra: number };
  consistencia: 'ALTA' | 'MEDIA' | 'BAIXA';
}

export interface AnaliseDetalhada {
  partida: RadarPartida;
  jogador1Stats: JogadorStatsDetalhado;
  jogador2Stats: JogadorStatsDetalhado;
  h2h: {
    confrontosDiretos: HistoricoPartida[];
    totalJogos: number;
    vitoriasJ1: number;
    vitoriasJ2: number;
    empates: number;
    mediaGolsH2H: number;
    over25H2H: number;
    over15HTH2H: number;
    bttsH2H: number;
  };
  padroes: {
    tendenciaHT: 'GOL_PROVAVEL' | 'LENTO' | 'NEUTRO';
    tendenciaFT: 'OVER' | 'UNDER' | 'NEUTRO';
    risco0x0: 'BAIXO' | 'MEDIO' | 'ALTO';
    melhorMomento: string;
  };
  mercado: {
    linhaSegura: string;
    linhaValor: string;
    riscoPrincipal: string;
    confianca: number;
    alertas: string[];
  };
  recomendacao: {
    classificacao: Classificacao;
    motivo: string;
    linhasSugeridas: string[];
  };
}

export interface RadarLinhaItem {
  linha: string;
  pagou: number;
  total: number;
  taxa: number;
  tendencia: 'QUENTE' | 'MORNA' | 'FRIA';
  sequencia: ('GREEN' | 'RED')[];
  streakAtual: number;
  streakTipo: 'GREEN' | 'RED';
}

export interface RadarLinhaAoVivo {
  partidaId: string;
  jogador1: string;
  jogador2: string;
  liga: Liga;
  placar: { home: number; away: number };
  golsHT: number;
  linhasPagas: string[];
  linhasPendentes: string[];
  mediaFT: number;
  mediaHT: number;
}

export interface RadarLinhasResponse {
  linhas: RadarLinhaItem[];
  aoVivo: RadarLinhaAoVivo[];
  totalPartidas: number;
  liga: string;
}

export const radarApi = {
  getPartidas: (liga?: Liga) => 
    api.get<RadarPartida[]>('/radar', { params: { liga } }),
  
  getProximas: (liga?: Liga) => 
    api.get<RadarPartida[]>('/radar/proximas', { params: { liga } }),
  
  getAoVivo: () => 
    api.get<RadarPartida[]>('/radar/ao-vivo'),

  getAnaliseDetalhada: (partidaId: string) =>
    api.get<AnaliseDetalhada>(`/radar/analise/${partidaId}`),

  buscarJogador: (nome: string) =>
    api.get<any[]>('/radar/jogador/busca', { params: { nome } }),

  getLinhas: (liga?: Liga) =>
    api.get<RadarLinhasResponse>('/radar/linhas', { params: { liga } }),
};

export type NivelConfianca = 'BAIXA' | 'MEDIA' | 'ALTA';
export type StatusEntrada = 'PENDENTE' | 'CONFIRMADA' | 'FINALIZADA' | 'CANCELADA';
export type ResultadoEntrada = 'GREEN' | 'RED' | 'REEMBOLSO';

export interface EntradaExpert {
  id: string;
  partida: {
    id: string;
    jogador1: string;
    jogador2: string;
    liga: string;
    dataHora: string;
    statusPartida?: string;
  };
  mercado: string;
  odd: number;
  stake: number;
  confianca: NivelConfianca;
  analiseIA: string;
  status: StatusEntrada;
  resultado?: ResultadoEntrada;
  lucro?: number;
}

export interface Entrada {
  id: string;
  mercado: string;
  odd: number;
  stake: number;
  confianca: NivelConfianca;
  analiseIA: string;
  status: StatusEntrada;
  resultado?: ResultadoEntrada;
  lucro?: number;
  createdAt: string;
  partida?: {
    id: string;
    jogador1: { nome: string };
    jogador2: { nome: string };
    liga: string;
    dataHora: string;
  };
}

export interface EstatisticasHoje {
  total: number;
  greens: number;
  reds: number;
  lucroTotal: number;
  taxaAcerto: number;
}

export const entradasApi = {
  getExpert: () => api.get<EntradaExpert[]>('/entradas/expert'),
  
  getHoje: () => api.get<Entrada[]>('/entradas'),
  
  getEstatisticas: () => api.get<EstatisticasHoje>('/entradas/estatisticas'),
  
  criar: (data: { partidaId: string; mercado: string; odd: number }) =>
    api.post<Entrada>('/entradas', data),
  
  criarManual: (data: {
    data: string;
    horario: string;
    liga: string;
    mercado: string;
    jogador1: string;
    jogador2: string;
    valor: number;
    odd: number;
    status: string;
  }) => api.post<Entrada>('/entradas/manual', data),
  
  finalizar: (id: string, resultado: ResultadoEntrada) =>
    api.patch<Entrada>(`/entradas/${id}/finalizar`, { resultado }),
  
  deletar: (id: string) =>
    api.delete(`/entradas/${id}`),
  
  atualizar: (id: string, data: { mercado?: string; odd?: number; stake?: number; resultado?: ResultadoEntrada; analiseIA?: string }) =>
    api.patch<Entrada>(`/entradas/${id}`, data),
  
  getHistorico: (filtros?: { dataInicio?: string; dataFim?: string; resultado?: ResultadoEntrada }) => {
    const params: Record<string, string> = {};
    if (filtros?.dataInicio) params.dataInicio = filtros.dataInicio;
    if (filtros?.dataFim) params.dataFim = filtros.dataFim;
    if (filtros?.resultado) params.resultado = filtros.resultado;
    return api.get<Entrada[]>('/entradas/historico', { params });
  },
  
  getEstatisticasGerais: () => api.get<EstatisticasGerais>('/entradas/estatisticas-gerais'),
  
  // Dashboard endpoints
  getUltimasEntradas: (limit = 5) => api.get<UltimaEntrada[]>(`/entradas/dashboard/ultimas?limit=${limit}`),
  getHeatmapHorarios: () => api.get<HeatmapHorarios>('/entradas/dashboard/heatmap'),
  getEvolucaoBanca: (dias = 7) => api.get<EvolucaoBanca[]>(`/entradas/dashboard/evolucao?dias=${dias}`),
  getDashboardSummary: () => api.get<DashboardSummary>('/entradas/dashboard/summary'),
};

export interface DashboardSummary {
  estatisticas: EstatisticasGerais;
  ultimas: UltimaEntrada[];
  heatmap: HeatmapHorarios;
  evolucao: EvolucaoBanca[];
}

// Dashboard types
export interface UltimaEntrada {
  id: string;
  jogador1: string;
  jogador2: string;
  mercado: string;
  odd: number;
  stake: number;
  resultado: ResultadoEntrada;
  lucro: number;
  data: string;
}

export interface HeatmapHorarios {
  horarios: {
    hora: number;
    greens: number;
    reds: number;
    total: number;
    taxaAcerto: number;
  }[];
  melhorHorario: {
    inicio: number;
    fim: number;
    taxaAcerto: number;
  };
}

export interface EvolucaoBanca {
  data: string;
  lucro: number;
  acumulado: number;
}

export interface EstatisticasGerais {
  total: number;
  greens: number;
  reds: number;
  lucroTotal: number;
  stakeTotal: number;
  roi: number;
  taxaAcerto: number;
  maiorSequenciaGreens: number;
  maiorSequenciaReds: number;
}

// Análise Diária
export interface JogadorRanking {
  id: string;
  nome: string;
  liga: Liga;
  mediaGolsFT: number;
  mediaGolsHT: number;
  percentualOver: number;
  percentual0x0: number;
}

export interface ConfrontoAnalise {
  id: string;
  jogador1: JogadorRanking;
  jogador2: JogadorRanking;
  liga: Liga;
  dataHora: string;
  mediaTotal: number;
  probabilidadeOver25: number;
  probabilidadeUnder25: number;
  probabilidade0x0: number;
  classificacao: 'OVER' | 'UNDER' | 'NEUTRO';
  indicadorHT: 'GOL_PROVAVEL' | 'LENTO' | 'NEUTRO';
}

export interface Insight {
  tipo: string;
  titulo: string;
  descricao: string;
  nivel: 'info' | 'alerta' | 'oportunidade';
}

export interface MonitoramentoOdds {
  id: string;
  jogador1: string;
  jogador2: string;
  liga: Liga;
  placarHT: string;
  placarFT: string;
  golsMinutos: string[];
  linhaAberta: string | null;
  linhaStatus: 'PAGO' | 'PERDIDO' | 'ABERTO' | 'SEM_LINHA';
  oportunidade: boolean;
  analise: string;
  dataHora: string;
}

export interface AnaliseDiaria {
  data: string;
  jogadorMaisOver: JogadorRanking | null;
  jogadorMenosOver: JogadorRanking | null;
  confrontoMaisOver: ConfrontoAnalise | null;
  confrontoMaisUnder: ConfrontoAnalise | null;
  confrontosMais0x0: ConfrontoAnalise[];
  jogosGolHTMorrendoFT: ConfrontoAnalise[];
  jogos0x0HTGolFT: ConfrontoAnalise[];
  primeiroJogoGrade: ConfrontoAnalise | null;
  ultimosJogosGrade: ConfrontoAnalise[];
  proximosJogos: ConfrontoAnalise[];
  insights: Insight[];
  monitoramentoOdds: MonitoramentoOdds[];
  estatisticas: {
    totalPartidas: number;
    partidasOver25: number;
    partidasUnder25: number;
    partidas0x0: number;
    mediaGolsDia: number;
  };
}

export interface RankingJogadores {
  maisOver: JogadorRanking[];
  menosOver: JogadorRanking[];
  mais0x0: JogadorRanking[];
}

export interface AnaliseAoVivoDto {
  jogador1Id?: string;
  jogador2Id?: string;
  jogador1Nome?: string;
  jogador2Nome?: string;
  jogador1Time?: string;
  jogador2Time?: string;
  gols1: number;
  gols2: number;
  minuto: number;
  isHT: boolean;
}

export interface AnaliseAoVivoResult {
  jogador1: string;
  jogador2: string;
  placar: string;
  minuto: number;
  periodo: string;
  totalGols: number;
  linhasAnalisadas: {
    linha: string;
    status: 'PAGO' | 'PENDENTE' | 'IMPOSSIVEL';
    valorizado: boolean;
    explicacao: string;
  }[];
  recomendacao: string;
  alertas: string[];
  historico?: {
    totalPartidas: number;
    mediaGols: number;
    percentualOver15: number;
    percentualOver25: number;
    ultimasPartidas: { 
      placarHT: string; 
      placarFT: string; 
      totalGols: number; 
      data: string;
      jogador1: string;
      jogador2: string;
      gols1: number;
      gols2: number;
      golsHT1: number;
      golsHT2: number;
    }[];
  };
  analiseManipulacao?: {
    risco: 'BAIXO' | 'MEDIO' | 'ALTO';
    indicadores: string[];
    recomendacao: string;
  };
}

export interface JogadorSelecao {
  id: string;
  nome: string;
  liga: Liga;
  mediaGolsFT: number;
  mediaGolsHT: number;
  percentualOver: number;
  percentual0x0: number;
}

export interface NicknameComTimes {
  nickname: string;
  times: string[];
}

export const analiseApi = {
  getDiaria: (liga?: string, horas?: number) => 
    api.get<AnaliseDiaria>('/analise/diaria', { params: { liga, horas } }),
  
  getRanking: (liga?: Liga, limite?: number) => 
    api.get<RankingJogadores>('/analise/ranking', { params: { liga, limite } }),
  
  getConfrontos: (liga?: Liga) => 
    api.get<ConfrontoAnalise[]>('/analise/confrontos', { params: { liga } }),
  
  getJogadores: (liga?: Liga) =>
    api.get<JogadorSelecao[]>('/analise/jogadores', { params: { liga } }),
  
  getNicknames: (liga?: Liga) =>
    api.get<NicknameComTimes[]>('/analise/nicknames', { params: { liga } }),
  
  analisarAoVivo: (dto: AnaliseAoVivoDto) =>
    api.post<AnaliseAoVivoResult>('/analise/ao-vivo', dto),

  getJogadorPerfil: (jogadorId: string, time?: string, horas?: number) =>
    api.get<JogadorPerfil>(`/analise/jogador/${jogadorId}`, { params: { ...(time && { time }), ...(horas && { horas }) } }),
};

export interface JogadorPerfil {
  filtro: {
    horas: number | null;
    time: string | null;
    periodo: string;
  };
  jogador: {
    id: string;
    nome: string;
    nickname: string;
    liga: Liga;
    mediaGolsFT: number;
    mediaGolsHT: number;
    percentualOver: number;
    percentual0x0: number;
    times: string[];
  };
  stats: {
    totalPartidas: number;
    mediaGolsFT: number;
    mediaGolsHT: number;
    mediaGolsSofridos: number;
    vitorias: number;
    derrotas: number;
    empates: number;
    winRate: number;
    over05HT: number;
    over15HT: number;
    over15FT: number;
    over25FT: number;
    over35FT: number;
    cleanSheets: number;
    goleadas: number;
    zeroZero: number;
  };
  tendencia: 'SUBINDO' | 'CAINDO' | 'ESTAVEL';
  streakAtual: number;
  streakTipo: string;
  topPlacaresFT: { placar: string; count: number; pct: number }[];
  topPlacaresHT: { placar: string; count: number; pct: number }[];
  ultimasPartidas: {
    id: string;
    adversario: string;
    placarHT: string;
    placarFT: string;
    totalGols: number;
    golsProprios: number;
    golsAdversario: number;
    resultado: 'V' | 'D' | 'E';
    data: string;
    liga: string;
  }[];
  diaStats: {
    totalPartidas: number;
    golsMarcados: number;
    golsSofridos: number;
    mediaMarcados: number;
    mediaSofridos: number;
    vitorias: number;
    derrotas: number;
    empates: number;
    over25: number;
    cleanSheets: number;
    comportamento: 'RETRANCANDO' | 'PAGANDO_GOL' | 'NORMAL' | 'EM_FORMA' | 'SEM_DADOS';
    partidas: {
      adversario: string;
      placarFT: string;
      golsProprios: number;
      golsAdversario: number;
      resultado: string;
    }[];
  };
}

export interface PartidaAoVivoMonitor {
  id: string;
  jogador1: string;
  jogador2: string;
  liga: Liga;
  placarHome: number;
  placarAway: number;
  minuto: number;
  status: string;
  odds: {
    over05HT?: number;
    over15HT?: number;
    over25HT?: number;
    over15FT?: number;
    over25FT?: number;
    over35FT?: number;
    over45FT?: number;
  };
  oddsHistory: {
    minuto: number;
    placar: string;
    over25HT?: number;
    over25FT?: number;
    linhaFechada?: string;
  }[];
}

export interface AnaliseManipulacao {
  partidaId: string;
  jogador1: string;
  jogador2: string;
  alertas: {
    tipo: string;
    descricao: string;
    minuto: number;
    evidencia: string;
  }[];
  risco: 'BAIXO' | 'MEDIO' | 'ALTO';
  recomendacao: string;
}

export interface HistoricoConfronto {
  partidas: {
    id: string;
    data: string;
    placarFT: string;
    placarHT: string;
    liga: Liga;
    totalGols: number;
    over25: boolean;
  }[];
  estatisticas: {
    totalPartidas: number;
    mediaGols: number;
    percentualOver25: number;
    percentual0x0: number;
  };
}

export const oddsMonitorApi = {
  getAoVivo: (liga?: Liga) =>
    api.get<PartidaAoVivoMonitor[]>('/odds-monitor/ao-vivo', { params: { liga } }),
  
  buscarPartida: (jogador1: string, jogador2: string) =>
    api.get<PartidaAoVivoMonitor>('/odds-monitor/buscar', { params: { jogador1, jogador2 } }),
  
  getHistorico: (jogador1: string, jogador2: string) =>
    api.get<HistoricoConfronto>('/odds-monitor/historico', { params: { jogador1, jogador2 } }),
  
  analisarManipulacao: (partidaId: string) =>
    api.get<AnaliseManipulacao>(`/odds-monitor/analise/${partidaId}`),
};

// Pagamentos API
export interface CheckoutResponse {
  sessionId: string;
  url: string;
}

export interface Assinatura {
  id: string;
  plano: 'PRO' | 'EXPERT';
  status: 'ATIVA' | 'CANCELADA' | 'EXPIRADA' | 'PENDENTE';
  inicioEm: string;
  fimEm: string;
}

export const pagamentosApi = {
  createCheckout: (plano: 'PRO' | 'EXPERT') =>
    api.post<CheckoutResponse>('/pagamentos/checkout', {
      plano,
      successUrl: `${window.location.origin}/dashboard/planos?success=true`,
      cancelUrl: `${window.location.origin}/dashboard/planos?canceled=true`,
    }),

  getAssinatura: () => api.get<Assinatura | null>('/pagamentos/assinatura'),

  cancelarAssinatura: () => api.post<{ message: string }>('/pagamentos/cancelar'),

  getPortalUrl: () => api.get<{ url: string }>('/pagamentos/portal'),
};
