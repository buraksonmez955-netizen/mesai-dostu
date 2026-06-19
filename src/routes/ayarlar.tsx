import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useSettings } from "@/lib/storage";
import { formatTRY, hourlyRate, monthlyHours } from "@/lib/mesai";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/ayarlar")({
  head: () => ({
    meta: [{ title: "Maaş Ayarları — Mesai Defteri" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, save, loaded } = useSettings();
  const navigate = useNavigate();
  const [netSalary, setNetSalary] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [dailyHours, setDailyHours] = useState("");

  useEffect(() => {
    if (loaded) {
      setNetSalary(settings.netSalary ? String(settings.netSalary) : "");
      setWeeklyHours(String(settings.weeklyHours));
      setDailyHours(String(settings.dailyHours));
    }
  }, [loaded, settings]);

  const parsed = {
    netSalary: Number(netSalary.replace(",", ".")) || 0,
    weeklyHours: Number(weeklyHours.replace(",", ".")) || 45,
    dailyHours: Number(dailyHours.replace(",", ".")) || 9,
  };
  const rate = hourlyRate(parsed);

  const onSave = () => {
    if (parsed.netSalary <= 0) {
      toast.error("Lütfen geçerli bir maaş gir");
      return;
    }
    save(parsed);
    toast.success("Ayarlar kaydedildi");
    navigate({ to: "/" });
  };

  return (
    <AppLayout title="Maaş Ayarları">
      <div className="space-y-4">
        <div className="card-gradient rounded-2xl p-5">
          <Label htmlFor="salary" className="text-sm font-medium">Aylık Net Maaş (₺)</Label>
          <Input
            id="salary"
            inputMode="decimal"
            placeholder="Örn. 30000"
            value={netSalary}
            onChange={(e) => setNetSalary(e.target.value)}
            className="mt-2 h-12 text-lg"
          />
        </div>

        <div className="card-gradient rounded-2xl p-5">
          <Label htmlFor="weekly" className="text-sm font-medium">Haftalık Çalışma Saati</Label>
          <Input
            id="weekly"
            inputMode="decimal"
            placeholder="45"
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(e.target.value)}
            className="mt-2 h-12 text-lg"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Türkiye'de yasal üst sınır haftalık 45 saattir.
          </p>
        </div>

        <div className="card-gradient rounded-2xl p-5">
          <Label htmlFor="daily" className="text-sm font-medium">Günlük Normal Çalışma Saati</Label>
          <Input
            id="daily"
            inputMode="decimal"
            placeholder="9"
            value={dailyHours}
            onChange={(e) => setDailyHours(e.target.value)}
            className="mt-2 h-12 text-lg"
          />
        </div>

        <div className="primary-gradient rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest opacity-80">Hesaplanan Saatlik Ücret</p>
          <p className="mt-1 text-3xl font-bold">{formatTRY(rate)}</p>
          <p className="mt-1 text-xs opacity-80">
            Aylık {Math.round(monthlyHours(parsed))} saat üzerinden
          </p>
        </div>

        <Button onClick={onSave} className="primary-gradient h-12 w-full text-base font-semibold">
          <Save className="mr-2 h-4 w-4" /> Kaydet
        </Button>
      </div>
    </AppLayout>
  );
}
