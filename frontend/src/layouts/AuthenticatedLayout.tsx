import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/common/Sidebar";

export function AuthenticatedLayout() {
  return (
    <div 
      className="min-h-screen grid grid-cols-[260px_1fr] relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/Dashboard.png')" }}
    >
      {/* Overlay léger pour que le texte reste lisible */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-0"></div>

      {/* Sidebar */}
      <div className="relative z-10">
        <Sidebar />
      </div>

      {/* Zone de contenu principal */}
      <div className="relative z-10 flex flex-col min-h-screen h-screen overflow-hidden">
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
