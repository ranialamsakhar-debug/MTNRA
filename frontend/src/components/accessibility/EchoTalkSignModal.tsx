import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AiSignAvatarEngine } from "./AiSignAvatarEngine";
import { convertDocumentToSiGML, fetchSiGMLFromLsmApi, SiGMLConversionResult, SiGMLItem } from "../../services/sigmlConverter";

interface DocumentData {
  title: string;
  dossierId?: string;
  citoyenNom?: string;
  content: string;
}

interface EchoTalkSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData?: DocumentData | null;
}

export function EchoTalkSignModal({
  isOpen,
  onClose,
  documentData,
}: EchoTalkSignModalProps) {
  const [signStandard, setSignStandard] = useState<"LSM" | "LSF" | "ASL" | "UNIVERSEL">("LSM");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Document & Translation State
  const [activeDocTitle, setActiveDocTitle] = useState<string>("");
  const [documentContent, setDocumentContent] = useState<string>("");
  const [sigmlData, setSigmlData] = useState<SiGMLConversionResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Document officiel par défaut transmis par l'Agent de Signature et d'Envoi
  const defaultDocument: DocumentData = {
    title: "Décision Administrative - Permis d'Exploitation Commerciale Régionale",
    dossierId: "SIG-2026-0044",
    citoyenNom: "Rania LAMSAKHAR",
    content: `Royaume du Maroc. Ministère de la Transition Numérique et de la Réforme de l'Administration.
Décision Administrative d'Autorisation Officielle N° SIG-2026-0044.
ARTICLE 1ER — ACCEPTATION ET AUTORISATION DÉFINITIVE: La demande déposée par Rania LAMSAKHAR concernant le Permis d'Exploitation Commerciale Régionale est déclarée DÉFINITIVEMENT ACCEPTÉE ET APPROUVÉE.
ARTICLE 2 — DROITS ET EFFETS JURIDIQUES: Le présent acte vaut autorisation légale d'exécution avec Horodatage TSA certifié conforme.`,
  };

  // Traiter le document et générer la traduction en Langue des Signes
  const processDocumentText = async (text: string, title: string) => {
    setActiveDocTitle(title);
    setDocumentContent(text);
    const converted = await fetchSiGMLFromLsmApi(text, signStandard, "model");
    setSigmlData(converted);
    setIsPlaying(true);
  };

  // Chargement automatique du document à l'ouverture
  useEffect(() => {
    if (!isOpen) return;

    const docToLoad = documentData || defaultDocument;
    setUploadedFileName(null);
    processDocumentText(docToLoad.content, docToLoad.title);
  }, [isOpen, documentData, signStandard]);

  // Gestion du téléversement de document PDF/TXT par le citoyen ou l'agent
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || "";
      const textToUse = content.trim() || `Document : ${file.name}. Décision administrative officielle. Demande acceptée et validée.`;
      processDocumentText(textToUse, `Document : ${file.name}`);
      setIsUploading(false);
    };

    reader.onerror = () => {
      const textFallback = `Document ${file.name}. Décision administrative officielle. Demande acceptée et validée.`;
      processDocumentText(textFallback, `Document : ${file.name}`);
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[96vh]"
        >
          {/* En-tête Unifié TalkSign Avatar 3D */}
          <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#cda351] to-amber-600 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg border border-amber-300/40">
                🤟
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-white tracking-wide">
                    Echo 1.0 <span className="text-amber-400">TalkSign</span> — Avatar 3D Traducteur Officiel
                  </h3>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/40">
                    Traduction Directe Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {activeDocTitle}
                </p>
              </div>
            </div>

            {/* Sélecteur de Norme & Chargement de Fichier */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Normes de Langues */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(["LSM", "LSF", "ASL", "UNIVERSEL"] as const).map((std) => (
                  <button
                    key={std}
                    onClick={() => setSignStandard(std)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      signStandard === std
                        ? "bg-amber-500 text-slate-950 shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {std}
                  </button>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>📥</span>
                <span>{uploadedFileName ? "Document Chargé" : "Charger un Acte (PDF/TXT)"}</span>
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-300 flex items-center justify-center font-bold text-sm transition cursor-pointer ml-1"
                title="Fermer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Corps de la Modale — Uniquement le Moteur Avatar 3D Photoréaliste */}
          <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
            
            <AiSignAvatarEngine
              documentText={documentContent || defaultDocument.content}
              documentTitle={activeDocTitle || defaultDocument.title}
              signStandard={signStandard}
              speed={playbackSpeed}
              isPlaying={isPlaying}
              onSequenceComplete={() => setIsPlaying(true)}
            />

            {/* Extrait du Texte du Document Traduit */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                  📜 Contenu du Document Administratif Signé & Horodaté
                </span>
                <span className="text-[11px] text-emerald-400 font-mono font-bold">
                  Traduction Langue des Signes ({signStandard})
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                {documentContent || defaultDocument.content}
              </p>
            </div>

            {/* Barre de contrôle de lecture */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
              
              {/* Sélecteur de Vitesse */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                <span className="text-[11px] text-slate-500 mr-1">Vitesse :</span>
                {[0.5, 0.75, 1.0, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer ${
                      playbackSpeed === spd
                        ? "bg-amber-500 text-slate-950 font-black shadow"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Bouton Play / Pause */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-6 py-2.5 rounded-xl font-black text-xs transition shadow-lg flex items-center gap-2 cursor-pointer ${
                    isPlaying
                      ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                      : "bg-emerald-600 text-white hover:bg-emerald-500"
                  }`}
                >
                  <span>{isPlaying ? "Pause ⏸️" : "Lancer la Traduction ▶️"}</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 font-semibold">
                Durée estimée : <span className="text-amber-400 font-mono">{sigmlData?.totalDuration || 12}s</span>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
