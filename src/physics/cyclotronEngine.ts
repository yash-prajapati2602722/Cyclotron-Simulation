export type ParticleTypeId = 'proton' | 'deuteron' | 'alpha';

export type SimulationMode = 'classic' | 'relativistic_unadjusted' | 'synchrocyclotron';

export type DiagramMode = 'none' | 'energy' | 'velocity' | 'radius' | 'frequency';

export interface ParticleSpec {
  id: ParticleTypeId;
  name: string;
  nameDe: string;
  symbol: string;
  chargeElementary: number; // in units of e
  massU: number; // in atomic mass units u
  chargeC: number; // Coulombs
  massKg: number; // Kilograms
  restEnergyMeV: number; // E_0 = m_0 * c^2 in MeV
  color: string;
  accentBg: string;
}

export const C_LIGHT = 2.99792458e8; // m/s
export const ELEMENTARY_CHARGE = 1.602176634e-19; // C
export const ATOMIC_MASS_UNIT = 1.6605390666e-27; // kg

export const PARTICLES: Record<ParticleTypeId, ParticleSpec> = {
  proton: {
    id: 'proton',
    name: 'Proton',
    nameDe: 'Proton',
    symbol: 'p⁺ (¹H⁺)',
    chargeElementary: 1,
    massU: 1.007276,
    chargeC: 1 * ELEMENTARY_CHARGE,
    massKg: 1.67262192e-27,
    restEnergyMeV: 938.272,
    color: '#38BDF8', // Sky 400
    accentBg: 'rgba(56, 189, 248, 0.15)',
  },
  deuteron: {
    id: 'deuteron',
    name: 'Deuteron',
    nameDe: 'Deuteron',
    symbol: 'd⁺ (²H⁺)',
    chargeElementary: 1,
    massU: 2.013553,
    chargeC: 1 * ELEMENTARY_CHARGE,
    massKg: 3.34358377e-27,
    restEnergyMeV: 1875.613,
    color: '#F59E0B', // Amber 500
    accentBg: 'rgba(245, 158, 11, 0.15)',
  },
  alpha: {
    id: 'alpha',
    name: 'Alpha Particle',
    nameDe: 'α-Teilchen',
    symbol: 'α²⁺ (⁴He²⁺)',
    chargeElementary: 2,
    massU: 4.001506,
    chargeC: 2 * ELEMENTARY_CHARGE,
    massKg: 6.64465733e-27,
    restEnergyMeV: 3727.379,
    color: '#10B981', // Emerald 500
    accentBg: 'rgba(16, 185, 129, 0.15)',
  },
};

export interface SimulationParams {
  particleId: ParticleTypeId;
  magneticFieldT: number; // Tesla (0.1 to 2.0 T, matching Virtuelle Experimente)
  voltageV: number; // Accelerating voltage in Volts (1,000 V to 100,000 V, matching Virtuelle Experimente)
  deeRadiusM: number; // Maximum extraction radius in meters (default 0.20 m = 20 cm, adjustable 0.15 to 0.50 m)
  gapWidthM: number; // Accelerating gap width in meters (default 0.018 m)
  mode: SimulationMode;
  diagramMode: DiagramMode; // 'none' | 'energy' | 'velocity' | 'radius' | 'frequency'
  speedMultiplier: number; // 0.5x, 1x, 2x, 4x (2x checkbox on Virtuelle Experimente)
  bfieldDirection: 'out' | 'in';
}

export interface TrajectoryPoint {
  x: number; // meters
  y: number; // meters
  keKeV: number;
  inGap: boolean;
}

export interface TelemetryDataPoint {
  timeNs: number; // nanoseconds
  halfTurns: number; // n (number of gap passages)
  kineticEnergyKeV: number; // in keV
  kineticEnergyMeV: number; // in MeV
  velocity10_6Ms: number; // in 10^6 m/s (exact unit on Virtuelle Experimente)
  velocityPercentC: number;
  radiusM: number; // in meters
  radiusCm: number; // in cm
  gamma: number;
  frequencyMHz: number;
  phaseSlipDeg: number;
}

