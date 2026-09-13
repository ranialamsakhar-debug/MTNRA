import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { UserProfileBanner } from "../../components/common/UserProfileBanner";

interface CertDoc {
  id: string;
  citoyen: string;
  cnie: string;
  titre: string;
  integrityHash: string;
  statut: "EN_ATTENTE_CERTIFICATION" | "CERTIFIE" | "FALSIFICATION_SUSPECTEE";
  sealApplied: boolean;
  signatureLegalized: boolean;
  identityVerified: boolean;
  date: string;
}

const INITIAL_DOCS: CertDoc[] = [
  {
    id: "CERT-2026-0091",
    citoyen: "Fatima Zahra",
    cnie: "EF12345",
    titre: "Attestation de Conformité Administrative",
    integrityHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    statut: "EN_ATTENTE_CERTIFICATION",
    sealApplied: false,
    signatureLegalized: false,
    identityVerified: true,
    date: "2026-08-31"
  },
  {
    id: "CERT-2026-0084",
    citoyen: "Ahmed Benali",
    cnie: "BK50312",
    titre: "Certificat d'Immatriculation Entreprise",
    integrityHash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
    statut: "EN_ATTENTE_CERTIFICATION",
    sealApplied: false,
    signatureLegalized: false,
    identityVerified: false,
    date: "2026-08-30"
  }
];

