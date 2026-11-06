import React, { useEffect, useRef, useState } from 'react';
import type {
  AcousticCalculationResult,
  SimulationBarrier,
  SimulationReceiver,
  SimulationSource,
} from '../acoustics/types';
import { MATERIALS } from '../acoustics/materials';
import { AcousticHeatmap } from './AcousticHeatmap';
import {
  Eye,
  EyeOff,
  Flame,
  Gauge,
  Maximize2,
  Minimize2,
  MoveHorizontal,
  MoveVertical,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from 'lucide-react';

export interface ViewportToggles {
  showIncidentWaves: boolean;
  showReflectedWaves: boolean;
  showDiffractedWaves: boolean;
  showTransmittedWaves: boolean;
  showHeatmap: boolean;
  showLineOfSight: boolean;
  showShadowZone: boolean;
  showDimensions: boolean;
  heatmapMode: 'with_barrier' | 'without_barrier' | 'difference';
}

interface SimulationViewportProps {
  source: SimulationSource;
  barrier: SimulationBarrier;
  receiver: SimulationReceiver;
  result: AcousticCalculationResult;
  onUpdateSource: (partial: Partial<SimulationSource>) => void;
  onUpdateBarrier: (partial: Partial<SimulationBarrier>) => void;
  onUpdateReceiver: (partial: Partial<SimulationReceiver>) => void;
  toggles: ViewportToggles;
  onUpdateToggles: (partial: Partial<ViewportToggles>) => void;
  onReset: () => void;
}

// Escala do Mundo Físico em Metros
const WORLD_WIDTH_M = 36;
const WORLD_HEIGHT_M = 8.5;

export const SimulationViewport: React.FC<SimulationViewportProps> = ({
  source,
  barrier,
  receiver,
  result,
  onUpdateSource,
  onUpdateBarrier,
  onUpdateReceiver,
  toggles,
  onUpdateToggles,
  onReset,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 460 });
  const [isPlaying, setIsPlaying] = useState(true);
  const [waveSpeed, setWaveSpeed] = useState<number>(30); // 0 = estático, 100 = velocidade máx
  const [animationPhase, setAnimationPhase] = useState(0);
  const [activeDrag, setActiveDrag] = useState<
    'barrier_pos' | 'barrier_height' | 'source_pos' | 'receiver_pos' | null
  >(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Resize observer para escala fluida
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Loop de animação de ondas com velocidade configurável (~60 fps)
  useEffect(() => {
    // Se a reprodução estiver pausada ou a velocidade for 0, as ondas ficam estáticas
    if (!isPlaying || waveSpeed === 0) return;
    let animId: number;
    const step = () => {
      // Delta proporcional à velocidade escolhida (ex: 30% -> 0.006)
      const delta = (waveSpeed / 100) * 0.02;
      setAnimationPhase((prev) => (prev + delta) % 1.0);
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, waveSpeed]);

  // Conversão de Coordenadas Físicas (metros) -> SVG Pixels
  const groundYPx = dimensions.height - 75; // linha do solo
  const usableHeightPx = groundYPx - 30; // espaço vertical útil

  const toPxX = (mX: number) => (mX / WORLD_WIDTH_M) * dimensions.width;
  const toPxY = (mY: number) => groundYPx - (mY / WORLD_HEIGHT_M) * usableHeightPx;

  const toMeterX = (pxX: number) =>
    Math.max(0, Math.min(WORLD_WIDTH_M, (pxX / dimensions.width) * WORLD_WIDTH_M));
  const toMeterY = (pxY: number) =>
    Math.max(0, Math.min(WORLD_HEIGHT_M, ((groundYPx - pxY) / usableHeightPx) * WORLD_HEIGHT_M));

  // Manipulação de Arrastamento com Rato ou Touch
  const handlePointerDown = (
    type: 'barrier_pos' | 'barrier_height' | 'source_pos' | 'receiver_pos',
    e: React.PointerEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDrag(type);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const mX = toMeterX(mouseX);
    const mY = toMeterY(mouseY);

    if (activeDrag === 'barrier_height') {
      const clampedHeight = Math.max(0.5, Math.min(6.5, Number(mY.toFixed(2))));
      onUpdateBarrier({ height: clampedHeight, enabled: true });
    } else if (activeDrag === 'barrier_pos') {
      const minX = source.x + 1.5;
      const maxX = receiver.x - 1.5;
      const clampedX = Math.max(minX, Math.min(maxX, Number(mX.toFixed(2))));
      onUpdateBarrier({ x: clampedX, enabled: true });
    } else if (activeDrag === 'source_pos') {
      const clampedX = Math.max(0, Math.min(Math.min(5, barrier.x - 1.5), Number(mX.toFixed(2))));
      const clampedH = Math.max(0.5, Math.min(5.0, Number(mY.toFixed(2))));
      onUpdateSource({ x: clampedX, height: clampedH });
    } else if (activeDrag === 'receiver_pos') {
      const clampedX = Math.max(Math.max(15, barrier.x + 1.5), Math.min(34.5, Number(mX.toFixed(2))));
      const clampedH = Math.max(1.0, Math.min(8.0, Number(mY.toFixed(2))));
      onUpdateReceiver({ x: clampedX, height: clampedH });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignora se já foi libertado
      }
      setActiveDrag(null);
    }
  };

  // Coordenadas em Pixels dos Elementos
  const srcPx = { x: toPxX(source.x), y: toPxY(source.height) };
  const recPx = { x: toPxX(receiver.x), y: toPxY(receiver.height) };
  const barTopPx = { x: toPxX(barrier.x), y: toPxY(barrier.height) };
  const barBasePx = { x: toPxX(barrier.x), y: groundYPx };
  const barThicknessPx = Math.max(8, (barrier.thickness / WORLD_WIDTH_M) * dimensions.width * 2.5);

  const curMaterial = MATERIALS[barrier.materialId] || MATERIALS.betao;

  // Linhas de Frente de Onda Animadas
  const maxWaveRadiusM = WORLD_WIDTH_M;
  const numIncidentWaves = 9;
  const incidentRays = Array.from({ length: numIncidentWaves }, (_, i) => {
    const norm = (i / numIncidentWaves + animationPhase) % 1.0;
    const radiusM = norm * maxWaveRadiusM;
    const radiusPx = (radiusM / WORLD_WIDTH_M) * dimensions.width;
    const opacity = Math.max(0, 1 - norm * 0.95);
    return { radiusPx, opacity, norm };
  });

  // Cálculo da Sombra Acústica Geométrica
  const shadowSlope = (barrier.height - source.height) / Math.max(0.1, barrier.x - source.x);
  const shadowEndXM = WORLD_WIDTH_M;
  const shadowEndYM = Math.max(0, barrier.height + shadowSlope * (shadowEndXM - barrier.x));
  const shadowEndPx = { x: toPxX(shadowEndXM), y: toPxY(shadowEndYM) };

  // Geometria da habitação pré-calculada
  const houseLeftM = receiver.x - 0.5;
  const houseWidthM = 4.5;
  const housePx = toPxX(houseLeftM);
  const houseWPx = toPxX(houseWidthM) - toPxX(0);

  // Ponto médio da barreira para pega horizontal
  const midBarrierY = (barTopPx.y + groundYPx) / 2;

  return (
    <div
      ref={containerRef}
      className={`relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden select-none shadow-2xl flex flex-col ${
        isFullscreen ? 'fixed inset-2 z-50 rounded-xl' : 'w-full h-[520px] lg:h-[580px]'
      }`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Barra de Ferramentas Superior do Laboratório */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs shadow-lg">
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              Laboratório 2D
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">
              <strong className="text-white">{WORLD_WIDTH_M}m</strong> × <strong className="text-white">{WORLD_HEIGHT_M}m</strong>
            </span>
          </div>

          {/* Seletor Rápido de Modelo de Emissor: Fábrica vs Estrada */}
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 text-xs shadow-lg gap-1">
            <button
              type="button"
              onClick={() => onUpdateSource({ sourceType: 'point' })}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                source.sourceType !== 'line'
                  ? 'bg-orange-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Fonte Pontual: Fábrica / Indústria"
            >
              <span>🏭 Fábrica</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateSource({ sourceType: 'line' })}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                source.sourceType === 'line'
                  ? 'bg-amber-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Fonte Linear: Estrada / Tráfego rodoviário"
            >
              <span>🛣️ Estrada</span>
            </button>
          </div>
        </div>

        {/* Toggles Visuais Rápidos e Controlo de Velocidade */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-700/80 shadow-lg text-xs">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pausar animação de ondas' : 'Retomar animação de ondas'}
            className={`p-1.5 rounded-lg transition-all ${
              isPlaying ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Slider de Velocidade das Ondas */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-950/70 rounded-lg border border-slate-800"
            title={waveSpeed === 0 ? 'Ondas estáticas (0)' : `Velocidade das ondas: ${waveSpeed}%`}
          >
            <Gauge className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Velocidade:</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={waveSpeed}
              onChange={(e) => setWaveSpeed(Number(e.target.value))}
              className="w-16 sm:w-20 accent-indigo-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
              aria-label="Velocidade das ondas"
            />
            <span className="font-mono text-[10px] w-6 text-right text-indigo-300 select-none">
              {waveSpeed === 0 ? '0' : `${waveSpeed}%`}
            </span>
          </div>

          <button
            onClick={() => onUpdateToggles({ showHeatmap: !toggles.showHeatmap })}
            title="Alternar Mapa de Cores de Níveis Sonoros (Heatmap)"
            className={`px-2 py-1 rounded-lg flex items-center gap-1 font-medium transition-all ${
              toggles.showHeatmap
                ? 'bg-amber-600/90 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Mapa Sonoro</span>
          </button>

          {toggles.showHeatmap && (
            <select
              value={toggles.heatmapMode}
              onChange={(e) =>
                onUpdateToggles({
                  heatmapMode: e.target.value as ViewportToggles['heatmapMode'],
                })
              }
              className="bg-slate-950 text-amber-300 text-[11px] rounded px-1.5 py-0.5 border border-amber-600/50 outline-none"
            >
              <option value="with_barrier">Com Barreira</option>
              <option value="without_barrier">Sem Barreira</option>
              <option value="difference">Atenuação ΔL (dB)</option>
            </select>
          )}

          <button
            onClick={() => onUpdateToggles({ showLineOfSight: !toggles.showLineOfSight })}
            title="Linha de Visão Direta (LOS)"
            className={`px-2 py-1 rounded-lg flex items-center gap-1 font-medium transition-all ${
              toggles.showLineOfSight
                ? 'bg-cyan-600/80 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {toggles.showLineOfSight ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Visão (LOS)</span>
          </button>

          <button
            onClick={onReset}
            title="Repor Valores Iniciais do Cenário"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Sair de ecrã inteiro' : 'Ver em ecrã inteiro'}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Camada 1: Mapa de Calor Acústico (Canvas 2D) */}
      <AcousticHeatmap
        source={source}
        barrier={barrier}
        receiver={receiver}
        mode={toggles.heatmapMode}
        width={dimensions.width}
        height={dimensions.height}
        worldWidthM={WORLD_WIDTH_M}
        worldHeightM={WORLD_HEIGHT_M}
        visible={toggles.showHeatmap}
        opacity={0.65}
      />

      {/* Camada 2: Vetores SVG Interativos */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 w-full h-full pointer-events-auto"
      >
        <defs>
          <pattern id="concretePattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#64748b" />
            <circle cx="5" cy="5" r="1.5" fill="#475569" />
            <circle cx="15" cy="15" r="1.5" fill="#334155" />
            <line x1="0" y1="10" x2="20" y2="10" stroke="#475569" strokeWidth="0.8" />
            <line x1="10" y1="0" x2="10" y2="20" stroke="#475569" strokeWidth="0.8" />
          </pattern>

          <pattern id="woodPattern" width="30" height="12" patternUnits="userSpaceOnUse">
            <rect width="30" height="12" fill="#b45309" />
            <line x1="0" y1="11" x2="30" y2="11" stroke="#78350f" strokeWidth="1.2" />
            <path d="M 5,4 Q 15,2 25,6" stroke="#92400e" strokeWidth="0.7" fill="none" />
          </pattern>

          <pattern id="metalPattern" width="12" height="20" patternUnits="userSpaceOnUse">
            <rect width="12" height="20" fill="#475569" />
            <line x1="3" y1="0" x2="3" y2="20" stroke="#94a3b8" strokeWidth="1" />
            <line x1="6" y1="0" x2="6" y2="20" stroke="#334155" strokeWidth="1.5" />
            <line x1="9" y1="0" x2="9" y2="20" stroke="#64748b" strokeWidth="1" />
          </pattern>

          <linearGradient id="acrylicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.5" />
          </linearGradient>

          <pattern id="absorbentPattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#065f46" />
            <circle cx="5" cy="5" r="1.8" fill="#022c22" />
            <circle cx="2" cy="2" r="0.8" fill="#10b981" />
            <circle cx="8" cy="8" r="0.8" fill="#10b981" />
          </pattern>

          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#020617" />
            <stop offset="60%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.05" />
          </linearGradient>

          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {!toggles.showHeatmap && (
          <rect x="0" y="0" width={dimensions.width} height={groundYPx} fill="url(#skyGrad)" opacity="0.9" />
        )}

        {/* ZONA DE SOMBRA ACÚSTICA GEOMÉTRICA */}
        {barrier.enabled && toggles.showShadowZone && result.isLineOfSightBroken && (
          <g className="transition-all duration-300 pointer-events-none">
            <polygon
              points={`
                ${barTopPx.x},${barTopPx.y}
                ${shadowEndPx.x},${shadowEndPx.y}
                ${dimensions.width},${groundYPx}
                ${barBasePx.x},${groundYPx}
              `}
              fill="url(#shadowGrad)"
              stroke="#10b981"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <text
              x={barTopPx.x + 35}
              y={barTopPx.y + 40}
              fill="#34d399"
              fontSize="11"
              fontWeight="bold"
              letterSpacing="1"
              opacity="0.85"
            >
              ZONA DE SOMBRA ACÚSTICA
            </text>
          </g>
        )}

        {/* FRENTES DE ONDA ANIMADAS (CAMPO DIRETO E TRANSMITIDO ATENUADO) */}
        {toggles.showIncidentWaves && (
          <g className="pointer-events-none">
            {incidentRays.map((wave, idx) => {
              const distToBar = barTopPx.x - srcPx.x;
              const hasReachedBarrier = barrier.enabled && wave.radiusPx > distToBar;

              if (!barrier.enabled || !hasReachedBarrier) {
                return (
                  <circle
                    key={`inc-full-${idx}`}
                    cx={srcPx.x}
                    cy={srcPx.y}
                    r={wave.radiusPx}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={2.2}
                    strokeOpacity={wave.opacity * 0.85}
                  />
                );
              }

              // Quando a barreira está ativa e a onda ultrapassa a barreira:
              // 1. Antes da barreira: laranja vivo e nítido
              // 2. Depois da barreira: a onda laranja CONTINUA com atenuação pelo isolamento do material (20% a 55% de opacidade)
              const transmissionFactor = Math.pow(10, -result.materialTransmissionLoss / 35);
              const postBarrierOpacity = Math.max(0.20, Math.min(0.55, transmissionFactor * wave.opacity * 1.8));

              return (
                <React.Fragment key={`inc-split-${idx}`}>
                  {/* Antes da barreira */}
                  <circle
                    cx={srcPx.x}
                    cy={srcPx.y}
                    r={wave.radiusPx}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={2.2}
                    strokeOpacity={wave.opacity * 0.85}
                    clipPath="url(#beforeBarrierClip)"
                  />
                  {/* Depois da barreira: continua em laranja atenuado */}
                  <circle
                    cx={srcPx.x}
                    cy={srcPx.y}
                    r={wave.radiusPx}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={1.8}
                    strokeOpacity={postBarrierOpacity}
                    clipPath="url(#afterBarrierClip)"
                  />
                </React.Fragment>
              );
            })}
          </g>
        )}

        <clipPath id="beforeBarrierClip">
          <rect x="0" y="0" width={barTopPx.x} height={dimensions.height} />
        </clipPath>

        <clipPath id="afterBarrierClip">
          <rect x={barTopPx.x} y="0" width={dimensions.width - barTopPx.x} height={dimensions.height} />
        </clipPath>

        {/* 2. Difração no Topo (Frentes de Onda Secundárias) */}
        {toggles.showDiffractedWaves && barrier.enabled && barrier.height > 0.2 && (
          <g className="pointer-events-none">
            {incidentRays.map((wave, idx) => {
              const diffRadius = wave.radiusPx * 0.7;
              return (
                <circle
                  key={`diff-${idx}`}
                  cx={barTopPx.x}
                  cy={barTopPx.y}
                  r={diffRadius}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1.8"
                  strokeOpacity={wave.opacity * 0.6}
                  strokeDasharray="6 3"
                  clipPath="url(#diffractionClip)"
                />
              );
            })}
          </g>
        )}

        <clipPath id="diffractionClip">
          <rect x={barTopPx.x} y="0" width={dimensions.width - barTopPx.x} height={dimensions.height} />
        </clipPath>

        {/* LINHA DE VISÃO DIRETA (LOS) - Apenas exibida em verde quando desimpedida */}
        {toggles.showLineOfSight && !result.isLineOfSightBroken && (
          <g className="pointer-events-none">
            <line
              x1={srcPx.x}
              y1={srcPx.y}
              x2={recPx.x}
              y2={recPx.y}
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          </g>
        )}

        {/* SOLO E RÉGUA GRADUADA */}
        <rect
          x="0"
          y={groundYPx}
          width={dimensions.width}
          height={dimensions.height - groundYPx}
          fill="#0f172a"
        />
        <line x1="0" y1={groundYPx} x2={dimensions.width} y2={groundYPx} stroke="#22c55e" strokeWidth="3" />
        <line x1="0" y1={groundYPx + 3} x2={dimensions.width} y2={groundYPx + 3} stroke="#16a34a" strokeWidth="2" />

        {Array.from({ length: Math.floor(WORLD_WIDTH_M) + 1 }, (_, i) => {
          const tickX = toPxX(i);
          const isMajor = i % 5 === 0;
          return (
            <g key={`tick-${i}`} className="pointer-events-none">
              <line
                x1={tickX}
                y1={groundYPx + 4}
                x2={tickX}
                y2={groundYPx + (isMajor ? 16 : 9)}
                stroke={isMajor ? '#94a3b8' : '#475569'}
                strokeWidth={isMajor ? 1.5 : 1}
              />
              {isMajor && (
                <text
                  x={tickX}
                  y={groundYPx + 30}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {i}m
                </text>
              )}
            </g>
          );
        })}

        {/* EMISSOR ACÚSTICO: FÁBRICA (FONTE PONTUAL) OU ESTRADA (FONTE LINEAR) */}
        {source.sourceType === 'line' ? (
          <g id="roadTrafficSource">
            {/* Plataforma da Estrada / Asfalto e Berma */}
            <rect
              x={toPxX(0)}
              y={toPxY(2.2)}
              width={toPxX(4.5)}
              height={groundYPx - toPxY(2.2)}
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Faixa de rodagem de asfalto escuro */}
            <rect
              x={toPxX(0.2)}
              y={toPxY(1.8)}
              width={toPxX(4.1)}
              height={groundYPx - toPxY(1.8)}
              fill="#1e293b"
            />
            {/* Linha contínua amarela da berma */}
            <line
              x1={toPxX(0.4)}
              y1={groundYPx - 3}
              x2={toPxX(4.1)}
              y2={groundYPx - 3}
              stroke="#eab308"
              strokeWidth="2.5"
            />
            {/* Marcas tracejadas brancas de separação de faixa */}
            <line
              x1={toPxX(0.6)}
              y1={groundYPx - 18}
              x2={toPxX(1.4)}
              y2={groundYPx - 18}
              stroke="#f8fafc"
              strokeWidth="2"
            />
            <line
              x1={toPxX(2.0)}
              y1={groundYPx - 18}
              x2={toPxX(2.8)}
              y2={groundYPx - 18}
              stroke="#f8fafc"
              strokeWidth="2"
            />
            <line
              x1={toPxX(3.4)}
              y1={groundYPx - 18}
              x2={toPxX(4.1)}
              y2={groundYPx - 18}
              stroke="#f8fafc"
              strokeWidth="2"
            />

            {/* Veículo / Automóvel Estilizado em Trânsito */}
            <g transform={`translate(${toPxX(0.6)}, ${groundYPx - 46})`}>
              {/* Feixe de luz dos faróis a iluminar a estrada à frente */}
              <polygon
                points="75,22 155,8 155,34 75,26"
                fill="#fef08a"
                fillOpacity="0.15"
              />
              {/* Carroçaria inferior */}
              <rect x="0" y="14" width="76" height="15" rx="3" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.2" />
              {/* Habitáculo / tejadilho com vidro */}
              <polygon points="14,14 26,2 54,2 64,14" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
              <polygon points="17,13 27,4 51,4 60,13" fill="#0f172a" opacity="0.75" />
              {/* Farol dianteiro */}
              <rect x="72" y="17" width="4" height="6" rx="1" fill="#fef08a" />
              {/* Farol traseiro */}
              <rect x="0" y="17" width="3" height="6" rx="1" fill="#ef4444" />
              {/* Rodas dianteira e traseira */}
              <circle cx="18" cy="28" r="7" fill="#020617" stroke="#475569" strokeWidth="1.5" />
              <circle cx="18" cy="28" r="2.5" fill="#94a3b8" />
              <circle cx="58" cy="28" r="7" fill="#020617" stroke="#475569" strokeWidth="1.5" />
              <circle cx="58" cy="28" r="2.5" fill="#94a3b8" />
            </g>

            {/* Poste de Sinalização Rodoviária */}
            <g transform={`translate(${toPxX(4.0)}, ${groundYPx - 95})`}>
              <line x1="0" y1="0" x2="0" y2="95" stroke="#64748b" strokeWidth="2" />
              <circle cx="0" cy="0" r="11" fill="#ffffff" stroke="#ef4444" strokeWidth="3" />
              <text x="0" y="4" fill="#0f172a" fontSize="8" textAnchor="middle" fontWeight="bold">
                80
              </text>
            </g>

            {/* Rótulos Descritivos da Estrada */}
            <text x={toPxX(2.2)} y={toPxY(3.8)} fill="#f59e0b" fontSize="11" textAnchor="middle" fontWeight="bold">
              ESTRADA / VIA RÁPIDA
            </text>
            <text x={toPxX(2.2)} y={toPxY(3.1)} fill="#fbbf24" fontSize="9" textAnchor="middle" fontWeight="medium">
              Fonte Linear (Tráfego)
            </text>
            <text x={toPxX(2.2)} y={toPxY(2.5)} fill="#94a3b8" fontSize="8.5" textAnchor="middle">
              {source.soundPowerLevel} dB @ {source.frequency}Hz
            </text>

            {/* Pega Interativa da Fonte Sonora */}
            <g
              className="cursor-move group"
              onPointerDown={(e) => handlePointerDown('source_pos', e)}
            >
              <circle
                cx={srcPx.x}
                cy={srcPx.y}
                r="16"
                fill="#f59e0b"
                fillOpacity="0.2"
              />
              <circle cx={srcPx.x} cy={srcPx.y} r="12" fill="#d97706" stroke="#fef3c7" strokeWidth="2.5" />
              <circle cx={srcPx.x} cy={srcPx.y} r="4" fill="#ffffff" />

              <g transform={`translate(${srcPx.x + 16}, ${srcPx.y - 14})`}>
                <rect x="0" y="0" width="70" height="18" rx="4" fill="#0f172a" stroke="#d97706" strokeWidth="1" />
                <text x="35" y="12" fill="#fde68a" fontSize="9" textAnchor="middle" fontWeight="bold">
                  Tráfego: {source.height.toFixed(1)}m
                </text>
              </g>
            </g>
          </g>
        ) : (
          <g id="industrialFactory">
            <rect
              x={toPxX(0)}
              y={toPxY(5.2)}
              width={toPxX(3.5)}
              height={groundYPx - toPxY(5.2)}
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1.5"
              rx="2"
            />
            <polygon
              points={`
                ${toPxX(0)},${toPxY(5.2)}
                ${toPxX(1.7)},${toPxY(6.1)}
                ${toPxX(1.7)},${toPxY(5.2)}
                ${toPxX(3.5)},${toPxY(6.1)}
                ${toPxX(3.5)},${toPxY(5.2)}
              `}
              fill="#334155"
            />
            <rect x={toPxX(0.6)} y={toPxY(7.2)} width={toPxX(0.7)} height={toPxY(5.2) - toPxY(7.2)} fill="#475569" />
            <circle cx={toPxX(0.95)} cy={toPxY(7.5)} r="5" fill="#94a3b8" opacity="0.3" />
            <circle cx={toPxX(1.1)} cy={toPxY(7.9)} r="7" fill="#cbd5e1" opacity="0.2" />

            <rect x={toPxX(0.4)} y={toPxY(2.0)} width={toPxX(1.2)} height={groundYPx - toPxY(2.0)} fill="#0f172a" />
            <rect x={toPxX(2.0)} y={toPxY(4.5)} width={toPxX(1.1)} height={toPxY(3.5) - toPxY(4.5)} fill="#38bdf8" opacity="0.25" />

            <text x={toPxX(1.7)} y={toPxY(2.5)} fill="#cbd5e1" fontSize="10" textAnchor="middle" fontWeight="bold">
              FÁBRICA
            </text>
            <text x={toPxX(1.7)} y={toPxY(1.9)} fill="#f97316" fontSize="8.5" textAnchor="middle">
              Fonte Pontual (Indústria)
            </text>
            <text x={toPxX(1.7)} y={toPxY(1.3)} fill="#94a3b8" fontSize="8.5" textAnchor="middle">
              {source.soundPowerLevel} dB @ {source.frequency}Hz
            </text>

            <g
              className="cursor-move group"
              onPointerDown={(e) => handlePointerDown('source_pos', e)}
            >
              <circle
                cx={srcPx.x}
                cy={srcPx.y}
                r="16"
                fill="#f97316"
                fillOpacity="0.2"
              />
              <circle cx={srcPx.x} cy={srcPx.y} r="12" fill="#ea580c" stroke="#fed7aa" strokeWidth="2.5" />
              <circle cx={srcPx.x} cy={srcPx.y} r="4" fill="#ffffff" />

              <g transform={`translate(${srcPx.x + 16}, ${srcPx.y - 14})`}>
                <rect x="0" y="0" width="62" height="18" rx="4" fill="#0f172a" stroke="#ea580c" strokeWidth="1" />
                <text x="31" y="12" fill="#fdba74" fontSize="9" textAnchor="middle" fontWeight="bold">
                  Fonte: {source.height.toFixed(1)}m
                </text>
              </g>
            </g>
          </g>
        )}

        {/* HABITAÇÃO / RECETOR */}
        <g id="residentialReceiver">
          <rect
            x={housePx}
            y={toPxY(5.5)}
            width={houseWPx}
            height={groundYPx - toPxY(5.5)}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.5"
            rx="3"
          />
          <polygon
            points={`
              ${housePx - 8},${toPxY(5.5)}
              ${housePx + houseWPx / 2},${toPxY(7.4)}
              ${housePx + houseWPx + 8},${toPxY(5.5)}
            `}
            fill="#b91c1c"
            stroke="#991b1b"
            strokeWidth="1.5"
          />
          <rect x={housePx + houseWPx * 0.75} y={toPxY(7.0)} width="10" height={toPxY(5.5) - toPxY(7.0)} fill="#7f1d1d" />

          <rect x={housePx + 10} y={toPxY(4.8)} width="16" height="18" rx="2" fill="#fef08a" opacity="0.8" />
          <line x1={housePx + 18} y1={toPxY(4.8)} x2={housePx + 18} y2={toPxY(4.8) + 18} stroke="#713f12" strokeWidth="1" />
          <rect x={housePx + houseWPx - 26} y={toPxY(4.8)} width="16" height="18" rx="2" fill="#fef08a" opacity="0.8" />
          <rect x={housePx + 12} y={toPxY(1.8)} width="18" height={groundYPx - toPxY(1.8)} fill="#0f172a" stroke="#475569" />

          <line x1={recPx.x} y1={recPx.y} x2={recPx.x} y2={groundYPx} stroke="#64748b" strokeWidth="2.5" />
          <line x1={recPx.x} y1={groundYPx} x2={recPx.x - 12} y2={groundYPx + 3} stroke="#475569" strokeWidth="2.5" />
          <line x1={recPx.x} y1={groundYPx} x2={recPx.x + 12} y2={groundYPx + 3} stroke="#475569" strokeWidth="2.5" />

          <g
            className="cursor-move group"
            onPointerDown={(e) => handlePointerDown('receiver_pos', e)}
          >
            <circle cx={recPx.x} cy={recPx.y} r="14" fill="#10b981" fillOpacity="0.25" className="animate-pulse" />
            <circle cx={recPx.x} cy={recPx.y} r="9" fill="#059669" stroke="#6ee7b7" strokeWidth="2" />
            <circle cx={recPx.x} cy={recPx.y} r="3" fill="#ffffff" />

            <g transform={`translate(${recPx.x - 45}, ${recPx.y - 48})`}>
              <rect
                x="0"
                y="0"
                width="90"
                height="34"
                rx="6"
                fill="#020617"
                stroke={result.netReduction >= 5 ? '#10b981' : '#f59e0b'}
                strokeWidth="1.5"
                filter="url(#glowEffect)"
              />
              <text x="45" y="14" fill="#94a3b8" fontSize="9" textAnchor="middle">
                RECETOR ({receiver.height.toFixed(1)}m)
              </text>
              <text
                x="45"
                y="28"
                fill={result.netReduction >= 5 ? '#34d399' : '#fbbf24'}
                fontSize="13"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {result.levelWithBarrier.toFixed(1)} dB
              </text>
            </g>
          </g>
        </g>

        {/* BARREIRA ACÚSTICA */}
        {barrier.enabled && (
          <g id="acousticBarrierGroup">
            <rect
              x={barTopPx.x - barThicknessPx / 2}
              y={barTopPx.y}
              width={barThicknessPx}
              height={groundYPx - barTopPx.y}
              fill={
                curMaterial.patternType === 'concrete'
                  ? 'url(#concretePattern)'
                  : curMaterial.patternType === 'wood'
                  ? 'url(#woodPattern)'
                  : curMaterial.patternType === 'metal'
                  ? 'url(#metalPattern)'
                  : curMaterial.patternType === 'glass'
                  ? 'url(#acrylicGrad)'
                  : 'url(#absorbentPattern)'
              }
              stroke="#0f172a"
              strokeWidth="2"
              rx="2"
            />

            <line
              x1={barTopPx.x - barThicknessPx / 2}
              y1={barTopPx.y}
              x2={barTopPx.x - barThicknessPx / 2}
              y2={groundYPx}
              stroke="#1e293b"
              strokeWidth="3"
            />
            <line
              x1={barTopPx.x + barThicknessPx / 2}
              y1={barTopPx.y}
              x2={barTopPx.x + barThicknessPx / 2}
              y2={groundYPx}
              stroke="#0f172a"
              strokeWidth="2"
            />

            <rect
              x={barTopPx.x - barThicknessPx / 2 - 2}
              y={barTopPx.y - 3}
              width={barThicknessPx + 4}
              height="4"
              fill="#334155"
              rx="1"
            />

            {/* PEGA DE ALTURA */}
            <g
              className="cursor-ns-resize group"
              onPointerDown={(e) => handlePointerDown('barrier_height', e)}
            >
              <circle
                cx={barTopPx.x}
                cy={barTopPx.y}
                r="16"
                fill="#38bdf8"
                fillOpacity="0.2"
                className="group-hover:fill-opacity-50 transition-all"
              />
              <circle
                cx={barTopPx.x}
                cy={barTopPx.y}
                r="9"
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="2.2"
                filter="url(#glowEffect)"
              />
              <path
                d={`M ${barTopPx.x} ${barTopPx.y - 5} L ${barTopPx.x - 3} ${barTopPx.y - 2} L ${barTopPx.x + 3} ${barTopPx.y - 2} Z`}
                fill="#ffffff"
              />
              <path
                d={`M ${barTopPx.x} ${barTopPx.y + 5} L ${barTopPx.x - 3} ${barTopPx.y + 2} L ${barTopPx.x + 3} ${barTopPx.y + 2} Z`}
                fill="#ffffff"
              />

              <g transform={`translate(${barTopPx.x + 14}, ${barTopPx.y - 12})`}>
                <rect x="0" y="0" width="70" height="22" rx="4" fill="#0369a1" stroke="#bae6fd" strokeWidth="1" />
                <text x="35" y="15" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">
                  h = {barrier.height.toFixed(2)}m
                </text>
              </g>
            </g>

            {/* PEGA HORIZONTAL */}
            <g
              className="cursor-ew-resize group"
              onPointerDown={(e) => handlePointerDown('barrier_pos', e)}
            >
              <rect
                x={barTopPx.x - 14}
                y={midBarrierY - 12}
                width="28"
                height="24"
                rx="6"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="2"
                className="group-hover:fill-sky-950 transition-all"
              />
              <path
                d={`M ${barTopPx.x - 8} ${midBarrierY} L ${barTopPx.x - 4} ${midBarrierY - 4} L ${barTopPx.x - 4} ${midBarrierY + 4} Z`}
                fill="#38bdf8"
              />
              <path
                d={`M ${barTopPx.x + 8} ${midBarrierY} L ${barTopPx.x + 4} ${midBarrierY - 4} L ${barTopPx.x + 4} ${midBarrierY + 4} Z`}
                fill="#38bdf8"
              />

              <text
                x={barTopPx.x}
                y={midBarrierY + 24}
                fill="#38bdf8"
                fontSize="10"
                textAnchor="middle"
                fontWeight="bold"
                className="bg-slate-900"
              >
                x = {barrier.x.toFixed(1)}m
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* Legenda Flutuante */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] shadow-lg">
        <span className="font-semibold text-slate-300">Fenómenos:</span>
        <span className="flex items-center gap-1 text-orange-400">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
          Incidente
        </span>
        <span className="flex items-center gap-1 text-purple-400">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
          Difratado
        </span>
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          Sombra
        </span>
      </div>

      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-400">
        <MoveHorizontal className="w-3.5 h-3.5 text-sky-400" />
        <span>Arrasta a barreira, fonte ou recetor</span>
        <MoveVertical className="w-3.5 h-3.5 text-sky-400 ml-1" />
      </div>
    </div>
  );
};
