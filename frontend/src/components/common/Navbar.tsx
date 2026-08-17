import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl text-primary">Tifawin X.0</Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/">Accueil</Link>
          <Link to="/login">Connexion</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}
