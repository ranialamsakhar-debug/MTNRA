export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <p>© 2026 Tawsa • Ministère de la Transition Numérique et de la Réforme de l'Administration (MTNRA)</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition">Mentions Légales</a>
          <a href="#" className="hover:text-white transition">Confidentialité & CNDP</a>
          <a href="#" className="hover:text-white transition">Accessibilité</a>
        </div>
      </div>
    </footer>
  );
}
