import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare, Send, Calendar, MapPin, Users, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/community")({ component: Community });

type Discussion = { id: number; author: string; title: string; body: string; comments: string[] };
type Event = { id: number; title: string; date: string; time: string; location: string; volunteers: number };

const INITIAL_DISCUSSIONS: Discussion[] = [
  { id: 1, author: "Priya M.", title: "Traffic signal timing broken on 100ft Rd", body: "Long queues every evening — anyone else facing this?", comments: ["Yes! Especially after 6pm.", "I'll file a report today."] },
  { id: 2, author: "Rahul K.", title: "Weekend cleanup drive at Rose Garden", body: "Organizing a 2-hour cleanup Sunday morning. RSVP if interested!", comments: ["Count me in."] },
  { id: 3, author: "Anonymous", title: "Stray dog vaccination camp needed", body: "Which local NGOs handle this? Sharing contacts here.", comments: [] },
];

const EVENTS: Event[] = [
  { id: 1, title: "Community Cleanup — Rose Garden", date: "Sat, Aug 9", time: "7:00 AM", location: "Koramangala 3rd Block", volunteers: 12 },
  { id: 2, title: "Tree Plantation Drive", date: "Sun, Aug 17", time: "6:30 AM", location: "Ejipura Park", volunteers: 24 },
  { id: 3, title: "Blood Donation Camp", date: "Sat, Aug 23", time: "10:00 AM", location: "Community Hall, 5th Block", volunteers: 8 },
];

function Community() {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState(INITIAL_DISCUSSIONS);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [volunteering, setVolunteering] = useState<Set<number>>(new Set());

  function postComment(id: number) {
    const text = drafts[id]?.trim();
    if (!text) return;
    setDiscussions((d) => d.map((x) => x.id === id ? { ...x, comments: [...x.comments, text] } : x));
    setDrafts({ ...drafts, [id]: "" });
  }

  function toggleVolunteer(id: number) {
    const n = new Set(volunteering);
    n.has(id) ? n.delete(id) : n.add(id);
    setVolunteering(n);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Neighborhood Discussions</h1>
        </div>
        <div className="space-y-4">
          {discussions.map((d) => (
            <article key={d.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {d.author[0]}
                </span>
                <span className="font-medium text-foreground">{d.author}</span>
                <span>· Koramangala</span>
              </div>
              <h3 className="mt-2 font-semibold">{d.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d.body}</p>

              {d.comments.length > 0 && (
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
                  onKeyDown={(e) => e.key === "Enter" && postComment(d.id)}
                  placeholder={user ? "Add a comment..." : "Sign in to comment"}
                  disabled={!user}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
                <button
                  onClick={() => postComment(d.id)}
                  disabled={!user || !(drafts[d.id]?.trim())}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside>
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-success" />
          <h2 className="text-xl font-bold">Upcoming Events</h2>
        </div>
        <div className="space-y-3">
          {EVENTS.map((e) => {
            const registered = volunteering.has(e.id);
            return (
              <div key={e.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">{e.date} · {e.time}</div>
                <h3 className="mt-1 font-semibold">{e.title}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {e.location}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {e.volunteers + (registered ? 1 : 0)} volunteers
                </div>
                <button
                  onClick={() => toggleVolunteer(e.id)}
                  className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
                    registered
                      ? "bg-success text-success-foreground"
                      : "border-2 border-success text-success hover:bg-success hover:text-success-foreground"
                  }`}
                >
                  {registered ? (<><CheckCircle2 className="h-4 w-4" /> Registered</>) : "Register as Volunteer"}
                </button>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
