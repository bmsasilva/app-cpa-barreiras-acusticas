import React, { useEffect, useRef } from 'react';
import { calculatePointSoundLevel } from '../acoustics/physicsEngine';
import type { SimulationBarrier, SimulationReceiver, SimulationSource } from '../acoustics/types';

interface AcousticHeatmapProps {
  source: SimulationSource;
  barrier: SimulationBarrier;
  receiver: SimulationReceiver;
  mode: 'with_barrier' | 'without_barrier' | 'difference';
  width: number;
  height: number;
  worldWidthM: number;
  worldHeightM: number;
  visible: boolean;
  opacity?: number;
}

// Mapeia decibéis para cores RGBA suaves
function getHeatmapColor(db: number, isDiffMode: boolean): [number, number, number, number] {
  if (isDiffMode) {
    if (db <= 0.5) return [0, 0, 0, 0];
    const t = Math.min(1, Math.max(0, (db - 0.5) / 18));
    const r = Math.round(16 + t * 90);
    const g = Math.round(185 - t * 80);
    const b = Math.round(129 + t * 110);
    const a = Math.min(0.65, 0.15 + t * 0.5);
    return [r, g, b, a];
  }

  const clampedDb = Math.max(30, Math.min(105, db));
  const norm = (clampedDb - 30) / (105 - 30); // 0.0 a 1.0

  let r = 0, g = 0, b = 0;
  if (norm < 0.2) {
    const f = norm / 0.2;
    r = Math.round(30 + f * 20);
    g = Math.round(58 + f * 100);
    b = Math.round(138 + f * 117);
  } else if (norm < 0.4) {
    const f = (norm - 0.2) / 0.2;
    r = Math.round(50 + f * 20);
    g = Math.round(158 + f * 80);
    b = Math.round(255 - f * 130);
  } else if (norm < 0.6) {
    const f = (norm - 0.4) / 0.2;
    r = Math.round(70 + f * 175);
    g = Math.round(238 + f * 17);
    b = Math.round(125 - f * 125);
  } else if (norm < 0.8) {
    const f = (norm - 0.6) / 0.2;
    r = Math.round(245 + f * 10);
    g = Math.round(255 - f * 130);
    b = 0;
  } else {
    const f = (norm - 0.8) / 0.2;
    r = Math.round(255 - f * 30);
    g = Math.round(125 - f * 100);
    b = Math.round(f * 50);
  }

  const alpha = 0.55;
  return [r, g, b, alpha];
}

export const AcousticHeatmap: React.FC<AcousticHeatmapProps> = ({
  source,
  barrier,
  receiver: _receiver,
  mode,
  width,
  height,
  worldWidthM,
  worldHeightM,
  visible,
  opacity = 0.65,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!visible || !canvasRef.current || width <= 0 || height <= 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stepPx = 8;
    const gridCols = Math.ceil(width / stepPx);
    const gridRows = Math.ceil(height / stepPx);

    const offscreen = document.createElement('canvas');
    offscreen.width = gridCols;
    offscreen.height = gridRows;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    const imgData = offCtx.createImageData(gridCols, gridRows);
    const data = imgData.data;

    const isDiff = mode === 'difference';

    for (let gy = 0; gy < gridRows; gy++) {
      const py = ((gridRows - 1 - gy) / gridRows) * worldHeightM;

      for (let gx = 0; gx < gridCols; gx++) {
        const px = (gx / gridCols) * worldWidthM;

        const soundVal = calculatePointSoundLevel(px, py, source, barrier, mode);
        const [r, g, b, a] = getHeatmapColor(soundVal, isDiff);

        const idx = (gy * gridCols + gx) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = Math.round(a * 255);
      }
    }

    offCtx.putImageData(imgData, 0, 0);

    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offscreen, 0, 0, width, height);
  }, [source, barrier, mode, width, height, worldWidthM, worldHeightM, visible]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none transition-opacity duration-300"
      style={{ opacity }}
    />
  );
};
