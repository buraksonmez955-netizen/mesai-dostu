import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AppLayout } from "@/components/AppLayout";
import { useEntries, useSettings } from "@/lib/storage";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatTRY, hourlyRate, parseYMD, ymd } from "@/lib/mesai";
import { toast } from "sonner";
import { Trash2, Save } from "lucide-react";

const searchSchema = z.object({
  date: z.string().optional(),
});

export const Route = createFileRoute("/gun-ekle")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Günlük Mesai Ekle — Mesai Defteri" }] }),
  component: DayAddPage,
});

type OTType = "50" | "100";

function DayAddPage() {
  const { date: searchDate } = Route.useSearch();
  const { entries, upsert, remove } = useEntries();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const initialDate = searchDate ?? ymd(new Date());
  const [date, setDate] = useState(initialDate);
  const [otType, setOtType] = useState<OTType>("50");
  const [otHours, setOtHours] = useState("");
  const [lateHours, setLateHours] = useState("");
  const [leaveHours, setLeaveHours] = useState("");
  const [note, setNote] = useState("");

  const existing = useMemo(() => entries.find((e) => e.date === date), [entries, date]);

  useEffect(() => {
    if (existing) {
      if (existing.overtime100 > 0 && existing.overtime50 === 0) {
        setOtType("100");
        setOtHours(String(existing.overtime100));
      } else {
        setOtType("50");
        setOtHours(existing.overtime50 ? String(existing.overtime50) : "");
      }
      setLateHours(existing.lateHours ? String(existing.lateHours) : "");
      setLeaveHours(existing.leaveHours ? String(existing.leaveHours) : "");
      setNote(existing.note ?? "");
    } else {
      setOtType("50");
      setOtHours("");
      setLateHours("");
      setLeaveHours("");
      setNote("");
    }
  }, [existing, date]);

  const num = (s: string) => Number(s.replace(",", ".")) || 0;
  const rate = hourlyRate(settings);
  const ot = num(otHours);
  const otEarn = otType === "50" ? rate * 1.5 * ot : rate * 2 * ot;
  const lateDed = rate * num(lateHours);
  const leaveDed = rate * num(leaveHours);
  const dayNet = otEarn - lateDed - leaveDed;

  const onSave = () => {
    upsert({
      date,
      overtime50: otType === "50" ? num(otHours) : 0,
      overtime100: otType === "100" ? num(otHours) : 0,
      lateHours: num(lateHours),
      leaveHours: num(leaveHours),
      note,
    });
    toast.success("Kayıt eklendi");
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

  return (
    <AppLayout title="Günlük Kayıt">
      <div className="space-y-4">
        <div className="card-gradient rounded-2xl p-5">
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

        <div className="card-gradient rounded-2xl p-5">
          <Label className="mb-2 block">Fazla Mesai</Label>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOtType("50")}
              className={`rounded-xl border p-3 text-sm font-medium transition ${
                otType === "50"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              %50 Mesai
              <div className="text-[10px] opacity-75">x 1.5</div>
            </button>
            <button
              type="button"
              onClick={() => setOtType("100")}
              className={`rounded-xl border p-3 text-sm font-medium transition ${
                otType === "100"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              %100 Mesai
              <div className="text-[10px] opacity-75">x 2</div>
            </button>
          </div>
          <Input
            inputMode="decimal"
            placeholder="Saat (örn. 2.5)"
            value={otHours}
            onChange={(e) => setOtHours(e.target.value)}
            className="h-12"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card-gradient rounded-2xl p-4">
            <Label htmlFor="late" className="text-xs">Geç Kalma (sa)</Label>
            <Input
              id="late"
              inputMode="decimal"
              placeholder="0"
              value={lateHours}
              onChange={(e) => setLateHours(e.target.value)}
              className="mt-2 h-11"
            />
          </div>
          <div className="card-gradient rounded-2xl p-4">
            <Label htmlFor="leave" className="text-xs">Ücretsiz İzin (sa)</Label>
            <Input
              id="leave"
              inputMode="decimal"
              placeholder="0"
              value={leaveHours}
              onChange={(e) => setLeaveHours(e.target.value)}
              className="mt-2 h-11"
            />
          </div>
        </div>

        <div className="card-gradient rounded-2xl p-5">
          <Label htmlFor="note">Açıklama / Not</Label>
          <Textarea
            id="note"
            placeholder="Örn. Cumartesi vardiyası"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 min-h-20"
          />
        </div>

        <div className="primary-gradient rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest opacity-80">Bu Günün Net Etkisi</p>
          <p className={`mt-1 text-2xl font-bold ${dayNet < 0 ? "" : ""}`}>
            {dayNet >= 0 ? "+" : ""}
            {formatTRY(dayNet)}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs opacity-90">
            <span>Mesai: {formatTRY(otEarn)}</span>
            <span>Kesinti: {formatTRY(lateDed + leaveDed)}</span>
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
