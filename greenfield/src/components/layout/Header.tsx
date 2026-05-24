import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bookmark, LogOut, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="container-wide flex h-16 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 group">
          <Logo />
          <span className="font-display text-xl tracking-tight">Greenfield</span>
          {profile?.is_pro && (
            <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
              <Sparkles className="h-3 w-3" /> Pro
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavItem to="/">Browse</NavItem>
          {user && <NavItem to="/saved">Saved</NavItem>}
          <NavItem to="/pricing">Pricing</NavItem>
          {profile?.is_admin && <NavItem to="/admin">Admin</NavItem>}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/saved" aria-label="Saved opportunities">
                  <Bookmark className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth?mode=signin">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth?mode=signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
          isActive
            ? "text-primary bg-primary/5"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        )
      }
    >
      {children}
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
