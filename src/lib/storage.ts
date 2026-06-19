import { useEffect, useState, useCallback } from "react";
import { defaultSettings, type DayEntry, type DayStatus, type Settings } from "./mesai";
import { getHoliday } from "./holidays";

const SETTINGS_KEY = "mesai.settings.v1";
const ENTRIES_KEY = "mesai.entries.v1";

function inferStatus(e: DayEntry): DayStatus {
  if (getHoliday(e.date)) return "holiday";
  const [y, m, d] = e.date.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  if (day === 0 || day === 6) return "weekendOff";
  return "normal";
}

function migrateEntries(list: DayEntry[]): DayEntry[] {
  return list.map((e) => ({
    ...e,
    overtimeHoliday: e.overtimeHoliday ?? 0,
    status: (e.status as DayStatus) ?? inferStatus(e),
  }));
}

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("mesai:update", { detail: { key } }));
  } catch {
    /* noop */
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(readLS<Settings>(SETTINGS_KEY, defaultSettings));
    setLoaded(true);
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === SETTINGS_KEY) {
        setSettings(readLS<Settings>(SETTINGS_KEY, defaultSettings));
      }
    };
    window.addEventListener("mesai:update", onUpdate);
    return () => window.removeEventListener("mesai:update", onUpdate);
  }, []);

  const save = useCallback((s: Settings) => {
    writeLS(SETTINGS_KEY, s);
    setSettings(s);
  }, []);

  return { settings, save, loaded };
}

export function useEntries() {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEntries(migrateEntries(readLS<DayEntry[]>(ENTRIES_KEY, [])));
    setLoaded(true);
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === ENTRIES_KEY) {
        setEntries(migrateEntries(readLS<DayEntry[]>(ENTRIES_KEY, [])));
      }
    };
    window.addEventListener("mesai:update", onUpdate);
    return () => window.removeEventListener("mesai:update", onUpdate);
  }, []);

  const upsert = useCallback((entry: DayEntry) => {
    const current = readLS<DayEntry[]>(ENTRIES_KEY, []);
    const idx = current.findIndex((e) => e.date === entry.date);
    let next: DayEntry[];
    if (idx >= 0) {
      next = [...current];
      next[idx] = entry;
    } else {
      next = [...current, entry];
    }
    next.sort((a, b) => (a.date < b.date ? 1 : -1));
    writeLS(ENTRIES_KEY, next);
    setEntries(next);
  }, []);

  const remove = useCallback((date: string) => {
    const current = readLS<DayEntry[]>(ENTRIES_KEY, []);
    const next = current.filter((e) => e.date !== date);
    writeLS(ENTRIES_KEY, next);
    setEntries(next);
  }, []);

  return { entries, upsert, remove, loaded };
}
