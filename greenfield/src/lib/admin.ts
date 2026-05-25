import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/lib/auth";

/**
 * Hook for admin-only routes. Redirects to:
 *  - /auth if not signed in
 *  - / if signed in but not admin
 * Returns { ready: true } once the gate has been cleared so callers
 * can guard their renders.
 */
export function useRequireAdmin(): { ready: boolean } {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth?mode=signin&next=/admin", { replace: true });
      return;
    }
    if (profile && !profile.is_admin) {
      navigate("/browse", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  return { ready: !loading && !!user && !!profile?.is_admin };
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
