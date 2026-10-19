"use client";
import type { ReactNode } from "react";
import type { Row } from "@/lib/api";
import { modelLabel } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useAppState } from "./AppState";

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="error-box" role="alert">
      <strong>{t("ui.loadError")}</strong> {message}
      {onRetry && (
        <div style={{ marginTop: 10 }}>
          <button className="btn secondary" onClick={onRetry}>{t("ui.retry")}</button>
        </div>
      )}
    </div>
  );
}

export function Skeleton({ h = 120 }: { h?: number }) {
  return <div className="skeleton" style={{ height: h }} aria-hidden="true" />;
}

export function Panel({ title, note, right, children }: {
  title: string; note?: ReactNode; right?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {note && <p style={{ marginTop: 4 }}>{note}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/** Generic table for report rows. `format` lets a page format specific columns. */
export function DataTable({ rows, columns, format, highlight, maxRows }: {
  rows: Row[];
  columns?: { key: string; label?: string; align?: "r" }[];
  format?: Record<string, (v: Row[string], row: Row) => ReactNode>;
  highlight?: (row: Row) => boolean;
  maxRows?: number;
}) {
  const { t } = useI18n();
  if (!rows?.length) return <p className="muted small">{t("ui.empty")}</p>;
  const cols = columns ?? Object.keys(rows[0]).map((k) => ({
    key: k, label: k, align: typeof rows[0][k] === "number" ? ("r" as const) : undefined,
  }));
  const shown = maxRows ? rows.slice(0, maxRows) : rows;
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>{cols.map((c) => <th key={c.key} className={c.align}>{c.label ?? c.key}</th>)}</tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={i} className={highlight?.(r) ? "highlight" : undefined}>
              {cols.map((c) => {
                const v = r[c.key];
                const f = format?.[c.key];
                return (
                  <td key={c.key} className={c.align}>
                    {f ? f(v, r) : v == null ? "–" : typeof v === "number" ? +v.toFixed(4) : String(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {maxRows && rows.length > maxRows && (
        <p className="xs faint" style={{ marginTop: 6 }}>{t("ui.hiddenRows", { n: rows.length - maxRows })}</p>
      )}
    </div>
  );
}

/** Session date + live toggle, shared by the estimate and simulator pages. The model is always the main ensemble. */
export function SessionControls({ allowLive = true, onRefreshLive }: { allowLive?: boolean; onRefreshLive?: () => void }) {
  const { meta, date, setDate, live, setLive } = useAppState();
  const { t } = useI18n();
  if (!meta) return null;
  return (
    <div className="controls">
      {allowLive && (
        <div className="seg" role="group" aria-label={t("ctl.source")}>
          <button aria-pressed={!live} onClick={() => setLive(false)}>{t("ctl.historical")}</button>
          <button aria-pressed={live} onClick={() => setLive(true)}>{t("ctl.latest")}</button>
        </div>
      )}
      {(!live || !allowLive) && (
        <label className="field">
          {t("ctl.session")}
          <input type="date" value={date ?? meta.data_last} min={meta.replay_min} max={meta.replay_max}
            onChange={(e) => setDate(e.target.value || null)} />
        </label>
      )}
      <div className="field">
        {t("ctl.model")}
        <span className="model-badge">{modelLabel(meta.champion, meta.ensemble)}</span>
      </div>
      {live && allowLive && onRefreshLive && (
        <button className="btn secondary" onClick={onRefreshLive}>{t("ctl.refetch")}</button>
      )}
    </div>
  );
}