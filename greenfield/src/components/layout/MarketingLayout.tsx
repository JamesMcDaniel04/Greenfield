import { Link, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import MissingConfigBanner from "./MissingConfigBanner";

/**
 * Public-facing shell — top nav + footer, no sidebar. Used for the landing page
 * and any future marketing routes. App routes use the sidebar Layout instead.
 */
export default function MarketingLayout() {
  const { user, profile } = useAuth();

  return (
    <div className="flex min-h-full flex-col">
      <MissingConfigBanner />

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="container-wide flex h-16 items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-display text-xl tracking-tight">Greenfield</span>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {profile?.is_pro && (
                  <span className="hidden sm:inline text-xs text-muted-foreground">
                    Member
                  </span>
                )}
                <Button size="sm" asChild>
                  <Link to="/browse">Open catalogue</Link>
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

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border/70 bg-muted/30">
        <div className="container-wide grid gap-8 py-12 sm:grid-cols-4 text-sm">
          <div className="sm:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <Logo />
              <span className="font-display text-lg tracking-tight">Greenfield</span>
            </Link>
            <p className="mt-3 max-w-xs text-muted-foreground">
              A curated catalogue of startup opportunities and AI-friendly practice builds, each with a brief you can ship with your coding agent.
            </p>
          </div>

          <FooterCol title="Product">
            <FooterLink to="/browse">Catalogue</FooterLink>
            <FooterLink to="/practice">Practice</FooterLink>
            <FooterLink to="/yc-requests">YC Requests</FooterLink>
            <FooterLink to="/pricing">Pricing</FooterLink>
          </FooterCol>

          <FooterCol title="Account">
            <FooterLink to="/auth?mode=signin">Sign in</FooterLink>
            <FooterLink to="/auth?mode=signup">Create account</FooterLink>
            <a href="mailto:hello@greenfield.app" className="block py-1 text-muted-foreground hover:text-foreground">
              Contact
            </a>
          </FooterCol>
        </div>
        <div className="container-wide flex flex-col gap-2 border-t border-border/60 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Greenfield. A catalogue of the unbuilt.</p>
          <p>Made for founders shipping with Claude Code, Cursor, and Codex.</p>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</p>
      <div className="mt-3 space-y-1">{children}</div>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="block py-1 text-muted-foreground hover:text-foreground">
      {children}
    </Link>
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
