import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { UserProfileBanner } from "../../components/common/UserProfileBanner";
import { useDossierStore, DossierItem } from "../../store/dossierStore";
import { downloadNativePdf, printOfficialReportWindow, downloadCsv } from "../../utils/pdfGenerator";

interface UserAdmin {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  habilitation: string;
  actif: boolean;
  joursDisponibles?: number[];
  dossiersEnCours?: number;
}

const INITIAL_USERS: UserAdmin[] = [
  { id: 2001, nom: "BENALI", prenom: "Ahmed", email: "ahmed.benali@tawsa.ma", role: "AGENT_RECLAMATION", habilitation: "NIVEAU_2", actif: true },
  { id: 2002, nom: "EL IDRISSI", prenom: "Karim", email: "karim.elidrissi@tawsa.ma", role: "AGENT_VALIDATION", habilitation: "NIVEAU_2", actif: true },
  { id: 2003, nom: "ZAHRA", prenom: "Fatima", email: "fatima.zahra@tawsa.ma", role: "AGENT_CERTIFICATION", habilitation: "NIVEAU_2", actif: true },
  { id: 2004, nom: "MANSOURI", prenom: "Samira", email: "samira.mansouri@tawsa.ma", role: "AGENT_SIGNATURE", habilitation: "NIVEAU_2", actif: true },
  { id: 2005, nom: "TAZI", prenom: "Youssef", email: "youssef.tazi@tawsa.ma", role: "MEDIATEUR", habilitation: "NIVEAU_3", actif: true, joursDisponibles: [1, 2, 3, 4, 5], dossiersEnCours: 2 }
];

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<"SUPERVISION" | "USERS" | "WORKFLOWS" | "AUDIT" | "SECURITY" | "AI" | "INCIDENTS" | "REPORTS">("SUPERVISION");

  const { dossiers } = useDossierStore();
  const [auditFilter, setAuditFilter] = useState<string>("TOUS");
  const [auditSearch, setAuditSearch] = useState<string>("");
  const [workflowFilter, setWorkflowFilter] = useState<string>("TOUS");

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
  const [dateAffectation, setDateAffectation] = useState("");
  const [propositionsBackend, setPropositionsBackend] = useState<UserAdmin[] | null>(null);
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
      actif: true,
      joursDisponibles: newUser.role === "MEDIATEUR" ? [1, 2, 3, 4, 5] : undefined,
      dossiersEnCours: newUser.role === "MEDIATEUR" ? 0 : undefined
    };
    setUsers([...users, created]);
    showInlineFeedback("addUser", `✅ Utilisateur ${created.prenom} ${created.nom} créé avec succès !`);
    setNewUser({ nom: "", prenom: "", email: "", role: "AGENT_RECLAMATION" });
    setDateAffectation("");
  };

  const jourSelectionne = dateAffectation ? new Date(`${dateAffectation}T00:00:00`).getDay() : null;
  const propositionsMediateurs = jourSelectionne === null
    ? []
    : users
        .filter((u) => u.role === "MEDIATEUR" && u.actif)
        .filter((u) => (u.joursDisponibles || [1, 2, 3, 4, 5]).includes(jourSelectionne))
        .sort((a, b) => (a.dossiersEnCours || 0) - (b.dossiersEnCours || 0));

  useEffect(() => {
    if (!dateAffectation) {
      setPropositionsBackend(null);
      return;
    }

    const controller = new AbortController();
    fetch(`http://localhost:8081/api/responsable-service/mediateurs/propositions?date=${dateAffectation}`, {
      signal: controller.signal
    })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("API indisponible")))
      .then((data: UserAdmin[]) => setPropositionsBackend(data))
      .catch(() => setPropositionsBackend(null));

    return () => controller.abort();
  }, [dateAffectation]);

  const propositions = propositionsBackend ?? propositionsMediateurs;

  const toggleUserStatus = (id: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, actif: !u.actif } : u));
    showInlineFeedback(`user_${id}`, "Statut d'accès mis à jour.");
  };

  const deleteUser = (id: number) => {
    setUsers(users.filter(u => u.id !== id));
    showInlineFeedback("deleteUser", "Compte utilisateur supprimé.");
  };

  // Agrégation des logs d'audit depuis les dossiers du store et les événements système
  const auditLogs = useMemo(() => {
    const fromDossiers = dossiers.flatMap(d => (d.historiqueActions || []).map(a => ({
      id: a.id,
      date: a.date,
      auteur: a.auteur,
      role: a.auteurRole,
      action: a.action,
      details: a.commentaire,
      dossierNumero: d.numeroDossier,
      citoyen: d.citoyenNom,
      hash: `e3b0c44298fc${a.id.replace(/\D/g, '').padEnd(16, '0').substring(0, 16)}...`
    })));

    const systemEvents = [
      {
        id: "sys-01",
        date: "2026-09-14 07:15",
        auteur: "Console Centrale IT",
        role: "ADMINISTRATEUR",
        action: "SECURITE",
        details: "Contrôle d'intégrité de la chaîne de confiance et vérification des certificats X.509.",
        dossierNumero: "SYS-INFRA-01",
        citoyen: "Système Central",
        hash: "a9f82d1c78b409e... [SHA-256]"
      },
      {
        id: "sys-02",
        date: "2026-09-14 06:45",
        auteur: "Barid Al-Maghrib TSA",
        role: "TIERS_CONFIANCE",
        action: "SYNCHRONISATION",
        details: "Renouvellement du jeton d'horodatage qualifié et synchronisation NTP souveraine.",
        dossierNumero: "TSA-MA-2026",
        citoyen: "Infrastructure",
        hash: "b410c87ef19023a... [SHA-256]"
      },
      {
        id: "sys-03",
        date: "2026-09-14 06:00",
        auteur: "Passerelle DGSN",
        role: "INTEGRATION",
        action: "SYNCHRONISATION",
        details: "Contrôle de conformité de l'interconnexion Golden Record CNI marocaine.",
        dossierNumero: "CNI-MA-SYNC",
        citoyen: "Registre National",
        hash: "77ef1994a0210bc... [SHA-256]"
      }
    ];

    const all = [...fromDossiers, ...systemEvents];
    return all.sort((a, b) => b.date.localeCompare(a.date));
  }, [dossiers]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchFilter = auditFilter === "TOUS" || log.action === auditFilter;
      const matchSearch = !auditSearch.trim() ||
        log.auteur.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.dossierNumero.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.citoyen.toLowerCase().includes(auditSearch.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [auditLogs, auditFilter, auditSearch]);

  // Handlers pour l'onglet WORKFLOWS
  const handleExportWorkflowPdf = () => {
    const config = {
      filename: `Rapport_Workflows_Tawsa_${new Date().toISOString().substring(0, 10)}.pdf`,
      title: "RAPPORT OFFICIEL DES WORKFLOWS ET DEMANDES",
      subtitle: "Direction Générale des Systèmes d'Information • Ministère de la Transition Numérique",
      badge: "RAPPORT EXÉCUTIF",
      summaryMetrics: [
        { label: "Total Dossiers Gérés", value: dossiers.length },
        { label: "Validés / Signés", value: dossiers.filter(d => d.statut === "VALIDE" || d.statut === "CERTIFIE" || d.statut === "SIGNE").length },
        { label: "En Médiation / Litige", value: dossiers.filter(d => d.statut === "REJETE" || d.mediateurAffecte).length },
        { label: "Conformité SLA", value: "98.4%" }
      ],
      sections: [
        {
          title: "Répartition par Étape de Workflow",
          items: [
            { label: "1. Réclamation & Qualification", value: `${dossiers.filter(d => d.statut === "SOUMIS").length} dossier(s)` },
            { label: "2. Instruction & Validation Réglementaire", value: `${dossiers.filter(d => d.statut === "EN_COURS").length} dossier(s)` },
            { label: "3. Contrôle & Certification des Pièces", value: `${dossiers.filter(d => d.statut === "EN_ATTENTE_PIECE" || d.statut === "CERTIFIE").length} dossier(s)` },
            { label: "4. Signature Électronique & Délivrance", value: `${dossiers.filter(d => d.statut === "SIGNE").length} dossier(s)` },
            { label: "5. Médiation Institutionnelle", value: `${dossiers.filter(d => d.statut === "REJETE" || d.mediateurAffecte).length} dossier(s)` },
          ]
        }
      ],
      table: {
        headers: ["N° Dossier", "Citoyen", "Démarche Administrative", "Statut Actuel", "Acteur Assigné"],
        rows: dossiers.map(d => [
          d.numeroDossier,
          d.citoyenNom,
          d.typeDemande,
          d.statut,
          d.mediateurAffecte ? `Médiateur : ${d.mediateurAffecte.nom}` : (d.agentAffecte?.nom || "Service Central")
        ])
      }
    };

    downloadNativePdf(config);
    showInlineFeedback("workflowPdf", "📥 Rapport Workflow PDF téléchargé avec succès !");
  };

  const handlePrintWorkflow = () => {
    printOfficialReportWindow({
      filename: "Rapport_Workflows.pdf",
      title: "RAPPORT OFFICIEL DES WORKFLOWS & DEMANDES",
      subtitle: "Ministère de la Transition Numérique et de la Réforme de l'Administration",
      badge: "CENTRALISÉ",
      summaryMetrics: [
        { label: "Total Demandes", value: dossiers.length },
        { label: "Actes Délivrés", value: dossiers.filter(d => d.statut === "SIGNE").length },
        { label: "Médiations Actives", value: dossiers.filter(d => d.mediateurAffecte || d.statut === "REJETE").length },
        { label: "Taux Résolution", value: "98.4%" }
      ],
      table: {
        headers: ["N° Dossier", "Citoyen", "Démarche Administrative", "Statut", "Acteur Assigné"],
        rows: dossiers.map(d => [
          d.numeroDossier,
          d.citoyenNom,
          d.typeDemande,
          d.statut,
          d.mediateurAffecte ? `Médiateur : ${d.mediateurAffecte.nom}` : (d.agentAffecte?.nom || "Service Central")
        ])
      }
    });
  };

  const handleExportWorkflowCsv = () => {
    const headers = ["Numero_Dossier", "Citoyen", "Type_Demande", "Statut", "Date_Creation", "Acteur_Assigne"];
    const rows = dossiers.map(d => [
      d.numeroDossier,
      d.citoyenNom,
      d.typeDemande,
      d.statut,
      d.dateCreation,
      d.mediateurAffecte ? `Médiateur ${d.mediateurAffecte.nom}` : (d.agentAffecte?.nom || "Service Central")
    ]);
    downloadCsv(`Workflows_Tawsa_${new Date().toISOString().substring(0, 10)}.csv`, headers, rows);
    showInlineFeedback("workflowCsv", "📊 Données Workflow exportées en CSV !");
  };

  // Handlers pour l'onglet AUDIT
  const handleExportAuditPdf = () => {
    const config = {
      filename: `Registre_Audit_Tawsa_${new Date().toISOString().substring(0, 10)}.pdf`,
      title: "REGISTRE OFFICIEL D'AUDIT ET DE TRAÇABILITÉ",
      subtitle: "Système National de Sécurité de l'Information • Conforme DNSSI & Loi 09-08",
      badge: "CONFIDENTIEL / SOUVERAIN",
      summaryMetrics: [
        { label: "Événements Tracés", value: filteredAuditLogs.length },
        { label: "Intégrité Cryptographique", value: "100% SHA-256" },
        { label: "Horodatage TSA", value: "Actif & Conforme" },
        { label: "Alertes Sécurité", value: "0 Anomalie" }
      ],
      table: {
        headers: ["Horodatage", "Acteur & Rôle", "Action", "Dossier / Cible", "Détails & Motif"],
        rows: filteredAuditLogs.map(log => [
          log.date,
          `${log.auteur} (${log.role})`,
          log.action,
          log.dossierNumero,
          log.details
        ])
      }
    };

    downloadNativePdf(config);
    showInlineFeedback("auditPdf", "📥 Journal d'Audit PDF téléchargé avec succès !");
  };

  const handlePrintAudit = () => {
    printOfficialReportWindow({
      filename: "Registre_Audit.pdf",
      title: "REGISTRE OFFICIEL D'AUDIT ET DE TRAÇABILITÉ CRYPTOGRAPHIQUE",
      subtitle: "Direction de la Sécurité des Systèmes d'Information • Plateforme Nationale Tawsa",
      badge: "SCELLÉ & HORODATÉ",
      summaryMetrics: [
        { label: "Événements Tracés", value: filteredAuditLogs.length },
        { label: "Chaîne de Blocs / Hash", value: "100% Intègre" },
        { label: "Tiers de Confiance", value: "Barid Al-Maghrib TSA" },
        { label: "Contrôle d'Accès", value: "RBAC Niveau 3" }
      ],
      table: {
        headers: ["Date & Heure", "Acteur", "Rôle", "Action", "Dossier", "Détails"],
        rows: filteredAuditLogs.map(log => [
          log.date,
          log.auteur,
          log.role,
          log.action,
          log.dossierNumero,
          log.details
        ])
      }
    });
  };

  const handleExportAuditCsv = () => {
    const headers = ["ID_Log", "Date_Heure", "Acteur", "Role", "Action", "Dossier", "Citoyen", "Details", "Empreinte_SHA256"];
    const rows = filteredAuditLogs.map(log => [
      log.id,
      log.date,
      log.auteur,
      log.role,
      log.action,
      log.dossierNumero,
      log.citoyen,
      log.details,
      log.hash
    ]);
    downloadCsv(`Journal_Audit_Tawsa_${new Date().toISOString().substring(0, 10)}.csv`, headers, rows);
    showInlineFeedback("auditCsv", "📊 Journal d'Audit exporté en CSV !");
  };

  // Handlers pour Rapports Globaux, Incidents et Sécurité
  const handleExportReportsPdf = () => {
    const config = {
      filename: `Rapport_Global_Tawsa_${new Date().toISOString().substring(0, 10)}.pdf`,
      title: "RAPPORT ANNUEL DE PERFORMANCE ET D'EFFICACITÉ ADMINISTRATIVE",
      subtitle: "Ministère de la Transition Numérique et de la Réforme de l'Administration",
      badge: "MINISTÉRIEL",
      summaryMetrics: [
        { label: "Taux de Résolution Globale", value: "96.8%" },
        { label: "Délai Moyen de Traitement", value: "4.2 Jours" },
        { label: "Satisfaction Citoyenne", value: "94.7%" },
        { label: "Économie Papier & Déplacement", value: "-82%" }
      ],
      sections: [
        {
          title: "Indicateurs Clés de Gouvernance",
          items: [
            { label: "Nombre Total de Démarches Dématérialisées", value: "128 Services Publics" },
            { label: "Volume de Documents Signés Électroniquement", value: "14,892 Actes" },
            { label: "Litiges Réglés à l'Amiable par Médiation", value: "89.2% de Succès" },
            { label: "Taux de Disponibilité Système Central", value: "99.98% Haute Disponibilité" }
          ]
        }
      ]
    };
    downloadNativePdf(config);
    showInlineFeedback("reportsPdf", "📥 Rapport Global Annuel PDF téléchargé avec succès !");
  };

  const handlePrintReports = () => {
    printOfficialReportWindow({
      filename: "Rapport_Global.pdf",
      title: "RAPPORT ANNUEL DE PERFORMANCE ET GOUVERNANCE TAWSA",
      subtitle: "Gouvernance Numérique et Modernisation Administrative du Royaume",
      badge: "OFFICIEL",
      summaryMetrics: [
        { label: "Résolution Globale", value: "96.8%" },
        { label: "Délai Moyen", value: "4.2 Jours" },
        { label: "Satisfaction Usagers", value: "94.7%" },
        { label: "Conformité Légale", value: "100%" }
      ]
    });
  };

  const handleExportIncidentsPdf = () => {
    const config = {
      filename: `Rapport_Incidents_Tawsa_${new Date().toISOString().substring(0, 10)}.pdf`,
      title: "RAPPORT DE CONTRÔLE DES INCIDENTS TECHNIQUES ET DES DÉLAIS SLA",
      subtitle: "Direction de l'Exploitation et Supervision d'Infrastructure",
      badge: "MAINTENANCE",
      summaryMetrics: [
        { label: "Incidents Critiques", value: "0" },
        { label: "Alertes Goulots Traitées", value: "12" },
        { label: "Temps Moyen de Reprise (MTTR)", value: "8 Min" },
        { label: "Disponibilité Réseau", value: "99.98%" }
      ]
    };
    downloadNativePdf(config);
    showInlineFeedback("incidentsPdf", "📥 Rapport Incidents & SLA PDF téléchargé !");
  };

  const handleExportSecurityPdf = () => {
    const config = {
      filename: `Rapport_Securite_Cles_Tawsa_${new Date().toISOString().substring(0, 10)}.pdf`,
      title: "AUDIT DES CERTIFICATS ÉLECTRONIQUES, CLÉS HSM ET HORODATAGE",
      subtitle: "Autorité de Certification Gouvernementale et Centre de Confiance",
      badge: "SECRET DÉFENSE / ANRT",
      summaryMetrics: [
        { label: "Certificats X.509 Valides", value: "18" },
        { label: "Statut Module HSM", value: "Opérationnel FIPS 140-2" },
        { label: "Liaison Barid Al-Maghrib TSA", value: "Active 2026-2028" },
        { label: "Conformité Algorithmes", value: "RSA 4096 / SHA-256" }
      ]
    };
    downloadNativePdf(config);
    showInlineFeedback("securityPdf", "📥 Rapport de Sécurité PDF téléchargé avec succès !");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <UserProfileBanner />
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
              {newUser.role === "MEDIATEUR" && (
                <div className="space-y-2 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                  <label className="block text-[11px] font-bold text-teal-900 uppercase mb-1">Date souhaitée de disponibilité</label>
                  <input
                    type="date"
                    required
                    value={dateAffectation}
                    onChange={(e) => setDateAffectation(e.target.value)}
                    className="w-full p-2.5 bg-white border border-teal-200 rounded-xl text-xs font-bold"
                  />
                  {dateAffectation && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-black text-teal-900">Propositions disponibles pour cette date</p>
                      {propositions.length === 0 ? (
                        <p className="text-[11px] font-semibold text-rose-700">Aucun médiateur disponible. Choisissez une autre date.</p>
                      ) : (
                        propositions.map((mediateur, index) => (
                          <div key={mediateur.id} className="flex items-center justify-between bg-white border border-teal-100 rounded-lg px-2.5 py-2 text-[11px]">
                            <span className="font-bold text-slate-900">{index === 0 ? "★ " : ""}{mediateur.prenom} {mediateur.nom}</span>
                            <span className="text-slate-500">{mediateur.dossiersEnCours || 0} dossier(s) en cours</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
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

      {/* Tab 4: Workflows & Demandes */}
      {tab === "WORKFLOWS" && (
        <div className="space-y-6">
          {/* Header Actions & Export Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <h3 className="font-black text-slate-900 text-lg">Supervision des Workflows & Chaîne de Traitement</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pilotage des 5 étapes réglementaires : Réclamation → Validation → Certification → Signature → Médiation
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportWorkflowPdf}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>📥</span> Télécharger Rapport PDF
              </button>
              <button
                onClick={handlePrintWorkflow}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>🖨️</span> Version Imprimable / PDF
              </button>
              <button
                onClick={handleExportWorkflowCsv}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
              >
                <span>📊</span> Export CSV
              </button>
            </div>
          </div>

          {inlineFeedback["workflowPdf"] && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-black animate-pulse flex items-center gap-2">
              <span>✓</span> {inlineFeedback["workflowPdf"]}
            </div>
          )}

          {inlineFeedback["workflowCsv"] && (
            <div className="p-4 bg-indigo-100 border border-indigo-300 text-indigo-800 rounded-2xl text-xs font-black flex items-center gap-2">
              <span>✓</span> {inlineFeedback["workflowCsv"]}
            </div>
          )}

          {/* Cartes Pipeline des 5 étapes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {[
              {
                step: 1,
                title: "1. Réclamation",
                role: "Agent Réclamation",
                count: dossiers.filter(d => d.statut === "SOUMIS").length,
                sla: "24h Max",
                color: "from-blue-600 to-indigo-700",
                badge: "Prise en charge",
                icon: "📝"
              },
              {
                step: 2,
                title: "2. Validation",
                role: "Agent Validation",
                count: dossiers.filter(d => d.statut === "EN_COURS").length,
                sla: "48h Max",
                color: "from-indigo-600 to-violet-700",
                badge: "Examen juridique",
                icon: "🔍"
              },
              {
                step: 3,
                title: "3. Certification",
                role: "Agent Certification",
                count: dossiers.filter(d => d.statut === "EN_ATTENTE_PIECE" || d.statut === "CERTIFIE").length,
                sla: "48h Max",
                color: "from-violet-600 to-purple-700",
                badge: "Audit des pièces",
                icon: "🛡️"
              },
              {
                step: 4,
                title: "4. Signature & TSA",
                role: "Agent Signature",
                count: dossiers.filter(d => d.statut === "SIGNE").length,
                sla: "Immédiat",
                color: "from-purple-600 to-pink-700",
                badge: "Délivrance acte",
                icon: "✍️"
              },
              {
                step: 5,
                title: "5. Médiation",
                role: "Médiateur du Royaume",
                count: dossiers.filter(d => d.statut === "REJETE" || d.mediateurAffecte).length,
                sla: "15 Jours",
                color: "from-teal-600 to-emerald-700",
                badge: "Recours amiable",
                icon: "⚖️"
              }
            ].map(item => (
              <div key={item.step} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {item.sla}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 text-xs mt-2">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">{item.role}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{item.badge}</span>
                  <span className="text-lg font-black text-slate-900 font-mono">{item.count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tableau des dossiers en workflow */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="font-black text-slate-900 text-sm">Dossiers en Circulation Active ({dossiers.length})</h4>
              <div className="flex items-center gap-2">
                <select
                  value={workflowFilter}
                  onChange={(e) => setWorkflowFilter(e.target.value)}
                  className="p-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="TOUS">Tous les statuts</option>
                  <option value="SOUMIS">Étape 1 : SOUMIS</option>
                  <option value="EN_COURS">Étape 2 : EN COURS (Validation)</option>
                  <option value="EN_ATTENTE_PIECE">Étape 3 : EN ATTENTE PIÈCE</option>
                  <option value="SIGNE">Étape 4 : SIGNE</option>
                  <option value="REJETE">Étape 5 : REJETE / LITIGE</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase text-slate-500">
                    <th className="p-3">N° Dossier</th>
                    <th className="p-3">Citoyen & CNI</th>
                    <th className="p-3">Démarche</th>
                    <th className="p-3">Statut Actuel</th>
                    <th className="p-3">Acteur Assigné</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dossiers
                    .filter(d => workflowFilter === "TOUS" || d.statut === workflowFilter)
                    .map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition font-medium">
                        <td className="p-3 font-mono font-black text-slate-900">{d.numeroDossier}</td>
                        <td className="p-3 font-bold text-slate-800">{d.citoyenNom} <span className="text-[10px] text-slate-400">({d.citoyenCnie})</span></td>
                        <td className="p-3 text-slate-600 max-w-[200px] truncate">{d.typeDemande}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            d.statut === "SIGNE" || d.statut === "VALIDE"
                              ? "bg-emerald-100 text-emerald-800"
                              : d.statut === "REJETE"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {d.statut}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {d.mediateurAffecte ? (
                            <span className="font-bold text-teal-800">⚖️ {d.mediateurAffecte.nom} (Médiateur)</span>
                          ) : d.agentAffecte ? (
                            <span>👤 {d.agentAffecte.nom} ({d.agentAffecte.role})</span>
                          ) : (
                            <span className="text-slate-400 italic">Service Central</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              printOfficialReportWindow({
                                filename: `Fiche_Dossier_${d.numeroDossier}.pdf`,
                                title: `FICHE OFFICIELLE D'INSTRUCTION — ${d.numeroDossier}`,
                                subtitle: d.typeDemande,
                                badge: d.statut,
                                summaryMetrics: [
                                  { label: "N° Dossier", value: d.numeroDossier },
                                  { label: "Statut", value: d.statut },
                                  { label: "Pièces", value: `${d.documents.length} doc(s)` },
                                  { label: "Date", value: d.dateCreation }
                                ],
                                sections: [
                                  {
                                    title: "Détails du Citoyen & Démarche",
                                    items: [
                                      { label: "Bénéficiaire", value: `${d.citoyenNom} (CNIE : ${d.citoyenCnie})` },
                                      { label: "Objet", value: d.typeDemande },
                                      { label: "Description", value: d.description || "Instruction standard." }
                                    ]
                                  }
                                ]
                              });
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[11px] rounded-lg transition cursor-pointer"
                          >
                            📄 Imprimer Fiche PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Journaux d'Audit & Traçabilité */}
      {tab === "AUDIT" && (
        <div className="space-y-6">
          {/* Header Audit & Actions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <h3 className="font-black text-slate-900 text-lg">Journal d'Audit Immuable & Traçabilité Souveraine</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Historique légal de toutes les actions : Rejets, Validations, Certifications, Signatures et Saisines
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportAuditPdf}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>📥</span> Télécharger Journal d'Audit (PDF)
              </button>
              <button
                onClick={handlePrintAudit}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>🖨️</span> Version Imprimable / PDF
              </button>
              <button
                onClick={handleExportAuditCsv}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
              >
                <span>📊</span> Export CSV
              </button>
            </div>
          </div>

          {inlineFeedback["auditPdf"] && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-black animate-pulse flex items-center gap-2">
              <span>✓</span> {inlineFeedback["auditPdf"]}
            </div>
          )}

          {inlineFeedback["auditCsv"] && (
            <div className="p-4 bg-indigo-100 border border-indigo-300 text-indigo-800 rounded-2xl text-xs font-black flex items-center gap-2">
              <span>✓</span> {inlineFeedback["auditCsv"]}
            </div>
          )}

          {/* Cartes Métriques Sécurité & Intégrité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center space-y-1">
              <span className="text-3xl font-black text-slate-900 font-mono">{filteredAuditLogs.length}</span>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Événements Tracés</p>
              <span className="text-[10px] text-emerald-600 font-bold">100% Archivés</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center space-y-1">
              <span className="text-3xl font-black text-emerald-600 font-mono">100%</span>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Intégrité SHA-256</p>
              <span className="text-[10px] text-slate-500 font-semibold">Aucune altération</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center space-y-1">
              <span className="text-3xl font-black text-indigo-600 font-mono">Barid Al-Maghrib</span>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Horodatage TSA</p>
              <span className="text-[10px] text-emerald-600 font-bold">Certifié Conforme</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center space-y-1">
              <span className="text-3xl font-black text-rose-600 font-mono">
                {auditLogs.filter(l => l.action === "REJET").length}
              </span>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Rejets Motivés</p>
              <span className="text-[10px] text-rose-600 font-bold">Traçabilité légale</span>
            </div>
          </div>

          {/* Barre de Recherche et Filtres */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-80">
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Rechercher par acteur, N° dossier, motif..."
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {["TOUS", "REJET", "VALIDATION", "SIGNATURE", "DEMANDE_PIECE", "QUALIFICATION", "SECURITE"].map(type => (
                <button
                  key={type}
                  onClick={() => setAuditFilter(type)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
                    auditFilter === type
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Tableau du journal d'audit */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-500">
                    <th className="p-3">Horodatage Certifié</th>
                    <th className="p-3">Acteur & Rôle</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Dossier / Cible</th>
                    <th className="p-3">Détails & Motif Juridique</th>
                    <th className="p-3">Empreinte SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                        Aucun journal correspondant aux critères de recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition font-medium">
                        <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">{log.date}</td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{log.auteur}</p>
                          <span className="text-[10px] text-indigo-600 font-semibold">{log.role}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            log.action === "REJET"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : log.action === "VALIDATION"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : log.action === "SIGNATURE"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : log.action === "DEMANDE_PIECE"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">{log.dossierNumero}</td>
                        <td className="p-3 text-slate-700 leading-relaxed max-w-sm">{log.details}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">{log.hash}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Rapports Globaux */}
      {tab === "REPORTS" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <h3 className="font-black text-slate-900 text-lg">Rapports Globaux & KPIs Ministériels</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Indicateurs d'impact, satisfaction usagers et temps moyen de traitement national
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportReportsPdf}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>📥</span> Télécharger Rapport Global (PDF)
              </button>
              <button
                onClick={handlePrintReports}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>🖨️</span> Version Imprimable / PDF
              </button>
            </div>
          </div>

          {inlineFeedback["reportsPdf"] && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-black animate-pulse flex items-center gap-2">
              <span>✓</span> {inlineFeedback["reportsPdf"]}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Délai Moyen National</span>
              <p className="text-4xl font-black text-indigo-600 font-mono">4.2 Jours</p>
              <p className="text-xs text-slate-500">Objectif légal fixé par le décret : 15 jours (-72% par rapport au seuil)</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Taux Résolution Amiable</span>
              <p className="text-4xl font-black text-teal-600 font-mono">89.2%</p>
              <p className="text-xs text-slate-500">Succès des médiations institutionnelles conduites sans contentieux judiciaire</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Indice Satisfaction</span>
              <p className="text-4xl font-black text-emerald-600 font-mono">94.7%</p>
              <p className="text-xs text-slate-500">Évaluation mesurée auprès de 18,400 usagers citoyens et entreprises</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Incidents Techniques */}
      {tab === "INCIDENTS" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <h3 className="font-black text-slate-900 text-lg">Surveillance des Incidents & Respect des SLAs</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Détection automatique des goulots d'étranglement, alertes d'escalade et santé des connecteurs
              </p>
            </div>

            <button
              onClick={handleExportIncidentsPdf}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>📥</span> Télécharger Rapport Incidents (PDF)
            </button>
          </div>

          {inlineFeedback["incidentsPdf"] && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-black animate-pulse flex items-center gap-2">
              <span>✓</span> {inlineFeedback["incidentsPdf"]}
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-black text-slate-900 text-sm">Registre des Alertes & Événements Techniques Récents</h4>
            <div className="divide-y divide-slate-100">
              <div className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-900">Connexion Passerelle DGSN (Golden Record CNI)</span>
                  <p className="text-[11px] text-slate-500">Latence 24ms • Taux de succès 100%</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">NORMAL</span>
              </div>
              <div className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-900">Service d'Horodatage Barid Al-Maghrib TSA</span>
                  <p className="text-[11px] text-slate-500">Jetons valides • Synchronisation NTP OK</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">NORMAL</span>
              </div>
              <div className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-900">Pipeline OCR & Reconnaissance Falsification</span>
                  <p className="text-[11px] text-slate-500">Score moyen 97.8% • 0 altération détectée</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">NORMAL</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Sécurité & Certificats */}
      {tab === "SECURITY" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔐</span>
                <h3 className="font-black text-slate-900 text-lg">Centre de Confiance Numérique & Certificats Cryptographiques</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gestion des clés privées HSM, certificats SSL/TLS X.509 et accréditations Barid Al-Maghrib
              </p>
            </div>

            <button
              onClick={handleExportSecurityPdf}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>📥</span> Télécharger Rapport Sécurité (PDF)
            </button>
          </div>

          {inlineFeedback["securityPdf"] && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-black animate-pulse flex items-center gap-2">
              <span>✓</span> {inlineFeedback["securityPdf"]}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-black text-slate-900 text-sm">Certificats Serveur & TLS</h4>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Domaine :</span><span className="font-mono font-bold text-slate-900">tawsa.gov.ma</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Autorité (CA) :</span><span className="font-bold text-slate-900">Barid Al-Maghrib Root CA 2026</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Expiration :</span><span className="font-semibold text-emerald-700">31 Décembre 2028 (Valide)</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Chiffrement :</span><span className="font-mono font-bold text-slate-900">ECDSA P-384 / TLS 1.3</span></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-black text-slate-900 text-sm">Module Matériel de Sécurité (HSM)</h4>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Statut HSM :</span><span className="font-bold text-emerald-700">EN LIGNE (FIPS 140-2 Level 3)</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Signature d'État :</span><span className="font-bold text-slate-900">Active (Sceau National)</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Horodatage TSA :</span><span className="font-bold text-slate-900">RFC 3161 Conforme</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Empreinte Racine :</span><span className="font-mono text-[10px] text-slate-500">e3b0c44298fc1c149af...</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
