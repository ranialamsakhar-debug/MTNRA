import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SignatureCanvasModal } from "../../components/common/SignatureCanvasModal";
import { OfficialPermissionSheet } from "../../components/common/OfficialPermissionSheet";
import { HistoriqueGlobalDemandesModal } from "../../components/common/HistoriqueGlobalDemandesModal";
import { EchoTalkSignModal } from "../../components/accessibility/EchoTalkSignModal";

interface SignatureDoc {
  id: string;
  titre: string;
  citoyen: string;
  email: string;
  statut: "EN_ATTENTE_SIGNATURE" | "SIGNE" | "ENVOYE" | "ARCHIVE";
  tsaTimestamp?: string;
  selectedBatch?: boolean;
}

const SIGNED_DOCUMENTS_STORAGE_KEY = "tawsa_signed_documents";

export function AgentSignaturePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [docs, setDocs] = useState<SignatureDoc[]>([
    {
      id: "SIG-2026-0044",
      titre: "Permis d'Exploitation Commerciale Régionale",
      citoyen: "Rania LAMSAKHAR",
      email: "rania.lamsakhar@tawsa.ma",
      statut: "EN_ATTENTE_SIGNATURE",
    },
    {
      id: "SIG-2026-0045",
      titre: "Attestation de Conformité Numérique",
      citoyen: "Mohammed ALAMI",
      email: "mohammed.alami@tawsa.ma",
      statut: "EN_ATTENTE_SIGNATURE",
    },
    {
      id: "SIG-2026-0039",
      titre: "Certificat de Propriété et Régularisation Foncière",
      citoyen: "Fatima EZZAHRA",
      email: "fatima.ezzahra@tawsa.ma",
      statut: "SIGNE",
      tsaTimestamp: "2026-09-03T11:15:22Z [TSA-GOV-MA-SHA256]",
    },
  ]);

  const [selectedId, setSelectedId] = useState<string>("SIG-2026-0044");
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEchoTalkSignOpen, setIsEchoTalkSignOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
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
  const [inlineFeedback, setInlineFeedback] = useState<Record<string, string>>({});

  const showInlineFeedback = (key: string, msg: string) => {
    setInlineFeedback((prev) => ({ ...prev, [key]: msg }));
    setTimeout(() => {
      setInlineFeedback((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }, 4000);
  };

  const selectedDoc = docs.find((d) => d.id === selectedId);
  const docsEnCours = docs.filter((d) => d.statut === "EN_ATTENTE_SIGNATURE");
  const docsTraites = docs.filter((d) => d.statut !== "EN_ATTENTE_SIGNATURE");
  const currentList = activeTab === "EN_COURS" ? docsEnCours : docsTraites;

  const handleSaveSignature = (url: string) => {
    setSignatureDataUrl(url);
    const nowTsa = new Date().toISOString() + " [TSA-GOV-MA-SHA256]";
    setDocs((prev) =>
      prev.map((d) =>
        d.id === selectedId
          ? { ...d, statut: "SIGNE", tsaTimestamp: nowTsa }
          : d
      )
    );
    showInlineFeedback(
      "sign",
      `✍️ Signature manuscrite apposée & Horodatage TSA certifié pour ${selectedId}.`
    );
    setIsSheetOpen(true);
  };

  const handleSendToCitizen = () => {
    if (!selectedDoc) return;
    const signedContent = [
      "Royaume du Maroc. Ministère de la Transition Numérique et de la Réforme de l'Administration.",
      `Décision Administrative d'Autorisation N° ${selectedDoc.id}.`,
      `Objet : ${selectedDoc.titre}.`,
      `Citoyen bénéficiaire : ${selectedDoc.citoyen}.`,
      `Statut du document : SIGNE ET ENVOYE.`,
      selectedDoc.tsaTimestamp ? `Horodatage TSA : ${selectedDoc.tsaTimestamp}.` : "Document signé électroniquement par l'agent habilité.",
    ].join("\n");

    const signedDocument = {
      id: selectedDoc.id,
      title: selectedDoc.titre,
      citoyenNom: selectedDoc.citoyen,
      citoyenEmail: selectedDoc.email,
      content: signedContent,
      sentAt: new Date().toISOString(),
    };

    try {
      const stored = JSON.parse(localStorage.getItem(SIGNED_DOCUMENTS_STORAGE_KEY) || "[]");
      const documents = Array.isArray(stored) ? stored : [];
      const withoutCurrent = documents.filter((document: { id?: string }) => document.id !== signedDocument.id);
      localStorage.setItem(SIGNED_DOCUMENTS_STORAGE_KEY, JSON.stringify([...withoutCurrent, signedDocument]));
    } catch (error) {
      console.error("Erreur de transmission du document signé", error);
    }

    setDocs((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, statut: "ENVOYE" } : d))
    );
    showInlineFeedback(
      "send",
      `📧 Document transmis avec succès à ${selectedDoc.citoyen} (${selectedDoc.email}). Notification SMS & E-mail envoyée.`
    );
  };

  const handleConfirmReceipt = () => {
    showInlineFeedback(
      "confirm",
      `📩 Accusé de réception vérifié : Le citoyen a téléchargé le document signé avec succès.`
    );
  };

  const handleArchive = () => {
    setDocs((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, statut: "ARCHIVE" } : d))
    );
    showInlineFeedback(
      "archive",
      `📁 Document ${selectedId} archivé définitivement dans le Coffre-Fort numérique national.`
    );
  };

  const handleBatchSign = () => {
    const count = docs.filter((d) => d.selectedBatch).length;
    if (count === 0) {
      showInlineFeedback(
        "batch",
        "⚠️ Veuillez cocher au moins un document dans la liste pour effectuer la signature groupée."
      );
      return;
    }
    const nowTsa = new Date().toISOString() + " [TSA-GOV-MA-SHA256]";
    setDocs((prev) =>
      prev.map((d) =>
        d.selectedBatch ? { ...d, statut: "SIGNE", tsaTimestamp: nowTsa, selectedBatch: false } : d
      )
    );
    showInlineFeedback(
      "batch",
      `✅ Signature groupée effectuée avec succès sur ${count} document(s).`
    );
  };

  const toggleBatchSelect = (id: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, selectedBatch: !d.selectedBatch } : d))
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl text-2xl font-black">
            ✒️
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Espace Agent de Signature & Envoi</h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Matricule: MAT-SIG-2004 • Certificat eIDAS & Horodatage Officiel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEchoTalkSignOpen(true)}
            className="px-4 py-2.5 bg-[#cda351] hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer border border-amber-300"
          >
            <span>🤟</span> <span>Avatar Echo 1.0 TalkSign</span>
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <span>🏛️</span> <span>Historique Global</span>
          </button>
          <button
            onClick={handleBatchSign}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
          >
            <span>✍️</span> <span>Signature Groupée (Lot)</span>
          </button>
          {inlineFeedback["batch"] && (
            <span className="text-xs font-extrabold text-blue-700 bg-blue-100 border border-blue-300 px-3 py-1.5 rounded-xl animate-pulse">
              {inlineFeedback["batch"]}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Liste des documents (4 cols) */}
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
                <span>✒️ À Signer</span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">{docsEnCours.length}</span>
              </button>
              <button
                onClick={() => handleTabChange("TRAITES")}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "TRAITES" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>📬 Signés & Transmis</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">{docsTraites.length}</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {currentList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl">
                  Aucun document dans cet onglet
                </div>
              ) : (
                currentList.map((d) => (
                  <div
                    key={d.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      d.id === selectedDoc?.id
                        ? "bg-blue-500/10 border-blue-500 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!d.selectedBatch}
                      onChange={() => toggleBatchSelect(d.id)}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />

                    <div onClick={() => setSelectedId(d.id)} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900">{d.id}</span>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#f7f3eb] text-slate-900 border border-[#e3d8c4]">
                          {d.statut.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{d.titre}</p>
                      <span className="text-[11px] text-slate-500">👤 {d.citoyen}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Console de signature (8 cols) */}
        {selectedDoc && (
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Signature Électronique Qualifiée • <strong className="text-slate-900 bg-[#f7f3eb] px-2 py-0.5 rounded border border-[#e3d8c4]">{selectedDoc.statut}</strong>
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">{selectedDoc.id}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Destinataire : <strong>{selectedDoc.citoyen}</strong> ({selectedDoc.email})
                  </p>
                </div>
                <button
                  onClick={() => setIsSheetOpen(true)}
                  className="px-3.5 py-2 bg-[#f5efe6] hover:bg-[#e8decb] text-slate-900 font-extrabold text-xs rounded-xl border border-[#d8c8b0] shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>📜</span> Aperçu Feuille d'Autorisation
                </button>
              </div>

              {/* Horodatage officiel TSA */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-blue-400 font-bold">
                  <span>🕒 Horodatage Officiel TSA (Time-Stamping Authority)</span>
                  <span>{selectedDoc.tsaTimestamp ? "Horodaté ✓" : "En attente"}</span>
                </div>
                <p className="text-xs font-mono text-slate-300">
                  {selectedDoc.tsaTimestamp || "Signature non encore apposée. L'horodatage sera généré automatiquement."}
                </p>
              </div>

              {/* Pipeline de finalisation avec inline feedbacks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <button
                    onClick={() => setIsCanvasOpen(true)}
                    className="w-full p-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl transition shadow cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <span className="text-2xl">✍️</span>
                    <span>1. Dessiner ma Signature à la souris & Signer</span>
                  </button>
                  {inlineFeedback["sign"] && (
                    <p className="text-[11px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 p-2 rounded-xl text-center">
                      {inlineFeedback["sign"]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleSendToCitizen}
                    className="w-full p-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl transition shadow cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <span className="text-2xl">📧</span>
                    <span>2. Envoyer le Document au Citoyen</span>
                  </button>
                  {inlineFeedback["send"] && (
                    <p className="text-[11px] font-extrabold text-slate-800 bg-slate-100 border border-slate-200 p-2 rounded-xl text-center">
                      {inlineFeedback["send"]}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <button
                    onClick={handleConfirmReceipt}
                    className="w-full p-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs rounded-2xl transition cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <span className="text-2xl">📩</span>
                    <span>3. Confirmer la Réception Citoyen</span>
                  </button>
                  {inlineFeedback["confirm"] && (
                    <p className="text-[11px] font-extrabold text-slate-800 bg-slate-200 border p-2 rounded-xl text-center">
                      {inlineFeedback["confirm"]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleArchive}
                    className="w-full p-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl transition cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <span className="text-2xl">📁</span>
                    <span>4. Archiver dans le Coffre-Fort Sécurisé</span>
                  </button>
                  {inlineFeedback["archive"] && (
                    <p className="text-[11px] font-extrabold text-slate-900 bg-[#f7f3eb] border border-[#e3d8c4] p-2 rounded-xl text-center">
                      {inlineFeedback["archive"]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modale de Dessin de Signature à la Souris */}
      <SignatureCanvasModal
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        onSaveSignature={handleSaveSignature}
        dossierId={selectedDoc?.id}
        citoyenNom={selectedDoc?.citoyen}
      />

      {/* Feuille d'Autorisation & Décision Officielle Signée */}
      {isSheetOpen && selectedDoc && (
        <OfficialPermissionSheet
          dossierId={selectedDoc.id}
          citoyenNom={selectedDoc.citoyen}
          titre={selectedDoc.titre}
          tsaTimestamp={selectedDoc.tsaTimestamp}
          signatureDataUrl={signatureDataUrl}
          onClose={() => setIsSheetOpen(false)}
        />
      )}

      {/* Historique des demandes de tous les agents */}
      <HistoriqueGlobalDemandesModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Modale Traducteur Avatar Echo 1.0 TalkSign */}
      <EchoTalkSignModal
        isOpen={isEchoTalkSignOpen}
        onClose={() => setIsEchoTalkSignOpen(false)}
        documentData={
          selectedDoc
            ? {
                title: selectedDoc.titre,
                dossierId: selectedDoc.id,
                citoyenNom: selectedDoc.citoyen,
                content: `Royaume du Maroc. Ministère de la Transition Numérique et de la Réforme de l'Administration.\nDécision Administrative d'Autorisation N° ${selectedDoc.id}.\nObjet : ${selectedDoc.titre}.\nCitoyen bénéficiaire : ${selectedDoc.citoyen}.\nStatut du document : ${selectedDoc.statut}.\nARTICLE 1ER — ACCEPTATION ET AUTORISATION DÉFINITIVE. La présente autorisation est approuvée avec Horodatage TSA certifié.`,
              }
            : null
        }
      />
    </div>
  );
}
