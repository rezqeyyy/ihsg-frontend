"use client";
import { api, type History } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { pct, points, shortDate, signedPoints, tone } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { LineChart } from "@/components/charts";
import { DataTable, ErrorBox, Panel, Skeleton } from "@/components/ui";

export default function HistoryPage() {
  const { t } = useI18n();
  const { data, error, reload } = useApi<History>(() => api.history(), []);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t("hist.title")}</h1>
          <p>{t("hist.intro")}</p>
        </div>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Skeleton h={300} />}
      {data && (
        <>
          <Panel title={t("hist.logged")} note={data.live_log.length ? undefined : t("hist.empty")}>
            {data.live_log.length > 0 && (
              <DataTable
                rows={data.live_log}
                columns={[
                  { key: "target_date", label: t("col.session") }, { key: "model", label: t("col.model") },
                  { key: "open_hat", label: t("col.estimate"), align: "r" }, { key: "actual_open", label: t("col.actual"), align: "r" },
                  { key: "err", label: t("col.diffPts"), align: "r" }, { key: "y_hat", label: t("col.gapEst"), align: "r" },
                  { key: "actual_y", label: t("col.gapAct"), align: "r" }, { key: "hit", label: t("col.direction") },
                ]}
                format={{
                  target_date: (v) => shortDate(String(v)),
                  open_hat: (v) => points(Number(v)),
                  actual_open: (v) => (v == null ? <span className="faint">{t("hist.pending")}</span> : points(Number(v))),
                  err: (_, r) => (r.actual_open == null ? "–" : signedPoints(Number(r.actual_open) - Number(r.open_hat))),
                  y_hat: (v) => <span className={tone(Number(v))}>{pct(Number(v), 3)}</span>,
                  actual_y: (v) => (v == null ? "–" : <span className={tone(Number(v))}>{pct(Number(v), 3)}</span>),
                  hit: (_, r) => (r.actual_y == null ? "–"
                    : Math.sign(Number(r.actual_y)) === Math.sign(Number(r.y_hat)) ? t("hist.hit") : t("hist.miss")),
                }}
              />
            )}
          </Panel>
          {data.backtest.length > 0 && (
            <Panel title={t("hist.backtest", { m: data.champion })} note={t("hist.backtestNote")}>
              <LineChart
                x={data.backtest.map((r) => r.date)}
                series={[{ name: t("hist.mae"), color: "var(--ink)", values: data.backtest.map((r) => r.mae_20) }]}
                yFormat={(v) => points(v * 100, 2)}
                xFormat={(v) => shortDate(String(v))}
                zeroLine={false}
                height={220}
              />
              <div style={{ height: 14 }} />
              <LineChart
                x={data.backtest.map((r) => r.date)}
                series={[{ name: t("hist.da"), color: "var(--up)", values: data.backtest.map((r) => r.da_20) }]}
                yFormat={(v) => pct(v, 0, false)}
                xFormat={(v) => shortDate(String(v))}
                zeroLine={false}
                height={220}
              />
            </Panel>
          )}
        </>
      )}
    </>
  );
}