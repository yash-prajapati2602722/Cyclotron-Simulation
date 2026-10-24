import React from 'react';
import { DiagramMode, TelemetryDataPoint } from '../physics/cyclotronEngine';

interface LiveTelemetryChartsProps {
  history: TelemetryDataPoint[];
  diagramMode: DiagramMode;
  onChangeDiagramMode: (mode: DiagramMode) => void;
}

type ActiveChartMetric = Exclude<DiagramMode, 'none'>;

const METRIC_CONFIG: Record<
  ActiveChartMetric,
  {
    label: string;
    labelDe: string;
    dataKey: keyof TelemetryDataPoint;
    unit: string;
    formula: string;
    color: string;
  }
> = {
  energy: {
    label: 'Kinetic Energy E_kin',
    labelDe: 'Energie',
    dataKey: 'kineticEnergyKeV',
    unit: 'keV',
    formula: 'E_kin(n) = E_0 + n · q · U',
    color: '#38BDF8',
  },
  velocity: {
    label: 'Speed v (10⁶ m/s)',
    labelDe: 'Geschwindigkeit',
    dataKey: 'velocity10_6Ms',
    unit: '10⁶ m/s',
    formula: 'v = √(v₀² + 2·n·q·U / m)',
    color: '#34D399',
  },
  radius: {
    label: 'Cyclotron Radius r',
    labelDe: 'Radius',
    dataKey: 'radiusM',
    unit: 'm',
    formula: 'r = (γ · m₀ · v) / (q · B)',
    color: '#F59E0B',
  },
  frequency: {
    label: 'Frequency f',
    labelDe: 'Frequenz',
    dataKey: 'frequencyMHz',
    unit: 'MHz',
    formula: 'f = q · B / (2π · γ · m₀)',
    color: '#A78BFA',
  },
};

