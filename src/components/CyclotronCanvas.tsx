import React, { useEffect, useRef } from 'react';
import {
  PARTICLES,
  SimulationParams,
  SimulationState,
  ELEMENTARY_CHARGE,
} from '../physics/cyclotronEngine';

interface CyclotronCanvasProps {
  simState: SimulationState;
  params: SimulationParams;
  viewAngle: 'top' | 'isometric';
  showForceVectors: boolean;
  showBFieldGrid: boolean;
  showEFieldLines: boolean;
}

export const CyclotronCanvas: React.FC<CyclotronCanvasProps> = ({
  simState,
  params,
  viewAngle,
  showForceVectors,
  showBFieldGrid,
  showEFieldLines,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(200, rect.width || 600);
    const height = Math.max(200, rect.height || 460);
    if (
      canvas.width !== Math.floor(width * dpr) ||
      canvas.height !== Math.floor(height * dpr)
    ) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;

    // Clear laboratory dark background
    ctx.fillStyle = '#0B1120';
    ctx.fillRect(0, 0, width, height);

    // Coordinate scaling: map deeRadiusM to ~39% of min(width, height)
    const minDim = Math.min(width, height);
    const scale = (minDim * 0.39) / params.deeRadiusM;
    const deeRadiusPx = Math.max(20, params.deeRadiusM * scale);
    const gapHalfPx = Math.max(12, (params.gapWidthM / 2) * scale);

    if (viewAngle === 'isometric') {
      ctx.translate(cx, cy);
      ctx.scale(1, 0.66);
      ctx.rotate(-0.18);
      ctx.translate(-cx, -cy);
    }

    // 1. Subtle Radial Polar Grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let rFrac = 0.25; rFrac <= 1.25; rFrac += 0.25) {
      ctx.beginPath();
      ctx.arc(cx, cy, deeRadiusPx * rFrac, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(cx - deeRadiusPx * 1.28, cy);
    ctx.lineTo(cx + deeRadiusPx * 1.28, cy);
    ctx.moveTo(cx, cy - deeRadiusPx * 1.28);
    ctx.lineTo(cx, cy + deeRadiusPx * 1.28);
    ctx.stroke();

    // 2. Magnetic Field Grid (B-Field symbols: ⊙ Out of Page or ⊗ Into Page)
    if (showBFieldGrid) {
      const gridSpacing = Math.max(36, deeRadiusPx * 0.26);
      const bAlpha = Math.min(0.55, 0.15 + (params.magneticFieldT / 2.0) * 0.4);
      ctx.strokeStyle = `rgba(45, 212, 191, ${bAlpha})`;
      ctx.fillStyle = `rgba(45, 212, 191, ${bAlpha})`;
      ctx.lineWidth = 1.2;

      for (let gx = -deeRadiusPx * 1.05; gx <= deeRadiusPx * 1.05; gx += gridSpacing) {
        for (let gy = -deeRadiusPx * 1.05; gy <= deeRadiusPx * 1.05; gy += gridSpacing) {
          if (gx * gx + gy * gy <= deeRadiusPx * deeRadiusPx * 0.96) {
            const px = cx + gx;
            const py = cy + gy;

            if (viewAngle === 'isometric') {
              const arrowLen = 14 + params.magneticFieldT * 8;
              ctx.beginPath();
              ctx.moveTo(px, py + arrowLen / 2);
              ctx.lineTo(px, py - arrowLen / 2);
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.arc(px, py, 6, 0, Math.PI * 2);
              ctx.stroke();

              if (params.bfieldDirection === 'out') {
                ctx.beginPath();
                ctx.arc(px, py, 1.8, 0, Math.PI * 2);
                ctx.fill();
              } else {
                ctx.beginPath();
                ctx.moveTo(px - 3.5, py - 3.5);
                ctx.lineTo(px + 3.5, py + 3.5);
                ctx.moveTo(px + 3.5, py - 3.5);
                ctx.lineTo(px - 3.5, py + 3.5);
                ctx.stroke();
              }
            }
          }
        }
      }
    }

    // 3. Render Left & Right Hollow Metal Dees (D1 & D2)
    const vNorm = Math.max(
      -1,
      Math.min(1, simState.instantVoltageV / Math.max(1, params.voltageV))
    );
    const leftPositive = vNorm >= 0;
    const polarityIntensity = Math.abs(vNorm);

    const drawDee = (side: 'left' | 'right') => {
      const isPos = side === 'left' ? leftPositive : !leftPositive;
      const baseColor = isPos
        ? `rgba(244, 63, 94, ${0.12 + 0.16 * polarityIntensity})`
        : `rgba(56, 189, 248, ${0.12 + 0.16 * polarityIntensity})`;
      const borderColor = isPos
        ? `rgba(251, 113, 133, ${0.45 + 0.45 * polarityIntensity})`
        : `rgba(56, 189, 248, ${0.45 + 0.45 * polarityIntensity})`;

      ctx.save();
      ctx.beginPath();
      if (side === 'left') {
        ctx.arc(cx - gapHalfPx, cy, deeRadiusPx, Math.PI / 2, (3 * Math.PI) / 2, false);
        ctx.closePath();
      } else {
        ctx.arc(cx + gapHalfPx, cy, deeRadiusPx, -Math.PI / 2, Math.PI / 2, false);
        ctx.closePath();
      }

      ctx.fillStyle = baseColor;
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = borderColor;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    drawDee('left');
    drawDee('right');

    // 4. Electric Field Lines in the Accelerating Gap
    if (showEFieldLines && Math.abs(vNorm) > 0.05) {
      const numArrows = 9;
      const stepY = (deeRadiusPx * 1.7) / (numArrows - 1);
      const startY = cy - deeRadiusPx * 0.85;
      const dir = vNorm >= 0 ? 1 : -1;

      ctx.save();
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.35 + 0.55 * polarityIntensity})`;
      ctx.fillStyle = `rgba(251, 191, 36, ${0.45 + 0.55 * polarityIntensity})`;
      ctx.lineWidth = 1.6;

      for (let i = 0; i < numArrows; i++) {
        const yPos = startY + i * stepY;
        const xStart = cx - dir * (gapHalfPx - 3);
        const xEnd = cx + dir * (gapHalfPx - 3);

        ctx.beginPath();
        ctx.moveTo(xStart, yPos);
        ctx.lineTo(xEnd, yPos);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xEnd, yPos);
        ctx.lineTo(xEnd - dir * 5, yPos - 3.5);
        ctx.lineTo(xEnd - dir * 5, yPos + 3.5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. Extraction Deflector Channel & Target Detector Box
    ctx.save();
    const exitY =
      params.bfieldDirection === 'out'
        ? cy + deeRadiusPx * 0.94
        : cy - deeRadiusPx * 0.94;
    const targetX = cx + deeRadiusPx * 1.12;

    // Deflector guide channel
    ctx.strokeStyle = simState.status === 'extracted' ? '#38BDF8' : '#94A3B8';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, exitY);
    ctx.lineTo(targetX, exitY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Target Detector Box at (targetX, exitY)
    ctx.fillStyle = simState.targetHit ? '#FBBF24' : '#10B981';
    ctx.strokeStyle = simState.targetHit ? '#FEF08A' : '#6EE7B7';
    ctx.lineWidth = 2;
    if (simState.targetHit) {
      ctx.shadowColor = '#FBBF24';
      ctx.shadowBlur = 18;
    }
    ctx.fillRect(targetX - 8, exitY - 12, 22, 24);
    ctx.strokeRect(targetX - 8, exitY - 12, 22, 24);
    ctx.shadowBlur = 0;

    // Target Impact Shockwave Rings when hit
    if (simState.targetHit) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(targetX + 2, exitY, 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(targetX + 2, exitY, 26, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = simState.targetHit ? '#FDE047' : '#6EE7B7';
    ctx.font = '700 10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(simState.targetHit ? '🎯 TARGET HIT!' : 'TARGET', targetX + 18, exitY + 4);
    ctx.restore();

    // 6. Central Ion Source Marker
    ctx.save();
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 7. Particle Spiral Trajectory Trail
    const particleSpec = PARTICLES[params.particleId];
    if (simState.trail.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      for (let i = 0; i < simState.trail.length; i++) {
        const pt = simState.trail[i];
        const px = cx + pt.x * scale;
        const py = cy + pt.y * scale;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.strokeStyle = particleSpec.color;
      ctx.lineWidth = 2.4;
      ctx.shadowColor = particleSpec.color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }

    // 8. Current Particle Position & Vector Overlays
    const partX = cx + simState.x * scale;
    const partY = cy + simState.y * scale;

    if (showForceVectors && simState.speedMs > 1000) {
      const vMag = Math.hypot(simState.vx, simState.vy);
      const ux = simState.vx / vMag;
      const uy = simState.vy / vMag;

      const vLen = Math.min(54, 24 + (simState.currentRadiusM / params.deeRadiusM) * 32);
      const vxEnd = partX + ux * vLen;
      const vyEnd = partY + uy * vLen;

      ctx.save();
      ctx.strokeStyle = '#34D399';
      ctx.fillStyle = '#34D399';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(partX, partY);
      ctx.lineTo(vxEnd, vyEnd);
      ctx.stroke();

      const vAngle = Math.atan2(uy, ux);
      ctx.beginPath();
      ctx.moveTo(vxEnd, vyEnd);
      ctx.lineTo(vxEnd - 7 * Math.cos(vAngle - 0.45), vyEnd - 7 * Math.sin(vAngle - 0.45));
      ctx.lineTo(vxEnd - 7 * Math.cos(vAngle + 0.45), vyEnd - 7 * Math.sin(vAngle + 0.45));
      ctx.closePath();
      ctx.fill();

      const bSign = params.bfieldDirection === 'out' ? 1 : -1;
      const fxDir = uy * bSign;
      const fyDir = -ux * bSign;
      const fLen = 34;
      const fxEnd = partX + fxDir * fLen;
      const fyEnd = partY + fyDir * fLen;

      ctx.strokeStyle = '#FB923C';
      ctx.fillStyle = '#FB923C';
      ctx.beginPath();
      ctx.moveTo(partX, partY);
      ctx.lineTo(fxEnd, fyEnd);
      ctx.stroke();

      const fAngle = Math.atan2(fyDir, fxDir);
      ctx.beginPath();
      ctx.moveTo(fxEnd, fyEnd);
      ctx.lineTo(fxEnd - 7 * Math.cos(fAngle - 0.45), fyEnd - 7 * Math.sin(fAngle - 0.45));
      ctx.lineTo(fxEnd - 7 * Math.cos(fAngle + 0.45), fyEnd - 7 * Math.sin(fAngle + 0.45));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = particleSpec.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(partX, partY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = particleSpec.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(partX, partY, 8.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // 9. Crisp 2D Canvas Annotations
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.font = '600 12px "IBM Plex Mono", monospace';

    const leftSign = leftPositive ? '+' : '−';
    ctx.fillStyle = leftPositive ? '#FDA4AF' : '#7DD3FC';
    ctx.textAlign = 'right';
    ctx.fillText(`Dee 1 (${leftSign})`, cx - gapHalfPx - 14, 26);

    const rightSign = !leftPositive ? '+' : '−';
    ctx.fillStyle = !leftPositive ? '#FDA4AF' : '#7DD3FC';
    ctx.textAlign = 'left';
    ctx.fillText(`Dee 2 (${rightSign})`, cx + gapHalfPx + 14, 26);

    const oscY = height - 22;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - gapHalfPx - 24, oscY - 12);
    ctx.lineTo(cx - gapHalfPx - 24, oscY);
    ctx.lineTo(cx - 14, oscY);
    ctx.moveTo(cx + 14, oscY);
    ctx.lineTo(cx + gapHalfPx + 24, oscY);
    ctx.lineTo(cx + gapHalfPx + 24, oscY - 12);
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, oscY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 6, oscY);
    ctx.quadraticCurveTo(cx - 3, oscY - 5, cx, oscY);
    ctx.quadraticCurveTo(cx + 3, oscY + 5, cx + 6, oscY);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    const uSign = simState.instantVoltageV >= 0 ? '+' : '';
    ctx.fillText(
      `U(t) = ${uSign}${simState.instantVoltageV.toFixed(0)} V`,
      cx + gapHalfPx + 32,
      oscY + 4
    );

    const maxClassicKeKeV =
      (Math.pow(particleSpec.chargeC * params.magneticFieldT * params.deeRadiusM, 2) /
        (2 * particleSpec.massKg)) /
      (1e3 * ELEMENTARY_CHARGE);
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'left';
    ctx.fillText(
      `R_max = ${params.deeRadiusM.toFixed(2)} m · E_max ≈ ${
        maxClassicKeKeV >= 1000
          ? `${(maxClassicKeKeV / 1000).toFixed(2)} MeV`
          : `${maxClassicKeKeV.toFixed(1)} keV`
      }`,
      16,
      height - 16
    );

    ctx.restore();
  }, [simState, params, viewAngle, showForceVectors, showBFieldGrid, showEFieldLines]);

  return (
    <div className="relative w-full h-full min-h-[340px] sm:min-h-[440px] lg:min-h-[500px] flex items-center justify-center bg-[#0B1120] rounded-xl overflow-hidden border border-slate-800/90">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-label="Interactive Cyclotron Magnetic & Electric Field Simulation Canvas"
      />
    </div>
  );
};
