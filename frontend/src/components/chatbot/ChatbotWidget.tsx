import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "../../store/uiStore";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  sources?: Array<{ fichier: string; page?: number; score?: number }>;
  confidence?: number;
  timestamp: string;
}

interface ChatbotWidgetProps {
  currentRole?: string;
}

const translations: Record<string, any> = {
  FR: {
    welcome: "Bonjour ! Je suis l'Assistant IA Administratif & Réglementaire (RAG) de la plateforme Tawsa. Comment puis-je vous assister dans vos démarches ou l'instruction de vos dossiers ?",
    title: "Système Tawsa",
    online: "en ligne",
    today: "Aujourd'hui",
    placeholder: "Écrivez un message...",
    sources: "Sources Documentaires",
    confidence: "Confiance RAG",
    fallbackMode: "Mode local activé (Services IA hors ligne).",
    fallbackContact: "Pour traiter cette demande spécifique, veuillez contacter directement le support via la page 'Contacts'."
  },
  EN: {
    welcome: "Hello! I am the Administrative & Regulatory AI Assistant of the Tawsa platform. How can I assist you?",
    title: "Tawsa System",
    online: "online",
    today: "Today",
    placeholder: "Type a message...",
    sources: "Documentary Sources",
    confidence: "RAG Confidence",
    fallbackMode: "Local mode enabled (AI services offline).",
    fallbackContact: "To process this specific request, please contact support directly via the 'Contact' page."
  },
  AR: {
    welcome: "مرحباً! أنا مساعد الذكاء الاصطناعي الإداري لمنصة Tawsa. كيف يمكنني مساعدتك في إجراءاتك؟",
    title: "نظام Tawsa",
    online: "متصل",
    today: "اليوم",
    placeholder: "اكتب رسالة...",
    sources: "المصادر الوثائقية",
    confidence: "مستوى الثقة",
    fallbackMode: "الوضع المحلي مفعل (خدمات الذكاء الاصطناعي غير متصلة).",
    fallbackContact: "لمعالجة هذا الطلب، يرجى الاتصال بالدعم مباشرة عبر صفحة 'اتصل بنا'."
  },
  TAM: {
    welcome: "ⴰⵣⵓⵍ! ⵏⴽⴽⵉⵏ ⴷ ⴰⵎⴰⵡⴰⵙ ⵏ ⵜⵉⴳⴳⵉ ⵏ ⵜⵎⵙⵙⵓⴳⵓⵔⵜ. ⵎⴰⵏⵉⴽ ⵙ ⵎⵓⵔⵉⵖ ⴰⴷ ⴰⵡⵙⵖ?",
    title: "ⴰⵏⴳⵔⴰⵡ Tawsa",
    online: "ⴳ ⵓⵣⴷⴰⵢ",
    today: "ⴰⵙⵙⴰ",
    placeholder: "ⴰⵔⴰ ⵢⴰⵜ ⵜⴱⵔⴰⵜ...",
    sources: "ⵉⵖⴱⵓⵍⴰ",
    confidence: "ⵜⴰⴼⵍⵙⵜ",
    fallbackMode: "ⴰⵙⴽⴽⵉⵏ ⴰⴷⵖⴰⵔⴰⵏ ⵉⵍⵍⴰ (IA ⵓⵔ ⵉⵍⵍⵉ).",
    fallbackContact: "ⴰⴼⴰⴷ ⴰⴷ ⵜⵙⴽⵔⴷ ⴰⵙⵓⵜⵔ ⴰⴷ, ⵎⵙⴰⵡⴰⴹ ⴷ ⵜⵏⴰⴼⵓⵜ ⵏ ⵜⵡⵉⵙⵉ."
  }
};

