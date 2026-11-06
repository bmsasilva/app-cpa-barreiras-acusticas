import React from 'react';
import type {
  AcousticCalculationResult,
  SimulationBarrier,
  SimulationReceiver,
  SimulationSource,
} from '../acoustics/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface ResultsDashboardProps {
  source: SimulationSource;
  barrier: SimulationBarrier;
  receiver: SimulationReceiver;
  result: AcousticCalculationResult;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  source: _source,
  barrier: _barrier,
  receiver: _receiver,
  result,
}) => {
  const levelsChartData = [
    ...result.spectrum.map((s) => ({
      freq: `${s.frequency} Hz`,
      'Sem Barreira': s.freeField,
      'Com Barreira': s.withBarrier,
      'Atenuação (ΔL)': s.reduction,
    })),
    {
      freq: 'Global dB(A)',
      'Sem Barreira': result.levelFreeFieldA,
      'Com Barreira': result.levelWithBarrierA,
      'Atenuação (ΔL)': result.netReductionA,
    },
  ];

  return (
    <div className="space-y-4">
      {/* GRÁFICO ACÚSTICO DE NÍVEIS SONOROS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white text-sm">Níveis Sonoros por Banda de Frequência (Antes vs. Depois da Barreira)</h3>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={levelsChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="freq" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                stroke="#64748b"
                domain={[20, 100]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                unit=" dB"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Sem Barreira" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Com Barreira" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
