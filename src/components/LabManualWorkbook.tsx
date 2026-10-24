import React, { useState } from 'react';
import {
  PARTICLES,
  ELEMENTARY_CHARGE,
  SimulationParams,
} from '../physics/cyclotronEngine';
import {
  FileText,
  Play,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Eye,
  HelpCircle,
} from 'lucide-react';

interface LabManualWorkbookProps {
  onLoadLabPreset: (params: Partial<SimulationParams>) => void;
}

const SAMPLE_QUESTIONS_13 = [
  {
    q: '1. What role do magnetic and electric fields play in the operation of a cyclotron?',
    a: 'The high-frequency alternating electric field in the narrow gap between the Dees accelerates the charged particles and increases their kinetic energy (ΔE = qV per crossing). The perpendicular static magnetic field B exerts the Lorentz force (F = qvB) to bend the particles into circular arcs inside the hollow Dees so they repeatedly cross the same accelerating gap.',
  },
  {
    q: '2. Why is a cyclotron not suitable for accelerating electrons? What limitations does it have in accelerating heavy particles?',
    a: 'Electrons have a very tiny rest mass (9.11 × 10⁻³¹ kg), so even at low kinetic energies (a few keV) they reach relativistic speeds where γ increases rapidly, causing them to fall out of phase with the fixed-frequency AC voltage. Very heavy ions require extremely large magnetic fields B or huge Dee radii R to bend their trajectories.',
  },
  {
    q: '3. How does the frequency of the alternating voltage applied to the dees relate to the motion of the particle?',
    a: 'The frequency of the alternating voltage (f_RF) must be set equal to the orbital cyclotron frequency of the ions: f = qB / (2πm). This ensures that every time the ion completes a half-circle (in time T/2 = πm / qB), the electric field in the gap reverses polarity to accelerate it forward.',
  },
  {
    q: '4. Discuss the concept of resonance in a cyclotron. Why is it essential for the efficient acceleration of particles?',
    a: 'Resonance occurs when the AC oscillator frequency matches the natural cyclotron revolution frequency of the ion (f_RF = f₀). Because orbital period T = 2πm/(qB) is independent of radius and velocity for non-relativistic particles, resonance guarantees constructive energy gain at every single gap crossing.',
  },
  {
    q: '5. Explain the relativistic limitations of a cyclotron. How do synchrotrons / synchro-cyclotrons overcome these limitations?',
    a: 'As particle speed v approaches the speed of light c, relativistic mass m = γm₀ increases, lowering the orbital frequency f = qB / (2πγm₀). The ion arrives late at the gap and enters a decelerating phase. A synchro-cyclotron overcomes this by dynamically decreasing the oscillator frequency f_RF = f₀/γ to stay in phase; a synchrotron varies both B and f_RF.',
  },
  {
    q: '6. What are the factors that determine the maximum energy attainable by a particle in a cyclotron?',
    a: 'From E_max = (q² · B² · R_max²) / (2m), the maximum non-relativistic kinetic energy is determined by: (i) the particle charge q, (ii) the particle mass m, (iii) the magnetic flux density B of the electromagnet, and (iv) the maximum extraction radius R_max of the Dees.',
  },
  {
    q: '7. How does the design of a cyclotron differ for accelerating protons and heavy ions?',
    a: 'Heavy ions have a much smaller charge-to-mass ratio (q/m) than protons, resulting in a lower cyclotron frequency f = qB/(2πm) and a larger magnetic rigidity (B·R = mv/q). Heavy-ion cyclotrons therefore require lower RF oscillator frequencies, stronger superconducting magnets, and wider pole diameters.',
  },
  {
    q: '8. Discuss the applications of cyclotrons in medicine, research, and industry.',
    a: 'In medicine, cyclotrons produce short-lived PET radiopharmaceuticals (such as Fluorine-18 for FDG-PET scans) and proton/carbon beams for hadron cancer therapy. In nuclear physics research, they drive nuclear reactions and synthesize new isotopes. In industry, they are used for material wear testing and neutron radiography.',
  },
  {
    q: '9. A cyclotron is designed to accelerate protons. If the magnetic field is doubled, how does the cyclotron frequency change?',
    a: 'Since cyclotron frequency f = qB / (2πm) is directly proportional to the magnetic flux density B, doubling B (from B to 2B) doubles the cyclotron frequency (f becomes 2f).',
  },
  {
    q: '10. If the radius of the dees in a cyclotron is increased, how does it affect the maximum energy of the accelerated particles?',
    a: 'Since E_max = (q²B²R²) / (2m) is proportional to the square of the Dee radius (E_max ∝ R²), increasing the radius R by a factor k increases the maximum kinetic energy by k² (e.g., doubling R quadruples E_max).',
  },
  {
    q: '11. A cyclotron is used to accelerate alpha particles. How would you modify the cyclotron to accelerate protons without changing the magnetic field?',
    a: 'For an alpha particle (q_α = 2e, m_α = 4m_p), the ratio (q/m)_α = 2e / (4m_p) = 0.5 × (e/m_p). Thus a proton has twice the cyclotron frequency of an alpha particle in the same magnetic field B. To accelerate protons without changing B, you must double the alternating voltage frequency (f_proton = 2 × f_alpha).',
  },
  {
    q: '12. A charged particle is injected into a cyclotron at an angle to the magnetic field. Describe the path of the particle.',
    a: 'If the particle has a velocity component parallel to the magnetic field (v_∥) in addition to its perpendicular component (v_⊥), it will follow a 3D helical (spiral helix) trajectory along the magnetic field lines and quickly strike the top or bottom inner surface of the hollow Dees unless magnetic focusing is present.',
  },
  {
    q: '13. A cyclotron is operating at a fixed frequency. How can the energy of the accelerated particles be increased without changing the frequency?',
    a: 'At a fixed frequency f = qB/(2πm) for a given particle, the magnetic field B must remain fixed. Therefore, from E_max = (q²B²R²) / (2m), the maximum energy can be increased without changing the frequency by increasing the extraction radius R of the Dees.',
  },
];

