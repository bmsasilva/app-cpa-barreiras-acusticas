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

export type ViewMode = 'outdoor_barrier' | 'indoor_hall';
export type MaterialId = 'betao' | 'madeira' | 'chapa' | 'acrilico' | 'absorvente';
export type SourceType = 'point' | 'line';
export type AnnoyanceLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface ResidentAnnoyance {
  score: number; // 0 a 100 (%)
  level: AnnoyanceLevel;
  label: string; // 'Baixo Impacto' | 'Impacto Moderado' | 'Desagradável' | 'Crítico (Muralha)'
  color: string; // Hexadecimal da cor para UI
  distanceToFacadeM: number; // Distância horizontal da barreira à fachada (m)
  occlusionAngleDeg: number; // Ângulo de oclusão visual da janela (graus)
}

export interface IndoorHallState {
  roomLengthM: number; // Comprimento da nave (m), ex: 24 m
  roomWidthM: number; // Largura da nave (m), ex: 15 m
  roomHeightM: number; // Altura da nave (m), ex: 6.5 m
  wallAlpha: number; // Coeficiente médio das superfícies rígidas (betão/aço), ex: 0.05
  bafflesEnabled: boolean; // Ativação de baffles acústicos no teto
  bafflesCount: number; // Número de unidades de baffles suspensos (ex: 40)
  baffleUnitAbsorptionM2: number; // Área equivalente de absorção por baffle (m²), ex: 1.2 m²
  machineSoundPowerLw: number; // Nível de potência sonora Lw da máquina (dB), ex: 98 dB
  machineX: number; // Posição horizontal da máquina (m), ex: 2.0 m
  machineDirectivityQ: number; // Fator de diretividade Q (2 = hemisférica sobre o solo)
  operatorDistanceM: number; // Distância do operador à máquina (m), ex: 2.0 m ou 6.0 m
}

export interface IndoorAcousticResult {
  roomAreaS: number; // Área total das superfícies da sala (m²)
  roomVolumeV: number; // Volume total da nave (m³)
  totalAbsorptionA: number; // Absorção total equivalente A (m²)
  roomConstantR: number; // Constante da sala R = S * α / (1 - α) (m²)
  meanAlpha: number; // Coeficiente médio de absorção αm
  criticalDistanceRc: number; // Distância crítica rc = √(Q * R / (16 * π)) (m)
  levelDirect: number; // Componente de som direto Lp,dir (dB)
  levelReverberant: number; // Componente de som reverberado Lp,rev (dB)
  levelTotal: number; // Nível sonoro total Lp,total (dB)
  levelTotalWithoutBaffles: number; // Nível sonoro total sem baffles (dB)
  baffleNoiseReductionDb: number; // Atenuação obtida com baffles ΔL (dB)
  isOperatorInReverberantField: boolean; // Se operador está além da distância crítica (r > rc)
  levelAt2m: number; // Nível no Posto A (2 m)
  levelAt6m: number; // Nível no Posto B (6 m)
  diffPostoABDb: number; // Diferença entre Posto A e Posto B (|Lp,2m - Lp,6m|)
} // 'point': Indústria (-6 dB/dupl.) | 'line': Estrada (-3 dB/dupl.)

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
  sourceType?: SourceType; // 'point' (fábrica: 6 dB/dupl.) ou 'line' (estrada: 3 dB/dupl.)
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
  sourceType: SourceType; // 'point' ou 'line'
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
  costEffectivenessEuroPerDb: number | null; // Custo-eficácia (€/dB de atenuação acústica)

  // Impacto visual e aceitação social dos moradores
  residentAnnoyance: ResidentAnnoyance;

  // Propriedades estruturais e de espessura
  effectiveThicknessM: number; // Espessura real da barreira (m)
  surfaceMassKgM2: number; // Massa superficial efetiva m'' = ρ * t (kg/m²)
  thicknessDiffractionBonusDb: number; // Atenuação adicional de barreira espessa no topo (dB)
  absorptionDiffractionBonusDb: number; // Atenuação adicional por absorção acústica (EN 1793-1 / EN 1793-4) (dB)

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
