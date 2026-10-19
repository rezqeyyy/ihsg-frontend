"use client";
import { useI18n, type Lang } from "@/lib/i18n";

const OPTIONS: { value: Lang; short: string; key: "lang.id" | "lang.en" }[] = [
  { value: "id", short: "ID", key: "lang.id" },
  { value: "en", short: "EN", key: "lang.en" },
];

export default function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label={t("lang.aria")}>
      {OPTIONS.map((o) => (
        <button key={o.value} type="button" lang={o.value} aria-pressed={lang === o.value} title={t(o.key)}
          onClick={() => setLang(o.value)}>
          {o.short}
          <span className="sr-only"> {t(o.key)}</span>
        </button>
      ))}
    </div>
  );
}