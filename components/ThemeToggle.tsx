"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

type Theme = "light" | "dark";
const KEY = "ihsg.theme";

/** Runs in <head> before React hydrates, so the saved theme is applied without a flash.
 *  With no saved choice the site starts in the device's theme (prefers-color-scheme in CSS). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

/** Theme currently on screen: the saved choice, otherwise the device preference. */
function resolved(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem(KEY, t); } catch { /* private mode: still applies for this visit */ }
}

export default function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(resolved());
    // follow device changes until the user picks a theme explicitly
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => { if (!document.documentElement.hasAttribute("data-theme")) setTheme(resolved()); };
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  const choose = (v: Theme) => { setTheme(v); apply(v); };
  return (
    <div className="theme-switch" role="group" aria-label={t("theme.aria")}>
      <button type="button" aria-pressed={theme === "light"} title={t("theme.light")} onClick={() => choose("light")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
        </svg>
        <span className="sr-only">{t("theme.light")}</span>
      </button>
      <button type="button" aria-pressed={theme === "dark"} title={t("theme.dark")} onClick={() => choose("dark")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 14.6A8 8 0 0 1 9.4 4a8 8 0 1 0 10.6 10.6Z" />
        </svg>
        <span className="sr-only">{t("theme.dark")}</span>
      </button>
    </div>
  );
}