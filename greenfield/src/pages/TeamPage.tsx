import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, Send, Trash2, UserCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useTeamWorkspace } from "@/lib/team";
import { TIER_BY_PLAN } from "@/lib/pricing";

export default function TeamPage() {
  const { user, profile, activeTeam, loading } = useAuth();
  const teamId = activeTeam?.id ?? null;
  const { snapshot, isLoading, invite, revoke } = useTeamWorkspace(teamId);
  const [email, setEmail] = useState("");

  if (loading) return null;

  if (!isSupabaseConfigured) {
    return <DemoNotice />;
  }
  if (!user) {
    return (
      <section className="container-wide py-12 max-w-3xl">
        <h1 className="font-display text-3xl">Team</h1>
        <p className="mt-2 text-muted-foreground">Sign in to manage your team.</p>
        <Button asChild className="mt-4">
          <Link to="/auth?mode=signin&next=/team">Sign in</Link>
        </Button>
      </section>
    );
  }
  if (!activeTeam) {
    return (
      <section className="container-wide py-12 max-w-3xl">
        <h1 className="font-display text-3xl">Team</h1>
        <p className="mt-2 text-muted-foreground">No team found for your account yet.</p>
      </section>
    );
  }
  // Plan gate — Team page is meaningful on Venture Studio (multi-seat); Scout /
  // Entrepreneur see an upgrade nudge.
  if (profile?.plan !== "venture_studio" && profile?.plan !== "university") {
    return <UpgradeNotice planName={profile?.plan ?? "scout"} />;
  }

  const tier = TIER_BY_PLAN[activeTeam.plan];

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await invite.mutateAsync(email.trim());
      setEmail("");
    } catch {
      /* toast handled in hook */
    }
  }

  return (
    <section className="container-wide py-10 max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Team</p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">{activeTeam.name}</h1>
          <p className="mt-2 text-muted-foreground">
            <Badge variant="soft" className="mr-2">{tier?.name ?? activeTeam.plan}</Badge>
            {activeTeam.seat_limit} seats · {activeTeam.claims_per_week_quota} claims / week
          </p>
        </div>
      </header>

      {isLoading || !snapshot ? (
        <p className="mt-8 text-muted-foreground">Loading workspace…</p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Members"
            value={`${snapshot.members.length} / ${snapshot.team.seat_limit}`}
            hint={snapshot.invitations.filter((i) => i.status === "pending").length > 0
              ? `${snapshot.invitations.filter((i) => i.status === "pending").length} pending invite${snapshot.invitations.filter((i) => i.status === "pending").length === 1 ? "" : "s"}`
              : "All seats filled or available."}
          />
          <StatCard
            icon={<UserCheck className="h-4 w-4" />}
            label="Active claims"
            value={String(snapshot.activeClaimsCount)}
            hint="Ideas currently hidden from the public catalogue."
          />
          <StatCard
            icon={<Send className="h-4 w-4" />}
            label="Claims this week"
            value={`${snapshot.claimsThisWeek} / ${snapshot.team.claims_per_week_quota}`}
            hint={`Resets on a rolling 7-day window.`}
          />
        </div>
      )}

      {/* Members */}
      <section className="mt-10">
        <h2 className="font-display text-2xl">Members</h2>
        <div className="mt-4 overflow-hidden rounded-xl border bg-card">
          {snapshot?.members.length ? (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Role</th>
                  <th className="px-4 py-2 text-left font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.members.map((m) => (
                  <tr key={m.user_id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{m.display_name ?? m.user_id.slice(0, 8) + "…"}</td>
                    <td className="px-4 py-2 text-muted-foreground capitalize">{m.role}</td>
                    <td className="px-4 py-2 text-muted-foreground">{new Date(m.joined_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-6 text-muted-foreground">No members yet.</p>
          )}
        </div>
      </section>

      {/* Invite */}
      <section className="mt-10">
        <h2 className="font-display text-2xl">Invite teammates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sends a Supabase auth invite. They sign up, accept, and immediately see every claim and agent run on this team.
        </p>
        <form onSubmit={onInvite} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@yourstudio.com"
              required
            />
          </div>
          <Button type="submit" disabled={invite.isPending || !email.trim()}>
            <Mail className="h-4 w-4" />
            {invite.isPending ? "Sending…" : "Send invite"}
          </Button>
        </form>

        {snapshot?.invitations.length ? (
          <div className="mt-6 overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Email</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Invited</th>
                  <th className="px-4 py-2 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {snapshot.invitations.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{inv.email}</td>
                    <td className="px-4 py-2">
                      <Badge
                        variant="outline"
                        className={
                          inv.status === "accepted" ? "border-emerald-400/50 text-emerald-700"
                          : inv.status === "revoked"  ? "text-muted-foreground"
                          : "border-amber-400/50 text-amber-700"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(inv.invited_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {inv.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revoke.mutate(inv.id)}
                          disabled={revoke.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </section>
  );
}

function StatCard({
  icon, label, value, hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function UpgradeNotice({ planName }: { planName: string }) {
  return (
    <section className="container-wide py-12 max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-wider text-primary">Team</p>
      <h1 className="mt-1 font-display text-3xl">Multi-seat workspace is a Venture Studio feature.</h1>
      <p className="mt-3 text-muted-foreground">
        You're currently on the <span className="font-medium text-foreground capitalize">{planName.replace("_", " ")}</span> plan.
        Venture Studio adds up to 5 seats, a shared claim pool of 10/week, and team-wide visibility on every agent and workflow run.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link to="/pricing">See plans</Link>
        </Button>
        <Button asChild variant="outline">
          <a href="mailto:hello@greenfield.app?subject=Venture%20Studio%20inquiry">Talk to sales</a>
        </Button>
      </div>
    </section>
  );
}

function DemoNotice() {
  return (
    <section className="container-wide py-12 max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-wider text-primary">Team</p>
      <h1 className="mt-1 font-display text-3xl">Team workspace needs Supabase.</h1>
      <p className="mt-3 text-muted-foreground">
        Multi-seat team management requires the database + edge functions. Configure <code>.env</code> and deploy
        the <code>invite-team-member</code> function to enable team invitations and shared claim pools.
      </p>
      <Button asChild className="mt-6">
        <Link to="/pricing">See Venture Studio plan</Link>
      </Button>
    </section>
  );
}
