import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  C_LIGHT,
  PARTICLES,
  PRESET_SCENARIOS,
  ParticleTypeId,
  SimulationMode,
  DiagramMode,
  SimulationParams,
  SimulationState,
  createInitialSimulationState,
  stepCyclotronPhysics,
  triggerImmediateTargetExtraction,
} from './physics/cyclotronEngine';
import { CyclotronCanvas } from './components/CyclotronCanvas';
import { Cyclotron3DScene } from './components/Cyclotron3DScene';
import { CyclotronGameArena } from './components/CyclotronGameArena';
import { MagneticFieldSuite } from './components/MagneticFieldSuite';
import { LabManualWorkbook } from './components/LabManualWorkbook';
import { LiveTelemetryCharts } from './components/LiveTelemetryCharts';
import { TheoryReference } from './components/TheoryReference';
import { PWAHeaderActions } from './components/MobileAppModal';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Sliders,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Box,
  Gamepad2,
  FileSpreadsheet,
  Atom,
  Target,
} from 'lucide-react';

type MobileTab = 'chamber' | 'bfeld_suite' | 'game' | 'controls' | 'manual' | 'theory';

const DEFAULT_PARAMS: SimulationParams = {
  particleId: 'proton',
  magneticFieldT: 0.2,
  voltageV: 4000,
  deeRadiusM: 0.2,
  gapWidthM: 0.018,
  mode: 'classic',
  diagramMode: 'energy',
  speedMultiplier: 1,
  bfieldDirection: 'out',
};

