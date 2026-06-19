import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useEntries, useSettings } from "@/lib/storage";
import { formatTRY, hourlyRate, summarizeMonth, MONTHS_TR, formatHours } from "@/lib/mesai";
import { ArrowRight, Clock, TrendingUp, Wallet, Calendar as CalendarIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ana Sayfa — Mesai Defteri" },
      { name: "description", content: "Bu ayki maaş, mesai ve net kazancınıza bir bakışta ulaşın." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { settings, loaded: settingsLoaded } = useSettings();
  const { entries, loaded: entriesLoaded } = useEntries();
  const loaded = settingsLoaded && entriesLoaded;
  const now = new Date();
  const summary = useMemo(
    () => summarizeMonth(entries, settings, now.getFullYear(), now.getMonth()),
    [entries, settings, now.getFullYear(), now.getMonth()],
  );
  const rate = useMemo(() => hourlyRate(settings), [settings]);
  const monthLabel = `${MONTHS_TR[now.getMonth()]} ${now.getFullYear()}`;

  const needsSetup = loaded && (!settings.netSalary || settings.netSalary <= 0);

  if (!loaded) {
    return (
      <AppLayout title={monthLabel}>
        <div className="card-gradient rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">Kayıtlar yükleniyor...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={monthLabel}>
      {needsSetup && (
        <Link
          to="/ayarlar"
          className="mb-4 flex items-center justify-between rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm"
        >
          <span className="font-medium text-warning-foreground">
            Önce maaş ve çalışma saatlerini ayarla
          </span>
          <ArrowRight className="h-4 w-4 text-warning-foreground" />
        </Link>
      )}

      <div className="primary-gradient mb-4 rounded-2xl p-5 shadow-[var(--shadow-elevated)]">
        <p className="text-xs uppercase tracking-widest opacity-80">Tahmini Ay Sonu Net</p>
        <p className="mt-1 text-3xl font-bold">{formatTRY(summary.net)}</p>
        <div className="mt-4 flex items-center justify-between text-xs opacity-90">
          <span>Saatlik ücret</span>
          <span className="font-semibold">{formatTRY(rate)}</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-success" />}
          label="Mesai Kazancı"
          value={formatTRY(summary.totalOvertimeEarn)}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4 text-destructive" />}
          label="Kesinti"
          value={formatTRY(summary.totalDeduction)}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-primary" />}
          label="%50 Mesai"
          value={formatHours(summary.total50Hours)}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-info" />}
          label="%100 Mesai"
          value={formatHours(summary.total100Hours)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/gun-ekle"
          className="card-gradient flex flex-col items-start rounded-2xl p-4 transition active:scale-[0.98]"
        >
          <CalendarIcon className="mb-2 h-5 w-5 text-primary" />
          <p className="font-semibold">Gün Ekle</p>
          <p className="text-xs text-muted-foreground">Mesai, geç kalma, izin</p>
        </Link>
        <Link
          to="/rapor"
          className="card-gradient flex flex-col items-start rounded-2xl p-4 transition active:scale-[0.98]"
        >
          <TrendingUp className="mb-2 h-5 w-5 text-success" />
          <p className="font-semibold">Aylık Rapor</p>
          <p className="text-xs text-muted-foreground">Tüm detaylar</p>
        </Link>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-gradient rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
