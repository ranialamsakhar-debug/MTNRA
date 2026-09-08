import { motion } from "framer-motion";

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Barre d'outils supérieure */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 text-slate-200 text-xs font-bold px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1.5">
              <span>📜</span> Document Officiel Approuvé & Signé
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition-all flex items-center gap-1.5 border border-slate-700"
            >
              <span>🖨️</span> Imprimer / Enregistrer PDF
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Feuille de décision officielle imprimable */}
        <div className="p-8 md:p-12 space-y-8 bg-slate-50/50 text-slate-900 relative print:p-0">
          
          {/* Filigrane d'authenticité haché en arrière-plan */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none font-black text-9xl text-slate-900 rotate-[-30deg]">
            TAWSA GOV
          </div>

          {/* En-tête Gouvernemental */}
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

          {/* Titre de l'Arrêté */}
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

          {/* Pied de page avec QR Code & Barcode */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <div>
              Vérification d'authenticité: https://tawsa.gov.ma/verify/{dossierId}
            </div>
            <div className="font-bold text-slate-800">
              RÉPUBLIQUE MAROCAINE • ACTE SÉCURISÉ NUMÉRIQUE
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
