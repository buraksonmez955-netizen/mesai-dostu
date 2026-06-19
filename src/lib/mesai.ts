import { isHoliday } from "./holidays";

export type Settings = {
  netSalary: number;
  weeklyHours: number;
  dailyHours: number;
  monthlyHours: number;
  /** Resmi tatil mesaisi katsayısı (varsayılan 2.0 = %100 zamlı) */
  holidayMultiplier: number;
};

export type DayStatus =
  | "normal"
  | "halfLeave"
  | "fullLeave"
  | "sick"
  | "holiday"
  | "weekendOff";

export const DAY_STATUS_LABEL: Record<DayStatus, string> = {
  normal: "Normal Çalışma",
  halfLeave: "Yarım Gün İzin",
  fullLeave: "Tam Gün İzin",
  sick: "Raporlu",
  holiday: "Resmi Tatil",
  weekendOff: "Hafta Tatili",
};

export type DayEntry = {
  date: string; // YYYY-MM-DD
  status: DayStatus;
  overtime50: number;
  overtime100: number;
  /** Resmi tatil mesaisi saati */
  overtimeHoliday: number;
  lateHours: number;
  leaveHours: number;
  note: string;
};

export const defaultSettings: Settings = {
  netSalary: 0,
  weeklyHours: 45,
  dailyHours: 9,
  monthlyHours: 225,
  holidayMultiplier: 2,
};

export function monthlyHours(s: Settings): number {
  return Math.max(1, s.monthlyHours || 225);
}

export function hourlyRate(s: Settings): number {
  if (!s.netSalary || s.netSalary <= 0) return 0;
  return s.netSalary / monthlyHours(s);
}

export function holidayMultiplier(s: Settings): number {
  return s.holidayMultiplier && s.holidayMultiplier > 0 ? s.holidayMultiplier : 2;
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
  totalHolidayHours: number;
  earn50: number;
  earn100: number;
  earnHoliday: number;
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
  const hMult = holidayMultiplier(s);
  const inMonth = entries.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const total50Hours = inMonth.reduce((a, b) => a + (b.overtime50 || 0), 0);
  const total100Hours = inMonth.reduce((a, b) => a + (b.overtime100 || 0), 0);
  const totalHolidayHours = inMonth.reduce((a, b) => a + (b.overtimeHoliday || 0), 0);
  const totalLateHours = inMonth.reduce((a, b) => a + (b.lateHours || 0), 0);
  const totalLeaveHours = inMonth.reduce((a, b) => a + (b.leaveHours || 0), 0);

  const earn50 = rate * 1.5 * total50Hours;
  const earn100 = rate * 2 * total100Hours;
  const earnHoliday = rate * hMult * totalHolidayHours;
  const totalOvertimeEarn = earn50 + earn100 + earnHoliday;
  const lateDeduction = rate * totalLateHours;
  const leaveDeduction = rate * totalLeaveHours;
  const totalDeduction = lateDeduction + leaveDeduction;
  const net = s.netSalary + totalOvertimeEarn - totalDeduction;

  return {
    total50Hours,
    total100Hours,
    totalHolidayHours,
    earn50,
    earn100,
    earnHoliday,
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

export { isHoliday };