export function AgentCertificationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [docs, setDocs] = useState<CertDoc[]>(INITIAL_DOCS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_DOCS[0].id);
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

  const docsEnCours = docs.filter(d => d.statut === "EN_ATTENTE_CERTIFICATION");
  const docsTraites = docs.filter(d => d.statut !== "EN_ATTENTE_CERTIFICATION");
  const currentList = activeTab === "EN_COURS" ? docsEnCours : docsTraites;

  const selectedDoc = docs.find((d) => d.id === selectedId) || currentList[0] || docs[0];

  // 1. Apposer le cachet électronique officiel
  const handleApplySeal = () => {
    setDocs((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, sealApplied: true } : d))
    );
    showInlineFeedback("seal", `🏵️ Cachet électronique apposé sur ${selectedId} !`);
  };

  // 2. Légaliser la signature
  const handleLegalizeSignature = () => {
    setDocs((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, signatureLegalized: true } : d))
    );
    showInlineFeedback("legalize", `✒️ Signature légalisée pour ${selectedDoc.citoyen}`);
  };

  // 3. Authentification renforcée de l'identité
  const handleVerifyIdentity = () => {
    setDocs((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, identityVerified: true } : d))
    );
    showInlineFeedback("auth", `🆔 Identité vérifiée avec le Registre National CNI.`);
  };

  // 4. Certifier la conformité du document final
  const handleCertify = () => {
    if (!selectedDoc.sealApplied || !selectedDoc.identityVerified) {
      showInlineFeedback("certify", `⚠️ Veuillez apposer le cachet et vérifier l'identité avant de certifier.`);
      return;
    }
    setDocs((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, statut: "CERTIFIE" } : d))
    );
    showInlineFeedback("certify", `📜 Document ${selectedId} certifié conforme ! Transmis à la Signature.`);
  };

  // 5. Signaler une tentative de falsification
  const handleReportFalsification = () => {
    setDocs((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, statut: "FALSIFICATION_SUSPECTEE" } : d))
    );
    showInlineFeedback("falsification", `⛔ Falsification signalée ! Alerte de sécurité activée.`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <UserProfileBanner />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-slate-100 text-slate-800 rounded-2xl text-2xl font-black">
            🏵️
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Espace Agent de Certification</h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Matricule: MAT-CER-2003 • Cachet Électronique & Authentification
            </p>
          </div>
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
                <span>🏵️ À Certifier</span>
                <span className="px-2 py-0.5 rounded-full bg-[#f7f3eb] text-slate-900 border border-[#e3d8c4] text-[10px] font-extrabold">{docsEnCours.length}</span>
              </button>
              <button
                onClick={() => handleTabChange("TRAITES")}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "TRAITES" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>✅ Historique Certifiés</span>
                <span className="px-2 py-0.5 rounded-full bg-[#f7f3eb] text-slate-900 border border-[#e3d8c4] text-[10px] font-extrabold">{docsTraites.length}</span>
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
                    onClick={() => setSelectedId(d.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-2 ${
                      d.id === selectedDoc?.id
                        ? "bg-slate-100 border-slate-800 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900">{d.id}</span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#f7f3eb] text-slate-900 border border-[#e3d8c4]">
                        {d.statut.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{d.titre}</p>
                    <span className="text-[11px] text-slate-500 font-medium">👤 {d.citoyen}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Console de certification (8 cols) */}
        {selectedDoc && (
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Certification Officielle • <strong className="text-slate-900 bg-[#f7f3eb] px-2 py-0.5 rounded border border-[#e3d8c4]">{selectedDoc.statut}</strong>
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">{selectedDoc.id}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Titulaire : <strong>{selectedDoc.citoyen}</strong> ({selectedDoc.cnie})
                  </p>
                </div>
              </div>

              {/* Panneau des Indicateurs de Validité & Contrôle d'Authenticité */}
              <div className="bg-[#fdfbf7] p-5 rounded-2xl border border-[#e5dac6] space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#e3d8c4] pb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-2">
                    <span>🛡️ Indicateurs de Validité & Diagnostic d'Authenticité</span>
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border shadow-sm ${
                    selectedDoc.statut === "CERTIFIE"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : selectedDoc.statut === "FALSIFICATION_SUSPECTEE"
                      ? "bg-red-50 text-red-800 border-red-300"
                      : selectedDoc.sealApplied && selectedDoc.identityVerified
                      ? "bg-[#f7f3eb] text-slate-900 border-[#e3d8c4]"
                      : "bg-stone-100 text-slate-700 border-stone-300"
                  }`}>
                    {selectedDoc.statut === "CERTIFIE"
                      ? "🟢 Document Certifié Conforme"
                      : selectedDoc.statut === "FALSIFICATION_SUSPECTEE"
                      ? "⛔ Falsification Détectée - Bloqué"
                      : selectedDoc.sealApplied && selectedDoc.identityVerified
                      ? "⚡ Prêt pour Certification Finalisation"
                      : "⏳ Préréquis Incomplets"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Conformité Agent Validation</span>
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="text-emerald-700">✓</span> Examen Réglementaire Validé
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Intégrité Hash SHA-256</span>
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="text-emerald-700">✓</span> Fichier Intact & Non Altéré
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">3. Registre Biométrique CNI</span>
                    <span className={`font-extrabold flex items-center gap-1.5 ${selectedDoc.identityVerified ? "text-slate-900" : "text-amber-800"}`}>
                      {selectedDoc.identityVerified ? "✓ Identité Vérifiée avec Succès" : "⏳ Vérification CNI Requise"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checksum d'intégrité */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                  <span>🔐 Empreinte Cryptographique SHA-256 Officielle</span>
                  <span className="text-slate-200 font-extrabold bg-slate-800 px-2.5 py-0.5 rounded">Clé Certifiée ISO 27001 ✓</span>
                </div>
                <p className="text-xs font-mono text-slate-300 break-all">{selectedDoc.integrityHash}</p>
              </div>

              {/* Étapes de certification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-center">
                  <span className="text-2xl">🆔</span>
                  <p className="text-xs font-bold text-slate-800">Authentification CNIE</p>
                  <button
                    onClick={handleVerifyIdentity}
                    className={`w-full py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      selectedDoc.identityVerified
                        ? "bg-[#f7f3eb] text-slate-900 border border-[#e3d8c4]"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {selectedDoc.identityVerified ? "Identité Vérifiée ✓" : "Vérifier Identité"}
                  </button>
                  {inlineFeedback["auth"] && (
                    <p className="text-[10px] font-extrabold text-slate-900 bg-[#f7f3eb] border border-[#e3d8c4] p-1.5 rounded-lg">
                      {inlineFeedback["auth"]}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-center">
                  <span className="text-2xl">🏵️</span>
                  <p className="text-xs font-bold text-slate-800">Cachet Électronique</p>
                  <button
                    onClick={handleApplySeal}
                    className={`w-full py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      selectedDoc.sealApplied
                        ? "bg-[#f7f3eb] text-slate-900 border border-[#e3d8c4]"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {selectedDoc.sealApplied ? "Cachet Apposé ✓" : "Apposer Cachet"}
                  </button>
                  {inlineFeedback["seal"] && (
                    <p className="text-[10px] font-extrabold text-slate-900 bg-[#f7f3eb] border border-[#e3d8c4] p-1.5 rounded-lg">
                      {inlineFeedback["seal"]}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-center">
                  <span className="text-2xl">✒️</span>
                  <p className="text-xs font-bold text-slate-800">Légalisation Signature</p>
                  <button
                    onClick={handleLegalizeSignature}
                    className={`w-full py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      selectedDoc.signatureLegalized
                        ? "bg-[#f7f3eb] text-slate-900 border border-[#e3d8c4]"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {selectedDoc.signatureLegalized ? "Légalisée ✓" : "Légaliser"}
                  </button>
                  {inlineFeedback["legalize"] && (
                    <p className="text-[10px] font-extrabold text-slate-900 bg-[#f7f3eb] border border-[#e3d8c4] p-1.5 rounded-lg">
                      {inlineFeedback["legalize"]}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions de validation ou de fraude */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <div className="flex flex-wrap justify-between gap-4">
                  <button
                    onClick={handleReportFalsification}
                    className="px-5 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-extrabold text-xs rounded-xl transition cursor-pointer"
                  >
                    ⛔ Signaler Falsification
                  </button>

                  <button
                    onClick={handleCertify}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    📜 Certifier la Conformité du Document Final
                  </button>
                </div>

                {/* Feedbacks inline */}
                <div className="flex flex-wrap gap-2">
                  {inlineFeedback["certify"] && (
                    <span className="text-xs font-extrabold text-slate-900 bg-[#f7f3eb] border border-[#e3d8c4] px-3 py-1.5 rounded-xl">
                      {inlineFeedback["certify"]}
                    </span>
                  )}
                  {inlineFeedback["falsification"] && (
                    <span className="text-xs font-extrabold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                      {inlineFeedback["falsification"]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
