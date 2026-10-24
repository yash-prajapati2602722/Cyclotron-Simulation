import React, { useEffect, useRef, useState } from 'react';
import {
  ELEMENTARY_CHARGE,
  ATOMIC_MASS_UNIT,
} from '../physics/cyclotronEngine';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Compass,
  Filter,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

type SubExperiment = 'mass_spectrometer' | 'wien_filter' | 'helix_path';

interface IsotopeSpec {
  id: string;
  label: string;
  symbol: string;
  massU: number;
  chargeE: number;
  color: string;
  isMystery?: boolean;
  trueName?: string;
}

const ISOTOPE_SAMPLES: IsotopeSpec[] = [
  { id: 'proton', label: 'Proton (¹H⁺)', symbol: '¹H⁺', massU: 1.007, chargeE: 1, color: '#38BDF8' },
  { id: 'deuteron', label: 'Deuteron (²H⁺)', symbol: '²H⁺', massU: 2.014, chargeE: 1, color: '#F59E0B' },
  { id: 'alpha', label: 'Alpha (⁴He²⁺)', symbol: '⁴He²⁺', massU: 4.002, chargeE: 2, color: '#10B981' },
  { id: 'neon20', label: 'Neon-20 (²⁰Ne⁺)', symbol: '²⁰Ne⁺', massU: 19.992, chargeE: 1, color: '#A78BFA' },
  { id: 'neon22', label: 'Neon-22 (²²Ne⁺)', symbol: '²²Ne⁺', massU: 21.991, chargeE: 1, color: '#F472B6' },
  {
    id: 'probe_a',
    label: 'Mystery Probe A (Unbekannte Probe A)',
    symbol: 'Probe A⁺',
    massU: 12.0,
    chargeE: 1,
    color: '#FBBF24',
    isMystery: true,
    trueName: 'Carbon-12 (¹²C⁺, 12.00 u)',
  },
  {
    id: 'probe_b',
    label: 'Mystery Probe B (Unbekannte Probe B)',
    symbol: 'Probe B⁺',
    massU: 16.0,
    chargeE: 1,
    color: '#34D399',
    isMystery: true,
    trueName: 'Oxygen-16 (¹⁶O⁺, 16.00 u)',
  },
];

