import { useState } from 'react';
import type {
  AcousticCalculationResult,
  IndoorAcousticResult,
  IndoorHallState,
  SavedSolution,
  SimulationBarrier,
  SimulationReceiver,
  SimulationSource,
  ViewMode,
} from './acoustics/types';
import { calculateAcoustics, calculateIndoorAcoustics } from './acoustics/physicsEngine';
import type { ViewportToggles } from './components/SimulationViewport';
import { SimulationViewport } from './components/SimulationViewport';
import { IndoorHallViewport } from './components/IndoorHallViewport';
import { ControlPanel } from './components/ControlPanel';
import { ResultsDashboard } from './components/ResultsDashboard';
import { SolutionsComparison } from './components/SolutionsComparison';
import { EducationalChallenges } from './components/EducationalChallenges';
import { AcousticMethodologyModal } from './components/AcousticMethodologyModal';
import type { Challenge } from './educational/challenges';
import {
  BarChart3,
  BookOpen,
  Building2,
  Columns,
  Download,
  GraduationCap,
  Layers,
  RotateCcw,
  Warehouse,
} from 'lucide-react';
import jsPDF from 'jspdf';

// Cenário Padrão Inicial
const INITIAL_SOURCE: SimulationSource = {
  x: 0,
  height: 1.5,
  soundPowerLevel: 90,
  frequency: 250,
  sourceType: 'point',
};

const INITIAL_BARRIER: SimulationBarrier = {
  enabled: true,
  x: 10,
  height: 3.0,
  thickness: 0.15,
  materialId: 'betao',
  lengthM: 20,
};

const INITIAL_RECEIVER: SimulationReceiver = {
  x: 30, // 30 metros de distância inicial
  height: 1.5,
};

const INITIAL_TOGGLES: ViewportToggles = {
  showIncidentWaves: true,
  showReflectedWaves: true,
  showDiffractedWaves: true,
  showTransmittedWaves: false,
  showHeatmap: false,
  showLineOfSight: true,
  showShadowZone: true,
  showDimensions: true,
  heatmapMode: 'with_barrier',
};

