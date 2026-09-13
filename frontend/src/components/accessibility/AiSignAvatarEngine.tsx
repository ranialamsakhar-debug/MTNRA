import React, { useEffect, useState } from "react";
import { convertDocumentToSiGML, SiGMLConversionResult, SiGMLItem } from "../../services/sigmlConverter";
import { ThreeDHumanAvatar, GestureMotionType, CameraPreset } from "./ThreeDHumanAvatar";

interface AiSignAvatarEngineProps {
  documentText: string;
  documentTitle?: string;
  signStandard?: string;
  speed?: number;
  isPlaying?: boolean;
  onSequenceComplete?: () => void;
}

const MOTION_LIST: GestureMotionType[] = [
  "couronne",
  "etoile",
  "salut-solennel",
  "tampon-main",
  "livre-ouvert",
  "pouce-haut",
  "demande-soumettre",
  "main-coeur",
  "v-victoire",
  "sceau-droit",
  "ecriture-paume",
  "clock-tsa",
  "main-bouche",
  "comptage-doigts",
  "bras-croises",
];

/**
 * Normalizes text and maps ANY document word / gloss to a unique 3D gesture motion
 */
function mapGlossToMotion(gloss: string, index: number = 0): GestureMotionType {
  if (!gloss) return "neutre";
  
  // Normalize string (remove accents, uppercase)
  const norm = gloss
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (norm.includes("ROYAUME")) return "couronne";
  if (norm.includes("MAROC")) return "etoile";
  if (norm.includes("MINIST")) return "salut-solennel";
  if (norm.includes("DECIS") || norm.includes("AUTORIS")) return "tampon-main";
  if (norm.includes("ACTE") || norm.includes("ARTICL") || norm.includes("DOCUMENT")) return "livre-ouvert";
  if (norm.includes("ACCEPT") || norm.includes("APPROUV") || norm.includes("VALIDE")) return "pouce-haut";
  if (norm.includes("DEMAND") || norm.includes("RECLAMATION")) return "demande-soumettre";
  if (norm.includes("CITOY") || norm.includes("PERSONNE")) return "main-coeur";
  if (norm.includes("SIGNAT") || norm.includes("EPELLATION")) return "ecriture-paume";
  if (norm.includes("HORODAT") || norm.includes("TSA") || norm.includes("DATE")) return "clock-tsa";
  if (norm.includes("SECRET") || norm.includes("PAROLE") || norm.includes("DECRET")) return "main-bouche";
  if (norm.includes("COMPTE") || norm.includes("NOMBRE") || norm.includes("CHIFFRE")) return "comptage-doigts";
  if (norm.includes("INTERDIT") || norm.includes("BLOCAGE") || norm.includes("STOP")) return "bras-croises";

  // Deterministic fallback based on word content & index so EVERY single word moves the avatar!
  let charHash = 0;
  for (let i = 0; i < norm.length; i++) {
    charHash += norm.charCodeAt(i);
  }
  const motionIndex = (charHash + index) % MOTION_LIST.length;
  return MOTION_LIST[motionIndex];
}

/**
 * AI-Generated 3D Avatar Engine for Administrative Document Translation
 */