export interface SimulationState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  timeS: number;
  gapCrossings: number;
  gamma: number;
  kineticEnergyKeV: number;
  kineticEnergyMeV: number;
  speedMs: number;
  currentRadiusM: number;
  classicalFreqHz: number;
  particleFreqHz: number;
  appliedRfFreqHz: number;
  instantVoltageV: number;
  phaseLagDeg: number;
  targetHit: boolean;
  status: 'idle' | 'accelerating' | 'extracted' | 'decelerating_phase_slip';
  trail: TrajectoryPoint[];
  history: TelemetryDataPoint[];
}

export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  params: Partial<SimulationParams>;
  learningNote: string;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'exp_2_4_1_a',
    title: '1. Classic Proton (V = 4000 V, B = 0.1 T)',
    subtitle: 'Manual Exp 2.4.1(a)',
    description: 'Exact setup from Lab Manual section 2.4.1(a): V = 4000 V, B = 0.1 T, R_max = 0.20 m.',
    params: {
      particleId: 'proton',
      voltageV: 4000,
      magneticFieldT: 0.1,
      deeRadiusM: 0.2,
      mode: 'classic',
      diagramMode: 'energy',
    },
    learningNote: 'In classical mode at V = 4000 V and B = 0.1 T, each gap crossing adds ΔE = q·V = 4 keV. Because T = 2πm/(qB) is constant, the proton spirals out to r = 0.20 m and fires straight into the Target.',
  },
  {
    id: 'exp_2_4_1_b',
    title: '2. V_max/B & Frequency (V = 2000 V, B = 0.2 T)',
    subtitle: 'Manual Exp 2.4.1(b)',
    description: 'Measure V_max/B ratio and cyclotron frequency f (MHz) for Proton, Deuteron, and Alpha.',
    params: {
      particleId: 'proton',
      voltageV: 2000,
      magneticFieldT: 0.2,
      deeRadiusM: 0.2,
      mode: 'classic',
      diagramMode: 'velocity',
    },
    learningNote: 'At constant extraction radius R_max = 0.20 m, V_max = (q/m)·R_max·B, so the ratio V_max / B remains constant (~19.14 × 10⁶ m/(s·T) for protons) regardless of B!',
  },
  {
    id: 'exp_2_4_2_1',
    title: '3. Relativistic Unadjusted (V = 100 kV, B = 2.0 T)',
    subtitle: 'Manual Exp 2.4.2.1',
    description: 'Relativistic without frequency adjustment at V = 100,000 V and B = 2.0 T.',
    params: {
      particleId: 'proton',
      voltageV: 100000,
      magneticFieldT: 2.0,
      deeRadiusM: 0.2,
      mode: 'relativistic_unadjusted',
      diagramMode: 'velocity',
    },
    learningNote: 'Without frequency adjustment, relativistic mass increase m = γ·m₀ lowers the particle orbital frequency f = f₀/γ. The ion arrives late at the gap and decelerates before reaching the Target.',
  },
  {
    id: 'exp_2_4_2_2',
    title: '4. Synchro-Cyclotron (V = 100 kV, B = 2.0 T)',
    subtitle: 'Manual Exp 2.4.2.2',
    description: 'Relativistic with dynamic frequency adjustment (Synchro-Cyclotron) at V = 100,000 V, B = 2.0 T.',
    params: {
      particleId: 'proton',
      voltageV: 100000,
      magneticFieldT: 2.0,
      deeRadiusM: 0.2,
      mode: 'synchrocyclotron',
      diagramMode: 'energy',
    },
    learningNote: 'With dynamic frequency adjustment f_RF = f₀ / γ, the alternating voltage tracks the relativistic mass increase, allowing the beam to reach full extraction velocity and strike the Target!',
  },
];

