import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Award, MapPin, FileText, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({ component: Dashboard });

type Profile = { full_name: string | null; locality: string | null };
type Stats = { total: number; resolved: number };

const BADGES = [
  { name: "First Report", desc: "Filed your first civic issue", color: "bg-primary/10 text-primary" },
  { name: "Neighborhood Watch", desc: "5+ issues reported", color: "bg-success/10 text-success" },
  { name: "Community Helper", desc: "Volunteered at an event", color: "bg-warning/10 text-warning" },
];

function Dashboard() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, resolved: 0 });
  const [globalStats, setGlobalStats] = useState<Stats>({ total: 0, resolved: 0 });

  useEffect(() => {
    supabase.from("issues").select("status", { count: "exact" }).then(({ data }) => {
      const total = data?.length ?? 0;
      const resolved = data?.filter((d: any) => d.status === "Resolved").length ?? 0;
      setGlobalStats({ total, resolved });
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, locality").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
    supabase.from("issues").select("status").eq("user_id", user.id).then(({ data }) => {
      const total = data?.length ?? 0;
      const resolved = data?.filter((d: any) => d.status === "Resolved").length ?? 0;
      setStats({ total, resolved });
    });
  }, [user]);

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  if (!user) {
    return (
      <div className="space-y-8">
        <section className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground shadow-lg">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">Visitor Mode</span>
            <h1 className="mt-3 text-4xl font-bold">Your neighborhood, made better together.</h1>
            <p className="mt-3 text-white/85">Browse civic issues, explore community events, and support local causes. Sign in to report issues and earn achievement badges.</p>
            <div className="mt-6 flex gap-3">
              <Link to="/auth" className="rounded-lg bg-success px-5 py-2.5 text-sm font-semibold text-success-foreground hover:opacity-90">Sign in to report</Link>
              <Link to="/map" className="rounded-lg bg-white/15 px-5 py-2.5 text-sm font-semibold hover:bg-white/25">Explore the map</Link>
            </div>
          </div>
        </section>
        <PublicStats stats={globalStats} />
      </div>
    );
  }

  const name = profile?.full_name || user.email?.split("@")[0] || "Citizen";
  const locality = profile?.locality || "Koramangala, Bengaluru";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-md">
        <div className="text-sm text-white/75">Welcome back,</div>
        <h1 className="mt-1 text-3xl font-bold">{name}</h1>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-white/85">
          <MapPin className="h-4 w-4" /> {locality}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={FileText} label="Total Issues Reported" value={stats.total} tone="primary" />
        <StatCard icon={CheckCircle2} label="Issues Resolved" value={stats.resolved} tone="success" />
        <StatCard icon={TrendingUp} label="Community Rank" value={`#${Math.max(1, 42 - stats.total * 3)}`} tone="warning" />
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-success" />
          <h2 className="text-lg font-semibold">Achievement Badges</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {BADGES.map((b) => (
            <div key={b.name} className={`rounded-lg border border-border p-4 ${b.color}`}>
              <div className="text-sm font-semibold">{b.name}</div>
              <div className="mt-1 text-xs opacity-80">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/report" className="group rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-primary">Report an Issue</div>
              <div className="mt-1 text-xs text-muted-foreground">Potholes, streetlights, garbage & more</div>
            </div>
            <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition" />
          </div>
        </Link>
        <Link to="/community" className="group rounded-xl border border-border bg-card p-5 hover:border-success hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-success">Join Community</div>
              <div className="mt-1 text-xs text-muted-foreground">Discussions & volunteering events</div>
            </div>
            <ArrowRight className="h-5 w-5 text-success group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: any) {
  const toneMap: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
    </div>
  );
}

function PublicStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard icon={FileText} label="Issues Reported (city-wide)" value={stats.total} tone="primary" />
      <StatCard icon={CheckCircle2} label="Issues Resolved" value={stats.resolved} tone="success" />
    </div>
  );
}
