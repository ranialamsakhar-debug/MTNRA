import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";

interface SaisineLitige {
  id: string;
  citoyen: string;
  cnie: string;
  dossierOrigineId: string;
  motifLitige: string;
  statut: "NOUVELLE_SAISINE" | "EN_INSTRUCTION" | "RECOMMANDATION_EMISE" | "APPLIQUEE" | "DELAI_DEPASSE";
  delaiJours: number;
  recommandation?: string;
  dateSaisine: string;
}

const INITIAL_LITIGES: SaisineLitige[] = [
  {
    id: "LIT-2026-0012",
    citoyen: "Youssef Tazi",
    cnie: "IJ11223",
    dossierOrigineId: "REC-2026-0891",
    motifLitige: "Contestation du rejet abusif par l'administration du permis de régularisation commerciale.",
    statut: "NOUVELLE_SAISINE",
    delaiJours: 14,
    dateSaisine: "2026-08-25"
  },
  {
    id: "LIT-2026-0008",
    citoyen: "Amina Chraibi",
    cnie: "MN77889",
    dossierOrigineId: "REC-2026-0720",
    motifLitige: "Retard injustifié de plus de 60 jours sans réponse de la Direction des Titres.",
    statut: "DELAI_DEPASSE",
    delaiJours: 62,
    dateSaisine: "2026-06-30"
  }
];

