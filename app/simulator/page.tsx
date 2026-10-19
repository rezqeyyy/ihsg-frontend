"use client";
import { useEffect, useMemo, useState } from "react";
import { api, type Estimate, type Simulation } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { directionWord, longDate, pct, points, pp, signedPoints, tone } from "@/lib/format";
import { useAppState } from "@/components/AppState";
import { DivergingBars, LineChart } from "@/components/charts";
import { ErrorBox, Panel, SessionControls, Skeleton } from "@/components/ui";

const SIGNALS = [
  { key: "eido_ret", label: "EIDO & IDX ETF (return semalam)", min: -6, max: 6 },
  { key: "nikkei_gap", label: "Nikkei 225 (gap pembukaan)", min: -4, max: 4 },
  { key: "kospi_gap", label: "KOSPI (gap pembukaan)", min: -4, max: 4 },
  { key: "hangseng_gap", label: "Hang Seng (gap pembukaan)", min: -4, max: 4 },
  { key: "shanghai_gap", label: "Shanghai (gap pembukaan)", min: -4, max: 4 },
];
const COLORS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];

export default function SimulatorPage() {
  const { meta, metaError, date, model } = useAppState();
  const base = useApi<Estimate | null>(
    () => (meta ? api.estimate(date ?? undefined, model ?? undefined) : Promise.resolve(null)), [meta, date, model]);
  const [vals, setVals] = useState<Record<string, number>>({});
  const [sim, setSim] = useState<Simulation | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // reset sliders to the observed values whenever the session changes
  useEffect(() => {
    if (!base.data) return;
    setVals(Object.fromEntries(SIGNALS.map((s) => [s.key, +(base.data!.features[s.key] * 100).toFixed(2)])));
  }, [base.data]);

  // debounce simulation requests while sliding
  const overrides = useMemo(() => Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, v / 100])), [vals]);
  useEffect(() => {
    if (!base.data || !Object.keys(overrides).length) return;
    const id = setTimeout(() => {
      api.simulate({ date: base.data!.target_date, model: model ?? undefined, overrides })
        .then((r) => { setSim(r); setSimError(null); })
        .catch((e: Error) => setSimError(e.message));
    }, 220);
    return () => clearTimeout(id);
  }, [overrides, base.data, model]);

  if (metaError) return <ErrorBox message={metaError} />;
  const est = base.data;
  const changed = est && SIGNALS.some((s) => Math.abs((vals[s.key] ?? 0) - est.features[s.key] * 100) > 0.006);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Simulator skenario</h1>
          <p>
            Geser sinyal pra-pasar untuk melihat seberapa peka estimasi terhadap tiap sinyal. Histori IHSG tetap.
            EIDO dan IDX ETF digerakkan bersama karena pergerakannya hampir identik. Ini alat untuk memahami model,
            bukan ramalan skenario.
          </p>
        </div>
        <SessionControls allowLive={false} />
      </div>
      {base.error && <ErrorBox message={base.error} onRetry={base.reload} />}
      {!est && !base.error && <Skeleton h={300} />}
      {est && (
        <>
          <Panel title={`Titik awal: sesi ${longDate(est.target_date)}`}
            note={`Slider dimulai dari nilai yang benar-benar teramati pagi itu. Estimasi awal ${points(est.open_hat)} (${pct(est.y_hat, 3)}).`}
            right={changed ? (
              <button className="btn secondary" onClick={() =>
                setVals(Object.fromEntries(SIGNALS.map((s) => [s.key, +(est.features[s.key] * 100).toFixed(2)])))}>
                Kembalikan ke nilai asli
              </button>
            ) : undefined}>
            <div className="sliders">
              {SIGNALS.map((s) => {
                const v = vals[s.key] ?? 0;
                const orig = est.features[s.key] * 100;
                return (
                  <div className="slider" key={s.key}>
                    <label htmlFor={`sl-${s.key}`}>
                      <span>{s.label}</span>
                      <span className={`num ${tone(v)}`}>{pct(v / 100, 2)}</span>
                    </label>
                    <input id={`sl-${s.key}`} type="range" min={s.min} max={s.max} step={0.05} value={v}
                      onChange={(e) => setVals((p) => ({ ...p, [s.key]: +e.target.value }))} />
                    <div className="hint"><span>{s.min}%</span><span>asli {pct(orig / 100, 2)}</span><span>+{s.max}%</span></div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {simError && <div style={{ marginTop: 18 }}><ErrorBox message={simError} /></div>}
          {sim && (
            <>
              <section className="panel" style={{ marginTop: 18 }}>
                <div className="stat-row">
                  <div>
                    <div className="label">Estimasi hasil simulasi</div>
                    <div className={`value num ${tone(sim.simulated.y_hat)}`}>{points(sim.simulated.open_hat)}</div>
                    <div className="small muted">{directionWord(sim.simulated.direction)} {pct(sim.simulated.y_hat, 3)}</div>
                  </div>
                  <div>
                    <div className="label">Dibanding estimasi awal</div>
                    <div className={`value num ${tone(sim.delta_points)}`}>{signedPoints(sim.delta_points)} poin</div>
                    <div className="small muted">{pp(sim.delta_return)} pp</div>
                  </div>
                  <div>
                    <div className="label">Rentang 95%</div>
                    <div className="value num">{points(sim.simulated.lower_open, 0)} – {points(sim.simulated.upper_open, 0)}</div>
                  </div>
                </div>
              </section>
              <div className="grid-2">
                <Panel title="Kurva sensitivitas"
                  note="Satu sinyal digeser dari −3% sampai +3%, sinyal lain tetap di nilai simulasi. Model pohon datar di luar rentang data latih, jadi skenario ekstrem tidak ikut membesar.">
                  <LineChart
                    x={sim.curves[0].x}
                    series={sim.curves.map((c, i) => ({ name: c.label, color: COLORS[i % COLORS.length], values: c.y }))}
                    yFormat={(v) => pct(v, 2)}
                    xFormat={(v) => pct(Number(v), 0)}
                    height={300}
                  />
                </Panel>
                <Panel title="Kontribusi sinyal (simulasi)" note="TreeSHAP untuk input hasil simulasi, dalam poin persentase.">
                  <DivergingBars rows={sim.simulated.shap_ranked.map((s) => ({ label: s.label, value: s.value }))} format={(v) => pp(v)} />
                </Panel>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}