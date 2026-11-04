export type FrequencyHz = 125 | 250 | 500 | 1000 | 2000 | 4000;

export const FREQUENCIES: FrequencyHz[] = [125, 250, 500, 1000, 2000, 4000];

// Ponderação A tabelada conforme IEC 61672
export const A_WEIGHTING: Record<FrequencyHz, number> = {
  125: -16.1,
  250: -8.6,
  500: -3.2,
  1000: 0.0,
  2000: 1.2,
  4000: 1.0,
};

export type MaterialId = 'betao' | 'madeira' | 'chapa' | 'acrilico' | 'absorvente';

export interface AcousticMaterial {
  id: MaterialId;
  name: string;
  description: string;
  densityKgM3: number; // kg/m³
  defaultThicknessM: number; // m
  surfaceMassKgM2: number; // kg/m²
  rw: number; // Índice de isolamento ponderado global Rw em dB
  transmissionLoss: Record<FrequencyHz, number>; // R(f) em dB
  absorptionCoeff: Record<FrequencyHz, number>; // α(f)
  alphaW: number; // Coeficiente de absorção ponderado αw
  costPerM2: number; // €/m²
  isIllustrative: boolean; // Nota se os dados são valores indicativos/ilustrativos
  color: string;
  patternType: 'concrete' | 'wood' | 'metal' | 'glass' | 'perforated';
}

export interface SimulationSource {
  x: number; // m do referencial (0m)
  height: number; // m do solo
  soundPowerLevel: number; // dB de referência a 1m (Lp1m)
  frequency: FrequencyHz; // Frequência pura de análise (125 a 4000 Hz)
}

export interface SimulationBarrier {
  enabled: boolean;
  x: number; // m do referencial
  height: number; // m
  thickness: number; // m
  materialId: MaterialId;
  lengthM: number; // largura para cálculo de custo (ex: 20m)
}

export interface SimulationReceiver {
  x: number; // m do referencial
  height: number; // m do solo
}

export interface AcousticCalculationResult {
  // Distâncias
  d0: number; // Distância direta fonte-recetor (m)
  d1: number; // Distância fonte-topo da barreira (m)
  d2: number; // Distância topo da barreira-recetor (m)
  pathDifference: number; // Diferença de percurso δ (m)
  wavelength: number; // λ (m)
  fresnelNumber: number; // N
  isLineOfSightBroken: boolean; // Se a barreira intercepta o raio direto
  lineOfSightYAtBarrier: number; // Altura do raio direto no ponto x da barreira (m)

  // Níveis acústicos na frequência selecionada
  levelFreeField: number; // L_sem (dB)
  diffractionAttenuation: number; // ΔL_dif (dB)
  materialTransmissionLoss: number; // R(f) (dB)
  levelDiffracted: number; // Nível que chega por difração (dB)
  levelTransmitted: number; // Nível que atravessa o material (dB)
  levelWithBarrier: number; // Nível combinado final no recetor (dB)
  netReduction: number; // Redução sonora efetiva ΔL = L_sem - L_com (dB)

  // Níveis com Ponderação A (dBA)
  levelFreeFieldA: number; // dBA
  levelWithBarrierA: number; // dBA
  netReductionA: number; // dBA

  // Espectro completo por oitavas (125 a 4000 Hz)
  spectrum: {
    frequency: FrequencyHz;
    freeField: number;
    withBarrier: number;
    reduction: number;
    diffractionLoss: number;
    transmissionLoss: number;
  }[];

  // Métricas económicas
  totalAreaM2: number;
  totalCostEuro: number;

  // Propriedades estruturais e de espessura
  effectiveThicknessM: number; // Espessura real da barreira (m)
  surfaceMassKgM2: number; // Massa superficial efetiva m'' = ρ * t (kg/m²)
  thicknessDiffractionBonusDb: number; // Atenuação adicional de barreira espessa no topo (dB)

  // Reflexão na face anterior
  reflectionCoefficient: number; // 1 - α
  reflectedLevelEstimate: number; // Estimativa qualitativa de nível refletido a 1m da barreira
}

export interface SavedSolution {
  id: 'A' | 'B' | 'C';
  label: string;
  barrier: SimulationBarrier;
  result: AcousticCalculationResult;
  timestamp: string;
}
