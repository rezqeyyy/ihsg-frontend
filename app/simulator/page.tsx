"use client";
import { useEffect, useMemo, useState } from "react";
import { api, type Estimate, type Simulation } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { directionWord, featureLabel, longDate, pct, points, pp, signedPoints, tone } from "@/lib/format";
import { useI18n, type TKey } from "@/lib/i18n";
import { useAppState } from "@/components/AppState";
import { DivergingBars, LineChart } from "@/components/charts";
import { ErrorBox, Panel, SessionControls, Skeleton } from "@/components/ui";

const SIGNALS: { key: string; label: TKey; min: number; max: number }[] = [
  { key: "eido_ret", label: "sim.eido", min: -6, max: 6 },
  { key: "nikkei_gap", label: "sim.nikkei", min: -4, max: 4 },
  { key: "kospi_gap", label: "sim.kospi", min: -4, max: 4 },
  { key: "hangseng_gap", label: "sim.hangseng", min: -4, max: 4 },
  { key: "shanghai_gap", label: "sim.shanghai", min: -4, max: 4 },
];
const COLORS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];

export default function SimulatorPage() {
  const { meta, metaError, date, model } = useAppState();
  const { t } = useI18n();
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
          <h1>{t("sim.title")}</h1>
          <p>{t("sim.intro")}</p>
        </div>
        <SessionControls allowLive={false} />
      </div>
      {base.error && <ErrorBox message={base.error} onRetry={base.reload} />}
      {!est && !base.error && <Skeleton h={300} />}
      {est && (
        <>
          <Panel title={t("sim.start", { d: longDate(est.target_date) })}
            note={t("sim.startNote", { open: points(est.open_hat), pct: pct(est.y_hat, 3) })}
            right={changed ? (
              <button className="btn secondary" onClick={() =>
                setVals(Object.fromEntries(SIGNALS.map((s) => [s.key, +(est.features[s.key] * 100).toFixed(2)])))}>
                {t("sim.reset")}
              </button>
            ) : undefined}>
            <div className="sliders">
              {SIGNALS.map((s) => {
                const v = vals[s.key] ?? 0;
                const orig = est.features[s.key] * 100;
                return (
                  <div className="slider" key={s.key}>
                    <label htmlFor={`sl-${s.key}`}>
                      <span>{t(s.label)}</span>
                      <span className={`num ${tone(v)}`}>{pct(v / 100, 2)}</span>
                    </label>
                    <input id={`sl-${s.key}`} type="range" min={s.min} max={s.max} step={0.05} value={v}
                      onChange={(e) => setVals((p) => ({ ...p, [s.key]: +e.target.value }))} />
                    <div className="hint"><span>{s.min}%</span><span>{t("sim.observed", { v: pct(orig / 100, 2) })}</span><span>+{s.max}%</span></div>
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
                    <div className="label">{t("sim.result")}</div>
                    <div className={`value num ${tone(sim.simulated.y_hat)}`}>{points(sim.simulated.open_hat)}</div>
                    <div className="small muted">{directionWord(sim.simulated.direction)} {pct(sim.simulated.y_hat, 3)}</div>
                  </div>
                  <div>
                    <div className="label">{t("sim.vsBase")}</div>
                    <div className={`value num ${tone(sim.delta_points)}`}>{signedPoints(sim.delta_points)} {t("unit.pts")}</div>
                    <div className="small muted">{pp(sim.delta_return)} pp</div>
                  </div>
                  <div>
                    <div className="label">{t("range95")}</div>
                    <div className="value num">{points(sim.simulated.lower_open, 0)} – {points(sim.simulated.upper_open, 0)}</div>
                  </div>
                </div>
              </section>
              <div className="grid-2">
                <Panel title={t("sim.curves")} note={t("sim.curvesNote")}>
                  <LineChart
                    x={sim.curves[0].x}
                    series={sim.curves.map((c, i) => ({ name: c.key === "eido_ret" ? t("sim.etfPair") : featureLabel(c.key, c.label), color: COLORS[i % COLORS.length], values: c.y }))}
                    yFormat={(v) => pct(v, 2)}
                    xFormat={(v) => pct(Number(v), 0)}
                    height={300}
                  />
                </Panel>
                <Panel title={t("sim.contrib")} note={t("sim.contribNote")}>
                  <DivergingBars rows={sim.simulated.shap_ranked.map((s) => ({ label: featureLabel(s.key, s.label), value: s.value }))} format={(v) => pp(v)} />
                </Panel>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}