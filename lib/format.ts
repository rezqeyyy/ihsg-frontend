// Number and date formatting (Indonesian conventions: 6.010,34 and 12 Mar 2025).

const idNum = (d: number) => new Intl.NumberFormat("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });

export const points = (v: number | null | undefined, d = 2) => (v == null ? "–" : idNum(d).format(v));

export const pct = (v: number | null | undefined, d = 2, sign = true) => {
  if (v == null || Number.isNaN(v)) return "–";
  const s = idNum(d).format(v * 100);
  return `${sign && v > 0 ? "+" : ""}${s}%`;
};

export const pp = (v: number | null | undefined, d = 3) =>
  v == null ? "–" : `${v > 0 ? "+" : ""}${idNum(d).format(v * 100)}`;

export const signedPoints = (v: number | null | undefined, d = 2) =>
  v == null ? "–" : `${v > 0 ? "+" : ""}${idNum(d).format(v)}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const parseDate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export const shortDate = (s: string) => {
  const d = parseDate(s);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const longDate = (s: string) => {
  const d = parseDate(s);
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const tone = (v: number | null | undefined) => (v == null || v === 0 ? "flat" : v > 0 ? "up" : "down");

export const directionWord = (d: string) => (d === "UP" ? "Naik" : d === "DOWN" ? "Turun" : "Datar");
