import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { CniPhotoModal } from "./CniPhotoModal";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { toggleChat } = useUIStore();
  const [isCniModalOpen, setIsCniModalOpen] = useState(false);

  const role = user?.role || "CITOYEN";

  const getLinksForRole = (userRole: string) => {
    switch (userRole) {
      case "AGENT_RECLAMATION":
        return [
          {
            to: "/dashboard",
            label: "Espace Réclamation",
            iconSvg: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4",
            subServices: [
              { to: "/dashboard?tab=EN_COURS", label: "📥 À Qualifier & Traiter" },
              { to: "/dashboard?tab=TRAITES", label: "✅ Traités & Transmis" },
            ],
          },
          { to: "/messages", label: "Messagerie Interne", iconSvg: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
          { to: "/assistance-ia", label: "Assistance IA & Historique", iconSvg: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          { to: "/interne/actualites", label: "Actualités Officielles", iconSvg: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
        ];
      case "AGENT_VALIDATION":
        return [
          {
            to: "/dashboard",
            label: "Espace Validation",
            iconSvg: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            subServices: [
              { to: "/dashboard?tab=EN_COURS", label: "🔍 À Examiner & Valider" },
              { to: "/dashboard?tab=TRAITES", label: "✅ Historique Traités" },
              { to: "/dashboard?tab=JURISPRUDENCE", label: "📜 Jurisprudence & Precedents" },
            ],
          },
          { to: "/messages", label: "Messagerie Interne", iconSvg: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
          { to: "/assistance-ia", label: "Assistance IA & Historique", iconSvg: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          { to: "/interne/actualites", label: "Actualités Officielles", iconSvg: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
        ];
      case "AGENT_CERTIFICATION":
        return [
          {
            to: "/dashboard",
            label: "Espace Certification",
            iconSvg: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
            subServices: [
              { to: "/dashboard?tab=EN_COURS", label: "🏵️ À Certifier" },
              { to: "/dashboard?tab=TRAITES", label: "✅ Historique Certifiés" },
            ],
          },
          { to: "/messages", label: "Messagerie Interne", iconSvg: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
          { to: "/assistance-ia", label: "Assistance IA & Historique", iconSvg: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          { to: "/interne/actualites", label: "Actualités Officielles", iconSvg: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
        ];
      case "AGENT_SIGNATURE":
        return [
          {
            to: "/dashboard",
            label: "Espace Signature & Envoi",
            iconSvg: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
            subServices: [
              { to: "/dashboard?tab=EN_COURS", label: "✒️ À Signer & Horodater" },
              { to: "/dashboard?tab=TRAITES", label: "📬 Signés & Transmis" },
            ],
          },
          { to: "/messages", label: "Messagerie Interne", iconSvg: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
          { to: "/assistance-ia", label: "Assistance IA & Historique", iconSvg: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          { to: "/interne/actualites", label: "Actualités Officielles", iconSvg: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
        ];
      case "ADMINISTRATEUR":
        return [
          {
            to: "/dashboard",
            label: "Espace Administration",
            iconSvg: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
            subServices: [
              { to: "/dashboard?tab=SUPERVISION", label: "📊 Supervision Live" },
              { to: "/dashboard?tab=USERS", label: "👥 Utilisateurs & Droits" },
              { to: "/dashboard?tab=WORKFLOWS", label: "⚙️ Workflows & Demandes" },
              { to: "/dashboard?tab=AUDIT", label: "📜 Journaux d'Audit" },
              { to: "/dashboard?tab=INCIDENTS", label: "🚨 Incidents Technique" },
            ],
          },
          { to: "/messages", label: "Messagerie Interne", iconSvg: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
          { to: "/assistance-ia", label: "Assistance IA & Historique", iconSvg: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          { to: "/interne/actualites", label: "Actualités Officielles", iconSvg: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
          { to: "/interne/contacts", label: "Annuaire Contacts", iconSvg: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
        ];
      case "MEDIATEUR":
        return [
          {
            to: "/dashboard",
            label: "Médiation Institutionnelle",
            iconSvg: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
            subServices: [
              { to: "/dashboard?tab=EN_COURS", label: "⚖️ Réclamations en Médiation" },
              { to: "/dashboard?tab=TRAITES", label: "✅ Traités & Clôturés" },
            ],
          },
          { to: "/messages", label: "Messagerie Interne", iconSvg: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
          { to: "/assistance-ia", label: "Assistance IA & Historique", iconSvg: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          { to: "/interne/actualites", label: "Actualités Officielles", iconSvg: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
        ];
      case "RESPONSABLE_SERVICE":
        return [
          {
            to: "/dashboard",
            label: "Supervision & Direction",
            iconSvg: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
            subServices: [
              { to: "/dashboard?tab=STATS", label: "📊 Supervision & KPIs" },
              { to: "/dashboard?tab=DOSSIERS", label: "📋 Dossiers du Service" },
              { to: "/dashboard?tab=ESCALADES", label: "🚨 Dossiers Escaladés" },
            ],
          },
          { to: "/messages", label: "Messagerie Interne", iconSvg: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
          { to: "/assistance-ia", label: "Assistance IA & Analytique", iconSvg: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          { to: "/interne/actualites", label: "Actualités Officielles", iconSvg: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
          { to: "/interne/contacts", label: "Annuaire Contacts", iconSvg: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
        ];
      default:
        return [
          { to: "/dashboard", label: "Tableau de bord", iconSvg: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
          { to: "/citoyen/nouvelle-demande", label: "Nouvelle Demande", iconSvg: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
          { to: "/citoyen/dossiers", label: "Gestion des Dossiers", iconSvg: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
          { to: "/messages", label: "Messagerie & Échanges", iconSvg: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
          { to: "/citoyen/rendez-vous", label: "Prise de Rendez-vous", iconSvg: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { to: "/assistance-ia", label: "Assistance IA", iconSvg: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          { to: "/interne/suivi", label: "Suivi des Demandes", iconSvg: "M13 10V3L4 14h7v7l9-11h-7z" },
          { to: "/interne/actualites", label: "Actualités Officielles", iconSvg: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
          { to: "/interne/contacts", label: "Annuaire Contacts", iconSvg: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
        ];
    }
  };

  const links = getLinksForRole(role);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const roleTitles: Record<string, string> = {
    CITOYEN: "Citoyen(ne)",
    AGENT_RECLAMATION: "Agent (Réclamations)",
    AGENT_VALIDATION: "Agent (Validation)",
    AGENT_CERTIFICATION: "Agent (Certification)",
    AGENT_SIGNATURE: "Agent (Signature)",
    MEDIATEUR: "Médiateur du Royaume",
    RESPONSABLE_SERVICE: "Responsable Service",
    ADMINISTRATEUR: "Administrateur Système"
  };

  const displayName = user ? `${user.prenom} ${user.nom}` : "Utilisateur Connecté";
  const displayRole = roleTitles[user?.role || "CITOYEN"] || user?.role || "Tawsa Platform";

  return (
    <aside 
      className="h-full min-h-screen relative p-5 border-r border-slate-200/80 flex flex-col justify-between shadow-lg bg-cover bg-left-top bg-no-repeat selection:bg-slate-900 selection:text-white"
      style={{ backgroundImage: "url('/sidebar.png')" }}
    >
      <div className="relative z-10">
        {/* Titre / Logo Tawsa */}
        <div className="flex items-center gap-3 pb-6 border-b border-slate-300 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-lg text-white shadow-md">
            T
          </div>
          <div>
            <h2 className="font-extrabold text-base leading-tight text-slate-900">Tawsa</h2>
            <p className="text-xs text-slate-700 font-bold">Espace Acteurs</p>
          </div>
        </div>

        {/* Liens de navigation */}
        <nav className="space-y-2">
          {links.map((link, idx) => {
            const isMainActive = location.pathname === link.to;
            const hasSub = link.subServices && link.subServices.length > 0;
            const fullPath = location.pathname + location.search;

            return (
              <div key={idx} className="space-y-1">
                <Link
                  to={link.to}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isMainActive && !hasSub
                      ? "bg-slate-900 text-white shadow-md"
                      : isMainActive && hasSub
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className={`w-4 h-4 shrink-0 ${isMainActive ? "text-white" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.iconSvg} />
                    </svg>
                    <span>{link.label}</span>
                  </div>
                  {hasSub && (
                    <span className="text-[10px] bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded font-mono">
                      ▾
                    </span>
                  )}
                </Link>

                {/* Sous-services (Sub-services) */}
                {hasSub && (
                  <div className="ml-4 pl-3 border-l-2 border-slate-300 space-y-1 my-1">
                    {link.subServices.map((sub, subIdx) => {
                      const isSubActive = fullPath === sub.to || (location.search === "" && subIdx === 0 && isMainActive);
                      return (
                        <Link
                          key={subIdx}
                          to={sub.to}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition ${
                            isSubActive
                              ? "bg-amber-500 text-slate-900 shadow-sm"
                              : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                          }`}
                        >
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Profil en bas de sidebar avec photo CNIE officielle */}
      <div className="relative z-10 pt-4 border-t border-slate-300">
        <div className="flex items-center gap-3 px-2">
          {user?.cniPhotoUrl ? (
            <div 
              onClick={() => setIsCniModalOpen(true)}
              className="relative cursor-pointer group"
              title="Photo CNIE Officielle Validée (Cliquer pour voir)"
            >
              <img
                src={user.cniPhotoUrl}
                alt="Photo CNIE"
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-md group-hover:scale-105 transition"
              />
              <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-white">
                ✓
              </span>
            </div>
          ) : (
            <button
              onClick={() => setIsCniModalOpen(true)}
              className="w-10 h-10 rounded-full bg-amber-100 hover:bg-amber-200 border-2 border-amber-400 flex items-center justify-center text-sm font-semibold text-slate-900 shadow-sm cursor-pointer relative group transition"
              title="Charger ma photo officielle CNIE (Importation unique)"
            >
              <span>📷</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping"></span>
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs font-extrabold text-slate-900 truncate">{displayName}</p>
            </div>
            <p className="text-[10px] text-slate-700 font-bold truncate">{displayRole}</p>
            <button
              onClick={() => setIsCniModalOpen(true)}
              className="text-[10px] text-primary font-black hover:underline block truncate mt-0.5 cursor-pointer"
            >
              {user?.cniPhotoUrl ? "🔒 Photo CNIE Certifiée" : "📷 Charger Photo CNIE"}
            </button>
          </div>

          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="text-slate-600 hover:text-red-600 text-lg transition cursor-pointer font-bold"
          >
            ⏻
          </button>
        </div>
      </div>

      {/* Modale Photo CNIE */}
      <CniPhotoModal
        isOpen={isCniModalOpen}
        onClose={() => setIsCniModalOpen(false)}
      />
    </aside>
  );
}
