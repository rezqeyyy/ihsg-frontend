"use client";
import { useState } from "react";
import { api, type Estimate } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { directionWord, featureLabel, groupLabel, longDate, modelLabel, pct, points, pp, shortDate, signedPoints, tone } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useAppState } from "@/components/AppState";
import MorningRelay from "@/components/MorningRelay";
import { DivergingBars, Gauge, RangeBar } from "@/components/charts";
import { DataTable, ErrorBox, Panel, SessionControls, Skeleton } from "@/components/ui";

export default function EstimatePage() {
  const { meta, metaError, date, model, live } = useAppState();
  const { t, lang } = useI18n();
  const [force, setForce] = useState(0);
  const { data: est, error, loading, reload } = useApi<Estimate | null>(
    () => (meta ? (live ? api.live(model ?? undefined, force > 0) : api.estimate(date ?? undefined, model ?? undefined)) : Promise.resolve(null)),
    [meta, date, model, live, force],
  );

  if (metaError) return <ErrorBox message={metaError} />;

  const warning = (w: string) => {
    const m = w.match(/^(.+?): no session on (\S+)/);
    return m ? t("est.warnClosed", { m: m[1], d: shortDate(m[2]) }) : w;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: "var(--t-s)", color: "var(--ink-2)", fontWeight: 600 }}>
            {est ? t("est.session", { d: longDate(est.target_date) }) : t("est.loading")}
          </h2>
        </div>
        <SessionControls onRefreshLive={() => setForce((f) => f + 1)} />
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}
      {!est && !error && <Skeleton h={260} />}

      {est && (
        <div style={{ opacity: loading ? 0.55 : 1, transition: "opacity .2s" }} key={lang}>
          {est.warnings.map((w) => <div className="notice" key={w}>{warning(w)}</div>)}
          {est.warnings.length > 0 && <div style={{ height: 12 }} />}

          <MorningRelay est={est} />

          <div className="grid-hero">
            <EstimateDetail est={est} ensemble={meta?.ensemble} />
            <Panel title={t("est.drivers")} note={t("est.driversNote", { b: pp(est.shap_base ?? 0) })}>
              {est.shap_ranked.length
                ? <DivergingBars rows={est.shap_ranked.map((s) => ({ label: featureLabel(s.key, s.label), value: s.value }))} format={(v) => pp(v)} />
                : <p className="muted small">{t("est.noShap")}</p>}
            </Panel>
          </div>

          <div className="grid-2">
            <Panel title={t("est.sentiment")} note={t("est.sentimentNote")}>
              <div className="sentiment">
                <Gauge value={est.sentiment.score} />
                <div>
                  <div className="score num">
                    {Math.round(est.sentiment.score)}<span className="small muted" style={{ fontWeight: 600 }}> / 100</span>
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>
                    {t(`sent.${est.sentiment.label}` as "sent.Neutral")}
                  </div>
                  <p className="small muted" style={{ marginTop: 8 }}>
                    {t("est.breadth", { n: est.sentiment.breadth_up, m: est.sentiment.breadth_total })}
                  </p>
                </div>
              </div>
            </Panel>
            <Panel title={t("est.analogs")}
              note={t("est.analogsNote", { k: est.analogs.k, mean: pct(est.analogs.mean, 3), share: Math.round(est.analogs.share_up * 100) })}>
              <DataTable
                rows={est.analogs.rows}
                columns={[
                  { key: "date", label: t("col.date") },
                  { key: "eido_ret", label: "EIDO", align: "r" },
                  { key: "nikkei_gap", label: "Nikkei", align: "r" },
                  { key: "hangseng_gap", label: "Hang Seng", align: "r" },
                  { key: "y", label: t("col.ihsgOpen"), align: "r" },
                ]}
                format={{
                  date: (v) => shortDate(String(v)),
                  eido_ret: (v) => <span className={tone(v as number)}>{pct(v as number)}</span>,
                  nikkei_gap: (v) => <span className={tone(v as number)}>{pct(v as number)}</span>,
                  hangseng_gap: (v) => <span className={tone(v as number)}>{pct(v as number)}</span>,
                  y: (v) => <strong className={tone(v as number)}>{pct(v as number, 3)}</strong>,
                }}
                maxRows={6}
              />
            </Panel>
          </div>

          <Panel title={t("est.inputs")} note={t("est.inputsNote")}>
            <DataTable
              rows={(meta?.features ?? []).map((f) => ({ label: featureLabel(f.key, f.label), group: groupLabel(f.group), value: est.features[f.key] }))}
              columns={[{ key: "label", label: t("col.signal") }, { key: "group", label: t("col.group") }, { key: "value", label: t("col.value"), align: "r" }]}
              format={{ value: (v) => <span className={tone(v as number)}>{pct(v as number, 3)}</span> }}
            />
          </Panel>
        </div>
      )}
    </>
  );
}

function EstimateDetail({ est, ensemble }: { est: Estimate; ensemble?: { weights: Record<string, number> } | null }) {
  const { t } = useI18n();
  const tn = tone(est.y_hat);
  const hasActual = est.actual_open != null;
  const hit = hasActual && Math.sign(est.actual_y!) === Math.sign(est.y_hat);
  const inside = hasActual && est.actual_open! >= est.lower_open && est.actual_open! <= est.upper_open;
  return (
    <Panel title={t("est.details")} note={t("est.detailsNote")}>
      <RangeBar prev={est.prev_close} est={est.open_hat} lo={est.lower_open} hi={est.upper_open} actual={est.actual_open} />
      <dl className="kv" style={{ marginTop: 10 }}>
        <dt>{t("est.prevClose", { d: shortDate(est.prev_close_date) })}</dt><dd className="num">{points(est.prev_close)}</dd>
        <dt>{t("est.openHat")}</dt><dd className={`num ${tn}`}>{points(est.open_hat)}</dd>
        <dt>{t("est.change")}</dt><dd className={`num ${tn}`}>{signedPoints(est.open_hat - est.prev_close)} {t("unit.pts")} ({pct(est.y_hat, 3)})</dd>
        <dt>{t("range95")}</dt><dd className="num">{points(est.lower_open, 0)} – {points(est.upper_open, 0)}</dd>
        <dt>{t("est.direction")}</dt><dd><span className={`pill ${tn}`}>{directionWord(est.direction)}</span></dd>
        <dt>{t("ctl.model")}</dt><dd>{modelLabel(est.model, ensemble)}</dd>
      </dl>
      {hasActual && (
        <div className="verdict">
          <strong>{t("est.actual", { v: points(est.actual_open) })}</strong> ({pct(est.actual_y, 3)}).{" "}
          {t("est.diff", { d: signedPoints(est.actual_open! - est.open_hat) })}{" "}
          {hit ? t("est.hit") : t("est.miss")}, {inside ? t("est.inside") : t("est.outside")}
          {est.actual_flagged && <> {t("est.flagged")}</>}
        </div>
      )}
      {est.mode === "live" && est.fetched_at && (
        <p className="xs faint" style={{ marginTop: 10 }}>{t("est.fetched", { t: est.fetched_at.replace("T", " ") })}</p>
      )}
    </Panel>
  );
}