import React from 'react';
import { AlertTriangle, BookOpen, X } from 'lucide-react';

interface AcousticMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcousticMethodologyModal: React.FC<AcousticMethodologyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 text-slate-300 space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-950 border border-sky-800 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Modelo Acústico & Fundamentação Teórica</h3>
              <p className="text-xs text-slate-400">Formulação Matemática, Referências e Limitações Didáticas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Propagação em Campo Livre */}
        <div className="space-y-1.5 text-xs">
          <h4 className="font-bold text-sky-400 text-sm">1. Propagação em Campo Livre (Divergência Geométrica)</h4>
          <p className="leading-relaxed">
            Para uma fonte pontual idealizada em espaço hemisférico sobre solo refletor, a perda por divergência
            geométrica segue a expressão:
          </p>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-center text-sky-300">
            L₂ = L₁ − 20 · log₁₀(r₂ / r₁)
          </div>
          <p className="text-slate-400">
            Onde L₁ é o nível sonoro a r₁ = 1,0 m e r₂ é a distância direta fonte-recetor (d₀). Cada duplicação da distância
            resulta numa redução de 6 dB.
          </p>
        </div>

        {/* 2. Difração sobre o Topo da Barreira */}
        <div className="space-y-1.5 text-xs">
          <h4 className="font-bold text-purple-400 text-sm">2. Difração sobre o Topo da Barreira</h4>
          <p className="leading-relaxed">
            O desvio das frentes de onda no topo da barreira é calculado através da diferença de percurso e do número de
            Fresnel:
          </p>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-center text-purple-300 space-y-1">
            <div>δ = (d₁ + d₂) − d₀</div>
            <div>N = 2δ / λ = (2 · f · δ) / c</div>
          </div>
          <p className="leading-relaxed">
            A atenuação por difração (ΔL_dif) é determinada segundo a formulação semi-empírica reconhecida de{' '}
            <strong>Kurze & Anderson (1971) / Maekawa (1968)</strong>, com limite físico exterior de 22 dB devido à
            turbulência atmosférica:
          </p>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-center text-indigo-300">
            ΔL_dif = 10 · log₁₀(3 + 20 · N) &nbsp; [para N ≥ 0]
          </div>
        </div>

        {/* 3. Combinação Energética */}
        <div className="space-y-1.5 text-xs">
          <h4 className="font-bold text-emerald-400 text-sm">3. Combinação Energética (Soma Acústica)</h4>
          <p className="leading-relaxed">
            O som que atinge o recetor resulta da sobreposição incoerente da energia difratada pelo topo e da energia
            transmitida diretamente através da massa da barreira:
          </p>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-center text-emerald-300">
            L_com = 10 · log₁₀( 10^(L_dif / 10) + 10^(L_trans / 10) )
          </div>
          <p className="text-slate-400">
            Onde L_dif = L_sem − ΔL_dif e L_trans = L_sem − R(f). Isto garante que barreiras acusticamente leves
            (como chapa fina) não atenuem mais do que o seu próprio isolamento (R) permite.
          </p>
        </div>

        {/* 4. Limitações Metodológicas do Modelo */}
        <div className="bg-amber-950/20 border border-amber-900/50 p-3.5 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Limitações do Modelo Didático (Aviso Importante)</span>
          </div>
          <ul className="space-y-1 text-slate-300 list-disc list-inside">
            <li>O simulador é bidimensional (secção transversal 2D) e assume uma barreira de comprimento suficiente.</li>
            <li>Não considera difração pelos topos laterais (extremidades da barreira).</li>
            <li>Não substitui medições acústicas in situ regulamentadas (RGR / Decreto-Lei n.º 9/2007).</li>
            <li>Não modela refração por gradientes térmicos de vento nem absorção atmosférica fina.</li>
            <li>
              Destina-se exclusivamente a fins pedagógicos para compreensão física dos fenómenos em unidades curriculares de
              Controlo e Prevenção Ambiental.
            </li>
          </ul>
        </div>

        {/* Rodapé com botão fechar */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-all shadow-md"
          >
            Compreendido / Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
