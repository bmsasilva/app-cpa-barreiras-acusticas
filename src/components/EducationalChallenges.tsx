import React, { useState } from 'react';
import type {
  AcousticCalculationResult,
  SimulationBarrier,
  SimulationReceiver,
  SimulationSource,
} from '../acoustics/types';
import type { Challenge } from '../educational/challenges';
import { CHALLENGES } from '../educational/challenges';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface EducationalChallengesProps {
  source: SimulationSource;
  barrier: SimulationBarrier;
  receiver: SimulationReceiver;
  result: AcousticCalculationResult;
  onApplyChallengeSetup: (challenge: Challenge) => void;
}

export const EducationalChallenges: React.FC<EducationalChallengesProps> = ({
  source,
  barrier,
  receiver,
  result,
  onApplyChallengeSetup,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([]);

  const challenge = CHALLENGES[currentIdx];
  const check = challenge.checkSuccess(source, barrier, receiver, result);

  const handleTestHypothesis = () => {
    if (check.isSuccess) {
      if (!completedChallenges.includes(challenge.id)) {
        setCompletedChallenges((prev) => [...prev, challenge.id]);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore if canvas not available
        }
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Cabeçalho do Laboratório Didático */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Modo Didático & Desafios de Engenharia Acústica
            </h3>
            <p className="text-xs text-slate-400">
              Experimenta hipóteses no laboratório virtual para consolidar os princípios de Controlo e Prevenção Ambiental.
            </p>
          </div>
        </div>

        {/* Progresso de Conclusão */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300 font-medium">Desafios Superados:</span>
          <span className="font-mono font-bold text-amber-400">
            {completedChallenges.length} / {CHALLENGES.length}
          </span>
        </div>
      </div>

      {/* Navegação entre Desafios */}
      <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
        <button
          onClick={() => {
            setCurrentIdx((prev) => (prev > 0 ? prev - 1 : CHALLENGES.length - 1));
            setShowHint(false);
            setShowExplanation(false);
          }}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center gap-1 text-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <div className="flex items-center gap-1.5">
          {CHALLENGES.map((ch, idx) => {
            const isDone = completedChallenges.includes(ch.id);
            const isSelected = idx === currentIdx;
            return (
              <button
                key={ch.id}
                onClick={() => {
                  setCurrentIdx(idx);
                  setShowHint(false);
                  setShowExplanation(false);
                }}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-950'
                    : isDone
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {ch.id}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            setCurrentIdx((prev) => (prev < CHALLENGES.length - 1 ? prev + 1 : 0));
            setShowHint(false);
            setShowExplanation(false);
          }}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center gap-1 text-xs"
        >
          <span>Seguinte</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Detalhes do Desafio Selecionado */}
      <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider block">
              {challenge.tagline}
            </span>
            <h4 className="text-base font-bold text-white">{challenge.title}</h4>
          </div>

          <button
            onClick={() => onApplyChallengeSetup(challenge)}
            className="px-3 py-1.5 rounded-xl bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-700 text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Carregar Cenário Inicial do Desafio</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{challenge.description}</p>

        {/* Critério do Objetivo */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs">
          <Award className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200 block">Objetivo a Cumprir:</span>
            <span className="text-slate-300">{challenge.objectiveText}</span>
          </div>
        </div>

        {/* Caixa de Feedback Dinâmico */}
        <div
          className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
            check.isSuccess
              ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-300'
              : 'bg-slate-900/90 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {check.isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-xs">
                {check.isSuccess ? 'Desafio Superado com Sucesso!' : 'Estado da Hipótese Atual'}
              </div>
              <div className="text-xs mt-0.5 opacity-90 leading-relaxed">{check.progressMessage}</div>
            </div>
          </div>

          <button
            onClick={handleTestHypothesis}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1 ${
              check.isSuccess
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950'
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Validar Hipótese</span>
          </button>
        </div>

        {/* Dicas e Fundamentação */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <button
            onClick={() => setShowHint(!showHint)}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 flex items-center gap-1.5 transition-all"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>{showHint ? 'Ocultar Dica' : 'Ver Dica Técnica'}</span>
          </button>

          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 flex items-center gap-1.5 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showExplanation ? 'Ocultar Explicação' : 'Fundamentação Acústica Teórica'}</span>
          </button>
        </div>

        {showHint && (
          <div className="bg-amber-950/30 border border-amber-900/50 p-3 rounded-xl text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{challenge.hint}</span>
          </div>
        )}

        {showExplanation && (
          <div className="bg-indigo-950/30 border border-indigo-900/50 p-3 rounded-xl text-xs text-indigo-200/90 leading-relaxed flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>{challenge.didacticExplanation}</span>
          </div>
        )}
      </div>
    </div>
  );
};
