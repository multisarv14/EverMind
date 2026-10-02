"use client";

import { useState } from "react";

export interface Bar {
  label: string; // short axis label
  full: string; // tooltip title
  value: number;
}

const W = 640;
const H = 190;
const PAD = { l: 38, r: 8, t: 10, b: 24 };

function niceMax(v: number) {
  if (v <= 4) return 4;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

/** A single-series column chart: thin rounded bars on one baseline, hover tooltip and a table view. */
export default function BarChart({ title, unit, bars }: { title: string; unit: string; bars: Bar[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  const max = niceMax(Math.max(...bars.map((b) => b.value), 1));
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const band = innerW / bars.length;
  const barW = Math.min(24, band * 0.6);
  const y = (v: number) => PAD.t + innerH - (v / max) * innerH;
  const ticks = [0, max / 2, max];
  const total = bars.reduce((a, b) => a + b.value, 0);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-white">{title}</h3>
          <p className="text-[12px] text-white/50">{total.toLocaleString()} {unit} in the last {bars.length} days</p>
        </div>
        <button onClick={() => setTable((t) => !t)} className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-white/60 hover:bg-white/5">
          {table ? "Chart view" : "Table view"}
        </button>
      </div>

      {table ? (
        <div className="mt-3 max-h-[210px] overflow-y-auto">
          <table className="w-full text-left text-[12px]">
            <thead><tr className="text-white/45"><th className="py-1 font-medium">Day</th><th className="py-1 text-right font-medium">{unit}</th></tr></thead>
            <tbody>
              {bars.map((b) => (
                <tr key={b.full} className="border-t border-white/[0.05] text-white/80"><td className="py-1">{b.full}</td><td className="py-1 text-right">{b.value.toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-3" onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${title}: ${total} ${unit} over ${bars.length} days`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-white/10" strokeWidth={1} />
                <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize={10} fill="currentColor" className="text-white/45">
                  {t >= 1000 ? `${Math.round(t / 100) / 10}k` : Math.round(t)}
                </text>
              </g>
            ))}
            {bars.map((b, i) => {
              const x = PAD.l + band * i + (band - barW) / 2;
              const top = y(b.value);
              const h = PAD.t + innerH - top;
              const r = Math.min(4, h, barW / 2);
              return (
                <g key={b.full} onMouseEnter={() => setHover(i)}>
                  <rect x={PAD.l + band * i} y={PAD.t} width={band} height={innerH} fill="transparent" />
                  {b.value > 0 && (
                    <path
                      d={`M${x},${PAD.t + innerH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${PAD.t + innerH} Z`}
                      fill="var(--series-1)"
                      opacity={hover === null || hover === i ? 1 : 0.45}
                    />
                  )}
                  {(i % 2 === bars.length % 2 || bars.length <= 8) && (
                    <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="currentColor" className="text-white/45">{b.label}</text>
                  )}
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute -top-1 rounded-lg border border-white/10 bg-[var(--card-bg)] px-2.5 py-1.5 text-[12px] shadow-lg"
              style={{ left: `${((PAD.l + band * hover + band / 2) / W) * 100}%`, transform: "translateX(-50%)" }}
            >
              <p className="text-white/55">{bars[hover].full}</p>
              <p className="font-semibold text-white">{bars[hover].value.toLocaleString()} {unit}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
