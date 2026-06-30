import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Settings, Calendar, PlusCircle, BarChart3, History } from "lucide-react";
import type { ReactNode } from "react";

const nav: Array<{ to: string; label: string; icon: typeof Home; highlight?: boolean }> = [
  { to: "/", label: "Ana", icon: Home },
  { to: "/takvim", label: "Takvim", icon: Calendar },
  { to: "/gun-ekle", label: "Ekle", icon: PlusCircle, highlight: true },
  { to: "/rapor", label: "Rapor", icon: BarChart3 },
  { to: "/gecmis", label: "Geçmiş", icon: History },
];

export function AppLayout({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background app-shell">
      <header className="primary-gradient sticky top-0 z-10 px-5 pt-6 pb-5 shadow-[var(--shadow-elevated)]">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest opacity-80">Mesai Defteri</p>
            <h1 className="text-xl font-semibold leading-tight">{title}</h1>
          </div>
          <Link
            to="/ayarlar"
            aria-label="Ayarlar"
            className="rounded-full bg-white/15 p-2 backdrop-blur transition hover:bg-white/25"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
        {action ? <div className="mx-auto mt-3 max-w-md">{action}</div> : null}
      </header>

      <main className="mx-auto max-w-md px-4 py-5">{children}</main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur app-bottom-nav"
      >
        <div className="mx-auto flex max-w-md items-end justify-between px-2 pt-2 pb-2">

          {nav.map(({ to, label, icon: Icon, highlight }) => {
            const active = pathname === to;
            const toAny = to as never;
            if (highlight) {
              return (
                <Link
                  key={to}
                  to={toAny}
                  className="primary-gradient -mt-6 flex h-14 w-14 flex-col items-center justify-center rounded-full shadow-[var(--shadow-elevated)] transition active:scale-95"
                >
                  <Icon className="h-6 w-6" />
                </Link>
              );
            }
            return (
              <Link
                key={to}
                to={toAny}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] transition ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
