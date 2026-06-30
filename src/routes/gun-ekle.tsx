import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AppLayout } from "@/components/AppLayout";
import { useEntries, useSettings } from "@/lib/storage";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DAY_STATUS_LABEL,
  formatTRY,
  holidayMultiplier,
  hourlyRate,
  parseYMD,
  ymd,
  type DayStatus,
} from "@/lib/mesai";
import { getHoliday } from "@/lib/holidays";
import { maybeShowInterstitial } from "@/lib/ads";
import { toast } from "sonner";
import { Trash2, Save, Sparkles, Briefcase, Sun, Calendar as CalIcon } from "lucide-react";

const searchSchema = z.object({
  date: z.string().optional(),
});

export const Route = createFileRoute("/gun-ekle")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Günlük Mesai Ekle — Mesai Defteri" }] }),
  component: DayAddPage,
});

type OTType = "50" | "100" | "holiday";

const STATUS_META: Record<
  DayStatus,
  { icon: typeof Briefcase; tone: string; bg: string; border: string }
> = {
  normal: {
    icon: Briefcase,
    tone: "text-success",
    bg: "bg-success/10",
    border: "border-success",
  },
  holiday: {
    icon: Sparkles,
    tone: "text-status-holiday",
    bg: "bg-status-holiday/10",
    border: "border-status-holiday",
  },
  leave: {
    icon: Sun,
    tone: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning",
  },
};

const STATUS_ORDER: DayStatus[] = ["normal", "holiday", "leave"];

function defaultStatusFor(date: string): DayStatus {
  if (getHoliday(date)) return "holiday";
  return "normal";
}

