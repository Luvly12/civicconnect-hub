import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Filter } from "lucide-react";

export const Route = createFileRoute("/map")({ component: MapPage });

const CATEGORIES = ["Potholes", "Water Leaks", "Broken Streetlights", "Garbage Accumulation", "Drainage Blockage", "Road Damage", "Sanitation"];
const STATUSES = ["Reported", "In Progress", "Resolved"];

type Issue = {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  lat: number | null;
  lng: number | null;
  locality: string | null;
  created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  "Reported": "bg-destructive",
  "In Progress": "bg-warning",
  "Resolved": "bg-success",
};

function MapPage() {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [cat, setCat] = useState<Set<string>>(new Set());
  const [stat, setStat] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Issue | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("issues")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setIssues((data as Issue[]) ?? []);
      } catch (e: any) {
        console.error("issues fetch failed", e);
        setErr(e?.message ?? "Failed to load issues");
        setIssues([]);
      }
    })();
  }, []);

  const loading = issues === null;
  const list = issues ?? [];
  const filtered = useMemo(
    () => list.filter((i) => (cat.size === 0 || cat.has(i.category)) && (stat.size === 0 || stat.has(i.status))),
    [list, cat, stat]
  );

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, v: string) {
    const n = new Set(set);
    n.has(v) ? n.delete(v) : n.add(v);
    setSet(n);
  }

  // Map issues onto viewport using lat/lng bounds
  const bounds = { minLat: 12.925, maxLat: 12.945, minLng: 77.615, maxLng: 77.632 };
  function pos(i: Issue) {
    const lat = i.lat ?? bounds.minLat;
    const lng = i.lng ?? bounds.minLng;
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { left: `${Math.max(2, Math.min(98, x))}%`, top: `${Math.max(2, Math.min(98, y))}%` };
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-xl border border-border bg-card p-4 h-fit lg:sticky lg:top-32">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Filters</h2>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</div>
          <div className="mt-2 space-y-1.5">
            {STATUSES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={stat.has(s)} onChange={() => toggle(stat, setStat, s)} className="accent-primary" />
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLOR[s]}`} />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</div>
          <div className="mt-2 space-y-1.5">
            {CATEGORIES.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={cat.has(c)} onChange={() => toggle(cat, setCat, c)} className="accent-primary" />
                {c}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-lg bg-primary/5 p-3 text-xs text-primary">
          Showing <strong>{filtered.length}</strong> of {issues.length} issues
        </div>
      </aside>

      <section className="space-y-4">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-[linear-gradient(135deg,#e0eafc_0%,#cfdef3_100%)] shadow-inner">
          {/* Grid lines to feel map-like */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage:
              "linear-gradient(rgba(12,68,172,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(12,68,172,0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
          {/* Fake "streets" */}
          <div className="absolute inset-x-8 top-1/2 h-1 bg-white/70 -translate-y-1/2 rounded" />
          <div className="absolute inset-y-8 left-1/3 w-1 bg-white/70 rounded" />
          <div className="absolute inset-y-8 left-2/3 w-1 bg-white/70 rounded" />

          <div className="absolute top-3 left-3 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-primary shadow">
            Koramangala, Bengaluru
          </div>

          {filtered.map((i) => (
            <button
              key={i.id}
              onClick={() => setSelected(i)}
              style={pos(i)}
              className="absolute -translate-x-1/2 -translate-y-full group"
            >
              <MapPin className={`h-7 w-7 drop-shadow-md ${
                i.status === "Resolved" ? "text-success" : i.status === "In Progress" ? "text-warning" : "text-destructive"
              }`} fill="currentColor" />
            </button>
          ))}

          {selected && (
            <div className="absolute bottom-3 left-3 right-3 max-w-sm rounded-lg bg-card p-3 shadow-lg border border-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{selected.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{selected.category} · {selected.locality}</div>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={selected.status} />
                <span className="text-xs text-muted-foreground">Severity: {selected.severity}</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4 text-sm font-semibold">Recent Reports</div>
          <div className="divide-y divide-border">
            {filtered.slice(0, 8).map((i) => (
              <div key={i.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{i.title}</div>
                  <div className="text-xs text-muted-foreground">{i.category} · {i.locality}</div>
                </div>
                <StatusBadge status={i.status} />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No issues match your filters.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Resolved"
      ? "bg-success/10 text-success"
      : status === "In Progress"
        ? "bg-warning/10 text-warning"
        : "bg-destructive/10 text-destructive";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}
