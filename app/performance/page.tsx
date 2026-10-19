"use client";
import { useState } from "react";
import { api, type Performance, type Row } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { dec, featureLabel, groupLabel, modelLabel, pct, shortDate } from "@/lib/format";
import { useI18n, type TKey } from "@/lib/i18n";
import { useAppState } from "@/components/AppState";
import { LineChart, ShareBars } from "@/components/charts";
import { DataTable, ErrorBox, Panel, Skeleton } from "@/components/ui";

const MODEL_KEY: Record<string, TKey> = { Zero: "model.Zero", LinearRegression: "model.LinearRegression" };
const n4 = (v: Row[string]) => (v == null ? "–" : dec(Number(v) * 100, 4));

export default function PerformancePage() {
  const { meta } = useAppState();
  const { t } = useI18n();
  const [config, setConfig] = useState("A");
  const { data, error, loading, reload } = useApi<Performance>(() => api.performance(config), [config]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t("perf.title")}</h1>
          <p>{t("perf.intro")}</p>
        </div>
        <div className="seg" role="group" aria-label={t("perf.cfgAria")}>
          {(data?.configs ?? ["A", "B", "C"]).map((c) => (
            <button key={c} aria-pressed={config === c} onClick={() => setConfig(c)}>{["A", "B", "C"].includes(c) ? t(`cfg.${c}` as TKey) : c}</button>
          ))}
        </div>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Skeleton h={320} />}
      {data && (
        <div style={{ opacity: loading ? 0.55 : 1 }}>
          {meta?.ensemble && (
            <Panel title={t("perf.ensTitle")}
              note={t("perf.ensNote", { rf: Math.round(meta.ensemble.weights.RandomForest * 100), xgb: Math.round(meta.ensemble.weights.XGBoost * 100) })}>
              <div className="ens-bar" aria-label={t("perf.ensAria")}>
                <span style={{ flex: meta.ensemble.weights.RandomForest, background: "var(--share-1)" }}>Random Forest {Math.round(meta.ensemble.weights.RandomForest * 100)}%</span>
                <span style={{ flex: meta.ensemble.weights.XGBoost, background: "var(--share-2)" }}>XGBoost {Math.round(meta.ensemble.weights.XGBoost * 100)}%</span>
              </div>
            </Panel>
          )}

          <Panel title={t("perf.metrics")} note={t("perf.metricsNote")}>
            <DataTable
              rows={data.metrics}
              columns={[
                { key: "model", label: t("col.model") },
                { key: "CV_RMSE_dev", label: t("col.cvRmse"), align: "r" },
                { key: "RMSE", label: "RMSE", align: "r" },
                { key: "MAE", label: "MAE", align: "r" },
                { key: "R2_oos", label: t("col.r2"), align: "r" },
                { key: "DA", label: t("col.da"), align: "r" },
                { key: "DA_balanced", label: t("col.daBal"), align: "r" },
              ]}
              format={{
                model: (v) => {
                  const m = String(v);
                  if (m === "Ensemble") return modelLabel(m, meta?.ensemble);
                  if (m.startsWith("Majority direction")) return t(m.includes("(-)") ? "model.majorityDown" : "model.majorityUp");
                  return MODEL_KEY[m] ? t(MODEL_KEY[m]) : m;
                },
                CV_RMSE_dev: n4, RMSE: n4, MAE: n4,
                R2_oos: (v) => (v == null ? "–" : <span className={Number(v) > 0 ? "up" : Number(v) < 0 ? "down" : ""}>{`${Number(v) > 0 ? "+" : ""}${dec(Number(v), 4)}`}</span>),
                DA: (v) => (v == null ? "–" : pct(Number(v), 1, false)),
                DA_balanced: (v) => (v == null ? "–" : pct(Number(v), 1, false)),
              }}
              highlight={(r) => r.model === data.champion}
            />
          </Panel>

          <div className="grid-2">
            <Panel title={t("perf.dm")} note={t("perf.dmNote")}>
              <DataTable rows={data.diebold_mariano}
                columns={[{ key: "model", label: t("col.model") }, { key: "vs", label: "vs" }, { key: "DM", align: "r" },
                  { key: "p_value", label: "p", align: "r" }, { key: "verdict", label: t("col.conclusion") }]}
                format={{
                  DM: (v) => (v == null ? "–" : dec(Number(v), 3)),
                  p_value: (v) => (v == null ? "–" : <span style={{ fontWeight: Number(v) < 0.05 ? 750 : 400 }}>{dec(Number(v), 3)}</span>),
                  verdict: (v) => {
                    const s = String(v);
                    if (s.startsWith("inconclusive")) return t("dm.inconclusive");
                    const m = s.match(/^(.+) more accurate$/);
                    return m ? t("dm.better", { m: m[1] }) : s;
                  },
                }} />
            </Panel>
            <Panel title={t("perf.coverage")} note={t("perf.coverageNote")}>
              <DataTable rows={data.interval_coverage}
                columns={[{ key: "model", label: t("col.model") }, { key: "q_lower", label: t("col.lower"), align: "r" },
                  { key: "q_upper", label: t("col.upper"), align: "r" }, { key: "test_coverage", label: t("col.coverage"), align: "r" }]}
                format={{ q_lower: (v) => pct(Number(v), 2), q_upper: (v) => pct(Number(v), 2), test_coverage: (v) => pct(Number(v), 1, false) }} />
            </Panel>
          </div>

          <div className="grid-2">
            <Panel title={t("perf.groups")} note={t("perf.groupsNote")}>
              <ImportanceByGroup rows={data.group_importance} />
            </Panel>
            <Panel title={t("perf.perSignal")} note={t("perf.perSignalNote")}>
              <DataTable
                rows={pivotFeatures(data.feature_importance)}
                columns={[{ key: "label", label: t("col.signal") }, ...modelsOf(data.feature_importance).map((m) => ({ key: m, label: m, align: "r" as const }))]}
                format={Object.fromEntries(modelsOf(data.feature_importance).map((m) => [m, (v: Row[string]) => (v == null ? "–" : dec(Number(v) * 100, 4))]))}
              />
            </Panel>
          </div>

          {data.test_series.length > 0 && (
            <Panel title={t("perf.series")} note={t("perf.seriesNote")}>
              <LineChart
                x={data.test_series.map((r) => String(r.date))}
                series={[
                  { name: t("series.actual"), color: "var(--series-muted)", values: data.test_series.map((r) => r.y as number), width: 1.2 },
                  { name: data.champion, color: "var(--ink)", values: data.test_series.map((r) => r[data.champion] as number), width: 1.6 },
                ]}
                band={meta?.intervals?.[data.champion] ? {
                  lower: data.test_series.map((r) => (r[data.champion] as number) + meta.intervals[data.champion].q_lower),
                  upper: data.test_series.map((r) => (r[data.champion] as number) + meta.intervals[data.champion].q_upper),
                  color: "var(--focus)",
                } : undefined}
                yFormat={(v) => pct(v, 1)}
                xFormat={(v) => shortDate(String(v))}
                height={300}
              />
            </Panel>
          )}

          <div className="grid-2">
            <Panel title={t("perf.splits")}>
              <DataTable rows={data.split_counts} />
            </Panel>
            <Panel title={t("perf.hyper")}>
              <DataTable rows={data.best_hyperparameters.map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v != null)))}
                columns={Object.keys(data.best_hyperparameters[0] ?? {}).map((k) => ({ key: k, label: k === "Unnamed: 0" ? t("col.model") : k }))}
                format={Object.fromEntries(Object.keys(data.best_hyperparameters[0] ?? {}).map((k) => [k, (v: Row[string]) =>
                  v == null ? "–" : typeof v === "number" && !Number.isInteger(v) ? v.toPrecision(3) : String(v)]))} />
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}

const modelsOf = (rows: Row[]) => Array.from(new Set(rows.map((r) => String(r.model))));
function pivotFeatures(rows: Row[]): Row[] {
  const byF = new Map<string, Row>();
  rows.forEach((r) => {
    const k = String(r.feature);
    if (!byF.has(k)) byF.set(k, { label: featureLabel(k, String(r.label)) });
    byF.get(k)![String(r.model)] = r.mean_abs_shap;
  });
  return Array.from(byF.values()).sort((a, b) => Number(Object.values(b)[1] ?? 0) - Number(Object.values(a)[1] ?? 0));
}
function ImportanceByGroup({ rows }: { rows: Row[] }) {
  const models = modelsOf(rows);
  const groups = Array.from(new Set(rows.map((r) => String(r.group))));
  const values: Record<string, Record<string, number>> = {};
  rows.forEach((r) => { (values[groupLabel(String(r.group))] ??= {})[String(r.model)] = Number(r.shap_share); });
  return <ShareBars groups={groups.map((g) => groupLabel(g))} models={models} values={values} colors={models.map((m) => (m === "Ensemble" ? "var(--share-3)" : m === "RandomForest" ? "var(--share-1)" : "var(--share-2)"))} />;
}