import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Calendar } from "@/components/ui/calendar";
import { useEntries } from "@/lib/storage";
import { tr } from "date-fns/locale";
import { ymd, parseYMD, formatHours } from "@/lib/mesai";
import { getHoliday, holidayDatesForYear } from "@/lib/holidays";
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
  const holidayDates = useMemo(
    () => holidayDatesForYear(month.getFullYear()),
    [month],
  );

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

  const monthHolidays = useMemo(
    () =>
      holidayDates
        .filter(
          (d) =>
            d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(),
        )
        .map((d) => ({ date: d, h: getHoliday(ymd(d))! }))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [holidayDates, month],
  );

  return (
    <AppLayout title="Takvim">
      <div className="card-gradient mb-4 flex justify-center rounded-2xl p-2">
        <Calendar
          mode="single"
          locale={tr}
          month={month}
          onMonthChange={setMonth}
          modifiers={{ hasEntry: entryDates, holiday: holidayDates }}
          modifiersClassNames={{
            hasEntry:
              "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
            holiday:
              "!border-2 !border-destructive !text-destructive font-semibold rounded-md",
          }}
          onSelect={(d) => {
            if (d) navigate({ to: "/gun-ekle", search: { date: ymd(d) } });
          }}
          className="pointer-events-auto"
        />
      </div>

      <div className="mb-4 flex items-center gap-4 px-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border-2 border-destructive" />
          Resmi Tatil
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Mesai Kaydı
        </span>
      </div>

      {monthHolidays.length > 0 && (
        <>
          <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
            Bu Ayki Resmi Tatiller
          </h2>
          <ul className="mb-4 space-y-1.5">
            {monthHolidays.map(({ date, h }) => (
              <li
                key={h.date}
                className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
              >
                <span className="font-medium text-destructive">{h.name}</span>
                <span className="text-xs text-muted-foreground">
                  {date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", weekday: "short" })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">Bu Ayki Kayıtlar</h2>
      {entriesThisMonth.length === 0 ? (
        <p className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">
          Bu ayda kayıt yok. Bir gün seç ve mesai ekle.
        </p>
      ) : (
        <ul className="space-y-2">
          {entriesThisMonth.map((e) => {
            const d = parseYMD(e.date);
            const h = getHoliday(e.date);
            return (
              <li key={e.date}>
                <button
                  onClick={() => navigate({ to: "/gun-ekle", search: { date: e.date } })}
                  className="card-gradient flex w-full items-center justify-between rounded-xl p-3 text-left transition active:scale-[0.99]"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", weekday: "short" })}
                      {h && <span className="ml-2 text-xs font-normal text-destructive">• {h.name}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {e.overtime50 > 0 && `%50: ${formatHours(e.overtime50)}  `}
                      {e.overtime100 > 0 && `%100: ${formatHours(e.overtime100)}  `}
                      {e.overtimeHoliday > 0 && `Tatil: ${formatHours(e.overtimeHoliday)}  `}
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
