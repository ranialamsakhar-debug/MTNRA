import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/common/Sidebar";
import { Navbar } from "../components/common/Navbar";

export function AuthenticatedLayout() {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <Sidebar />
      <div>
        <Navbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
