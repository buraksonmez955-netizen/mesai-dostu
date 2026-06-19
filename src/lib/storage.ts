import { useEffect, useState, useCallback, useRef } from "react";
import { defaultSettings, type DayEntry, type DayStatus, type Settings } from "./mesai";
import { getHoliday } from "./holidays";

// Aktif keyler (kullanıcının istediği isimlendirme)
const SETTINGS_KEY = "mesaiDefteriSettings";
const ENTRIES_KEY = "mesaiDefteriRecords";

// Eski keyler (geriye dönük uyumluluk için göç edilir)
const LEGACY_SETTINGS_KEY = "mesai.settings.v1";
const LEGACY_ENTRIES_KEY = "mesai.entries.v1";

type StoredEntries = Record<
  string,
  Partial<Omit<DayEntry, "date">> & { date?: string; overtimeType?: "50" | "100" | "holiday"; overtimeHours?: number }
>;

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSettings(value: Partial<Settings>): Settings {
  return {
    netSalary: toNumber(value.netSalary, defaultSettings.netSalary),
    weeklyHours: toNumber(value.weeklyHours, defaultSettings.weeklyHours),
    dailyHours: toNumber(value.dailyHours, defaultSettings.dailyHours),
    monthlyHours: toNumber(value.monthlyHours, defaultSettings.monthlyHours),
    holidayMultiplier: toNumber(value.holidayMultiplier, defaultSettings.holidayMultiplier),
  };
}

function inferStatus(e: DayEntry): DayStatus {
  if (getHoliday(e.date)) return "holiday";
  const [y, m, d] = e.date.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  if (day === 0 || day === 6) return "weekendOff";
  return "normal";
}

function normalizeEntry(
  entry: Partial<DayEntry> & { date: string; overtimeType?: "50" | "100" | "holiday"; overtimeHours?: number },
): DayEntry {
  const legacyOvertimeHours = toNumber(entry.overtimeHours);
  const overtime50 = toNumber(entry.overtime50) || (entry.overtimeType === "50" ? legacyOvertimeHours : 0);
  const overtime100 = toNumber(entry.overtime100) || (entry.overtimeType === "100" ? legacyOvertimeHours : 0);
  const overtimeHoliday = toNumber(entry.overtimeHoliday) || (entry.overtimeType === "holiday" ? legacyOvertimeHours : 0);
  const lateHours = toNumber(entry.lateHours);
  const leaveHours = toNumber(entry.leaveHours);

  return {
    date: entry.date,
    status: (entry.status as DayStatus) ?? inferStatus(entry as DayEntry),
    overtime50,
    overtime100,
    overtimeHoliday,
    lateHours,
    leaveHours,
    note: entry.note ?? "",
  };
}

function entriesToRecord(list: DayEntry[]): StoredEntries {
  return list.reduce<StoredEntries>((acc, entry) => {
    const { date, ...rest } = normalizeEntry(entry);
    acc[date] = rest;
    return acc;
  }, {});
}

function recordToEntries(record: StoredEntries): DayEntry[] {
  return Object.entries(record)
    .map(([date, value]) => normalizeEntry({ ...value, date: value.date ?? date }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function migrateEntries(value: unknown): DayEntry[] {
  if (Array.isArray(value)) {
    return value
      .map((e) => normalizeEntry(e as Partial<DayEntry> & { date: string }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  if (value && typeof value === "object") {
    return recordToEntries(value as StoredEntries);
  }

  return [];
}

function legacyEntryToCurrent(e: DayEntry): DayEntry {
  return normalizeEntry({
    ...e,
    overtimeHoliday: e.overtimeHoliday ?? 0,
    overtime50: e.overtime50 ?? 0,
    overtime100: e.overtime100 ?? 0,
    lateHours: e.lateHours ?? 0,
    leaveHours: e.leaveHours ?? 0,
    note: e.note ?? "",
    status: (e.status as DayStatus) ?? inferStatus(e),
  });
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
    if (raw) {
      const parsed = safeParse<unknown>(raw, null);
      if (parsed === null) return [];
      const entries = migrateEntries(parsed);
      window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(entriesToRecord(entries)));
      return entries;
    }
    // Eski key'den göç
    const legacy = window.localStorage.getItem(LEGACY_ENTRIES_KEY);
    if (legacy) {
      const migrated = migrateEntries(safeParse<unknown>(legacy, [])).map(legacyEntryToCurrent);
      window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(entriesToRecord(migrated)));
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
    if (raw) return normalizeSettings({ ...defaultSettings, ...safeParse<Partial<Settings>>(raw, {}) });
    const legacy = window.localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (legacy) {
      const merged = normalizeSettings({ ...defaultSettings, ...safeParse<Partial<Settings>>(legacy, {}) });
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
    const next = normalizeSettings(s);
    writeJSON(SETTINGS_KEY, next);
    setSettings(next);
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
    const cleanEntry = normalizeEntry(entry);
    if (current.length === 0 && typeof window !== "undefined" && window.localStorage.getItem(ENTRIES_KEY)) {
      const raw = window.localStorage.getItem(ENTRIES_KEY);
      if (raw && safeParse<unknown>(raw, null) === null) {
        setEntries((prev) => {
          const next = [...prev.filter((e) => e.date !== cleanEntry.date), cleanEntry].sort((a, b) =>
            a.date < b.date ? 1 : -1,
          );
          writeJSON(ENTRIES_KEY, entriesToRecord(next));
          return next;
        });
        return;
      }
    }
    const idx = current.findIndex((e) => e.date === cleanEntry.date);
    let next: DayEntry[];
    if (idx >= 0) {
      next = [...current];
      next[idx] = cleanEntry;
    } else {
      next = [...current, cleanEntry];
    }
    next.sort((a, b) => (a.date < b.date ? 1 : -1));
    writeJSON(ENTRIES_KEY, entriesToRecord(next));
    setEntries(next);
  }, []);

  const remove = useCallback((date: string) => {
    const current = readEntries();
    const next = current.filter((e) => e.date !== date);
    writeJSON(ENTRIES_KEY, entriesToRecord(next));
    setEntries(next);
  }, []);

  return { entries, upsert, remove, loaded };
}
