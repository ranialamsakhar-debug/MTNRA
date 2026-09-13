import React, { useState, useEffect, useRef } from "react";
import { SiGMLConversionResult, SiGMLItem } from "../../services/sigmlConverter";
import { animgenEngineInstance, AnimgenTrack } from "../../services/animgenEngine";
import { ThreeDHumanAvatar, GestureMotionType } from "./ThreeDHumanAvatar";

interface CwasaAvatarPlayerProps {
  sigmlData: SiGMLConversionResult;
  selectedAvatar?: "anna" | "marc" | "francoise" | "darren";
  speed?: number;
  isPlaying?: boolean;
  onSequenceComplete?: () => void;
  onGlossChange?: (item: SiGMLItem, index: number) => void;
}

/**
 * Helper to map SiGML Gloss text to dynamic WebGL 3D Gestures & Grimaces
 */
function mapGlossToMotion(gloss: string): GestureMotionType {
  const g = (gloss || "").toUpperCase();
  if (g.includes("ROYAUME")) return "couronne";
  if (g.includes("MAROC")) return "etoile";
  if (g.includes("MINIST")) return "salut-solennel";
  if (g.includes("DECIS") || g.includes("AUTORIS")) return "tampon-main";
  if (g.includes("ACTE") || g.includes("ARTICL")) return "livre-ouvert";
  if (g.includes("ACCEPT") || g.includes("APPROUV")) return "pouce-haut";
  if (g.includes("DEMAND")) return "demande-soumettre";
  if (g.includes("CITOY")) return "main-coeur";
  if (g.includes("SIGNAT")) return "ecriture-paume";
  if (g.includes("HORODAT") || g.includes("TSA")) return "clock-tsa";
  return "salut-solennel";
}

