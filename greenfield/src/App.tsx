import { Routes, Route } from "react-router-dom";

import Layout from "@/components/layout/Layout";
import BrowsePage from "@/pages/BrowsePage";
import OpportunityDetailPage from "@/pages/OpportunityDetailPage";
import SavedPage from "@/pages/SavedPage";
import AuthPage from "@/pages/AuthPage";
import PricingPage from "@/pages/PricingPage";
import NotFoundPage from "@/pages/NotFoundPage";
import AdminListPage from "@/pages/admin/AdminListPage";
import AdminEditPage from "@/pages/admin/AdminEditPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<BrowsePage />} />
        <Route path="/opportunity/:slug" element={<OpportunityDetailPage />} />
        <Route path="/saved" element={<SavedPage />} />
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
