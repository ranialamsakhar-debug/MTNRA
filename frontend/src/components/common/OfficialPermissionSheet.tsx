import { useState } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { EchoTalkSignModal } from "../accessibility/EchoTalkSignModal";

interface OfficialPermissionSheetProps {
  dossierId: string;
  citoyenNom: string;
  cni?: string;
  titre: string;
  dateSignature?: string;
  tsaTimestamp?: string;
  signatureDataUrl?: string | null;
  agentNom?: string;
  onClose?: () => void;
}

export function OfficialPermissionSheet({
  dossierId,
  citoyenNom,
  cni = "AI225",
  titre,
  dateSignature = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }),
  tsaTimestamp = "2026-09-03T14:30:00Z [TSA-GOV-MA-SHA256]",
  signatureDataUrl,
  agentNom = "Samira MANSOURI (Agent Signature & Envoi)",
  onClose
}: OfficialPermissionSheetProps) {

  const defaultHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const [isEchoTalkSignOpen, setIsEchoTalkSignOpen] = useState(false);

  // Génération / Impression / Enregistrement PDF natif avec le design identique du site
  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    document.title = `Acte_Officiel_${dossierId}_Tawsa`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const documentContentText = `Royaume du Maroc. Ministère de la Transition Numérique et de la Réforme de l'Administration.
Plateforme Nationale Tawsa • Service Central des Actes Numériques.
Décision Administrative d'Autorisation Officielle N° ${dossierId}. Date: ${dateSignature}.
ARTICLE 1ER — ACCEPTATION ET AUTORISATION DÉFINITIVE: La demande déposée par ${citoyenNom} (CNI: ${cni}) concernant « ${titre} » est déclarée DÉFINITIVEMENT ACCEPTÉE ET APPROUVÉE.
ARTICLE 2 — DROITS ET EFFETS JURIDIQUES: Le présent acte vaut autorisation légale d'exécution. Horodatage TSA: ${tsaTimestamp}.`;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto p-4 md:p-6 bg-slate-900/80 backdrop-blur-md font-sans print:p-0 print:bg-white flex justify-center items-start">
      <motion.div
        initial={{ opacity: 1, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 md:my-10 print:my-0 print:shadow-none print:border-none print:w-full print:max-w-none relative"
      >
        {/* Barre d'outils supérieure fixe (Sticky) avec boutons Télécharger PDF, Avatar Echo 1.0 et Fermer */}
        <div className="bg-slate-900 text-white p-4 px-6 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 print:hidden border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 text-slate-200 text-xs font-bold px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1.5">
              <span>📜</span> Document Officiel Signé (Format PDF)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Bouton Traduction Avatar Echo 1.0 */}
            <button
              onClick={() => setIsEchoTalkSignOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer border border-amber-300"
            >
              <span>🤟</span> Traduire via Avatar Echo 1.0
            </button>

            {/* Bouton Enregistrer au Format PDF Identique */}
            <button
              onClick={handleDownloadPDF}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow transition-all flex items-center gap-1.5 border border-emerald-500 cursor-pointer"
            >
              <span>📥</span> Enregistrer au Format PDF
            </button>

            {/* Bouton Fermer */}
            {onClose && (
              <button
                onClick={onClose}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow transition-all flex items-center gap-1 cursor-pointer border border-red-500 ml-1"
                title="Fermer la fenêtre du document"
              >
                <span>✕</span> Fermer
              </button>
            )}
          </div>
        </div>

        {/* Feuille de décision officielle (Rendu visuel exact conservé pour le PDF) */}
        <div id="official-document-render" className="p-8 md:p-12 space-y-8 bg-slate-50/50 text-slate-900 relative print:p-6 print:bg-white">
          
          {/* Filigrane d'authenticité haché en arrière-plan */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none font-black text-9xl text-slate-900 rotate-[-30deg]">
            TAWSA GOV
          </div>

          {/* En-tête Gouvernemental Officiel */}
          <div className="text-center border-b-2 border-slate-900 pb-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-widest">
              <div>Royaume du Maroc</div>
              <div className="text-lg text-slate-900">🇲🇦</div>
              <div>المملكة المغربية</div>
            </div>
            <h1 className="text-lg md:text-xl font-extrabold uppercase text-slate-900 tracking-tight">
              Ministère de la Transition Numérique et de la Réforme de l'Administration
            </h1>
            <p className="text-xs font-semibold text-slate-600">
              Plateforme Nationale Tawsa • Service Central des Actes Numériques
            </p>
          </div>

          {/* Bannière d'Accessibilité - Avatar Traducteur Echo 1.0 (Directement visible dans le corps du document) */}
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm print:hidden">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2.5 bg-amber-100/80 rounded-2xl border border-amber-200">🤟</span>
              <div>
                <h4 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider">
                  Traduction par Avatar IA (Echo 1.0 TalkSign)
                </h4>
                <p className="text-[11px] text-amber-900 font-semibold mt-0.5">
                  Voir l'avatar animé traduire les articles de cet acte officiel en direct (LSM / LSF / ASL / Universel).
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEchoTalkSignOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow transition cursor-pointer border border-amber-400 shrink-0 self-start sm:self-auto"
            >
              🤟 Lancer l'Avatar Traducteur
            </button>
          </div>

          {/* Titre de l'Arrêté Officiel */}
          <div className="text-center space-y-2 py-2">
            <span className="inline-block bg-slate-900 text-white font-extrabold text-xs px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
              Décision Administrative d'Autorisation Officielle
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 pt-2">
              {titre}
            </h2>
            <p className="text-xs font-semibold text-slate-500 font-mono">
              N° Acte: <span className="text-slate-900 font-bold">{dossierId}</span> • Date: {dateSignature}
            </p>
          </div>

          {/* Corps du texte de permission / d'acceptation */}
          <div className="space-y-4 text-sm leading-relaxed text-slate-800 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="font-bold">
              Le Ministre de la Transition Numérique et de la Réforme de l'Administration,
            </p>

            <p className="text-slate-700">
              Vu la constitution du Royaume du Maroc ;<br />
              Vu le décret portant organisation de la plateforme nationale d'accès aux services publics numérisés (Tawsa) ;<br />
              Après vérification de l'identité numérique et instruction de la demande par les services habilités :
            </p>

            <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 text-slate-900 space-y-2">
              <h3 className="font-extrabold uppercase text-xs tracking-wider text-slate-900">
                ARTICLE 1ER — ACCEPTATION ET AUTORISATION DÉFINITIVE
              </h3>
              <p className="font-medium text-xs leading-normal">
                La demande déposée par <strong className="font-extrabold text-slate-900">{citoyenNom}</strong> (CNI: <strong className="font-mono">{cni}</strong>) concernant <strong>« {titre} »</strong> est déclarée <strong className="font-black text-slate-900">DÉFINITIVEMENT ACCEPTÉE ET APPROUVÉE</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 space-y-1">
              <h3 className="font-extrabold uppercase text-xs tracking-wider text-slate-800">
                ARTICLE 2 — DROITS ET EFFETS JURIDIQUES
              </h3>
              <p className="text-xs text-slate-600 leading-normal">
                Le présent acte vaut autorisation légale d'exécution. Il fait foi devant toutes les administrations publiques, organismes financiers et institutions partenaires sur l'ensemble du territoire national.
              </p>
            </div>
          </div>

          {/* Section Cachet Officiel Haché & Signature Dessinée à la Souris */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-200 items-end">
            
            {/* Cachet Officiel d'État Haché */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                {/* SVG Sceau Officiel Haché */}
                <svg className="w-20 h-20 text-slate-900" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="6 3" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="32" fill="#f8fafc" stroke="currentColor" strokeWidth="1" />
                  <text x="50" y="32" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#0f172a">ROYAUME DU MAROC</text>
                  <text x="50" y="52" textAnchor="middle" fontSize="8" fontWeight="black" fill="#0f172a">TAWSA</text>
                  <text x="50" y="62" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#0f172a">SCEAU OFFICIEL</text>
                  <text x="50" y="74" textAnchor="middle" fontSize="4.5" fill="#0f172a">SHA-256 VERIFIED</text>
                </svg>
              </div>

              <div className="space-y-1 text-xs">
                <span className="font-extrabold text-slate-900 uppercase tracking-wider block text-[10px]">
                  ✓ Cachet Officiel d'État Haché
                </span>
                <p className="font-mono text-[9px] text-slate-500 break-all leading-tight">
                  Hash: {defaultHash.substring(0, 32)}...
                </p>
                <p className="text-[10px] text-slate-600 font-semibold">
                  Horodatage TSA : <span className="font-mono text-[9px]">{tsaTimestamp}</span>
                </p>
              </div>
            </div>

            {/* Signature Manuscrite Dessinée à la Souris */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Signature Manuscrite de l'Agent Habilité
              </span>

              <div className="h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner p-1">
                {signatureDataUrl ? (
                  <img src={signatureDataUrl} alt="Signature Dessinée à la Souris" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-xs font-bold italic text-slate-900 font-serif">
                    Samira MANSOURI
                  </div>
                )}
              </div>

              <p className="text-[11px] font-semibold text-slate-600">
                {agentNom}
              </p>
            </div>
          </div>

          {/* Pied de page avec QR Code, Boutons d'Action et Lien de fermeture */}
          <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
            <div className="text-[10px] text-slate-500">
              Vérification d'authenticité: https://tawsa.gov.ma/verify/{dossierId}
            </div>

            <div className="flex items-center gap-3 print:hidden">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <span>📥</span> Enregistrer au Format PDF
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <span>✕</span> Fermer la feuille
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modale Traducteur Avatar Echo 1.0 */}
      <EchoTalkSignModal
        isOpen={isEchoTalkSignOpen}
        onClose={() => setIsEchoTalkSignOpen(false)}
        documentData={{
          title: `Décision Officielle - ${titre}`,
          dossierId: dossierId,
          citoyenNom: citoyenNom,
          content: documentContentText,
        }}
      />
    </div>,
    document.body
  );
}
