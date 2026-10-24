import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PARTICLES,
  ParticleTypeId,
  ELEMENTARY_CHARGE,
  C_LIGHT,
} from '../physics/cyclotronEngine';
import { soundFX } from '../utils/soundFX';
import {
  Trophy,
  Zap,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Target,
  ShieldAlert,
  Award,
} from 'lucide-react';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'ROUND_SUMMARY' | 'GAME_OVER';

interface MissionSpec {
  id: number;
  title: string;
  subtitle: string;
  particleId: ParticleTypeId;
  magneticFieldT: number;
  voltageKV: number;
  targetEnergyMeV: number;
  relativistic: boolean;
  timeLimitSec: number;
  description: string;
}

const MISSIONS: MissionSpec[] = [
  {
    id: 1,
    title: 'Mission 1: Medical Isotope Proton Beam',
    subtitle: 'Classic Isochronous Resonance',
    particleId: 'proton',
    magneticFieldT: 1.0,
    voltageKV: 95,
    targetEnergyMeV: 1.2,
    relativistic: false,
    timeLimitSec: 45,
    description:
      'Flip the Dee gap polarity [SPACE or TAP] each time the Proton approaches the central gap to accelerate it to 1.20 MeV.',
  },
  {
    id: 2,
    title: 'Mission 2: Heavy Alpha Target Bombardment',
    subtitle: 'High-Mass α²⁺ Ion Acceleration',
    particleId: 'alpha',
    magneticFieldT: 1.4,
    voltageKV: 130,
    targetEnergyMeV: 2.2,
    relativistic: false,
    timeLimitSec: 50,
    description:
      'Alpha particles have 4× mass and +2e charge. Time your AC polarity flips with their slower cyclotron frequency!',
  },
  {
    id: 3,
    title: 'Mission 3: Synchro-Cyclotron Relativistic Boss',
    subtitle: 'Dynamic Relativistic Frequency Shift',
    particleId: 'proton',
    magneticFieldT: 1.75,
    voltageKV: 180,
    targetEnergyMeV: 3.0,
    relativistic: true,
    timeLimitSec: 55,
    description:
      'As the proton nears relativistic speed, its mass γ·m₀ increases and its orbit slows down. Adapt your pulse timing to extract the beam!',
  },
];

