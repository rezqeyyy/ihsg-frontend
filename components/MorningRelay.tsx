"use client";
import type { Estimate, TimelineStop } from "@/lib/api";
import { directionWord, pct, points, tone } from "@/lib/format";
import { useI18n, type TKey } from "@/lib/i18n";

/** The pre-market morning as it unfolds in WIB: New York closes, Tokyo/Seoul open,
 *  Hong Kong/Shanghai open, then the IHSG opening estimate at 09:00. */
export default function MorningRelay({ est }: { est: Estimate }) {
  const { t } = useI18n();
  const cols: { time: string; title: TKey; stops: TimelineStop[] }[] = [
    { time: "03:00–04:00", title: "relay.us", stops: est.timeline.filter((s) => s.time === "04:00") },
    { time: "07:00", title: "relay.tokyo", stops: est.timeline.filter((s) => s.time === "07:00") },
    { time: "08:30", title: "relay.hk", stops: est.timeline.filter((s) => s.time === "08:30") },
  ];
  const tn = tone(est.y_hat);
  return (
    <section className="relay" aria-label={t("relay.aria")}>
      <div className="relay-head">
        <h1>{t("relay.title")}</h1>
        <span className="small muted">{est.mode === "live" ? t("relay.live") : t("relay.replay")}</span>
      </div>
      <div className="relay-track">
        {cols.map((c) => (
          <div className="relay-col" key={c.time}>
            <div className="relay-time">{c.time}</div>
            <div className="relay-dot" />
            <div className="relay-label">{t(c.title)}</div>
            <div className="relay-stops">
              {c.stops.map((s) => (
                <div className={`relay-stop${s.closed ? " closed" : ""}`} key={s.key}>
                  <div className="name">{s.label}</div>
                  <div className={`val ${s.closed ? "" : tone(s.value)}`}>
                    {s.closed ? t("relay.closed") : pct(s.value, 2)}
                  </div>
                  <div className="venue">
                    {s.key.endsWith("_ret")
                      ? `${t("relay.overnight")}${s.session ? ` (${t("relay.session", { d: s.session.slice(5) })})` : ""}`
                      : t("relay.gap")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="relay-col relay-final">
          <div className="relay-time">09:00</div>
          <div className="relay-dot" />
          <div className="relay-label">{t("relay.estimate")}</div>
          <div className="figure num">{points(est.open_hat)}</div>
          <div className={`sub ${tn}`}>
            {est.direction === "UP" ? "▲" : est.direction === "DOWN" ? "▼" : "■"} {directionWord(est.direction)}{" "}
            {pct(est.y_hat, 3)} {t("relay.from")} {points(est.prev_close)}
          </div>
        </div>
      </div>
    </section>
  );
}