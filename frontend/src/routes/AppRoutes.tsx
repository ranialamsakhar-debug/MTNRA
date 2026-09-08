import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout";
import { AuthenticatedLayout } from "../layouts/AuthenticatedLayout";
import { HomePage } from "../pages/public/HomePage";
import { LoginPage } from "../pages/auth/LoginPage";
import { DashboardPage } from "../pages/roles/DashboardPage";
import { NouvelleReclamationPage } from "../pages/citoyen/NouvelleReclamationPage";
import { InternalChatPage } from "../pages/chat/InternalChatPage";
import { ChatbotPage } from "../pages/roles/ChatbotPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { ActualitesPage } from "../pages/public/ActualitesPage";
import { ContactsPage } from "../pages/public/ContactsPage";
import { DossiersPage } from "../pages/citoyen/DossiersPage";
import { RendezVousPage } from "../pages/citoyen/RendezVousPage";
import { TrackingPage } from "../pages/public/TrackingPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/actualites" element={<ActualitesPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/suivi" element={<TrackingPage />} />
        <Route path="/depot-demande" element={<NouvelleReclamationPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/citoyen/nouvelle-demande" element={<NouvelleReclamationPage />} />
          <Route path="/citoyen/dossiers" element={<DossiersPage />} />
          <Route path="/citoyen/rendez-vous" element={<RendezVousPage />} />
          <Route path="/messages" element={<InternalChatPage />} />
          <Route path="/assistance-ia" element={<ChatbotPage />} />
          <Route path="/interne/suivi" element={<TrackingPage />} />
          <Route path="/interne/actualites" element={<ActualitesPage />} />
          <Route path="/interne/contacts" element={<ContactsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
