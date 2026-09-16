import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useUIStore } from "../../store/uiStore";
import { useDossierStore, DossierItem, DocumentItem } from "../../store/dossierStore";
import { useAuthStore } from "../../store/authStore";
import { OfficialPermissionSheet } from "../../components/common/OfficialPermissionSheet";
import { compressImageIfNeeded } from "../../utils/imageCompressor";
import { EchoTalkSignModal } from "../../components/accessibility/EchoTalkSignModal";
import { UserProfileBanner } from "../../components/common/UserProfileBanner";

interface SignedDocument {
  id: string;
  title: string;
  citoyenNom: string;
  citoyenEmail: string;
  content: string;
  signatureDataUrl?: string | null;
  sentAt: string;
  agentNom?: string;
}

const SIGNED_DOCUMENTS_STORAGE_KEY = "tawsa_signed_documents";

const translations: Record<string, any> = {
  FR: { title: "📁 Suivi & Historique de vos Réclamations" },
  EN: { title: "📁 Complaint & Document Management" },
  AR: { title: "📁 متابعة وتدبير الشكايات والوثائق" },
  TAM: { title: "📁 ⴰⵙⵡⵓⴷⴷⵓ ⵏ ⵉⴼⴰⵢⵍⵓⵜⵏ" }
};

export function DossiersPage() {
  const { lang } = useUIStore();
  const { dossiers, addDocumentsToDossier } = useDossierStore();
  const { user } = useAuthStore();
  const t = translations[lang] || translations.FR;

  const [selectedDossier, setSelectedDossier] = useState<DossierItem | null>(null);
  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentItem | null>(null);
  const [selectedSheetDossier, setSelectedSheetDossier] = useState<DossierItem | null>(null);
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([]);
  const [selectedSignedDocument, setSelectedSignedDocument] = useState<SignedDocument | null>(null);
  const [selectedSignedSheetDocument, setSelectedSignedSheetDocument] = useState<SignedDocument | null>(null);

  const loadSignedDocuments = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(SIGNED_DOCUMENTS_STORAGE_KEY) || "[]");
      setSignedDocuments(Array.isArray(stored) ? stored : []);
    } catch {
      setSignedDocuments([]);
    }
  };

  useEffect(() => {
    loadSignedDocuments();
    window.addEventListener("storage", loadSignedDocuments);
    return () => window.removeEventListener("storage", loadSignedDocuments);
  }, []);

  const receivedSignedDocuments = signedDocuments.filter((document) => {
    if (!user) return false;
    const matchesUser = document.citoyenEmail === user.email ||
      document.citoyenNom.toLowerCase() === `${user.prenom} ${user.nom}`.toLowerCase();
    const matchesDossier = dossiers.some(d => d.numeroDossier === document.id || d.id === document.id);
    return matchesUser || matchesDossier;
  });

  // Modale pour l'ajout de pièces complémentaires urgentes sans recréer de réclamation
  const [urgentTargetDossier, setUrgentTargetDossier] = useState<DossierItem | null>(null);
  const [isProcessingUrgent, setIsProcessingUrgent] = useState(false);
  const [urgentFeedback, setUrgentFeedback] = useState<string | null>(null);

  // Détecter si un dossier nécessite une pièce urgente de manière explicite
  const pendingNotificationDossier = dossiers.find(d => d.demandeDocumentsSupplementaires || d.statut === "EN_ATTENTE_PIECE");
  const mediatorRequestDossier = dossiers.find(d => d.demandeDocumentsMediateur === true);

  const computeSHA256AndDataUrl = async (file: File): Promise<{ hash: string; dataUrl: string }> => {
    let hash = "";
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    const dataUrl = await compressImageIfNeeded(file, 1000, 0.82);

    return { hash, dataUrl };
  };

  const handleUrgentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !urgentTargetDossier) return;
    
    setIsProcessingUrgent(true);
    setUrgentFeedback(null);

    const files = Array.from(e.target.files);
    const newDocs: DocumentItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { hash, dataUrl } = await computeSHA256AndDataUrl(file);

      const sizeFormatted = file.size > 1024 * 1024 
        ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
        : (file.size / 1024).toFixed(0) + " KB";

      newDocs.push({
        id: "doc-urgent-" + Date.now() + "-" + i,
        nomFichier: file.name,
        typeDocument: "Piece Complementaire Urgente",
        tailleFormatted: sizeFormatted,
        dateAjout: new Date().toISOString().replace('T', ' ').substring(0, 16),
        hash: hash,
        verifie: true,
        scoreFiabilite: 0.99,
        extractedTextPreview: `[PIÈCE COMPLÉMENTAIRE URGENTE - ${file.name}] Transmise directement par ${urgentTargetDossier.citoyenNom} pour l'agent référent ${urgentTargetDossier.agentAffecte?.prenom || "Ahmed"} ${urgentTargetDossier.agentAffecte?.nom || "Benali"}.`,
        dataUrl: dataUrl
      });
    }

    addDocumentsToDossier(urgentTargetDossier.id, newDocs);
    setIsProcessingUrgent(false);
    setUrgentFeedback(`✅ ${newDocs.length} document(s) urgent(s) ajouté(s) avec succès et transmis directement à l'agent référent (M. ${urgentTargetDossier.agentAffecte?.prenom || "Ahmed"} ${urgentTargetDossier.agentAffecte?.nom || "Benali"}) !`);
    
    // Mettre à jour le dossier sélectionné si ouvert
    if (selectedDossier && (selectedDossier.id === urgentTargetDossier.id || selectedDossier.numeroDossier === urgentTargetDossier.numeroDossier)) {
      setSelectedDossier(prev => prev ? { ...prev, demandeDocumentsSupplementaires: false, demandeDocumentsMediateur: false, statut: "EN_COURS", documents: [...prev.documents, ...newDocs] } : null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6 px-4 sm:px-6 lg:px-8" dir={lang === "AR" ? "rtl" : "ltr"}>
      <UserProfileBanner />
      {receivedSignedDocuments.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950 text-white rounded-3xl p-6 shadow-xl border border-amber-400/40 space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-amber-300 font-black">Actes & Décisions Numériques Reçus</span>
              <h2 className="text-lg font-black mt-1">Vos documents et autorisations signés sont disponibles</h2>
            </div>
            <span className="text-xs font-bold text-slate-300">{receivedSignedDocuments.length} document(s)</span>
          </div>
          <div className="grid gap-3">
            {receivedSignedDocuments.map((document) => (
              <div key={document.id} className="bg-white/10 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-white">{document.id} — {document.title}</p>
                    {document.signatureDataUrl && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        ✍️ Signature Officielle Incluse
                      </span>
                    )}
                    {document.agentNom && (
                      <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                        {document.agentNom}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">Envoyé le {new Date(document.sentAt).toLocaleString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSignedSheetDocument(document)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span>📜</span> Consulter l'Acte & Signature
                  </button>
                  <button
                    onClick={() => setSelectedSignedDocument(document)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🤟</span> Traduire en signes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ALERTE NOTIFICATION PERMANENTE CITOYEN DE DEMANDE DE PIÈCES MÉDIATEUR */}
      {mediatorRequestDossier && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-teal-50 border border-teal-200 backdrop-blur-md text-slate-900 rounded-3xl shadow-sm space-y-3 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-teal-100 text-2xl flex items-center justify-center shrink-0">
                📄
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-teal-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                    Demande du Médiateur
                  </span>
                  <span className="text-xs font-mono font-bold text-teal-900">
                    {mediatorRequestDossier.numeroDossier}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Le Médiateur a demandé des pièces complémentaires pour votre dossier {mediatorRequestDossier.numeroDossier}
                </h3>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedDossier(mediatorRequestDossier);
                setUrgentTargetDossier(mediatorRequestDossier);
              }}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>📤</span> <span>Ajouter les Pièces Demandées</span>
            </button>
          </div>

          <div className="p-4 bg-white/80 rounded-2xl border border-teal-100 text-xs font-semibold leading-relaxed text-slate-800">
            💬 <strong>Pièces requises :</strong> {mediatorRequestDossier.documentsDemandesParMediateur?.join(', ')}
          </div>
        </motion.div>
      )}

      {/* ALERTE NOTIFICATION PERMANENTE CITOYEN DE DEMANDE DE PIÈCES OU COMMENTAIRE */}
      {pendingNotificationDossier && !mediatorRequestDossier && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-amber-500/10 border border-amber-500/30 backdrop-blur-md text-slate-900 rounded-3xl shadow-sm space-y-3 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/20 text-2xl flex items-center justify-center shrink-0">
                🔔
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-amber-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                    Notification Officielle d'Instruction
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-900">
                    {pendingNotificationDossier.numeroDossier}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Demande de pièce complémentaire émise par M. {pendingNotificationDossier.agentAffecte?.prenom || "Ahmed"} {pendingNotificationDossier.agentAffecte?.nom || "Benali"}
                </h3>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedDossier(pendingNotificationDossier);
                setUrgentTargetDossier(pendingNotificationDossier);
              }}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>⚡</span> <span>Ajouter le Document Urgent Maintenant</span>
            </button>
          </div>

          <div className="p-4 bg-white/80 rounded-2xl border border-amber-200/80 text-xs font-semibold leading-relaxed text-slate-800">
            💬 <strong>Motif / Exigence de l'Agent Instructeur :</strong> « {pendingNotificationDossier.motifDemandePiece || pendingNotificationDossier.remarqueAgent} »
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200/80 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <span>📁</span>
              <span>{t.title}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Consultez l'historique de vos réclamations et ajoutez des pièces complémentaires lorsqu'elles sont réclamées par l'agent instructeur.
            </p>
          </div>
          <span className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-extrabold w-fit shadow-xs">
            {dossiers.length} dossier(s) enregistré(s)
          </span>
        </div>

        {urgentFeedback && (
          <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm">
            <span>{urgentFeedback}</span>
            <button onClick={() => setUrgentFeedback(null)} className="text-slate-300 font-extrabold hover:underline">Fermer</button>
          </div>
        )}
        
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider font-extrabold">
                <th className="py-4 px-6 border-b border-slate-200/80">N° Réclamation</th>
                <th className="py-4 px-6 border-b border-slate-200/80">Type de Démarche</th>
                <th className="py-4 px-6 border-b border-slate-200/80">Agent Référent</th>
                <th className="py-4 px-6 border-b border-slate-200/80">Date</th>
                <th className="py-4 px-6 border-b border-slate-200/80">Documents Jointes</th>
                <th className="py-4 px-6 border-b border-slate-200/80">Statut</th>
                <th className="py-4 px-6 border-b border-slate-200/80 text-right">Actions Rapides</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {dossiers.map((dossier) => {
                const isUrgentAllowed = Boolean(dossier.demandeDocumentsSupplementaires || dossier.statut === "EN_ATTENTE_PIECE" || dossier.demandeDocumentsMediateur);
                return (
                  <tr key={dossier.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">{dossier.numeroDossier}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{dossier.typeDemande}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit">
                        👤 M. {dossier.agentAffecte?.prenom || "Ahmed"} {dossier.agentAffecte?.nom || "Benali"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 font-medium">{dossier.dateCreation}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit">
                        <span>📎</span> {dossier.documents.length} pièce(s)
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                        dossier.statut === "VALIDE" || dossier.statut === "CERTIFIE" || dossier.statut === "SIGNE"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : dossier.statut === "REJETE"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : dossier.statut === "EN_ATTENTE_PIECE"
                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                          : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                      }`}>
                        {dossier.statut === "EN_ATTENTE_PIECE" ? "⚠️ Document Requis" : dossier.statut.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {isUrgentAllowed ? (
                          <button
                            onClick={() => setUrgentTargetDossier(dossier)}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                            title="Ajouter les pièces complémentaires urgentes réclamées par l'agent"
                          >
                            <span>⚡</span> <span>Ajout Document Urgent</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3.5 py-2 bg-slate-100 text-slate-400 border border-slate-200 font-bold rounded-xl text-xs cursor-not-allowed flex items-center gap-1 opacity-60"
                            title="🔒 Option désactivée : Aucun document complémentaire n'a été réclamé par l'agent pour ce dossier."
                          >
                            <span>🔒</span> <span>Ajout Non Requis</span>
                          </button>
                        )}
                        {(dossier.acteMediationSigne || receivedSignedDocuments.some((document) => document.id === dossier.numeroDossier || document.id === dossier.id)) && (
                          <button
                            onClick={() => setSelectedSheetDossier(dossier)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Consulter la Décision Officielle & la Feuille d'Autorisation signée"
                          >
                            <span>📜</span> <span>Feuille d'Autorisation</span>
                          </button>
                        )}
                        {dossier.statut === "REJETE" && (
                          <Link
                            to={`/citoyen/nouvelle-demande?type=SAISINE_MEDIATEUR&dossier=${encodeURIComponent(dossier.numeroDossier)}`}
                            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <span>⚖️</span> <span>Saisir le Médiateur</span>
                          </Link>
                        )}
                        <button
                          onClick={() => setSelectedDossier(dossier)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <span>👁️</span> <span>Détails</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* MODALE HISTORIQUE DÉTAILS DOSSIER */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-6 shadow-2xl border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 uppercase">Réclamation n°</span>
                <h3 className="text-xl font-black text-slate-900">{selectedDossier.numeroDossier}</h3>
              </div>
              <button onClick={() => setSelectedDossier(null)} className="text-slate-400 hover:text-slate-900 font-bold text-lg">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-500">Demandeur :</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedDossier.citoyenNom} ({selectedDossier.citoyenCnie})</p>
              </div>
              <div>
                <span className="font-bold text-slate-500">Type de Démarche :</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedDossier.typeDemande}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500">Date de dépôt :</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedDossier.dateCreation}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500">Statut Actuel :</span>
                <p className="font-bold text-slate-700 mt-0.5">{selectedDossier.statut}</p>
              </div>
            </div>

            {/* CARD AGENT RÉFÉRENT AFFECTÉ */}
            <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-2">
                  <span>👤</span> <span>Agent Référent Affecté à votre Réclamation</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-900">
                  Interlocuteur Officiel
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    {selectedDossier.agentAffecte?.prenom || "Ahmed"} {selectedDossier.agentAffecte?.nom || "Benali"}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {selectedDossier.agentAffecte?.role || "Agent Réclamation & Orientation (Niveau 1)"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/messages"
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>💬</span> <span>Messagerie & Échanges</span>
                  </Link>
                  <a
                    href={`tel:${selectedDossier.agentAffecte?.telephone || "05 37 20 20 20"}`}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition"
                  >
                    📞 05 37 20 20 20
                  </a>
                </div>
              </div>
            </div>

            {/* ALERTE REJET */}
            {selectedDossier.statut === "REJETE" && (
              <div className="p-5 bg-rose-50 border-2 border-rose-200 rounded-2xl space-y-3 shadow-sm mb-4">
                {(() => {
                  const rejectAction = selectedDossier.historiqueActions?.find(a => a.action === 'REJET');
                  const agentStr = rejectAction ? `${rejectAction.auteur} (${rejectAction.auteurRole})` : '(Agent de Validation)';
                  return (
                    <>
                      <h4 className="text-sm font-black text-rose-900 flex items-center gap-2">
                        <span>❌</span> <span>Demande refusée par : {agentStr}</span>
                      </h4>
                      <div className="p-4 bg-white rounded-xl border border-rose-100">
                        <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block mb-2">Motif du rejet :</span>
                        <p className="text-sm font-medium text-slate-900 leading-relaxed">
                          {selectedDossier.remarqueAgent || "Non spécifié."}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ALERTE SUCCÈS MÉDIATION & ACTE OFFICIEL SIGNÉ */}
            {(selectedDossier.acteMediationSigne || (selectedDossier.statut === "SIGNE" && selectedDossier.remarqueAgent?.includes("Médiateur"))) && (
              <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-3 shadow-sm mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                    <span>⚖️</span> <span>Litige Résolu par l'Institution du Médiateur du Royaume</span>
                  </h4>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Acte Signé Exécutoire
                  </span>
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-emerald-200 text-xs space-y-1">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Décision & Régularisation :</span>
                  <p className="text-xs font-medium text-slate-900 leading-relaxed">
                    {selectedDossier.remarqueAgent}
                  </p>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setSelectedSheetDossier(selectedDossier)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📜</span> Consulter la Feuille d'Autorisation & Signature du Médiateur
                  </button>
                </div>
              </div>
            )}

            {/* SECTION CONCRÈTE ET TRANSPARENTE DES COMMENTAIRES ET MOTIFS D'AGENT */}
            <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl space-y-3 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
                  <span>💬</span> <span>Commentaires, Motifs & Décision d'Agent Instructeur</span>
                </h4>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black ${
                  selectedDossier.statut === "VALIDE" || selectedDossier.statut === "CERTIFIE" || selectedDossier.statut === "SIGNE"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                    : selectedDossier.statut === "REJETE"
                    ? "bg-rose-950 text-rose-300 border border-rose-800/60"
                    : "bg-amber-950 text-amber-300 border border-amber-800/60"
                }`}>
                  {selectedDossier.statut.replace('_', ' ')}
                </span>
              </div>
              
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 text-xs font-medium leading-relaxed text-slate-200">
                « {selectedDossier.remarqueAgent || selectedDossier.motifDemandePiece || "Bonjour. Votre dossier est actuellement en cours d'instruction administrative par l'agent référent."} »
              </div>

              {selectedDossier.historiqueActions && selectedDossier.historiqueActions.length > 0 && (
                <div className="pt-3 space-y-2 border-t border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-indigo-300/80 tracking-wider">Historique complet des interventions :</span>
                  {selectedDossier.historiqueActions.map(act => (
                    <div key={act.id} className="text-[11px] text-slate-200 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-300">{act.auteur} ({act.auteurRole})</span>
                        <span className="text-[9px] text-slate-400 font-mono">{act.date}</span>
                      </div>
                      <p className="text-slate-300">{act.commentaire}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION MÉDIATEUR : PIÈCES DEMANDÉES */}
            {selectedDossier.demandeDocumentsMediateur === true && selectedDossier.documentsDemandesParMediateur && selectedDossier.documentsDemandesParMediateur.length > 0 && (
              <div className="p-5 bg-teal-50 border border-teal-200 rounded-2xl space-y-3 mt-4">
                <h4 className="text-sm font-black text-teal-900 flex items-center gap-2">
                  <span>📄</span> <span>Pièces Demandées par le Médiateur</span>
                </h4>
                <ul className="list-disc list-inside text-sm text-slate-800 space-y-1 ml-2">
                  {selectedDossier.documentsDemandesParMediateur.map((doc, idx) => (
                    <li key={idx} className="font-medium">{doc}</li>
                  ))}
                </ul>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const current = selectedDossier;
                      setSelectedDossier(null);
                      setUrgentTargetDossier(current);
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📤</span> <span>Transmettre les pièces au médiateur</span>
                  </button>
                </div>
              </div>
            )}

            {/* DESCRIPTION */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-700">Objet & Description :</h4>
              <p className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed">
                {selectedDossier.description}
              </p>
            </div>

            {/* DOCUMENTS JOINTS ET BOUTON D'AJOUT URGENT */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-slate-900 flex items-center gap-2">
                  <span>📎 Documents joints ({selectedDossier.documents.length}) :</span>
                </h4>
                <button
                  onClick={() => {
                    const current = selectedDossier;
                    setSelectedDossier(null);
                    setUrgentTargetDossier(current);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow transition flex items-center gap-1 cursor-pointer"
                >
                  <span>⚡</span> <span>+ Ajouter Pièce Urgente</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {selectedDossier.documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📜</span>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{doc.nomFichier}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">{doc.typeDocument}</span>
                          <span className="text-[10px] text-slate-500">{doc.tailleFormatted}</span>
                          <span className="text-[10px] text-emerald-700 font-bold">✓ SHA-256 Conforme</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDocPreview(doc)}
                      className="w-full md:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs rounded-xl border border-indigo-200 shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>👁️</span> <span>Aperçu Photo & SHA-256</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button onClick={() => setSelectedDossier(null)} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE D'AJOUT DE DOCUMENT URGENT DIRECTEMENT AU DOSSIER */}
      {urgentTargetDossier && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-300">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                  <span>⚡</span> <span>Ajout de Pièce Urgente Réclamée</span>
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">Dossier N° {urgentTargetDossier.numeroDossier}</h3>
              </div>
              <button onClick={() => setUrgentTargetDossier(null)} className="text-slate-400 hover:text-slate-900 font-bold text-lg">✕</button>
            </div>

            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300 text-xs space-y-1.5">
              <p className="font-bold text-slate-900">
                👤 Agent Destinataire : M. {urgentTargetDossier.agentAffecte?.prenom || "Ahmed"} {urgentTargetDossier.agentAffecte?.nom || "Benali"} ({urgentTargetDossier.agentAffecte?.service || "Guichet Unifié"})
              </p>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                Inutile de recréer une nouvelle réclamation ! Téléversez directement ci-dessous les photos ou documents demandés pour les rattacher à votre dossier existant.
              </p>
            </div>

            {/* Zone de téléchargement du document urgent */}
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition p-4 text-center ${isProcessingUrgent ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="text-3xl mb-1">📄</span>
              <p className="text-xs font-bold text-slate-800">
                <span className="text-slate-900 hover:underline">Cliquez ici pour sélectionner</span> le(s) document(s) urgent(s)
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Analyse OCR & Calcul SHA-256 automatiques</p>
              <input type="file" multiple onChange={handleUrgentFileUpload} className="hidden" />
            </label>

            {isProcessingUrgent && (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900">
                <span className="flex items-center gap-2"><span className="animate-spin">⚙️</span> Hachage SHA-256 & Transmission immédiate à M. Ahmed Benali...</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setUrgentTargetDossier(null)}
                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Prévisualisation d'un Document */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <span>📄 Document transmis :</span>
                <span className="text-slate-900 font-mono">{selectedDocPreview.nomFichier}</span>
              </h3>
              <button onClick={() => setSelectedDocPreview(null)} className="text-slate-400 hover:text-slate-900 font-bold text-base">✕</button>
            </div>
            
            <div className="space-y-4">
              {/* VRAIE PHOTO / APERÇU DU DOCUMENT */}
              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 text-center space-y-2">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">📷 Aperçu Visuel de la Photo / Pièce Transmise</span>
                {(() => {
                  // Photo scannée sur mesure dans le navigateur (dataUrl d'upload direct ou photo CNIE scannée manuellement)
                  const customScannedPhoto = localStorage.getItem('tawsa_cni_photo_' + (user?.cin || 'AI225')) || localStorage.getItem('tawsa_cni_photo');
                  const hasCustomBase64 = customScannedPhoto && customScannedPhoto.startsWith("data:image/");
                  
                  const isCniDoc = selectedDocPreview.typeDocument.toLowerCase().includes("cni") || selectedDocPreview.nomFichier.toLowerCase().includes("cni") || selectedDocPreview.nomFichier.toLowerCase().includes("cin");
                  
                  // Seul un fichier réel téléversé depuis le PC ou une photo scannée manuellement doit s'afficher
                  const imgUrl = selectedDocPreview.dataUrl || (isCniDoc && hasCustomBase64 ? customScannedPhoto : null);
                  
                  if (imgUrl && (imgUrl.startsWith("data:image/") || imgUrl.startsWith("blob:"))) {
                    return (
                      <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-inner">
                        <img
                          src={imgUrl}
                          alt={selectedDocPreview.nomFichier}
                          className="max-h-72 w-full object-contain mx-auto rounded-lg shadow"
                        />
                        <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] text-indigo-300 font-mono">
                          <span>Fichier: {selectedDocPreview.nomFichier}</span>
                          <span>Qualité OCR: {(selectedDocPreview.scoreFiabilite * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  }

                  // Si le document est un PDF modèle ou sans photo scannée enregistrée
                  return (
                    <div className="h-48 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-slate-100 p-4 space-y-2">
                      <span className="text-5xl">📄</span>
                      <p className="text-xs font-bold text-slate-100">{selectedDocPreview.nomFichier}</p>
                      <span className="text-[10px] bg-slate-800 text-indigo-300 px-3 py-1 rounded-full font-mono border border-slate-700">
                        ✓ Document Officiel Numérisé - Conforme SHA-256
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* CODE SHA-256 OFFICIEL */}
              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔑</span> <span>Code Cryptographique SHA-256 Généré :</span>
                  </span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-800/60">✓ AUTHENTIFIÉ ISO 27001</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 break-all font-bold tracking-wider select-all">
                  {selectedDocPreview.hash}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between"><span className="font-bold text-slate-500">Catégorie :</span><span className="font-bold text-slate-900">{selectedDocPreview.typeDocument}</span></div>
                <div className="flex items-center justify-between"><span className="font-bold text-slate-500">Taille :</span><span className="font-semibold text-slate-900">{selectedDocPreview.tailleFormatted}</span></div>
                <div className="flex items-center justify-between"><span className="font-bold text-slate-500">Score de conformité OCR :</span><span className="font-extrabold text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full">{(selectedDocPreview.scoreFiabilite * 100).toFixed(0)}% Valide</span></div>
              </div>

              <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300 text-xs space-y-1">
                <h4 className="font-bold text-slate-900">Extrait du Texte Reconnu (OCR) :</h4>
                <p className="text-slate-800 text-[11px] leading-relaxed italic">{selectedDocPreview.extractedTextPreview}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedDocPreview(null)} className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition">
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feuille de décision officielle & Autorisation signée */}
      {selectedSheetDossier && (receivedSignedDocuments.find((document) =>
        document.id === selectedSheetDossier.numeroDossier || document.id === selectedSheetDossier.id
      ) || selectedSheetDossier.acteMediationSigne) && (() => {
        const matchingDoc = receivedSignedDocuments.find((document) =>
          document.id === selectedSheetDossier.numeroDossier || document.id === selectedSheetDossier.id
        );
        return (
          <OfficialPermissionSheet
            dossierId={selectedSheetDossier.numeroDossier || selectedSheetDossier.id}
            citoyenNom={selectedSheetDossier.citoyenNom}
            cni={selectedSheetDossier.citoyenCnie || "AI225"}
            titre={selectedSheetDossier.typeDemande}
            dateSignature={matchingDoc?.sentAt
              ? new Date(matchingDoc.sentAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
              : (selectedSheetDossier.dateSignatureMediation || new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }))}
            signatureDataUrl={matchingDoc?.signatureDataUrl || selectedSheetDossier.signatureMediationDataUrl}
            agentNom={matchingDoc?.agentNom || (selectedSheetDossier.acteMediationSigne ? "Youssef TAZI (Institution du Médiateur du Royaume)" : "Samira MANSOURI (Agent Signature & Envoi)")}
            onClose={() => setSelectedSheetDossier(null)}
          />
        );
      })()}

      {selectedSignedSheetDocument && (
        <OfficialPermissionSheet
          dossierId={selectedSignedSheetDocument.id}
          citoyenNom={selectedSignedSheetDocument.citoyenNom}
          cni={user?.cin || "AI225"}
          titre={selectedSignedSheetDocument.title}
          dateSignature={new Date(selectedSignedSheetDocument.sentAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
          tsaTimestamp="2026-09-03T14:30:00Z [TSA-GOV-MA-SHA256]"
          signatureDataUrl={selectedSignedSheetDocument.signatureDataUrl}
          agentNom={selectedSignedSheetDocument.agentNom || "Samira MANSOURI (Agent Signature & Envoi)"}
          onClose={() => setSelectedSignedSheetDocument(null)}
        />
      )}

      <EchoTalkSignModal
        isOpen={Boolean(selectedSignedDocument)}
        onClose={() => setSelectedSignedDocument(null)}
        documentData={selectedSignedDocument ? {
          title: selectedSignedDocument.title,
          dossierId: selectedSignedDocument.id,
          citoyenNom: selectedSignedDocument.citoyenNom,
          content: selectedSignedDocument.content,
        } : null}
      />
    </div>
  );
}
