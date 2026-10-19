"use client";
import { useState } from "react";
import { api, type Estimate } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { directionWord, longDate, pct, points, pp, shortDate, signedPoints, tone } from "@/lib/format";
import { useAppState } from "@/components/AppState";
import MorningRelay from "@/components/MorningRelay";
import { DivergingBars, Gauge, RangeBar } from "@/components/charts";
import { DataTable, ErrorBox, Panel, SessionControls, Skeleton } from "@/components/ui";

const SENTIMENT_WORD: Record<string, string> = {
  "Strongly bearish": "Sangat bearish", Bearish: "Bearish", Neutral: "Netral",
  Bullish: "Bullish", "Strongly bullish": "Sangat bullish",
};

export default function EstimatePage() {
  const { meta, metaError, date, model, live } = useAppState();
  const [force, setForce] = useState(0);
  const { data: est, error, loading, reload } = useApi<Estimate | null>(
    () => (meta ? (live ? api.live(model ?? undefined, force > 0) : api.estimate(date ?? undefined, model ?? undefined)) : Promise.resolve(null)),
    [meta, date, model, live, force],
  );

  if (metaError) return <ErrorBox message={metaError} />;

  return (
    <>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: "var(--t-s)", color: "var(--ink-2)", fontWeight: 600 }}>
            {est ? `Sesi ${longDate(est.target_date)}` : "Memuat sesi…"}
          </h2>
        </div>
        <SessionControls onRefreshLive={() => setForce((f) => f + 1)} />
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}
      {!est && !error && <Skeleton h={260} />}

      {est && (
        <div style={{ opacity: loading ? 0.55 : 1, transition: "opacity .2s" }}>
          {est.warnings.map((w) => <div className="notice" key={w}>{translateWarning(w)}</div>)}
          {est.warnings.length > 0 && <div style={{ height: 12 }} />}

          <MorningRelay est={est} />

          <div className="grid-hero">
            <EstimateDetail est={est} />
            <Panel title="Apa yang menggerakkan estimasi ini"
              note={`Kontribusi tiap sinyal dalam poin persentase (TreeSHAP). Titik awal model ${pp(est.shap_base ?? 0)} pp.`}>
              {est.shap_ranked.length
                ? <DivergingBars rows={est.shap_ranked.map((s) => ({ label: s.label, value: s.value }))} format={(v) => pp(v)} />
                : <p className="muted small">Atribusi SHAP tidak tersedia (paket shap belum terpasang di backend).</p>}
            </Panel>
          </div>

          <div className="grid-2">
            <Panel title="Sentimen pra-pasar"
              note="Enam sinyal pra-pasar distandardisasi dan diberi bobot sesuai pengaruhnya di model, lalu dipetakan ke skala 0–100.">
              <div className="sentiment">
                <Gauge value={est.sentiment.score} />
                <div>
                  <div className="score num">
                    {Math.round(est.sentiment.score)}<span className="small muted" style={{ fontWeight: 600 }}> / 100</span>
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{SENTIMENT_WORD[est.sentiment.label] ?? est.sentiment.label}</div>
                  <p className="small muted" style={{ marginTop: 8 }}>
                    {est.sentiment.breadth_up} dari {est.sentiment.breadth_total} sinyal mengarah naik.
                  </p>
                </div>
              </div>
            </Panel>
            <Panel title="Pagi-pagi serupa di masa lalu"
              note={`${est.analogs.k} sesi dengan sinyal pra-pasar paling mirip. Rata-rata pembukaan IHSG-nya ${pct(est.analogs.mean, 3)}, dan ${Math.round(est.analogs.share_up * 100)}% dibuka naik.`}>
              <DataTable
                rows={est.analogs.rows}
                columns={[
                  { key: "date", label: "Tanggal" },
                  { key: "eido_ret", label: "EIDO", align: "r" },
                  { key: "nikkei_gap", label: "Nikkei", align: "r" },
                  { key: "hangseng_gap", label: "Hang Seng", align: "r" },
                  { key: "y", label: "Pembukaan IHSG", align: "r" },
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

          <Panel title="Semua input model"
            note="Lima input terakhir berasal dari histori IHSG sampai hari sebelumnya. Tidak ada data hari ini yang dipakai selain pembukaan bursa Asia.">
            <DataTable
              rows={(meta?.features ?? []).map((f) => ({ label: f.label, group: groupWord(f.group), value: est.features[f.key] }))}
              columns={[{ key: "label", label: "Sinyal" }, { key: "group", label: "Kelompok" }, { key: "value", label: "Nilai", align: "r" }]}
              format={{ value: (v) => <span className={tone(v as number)}>{pct(v as number, 3)}</span> }}
            />
          </Panel>
        </div>
      )}
    </>
  );
}

function EstimateDetail({ est }: { est: Estimate }) {
  const t = tone(est.y_hat);
  const hasActual = est.actual_open != null;
  const hit = hasActual && Math.sign(est.actual_y!) === Math.sign(est.y_hat);
  const inside = hasActual && est.actual_open! >= est.lower_open && est.actual_open! <= est.upper_open;
  return (
    <Panel title="Rincian estimasi" note="Rentang 95% dihitung dari sebaran error model pada data 2012–2023.">
      <RangeBar prev={est.prev_close} est={est.open_hat} lo={est.lower_open} hi={est.upper_open} actual={est.actual_open} />
      <dl className="kv" style={{ marginTop: 10 }}>
        <dt>Penutupan sebelumnya ({shortDate(est.prev_close_date)})</dt><dd className="num">{points(est.prev_close)}</dd>
        <dt>Estimasi pembukaan</dt><dd className={`num ${t}`}>{points(est.open_hat)}</dd>
        <dt>Perubahan</dt><dd className={`num ${t}`}>{signedPoints(est.open_hat - est.prev_close)} poin ({pct(est.y_hat, 3)})</dd>
        <dt>Rentang 95%</dt><dd className="num">{points(est.lower_open, 0)} – {points(est.upper_open, 0)}</dd>
        <dt>Arah</dt><dd><span className={`pill ${t}`}>{directionWord(est.direction)}</span></dd>
        <dt>Model</dt><dd>{est.model}</dd>
      </dl>
      {hasActual && (
        <div className="verdict">
          <strong>Pembukaan sebenarnya: {points(est.actual_open)}</strong> ({pct(est.actual_y, 3)}).{" "}
          Selisih {signedPoints(est.actual_open! - est.open_hat)} poin. Arah {hit ? "tepat" : "meleset"},{" "}
          {inside ? "masih di dalam" : "di luar"} rentang 95%.
          {est.actual_flagged && " Catatan: harga buka di data sama dengan penutupan kemarin (hari ter-flag)."}
        </div>
      )}
      {est.mode === "live" && est.fetched_at && (
        <p className="xs faint" style={{ marginTop: 10 }}>Data diambil {est.fetched_at.replace("T", " ")}.</p>
      )}
    </Panel>
  );
}

const groupWord = (g: string) =>
  g === "Asian indices" ? "Indeks Asia" : g === "U.S.-listed Indonesia ETFs" ? "ETF Indonesia di AS" : "Histori IHSG";

function translateWarning(w: string) {
  const m = w.match(/^(.+?): no session on (\S+)/);
  return m ? `${m[1]} libur atau belum buka pada ${shortDate(m[2])}, jadi gap-nya dianggap 0.` : w;
}