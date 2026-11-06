import React, { useRef, useState, useEffect } from 'react';
import type { IndoorAcousticResult, IndoorHallState } from '../acoustics/types';
import {
  Sparkles,
  Plus,
  Minus,
} from 'lucide-react';

interface IndoorHallViewportProps {
  hallState: IndoorHallState;
  result: IndoorAcousticResult;
  onUpdateHallState: (partial: Partial<IndoorHallState>) => void;
}

export const IndoorHallViewport: React.FC<IndoorHallViewportProps> = ({
  hallState,
  result,
  onUpdateHallState,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDraggingOperator, setIsDraggingOperator] = useState(false);

  // Coordenadas SVG
  // Sala: 24m de largura, 6.5m de altura
  // Mapeamos para uma viewBox SVG: viewBox="0 0 960 480"
  const SVG_WIDTH = 960;
  const SVG_HEIGHT = 480;

  const ROOM_X_START = 80;
  const ROOM_X_END = 900;
  const ROOM_Y_CEILING = 70;
  const ROOM_Y_FLOOR = 380;

  const ROOM_WIDTH_PX = ROOM_X_END - ROOM_X_START; // 820 px para 24 m => ~34.17 px/m
  const ROOM_HEIGHT_PX = ROOM_Y_FLOOR - ROOM_Y_CEILING; // 310 px para 6.5 m => ~47.69 px/m

  const scaleX = (xMeters: number) => {
    const clamped = Math.max(0, Math.min(hallState.roomLengthM, xMeters));
    return ROOM_X_START + (clamped / hallState.roomLengthM) * ROOM_WIDTH_PX;
  };

  const invScaleX = (px: number) => {
    const rawM = ((px - ROOM_X_START) / ROOM_WIDTH_PX) * hallState.roomLengthM;
    return Math.max(0.5, Math.min(hallState.roomLengthM - 1, rawM));
  };

  // Coordenadas dos objetos
  const machineSvgX = scaleX(hallState.machineX);
  const machineSvgY = ROOM_Y_FLOOR - 65; // Altura visual da máquina
  const machineSoundY = ROOM_Y_FLOOR - 40; // Ponto emissor de som da máquina

  const operatorDistanceM = hallState.operatorDistanceM;
  const operatorActualXM = hallState.machineX + operatorDistanceM;
  const operatorSvgX = scaleX(operatorActualXM);
  const operatorSvgY = ROOM_Y_FLOOR - 70; // Cabeça do operador

  const criticalSvgX = scaleX(hallState.machineX + result.criticalDistanceRc);

  // Arrastamento do operador com o rato
  const handleMouseDownOperator = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingOperator(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingOperator || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const svgX = (clientX / rect.width) * SVG_WIDTH;
      const xMeters = invScaleX(svgX);
      const maxDist = Math.max(0.5, Number((hallState.roomLengthM - hallState.machineX - 0.6).toFixed(1)));
      const newDistance = Math.max(0.5, Math.min(maxDist, xMeters - hallState.machineX));
      onUpdateHallState({ operatorDistanceM: Number(newDistance.toFixed(1)) });
    };

    const handleMouseUp = () => {
      setIsDraggingOperator(false);
    };

    if (isDraggingOperator) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingOperator, hallState.roomLengthM, hallState.machineX, onUpdateHallState]);

  // Gerar posições dos Baffles no teto
  const bafflesList = React.useMemo(() => {
    if (!hallState.bafflesEnabled || hallState.bafflesCount <= 0) return [];
    const count = Math.min(60, hallState.bafflesCount);
    const spacingPx = (ROOM_WIDTH_PX - 80) / (count + 1);
    return Array.from({ length: count }, (_, i) => ({
      x: ROOM_X_START + 40 + (i + 1) * spacingPx,
      y: ROOM_Y_CEILING + 28,
    }));
  }, [hallState.bafflesEnabled, hallState.bafflesCount, ROOM_WIDTH_PX]);

  // Posições dos postos didáticos do slide
  const postoASvgX = scaleX(hallState.machineX + 2.0);
  const postoBSvgX = scaleX(hallState.machineX + 6.0);

  return (
    <div className="flex flex-col space-y-4">
      {/* Viewport Principal SVG */}
      <div className="relative w-full rounded-2xl border border-slate-800 bg-[#0b101b] shadow-2xl overflow-hidden select-none">
        {/* Cabeçalho superior com título e controlos de Baffles */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-bold text-xs border border-teal-500/40">
              1
            </span>
            <div>
              <h2 className="text-sm font-bold tracking-wider text-teal-300 uppercase m-0 leading-tight">
                O que acontece na nave industrial
              </h2>
              <span className="text-[11px] text-slate-400">
                Hopkins-Stryker (Campo Direto vs. Reverberado)
              </span>
            </div>
          </div>

          {/* Controlos Superiores: Baffles e Atalhos */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Controlo de Baffles (Ligar/Desligar e Quantidade) */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {/* Botão Ligar/Desligar */}
              <button
                onClick={() => onUpdateHallState({ bafflesEnabled: !hallState.bafflesEnabled })}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                  hallState.bafflesEnabled
                    ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{hallState.bafflesEnabled ? 'Baffles: Ligados' : 'Baffles: Desligados'}</span>
              </button>

              {/* Ajuste da quantidade de Baffles */}
              <div
                className={`flex items-center gap-1 pl-1 transition-opacity ${
                  hallState.bafflesEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
                }`}
              >
                <button
                  onClick={() => onUpdateHallState({ bafflesCount: Math.max(2, hallState.bafflesCount - 2) })}
                  disabled={!hallState.bafflesEnabled || hallState.bafflesCount <= 2}
                  className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
                  title="Diminuir Baffles (-2)"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="px-2 py-0.5 font-mono font-bold text-teal-300 text-xs min-w-[50px] text-center">
                  {hallState.bafflesCount} un.
                </span>

                <button
                  onClick={() => onUpdateHallState({ bafflesCount: Math.min(40, hallState.bafflesCount + 2) })}
                  disabled={!hallState.bafflesEnabled || hallState.bafflesCount >= 40}
                  className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
                  title="Aumentar Baffles (+2)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {/* Botões de quantidade rápida */}
                <div className="hidden sm:flex items-center gap-1 border-l border-slate-800 ml-1.5 pl-1.5">
                  {[10, 20, 30, 40].map((count) => (
                    <button
                      key={count}
                      onClick={() => onUpdateHallState({ bafflesCount: count })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                        hallState.bafflesCount === count
                          ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Atalhos para Posto A (2m) e Posto B (6m) */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium px-1 hidden md:inline text-[11px]">Slide:</span>
              <button
                onClick={() => onUpdateHallState({ operatorDistanceM: 2.0 })}
                className={`px-2.5 py-1 rounded-lg border font-mono transition-all ${
                  Math.abs(operatorDistanceM - 2.0) < 0.2
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm font-bold'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                }`}
              >
                Posto A (2 m)
              </button>
              <button
                onClick={() => onUpdateHallState({ operatorDistanceM: 6.0 })}
                className={`px-2.5 py-1 rounded-lg border font-mono transition-all ${
                  Math.abs(operatorDistanceM - 6.0) < 0.2
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm font-bold'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                }`}
              >
                Posto B (6 m)
              </button>
            </div>
          </div>
        </div>

        {/* SVG Interativo da Nave */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto max-h-[500px] block"
          style={{ cursor: isDraggingOperator ? 'grabbing' : 'default' }}
        >
          <defs>
            {/* Gradiente para Máquina */}
            <linearGradient id="machineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Gradiente para Baffles */}
            <linearGradient id="baffleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>

            {/* Seta para som direto */}
            <marker
              id="orangeArrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#fb923c" />
            </marker>

            {/* Seta para reflexões */}
            <marker
              id="cyanArrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
            </marker>

            {/* Padrão para o solo de betão */}
            <pattern id="concretePattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 0 20 L 20 0 M 0 0 L 20 20" stroke="#1e293b" strokeWidth="1" opacity="0.4" />
            </pattern>
          </defs>

          {/* ESTRUTURA DA NAVE INDUSTRIAL */}
          {/* Fundo do pavilhão */}
          <rect
            x={ROOM_X_START}
            y={ROOM_Y_CEILING}
            width={ROOM_WIDTH_PX}
            height={ROOM_HEIGHT_PX}
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="2.5"
            rx="4"
          />

          {/* Vigas de aço no teto */}
          {Array.from({ length: 8 }).map((_, i) => {
            const beamX = ROOM_X_START + ((i + 1) * ROOM_WIDTH_PX) / 9;
            return (
              <line
                key={`beam-${i}`}
                x1={beamX}
                y1={ROOM_Y_CEILING}
                x2={beamX}
                y2={ROOM_Y_CEILING + 12}
                stroke="#334155"
                strokeWidth="3"
              />
            );
          })}

          {/* Solo de betão */}
          <rect
            x={ROOM_X_START}
            y={ROOM_Y_FLOOR}
            width={ROOM_WIDTH_PX}
            height={SVG_HEIGHT - ROOM_Y_FLOOR - 10}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.5"
          />
          <rect
            x={ROOM_X_START}
            y={ROOM_Y_FLOOR}
            width={ROOM_WIDTH_PX}
            height={SVG_HEIGHT - ROOM_Y_FLOOR - 10}
            fill="url(#concretePattern)"
          />

          {/* Rótulo das superfícies rígidas */}
          <text
            x={ROOM_X_START + 14}
            y={ROOM_Y_CEILING + 24}
            fill="#64748b"
            fontSize="11"
            fontFamily="sans-serif"
            fontWeight="500"
          >
            Nave Industrial (Comprimento: {hallState.roomLengthM} m · Superfícies rígidas: Betão e Chapa de Aço)
          </text>

          {/* BAFFLES ABSORVENTES NO TETO */}
          {hallState.bafflesEnabled && (
            <g>
              <text
                x={SVG_WIDTH / 2}
                y={ROOM_Y_CEILING - 12}
                fill="#2dd4bf"
                fontSize="12"
                fontFamily="sans-serif"
                fontWeight="600"
                textAnchor="middle"
              >
                Baffles absorventes ({hallState.bafflesCount} unidades suspensas)
              </text>

              {bafflesList.map((baffle, idx) => (
                <g key={`baffle-${idx}`}>
                  {/* Tirante de fixação ao teto */}
                  <line
                    x1={baffle.x}
                    y1={ROOM_Y_CEILING}
                    x2={baffle.x}
                    y2={baffle.y}
                    stroke="#2dd4bf"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    opacity="0.8"
                  />
                  {/* Painel do Baffle */}
                  <rect
                    x={baffle.x - 12}
                    y={baffle.y}
                    width="24"
                    height="8"
                    rx="2"
                    fill="url(#baffleGrad)"
                    stroke="#5eead4"
                    strokeWidth="1"
                    filter="drop-shadow(0px 2px 4px rgba(45, 212, 191, 0.3))"
                  />
                </g>
              ))}
            </g>
          )}

          {/* DISTÂNCIA CRÍTICA (Linha tracejada laranja vertical) */}
          <g>
            <line
              x1={criticalSvgX}
              y1={ROOM_Y_CEILING}
              x2={criticalSvgX}
              y2={ROOM_Y_FLOOR}
              stroke="#f97316"
              strokeWidth="2"
              strokeDasharray="5,4"
              opacity="0.9"
            />
            {/* Texto Distância Crítica */}
            <rect
              x={criticalSvgX - 55}
              y={ROOM_Y_CEILING + 40}
              width="110"
              height="24"
              rx="6"
              fill="#18181b"
              stroke="#f97316"
              strokeWidth="1"
              opacity="0.95"
            />
            <text
              x={criticalSvgX}
              y={ROOM_Y_CEILING + 56}
              fill="#fb923c"
              fontSize="11"
              fontFamily="sans-serif"
              fontWeight="bold"
              textAnchor="middle"
            >
              Distância crítica ({result.criticalDistanceRc} m)
            </text>
          </g>

          {/* MÁQUINA (Emissora de Som) */}
          <g>
            {/* Caixa exterior da máquina */}
            <rect
              x={machineSvgX - 35}
              y={machineSvgY - 15}
              width="70"
              height="80"
              rx="12"
              fill="url(#machineGrad)"
              stroke="#fef08a"
              strokeWidth="1.5"
              filter="drop-shadow(0px 4px 10px rgba(245, 158, 11, 0.4))"
            />
            {/* Motor / Rolo central */}
            <circle
              cx={machineSvgX}
              cy={machineSvgY + 25}
              r="20"
              fill="#78350f"
              stroke="#fef3c7"
              strokeWidth="2"
            />
            <circle
              cx={machineSvgX}
              cy={machineSvgY + 25}
              r="8"
              fill="#451a03"
            />

            {/* Rótulo MÁQUINA */}
            <text
              x={machineSvgX}
              y={ROOM_Y_FLOOR + 24}
              fill="#f59e0b"
              fontSize="13"
              fontFamily="sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              letterSpacing="1"
            >
              MÁQUINA
            </text>
            <text
              x={machineSvgX}
              y={ROOM_Y_FLOOR + 38}
              fill="#fbbf24"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
            >
              Lw = {hallState.machineSoundPowerLw} dB
            </text>
          </g>

          {/* RAIOS DE SOM: DIRETO E REFLEXÕES */}
          {/* Som Direto (Seta Laranja horizontal até ao Operador) */}
          <g>
            <line
              x1={machineSvgX + 35}
              y1={machineSoundY}
              x2={operatorSvgX - 20}
              y2={machineSoundY}
              stroke="#fb923c"
              strokeWidth="3.5"
              markerEnd="url(#orangeArrow)"
            />
            {/* Rótulo "Som direto" */}
            <rect
              x={machineSvgX + 45}
              y={machineSoundY + 8}
              width="80"
              height="20"
              rx="4"
              fill="#090d16"
              stroke="#fb923c"
              strokeWidth="1"
              opacity="0.9"
            />
            <text
              x={machineSvgX + 85}
              y={machineSoundY + 22}
              fill="#fb923c"
              fontSize="11"
              fontFamily="sans-serif"
              fontWeight="bold"
              textAnchor="middle"
            >
              Som direto
            </text>
          </g>

          {/* Raios de Reflexões nas Superfícies Rígidas (Azul / Ciano) */}
          <g opacity={hallState.bafflesEnabled ? 0.35 : 0.85}>
            {/* Raio 1: Bate no teto a 1/3 da distância e desce para o operador */}
            <path
              d={`M ${machineSvgX + 20} ${machineSoundY - 10} L ${(machineSvgX + operatorSvgX) / 2} ${ROOM_Y_CEILING + 4} L ${operatorSvgX - 6} ${operatorSvgY - 10}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray={hallState.bafflesEnabled ? '4,4' : 'none'}
              markerEnd="url(#cyanArrow)"
            />

            {/* Raio 2: Bate no teto a 2/3 e desce */}
            <path
              d={`M ${machineSvgX + 25} ${machineSoundY - 20} L ${machineSvgX + (operatorSvgX - machineSvgX) * 0.75} ${ROOM_Y_CEILING + 4} L ${operatorSvgX + 4} ${operatorSvgY - 12}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray={hallState.bafflesEnabled ? '4,4' : 'none'}
              markerEnd="url(#cyanArrow)"
            />

            {/* Rótulo central: Reflexões nas superfícies rígidas */}
            <rect
              x={(machineSvgX + operatorSvgX) / 2 - 110}
              y={ROOM_Y_CEILING + 90}
              width="220"
              height="24"
              rx="6"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1"
              opacity="0.92"
            />
            <text
              x={(machineSvgX + operatorSvgX) / 2}
              y={ROOM_Y_CEILING + 106}
              fill="#7dd3fc"
              fontSize="11"
              fontFamily="sans-serif"
              fontWeight="600"
              textAnchor="middle"
            >
              Reflexões nas superfícies rígidas
            </text>
          </g>

          {/* MARCADORES DE REFERÊNCIA DIDÁTICA DO SLIDE: POSTO A (2m) e POSTO B (6m) */}
          <g>
            {/* Posto A (2 m) */}
            <g
              onClick={() => onUpdateHallState({ operatorDistanceM: 2.0 })}
              className="cursor-pointer group"
            >
              <rect
                x={postoASvgX - 52}
                y={ROOM_Y_FLOOR + 10}
                width="104"
                height="32"
                rx="16"
                fill={Math.abs(operatorDistanceM - 2.0) < 0.2 ? '#d97706' : '#1e293b'}
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
              <text
                x={postoASvgX}
                y={ROOM_Y_FLOOR + 30}
                fill="#f8fafc"
                fontSize="11"
                fontFamily="sans-serif"
                fontWeight="bold"
                textAnchor="middle"
              >
                POSTO A · 2 m
              </text>
            </g>

            {/* Posto B (6 m) */}
            <g
              onClick={() => onUpdateHallState({ operatorDistanceM: 6.0 })}
              className="cursor-pointer group"
            >
              <rect
                x={postoBSvgX - 52}
                y={ROOM_Y_FLOOR + 10}
                width="104"
                height="32"
                rx="16"
                fill={Math.abs(operatorDistanceM - 6.0) < 0.2 ? '#d97706' : '#1e293b'}
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
              <text
                x={postoBSvgX}
                y={ROOM_Y_FLOOR + 30}
                fill="#f8fafc"
                fontSize="11"
                fontFamily="sans-serif"
                fontWeight="bold"
                textAnchor="middle"
              >
                POSTO B · 6 m
              </text>
            </g>
          </g>

          {/* OPERADOR (Stick Figure Interativo Arrastável) */}
          <g
            transform={`translate(${operatorSvgX}, 0)`}
            className="cursor-ew-resize group"
            onMouseDown={handleMouseDownOperator}
          >
            {/* Halo de interação ao passar rato / arrastar */}
            <circle
              cx="0"
              cy={operatorSvgY + 30}
              r="40"
              fill="#38bdf8"
              opacity={isDraggingOperator ? 0.2 : 0.08}
            />

            {/* Cabeça */}
            <circle
              cx="0"
              cy={operatorSvgY}
              r="14"
              fill="#f8fafc"
              stroke="#0284c7"
              strokeWidth="2.5"
            />
            {/* Olhos e sorriso estilizado */}
            <circle cx="-4" cy={operatorSvgY - 2} r="1.5" fill="#0f172a" />
            <circle cx="4" cy={operatorSvgY - 2} r="1.5" fill="#0f172a" />

            {/* Tronco */}
            <line
              x1="0"
              y1={operatorSvgY + 14}
              x2="0"
              y2={operatorSvgY + 50}
              stroke="#f8fafc"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Braços */}
            <line
              x1="0"
              y1={operatorSvgY + 24}
              x2="-16"
              y2={operatorSvgY + 42}
              stroke="#f8fafc"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="0"
              y1={operatorSvgY + 24}
              x2="16"
              y2={operatorSvgY + 42}
              stroke="#f8fafc"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Pernas */}
            <line
              x1="0"
              y1={operatorSvgY + 50}
              x2="-14"
              y2={ROOM_Y_FLOOR}
              stroke="#f8fafc"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="0"
              y1={operatorSvgY + 50}
              x2="14"
              y2={ROOM_Y_FLOOR}
              stroke="#f8fafc"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Caixa Flutuante com Nível Sonoro Recebido */}
            <g transform={`translate(-80, ${operatorSvgY - 78})`}>
              <rect
                x="0"
                y="0"
                width="160"
                height="56"
                rx="10"
                fill="#0f172a"
                stroke={result.isOperatorInReverberantField ? '#38bdf8' : '#f97316'}
                strokeWidth="2"
                filter="drop-shadow(0px 4px 12px rgba(0,0,0,0.6))"
              />
              <text
                x="80"
                y="18"
                fill="#f8fafc"
                fontSize="11"
                fontFamily="sans-serif"
                fontWeight="bold"
                textAnchor="middle"
              >
                Nível Total: {result.levelTotal} dB
              </text>
              <text
                x="80"
                y="34"
                fill="#94a3b8"
                fontSize="9.5"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                Direto: {result.levelDirect} dB | Rev: {result.levelReverberant} dB
              </text>
              <text
                x="80"
                y="48"
                fill={result.isOperatorInReverberantField ? '#38bdf8' : '#fb923c'}
                fontSize="9"
                fontFamily="sans-serif"
                fontWeight="bold"
                textAnchor="middle"
              >
                {result.isOperatorInReverberantField
                  ? '🔵 Campo Reverberado Domina'
                  : '🟠 Campo Direto Domina'}
              </text>
            </g>

            {/* Indicador de arrasto no pé */}
            <text
              x="0"
              y={ROOM_Y_FLOOR + 54}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              r = {operatorDistanceM} m ⇄
            </text>
          </g>
        </svg>

        {/* Rodapé Interno com Análise Didática Instantânea */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-medium block mb-1">Comparação Slide (Posto A vs B):</span>
            <div className="flex items-center justify-between text-slate-200">
              <span>Posto A (2 m): <strong className="text-amber-400 font-mono">{result.levelAt2m} dB</strong></span>
              <span>Posto B (6 m): <strong className="text-amber-400 font-mono">{result.levelAt6m} dB</strong></span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Diferença:</span>
              <strong className="text-sky-400 font-mono">Δ = {result.diffPostoABDb} dB</strong>
              <span className="text-[10px] text-slate-400">(Em campo livre seriam 9.5 dB!)</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-medium block mb-1">Efeito dos Baffles no Teto:</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">
                Estado: {hallState.bafflesEnabled ? (
                  <strong className="text-teal-400">Ativados ({hallState.bafflesCount} un.)</strong>
                ) : (
                  <strong className="text-rose-400">Desativados (Sala Nua)</strong>
                )}
              </span>
              <span className="text-teal-400 font-mono font-bold text-sm">
                {result.baffleNoiseReductionDb > 0 ? `-${result.baffleNoiseReductionDb} dB` : '0.0 dB'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 m-0">
              {hallState.bafflesEnabled
                ? `A constante de sala subiu para R = ${result.roomConstantR} m², atenuando o som reverberado.`
                : 'Superfícies rígidas (α = 0.05) refletem todo o som de volta ao operador.'}
            </p>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 font-medium block mb-1">Distância Crítica (rc):</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">rc calculado:</span>
              <strong className="text-amber-400 font-mono text-sm">{result.criticalDistanceRc} m</strong>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 m-0">
              Operador a <strong>{operatorDistanceM} m</strong> está no{' '}
              <strong className={result.isOperatorInReverberantField ? 'text-sky-400' : 'text-amber-400'}>
                {result.isOperatorInReverberantField ? 'Campo Reverberado' : 'Campo Direto'}
              </strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
