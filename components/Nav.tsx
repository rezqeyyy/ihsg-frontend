"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "/", label: "Estimasi" },
  { href: "/simulator", label: "Simulator" },
  { href: "/performance", label: "Performa model" },
  { href: "/history", label: "Riwayat" },
  { href: "/data", label: "Kualitas data" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="IHSG Opening Estimator, beranda">
          <svg className="brand-mark" viewBox="0 0 26 26" aria-hidden="true">
            <circle cx="13" cy="17" r="7" fill="var(--dawn)" />
            <rect x="2" y="17" width="22" height="7" fill="var(--paper)" />
            <path d="M2 17h22" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 11l4-3 4 2 4-5 4 2" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            IHSG Opening Estimator
            <small>estimasi sebelum bursa buka pukul 09:00 WIB</small>
          </span>
        </Link>
        <nav className="nav" aria-label="Halaman">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}