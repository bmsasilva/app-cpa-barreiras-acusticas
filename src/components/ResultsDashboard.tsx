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
import {
  BarChart3,
  TrendingDown,
  Users,
} from 'lucide-react';

interface ResultsDashboardProps {
  source: SimulationSource;
  barrier: SimulationBarrier;
  receiver: SimulationReceiver;
  result: AcousticCalculationResult;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  source: _source,
  barrier,
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
      {/* CARTÕES DE MÉTRICAS PRINCIPAIS: Redução Sonora, Desagrado Moradores e Custo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Redução Sonora Efetiva */}
        <div className="bg-gradient-to-br from-emerald-950/50 to-slate-900 border border-emerald-800/60 p-3.5 rounded-xl shadow-md">
          <div className="text-xs text-emerald-400 font-semibold flex items-center justify-between">
            <span>Redução Sonora Efetiva (ΔL)</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-400 mt-1">
            {result.netReduction > 0 ? `-${result.netReduction.toFixed(1)}` : '0.0'}{' '}
            <span className="text-xs text-emerald-500 font-sans">dB</span>
          </div>
          <div className="text-[11px] text-emerald-500/90 mt-0.5">
            {result.netReductionA > 0 ? `-${result.netReductionA.toFixed(1)}` : '0.0'} dB(A) global
          </div>
        </div>

        {/* Desagrado dos Moradores */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-3.5 rounded-xl shadow-md">
          <div className="text-xs font-semibold flex items-center justify-between" style={{ color: result.residentAnnoyance.color }}>
            <span>Desagrado dos Moradores</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="font-mono text-2xl font-bold mt-1" style={{ color: result.residentAnnoyance.color }}>
            {result.residentAnnoyance.score}%{' '}
            <span className="text-xs font-sans opacity-80">({result.residentAnnoyance.label})</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Oclusão: {result.residentAnnoyance.occlusionAngleDeg}° • Distância: {result.residentAnnoyance.distanceToFacadeM}m
          </div>
        </div>

        {/* Custo Estimado */}
        <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-800/60 p-3.5 rounded-xl shadow-md">
          <div className="text-xs text-amber-400 font-semibold flex items-center justify-between">
            <span>Custo Estimado</span>
            <span className="text-[11px] text-amber-500/90 font-mono">{result.totalAreaM2} m²</span>
          </div>
          <div className="font-mono text-2xl font-bold text-amber-300 mt-1">
            {result.totalCostEuro.toLocaleString('pt-PT')}{' '}
            <span className="text-xs text-amber-500 font-sans">€</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {result.totalAreaM2} m² totais ({barrier.height.toFixed(1)}m × {barrier.lengthM}m)
          </div>
        </div>
      </div>

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
