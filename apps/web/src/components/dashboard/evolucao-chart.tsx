'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface EvolucaoData {
  data: string;
  lucro: number;
  acumulado: number;
}

interface EvolucaoChartProps {
  data: EvolucaoData[];
}

export default function EvolucaoChart({ data }: EvolucaoChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-zinc-500 text-sm">
        Sem dados de evolução ainda
      </div>
    );
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="data" 
            tickFormatter={(v: string) => v.split('-').slice(1).join('/')}
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={(v: number) => `R$${v}`}
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#18181b', 
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Acumulado']}
            labelFormatter={(label: string) => `Data: ${label}`}
          />
          <Area 
            type="monotone" 
            dataKey="acumulado" 
            stroke="#a855f7" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorAcumulado)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