export const LiveTelemetryCharts: React.FC<LiveTelemetryChartsProps> = ({
  history,
  diagramMode,
  onChangeDiagramMode,
}) => {
  const effectiveMetric: ActiveChartMetric =
    diagramMode === 'none' ? 'energy' : diagramMode;
  const activeConfig = METRIC_CONFIG[effectiveMetric];

  const width = 560;
  const height = 210;
  const padLeft = 52;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const values = history.map((d) => Number(d[activeConfig.dataKey]));
  const maxVal = Math.max(...values, 0.1) * 1.12;
  const minVal =
    effectiveMetric === 'frequency'
      ? Math.max(0, Math.min(...values) * 0.85)
      : 0;
  const valSpan = Math.max(1e-4, maxVal - minVal);

  const maxTimeNs = Math.max(
    history.length > 0 ? history[history.length - 1].timeNs : 50,
    50
  );

  const points = history
    .map((pt) => {
      const x = padLeft + (pt.timeNs / maxTimeNs) * plotW;
      const val = Number(pt[activeConfig.dataKey]);
      const y = padTop + plotH - ((val - minVal) / valSpan) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const areaPoints =
    history.length > 1
      ? `${padLeft},${padTop + plotH} ${points} ${(
          padLeft +
          (history[history.length - 1].timeNs / maxTimeNs) * plotW
        ).toFixed(1)},${padTop + plotH}`
      : '';

  const latestPoint = history[history.length - 1];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Show Diagram (Diagramm — Virtuelle Experimente)
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {activeConfig.formula} · Time t (ns) &amp; Gap Passages (n ={' '}
            {latestPoint ? latestPoint.halfTurns : 0})
          </p>
        </div>

        {/* Exact Virtuelle-Experimente Diagramm Selector: None, Energy, Velocity, Radius, Frequency */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800/80 overflow-x-auto max-w-full">
          {(
            [
              { id: 'none', label: 'None (Keines)' },
              { id: 'energy', label: 'Energy (Energie)' },
              { id: 'velocity', label: 'Speed (Geschwindigkeit)' },
              { id: 'radius', label: 'Radius (r)' },
              { id: 'frequency', label: 'Freq (f)' },
            ] as { id: DiagramMode; label: string }[]
          ).map((item) => {
            const isSelected = diagramMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeDiagramMode(item.id)}
                className={`px-2.5 py-1.5 min-h-[34px] text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {diagramMode === 'none' ? (
        <div className="py-8 text-center text-xs font-mono text-slate-400 bg-slate-950/50 rounded-lg border border-slate-800/60">
          Diagram display set to <strong>None (Keines)</strong>. Select{' '}
          <button
            type="button"
            onClick={() => onChangeDiagramMode('energy')}
            className="text-sky-400 underline cursor-pointer"
          >
            Energy
          </button>{' '}
          or{' '}
          <button
            type="button"
            onClick={() => onChangeDiagramMode('velocity')}
            className="text-emerald-400 underline cursor-pointer"
          >
            Speed
          </button>{' '}
          to plot live cyclotron acceleration curves.
        </div>
      ) : (
        <>
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto block select-none"
              role="img"
              aria-label={`Plot of ${activeConfig.label} vs time`}
            >
              <defs>
                <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={activeConfig.color}
                    stopOpacity="0.28"
                  />
                  <stop
                    offset="100%"
                    stopColor={activeConfig.color}
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = padTop + plotH * (1 - t);
                const val = minVal + t * valSpan;
                return (
                  <g key={t}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={width - padRight}
                      y2={y}
                      stroke="rgba(148, 163, 184, 0.12)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padLeft - 6}
                      y={y + 3}
                      textAnchor="end"
                      fill="#64748B"
                      fontSize="10"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {val.toFixed(val >= 10 ? 1 : 2)}
                    </text>
                  </g>
                );
              })}

              <line
                x1={padLeft}
                y1={padTop}
                x2={padLeft}
                y2={padTop + plotH}
                stroke="#334155"
                strokeWidth="1.2"
              />
              <line
                x1={padLeft}
                y1={padTop + plotH}
                x2={width - padRight}
                y2={padTop + plotH}
                stroke="#334155"
                strokeWidth="1.2"
              />

              <text
                x={padLeft + plotW / 2}
                y={height - 6}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="10"
                fontFamily="IBM Plex Mono, monospace"
              >
                Time t = {latestPoint ? latestPoint.timeNs : 0} ns · Gap Passages n ={' '}
                {latestPoint ? latestPoint.halfTurns : 0}
              </text>

              {areaPoints && (
                <polygon points={areaPoints} fill="url(#chartAreaGrad)" />
              )}

              {history.length > 1 && (
                <polyline
                  fill="none"
                  stroke={activeConfig.color}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              )}

              {latestPoint && (
                <circle
                  cx={padLeft + (latestPoint.timeNs / maxTimeNs) * plotW}
                  cy={
                    padTop +
                    plotH -
                    ((Number(latestPoint[activeConfig.dataKey]) - minVal) /
                      valSpan) *
                      plotH
                  }
                  r="4"
                  fill="#F8FAFC"
                  stroke={activeConfig.color}
                  strokeWidth="2.5"
                />
              )}
            </svg>
          </div>

          {latestPoint && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
              <span>
                {activeConfig.label}:{' '}
                <strong className="text-slate-100">
                  {latestPoint[activeConfig.dataKey]} {activeConfig.unit}
                </strong>
              </span>
              <span>·</span>
              <span>
                v ={' '}
                <strong className="text-emerald-300">
                  {latestPoint.velocity10_6Ms} × 10⁶ m/s
                </strong>
              </span>
              <span>·</span>
              <span>
                E_kin ={' '}
                <strong className="text-sky-300">
                  {latestPoint.kineticEnergyKeV >= 1000
                    ? `${latestPoint.kineticEnergyMeV.toFixed(3)} MeV`
                    : `${latestPoint.kineticEnergyKeV.toFixed(1)} keV`}
                </strong>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
