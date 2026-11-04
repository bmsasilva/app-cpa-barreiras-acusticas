import { describe, expect, it } from 'vitest';
import {
  calculateAcoustics,
  calculateDiffraction,
  calculateFreeFieldLevel,
  checkLineOfSight,
  energeticSum,
  SPEED_OF_SOUND,
} from './physicsEngine';
import type { SimulationBarrier, SimulationReceiver, SimulationSource } from './types';

describe('Motor Acústico - Testes Unitários de Física', () => {
  it('deve calcular a propagação em campo livre conforme a lei do inverso do quadrado (20 log10(r))', () => {
    const l1 = 90; // dB a 1 m
    expect(calculateFreeFieldLevel(l1, 1)).toBeCloseTo(90, 1);
    expect(calculateFreeFieldLevel(l1, 2)).toBeCloseTo(90 - 6.02, 1);
    expect(calculateFreeFieldLevel(l1, 10)).toBeCloseTo(90 - 20, 1);
    expect(calculateFreeFieldLevel(l1, 30)).toBeCloseTo(90 - 20 * Math.log10(30), 1);
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
      spectrumType: 'pure_tone',
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
      spectrumType: 'pure_tone',
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
      spectrumType: 'pure_tone',
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
});