/**
 * Create initial particle state at the central ion source
 */
export function createInitialSimulationState(params: SimulationParams): SimulationState {
  const particle = PARTICLES[params.particleId];
  const classicalFreqHz = (particle.chargeC * params.magneticFieldT) / (2 * Math.PI * particle.massKg);

  // Small initial injection kinetic energy leaving ion source
  const initialKeEv = Math.min(500, params.voltageV * 0.25);
  const initialKeJoules = initialKeEv * ELEMENTARY_CHARGE;
  const v0 = Math.sqrt((2 * initialKeJoules) / particle.massKg);
  const r0 = (particle.massKg * v0) / (particle.chargeC * params.magneticFieldT);

  return {
    x: 0,
    y: 0,
    vx: v0,
    vy: 0,
    timeS: 0,
    gapCrossings: 0,
    gamma: 1.0,
    kineticEnergyKeV: initialKeEv / 1000,
    kineticEnergyMeV: initialKeEv / 1e6,
    speedMs: v0,
    currentRadiusM: r0,
    classicalFreqHz,
    particleFreqHz: classicalFreqHz,
    appliedRfFreqHz: classicalFreqHz,
    instantVoltageV: params.voltageV,
    phaseLagDeg: 0,
    targetHit: false,
    status: 'idle',
    trail: [{ x: 0, y: 0, keKeV: initialKeEv / 1000, inGap: true }],
    history: [
      {
        timeNs: 0,
        halfTurns: 0,
        kineticEnergyKeV: Number((initialKeEv / 1000).toFixed(2)),
        kineticEnergyMeV: Number((initialKeEv / 1e6).toFixed(4)),
        velocity10_6Ms: Number((v0 / 1e6).toFixed(3)),
        velocityPercentC: Number(((v0 / C_LIGHT) * 100).toFixed(2)),
        radiusM: Number(r0.toFixed(4)),
        radiusCm: Number((r0 * 100).toFixed(2)),
        gamma: 1.0,
        frequencyMHz: Number((classicalFreqHz / 1e6).toFixed(2)),
        phaseSlipDeg: 0,
      },
    ],
  };
}

/**
 * Immediately extract the particle into the electrostatic deflector channel aimed at the Target
 */
export function triggerImmediateTargetExtraction(
  state: SimulationState,
  params: SimulationParams
): SimulationState {
  const particle = PARTICLES[params.particleId];
  const q = particle.chargeC;
  const m0 = particle.massKg;
  const rMax = params.deeRadiusM * 0.94;
  const exitY = (params.bfieldDirection === 'out' ? 1 : -1) * rMax;

  const vMax = (q * params.magneticFieldT * params.deeRadiusM) / m0;
  const keMaxJoules = 0.5 * m0 * vMax * vMax;
  const keMaxKeV = keMaxJoules / (1e3 * ELEMENTARY_CHARGE);
  const keMaxMeV = keMaxJoules / (1e6 * ELEMENTARY_CHARGE);
  const estPassages = Math.max(state.gapCrossings, Math.ceil(keMaxJoules / (q * params.voltageV)));

  // Generate a clean spiral trail leading up to the extraction channel if not already near rMax
  const spiralPoints: TrajectoryPoint[] = [];
  const totalSteps = 220;
  const bSign = params.bfieldDirection === 'out' ? 1 : -1;
  for (let i = 0; i <= totalSteps; i++) {
    const frac = i / totalSteps;
    const r = frac * rMax;
    const theta = frac * 7 * Math.PI * 2;
    // Ensure it ends at (0, exitY) moving in +x direction
    const angle = bSign > 0 ? Math.PI / 2 - theta : -Math.PI / 2 + theta;
    const sx = r * Math.cos(angle);
    const sy = r * Math.sin(angle);
    spiralPoints.push({
      x: sx,
      y: sy,
      keKeV: frac * frac * keMaxKeV,
      inGap: Math.abs(sx) < params.gapWidthM / 2,
    });
  }

  return {
    ...state,
    x: 0,
    y: exitY,
    vx: vMax,
    vy: 0,
    speedMs: vMax,
    currentRadiusM: params.deeRadiusM,
    kineticEnergyKeV: keMaxKeV,
    kineticEnergyMeV: keMaxMeV,
    gapCrossings: estPassages,
    targetHit: false,
    status: 'extracted',
    trail: spiralPoints,
  };
}

