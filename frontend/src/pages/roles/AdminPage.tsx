import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";

interface UserAdmin {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  habilitation: string;
  actif: boolean;
}

const INITIAL_USERS: UserAdmin[] = [
  { id: 2001, nom: "BENALI", prenom: "Ahmed", email: "ahmed.benali@tawsa.ma", role: "AGENT_RECLAMATION", habilitation: "NIVEAU_2", actif: true },
  { id: 2002, nom: "EL IDRISSI", prenom: "Karim", email: "karim.elidrissi@tawsa.ma", role: "AGENT_VALIDATION", habilitation: "NIVEAU_2", actif: true },
  { id: 2003, nom: "ZAHRA", prenom: "Fatima", email: "fatima.zahra@tawsa.ma", role: "AGENT_CERTIFICATION", habilitation: "NIVEAU_2", actif: true },
  { id: 2004, nom: "MANSOURI", prenom: "Samira", email: "samira.mansouri@tawsa.ma", role: "AGENT_SIGNATURE", habilitation: "NIVEAU_2", actif: true },
  { id: 2005, nom: "TAZI", prenom: "Youssef", email: "youssef.tazi@tawsa.ma", role: "MEDIATEUR", habilitation: "NIVEAU_3", actif: true }
];

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<"SUPERVISION" | "USERS" | "WORKFLOWS" | "AUDIT" | "SECURITY" | "AI" | "INCIDENTS" | "REPORTS">("SUPERVISION");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && ["SUPERVISION", "USERS", "WORKFLOWS", "AUDIT", "SECURITY", "AI", "INCIDENTS", "REPORTS"].includes(t)) {
      setTab(t as any);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: typeof tab) => {
    setTab(newTab);
    setSearchParams({ tab: newTab });
  };
  const [users, setUsers] = useState<UserAdmin[]>(INITIAL_USERS);
  const [newUser, setNewUser] = useState({ nom: "", prenom: "", email: "", role: "AGENT_RECLAMATION" });
  const [inlineFeedback, setInlineFeedback] = useState<Record<string, string>>({});

  const showInlineFeedback = (buttonKey: string, msg: string) => {
    setInlineFeedback(prev => ({ ...prev, [buttonKey]: msg }));
    setTimeout(() => {
      setInlineFeedback(prev => {
        const copy = { ...prev };
        delete copy[buttonKey];
        return copy;
      });
    }, 4500);
  };

  // User Management CRUD
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.nom) return;
    const created: UserAdmin = {
      id: Date.now(),
      nom: newUser.nom.toUpperCase(),
      prenom: newUser.prenom,
      email: newUser.email,
      role: newUser.role,
      habilitation: "NIVEAU_2",
      actif: true
    };
    setUsers([...users, created]);
    showInlineFeedback("addUser", `✅ Utilisateur ${created.prenom} ${created.nom} créé avec succès !`);
    setNewUser({ nom: "", prenom: "", email: "", role: "AGENT_RECLAMATION" });
  };

  const toggleUserStatus = (id: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, actif: !u.actif } : u));
    showInlineFeedback(`user_${id}`, "Statut d'accès mis à jour.");
  };

  const deleteUser = (id: number) => {
    setUsers(users.filter(u => u.id !== id));
    showInlineFeedback("deleteUser", "Compte utilisateur supprimé.");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header Admin */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-white/10 text-cyan-400 rounded-2xl text-2xl font-black">
            ⚙️
          </span>
          <div>
            <h1 className="text-2xl font-black">Administration Système & Supervision</h1>
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              Plateforme Tawsa • Administration Centrale IT & Gouvernance IA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-xs font-mono font-bold text-emerald-400">Système Opérationnel 99.9%</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: "SUPERVISION", label: "📊 Supervision Live", icon: "⚡" },
          { id: "USERS", label: "👥 Utilisateurs & Droits", icon: "🔑" },
          { id: "WORKFLOWS", label: "⚙️ Workflows & Demandes", icon: "🔀" },
          { id: "AUDIT", label: "📜 Journaux d'Audit", icon: "🛡️" },
          { id: "SECURITY", label: "🔐 Clés & Certificats", icon: "🗝️" },
          { id: "AI", label: "🤖 Modèles IA", icon: "🧠" },
          { id: "INCIDENTS", label: "🚨 Incidents Techniques", icon: "🛠️" },
          { id: "REPORTS", label: "📈 Rapports Global", icon: "📄" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
              tab === t.id
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Supervision Temps Réel */}
      {tab === "SUPERVISION" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
              <span className="text-3xl font-black text-indigo-600">1,248</span>
              <p className="text-xs font-bold text-slate-500 uppercase mt-1">Requêtes / Min</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
              <span className="text-3xl font-black text-emerald-500">18ms</span>
              <p className="text-xs font-bold text-slate-500 uppercase mt-1">Temps de Réponse API</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
              <span className="text-3xl font-black text-blue-500">98.4%</span>
              <p className="text-xs font-bold text-slate-500 uppercase mt-1">Précision Modèle RAG</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
              <span className="text-3xl font-black text-amber-500">0</span>
              <p className="text-xs font-bold text-slate-500 uppercase mt-1">Incidents Critiques</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Gestion Utilisateurs & Droits */}
      {tab === "USERS" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-sm">Créer / Modifier Utilisateur</h3>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nom</label>
                <input
                  type="text"
                  required
                  value={newUser.nom}
                  onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                  placeholder="EX: EL ALAMI"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Prénom</label>
                <input
                  type="text"
                  required
                  value={newUser.prenom}
                  onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })}
                  placeholder="EX: Youssef"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email Affecté</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="youssef@tawsa.ma"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Rôle et Habilitations</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                >
                  <option value="AGENT_RECLAMATION">Agent Réclamation</option>
                  <option value="AGENT_VALIDATION">Agent Validation</option>
                  <option value="AGENT_CERTIFICATION">Agent Certification</option>
                  <option value="AGENT_SIGNATURE">Agent Signature</option>
                  <option value="MEDIATEUR">Médiateur</option>
                  <option value="ADMINISTRATEUR">Administrateur</option>
                </select>
              </div>
              <div className="space-y-2">
                <button type="submit" className="w-full py-3 bg-slate-900 text-white font-black text-xs rounded-xl shadow cursor-pointer">
                  + Ajouter l'Utilisateur
                </button>
                {inlineFeedback["addUser"] && (
                  <p className="text-xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-300 p-2 rounded-xl text-center">
                    {inlineFeedback["addUser"]}
                  </p>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-sm">Comptes & Droits d'Accès Actifs</h3>
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {users.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-black text-slate-900">{u.prenom} {u.nom}</p>
                    <p className="text-[11px] text-slate-500">{u.email} • <span className="font-bold text-indigo-600">{u.role}</span></p>
                  </div>

                  <div className="flex items-center gap-2">
                    {inlineFeedback[`user_${u.id}`] && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border p-1 rounded-lg">
                        {inlineFeedback[`user_${u.id}`]}
                      </span>
                    )}
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer ${
                        u.actif ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {u.actif ? "Actif" : "Désactivé"}
                    </button>

                    <button
                      onClick={() => deleteUser(u.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 text-sm cursor-pointer"
                      title="Supprimer compte"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Modèles IA */}
      {tab === "AI" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-black text-slate-900 text-base">🧠 Supervision & Fine-Tuning des Modèles IA</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border rounded-2xl space-y-2">
              <span className="font-bold text-xs text-slate-800">Modèle RAG Réglementaire</span>
              <p className="text-xs text-slate-500">Embeddings ChromaDB • Base Juridique Marocaine</p>
              <button
                onClick={() => showInlineFeedback("rag", "Ré-indexation RAG exécutée !")}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Ré-indexer la base RAG
              </button>
              {inlineFeedback["rag"] && (
                <p className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border p-1.5 rounded-lg text-center">
                  {inlineFeedback["rag"]}
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border rounded-2xl space-y-2">
              <span className="font-bold text-xs text-slate-800">Modèle LSM (Langue des Signes)</span>
              <p className="text-xs text-slate-500">MediaPipe Hand Landmarker • Précision 96%</p>
              <button
                onClick={() => showInlineFeedback("lsm", "Modèle LSM actualisé !")}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Mettre à Jour le Modèle
              </button>
              {inlineFeedback["lsm"] && (
                <p className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border p-1.5 rounded-lg text-center">
                  {inlineFeedback["lsm"]}
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border rounded-2xl space-y-2">
              <span className="font-bold text-xs text-slate-800">OCR & Vérification Docs</span>
              <p className="text-xs text-slate-500">Tesseract OCR • Algorithme Hash Checksum</p>
              <button
                onClick={() => showInlineFeedback("ocr", "Modèle OCR optimisé avec succès !")}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Optimiser l'OCR
              </button>
              {inlineFeedback["ocr"] && (
                <p className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border p-1.5 rounded-lg text-center">
                  {inlineFeedback["ocr"]}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Audit / Incidents / Security / Workflows placeholder */}
      {tab !== "SUPERVISION" && tab !== "USERS" && tab !== "AI" && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4">
          <span className="text-4xl">🛠️</span>
          <h3 className="font-black text-slate-900 text-lg">Module Admin {tab} Actif</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Les métriques de sécurité, certificats SSL/TLS, journaux d'audit et rapports globaux de performance sont supervisés en temps réel par la console.
          </p>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => showInlineFeedback(`report_${tab}`, `Rapport ${tab} généré et téléchargé !`)}
              className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              Générer Rapport {tab}
            </button>
            {inlineFeedback[`report_${tab}`] && (
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl">
                {inlineFeedback[`report_${tab}`]}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
