import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useDossierStore } from '../../store/dossierStore';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';

const translations: Record<string, any> = {
  FR: {
    title: "Tableau de Bord",
    loading: "Chargement des données...",
    stats: "Statistiques Globales",
    recent: "Dossiers Récents",
    total: "Total Dossiers",
    waiting: "En Attente",
    done: "Traités",
    satisfaction: "Satisfaction",
    distribution: "Répartition des Dossiers",
    performance: "Performance Mensuelle"
  },
  EN: {
    title: "Dashboard",
    loading: "Loading data...",
    stats: "Global Statistics",
    recent: "Recent Files",
    total: "Total Files",
    waiting: "Pending",
    done: "Processed",
    satisfaction: "Satisfaction",
    distribution: "Files Distribution",
    performance: "Monthly Performance"
  }
};

const COLORS = ['#450a0a', '#0f172a', '#a8a29e'];

const FALLBACK_DASHBOARD = {
  stats: {
    totalDossiers: 36,
    dossiersEnAttente: 6,
    dossiersTraites: 28,
    tauxSatisfaction: 96
  },
  performance: [
    { mois: "Jan", traites: 3 },
    { mois: "Fév", traites: 4 },
    { mois: "Mar", traites: 5 },
    { mois: "Avr", traites: 5 },
    { mois: "Mai", traites: 6 },
    { mois: "Juin", traites: 8 }
  ],
  recentDossiers: [
    { id: "REC-2026-0891", type: "Demande de Régularisation Foncière", citoyen: "Omar Benjelloun", date: "2026-08-31", status: "En cours" },
    { id: "VAL-2026-0301", type: "Agrément d'Exploitation Commerciale", citoyen: "Karim El Idrissi", date: "2026-08-30", status: "Validé" },
    { id: "CERT-2026-0091", type: "Attestation de Conformité", citoyen: "Fatima Zahra", date: "2026-08-29", status: "Transmis" }
  ]
};

import { AgentReclamationPage } from './AgentReclamationPage';
import { AgentValidationPage } from './AgentValidationPage';
import { AgentCertificationPage } from './AgentCertificationPage';
import { AgentSignaturePage } from './AgentSignaturePage';
import { AdminPage } from './AdminPage';
import { MediateurPage } from './MediateurPage';
import { ResponsableServicePage } from './ResponsableServicePage';

