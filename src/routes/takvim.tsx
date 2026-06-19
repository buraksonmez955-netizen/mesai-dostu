import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Calendar } from "@/components/ui/calendar";
import { useEntries } from "@/lib/storage";
import { tr } from "date-fns/locale";
import { ymd, parseYMD, formatHours } from "@/lib/mesai";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/takvim")({
  head: () => ({ meta: [{ title: "Takvim — Mesai Defteri" }] }),
  component: TakvimPage,
});

function TakvimPage() {
  const { entries } = useEntries();
  const navigate = useNavigate();
  const [month, setMonth] = useState<Date>(new Date());

  const entryDates = useMemo(() => entries.map((e) => parseYMD(e.date)), [entries]);
  const entriesThisMonth = useMemo(
    () =>
      entries
        .filter((e) => {
          const d = parseYMD(e.date);
          return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
        })
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    [entries, month],
  );

  return (
    <AppLayout title="Takvim">
      <div className="card-gradient mb-4 flex justify-center rounded-2xl p-2">
        <Calendar
          mode="single"
          locale={tr}
          month={month}
          onMonthChange={setMonth}
          modifiers={{ hasEntry: entryDates }}
          modifiersClassNames={{
            hasEntry: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
          }}
          onSelect={(d) => {
            if (d) navigate({ to: "/gun-ekle", search: { date: ymd(d) } });
          }}
          className="pointer-events-auto"
        />
      </div>

      <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">Bu Ayki Kayıtlar</h2>
      {entriesThisMonth.length === 0 ? (
        <p className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">
          Bu ayda kayıt yok. Bir gün seç ve mesai ekle.
        </p>
      ) : (
        <ul className="space-y-2">
          {entriesThisMonth.map((e) => {
            const d = parseYMD(e.date);
            return (
              <li key={e.date}>
                <button
                  onClick={() => navigate({ to: "/gun-ekle", search: { date: e.date } })}
                  className="card-gradient flex w-full items-center justify-between rounded-xl p-3 text-left transition active:scale-[0.99]"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", weekday: "short" })}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {e.overtime50 > 0 && `%50: ${formatHours(e.overtime50)}  `}
                      {e.overtime100 > 0 && `%100: ${formatHours(e.overtime100)}  `}
                      {e.lateHours > 0 && `Geç: ${formatHours(e.lateHours)}  `}
                      {e.leaveHours > 0 && `İzin: ${formatHours(e.leaveHours)}`}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppLayout>
  );
}
