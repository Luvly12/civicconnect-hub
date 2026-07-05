import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CheckCircle2, ImagePlus, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/report")({ component: ReportPage });

const CATEGORIES = ["Potholes", "Water Leaks", "Broken Streetlights", "Garbage Accumulation", "Drainage Blockage", "Road Damage", "Sanitation"];
const SEVERITIES = ["low", "medium", "high"] as const;

function ReportPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    severity: "medium" as (typeof SEVERITIES)[number],
    is_anonymous: false,
    image_name: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">Sign in to report</h2>
        <p className="mt-2 text-sm text-muted-foreground">You need an account to submit a civic issue.</p>
        <Link to="/auth" className="mt-4 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Sign in</Link>
      </div>
    );
  }

  async function submit() {
    setSubmitting(true);
    setErr(null);
    try {
      const { error } = await supabase.from("issues").insert({
        user_id: form.is_anonymous ? null : user!.id,
        title: form.title,
        description: form.description,
        category: form.category,
        severity: form.severity,
        is_anonymous: form.is_anonymous,
        image_url: form.image_name ? `mock://${form.image_name}` : null,
        locality: "Koramangala, Bengaluru",
        lat: 12.925 + Math.random() * 0.02,
        lng: 77.615 + Math.random() * 0.017,
      });
      if (error) throw error;
      setDone(true);
    } catch (e: any) {
      setErr(e.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-success/30 bg-success/5 p-8 text-center animate-success-pop">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        <h2 className="mt-3 text-xl font-semibold">Issue reported</h2>
        <p className="mt-2 text-sm text-muted-foreground">Thank you for making your neighborhood better.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link to="/map" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">View on map</Link>
          <button
            onClick={() => {
              setDone(false);
              setStep(1);
              setForm({ title: "", description: "", category: CATEGORIES[0], severity: "medium", is_anonymous: false, image_name: "" });
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
          >
            Report another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Report an Issue</h1>
        <p className="text-sm text-muted-foreground">Help authorities respond faster with detailed reports.</p>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex-1 flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
              step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>{n}</div>
            {n < 3 && <div className={`h-1 flex-1 rounded ${step > n ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        {step === 1 && (
          <>
            <h3 className="font-semibold">Step 1 · What happened?</h3>
            <label className="block">
              <span className="text-sm font-medium">Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={120}
                placeholder="e.g. Large pothole on 80ft Road"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={1000}
                rows={4}
                placeholder="Provide details, landmarks, and impact on residents..."
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="font-semibold">Step 2 · Category & Severity</h3>
            <label className="block">
              <span className="text-sm font-medium">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <div>
              <span className="text-sm font-medium">Severity</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {SEVERITIES.map((s) => {
                  const active = form.severity === s;
                  const tone = s === "High" ? "border-destructive text-destructive" : s === "Medium" ? "border-warning text-warning" : "border-success text-success";
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, severity: s })}
                      className={`rounded-lg border-2 py-2 text-sm font-semibold transition ${
                        active ? `${tone} bg-current/10` : "border-border text-muted-foreground hover:border-foreground/40"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="font-semibold">Step 3 · Photo & Privacy</h3>
            <div>
              <span className="text-sm font-medium">Photo evidence (optional)</span>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 p-6 text-center hover:bg-muted">
                <ImagePlus className="h-8 w-8 text-primary" />
                <div className="text-sm font-medium">{form.image_name || "Click to upload"}</div>
                <div className="text-xs text-muted-foreground">JPG, PNG up to 5MB</div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setForm({ ...form, image_name: e.target.files?.[0]?.name ?? "" })}
                />
              </label>
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_anonymous}
                onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
                className="mt-0.5 h-5 w-5 accent-primary"
              />
              <div>
                <div className="text-sm font-semibold">Report anonymously</div>
                <div className="text-xs text-muted-foreground">Your name won't be shown to other citizens or officials.</div>
              </div>
            </label>

            {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>}
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && (!form.title.trim() || !form.description.trim())}
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="rounded-lg bg-success px-5 py-2 text-sm font-semibold text-success-foreground hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