export const LabManualWorkbook: React.FC<LabManualWorkbookProps> = ({
  onLoadLabPreset,
}) => {
  const [autoFilled, setAutoFilled] = useState<boolean>(true);
  const [showEmbeddedPdf, setShowEmbeddedPdf] = useState<boolean>(false);
  const deeRadiusM = 0.2; // 0.20 m = 20 cm standard Virtuelle-Experimente extraction radius

  const computeClassicalRow = (
    bTesla: number,
    particleId: 'proton' | 'deuteron' | 'alpha',
    voltageV: number
  ) => {
    const p = PARTICLES[particleId];
    const vMaxMs = (p.chargeC * bTesla * deeRadiusM) / p.massKg;
    const vMax10_6 = vMaxMs / 1e6;
    const vMaxOverB = vMax10_6 / bTesla;
    const freqMHz = (p.chargeC * bTesla) / (2 * Math.PI * p.massKg * 1e6);
    const keMaxJoules = 0.5 * p.massKg * vMaxMs * vMaxMs;
    const keMaxKeV = keMaxJoules / (1e3 * ELEMENTARY_CHARGE);
    const passagesN = Math.ceil(keMaxJoules / (p.chargeC * voltageV));
    return {
      vMax10_6: vMax10_6.toFixed(2),
      vMaxOverB: vMaxOverB.toFixed(2),
      freqMHz: freqMHz.toFixed(2),
      keMaxKeV: keMaxKeV.toFixed(2),
      passagesN,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with New Uploaded Cyclotron_Simulation_37876617.pdf Manual */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-sky-400">
            MEDICAPS UNIVERSITY · FACULTY OF SCIENCE · DEPARTMENT OF PHYSICS (PAGES 1–12)
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Applied Physics Lab Manual — Experiment 2: Cyclotron Simulation Workbook
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl">
            2.1 Objective: To simulate and analyze a charged particle&apos;s spiral trajectory and energy gain in a cyclotron. Click any table row below to load those exact values into the 3D/2D simulator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setAutoFilled((a) => !a)}
            className="min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {autoFilled ? 'Hide Calculated Values' : 'Auto-Fill Lab Observations'}
          </button>

          <button
            type="button"
            onClick={() => setShowEmbeddedPdf((p) => !p)}
            className="min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Eye className="w-4 h-4 text-sky-400" />
            {showEmbeddedPdf ? 'Hide PDF Viewer' : 'Preview PDF in App'}
          </button>

          <a
            href="/assets/aistudio/Cyclotron_Simulation_37876617.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-medium bg-sky-500/20 border border-sky-500/40 hover:bg-sky-500/30 text-sky-300 flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            Open Cyclotron PDF
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Optional Embedded PDF Viewer for /assets/aistudio/Cyclotron_Simulation_37876617.pdf */}
      {showEmbeddedPdf && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-sky-400">
              EMBEDDED DOCUMENT: /assets/aistudio/Cyclotron_Simulation_37876617.pdf (Pages 1–12)
            </span>
            <button
              type="button"
              onClick={() => setShowEmbeddedPdf(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Close Viewer ✕
            </button>
          </div>
          <iframe
            src="/assets/aistudio/Cyclotron_Simulation_37876617.pdf"
            title="Medicaps University Cyclotron Simulation Lab Manual PDF"
            className="w-full h-[560px] rounded-xl border border-slate-800 bg-slate-950"
          />
        </div>
      )}

      {/* Fig 2.1 Schematic Diagram of Cyclotron (Page 2 of PDF) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-6 space-y-3">
          <div className="text-xs font-mono text-teal-400">
            FIG. 2.1 · SCHEMATIC DIAGRAM OF CYCLOTRON (PAGE 2)
          </div>
          <h3 className="text-base font-bold text-slate-100">
            2.2 Theory &amp; Working Principle (E.O. Lawrence &amp; M.S. Livingston, 1934)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            A cyclotron accelerates charged particles outwards from the centre along a spiral path using perpendicular cross fields. Static magnetic field <strong>B</strong> bends the particles in circular arcs inside two hollow D-shaped sheet metal electrodes (&ldquo;dees&rdquo;) via Lorentz force <strong>F_B = qvB = mv²/R</strong>, while an alternating voltage <strong>V</strong> repeatedly accelerates them across the gap: <strong>E_k(n) = E_k0 + n·q·V</strong>.
          </p>
          <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Range of Voltage (V)</div>
              <div className="text-amber-300 font-semibold mt-0.5">1,000 V – 100,000 V</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Range of Magnetic Flux (B)</div>
              <div className="text-teal-300 font-semibold mt-0.5">0.1 T – 2.0 T</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Output Energy E_k</div>
              <div className="text-emerald-300 font-semibold mt-0.5">E_k = q²B²R² / (2m)</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Cyclotron Frequency f</div>
              <div className="text-sky-300 font-semibold mt-0.5">f = 1/T = qB / (2πm)</div>
            </div>
          </div>
        </div>

        {/* High-Resolution Interactive SVG Diagram of Fig. 2.1 */}
        <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
          <svg
            viewBox="0 0 500 310"
            className="w-full h-auto max-h-[290px]"
            role="img"
            aria-label="Fig 2.1 Schematic diagram of cyclotron with North/South electromagnet poles, hollow dees, spiral path, and AC source"
          >
            <ellipse cx="250" cy="42" rx="135" ry="22" fill="#1E293B" stroke="#F87171" strokeWidth="2" />
            <path d="M115,42 L115,74 A135,22 0 0,0 385,74 L385,42" fill="rgba(239, 68, 68, 0.18)" stroke="#F87171" strokeWidth="2" />
            <text x="250" y="64" textAnchor="middle" fill="#FECACA" fontSize="12" fontWeight="600">
              electromagnet (north pole)
            </text>

            <path d="M115,235 L115,268 A135,22 0 0,0 385,268 L385,235" fill="rgba(59, 130, 246, 0.18)" stroke="#60A5FA" strokeWidth="2" />
            <ellipse cx="250" cy="235" rx="135" ry="22" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.5" />
            <text x="250" y="262" textAnchor="middle" fill="#BFDBFE" fontSize="12" fontWeight="600">
              electromagnet (south pole)
            </text>

            {[-90, -45, 0, 45, 90].map((dx) => (
              <line
                key={dx}
                x1={250 + dx}
                y1={82}
                x2={250 + dx}
                y2={220}
                stroke="rgba(45, 212, 191, 0.35)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            ))}

            <path
              d="M240,115 A115,38 0 0,0 240,191 L240,175 Z"
              fill="rgba(245, 158, 11, 0.25)"
              stroke="#FBBF24"
              strokeWidth="2"
            />
            <path
              d="M260,115 A115,38 0 0,1 260,191 L260,175 Z"
              fill="rgba(56, 189, 248, 0.25)"
              stroke="#38BDF8"
              strokeWidth="2"
            />

            <path
              d="M250,153 C265,153 270,142 250,140 C222,138 215,165 250,168 C295,170 302,132 250,129 C190,126 182,178 250,181 C322,184 345,172 395,184"
              fill="none"
              stroke="#34D399"
              strokeWidth="2.5"
            />

            <rect x="395" y="174" width="22" height="18" rx="3" fill="#10B981" stroke="#ECFDF5" strokeWidth="1.5" />
            <text x="445" y="187" textAnchor="middle" fill="#6EE7B7" fontSize="11" fontFamily="IBM Plex Mono">
              target
            </text>

            <line x1="240" y1="185" x2="185" y2="215" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="260" y1="185" x2="215" y2="215" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="200" cy="215" r="14" fill="#0F172A" stroke="#FBBF24" strokeWidth="2" />
            <path d="M192,215 Q196,207 200,215 T208,215" fill="none" stroke="#FBBF24" strokeWidth="2" />
            <text x="175" y="218" textAnchor="end" fill="#FDE68A" fontSize="10" fontFamily="IBM Plex Mono">
              alternating current (~)
            </text>

            <text x="80" y="148" fill="#E2E8F0" fontSize="11">
              hollow electrode
            </text>
            <text x="385" y="135" fill="#34D399" fontSize="11">
              particle&apos;s path
            </text>
          </svg>
        </div>
      </div>

      {/* Section 2.4.1(a) Page 6 & 7: Three Trajectory Boxes at V = 4000 V and B = 0.1 T */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">
            2.4.1 (a) Trajectory &amp; Kinetic Energy for Proton, Deuteron, and Alpha Particle (V = 4000 V, B = 0.1 T) — Page 6 &amp; 7
          </h3>
          <p className="text-xs text-slate-400">
            Set V = 4000 V and B = 0.1 T, observe the spiral trajectory of the Proton, Deuteron, and Alpha particle, and note down their kinetic energy (KE).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              {
                id: 'proton' as const,
                title: 'Trajectory for Proton',
                label: 'K.E. for proton',
                color: '#38BDF8',
                turns: 5,
              },
              {
                id: 'deuteron' as const,
                title: 'Trajectory for Deuteron',
                label: 'K.E. for deuteron',
                color: '#F59E0B',
                turns: 3.5,
              },
              {
                id: 'alpha' as const,
                title: 'Trajectory for an alpha particle',
                label: 'K.E. for an alpha particle',
                color: '#10B981',
                turns: 3.5,
              },
            ]
          ).map((box) => {
            const calc = computeClassicalRow(0.1, box.id, 4000);
            // Generate SVG spiral path for the box
            const pts: string[] = [];
            const cx = 120;
            const cy = 78;
            const maxR = 58;
            const totalSteps = 120;
            for (let s = 0; s <= totalSteps; s++) {
              const frac = s / totalSteps;
              const r = frac * maxR;
              const angle = frac * box.turns * Math.PI * 2;
              const x = cx + r * Math.cos(angle);
              const y = cy + r * Math.sin(angle);
              pts.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
            }
            pts.push(`L${(cx + maxR * 1.25).toFixed(1)},${(cy + maxR * 0.92).toFixed(1)}`);

            return (
              <div
                key={box.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
              >
                <div className="text-xs font-bold text-center text-slate-200 border-b border-slate-800 pb-2">
                  {box.title}
                </div>

                <svg viewBox="0 0 240 156" className="w-full h-36 bg-[#070D19] rounded-lg border border-slate-800/80">
                  {/* Left & Right Dees */}
                  <path
                    d="M116,16 A62,62 0 0,0 116,140 Z"
                    fill="rgba(148, 163, 184, 0.06)"
                    stroke="#334155"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M124,16 A62,62 0 0,1 124,140 Z"
                    fill="rgba(148, 163, 184, 0.06)"
                    stroke="#334155"
                    strokeWidth="1.5"
                  />
                  {/* Spiral Path */}
                  <path d={pts.join(' ')} fill="none" stroke={box.color} strokeWidth="2" />
                  {/* Target Box */}
                  <rect x="190" y="124" width="12" height="14" rx="2" fill="#10B981" />
                </svg>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{box.label} =</span>
                    <strong style={{ color: box.color }}>
                      {autoFilled ? `${calc.keMaxKeV} keV (${calc.passagesN} passages)` : '—'}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onLoadLabPreset({
                        particleId: box.id,
                        voltageV: 4000,
                        magneticFieldT: 0.1,
                        deeRadiusM: 0.2,
                        mode: 'classic',
                      })
                    }
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    Simulate {PARTICLES[box.id].name} (V=4000V, B=0.1T)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2.4.1(a & b) Pages 7, 8, 9: V_max/B Ratio & Cyclotron Frequency Tables */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">
            2.4.1 (a &amp; b): Calculate V_max / B Ratio &amp; Cyclotron Frequency (Voltage = 2000 V, R_max = 0.20 m) — Pages 7–9
          </h3>
          <p className="text-xs text-slate-400">
            Given: m_p = 1.67 × 10⁻²⁷ kg, q_p = 1.6 × 10⁻¹⁹ C, m_d ≈ 3.34 × 10⁻²⁷ kg, m_α ≈ 6.64 × 10⁻²⁷ kg.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="py-2.5 px-3">Sr. No.</th>
                <th className="py-2.5 px-3">Magnetic Flux Density B (T)</th>
                <th className="py-2.5 px-3">Proton V_max (10⁶ m/s)</th>
                <th className="py-2.5 px-3">Proton V_max / B</th>
                <th className="py-2.5 px-3">f_Proton (MHz)</th>
                <th className="py-2.5 px-3">f_Deuteron (MHz)</th>
                <th className="py-2.5 px-3">f_Alpha (MHz)</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {[0.2, 0.3, 0.4].map((bVal, idx) => {
                const pRow = computeClassicalRow(bVal, 'proton', 2000);
                const dRow = computeClassicalRow(bVal, 'deuteron', 2000);
                const aRow = computeClassicalRow(bVal, 'alpha', 2000);
                return (
                  <tr key={bVal} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-300">{idx + 1}.</td>
                    <td className="py-2.5 px-3 font-semibold text-teal-300">{bVal.toFixed(1)} T</td>
                    <td className="py-2.5 px-3 text-sky-300">
                      {autoFilled ? pRow.vMax10_6 : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      {autoFilled ? `${pRow.vMaxOverB} × 10⁶` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-sky-300">
                      {autoFilled ? `${pRow.freqMHz} MHz` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-amber-300">
                      {autoFilled ? `${dRow.freqMHz} MHz` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-300">
                      {autoFilled ? `${aRow.freqMHz} MHz` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() =>
                          onLoadLabPreset({
                            particleId: 'proton',
                            magneticFieldT: bVal,
                            voltageV: 2000,
                            deeRadiusM: 0.2,
                            mode: 'classic',
                          })
                        }
                        className="px-2.5 py-1 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 hover:bg-sky-500/30 text-[11px] flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Play className="w-3 h-3" />
                        Load V=2000V, B={bVal}T
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Page 8 Comment Questions 1 & 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-semibold text-sky-300">
              Page 8 Comment 1: At constant voltage, how does the ratio V_max / B vary with magnetic field B?
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Observation:</strong> Since V_max = (q · B · R_max) / m, the ratio <strong>V_max / B = (q · R_max) / m ≈ 19.13 × 10⁶ m/(s·T)</strong> remains <strong>constant</strong> regardless of the magnetic field B (for fixed Dee extraction radius R_max = 0.20 m).
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-semibold text-teal-300">
              Page 8 Comment 2: At constant voltage, how does R_max vary with the magnetic field B?
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Observation:</strong> For a fixed number of passages (fixed kinetic energy), orbital radius R = mv/(qB) is inversely proportional to B (individual turn spacing shrinks as B increases), whereas the physical extraction radius R_max = (m·V_max)/(qB) = 0.20 m is fixed by the Dee geometry.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2.4.1(c) Page 9: Optimizing Voltage & Magnetic Field */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">
            2.4.1 (c): Optimizing Voltage and Magnetic Field to Achieve Maximum Kinetic Energy — Page 9
          </h3>
          <p className="text-xs text-slate-400">
            Observe how doubling Accelerated Voltage V from 2000 V to 4000 V halves the number of gap passages n, while K.E._max depends on B.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="py-2.5 px-3">Accelerated Voltage (V)</th>
                <th className="py-2.5 px-3">Magnetic Flux Density B (T)</th>
                <th className="py-2.5 px-3">Proton K.E._max (keV)</th>
                <th className="py-2.5 px-3">n (number of times particle passages between the &ldquo;dees&rdquo;)</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {[
                { v: 2000, b: 0.1 },
                { v: 2000, b: 0.2 },
                { v: 4000, b: 0.1 },
                { v: 4000, b: 0.2 },
              ].map((item, i) => {
                const row = computeClassicalRow(item.b, 'proton', item.v);
                return (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-amber-300">{item.v} V</td>
                    <td className="py-2.5 px-3 font-semibold text-teal-300">{item.b.toFixed(1)} T</td>
                    <td className="py-2.5 px-3 text-sky-300">
                      {autoFilled ? `${row.keMaxKeV} keV` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-300">
                      {autoFilled ? `${row.passagesN} passages` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() =>
                          onLoadLabPreset({
                            particleId: 'proton',
                            voltageV: item.v,
                            magneticFieldT: item.b,
                            deeRadiusM: 0.2,
                            mode: 'classic',
                          })
                        }
                        className="px-2.5 py-1 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 hover:bg-sky-500/30 text-[11px] flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Play className="w-3 h-3" />
                        Simulate V={item.v}V, B={item.b}T
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2.4.2.1 & 2.4.2.2 Page 10: Relativistic Without vs With Frequency Adjustment (V = 100,000 V, B = 2.0 T) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">
            2.4.2.1 &amp; 2.4.2.2: Relativistic Without vs. With Frequency Adjustment (For Voltage = 100000 V and B = 2 T) — Page 10
          </h3>
          <p className="text-xs text-slate-400">
            Compare maximum velocity attained (10⁶ m/s) and frequency (MHz) for Proton, Deuteron, and Alpha at V = 100,000 V and B = 2.0 T.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="py-2.5 px-3">Particle</th>
                <th className="py-2.5 px-3">2.4.2.1 Unadjusted Max Velocity (10⁶ m/s)</th>
                <th className="py-2.5 px-3">2.4.2.1 Fixed Frequency (MHz)</th>
                <th className="py-2.5 px-3">2.4.2.2 Synchro Max Velocity (10⁶ m/s)</th>
                <th className="py-2.5 px-3">2.4.2.2 Adjusted Frequency (MHz)</th>
                <th className="py-2.5 px-3">Load in Simulator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {[
                {
                  id: 'proton' as const,
                  name: 'Proton',
                  unadjV: '16.8 × 10⁶ m/s (Phase Slip)',
                  f0: '30.50 MHz',
                  syncV: '38.28 × 10⁶ m/s (Extracted)',
                  fMod: '30.50 → 26.80 MHz',
                },
                {
                  id: 'deuteron' as const,
                  name: 'Deuteron',
                  unadjV: '12.4 × 10⁶ m/s (Phase Slip)',
                  f0: '15.26 MHz',
                  syncV: '19.16 × 10⁶ m/s (Extracted)',
                  fMod: '15.26 → 14.10 MHz',
                },
                {
                  id: 'alpha' as const,
                  name: 'Alpha',
                  unadjV: '12.6 × 10⁶ m/s (Phase Slip)',
                  f0: '15.36 MHz',
                  syncV: '19.29 × 10⁶ m/s (Extracted)',
                  fMod: '15.36 → 14.20 MHz',
                },
              ].map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-100">{row.name}</td>
                  <td className="py-2.5 px-3 text-amber-300">
                    {autoFilled ? row.unadjV : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {autoFilled ? row.f0 : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-300 font-semibold">
                    {autoFilled ? row.syncV : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-purple-300">
                    {autoFilled ? row.fMod : '—'}
                  </td>
                  <td className="py-2.5 px-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onLoadLabPreset({
                          particleId: row.id,
                          magneticFieldT: 2.0,
                          voltageV: 100000,
                          deeRadiusM: 0.2,
                          mode: 'relativistic_unadjusted',
                        })
                      }
                      className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-[11px] cursor-pointer whitespace-nowrap"
                    >
                      Unadjusted
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onLoadLabPreset({
                          particleId: row.id,
                          magneticFieldT: 2.0,
                          voltageV: 100000,
                          deeRadiusM: 0.2,
                          mode: 'synchrocyclotron',
                        })
                      }
                      className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-[11px] flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Synchro
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2.6 Pages 11 & 12: All 13 Sample Questions & Answers */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-slate-100">
            2.6 Sample Viva-Voce Questions &amp; Complete Answers (Pages 11–12, Questions 1–13)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SAMPLE_QUESTIONS_13.map((item) => (
            <div
              key={item.q}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
            >
              <div className="text-xs font-semibold text-sky-300">{item.q}</div>
              <div className="text-xs text-slate-300 leading-relaxed">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
