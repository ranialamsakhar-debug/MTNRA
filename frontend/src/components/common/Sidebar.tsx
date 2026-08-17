import { Link } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="bg-slate-900 text-white p-4">
      <h2 className="font-semibold mb-4">Navigation Role</h2>
      <div className="flex flex-col gap-2 text-sm">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/citoyen/dossiers">Dossiers</Link>
        <Link to="/citoyen/rendez-vous">Rendez-vous</Link>
        <Link to="/messages">Messagerie</Link>
      </div>
    </aside>
  );
}
