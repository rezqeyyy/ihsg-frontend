"use client";
// Bahasa Indonesia / English. All UI text lives here; pages call t("key", { var }).
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "id" | "en";
const KEY = "ihsg.lang";

/* The active language is also kept at module level so plain helpers (number/date formatting,
   API error messages) can follow it without receiving it as an argument. */
let current: Lang = "id";
export const getLang = (): Lang => current;

/** Runs in <head> before React hydrates: sets <html lang> from the saved choice. */
export const langInitScript = `(function(){try{var l=localStorage.getItem("${KEY}");if(l==="en"||l==="id"){document.documentElement.lang=l}}catch(e){}})();`;

type Entry = { id: string; en: string };
const D = {
  /* ------------------------------------------------------------ shell */
  "brand.sub": { id: "estimasi sebelum bursa buka pukul 09:00 WIB", en: "estimate before the market opens at 09:00 WIB" },
  "brand.home": { id: "IHSG Opening Estimator, beranda", en: "IHSG Opening Estimator, home" },
  "nav.aria": { id: "Halaman", en: "Pages" },
  "nav.estimate": { id: "Estimasi", en: "Estimate" },
  "nav.simulator": { id: "Simulator", en: "Simulator" },
  "nav.performance": { id: "Performa model", en: "Model performance" },
  "nav.history": { id: "Riwayat", en: "History" },
  "nav.data": { id: "Kualitas data", en: "Data quality" },
  "theme.aria": { id: "Tema warna", en: "Color theme" },
  "theme.light": { id: "Mode terang", en: "Light mode" },
  "theme.dark": { id: "Mode gelap", en: "Dark mode" },
  "lang.aria": { id: "Bahasa", en: "Language" },
  "lang.id": { id: "Bahasa Indonesia", en: "Indonesian" },
  "lang.en": { id: "Bahasa Inggris", en: "English" },
  "footer": {
    id: "Estimasi dihasilkan model statistik (Random Forest & XGBoost) untuk keperluan penelitian. Ini informasi, bukan saran investasi. Data: Yahoo Finance.",
    en: "Estimates are produced by a statistical model (Random Forest & XGBoost) for research purposes. This is information, not investment advice. Data: Yahoo Finance.",
  },

  /* ------------------------------------------------------- shared UI */
  "ui.loadError": { id: "Tidak bisa memuat data.", en: "Could not load data." },
  "ui.retry": { id: "Coba lagi", en: "Try again" },
  "ui.empty": {
    id: "Belum ada data. Jalankan notebook Colab sampai bagian 7 lalu salin folder hasilnya ke backend.",
    en: "No data yet. Run the Colab notebook through section 7 and copy its output folder to the backend.",
  },
  "ui.hiddenRows": { id: "{n} baris lain disembunyikan.", en: "{n} more rows hidden." },
  "ctl.source": { id: "Sumber data", en: "Data source" },
  "ctl.historical": { id: "Tanggal historis", en: "Historical date" },
  "ctl.latest": { id: "Data terbaru", en: "Latest data" },
  "ctl.session": { id: "Sesi IHSG", en: "IHSG session" },
  "ctl.model": { id: "Model", en: "Model" },
  "ctl.main": { id: "(utama)", en: "(main)" },
  "ctl.refetch": { id: "Ambil ulang data", en: "Fetch again" },
  "dir.UP": { id: "Naik", en: "Up" },
  "dir.DOWN": { id: "Turun", en: "Down" },
  "dir.FLAT": { id: "Datar", en: "Flat" },
  "unit.pts": { id: "poin", en: "pts" },
  "range95": { id: "Rentang 95%", en: "95% range" },
  "range95.lower": { id: "rentang 95%", en: "95% range" },

  /* feature & group names (backend sends English labels; these override them) */
  "feat.nikkei_gap": { id: "Gap pembukaan Nikkei 225", en: "Nikkei 225 opening gap" },
  "feat.kospi_gap": { id: "Gap pembukaan KOSPI", en: "KOSPI opening gap" },
  "feat.hangseng_gap": { id: "Gap pembukaan Hang Seng", en: "Hang Seng opening gap" },
  "feat.shanghai_gap": { id: "Gap pembukaan Shanghai", en: "Shanghai opening gap" },
  "feat.eido_ret": { id: "Return semalam EIDO", en: "EIDO overnight return" },
  "feat.idx_ret": { id: "Return semalam IDX ETF", en: "IDX ETF overnight return" },
  "feat.ihsg_lag1": { id: "Return IHSG (T-1)", en: "IHSG return (T-1)" },
  "feat.ihsg_lag2": { id: "Return IHSG (T-2)", en: "IHSG return (T-2)" },
  "feat.ihsg_lag3": { id: "Return IHSG (T-3)", en: "IHSG return (T-3)" },
  "feat.ihsg_rolling_mean_5": { id: "Rata-rata return IHSG 5 hari", en: "IHSG 5-day mean return" },
  "feat.ihsg_rolling_vol_10": { id: "Volatilitas IHSG 10 hari", en: "IHSG 10-day volatility" },
  "group.Asian indices": { id: "Indeks Asia", en: "Asian indices" },
  "group.U.S.-listed Indonesia ETFs": { id: "ETF Indonesia di AS", en: "U.S.-listed Indonesia ETFs" },
  "group.IHSG own history": { id: "Histori IHSG", en: "IHSG history" },

  /* ------------------------------------------------------ morning relay */
  "relay.aria": { id: "Urutan sinyal pra-pasar menuju pembukaan IHSG", en: "Pre-market signals leading to the IHSG open" },
  "relay.title": { id: "Pagi pasar menuju pembukaan IHSG", en: "The market morning before the IHSG opens" },
  "relay.live": { id: "Data terbaru dari Yahoo Finance", en: "Latest data from Yahoo Finance" },
  "relay.replay": { id: "Rekonstruksi dengan data yang tersedia sebelum 09:00 WIB", en: "Reconstructed from data available before 09:00 WIB" },
  "relay.us": { id: "Bursa AS tutup", en: "U.S. market close" },
  "relay.tokyo": { id: "Tokyo & Seoul buka", en: "Tokyo & Seoul open" },
  "relay.hk": { id: "Hong Kong & Shanghai buka", en: "Hong Kong & Shanghai open" },
  "relay.closed": { id: "libur", en: "closed" },
  "relay.overnight": { id: "return semalam", en: "overnight return" },
  "relay.session": { id: "sesi {d}", en: "session {d}" },
  "relay.gap": { id: "gap pembukaan", en: "opening gap" },
  "relay.estimate": { id: "Estimasi pembukaan IHSG", en: "Estimated IHSG open" },
  "relay.from": { id: "dari", en: "from" },

  /* --------------------------------------------------------- estimate */
  "est.session": { id: "Sesi {d}", en: "Session {d}" },
  "est.loading": { id: "Memuat sesi…", en: "Loading session…" },
  "est.warnClosed": { id: "{m} libur atau belum buka pada {d}, jadi gap-nya dianggap 0.", en: "{m} was closed or not yet open on {d}, so its gap is set to 0." },
  "est.drivers": { id: "Apa yang menggerakkan estimasi ini", en: "What drives this estimate" },
  "est.driversNote": { id: "Kontribusi tiap sinyal dalam poin persentase (TreeSHAP). Titik awal model {b} pp.", en: "Contribution of each signal in percentage points (TreeSHAP). Model baseline {b} pp." },
  "est.noShap": { id: "Atribusi SHAP tidak tersedia (paket shap belum terpasang di backend).", en: "SHAP attribution is unavailable (the shap package is not installed on the backend)." },
  "est.sentiment": { id: "Sentimen pra-pasar", en: "Pre-market sentiment" },
  "est.sentimentNote": { id: "Enam sinyal pra-pasar distandardisasi dan diberi bobot sesuai pengaruhnya di model, lalu dipetakan ke skala 0–100.", en: "The six pre-market signals are standardised, weighted by their influence in the model and mapped to a 0–100 scale." },
  "est.breadth": { id: "{n} dari {m} sinyal mengarah naik.", en: "{n} of {m} signals point up." },
  "sent.Strongly bearish": { id: "Sangat bearish", en: "Strongly bearish" },
  "sent.Bearish": { id: "Bearish", en: "Bearish" },
  "sent.Neutral": { id: "Netral", en: "Neutral" },
  "sent.Bullish": { id: "Bullish", en: "Bullish" },
  "sent.Strongly bullish": { id: "Sangat bullish", en: "Strongly bullish" },
  "est.analogs": { id: "Pagi-pagi serupa di masa lalu", en: "Similar mornings in the past" },
  "est.analogsNote": { id: "{k} sesi dengan sinyal pra-pasar paling mirip. Rata-rata pembukaan IHSG-nya {mean}, dan {share}% dibuka naik.", en: "The {k} past sessions with the most similar pre-market signals. Their average IHSG open was {mean}, and {share}% opened higher." },
  "col.date": { id: "Tanggal", en: "Date" },
  "col.ihsgOpen": { id: "Pembukaan IHSG", en: "IHSG open" },
  "est.inputs": { id: "Semua input model", en: "All model inputs" },
  "est.inputsNote": { id: "Lima input terakhir berasal dari histori IHSG sampai hari sebelumnya. Tidak ada data hari ini yang dipakai selain pembukaan bursa Asia.", en: "The last five inputs come from IHSG history up to the previous day. No same-day data is used except the Asian market openings." },
  "col.signal": { id: "Sinyal", en: "Signal" },
  "col.group": { id: "Kelompok", en: "Group" },
  "col.value": { id: "Nilai", en: "Value" },
  "est.details": { id: "Rincian estimasi", en: "Estimate details" },
  "est.detailsNote": { id: "Rentang 95% dihitung dari sebaran error model pada data 2012–2023.", en: "The 95% range comes from the model's error distribution on 2012–2023 data." },
  "est.prevClose": { id: "Penutupan sebelumnya ({d})", en: "Previous close ({d})" },
  "est.openHat": { id: "Estimasi pembukaan", en: "Estimated open" },
  "est.change": { id: "Perubahan", en: "Change" },
  "est.direction": { id: "Arah", en: "Direction" },
  "est.actual": { id: "Pembukaan sebenarnya: {v}", en: "Actual open: {v}" },
  "est.diff": { id: "Selisih {d} poin.", en: "Difference {d} pts." },
  "est.hit": { id: "Arah tepat", en: "Direction correct" },
  "est.miss": { id: "Arah meleset", en: "Direction missed" },
  "est.inside": { id: "masih di dalam rentang 95%.", en: "inside the 95% range." },
  "est.outside": { id: "di luar rentang 95%.", en: "outside the 95% range." },
  "est.flagged": { id: "Catatan: harga buka di data sama dengan penutupan kemarin (hari ter-flag).", en: "Note: the reported open equals the previous close (flagged day)." },
  "est.fetched": { id: "Data diambil {t}.", en: "Data fetched {t}." },

  /* ----------------------------------------------------------- charts */
  "chart.prevClose": { id: "tutup kemarin", en: "prev. close" },
  "chart.actual": { id: "aktual", en: "actual" },
  "chart.rangeAria": { id: "Rentang 95%: {lo} sampai {hi}, estimasi {est}, penutupan sebelumnya {prev}", en: "95% range: {lo} to {hi}, estimate {est}, previous close {prev}" },
  "chart.gaugeAria": { id: "Skor sentimen {v} dari 100", en: "Sentiment score {v} of 100" },
  "chart.barsAria": { id: "Kontribusi tiap sinyal terhadap estimasi", en: "Contribution of each signal to the estimate" },
  "chart.shareAria": { id: "Porsi kepentingan per kelompok fitur", en: "Importance share per feature group" },

  /* -------------------------------------------------------- simulator */
  "sim.title": { id: "Simulator skenario", en: "Scenario simulator" },
  "sim.intro": {
    id: "Geser sinyal pra-pasar untuk melihat seberapa peka estimasi terhadap tiap sinyal. Histori IHSG tetap. EIDO dan IDX ETF digerakkan bersama karena pergerakannya hampir identik. Ini alat untuk memahami model, bukan ramalan skenario.",
    en: "Move the pre-market signals to see how sensitive the estimate is to each one. IHSG history stays fixed. EIDO and the IDX ETF move together because they track almost identically. This is a tool for understanding the model, not a scenario forecast.",
  },
  "sim.eido": { id: "EIDO & IDX ETF (return semalam)", en: "EIDO & IDX ETF (overnight return)" },
  "sim.nikkei": { id: "Nikkei 225 (gap pembukaan)", en: "Nikkei 225 (opening gap)" },
  "sim.kospi": { id: "KOSPI (gap pembukaan)", en: "KOSPI (opening gap)" },
  "sim.hangseng": { id: "Hang Seng (gap pembukaan)", en: "Hang Seng (opening gap)" },
  "sim.shanghai": { id: "Shanghai (gap pembukaan)", en: "Shanghai (opening gap)" },
  "sim.start": { id: "Titik awal: sesi {d}", en: "Starting point: session {d}" },
  "sim.startNote": { id: "Slider dimulai dari nilai yang benar-benar teramati pagi itu. Estimasi awal {open} ({pct}).", en: "Sliders start at the values actually observed that morning. Initial estimate {open} ({pct})." },
  "sim.reset": { id: "Kembalikan ke nilai asli", en: "Reset to observed values" },
  "sim.observed": { id: "asli {v}", en: "observed {v}" },
  "sim.result": { id: "Estimasi hasil simulasi", en: "Simulated estimate" },
  "sim.vsBase": { id: "Dibanding estimasi awal", en: "Versus initial estimate" },
  "sim.curves": { id: "Kurva sensitivitas", en: "Sensitivity curves" },
  "sim.curvesNote": { id: "Satu sinyal digeser dari −3% sampai +3%, sinyal lain tetap di nilai simulasi. Model pohon datar di luar rentang data latih, jadi skenario ekstrem tidak ikut membesar.", en: "One signal is moved from −3% to +3% while the others stay at their simulated values. Tree models are flat outside the training range, so extreme scenarios do not keep growing." },
  "sim.contrib": { id: "Kontribusi sinyal (simulasi)", en: "Signal contributions (simulated)" },
  "sim.contribNote": { id: "TreeSHAP untuk input hasil simulasi, dalam poin persentase.", en: "TreeSHAP for the simulated inputs, in percentage points." },
  "sim.etfPair": { id: "EIDO & IDX ETF", en: "EIDO & IDX ETF" },

  /* ------------------------------------------------------ performance */
  "perf.title": { id: "Performa model di data uji 2024–2025", en: "Model performance on the 2024–2025 test data" },
  "perf.intro": {
    id: "Model dilatih pada 2012–2023 dan diuji sekali pada 2024–2025. Angka di bawah dibandingkan dengan baseline: zero-return, regresi linear, Ridge, Lasso, ElasticNet, dan tebakan arah mayoritas.",
    en: "Models were trained on 2012–2023 and tested once on 2024–2025. The figures below are compared with baselines: zero-return, linear regression, Ridge, Lasso, ElasticNet and the majority-direction guess.",
  },
  "perf.cfgAria": { id: "Konfigurasi", en: "Configuration" },
  "cfg.A": { id: "A (utama): tanpa hari ter-flag", en: "A (main): flagged days removed" },
  "cfg.B": { id: "B: hari ter-flag = 0", en: "B: flagged days = 0" },
  "cfg.C": { id: "C: tahun bersih saja", en: "C: clean years only" },
  "perf.ensTitle": { id: "Model utama: ensemble Random Forest + XGBoost", en: "Main model: Random Forest + XGBoost ensemble" },
  "perf.ensNote": {
    id: "Prediksi akhir = {rf}% × Random Forest + {xgb}% × XGBoost. Bobot dipilih dari error out-of-fold 2012–2023 (rentang 20–80% supaya kedua model ikut menyumbang), bukan dari data uji. Baris RF dan XGBoost di bawah adalah model tunggalnya sebagai pembanding.",
    en: "Final prediction = {rf}% × Random Forest + {xgb}% × XGBoost. The weight was chosen from 2012–2023 out-of-fold error (limited to 20–80% so both models contribute), not from the test data. The RF and XGBoost rows below are the single models, for comparison.",
  },
  "perf.ensAria": { id: "Komposisi ensemble", en: "Ensemble composition" },
  "perf.metrics": { id: "Metrik error", en: "Error metrics" },
  "perf.metricsNote": {
    id: "Zero-return = menganggap IHSG buka di harga penutupan kemarin. RMSE, MAE dan CV RMSE dalam poin persentase. R² dihitung terhadap zero-return: negatif berarti lebih buruk daripada menganggap pasar buka di harga kemarin. Akurasi arah dihitung pada hari dengan gap ≠ 0.",
    en: "Zero-return = assuming the IHSG opens at the previous close. RMSE, MAE and CV RMSE are in percentage points. R² is measured against zero-return: negative means worse than assuming the market opens at yesterday's close. Directional accuracy is computed on days with a non-zero gap.",
  },
  "col.model": { id: "Model", en: "Model" },
  "col.cvRmse": { id: "CV RMSE 2012–23", en: "CV RMSE 2012–23" },
  "col.r2": { id: "R² vs zero", en: "R² vs zero" },
  "col.da": { id: "Akurasi arah", en: "Directional accuracy" },
  "model.Zero": { id: "Zero-return", en: "Zero-return" },
  "model.LinearRegression": { id: "Linear Regression", en: "Linear Regression" },
  "model.majorityUp": { id: "Selalu tebak naik", en: "Always predict up" },
  "model.majorityDown": { id: "Selalu tebak turun", en: "Always predict down" },
  "perf.dm": { id: "Uji Diebold–Mariano", en: "Diebold–Mariano tests" },
  "perf.dmNote": { id: "Apakah selisih akurasi dua model signifikan secara statistik (p < 0,05)? DM negatif berarti model pertama lebih akurat.", en: "Is the accuracy difference between two models statistically significant (p < 0.05)? A negative DM means the first model is more accurate." },
  "col.conclusion": { id: "Kesimpulan", en: "Conclusion" },
  "dm.inconclusive": { id: "tidak signifikan", en: "not significant" },
  "dm.better": { id: "{m} lebih akurat", en: "{m} more accurate" },
  "perf.coverage": { id: "Seberapa sering aktual masuk rentang 95%", en: "How often the actual value falls in the 95% range" },
  "perf.coverageNote": { id: "Idealnya mendekati 95%. Kalau jauh di bawah, rentangnya terlalu sempit untuk periode uji.", en: "Ideally close to 95%. If it is much lower, the range is too narrow for the test period." },
  "col.lower": { id: "Batas bawah", en: "Lower bound" },
  "col.upper": { id: "Batas atas", en: "Upper bound" },
  "col.coverage": { id: "Cakupan", en: "Coverage" },
  "perf.groups": { id: "Kelompok sinyal paling berpengaruh", en: "Most influential signal groups" },
  "perf.groupsNote": { id: "Porsi rata-rata |SHAP| per kelompok pada data uji (konfigurasi A). EIDO dan IDX sangat berkorelasi, jadi dibaca per kelompok.", en: "Share of mean |SHAP| per group on the test data (configuration A). EIDO and IDX are highly correlated, so they are read as a group." },
  "perf.perSignal": { id: "Per sinyal", en: "Per signal" },
  "perf.perSignalNote": { id: "Rata-rata |SHAP| dalam poin persentase.", en: "Mean |SHAP| in percentage points." },
  "perf.series": { id: "Gap pembukaan aktual vs estimasi, 2024–2025", en: "Actual vs estimated opening gap, 2024–2025" },
  "perf.seriesNote": { id: "Arahkan kursor ke grafik untuk melihat nilai per hari.", en: "Hover over the chart to see daily values." },
  "series.actual": { id: "Aktual", en: "Actual" },
  "perf.splits": { id: "Jumlah observasi per partisi", en: "Observations per partition" },
  "perf.hyper": { id: "Hyperparameter terbaik (Optuna)", en: "Best hyperparameters (Optuna)" },

  /* ---------------------------------------------------------- history */
  "hist.title": { id: "Riwayat estimasi", en: "Estimate history" },
  "hist.intro": {
    id: "Setiap estimasi dari mode data terbaru disimpan. Nilai pembukaan sebenarnya diisi otomatis begitu data IHSG hari itu tersedia, jadi error model bisa dipantau dari hari ke hari.",
    en: "Every estimate made in latest-data mode is saved. The actual opening value is filled in automatically once that day's IHSG data is available, so the model's error can be tracked day by day.",
  },
  "hist.logged": { id: "Estimasi yang tercatat", en: "Logged estimates" },
  "hist.empty": { id: "Belum ada. Buka halaman Estimasi, pilih Data terbaru, dan estimasinya akan tercatat di sini.", en: "None yet. Open the Estimate page and choose Latest data; the estimate will be logged here." },
  "col.session": { id: "Sesi", en: "Session" },
  "col.estimate": { id: "Estimasi", en: "Estimate" },
  "col.actual": { id: "Aktual", en: "Actual" },
  "col.diffPts": { id: "Selisih (poin)", en: "Difference (pts)" },
  "col.gapEst": { id: "Gap estimasi", en: "Estimated gap" },
  "col.gapAct": { id: "Gap aktual", en: "Actual gap" },
  "col.direction": { id: "Arah", en: "Direction" },
  "hist.pending": { id: "menunggu", en: "pending" },
  "hist.hit": { id: "tepat", en: "correct" },
  "hist.miss": { id: "meleset", en: "missed" },
  "hist.backtest": { id: "Uji mundur 2024–2025 ({m})", en: "Backtest 2024–2025 ({m})" },
  "hist.backtestNote": { id: "Rata-rata error absolut dan akurasi arah dalam jendela bergerak 20 hari bursa. Terlihat kapan model sedang bagus dan kapan meleset.", en: "Mean absolute error and directional accuracy over a rolling 20-trading-day window, showing when the model does well and when it misses." },
  "hist.mae": { id: "MAE 20 hari (pp)", en: "20-day MAE (pp)" },
  "hist.da": { id: "Akurasi arah 20 hari", en: "20-day directional accuracy" },

  /* ------------------------------------------------------------- data */
  "data.title": { id: "Kualitas data dan uji kebocoran", en: "Data quality and leakage tests" },
  "data.intro": {
    id: "Data dari Yahoo Finance diperiksa dan dibersihkan sebelum dipakai. Setiap aturan hanya melihat data hari itu atau sebelumnya, dan harga yang hilang tidak pernah diisi dengan nilai masa depan.",
    en: "Data from Yahoo Finance is checked and cleaned before use. Every rule looks only at that day or earlier, and missing prices are never filled with future values.",
  },
  "data.leak": { id: "Uji kebocoran data", en: "Data leakage tests" },
  "data.leakNote": { id: "Diuji otomatis di notebook. Uji perturbasi mengacak semua data yang belum diketahui pukul 08:35 WIB dan memastikan input model tidak berubah.", en: "Run automatically in the notebook. The perturbation test scrambles all data not yet known at 08:35 WIB and checks that the model inputs do not change." },
  "data.pass": { id: "lolos", en: "passed" },
  "data.fail": { id: "gagal", en: "failed" },
  "data.leakMissing": { id: "File leakage_tests.csv belum ada. Jalankan bagian 2b di notebook.", en: "leakage_tests.csv is missing. Run section 2b of the notebook." },
  "data.removed": { id: "Baris yang dibuang saat pembersihan", en: "Rows removed during cleaning" },
  "data.missing": { id: "Missing value setelah penyelarasan kalender", en: "Missing values after calendar alignment" },
  "data.missingNote": { id: "Bursa Asia libur dan ETF tanpa sesi baru dianggap 0. Baris awal (warm-up) dibuang.", en: "Asian market holidays and ETFs without a new session are set to 0. Warm-up rows at the start are dropped." },
  "col.column": { id: "Kolom", en: "Column" },
  "col.missing": { id: "Kosong", en: "Missing" },
  "col.setZero": { id: "Diisi 0", en: "Set to 0" },
  "col.rule": { id: "Aturan", en: "Rule" },
  "rule.removed_duplicates": { id: "Tanggal duplikat", en: "Duplicate dates" },
  "rule.removed_weekend": { id: "Baris akhir pekan", en: "Weekend rows" },
  "rule.removed_missing_open_close": { id: "Open/Close kosong", en: "Missing Open/Close" },
  "rule.removed_nonpositive": { id: "Harga ≤ 0", en: "Price ≤ 0" },
  "rule.removed_flat_zero_volume": { id: "Baris libur palsu Yahoo", en: "Yahoo placeholder holiday rows" },
  "rule.removed_price_jump": { id: "Lonjakan > 20%", en: "Jump > 20%" },
  "rule.kept": { id: "Baris tersisa", en: "Rows kept" },
  "data.flagShare": { id: "Porsi hari dengan Open = Close kemarin (%)", en: "Share of days with Open = previous Close (%)" },
  "data.flagShareNote": { id: "Tabel 3.2. Pada IHSG tahun 2020, 2022 dan 2023 porsinya terlalu besar untuk gap asli, sehingga hari-hari ini ditangani khusus (konfigurasi A, B, C). Periode uji 2024–2025 bersih.", en: "Table 3.2. For the IHSG in 2020, 2022 and 2023 the share is too high to be genuine gaps, so these days are handled separately (configurations A, B, C). The 2024–2025 test period is clean." },
  "data.raw": { id: "Data mentah sebelum dibersihkan", en: "Raw data before cleaning" },
  "data.other": { id: "Pemeriksaan lain (hanya dilaporkan)", en: "Other checks (reported only)" },
  "data.verify": { id: "Verifikasi manual harga pembukaan", en: "Manual verification of opening prices" },
  "data.verifyDone": { id: "Hasil perbandingan 100 hari sampel dengan data resmi IDX.", en: "Comparison of 100 sampled days with official IDX data." },
  "data.verifyTodo": { id: "100 hari sampel menunggu diisi dengan data resmi IDX di verification_sample.csv, lalu jalankan sel skor di notebook.", en: "100 sampled days are waiting to be filled with official IDX data in verification_sample.csv; then run the scoring cell in the notebook." },

    /* -------------------------------------------------------------- api */
    "api.local": { id: "Backend tidak bisa dihubungi di {url}. Jalankan dulu: uvicorn app.main:app --port 8000", en: "Cannot reach the backend at {url}. Start it first: uvicorn app.main:app --port 8000" },
    "api.remote": {
        id: "Backend di {url} tidak bisa dihubungi dari {here}. Kemungkinan: (1) server sedang bangun dari mode tidur, tunggu ±1 menit lalu klik \"Coba lagi\"; (2) CORS: tambahkan {here} ke environment variable IHSG_CORS_ORIGINS di backend (atau isi dengan *), lalu redeploy.",
        en: "The backend at {url} cannot be reached from {here}. Possible causes: (1) the server is waking up from sleep, wait about a minute and click \"Try again\"; (2) CORS: add {here} to the IHSG_CORS_ORIGINS environment variable on the backend (or set it to *), then redeploy.",
    },"api.crash": {
        id: "Backend di {url} berhenti saat memproses permintaan ini (halaman lain bisa terhubung, jadi bukan masalah CORS). Penyebab paling umum di Render gratis: kehabisan memori 512 MB saat memuat model. Cek tab Logs di Render, lalu klik \"Coba lagi\".",
        en: "The backend at {url} stopped while handling this request (other pages connect fine, so this is not CORS). The most common cause on Render's free plan is running out of its 512 MB memory while loading the model. Check the Logs tab on Render, then click \"Try again\".",
    },
} satisfies Record<string, Entry>;

