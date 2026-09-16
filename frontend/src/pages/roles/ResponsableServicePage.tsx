import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { UserProfileBanner } from "../../components/common/UserProfileBanner";
import { useDossierStore, AgentInfo } from "../../store/dossierStore";

interface AgentPerformance {
  id: string;
  nom: string;
  role: string;
  dossiersEnCours: number;
  dossiersTraitesTotal: number;
  tauxSatisfaction: number;
  statut: "DISPONIBLE" | "CHARGE" | "ABSENT";
}

interface DossierRetard {
  id: string;
  citoyen: string;
  type: string;
  retardJours: number;
  agentAssignee: string;
}

export function ResponsableServicePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [agents] = useState<AgentPerformance[]>([
    { id: "AGT-001", nom: "Ahmed BENALI", role: "Agent Réclamation", dossiersEnCours: 8, dossiersTraitesTotal: 142, tauxSatisfaction: 96, statut: "CHARGE" },
    { id: "AGT-002", nom: "Karim EL IDRISSI", role: "Agent Validation", dossiersEnCours: 4, dossiersTraitesTotal: 198, tauxSatisfaction: 98, statut: "DISPONIBLE" },
    { id: "AGT-003", nom: "Fatima ZAHRA", role: "Agent Certification", dossiersEnCours: 12, dossiersTraitesTotal: 165, tauxSatisfaction: 94, statut: "CHARGE" },
    { id: "AGT-004", nom: "Samira MANSOURI", role: "Agent Signature", dossiersEnCours: 3, dossiersTraitesTotal: 201, tauxSatisfaction: 99, statut: "DISPONIBLE" },
    { id: "AGT-005", nom: "Youssef TAZI", role: "Médiateur du Royaume", dossiersEnCours: 2, dossiersTraitesTotal: 87, tauxSatisfaction: 95, statut: "DISPONIBLE" },
  ]);

  const [retards, setRetards] = useState<DossierRetard[]>([
    { id: "DOS-2026-8801", citoyen: "Mohammed EL AMRAOUI", type: "Autorisation Spéciale", retardJours: 4, agentAssignee: "Fatima ZAHRA" },
    { id: "DOS-2026-7492", citoyen: "Aicha BENJELLOUN", type: "Régularisation Foncière", retardJours: 2, agentAssignee: "Ahmed BENALI" },
  ]);

  const [activeTab, setActiveTab] = useState<"AGENTS" | "RETARDS" | "KPI" | "MEDIATEUR">("AGENTS");

  const { dossiers, affecterMediateur } = useDossierStore();
  
  // États pour l'onglet Médiateur
  const [selectedDossierForMediation, setSelectedDossierForMediation] = useState<any>(null);
  const [dateAffectation, setDateAffectation] = useState<string>("");
  const [mediateursDisponibles, setMédiateursDisponibles] = useState<any[]>([]);
  const [selectedMediateur, setSelectedMediateur] = useState<AgentInfo | null>(null);
  const [instructionsText, setInstructionsText] = useState<string>("");

  const dossiersRejetes = dossiers.filter(d => d.statut === "REJETE" && !d.mediateurAffecte);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "STATS" || tab === "KPI") setActiveTab("KPI");
    else if (tab === "ESCALADES" || tab === "RETARDS") setActiveTab("RETARDS");
    else if (tab === "DOSSIERS" || tab === "AGENTS" || tab === "EQUIPE") setActiveTab("AGENTS");
    else if (tab === "MEDIATEUR") setActiveTab("MEDIATEUR");
  }, [searchParams]);

  const handleTabChange = (tab: "AGENTS" | "RETARDS" | "KPI" | "MEDIATEUR") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [inlineFeedback, setInlineFeedback] = useState<Record<string, string>>({});

  const showInlineFeedback = (key: string, msg: string) => {
    setInlineFeedback(prev => ({ ...prev, [key]: msg }));
    setTimeout(() => {
      setInlineFeedback(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }, 4000);
  };

  const handleReassign = (dossierId: string, targetAgent: string) => {
    setRetards(prev => prev.filter(d => d.id !== dossierId));
    showInlineFeedback(dossierId, `✅ Dossier ${dossierId} réaffecté avec succès à ${targetAgent}.`);
  };

  const handleRelancerAgent = (agentId: string, agentNom: string) => {
    showInlineFeedback(agentId, `🔔 Rappel prioritaire envoyé à l'agent ${agentNom}.`);
  };

  // Effet pour rechercher les médiateurs disponibles selon la date choisie
  useEffect(() => {
    if (dateAffectation) {
      const fetchMediators = async () => {
        try {
          const res = await fetch(`http://localhost:8081/api/responsable-service/mediateurs/propositions?date=${dateAffectation}`);
          if (res.ok) {
            const data = await res.json();
            setMédiateursDisponibles(data);
          } else {
            throw new Error("API failed");
          }
        } catch (error) {
          // Fallback en cas d'erreur de l'API
          const dateObj = new Date(dateAffectation);
          const dayOfWeek = dateObj.getDay();
          
          const mockMediators = [
            {
              matricule: "MAT-MED-2005",
              nom: "TAZI",
              prenom: "Youssef",
              role: "Médiateur du Royaume",
              service: "Médiation",
              email: "youssef.tazi@tawsa.ma",
              telephone: "05 37 20 20 25",
              dossiersEnCours: 2,
              joursDisponibles: [1, 2, 3, 4, 5]
            },
            {
              matricule: "MAT-MED-2006",
              nom: "BOUKILI",
              prenom: "Hassan",
              role: "Médiateur Expert",
              service: "Médiation",
              email: "hassan.boukili@tawsa.ma",
              telephone: "05 37 20 20 26",
              dossiersEnCours: 5,
              joursDisponibles: [1, 3, 5]
            },
            {
              matricule: "MAT-MED-2007",
              nom: "NACIRI",
              prenom: "Laila",
              role: "Médiatrice",
              service: "Médiation",
              email: "laila.naciri@tawsa.ma",
              telephone: "05 37 20 20 27",
              dossiersEnCours: 1,
              joursDisponibles: [2, 4, 5]
            }
          ];

          const filtered = mockMediators
            .filter(m => m.joursDisponibles.includes(dayOfWeek))
            .sort((a, b) => a.dossiersEnCours - b.dossiersEnCours);
            
          setMédiateursDisponibles(filtered);
        }
      };
      fetchMediators();
    } else {
      setMédiateursDisponibles([]);
    }
    setSelectedMediateur(null);
  }, [dateAffectation]);

  const handleAffecterMediateur = () => {
    if (selectedDossierForMediation && selectedMediateur && instructionsText) {
      affecterMediateur(selectedDossierForMediation.id, selectedMediateur, instructionsText, "Responsable Service");
      showInlineFeedback(`med-success`, `✅ Dossier ${selectedDossierForMediation.numeroDossier} affecté avec succès au médiateur ${selectedMediateur.prenom} ${selectedMediateur.nom}.`);
      setSelectedDossierForMediation(null);
      setSelectedMediateur(null);
      setInstructionsText("");
      setDateAffectation("");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto font-sans">
      <UserProfileBanner />
      {/* En-tête du Responsable Service */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-indigo-800/30">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-400/30">
              👔 Direction & Supervision
            </span>
            <span className="text-slate-400 text-xs font-mono">Matricule: MAT-RES-2006</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Espace Responsable Service
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Supervision opérationnelle, contrôle de performance et suivi des SLA pour la Direction Générale Centralisée.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => showInlineFeedback("report", "📊 Rapport mensuel généré et téléchargé en PDF.")}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-md transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter Rapport KPI
          </button>
        </div>
      </div>

      {inlineFeedback["report"] && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
          {inlineFeedback["report"]}
        </motion.div>
      )}
      
      {inlineFeedback["med-success"] && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-sm font-medium">
          {inlineFeedback["med-success"]}
        </motion.div>
      )}

      {/* Cartes KPI Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xl">
            📂
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Supervisés</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">706</p>
            <span className="text-xs text-slate-700 font-semibold">↑ +12% ce mois</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xl">
            ⚡
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Respect du SLA</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">94.8%</p>
            <span className="text-xs text-slate-600 font-medium">Objectif: 95%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
            ⏱️
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Délai Moyen</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">2.4 jours</p>
            <span className="text-xs text-slate-500 font-medium">Standard: 3.0j</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
            👥
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Effectif Agents</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">{agents.length} Agents</p>
            <span className="text-xs text-blue-600 font-medium">Tous en ligne</span>
          </div>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => handleTabChange("AGENTS")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "AGENTS"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          👥 Charge & Performance des Agents
        </button>
        <button
          onClick={() => handleTabChange("RETARDS")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "RETARDS"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          ⚠️ Alerte Goulots & Escalades ({retards.length})
        </button>
        <button
          onClick={() => handleTabChange("KPI")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "KPI"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          📊 Analytique Régionale approfondie
        </button>
        <button
          onClick={() => handleTabChange("MEDIATEUR")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "MEDIATEUR"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          ⚖️ Affectation Médiateur
        </button>
      </div>

      {/* Contenu de l'onglet 1 : Charge & Performance des Agents */}
      {activeTab === "AGENTS" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Suivi en Temps Réel des Équipes</h2>
            <span className="text-xs text-slate-500">Mise à jour en continu</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{agent.nom}</h3>
                    <p className="text-xs text-slate-500 font-medium">{agent.role} • {agent.id}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    agent.statut === "DISPONIBLE" ? "bg-slate-100 text-slate-800 border border-slate-300" :
                    agent.statut === "CHARGE" ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-200 text-slate-700"
                  }`}>
                    {agent.statut}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200/60">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">En Cours</p>
                    <p className="text-lg font-extrabold text-slate-900 font-mono">{agent.dossiersEnCours}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium font-semibold">Traités</p>
                    <p className="text-lg font-extrabold text-indigo-600 font-mono">{agent.dossiersTraitesTotal}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium font-semibold">Satisfaction</p>
                    <p className="text-lg font-extrabold text-slate-900 font-mono">{agent.tauxSatisfaction}%</p>
                  </div>
                </div>

                {inlineFeedback[agent.id] && (
                  <p className="text-xs font-semibold text-slate-800">{inlineFeedback[agent.id]}</p>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => handleRelancerAgent(agent.id, agent.nom)}
                    className="text-xs bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all"
                  >
                    🔔 Relancer l'agent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenu de l'onglet 2 : Alerte Retards */}
      {activeTab === "RETARDS" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Dossiers en Dépassement / Risque SLA</h2>
              <p className="text-xs text-slate-500">Intervenez pour réaffecter ou accélérer l'instruction.</p>
            </div>
          </div>

          {retards.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <span className="text-4xl block mb-2">🎉</span>
              <p className="font-bold text-slate-800">Aucun dossier en retard !</p>
              <p className="text-xs">Toutes les demandes respectent actuellement les délais légaux.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {retards.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm font-mono">{item.id}</span>
                      <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2 py-0.5 rounded-md border border-amber-300">
                        + {item.retardJours} jours de retard
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">{item.type} • Citoyen: <span className="font-bold">{item.citoyen}</span></p>
                    <p className="text-xs text-slate-500">Assigné actuellement à : <span className="font-semibold text-slate-800">{item.agentAssignee}</span></p>
                  </div>

                  {inlineFeedback[item.id] ? (
                    <span className="text-xs font-bold text-slate-800">{inlineFeedback[item.id]}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReassign(item.id, "Karim EL IDRISSI")}
                        className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all"
                      >
                        Réaffecter d'urgence
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenu de l'onglet 3 : Vue Analytique */}
      {activeTab === "KPI" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Analyse Comparative & Performance Régionale</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Taux de Satisfaction Citoyenne par Canal</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Guichet Numérique Tawsa Web</span>
                    <span className="font-mono">97.4%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "97.4%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Assistance par Chatbot IA & Mobile</span>
                    <span className="font-mono">94.1%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-slate-900 h-2 rounded-full" style={{ width: "94.1%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Accueil Physique & Guichet Régional</span>
                    <span>89.2%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "89.2%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Répartition Administrative par Type de Demande</h3>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Demandes de Régularisation Foncière</span>
                  <span className="font-bold text-slate-900">42%</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Agréments Commercial & Industriel</span>
                  <span className="font-bold text-slate-900">31%</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Attestations de Conformité & Certificats</span>
                  <span className="font-bold text-slate-900">18%</span>
                </li>
                <li className="flex justify-between py-1">
                  <span>Réclamations & Litiges Administratifs</span>
                  <span className="font-bold text-slate-900">9%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Contenu de l'onglet 4 : Médiateur */}
      {activeTab === "MEDIATEUR" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Dossiers Rejetés - Nécessitant Médiation</h2>
              <p className="text-xs text-slate-500">Sélectionnez un dossier pour affecter un médiateur.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {dossiersRejetes.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <span className="text-4xl block mb-2">✨</span>
                <p className="font-bold text-slate-800">Aucun dossier rejeté en attente de médiation.</p>
              </div>
            ) : (
              dossiersRejetes.map(dossier => (
                <div 
                  key={dossier.id} 
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedDossierForMediation?.id === dossier.id ? 'border-indigo-600 bg-indigo-50/30 shadow-md ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm bg-slate-50/50'}`} 
                  onClick={() => setSelectedDossierForMediation(dossier)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold font-mono text-slate-900 text-sm">{dossier.numeroDossier}</span>
                    <span className="text-xs font-semibold text-slate-500">{dossier.dateCreation}</span>
                  </div>
                  <p className="text-sm text-slate-700">Citoyen : <span className="font-bold text-slate-900">{dossier.citoyenNom}</span></p>
                  <p className="text-sm text-slate-700">Type de demande : <span className="font-semibold text-slate-800">{dossier.typeDemande}</span></p>
                  <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-xs font-bold text-red-800 mb-1">Motif de rejet :</p>
                    <p className="text-xs text-red-700">{dossier.remarqueAgent}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedDossierForMediation && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6 border-t border-slate-200 pt-6">
              <h3 className="text-md font-bold text-slate-900">Affectation du dossier {selectedDossierForMediation.numeroDossier}</h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date d'affectation souhaitée</label>
                <input 
                  type="date" 
                  className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-auto outline-none transition-all" 
                  value={dateAffectation} 
                  onChange={(e) => setDateAffectation(e.target.value)} 
                />
              </div>

              {mediateursDisponibles.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Médiateurs Disponibles</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mediateursDisponibles.map((med, idx) => (
                      <div key={med.matricule} className={`p-4 rounded-2xl border ${selectedMediateur?.matricule === med.matricule ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-1 ring-indigo-500' : 'border-slate-200 bg-white hover:border-indigo-300'} flex flex-col gap-3 transition-all`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-900 block">{med.nom} {med.prenom} {idx === 0 && <span className="text-amber-500 text-lg ml-1" title="Recommandé">★</span>}</span>
                            <span className="text-xs text-slate-500 font-medium">{med.role}</span>
                          </div>
                          <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-1 rounded-md border border-slate-200 flex flex-col items-center">
                            <span className="text-lg text-slate-900">{med.dossiersEnCours}</span>
                            dossiers
                          </span>
                        </div>
                        <button 
                          onClick={() => setSelectedMediateur(med)} 
                          className={`mt-1 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${selectedMediateur?.matricule === med.matricule ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          {selectedMediateur?.matricule === med.matricule ? '✅ Sélectionné' : 'Sélectionner'}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {selectedMediateur && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Instructions pour le médiateur</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none" 
                      rows={4} 
                      placeholder="Détaillez les points à investiguer par le médiateur, les documents à vérifier, ou les axes de médiation..." 
                      value={instructionsText} 
                      onChange={(e) => setInstructionsText(e.target.value)}
                    ></textarea>
                  </div>
                  <button 
                    onClick={handleAffecterMediateur} 
                    disabled={!instructionsText.trim()} 
                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 w-full md:w-auto shadow-md transition-all"
                  >
                    📤 Affecter & Transmettre Instructions
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
