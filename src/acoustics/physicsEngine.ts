import type {
  AcousticCalculationResult,
  AnnoyanceLevel,
  IndoorAcousticResult,
  IndoorHallState,
  MaterialId,
  ResidentAnnoyance,
  SimulationBarrier,
  SimulationReceiver,
  SimulationSource,
  SourceType,
} from './types';
import {
  A_WEIGHTING,
  FREQUENCIES,
} from './types';
import { MATERIALS } from './materials';

export const SPEED_OF_SOUND = 343; // m/s a 20°C no ar

/**
 * Calcula a atenuação por divergência geométrica em campo livre:
 * - Fonte Pontual (Fábrica / Indústria): L2 = L1 - 20 * log10(r2 / r1) -> 6 dB / duplicação (esférica)
 * - Fonte Linear (Estrada / Tráfego contínuo): L2 = L1 - 10 * log10(r2 / r1) -> 3 dB / duplicação (cilíndrica)
 */
export function calculateFreeFieldLevel(
  sourceLevelL1: number,
  distanceR2: number,
  sourceType: SourceType = 'point'
): number {
  const r2Safe = Math.max(distanceR2, 1.0);
  const factor = sourceType === 'line' ? 10 : 20;
  return sourceLevelL1 - factor * Math.log10(r2Safe);
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
/**
 * Calcula o Coeficiente de Desagradabilidade dos Moradores (0 a 100%)
 * decorrente do impacto visual, proximidade e perda de luz natural provocada pela barreira.
 */
export function calculateResidentAnnoyance(
  barrier: SimulationBarrier,
  receiver: SimulationReceiver,
  materialId: MaterialId
): ResidentAnnoyance {
  if (!barrier.enabled || barrier.height <= 0.05) {
    return {
      score: 0,
      level: 'low',
      label: 'Nulo (Sem Barreira)',
      color: '#10b981',
      distanceToFacadeM: Number(Math.max(0, receiver.x - barrier.x).toFixed(1)),
      occlusionAngleDeg: 0,
    };
  }

  // Distância horizontal da barreira à fachada da habitação
  const distToFacade = Math.max(0.1, receiver.x - barrier.x);

  // Se a barreira estiver atrás da casa, o impacto na fachada frontal é nulo
  if (receiver.x <= barrier.x + 0.1) {
    return {
      score: 0,
      level: 'low',
      label: 'Nulo (Atrás)',
      color: '#10b981',
      distanceToFacadeM: Number(distToFacade.toFixed(1)),
      occlusionAngleDeg: 0,
    };
  }

  // Altura relativa em relação ao peitoril da janela (olhar do morador a ~1.0m)
  const windowSillH = Math.max(0.8, receiver.height * 0.7);
  const deltaH = Math.max(0, barrier.height - windowSillH);
  const angleRad = Math.atan2(deltaH, distToFacade);
  const angleDeg = (angleRad * 180) / Math.PI;

  // Fator visual e psicológico do material (transparência e biofilia)
  const MATERIAL_VISUAL_FACTORS: Record<MaterialId, number> = {
    acrilico: 0.25,   // Transparente (passagem de luz solar e horizonte livre)
    madeira: 0.65,    // Madeira tratada (integração biofílica acolhedora)
    absorvente: 0.85, // Painel técnico neutro
    betao: 1.00,      // Betão maciço pesado (sensação de muralha)
    chapa: 1.15,      // Chapa metálica (estética industrial agressiva)
  };
  const matFactor = MATERIAL_VISUAL_FACTORS[materialId] ?? 1.0;

  // Impacto da proximidade (efeito claustrofóbico se colado à casa)
  const proximityTerm = Math.pow(15 / Math.max(2.5, distToFacade), 0.85);
  // Impacto da oclusão angular da abóbada celeste
  const angleTerm = Math.pow(Math.min(90, angleDeg) / 45, 1.2) * 50;
  
  // Pontuação geométrica ponderada
  const rawGeometricScore = Math.min(100, Math.max(0, angleTerm * (0.4 + 0.6 * Math.min(2.0, proximityTerm))));

  // Pontuação final com o fator do material
  const finalScore = Math.round(Math.min(100, Math.max(0, rawGeometricScore * matFactor)));

  let level: AnnoyanceLevel = 'low';
  let label = 'Baixo Impacto';
  let color = '#10b981'; // emerald-500

  if (finalScore > 75) {
    level = 'critical';
    label = 'Crítico (Muralha)';
    color = '#ef4444'; // red-500
  } else if (finalScore > 50) {
    level = 'high';
    label = 'Desagradável';
    color = '#f97316'; // orange-500
  } else if (finalScore > 25) {
    level = 'moderate';
    label = 'Impacto Moderado';
    color = '#eab308'; // yellow-500
  }

  return {
    score: finalScore,
    level,
    label,
    color,
    distanceToFacadeM: Number(distToFacade.toFixed(1)),
    occlusionAngleDeg: Number(angleDeg.toFixed(1)),
  };
}

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
  const sType = source.sourceType ?? 'point';
  const diffractionData = calculateDiffraction(
    pathDifference,
    selectedFreq,
    isBroken && barrierIsActive,
    barrierIsActive ? thicknessM : 0
  );

  // Efeito de Absorção Sonora na face e amortecimento do bordo superior (EN 1793-1 / EN 1793-4)
  const alphaSelected = material.absorptionCoeff[selectedFreq] ?? material.alphaW ?? 0.05;
  const absorptionBonusDb = barrierIsActive && isBroken ? Math.min(3.5, 3.0 * Math.pow(alphaSelected, 0.8)) : 0;
  const effectiveDiffractionLoss = Math.min(28, diffractionData.diffractionLossDb + absorptionBonusDb);

  const effectiveSourceLevel = source.soundPowerLevel;
  const levelFreeField = calculateFreeFieldLevel(effectiveSourceLevel, d0, sType);
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
    levelDiffracted = levelFreeField - effectiveDiffractionLoss;
    levelTransmitted = levelFreeField - materialTransmissionLoss;
    levelWithBarrier = energeticSum(levelDiffracted, levelTransmitted);
    netReduction = Math.max(0, levelFreeField - levelWithBarrier);
  } else {
    levelWithBarrier = levelFreeField;
    netReduction = 0;
  }

  const spectrum = FREQUENCIES.map((f) => {
    const sLevel = source.soundPowerLevel;
    const freeFieldAtF = calculateFreeFieldLevel(sLevel, d0, sType);

    const diffAtF = calculateDiffraction(
      pathDifference,
      f,
      isBroken && barrierIsActive,
      barrierIsActive ? thicknessM : 0
    );
    const alphaAtF = material.absorptionCoeff[f] ?? material.alphaW ?? 0.05;
    const absBonusAtF = barrierIsActive && isBroken ? Math.min(3.5, 3.0 * Math.pow(alphaAtF, 0.8)) : 0;
    const effectiveDiffAtF = Math.min(28, diffAtF.diffractionLossDb + absBonusAtF);

    const nominalTransAtF = material.transmissionLoss[f] || 25;
    const transLossAtF = calculateEffectiveTransmissionLoss(
      nominalTransAtF,
      thicknessM,
      material.defaultThicknessM
    );

    let withBarrierAtF = freeFieldAtF;
    if (barrierIsActive) {
      const lDif = freeFieldAtF - effectiveDiffAtF;
      const lTrans = freeFieldAtF - transLossAtF;
      withBarrierAtF = energeticSum(lDif, lTrans);
    }

    return {
      frequency: f,
      freeField: Number(freeFieldAtF.toFixed(1)),
      withBarrier: Number(withBarrierAtF.toFixed(1)),
      reduction: Number((freeFieldAtF - withBarrierAtF).toFixed(1)),
      diffractionLoss: Number(effectiveDiffAtF.toFixed(1)),
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
  const incAtBarrier = calculateFreeFieldLevel(effectiveSourceLevel, distSourceToBarrier, sType);
  const reflectedLevelEstimate = incAtBarrier + 10 * Math.log10(Math.max(0.01, reflectionCoeff));

  // Cálculo da desagradabilidade visual / aceitação social dos moradores
  const residentAnnoyance = calculateResidentAnnoyance(barrier, receiver, barrier.materialId);

  return {
    sourceType: sType,
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
    residentAnnoyance,

    effectiveThicknessM: Number(thicknessM.toFixed(3)),
    surfaceMassKgM2: Number(surfaceMassKgM2.toFixed(1)),
    thicknessDiffractionBonusDb: Number(diffractionData.thicknessBonusDb.toFixed(1)),
    absorptionDiffractionBonusDb: Number(absorptionBonusDb.toFixed(1)),

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
  const sType = source.sourceType ?? 'point';
  const distDirect = Math.hypot(px - source.x, py - source.height);
  const lFree = calculateFreeFieldLevel(source.soundPowerLevel, distDirect, sType);

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

  const alphaPt = mat.absorptionCoeff[source.frequency] ?? mat.alphaW ?? 0.05;
  const absBonusPt = los.isBroken ? Math.min(3.5, 3.0 * Math.pow(alphaPt, 0.8)) : 0;
  const effectiveDiffLoss = Math.min(28, diffData.diffractionLossDb + absBonusPt);

  const lDif = lFree - effectiveDiffLoss;
  const lTrans = lFree - rMat;
  const lWith = energeticSum(lDif, lTrans);

  if (mode === 'difference') {
    return Math.max(0, lFree - lWith);
  }

  return lWith;
}

/**
 * Calcula a acústica no interior de uma nave industrial fechada através da equação
 * de Hopkins-Stryker / Sabine:
 * Lp(r) = Lw + 10 * log10( Q / (4 * π * r²) + 4 / R )
 *
 * Demonstra a distância crítica (rc) além da qual o som direto se torna irrelevante
 * e o som reverberado das superfícies rígidas passa a dominar, tornando a deslocação
 * do operador (ex: de 2m para 6m) praticamente ineficaz sem tratamento absorvente no teto (baffles).
 */
export function calculateIndoorAcoustics(state: IndoorHallState): IndoorAcousticResult {
  const L = Math.max(5, state.roomLengthM);
  const W = Math.max(5, state.roomWidthM);
  const H = Math.max(3, state.roomHeightM);

  const roomAreaS = 2 * (L * W + L * H + W * H);
  const roomVolumeV = L * W * H;

  // Absorção base das paredes/teto/piso rígidos (betão, chapa)
  const baseWallAlpha = Math.max(0.01, Math.min(0.95, state.wallAlpha));
  const baseAbsorptionA = roomAreaS * baseWallAlpha;

  // Absorção adicional introduzida por baffles acústicos suspensos no teto
  const bafflesArea = state.bafflesEnabled
    ? Math.max(0, state.bafflesCount) * Math.max(0.1, state.baffleUnitAbsorptionM2)
    : 0;

  const totalAbsorptionA = baseAbsorptionA + bafflesArea;
  const meanAlpha = Math.min(0.98, totalAbsorptionA / roomAreaS);

  // Constante de sala R = S * αm / (1 - αm)
  const roomConstantR = (roomAreaS * meanAlpha) / (1 - meanAlpha);

  // Fator de diretividade da máquina (Q = 2 para máquina pousada sobre o solo da nave)
  const Q = Math.max(1, state.machineDirectivityQ || 2);

  // Distância Crítica rc: distância onde a densidade de energia direta iguala a reverberada:
  // Q / (4 * π * rc²) = 4 / R  =>  rc = √( (Q * R) / (16 * π) )
  const criticalDistanceRc = Math.sqrt((Q * roomConstantR) / (16 * Math.PI));

  // Função auxiliar para calcular Lp a uma dada distância r da máquina
  const computeLevelAtDistance = (rM: number, R_val: number): {
    dir: number;
    rev: number;
    total: number;
  } => {
    const rSafe = Math.max(0.3, rM);
    const directEnergy = Q / (4 * Math.PI * rSafe * rSafe);
    const revEnergy = 4 / Math.max(0.1, R_val);

    const levelDirect = state.machineSoundPowerLw + 10 * Math.log10(directEnergy);
    const levelReverberant = state.machineSoundPowerLw + 10 * Math.log10(revEnergy);
    const levelTotal = state.machineSoundPowerLw + 10 * Math.log10(directEnergy + revEnergy);

    return {
      dir: Number(levelDirect.toFixed(1)),
      rev: Number(levelReverberant.toFixed(1)),
      total: Number(levelTotal.toFixed(1)),
    };
  };

  // Cálculo para o estado atual
  const rOp = Math.max(0.3, state.operatorDistanceM);
  const currentLevels = computeLevelAtDistance(rOp, roomConstantR);

  // Cálculo correspondente sem baffles (para quantificar a redução)
  const meanAlphaNoBaffles = Math.min(0.98, baseAbsorptionA / roomAreaS);
  const roomConstantRNoBaffles = (roomAreaS * meanAlphaNoBaffles) / (1 - meanAlphaNoBaffles);
  const noBafflesLevels = computeLevelAtDistance(rOp, roomConstantRNoBaffles);

  // Níveis específicos nos pontos didáticos do slide: Posto A (2 m) e Posto B (6 m)
  const levelAt2m = computeLevelAtDistance(2.0, roomConstantR).total;
  const levelAt6m = computeLevelAtDistance(6.0, roomConstantR).total;
  const diffPostoABDb = Number(Math.abs(levelAt2m - levelAt6m).toFixed(1));

  const baffleNoiseReductionDb = Number(Math.max(0, noBafflesLevels.total - currentLevels.total).toFixed(1));

  return {
    roomAreaS: Number(roomAreaS.toFixed(1)),
    roomVolumeV: Number(roomVolumeV.toFixed(1)),
    totalAbsorptionA: Number(totalAbsorptionA.toFixed(1)),
    roomConstantR: Number(roomConstantR.toFixed(1)),
    meanAlpha: Number(meanAlpha.toFixed(3)),
    criticalDistanceRc: Number(criticalDistanceRc.toFixed(2)),
    levelDirect: currentLevels.dir,
    levelReverberant: currentLevels.rev,
    levelTotal: currentLevels.total,
    levelTotalWithoutBaffles: noBafflesLevels.total,
    baffleNoiseReductionDb,
    isOperatorInReverberantField: rOp > criticalDistanceRc,
    levelAt2m,
    levelAt6m,
    diffPostoABDb,
  };
}
