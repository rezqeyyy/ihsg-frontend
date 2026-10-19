"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n, type TKey } from "@/lib/i18n";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";

const LINKS: { href: string; key: TKey }[] = [
  { href: "/", key: "nav.estimate" },
  { href: "/simulator", key: "nav.simulator" },
  { href: "/performance", key: "nav.performance" },
  { href: "/history", key: "nav.history" },
  { href: "/data", key: "nav.data" },
];

export default function Nav() {
  const path = usePathname();
  const { t } = useI18n();
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label={t("brand.home")}>
          <svg className="brand-mark" viewBox="0 0 26 26" aria-hidden="true">
            <circle cx="13" cy="17" r="7" fill="var(--dawn)" />
            <rect x="2" y="17" width="22" height="7" fill="var(--paper)" />
            <path d="M2 17h22" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 11l4-3 4 2 4-5 4 2" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            IHSG Opening Estimator
            <small>{t("brand.sub")}</small>
          </span>
        </Link>
        <nav className="nav" aria-label={t("nav.aria")}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className="top-actions">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}