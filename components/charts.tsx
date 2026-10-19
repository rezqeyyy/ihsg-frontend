"use client";
// Dependency-free SVG charts sized by viewBox so they scale with their container.
import { useEffect, useMemo, useRef, useState } from "react";

const UP = "var(--up)";
const DOWN = "var(--down)";

/* ------------------------------------------------------------------ helpers */
const extent = (vals: number[], pad = 0.06): [number, number] => {
  const v = vals.filter((x) => Number.isFinite(x));
  if (!v.length) return [0, 1];
  let lo = Math.min(...v), hi = Math.max(...v);
  if (lo === hi) { lo -= 1e-6; hi += 1e-6; }
  const p = (hi - lo) * pad;
  return [lo - p, hi + p];
};
const niceTicks = (lo: number, hi: number, n = 5) => {
  const span = hi - lo;
  const step0 = span / n;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) ?? step0;
  const out: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-12; t += step) out.push(+t.toFixed(10));
  return out;
};

/* ------------------------------------------------- diverging horizontal bars */
// HTML/CSS rather than SVG so labels stay readable on phones.
export function DivergingBars({ rows, format }: {
  rows: { label: string; value: number }[]; format: (v: number) => string;
}) {
  const max = Math.max(1e-12, ...rows.map((r) => Math.abs(r.value)));
  return (
    <div className="dbars" role="list" aria-label="Kontribusi tiap sinyal terhadap estimasi">
      {rows.map((r) => {
        const w = (Math.abs(r.value) / max) * 38;  // % of the track, leaves room for the value label
        const pos = r.value >= 0;
        return (
          <div className="dbar" role="listitem" key={r.label}>
            <span className="lab">{r.label}</span>
            <span className="track">
              <span className={`bar ${pos ? "up" : "down"}`} style={{ width: `${Math.max(w, 0.4)}%` }} />
              <span className={`v ${pos ? "up" : "down"}`}
                style={pos ? { left: `calc(50% + ${w}% + 6px)` } : { right: `calc(50% + ${w}% + 6px)` }}>
                {format(r.value)}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- gauge */
const ZONES = [
  { to: 25, color: "var(--g1)", label: "Sangat bearish" },
  { to: 40, color: "var(--g2)", label: "Bearish" },
  { to: 60, color: "var(--g3)", label: "Netral" },
  { to: 75, color: "var(--g4)", label: "Bullish" },
  { to: 100, color: "var(--g5)", label: "Sangat bullish" },
];
export function Gauge({ value }: { value: number }) {
  const cx = 120, cy = 112, r = 92, w = 20;
  const ang = (v: number) => Math.PI * (1 - v / 100);
  const pt = (v: number, rr: number) => [cx + rr * Math.cos(ang(v)), cy - rr * Math.sin(ang(v))];
  let from = 0;
  const arcs = ZONES.map((z) => {
    const [x1, y1] = pt(from, r), [x2, y2] = pt(z.to, r);
    const d = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
    from = z.to;
    return <path key={z.to} d={d} stroke={z.color} strokeWidth={w} fill="none" />;
  });
  const [nx, ny] = pt(Math.max(0, Math.min(100, value)), r - 4);
  return (
    <svg className="chart" viewBox="0 0 240 132" role="img" aria-label={`Skor sentimen ${Math.round(value)} dari 100`}>
      {arcs}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="var(--ink)" />
      <text x={cx - r} y={cy + 18} textAnchor="middle">0</text>
      <text x={cx + r} y={cy + 18} textAnchor="middle">100</text>
    </svg>
  );
}

/* ---------------------------------------------------- range bar (estimate) */
export function RangeBar({ prev, est, lo, hi, actual }: {
  prev: number; est: number; lo: number; hi: number; actual?: number;
}) {
  const W = 420, H = 100, padX = 30;
  const vals = [prev, est, lo, hi, ...(actual != null ? [actual] : [])];
  const [a, b] = extent(vals, 0.18);
  const x = (v: number) => padX + ((v - a) / (b - a)) * (W - 2 * padX);
  const fmt = (v: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(v);
  const estUp = est >= prev;
  return (
    <svg className="chart range" viewBox={`0 0 ${W} ${H}`} role="img" style={{ maxWidth: 560 }}
      aria-label={`Rentang 95%: ${fmt(lo)} sampai ${fmt(hi)}, estimasi ${fmt(est)}, penutupan sebelumnya ${fmt(prev)}`}>
      <line x1={padX} x2={W - padX} y1={46} y2={46} className="axis" />
      <rect x={x(lo)} y={36} width={Math.max(2, x(hi) - x(lo))} height={20} rx={10}
        fill={estUp ? "var(--up-soft)" : "var(--down-soft)"} />
      <text x={x(lo)} y={78} textAnchor="middle">{fmt(lo)}</text>
      <text x={x(hi)} y={78} textAnchor="middle">{fmt(hi)}</text>
      {/* previous close */}
      <line x1={x(prev)} x2={x(prev)} y1={28} y2={64} stroke="var(--ink-3)" strokeWidth={2} strokeDasharray="3 3" />
      <text x={x(prev)} y={20} textAnchor="middle">tutup kemarin</text>
      {/* estimate */}
      <circle cx={x(est)} cy={46} r={8} fill={estUp ? UP : DOWN} stroke="var(--paper)" strokeWidth={2} />
      {actual != null && (
        <g>
          <path d={`M ${x(actual)} 58 l -6 10 h 12 z`} fill="var(--ink)" />
          <text x={x(actual)} y={90} textAnchor="middle" style={{ fontWeight: 700, fill: "var(--ink)" }}>aktual</text>
        </g>
      )}
    </svg>
  );
}

/* --------------------------------------------------------------- line chart */
export interface Series { name: string; color: string; values: (number | null)[]; width?: number; dash?: string }

export function LineChart({ x, series, band, yFormat, xFormat, height = 260, zeroLine = true, marker }: {
  x: (string | number)[];
  series: Series[];
  band?: { lower: (number | null)[]; upper: (number | null)[]; color: string };
  yFormat: (v: number) => string;
  xFormat?: (v: string | number) => string;
  height?: number;
  zeroLine?: boolean;
  marker?: { x: number; label: string };
}) {
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(760);
  useEffect(() => {
    const el = box.current; if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = height, L = 52, R = 14, T = 12, B = 28;
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const numericX = typeof x[0] === "number";
  const xs = useMemo(() => (numericX ? (x as number[]) : x.map((_, i) => i)), [x, numericX]);
  const [x0, x1] = numericX ? [Math.min(...xs), Math.max(...xs)] : [0, Math.max(1, x.length - 1)];
  const allY = series.flatMap((s) => s.values).concat(band ? [...band.lower, ...band.upper] : [])
    .filter((v): v is number => v != null && Number.isFinite(v));
  const [y0, y1] = extent(zeroLine ? [...allY, 0] : allY);
  const sx = (v: number) => L + ((v - x0) / (x1 - x0 || 1)) * (W - L - R);
  const sy = (v: number) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  const path = (vals: (number | null)[]) => {
    let d = "", pen = false;
    vals.forEach((v, i) => {
      if (v == null || !Number.isFinite(v)) { pen = false; return; }
      d += `${pen ? "L" : "M"}${sx(xs[i]).toFixed(1)},${sy(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };
  const yt = niceTicks(y0, y1, 5);
  const xtIdx = useMemo(() => {
    if (numericX) return niceTicks(x0, x1, W < 480 ? 4 : 6);
    const n = Math.min(W < 480 ? 3 : 6, x.length);
    return Array.from({ length: n }, (_, i) => Math.round((i * (x.length - 1)) / Math.max(1, n - 1)));
  }, [numericX, x, x0, x1, W]);
  const bandPath = band ? (() => {
    const up = band.upper.map((v, i) => (v == null ? null : `${sx(xs[i])},${sy(v)}`)).filter(Boolean);
    const lo = band.lower.map((v, i) => (v == null ? null : `${sx(xs[i])},${sy(v)}`)).filter(Boolean).reverse();
    return up.length ? `M${up.join("L")}L${lo.join("L")}Z` : "";
  })() : "";

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = ref.current; if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0, bd = Infinity;
    xs.forEach((xv, i) => { const d = Math.abs(sx(xv) - px); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  };
  const hx = hover != null ? sx(xs[hover]) : 0;
  return (
    <div style={{ position: "relative" }} ref={box}>
      <svg ref={ref} className="chart" viewBox={`0 0 ${W} ${H}`} onMouseMove={onMove} onMouseLeave={() => setHover(null)}
        role="img" aria-label={series.map((s) => s.name).join(", ")}>
        {yt.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} className="grid" />
            <text x={L - 8} y={sy(t) + 4} textAnchor="end">{yFormat(t)}</text>
          </g>
        ))}
        {zeroLine && y0 < 0 && y1 > 0 && <line x1={L} x2={W - R} y1={sy(0)} y2={sy(0)} className="axis" />}
        {(numericX ? xtIdx : xtIdx).map((t) => {
          const xv = numericX ? t : xs[t];
          const lab = numericX ? (xFormat ? xFormat(t) : String(t)) : (xFormat ? xFormat(x[t]) : String(x[t]));
          return <text key={String(t)} x={sx(xv)} y={H - 8} textAnchor="middle">{lab}</text>;
        })}
        {bandPath && <path d={bandPath} fill={band!.color} opacity={0.16} />}
        {series.map((s) => (
          <path key={s.name} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={s.width ?? 1.6}
            strokeDasharray={s.dash} strokeLinejoin="round" />
        ))}
        {marker && (
          <g>
            <line x1={sx(marker.x)} x2={sx(marker.x)} y1={T} y2={H - B} stroke="var(--ink)" strokeDasharray="4 3" />
            <text x={sx(marker.x) + 4} y={T + 10} style={{ fill: "var(--ink)", fontWeight: 650 }}>{marker.label}</text>
          </g>
        )}
        {hover != null && <line x1={hx} x2={hx} y1={T} y2={H - B} stroke="var(--ink-3)" />}
        {hover != null && series.map((s) => s.values[hover] != null && (
          <circle key={s.name} cx={hx} cy={sy(s.values[hover] as number)} r={3.5} fill={s.color} />
        ))}
      </svg>
      {hover != null && (
        <div className="tooltip" style={{ left: `${(hx / W) * 100}%`, top: 0 }}>
          <div style={{ opacity: .75 }}>{xFormat ? xFormat(x[hover]) : String(x[hover])}</div>
          {series.map((s) => (
            <div key={s.name}><span style={{ color: s.color === "var(--ink)" ? "var(--tooltip-fg)" : s.color }}>●</span>{" "}
              {s.name}: {s.values[hover] == null ? "–" : yFormat(s.values[hover] as number)}</div>
          ))}
        </div>
      )}
      <div className="legend">
        {series.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}
        {band && <span><i style={{ background: band.color, opacity: .35, height: 8 }} />rentang 95%</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- grouped share bars */
export function ShareBars({ groups, models, values, colors }: {
  groups: string[]; models: string[]; values: Record<string, Record<string, number>>; colors: string[];
}) {
  const max = Math.max(0.01, ...groups.flatMap((g) => models.map((m) => values[g]?.[m] ?? 0)));
  return (
    <div style={{ display: "grid", gap: 14 }} aria-label="Porsi kepentingan per kelompok fitur">
      {groups.map((g) => (
        <div key={g}>
          <div className="small" style={{ fontWeight: 650, marginBottom: 4 }}>{g}</div>
          {models.map((m, mi) => {
            const v = values[g]?.[m] ?? 0;
            return (
              <div key={m} style={{ display: "grid", gridTemplateColumns: "96px 1fr", alignItems: "center", gap: 8, margin: "3px 0" }}>
                <span className="xs muted">{m}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ height: 12, borderRadius: 3, width: `${(v / max) * 78}%`, background: colors[mi % colors.length] }} />
                  <span className="xs num" style={{ fontWeight: 650 }}>{(v * 100).toFixed(1).replace(".", ",")}%</span>
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}