export function MediateurPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [litiges, setLitiges] = useState<SaisineLitige[]>(INITIAL_LITIGES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_LITIGES[0].id);
  const [activeTab, setActiveTab] = useState<"EN_COURS" | "TRAITES">("EN_COURS");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "TRAITES") setActiveTab("TRAITES");
    else if (tab === "EN_COURS") setActiveTab("EN_COURS");
  }, [searchParams]);

  const handleTabChange = (tab: "EN_COURS" | "TRAITES") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [recommendationText, setRecommendationText] = useState("");
  const [showStats, setShowStats] = useState(false);
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

  const litigesEnCours = litiges.filter(l => l.statut !== "RECOMMANDATION_EMISE" && l.statut !== "APPLIQUEE");
  const litigesTraites = litiges.filter(l => l.statut === "RECOMMANDATION_EMISE" || l.statut === "APPLIQUEE");
  const currentList = activeTab === "EN_COURS" ? litigesEnCours : litigesTraites;

  const selectedLitige = litiges.find((l) => l.id === selectedId) || currentList[0] || litiges[0];

  // 1. Instruire la saisine
  const handleInstruire = () => {
    setLitiges((prev) =>
      prev.map((l) => (l.id === selectedId ? { ...l, statut: "EN_INSTRUCTION" } : l))
    );
    showInlineFeedback("instruct", `🔍 Instruction de la saisine ${selectedId} démarrée.`);
  };

  // 2. Formuler une recommandation officielle
  const handleSendRecommendation = () => {
    if (!recommendationText.trim()) return;
    setLitiges((prev) =>
      prev.map((l) =>
        l.id === selectedId
          ? { ...l, statut: "RECOMMANDATION_EMISE", recommandation: recommendationText }
          : l
      )
    );
    showInlineFeedback("recommend", `📜 Recommandation officielle émise et notifiée ! (Déplacée dans l'historique)`);
    setRecommendationText("");
  };

  // 3. Relancer l'administration en cas de délai dépassé
  const handleRelancerAdmin = () => {
    showInlineFeedback("relance", `⏰ Relance officielle envoyée au Département Concerné !`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header Médiateur */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-teal-500/10 text-teal-600 rounded-2xl text-2xl font-black">
            ⚖️
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Espace Médiation Institutionnelle</h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Médiateur National • Traitement Amiable des Litiges Administratifs
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowStats(!showStats)}
          className="px-4 py-2 bg-slate-900 text-white font-extrabold text-xs rounded-xl hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
        >
          <span>📊</span> <span>Rapport Statistique Litiges</span>
        </button>
      </div>

      {/* Stats Modal / Panel */}
      {showStats && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-slate-900 text-white rounded-3xl space-y-4">
          <h3 className="font-extrabold text-sm text-teal-400">📊 Rapport Statistique National des Litiges (S1 2026)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <span className="text-3xl font-black text-teal-400">89.2%</span>
              <p className="text-xs font-bold text-slate-300 uppercase mt-1">Taux de Résolution Amiable</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <span className="text-3xl font-black text-amber-400">12 Jours</span>
              <p className="text-xs font-bold text-slate-300 uppercase mt-1">Délai Moyen de Recommandation</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <span className="text-3xl font-black text-emerald-400">94.5%</span>
              <p className="text-xs font-bold text-slate-300 uppercase mt-1">Suivi par l'Administration</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Liste des saisines (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            {/* Onglets En cours vs Historique Traités */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
              <button
                onClick={() => handleTabChange("EN_COURS")}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "EN_COURS" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>⚖️ En Médiation</span>
                <span className="px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px]">{litigesEnCours.length}</span>
              </button>
              <button
                onClick={() => handleTabChange("TRAITES")}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "TRAITES" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>✅ Traités & Clôturés</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">{litigesTraites.length}</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {currentList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl">
                  Aucune saisine dans cet onglet
                </div>
              ) : (
                currentList.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => setSelectedId(l.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-2 ${
                      l.id === selectedLitige?.id
                        ? "bg-teal-500/10 border-teal-500 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900">{l.id}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          l.statut === "DELAI_DEPASSE"
                            ? "bg-red-100 text-red-800"
                            : l.statut === "RECOMMANDATION_EMISE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {l.statut.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{l.motifLitige}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>👤 {l.citoyen}</span>
                      <span className="font-bold text-amber-600">⏱️ {l.delaiJours} jours</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Détail de la saisine & Recommandation (8 cols) */}
        {selectedLitige && (
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                    Instruction du Litige Administrative • {selectedLitige.statut}
                  </span>
                  <h2 className="text-xl font-black text-slate-900">{selectedLitige.id}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Saisissant : <strong>{selectedLitige.citoyen}</strong> ({selectedLitige.cnie}) • Dossier source : {selectedLitige.dossierOrigineId}
                  </p>
                </div>

                {selectedLitige.delaiJours > 30 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRelancerAdmin}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                    >
                      <span>⏰</span> <span>Relancer Administration</span>
                    </button>
                    {inlineFeedback["relance"] && (
                      <span className="text-xs font-extrabold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-xl">
                        {inlineFeedback["relance"]}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Circonstances du litige */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Analyse des Circonstances du Litige</h4>
                <p className="text-sm text-slate-800 font-medium leading-relaxed">{selectedLitige.motifLitige}</p>
              </div>

              {/* Recommandation formulée */}
              {selectedLitige.recommandation && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase">Recommandation du Médiateur Émise</h4>
                  <p className="text-sm text-emerald-950 font-bold">{selectedLitige.recommandation}</p>
                </div>
              )}

              {/* Formuler une Recommandation */}
              <div className="space-y-3 bg-teal-500/5 p-4 rounded-2xl border border-teal-200">
                <h4 className="text-xs font-bold text-teal-900 uppercase flex items-center gap-1.5">
                  <span>📜</span> <span>Formuler une Recommandation Formelle</span>
                </h4>
                <textarea
                  rows={4}
                  value={recommendationText}
                  onChange={(e) => setRecommendationText(e.target.value)}
                  placeholder="Rédigez la recommandation destinée au ministère et au citoyen..."
                  className="w-full p-3 bg-white border border-teal-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-400 font-medium"
                />
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleInstruire}
                      className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
                    >
                      Démarrer l'Instruction
                    </button>
                    {inlineFeedback["instruct"] && (
                      <span className="text-xs font-extrabold text-teal-700 bg-teal-100 border border-teal-300 px-3 py-1.5 rounded-xl">
                        {inlineFeedback["instruct"]}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {inlineFeedback["recommend"] && (
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl animate-pulse">
                        {inlineFeedback["recommend"]}
                      </span>
                    )}
                    <button
                      onClick={handleSendRecommendation}
                      disabled={!recommendationText.trim()}
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow cursor-pointer disabled:opacity-50"
                    >
                      Émettre Recommandation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
