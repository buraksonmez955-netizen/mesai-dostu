import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Calendar } from "@/components/ui/calendar";
import { useEntries } from "@/lib/storage";
import { tr } from "date-fns/locale";
import { ymd, parseYMD, formatHours, DAY_STATUS_LABEL, type DayStatus } from "@/lib/mesai";
import { getHoliday, holidayDatesForYear } from "@/lib/holidays";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/takvim")({
  head: () => ({ meta: [{ title: "Takvim — Mesai Defteri" }] }),
  component: TakvimPage,
});

const STATUS_DOT: Record<DayStatus, string> = {
  normal: "bg-success",
  holiday: "bg-status-holiday",
  leave: "bg-warning",
};

function TakvimPage() {
  const { entries, loaded } = useEntries();
  const navigate = useNavigate();
  const [month, setMonth] = useState<Date>(new Date());

  const datesByStatus = useMemo(() => {
    const map: Record<DayStatus, Date[]> = {
      normal: [],
      holiday: [],
      leave: [],
    };
    for (const e of entries) {
      map[e.status]?.push(parseYMD(e.date));
    }
    return map;
  }, [entries]);

  const deductionDates = useMemo(
    () =>
      entries
        .filter((e) => (e.lateHours || 0) + (e.leaveHours || 0) > 0)
        .map((e) => parseYMD(e.date)),
    [entries],
  );

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
          modifiers={{
            holiday: holidayDates,
            sNormal: datesByStatus.normal,
            sLeave: datesByStatus.leave,
            sHoliday: datesByStatus.holiday,
            hasDeduction: deductionDates,
          }}
          modifiersClassNames={{
            holiday: "!text-status-holiday font-semibold",
            sNormal:
              "!bg-success/15 !text-success-foreground !border !border-success/40 rounded-md",
            sLeave:
              "!bg-warning/20 !text-warning-foreground !border !border-warning/50 rounded-md",
            sHoliday:
              "!bg-status-holiday/15 !text-status-holiday !border !border-status-holiday/50 rounded-md",
            hasDeduction:
              "relative after:absolute after:top-0.5 after:right-0.5 after:h-1.5 after:w-1.5 after:rounded-full after:bg-destructive",
          }}
          onSelect={(d) => {
            if (d) navigate({ to: "/gun-ekle", search: { date: ymd(d) } });
          }}
          className="pointer-events-auto"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-x-3 gap-y-1.5 px-1 text-xs text-muted-foreground">
        <Legend dot="bg-success" label="Normal" />
        <Legend dot="bg-warning" label="İzinli Gün" />
        <Legend dot="bg-status-holiday" label="Resmi Tatil" />
        <Legend dot="bg-destructive" label="Kesinti var" />
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
                className="flex items-center justify-between rounded-xl border border-status-holiday/30 bg-status-holiday/5 px-3 py-2 text-sm"
              >
                <span className="font-medium text-status-holiday">{h.name}</span>
                <span className="text-xs text-muted-foreground">
                  {date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", weekday: "short" })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">Bu Ayki Kayıtlar</h2>
      {!loaded ? (
        <p className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">
          Kayıtlar yükleniyor...
        </p>
      ) : entriesThisMonth.length === 0 ? (
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
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[e.status]}`} />
                    <div>
                      <p className="text-sm font-semibold">
                        {d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", weekday: "short" })}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          • {DAY_STATUS_LABEL[e.status]}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {e.overtime50 > 0 && `%50: ${formatHours(e.overtime50)}  `}
                        {e.overtime100 > 0 && `%100: ${formatHours(e.overtime100)}  `}
                        {e.overtimeHoliday > 0 && `Tatil: ${formatHours(e.overtimeHoliday)}  `}
                        {e.lateHours > 0 && `Geç: ${formatHours(e.lateHours)}  `}
                        {e.leaveHours > 0 && `İzin: ${formatHours(e.leaveHours)}`}
                      </p>
                    </div>
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

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
