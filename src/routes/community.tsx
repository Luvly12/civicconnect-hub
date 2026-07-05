import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare, Send, Calendar, MapPin, Users, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/community")({ component: Community });

type Discussion = {
  id: string;
  author_name: string;
  title: string;
  body: string;
  locality: string | null;
  comments: string[];
  user_id: string | null;
};

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  location: string;
  volunteers: number;
};

function Community() {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[] | null>(null);
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [volunteering, setVolunteering] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [d, e] = await Promise.all([
          supabase.from("discussions" as any).select("*").order("created_at", { ascending: false }),
          supabase.from("events" as any).select("*").order("created_at", { ascending: true }),
        ]);
        setDiscussions(((d.data as any[]) ?? []).map((x) => ({
          ...x,
          comments: Array.isArray(x?.comments) ? x.comments : [],
        })));
        setEvents((e.data as any[]) ?? []);
      } catch (e: any) {
        console.error("community fetch failed", e);
        setErr(e?.message ?? "Failed to load community data");
        setDiscussions([]);
        setEvents([]);
      }
    })();
  }, []);

  async function postComment(d: Discussion) {
    const text = drafts[d.id]?.trim();
    if (!text || !user) return;
    const next = [...(d.comments ?? []), text];
    setDiscussions((list) => list?.map((x) => (x.id === d.id ? { ...x, comments: next } : x)) ?? null);
    setDrafts({ ...drafts, [d.id]: "" });
    try {
      await supabase.from("discussions" as any).update({ comments: next }).eq("id", d.id);
    } catch (e) {
      console.error("comment failed", e);
    }
  }

  async function toggleVolunteer(ev: EventRow) {
    if (!user) return;
    const n = new Set(volunteering);
    const wasRegistered = n.has(ev.id);
    wasRegistered ? n.delete(ev.id) : n.add(ev.id);
    setVolunteering(n);
    if (!wasRegistered) {
      try {
        await supabase.rpc("rsvp_event" as any, { event_id: ev.id });
        setEvents((list) => list?.map((x) => (x.id === ev.id ? { ...x, volunteers: x.volunteers + 1 } : x)) ?? null);
      } catch (e) {
        console.error("rsvp failed", e);
      }
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Neighborhood Discussions</h1>
        </div>

        {err && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>
        )}

        {discussions === null ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
              </div>
            ))}
          </div>
        ) : discussions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No discussions yet. Be the first to start one!
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map((d) => (
              <article key={d.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {d.author_name?.[0] ?? "?"}
                  </span>
                  <span className="font-medium text-foreground">{d.author_name}</span>
                  <span>· {d.locality ?? "Local"}</span>
                </div>
                <h3 className="mt-2 font-semibold">{d.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d.body}</p>

                {d.comments?.length > 0 && (
                  <div className="mt-3 space-y-2 rounded-lg bg-muted/50 p-3">
                    {d.comments.map((c, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium">Neighbor:</span> <span className="text-muted-foreground">{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <input
                    value={drafts[d.id] ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [d.id]: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && postComment(d)}
                    placeholder={user ? "Add a comment..." : "Sign in to comment"}
                    disabled={!user}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  />
                  <button
                    onClick={() => postComment(d)}
                    disabled={!user || !(drafts[d.id]?.trim())}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside>
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-success" />
          <h2 className="text-xl font-bold">Upcoming Events</h2>
        </div>

        {events === null ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-5 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/2" />
                <Skeleton className="mt-4 h-9 w-full" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No events scheduled yet.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((e) => {
              const registered = volunteering.has(e.id);
              return (
                <div key={e.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">{e.event_date} · {e.event_time}</div>
                  <h3 className="mt-1 font-semibold">{e.title}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {e.location}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> {e.volunteers} volunteers
                  </div>
                  <button
                    onClick={() => toggleVolunteer(e)}
                    disabled={!user}
                    className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition disabled:opacity-50 ${
                      registered
                        ? "bg-success text-success-foreground"
                        : "border-2 border-success text-success hover:bg-success hover:text-success-foreground"
                    }`}
                  >
                    {registered ? (<><CheckCircle2 className="h-4 w-4" /> Registered</>) : user ? "Register as Volunteer" : "Sign in to volunteer"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </div>
  );
}
