import { Routes, Route } from "react-router-dom";

import Layout from "@/components/layout/Layout";
import MarketingLayout from "@/components/layout/MarketingLayout";
import LandingPage from "@/pages/LandingPage";
import BrowsePage from "@/pages/BrowsePage";
import OpportunityDetailPage from "@/pages/OpportunityDetailPage";
import SavedPage from "@/pages/SavedPage";
import AuthPage from "@/pages/AuthPage";
import PricingPage from "@/pages/PricingPage";
import NotFoundPage from "@/pages/NotFoundPage";
import AdminListPage from "@/pages/admin/AdminListPage";
import AdminEditPage from "@/pages/admin/AdminEditPage";
import YcRequestsPage from "@/pages/YcRequestsPage";
import AgentsPage from "@/pages/AgentsPage";
import WorkflowsPage from "@/pages/WorkflowsPage";
import WorkflowDetailPage from "@/pages/WorkflowDetailPage";

export default function App() {
  return (
    <Routes>
      {/* Public marketing shell — top nav + footer, no sidebar. */}
      <Route element={<MarketingLayout />}>
        <Route index element={<LandingPage />} />
      </Route>

      {/* App shell — sidebar + main. */}
      <Route element={<Layout />}>
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/opportunity/:slug" element={<OpportunityDetailPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/workflows/:slug" element={<WorkflowDetailPage />} />
        <Route path="/yc-requests" element={<YcRequestsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin" element={<AdminListPage />} />
        <Route path="/admin/new" element={<AdminEditPage />} />
        <Route path="/admin/edit/:slug" element={<AdminEditPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