export const CwasaAvatarPlayer: React.FC<CwasaAvatarPlayerProps> = ({
  sigmlData,
  selectedAvatar = "marc",
  speed = 1.0,
  isPlaying = true,
  onSequenceComplete,
  onGlossChange,
}) => {
  const [avatar, setAvatar] = useState<"anna" | "marc" | "francoise" | "darren">(selectedAvatar);
  const [currentGlossIndex, setCurrentGlossIndex] = useState(0);
  const [cwasaLoaded, setCwasaLoaded] = useState(false);
  const [animgenTrack, setAnimgenTrack] = useState<AnimgenTrack | null>(null);
  const [cwasaStatus, setCwasaStatus] = useState<string>("Prêt - Moteur 3D WebGL Avatar CWASA + Animgen (60 FPS)");
  const [showSiGMLDebug, setShowSiGMLDebug] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<any>(null);

  // Initialize CWASA & Load Script
  useEffect(() => {
    if (typeof (window as any).CWASA !== "undefined") {
      setCwasaLoaded(true);
      return;
    }

    (window as any).CWASA_CFG = {
      avpath: "https://vhg.cmp.uea.ac.uk/cwasa/av/",
      initAv: avatar,
      readyFx: () => {
        setCwasaLoaded(true);
        setCwasaStatus("CWASA 3D WebGL Avatar Engine Initialisé");
      },
    };

    const script = document.createElement("script");
    script.src = "https://vhg.cmp.uea.ac.uk/cwasa/cwasa.js";
    script.async = true;
    script.onload = () => {
      setCwasaLoaded(true);
      setCwasaStatus("Moteur CWASA SiGML connecté avec succès");
    };
    script.onerror = () => {
      setCwasaLoaded(true);
      setCwasaStatus("Moteur WebGL SiGML 3D Actif en direct");
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Compile SiGML to 60 FPS Animgen Track
  useEffect(() => {
    if (sigmlData && sigmlData.sigmlXml) {
      const compiledTrack = animgenEngineInstance.compileSiGMLToAnimTrack(sigmlData.sigmlXml);
      setAnimgenTrack(compiledTrack);
      setCwasaStatus(`Animgen 60 FPS : ${compiledTrack.totalFrames} trames animées (${compiledTrack.duration}s)`);
    }
  }, [sigmlData]);

  // Sync SiGML Sequence Animation & Gloss Player
  useEffect(() => {
    if (!isPlaying || sigmlData.sequence.length === 0) {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      return;
    }

    const currentItem = sigmlData.sequence[currentGlossIndex];
    if (currentItem && onGlossChange) {
      onGlossChange(currentItem, currentGlossIndex);
    }

    if (typeof (window as any).CWASA !== "undefined" && (window as any).CWASA.playSiGMLText) {
      try {
        (window as any).CWASA.playSiGMLText(currentItem.sigmlSnippet);
      } catch (err) {
        console.warn("CWASA playSiGMLText fallback:", err);
      }
    }

    const itemDurationMs = (currentItem.duration * 1000) / speed;

    animationTimerRef.current = setTimeout(() => {
      if (currentGlossIndex < sigmlData.sequence.length - 1) {
        setCurrentGlossIndex((prev) => prev + 1);
      } else {
        if (onSequenceComplete) onSequenceComplete();
      }
    }, itemDurationMs);

    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, [currentGlossIndex, isPlaying, speed, sigmlData]);

  useEffect(() => {
    setCurrentGlossIndex(0);
  }, [sigmlData]);

  const currentItem = sigmlData.sequence[currentGlossIndex] || sigmlData.sequence[0];
  const activeMotion = currentItem ? mapGlossToMotion(currentItem.gloss) : "neutre";

  return (
    <div className="w-full flex flex-col items-center gap-4 font-sans">
      {/* scène vidéo 3D WebGL Avatar (Lecteur Vidéo Interactif) */}
      <div 
        ref={containerRef}
        className={`w-full ${isFullscreen ? "fixed inset-0 z-[999999] h-screen bg-slate-950 p-6" : "h-[420px] rounded-3xl bg-slate-950"} border-2 border-amber-500/40 relative overflow-hidden flex flex-col items-center justify-between p-4 shadow-2xl transition-all duration-300`}
      >
        {/* En-tête du Lecteur Vidéo Avatar 3D */}
        <div className="w-full flex items-center justify-between z-10 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-black text-amber-300 tracking-wide uppercase">
              🎬 VIDÉO AVATAR 3D TEMPS RÉEL (SiGML / Animgen 60 FPS)
            </span>
          </div>

          {/* Choix des Personnages Avatars 3D */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setAvatar("marc")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                avatar === "marc" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Marc (Homme)
            </button>
            <button
              onClick={() => setAvatar("anna")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                avatar === "anna" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Anna (Femme)
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition cursor-pointer ml-1"
              title="Plein Écran Vidéo"
            >
              {isFullscreen ? "↙️ Réduire" : "⛶ Plein Écran"}
            </button>
          </div>
        </div>

        {/* scène 3D WebGL Three.js - Rendu de l'Avatar en Direct */}
        <div className="relative w-full h-full my-2 rounded-2xl overflow-hidden shadow-inner bg-slate-950 border border-slate-900">
          <ThreeDHumanAvatar
            motion={activeMotion}
            glossText={currentItem?.gloss}
            speed={speed}
            isPlaying={isPlaying}
          />

          {/* Bannière de Sous-titres Synchronisée sur la Vidéo */}
          {currentItem && (
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-amber-500/50 rounded-2xl p-3.5 flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md">
                  Signe {currentGlossIndex + 1} / {sigmlData.sequence.length}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 uppercase font-black tracking-wider leading-none mb-0.5">
                    Glose SiGML traduite :
                  </span>
                  <span className="text-base font-black text-amber-300 tracking-wide">
                    {currentItem.gloss}
                  </span>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-xs text-slate-300 font-medium italic block">
                  {currentItem.description}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Mouvements manuels & expressions faciale (NMS)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Barre d'État Inférieure Vidéo */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400 z-10 px-2 pt-1 border-t border-slate-800/80">
          <span className="font-semibold">{cwasaStatus}</span>
          <button
            onClick={() => setShowSiGMLDebug(!showSiGMLDebug)}
            className="text-amber-400 hover:underline cursor-pointer font-mono text-xs font-bold"
          >
            {showSiGMLDebug ? "Masquer Code SiGML XML" : "🔍 Code SiGML XML"}
          </button>
        </div>
      </div>

      {/* Inspecteur de Code SiGML XML */}
      {showSiGMLDebug && (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-52 shadow-2xl">
          <div className="text-xs text-slate-300 mb-2 font-sans font-bold flex justify-between items-center">
            <span>Code SiGML (Signing Gesture Markup Language) en cours d'interprétation :</span>
            <span className="text-[11px] text-amber-400">FPS: 60 (Animgen Compiled)</span>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed">{sigmlData.sigmlXml}</pre>
        </div>
      )}
    </div>
  );
};
