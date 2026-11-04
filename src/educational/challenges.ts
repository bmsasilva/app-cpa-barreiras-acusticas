import type {
  AcousticCalculationResult,
  SimulationBarrier,
  SimulationReceiver,
  SimulationSource,
} from '../acoustics/types';

export interface Challenge {
  id: number;
  title: string;
  tagline: string;
  description: string;
  objectiveText: string;
  targetCriteria: string;
  initialSetup: {
    source: SimulationSource;
    barrier: SimulationBarrier;
    receiver: SimulationReceiver;
  };
  checkSuccess: (
    source: SimulationSource,
    barrier: SimulationBarrier,
    receiver: SimulationReceiver,
    result: AcousticCalculationResult
  ) => { isSuccess: boolean; progressMessage: string };
  hint: string;
  didacticExplanation: string;
}

export const CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: 'Desafio 1: Altura Mínima e Redução Sonora',
    tagline: 'Superar o Limiar de 8 dB a 30 Metros',
    description:
      'Uma habitação situa-se a 30 metros de uma unidade fabril que emite 90 dB a 1000 Hz. Os residentes exigem uma redução de pelo menos 8 dB nos níveis sonoros recebidos. Experimenta arrastar a pega superior da barreira para descobrir a altura mínima necessária.',
    objectiveText: 'Ajusta a altura e posição da barreira para alcançar uma redução sonora líquida (ΔL) ≥ 8.0 dB no recetor.',
    targetCriteria: 'Redução líquida ≥ 8.0 dB (com a habitação a 30m).',
    initialSetup: {
      source: { x: 0, height: 1.5, soundPowerLevel: 90, frequency: 1000 },
      barrier: { enabled: true, x: 8, height: 1.2, thickness: 0.15, materialId: 'betao', lengthM: 20 },
      receiver: { x: 30, height: 1.5 },
    },
    checkSuccess: (_source, barrier, receiver, result) => {
      const is30m = Math.abs(receiver.x - 30) < 1.0;
      if (!barrier.enabled) {
        return { isSuccess: false, progressMessage: 'A barreira está desativada. Ativa a barreira primeiro.' };
      }
      if (!is30m) {
        return { isSuccess: false, progressMessage: `A distância está em ${receiver.x.toFixed(1)} m. Mantém a habitação perto dos 30 m.` };
      }
      if (result.netReduction >= 8.0) {
        return {
          isSuccess: true,
          progressMessage: `Excelente! Atingiste uma redução de ${result.netReduction.toFixed(1)} dB com uma barreira de ${barrier.height.toFixed(2)} m de altura.`,
        };
      }
      return {
        isSuccess: false,
        progressMessage: `Redução atual: ${result.netReduction.toFixed(1)} dB (Objetivo: ≥ 8.0 dB). Tenta elevar mais a altura da barreira!`,
      };
    },
    hint: 'A quebra da linha de visão direta (LOS) é o primeiro passo para criar a zona de sombra acústica. Para 1000 Hz (comprimento de onda curto de 34 cm), uma altura entre 2.2 m e 2.8 m é suficiente.',
    didacticExplanation:
      'A difração sobre o topo depende diretamente do número de Fresnel N = 2δ/λ. Quanto mais alta for a barreira, maior é a diferença de percurso δ = (d1 + d2) - d0 e maior é a atenuação por difração calculada pelo modelo de Maekawa / Kurze-Anderson.',
  },
  {
    id: 2,
    title: 'Desafio 2: Transmissão vs. Difração de Materiais',
    tagline: 'Quando é que o Material da Barreira Faz Realmente a Diferença?',
    description:
      'Compara uma barreira alta (ex: 4.5 m) em Betão vs. Chapa Metálica. Analisa a que frequências a chapa metálica deixa passar som por transmissão direta, comprometendo a eficácia da barreira.',
    objectiveText:
      'Muda o material para Chapa Metálica e seleciona uma frequência baixa (125 Hz ou 250 Hz). Observa como a baixa massa superficial permite que o som transmitido supere o difratado!',
    targetCriteria: 'Selecionar material Chapa Metálica com frequência de 125 Hz ou 250 Hz e barreira ≥ 3.5 m.',
    initialSetup: {
      source: { x: 0, height: 1.5, soundPowerLevel: 95, frequency: 125 },
      barrier: { enabled: true, x: 10, height: 4.0, thickness: 0.002, materialId: 'chapa', lengthM: 20 },
      receiver: { x: 30, height: 1.5 },
    },
    checkSuccess: (source, barrier, _receiver, result) => {
      const isMetal = barrier.materialId === 'chapa';
      const isLowFreq = source.frequency <= 250;
      const isTall = barrier.height >= 3.5;

      if (isMetal && isLowFreq && isTall) {
        return {
          isSuccess: true,
          progressMessage: `Muito bem observado! A 125 Hz, o isolamento acústico da chapa é de apenas ${result.materialTransmissionLoss} dB. A energia transmitida através da chapa limita a redução a ${result.netReduction.toFixed(1)} dB. Experimenta mudar para Betão para ver o salto de isolamento!`,
        };
      }
      return {
        isSuccess: false,
        progressMessage: `Configura a barreira com Chapa Metálica, altura ≥ 3.5 m e frequência de 125 Hz ou 250 Hz para testar a fraqueza por transmissão.`,
      };
    },
    hint: 'De acordo com a Lei da Massa, o isolamento acústico decai cerca de 6 dB por cada oitava que se desce em frequência. Materiais muito leves como chapas finas tornam-se quase "transparentes" ao som grave.',
    didacticExplanation:
      'Uma barreira acústica só é tão boa quanto o seu elo mais fraco. A energia acústica total no recetor é a soma energética (L_com = 10 log10(10^(L_dif/10) + 10^(L_trans/10))). Se o isolamento do material R for inferior à atenuação por difração, o som atravessa a barreira em vez de contorná-la.',
  },
  {
    id: 3,
    title: 'Desafio 3: A Posição Ótima da Barreira',
    tagline: 'O Efeito da Curva em "U" na Localização da Barreira',
    description:
      'Mantém a altura da barreira constante em 2.5 metros e desloca-a horizontalmente: primeiro encostada à fonte (x ≈ 3 m), depois ao centro (x ≈ 15 m) e finalmente junto ao recetor (x ≈ 27 m). Onde é a eficácia mais elevada?',
    objectiveText:
      'Encontra uma posição perto da fonte (x ≤ 5 m) ou perto da habitação (x ≥ 25 m) que maximize a atenuação relativamente à posição central.',
    targetCriteria: 'Altura fixa em 2.5 m (±0.3m) e posição x ≤ 5 m ou x ≥ 25 m, com redução sonora verificada.',
    initialSetup: {
      source: { x: 0, height: 1.5, soundPowerLevel: 90, frequency: 1000 },
      barrier: { enabled: true, x: 15, height: 2.5, thickness: 0.15, materialId: 'betao', lengthM: 20 },
      receiver: { x: 30, height: 1.5 },
    },
    checkSuccess: (_source, barrier, receiver, result) => {
      const nearSource = barrier.x <= 5.5 && barrier.x >= 1.5;
      const nearReceiver = barrier.x >= receiver.x - 5.5 && barrier.x <= receiver.x - 1.5;
      const isHeightOk = Math.abs(barrier.height - 2.5) <= 0.4;

      if (!isHeightOk) {
        return {
          isSuccess: false,
          progressMessage: `Mantém a altura próxima de 2.5 m (atual: ${barrier.height.toFixed(2)} m) para isolar a variável posição.`,
        };
      }

      if (nearSource || nearReceiver) {
        return {
          isSuccess: true,
          progressMessage: `Parabéns! Posição x = ${barrier.x.toFixed(1)} m proporciona uma redução de ${result.netReduction.toFixed(1)} dB (superior aos ~8 dB do centro). Comprovada a curva em "U"!`,
        };
      }

      return {
        isSuccess: false,
        progressMessage: `Atualmente a barreira está a x = ${barrier.x.toFixed(1)} m (no centro). Redução: ${result.netReduction.toFixed(1)} dB. Arrasta-a para x ≤ 5 m ou x ≥ 25 m.`,
      };
    },
    hint: 'A geometria de difração produz maior diferença de percurso δ quando a barreira está próxima de uma das extremidades (fonte ou recetor), aproximando os raios de ângulos mais pronunciados.',
    didacticExplanation:
      'Na acústica ambiental prática, uma barreira é geometricamente mais eficaz quanto mais próxima estiver da fonte emissora (bloqueando as frentes de onda no início) ou do recetor protegido (criando uma sombra imediata). A colocação a meio caminho é a posição geometricamente menos eficiente.',
  },
  {
    id: 4,
    title: 'Desafio 4: O Efeito da Frequência Sonora',
    tagline: 'Comprimento de Onda vs. Difração Acústica',
    description:
      'O som grave (baixa frequência, ex: 125 Hz) tem um comprimento de onda muito longo (λ ≈ 2.74 m) e contorna facilmente obstáculos físicos. O som agudo (4000 Hz, λ ≈ 8.5 cm) comporta-se quase como raios de luz retilíneos. Testa a barreira nas duas frequências.',
    objectiveText:
      'Seleciona 4000 Hz e compara o número de Fresnel N e a atenuação obtida com o valor a 125 Hz.',
    targetCriteria: 'Selecionar 4000 Hz na fonte e observar o aumento do número de Fresnel (N > 10).',
    initialSetup: {
      source: { x: 0, height: 1.5, soundPowerLevel: 90, frequency: 125 },
      barrier: { enabled: true, x: 8, height: 3.0, thickness: 0.15, materialId: 'betao', lengthM: 20 },
      receiver: { x: 30, height: 1.5 },
    },
    checkSuccess: (source, _barrier, _receiver, result) => {
      if (source.frequency === 4000) {
        return {
          isSuccess: true,
          progressMessage: `Perfeito! A 4000 Hz, o comprimento de onda é minúsculo (λ = ${result.wavelength} m), o número de Fresnel disparou para N = ${result.fresnelNumber} e a atenuação atingiu ${result.diffractionAttenuation.toFixed(1)} dB!`,
        };
      }
      return {
        isSuccess: false,
        progressMessage: `Frequência atual: ${source.frequency} Hz (λ = ${result.wavelength} m, N = ${result.fresnelNumber}). Altera a frequência da fonte para 4000 Hz para observar o efeito das ondas curtas.`,
      };
    },
    hint: 'No painel da Fonte Sonora ou no topo da aplicação, clica no botão "4000 Hz". Repara como a sombra acústica no gráfico fica muito mais escura e protegida.',
    didacticExplanation:
      'A difração é inversamente proporcional ao comprimento de onda: N = 2δ / λ = 2 f δ / c. Sons de alta frequência têm comprimentos de onda de centímetros, resultando em números de Fresnel elevados e sombras acústicas muito nítidas. Para sons graves de baixa frequência, as barreiras são muito menos eficazes.',
  },
  {
    id: 5,
    title: 'Desafio 5: Otimização de Custo-Benefício',
    tagline: 'Engenharia Acústica com Orçamento Limitado',
    description:
      'Como consultor de ambiente, tens um orçamento fictício estrito de 3.500 € para proteger a habitação com uma largura de barreira de 20 metros. Precisas de obter pelo menos 9.0 dB de redução sonora.',
    objectiveText:
      'Concebe uma barreira que garanta uma redução sonora líquida ≥ 9.0 dB com um custo total estimado ≤ 3.500 €.',
    targetCriteria: 'Redução sonora ≥ 9.0 dB e Custo total ≤ 3.500 €.',
    initialSetup: {
      source: { x: 0, height: 1.5, soundPowerLevel: 90, frequency: 1000 },
      barrier: { enabled: true, x: 8, height: 3.5, thickness: 0.15, materialId: 'betao', lengthM: 20 },
      receiver: { x: 30, height: 1.5 },
    },
    checkSuccess: (_source, barrier, _receiver, result) => {
      if (!barrier.enabled) {
        return { isSuccess: false, progressMessage: 'Ativa a barreira para avaliar a solução técnica.' };
      }
      const isReducOk = result.netReduction >= 9.0;
      const isCostOk = result.totalCostEuro <= 3500;

      if (isReducOk && isCostOk) {
        return {
          isSuccess: true,
          progressMessage: `Excelente projeto de engenharia! Redução de ${result.netReduction.toFixed(1)} dB com custo de ${result.totalCostEuro} € (Abaixo do limite de 3.500 €). Conseguiste otimizar geometria e material!`,
        };
      }

      if (!isCostOk && isReducOk) {
        return {
          isSuccess: false,
          progressMessage: `Redução atingida (${result.netReduction.toFixed(1)} dB), mas o custo (${result.totalCostEuro} €) excede o orçamento de 3.500 €. Experimenta mudar de material ou aproximar a barreira da fonte para reduzir a altura necessária!`,
        };
      }

      return {
        isSuccess: false,
        progressMessage: `Redução atual: ${result.netReduction.toFixed(1)} dB | Custo: ${result.totalCostEuro} €. Requisitos: Redução ≥ 9.0 dB e Custo ≤ 3.500 €.`,
      };
    },
    hint: 'Lembra-te do Desafio 3: se colocares a barreira a cerca de 3 a 5 metros da fonte, consegues obter mais de 9 dB com uma altura menor (por exemplo 1.8 a 2.2 m). Além disso, a Madeira ou Chapa têm custo/m² inferior ao Betão ou Acrílico!',
    didacticExplanation:
      'Na engenharia ambiental real, a escolha de barreiras acústicas envolve sempre um compromisso entre desempenho acústico, durabilidade, integração estética e viabilidade económica. Otimizar a posição geométrica permite poupar centenas ou milhares de euros em altura e materiais.',
  },
];