export const CyclotronGameArena: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [missionIdx, setMissionIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(1850);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastFeedback, setLastFeedback] = useState<{
    text: string;
    type: 'perfect' | 'good' | 'miss';
  } | null>(null);

  const mission = MISSIONS[missionIdx];
  const particle = PARTICLES[mission.particleId];

  // Live physics state for the arcade game loop
  const [hudData, setHudData] = useState({
    energyMeV: 0.05,
    radiusRatio: 0.08,
    gamma: 1.0,
    timeLeft: mission.timeLimitSec,
    beamStability: 100,
    polarity: 1 as 1 | -1, // +1 accelerates +vx, -1 accelerates -vx
    inGapZone: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef({
    angleRad: 0, // Current orbital angle (0 = top of circle, PI/2 = right, PI = bottom)
    angularVel: 3.4, // rad/sec
    energyMeV: 0.05,
    gamma: 1.0,
    polarity: 1 as 1 | -1,
    timeLeft: mission.timeLimitSec,
    stability: 100,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lastHalfTurnIndex: 0,
    isExtracting: false,
    extractProgress: 0, // 0 to 1 along the extraction channel to the Target Box
    targetHitTimer: 0,
    trail: [] as { x: number; y: number; energy: number }[],
    sparks: [] as { x: number; y: number; vx: number; vy: number; alpha: number; color: string }[],
  });

  const startMission = useCallback(
    (idx: number) => {
      const m = MISSIONS[idx];
      setMissionIdx(idx);
      gameRef.current = {
        angleRad: 0.15,
        angularVel: m.particleId === 'alpha' ? 2.6 : 3.3,
        energyMeV: 0.12,
        gamma: 1.0,
        polarity: 1,
        timeLeft: m.timeLimitSec,
        stability: 100,
        score: idx === 0 ? 0 : gameRef.current.score,
        combo: 0,
        maxCombo: idx === 0 ? 0 : gameRef.current.maxCombo,
        lastHalfTurnIndex: 0,
        isExtracting: false,
        extractProgress: 0,
        targetHitTimer: 0,
        trail: [],
        sparks: [],
      };
      setScore(gameRef.current.score);
      setCombo(0);
      setLastFeedback(null);
      setGameState('PLAYING');
    },
    []
  );

  // Trigger beam extraction to fire into the Target Box
  const handleFireBeamAtTarget = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const g = gameRef.current;
    if (g.isExtracting) return;
    g.energyMeV = mission.targetEnergyMeV;
    g.isExtracting = true;
    g.extractProgress = 0;
    g.targetHitTimer = 0;
    soundFX.playExtractionVictory();
    setLastFeedback({
      text: '🎯 FIRING EXTRACTED ION BEAM INTO TARGET DETECTOR!',
      type: 'perfect',
    });
  }, [gameState, mission]);

  // Player action: Flip AC Dee Polarity & Pulse Electric Field
  const handlePolarityFlip = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    const g = gameRef.current;
    if (g.isExtracting) return;

    g.polarity = (g.polarity * -1) as 1 | -1;

    // Normalize angle in [0, 2π)
    const normAngle = ((g.angleRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    // Gap crossings happen near angle = 0 (top vertical gap) and angle = π (bottom vertical gap)
    const distToTopGap = Math.min(normAngle, Math.PI * 2 - normAngle);
    const distToBottomGap = Math.abs(normAngle - Math.PI);
    const minGapAngularDist = Math.min(distToTopGap, distToBottomGap);

    const energyGainBase = (particle.chargeElementary * mission.voltageKV) / 800;

    if (minGapAngularDist < 0.68) {
      // IN-PHASE RESONANCE KICK!
      const isPerfect = minGapAngularDist < 0.28;
      const mult = isPerfect ? 1.65 : 1.25;
      g.energyMeV = Math.min(
        mission.targetEnergyMeV,
        g.energyMeV + energyGainBase * mult
      );
      g.combo += 1;
      g.maxCombo = Math.max(g.maxCombo, g.combo);
      const pts = (isPerfect ? 150 : 100) + g.combo * 25;
      g.score += pts;

      setScore(g.score);
      setCombo(g.combo);
      setMaxCombo(g.maxCombo);
      setLastFeedback({
        text: isPerfect
          ? `⚡ PERFECT RESONANCE! +${pts} PTS (${g.combo}×)`
          : `✓ IN-PHASE KICK! +${pts} PTS`,
        type: isPerfect ? 'perfect' : 'good',
      });
      soundFX.playPulseHit(g.combo, isPerfect);

      // Spawn celebration sparks at particle position
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 40 + Math.random() * 90;
        g.sparks.push({
          x: 0,
          y: 0,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          alpha: 1,
          color: isPerfect ? '#38BDF8' : '#34D399',
        });
      }

      // Check Victory Condition -> Launch beam into Target Box!
      if (g.energyMeV >= mission.targetEnergyMeV) {
        g.score += Math.round(g.timeLeft * 20);
        setScore(g.score);
        setHighScore((prev) => Math.max(prev, g.score));
        g.isExtracting = true;
        g.extractProgress = 0;
        g.targetHitTimer = 0;
        soundFX.playExtractionVictory();
        setLastFeedback({
          text: '🎯 MAXIMUM ENERGY REACHED — FIRING BEAM INTO TARGET!',
          type: 'perfect',
        });
      }
    } else {
      // OUT OF PHASE!
      g.combo = 0;
      g.stability = Math.max(0, g.stability - 10);
      setCombo(0);
      setLastFeedback({
        text: '⚠ EARLY/LATE PULSE! Wait until the ion approaches the central yellow gap (-10% Stability)',
        type: 'miss',
      });
      soundFX.playPhaseMiss();

      if (g.stability <= 0) {
        setGameState('GAME_OVER');
      }
    }
  }, [gameState, mission, particle]);

  // Keyboard listener for SPACEBAR / ENTER during gameplay
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'PLAYING' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        handlePolarityFlip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, handlePolarityFlip]);

  // Main Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const g = gameRef.current;
      if (!g.isExtracting) {
        g.timeLeft = Math.max(0, g.timeLeft - dt);
        if (g.timeLeft <= 0) {
          setGameState('GAME_OVER');
          return;
        }
      }

      // Relativistic mass factor slows down angular velocity as energy rises
      const progress = Math.min(1, g.energyMeV / mission.targetEnergyMeV);
      g.gamma = mission.relativistic ? 1 + progress * 0.38 : 1.0;
      const baseOmega = mission.particleId === 'alpha' ? 2.6 : 3.4;
      const currentOmega = baseOmega / g.gamma;

      if (!g.isExtracting) {
        g.angleRad += currentOmega * dt;
      } else {
        g.extractProgress = Math.min(1, g.extractProgress + dt * 2.2);
        if (g.extractProgress >= 1) {
          g.targetHitTimer += dt;
          if (g.targetHitTimer >= 1.1) {
            setGameState('ROUND_SUMMARY');
            return;
          }
        }
      }

      const normAngle = ((g.angleRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const distTop = Math.min(normAngle, Math.PI * 2 - normAngle);
      const distBot = Math.abs(normAngle - Math.PI);
      const inGapZone = !g.isExtracting && Math.min(distTop, distBot) < 0.65;

      const radiusRatio = 0.14 + Math.sqrt(progress) * 0.78;

      setHudData({
        energyMeV: g.energyMeV,
        radiusRatio,
        gamma: g.gamma,
        timeLeft: g.timeLeft,
        beamStability: g.stability,
        polarity: g.polarity,
        inGapZone,
      });

      // Render 2D Arcade Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          const w = Math.max(200, rect.width || 600);
          const h = Math.max(200, rect.height || 440);
          if (
            canvas.width !== Math.floor(w * dpr) ||
            canvas.height !== Math.floor(h * dpr)
          ) {
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
          }

          ctx.save();
          ctx.scale(dpr, dpr);
          const cx = w / 2;
          const cy = h / 2;
          const maxR = Math.max(40, Math.min(w, h) * 0.39);

          // Clear arena background
          ctx.fillStyle = '#070D19';
          ctx.fillRect(0, 0, w, h);

          // Draw Target Extraction Ring
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.arc(cx, cy, maxR * 0.92, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw Extraction Channel & Target Detector Box at top-right (cx + maxR * 1.06, cy - maxR * 0.92)
          const exitY = cy - maxR * 0.92;
          const targetX = cx + maxR * 1.06;
          ctx.strokeStyle = g.isExtracting ? '#38BDF8' : 'rgba(148, 163, 184, 0.6)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.moveTo(cx, exitY);
          ctx.lineTo(targetX, exitY);
          ctx.stroke();
          ctx.setLineDash([]);

          const hitTarget = g.isExtracting && g.extractProgress >= 0.98;
          ctx.fillStyle = hitTarget ? '#FBBF24' : '#10B981';
          ctx.strokeStyle = hitTarget ? '#FEF08A' : '#6EE7B7';
          ctx.lineWidth = 2;
          if (hitTarget) {
            ctx.shadowColor = '#FBBF24';
            ctx.shadowBlur = 22;
          }
          ctx.fillRect(targetX - 10, exitY - 13, 24, 26);
          ctx.strokeRect(targetX - 10, exitY - 13, 24, 26);
          ctx.shadowBlur = 0;

          if (hitTarget) {
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(targetX + 2, exitY, 20 + g.targetHitTimer * 22, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.fillStyle = hitTarget ? '#FDE047' : '#6EE7B7';
          ctx.font = '700 11px "IBM Plex Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(hitTarget ? '🎯 TARGET HIT!' : '🎯 TARGET', targetX + 18, exitY + 4);

          // Draw Left & Right Dees
          const gapHalf = 18;
          const leftPos = g.polarity > 0;

          const renderArcadeDee = (side: 'left' | 'right') => {
            const isPositive = side === 'left' ? leftPos : !leftPos;
            ctx.beginPath();
            if (side === 'left') {
              ctx.arc(cx - gapHalf, cy, maxR, Math.PI / 2, (3 * Math.PI) / 2, false);
            } else {
              ctx.arc(cx + gapHalf, cy, maxR, -Math.PI / 2, Math.PI / 2, false);
            }
            ctx.closePath();
            ctx.fillStyle = isPositive
              ? 'rgba(244, 63, 94, 0.16)'
              : 'rgba(56, 189, 248, 0.16)';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = isPositive ? '#FB7185' : '#38BDF8';
            ctx.stroke();
          };

          renderArcadeDee('left');
          renderArcadeDee('right');

          // Highlight Resonant Gap Zone when particle enters the accelerating gap!
          ctx.fillStyle = inGapZone
            ? 'rgba(251, 191, 36, 0.28)'
            : 'rgba(251, 191, 36, 0.06)';
          ctx.fillRect(cx - gapHalf, cy - maxR, gapHalf * 2, maxR * 2);

          // Compute particle coordinates
          const rPx = radiusRatio * maxR;
          const px = g.isExtracting
            ? cx + g.extractProgress * (targetX - cx)
            : cx + Math.sin(g.angleRad) * rPx;
          const py = g.isExtracting ? exitY : cy - Math.cos(g.angleRad) * rPx;

          g.trail.push({ x: px, y: py, energy: g.energyMeV });
          if (g.trail.length > 260) g.trail.shift();

          // Draw Spiral Trail
          if (g.trail.length > 1) {
            ctx.beginPath();
            for (let i = 0; i < g.trail.length; i++) {
              const t = g.trail[i];
              if (i === 0) ctx.moveTo(t.x, t.y);
              else ctx.lineTo(t.x, t.y);
            }
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 3;
            ctx.stroke();
          }

          // Spawn continuous target impact sparks when hitting target
          if (hitTarget && Math.random() < 0.7) {
            for (let k = 0; k < 4; k++) {
              const a = Math.random() * Math.PI * 2;
              const s = 60 + Math.random() * 120;
              g.sparks.push({
                x: 0,
                y: 0,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                alpha: 1,
                color: k % 2 === 0 ? '#FBBF24' : '#34D399',
              });
            }
          }

          // Draw Spark Particles
          for (let i = g.sparks.length - 1; i >= 0; i--) {
            const sp = g.sparks[i];
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.alpha -= dt * 2.2;
            if (sp.alpha <= 0) {
              g.sparks.splice(i, 1);
              continue;
            }
            ctx.fillStyle = sp.color;
            ctx.globalAlpha = Math.max(0, sp.alpha);
            ctx.beginPath();
            ctx.arc(px + sp.x * 0.3, py + sp.y * 0.3, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;

          // Draw Glowing Ion Particle
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = hitTarget ? '#FBBF24' : inGapZone ? '#FBBF24' : particle.color;
          ctx.shadowBlur = hitTarget ? 28 : inGapZone ? 22 : 12;
          ctx.beginPath();
          ctx.arc(px, py, hitTarget ? 11 : inGapZone ? 9 : 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // HUD Prompt inside Canvas
          ctx.font = '700 12px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = hitTarget ? '#34D399' : inGapZone ? '#FBBF24' : '#94A3B8';
          ctx.fillText(
            hitTarget
              ? '🎯 DIRECT TARGET IMPACT CONFIRMED! 🎯'
              : inGapZone
              ? '⚡ IN ACCELERATION GAP — PRESS SPACE OR TAP PULSE NOW! ⚡'
              : 'Wait for ion to enter central yellow acceleration gap...',
            cx,
            h - 16
          );

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mission, particle]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
      {/* Top Game Header & Scoreboard */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Resonance Pulse — Cyclotron Arcade Challenge
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Master E.O. Lawrence&apos;s cyclotron resonance condition by flipping the Dee voltage at each half-turn gap crossing
          </p>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg">
            <span className="text-slate-400">SCORE: </span>
            <strong className="text-sky-400 text-sm">{score}</strong>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg">
            <span className="text-slate-400">COMBO: </span>
            <strong className="text-amber-400 text-sm">{combo}×</strong>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg hidden sm:block">
            <span className="text-slate-400">BEST: </span>
            <strong className="text-emerald-400 text-sm">{highScore}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundFX.enabled = next;
            }}
            className="min-h-[40px] min-w-[40px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
            title={soundEnabled ? 'Mute Synth Audio' : 'Unmute Synth Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* STATE 1: TITLE MENU */}
      {gameState === 'TITLE_MENU' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 py-4">
          {MISSIONS.map((m, idx) => {
            const p = PARTICLES[m.particleId];
            return (
              <div
                key={m.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-sky-500/60 rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-sky-400">
                    <span>{m.subtitle}</span>
                    <span>Target: {m.targetEnergyMeV.toFixed(1)} MeV</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{m.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{m.description}</p>
                  <div className="pt-2 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>
                      Ion: <strong className="text-slate-200">{p.name} ({p.symbol})</strong>
                    </div>
                    <div>
                      Field: <strong className="text-teal-300">B = {m.magneticFieldT} T</strong> · Gap:{' '}
                      <strong className="text-amber-300">U = {m.voltageKV} kV</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startMission(idx)}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Launch Mission {idx + 1}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* STATE 2: ACTIVE GAMEPLAY */}
      {gameState === 'PLAYING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-8">
            <div className="relative w-full h-[360px] sm:h-[430px] rounded-xl overflow-hidden border border-slate-800">
              <canvas
                ref={canvasRef}
                onClick={handlePolarityFlip}
                className="w-full h-full block cursor-pointer"
              />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-xs font-semibold text-sky-400">{mission.title}</div>

              {/* Energy Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Beam Energy E_kin</span>
                  <span className="text-sky-300 font-bold">
                    {hudData.energyMeV.toFixed(2)} / {mission.targetEnergyMeV.toFixed(2)} MeV
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400 transition-all duration-150"
                    style={{
                      width: `${Math.min(
                        100,
                        (hudData.energyMeV / mission.targetEnergyMeV) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Beam Stability Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Phase Lock Stability</span>
                  <span className="text-emerald-300 font-bold">
                    {hudData.beamStability}% · {hudData.beamStability > 50 ? 'STABLE' : 'CRITICAL'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      hudData.beamStability > 50 ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${hudData.beamStability}%` }}
                  />
                </div>
              </div>

              {/* Time Remaining & Relativistic Gamma */}
              <div className="grid grid-cols-2 gap-2 pt-2 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">TIME LEFT</div>
                  <div className="text-sm font-bold text-amber-300">
                    {hudData.timeLeft.toFixed(1)}s
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">LORENTZ γ</div>
                  <div className="text-sm font-bold text-purple-300">
                    {hudData.gamma.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Big Tactile Pulse Trigger Button */}
              <button
                type="button"
                onClick={handlePolarityFlip}
                className={`w-full min-h-[52px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-lg ${
                  hudData.inGapZone
                    ? 'bg-amber-400 text-slate-950 shadow-amber-400/25'
                    : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                }`}
              >
                <Zap className="w-5 h-5" />
                FLIP GAP POLARITY [SPACE]
              </button>

              {/* Direct Target Fire Button */}
              <button
                type="button"
                onClick={handleFireBeamAtTarget}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-500/25 border border-emerald-400/60 hover:bg-emerald-500/35 text-emerald-300 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Target className="w-4 h-4 text-emerald-400" />
                🎯 FIRE BEAM AT TARGET NOW
              </button>

              {lastFeedback && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-mono border ${
                    lastFeedback.type === 'perfect'
                      ? 'bg-sky-950/60 border-sky-500/50 text-sky-200'
                      : lastFeedback.type === 'good'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  }`}
                >
                  {lastFeedback.text}
                </div>
              )}

              <button
                type="button"
                onClick={() => setGameState('TITLE_MENU')}
                className="w-full min-h-[38px] text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                ← Back to Mission Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: ROUND SUMMARY / VICTORY */}
      {gameState === 'ROUND_SUMMARY' && (
        <div className="p-6 rounded-xl bg-slate-950/90 border border-emerald-500/50 text-center space-y-4 max-w-xl mx-auto my-4">
          <Award className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-xl font-bold text-slate-100">
            Target Extraction Achieved! ({mission.targetEnergyMeV.toFixed(2)} MeV)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            You kept the alternating electric field synchronized with the {particle.name} beam all the way to extraction radius R_max!
          </p>
          <div className="grid grid-cols-3 gap-3 font-mono text-xs py-2">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">TOTAL SCORE</div>
              <div className="text-base font-bold text-sky-400 mt-1">{score}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">MAX COMBO</div>
              <div className="text-base font-bold text-amber-400 mt-1">{maxCombo}×</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">FINAL γ</div>
              <div className="text-base font-bold text-purple-400 mt-1">
                {hudData.gamma.toFixed(3)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {missionIdx < MISSIONS.length - 1 ? (
              <button
                type="button"
                onClick={() => startMission(missionIdx + 1)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Next Mission →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startMission(0)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Play Campaign Again
              </button>
            )}
            <button
              type="button"
              onClick={() => setGameState('TITLE_MENU')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs cursor-pointer"
            >
              Mission Menu
            </button>
          </div>
        </div>
      )}

      {/* STATE 4: GAME OVER */}
      {gameState === 'GAME_OVER' && (
        <div className="p-6 rounded-xl bg-slate-950/90 border border-rose-500/50 text-center space-y-4 max-w-xl mx-auto my-4">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-xl font-bold text-slate-100">
            Resonance Lost — Beam De-Synchronized!
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            When the AC voltage flips while the ion is away from the gap, the opposing electric field decelerates the beam.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startMission(missionIdx)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Mission
            </button>
            <button
              type="button"
              onClick={() => setGameState('TITLE_MENU')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs cursor-pointer"
            >
              Mission Select
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
