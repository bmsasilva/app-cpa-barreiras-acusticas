import type {
  AcousticCalculationResult,
  FrequencyHz,
  SimulationBarrier,
  SimulationReceiver,
  SimulationSource,
} from './types';
import {
  A_WEIGHTING,
  FREQUENCIES,
} from './types';
import { MATERIALS } from './materials';

export const SPEED_OF_SOUND = 343; // m/s a 20°C no ar

// Perfil espectral relativo em dB em relação ao nível de referência a 1000 Hz
export const SPECTRUM_OFFSETS: Record<
  SimulationSource['spectrumType'],
  Record<FrequencyHz, number>
> = {
  pure_tone: { 125: 0, 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0 },
  pink_noise: { 125: 0, 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0 },
  industrial: { 125: 6, 250: 4, 500: 2, 1000: 0, 2000: -3, 4000: -8 },
  traffic: { 125: -2, 250: 2, 500: 5, 1000: 0, 2000: -4, 4000: -10 },
};

/**
 * Calcula a atenuação por divergência geométrica em campo livre:
 * L2 = L1 - 20 * log10(r2 / r1)
 */
export function calculateFreeFieldLevel(sourceLevelL1: number, distanceR2: number): number {
  const r2Safe = Math.max(distanceR2, 1.0);
  return sourceLevelL1 - 20 * Math.log10(r2Safe);
}

/**
 * Avalia se o ponto de topo da barreira intercepta a linha reta de visão direta (LOS).
 */
export function checkLineOfSight(
  source: { x: number; height: number },
  receiver: { x: number; height: number },
  barrierX: number,
  barrierHeight: number
): { isBroken: boolean; lineOfSightY: number } {
  if (barrierX <= source.x || barrierX >= receiver.x) {
    return { isBroken: false, lineOfSightY: 0 };
  }

  const slope = (receiver.height - source.height) / (receiver.x - source.x);
  const lineOfSightY = source.height + slope * (barrierX - source.x);

  return {
    isBroken: barrierHeight > lineOfSightY,
    lineOfSightY,
  };
}

/**
 * Calcula a perda de transmissão efetiva R(f) ajustada pela espessura real através da Lei da Massa:
 * ΔR = 20 * log10(m'' / m0'') = 20 * log10(t / t0)
 */
export function calculateEffectiveTransmissionLoss(
  nominalLoss: number,
  actualThicknessM: number,
  defaultThicknessM: number
): number {
  if (defaultThicknessM <= 0 || actualThicknessM <= 0) return nominalLoss;
  const ratio = actualThicknessM / defaultThicknessM;
  const deltaR = 20 * Math.log10(ratio);
  return Math.min(85, Math.max(5, nominalLoss + deltaR));
}

/**
 * Calcula o número de Fresnel N e a atenuação por difração (Kurze-Anderson / Maekawa com modelo de barreira espessa de Pierce/Kurze).
 */
export function calculateDiffraction(
  pathDifference: number,
  frequency: number,
  isLineOfSightBroken: boolean,
  thicknessM: number = 0
): { fresnelNumber: number; diffractionLossDb: number; wavelength: number; thicknessBonusDb: number } {
  const wavelength = SPEED_OF_SOUND / frequency;
  const N = (2 * pathDifference) / wavelength;

  let diffractionLoss = 0;
  let thicknessBonus = 0;

  // Efeito adicional de barreira espessa / topo largo (Pierce / Kurze)
  if (thicknessM > 0.005 && isLineOfSightBroken) {
    const k = (2 * Math.PI) / wavelength;
    // Atenuação adicional suave de topo largo: ΔL_thick = 10 * log10(1 + k * w / 2) * 0.5
    thicknessBonus = Math.min(6.0, Math.max(0, 10 * Math.log10(1 + (k * thicknessM) / 2) * 0.5));
  }

  const maxDiffractionLimit = thicknessM > 0.005 ? 25 : 22;

  if (isLineOfSightBroken && N >= 0) {
    const rawLoss = 10 * Math.log10(3 + 20 * N);
    diffractionLoss = Math.min(maxDiffractionLimit, Math.max(0, rawLoss + thicknessBonus));
  } else if (!isLineOfSightBroken) {
    if (N >= -0.15) {
      const val = 3 + 20 * N;
      if (val > 1) {
        diffractionLoss = Math.max(0, 10 * Math.log10(val));
      } else {
        diffractionLoss = 0;
      }
    } else {
      diffractionLoss = 0;
    }
  }

  return {
    fresnelNumber: N,
    diffractionLossDb: diffractionLoss,
    wavelength,
    thicknessBonusDb: thicknessBonus,
  };
}

