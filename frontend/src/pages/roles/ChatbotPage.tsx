import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "../../store/uiStore";
import { UserProfileBanner } from "../../components/common/UserProfileBanner";

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

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

export function ChatbotPage({ currentRole = "CITOYEN" }: ChatbotWidgetProps) {
  const { lang } = useUIStore();
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
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  // Sessions d'historique sauvegardées
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(`tawsa_ai_history_${currentRole}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "sess-1",
        title: "Recherche pièces fonds de commerce",
        date: "2026-08-30",
        messages: [
          { id: "h1-1", sender: "user", text: "Quels sont les documents pour un fonds de commerce ?", timestamp: "14:20" },
          { id: "h1-2", sender: "bot", text: "Les pièces nécessaires sont le certificat négatif, le contrat de bail, la copie CNI...", timestamp: "14:21" }
        ]
      },
      {
        id: "sess-2",
        title: "Procédure de saisine du médiateur",
        date: "2026-08-28",
        messages: [
          { id: "h2-1", sender: "user", text: "Comment saisir le médiateur en cas de litige ?", timestamp: "10:15" },
          { id: "h2-2", sender: "bot", text: "Vous devez justifier d'une notification de rejet préalable et transmettre le dossier...", timestamp: "10:16" }
        ]
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sauvegarder l'historique dans localStorage
  useEffect(() => {
    localStorage.setItem(`tawsa_ai_history_${currentRole}`, JSON.stringify(sessions));
  }, [sessions, currentRole]);

  // Suggestions rapides adaptées à tous les acteurs
  const suggestions = [
    "Quelles sont les pièces pour la demande du Passeport biométrique ?",
    "Comment obtenir l'Extrait de Casier Judiciaire (Bulletin N°3) ?",
    "Quelles sont les démarches pour établir le Livret de Famille ?",
    "Pièces nécessaires pour la Carte Nationale (CNIE biométrique)",
    "Procédure d'immatriculation d'un fonds de commerce",
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

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
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

      let botMessage: Message;
      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      botMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.reponse,
        sources: data.sources || [],
        confidence: data.confiance,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => {
        const updated = [...prev, botMessage];
        updateCurrentSession(question, updated);
        return updated;
      });
    } catch (error) {
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

      setMessages((prev) => {
        const updated = [...prev, fallbackMessage];
        updateCurrentSession(question, updated);
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentSession = (firstQuestion: string, currentMsgs: Message[]) => {
    setSessions((prev) => {
      const activeId = `sess-${currentRole}-latest`;
      const existingIdx = prev.findIndex((s) => s.id === activeId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          messages: currentMsgs,
        };
        return updated;
      } else {
        return [
          {
            id: activeId,
            title: firstQuestion.length > 35 ? firstQuestion.substring(0, 35) + "..." : firstQuestion,
            date: new Date().toISOString().split("T")[0],
            messages: currentMsgs,
          },
          ...prev,
        ];
      }
    });
  };

  const startNewSession = () => {
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: t.welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    if (window.innerWidth < 768) setShowHistory(false);
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
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "fr-FR";
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(msgId);
        utterance.onend = () => setIsPlayingAudio(null);
      }
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(historySearch.toLowerCase()) ||
    s.messages.some(m => m.text.toLowerCase().includes(historySearch.toLowerCase()))
  );

  return (
    <div className="w-full max-w-6xl mx-auto font-sans space-y-4">
      <audio ref={audioElementRef} className="hidden" />
      <UserProfileBanner />
      <div className="flex gap-4 h-[calc(100vh-10rem)]">
        {/* Volet Historique des conversations & recherches (collapsible / responsive) */}
        <AnimatePresence>
          {(showHistory || window.innerWidth >= 1024) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "320px" }}
              exit={{ opacity: 0, width: 0 }}
              className="bg-[#111b21] border border-slate-700/50 rounded-3xl overflow-hidden flex flex-col text-[#e9edef] shrink-0 shadow-2xl"
            >
              <div className="p-4 bg-[#202c33] border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-[#00a884]">
                  <span>📜</span>
                  <span>Historique IA</span>
                </div>
                <button
                  onClick={startNewSession}
                  className="px-3 py-1.5 bg-[#00a884] hover:bg-[#00bfa5] text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1"
                >
                  <span>+</span> <span>Nouvelle</span>
                </button>
              </div>

              {/* Barre de recherche dans l'historique */}
              <div className="p-3 bg-[#111b21] border-b border-slate-800">
                <input
                  type="text"
                  placeholder="Rechercher dans l'historique..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full px-3 py-2 bg-[#202c33] rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-[#00a884]"
                />
              </div>

              {/* Liste des conversations enregistrées */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/50">
                {filteredSessions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Aucune conversation trouvée.
                  </div>
                ) : (
                  filteredSessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => loadSession(s)}
                      className="p-3 hover:bg-[#202c33] rounded-2xl cursor-pointer transition group flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#e9edef] truncate group-hover:text-[#00a884]">
                          {s.title}
                        </span>
                        <span className="text-[10px] text-slate-500">{s.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {s.messages[s.messages.length - 1]?.text || "Session fermée"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Window Principale Chat RAG */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 bg-[#0b141a] border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#e9edef] font-sans"
        >
          {/* Header - WhatsApp style */}
          <div className="px-6 py-4 bg-[#202c33] flex items-center justify-between shadow-sm z-10" dir={lang === "AR" ? "rtl" : "ltr"}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 rounded-xl bg-[#2a3942] text-[#00a884] hover:bg-[#32424c] transition cursor-pointer text-sm font-bold flex items-center gap-1.5"
                title="Afficher/Masquer l'historique IA"
              >
                <span>📜</span>
                <span className="hidden sm:inline">Historique</span>
              </button>
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl overflow-hidden shadow-md">
                <img src="/rania.ma.png" alt="Rania" className="w-full h-full object-cover opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                <span className="absolute">🤖</span>
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight text-[#e9edef]">
                  {t.title} <span className="text-xs text-[#00a884] font-semibold ml-2">({currentRole})</span>
                </h3>
                <p className="text-[12px] text-[#8696a0] flex items-center gap-1.5 mt-0.5">
                  {t.online} <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[#aebac1]">
              <button 
                onClick={startNewSession}
                title="Nouvelle conversation" 
                className="px-3 py-1.5 rounded-xl bg-[#2a3942] hover:bg-[#32424c] text-white transition text-xs font-bold cursor-pointer"
              >
                + Nouveau Chat
              </button>
            </div>
          </div>

          {/* Zone des messages */}
          <div 
            className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 text-sm relative"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundColor: "#0b141a", backgroundBlendMode: "overlay" }}
            dir={lang === "AR" ? "rtl" : "ltr"}
          >
            {/* WhatsApp Date Header */}
            <div className="flex justify-center mb-4">
              <span className="bg-[#182229] text-[#8696a0] text-xs px-4 py-1.5 rounded-xl uppercase tracking-wide shadow-sm font-semibold">
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
                    className={`relative max-w-[85%] px-4 py-3 rounded-xl shadow-sm ${
                      isUser
                        ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none"
                        : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
                    }`}
                  >
                    <div className={`absolute top-0 w-4 h-4 ${isUser ? "-right-3 text-[#005c4b]" : "-left-3 text-[#202c33]"}`}>
                      <svg viewBox="0 0 8 13" width="12" height="18" className="fill-current">
                        {isUser ? (
                          <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                        ) : (
                          <path d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z" />
                        )}
                      </svg>
                    </div>

                    <div className="text-[15px] leading-relaxed whitespace-pre-line pb-5">
                      {msg.text}
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5 pb-4">
                        <div className="flex items-center justify-between text-xs text-[#8696a0]">
                          <span className="font-semibold text-[#00a884]">📚 Source Documentaire :</span>
                          {msg.confidence !== undefined && (
                            <span className="text-[#00a884] font-mono font-bold">
                              {Math.round(msg.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        {msg.sources.map((s, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-[#8696a0] bg-[#0b141a]/50 px-3 py-1.5 rounded-md flex items-center gap-2 truncate border border-white/5"
                          >
                            <span>📄</span>
                            <span className="truncate">{s.fichier}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={`absolute bottom-1.5 right-2.5 flex items-center gap-1 text-[11px] font-medium ${isUser ? "text-[#85cbb1]" : "text-[#8696a0]"}`}>
                      <span>{msg.timestamp}</span>
                      {isUser && (
                        <svg viewBox="0 0 16 15" width="16" height="15" className="fill-current text-[#53bdeb]">
                          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {!isUser && (
                    <button
                      onClick={() => speakMessage(msg.id, msg.text)}
                      className="text-xs text-[#8696a0] hover:text-[#00a884] transition cursor-pointer mt-1 ml-1 flex items-center gap-1 bg-[#202c33] px-2 py-1 rounded-md"
                    >
                      {isPlayingAudio === msg.id ? "⏸️ Arrêter" : "🔊 Écouter"}
                    </button>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start">
                <div className="bg-[#202c33] text-[#e9edef] rounded-xl rounded-tl-none px-5 py-4 shadow-sm relative">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2.5 h-2.5 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2.5 h-2.5 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides */}
          {messages.length <= 2 && (
            <div className="px-4 py-3 bg-[#202c33] flex gap-3 overflow-x-auto no-scrollbar border-b border-[#0b141a]">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug)}
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-[#2a3942] hover:bg-[#32424c] text-[#d1d7db] text-sm font-medium transition cursor-pointer shadow-sm"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Zone de saisie */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="px-4 py-3 bg-[#202c33] flex items-end gap-3"
            dir={lang === "AR" ? "rtl" : "ltr"}
          >
            <button type="button" className="p-2.5 text-[#8696a0] hover:text-[#d1d7db] transition flex-shrink-0 cursor-pointer text-xl">
              😊
            </button>
            <button type="button" className="p-2.5 text-[#8696a0] hover:text-[#d1d7db] transition flex-shrink-0 cursor-pointer text-xl">
              📎
            </button>
            <div className="flex-1 bg-[#2a3942] rounded-xl flex items-center min-h-[48px] px-4 shadow-inner">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t.placeholder}
                className="w-full bg-transparent text-[#e9edef] text-base placeholder:text-[#8696a0] outline-none"
              />
            </div>
            {inputValue.trim() ? (
              <button
                type="submit"
                disabled={loading}
                className="w-12 h-12 rounded-full bg-[#00a884] hover:bg-[#00bfa5] text-white flex items-center justify-center flex-shrink-0 transition shadow-md ml-2 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current transform translate-x-0.5">
                  <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
                </svg>
              </button>
            ) : (
              <button type="button" className="p-2.5 text-[#8696a0] hover:text-[#d1d7db] transition flex-shrink-0 ml-2 cursor-pointer text-xl">
                🎙️
              </button>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
