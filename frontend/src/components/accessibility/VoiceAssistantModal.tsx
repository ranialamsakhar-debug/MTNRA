import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTranscription?: (text: string) => void;
}

export function VoiceAssistantModal({
  isOpen,
  onClose,
  onSelectTranscription,
}: VoiceAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<"stt" | "tts">("stt");
  const [language, setLanguage] = useState("fr");

  // État STT (Dictée)
  const [isRecording, setIsRecording] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);
  const [sttTranscription, setSttTranscription] = useState<string | null>(null);
  const [sttError, setSttError] = useState<string | null>(null);

  // État TTS (Synthèse)
  const [ttsText, setTtsText] = useState(
    "Bienvenue sur la plateforme Tawsa. Déposez vos réclamations et suivez l'état de vos dossiers en ligne."
  );
  const [ttsVoice, setTtsVoice] = useState("fr-FR-HenriNeural");
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // ── STT : Démarrer l'enregistrement micro ──
  const startRecording = async () => {
    setSttError(null);
    setSttTranscription(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendAudioToSTT(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setSttError("Accès au microphone refusé ou non supporté.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToSTT = async (blob: Blob) => {
    setSttLoading(true);
    setSttError(null);

    const formData = new FormData();
    formData.append("file", blob, "voice.webm");
    formData.append("language", language);

    try {
      const response = await fetch("http://localhost:8003/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      setSttTranscription(data.transcription);
    } catch (err: any) {
      console.warn("API STT hors-ligne. Tentative avec Web Speech API du navigateur.");
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = language === "ar" ? "ar-MA" : "fr-FR";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSttTranscription(transcript);
          setSttLoading(false);
        };
        
        recognition.onerror = (event: any) => {
          setSttError("Erreur de reconnaissance vocale du navigateur.");
          setSttLoading(false);
        };
        
        recognition.start();
        // Le STT Loading sera arrêté par onresult ou onerror
        return;
      } else {
        setSttTranscription("Mode hors-ligne : Votre navigateur ne supporte pas la reconnaissance vocale.");
      }
    } finally {
      if (!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) {
        setSttLoading(false);
      }
    }
  };

  // ── TTS : Générer et écouter la voix ──
  const playTTS = async () => {
    if (!ttsText.trim()) return;

    setTtsLoading(true);
    setTtsError(null);
    setIsPlayingAudio(false);

    try {
      const response = await fetch("http://localhost:8004/api/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: ttsText,
          language: language,
          voice: ttsVoice,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioElementRef.current) {
        audioElementRef.current.src = audioUrl;
        audioElementRef.current.play();
        setIsPlayingAudio(true);
        audioElementRef.current.onended = () => setIsPlayingAudio(false);
      }
    } catch (err: any) {
      console.warn("API TTS hors-ligne. Utilisation du TTS natif du navigateur.");
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(ttsText);
        utterance.lang = language === "ar" ? "ar-SA" : "fr-FR";
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
        utterance.onend = () => setIsPlayingAudio(false);
      }
    } finally {
      setTtsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        {/* Élément audio caché */}
        <audio ref={audioElementRef} className="hidden" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[90vh]"
        >
          {/* En-tête */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center text-xl">
                🎙️
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Assistant Vocal MTNRA</h3>
                <p className="text-xs text-slate-400">
                  Dictée Vocale (Whisper) & Synthèse Neuronale (Edge-TTS)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Onglets STT / TTS */}
          <div className="flex border-b border-white/10 bg-white/5 p-1.5 gap-2">
            <button
              onClick={() => setActiveTab("stt")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "stt"
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🎤</span>
              <span>Dictée Vocale (Speech-to-Text)</span>
            </button>
            <button
              onClick={() => setActiveTab("tts")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "tts"
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🔊</span>
              <span>Lecture Audio (Text-to-Speech)</span>
            </button>
          </div>

          {/* Sélecteur de langue */}
          <div className="px-6 pt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">Langue parlée / synthétisée :</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLanguage("fr");
                  setTtsVoice("fr-FR-HenriNeural");
                }}
                className={`px-3 py-1 rounded-lg border transition cursor-pointer ${
                  language === "fr"
                    ? "bg-white/20 border-white/40 text-white font-bold"
                    : "border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                🇫🇷 Français
              </button>
              <button
                onClick={() => {
                  setLanguage("ar");
                  setTtsVoice("ar-MA-MounaNeural");
                }}
                className={`px-3 py-1 rounded-lg border transition cursor-pointer ${
                  language === "ar"
                    ? "bg-white/20 border-white/40 text-white font-bold"
                    : "border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                🇲🇦 Arabe / Darija
              </button>
            </div>
          </div>

          {/* Corps de l'onglet */}
          <div className="p-6 overflow-y-auto space-y-4">
            {activeTab === "stt" ? (
              /* Onglet STT (Micro) */
              <div className="space-y-4 text-center">
                <div className="py-6 flex flex-col items-center justify-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={sttLoading}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-all duration-300 cursor-pointer ${
                      isRecording
                        ? "bg-red-600 animate-pulse ring-8 ring-red-400/30 scale-110"
                        : "bg-primary hover:bg-primary/90 ring-4 ring-primary/20 hover:scale-105"
                    }`}
                  >
                    {isRecording ? "⏹️" : "🎤"}
                  </button>
                  <p className="text-sm font-semibold mt-4 text-slate-200">
                    {isRecording
                      ? "Enregistrement en cours... Cliquez pour arrêter"
                      : "Cliquez pour commencer à parler"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Modèle IA : OpenAI Whisper-large-v3
                  </p>
                </div>

                {sttLoading && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-blue-300 flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span>Transcription haute précision en cours...</span>
                  </div>
                )}

                {sttError && (
                  <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs">
                    {sttError}
                  </div>
                )}

                {sttTranscription && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-left space-y-2"
                  >
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Texte Transcrit
                    </span>
                    <p className="text-base font-semibold text-white bg-black/30 p-3 rounded-xl border border-white/10">
                      « {sttTranscription} »
                    </p>
                    {onSelectTranscription && (
                      <button
                        onClick={() => {
                          onSelectTranscription(sttTranscription);
                          onClose();
                        }}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
                      >
                        Insérer ce texte
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            ) : (
              /* Onglet TTS (Lecture audio) */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Texte à écouter
                  </label>
                  <textarea
                    rows={4}
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="Tapez le texte que vous souhaitez entendre..."
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:ring-2 focus:ring-primary outline-none transition placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Voix Neuronale
                  </label>
                  <select
                    value={ttsVoice}
                    onChange={(e) => setTtsVoice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/20 text-white text-xs outline-none"
                  >
                    <option value="fr-FR-HenriNeural">🇫🇷 Français - Henri (Masculin, Naturel)</option>
                    <option value="fr-FR-DeniseNeural">🇫🇷 Français - Denise (Féminin, Doux)</option>
                    <option value="ar-MA-MounaNeural">🇲🇦 Arabe Marocain - Mouna (Féminin)</option>
                    <option value="ar-MA-JamalNeural">🇲🇦 Arabe Marocain - Jamal (Masculin)</option>
                  </select>
                </div>

                {ttsError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs">
                    {ttsError}
                  </div>
                )}

                <button
                  onClick={playTTS}
                  disabled={ttsLoading}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {ttsLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Génération audio en cours...</span>
                    </>
                  ) : isPlayingAudio ? (
                    <>
                      <span className="animate-pulse">🔊</span>
                      <span>Lecture en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>▶️</span>
                      <span>Écouter à voix haute</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