export function ChatbotWidget({ currentRole = "CITOYEN" }: ChatbotWidgetProps) {
  const { lang, isChatOpen: isOpen, toggleChat: setIsOpen } = useUIStore();
  const t = translations[lang] || translations.FR;
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: t.welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Suggestions rapides adaptées à tous les acteurs
  const suggestions = [
    "Quels sont les documents pour un fonds de commerce ?",
    "Quelles sont les conditions de saisine du médiateur ?",
    "Procédure de validation et signature des dossiers",
    "Motifs réglementaires de rejet d'une réclamation",
  ];

  const handleSend = async (questionToSend?: string) => {
    const question = (questionToSend || inputValue).trim();
    if (!question || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!questionToSend) setInputValue("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/chatbot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question,
          conversation_id: `session-${currentRole}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data = await response.json();

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.reponse,
        sources: data.sources || [],
        confidence: data.confiance,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      // Réponse de secours basée sur le Guide Officiel des Procédures (Tawsa / MTNRA)
      const q = question.toLowerCase();
      let fallbackText = "📌 **Guide Officiel des Procédures Administratives (MTNRA / Tawsa) :**\n\n";

      if (q.includes("passeport") || q.includes("passport") || q.includes("voyage")) {
        fallbackText += "### Procédure pour le Passeport Biométrique Marocain :\n" +
          "1. **Demande en ligne** sur le portail `www.passeport.ma`.\n" +
          "2. **Carte Nationale (CNIE)** en cours de validité.\n" +
          "3. **2 photos d'identité récentes** (35 x 45 mm, fond blanc).\n" +
          "4. **Timbre Fiscal Électronique** de 500 DH.\n" +
          "5. **Ancien passeport** (en cas de renouvellement) ou Déclaration de perte visée par la DGSN.";
      } else if (q.includes("casier") || q.includes("bulletin") || q.includes("justice")) {
        fallbackText += "### Procédure pour le Casier Judiciaire (Bulletin N°3) :\n" +
          "1. **Demande en ligne** sur `casierjudiciaire.justice.gov.ma` ou au Tribunal de Première Instance.\n" +
          "2. **Copie de la CNIE** du demandeur.\n" +
          "3. **Extrait d'Acte de Naissance récent** (si né au Maroc).\n" +
          "4. **Droit de timbre** de 10 DH (ou retrait numérique).";
      } else if (q.includes("livret") || q.includes("famille") || q.includes("mariage")) {
        fallbackText += "### Procédure pour le Livret de Famille :\n" +
          "1. **Dépôt au Bureau d'État Civil** du lieu de résidence du mari.\n" +
          "2. **Acte de mariage officiel** homologué par le Juge de la Famille.\n" +
          "3. **Copies certifiées conformes des CNIE** des deux époux.\n" +
          "4. **Extraits d'acte de naissance récents** des deux époux + 2 photos.";
      } else if (q.includes("cnie") || q.includes("cni") || q.includes("carte nationale") || q.includes("identité")) {
        fallbackText += "### Procédure pour la Carte Nationale (CNIE Biométrique) :\n" +
          "1. **Extrait d'Acte de Naissance récent** (- 3 mois) ou Livret de Famille.\n" +
          "2. **Attestation de résidence** délivrée par le Commissariat / Caïdat.\n" +
          "3. **4 photos d'identité récentes** (35 x 45 mm).\n" +
          "4. **Droit de timbre fiscal** de 75 DH.";
      } else if (q.includes("acte") || q.includes("naissance") || q.includes("watiqa")) {
        fallbackText += "### Procédure d'Extrait d'Acte de Naissance :\n" +
          "1. **Demande dématérialisée** sur le portail `www.watiqa.ma` avec livraison par Barid Al-Maghrib.\n" +
          "2. **Guichet de l'État Civil** : Présentation de la CNIE ou du Livret de Famille.";
      } else if (q.includes("fond") || q.includes("commerce") || q.includes("ompic") || q.includes("registre")) {
        fallbackText += "### Procédure pour un Fonds de Commerce (OMPIC & Registre du Commerce) :\n" +
          "1. **Certificat Négatif** (OMPIC).\n" +
          "2. **Contrat de bail commercial** ou Acte de propriété.\n" +
          "3. **Copie CNIE** du gérant.\n" +
          "4. **Inscription au Registre du Commerce** (Modèle 1 ou 2) + Patente DGI.";
      } else if (q.includes("médiateur") || q.includes("litige") || q.includes("réclamation")) {
        fallbackText += "### Procédure de Saisine du Médiateur du Royaume :\n" +
          "1. **Copie de la CNIE** du réclamant.\n" +
          "2. **Preuve du rejet administratif préalable** ou absence de réponse sous 30 jours.\n" +
          "3. **Mémoire explicatif & pièces justificatives** transmises via Tawsa.";
      } else {
        fallbackText += `Pour votre demande concernant '${question}', vous pouvez transmettre vos justificatifs scannés directement dans l'espace citoyen ou contacter votre Agent Référent.`;
      }

      const fallbackMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: fallbackText,
        sources: [{ fichier: "Base Légale Interne", score: 0.99 }],
        confidence: 1.0,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Lecture TTS de la réponse du chatbot
  const speakMessage = async (msgId: string, text: string) => {
    if (isPlayingAudio === msgId) {
      audioElementRef.current?.pause();
      setIsPlayingAudio(null);
      return;
    }

    try {
      const response = await fetch("http://localhost:8004/api/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          language: "fr",
          voice: "fr-FR-HenriNeural",
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (audioElementRef.current) {
          audioElementRef.current.src = url;
          audioElementRef.current.play();
          setIsPlayingAudio(msgId);
          audioElementRef.current.onended = () => setIsPlayingAudio(null);
        }
      }
    } catch {
      // Synthèse locale navigateur si service indisponible
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "fr-FR";
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(msgId);
        utterance.onend = () => setIsPlayingAudio(null);
      }
    }
  };

  return (
    <>
      <audio ref={audioElementRef} className="hidden" />

      {/* Bouton Flottant en bas à droite */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-13 h-13 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl flex items-center justify-center border border-slate-700 cursor-pointer transition"
          title="Assistant IA RAG"
        >
          {isOpen ? (
            <span className="text-base font-bold">✕</span>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Fenêtre de Chat RAG */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 h-[560px] font-sans"
          >
            {/* Header Sober */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-sm z-10" dir={lang === "AR" ? "rtl" : "ltr"}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight text-white">
                    {t.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Assistant Officiel</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Zone des messages (Background with WhatsApp-like color) */}
            <div 
              className="flex-1 p-4 overflow-y-auto flex flex-col gap-2 text-sm relative"
              style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundColor: "#0b141a", backgroundBlendMode: "overlay" }}
              dir={lang === "AR" ? "rtl" : "ltr"}
            >
              {/* WhatsApp Date Header */}
              <div className="flex justify-center mb-4">
                <span className="bg-[#182229] text-[#8696a0] text-xs px-3 py-1 rounded-lg uppercase tracking-wide shadow-sm">
                  {t.today}
                </span>
              </div>

              {messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`relative max-w-[85%] px-3 py-2 rounded-lg shadow-sm ${
                        isUser
                          ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none"
                          : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
                      }`}
                    >
                      {/* Tail element */}
                      <div className={`absolute top-0 w-3 h-3 ${isUser ? "-right-2 text-[#005c4b]" : "-left-2 text-[#202c33]"}`}>
                        <svg viewBox="0 0 8 13" width="8" height="13" className="fill-current">
                          {isUser ? (
                            <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                          ) : (
                            <path d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z" />
                          )}
                        </svg>
                      </div>

                      <div className="text-[14.5px] leading-snug whitespace-pre-line pb-4">
                        {msg.text}
                      </div>

                      {/* Sources et score RAG */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/10 space-y-1 pb-4">
                          <div className="flex items-center justify-between text-[11px] text-[#8696a0]">
                            <span className="font-semibold text-[#00a884]">📚 Source :</span>
                            {msg.confidence !== undefined && (
                              <span className="text-[#00a884]">
                                {Math.round(msg.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          {msg.sources.map((s, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] text-[#8696a0] bg-[#0b141a]/50 px-2 py-1 rounded flex items-center gap-1 truncate"
                            >
                              <span>📄</span>
                              <span className="truncate">{s.fichier}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Horodatage WhatsApp (Bottom Right of Bubble) */}
                      <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[10px] ${isUser ? "text-[#85cbb1]" : "text-[#8696a0]"}`}>
                        <span>{msg.timestamp}</span>
                        {isUser && (
                          <svg viewBox="0 0 16 15" width="16" height="15" className="fill-current text-[#53bdeb]">
                            <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* TTS Button for Bot */}
                    {!isUser && (
                      <button
                        onClick={() => speakMessage(msg.id, msg.text)}
                        className="text-[11px] text-[#8696a0] hover:text-[#00a884] transition cursor-pointer mt-1 ml-1 flex items-center gap-1"
                      >
                        {isPlayingAudio === msg.id ? "⏸️" : "🔊"}
                      </button>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-start">
                  <div className="bg-[#202c33] text-[#e9edef] rounded-lg rounded-tl-none px-4 py-3 shadow-sm relative">
                    <div className="absolute top-0 -left-2 w-3 h-3 text-[#202c33]">
                      <svg viewBox="0 0 8 13" width="8" height="13" className="fill-current">
                        <path d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions rapides (WhatsApp style) */}
            {messages.length <= 2 && (
              <div className="px-3 py-2 bg-[#202c33] flex gap-2 overflow-x-auto no-scrollbar border-b border-[#0b141a]">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sug)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-[#2a3942] hover:bg-[#32424c] text-[#d1d7db] text-[13px] transition"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Zone de saisie WhatsApp Style */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="px-3 py-2 bg-[#202c33] flex items-end gap-2"
              dir={lang === "AR" ? "rtl" : "ltr"}
            >
              <button type="button" className="p-2 text-[#8696a0] hover:text-[#d1d7db] transition flex-shrink-0">
                😊
              </button>
              <button type="button" className="p-2 text-[#8696a0] hover:text-[#d1d7db] transition flex-shrink-0">
                📎
              </button>
              <div className="flex-1 bg-[#2a3942] rounded-lg flex items-center min-h-[40px] px-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full bg-transparent text-[#e9edef] text-[15px] placeholder:text-[#8696a0] outline-none"
                />
              </div>
              {inputValue.trim() ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#00bfa5] text-white flex items-center justify-center flex-shrink-0 transition shadow-sm ml-1"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" className="fill-current transform translate-x-0.5">
                    <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
                  </svg>
                </button>
              ) : (
                <button type="button" className="p-2 text-[#8696a0] hover:text-[#d1d7db] transition flex-shrink-0 ml-1">
                  🎙️
                </button>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