function DayAddPage() {
  const { date: searchDate } = Route.useSearch();
  const { entries, upsert, remove } = useEntries();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const initialDate = searchDate ?? ymd(new Date());
  const [date, setDate] = useState(initialDate);
  const [status, setStatus] = useState<DayStatus>("normal");
  const [otType, setOtType] = useState<OTType>("50");
  const [otHours, setOtHours] = useState("");
  const [lateHours, setLateHours] = useState("");
  const [leaveHours, setLeaveHours] = useState("");
  const [note, setNote] = useState("");

  const existing = useMemo(() => entries.find((e) => e.date === date), [entries, date]);
  const holiday = useMemo(() => getHoliday(date), [date]);

  useEffect(() => {
    if (existing) {
      setStatus(existing.status ?? defaultStatusFor(date));
      if (existing.overtimeHoliday > 0) {
        setOtType("holiday");
        setOtHours(String(existing.overtimeHoliday));
      } else if (existing.overtime100 > 0 && existing.overtime50 === 0) {
        setOtType("100");
        setOtHours(String(existing.overtime100));
      } else {
        setOtType(holiday ? "holiday" : "50");
        setOtHours(existing.overtime50 ? String(existing.overtime50) : "");
      }
      setLateHours(existing.lateHours ? String(existing.lateHours) : "");
      setLeaveHours(existing.leaveHours ? String(existing.leaveHours) : "");
      setNote(existing.note ?? "");
    } else {
      setStatus(defaultStatusFor(date));
      setOtType(holiday ? "holiday" : "50");
      setOtHours("");
      setLateHours("");
      setLeaveHours("");
      setNote("");
    }
  }, [existing, date, holiday]);

  const num = (s: string) => Number(s.replace(",", ".")) || 0;
  const rate = hourlyRate(settings);
  const hMult = holidayMultiplier(settings);
  const ot = num(otHours);
  const otAllowed = status !== "leave";
  const effectiveOtType: OTType = status === "holiday" ? "holiday" : otType;
  const otEarn = !otAllowed
    ? 0
    : effectiveOtType === "50"
      ? rate * 1.5 * ot
      : effectiveOtType === "100"
        ? rate * 2 * ot
        : rate * hMult * ot;
  const lateDed = otAllowed ? rate * num(lateHours) : 0;
  const leaveDed = otAllowed ? rate * num(leaveHours) : 0;
  const dayNet = otEarn - lateDed - leaveDed;

  const onSave = () => {
    const o = otAllowed ? num(otHours) : 0;
    upsert({
      date,
      status,
      overtime50: otAllowed && effectiveOtType === "50" ? o : 0,
      overtime100: otAllowed && effectiveOtType === "100" ? o : 0,
      overtimeHoliday: otAllowed && effectiveOtType === "holiday" ? o : 0,
      lateHours: otAllowed ? num(lateHours) : 0,
      leaveHours: otAllowed ? num(leaveHours) : 0,
      note,
    });
    toast.success("Kayıt eklendi");
    // Geçiş reklamı (15dk throttling, bekletmez)
    void maybeShowInterstitial();
    navigate({ to: "/takvim" });
  };

  const onDelete = () => {
    if (!existing) return;
    remove(date);
    toast.success("Kayıt silindi");
    navigate({ to: "/takvim" });
  };

  const niceDate = parseYMD(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  });

  const holidayPct = Math.round((hMult - 1) * 100);

  const normalizeDecimal = (v: string) => v.trim().replace(",", ".");

  return (
    <AppLayout title="Günlük Kayıt">
      <div className="space-y-4">
        <div className="card-gradient rounded-[20px] p-5">
          <Label htmlFor="date">Tarih</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 h-12"
          />
          <p className="mt-2 text-xs text-muted-foreground">{niceDate}</p>
        </div>

        {holiday && (
          <div className="flex items-start gap-2 rounded-[20px] border-2 border-status-holiday/40 bg-status-holiday/5 p-5">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-status-holiday" />
            <div>
              <p className="text-sm font-semibold text-status-holiday">Bugün Resmi Tatil</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{holiday.name}</p>
            </div>
          </div>
        )}

        <div className="card-gradient rounded-[20px] p-5">
          <Label className="mb-3 block">Gün Durumu</Label>
          <div className="grid grid-cols-2 gap-3">
            {STATUS_ORDER.map((s) => {
              const meta = STATUS_META[s];
              const Icon = meta.icon;
              const active = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex h-12 items-center gap-2 rounded-xl border px-3 text-left text-sm font-medium transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <Icon
                    className={`shrink-0 ${active ? "text-primary-foreground" : meta.tone}`}
                    style={{ width: 22, height: 22 }}
                  />
                  <span className="truncate">{DAY_STATUS_LABEL[s]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!otAllowed ? (
          <div className="rounded-[20px] border border-border bg-muted/40 p-5 text-center text-sm text-muted-foreground">
            İzinli gün — mesai veya kesinti eklenemez.
          </div>
        ) : (
          <>
            <div className="card-gradient rounded-[20px] pt-6 pb-6 px-5">
              <Label className="mb-4 block">Fazla Mesai</Label>
              {status === "holiday" ? (
                <div className="mb-5 rounded-xl border border-status-holiday bg-status-holiday/10 p-3 text-sm text-status-holiday">
                  Resmi Tatil Mesaisi — x {hMult} (%{holidayPct})
                </div>
              ) : (
                <div className="mb-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOtType("50")}
                    className={`h-14 rounded-xl border text-sm font-medium transition ${
                      otType === "50"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    %50
                    <div className="text-[10px] opacity-80">x 1.5</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtType("100")}
                    className={`h-14 rounded-xl border text-sm font-medium transition ${
                      otType === "100"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    %100
                    <div className="text-[10px] opacity-80">x 2</div>
                  </button>
                </div>
              )}
              <Input
                inputMode="decimal"
                pattern="[0-9.,]*"
                placeholder="Mesai Saati (örn: 2.5)"
                value={otHours}
                onChange={(e) => setOtHours(e.target.value)}
                onBlur={(e) => setOtHours(normalizeDecimal(e.target.value))}
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="card-gradient rounded-[20px] p-5">
                <Label htmlFor="late" className="text-xs">
                  Geç Kalma (sa)
                </Label>
                <Input
                  id="late"
                  inputMode="decimal"
                  pattern="[0-9.,]*"
                  placeholder="0"
                  value={lateHours}
                  onChange={(e) => setLateHours(e.target.value)}
                  onBlur={(e) => setLateHours(normalizeDecimal(e.target.value))}
                  className="mt-2 h-12"
                />
              </div>
              <div className="card-gradient rounded-[20px] p-5">
                <Label htmlFor="leave" className="text-xs">
                  Ücretsiz İzin (sa)
                </Label>
                <Input
                  id="leave"
                  inputMode="decimal"
                  pattern="[0-9.,]*"
                  placeholder="0"
                  value={leaveHours}
                  onChange={(e) => setLeaveHours(e.target.value)}
                  onBlur={(e) => setLeaveHours(normalizeDecimal(e.target.value))}
                  className="mt-2 h-12"
                />
              </div>
            </div>
          </>
        )}

        <div className="card-gradient rounded-[20px] p-5">
          <Label htmlFor="note">Açıklama / Not</Label>
          <Textarea
            id="note"
            placeholder="Örn. Cumartesi vardiyası"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 min-h-20"
          />
        </div>

        <div className="primary-gradient rounded-[20px] p-5">
          <p className="text-xs uppercase tracking-widest opacity-80">Bu Günün Net Etkisi</p>
          <p className="mt-1 text-2xl font-bold">
            {dayNet >= 0 ? "+" : ""}
            {formatTRY(dayNet)}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs opacity-90">
            <CalIcon className="h-3 w-3" />
            <span>{DAY_STATUS_LABEL[status]}</span>
            {otAllowed && (
              <>
                <span>•</span>
                <span>Mesai: {formatTRY(otEarn)}</span>
                <span>•</span>
                <span>Kesinti: {formatTRY(lateDed + leaveDed)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave} className="primary-gradient h-12 flex-1 text-base font-semibold">
            <Save className="mr-2 h-4 w-4" /> Kaydet
          </Button>
          {existing && (
            <Button onClick={onDelete} variant="destructive" className="h-12">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
