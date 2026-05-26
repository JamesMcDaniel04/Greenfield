import { Navigate, Outlet, useLocation } from "react-router-dom";

import Sidebar, { MobileTopBar } from "./Sidebar";
import MissingConfigBanner from "./MissingConfigBanner";
import { useAuth } from "@/lib/auth";
import {
  DEV_LOGIN_EMAIL,
  isDevBypassEnabled,
  isPostCheckoutGraceActive,
} from "@/lib/devBypass";

export default function Layout() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (!loading && user) {
    const isDev =
      isDevBypassEnabled() || user.email?.toLowerCase() === DEV_LOGIN_EMAIL;
    const hasPaid = !!profile?.is_pro || isPostCheckoutGraceActive();
    if (!isDev && !hasPaid) {
      return (
        <Navigate
          to="/pricing?afterSignup=1"
          replace
          state={{ from: location.pathname }}
        />
      );
    }
  }

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <div className="flex min-h-full flex-1 flex-col">
        <MobileTopBar />
        <MissingConfigBanner />
        <main className="flex-1 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