export function DashboardPage() {
  const { lang } = useUIStore();
  const { user } = useAuthStore();
  const { dossiers } = useDossierStore();
  const [data, setData] = useState<any>(FALLBACK_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"STATS" | "ACTION">("STATS");

  const pendingNotificationDossier = dossiers.find(d => d.demandeDocumentsSupplementaires || d.statut === "EN_ATTENTE_PIECE");

  const t = translations[lang] || translations.FR;

  useEffect(() => {
    fetch('/dashboard/data.json')
      .then(res => {
        if (!res.ok) throw new Error("File not found");
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Utilisation des données locales dashboard fallback :", err);
        setData(FALLBACK_DASHBOARD);
        setLoading(false);
      });
  }, []);

  // Redirection directe vers l'Espace de travail du rôle spécifique
  if (user?.role === "AGENT_RECLAMATION") {
    return <AgentReclamationPage />;
  }
  if (user?.role === "AGENT_VALIDATION") {
    return <AgentValidationPage />;
  }
  if (user?.role === "AGENT_CERTIFICATION") {
    return <AgentCertificationPage />;
  }
  if (user?.role === "AGENT_SIGNATURE") {
    return <AgentSignaturePage />;
  }
  if (user?.role === "ADMINISTRATEUR") {
    return <AdminPage />;
  }
  if (user?.role === "MEDIATEUR") {
    return <MediateurPage />;
  }
  if (user?.role === "RESPONSABLE_SERVICE") {
    return <ResponsableServicePage />;
  }

  const getRoleLabel = (r?: string) => {
    switch (r) {
      case "AGENT_RECLAMATION": return "📥 Espace Agent de Réclamation";
      case "AGENT_VALIDATION": return "🔍 Espace Agent de Validation";
      case "AGENT_CERTIFICATION": return "🏵️ Espace Agent de Certification";
      case "AGENT_SIGNATURE": return "✒️ Espace Agent de Signature & Envoi";
      case "ADMINISTRATEUR": return "⚙️ Espace Administrateur System";
      case "MEDIATEUR": return "⚖️ Espace Médiateur Institutionnel";
      case "RESPONSABLE_SERVICE": return "👔 Espace Responsable Service";
      default: return null;
    }
  };

  const roleLabel = getRoleLabel(user?.role);

  // Si vue d'action sélectionnée par l'agent
  if (activeView === "ACTION" && user?.role) {
    return (
      <div className="space-y-4">
        {/* Navigation retour vers Statistiques */}
        <div className="max-w-7xl mx-auto px-8 pt-4 flex justify-between items-center">
          <button
            onClick={() => setActiveView("STATS")}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
          >
            <span>📊</span> <span>Voir le Tableau de Bord Synthétique & Statistiques</span>
          </button>
        </div>

        {user.role === "AGENT_RECLAMATION" && <AgentReclamationPage />}
        {user.role === "AGENT_VALIDATION" && <AgentValidationPage />}
        {user.role === "AGENT_CERTIFICATION" && <AgentCertificationPage />}
        {user.role === "AGENT_SIGNATURE" && <AgentSignaturePage />}
        {user.role === "ADMINISTRATEUR" && <AdminPage />}
        {user.role === "MEDIATEUR" && <MediateurPage />}
      </div>
    );
  }

  const pieData = data ? [
    { name: t.waiting, value: data.stats.dossiersEnAttente },
    { name: t.done, value: data.stats.dossiersTraites },
    { name: "Rejetés", value: data.stats.totalDossiers - data.stats.dossiersEnAttente - data.stats.dossiersTraites }
  ] : [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-6xl mx-auto space-y-8 bg-white/60 backdrop-blur-md rounded-3xl border border-white/50 shadow-xl"
      dir={lang === "AR" ? "rtl" : "ltr"}
    >
      {/* BANNIÈRE DE NOTIFICATION POUR LE CITOYEN À L'ENTRÉE DE SON ESPACE */}
      {pendingNotificationDossier && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-[#fdfbf7] border-2 border-stone-300 text-slate-900 rounded-3xl shadow-sm space-y-3 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-stone-200 text-3xl flex items-center justify-center shadow-inner shrink-0">
                🔔
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider">
                    Notification Officielle d'Instruction
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {pendingNotificationDossier.numeroDossier}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Demande de pièce urgente émise par M. {pendingNotificationDossier.agentAffecte?.prenom || "Ahmed"} {pendingNotificationDossier.agentAffecte?.nom || "Benali"}
                </h3>
              </div>
            </div>

            <Link
              to="/citoyen/dossiers"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>⚡</span> <span>Transmettre le Document Urgent</span>
            </Link>
          </div>

          <div className="p-4 bg-[#f5f0eb] rounded-2xl border border-stone-300 text-xs font-semibold leading-relaxed text-slate-800">
            💬 <strong>Motif / Commentaire de l'Agent Instructeur :</strong> « {pendingNotificationDossier.motifDemandePiece || pendingNotificationDossier.remarqueAgent} »
          </div>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 text-primary flex items-center justify-center rounded-2xl text-2xl shadow-inner">
            📊
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              {t.title} {user?.role ? `• ${user.role.replace('_', ' ')}` : ''}
            </h1>
            <p className="text-xs text-slate-500 font-bold">
              Bienvenue sur votre espace de suivi et de gestion des démarches publiques Tawsa
            </p>
          </div>
        </div>

        {roleLabel && (
          <button
            onClick={() => setActiveView("ACTION")}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-2xl shadow-lg transition cursor-pointer flex items-center gap-2"
          >
            <span>⚡</span>
            <span>Accéder à l'{roleLabel}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          {t.loading}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Statistiques (Cartes) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
              <span className="text-4xl font-black text-indigo-600 mb-2">{data.stats?.totalDossiers}</span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.total}</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
              <span className="text-4xl font-black text-amber-500 mb-2">{data.stats?.dossiersEnAttente}</span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.waiting}</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
              <span className="text-4xl font-black text-emerald-500 mb-2">{data.stats?.dossiersTraites}</span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.done}</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
              <span className="text-4xl font-black text-blue-500 mb-2">{data.stats?.tauxSatisfaction}%</span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.satisfaction}</span>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Diagramme de secteur (Pie Chart) */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
              <h2 className="font-bold text-slate-800 mb-4 self-start">{t.distribution}</h2>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Diagramme en barres (Bar Chart) */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
              <h2 className="font-bold text-slate-800 mb-4">{t.performance}</h2>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.performance}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="mois" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="traites" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Dossiers récents */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">{t.recent}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.recentDossiers?.map((doc: any, i: number) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{doc.id} - {doc.type}</p>
                    <p className="text-xs text-slate-500 mt-1">👤 {doc.citoyen} • 📅 {doc.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    doc.status === 'Validé' ? 'bg-emerald-100 text-emerald-700' :
                    doc.status === 'En cours' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-red-50 text-red-600 rounded-2xl border border-red-100">
          Impossible de charger les données du backend statique (/dashboard/data.json).
        </div>
      )}
    </motion.div>
  );
}
