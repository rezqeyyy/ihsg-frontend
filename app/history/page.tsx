"use client";
import { api, type History } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { pct, points, shortDate, signedPoints, tone } from "@/lib/format";
import { LineChart } from "@/components/charts";
import { DataTable, ErrorBox, Panel, Skeleton } from "@/components/ui";

export default function HistoryPage() {
  const { data, error, reload } = useApi<History>(() => api.history(), []);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Riwayat estimasi</h1>
          <p>
            Setiap estimasi dari mode data terbaru disimpan. Nilai pembukaan sebenarnya diisi otomatis begitu data IHSG hari itu
            tersedia, jadi error model bisa dipantau dari hari ke hari.
          </p>
        </div>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Skeleton h={300} />}
      {data && (
        <>
          <Panel title="Estimasi yang tercatat" note={data.live_log.length ? undefined : "Belum ada. Buka halaman Estimasi, pilih Data terbaru, dan estimasinya akan tercatat di sini."}>
            {data.live_log.length > 0 && (
              <DataTable
                rows={data.live_log}
                columns={[
                  { key: "target_date", label: "Sesi" }, { key: "model", label: "Model" },
                  { key: "open_hat", label: "Estimasi", align: "r" }, { key: "actual_open", label: "Aktual", align: "r" },
                  { key: "err", label: "Selisih (poin)", align: "r" }, { key: "y_hat", label: "Gap estimasi", align: "r" },
                  { key: "actual_y", label: "Gap aktual", align: "r" }, { key: "hit", label: "Arah" },
                ]}
                format={{
                  target_date: (v) => shortDate(String(v)),
                  open_hat: (v) => points(Number(v)),
                  actual_open: (v) => (v == null ? <span className="faint">menunggu</span> : points(Number(v))),
                  err: (_, r) => (r.actual_open == null ? "–" : signedPoints(Number(r.actual_open) - Number(r.open_hat))),
                  y_hat: (v) => <span className={tone(Number(v))}>{pct(Number(v), 3)}</span>,
                  actual_y: (v) => (v == null ? "–" : <span className={tone(Number(v))}>{pct(Number(v), 3)}</span>),
                  hit: (_, r) => (r.actual_y == null ? "–" : Math.sign(Number(r.actual_y)) === Math.sign(Number(r.y_hat)) ? "tepat" : "meleset"),
                }}
              />
            )}
          </Panel>
          {data.backtest.length > 0 && (
            <Panel title={`Uji mundur 2024–2025 (${data.champion})`}
              note="Rata-rata error absolut dan akurasi arah dalam jendela bergerak 20 hari bursa. Terlihat kapan model sedang bagus dan kapan meleset.">
              <LineChart
                x={data.backtest.map((r) => r.date)}
                series={[{ name: "MAE 20 hari (pp)", color: "var(--ink)", values: data.backtest.map((r) => r.mae_20) }]}
                yFormat={(v) => (v * 100).toFixed(2)}
                xFormat={(v) => shortDate(String(v))}
                zeroLine={false}
                height={220}
              />
              <div style={{ height: 14 }} />
              <LineChart
                x={data.backtest.map((r) => r.date)}
                series={[{ name: "Akurasi arah 20 hari", color: "var(--up)", values: data.backtest.map((r) => r.da_20) }]}
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