export default function App() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [simState, setSimState] = useState<SimulationState>(() =>
    createInitialSimulationState(DEFAULT_PARAMS)
  );
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [renderMode, setRenderMode] = useState<'3d_webgl' | '2d_canvas'>('3d_webgl');
  const [viewAngle2D, setViewAngle2D] = useState<'top' | 'isometric'>('top');
  const [showForceVectors, setShowForceVectors] = useState<boolean>(true);
  const [showBFieldGrid, setShowBFieldGrid] = useState<boolean>(true);
  const [showEFieldLines, setShowEFieldLines] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chamber');
  const [activePresetId, setActivePresetId] = useState<string>('exp_2_4_1_a');

  const paramsRef = useRef<SimulationParams>(params);
  paramsRef.current = params;

  const handleReset = useCallback((customParams?: SimulationParams) => {
    const targetParams = customParams || paramsRef.current;
    setSimState(createInitialSimulationState(targetParams));
  }, []);

  const handleUpdateVoltage = useCallback(
    (rawVal: number, forceRestart = false) => {
      const val = Math.max(500, Math.min(250000, Math.round(rawVal)));
      const next = { ...paramsRef.current, voltageV: val };
      setParams(next);
      setSimState((prev) => {
        if (forceRestart || prev.targetHit || prev.status === 'extracted') {
          return createInitialSimulationState(next);
        }
        return prev;
      });
      setIsRunning(true);
    },
    []
  );

  const handleUpdateBField = useCallback(
    (rawVal: number, forceRestart = false) => {
      const val = Number(Math.max(0.05, Math.min(2.5, rawVal)).toFixed(2));
      const next = { ...paramsRef.current, magneticFieldT: val };
      setParams(next);
      setSimState((prev) => {
        if (forceRestart || prev.targetHit || prev.status === 'extracted') {
          return createInitialSimulationState(next);
        }
        return prev;
      });
      setIsRunning(true);
    },
    []
  );

  const handleFireToTarget = () => {
    setIsRunning(true);
    setSimState((prev) => triggerImmediateTargetExtraction(prev, paramsRef.current));
  };

  const handleStepForward = () => {
    setIsRunning(false);
    setSimState((prev) => {
      const next = stepCyclotronPhysics(
        prev.status === 'idle' ? { ...prev, status: 'accelerating' } : prev,
        paramsRef.current,
        0.025
      );
      return next;
    });
  };

  const handleApplyPreset = (presetId: string) => {
    const found = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(presetId);
    const updated: SimulationParams = {
      ...paramsRef.current,
      ...found.params,
    };
    setParams(updated);
    setSimState(createInitialSimulationState(updated));
    setIsRunning(true);
  };

  const handleLoadLabManualRow = (custom: Partial<SimulationParams>) => {
    const updated: SimulationParams = {
      ...paramsRef.current,
      ...custom,
    };
    setParams(updated);
    setSimState(createInitialSimulationState(updated));
    setIsRunning(true);
    setMobileTab('chamber');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isRunning) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dtSec = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      setSimState((prev) => {
        if (prev.targetHit) {
          return prev;
        }
        return stepCyclotronPhysics(prev, paramsRef.current, dtSec);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning]);

  const activeParticle = PARTICLES[params.particleId];
  const currentPreset = PRESET_SCENARIOS.find((p) => p.id === activePresetId);
  const speedFractionC = (simState.speedMs / C_LIGHT) * 100;
  const vIn10_6Ms = simState.speedMs / 1e6;
  const vMaxOverBRatio = vIn10_6Ms / Math.max(0.01, params.magneticFieldT);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col pb-20 lg:pb-10">
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-30 h-14 bg-[#0B1120]/95 border-b border-slate-800/90 px-4 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#simulator-workspace"
          onClick={(e) => {
            e.preventDefault();
            setMobileTab('chamber');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          Zyklotron 3D Lab
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a
            href="#simulator-workspace"
            onClick={() => setMobileTab('chamber')}
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            3D Cyclotron
          </a>
          <a
            href="#bfeld-suite-section"
            onClick={() => setMobileTab('bfeld_suite')}
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Mass Spec &amp; Wien Filter
          </a>
          <a
            href="#game-arena-section"
            onClick={() => setMobileTab('game')}
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Resonance Game
          </a>
          <a
            href="#lab-manual-section"
            onClick={() => setMobileTab('manual')}
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Lab Manual (2.4) PDF
          </a>
          <a
            href="#theory-section"
            onClick={() => setMobileTab('theory')}
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Equations
          </a>
        </nav>

        {/* Zone 3: Mobile App / GitHub & Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAHeaderActions />
          <button
            type="button"
            onClick={() => {
              handleReset();
              setIsRunning(true);
            }}
            className="px-3.5 py-2 min-h-[38px] text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Start / Reset Ion
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6 space-y-8">
        {/* Top Guided Experiment Header & 4 Presets */}
        <section
          className={`${
            mobileTab === 'chamber' || mobileTab === 'controls'
              ? 'block'
              : 'hidden lg:block'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
                Virtuelle Experimente — Cyclotron Full Control &amp; 3D Synchro-Cyclotron
              </h1>
              <p className="text-xs text-slate-400">
                Complete controls from virtuelle-experimente.de/en/b-feld/anwendung/sim-zyklotron.php + 3D WebGL Chamber &amp; Playable Resonance Game
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {simState.targetHit ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/60 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  🎯 TARGET HIT AT R_MAX ({params.deeRadiusM.toFixed(2)} m)
                </span>
              ) : simState.status === 'extracted' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  FIRING BEAM INTO TARGET ({params.deeRadiusM.toFixed(2)} m)
                </span>
              ) : simState.status === 'decelerating_phase_slip' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  RELATIVISTIC PHASE SLIP (Δφ &gt; 90°)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-sky-300">
                  <Compass className="w-4 h-4 text-sky-400 shrink-0" />
                  {isRunning ? 'SIMULATION RUNNING' : 'SIMULATION PAUSED'}
                </span>
              )}
            </div>
          </div>

          {/* 4 Guided Lab Manual & Virtuelle-Experimente Preset Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRESET_SCENARIOS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[76px] ${
                    isSelected
                      ? 'bg-slate-800/90 border-sky-400/70 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-100 truncate">
                      {preset.title}
                    </span>
                    <span className="text-[11px] font-mono text-sky-400 shrink-0">
                      {preset.subtitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Two-Zone Sandbox Layout: Left 3D/2D Cyclotron Stage + Live Readouts + Diagramm, Right Full Virtuelle-Experimente Control Deck */}
        <section
          id="simulator-workspace"
          className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${
            mobileTab === 'game' || mobileTab === 'manual' || mobileTab === 'theory'
              ? 'hidden lg:grid'
              : 'grid'
          }`}
        >
          {/* Left Column (7 cols on lg): Interactive 3D WebGL / 2D Stage + Readouts + Diagramm */}
          <div
            className={`lg:col-span-7 space-y-4 ${
              mobileTab === 'controls' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
              {/* Stage Toolbar: Start/Pause, Reset, Fire to Target, 2x Speed Checkbox, 3D/2D Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsRunning((r) => !r)}
                    className={`min-h-[42px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isRunning
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-sky-400 text-slate-950 hover:bg-sky-300'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4 shrink-0" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 shrink-0" />
                        Start
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReset()}
                    title="Reset Particle to Ion Source"
                    className="min-h-[42px] px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={handleFireToTarget}
                    title="Extract & Fire Particle Beam into Target Box"
                    className="min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Target className="w-4 h-4 shrink-0 text-emerald-400" />
                    Fire to Target
                  </button>

                  <button
                    type="button"
                    onClick={handleStepForward}
                    title="Single Step Forward"
                    className="min-h-[42px] px-2.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <StepForward className="w-4 h-4 shrink-0" />
                    Step
                  </button>

                  {/* Exact Virtuelle-Experimente "2x Speed" Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setParams((prev) => ({
                        ...prev,
                        speedMultiplier: prev.speedMultiplier === 2 ? 1 : 2,
                      }))
                    }
                    className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      params.speedMultiplier === 2
                        ? 'bg-sky-950 border-sky-400 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {params.speedMultiplier === 2 ? '☑ 2× Speed' : '☐ 2× Speed'}
                  </button>
                </div>

                {/* 3D WebGL vs 2D Schematic Switcher + Field Toggles */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setRenderMode('3d_webgl')}
                      className={`min-h-[34px] px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                        renderMode === '3d_webgl'
                          ? 'bg-sky-400 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      3D View
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenderMode('2d_canvas')}
                      className={`min-h-[34px] px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                        renderMode === '2d_canvas'
                          ? 'bg-sky-400 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      2D Classic
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForceVectors((v) => !v)}
                    className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      showForceVectors
                        ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    Vectors
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBFieldGrid((b) => !b)}
                    className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      showBFieldGrid
                        ? 'bg-teal-950/70 border-teal-500/50 text-teal-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    B-Field
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEFieldLines((e) => !e)}
                    className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      showEFieldLines
                        ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    E-Field
                  </button>
                </div>
              </div>

              {/* Active 3D WebGL or 2D Schematic Viewport */}
              {renderMode === '3d_webgl' ? (
                <Cyclotron3DScene
                  simState={simState}
                  params={params}
                  showForceVectors={showForceVectors}
                  showBFieldGrid={showBFieldGrid}
                  showEFieldLines={showEFieldLines}
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setViewAngle2D((v) => (v === 'top' ? 'isometric' : 'top'))
                      }
                      className="text-xs font-mono text-sky-400 hover:underline cursor-pointer"
                    >
                      Switch 2D Projection: {viewAngle2D === 'top' ? 'Top-Down' : 'Isometric Tilt'}
                    </button>
                  </div>
                  <CyclotronCanvas
                    simState={simState}
                    params={params}
                    viewAngle={viewAngle2D}
                    showForceVectors={showForceVectors}
                    showBFieldGrid={showBFieldGrid}
                    showEFieldLines={showEFieldLines}
                  />
                </div>
              )}

              {/* Inline Virtuelle-Experimente (sim-zyklotron.php) Direct V & B = T Control Bar */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Direct Voltage V Control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-amber-300">
                      Voltage V (Spannung U):
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateVoltage(params.voltageV - 1000)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold cursor-pointer"
                        title="Decrease Voltage by 1000 V"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={500}
                        max={250000}
                        step={500}
                        value={params.voltageV}
                        onChange={(e) => handleUpdateVoltage(Number(e.target.value) || 1000)}
                        className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right text-xs font-mono text-amber-300 font-semibold"
                        aria-label="Acceleration Voltage V"
                      />
                      <span className="text-xs font-mono text-slate-400">V</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateVoltage(params.voltageV + 1000)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold cursor-pointer"
                        title="Increase Voltage by 1000 V"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={100000}
                    step={500}
                    value={Math.min(100000, params.voltageV)}
                    onChange={(e) => handleUpdateVoltage(parseInt(e.target.value, 10))}
                    className="w-full"
                    aria-label="Voltage Slider"
                  />
                  <div className="flex flex-wrap items-center gap-1">
                    {[1000, 2000, 4000, 10000, 50000, 100000].map((vChip) => (
                      <button
                        key={vChip}
                        type="button"
                        onClick={() => handleUpdateVoltage(vChip, true)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer transition-colors ${
                          params.voltageV === vChip
                            ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {vChip >= 10000 ? `${vChip / 1000}kV` : `${vChip}V`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Magnetic Flux Density B = T Control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-teal-300">
                      Magnetic Field B (Flussdichte B):
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateBField(params.magneticFieldT - 0.1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold cursor-pointer"
                        title="Decrease B by 0.1 T"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0.05}
                        max={2.5}
                        step={0.05}
                        value={params.magneticFieldT}
                        onChange={(e) => handleUpdateBField(Number(e.target.value) || 0.1)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right text-xs font-mono text-teal-300 font-semibold"
                        aria-label="Magnetic Flux Density B in Tesla"
                      />
                      <span className="text-xs font-mono text-slate-400">T</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateBField(params.magneticFieldT + 0.1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold cursor-pointer"
                        title="Increase B by 0.1 T"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={2.0}
                    step={0.05}
                    value={Math.min(2.0, params.magneticFieldT)}
                    onChange={(e) => handleUpdateBField(parseFloat(e.target.value))}
                    className="w-full"
                    aria-label="Magnetic Flux Density Slider"
                  />
                  <div className="flex flex-wrap items-center gap-1">
                    {[0.1, 0.2, 0.3, 0.4, 1.0, 2.0].map((bChip) => (
                      <button
                        key={bChip}
                        type="button"
                        onClick={() => handleUpdateBField(bChip, true)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer transition-colors ${
                          Math.abs(params.magneticFieldT - bChip) < 0.001
                            ? 'bg-teal-500/25 border-teal-400 text-teal-300 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        B={bChip.toFixed(1)}T
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend & Gap Passage Counter */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
                    Velocity <strong>v</strong>
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-orange-400 inline-block" />
                    Lorentz Force <strong>F_L = q(v × B)</strong>
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-amber-400 inline-block" />
                    Electric Field <strong>E(t)</strong>
                  </span>
                </div>
                <span className="font-mono text-slate-300">
                  Gap Passages (n): <strong>{simState.gapCrossings}</strong> · V_max/B ≈{' '}
                  <strong>{vMaxOverBRatio.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Virtuelle-Experimente Digital Readout Display Boxes: r, f, E_kin, v, t, n */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Cyclotron Radius r</div>
                <div className="text-base font-mono font-semibold text-slate-100 mt-0.5">
                  {simState.currentRadiusM.toFixed(3)} m
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {(simState.currentRadiusM * 100).toFixed(1)} cm
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Frequency f</div>
                <div className="text-base font-mono font-semibold text-amber-300 mt-0.5">
                  {(simState.appliedRfFreqHz / 1e6).toFixed(2)} MHz
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  f₀ = {(simState.classicalFreqHz / 1e6).toFixed(2)} MHz
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Kinetic Energy E_kin</div>
                <div className="text-base font-mono font-semibold text-sky-300 mt-0.5">
                  {simState.kineticEnergyKeV < 1000
                    ? `${simState.kineticEnergyKeV.toFixed(1)} keV`
                    : `${simState.kineticEnergyMeV.toFixed(3)} MeV`}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {simState.kineticEnergyMeV.toFixed(4)} MeV
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Speed v (10⁶ m/s)</div>
                <div className="text-base font-mono font-semibold text-emerald-300 mt-0.5">
                  {vIn10_6Ms.toFixed(2)} ×10⁶
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {speedFractionC.toFixed(2)}% of c
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Time t</div>
                <div className="text-base font-mono font-semibold text-slate-100 mt-0.5">
                  {(simState.timeS * 1e9).toFixed(1)} ns
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  γ = {simState.gamma.toFixed(4)}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Passages n &amp; v/B</div>
                <div className="text-base font-mono font-semibold text-purple-300 mt-0.5">
                  n = {simState.gapCrossings}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  v/B = {vMaxOverBRatio.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Real-Time Telemetry Diagram (With Virtuelle-Experimente Diagramm Selector) */}
            <LiveTelemetryCharts
              history={simState.history}
              diagramMode={params.diagramMode}
              onChangeDiagramMode={(m: DiagramMode) =>
                setParams((prev) => ({ ...prev, diagramMode: m }))
              }
            />
          </div>

          {/* Right Column (5 cols on lg): Full Virtuelle-Experimente Control Panel */}
          <div className="lg:col-span-5 space-y-4 block">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">
                    Virtuelle Experimente — Full Controls
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All controls from sim-zyklotron.php (Mode, Voltage U, Magnetic Flux B, Particle, Diagram, Speed)
                  </p>
                </div>
              </div>

              {/* Control 1: Modus / Mode Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  1. Mode (Modus)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(
                    [
                      {
                        id: 'classic',
                        title: 'Classic (Klassisch)',
                        desc: 'Non-relativistic constant mass (m = m₀) & constant frequency f₀',
                      },
                      {
                        id: 'synchrocyclotron',
                        title: 'Relativistic with Frequency Adjustment (Synchro-Zyklotron)',
                        desc: 'Relativistisch mit Frequenzanpassung (f_RF = f₀ / γ)',
                      },
                      {
                        id: 'relativistic_unadjusted',
                        title: 'Relativistic without Frequency Adjustment',
                        desc: 'Relativistisch ohne Frequenzanpassung (Fixed f₀ → Phase Slip)',
                      },
                    ] as { id: SimulationMode; title: string; desc: string }[]
                  ).map((m) => {
                    const active = params.mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          const nextParams = { ...params, mode: m.id };
                          setParams(nextParams);
                          handleReset(nextParams);
                        }}
                        className={`p-3 rounded-xl border text-left transition-colors cursor-pointer min-h-[52px] ${
                          active
                            ? 'bg-sky-950/60 border-sky-400/70 text-slate-100'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold flex items-center justify-between">
                          <span>{m.title}</span>
                          {active && (
                            <span className="text-[11px] font-mono text-sky-400">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {m.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Control 2: Acceleration Voltage V (Beschleunigungsspannung U) with Quick Lab Chips + Numeric Input + Slider */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="input-voltage-v"
                    className="text-xs font-semibold text-slate-200"
                  >
                    2. Acceleration Voltage V (Beschleunigungsspannung U)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-voltage-v"
                      type="number"
                      min={500}
                      max={250000}
                      step={500}
                      value={params.voltageV}
                      onChange={(e) => handleUpdateVoltage(Number(e.target.value) || 1000)}
                      className="w-24 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-right text-xs font-mono text-amber-300"
                    />
                    <span className="text-xs font-mono text-slate-400">V</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={1000}
                  max={100000}
                  step={500}
                  value={Math.min(100000, params.voltageV)}
                  onChange={(e) => handleUpdateVoltage(parseInt(e.target.value, 10))}
                  className="w-full"
                />

                {/* Quick Lab Manual Voltage Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-slate-400 mr-1">Lab Presets:</span>
                  {[2000, 4000, 10000, 50000, 100000].map((vPreset) => (
                    <button
                      key={vPreset}
                      type="button"
                      onClick={() => handleUpdateVoltage(vPreset, true)}
                      className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                        params.voltageV === vPreset
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {vPreset >= 10000 ? `${vPreset / 1000} kV` : `${vPreset} V`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control 3: Magnetic Flux Density B (Magnetische Flussdichte B) */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="input-bfield-t"
                    className="text-xs font-semibold text-slate-200"
                  >
                    3. Magnetic Flux Density B (Magnetische Flussdichte)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-bfield-t"
                      type="number"
                      min={0.05}
                      max={2.5}
                      step={0.05}
                      value={params.magneticFieldT}
                      onChange={(e) => handleUpdateBField(Number(e.target.value) || 0.1)}
                      className="w-20 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-right text-xs font-mono text-teal-300"
                    />
                    <span className="text-xs font-mono text-slate-400">T</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.05}
                  value={Math.min(2.0, params.magneticFieldT)}
                  onChange={(e) => handleUpdateBField(parseFloat(e.target.value))}
                  className="w-full"
                />

                {/* Quick Lab Manual B-Field Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-slate-400 mr-1">Lab Presets:</span>
                  {[0.1, 0.2, 0.3, 0.4, 1.0, 2.0].map((bPreset) => (
                    <button
                      key={bPreset}
                      type="button"
                      onClick={() => handleUpdateBField(bPreset, true)}
                      className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                        Math.abs(params.magneticFieldT - bPreset) < 0.001
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {bPreset.toFixed(1)} T
                    </button>
                  ))}
                </div>
              </div>

              {/* Control 4: Particle Type (Teilchenart) */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    4. Particle Type (Teilchenart)
                  </span>
                  <span className="font-mono text-slate-400">
                    q = +{activeParticle.chargeElementary}e · m = {activeParticle.massKg.toExponential(2)} kg
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(PARTICLES) as ParticleTypeId[]).map((pid) => {
                    const p = PARTICLES[pid];
                    const isSelected = params.particleId === pid;
                    return (
                      <button
                        key={pid}
                        type="button"
                        onClick={() => {
                          const nextParams = { ...params, particleId: pid };
                          setParams(nextParams);
                          handleReset(nextParams);
                        }}
                        className={`min-h-[48px] px-3 py-2 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-slate-800 border-sky-400 text-white shadow-xs'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-100 whitespace-nowrap">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-mono text-sky-400">
                          {p.nameDe}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Control 5: Diagramm (Show Diagram) & Cyclotron Radius R_max */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label
                    htmlFor="select-diagram-mode"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    5. Show Diagram (Diagramm)
                  </label>
                  <select
                    id="select-diagram-mode"
                    value={params.diagramMode}
                    onChange={(e) =>
                      setParams((prev) => ({
                        ...prev,
                        diagramMode: e.target.value as DiagramMode,
                      }))
                    }
                    className="w-full min-h-[38px] bg-slate-950 border border-slate-800 rounded-lg px-2.5 text-xs text-slate-200 font-medium"
                  >
                    <option value="none">None (Keines)</option>
                    <option value="energy">Energy (Energie E_kin)</option>
                    <option value="velocity">Speed (Geschwindigkeit v)</option>
                    <option value="radius">Radius (Bahnradius r)</option>
                    <option value="frequency">Frequency (Frequenz f)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="slider-radius"
                      className="text-xs font-semibold text-slate-300"
                    >
                      6. Dee Radius R_max
                    </label>
                    <span className="text-xs font-mono text-sky-300">
                      {params.deeRadiusM.toFixed(2)} m
                    </span>
                  </div>
                  <input
                    id="slider-radius"
                    type="range"
                    min={0.15}
                    max={0.5}
                    step={0.05}
                    value={params.deeRadiusM}
                    onChange={(e) => {
                      const rVal = parseFloat(e.target.value);
                      const next = { ...params, deeRadiusM: rVal };
                      setParams(next);
                      handleReset(next);
                    }}
                    className="w-full bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              {/* Control 7: Simulation Speed & B-Field Polarity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <span className="block text-xs font-semibold text-slate-300 mb-1.5">
                    7. Simulation Speed (2×)
                  </span>
                  <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {[0.5, 1, 2, 4].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() =>
                          setParams((prev) => ({ ...prev, speedMultiplier: spd }))
                        }
                        className={`min-h-[36px] text-xs font-mono font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          params.speedMultiplier === spd
                            ? 'bg-slate-800 text-sky-300'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {spd}×
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-300 mb-1.5">
                    8. B-Field Direction
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...params, bfieldDirection: 'out' as const };
                        setParams(next);
                        handleReset(next);
                      }}
                      className={`min-h-[36px] text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        params.bfieldDirection === 'out'
                          ? 'bg-slate-800 text-teal-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⊙ Out (+z)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...params, bfieldDirection: 'in' as const };
                        setParams(next);
                        handleReset(next);
                      }}
                      className={`min-h-[36px] text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        params.bfieldDirection === 'in'
                          ? 'bg-slate-800 text-teal-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⊗ Into (−z)
                    </button>
                  </div>
                </div>
              </div>

              {/* Contextual Pedagogical Insight Note */}
              {currentPreset && (
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-1">
                  <div className="text-xs font-semibold text-sky-300">
                    Lab Observation Note — {currentPreset.title}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentPreset.learningNote}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Virtuelle Experimente B-Feld Companion Suite: Bainbridge Mass Spectrometer, Wien Velocity Filter & 3D Helix */}
        <section
          id="bfeld-suite-section"
          className={`${mobileTab === 'bfeld_suite' ? 'block' : 'hidden lg:block'}`}
        >
          <MagneticFieldSuite />
        </section>

        {/* Playable 2D/3D Cyclotron Resonance Game Arena */}
        <section
          id="game-arena-section"
          className={`${mobileTab === 'game' ? 'block' : 'hidden lg:block'}`}
        >
          <CyclotronGameArena />
        </section>

        {/* Applied Physics Lab Manual Experiment 2 Workbook & Fig 2.1 Schematic */}
        <section
          id="lab-manual-section"
          className={`${mobileTab === 'manual' ? 'block' : 'hidden lg:block'}`}
        >
          <LabManualWorkbook onLoadLabPreset={handleLoadLabManualRow} />
        </section>

        {/* Full-Width Physics Equations & Student Self-Check Section */}
        <section
          id="theory-section"
          className={`${mobileTab === 'theory' ? 'block' : 'hidden lg:block'}`}
        >
          <TheoryReference
            params={params}
            simState={simState}
            onSelectPreset={handleApplyPreset}
          />
        </section>
      </main>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <nav
        aria-label="Mobile View Switcher"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-slate-950/95 border-t border-slate-800 grid grid-cols-5 items-center px-1"
      >
        <button
          type="button"
          onClick={() => setMobileTab('chamber')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer ${
            mobileTab === 'chamber' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
            Cyclotron
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('controls')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer ${
            mobileTab === 'controls' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
            Controls
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('bfeld_suite')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer ${
            mobileTab === 'bfeld_suite' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Atom className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
            Mass Spec
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('game')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer ${
            mobileTab === 'game' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
            Play Game
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('manual')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer ${
            mobileTab === 'manual' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
            Lab Manual
          </span>
        </button>
      </nav>
    </div>
  );
}
