import { Routes, Route } from "react-router-dom";

import Layout from "@/components/layout/Layout";
import BrowsePage from "@/pages/BrowsePage";
import OpportunityDetailPage from "@/pages/OpportunityDetailPage";
import SavedPage from "@/pages/SavedPage";
import AuthPage from "@/pages/AuthPage";
import PricingPage from "@/pages/PricingPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<BrowsePage />} />
        <Route path="/opportunity/:slug" element={<OpportunityDetailPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
