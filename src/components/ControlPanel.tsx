import React, { useState } from 'react';
import type {
  AcousticCalculationResult,
  MaterialId,
  SimulationBarrier,
  SimulationReceiver,
  SimulationSource,
} from '../acoustics/types';
import { FREQUENCIES } from '../acoustics/types';
import { MATERIALS } from '../acoustics/materials';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  Home,
  Layers,
  Lightbulb,
  Volume2,
} from 'lucide-react';

interface ControlPanelProps {
  source: SimulationSource;
  barrier: SimulationBarrier;
  receiver: SimulationReceiver;
  result: AcousticCalculationResult;
  onUpdateSource: (partial: Partial<SimulationSource>) => void;
  onUpdateBarrier: (partial: Partial<SimulationBarrier>) => void;
  onUpdateReceiver: (partial: Partial<SimulationReceiver>) => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  source,
  barrier,
  receiver,
  result,
  onUpdateSource,
  onUpdateBarrier,
  onUpdateReceiver,
  onReset: _onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'barrier' | 'source' | 'receiver' | 'datasheet'>('barrier');
  const [inspectedMaterialId, setInspectedMaterialId] = useState<MaterialId>(barrier.materialId);

  const curMaterial = MATERIALS[barrier.materialId] || MATERIALS.betao;
  const inspectedMat = MATERIALS[inspectedMaterialId] || curMaterial;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[520px] lg:h-[580px] max-h-[580px] shadow-xl overflow-hidden">
      {/* Abas Superiores de Controlo */}
      <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/60 text-xs font-medium shrink-0">
        <button
          onClick={() => setActiveTab('barrier')}
          className={`py-3 px-2 flex flex-col items-center gap-1 transition-all ${
            activeTab === 'barrier'
              ? 'text-sky-400 border-b-2 border-sky-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Barreira</span>
        </button>

        <button
          onClick={() => setActiveTab('source')}
          className={`py-3 px-2 flex flex-col items-center gap-1 transition-all ${
            activeTab === 'source'
              ? 'text-orange-400 border-b-2 border-orange-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>Fonte</span>
        </button>

        <button
          onClick={() => setActiveTab('receiver')}
          className={`py-3 px-2 flex flex-col items-center gap-1 transition-all ${
            activeTab === 'receiver'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Recetor</span>
        </button>

        <button
          onClick={() => setActiveTab('datasheet')}
          className={`py-3 px-2 flex flex-col items-center gap-1 transition-all ${
            activeTab === 'datasheet'
              ? 'text-indigo-400 border-b-2 border-indigo-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Materiais</span>
        </button>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-sm text-slate-300">
        {/* ABA BARREIRA */}
        {activeTab === 'barrier' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="font-semibold text-white block">Estado da Barreira</span>
                <span className="text-xs text-slate-400">
                  {barrier.enabled ? 'Presente no cenário exterior' : 'Removida (Sem barreira)'}
                </span>
              </div>
              <button
                onClick={() => onUpdateBarrier({ enabled: !barrier.enabled })}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                  barrier.enabled
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {barrier.enabled ? 'Ativada' : 'Desativada'}
              </button>
            </div>

            <div>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(MATERIALS) as MaterialId[]).map((mId) => {
                  const mat = MATERIALS[mId];
                  const isSelected = barrier.materialId === mId;
                  return (
                    <button
                      key={mId}
                      onClick={() => onUpdateBarrier({ materialId: mId, enabled: true, thickness: mat.defaultThicknessM })}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-sky-500 bg-sky-950/40 text-white shadow-sm ring-1 ring-sky-500/50'
                          : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: mat.color }}
                        />
                        <div>
                          <div className="font-medium text-xs text-white">{mat.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Rw = {mat.rw} dB · αw = {mat.alphaW} · {mat.costPerM2} €/m²
                          </div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-slate-200 block">Espessura da Barreira (e)</span>
                  <span className="text-[10px] text-slate-400">
                    Massa: {result.surfaceMassKgM2} kg/m² · R({source.frequency}Hz) = {result.materialTransmissionLoss} dB
                  </span>
                </div>
                <span className="font-bold text-sky-400 font-mono text-sm">
                  {barrier.thickness < 0.01
                    ? `${(barrier.thickness * 1000).toFixed(0)} mm`
                    : `${(barrier.thickness * 100).toFixed(1)} cm`}
                </span>
              </div>
              <input
                type="range"
                min="0.002"
                max="0.50"
                step="0.002"
                value={barrier.thickness}
                onChange={(e) => onUpdateBarrier({ thickness: parseFloat(e.target.value) })}
                className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>2 mm (fina)</span>
                <span>15 cm</span>
                <span>50 cm (larga)</span>
              </div>
              <div className="text-[10px] text-sky-400/80 bg-sky-950/30 px-2 py-1 rounded border border-sky-900/40">
                💡 A espessura aumenta o isolamento por transmissão (Lei da Massa) e cria duplo bordo difrativo no topo largo (+{result.thicknessDiffractionBonusDb} dB).
              </div>
            </div>
          </div>
        )}

        {/* ABA FONTE SONORA */}
        {activeTab === 'source' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Tipo de Fonte Sonora & Propagação
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSource({ sourceType: 'point', frequency: 250 })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    source.sourceType !== 'line'
                      ? 'border-orange-500 bg-orange-950/40 text-white shadow-sm ring-1 ring-orange-500/50'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <span>🏭</span>
                    <span>Fonte Pontual</span>
                  </div>
                  <div className="text-[11px] text-orange-400 font-medium mt-1">
                    Indústria / Fábrica
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSource({ sourceType: 'line', frequency: 1000 })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    source.sourceType === 'line'
                      ? 'border-amber-500 bg-amber-950/40 text-white shadow-sm ring-1 ring-amber-500/50'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <span>🛣️</span>
                    <span>Fonte Linear</span>
                  </div>
                  <div className="text-[11px] text-amber-400 font-medium mt-1">
                    Estrada / Tráfego
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-200">Nível de Pressão de Ref. (L₁)</span>
                <span className="font-bold text-orange-400 font-mono text-sm">{source.soundPowerLevel} dB</span>
              </div>
              <input
                type="range"
                min="50"
                max="110"
                step="1"
                value={source.soundPowerLevel}
                onChange={(e) => onUpdateSource({ soundPowerLevel: parseInt(e.target.value) })}
                className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>50 dB (silencioso)</span>
                <span>80 dB</span>
                <span>110 dB (muito ruidoso)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Frequência de Análise (Hz)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {FREQUENCIES.map((freq) => (
                  <button
                    key={freq}
                    onClick={() => onUpdateSource({ frequency: freq })}
                    className={`py-2 px-1 text-center rounded-lg border font-mono text-xs font-bold transition-all ${
                      source.frequency === freq
                        ? 'border-orange-500 bg-orange-950/50 text-orange-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {freq} Hz
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                Comprimento de onda: λ = {result.wavelength} m
              </span>
            </div>

            <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-200">Altura da Fonte (Solo)</span>
                <span className="font-bold text-orange-400 font-mono text-sm">{source.height.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={source.height}
                onChange={(e) => onUpdateSource({ height: parseFloat(e.target.value) })}
                className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.5 m (junto ao solo)</span>
                <span>5.0 m (chaminé/cobertura)</span>
              </div>
            </div>
          </div>
        )}

        {/* ABA RECETOR */}
        {activeTab === 'receiver' && (
          <div className="space-y-4">
            <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-200">Altura do Recetor (Microfone na Fachada)</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{receiver.height.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="6.5"
                step="0.1"
                value={receiver.height}
                onChange={(e) => onUpdateReceiver({ height: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1.0 m (R/C)</span>
                <span>1.5 m (Padrão)</span>
                <span>4.5 m (1.º Andar)</span>
              </div>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Posição da Habitação:</div>
              <div>Fixa a <strong>{receiver.x.toFixed(1)} m</strong> da fonte sonora (ajuste apenas vertical).</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Níveis Sonoros no Recetor</span>
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Sem Barreira:</span>
                <span className="font-mono font-bold text-slate-200">{result.levelFreeField} dB</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Com Barreira Atual:</span>
                <span className="font-mono font-bold text-emerald-400">{result.levelWithBarrier} dB</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-0.5">
                <span className="font-medium text-white">Atenuação Líquida (ΔL):</span>
                <span className="font-mono font-bold text-sky-400 text-sm">
                  -{result.netReduction.toFixed(1)} dB
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ABA FICHA TÉCNICA E MATERIAIS */}
        {activeTab === 'datasheet' && (
          <div className="space-y-3.5">
            {/* SELETOR DE TODOS OS MATERIAIS */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Explorar Materiais Construtivos:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(MATERIALS) as MaterialId[]).map((mId) => {
                  const mat = MATERIALS[mId];
                  const isInspected = inspectedMaterialId === mId;
                  const isApplied = barrier.materialId === mId;
                  return (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => setInspectedMaterialId(mId)}
                      className={`p-2 rounded-xl text-left border transition-all flex items-center justify-between gap-1.5 ${
                        isInspected
                          ? 'border-indigo-500 bg-indigo-950/50 text-white ring-1 ring-indigo-500/50 shadow-sm'
                          : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: mat.color }}
                        />
                        <span className="text-xs font-medium truncate">{mat.name}</span>
                      </div>
                      {isApplied && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded font-semibold shrink-0">
                          Na Barreira
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AÇÃO DE APLICAÇÃO À BARREIRA */}
            <div>
              {barrier.materialId !== inspectedMaterialId ? (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateBarrier({
                      materialId: inspectedMaterialId,
                      enabled: true,
                      thickness: inspectedMat.defaultThicknessM,
                    })
                  }
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-950 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Aplicar {inspectedMat.name} à Barreira Exterior</span>
                </button>
              ) : (
                <div className="py-1.5 px-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Material atualmente em uso na simulação exterior</span>
                </div>
              )}
            </div>

            {/* FICHA TÉCNICA DO MATERIAL EM ANÁLISE */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: inspectedMat.color }}
                  />
                  <h4 className="font-bold text-white text-sm">{inspectedMat.name}</h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  {inspectedMat.patternType}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{inspectedMat.description}</p>
            </div>

            {/* PROPRIEDADES ACÚSTICAS E FÍSICAS */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Massa Volúmica (ρ)</span>
                <span className="font-mono font-bold text-slate-200 text-sm">{inspectedMat.densityKgM3} kg/m³</span>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Massa Superficial (m'')</span>
                <span className="font-mono font-bold text-slate-200 text-sm">{inspectedMat.surfaceMassKgM2} kg/m²</span>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Índice Isolamento (Rw)</span>
                <span className="font-mono font-bold text-sky-400 text-sm">{inspectedMat.rw} dB</span>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Coef. Absorção (αw)</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{inspectedMat.alphaW}</span>
              </div>
            </div>

            {/* ESPECTRO DE ISOLAMENTO E ABSORÇÃO */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Comportamento por Frequência [125 Hz – 4000 Hz]
              </span>
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="grid grid-cols-7 gap-1 items-center text-center">
                  <span className="text-left font-sans text-slate-400 font-medium">Freq.</span>
                  {FREQUENCIES.map((f) => (
                    <span key={f} className="text-slate-400">{f}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 items-center text-center bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-left font-sans text-sky-400 font-semibold">R(f)</span>
                  {FREQUENCIES.map((f) => (
                    <span key={f} className="text-slate-200 font-bold">{inspectedMat.transmissionLoss[f]}dB</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 items-center text-center bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-left font-sans text-emerald-400 font-semibold">α(f)</span>
                  {FREQUENCIES.map((f) => (
                    <span key={f} className="text-emerald-300 font-bold">{inspectedMat.absorptionCoeff[f]}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* TEXTO EXPLICATIVO: POR QUE NÃO SE USA SEMPRE O PAINEL ABSORVENTE */}
            <div className="bg-indigo-950/30 border border-indigo-800/60 p-3.5 rounded-xl space-y-2 text-xs text-indigo-100/90 leading-relaxed shadow-sm">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold border-b border-indigo-800/50 pb-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Por que não se usa sempre o Painel Acústico Absorvente?</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Apesar de ser acusticamente o mais completo (combina elevado isolamento sonoro <strong className="text-sky-300">Rw = 34 dB</strong> com absorção fonoabsorvente classe A <strong className="text-emerald-300">αw = 0.90</strong> para anular reflexões), em engenharia prática e ambiental nem sempre é a escolha ótima devido a cinco condicionantes essenciais:
              </p>

              <div className="space-y-2 pt-1 text-[11px] text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-100">1. Colmatação de Poros & Perda Acústica:</strong> Em autoestradas e ambientes fabris, o tráfego liberta partículas de escape, fuligem e óleos que entopem as microperfurações e as fibras internas da lã mineral. Esse fenómeno (colmatação) anula a absorção acústica ao longo do tempo se não houver limpezas periódicas de custo elevado.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-100">2. Vulnerabilidade a Vandalismo & Graffitis:</strong> A tinta de graffitis forma uma película estanque que sela instantaneamente os orifícios acústicos, destruindo irreversivelmente a absorção. O betão armado maciço, por oposição, suporta jatos de alta pressão e pintura anti-graffiti sem perder isolamento.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-100">3. Resistência Mecânica ao Choque:</strong> Em caso de despiste de viaturas pesadas, chapas metálicas perfuradas deformam-se e rasgam. Barreiras de betão maciço (ex.: perfil New Jersey) atuam em simultâneo como guarda de segurança rodoviária de contenção mecânica.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-100">4. Impacto Visual e Perda de Luz Natural:</strong> O painel absorvente é 100% opaco e volumoso (~10 cm), criando sensação de "muralha". Em zonas habitacionais próximas, o <em>Acrílico Transparente (PMMA)</em> é preferível para manter a luz natural e a visibilidade das fachadas.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-100">5. Custo e Esforço de Vento:</strong> O fabrico multicamada (alumínio, lã de rocha e véu) e a manutenção encarecem a obra. Em viadutos, o peso e o arrasto ao vento exigem pilares e fundações mais dispendiosas do que estruturas mais leves.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-900/40 p-2.5 rounded-xl flex gap-2 text-[11px] text-amber-300/90 leading-tight">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Valores de ensaio indicativos para fins pedagógicos de Controlo e Prevenção Ambiental (CPA).
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
