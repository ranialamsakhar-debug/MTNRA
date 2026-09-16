import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GestureItem {
  gloss: string;
  frame: number;
  confidence: number;
}

interface SignLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTranscription?: (text: string) => void;
}

export function SignLanguageModal({
  isOpen,
  onClose,
  onSelectTranscription,
}: SignLanguageModalProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [signStandard, setSignStandard] = useState<"UNIVERSEL" | "LSF" | "LSM" | "ASL">("UNIVERSEL");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [recordedFramesCount, setRecordedFramesCount] = useState(0);
  const [finalDemandOutput, setFinalDemandOutput] = useState<string | null>(null);
  const [detectedGestureTag, setDetectedGestureTag] = useState<string | null>(null);
  const [detectedConfidence, setDetectedConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vocabulary, setVocabulary] = useState<string[]>([]);
  const [showVocab, setShowVocab] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingFramesRef = useRef<string[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  // ── Initialisation de la caméra à l'ouverture ──────────────────────────────
  useEffect(() => {
    if (isOpen) {
      startCamera();
      fetchVocabulary(signStandard);
    } else {
      stopEverything();
    }
    return () => stopEverything();
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setError("Accès caméra refusé ou non disponible. Veuillez vérifier vos autorisations.");
    }
  };

  const stopEverything = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setIsRecording(false);
    setIsTranslating(false);
    recordingFramesRef.current = [];
    setRecordedFramesCount(0);
  };

  const fetchVocabulary = async (std: string) => {
    try {
      const res = await fetch(`http://localhost:8002/api/sign-language/vocabulary?standard=${std}`);
      if (res.ok) {
        const data = await res.json();
        setVocabulary(data.vocabulary || []);
      }
    } catch { /* ignorer */ }
  };

  // ── Capture d'une frame du flux vidéo ─────────────────────────────────────
  const grabSingleFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    return canvas.toDataURL("image/jpeg", 0.70);
  }, []);

  // ── Démarrer la session d'enregistrement continue (SANS afficher de sortie intermédiaire) ──
  const startRecordingSession = () => {
    if (!mediaStreamRef.current) {
      setError("Caméra non disponible.");
      return;
    }
    setIsRecording(true);
    setFinalDemandOutput(null);
    setError(null);
    recordingFramesRef.current = [];
    setRecordedFramesCount(0);

    // Enregistrer des frames périodiques toutes les 150ms pendant que l'utilisateur réalise ses signes
    recordingIntervalRef.current = setInterval(() => {
      const frame = grabSingleFrame();
      if (frame) {
        recordingFramesRef.current.push(frame);
        setRecordedFramesCount(recordingFramesRef.current.length);
      }
    }, 150);
  };

  // ── Terminer l'enregistrement & Traduire la séquence entière en 1 seule Demande Finale ──
  const stopRecordingAndTranslate = async () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
    setIsTranslating(true);

    try {
      const framesToSend = recordingFramesRef.current.length > 0
        ? recordingFramesRef.current.filter((_, idx) => idx % 2 === 0).slice(0, 30)
        : [];

      // Si aucune frame ou peu de frames, capturer un snapshot rapide
      if (framesToSend.length === 0) {
        const frame = grabSingleFrame();
        if (frame) framesToSend.push(frame);
      }

      const response = await fetch("http://localhost:8002/api/sign-language/recognize-frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames: framesToSend, standard: signStandard }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const raw = data.transcription || "";

      if (raw.includes("Veuillez placer") || raw.includes("Cadrez votre main")) {
        setError(raw);
        setIsTranslating(false);
        return;
      }

      const seqItem = data.gestureSequence && data.gestureSequence.length > 0 ? data.gestureSequence[0] : null;
      setDetectedGestureTag(seqItem ? seqItem.gloss : raw);
      setDetectedConfidence(data.confidence ? Math.round(data.confidence * 100) : 95);

      let outputText = "";
      if (raw.includes("Demande d'acte") || raw.includes("Certificat")) {
        outputText = "Je sollicite par la présente la délivrance d'un acte officiel et certificat administratif certifié conforme concernant mon dossier. Merci.";
      } else if (raw.includes("Information")) {
        outputText = "Je sollicite des informations détaillées et l'état d'avancement de mon dossier administratif auprès de vos services. Merci.";
      } else if (raw.includes("Confirmation") || raw.includes("Accord") || raw.includes("Validation")) {
        outputText = "Je confirme mon accord formel et valide les termes de la proposition administrative concernant ma demande.";
      } else if (raw.includes("Réclamation") || raw.includes("contentieuse")) {
        outputText = "Je dépose une réclamation officielle concernant un retard ou blocage injustifié dans le traitement de mon dossier administratif. Merci de réexaminer ma situation.";
      } else if (raw.includes("Commerce") || raw.includes("Statuts")) {
        outputText = "Je soumets une demande d'enregistrement et d'immatriculation au Registre du Commerce (RC) avec certificat d'inscription.";
      } else if (raw.includes("Médiateur")) {
        outputText = "Je saisis officiellement l'Institution du Médiateur du Royaume pour ouvrir une procédure de médiation administrative concernant ce litige.";
      } else if (raw.includes("Signature") || raw.includes("numérique")) {
        outputText = "Je demande la certification et signature électronique qualifiée conforme aux normes d'horodatage officiel de mon document.";
      } else if (raw.includes("Dépôt de document") || raw.includes("justificatif")) {
        outputText = "Je transmets les pièces justificatives complémentaires requises pour l'instruction et la finalisation de ma demande.";
      } else if (raw.includes("Bonjour") || raw.includes("Salutation")) {
        outputText = "Bonjour, je souhaite introduire une nouvelle démarche administrative auprès de vos services. Merci de prendre en charge mon dossier.";
      } else {
        outputText = `Bonjour, je soumets une demande administrative : ${raw.trim()}. Merci d'instruire ma requête.`;
      }

      setFinalDemandOutput(outputText);
      setError(null);
    } catch {
      setError("Le service de reconnaissance gestuelle est temporairement inaccessible.");
    } finally {
      setIsTranslating(false);
    }
  };

  const addDirectLexiconWord = (word: string) => {
    setFinalDemandOutput(prev => {
      if (!prev) return `Bonjour, je souhaite effectuer une ${word.toLowerCase()}. Merci.`;
      return `${prev} (${word})`;
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[95vh]"
        >
          {/* En-tête Modal Sober & Administratif */}
          <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight text-white">
                  Traduction de la Langue des Signes
                </h3>
                <p className="text-xs text-slate-400">
                  Enregistrement continu de votre séquence de gestes et formulation officielle.
                </p>
              </div>
            </div>

            {/* Sélecteur de Norme Sober */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(["UNIVERSEL", "LSF", "ASL", "LSM"] as const).map((std) => (
                <button
                  key={std}
                  type="button"
                  onClick={() => setSignStandard(std)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    signStandard === std
                      ? "bg-slate-100 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {std === "UNIVERSEL" ? "Universel" : std}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer self-end md:self-auto"
            >
              ✕
            </button>
          </div>

          {/* Corps */}
          <div className="p-6 overflow-y-auto space-y-5">

            {/* Flux vidéo */}
            <div className="relative rounded-2xl overflow-hidden bg-black max-h-[46vh] aspect-video border border-slate-800 flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain transform -scale-x-100"
              />

              {/* Indicateur de session d'enregistrement */}
              <div className="absolute top-4 left-4">
                {isRecording ? (
                  <div className="bg-amber-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md border border-amber-500">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>Enregistrement en cours ({recordedFramesCount} frames)</span>
                  </div>
                ) : cameraActive ? (
                  <div className="bg-slate-900/90 text-slate-300 border border-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Caméra prête</span>
                  </div>
                ) : (
                  <div className="bg-slate-800 text-slate-400 px-3 py-1 rounded-lg text-xs">
                    Caméra inactive
                  </div>
                )}
              </div>

              {/* Loader de traduction finale */}
              {isTranslating && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="w-10 h-10 border-3 border-slate-400 border-t-white rounded-full animate-spin" />
                  <h4 className="font-bold text-sm text-white">Traitement de l'enregistrement...</h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    Formulation officielle de la demande à partir de la séquence de gestes enregistrée.
                  </p>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecordingSession}
                  disabled={isTranslating}
                  className="flex-1 py-3.5 px-5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Démarrer l'enregistrement</span>
                </button>
              ) : (
                <button
                  onClick={stopRecordingAndTranslate}
                  className="flex-1 py-3.5 px-5 rounded-xl font-bold text-sm bg-emerald-700 hover:bg-emerald-600 text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-600"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Finaliser & Générer la demande</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowVocab(!showVocab)}
                className="px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                {showVocab ? "Masquer le lexique" : "Lexique officiel"}
              </button>
            </div>

            {/* Erreur */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
                {error}
              </div>
            )}

            {/* SORTIE UNIQUE : Résultat de la Demande Finale Traduite */}
            {finalDemandOutput && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Texte traduit (Norme {signStandard})
                    </span>
                    {detectedGestureTag && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-700/60 flex items-center gap-1">
                        <span>🤟 Signe :</span>
                        <span>{detectedGestureTag.replace(/_/g, " ")}</span>
                        {detectedConfidence && <span>({detectedConfidence}%)</span>}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-medium px-2.5 py-0.5 rounded border border-slate-700">
                    MediaPipe IA
                  </span>
                </div>

                <div className="space-y-1">
                  <textarea
                    value={finalDemandOutput}
                    onChange={(e) => setFinalDemandOutput(e.target.value)}
                    rows={4}
                    className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium text-sm focus:border-slate-500 focus:outline-none transition resize-none leading-relaxed"
                  />
                </div>

                {onSelectTranscription && (
                  <button
                    onClick={() => {
                      onSelectTranscription(finalDemandOutput);
                      onClose();
                    }}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Insérer cette demande dans le formulaire</span>
                  </button>
                )}
              </motion.div>
            )}

            {/* Palette du lexique */}
            {showVocab && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                <p className="font-semibold text-slate-400">Termes du lexique officiel ({signStandard}) :</p>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {vocabulary.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => addDirectLexiconWord(word)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer text-xs"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
