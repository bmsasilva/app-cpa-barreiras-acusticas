import { describe, expect, it } from 'vitest';
import {
  calculateAcoustics,
  calculateDiffraction,
  calculateFreeFieldLevel,
  calculateIndoorAcoustics,
  checkLineOfSight,
  energeticSum,
  SPEED_OF_SOUND,
} from './physicsEngine';
import type { IndoorHallState, SimulationBarrier, SimulationReceiver, SimulationSource } from './types';

describe('Motor Acústico - Testes Unitários de Física', () => {
  it('deve calcular a propagação em campo livre conforme a lei do inverso do quadrado (20 log10(r))', () => {
    const l1 = 90; // dB a 1 m
    expect(calculateFreeFieldLevel(l1, 1, 'point')).toBeCloseTo(90, 1);
    expect(calculateFreeFieldLevel(l1, 2, 'point')).toBeCloseTo(90 - 6.02, 1);
    expect(calculateFreeFieldLevel(l1, 10, 'point')).toBeCloseTo(90 - 20, 1);
    expect(calculateFreeFieldLevel(l1, 30, 'point')).toBeCloseTo(90 - 20 * Math.log10(30), 1);
  });

  it('deve calcular a propagação em campo livre para fonte linear (estrada) com atenuação de 3 dB por duplicação (10 log10(r))', () => {
    const l1 = 90; // dB a 1 m
    expect(calculateFreeFieldLevel(l1, 1, 'line')).toBeCloseTo(90, 1);
    expect(calculateFreeFieldLevel(l1, 2, 'line')).toBeCloseTo(90 - 3.01, 1);
    expect(calculateFreeFieldLevel(l1, 4, 'line')).toBeCloseTo(90 - 6.02, 1);
    expect(calculateFreeFieldLevel(l1, 10, 'line')).toBeCloseTo(90 - 10, 1);
    expect(calculateFreeFieldLevel(l1, 30, 'line')).toBeCloseTo(90 - 10 * Math.log10(30), 1);
  });

  it('deve verificar corretamente a quebra da linha de visão (Line-of-Sight)', () => {
    const source = { x: 0, height: 2 };
    const receiver = { x: 30, height: 2 };

    const barrierLow = checkLineOfSight(source, receiver, 15, 1.5);
    expect(barrierLow.isBroken).toBe(false);
    expect(barrierLow.lineOfSightY).toBeCloseTo(2, 2);

    const barrierHigh = checkLineOfSight(source, receiver, 15, 3.5);
    expect(barrierHigh.isBroken).toBe(true);
    expect(barrierHigh.lineOfSightY).toBeCloseTo(2, 2);
  });

  it('deve calcular a coerência geométrica da diferença de percurso e do número de Fresnel', () => {
    const f = 1000; // Hz
    const wavelength = SPEED_OF_SOUND / f; // 343 / 1000 = 0.343 m
    const expectedN = (2 * 1.5407) / wavelength;

    const diff = calculateDiffraction(1.5407, f, true);
    expect(diff.wavelength).toBeCloseTo(0.343, 3);
    expect(diff.fresnelNumber).toBeCloseTo(expectedN, 1);
    const expectedLoss = 10 * Math.log10(3 + 20 * expectedN);
    expect(diff.diffractionLossDb).toBeCloseTo(Math.min(22, expectedLoss), 1);
  });

  it('deve apresentar maior atenuação por difração para frequências mais altas', () => {
    const delta = 0.5; // m
    const diff125 = calculateDiffraction(delta, 125, true);
    const diff1000 = calculateDiffraction(delta, 1000, true);
    const diff4000 = calculateDiffraction(delta, 4000, true);

    expect(diff125.diffractionLossDb).toBeLessThan(diff1000.diffractionLossDb);
    expect(diff1000.diffractionLossDb).toBeLessThanOrEqual(diff4000.diffractionLossDb);
  });

  it('deve combinar percursos energeticamente em vez de somar decibéis linearmente', () => {
    expect(energeticSum(50, 50)).toBeCloseTo(53.01, 1);
    expect(energeticSum(60, 30)).toBeCloseTo(60.04, 1);
  });

  it('deve calcular o cenário completo e demonstrar atenuação quando a barreira bloqueia o som', () => {
    const source: SimulationSource = {
      x: 0,
      height: 1.5,
      soundPowerLevel: 90,
      frequency: 1000,
    };

    const barrier: SimulationBarrier = {
      enabled: true,
      x: 10,
      height: 3.5,
      thickness: 0.15,
      materialId: 'betao',
      lengthM: 20,
    };

    const receiver: SimulationReceiver = {
      x: 30,
      height: 1.5,
    };

    const result = calculateAcoustics(source, barrier, receiver);

    expect(result.isLineOfSightBroken).toBe(true);
    expect(result.pathDifference).toBeGreaterThan(0);
    expect(result.fresnelNumber).toBeGreaterThan(0);
    expect(result.diffractionAttenuation).toBeGreaterThan(5);
    expect(result.levelWithBarrier).toBeLessThan(result.levelFreeField);
    expect(result.netReduction).toBeGreaterThan(0);
    expect(result.totalCostEuro).toBeGreaterThan(0);
  });

  it('deve garantir que se o material for acusticamente fraco, a transmissão limita a redução sonora', () => {
    const source: SimulationSource = {
      x: 0,
      height: 1.5,
      soundPowerLevel: 90,
      frequency: 1000,
    };

    const receiver: SimulationReceiver = {
      x: 30,
      height: 1.5,
    };

    const barrierConcrete: SimulationBarrier = {
      enabled: true,
      x: 10,
      height: 6.0,
      thickness: 0.15,
      materialId: 'betao',
      lengthM: 20,
    };

    const barrierMetal: SimulationBarrier = {
      enabled: true,
      x: 10,
      height: 6.0,
      thickness: 0.002,
      materialId: 'chapa',
      lengthM: 20,
    };

    const resConcrete = calculateAcoustics(source, barrierConcrete, receiver);
    const resMetal = calculateAcoustics(source, barrierMetal, receiver);

    expect(resConcrete.materialTransmissionLoss).toBeGreaterThan(resMetal.materialTransmissionLoss);
  });

  it('deve aumentar a atenuação sonora e reduzir o volume no recetor quando a espessura da barreira aumenta', () => {
    const source: SimulationSource = {
      x: 0,
      height: 1.5,
      soundPowerLevel: 90,
      frequency: 500,
    };

    const receiver: SimulationReceiver = {
      x: 30,
      height: 1.5,
    };

    const barrierThin: SimulationBarrier = {
      enabled: true,
      x: 10,
      height: 3.0,
      thickness: 0.02, // 2 cm
      materialId: 'madeira',
      lengthM: 20,
    };

    const barrierThick: SimulationBarrier = {
      enabled: true,
      x: 10,
      height: 3.0,
      thickness: 0.30, // 30 cm (15x mais espessa)
      materialId: 'madeira',
      lengthM: 20,
    };

    const resThin = calculateAcoustics(source, barrierThin, receiver);
    const resThick = calculateAcoustics(source, barrierThick, receiver);

    // 1. O isolamento ao som transmitido R deve ser consideravelmente maior com maior espessura (Lei da Massa)
    expect(resThick.materialTransmissionLoss).toBeGreaterThan(resThin.materialTransmissionLoss);

    // 2. A massa superficial calculada deve ser proporcional à espessura
    expect(resThick.surfaceMassKgM2).toBeGreaterThan(resThin.surfaceMassKgM2);

    // 3. A perda por difração deve aumentar devido ao topo largo / contorno do topo
    expect(resThick.diffractionAttenuation).toBeGreaterThanOrEqual(resThin.diffractionAttenuation);

    // 4. O nível sonoro recebido (volume) deve ser estritamente menor com a barreira mais espessa
    expect(resThick.levelWithBarrier).toBeLessThan(resThin.levelWithBarrier);
    expect(resThick.netReduction).toBeGreaterThan(resThin.netReduction);
  });

  it('deve calcular corretamente o coeficiente de desagradabilidade dos moradores (impacto visual e proximidade)', () => {
    const receiver: SimulationReceiver = { x: 30, height: 1.5 };

    // 1. Barreira distante da casa (x=5m, a 25m da casa)
    const barrierFar: SimulationBarrier = {
      enabled: true,
      x: 5,
      height: 3.0,
      thickness: 0.15,
      materialId: 'betao',
      lengthM: 20,
    };
    const resFar = calculateAcoustics({ x: 0, height: 1.5, soundPowerLevel: 90, frequency: 1000 }, barrierFar, receiver);
    expect(resFar.residentAnnoyance.score).toBeLessThanOrEqual(25);
    expect(resFar.residentAnnoyance.level).toBe('low');

    // 2. Barreira colada à casa (x=27.5m, a 2.5m da casa) com Betão opaco
    const barrierCloseConcrete: SimulationBarrier = {
      enabled: true,
      x: 27.5,
      height: 4.0,
      thickness: 0.15,
      materialId: 'betao',
      lengthM: 20,
    };
    const resCloseConcrete = calculateAcoustics({ x: 0, height: 1.5, soundPowerLevel: 90, frequency: 1000 }, barrierCloseConcrete, receiver);
    expect(resCloseConcrete.residentAnnoyance.score).toBeGreaterThan(60);

    // 3. Mesma barreira colada à casa, mas com Acrílico Transparente (deixa passar luz)
    const barrierCloseAcrylic: SimulationBarrier = {
      ...barrierCloseConcrete,
      materialId: 'acrilico',
    };
    const resCloseAcrylic = calculateAcoustics({ x: 0, height: 1.5, soundPowerLevel: 90, frequency: 1000 }, barrierCloseAcrylic, receiver);
    expect(resCloseAcrylic.residentAnnoyance.score).toBeLessThan(resCloseConcrete.residentAnnoyance.score);
  });

  it('deve garantir que o Painel Absorvente (EN 1793-1) supera materiais refletores na atenuação global', () => {
    const source: SimulationSource = { x: 0, height: 1.5, soundPowerLevel: 90, frequency: 1000 };
    const receiver: SimulationReceiver = { x: 30, height: 1.5 };
    const barrierBase = { enabled: true, x: 10, height: 3.5, lengthM: 20 };

    const resAbsorvente = calculateAcoustics(source, { ...barrierBase, materialId: 'absorvente', thickness: 0.10 }, receiver);
    const resBetao = calculateAcoustics(source, { ...barrierBase, materialId: 'betao', thickness: 0.15 }, receiver);
    const resChapa = calculateAcoustics(source, { ...barrierBase, materialId: 'chapa', thickness: 0.002 }, receiver);

    // O painel absorvente deve conferir bónus de atenuação face ao betão refletor
    expect(resAbsorvente.netReduction).toBeGreaterThan(resBetao.netReduction);
    expect(resAbsorvente.netReductionA).toBeGreaterThan(resBetao.netReductionA);

    // O betão e absorvente devem ambos superar amplamente a chapa fina
    expect(resBetao.netReduction).toBeGreaterThan(resChapa.netReduction);
  });

  describe('Nave Industrial (Acústica de Salas - Modelo Hopkins-Stryker / Sabine)', () => {
    const baseHallState: IndoorHallState = {
      roomLengthM: 24,
      roomWidthM: 15,
      roomHeightM: 6.5,
      wallAlpha: 0.05, // Superfícies rígidas (betão/chapa)
      bafflesEnabled: false,
      bafflesCount: 40,
      baffleUnitAbsorptionM2: 1.2,
      machineSoundPowerLw: 98,
      machineX: 2.0,
      machineDirectivityQ: 2, // Hemisférica sobre o solo
      operatorDistanceM: 2.0, // Posto A
    };

    it('deve reproduzir o comportamento do slide: após a distância crítica, mudar de Posto A (2m) para Posto B (6m) quase não altera o nível sonoro', () => {
      const resWithoutBaffles = calculateIndoorAcoustics(baseHallState);

      // Distância crítica deve ser pequena numa sala reverberante com α=0.05 (~1.6 m)
      expect(resWithoutBaffles.criticalDistanceRc).toBeGreaterThan(1.0);
      expect(resWithoutBaffles.criticalDistanceRc).toBeLessThan(3.0);

      // No Posto B (6 m), o operador está amplamente no campo reverberado
      const resPostoB = calculateIndoorAcoustics({ ...baseHallState, operatorDistanceM: 6.0 });
      expect(resPostoB.isOperatorInReverberantField).toBe(true);

      // Em campo livre, passar de 2m para 6m (fator 3x) atenuaria 20*log10(3) ≈ 9.5 dB.
      // Na nave industrial reverberante, o som reverberado domina e a diferença cai para menos de 2 dB!
      expect(resWithoutBaffles.diffPostoABDb).toBeLessThan(2.0);
      expect(resWithoutBaffles.levelAt2m - resWithoutBaffles.levelAt6m).toBeLessThan(2.0);
    });

    it('deve demonstrar que a instalação de baffles absorventes reduz significativamente o ruído no campo reverberado', () => {
      const resWithoutBaffles = calculateIndoorAcoustics({ ...baseHallState, operatorDistanceM: 6.0 });
      // Instalar 60 baffles de 1.5 m² (área de absorção equivalente adicionada = 90 m²)
      const resWithBaffles = calculateIndoorAcoustics({
        ...baseHallState,
        operatorDistanceM: 6.0,
        bafflesEnabled: true,
        bafflesCount: 60,
        baffleUnitAbsorptionM2: 1.5,
      });

      // Baffles aumentam a constante de sala R e a distância crítica rc
      expect(resWithBaffles.roomConstantR).toBeGreaterThan(resWithoutBaffles.roomConstantR);
      expect(resWithBaffles.criticalDistanceRc).toBeGreaterThan(resWithoutBaffles.criticalDistanceRc);

      // A atenuação proporcionada pelos baffles no Posto B (campo reverberado) deve ser relevante (≥ 3 dB)
      expect(resWithBaffles.baffleNoiseReductionDb).toBeGreaterThanOrEqual(3.0);
      expect(resWithBaffles.levelTotal).toBeLessThan(resWithoutBaffles.levelTotal);
    });
  });
});
