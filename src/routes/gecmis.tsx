import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useEntries, useSettings } from "@/lib/storage";
import {
  DAY_STATUS_LABEL,
  formatHours,
  formatTRY,
  holidayMultiplier,
  hourlyRate,
  MONTHS_TR,
  parseYMD,
  type DayStatus,
} from "@/lib/mesai";
import { useMemo } from "react";
import {
  Briefcase,
  ChevronRight,
  Sparkles,
  Sun,
} from "lucide-react";

const STATUS_ICON: Record<DayStatus, { Icon: typeof Briefcase; tone: string }> = {
  normal: { Icon: Briefcase, tone: "text-success" },
  holiday: { Icon: Sparkles, tone: "text-status-holiday" },
  leave: { Icon: Sun, tone: "text-warning" },
};

export const Route = createFileRoute("/gecmis")({
  head: () => ({ meta: [{ title: "Geçmiş Kayıtlar — Mesai Defteri" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { entries, loaded } = useEntries();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const rate = hourlyRate(settings);
  const hMult = holidayMultiplier(settings);

  const groups = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const d = parseYMD(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .map(([k, list]) => {
        const [y, m] = k.split("-").map(Number);
        return {
          y,
          m,
          list: list.sort((a, b) => (a.date < b.date ? 1 : -1)),
        };
      })
      .sort((a, b) => (a.y !== b.y ? b.y - a.y : b.m - a.m));
  }, [entries]);

  if (!loaded) {
    return (
      <AppLayout title="Geçmiş Kayıtlar">
        <div className="card-gradient rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">Kayıtlar yükleniyor...</p>
        </div>
      </AppLayout>
    );
  }

  if (entries.length === 0) {
    return (
      <AppLayout title="Geçmiş Kayıtlar">
        <div className="card-gradient rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">Henüz kayıt yok.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Geçmiş Kayıtlar">
      <div className="space-y-5">
        {groups.map((g) => (
          <section key={`${g.y}-${g.m}`}>
            <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
              {MONTHS_TR[g.m]} {g.y}
            </h2>
            <ul className="space-y-2">
              {g.list.map((e) => {
                const d = parseYMD(e.date);
                const otEarn =
                  rate * 1.5 * e.overtime50 +
                  rate * 2 * e.overtime100 +
                  rate * hMult * (e.overtimeHoliday || 0);
                const ded = rate * (e.lateHours + e.leaveHours);
                const net = otEarn - ded;
                const meta = STATUS_ICON[e.status];
                const Icon = meta.Icon;
                return (
                  <li key={e.date}>
                    <button
                      onClick={() => navigate({ to: "/gun-ekle", search: { date: e.date } })}
                      className="card-gradient flex w-full items-center justify-between rounded-xl p-3 text-left transition active:scale-[0.99]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted ${meta.tone}`}
                          title={DAY_STATUS_LABEL[e.status]}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">
                            {d.toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              weekday: "short",
                            })}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {DAY_STATUS_LABEL[e.status]}
                            </span>
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {e.overtime50 > 0 && `%50 ${formatHours(e.overtime50)} `}
                            {e.overtime100 > 0 && `%100 ${formatHours(e.overtime100)} `}
                            {(e.overtimeHoliday || 0) > 0 && `Tatil ${formatHours(e.overtimeHoliday)} `}
                            {e.lateHours > 0 && `Geç ${formatHours(e.lateHours)} `}
                            {e.leaveHours > 0 && `İzin ${formatHours(e.leaveHours)}`}
                            {e.note && ` • ${e.note}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${net >= 0 ? "text-success" : "text-destructive"}`}>
                          {net >= 0 ? "+" : ""}
                          {formatTRY(net)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </AppLayout>
  );
}
