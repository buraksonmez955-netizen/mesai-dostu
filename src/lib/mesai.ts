export type Settings = {
  netSalary: number;
  weeklyHours: number;
  dailyHours: number;
};

export type DayEntry = {
  date: string; // YYYY-MM-DD
  overtime50: number;
  overtime100: number;
  lateHours: number;
  leaveHours: number;
  note: string;
};

export const defaultSettings: Settings = {
  netSalary: 0,
  weeklyHours: 45,
  dailyHours: 9,
};

export function monthlyHours(s: Settings): number {
  // Türkiye standart: haftalık saat * 4.33
  return Math.max(1, s.weeklyHours * 4.33);
}

export function hourlyRate(s: Settings): number {
  if (!s.netSalary || s.netSalary <= 0) return 0;
  return s.netSalary / monthlyHours(s);
}

export function formatTRY(n: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(isFinite(n) ? n : 0);
}

export function formatHours(n: number): string {
  return `${(Math.round(n * 100) / 100).toLocaleString("tr-TR")} sa`;
}

export type MonthSummary = {
  total50Hours: number;
  total100Hours: number;
  earn50: number;
  earn100: number;
  totalOvertimeEarn: number;
  totalLateHours: number;
  totalLeaveHours: number;
  lateDeduction: number;
  leaveDeduction: number;
  totalDeduction: number;
  net: number;
};

export function summarizeMonth(
  entries: DayEntry[],
  s: Settings,
  year: number,
  month: number, // 0-indexed
): MonthSummary {
  const rate = hourlyRate(s);
  const inMonth = entries.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const total50Hours = inMonth.reduce((a, b) => a + (b.overtime50 || 0), 0);
  const total100Hours = inMonth.reduce((a, b) => a + (b.overtime100 || 0), 0);
  const totalLateHours = inMonth.reduce((a, b) => a + (b.lateHours || 0), 0);
  const totalLeaveHours = inMonth.reduce((a, b) => a + (b.leaveHours || 0), 0);

  const earn50 = rate * 1.5 * total50Hours;
  const earn100 = rate * 2 * total100Hours;
  const totalOvertimeEarn = earn50 + earn100;
  const lateDeduction = rate * totalLateHours;
  const leaveDeduction = rate * totalLeaveHours;
  const totalDeduction = lateDeduction + leaveDeduction;
  const net = s.netSalary + totalOvertimeEarn - totalDeduction;

  return {
    total50Hours,
    total100Hours,
    earn50,
    earn100,
    totalOvertimeEarn,
    totalLateHours,
    totalLeaveHours,
    lateDeduction,
    leaveDeduction,
    totalDeduction,
    net,
  };
}

export const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
