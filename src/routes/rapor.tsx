import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useEntries, useSettings } from "@/lib/storage";
import { formatHours, formatTRY, hourlyRate, MONTHS_TR, summarizeMonth } from "@/lib/mesai";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/rapor")({
  head: () => ({ meta: [{ title: "Aylık Rapor — Mesai Defteri" }] }),
  component: ReportPage,
});

function ReportPage() {
  const { entries } = useEntries();
  const { settings } = useSettings();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const summary = summarizeMonth(entries, settings, year, month);
  const rate = hourlyRate(settings);

  const change = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <AppLayout title="Aylık Rapor">
      <div className="mb-4 flex items-center justify-between rounded-xl bg-card p-2 shadow-[var(--shadow-card)]">
        <button onClick={() => change(-1)} className="rounded-lg p-2 hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-base font-semibold">
          {MONTHS_TR[month]} {year}
        </p>
        <button onClick={() => change(1)} className="rounded-lg p-2 hover:bg-muted">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="primary-gradient mb-4 rounded-2xl p-5">
        <p className="text-xs uppercase tracking-widest opacity-80">Tahmini Ay Sonu Net Ödeme</p>
        <p className="mt-1 text-3xl font-bold">{formatTRY(summary.net)}</p>
        <p className="mt-2 text-xs opacity-80">Saatlik ücret: {formatTRY(rate)}</p>
      </div>

      <Section title="Maaş">
        <Row label="Aylık Net Maaş" value={formatTRY(settings.netSalary)} />
      </Section>

      <Section title="Fazla Mesai">
        <Row label="Toplam %50 Mesai" value={formatHours(summary.total50Hours)} />
        <Row label="%50 Mesai Kazancı" value={formatTRY(summary.earn50)} />
        <Row label="Toplam %100 Mesai" value={formatHours(summary.total100Hours)} />
        <Row label="%100 Mesai Kazancı" value={formatTRY(summary.earn100)} />
        <Row label="Toplam Mesai Kazancı" value={formatTRY(summary.totalOvertimeEarn)} strong tone="success" />
      </Section>

      <Section title="Kesintiler">
        <Row label="Toplam Geç Kalma" value={formatHours(summary.totalLateHours)} />
        <Row label="Geç Kalma Kesintisi" value={formatTRY(summary.lateDeduction)} />
        <Row label="Toplam Ücretsiz İzin" value={formatHours(summary.totalLeaveHours)} />
        <Row label="İzin Kesintisi" value={formatTRY(summary.leaveDeduction)} />
        <Row label="Toplam Kesinti" value={formatTRY(summary.totalDeduction)} strong tone="destructive" />
      </Section>
    </AppLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-gradient mb-4 overflow-hidden rounded-2xl">
      <h3 className="border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "success" | "destructive";
}) {
  const toneClass =
    tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "";
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${strong ? "text-base font-bold" : "font-medium"} ${toneClass}`}>{value}</span>
    </div>
  );
}
