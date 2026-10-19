"use client";
import { api, type DataQuality, type Row } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { DataTable, ErrorBox, Panel, Skeleton } from "@/components/ui";

const RULE_WORD: Record<string, string> = {
  removed_duplicates: "Tanggal duplikat", removed_weekend: "Baris akhir pekan",
  removed_missing_open_close: "Open/Close kosong", removed_nonpositive: "Harga ≤ 0",
  removed_flat_zero_volume: "Baris libur palsu Yahoo", removed_price_jump: "Lonjakan > 20%",
};

export default function DataPage() {
  const { data, error, reload } = useApi<DataQuality>(() => api.dataQuality(), []);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Kualitas data dan uji kebocoran</h1>
          <p>
            Data dari Yahoo Finance diperiksa dan dibersihkan sebelum dipakai. Setiap aturan hanya melihat data hari itu atau
            sebelumnya, dan harga yang hilang tidak pernah diisi dengan nilai masa depan.
          </p>
        </div>
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Skeleton h={300} />}
      {data && (
        <>
          <Panel title="Uji kebocoran data" note="Diuji otomatis di notebook. Uji perturbasi mengacak semua data yang belum diketahui pukul 08:35 WIB dan memastikan input model tidak berubah.">
            {data.leakage_tests.length ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {data.leakage_tests.map((r, i) => {
                  const pass = r.passed === true || r.passed === "True" || r.result === "PASS";
                  return (
                    <li key={i} className="small" style={{ display: "flex", alignItems: "flex-start" }}>
                      <span className={`check ${pass ? "pass" : "fail"}`} aria-label={pass ? "lolos" : "gagal"}>{pass ? "✓" : "✕"}</span>
                      <span>{String(r.check).trim()}</span>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="muted small">File leakage_tests.csv belum ada. Jalankan bagian 2b di notebook.</p>}
          </Panel>

          <div className="grid-2">
            <Panel title="Baris yang dibuang saat pembersihan">
              <CleaningTable rows={data.cleaning_log} />
            </Panel>
            <Panel title="Missing value setelah penyelarasan kalender" note="Bursa Asia libur dan ETF tanpa sesi baru dianggap 0. Baris awal (warm-up) dibuang.">
              <DataTable rows={data.missing_after_alignment}
                columns={[{ key: "item", label: "Kolom" }, { key: "missing_before_drop", label: "Kosong", align: "r" },
                  { key: "imputed_as_zero", label: "Diisi 0", align: "r" }, { key: "rule", label: "Aturan" }]} />
            </Panel>
          </div>

          <Panel title="Porsi hari dengan Open = Close kemarin (%)"
            note="Tabel 3.2. Pada IHSG tahun 2020, 2022 dan 2023 porsinya terlalu besar untuk gap asli, sehingga hari-hari ini ditangani khusus (konfigurasi A, B, C). Periode uji 2024–2025 bersih.">
            <DataTable rows={data.table_3_2} highlight={(r) => Number(Object.values(r)[1]) > 5}
              format={Object.fromEntries(Object.keys(data.table_3_2[0] ?? {}).slice(1).map((k) => [k, (v: Row[string]) =>
                <span style={{ fontWeight: Number(v) > 5 ? 750 : 400, color: Number(v) > 5 ? "var(--down)" : undefined }}>{Number(v).toFixed(1)}</span>]))} />
          </Panel>

          <div className="grid-2">
            <Panel title="Data mentah sebelum dibersihkan">
              <DataTable rows={data.raw_quality} />
            </Panel>
            <Panel title="Pemeriksaan lain (hanya dilaporkan)">
              <DataTable rows={data.quality_flags} />
              <div style={{ height: 14 }} />
              <DataTable rows={data.etf_liquidity} />
            </Panel>
          </div>

          <Panel title="Verifikasi manual harga pembukaan"
            note={data.verification_result.length
              ? "Hasil perbandingan 100 hari sampel dengan data resmi IDX."
              : "100 hari sampel menunggu diisi dengan data resmi IDX di verification_sample.csv, lalu jalankan sel skor di notebook."}>
            <DataTable rows={data.verification_result.length ? data.verification_result : data.verification_sample} maxRows={12} />
          </Panel>
        </>
      )}
    </>
  );
}

function CleaningTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return <DataTable rows={rows} />;
  const instruments = rows.map((r) => String(r.item));
  const rules = Object.keys(RULE_WORD);
  const pivot: Row[] = rules.map((k) => ({ rule: RULE_WORD[k], ...Object.fromEntries(rows.map((r) => [String(r.item), r[k] as number])) }));
  pivot.push({ rule: "Baris tersisa", ...Object.fromEntries(rows.map((r) => [String(r.item), r.rows_out as number])) });
  return <DataTable rows={pivot}
    columns={[{ key: "rule", label: "Aturan" }, ...instruments.map((i) => ({ key: i, label: i.toUpperCase(), align: "r" as const }))]}
    highlight={(r) => r.rule === "Baris tersisa"} />;
}
