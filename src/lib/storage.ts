import { useEffect, useState, useCallback, useRef } from "react";
import { defaultSettings, type DayEntry, type DayStatus, type Settings } from "./mesai";
import { getHoliday } from "./holidays";

// Aktif keyler (kullanıcının istediği isimlendirme)
const SETTINGS_KEY = "mesaiDefteriSettings";
const ENTRIES_KEY = "mesaiDefteriRecords";

// Eski keyler (geriye dönük uyumluluk için göç edilir)
const LEGACY_SETTINGS_KEY = "mesai.settings.v1";
const LEGACY_ENTRIES_KEY = "mesai.entries.v1";

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
    overtime50: e.overtime50 ?? 0,
    overtime100: e.overtime100 ?? 0,
    lateHours: e.lateHours ?? 0,
    leaveHours: e.leaveHours ?? 0,
    note: e.note ?? "",
    status: (e.status as DayStatus) ?? inferStatus(e),
  }));
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Kayıtları oku — yeni key yoksa eski key'den göç et. */
function readEntries(): DayEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ENTRIES_KEY);
    if (raw) return migrateEntries(safeParse<DayEntry[]>(raw, []));
    // Eski key'den göç
    const legacy = window.localStorage.getItem(LEGACY_ENTRIES_KEY);
    if (legacy) {
      const migrated = migrateEntries(safeParse<DayEntry[]>(legacy, []));
      window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return [];
  } catch {
    return [];
  }
}

function readSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...safeParse<Partial<Settings>>(raw, {}) };
    const legacy = window.localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (legacy) {
      const merged = { ...defaultSettings, ...safeParse<Partial<Settings>>(legacy, {}) };
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      return merged;
    }
    return defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function writeJSON(key: string, value: unknown) {
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
    setSettings(readSettings());
    setLoaded(true);
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === SETTINGS_KEY) setSettings(readSettings());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === SETTINGS_KEY) setSettings(readSettings());
    };
    window.addEventListener("mesai:update", onUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("mesai:update", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const save = useCallback((s: Settings) => {
    writeJSON(SETTINGS_KEY, s);
    setSettings(s);
  }, []);

  return { settings, save, loaded };
}

export function useEntries() {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    setEntries(readEntries());
    setLoaded(true);
    loadedRef.current = true;
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === ENTRIES_KEY) setEntries(readEntries());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ENTRIES_KEY) setEntries(readEntries());
    };
    window.addEventListener("mesai:update", onUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("mesai:update", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const upsert = useCallback((entry: DayEntry) => {
    // Her zaman localStorage'dan oku — race condition'ı önle
    const current = readEntries();
    const idx = current.findIndex((e) => e.date === entry.date);
    let next: DayEntry[];
    if (idx >= 0) {
      next = [...current];
      next[idx] = entry;
    } else {
      next = [...current, entry];
    }
    next.sort((a, b) => (a.date < b.date ? 1 : -1));
    writeJSON(ENTRIES_KEY, next);
    setEntries(next);
  }, []);

  const remove = useCallback((date: string) => {
    const current = readEntries();
    const next = current.filter((e) => e.date !== date);
    writeJSON(ENTRIES_KEY, next);
    setEntries(next);
  }, []);

  return { entries, upsert, remove, loaded };
}