/**
 * Soma energética de dois níveis sonoros em decibéis.
 */
export function energeticSum(l1: number, l2: number): number {
  if (isNaN(l1) || l1 <= -999) return l2;
  if (isNaN(l2) || l2 <= -999) return l1;
  return 10 * Math.log10(Math.pow(10, l1 / 10) + Math.pow(10, l2 / 10));
}

/**
 * Cálculo acústico rigoroso para a configuração do cenário.
 */
export function calculateAcoustics(
  source: SimulationSource,
  barrier: SimulationBarrier,
  receiver: SimulationReceiver
): AcousticCalculationResult {
  const material = MATERIALS[barrier.materialId] || MATERIALS.betao;
  const thicknessM = Math.max(0.001, barrier.thickness ?? material.defaultThicknessM);

  const dx = receiver.x - source.x;
  const dy = receiver.height - source.height;
  const d0 = Math.sqrt(dx * dx + dy * dy);

  let d1 = 0;
  let d2 = 0;
  let pathDifference = 0;
  let isBroken = false;
  let lineOfSightY = 0;

  const barrierIsActive = barrier.enabled && barrier.height > 0.05 && barrier.x > source.x && barrier.x < receiver.x;

  if (barrierIsActive) {
    // Modelagem de barreira espessa: contorno do bordo superior frontal ao bordo superior traseiro
    const halfW = thicknessM / 2;
    const xEdge1 = Math.max(source.x + 0.02, barrier.x - halfW);
    const xEdge2 = Math.min(receiver.x - 0.02, barrier.x + halfW);
    const topW = Math.max(0, xEdge2 - xEdge1);

    d1 = Math.hypot(xEdge1 - source.x, barrier.height - source.height);
    d2 = Math.hypot(receiver.x - xEdge2, receiver.height - barrier.height);

    const losInfo = checkLineOfSight(source, receiver, barrier.x, barrier.height);
    isBroken = losInfo.isBroken;
    lineOfSightY = losInfo.lineOfSightY;

    // Percurso acústico total sobre o contorno superior: d1 + topW + d2
    if (isBroken) {
      pathDifference = Math.max(0, (d1 + topW + d2) - d0);
    } else {
      pathDifference = -Math.abs((d1 + topW + d2) - d0);
    }
  } else {
    d1 = d0 / 2;
    d2 = d0 / 2;
    pathDifference = 0;
    isBroken = false;
    lineOfSightY = source.height + ((receiver.height - source.height) * 0.5);
  }

  const selectedFreq = source.frequency;
  const diffractionData = calculateDiffraction(
    pathDifference,
    selectedFreq,
    isBroken && barrierIsActive,
    barrierIsActive ? thicknessM : 0
  );

  const spectralOffset = SPECTRUM_OFFSETS[source.spectrumType][selectedFreq] || 0;
  const effectiveSourceLevel = source.soundPowerLevel + spectralOffset;

  const levelFreeField = calculateFreeFieldLevel(effectiveSourceLevel, d0);
  const nominalTransmissionLoss = material.transmissionLoss[selectedFreq] || 25;
  const materialTransmissionLoss = calculateEffectiveTransmissionLoss(
    nominalTransmissionLoss,
    thicknessM,
    material.defaultThicknessM
  );

  let levelDiffracted = levelFreeField;
  let levelTransmitted = -999;
  let levelWithBarrier = levelFreeField;
  let netReduction = 0;

  if (barrierIsActive) {
    levelDiffracted = levelFreeField - diffractionData.diffractionLossDb;
    levelTransmitted = levelFreeField - materialTransmissionLoss;
    levelWithBarrier = energeticSum(levelDiffracted, levelTransmitted);
    netReduction = Math.max(0, levelFreeField - levelWithBarrier);
  } else {
    levelWithBarrier = levelFreeField;
    netReduction = 0;
  }

  const spectrum = FREQUENCIES.map((f) => {
    const sOffset = SPECTRUM_OFFSETS[source.spectrumType][f] || 0;
    const sLevel = source.soundPowerLevel + sOffset;
    const freeFieldAtF = calculateFreeFieldLevel(sLevel, d0);

    const diffAtF = calculateDiffraction(
      pathDifference,
      f,
      isBroken && barrierIsActive,
      barrierIsActive ? thicknessM : 0
    );
    const nominalTransAtF = material.transmissionLoss[f] || 25;
    const transLossAtF = calculateEffectiveTransmissionLoss(
      nominalTransAtF,
      thicknessM,
      material.defaultThicknessM
    );

    let withBarrierAtF = freeFieldAtF;
    if (barrierIsActive) {
      const lDif = freeFieldAtF - diffAtF.diffractionLossDb;
      const lTrans = freeFieldAtF - transLossAtF;
      withBarrierAtF = energeticSum(lDif, lTrans);
    }

    return {
      frequency: f,
      freeField: Number(freeFieldAtF.toFixed(1)),
      withBarrier: Number(withBarrierAtF.toFixed(1)),
      reduction: Number((freeFieldAtF - withBarrierAtF).toFixed(1)),
      diffractionLoss: Number(diffAtF.diffractionLossDb.toFixed(1)),
      transmissionLoss: Number(transLossAtF.toFixed(1)),
    };
  });

  let sumEnergyFreeFieldA = 0;
  let sumEnergyWithBarrierA = 0;

  spectrum.forEach((band) => {
    const weight = A_WEIGHTING[band.frequency];
    sumEnergyFreeFieldA += Math.pow(10, (band.freeField + weight) / 10);
    sumEnergyWithBarrierA += Math.pow(10, (band.withBarrier + weight) / 10);
  });

  const levelFreeFieldA = 10 * Math.log10(Math.max(1e-12, sumEnergyFreeFieldA));
  const levelWithBarrierA = 10 * Math.log10(Math.max(1e-12, sumEnergyWithBarrierA));
  const netReductionA = Math.max(0, levelFreeFieldA - levelWithBarrierA);

  const barrierLength = barrier.lengthM || 20;
  const totalAreaM2 = barrierIsActive ? barrier.height * barrierLength : 0;
  const thicknessRatio = thicknessM / Math.max(0.001, material.defaultThicknessM);
  const totalCostEuro = totalAreaM2 * material.costPerM2 * Math.max(0.2, thicknessRatio);
  const surfaceMassKgM2 = material.densityKgM3 * thicknessM;

  const reflectionCoeff = Math.max(0, 1 - (material.alphaW || 0.05));
  const distSourceToBarrier = Math.hypot(barrier.x - source.x, barrier.height / 2 - source.height);
  const incAtBarrier = calculateFreeFieldLevel(effectiveSourceLevel, distSourceToBarrier);
  const reflectedLevelEstimate = incAtBarrier + 10 * Math.log10(Math.max(0.01, reflectionCoeff));

  return {
    d0: Number(d0.toFixed(2)),
    d1: Number(d1.toFixed(2)),
    d2: Number(d2.toFixed(2)),
    pathDifference: Number(pathDifference.toFixed(3)),
    wavelength: Number(diffractionData.wavelength.toFixed(3)),
    fresnelNumber: Number(diffractionData.fresnelNumber.toFixed(2)),
    isLineOfSightBroken: isBroken,
    lineOfSightYAtBarrier: Number(lineOfSightY.toFixed(2)),

    levelFreeField: Number(levelFreeField.toFixed(1)),
    diffractionAttenuation: Number(diffractionData.diffractionLossDb.toFixed(1)),
    materialTransmissionLoss: Number(materialTransmissionLoss.toFixed(1)),
    levelDiffracted: Number(levelDiffracted.toFixed(1)),
    levelTransmitted: Number(levelTransmitted.toFixed(1)),
    levelWithBarrier: Number(levelWithBarrier.toFixed(1)),
    netReduction: Number(netReduction.toFixed(1)),

    levelFreeFieldA: Number(levelFreeFieldA.toFixed(1)),
    levelWithBarrierA: Number(levelWithBarrierA.toFixed(1)),
    netReductionA: Number(netReductionA.toFixed(1)),

    spectrum,
    totalAreaM2: Number(totalAreaM2.toFixed(1)),
    totalCostEuro: Math.round(totalCostEuro),

    effectiveThicknessM: Number(thicknessM.toFixed(3)),
    surfaceMassKgM2: Number(surfaceMassKgM2.toFixed(1)),
    thicknessDiffractionBonusDb: Number(diffractionData.thicknessBonusDb.toFixed(1)),

    reflectionCoefficient: Number(reflectionCoeff.toFixed(2)),
    reflectedLevelEstimate: Number(reflectedLevelEstimate.toFixed(1)),
  };
}

