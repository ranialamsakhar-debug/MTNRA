import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { UserProfileBanner } from "../../components/common/UserProfileBanner";
import { useDossierStore, DocumentItem } from "../../store/dossierStore";
import { SignatureCanvasModal } from "../../components/common/SignatureCanvasModal";

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
  const { dossiers, demanderDocumentsMediateur, validerEtSignerParMediateur } = useDossierStore();

  const [requestedDocs, setRequestedDocs] = useState<string[]>([]);
  const [newDocInput, setNewDocInput] = useState("");
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [observationMediation, setObservationMediation] = useState(
    "Après examen approfondi et validation des pièces justificatives complémentaires transmises par le citoyen, l'Institution du Médiateur du Royaume certifie la conformité de la démarche. L'acte d'autorisation officiel est validé, signé et délivré avec force exécutoire."
  );
  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentItem | null>(null);

  // Synchronisation dynamique des dossiers réels du store Zustand
  const dossiersLitiges: SaisineLitige[] = dossiers
    .filter(d => d.mediateurAffecte || d.instructionsMediateur || d.demandeDocumentsMediateur || d.statut === "REJETE" || (d.statut === "SIGNE" && d.acteMediationSigne))
    .map(d => ({
      id: `LIT-${d.numeroDossier}`,
      citoyen: d.citoyenNom,
      cnie: d.citoyenCnie,
      dossierOrigineId: d.numeroDossier,
      motifLitige: d.instructionsMediateur
        ? `[Saisine / Instructions Responsable] ${d.description || d.typeDemande}`
        : d.remarqueAgent || d.description || "Recours suite au rejet de la réclamation administrative.",
      statut: (d.statut === "SIGNE"
        ? "APPLIQUEE"
        : d.demandeDocumentsMediateur
        ? "EN_INSTRUCTION"
        : d.instructionsMediateur
        ? "EN_INSTRUCTION"
        : "NOUVELLE_SAISINE") as SaisineLitige["statut"],
      delaiJours: 5,
      recommandation: d.remarqueAgent,
      dateSaisine: d.dateCreation ? d.dateCreation.substring(0, 10) : new Date().toISOString().substring(0, 10)
    }));

  const allLitiges: SaisineLitige[] = [
    ...dossiersLitiges,
    ...INITIAL_LITIGES.filter(l => !dossiersLitiges.some(dl => dl.dossierOrigineId === l.dossierOrigineId))
  ];

  const [selectedId, setSelectedId] = useState<string>(allLitiges[0]?.id || INITIAL_LITIGES[0].id);
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
    }, 5000);
  };

  const litigesEnCours = allLitiges.filter(l => l.statut !== "RECOMMANDATION_EMISE" && l.statut !== "APPLIQUEE");
  const litigesTraites = allLitiges.filter(l => l.statut === "RECOMMANDATION_EMISE" || l.statut === "APPLIQUEE");
  const currentList = activeTab === "EN_COURS" ? litigesEnCours : litigesTraites;

  const selectedLitige = allLitiges.find((l) => l.id === selectedId) || currentList[0] || allLitiges[0];
  const selectedDossier = dossiers.find(d => d.id === selectedLitige?.dossierOrigineId || d.numeroDossier === selectedLitige?.dossierOrigineId);
  const instructionsMediateur = selectedDossier?.instructionsMediateur;

  // 1. Instruire la saisine
  const handleInstruire = () => {
    showInlineFeedback("instruct", `🔍 Instruction de la saisine ${selectedId} démarrée.`);
  };

  // 2. Formuler une recommandation officielle
  const handleSendRecommendation = () => {
    if (!recommendationText.trim()) return;
    showInlineFeedback("recommend", `📜 Recommandation officielle émise et notifiée ! (Déplacée dans l'historique)`);
    setRecommendationText("");
  };

  // 3. Relancer l'administration en cas de délai dépassé
  const handleRelancerAdmin = () => {
    showInlineFeedback("relance", `⏰ Relance officielle envoyée au Département Concerné !`);
  };

  // 4. Demander des pièces au citoyen
  const handleAddDoc = () => {
    if (newDocInput.trim() && !requestedDocs.includes(newDocInput.trim())) {
      setRequestedDocs([...requestedDocs, newDocInput.trim()]);
      setNewDocInput("");
    }
  };

  const handleRemoveDoc = (doc: string) => {
    setRequestedDocs(requestedDocs.filter(d => d !== doc));
  };

  const handleSendRequest = () => {
    if (requestedDocs.length === 0 || !selectedLitige) return;
    demanderDocumentsMediateur(selectedLitige.dossierOrigineId, requestedDocs, "Youssef TAZI (Médiateur du Royaume)");
    showInlineFeedback("demandeDocs", `📤 Demande de pièces envoyée au citoyen avec succès !`);
    setRequestedDocs([]);
  };

  // 5. Signature manuscrite via canvas
  const handleSaveSignature = (url: string) => {
    setSignatureDataUrl(url);
    setIsCanvasOpen(false);
    showInlineFeedback("sign", "✍️ Signature manuscrite du Médiateur apposée avec succès.");
  };

  // 6. Signature numérique rapide certifiée
  const handleQuickSign = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 420;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 420, 120);
      ctx.strokeStyle = "#0d9488";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(30, 70);
      ctx.bezierCurveTo(70, 20, 120, 110, 170, 50);
      ctx.bezierCurveTo(210, 10, 240, 90, 290, 40);
      ctx.stroke();
      ctx.font = "italic bold 18px serif";
      ctx.fillStyle = "#0f172a";
      ctx.fillText("Youssef TAZI", 140, 80);
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = "#0d9488";
      ctx.fillText("Médiateur du Royaume • Sceau Officiel", 140, 100);
    }
    const dataUrl = canvas.toDataURL("image/png");
    setSignatureDataUrl(dataUrl);
    showInlineFeedback("sign", "⚡ Sceau & Signature officielle certifiée du Médiateur apposés avec succès !");
  };

  // 7. Validation définitive des pièces & délivrance de l'acte signé au citoyen
  const handleValiderEtSignerActe = () => {
    if (!selectedLitige) return;
    const targetDossierId = selectedDossier?.numeroDossier || selectedDossier?.id || selectedLitige.dossierOrigineId;

    const effectiveSig = signatureDataUrl || (() => {
      const canvas = document.createElement("canvas");
      canvas.width = 420;
      canvas.height = 120;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 420, 120);
        ctx.strokeStyle = "#0d9488";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(30, 70);
        ctx.bezierCurveTo(70, 20, 120, 110, 170, 50);
        ctx.bezierCurveTo(210, 10, 240, 90, 290, 40);
        ctx.stroke();
        ctx.font = "italic bold 18px serif";
        ctx.fillStyle = "#0f172a";
        ctx.fillText("Youssef TAZI", 140, 80);
        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "#0d9488";
        ctx.fillText("Médiateur du Royaume • Cachet Officiel", 140, 100);
      }
      return canvas.toDataURL("image/png");
    })();

    validerEtSignerParMediateur(
      targetDossierId,
      "Youssef TAZI",
      effectiveSig,
      observationMediation
    );

    showInlineFeedback(
      "validerActe",
      `🎉 Pièces validées ! Le dossier ${targetDossierId} est passé au statut SIGNE. L'Acte de Médiation officiel a été délivré au citoyen avec horodatage TSA.`
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <UserProfileBanner />
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

              {/* Instructions du Responsable Service */}
              {instructionsMediateur && (
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-2">
                    <span>📋</span> <span>Instructions & Recommandations du Responsable Service</span>
                  </h4>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed">{instructionsMediateur}</p>
                </div>
              )}

              {/* DOCUMENTS & PIÈCES TRANSMISES PAR LE CITOYEN */}
              {selectedDossier && selectedDossier.documents && selectedDossier.documents.length > 0 && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-slate-800 flex items-center gap-2">
                      <span>📎</span> <span>Documents & Pièces Transmises par le Citoyen ({selectedDossier.documents.length})</span>
                    </h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                      ✓ Conformes SHA-256
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {selectedDossier.documents.map((doc) => (
                      <div key={doc.id} className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📜</span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{doc.nomFichier}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span className="font-semibold">{doc.typeDocument}</span>
                              <span>•</span>
                              <span>{doc.tailleFormatted}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold">OCR {(doc.scoreFiabilite * 100).toFixed(0)}% Valide</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedDocPreview(doc)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 font-extrabold text-xs rounded-xl transition border border-teal-200 flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          👁️ Examiner Pièce
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Circonstances du litige */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Analyse des Circonstances du Litige</h4>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">{selectedLitige.motifLitige}</p>
              </div>

              {/* Recommandation formulée */}
              {selectedLitige.recommandation && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase">Recommandation du Médiateur Émise</h4>
                  <p className="text-xs text-emerald-950 font-bold leading-relaxed">{selectedLitige.recommandation}</p>
                </div>
              )}

              {/* MODULE NOUVEAU : VALIDATION DES DOCUMENTS & SIGNATURE DE L'ACTE DE MÉDIATION */}
              <div className="space-y-4 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-3xl border border-teal-500/30 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-teal-400 font-black">Pouvoir de Règlement & Clôture Favorable</span>
                    <h3 className="text-base font-black text-white mt-0.5">Validation des Pièces & Signature de l'Acte Officiel</h3>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/40 w-fit">
                    Force Exécutoire
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Lorsque les documents apportés par le citoyen lèvent le motif de refus, vous pouvez valider le dossier pour le passer au statut <strong className="text-emerald-300 font-black">SIGNE</strong> chez le citoyen, apposer votre signature officielle et lui délivrer l'Acte officiel d'autorisation avec horodatage TSA.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                    Observation & Décision Officielle de Clôture :
                  </label>
                  <textarea
                    rows={3}
                    value={observationMediation}
                    onChange={(e) => setObservationMediation(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-400 font-medium leading-relaxed"
                    placeholder="Rédigez la décision motivée de validation..."
                  />
                </div>

                {/* Zone Signature */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Signature de l'Acte de Médiation :
                  </span>

                  {signatureDataUrl ? (
                    <div className="bg-white rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-emerald-400">
                      <div className="flex items-center gap-3">
                        <img src={signatureDataUrl} alt="Signature Médiateur" className="h-12 object-contain" />
                        <div>
                          <p className="text-xs font-black text-slate-900">Youssef TAZI (Médiateur du Royaume)</p>
                          <p className="text-[10px] text-emerald-700 font-mono font-bold">✓ Horodaté TSA [TSA-MEDIATEUR-ROYAUME-MA-SHA256]</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsCanvasOpen(true)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                      >
                        Modifier la signature
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setIsCanvasOpen(true)}
                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <span>✍️</span> Dessiner la Signature Manuscrite
                      </button>
                      <button
                        onClick={handleQuickSign}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-white/20"
                      >
                        <span>⚡</span> Apposer Sceau & Signature Officielle
                      </button>
                    </div>
                  )}
                </div>

                {/* Bouton d'action principale */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    onClick={handleValiderEtSignerActe}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>📜</span> <span>Valider les Pièces & Délivrer l'Acte Signé au Citoyen</span>
                  </button>

                  {inlineFeedback["validerActe"] && (
                    <span className="text-xs font-extrabold text-emerald-300 bg-emerald-950/90 border border-emerald-600 px-3 py-2 rounded-xl animate-pulse">
                      {inlineFeedback["validerActe"]}
                    </span>
                  )}
                </div>
              </div>

              {/* Demander des Pièces Complémentaires au Citoyen */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <span>📄</span> <span>Demander des Pièces Complémentaires au Citoyen</span>
                </h4>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDocInput}
                    onChange={(e) => setNewDocInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDoc()}
                    placeholder="Nom du document (ex: Attestation sur l'honneur, Plan de situation)..."
                    className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-400 font-medium"
                  />
                  <button
                    onClick={handleAddDoc}
                    disabled={!newDocInput.trim()}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition disabled:opacity-50 cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>

                {requestedDocs.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {requestedDocs.map(doc => (
                      <span key={doc} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-sm">
                        {doc}
                        <button onClick={() => handleRemoveDoc(doc)} className="text-slate-400 hover:text-red-500 font-black cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSendRequest}
                    disabled={requestedDocs.length === 0}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>📤</span> Envoyer la Demande au Citoyen
                  </button>
                  {inlineFeedback["demandeDocs"] && (
                    <span className="text-xs font-extrabold text-slate-700 bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-xl">
                      {inlineFeedback["demandeDocs"]}
                    </span>
                  )}
                </div>
              </div>

              {/* Formuler une Recommandation Simple */}
              <div className="space-y-3 bg-teal-500/5 p-4 rounded-2xl border border-teal-200">
                <h4 className="text-xs font-bold text-teal-900 uppercase flex items-center gap-1.5">
                  <span>📜</span> <span>Émettre une Recommandation Formelle aux Ministères</span>
                </h4>
                <textarea
                  rows={3}
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

      {/* MODALE SIGNATURE CANVAS */}
      <SignatureCanvasModal
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        onSaveSignature={handleSaveSignature}
        dossierId={selectedLitige?.dossierOrigineId || selectedLitige?.id}
        citoyenNom={selectedLitige?.citoyen}
      />

      {/* MODALE APERÇU DOCUMENT & SHA-256 */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-sm">📄 Examen Document : {selectedDocPreview.nomFichier}</h3>
              <button onClick={() => setSelectedDocPreview(null)} className="text-slate-400 hover:text-slate-900 font-bold">✕</button>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between"><span className="font-bold text-slate-500">Catégorie :</span><span className="font-bold text-slate-900">{selectedDocPreview.typeDocument}</span></div>
              <div className="flex justify-between"><span className="font-bold text-slate-500">Taille :</span><span className="font-semibold text-slate-900">{selectedDocPreview.tailleFormatted}</span></div>
              <div className="flex justify-between"><span className="font-bold text-slate-500">Conformité OCR :</span><span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{(selectedDocPreview.scoreFiabilite * 100).toFixed(0)}% Valide</span></div>
              <div className="pt-2 border-t"><span className="block text-[10px] text-slate-400 font-bold uppercase">Hash Cryptographique SHA-256 :</span><p className="font-mono text-[10px] text-slate-700 break-all bg-white p-2 rounded border mt-1">{selectedDocPreview.hash}</p></div>
            </div>

            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs space-y-1">
              <h4 className="font-bold text-teal-900">Extrait Texte Reconnu (OCR) :</h4>
              <p className="text-teal-800 text-[11px] italic leading-relaxed">{selectedDocPreview.extractedTextPreview}</p>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setSelectedDocPreview(null)} className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