export const MagneticFieldSuite: React.FC = () => {
  const [activeSub, setActiveSub] = useState<SubExperiment>('mass_spectrometer');

  // --- 1. BAINBRIDGE MASS SPECTROMETER STATE (sim-massenspektrometer.php) ---
  const [selectedIsotopeId, setSelectedIsotopeId] = useState<string>('neon20');
  const [compareIsotopeMode, setCompareIsotopeMode] = useState<boolean>(true);
  const [filterEf, setFilterEf] = useState<number>(40000); // V/m (10,000 to 100,000 V/m)
  const [filterBf, setFilterBf] = useState<number>(0.2); // Tesla (0.05 to 0.80 T)
  const [analyzerBa, setAnalyzerBa] = useState<number>(0.25); // Tesla (0.05 to 1.00 T)
  const [mysteryGuessU, setMysteryGuessU] = useState<string>('');
  const [mysteryFeedback, setMysteryFeedback] = useState<string | null>(null);

  const msCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- 2. WIEN VELOCITY FILTER STATE (geschwindigkeitsfilter.php) ---
  const [wienE, setWienE] = useState<number>(30000); // V/m
  const [wienB, setWienB] = useState<number>(0.15); // Tesla
  const [injectedSpeed10_5, setInjectedSpeed10_5] = useState<number>(2.0); // in 10^5 m/s
  const wienCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- 3. 3D HELIX / SCREW PATH STATE (schraubenbahn.php) ---
  const [helixB, setHelixB] = useState<number>(0.005); // 5 mT in Helmholtz coil
  const [helixPitchAngleDeg, setHelixPitchAngleDeg] = useState<number>(62); // angle alpha (15 to 85 deg)
  const [helixVoltageV, setHelixVoltageV] = useState<number>(250); // electron gun accelerating voltage (100 - 500 V)
  const [helixRotY, setHelixRotY] = useState<number>(25); // 3D viewing rotation
  const helixCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentIsotope =
    ISOTOPE_SAMPLES.find((s) => s.id === selectedIsotopeId) || ISOTOPE_SAMPLES[0];

  // Calculate Bainbridge physics values
  const vPass = filterEf / filterBf; // m/s
  const qMain = currentIsotope.chargeE * ELEMENTARY_CHARGE;
  const mMain = currentIsotope.massU * ATOMIC_MASS_UNIT;
  const radiusMainM = (mMain * vPass) / (qMain * analyzerBa);
  const diameterMainCm = radiusMainM * 2 * 100;

  // Render Bainbridge Mass Spectrometer Canvas
  useEffect(() => {
    if (activeSub !== 'mass_spectrometer') return;
    const canvas = msCanvasRef.current;
    if (!canvas) return;

    const renderMassSpec = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width > 50 ? rect.width : 640;
      const h = rect.height > 50 ? rect.height : 400;

      if (
        canvas.width !== Math.floor(w * dpr) ||
        canvas.height !== Math.floor(h * dpr)
      ) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#070D19';
      ctx.fillRect(0, 0, w, h);

      // Layout coordinates: Left side = Ion Source + Wien Filter tunnel, Right side = Semicircular B_A Analyzer Chamber
      const slitX = w * 0.28;
      const slitY = h * 0.22;

      // 1. Draw Ion Source & Wien Velocity Selector Plates (Left of slitX)
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.fillRect(20, slitY - 32, Math.max(10, slitX - 28), 64);
      ctx.strokeRect(20, slitY - 32, Math.max(10, slitX - 28), 64);

      // Top (+) and Bottom (-) condenser plates of Wien Filter
      ctx.fillStyle = '#F43F5E';
      ctx.fillRect(45, slitY - 26, Math.max(10, slitX - 65), 5);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(45, slitY + 21, Math.max(10, slitX - 65), 5);

      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText('Wien Filter (E_F, B_F)', 45, slitY - 38);

      // Slit Aperture Wall at x = slitX
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(slitX, 15);
      ctx.lineTo(slitX, slitY - 8);
      ctx.moveTo(slitX, slitY + 8);
      ctx.lineTo(slitX, h - 20);
      ctx.stroke();

      // Detector Photographic Plate with cm ruler along the vertical wall (from slitY downwards)
      const maxDisplayCm = 80; // 80 cm ruler height
      const rulerHeightPx = Math.max(80, h - slitY - 36);
      const pxPerCm = Math.max(0.5, rulerHeightPx / maxDisplayCm);

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(slitX + 2, slitY + 10);
      ctx.lineTo(slitX + 2, slitY + rulerHeightPx);
      ctx.stroke();

      // Ruler tick marks every 10 cm
      ctx.font = '500 10px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.textAlign = 'right';
      for (let cm = 10; cm <= maxDisplayCm; cm += 10) {
        const ty = slitY + cm * pxPerCm;
        ctx.beginPath();
        ctx.moveTo(slitX - 5, ty);
        ctx.lineTo(slitX + 3, ty);
        ctx.stroke();
        ctx.fillText(`${cm} cm`, slitX - 9, ty + 3);
      }

      // Analyzer B_A Field Dots in right chamber
      ctx.fillStyle = 'rgba(45, 212, 191, 0.25)';
      for (let gx = slitX + 35; gx < w - 20; gx += 42) {
        for (let gy = 35; gy < h - 25; gy += 42) {
          ctx.beginPath();
          ctx.arc(gx, gy, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = '#2DD4BF';
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.fillText(`Analyzer Chamber B_A = ${analyzerBa.toFixed(2)} T`, slitX + 24, 28);

      // Draw filtered straight beam in Wien selector
      ctx.strokeStyle = currentIsotope.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(26, slitY);
      ctx.lineTo(slitX, slitY);
      ctx.stroke();

      // Helper to draw semicircular arc in Analyzer Chamber for a given isotope
      const drawIsotopeArc = (iso: IsotopeSpec, isSecondary: boolean) => {
        const q = iso.chargeE * ELEMENTARY_CHARGE;
        const m = iso.massU * ATOMIC_MASS_UNIT;
        const rM = Math.max(0.001, (m * vPass) / (q * analyzerBa));
        const dCm = rM * 2 * 100;
        const rPx = Math.max(2, (dCm / 2) * pxPerCm);

        ctx.save();
        ctx.strokeStyle = iso.color;
        ctx.lineWidth = isSecondary ? 1.8 : 2.8;
        if (isSecondary) ctx.setLineDash([5, 4]);

        ctx.beginPath();
        ctx.arc(slitX, slitY + rPx, rPx, -Math.PI / 2, Math.PI / 2, false);
        ctx.stroke();
        ctx.setLineDash([]);

        // Impact glow on detector plate
        const hitY = slitY + dCm * pxPerCm;
        if (hitY < h - 10) {
          ctx.fillStyle = iso.color;
          ctx.beginPath();
          ctx.arc(slitX + 2, hitY, isSecondary ? 4.5 : 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '600 11px "IBM Plex Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(
            `${iso.symbol}: d = ${dCm.toFixed(2)} cm`,
            slitX + 14,
            hitY + 4
          );
        }
        ctx.restore();
      };

      // If compare mode is active for Neon-20 / Neon-22 or H / D, show companion isotope too
      if (compareIsotopeMode) {
        if (currentIsotope.id === 'neon20') {
          const ne22 = ISOTOPE_SAMPLES.find((s) => s.id === 'neon22');
          if (ne22) drawIsotopeArc(ne22, true);
        } else if (currentIsotope.id === 'neon22') {
          const ne20 = ISOTOPE_SAMPLES.find((s) => s.id === 'neon20');
          if (ne20) drawIsotopeArc(ne20, true);
        } else if (currentIsotope.id === 'proton') {
          const deut = ISOTOPE_SAMPLES.find((s) => s.id === 'deuteron');
          if (deut) drawIsotopeArc(deut, true);
        }
      }

      drawIsotopeArc(currentIsotope, false);

      ctx.restore();
    };

    renderMassSpec();
    const ro = new ResizeObserver(() => renderMassSpec());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [
    activeSub,
    currentIsotope,
    compareIsotopeMode,
    filterEf,
    filterBf,
    analyzerBa,
    vPass,
  ]);

  // Render Wien Velocity Filter Canvas
  useEffect(() => {
    if (activeSub !== 'wien_filter') return;
    const canvas = wienCanvasRef.current;
    if (!canvas) return;

    const renderWien = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width > 50 ? rect.width : 640;
      const h = rect.height > 50 ? rect.height : 340;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);

      ctx.save();
      ctx.scale(dpr, dpr);
      const cy = h / 2;

      ctx.fillStyle = '#070D19';
      ctx.fillRect(0, 0, w, h);

      const plateStartX = w * 0.16;
      const plateEndX = w * 0.78;
      const plateHalfGap = Math.max(30, h * 0.28);

      // Top (+) and Bottom (-) Capacitor Plates
      ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
      ctx.strokeStyle = '#FB7185';
      ctx.lineWidth = 2;
      ctx.fillRect(plateStartX, cy - plateHalfGap - 14, plateEndX - plateStartX, 14);
      ctx.strokeRect(plateStartX, cy - plateHalfGap - 14, plateEndX - plateStartX, 14);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.strokeStyle = '#38BDF8';
      ctx.fillRect(plateStartX, cy + plateHalfGap, plateEndX - plateStartX, 14);
      ctx.strokeRect(plateStartX, cy + plateHalfGap, plateEndX - plateStartX, 14);

      // Draw E-field downward arrows and B-field crosses
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
      for (let x = plateStartX + 35; x < plateEndX - 20; x += 55) {
        ctx.beginPath();
        ctx.moveTo(x, cy - plateHalfGap + 6);
        ctx.lineTo(x, cy + plateHalfGap - 6);
        ctx.stroke();
      }

      // Exit Slit Diaphragm at plateEndX + 24
      const slitX = plateEndX + 24;
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(slitX, 20);
      ctx.lineTo(slitX, cy - 12);
      ctx.moveTo(slitX, cy + 12);
      ctx.lineTo(slitX, h - 20);
      ctx.stroke();

      // Calculate ideal resonant speed v_0 = E / B
      const vIdeal10_5 = wienE / wienB / 1e5;

      // Plot 3 trajectories
      const drawBeamCurve = (v10_5: number, color: string, label: string, isMain: boolean) => {
        const diffRatio = (v10_5 - vIdeal10_5) / Math.max(0.5, vIdeal10_5);
        const endDeflectionY = -diffRatio * plateHalfGap * 1.45;
        const blocked = Math.abs(endDeflectionY) > 11;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = isMain ? 3 : 1.6;
        if (!isMain) ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(25, cy);
        ctx.lineTo(plateStartX, cy);
        ctx.quadraticCurveTo(
          (plateStartX + slitX) / 2,
          cy + endDeflectionY * 0.35,
          slitX,
          cy + Math.max(-plateHalfGap, Math.min(plateHalfGap, endDeflectionY))
        );
        if (!blocked) {
          ctx.lineTo(w - 25, cy + endDeflectionY * 1.1);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '600 11px "IBM Plex Mono", monospace';
        ctx.fillStyle = color;
        const labelY = cy + Math.max(-plateHalfGap + 14, Math.min(plateHalfGap - 14, endDeflectionY));
        ctx.fillText(label, slitX + 10, labelY + 4);
        ctx.restore();
      };

      drawBeamCurve(vIdeal10_5 * 1.35, '#FB923C', 'v > E/B (F_L > F_E)', false);
      drawBeamCurve(vIdeal10_5 * 0.65, '#A78BFA', 'v < E/B (F_E > F_L)', false);
      drawBeamCurve(
        injectedSpeed10_5,
        Math.abs(injectedSpeed10_5 - vIdeal10_5) < 0.12 ? '#34D399' : '#38BDF8',
        Math.abs(injectedSpeed10_5 - vIdeal10_5) < 0.12
          ? '✓ PASSES SLIT (v = E/B)'
          : `Injected v = ${injectedSpeed10_5.toFixed(2)}×10⁵ m/s`,
        true
      );

      ctx.restore();
    };

    renderWien();
    const ro = new ResizeObserver(() => renderWien());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [activeSub, wienE, wienB, injectedSpeed10_5]);

  // Render 3D Helix / Screw Trajectory Canvas
  useEffect(() => {
    if (activeSub !== 'helix_path') return;
    const canvas = helixCanvasRef.current;
    if (!canvas) return;

    const renderHelix = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width > 50 ? rect.width : 640;
      const h = rect.height > 50 ? rect.height : 340;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#070D19';
      ctx.fillRect(0, 0, w, h);

      // Electron parameters
      const eMass = 9.1093837e-31;
      const vTotal = Math.sqrt((2 * ELEMENTARY_CHARGE * helixVoltageV) / eMass);
      const alphaRad = (helixPitchAngleDeg * Math.PI) / 180;
      const vPerp = vTotal * Math.sin(alphaRad);
      const vParallel = vTotal * Math.cos(alphaRad);

      const rMeters = (eMass * vPerp) / (ELEMENTARY_CHARGE * helixB);
      const periodT = (2 * Math.PI * eMass) / (ELEMENTARY_CHARGE * helixB);
      const pitchMeters = vParallel * periodT;

      const startX = w * 0.12;
      const endX = w * 0.88;
      const cy = h * 0.5;
      const tiltRad = (helixRotY * Math.PI) / 180;

      // Draw Magnetic Field B lines (Horizontal)
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.22)';
      ctx.lineWidth = 1.2;
      for (let yOff = -h * 0.34; yOff <= h * 0.34; yOff += 34) {
        ctx.beginPath();
        ctx.moveTo(startX - 20, cy + yOff);
        ctx.lineTo(endX + 20, cy + yOff);
        ctx.stroke();
      }

      const rPx = Math.max(12, Math.min(h * 0.34, Math.max(18, rMeters * 1800)));
      const pitchPx = Math.max(28, Math.min(220, pitchMeters * 900));
      const totalLengthPx = Math.max(50, endX - startX);
      const totalTurns = totalLengthPx / pitchPx;

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.6;
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 10;
      ctx.beginPath();

      const steps = 420;
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const theta = frac * totalTurns * Math.PI * 2;
        const x3d = startX + frac * totalLengthPx;
        const y3d = Math.sin(theta) * rPx;
        const z3d = Math.cos(theta) * rPx;

        const screenX = x3d + z3d * Math.sin(tiltRad) * 0.45;
        const screenY = cy - y3d;

        if (i === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(
        `Radius r = ${(rMeters * 100).toFixed(2)} cm · Pitch h = ${(pitchMeters * 100).toFixed(2)} cm · v = ${(vTotal / 1e6).toFixed(2)}×10⁶ m/s`,
        20,
        h - 16
      );

      ctx.restore();
    };

    renderHelix();
    const ro = new ResizeObserver(() => renderHelix());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [activeSub, helixB, helixPitchAngleDeg, helixVoltageV, helixRotY]);

  const handleCheckMystery = () => {
    const val = parseFloat(mysteryGuessU);
    if (isNaN(val)) return;
    const diff = Math.abs(val - currentIsotope.massU);
    if (diff <= 0.6) {
      setMysteryFeedback(
        `✓ Correct! Using m = (d · q · B_F · B_A) / (2 · E_F), this sample is ${currentIsotope.trueName}.`
      );
    } else {
      setMysteryFeedback(
        `Not quite (${val} u). Hint: Use m = (d · q · B_F · B_A) / (2 · E_F) and divide by 1.66×10⁻²⁷ kg/u!`
      );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6">
      {/* Header & Sub-Experiment Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-teal-400">
            VIRTUELLE-EXPERIMENTE.DE · B-FELD APPLICATIONS SUITE (ANWENDUNGEN)
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-0.5">
            Charged Particles in Electric &amp; Magnetic Fields — Interactive Companion Labs
          </h2>
          <p className="text-xs text-slate-400">
            Explore the companion simulations from Virtuelle Experimente: Bainbridge Mass Spectrometer, Wien Velocity Selector, and 3D Helical Screw Paths.
          </p>
        </div>

        {/* 3 Sub-Module Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSub('mass_spectrometer')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeSub === 'mass_spectrometer'
                ? 'bg-sky-400 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Mass Spectrometer (Bainbridge)
          </button>
          <button
            type="button"
            onClick={() => setActiveSub('wien_filter')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeSub === 'wien_filter'
                ? 'bg-sky-400 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Wien Velocity Selector
          </button>
          <button
            type="button"
            onClick={() => setActiveSub('helix_path')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeSub === 'helix_path'
                ? 'bg-sky-400 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Helix Trajectory (Schraubenbahn)
          </button>
        </div>
      </div>

      {/* SUB-EXPERIMENT 1: BAINBRIDGE MASS SPECTROMETER (sim-massenspektrometer.php) */}
      {activeSub === 'mass_spectrometer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <div className="w-full h-[380px] sm:h-[420px] rounded-xl overflow-hidden border border-slate-800">
              <canvas ref={msCanvasRef} className="w-full h-full block" />
            </div>

            {/* Digital Readouts for Mass Spectrometer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Selected Velocity v</div>
                <div className="text-sm font-bold text-sky-300 mt-0.5">
                  {(vPass / 1e5).toFixed(2)} × 10⁵ m/s
                </div>
                <div className="text-[10px] text-slate-500">v = E_F / B_F</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Impact Diameter d</div>
                <div className="text-sm font-bold text-emerald-300 mt-0.5">
                  {diameterMainCm.toFixed(2)} cm
                </div>
                <div className="text-[10px] text-slate-500">r = {(diameterMainCm / 2).toFixed(2)} cm</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Ion Mass m</div>
                <div className="text-sm font-bold text-amber-300 mt-0.5">
                  {currentIsotope.isMystery ? '??? u (Mystery)' : `${currentIsotope.massU} u`}
                </div>
                <div className="text-[10px] text-slate-500">q = +{currentIsotope.chargeE}e</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Mass Formula</div>
                <div className="text-xs font-bold text-purple-300 mt-0.5">
                  m = (d·q·B_F·B_A)/(2E_F)
                </div>
              </div>
            </div>
          </div>

          {/* Controls for Bainbridge Mass Spectrometer */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">
              Mass Spectrometer Controls (sim-massenspektrometer.php)
            </h3>

            {/* Isotope / Mystery Probe Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Ion Sample / Isotope Probe (Teilchenart / Probe)
              </label>
              <select
                value={selectedIsotopeId}
                onChange={(e) => {
                  setSelectedIsotopeId(e.target.value);
                  setMysteryFeedback(null);
                }}
                className="w-full min-h-[40px] bg-slate-900 border border-slate-700 rounded-lg px-3 text-xs text-slate-100 font-medium"
              >
                {ISOTOPE_SAMPLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Electric Field E_F */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Velocity Filter E_F</span>
                <span className="font-mono text-amber-300">{(filterEf / 1000).toFixed(0)} kV/m</span>
              </div>
              <input
                type="range"
                min={10000}
                max={80000}
                step={2000}
                value={filterEf}
                onChange={(e) => setFilterEf(Number(e.target.value))}
                className="w-full bg-slate-800 rounded-lg"
              />
            </div>

            {/* Filter Magnetic Field B_F */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Velocity Filter B_F</span>
                <span className="font-mono text-teal-300">{filterBf.toFixed(2)} T</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.6}
                step={0.02}
                value={filterBf}
                onChange={(e) => setFilterBf(Number(e.target.value))}
                className="w-full bg-slate-800 rounded-lg"
              />
            </div>

            {/* Analyzer Magnetic Field B_A */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Analyzer Chamber B_A</span>
                <span className="font-mono text-sky-300">{analyzerBa.toFixed(2)} T</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.8}
                step={0.02}
                value={analyzerBa}
                onChange={(e) => setAnalyzerBa(Number(e.target.value))}
                className="w-full bg-slate-800 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Show Twin Isotope Comparison</span>
              <button
                type="button"
                onClick={() => setCompareIsotopeMode((c) => !c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer border ${
                  compareIsotopeMode
                    ? 'bg-sky-950 border-sky-400 text-sky-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {compareIsotopeMode ? '☑ Compare Isotopes' : '☐ Single Beam'}
              </button>
            </div>

            {/* Mystery Probe Exercise Box */}
            {currentIsotope.isMystery && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2.5">
                <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  Identify Unknown {currentIsotope.symbol}
                </div>
                <p className="text-[11px] text-slate-300">
                  Measure the impact diameter <strong>d = {diameterMainCm.toFixed(2)} cm</strong> and calculate the unknown atomic mass in <strong>u</strong>:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Mass in u (e.g. 12)"
                    value={mysteryGuessU}
                    onChange={(e) => setMysteryGuessU(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleCheckMystery}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
                {mysteryFeedback && (
                  <p className="text-[11px] font-mono text-emerald-300">{mysteryFeedback}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-EXPERIMENT 2: WIEN VELOCITY SELECTOR (geschwindigkeitsfilter.php) */}
      {activeSub === 'wien_filter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <div className="w-full h-[340px] rounded-xl overflow-hidden border border-slate-800">
              <canvas ref={wienCanvasRef} className="w-full h-full block" />
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">
              Wien Velocity Filter Controls (Crossed E &amp; B Fields)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Only particles whose velocity satisfies <strong>F_el = F_Lorentz ⇒ q·E = q·v·B ⇒ v = E / B</strong> pass straight through the aperture slit undeflected.
            </p>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Electric Field E</span>
                <span className="font-mono text-amber-300">{(wienE / 1000).toFixed(0)} kV/m</span>
              </div>
              <input
                type="range"
                min={10000}
                max={60000}
                step={2000}
                value={wienE}
                onChange={(e) => setWienE(Number(e.target.value))}
                className="w-full bg-slate-800 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Magnetic Flux Density B</span>
                <span className="font-mono text-teal-300">{wienB.toFixed(2)} T</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.4}
                step={0.01}
                value={wienB}
                onChange={(e) => setWienB(Number(e.target.value))}
                className="w-full bg-slate-800 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Injected Particle Speed v</span>
                <span className="font-mono text-sky-300">
                  {injectedSpeed10_5.toFixed(2)} × 10⁵ m/s
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5.0}
                step={0.05}
                value={injectedSpeed10_5}
                onChange={(e) => setInjectedSpeed10_5(Number(e.target.value))}
                className="w-full bg-slate-800 rounded-lg"
              />
            </div>

            <button
              type="button"
              onClick={() => setInjectedSpeed10_5(Number((wienE / wienB / 1e5).toFixed(2)))}
              className="w-full min-h-[40px] rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
            >
              Match Resonant Speed v₀ = E / B ({(wienE / wienB / 1e5).toFixed(2)} × 10⁵ m/s)
            </button>
          </div>
        </div>
      )}

      {/* SUB-EXPERIMENT 3: 3D HELIX TRAJECTORY (schraubenbahn.php) */}
      {activeSub === 'helix_path' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <div className="w-full h-[340px] rounded-xl overflow-hidden border border-slate-800">
              <canvas ref={helixCanvasRef} className="w-full h-full block" />
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">
              Helix / Screw Trajectory in B-Field (Schraubenbahn)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Directly answers Lab Manual Question 12 (Page 37): When a charged particle is injected at an angle <strong>α</strong> to B, velocity splits into <strong>v_⊥ = v·sin(α)</strong> (circular orbit) and <strong>v_∥ = v·cos(α)</strong> (uniform drift), producing a 3D helix!
            </p>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Injection Angle α to B-Field</span>
                <span className="font-mono text-sky-300">{helixPitchAngleDeg}°</span>
              </div>
              <input
                type="range"
                min={15}
                max={88}
                step={1}
                value={helixPitchAngleDeg}
                onChange={(e) => setHelixPitchAngleDeg(Number(e.target.value))}
                className="w-full bg-slate-800 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Helmholtz Coil B-Field</span>
                <span className="font-mono text-teal-300">{(helixB * 1000).toFixed(1)} mT</span>
              </div>
              <input
                type="range"
                min={0.002}
                max={0.012}
                step={0.0005}
                value={helixB}
                onChange={(e) => setHelixB(Number(e.target.value))}
                className="w-full bg-slate-800 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Acceleration Voltage U_A</span>
                <span className="font-mono text-amber-300">{helixVoltageV} V</span>
              </div>
              <input
                type="range"
                min={100}
                max={500}
                step={10}
                value={helixVoltageV}
                onChange={(e) => setHelixVoltageV(Number(e.target.value))}
                className="w-full bg-slate-800 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">3D Perspective Angle</span>
                <span className="font-mono text-purple-300">{helixRotY}°</span>
              </div>
              <input
                type="range"
                min={-60}
                max={60}
                step={2}
                value={helixRotY}
                onChange={(e) => setHelixRotY(Number(e.target.value))}
                className="w-full bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
