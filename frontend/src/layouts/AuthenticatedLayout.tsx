import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/common/Sidebar";

export function AuthenticatedLayout() {
  const location = useLocation();
  const isChatbot = location.pathname === "/assistance-ia";

  return (
    <div 
      className="min-h-screen grid grid-cols-[270px_1fr] relative bg-cover bg-center bg-no-repeat bg-fixed selection:bg-slate-900 selection:text-white"
      style={{ backgroundImage: "url('/Dashboard.png')" }}
    >
      {/* Overlay très léger pour préserver à 100% la couleur beige originale du Dashboard */}
      <div className="absolute inset-0 bg-white/25 backdrop-blur-[1px] z-0 pointer-events-none" />

      {/* Sidebar */}
      <div className="relative z-10 h-screen sticky top-0 overflow-y-auto">
        <Sidebar />
      </div>

      {/* Zone de contenu principal */}
      <div className="relative z-10 flex flex-col min-h-screen h-screen overflow-hidden">
        <main className={`flex-1 ${isChatbot ? "p-3 sm:p-4 overflow-hidden flex flex-col" : "p-6 overflow-y-auto"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