/**
 * Nível sonoro para cálculo de heatmap.
 */
export function calculatePointSoundLevel(
  px: number,
  py: number,
  source: SimulationSource,
  barrier: SimulationBarrier,
  mode: 'with_barrier' | 'without_barrier' | 'difference'
): number {
  const distDirect = Math.hypot(px - source.x, py - source.height);
  const lFree = calculateFreeFieldLevel(source.soundPowerLevel, distDirect);

  if (mode === 'without_barrier' || !barrier.enabled || barrier.height <= 0.05) {
    return lFree;
  }

  const mat = MATERIALS[barrier.materialId] || MATERIALS.betao;
  const thicknessM = Math.max(0.001, barrier.thickness ?? mat.defaultThicknessM);

  if (px <= barrier.x - thicknessM / 2) {
    if (mode === 'difference') return 0;
    return lFree;
  }

  const los = checkLineOfSight(source, { x: px, height: py }, barrier.x, barrier.height);

  const halfW = thicknessM / 2;
  const xEdge1 = Math.max(source.x + 0.02, barrier.x - halfW);
  const xEdge2 = Math.min(px - 0.02, barrier.x + halfW);
  const topW = Math.max(0, xEdge2 - xEdge1);

  const d1 = Math.hypot(xEdge1 - source.x, barrier.height - source.height);
  const d2 = Math.hypot(px - xEdge2, py - barrier.height);

  let pathDiff = 0;
  if (los.isBroken) {
    pathDiff = Math.max(0, (d1 + topW + d2) - distDirect);
  } else {
    pathDiff = -Math.abs((d1 + topW + d2) - distDirect);
  }

  const diffData = calculateDiffraction(pathDiff, source.frequency, los.isBroken, thicknessM);
  const nominalR = mat.transmissionLoss[source.frequency] || 25;
  const rMat = calculateEffectiveTransmissionLoss(nominalR, thicknessM, mat.defaultThicknessM);

  const lDif = lFree - diffData.diffractionLossDb;
  const lTrans = lFree - rMat;
  const lWith = energeticSum(lDif, lTrans);

  if (mode === 'difference') {
    return Math.max(0, lFree - lWith);
  }

  return lWith;
}
