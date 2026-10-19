// Number and date formatting that follows the selected language:
//   id: 6.010,34   12 Mar 2025   Jumat, 26 Jun 2026
//   en: 6,010.34   Mar 12, 2025  Friday, Jun 26, 2026
import { getLang, tr } from "./i18n";

const locale = () => (getLang() === "en" ? "en-US" : "id-ID");
const num = (d: number) => new Intl.NumberFormat(locale(), { minimumFractionDigits: d, maximumFractionDigits: d });

export const points = (v: number | null | undefined, d = 2) => (v == null ? "–" : num(d).format(v));

export const pct = (v: number | null | undefined, d = 2, sign = true) => {
  if (v == null || Number.isNaN(v)) return "–";
  const s = num(d).format(v * 100);
  return `${sign && v > 0 ? "+" : ""}${s}%`;
};

export const pp = (v: number | null | undefined, d = 3) =>
  v == null ? "–" : `${v > 0 ? "+" : ""}${num(d).format(v * 100)}`;

export const signedPoints = (v: number | null | undefined, d = 2) =>
  v == null ? "–" : `${v > 0 ? "+" : ""}${num(d).format(v)}`;

/** Plain decimal in the current locale, e.g. 0.2734 -> "0,2734" (id) or "0.2734" (en). */
export const dec = (v: number | null | undefined, d = 4) => (v == null || Number.isNaN(v) ? "–" : num(d).format(v));

const MONTHS = {
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
const DAYS = {
  id: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export const parseDate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export const shortDate = (s: string) => {
  const d = parseDate(s), l = getLang();
  const mon = MONTHS[l][d.getUTCMonth()];
  return l === "en" ? `${mon} ${d.getUTCDate()}, ${d.getUTCFullYear()}` : `${d.getUTCDate()} ${mon} ${d.getUTCFullYear()}`;
};

export const longDate = (s: string) => {
  const d = parseDate(s), l = getLang();
  return `${DAYS[l][d.getUTCDay()]}, ${shortDate(s)}`;
};

export const tone = (v: number | null | undefined) => (v == null || v === 0 ? "flat" : v > 0 ? "up" : "down");

/** "Ensemble (RF 60% + XGBoost 40%)" when weights are known, otherwise the plain model name. */
export const modelLabel = (name: string, ensemble?: { weights: Record<string, number> } | null) => {
  if (name !== "Ensemble") return name;
  const w = ensemble?.weights;
  if (!w) return "Ensemble RF + XGBoost";
  const rf = Math.round((w.RandomForest ?? 0.5) * 100);
  return `Ensemble (RF ${rf}% + XGBoost ${100 - rf}%)`;
};

export const directionWord = (d: string) => tr(`dir.${d === "UP" || d === "DOWN" ? d : "FLAT"}`);

/** Feature label in the current language (falls back to the backend label). */
export const featureLabel = (key: string, fallback?: string) => {
  const s = tr(`feat.${key}`);
  return s === `feat.${key}` ? fallback ?? key : s;
};

export const groupLabel = (g: string) => {
  const s = tr(`group.${g}`);
  return s === `group.${g}` ? g : s;
};