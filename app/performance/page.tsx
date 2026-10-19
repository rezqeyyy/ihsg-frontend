"use client";
import { useState } from "react";
import { api, type Performance, type Row } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { pct, shortDate } from "@/lib/format";
import { useAppState } from "@/components/AppState";
import { LineChart, ShareBars } from "@/components/charts";
import { DataTable, ErrorBox, Panel, Skeleton } from "@/components/ui";

const CONFIG_WORD: Record<string, string> = {
  A: "A (utama): tanpa hari ter-flag",
  B: "B: hari ter-flag = 0",
  C: "C: tahun bersih saja",
};
const MODEL_WORD: Record<string, string> = {
  Zero: "Zero-return", LinearRegression: "Linear Regression",
};
const GROUP_WORD: Record<string, string> = {
  "Asian indices": "Indeks Asia", "U.S.-listed Indonesia ETFs": "ETF Indonesia di AS", "IHSG own history": "Histori IHSG",
};
const n4 = (v: Row[string]) => (v == null ? "–" : (Number(v) * 100).toFixed(4));

export default function PerformancePage() {
  const { meta } = useAppState();
  const [config, setConfig] = useState("A");
  const { data, error, loading, reload } = useApi<Performance>(() => api.performance(config), [config]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Performa model di data uji 2024–2025</h1>
          <p>
            Model dilatih pada 2012–2023 dan diuji sekali pada 2024–2025. Angka di bawah dibandingkan dengan baseline:
            zero-return, regresi linear, Ridge, Lasso, ElasticNet, dan tebakan arah mayoritas.
          </p>
        </div>
        <div className="seg" role="group" aria-label="Konfigurasi">
          {(data?.configs ?? ["A", "B", "C"]).map((c) => (
            <button key={c} aria-pressed={config === c} onClick={() => setConfig(c)}>{CONFIG_WORD[c] ?? c}</button>
          ))}
        </div>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Skeleton h={320} />}
      {data && (
        <div style={{ opacity: loading ? 0.55 : 1 }}>
          <Panel title="Metrik error"
            note="Zero-return = menganggap IHSG buka di harga penutupan kemarin. RMSE, MAE dan CV RMSE dalam poin persentase. R² dihitung terhadap zero-return: negatif berarti lebih buruk daripada menganggap pasar buka di harga kemarin. Akurasi arah dihitung pada hari dengan gap ≠ 0.">
            <DataTable
              rows={data.metrics}
              columns={[
                { key: "model", label: "Model" }, { key: "CV_RMSE_dev", label: "CV RMSE 2012–23", align: "r" },
                { key: "RMSE", label: "RMSE", align: "r" }, { key: "MAE", label: "MAE", align: "r" },
                { key: "R2_oos", label: "R² vs zero", align: "r" }, { key: "DA", label: "Akurasi arah", align: "r" },
              ]}
              format={{
                model: (v) => (MODEL_WORD[String(v)] ?? String(v)).replace("Majority direction (+)", "Selalu tebak naik").replace("Majority direction (-)", "Selalu tebak turun"),
                CV_RMSE_dev: n4, RMSE: n4, MAE: n4,
                R2_oos: (v) => (v == null ? "–" : <span className={Number(v) > 0 ? "up" : Number(v) < 0 ? "down" : ""}>{(+Number(v)).toFixed(4)}</span>),
                DA: (v) => (v == null ? "–" : pct(Number(v), 1, false)),
              }}
              highlight={(r) => r.model === data.champion}
            />
          </Panel>

          <div className="grid-2">
            <Panel title="Uji Diebold–Mariano" note="Apakah selisih akurasi dua model signifikan secara statistik (p < 0,05)? DM negatif berarti model pertama lebih akurat.">
              <DataTable rows={data.diebold_mariano}
                columns={[{ key: "model", label: "Model" }, { key: "vs", label: "vs" }, { key: "DM", align: "r" },
                  { key: "p_value", label: "p", align: "r" }, { key: "verdict", label: "Kesimpulan" }]}
                format={{
                  DM: (v) => (v == null ? "–" : Number(v).toFixed(3)),
                  p_value: (v) => (v == null ? "–" : <span style={{ fontWeight: Number(v) < 0.05 ? 750 : 400 }}>{Number(v).toFixed(3)}</span>),
                  verdict: (v) => String(v).replace("inconclusive (p >= 0.05)", "tidak signifikan").replace("more accurate", "lebih akurat"),
                }} />
            </Panel>
            <Panel title="Seberapa sering aktual masuk rentang 95%" note="Idealnya mendekati 95%. Kalau jauh di bawah, rentangnya terlalu sempit untuk periode uji.">
              <DataTable rows={data.interval_coverage}
                columns={[{ key: "model", label: "Model" }, { key: "q_lower", label: "Batas bawah", align: "r" },
                  { key: "q_upper", label: "Batas atas", align: "r" }, { key: "test_coverage", label: "Cakupan", align: "r" }]}
                format={{ q_lower: (v) => pct(Number(v), 2), q_upper: (v) => pct(Number(v), 2), test_coverage: (v) => pct(Number(v), 1, false) }} />
            </Panel>
          </div>

          <div className="grid-2">
            <Panel title="Kelompok sinyal paling berpengaruh" note="Porsi rata-rata |SHAP| per kelompok pada data uji (konfigurasi A). EIDO dan IDX sangat berkorelasi, jadi dibaca per kelompok.">
              <ImportanceByGroup rows={data.group_importance} />
            </Panel>
            <Panel title="Per sinyal" note="Rata-rata |SHAP| dalam poin persentase.">
              <DataTable
                rows={pivotFeatures(data.feature_importance)}
                columns={[{ key: "label", label: "Sinyal" }, ...modelsOf(data.feature_importance).map((m) => ({ key: m, label: m, align: "r" as const }))]}
                format={Object.fromEntries(modelsOf(data.feature_importance).map((m) => [m, (v: Row[string]) => (v == null ? "–" : (Number(v) * 100).toFixed(4))]))}
              />
            </Panel>
          </div>

          {data.test_series.length > 0 && (
            <Panel title="Gap pembukaan aktual vs estimasi, 2024–2025" note="Arahkan kursor ke grafik untuk melihat nilai per hari.">
              <LineChart
                x={data.test_series.map((r) => String(r.date))}
                series={[
                  { name: "Aktual", color: "var(--series-muted)", values: data.test_series.map((r) => r.y as number), width: 1.2 },
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
            <Panel title="Jumlah observasi per partisi">
              <DataTable rows={data.split_counts} />
            </Panel>
            <Panel title="Hyperparameter terbaik (Optuna)">
              <DataTable rows={data.best_hyperparameters.map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v != null)))}
                columns={Object.keys(data.best_hyperparameters[0] ?? {}).map((k) => ({ key: k, label: k === "Unnamed: 0" ? "Model" : k }))}
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
    if (!byF.has(k)) byF.set(k, { label: r.label });
    byF.get(k)![String(r.model)] = r.mean_abs_shap;
  });
  return Array.from(byF.values()).sort((a, b) => Number(Object.values(b)[1] ?? 0) - Number(Object.values(a)[1] ?? 0));
}
function ImportanceByGroup({ rows }: { rows: Row[] }) {
  const models = modelsOf(rows);
  const groups = Array.from(new Set(rows.map((r) => String(r.group))));
  const values: Record<string, Record<string, number>> = {};
  rows.forEach((r) => { (values[GROUP_WORD[String(r.group)] ?? String(r.group)] ??= {})[String(r.model)] = Number(r.shap_share); });
  return <ShareBars groups={groups.map((g) => GROUP_WORD[g] ?? g)} models={models} values={values} colors={["var(--share-1)", "var(--share-2)"]} />;
}