/**
 * Advance cyclotron physics simulation by one visual frame
 */
export function stepCyclotronPhysics(
  state: SimulationState,
  params: SimulationParams,
  frameDeltaSec: number
): SimulationState {
  const targetX = params.deeRadiusM * 1.12;
  const exitY = (params.bfieldDirection === 'out' ? 1 : -1) * params.deeRadiusM * 0.94;

  // Handle extracted beam traveling down the electrostatic deflector channel to strike the Target
  if (state.status === 'extracted') {
    if (state.targetHit || state.x >= targetX) {
      return {
        ...state,
        x: targetX,
        y: exitY,
        targetHit: true,
      };
    }

    const stepX = params.deeRadiusM * 1.65 * Math.min(frameDeltaSec, 0.05) * Math.max(1, params.speedMultiplier);
    const nx = Math.min(targetX, state.x + stepX);
    const ny = exitY;
    const hitNow = nx >= targetX - 0.002;
    if (hitNow && !state.targetHit && typeof window !== 'undefined') {
      const bridge = (window as unknown as { AndroidZyklotronBridge?: { triggerTargetHitHaptic?: () => void } }).AndroidZyklotronBridge;
      bridge?.triggerTargetHitHaptic?.();
    }
    const nextTrail = [
      ...state.trail,
      { x: nx, y: ny, keKeV: state.kineticEnergyKeV, inGap: false },
    ];

    return {
      ...state,
      x: nx,
      y: ny,
      targetHit: hitNow,
      trail: nextTrail.length > 1800 ? nextTrail.slice(nextTrail.length - 1800) : nextTrail,
    };
  }

  const particle = PARTICLES[params.particleId];
  const q = particle.chargeC;
  const m0 = particle.massKg;
  const BSign = params.bfieldDirection === 'out' ? 1 : -1;
  const Bz = params.magneticFieldT * BSign;

  // Classical cyclotron frequency f_0 = q B / (2 pi m0)
  const f0 = (q * params.magneticFieldT) / (2 * Math.PI * m0);
  const classicalPeriod = 1 / f0;

  // Compute expected revolutions to reach R_max so low-voltage / high-B runs don't take minutes
  const vMaxClassical = (q * params.magneticFieldT * params.deeRadiusM) / m0;
  const keMaxClassicalJ = 0.5 * m0 * vMaxClassical * vMaxClassical;
  const expectedRevolutions = Math.max(2, keMaxClassicalJ / (2 * q * params.voltageV));
  // Aim to complete the spiral to the target in ~6-8 seconds at 1x speed
  const adaptiveBaseRate = Math.max(0.95, Math.min(5.5, expectedRevolutions / 6.5));
  const targetRevsPerRealSecond = adaptiveBaseRate * params.speedMultiplier;
  const totalSimDt = Math.min(frameDeltaSec, 0.05) * targetRevsPerRealSecond * classicalPeriod;

  const subSteps = 48;
  const dt = totalSimDt / subSteps;

  let { x, y, vx, vy, timeS, gapCrossings } = state;
  let status: SimulationState['status'] = 'accelerating';
  const newTrailPoints: TrajectoryPoint[] = [];
  const newHistoryPoints: TelemetryDataPoint[] = [];

  // Pedagogical relativistic scaling matching Virtuelle-Experimente.de
  const cEffective = params.mode === 'classic' ? C_LIGHT : C_LIGHT * 0.14;
  const halfGap = params.gapWidthM / 2;

  for (let i = 0; i < subSteps; i++) {
    const prevX = x;
    const vSq = vx * vx + vy * vy;

    let gamma = 1.0;
    if (params.mode !== 'classic') {
      const betaSq = Math.min(0.92, vSq / (cEffective * cEffective));
      gamma = 1 / Math.sqrt(1 - betaSq);
    }

    const effectiveMass = m0 * gamma;
    const particleFreq = f0 / gamma;
    const appliedRfFreq = params.mode === 'synchrocyclotron' ? particleFreq : f0;

    const inGap = Math.abs(x) <= halfGap;

    let phaseAngle = 2 * Math.PI * f0 * timeS;
    if (params.mode === 'synchrocyclotron' || params.mode === 'classic') {
      phaseAngle = vx >= 0 ? 0 : Math.PI;
    }

    const cosPhase = Math.cos(phaseAngle);
    const instantVoltageV = params.voltageV * cosPhase;

    const Ex = inGap ? instantVoltageV / params.gapWidthM : 0;

    const ax = (q / effectiveMass) * (Ex + vy * Bz);
    const ay = (q / effectiveMass) * (-vx * Bz);

    const vxMid = vx + 0.5 * ax * dt;
    const vyMid = vy + 0.5 * ay * dt;

    x += vxMid * dt;
    y += vyMid * dt;

    const inGapNext = Math.abs(x) <= halfGap;
    const ExNext = inGapNext ? instantVoltageV / params.gapWidthM : 0;
    const axNext = (q / effectiveMass) * (ExNext + vyMid * Bz);
    const ayNext = (q / effectiveMass) * (-vxMid * Bz);

    vx = vxMid + 0.5 * axNext * dt;
    vy = vyMid + 0.5 * ayNext * dt;
    timeS += dt;

    // Detect gap centerline (x = 0) crossing
    if ((prevX < 0 && x >= 0) || (prevX > 0 && x <= 0)) {
      gapCrossings += 1;
      const speedNow = Math.hypot(vx, vy);
      const keJoules =
        params.mode === 'classic'
          ? 0.5 * m0 * speedNow * speedNow
          : (gamma - 1) * m0 * cEffective * cEffective;
      const keKeVNow = keJoules / (1e3 * ELEMENTARY_CHARGE);
      const keMeVNow = keJoules / (1e6 * ELEMENTARY_CHARGE);
      const radiusNow = (effectiveMass * speedNow) / (q * params.magneticFieldT);

      const idealPhase = vx >= 0 ? 0 : Math.PI;
      const rawDiff = ((phaseAngle - idealPhase) * 180) / Math.PI;
      const normalizedSlip = ((((rawDiff + 180) % 360) + 360) % 360) - 180;

      newHistoryPoints.push({
        timeNs: Number((timeS * 1e9).toFixed(1)),
        halfTurns: gapCrossings,
        kineticEnergyKeV: Number(keKeVNow.toFixed(2)),
        kineticEnergyMeV: Number(keMeVNow.toFixed(4)),
        velocity10_6Ms: Number((speedNow / 1e6).toFixed(3)),
        velocityPercentC: Number(((speedNow / C_LIGHT) * 100).toFixed(2)),
        radiusM: Number(radiusNow.toFixed(4)),
        radiusCm: Number((radiusNow * 100).toFixed(2)),
        gamma: Number(gamma.toFixed(4)),
        frequencyMHz: Number((appliedRfFreq / 1e6).toFixed(2)),
        phaseSlipDeg: Number(Math.abs(normalizedSlip).toFixed(1)),
      });

      // Check if the ion has reached the extraction radius AND is crossing the gap moving right (+x)
      // toward the Electrostatic Extraction Deflector Channel at exitY!
      if (radiusNow >= params.deeRadiusM * 0.90 && vx > 0) {
        status = 'extracted';
        x = 0;
        y = exitY;
        vx = speedNow;
        vy = 0;
        newTrailPoints.push({
          x,
          y,
          keKeV: keKeVNow,
          inGap: false,
        });
        break;
      }
    }

    // Fallback safety extraction if a single large voltage step pushes radius past 0.96 * deeRadiusM
    const currentDist = Math.hypot(x, y);
    if (currentDist >= params.deeRadiusM * 0.96 && vx > 0 && (BSign > 0 ? y > 0 : y < 0)) {
      const speedNow = Math.hypot(vx, vy);
      status = 'extracted';
      x = Math.max(0, x);
      y = exitY;
      vx = speedNow;
      vy = 0;
      break;
    }

    if (i % 6 === 0) {
      const speedSample = Math.hypot(vx, vy);
      const keSampleJ =
        params.mode === 'classic'
          ? 0.5 * m0 * speedSample * speedSample
          : (gamma - 1) * m0 * cEffective * cEffective;
      newTrailPoints.push({
        x,
        y,
        keKeV: keSampleJ / (1e3 * ELEMENTARY_CHARGE),
        inGap: inGapNext,
      });
    }
  }

  const finalSpeed = Math.hypot(vx, vy);
  let finalGamma = 1.0;
  if (params.mode !== 'classic') {
    const betaSq = Math.min(0.92, (finalSpeed * finalSpeed) / (cEffective * cEffective));
    finalGamma = 1 / Math.sqrt(1 - betaSq);
  }

  const finalKeJoules =
    params.mode === 'classic'
      ? 0.5 * m0 * finalSpeed * finalSpeed
      : (finalGamma - 1) * m0 * cEffective * cEffective;
  const finalKeKeV = finalKeJoules / (1e3 * ELEMENTARY_CHARGE);
  const finalKeMeV = finalKeJoules / (1e6 * ELEMENTARY_CHARGE);
  const finalRadiusM =
    status === 'extracted'
      ? params.deeRadiusM
      : (m0 * finalGamma * finalSpeed) / (q * params.magneticFieldT);

  const particleFreqHz = f0 / finalGamma;
  const appliedRfFreqHz = params.mode === 'synchrocyclotron' ? particleFreqHz : f0;

  let phaseAngleNow = 2 * Math.PI * f0 * timeS;
  if (params.mode === 'synchrocyclotron' || params.mode === 'classic') {
    phaseAngleNow = vx >= 0 ? 0 : Math.PI;
  }
  const instantVoltageV = params.voltageV * Math.cos(phaseAngleNow);

  const idealPhaseNow = vx >= 0 ? 0 : Math.PI;
  const rawPhaseDiff = ((phaseAngleNow - idealPhaseNow) * 180) / Math.PI;
  const phaseLagDeg = Math.abs(((((rawPhaseDiff + 180) % 360) + 360) % 360) - 180);

  if (status !== 'extracted' && params.mode === 'relativistic_unadjusted' && phaseLagDeg > 90) {
    status = 'decelerating_phase_slip';
  }

  const combinedTrail = [...state.trail, ...newTrailPoints];
  const trimmedTrail =
    combinedTrail.length > 1800 ? combinedTrail.slice(combinedTrail.length - 1800) : combinedTrail;

  const combinedHistory = [...state.history, ...newHistoryPoints];
  const trimmedHistory =
    combinedHistory.length > 140
      ? combinedHistory.slice(combinedHistory.length - 140)
      : combinedHistory;

  return {
    x,
    y,
    vx,
    vy,
    timeS,
    gapCrossings,
    gamma: finalGamma,
    kineticEnergyKeV: finalKeKeV,
    kineticEnergyMeV: finalKeMeV,
    speedMs: finalSpeed,
    currentRadiusM: finalRadiusM,
    classicalFreqHz: f0,
    particleFreqHz,
    appliedRfFreqHz,
    instantVoltageV,
    phaseLagDeg,
    targetHit: false,
    status,
    trail: trimmedTrail,
    history: trimmedHistory,
  };
}
