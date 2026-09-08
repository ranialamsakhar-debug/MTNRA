import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "../components/common/Navbar";
import { Footer } from "../components/common/Footer";
import { ChatbotWidget } from "../components/chatbot/ChatbotWidget";
import { useAuthStore } from "../store/authStore";

export function PublicLayout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div
      className="min-h-screen flex flex-col relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: isLoginPage ? "url('/Rania.png')" : "url('/rania.ma.png')" }}
    >
      {/* Superposition légère pour lisibilité des cartes et formulaires */}
      {!isLoginPage && <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px] pointer-events-none" />}

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container mx-auto p-6">
          <Outlet />
        </main>
        <Footer />
      </div>

      {/* Assistant IA RAG disponible pour le citoyen et les visiteurs */}
      {user && <ChatbotWidget currentRole="CITOYEN" />}
    </div>
  );
}
