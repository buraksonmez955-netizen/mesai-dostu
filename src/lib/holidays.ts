// Türkiye resmi tatilleri ve dini bayramlar
// Sabit milli bayramlar her yıl otomatik üretilir.
// Dini bayramlar (Ramazan, Kurban) yıl bazlı tablo halinde tutulur.

export type Holiday = {
  date: string; // YYYY-MM-DD
  name: string;
  type: "national" | "religious";
};

// Sabit (Gregorian) milli/resmi tatiller
const FIXED: Array<{ month: number; day: number; name: string }> = [
  { month: 1, day: 1, name: "Yılbaşı" },
  { month: 4, day: 23, name: "Ulusal Egemenlik ve Çocuk Bayramı" },
  { month: 5, day: 1, name: "Emek ve Dayanışma Günü" },
  { month: 5, day: 19, name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
  { month: 7, day: 15, name: "Demokrasi ve Milli Birlik Günü" },
  { month: 8, day: 30, name: "Zafer Bayramı" },
  { month: 10, day: 29, name: "Cumhuriyet Bayramı" },
];

// Dini bayram başlangıç tarihleri (Türkiye için Diyanet takvimi)
// Ramazan Bayramı 3 gün, Kurban Bayramı 4 gün.
type ReligiousStart = { ramazan: [number, number, number]; kurban: [number, number, number] };
const RELIGIOUS: Record<number, ReligiousStart> = {
  2024: { ramazan: [2024, 4, 10], kurban: [2024, 6, 16] },
  2025: { ramazan: [2025, 3, 30], kurban: [2025, 6, 6] },
  2026: { ramazan: [2026, 3, 20], kurban: [2026, 5, 27] },
  2027: { ramazan: [2027, 3, 9], kurban: [2027, 5, 17] },
  2028: { ramazan: [2028, 2, 26], kurban: [2028, 5, 5] },
  2029: { ramazan: [2029, 2, 14], kurban: [2029, 4, 24] },
  2030: { ramazan: [2030, 2, 4], kurban: [2030, 4, 13] },
  2031: { ramazan: [2031, 1, 24], kurban: [2031, 4, 2] },
  2032: { ramazan: [2032, 1, 14], kurban: [2032, 3, 22] },
};

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addDays(y: number, m: number, d: number, n: number): [number, number, number] {
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return [dt.getFullYear(), dt.getMonth() + 1, dt.getDate()];
}

export function getHolidays(year: number): Holiday[] {
  const list: Holiday[] = FIXED.map((h) => ({
    date: ymd(year, h.month, h.day),
    name: h.name,
    type: "national" as const,
  }));

  const rel = RELIGIOUS[year];
  if (rel) {
    for (let i = 0; i < 3; i++) {
      const [y, m, d] = addDays(...rel.ramazan, i);
      list.push({
        date: ymd(y, m, d),
        name: i === 0 ? "Ramazan Bayramı (1. Gün)" : `Ramazan Bayramı (${i + 1}. Gün)`,
        type: "religious",
      });
    }
    for (let i = 0; i < 4; i++) {
      const [y, m, d] = addDays(...rel.kurban, i);
      list.push({
        date: ymd(y, m, d),
        name: i === 0 ? "Kurban Bayramı (1. Gün)" : `Kurban Bayramı (${i + 1}. Gün)`,
        type: "religious",
      });
    }
  }
  return list;
}

// Cache: yıl -> Map<date, Holiday>
const cache = new Map<number, Map<string, Holiday>>();

function indexFor(year: number): Map<string, Holiday> {
  let idx = cache.get(year);
  if (!idx) {
    idx = new Map(getHolidays(year).map((h) => [h.date, h]));
    cache.set(year, idx);
  }
  return idx;
}

export function getHoliday(dateStr: string): Holiday | undefined {
  const year = Number(dateStr.slice(0, 4));
  return indexFor(year).get(dateStr);
}

export function isHoliday(dateStr: string): boolean {
  return !!getHoliday(dateStr);
}

export function holidayDatesForMonth(year: number, month0: number): Date[] {
  return getHolidays(year)
    .filter((h) => Number(h.date.slice(5, 7)) === month0 + 1)
    .map((h) => {
      const [y, m, d] = h.date.split("-").map(Number);
      return new Date(y, m - 1, d);
    });
}

export function holidayDatesForYear(year: number): Date[] {
  return getHolidays(year).map((h) => {
    const [y, m, d] = h.date.split("-").map(Number);
    return new Date(y, m - 1, d);
  });
}
