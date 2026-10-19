"use client";
import type { Estimate, TimelineStop } from "@/lib/api";
import { directionWord, pct, points, tone } from "@/lib/format";

/** The pre-market morning as it unfolds in WIB: New York closes, Tokyo/Seoul open,
 *  Hong Kong/Shanghai open, then the IHSG opening estimate at 09:00. */
export default function MorningRelay({ est }: { est: Estimate }) {
  const cols: { time: string; title: string; stops: TimelineStop[] }[] = [
    { time: "03:00–04:00", title: "Bursa AS tutup", stops: est.timeline.filter((s) => s.time === "04:00") },
    { time: "07:00", title: "Tokyo & Seoul buka", stops: est.timeline.filter((s) => s.time === "07:00") },
    { time: "08:30", title: "Hong Kong & Shanghai buka", stops: est.timeline.filter((s) => s.time === "08:30") },
  ];
  const t = tone(est.y_hat);
  return (
    <section className="relay" aria-label="Urutan sinyal pra-pasar menuju pembukaan IHSG">
      <div className="relay-head">
        <h1>Pagi pasar menuju pembukaan IHSG</h1>
        <span className="small muted">
          {est.mode === "live" ? "Data terbaru dari Yahoo Finance" : "Rekonstruksi dengan data yang tersedia sebelum 09:00 WIB"}
        </span>
      </div>
      <div className="relay-track">
        {cols.map((c) => (
          <div className="relay-col" key={c.time}>
            <div className="relay-time">{c.time}</div>
            <div className="relay-dot" />
            <div className="relay-label">{c.title}</div>
            <div className="relay-stops">
            {c.stops.map((s) => (
              <div className={`relay-stop${s.closed ? " closed" : ""}`} key={s.key}>
                <div className="name">{s.label}</div>
                <div className={`val ${s.closed ? "" : tone(s.value)}`}>
                  {s.closed ? "libur" : pct(s.value, 2)}
                </div>
                <div className="venue">
                  {s.key.endsWith("_ret") ? `return semalam${s.session ? ` (sesi ${s.session.slice(5)})` : ""}` : "gap pembukaan"}
                </div>
              </div>
            ))}
            </div>
          </div>
        ))}
        <div className="relay-col relay-final">
          <div className="relay-time">09:00</div>
          <div className="relay-dot" />
          <div className="relay-label">Estimasi pembukaan IHSG</div>
          <div className="figure num">{points(est.open_hat)}</div>
          <div className={`sub ${t}`}>
            {est.direction === "UP" ? "▲" : est.direction === "DOWN" ? "▼" : "■"} {directionWord(est.direction)}{" "}
            {pct(est.y_hat, 3)} dari {points(est.prev_close)}
          </div>
        </div>
      </div>
    </section>
  );
}