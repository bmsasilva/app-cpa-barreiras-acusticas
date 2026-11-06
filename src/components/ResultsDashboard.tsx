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
} from 'lucide-react';

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
      {/* CARTÕES DE MÉTRICAS PRINCIPAIS (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-slate-400 font-medium">Sem Barreira</div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {result.sourceType === 'line' ? '3 dB/dupl.' : '6 dB/dupl.'}
            </span>
          </div>
          <div className="font-mono text-xl font-bold text-slate-100 mt-1">
            {result.levelFreeField} <span className="text-xs text-slate-400 font-sans">dB</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{result.levelFreeFieldA} dB(A) global</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-md">
          <div className="text-[11px] text-emerald-400 font-medium">Com Barreira</div>
          <div className="font-mono text-xl font-bold text-emerald-400 mt-1">
            {result.levelWithBarrier} <span className="text-xs text-emerald-500 font-sans">dB</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">{result.levelWithBarrierA} dB(A) global</div>
        </div>

        <div className="bg-gradient-to-br from-sky-950/60 to-slate-900 border border-sky-800/60 p-3 rounded-xl shadow-md">
          <div className="text-[11px] text-sky-400 font-medium flex items-center justify-between">
            <span>Redução (ΔL)</span>
            <TrendingDown className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="font-mono text-xl font-bold text-sky-400 mt-1">
            {result.netReduction > 0 ? `-${result.netReduction.toFixed(1)}` : '0.0'}{' '}
            <span className="text-xs text-sky-500 font-sans">dB</span>
          </div>
          <div className="text-[10px] text-sky-500/80 mt-0.5">
            {result.netReductionA > 0 ? `-${result.netReductionA.toFixed(1)}` : '0.0'} dB(A)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-md">
          <div className="text-[11px] text-indigo-400 font-medium">Difração Topo</div>
          <div className="font-mono text-xl font-bold text-indigo-300 mt-1">
            {result.diffractionAttenuation.toFixed(1)}{' '}
            <span className="text-xs text-indigo-500 font-sans">dB</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {result.thicknessDiffractionBonusDb > 0 ? `+${result.thicknessDiffractionBonusDb} dB topo largo` : 'Maekawa / Kurze'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-md">
          <div className="text-[11px] text-rose-400 font-medium">Isolamento (R)</div>
          <div className="font-mono text-xl font-bold text-rose-300 mt-1">
            {result.materialTransmissionLoss}{' '}
            <span className="text-xs text-rose-500 font-sans">dB</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {result.surfaceMassKgM2 ? `${result.surfaceMassKgM2} kg/m²` : 'Transmissão direta'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-md">
          <div className="text-[11px] text-amber-400 font-medium">Custo Estimado</div>
          <div className="font-mono text-xl font-bold text-amber-300 mt-1">
            {result.totalCostEuro.toLocaleString('pt-PT')}{' '}
            <span className="text-xs text-amber-500 font-sans">€</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{result.totalAreaM2} m² totais</div>
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
