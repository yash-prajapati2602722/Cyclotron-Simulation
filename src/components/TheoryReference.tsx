import React, { useState } from 'react';
import {
  PARTICLES,
  SimulationParams,
  SimulationState,
  ELEMENTARY_CHARGE,
} from '../physics/cyclotronEngine';
import { CheckCircle2, HelpCircle, RefreshCw } from 'lucide-react';

interface TheoryReferenceProps {
  params: SimulationParams;
  simState: SimulationState;
  onSelectPreset: (presetId: string) => void;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question:
      'Why does the revolution time T of a non-relativistic ion remain constant as its orbital radius r increases inside a classic cyclotron?',
    options: [
      'Because the magnetic field B grows stronger near the outer rim of the Dees',
      'Because particle velocity v increases in exact direct proportion to orbital radius r (v ∝ r)',
      'Because the electric field continues accelerating the ion inside the hollow metal Dees',
      'Because the mass of the ion decreases as kinetic energy increases',
    ],
    correctIndex: 1,
    explanation:
      'From Lorentz force qvB = mv²/r, we get r = mv/(qB). Since circumference is 2πr, the half-turn time t = πr/v = πm/(qB) cancels out velocity v and radius r completely!',
  },
  {
    id: 2,
    question:
      'If you switch the particle beam from Protons (¹H⁺, m ≈ 1 u, q = +1e) to Alpha Particles (⁴He²⁺, m ≈ 4 u, q = +2e) without changing B, how must the AC frequency f_RF be adjusted?',
    options: [
      'Double the frequency (2 × f_proton)',
      'Keep the exact same frequency',
      'Halve the frequency (0.5 × f_proton)',
      'Quarter the frequency (0.25 × f_proton)',
    ],
    correctIndex: 2,
    explanation:
      'Cyclotron frequency is f = qB / (2πm). An alpha particle has 2× the charge of a proton but 4× the mass, so its charge-to-mass ratio q/m is 2/4 = 0.5 times that of a proton.',
  },
  {
    id: 3,
    question:
      'What happens in a fixed-frequency cyclotron when protons reach relativistic speeds (γ > 1)?',
    options: [
      'They revolve faster and arrive at the gap too early',
      'Their relativistic mass γm₀ increases, lowering their orbital frequency so they fall out of phase with the AC voltage',
      'Their charge q increases, causing tighter spiral orbits',
      'The magnetic field inside the Dees is shielded by Faraday cage effects',
    ],
    correctIndex: 1,
    explanation:
      'Relativistic cyclotron frequency is f = qB / (2πγm₀). As kinetic energy rises, γ increases, so the particle takes longer to complete each half-turn and eventually enters the gap when the electric field opposes its motion.',
  },
];

