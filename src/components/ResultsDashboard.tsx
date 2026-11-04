import React, { useState } from 'react';
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
  Line,
  LineChart,
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
  const [activeChartTab, setActiveChartTab] = useState<'levels' | 'attenuation'>('levels');

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

  const attenuationChartData = result.spectrum.map((s) => ({
    freq: `${s.frequency} Hz`,
    'Difração Topo (ΔLdif)': s.diffractionLoss,
    'Isolamento Material (R)': s.transmissionLoss,
    'Atenuação Efetiva (ΔL)': s.reduction,
  }));

  return (
    <div className="space-y-4">
      {/* CARTÕES DE MÉTRICAS PRINCIPAIS (8 Cards Exigidos) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-md">
          <div className="text-[11px] text-slate-400 font-medium">Sem Barreira</div>
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
          <div className="text-[11px] text-purple-400 font-medium">Dif. Percurso (δ)</div>
          <div className="font-mono text-xl font-bold text-purple-300 mt-1">
            {result.pathDifference > 0 ? `+${result.pathDifference.toFixed(3)}` : result.pathDifference.toFixed(3)}{' '}
            <span className="text-xs text-purple-500 font-sans">m</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">(d1 + esp. + d2) - d0</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-md">
          <div className="text-[11px] text-purple-400 font-medium">Fresnel (N)</div>
          <div className="font-mono text-xl font-bold text-purple-300 mt-1">
            {result.fresnelNumber.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">2δ / λ (λ={result.wavelength}m)</div>
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

      {/* GRÁFICOS ACÚSTICOS INTERATIVOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white text-sm">Análise Espectral e Comportamento Acústico</h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveChartTab('levels')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeChartTab === 'levels'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Comparação Antes vs. Depois
            </button>
            <button
              onClick={() => setActiveChartTab('attenuation')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeChartTab === 'attenuation'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Atenuação vs. Frequência (Difração & Material)
            </button>
          </div>
        </div>

        {activeChartTab === 'levels' && (
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
        )}

        {activeChartTab === 'attenuation' && (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attenuationChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="freq" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  stroke="#64748b"
                  domain={[0, 50]}
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
                <Line
                  type="monotone"
                  dataKey="Difração Topo (ΔLdif)"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#a855f7' }}
                />
                <Line
                  type="monotone"
                  dataKey="Isolamento Material (R)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#f43f5e' }}
                />
                <Line
                  type="monotone"
                  dataKey="Atenuação Efetiva (ΔL)"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
