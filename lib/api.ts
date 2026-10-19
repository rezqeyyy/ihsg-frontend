// Typed client for the FastAPI backend.
import { tr } from "./i18n";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://ihsg-backend.onrender.com").replace(/\/$/, "");

export type Direction = "UP" | "DOWN" | "FLAT";

export interface FeatureInfo { key: string; label: string; group: string }

export interface Meta {
  champion: string;
  models: string[];
  model_errors: Record<string, string>;
  primary_config: string;
  trained_at: string;
  deploy_refit: boolean;
  n_trials: number;
  cv_rmse: Record<string, number>;
  intervals: Record<string, { q_lower: number; q_upper: number; test_coverage: number }>;
  ensemble?: { method: string; weights: Record<string, number>; weight_selected_by: string } | null;
  data_first: string;
  data_last: string;
  replay_min: string;
  replay_max: string;
  features: FeatureInfo[];
  premarket_features: string[];
  disclaimer: string;
}

export interface TimelineStop {
  time: string; key: string; label: string; venue: string; value: number;
  session?: string | null; closed?: boolean;
}

export interface ShapItem { key: string; label: string; value: number }

export interface Estimate {
  mode: "replay" | "live";
  target_date: string;
  prev_close_date: string;
  model: string;
  y_hat: number;
  prev_close: number;
  open_hat: number;
  lower_y: number;
  upper_y: number;
  lower_open: number;
  upper_open: number;
  direction: Direction;
  features: Record<string, number>;
  shap: Record<string, number> | null;
  shap_base: number | null;
  shap_ranked: ShapItem[];
  sentiment: { score: number; label: string; z: Record<string, number>; breadth_up: number; breadth_total: number };
  analogs: { mean: number; median: number; share_up: number; k: number; rows: Record<string, number | string>[] };
  warnings: string[];
  etf_session: Record<string, string>;
  timeline: TimelineStop[];
  actual_open?: number;
  actual_y?: number;
  actual_flagged?: boolean;
  fetched_at?: string;
}

export interface SimCurve { key: string; label: string; x: number[]; y: number[]; current: number }

export interface Simulation {
  target_date: string;
  model: string;
  base: { y_hat: number; open_hat: number; lower_open: number; upper_open: number; direction: Direction };
  base_features: Record<string, number>;
  simulated: Estimate;
  delta_points: number;
  delta_return: number;
  curves: SimCurve[];
}

export type Row = Record<string, string | number | boolean | null>;

export interface Performance {
  config: string;
  configs: string[];
  champion: string;
  metrics: Row[];
  diebold_mariano: Row[];
  interval_coverage: Row[];
  group_importance: Row[];
  feature_importance: Row[];
  split_counts: Row[];
  best_hyperparameters: Row[];
  test_series: Row[];
}

export interface DataQuality {
  table_3_2: Row[];
  raw_quality: Row[];
  cleaning_log: Row[];
  quality_flags: Row[];
  missing_after_alignment: Row[];
  leakage_tests: Row[];
  etf_liquidity: Row[];
  verification_result: Row[];
  verification_sample: Row[];
}

export interface History {
  champion: string;
  live_log: Row[];
  backtest: { date: string; y: number; y_hat: number; mae_20: number | null; da_20: number | null }[];
}

let reached = false;  // true once any request got an answer: the backend is up and CORS works

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init });
  } catch {
    // fetch only throws when no readable response arrived: server down/asleep, wrong URL, or blocked by CORS
    const here = typeof window !== "undefined" ? window.location.origin : "this website";
    const local = /localhost|127\.0\.0\.1/.test(API_URL);
    if (reached) throw new Error(tr("api.crash", { url: API_URL }));
    throw new Error(local ? tr("api.local", { url: API_URL }) : tr("api.remote", { url: API_URL, here }));
  }
  reached = true;
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail ?? detail; } catch { /* keep statusText */ }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json() as Promise<T>;
}

const q = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return s ? `?${s}` : "";
};

export const api = {
  meta: () => request<Meta>("/api/meta"),
  sessions: (limit = 60) => request<{ sessions: string[] }>(`/api/sessions?limit=${limit}`),
  estimate: (date?: string, model?: string) => request<Estimate>(`/api/estimate${q({ date, model })}`),
  live: (model?: string, force = false) =>
    request<Estimate>(`/api/estimate/live${q({ model, force: force ? "true" : undefined })}`, { method: "POST" }),
  simulate: (body: { date?: string; model?: string; overrides: Record<string, number> }) =>
    request<Simulation>("/api/simulate", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }),
  performance: (config = "A") => request<Performance>(`/api/performance?config=${config}`),
  dataQuality: () => request<DataQuality>("/api/data-quality"),
  history: () => request<History>("/api/history"),
};