export const TheoryReference: React.FC<TheoryReferenceProps> = ({
  params,
  simState,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const particle = PARTICLES[params.particleId];

  const maxClassicEnergyKeV =
    (Math.pow(particle.chargeC * params.magneticFieldT * params.deeRadiusM, 2) /
      (2 * particle.massKg)) /
    (1e3 * ELEMENTARY_CHARGE);
  const energyGainPerTurnEv = 2 * particle.chargeElementary * params.voltageV;
  const approxTurnsToExtract = Math.max(
    1,
    Math.ceil((maxClassicEnergyKeV * 1000) / energyGainPerTurnEv)
  );

  return (
    <div className="space-y-6">
      {/* Live Equation Calculator Deck */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Cyclotron Governing Equations &amp; Live Substitution
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time analytical values computed from your active {particle.name} ({particle.symbol}) setup
            </p>
          </div>
          <span className="text-xs font-mono text-sky-400">
            B = {params.magneticFieldT.toFixed(2)} T · U = {params.voltageV.toLocaleString()} V · R_max = {params.deeRadiusM.toFixed(2)} m
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Card 1: Lorentz Force & Orbital Radius */}
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between gap-2">
            <div>
              <div className="text-xs text-slate-400">01. Magnetic Centripetal Equilibrium</div>
              <div className="text-sm font-mono font-semibold text-sky-300 mt-1">
                F_L = q · v · B = (γ · m₀ · v²) / r
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Inside the hollow copper Dees, the electric field is shielded (Faraday cage). Only the uniform perpendicular magnetic field <strong>B</strong> acts on the ion, bending it into a circular arc of radius:
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 font-mono text-xs text-slate-200 flex items-center justify-between">
              <span>r = (γ · m₀ · v) / (q · B)</span>
              <span className="text-sky-400 font-semibold">
                Current r = {simState.currentRadiusM.toFixed(3)} m ({(simState.currentRadiusM * 100).toFixed(1)} cm)
              </span>
            </div>
          </div>

          {/* Card 2: Cyclotron Resonance Frequency */}
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between gap-2">
            <div>
              <div className="text-xs text-slate-400">02. Cyclotron Resonance Condition</div>
              <div className="text-sm font-mono font-semibold text-amber-300 mt-1">
                f₀ = (q · B) / (2π · m₀)
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                For continuous acceleration, the alternating voltage frequency <strong>f_RF</strong> must match the ion&apos;s orbital revolution frequency so the electric field reverses every half-turn:
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 font-mono text-xs text-slate-200 flex items-center justify-between">
              <span>T = 2π · m₀ / (q · B)</span>
              <span className="text-amber-400 font-semibold">
                f₀ = {(simState.classicalFreqHz / 1e6).toFixed(2)} MHz
              </span>
            </div>
          </div>

          {/* Card 3: Maximum Extraction Energy */}
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between gap-2">
            <div>
              <div className="text-xs text-slate-400">03. Maximum Extraction Kinetic Energy</div>
              <div className="text-sm font-mono font-semibold text-emerald-300 mt-1">
                E_max = (q² · B² · R_max²) / (2 · m₀)
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Each gap crossing adds <strong>ΔE = q · U</strong>. Higher voltage <strong>U</strong> requires fewer turns to reach outer radius <strong>R_max</strong>, while <strong>B</strong> and <strong>R_max</strong> set the classical energy ceiling:
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 font-mono text-xs text-slate-200 flex items-center justify-between">
              <span>~{approxTurnsToExtract} full turns ({approxTurnsToExtract * 2} crossings)</span>
              <span className="text-emerald-400 font-semibold">
                E_max ≈{' '}
                {maxClassicEnergyKeV >= 1000
                  ? `${(maxClassicEnergyKeV / 1000).toFixed(2)} MeV`
                  : `${maxClassicEnergyKeV.toFixed(1)} keV`}
              </span>
            </div>
          </div>

          {/* Card 4: Relativistic Mass & Synchro-Cyclotron */}
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between gap-2">
            <div>
              <div className="text-xs text-slate-400">04. Relativistic Frequency Shift</div>
              <div className="text-sm font-mono font-semibold text-purple-300 mt-1">
                f(v) = f₀ / γ = f₀ · √(1 − v²/c²)
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                At high energies, relativistic mass increases by Lorentz factor <strong>γ</strong>. A <strong>Synchro-Cyclotron</strong> dynamically lowers the oscillator frequency to maintain phase synchronization:
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 font-mono text-xs text-slate-200 flex items-center justify-between">
              <span>Current γ = {simState.gamma.toFixed(4)}</span>
              <span className="text-purple-400 font-semibold">
                f_rel = {(simState.particleFreqHz / 1e6).toFixed(2)} MHz
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Student Self-Check Quiz */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-400 shrink-0" />
            <h3 className="text-base font-semibold text-slate-100">
              Lab Concept Check — Magnetic Fields &amp; Cyclotron Resonance
            </h3>
          </div>
          {Object.keys(selectedAnswers).length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedAnswers({})}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Answers
            </button>
          )}
        </div>

        <div className="space-y-5 mt-4">
          {QUIZ_QUESTIONS.map((q, idx) => {
            const picked = selectedAnswers[q.id];
            const hasAnswered = picked !== undefined;
            const isCorrect = picked === q.correctIndex;

            return (
              <div
                key={q.id}
                className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3"
              >
                <p className="text-sm font-medium text-slate-100">
                  {idx + 1}. {q.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIndex) => {
                    const isThisPicked = picked === optIndex;
                    const isThisCorrect = q.correctIndex === optIndex;

                    let btnStyle =
                      'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100';
                    if (hasAnswered) {
                      if (isThisCorrect) {
                        btnStyle =
                          'bg-emerald-950/60 border-emerald-500/60 text-emerald-200';
                      } else if (isThisPicked && !isThisCorrect) {
                        btnStyle = 'bg-rose-950/60 border-rose-500/60 text-rose-200';
                      }
                    }

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        onClick={() =>
                          setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIndex }))
                        }
                        className={`min-h-[44px] p-3 rounded-lg border text-left text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {hasAnswered && isThisCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {hasAnswered && (
                  <p
                    className={`text-xs leading-relaxed pt-2 border-t border-slate-800/80 ${
                      isCorrect ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    <strong>{isCorrect ? 'Correct:' : 'Physics Insight:'}</strong>{' '}
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
