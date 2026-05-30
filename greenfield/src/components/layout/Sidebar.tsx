import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  GraduationCap, LogOut, Mail, ShieldCheck, Sparkles, User, UserCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card/60">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 px-5 py-5">
        <Logo />
        <span className="font-display text-xl tracking-tight">Greenfield</span>
        <ShieldCheck className="hidden" />
      </Link>

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        <Section label="Learn">
          <Item to="/career" icon={<GraduationCap className="h-4 w-4" />}>Career track</Item>
          <Item to="/settings/portfolio" icon={<UserCheck className="h-4 w-4" />}>Portfolio</Item>
        </Section>

        <Section label="Account">
          <Item to="/pricing" icon={<Sparkles className="h-4 w-4" />}>Pricing</Item>
          {!user && (
            <Item to="/auth?mode=signin" icon={<User className="h-4 w-4" />}>Sign in</Item>
          )}
        </Section>
      </nav>

      {/* Footer: status + user */}
      <div className="border-t border-border/70 p-3 space-y-2">
        {profile?.is_pro ? (
          <div className="flex items-center gap-2 rounded-md bg-accent/10 px-2.5 py-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
            <span className="font-medium">Member</span>
            <span className="text-muted-foreground">— track unlocked</span>
          </div>
        ) : user ? (
          <Button asChild size="sm" variant="outline" className="w-full justify-start">
            <Link to="/pricing"><Sparkles className="h-3.5 w-3.5" />View plans</Link>
          </Button>
        ) : (
          <Button asChild size="sm" className="w-full">
            <Link to="/auth?mode=signup">Get started</Link>
          </Button>
        )}

        {user ? (
          <button
            type="button"
            onClick={async () => { await signOut(); navigate("/"); }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground",
              "hover:bg-muted hover:text-foreground",
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="truncate">{profile?.display_name ?? user.email}</span>
          </button>
        ) : (
          <a
            href="mailto:hello@greenfield.app"
            className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Mail className="h-3.5 w-3.5" />
            Contact
          </a>
        )}
      </div>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pb-2">
      <p className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function Item({
  to, icon, children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground/70 hover:bg-muted hover:text-foreground",
        )
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
      <rect width="32" height="32" rx="7" fill="hsl(150 50% 22%)" />
      <path
        d="M9 22 L9 12 L16 22 L23 12 L23 22"
        stroke="hsl(40 33% 97%)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Re-exported for the mobile top bar — only on small screens. */
export function MobileTopBar() {
  const { user } = useAuth();
  return (
    <div className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur">
      <Link to="/" className="flex items-center gap-2">
        <Logo />
        <span className="font-display text-lg">Greenfield</span>
      </Link>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/career" aria-label="Career"><GraduationCap className="h-4 w-4" /></Link>
        </Button>
        {!user && (
          <Button size="sm" asChild>
            <Link to="/auth?mode=signup">Get started</Link>
          </Button>
        )}
        <ShieldCheck className="hidden" />
      </div>
    </div>
  );
}
