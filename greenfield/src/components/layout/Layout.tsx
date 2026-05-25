import { Outlet } from "react-router-dom";

import Sidebar, { MobileTopBar } from "./Sidebar";
import MissingConfigBanner from "./MissingConfigBanner";

export default function Layout() {
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
