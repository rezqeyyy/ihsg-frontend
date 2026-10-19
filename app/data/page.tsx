"use client";
import { api, type DataQuality, type Row } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { dec } from "@/lib/format";
import { translateReport, useI18n, type TKey } from "@/lib/i18n";
import { DataTable, ErrorBox, Panel, Skeleton } from "@/components/ui";

const RULES = ["removed_duplicates", "removed_weekend", "removed_missing_open_close",
  "removed_nonpositive", "removed_flat_zero_volume", "removed_price_jump"];

export default function DataPage() {
  const { t, lang } = useI18n();
  const { data, error, reload } = useApi<DataQuality>(() => api.dataQuality(), []);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t("data.title")}</h1>
          <p>{t("data.intro")}</p>
        </div>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Skeleton h={300} />}
      {data && (
        <>
          <Panel title={t("data.leak")} note={t("data.leakNote")}>
            {data.leakage_tests.length ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {data.leakage_tests.map((r, i) => {
                  const pass = r.passed === true || r.passed === "True" || r.result === "PASS";
                  return (
                    <li key={i} className="small" style={{ display: "flex", alignItems: "flex-start" }}>
                      <span className={`check ${pass ? "pass" : "fail"}`} aria-label={pass ? t("data.pass") : t("data.fail")}>{pass ? "✓" : "✕"}</span>
                      <span>{translateReport(String(r.check).trim(), lang)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="muted small">{t("data.leakMissing")}</p>}
          </Panel>

          <div className="grid-2">
            <Panel title={t("data.removed")}>
              <CleaningTable rows={data.cleaning_log} />
            </Panel>
            <Panel title={t("data.missing")} note={t("data.missingNote")}>
              <DataTable rows={data.missing_after_alignment}
                columns={[{ key: "item", label: t("col.column") }, { key: "missing_before_drop", label: t("col.missing"), align: "r" },
                  { key: "imputed_as_zero", label: t("col.setZero"), align: "r" }, { key: "rule", label: t("col.rule") }]}
                format={{ rule: (v) => translateReport(String(v ?? ""), lang) }} />
            </Panel>
          </div>

          <Panel title={t("data.flagShare")} note={t("data.flagShareNote")}>
            <DataTable rows={data.table_3_2} highlight={(r) => Number(Object.values(r)[1]) > 5}
              format={Object.fromEntries(Object.keys(data.table_3_2[0] ?? {}).slice(1).map((k) => [k, (v: Row[string]) =>
                <span style={{ fontWeight: Number(v) > 5 ? 750 : 400, color: Number(v) > 5 ? "var(--down)" : undefined }}>{dec(Number(v), 1)}</span>]))} />
          </Panel>

          <div className="grid-2">
            <Panel title={t("data.raw")}>
              <DataTable rows={data.raw_quality} />
            </Panel>
            <Panel title={t("data.other")}>
              <DataTable rows={data.quality_flags} />
              <div style={{ height: 14 }} />
              <DataTable rows={data.etf_liquidity} />
            </Panel>
          </div>

          <Panel title={t("data.verify")} note={data.verification_result.length ? t("data.verifyDone") : t("data.verifyTodo")}>
            <DataTable rows={data.verification_result.length ? data.verification_result : data.verification_sample} maxRows={12} />
          </Panel>
        </>
      )}
    </>
  );
}

function CleaningTable({ rows }: { rows: Row[] }) {
  const { t } = useI18n();
  if (!rows.length) return <DataTable rows={rows} />;
  const instruments = rows.map((r) => String(r.item));
  const kept = t("rule.kept");
  const pivot: Row[] = RULES.map((k) => ({ rule: t(`rule.${k}` as TKey), ...Object.fromEntries(rows.map((r) => [String(r.item), r[k] as number])) }));
  pivot.push({ rule: kept, ...Object.fromEntries(rows.map((r) => [String(r.item), r.rows_out as number])) });
  return <DataTable rows={pivot}
    columns={[{ key: "rule", label: t("col.rule") }, ...instruments.map((i) => ({ key: i, label: i.toUpperCase(), align: "r" as const }))]}
    highlight={(r) => r.rule === kept} />;
}