import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { DEV_LOGIN_EMAIL, enableDevBypass } from "@/lib/devBypass";

/**
 * Promote the developer's account to the highest plan tier so every gated
 * surface (claims, BYO ideas/projects, Career track, admin nav) unlocks in
 * one shot. Idempotent — safe to run on every bypass sign-in.
 *
 * Works because RLS allows users to update their own profile and team
 * owners to update their team. The bypass page is the only client-side
 * caller; production users go through Stripe + the webhook, which sets
 * these fields server-side.
 */
async function elevateToFullAccess(userId: string) {
  const now = new Date().toISOString();
  const profileErr = (await supabase
    .from("profiles")
    .update({ plan: "university", is_pro: true, is_admin: true, pro_since: now })
    .eq("user_id", userId)).error;
  if (profileErr) throw profileErr;

  const { data: prof } = await supabase
    .from("profiles")
    .select("personal_team_id")
    .eq("user_id", userId)
    .maybeSingle();
  const teamId = prof?.personal_team_id as string | null | undefined;
  if (!teamId) return;

  const teamErr = (await supabase
    .from("teams")
    .update({
      plan: "university",
      claims_per_week_quota: 50,
      seat_limit: 25,
      byo_runs_per_month_quota: 200,
      career_runs_per_month_quota: 200,
    })
    .eq("id", teamId)).error;
  if (teamErr) throw teamErr;
}

export default function DevBypassPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (email.trim().toLowerCase() !== DEV_LOGIN_EMAIL) {
      toast.error("This entrance is not for you.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) await elevateToFullAccess(data.user.id);
      enableDevBypass();
      toast.success("Developer bypass active — university tier granted.");
      navigate("/browse", { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 py-16">
      <section className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="font-display text-2xl">Developer access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to skip the payment gateway.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "…" : "Enter"}
          </Button>
        </form>
      </section>
    </div>
  );
}