export type TKey = keyof typeof D;

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const e = (D as Record<string, Entry>)[key];
  let s = e ? e[lang] : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Translate with the module-level language (for non-React helpers). */
export const tr = (key: string, vars?: Record<string, string | number>) => translate(current, key, vars);

/* Texts that arrive from the notebook reports in English: translated by pattern for Indonesian. */
const REPORT_ID: [RegExp, string][] = [
  [/every ETF return comes from a U\.S\. session dated before T/, "setiap return ETF berasal dari sesi AS bertanggal sebelum T"],
  [/perturbation test: features of T unchanged when all future data is scrambled \((\d+) dates\)/, "uji perturbasi: fitur hari T tidak berubah saat semua data masa depan diacak ($1 tanggal)"],
  [/\(sanity\) the scrambling really changed the target y_T/, "(kontrol) pengacakan benar-benar mengubah target y_T"],
  [/live builder \(data from T onward removed\) == training row \((\d+) dates\)/, "pembangun fitur live (data mulai T dihapus) sama dengan baris training ($1 tanggal)"],
  [/config (\w): train < val < test, no overlapping \/ duplicated dates/, "konfigurasi $1: train < val < test, tanpa tanggal tumpang tindih atau duplikat"],
  [/target column is not among the features/, "kolom target tidak termasuk fitur"],
  [/no feature is suspiciously correlated with the target \(max \|r\| = ([\d.]+) < 0\.9\)/, "tidak ada fitur yang berkorelasi mencurigakan dengan target (maks |r| = $1 < 0,9)"],
  [/market closed on T -> 0/, "bursa libur pada T → 0"],
  [/no new U\.S\. session -> 0/, "tidak ada sesi AS baru → 0"],
  [/warm-up rows dropped/, "baris warm-up dibuang"],
  [/^row dropped$/, "baris dibuang"],
];
export function translateReport(text: string, lang: Lang): string {
  if (lang === "en") return text.replace(/->/g, "→");
  return REPORT_ID.reduce((s, [re, rep]) => s.replace(re, rep), text);
}

/* ---------------------------------------------------------------- React */
interface I18n { lang: Lang; setLang: (l: Lang) => void; t: (key: TKey, vars?: Record<string, string | number>) => string }
const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangS] = useState<Lang>("id");
  current = lang;  // keep helpers in sync during this render

  useEffect(() => {
    try {
      const l = localStorage.getItem(KEY);
      if (l === "en" || l === "id") setLangS(l);
    } catch { /* private mode */ }
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((l: Lang) => {
    current = l;
    setLangS(l);
    try { localStorage.setItem(KEY, l); } catch { /* private mode */ }
  }, []);
  const t = useCallback((key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}