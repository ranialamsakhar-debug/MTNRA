import { useState } from "react";
import { useAuthStore, ROLE_PROFILES } from "../../store/authStore";
import { CniPhotoModal } from "./CniPhotoModal";

export function UserProfileBanner() {
  const { user } = useAuthStore();
  const [isCniModalOpen, setIsCniModalOpen] = useState(false);

  if (!user) return null;

  const profile = ROLE_PROFILES[user.role] || {
    nom: user.nom || "Utilisateur",
    prenom: user.prenom || "",
    cin: user.cin || "",
    email: user.email || "",
    telephone: "0639475920",
    matricule: user.matricule,
    service: user.serviceAffectation,
    defaultAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  };

  const photoUrl = user.cniPhotoUrl || profile.defaultAvatar;

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "CITOYEN": return { label: "Citoyen(ne)", color: "bg-blue-100 text-blue-900 border-blue-200" };
      case "AGENT_RECLAMATION": return { label: "Agent Réclamation & Orientation", color: "bg-amber-100 text-amber-900 border-amber-300" };
      case "AGENT_VALIDATION": return { label: "Agent Validation & Conformité", color: "bg-emerald-100 text-emerald-900 border-emerald-300" };
      case "AGENT_CERTIFICATION": return { label: "Agent Certification & Sceau", color: "bg-purple-100 text-purple-900 border-purple-300" };
      case "AGENT_SIGNATURE": return { label: "Agent Signature & Envoi", color: "bg-indigo-100 text-indigo-900 border-indigo-300" };
      case "MEDIATEUR": return { label: "Médiateur Institutionnel", color: "bg-teal-100 text-teal-900 border-teal-300" };
      case "RESPONSABLE_SERVICE": return { label: "Responsable Service / Direction", color: "bg-slate-900 text-white border-slate-700" };
      case "ADMINISTRATEUR": return { label: "Administrateur Système", color: "bg-red-100 text-red-900 border-red-300" };
      default: return { label: r, color: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  return (
    <>
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 md:p-6 shadow-md border border-slate-200/80 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        {/* Section Gauche: Avatar + Infos Personnelles */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img
              src={photoUrl}
              alt={`${user.prenom} ${user.nom}`}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md ring-4 ring-emerald-500/10 cursor-pointer hover:scale-105 transition duration-200"
              onClick={() => setIsCniModalOpen(true)}
              title="Cliquez pour changer votre photo CNIE officielle"
            />
            <button
              onClick={() => setIsCniModalOpen(true)}
              className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-1.5 rounded-full text-[10px] shadow hover:bg-emerald-600 transition"
              title="Modifier photo"
            >
              📷
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {user.prenom || profile.prenom} {user.nom || profile.nom}
              </h2>
              <span className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold border ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-semibold">
              <span className="flex items-center gap-1">
                <strong className="text-slate-800">CNI / ID :</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 font-mono font-bold">{user.cin || profile.cin}</code>
              </span>

              {(user.matricule || profile.matricule) && (
                <span className="flex items-center gap-1">
                  <strong className="text-slate-800">Matricule :</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 font-mono font-bold">{user.matricule || profile.matricule}</code>
                </span>
              )}

              <span className="flex items-center gap-1">
                <strong className="text-slate-800">Email :</strong> <span>{user.email || profile.email}</span>
              </span>
            </div>

            {(user.serviceAffectation || profile.service) && (
              <p className="text-xs text-slate-500 font-medium">
                📍 {user.serviceAffectation || profile.service}
              </p>
            )}
          </div>
        </div>

        {/* Section Droite: Badge de Statut Numérique & Action */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Identité Numérique Validée</span>
          </div>

          <button
            onClick={() => setIsCniModalOpen(true)}
            className="text-[11px] font-extrabold text-slate-700 hover:text-emerald-700 transition underline flex items-center gap-1 cursor-pointer"
          >
            <span>🖼️ Gérer la Photo CNIE Officielle</span>
          </button>
        </div>
      </div>

      <CniPhotoModal
        isOpen={isCniModalOpen}
        onClose={() => setIsCniModalOpen(false)}
      />
    </>
  );
}
