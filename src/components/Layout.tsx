import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, MapPin, LayoutDashboard, FilePlus2, Map as MapIcon, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "Issue Map", icon: MapIcon },
  { to: "/report", label: "Report Issue", icon: FilePlus2 },
  { to: "/community", label: "Community", icon: Users },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold leading-tight">CivicConnect</div>
              <div className="text-[10px] uppercase tracking-widest text-white/70">Report · Resolve · Engage</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                    active ? "bg-white/15" : "hover:bg-white/10"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-white/80">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1 rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="rounded-md bg-success px-4 py-1.5 text-sm font-semibold text-success-foreground hover:opacity-90"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto border-t border-white/10 px-2 py-1">
          {NAV.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs whitespace-nowrap ${
                  active ? "bg-white/15" : "hover:bg-white/10"
                }`}
              >
                <n.icon className="h-3.5 w-3.5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CivicConnect — Building better neighborhoods together.
      </footer>
    </div>
  );
}