const INITIAL_INDOOR_STATE: IndoorHallState = {
  roomLengthM: 10, // Máximo 10 m para ampliar distâncias visuais no ecrã
  roomWidthM: 8,
  roomHeightM: 5.0,
  wallAlpha: 0.05,
  bafflesEnabled: false,
  bafflesCount: 20,
  baffleUnitAbsorptionM2: 1.5,
  machineSoundPowerLw: 98,
  machineX: 1.0,
  machineDirectivityQ: 2,
  operatorDistanceM: 2.0,
};

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('outdoor_barrier');
  const [source, setSource] = useState<SimulationSource>(INITIAL_SOURCE);
  const [barrier, setBarrier] = useState<SimulationBarrier>(INITIAL_BARRIER);
  const [receiver, setReceiver] = useState<SimulationReceiver>(INITIAL_RECEIVER);
  const [toggles, setToggles] = useState<ViewportToggles>(INITIAL_TOGGLES);

  // Estado para Nave Industrial (Sala Fechada)
  const [indoorState, setIndoorState] = useState<IndoorHallState>(INITIAL_INDOOR_STATE);

  const [activeBottomTab, setActiveBottomTab] = useState<'results' | 'challenges' | 'comparison'>('results');
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // 3 Slots de Soluções Guardadas
  const [savedSolutions, setSavedSolutions] = useState<SavedSolution[]>([]);

  // Cálculo Acústico Dinâmico em Tempo Real
  const result: AcousticCalculationResult = calculateAcoustics(source, barrier, receiver);
  const indoorResult: IndoorAcousticResult = calculateIndoorAcoustics(indoorState);

  // Manipuladores de Atualização Parcial
  const handleUpdateSource = (partial: Partial<SimulationSource>) => {
    setSource((prev) => ({ ...prev, ...partial }));
  };

  const handleUpdateBarrier = (partial: Partial<SimulationBarrier>) => {
    setBarrier((prev) => ({ ...prev, ...partial }));
  };

  const handleUpdateReceiver = (partial: Partial<SimulationReceiver>) => {
    setReceiver((prev) => ({ ...prev, ...partial }));
  };

  const handleUpdateToggles = (partial: Partial<ViewportToggles>) => {
    setToggles((prev) => ({ ...prev, ...partial }));
  };

  const handleUpdateIndoorState = (partial: Partial<IndoorHallState>) => {
    setIndoorState((prev) => ({ ...prev, ...partial }));
  };

  const handleReset = () => {
    if (viewMode === 'indoor_hall') {
      setIndoorState(INITIAL_INDOOR_STATE);
    } else {
      setSource(INITIAL_SOURCE);
      setBarrier(INITIAL_BARRIER);
      setReceiver(INITIAL_RECEIVER);
      setToggles(INITIAL_TOGGLES);
    }
  };

  // Guardar Solução em Slot (A, B ou C)
  const handleSaveCurrentAsSolution = (id: 'A' | 'B' | 'C', label: string) => {
    const newSolution: SavedSolution = {
      id,
      label,
      barrier: { ...barrier },
      result: { ...result },
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    };

    setSavedSolutions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return [...filtered, newSolution].sort((a, b) => a.id.localeCompare(b.id));
    });
  };

  const handleLoadSolution = (solution: SavedSolution) => {
    setBarrier({ ...solution.barrier });
  };

  const handleClearSolution = (id: 'A' | 'B' | 'C') => {
    setSavedSolutions((prev) => prev.filter((s) => s.id !== id));
  };

  // Aplicar Cenário de um Desafio Didático
  const handleApplyChallengeSetup = (challenge: Challenge) => {
    setSource({ ...challenge.initialSetup.source });
    setBarrier({ ...challenge.initialSetup.barrier });
    setReceiver({ ...challenge.initialSetup.receiver });
  };

  // Exportar Relatório Técnico em PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');

    if (viewMode === 'indoor_hall') {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('Relatório Acústico de Nave Industrial (Recinto Fechado)', 14, 18);
      doc.setFontSize(10);
      doc.text('Controlo e Prevenção Ambiental (CPA) — Modelo Hopkins-Stryker / Sabine', 14, 25);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.text('1. Geometria e Parâmetros da Nave', 14, 42);

      doc.setFontSize(10);
      doc.text(
        `- Dimensões: ${indoorState.roomLengthM} m × ${indoorState.roomWidthM} m × ${indoorState.roomHeightM} m (Volume: ${indoorResult.roomVolumeV} m³)`,
        16,
        50
      );
      doc.text(`- Área Total de Superfícies da Nave (S): ${indoorResult.roomAreaS} m²`, 16, 56);
      doc.text(`- Absorção Média das Superfícies Rígidas (α): ${indoorState.wallAlpha} (Betão / Aço)`, 16, 62);
      doc.text(
        `- Máquina Emissora: Potência Lw = ${indoorState.machineSoundPowerLw} dB (Diretividade Q = ${indoorState.machineDirectivityQ})`,
        16,
        68
      );
      doc.text(`- Posição Atual do Operador: r = ${indoorState.operatorDistanceM} m da máquina`, 16, 74);
      doc.text(
        `- Baffles Absorventes: ${
          indoorState.bafflesEnabled
            ? `Ativados (${indoorState.bafflesCount} unidades suspensas no teto)`
            : 'Desativados (Sala Nua / Superfícies Rígidas)'
        }`,
        16,
        80
      );

      doc.setFontSize(13);
      doc.text('2. Resultados Acústicos e Comportamento em Campo Reverberado', 14, 94);

      doc.setFontSize(10);
      doc.text(
        `- Constante de Sala (R): ${indoorResult.roomConstantR} m² (Absorção Total A = ${indoorResult.totalAbsorptionA} m²)`,
        16,
        102
      );
      doc.text(`- Distância Crítica (rc): ${indoorResult.criticalDistanceRc} m`, 16, 108);
      doc.text(`- Nível de Som Direto no Operador: ${indoorResult.levelDirect} dB`, 16, 114);
      doc.text(`- Nível de Som Reverberado no Operador: ${indoorResult.levelReverberant} dB`, 16, 120);
      doc.text(`- Nível Sonoro Total no Operador: ${indoorResult.levelTotal} dB`, 16, 126);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Comparação Didática: Posto A (2 m) vs. Posto B (6 m)', 14, 140);

      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(`- Nível no Posto A (2 m): ${indoorResult.levelAt2m} dB`, 16, 148);
      doc.text(`- Nível no Posto B (6 m): ${indoorResult.levelAt6m} dB`, 16, 154);
      doc.text(
        `- Diferença por Afastamento (ΔL): apenas ${indoorResult.diffPostoABDb} dB (Em campo livre seriam 9.5 dB!)`,
        16,
        160
      );
      doc.text(
        `- Atenuação Efetiva com Baffles no Teto: -${indoorResult.baffleNoiseReductionDb} dB em toda a nave industrial`,
        16,
        166
      );

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Formulação segundo a equação de Hopkins-Stryker / Sabine para recintos industriais.', 14, 180);
      doc.text('Documento gerado automaticamente pelo Simulador de Acústica Didática CPA.', 14, 186);

      doc.save(`relatorio-nave-industrial-${Date.now()}.pdf`);
      return;
    }

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Relatório Técnico de Simulação de Barreira Acústica', 14, 18);
    doc.setFontSize(10);
    doc.text('Controlo e Prevenção Ambiental (CPA) — Simulação Didática', 14, 25);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.text('1. Geometria e Condições Iniciais', 14, 42);

    doc.setFontSize(10);
    doc.text(`- Distância Fonte-Recetor: ${result.d0} m`, 16, 50);
    doc.text(
      `- Altura da Fonte: ${source.height} m (Nível: ${source.soundPowerLevel} dB @ ${source.frequency} Hz | ${
        source.sourceType === 'line' ? 'Fonte Linear: Estrada / Tráfego' : 'Fonte Pontual: Indústria / Fábrica'
      })`,
      16,
      56
    );
    doc.text(`- Altura do Recetor: ${receiver.height} m na posição x = ${receiver.x} m`, 16, 62);
    doc.text(
      `- Barreira Acústica: ${barrier.enabled ? 'Ativada' : 'Desativada'} (x = ${barrier.x} m, Altura = ${barrier.height} m)`,
      16,
      68
    );
    doc.text(
      `- Material Selecionado: ${barrier.materialId.toUpperCase()} (Espessura = ${(barrier.thickness * 100).toFixed(1)} cm, Massa sup. = ${result.surfaceMassKgM2} kg/m²)`,
      16,
      74
    );

    doc.setFontSize(13);
    doc.text('2. Resultados Acústicos Estimados', 14, 88);

    doc.setFontSize(10);
    doc.text(`- Nível Sonoro Sem Barreira: ${result.levelFreeField} dB (${result.levelFreeFieldA} dB(A))`, 16, 96);
    doc.text(`- Nível Sonoro Com Barreira: ${result.levelWithBarrier} dB (${result.levelWithBarrierA} dB(A))`, 16, 102);
    doc.text(`- Redução Sonora Líquida (ΔL): -${result.netReduction.toFixed(1)} dB`, 16, 108);
    doc.text(`- Diferença de Percurso (δ): ${result.pathDifference} m (Número de Fresnel N = ${result.fresnelNumber})`, 16, 114);
    doc.text(`- Perda por Difração no Topo (ΔLdif): ${result.diffractionAttenuation} dB (Bónus espessura: +${result.thicknessDiffractionBonusDb} dB)`, 16, 120);
    doc.text(`- Perda por Transmissão Efetiva (R): ${result.materialTransmissionLoss} dB (Lei da Massa)`, 16, 126);
    doc.text(`- Desagrado dos Moradores (Impacto Visual): ${result.residentAnnoyance.score}% (${result.residentAnnoyance.label} | Distância Fachada: ${result.residentAnnoyance.distanceToFacadeM}m)`, 16, 132);
    doc.text(`- Custo Fictício Estimado: ${result.totalCostEuro} € (Área: ${result.totalAreaM2} m²)`, 16, 138);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Formulação segundo Maekawa / Kurze-Anderson e divergência geométrica hemisférica.', 14, 150);
    doc.text('Documento gerado automaticamente pelo Simulador Interativo de Barreiras Acústicas.', 14, 156);

    doc.save(`relatorio-barreira-acustica-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Barra de Navegação Principal */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 shadow-lg shadow-sky-950 text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white m-0">
                  Simulador de Barreiras Acústicas
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  Mitigação de Ruído
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0">
                Controlo e Prevenção Ambiental · Ensino Superior · Propagação em Tempo Real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Modelo Acústico & Limitações</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
              title="Descarregar Relatório Técnico em PDF"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
              title="Repor Cenário Padrão"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Repor Cenário</span>
            </button>
          </div>
        </div>
      </header>

      {/* Seletor do Modo de Simulação: Exterior (Barreiras) vs Interior (Nave Industrial) */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6 pt-4 pb-0">
        <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode('outdoor_barrier')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                viewMode === 'outdoor_barrier'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>1. Barreiras Acústicas (Espaço Exterior)</span>
            </button>

            <button
              onClick={() => setViewMode('indoor_hall')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                viewMode === 'indoor_hall'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Warehouse className="w-4 h-4 text-teal-300" />
              <span>2. Nave Industrial (Espaço Fechado · Baffles no Teto)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden lg:flex items-center gap-2 px-3">
            <span>Regime Atual:</span>
            <span className="font-mono text-slate-200 font-medium">
              {viewMode === 'outdoor_barrier'
                ? 'Campo Livre + Difração de Barreira (Maekawa)'
                : 'Hopkins-Stryker (Campo Direto vs. Reverberado)'}
            </span>
          </div>
        </div>
      </div>

      {/* Área Principal de Trabalho */}
      <main className="max-w-7xl mx-auto w-full p-3 sm:p-4 lg:p-6 space-y-6 flex-1">
        {viewMode === 'indoor_hall' ? (
          <IndoorHallViewport
            hallState={indoorState}
            result={indoorResult}
            onUpdateHallState={handleUpdateIndoorState}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-8 flex flex-col space-y-3">
                <SimulationViewport
                  source={source}
                  barrier={barrier}
                  receiver={receiver}
                  result={result}
                  onUpdateSource={handleUpdateSource}
                  onUpdateBarrier={handleUpdateBarrier}
                  onUpdateReceiver={handleUpdateReceiver}
                  toggles={toggles}
                  onUpdateToggles={handleUpdateToggles}
                  onReset={handleReset}
                />

                <div className="bg-slate-900/90 border border-slate-800/80 px-4 py-2.5 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-300 gap-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    <span>
                      Redução Sonora Efetiva:{' '}
                      <strong className="text-sky-400 text-sm font-mono">
                        {result.netReduction > 0 ? `-${result.netReduction.toFixed(1)} dB` : '0.0 dB'}
                      </strong>
                    </span>
                  </div>

                  {/* Coeficiente de Desagrado dos Moradores */}
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: result.residentAnnoyance.color }}
                    />
                    <span>
                      Desagrado Moradores:{' '}
                      <strong className="text-sm font-mono" style={{ color: result.residentAnnoyance.color }}>
                        {result.residentAnnoyance.score}%
                      </strong>{' '}
                      <span className="text-[11px] text-slate-400">({result.residentAnnoyance.label})</span>
                    </span>
                  </div>

                  <div className="text-amber-400 font-medium">
                    Custo: <strong className="font-mono">{result.totalCostEuro.toLocaleString('pt-PT')} €</strong>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4">
                <ControlPanel
                  source={source}
                  barrier={barrier}
                  receiver={receiver}
                  result={result}
                  onUpdateSource={handleUpdateSource}
                  onUpdateBarrier={handleUpdateBarrier}
                  onUpdateReceiver={handleUpdateReceiver}
                  onReset={handleReset}
                />
              </div>
            </div>

            {/* ABAS INFERIORES */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setActiveBottomTab('results')}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                      activeBottomTab === 'results'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Resultados & Gráficos</span>
                  </button>

                  <button
                    onClick={() => setActiveBottomTab('challenges')}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                      activeBottomTab === 'challenges'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Modo Didático (5 Desafios)</span>
                  </button>

                  <button
                    onClick={() => setActiveBottomTab('comparison')}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                      activeBottomTab === 'comparison'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Columns className="w-4 h-4" />
                    <span>Comparador de Soluções</span>
                  </button>
                </div>
              </div>

              {activeBottomTab === 'results' && (
                <ResultsDashboard
                  source={source}
                  barrier={barrier}
                  receiver={receiver}
                  result={result}
                />
              )}

              {activeBottomTab === 'challenges' && (
                <EducationalChallenges
                  source={source}
                  barrier={barrier}
                  receiver={receiver}
                  result={result}
                  onApplyChallengeSetup={handleApplyChallengeSetup}
                />
              )}

              {activeBottomTab === 'comparison' && (
                <SolutionsComparison
                  currentBarrier={barrier}
                  currentResult={result}
                  savedSolutions={savedSolutions}
                  onSaveCurrentAsSolution={handleSaveCurrentAsSolution}
                  onLoadSolution={handleLoadSolution}
                  onClearSolution={handleClearSolution}
                  source={source}
                  receiver={receiver}
                />
              )}
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/90 py-5 px-4 text-xs text-slate-500 text-center space-y-1">
        <p className="font-medium text-slate-400">
          Simulador Visual Interativo de Barreiras Acústicas · Controlo e Prevenção Ambiental
        </p>
        <p className="text-[11px] text-slate-600">
          Formulação Maekawa / Kurze-Anderson (1971) · Ponderação A (IEC 61672) · Modelo Didático 2D para Engenharia Ambiental
        </p>
      </footer>

      <AcousticMethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
}

export default App;
