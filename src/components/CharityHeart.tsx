import { useState } from "react";
import { Heart, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const CAUSES = ["Feeding the Homeless", "Gifts for Orphanages", "Old Age Home Support"];

export function CharityHeart() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [cause, setCause] = useState(CAUSES[0]);
  const [amount, setAmount] = useState("500");
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");

  async function handleDonate() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setStatus("processing");
    // Mock Razorpay checkout delay
    await new Promise((r) => setTimeout(r, 1200));
    await supabase.from("donations").insert({
      user_id: user?.id ?? null,
      cause,
      amount: amt,
      status: "success",
      transaction_ref: `rzp_test_${Date.now()}`,
    });
    setStatus("success");
    setTimeout(() => {
      setOpen(false);
      setStatus("idle");
      setAmount("500");
    }, 1800);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Support community causes"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg ring-4 ring-success/20 hover:scale-105 transition-transform animate-heartbeat"
      >
        <Heart className="h-6 w-6 fill-current" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => status === "idle" && setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-xl bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {status !== "success" && (
              <button
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            {status === "success" ? (
              <div className="flex flex-col items-center py-8 animate-success-pop">
                <CheckCircle2 className="h-16 w-16 text-success" />
                <h3 className="mt-4 text-xl font-semibold">Thank you!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  ₹{amount} donated to {cause}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-success fill-current" />
                  <h3 className="text-lg font-semibold">Support Our Community Causes</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  100% of contributions go directly to verified NGOs.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-sm font-medium">Choose a cause</label>
                    <div className="mt-2 space-y-2">
                      {CAUSES.map((c) => (
                        <label
                          key={c}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                            cause === c ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                          }`}
                        >
                          <input
                            type="radio"
                            name="cause"
                            checked={cause === c}
                            onChange={() => setCause(c)}
                            className="accent-primary"
                          />
                          <span className="text-sm font-medium">{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Amount (₹)</label>
                    <input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="mt-2 flex gap-2">
                      {[100, 500, 1000, 2500].map((v) => (
                        <button
                          key={v}
                          onClick={() => setAmount(String(v))}
                          className="rounded-md border border-border px-3 py-1 text-xs hover:bg-accent"
                        >
                          ₹{v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleDonate}
                    disabled={status === "processing"}
                    className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    {status === "processing" ? "Processing..." : `Donate ₹${amount || 0} via Razorpay`}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    Test mode — no real payment will be charged.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
