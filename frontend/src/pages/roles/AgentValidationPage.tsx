import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useDossierStore, DocumentItem, DossierItem } from "../../store/dossierStore";

export function AgentValidationPage() {
  const { dossiers: storeDossiers } = useDossierStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [dossiersList, setDossiersList] = useState<DossierItem[]>(storeDossiers);
  const [selectedId, setSelectedId] = useState<string>(storeDossiers[0]?.id || "DOS-2026-89421");
  const [activeTab, setActiveTab] = useState<"EN_COURS" | "TRAITES">("EN_COURS");
  const [showPrecedents, setShowPrecedents] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "TRAITES") {
      setActiveTab("TRAITES");
      setShowPrecedents(false);
    } else if (tab === "JURISPRUDENCE") {
      setShowPrecedents(true);
    } else if (tab === "EN_COURS") {
      setActiveTab("EN_COURS");
      setShowPrecedents(false);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "EN_COURS" | "TRAITES") => {
    setActiveTab(tab);
    setShowPrecedents(false);
    setSearchParams({ tab });
  };

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentItem | null>(null);
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

  const dossiersEnCours = dossiersList.filter(d => d.statut === "SOUMIS" || d.statut === "EN_COURS");
  const dossiersTraites = dossiersList.filter(d => d.statut !== "SOUMIS" && d.statut !== "EN_COURS");
  const currentList = activeTab === "EN_COURS" ? dossiersEnCours : dossiersTraites;

  const selectedDossier: DossierItem = dossiersList.find((d) => d.id === selectedId || d.numeroDossier === selectedId) || currentList[0] || dossiersList[0];

  const handleValidate = () => {
    setDossiersList((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, statut: "VALIDE" } : d))
    );
    showInlineFeedback("validate", `✅ Validé avec succès ! Transmis à la Certification.`);
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) return;
    setDossiersList((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, statut: "REJETE" } : d))
    );
    showInlineFeedback("reject", `❌ Dossier rejeté. Motif notifié au citoyen.`);
    setShowRejectModal(false);
    setRejectReason("");
  };

  const handleReportFraud = () => {
    setDossiersList((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, statut: "SUSPECT_FRAUDE" } : d))
    );
    showInlineFeedback("fraud", `🚨 Signalement d'anomalie transmis à l'Inspection.`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl text-2xl font-black">
            🔍
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Espace Agent de Validation & Conformité</h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Matricule: MAT-VAL-2002 • Examen de Conformité Réglementaire et Pièces Transmises
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPrecedents(!showPrecedents)}
          className="px-4 py-2 bg-slate-900 text-white font-extrabold text-xs rounded-xl hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
        >
          <span>📜</span> <span>Jurisprudence & Décisions Similaires</span>
        </button>
      </div>

      {/* Jurisprudence Dropdown */}
      {showPrecedents && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-slate-900 text-white rounded-3xl space-y-3">
          <h3 className="font-extrabold text-sm text-emerald-400">📜 Décisions Similaires (Base de Jurisprudence Admin)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <span className="text-emerald-400 font-bold">CASE-2025-998 : Accordé</span>
              <p className="text-slate-300 mt-1">Conformité validée pour écart mineur d'adresse CNI vs Bail commercial suite à attestation de domiciliation.</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <span className="text-red-400 font-bold">CASE-2025-412 : Rejeté</span>
              <p className="text-slate-300 mt-1">Quittance fiscale périmée non acceptée. Motif réglementaire Loi 55.19 Article 8.</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Colonne Gauche: Onglets & Liste (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
              <button
                onClick={() => handleTabChange("EN_COURS")}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "EN_COURS" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>🔍 À Examiner</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">{dossiersEnCours.length}</span>
              </button>
              <button
                onClick={() => handleTabChange("TRAITES")}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "TRAITES" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>✅ Historique Traités</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">{dossiersTraites.length}</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {currentList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl">
                  Aucun dossier dans cet onglet
                </div>
              ) : (
                currentList.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-2 ${
                      d.id === selectedDossier?.id
                        ? "bg-emerald-500/10 border-emerald-500 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900">{d.numeroDossier}</span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#f7f3eb] text-slate-900 border border-[#e3d8c4]">
                        {d.statut.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{d.typeDemande}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>👤 {d.citoyenNom}</span>
                      <span className="font-black text-slate-700">📎 {d.documents.length} doc(s)</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Colonne Droite: Examen approfondi & Documents (8 cols) */}
        {selectedDossier && (
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Examen de Conformité • <strong className="text-slate-900 bg-[#f7f3eb] px-2 py-0.5 rounded border border-[#e3d8c4]">{selectedDossier.statut}</strong>
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">{selectedDossier.numeroDossier}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Demandeur : <strong>{selectedDossier.citoyenNom}</strong> ({selectedDossier.citoyenCnie})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-500">Conformité IA :</span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#f7f3eb] text-slate-900 border border-[#e3d8c4]">
                    98% Conforme
                  </span>
                </div>
              </div>

              {/* LISTE COMPLÈTE DES DOCUMENTS JOINTS POUR VALIDATION */}
              <div className="space-y-3 bg-[#fdfbf7] p-4 rounded-2xl border border-[#e5dac6]">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase flex items-center justify-between">
                  <span>📎 Documents Transmis par le Citoyen ({selectedDossier.documents.length})</span>
                  <span className="text-[10px] text-slate-900 bg-[#f2e8d5] px-2.5 py-0.5 rounded-full font-bold border border-[#dcd0b8]">✓ Contrôle OCR Réussi</span>
                </h4>

                <div className="grid grid-cols-1 gap-2.5">
                  {selectedDossier.documents.map((doc) => (
                    <div key={doc.id} className="p-3.5 bg-white border border-slate-200 hover:border-[#dcd0b8] rounded-xl flex items-center justify-between gap-3 shadow-sm transition">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📜</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{doc.nomFichier}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-semibold">{doc.typeDocument}</span>
                            <span>•</span>
                            <span>{doc.tailleFormatted}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedDocPreview(doc)}
                        className="px-3.5 py-1.5 bg-[#f5efe6] hover:bg-[#e8decb] text-slate-900 font-extrabold text-xs rounded-xl transition border border-[#d8c8b0] flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
                      >
                        👁️ Aperçu & Consulter
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Boutons d'Action avec feedback inline immédiat */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={handleValidate}
                    className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>✅</span> <span>Valider Dossier</span>
                  </button>

                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>❌</span> <span>Rejeter avec Motif</span>
                  </button>

                  <button
                    onClick={handleReportFraud}
                    className="py-3 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <span>🚨</span> <span>Signaler Anomalie</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {inlineFeedback["validate"] && (
                    <span className="text-xs font-extrabold text-slate-900 bg-[#f7f3eb] border border-[#e3d8c4] px-3 py-1.5 rounded-xl">
                      {inlineFeedback["validate"]}
                    </span>
                  )}
                  {inlineFeedback["reject"] && (
                    <span className="text-xs font-extrabold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                      {inlineFeedback["reject"]}
                    </span>
                  )}
                  {inlineFeedback["fraud"] && (
                    <span className="text-xs font-extrabold text-slate-900 bg-[#f7f3eb] border border-[#e3d8c4] px-3 py-1.5 rounded-xl">
                      {inlineFeedback["fraud"]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Aperçu Document */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-sm">📄 Document : {selectedDocPreview.nomFichier}</h3>
              <button onClick={() => setSelectedDocPreview(null)} className="text-slate-400 hover:text-slate-900 font-bold">✕</button>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between"><span className="font-bold text-slate-500">Catégorie :</span><span className="font-bold text-slate-900">{selectedDocPreview.typeDocument}</span></div>
              <div className="flex justify-between"><span className="font-bold text-slate-500">Score OCR :</span><span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{(selectedDocPreview.scoreFiabilite * 100).toFixed(0)}% Valide</span></div>
              <div className="pt-2 border-t"><span className="block text-[10px] text-slate-400 font-bold uppercase">Hash SHA-256 :</span><p className="font-mono text-[10px] text-slate-700 break-all bg-white p-2 rounded border mt-1">{selectedDocPreview.hash}</p></div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
              <h4 className="font-bold text-amber-900">Extrait Texte OCR :</h4>
              <p className="text-amber-800 text-[11px] italic">{selectedDocPreview.extractedTextPreview}</p>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setSelectedDocPreview(null)} className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejet */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-black text-slate-900 text-base">Rejet Réglementaire du Dossier</h3>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Veuillez indiquer le motif juridique du rejet..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600">Annuler</button>
              <button onClick={handleRejectSubmit} disabled={!rejectReason.trim()} className="px-5 py-2 bg-red-600 text-white font-bold text-xs rounded-xl disabled:opacity-50">Confirmer Rejet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
