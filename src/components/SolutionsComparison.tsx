import React, { useState } from 'react';
import type {
  AcousticCalculationResult,
  SavedSolution,
  SimulationBarrier,
  SimulationReceiver,
  SimulationSource,
} from '../acoustics/types';
import { MATERIALS } from '../acoustics/materials';
import {
  Check,
  Columns,
  Trash2,
} from 'lucide-react';

interface SolutionsComparisonProps {
  currentBarrier: SimulationBarrier;
  currentResult: AcousticCalculationResult;
  savedSolutions: SavedSolution[];
  onSaveCurrentAsSolution: (id: 'A' | 'B' | 'C', label: string) => void;
  onLoadSolution: (solution: SavedSolution) => void;
  onClearSolution: (id: 'A' | 'B' | 'C') => void;
  source: SimulationSource;
  receiver: SimulationReceiver;
}

export const SolutionsComparison: React.FC<SolutionsComparisonProps> = ({
  currentBarrier,
  currentResult,
  savedSolutions,
  onSaveCurrentAsSolution,
  onLoadSolution,
  onClearSolution,
  source: _source,
  receiver: _receiver,
}) => {
  const [sideBySideSlots, setSideBySideSlots] = useState<{
    sol1: 'A' | 'B' | 'C' | 'current';
    sol2: 'A' | 'B' | 'C' | 'current';
  }>({
    sol1: 'current',
    sol2: 'A',
  });

  const getSolutionById = (id: 'A' | 'B' | 'C' | 'current') => {
    if (id === 'current') {
      return {
        id: 'current' as const,
        label: 'Configuração Atual',
        barrier: currentBarrier,
        result: currentResult,
        timestamp: 'Em direto',
      };
    }
    return savedSolutions.find((s) => s.id === id);
  };

  const sol1Data = getSolutionById(sideBySideSlots.sol1);
  const sol2Data = getSolutionById(sideBySideSlots.sol2);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Columns className="w-5 h-5 text-sky-400" />
            Comparador de Soluções de Barreiras Acústicas (A, B, C)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Guarda diferentes configurações e compara a eficácia técnica e viabilidade económica.
          </p>
        </div>

        {/* Guardar Configuração Atual num Slot */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 pl-2">Guardar como:</span>
          {(['A', 'B', 'C'] as const).map((slot) => {
            const isFilled = savedSolutions.some((s) => s.id === slot);
            return (
              <button
                key={slot}
                onClick={() => {
                  const defaultNames = {
                    A: `${MATERIALS[currentBarrier.materialId]?.name || 'Barreira'} (${currentBarrier.height}m)`,
                    B: `${MATERIALS[currentBarrier.materialId]?.name || 'Barreira'} (${currentBarrier.height}m)`,
                    C: `${MATERIALS[currentBarrier.materialId]?.name || 'Barreira'} (${currentBarrier.height}m)`,
                  };
                  onSaveCurrentAsSolution(slot, defaultNames[slot]);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  isFilled
                    ? 'bg-sky-950 text-sky-300 border border-sky-800 hover:bg-sky-900'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={`Guardar a configuração atual no Slot ${slot}`}
              >
                Slot {slot}
                {isFilled && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabela Comparativa Detalhada */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Solução</th>
              <th className="py-2.5 px-3">Material</th>
              <th className="py-2.5 px-3">Altura</th>
              <th className="py-2.5 px-3">Posição (X)</th>
              <th className="py-2.5 px-3">Nível Estimado</th>
              <th className="py-2.5 px-3">Redução (ΔL)</th>
              <th className="py-2.5 px-3">Isolamento (R)</th>
              <th className="py-2.5 px-3">Custo Fictício</th>
              <th className="py-2.5 px-3">Custo-Eficácia</th>
              <th className="py-2.5 px-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            <tr className="bg-sky-950/20 font-medium">
              <td className="py-2.5 px-3 text-sky-400 flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                Atual (Ao vivo)
              </td>
              <td className="py-2.5 px-3 text-white">
                {MATERIALS[currentBarrier.materialId]?.name || 'Sem material'}
              </td>
              <td className="py-2.5 px-3 font-mono">{currentBarrier.height.toFixed(2)} m</td>
              <td className="py-2.5 px-3 font-mono">{currentBarrier.x.toFixed(1)} m</td>
              <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                {currentResult.levelWithBarrier} dB
              </td>
              <td className="py-2.5 px-3 font-mono text-sky-400 font-bold">
                -{currentResult.netReduction.toFixed(1)} dB
              </td>
              <td className="py-2.5 px-3 font-mono">{currentResult.materialTransmissionLoss} dB</td>
              <td className="py-2.5 px-3 font-mono text-amber-400">
                {currentResult.totalCostEuro.toLocaleString('pt-PT')} €
              </td>
              <td className="py-2.5 px-3 font-mono text-purple-300 font-semibold">
                {currentResult.costEffectivenessEuroPerDb !== null
                  ? `${currentResult.costEffectivenessEuroPerDb.toLocaleString('pt-PT')} €/dB`
                  : '—'}
              </td>
              <td className="py-2.5 px-3 text-right text-slate-400">Em edição</td>
            </tr>

            {(['A', 'B', 'C'] as const).map((slot) => {
              const sol = savedSolutions.find((s) => s.id === slot);
              if (!sol) {
                return (
                  <tr key={slot} className="text-slate-500 italic">
                    <td className="py-2.5 px-3 font-bold text-slate-500">Slot {slot}</td>
                    <td colSpan={8} className="py-2.5 px-3">
                      Slot vazio. Clica em "Guardar como: Slot {slot}" para registar a solução atual.
                    </td>
                    <td className="py-2.5 px-3 text-right">-</td>
                  </tr>
                );
              }

              const mat = MATERIALS[sol.barrier.materialId];
              return (
                <tr key={slot} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 text-[10px]">
                        Slot {slot}
                      </span>
                      <span className="truncate max-w-[120px]">{sol.label}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">{mat?.name}</td>
                  <td className="py-2.5 px-3 font-mono">{sol.barrier.height.toFixed(2)} m</td>
                  <td className="py-2.5 px-3 font-mono">{sol.barrier.x.toFixed(1)} m</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                    {sol.result.levelWithBarrier} dB
                  </td>
                  <td className="py-2.5 px-3 font-mono text-sky-400 font-bold">
                    -{sol.result.netReduction.toFixed(1)} dB
                  </td>
                  <td className="py-2.5 px-3 font-mono">{sol.result.materialTransmissionLoss} dB</td>
                  <td className="py-2.5 px-3 font-mono text-amber-400">
                    {sol.result.totalCostEuro.toLocaleString('pt-PT')} €
                  </td>
                  <td className="py-2.5 px-3 font-mono text-purple-300 font-semibold">
                    {sol.result.costEffectivenessEuroPerDb !== null
                      ? `${sol.result.costEffectivenessEuroPerDb.toLocaleString('pt-PT')} €/dB`
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onLoadSolution(sol)}
                        className="px-2 py-1 rounded bg-sky-900/60 hover:bg-sky-800 text-sky-200 text-[10px] transition-all"
                        title="Carregar esta solução no cenário 2D"
                      >
                        Carregar
                      </button>
                      <button
                        onClick={() => onClearSolution(slot)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
                        title="Limpar este slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modo de Comparação Lado a Lado */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Columns className="w-4 h-4 text-sky-400" />
            Comparação Lado a Lado (Dupla Solução)
          </span>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Comparar:</span>
            <select
              value={sideBySideSlots.sol1}
              onChange={(e) =>
                setSideBySideSlots((prev) => ({
                  ...prev,
                  sol1: e.target.value as 'A' | 'B' | 'C' | 'current',
                }))
              }
              className="bg-slate-900 text-sky-400 border border-slate-800 rounded px-2 py-1 outline-none"
            >
              <option value="current">Atual (Ao vivo)</option>
              <option value="A">Slot A</option>
              <option value="B">Slot B</option>
              <option value="C">Slot C</option>
            </select>

            <span className="text-slate-500 font-bold">VS</span>

            <select
              value={sideBySideSlots.sol2}
              onChange={(e) =>
                setSideBySideSlots((prev) => ({
                  ...prev,
                  sol2: e.target.value as 'A' | 'B' | 'C' | 'current',
                }))
              }
              className="bg-slate-900 text-indigo-400 border border-slate-800 rounded px-2 py-1 outline-none"
            >
              <option value="A">Slot A</option>
              <option value="B">Slot B</option>
              <option value="C">Slot C</option>
              <option value="current">Atual (Ao vivo)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900 p-3 rounded-xl border border-sky-800/50 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
              <span className="font-bold text-sky-400">Solução 1: {sol1Data?.label || 'Não configurada'}</span>
              <span className="font-mono text-slate-400 text-[10px]">{sol1Data?.timestamp}</span>
            </div>
            {sol1Data ? (
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Material:</span>
                  <span className="font-medium text-white">{MATERIALS[sol1Data.barrier.materialId]?.name}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Altura / Posição:</span>
                  <span className="font-mono text-white">
                    {sol1Data.barrier.height.toFixed(2)}m @ x={sol1Data.barrier.x.toFixed(1)}m
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Nível no Recetor:</span>
                  <span className="font-mono font-bold text-emerald-400">{sol1Data.result.levelWithBarrier} dB</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Redução (ΔL):</span>
                  <span className="font-mono font-bold text-sky-400">
                    -{sol1Data.result.netReduction.toFixed(1)} dB
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Custo Total:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {sol1Data.result.totalCostEuro.toLocaleString('pt-PT')} €
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Custo-Eficácia:</span>
                  <span className="font-mono font-bold text-purple-300">
                    {sol1Data.result.costEffectivenessEuroPerDb !== null
                      ? `${sol1Data.result.costEffectivenessEuroPerDb.toLocaleString('pt-PT')} €/dB`
                      : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 py-3 text-center">Nenhuma solução guardada neste slot.</div>
            )}
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-indigo-800/50 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
              <span className="font-bold text-indigo-400">Solução 2: {sol2Data?.label || 'Não configurada'}</span>
              <span className="font-mono text-slate-400 text-[10px]">{sol2Data?.timestamp}</span>
            </div>
            {sol2Data ? (
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Material:</span>
                  <span className="font-medium text-white">{MATERIALS[sol2Data.barrier.materialId]?.name}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Altura / Posição:</span>
                  <span className="font-mono text-white">
                    {sol2Data.barrier.height.toFixed(2)}m @ x={sol2Data.barrier.x.toFixed(1)}m
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Nível no Recetor:</span>
                  <span className="font-mono font-bold text-emerald-400">{sol2Data.result.levelWithBarrier} dB</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Redução (ΔL):</span>
                  <span className="font-mono font-bold text-sky-400">
                    -{sol2Data.result.netReduction.toFixed(1)} dB
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Custo Total:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {sol2Data.result.totalCostEuro.toLocaleString('pt-PT')} €
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Custo-Eficácia:</span>
                  <span className="font-mono font-bold text-purple-300">
                    {sol2Data.result.costEffectivenessEuroPerDb !== null
                      ? `${sol2Data.result.costEffectivenessEuroPerDb.toLocaleString('pt-PT')} €/dB`
                      : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 py-3 text-center">Nenhuma solução guardada neste slot.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
