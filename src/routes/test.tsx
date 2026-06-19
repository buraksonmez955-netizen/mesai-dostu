import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CheckCircle2, Circle, Info } from "lucide-react";

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "Test Kontrol Listesi — Mesai Defteri" },
      { name: "description", content: "Yayın öncesi test kontrol listesi." },
    ],
  }),
  component: TestPage,
});

const STORAGE_KEY = "mesai_test_checklist";

const ITEMS: Array<{ id: string; label: string; hint: string }> = [
  { id: "salary", label: "Maaş girildi mi?", hint: "Ayarlar ekranından aylık net maaşının doğru girildiğini kontrol et." },
  { id: "ot50", label: "%50 mesai doğru hesaplanıyor mu?", hint: "Saatlik ücret × %50 mesai saati × 1.5 formülü uygulanıyor." },
  { id: "ot100", label: "%100 mesai doğru hesaplanıyor mu?", hint: "Saatlik ücret × %100 mesai saati × 2 formülü uygulanıyor." },
  { id: "leave", label: "İzinli gün doğru görünüyor mu?", hint: "İzinli günler takvimde ve raporda işaretli mi?" },
  { id: "holiday", label: "Resmi tatil doğru görünüyor mu?", hint: "Resmi tatil günleri ayrı etiketle gözüküyor mu?" },
  { id: "persist", label: "Kayıtlar uygulamadan çıkıp girince duruyor mu?", hint: "Sayfayı yenile veya preview'dan çıkıp gir — kayıtlar yerinde olmalı." },
];

function TestPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {}
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const done = ITEMS.filter((i) => checked[i.id]).length;

  return (
    <AppLayout title="Test Kontrol Listesi">
      <div className="card-gradient mb-4 rounded-2xl p-4">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Bu ekran yalnızca bilgi amaçlıdır. Hesaplamalara veya kayıtlara dokunmaz.
            Yayın öncesi maddeleri tek tek doğrula.
          </p>
        </div>
        <p className="mt-3 text-sm font-medium">
          Tamamlanan: {done} / {ITEMS.length}
        </p>
      </div>

      <ul className="space-y-2">
        {ITEMS.map((item) => {
          const isOn = !!checked[item.id];
          return (
            <li key={item.id}>
              <button
                onClick={() => toggle(item.id)}
                className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition active:scale-[0.99]"
              >
                {isOn ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <p className={`text-sm font-medium ${isOn ? "line-through text-muted-foreground" : ""}`}>
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <Link
        to="/"
        className="mt-6 block rounded-xl bg-primary p-3 text-center text-sm font-medium text-primary-foreground"
      >
        Ana sayfaya dön
      </Link>
    </AppLayout>
  );
}
