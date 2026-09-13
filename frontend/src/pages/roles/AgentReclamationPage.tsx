import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { useDossierStore, DocumentItem, DossierItem } from "../../store/dossierStore";
import { HistoriqueGlobalDemandesModal } from "../../components/common/HistoriqueGlobalDemandesModal";
import { UserProfileBanner } from "../../components/common/UserProfileBanner";

export function AgentReclamationPage() {
  const { dossiers: storeDossiers, requestAdditionalDocuments, updateDossierDecision } = useDossierStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedId, setSelectedId] = useState<string>(storeDossiers[0]?.id || "DOS-2026-89421");
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

  const [qualification, setQualification] = useState("");
  const [targetAgent, setTargetAgent] = useState("Agent Validation (Karim El Idrissi)");
  const [responseText, setResponseText] = useState("");
  const [docModal, setDocModal] = useState<DocumentItem | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

  const dossiersEnCours = storeDossiers.filter(d => d.statut === "SOUMIS" || d.statut === "EN_COURS" || d.statut === "EN_ATTENTE_PIECE");
  const dossiersTraites = storeDossiers.filter(d => d.statut !== "SOUMIS" && d.statut !== "EN_COURS" && d.statut !== "EN_ATTENTE_PIECE");
  const currentList = activeTab === "EN_COURS" ? dossiersEnCours : dossiersTraites;

  const selectedDossier: DossierItem = storeDossiers.find((d) => d.id === selectedId || d.numeroDossier === selectedId) || currentList[0] || storeDossiers[0];

  const handleQualifier = () => {
    updateDossierDecision(selectedDossier.id, "EN_COURS", `Qualification enregistrée : ${qualification || selectedDossier.typeDemande}`, "Ahmed Benali", "Agent Réclamation");
    showInlineFeedback("qualifier", `✅ Qualification enregistrée : « ${qualification || selectedDossier.typeDemande} »`);
  };

  const handleTransmettre = () => {
    updateDossierDecision(selectedDossier.id, "EN_COURS", `Transmis à l'agent ${targetAgent}`, "Ahmed Benali", "Agent Réclamation");
    showInlineFeedback("transmettre", `➡️ Transmis à ${targetAgent}`);
  };

  const handleSendResponse = () => {
    if (!responseText.trim()) return;
    updateDossierDecision(selectedDossier.id, selectedDossier.statut, responseText.trim(), "Ahmed Benali", "Agent Réclamation");
    showInlineFeedback("reponse", `✉️ Commentaire/réponse transmis au citoyen (${selectedDossier.citoyenNom}) !`);
    setResponseText("");
  };

  const handleDemanderPiece = () => {
    if (!responseText.trim()) return;
    requestAdditionalDocuments(selectedDossier.id, responseText.trim(), "Ahmed Benali (Agent Réclamation)");
    showInlineFeedback("reponse", `🚨 Demande de pièce urgente activée et notifiée au citoyen !`);
    setResponseText("");
  };

  const handleEscalader = () => {
    updateDossierDecision(selectedDossier.id, "EN_COURS", "Réclamation escaladée au Responsable de Service pour arbitrage.", "Ahmed Benali", "Agent Réclamation");
    showInlineFeedback("escalader", `🚨 Réclamation escaladée au Responsable de Service.`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6 lg:px-8">
      <UserProfileBanner />
      {/* Banner Titre & Role Agent */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              Agent Réclamation & Orientation (Niveau 1)
            </span>
            <span className="text-xs text-slate-400">• Tifawin X.0 Workflow</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            📥 Réception, Qualification & Pièces Jointes Citoyen
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Consultez les documents scannés par le citoyen, qualifiez les demandes et réorientez vers la validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow flex items-center gap-1.5"
          >
            <span>🏛️</span> <span>Historique des Demandes</span>
          </button>
          <Link
            to="/agent-validation"
            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 transition shadow"
          >
            ➡️ Espace Agent Validation
          </Link>
        </div>
      </motion.div>

      {/* Onglets + Layout 2 Colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche: Liste des réclamations (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-xl border border-white/40 space-y-3">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
              <button
                onClick={() => handleTabChange("EN_COURS")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "EN_COURS" ? "bg-white text-amber-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>📥 À Qualifier</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px]">{dossiersEnCours.length}</span>
              </button>
              <button
                onClick={() => handleTabChange("TRAITES")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "TRAITES" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>✅ Traités & Transmis</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px]">{dossiersTraites.length}</span>
              </button>
            </div>

            {/* Cartes Réclamations */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {currentList.map((d) => {
                const isSelected = d.id === selectedDossier.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/40 shadow-md"
                        : "border-slate-100 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-800">{d.numeroDossier}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        📎 {d.documents.length} doc(s)
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs truncate">{d.typeDemande}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Citoyen : {d.citoyenNom} ({d.citoyenCnie})</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>{d.dateCreation}</span>
                      <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-[#f7f3eb] text-slate-900 border border-[#e3d8c4]">
                        {d.statut}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Colonne Droite: Fiche de traitement du dossier (8 cols) */}
        {selectedDossier && (
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40 space-y-6">
              {/* Entête Fiche Dossier */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-amber-800">{selectedDossier.numeroDossier}</span>
                    <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-[#f7f3eb] text-slate-900 border border-[#e3d8c4] shadow-sm">
                      {selectedDossier.statut}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{selectedDossier.typeDemande}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Citoyen Déclarant : <strong className="text-slate-800 font-bold">{selectedDossier.citoyenNom}</strong> (CNIE: {selectedDossier.citoyenCnie})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEscalader}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🚨 Escalader</span>
                  </button>
                </div>
              </div>

              {/* Description détaillée */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Objet & Motif de la réclamation</h4>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">{selectedDossier.description}</p>
              </div>

              {/* LISTE COMPLÈTE ET TRANSPARENTE DES DOCUMENTS TRANSMIS PAR LE CITOYEN */}
              <div className="space-y-3 bg-[#fdfbf7] p-4 rounded-2xl border border-[#e5dac6]">
                <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>📎 Documents joints transmis par le citoyen</span>
                    <span className="text-[10px] bg-[#f2e8d5] text-slate-900 px-2.5 py-0.5 rounded-full font-extrabold border border-[#dcd0b8]">
                      {selectedDossier.documents.length} pièces reçues
                    </span>
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    ✓ Empreintes SHA-256 Validées
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedDossier.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-white hover:bg-[#fcf9f2] border border-slate-200 hover:border-[#dcd0b8] rounded-xl transition flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl">📄</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{doc.nomFichier}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-semibold">{doc.typeDocument}</span>
                            <span>•</span>
                            <span>{doc.tailleFormatted}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setDocModal(doc)}
                        className="px-3.5 py-1.5 bg-[#f5efe6] hover:bg-[#e8decb] text-slate-900 font-extrabold text-xs rounded-xl transition border border-[#d8c8b0] flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
                      >
                        <span>👁️ Aperçu</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Actions : 1. Qualification & Reclassification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <span>🏷️</span> <span>1. Qualifier le Type de Dossier</span>
                  </h4>
                  <select
                    value={qualification || selectedDossier.typeDemande}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-bold outline-none"
                  >
                    <option value="Réclamation Administrative Générale">Réclamation Administrative Générale</option>
                    <option value="Immatriculation & Dépôt de Fonds de Commerce">Immatriculation & Dépôt de Fonds de Commerce</option>
                    <option value="Délivrance de Certificat Administratif Spécial">Délivrance de Certificat Spécial</option>
                    <option value="Attestation Fiscale & Quittance">Attestation Fiscale</option>
                  </select>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleQualifier}
                      className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition shadow cursor-pointer"
                    >
                      Enregistrer Qualification
                    </button>
                    {inlineFeedback["qualifier"] && (
                      <span className="text-xs font-extrabold text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl animate-pulse">
                        {inlineFeedback["qualifier"]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions : 2. Transmettre à l'agent compétent */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <span>➡️</span> <span>2. Transmettre à l'Agent Compétent</span>
                  </h4>
                  <select
                    value={targetAgent}
                    onChange={(e) => setTargetAgent(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-bold outline-none"
                  >
                    <option value="Agent Validation (Karim El Idrissi)">Agent Validation (Karim El Idrissi)</option>
                    <option value="Agent Certification (Fatima Zahra)">Agent Certification (Fatima Zahra)</option>
                    <option value="Service Urbanisme - Direction Régionale">Service Urbanisme</option>
                    <option value="Service Juridique & Contentieux">Service Juridique</option>
                  </select>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTransmettre}
                      className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition shadow cursor-pointer"
                    >
                      Transmettre le Dossier
                    </button>
                    {inlineFeedback["transmettre"] && (
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl animate-pulse">
                        {inlineFeedback["transmettre"]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions : 3. Rédiger réponse au citoyen */}
              <div className="space-y-3 bg-amber-500/5 p-4 rounded-2xl border border-amber-200">
                <h4 className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1.5">
                  <span>✍️</span> <span>3. Rédiger une Réponse / Accusé au Citoyen</span>
                </h4>
                <textarea
                  rows={3}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Saisissez la réponse ou les compléments d'information requis pour le citoyen..."
                  className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />
                <div className="flex items-center justify-between">
                  {inlineFeedback["reponse"] ? (
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl">
                      {inlineFeedback["reponse"]}
                    </span>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDemanderPiece}
                      disabled={!responseText.trim()}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50 flex items-center gap-1 border border-amber-600"
                      title="Activer l'option d'ajout de pièce urgente pour le citoyen sur ce dossier"
                    >
                      <span>⚡</span> <span>Demander Pièce Urgente</span>
                    </button>
                    <button
                      onClick={handleSendResponse}
                      disabled={!responseText.trim()}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                    >
                      Envoyer Réponse au Citoyen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PRÉVISUALISATION DÉTAILLÉE DU DOCUMENT POUR L'AGENT */}
      {docModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <span>📄 Aperçu Document Agent :</span>
                <span className="text-amber-800 font-mono">{docModal.nomFichier}</span>
              </h3>
              <button onClick={() => setDocModal(null)} className="text-slate-400 hover:text-slate-900 font-bold text-base">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* APERÇU VISUEL RÉEL DU DOCUMENT OU PHOTO */}
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">📷 Image / Photo transmise par le citoyen</span>
                {docModal.dataUrl && (docModal.dataUrl.startsWith("data:image/") || docModal.dataUrl.startsWith("blob:")) ? (
                  <img
                    src={docModal.dataUrl}
                    alt={docModal.nomFichier}
                    className="max-h-64 object-contain mx-auto rounded-xl border border-slate-700 shadow-md bg-black/40 p-1"
                  />
                ) : docModal.dataUrl && docModal.dataUrl.startsWith("data:application/pdf") ? (
                  <iframe
                    src={docModal.dataUrl}
                    title="Document PDF"
                    className="w-full h-64 rounded-xl border border-slate-700 bg-white"
                  />
                ) : (
                  <div className="h-44 bg-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-300 p-4 space-y-2">
                    <span className="text-4xl">📜</span>
                    <p className="text-xs font-bold text-white">{docModal.nomFichier}</p>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-mono border border-emerald-500/40">Fichier Authentifié par Empreinte</span>
                  </div>
                )}
              </div>

              {/* CODE SHA-256 SÉCURISÉ */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔑</span> <span>Code Cryptographique SHA-256 Officiel :</span>
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">✓ ISO 27001 CONFORME</span>
                </div>
                <div className="p-3 bg-black/60 rounded-xl border border-emerald-500/30 font-mono text-xs text-emerald-300 break-all font-bold tracking-wider select-all">
                  {docModal.hash}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Type de Document :</span>
                  <span className="font-bold text-slate-900">{docModal.typeDocument}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Taille :</span>
                  <span className="font-semibold text-slate-800">{docModal.tailleFormatted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Score de fiabilité OCR :</span>
                  <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {(docModal.scoreFiabilite * 100).toFixed(0)}% AUTHENTIFIÉ
                  </span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
                <h4 className="font-bold text-amber-900 uppercase text-[10px]">Extrait OCR Texte :</h4>
                <p className="text-amber-900 text-[11px] leading-relaxed italic">{docModal.extractedTextPreview}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDocModal(null)}
                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de l'historique global des demandes */}
      <HistoriqueGlobalDemandesModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
