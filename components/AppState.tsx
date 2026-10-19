"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type Meta } from "@/lib/api";

interface State {
  meta: Meta | null;
  metaError: string | null;
  date: string | null;          // selected IHSG session (replay); null = latest in data
  setDate: (d: string | null) => void;
  model: string | null;         // always null = the main model (ensemble) chosen by the notebook
  live: boolean;                // use yfinance instead of replay
  setLive: (v: boolean) => void;
}

const Ctx = createContext<State | null>(null);

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string | null) => {
  try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* private mode */ }
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [date, setDateS] = useState<string | null>(null);
  const model = null;
  const [live, setLiveS] = useState(false);

  useEffect(() => {
    setDateS(read("ihsg.date"));
    write("ihsg.model", null);  // forget a model picked in older versions of the site
    setLiveS(read("ihsg.live") === "1");
    api.meta().then(setMeta).catch((e: Error) => setMetaError(e.message));
  }, []);

  const value: State = {
    meta, metaError, date, model, live,
    setDate: (d) => { setDateS(d); write("ihsg.date", d); },
    setLive: (v) => { setLiveS(v); write("ihsg.live", v ? "1" : null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used inside AppStateProvider");
  return v;
}