export const AiSignAvatarEngine: React.FC<AiSignAvatarEngineProps> = ({
  documentText,
  documentTitle = "Acte Administratif Officiel Signé par l'Agent",
  signStandard = "LSM",
  speed: initialSpeed = 1.0,
  isPlaying: initialIsPlaying = true,
  onSequenceComplete,
}) => {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("upper");
  const [sigmlResult, setSigmlResult] = useState<SiGMLConversionResult | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(initialIsPlaying);
  const [speed, setSpeed] = useState(initialSpeed);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Convert document text into SiGML sequence
  useEffect(() => {
    const converted = convertDocumentToSiGML(documentText || "");
    setSigmlResult(converted);
    setCurrentIdx(0);
  }, [documentText]);

  // Continuous Playback Loop over Document Sentences & Glosses
  useEffect(() => {
    if (!isPlaying || !sigmlResult || sigmlResult.sequence.length === 0) return;

    const currentItem = sigmlResult.sequence[currentIdx];
    const durationMs = Math.max(650, (currentItem.duration * 1000) / speed);

    const timer = setTimeout(() => {
      if (currentIdx < sigmlResult.sequence.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        // Continuous loop over document text
        setCurrentIdx(0);
        if (onSequenceComplete) onSequenceComplete();
      }
    }, durationMs);

    return () => clearTimeout(timer);
  }, [currentIdx, isPlaying, speed, sigmlResult]);

  const sequence = sigmlResult?.sequence || [];
  const currentItem = sequence[currentIdx];
  const activeMotion: GestureMotionType = currentItem
    ? mapGlossToMotion(currentItem.gloss, currentIdx)
    : "neutre";

  return (
    <div className="w-full flex flex-col items-center gap-4 font-sans">
      {/* Lecteur Vidéo Avatar 3D Stage */}
      <div 
        className={`w-full ${isFullscreen ? "fixed inset-0 z-[999999] h-screen bg-slate-950 p-6" : "h-[660px] rounded-3xl bg-slate-950"} border-2 border-amber-500/40 relative overflow-hidden flex flex-col items-center justify-between p-4 shadow-2xl transition-all duration-300`}
      >
        {/* Barre Supérieure du Lecteur Vidéo */}
        <div className="w-full flex items-center justify-between z-10 bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-black text-amber-300 tracking-wide uppercase">
              🎬 TRADUCTION DYNAMIQUE EN LANGUE DES SIGNES (AVATAR 3D GLB DIRECT)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-md"
            >
              {isFullscreen ? "↙️ Réduire" : "⛶ Plein Écran"}
            </button>
          </div>
        </div>

        {/* Scene 3D WebGL Avatar Render Engine */}
        <div className="relative w-full h-full my-2 rounded-2xl overflow-hidden shadow-inner bg-slate-950 border border-slate-900">
          <ThreeDHumanAvatar
            motion={activeMotion}
            glossText={currentItem?.gloss}
            speed={speed}
            isPlaying={isPlaying}
            cameraPreset={cameraPreset}
            avatarUrl="/model.glb"
            showControls={true}
            isFullWindow={isFullscreen}
          />
        </div>

        {/* Console de Contrôle de Lecture Interactif */}
        <div className="w-full z-10 bg-slate-900/95 backdrop-blur-md border border-amber-500/50 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl">
          
          {/* Barre de Progression des Signes */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 flex">
            {sequence.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                style={{ width: `${100 / sequence.length}%` }}
                className={`h-full cursor-pointer transition-all ${
                  idx === currentIdx
                    ? "bg-amber-400 shadow-lg shadow-amber-500/50"
                    : idx < currentIdx
                    ? "bg-emerald-500/60"
                    : "bg-slate-800"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Infos du Geste Courant */}
            {currentItem && (
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md">
                  Mot {currentIdx + 1} / {sequence.length}
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider leading-none mb-0.5">
                    Geste SiGML Traduit ({signStandard}) :
                  </span>
                  <span className="text-base font-black text-amber-300 tracking-wide">
                    {currentItem.gloss}
                  </span>
                </div>
              </div>
            )}

            {/* Boutons de Contrôle Play/Pause/Prev/Next */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 font-bold text-xs transition cursor-pointer"
              >
                ◀ Geste Précédent
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-4 py-1.5 rounded-xl font-black text-xs transition cursor-pointer shadow-md ${
                  isPlaying ? "bg-amber-500 text-slate-950 hover:bg-amber-400" : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                }`}
              >
                {isPlaying ? "⏸ Pause" : "▶ Jouer Traduction"}
              </button>

              <button
                onClick={() => setCurrentIdx((prev) => Math.min(sequence.length - 1, prev + 1))}
                disabled={currentIdx >= sequence.length - 1}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 font-bold text-xs transition cursor-pointer"
              >
                Geste Suivant ▶
              </button>
            </div>

            {/* Vitesse de Lecture */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 font-bold px-1.5">Vitesse:</span>
              {[0.75, 1.0, 1.25, 1.5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    speed === s ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Description du Geste d'Administration */}
          {currentItem && (
            <div className="text-xs text-slate-300 font-medium bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <span>💡 <strong className="text-amber-300">Description du Geste :</strong> {currentItem.description}</span>
              <span className="text-[10px] text-emerald-400 font-mono">Code SiGML: &lt;hns_sign gloss="{currentItem.gloss}"&gt;</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
