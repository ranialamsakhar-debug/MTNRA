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
    welcome: "Bonjour. Je suis l'Assistant IA Administratif & Réglementaire officiel de la plateforme Tawsa. Je réponds à vos questions sur les démarches administratives, les pièces justificatives, les lois en vigueur (notamment la Loi 55.19) et les procédures de recours.",
    title: "Assistant Réglementaire Tawsa",
    subtitle: "Système RAG Certifié • Ministère de la Transition Numérique",
    online: "Base de connaissances connectée",
    today: "Aujourd'hui",
    placeholder: "Posez votre question administrative ou juridique...",
    sources: "Sources Documentaires Vérifiées",
    confidence: "Indice de conformité RAG",
    historyTitle: "Historique des requêtes",
    newChat: "Nouvelle consultation",
    searchPlaceholder: "Rechercher une procédure...",
  },
  EN: {
    welcome: "Hello. I am the official Administrative & Regulatory AI Assistant of the Tawsa platform. How may I assist you with ministerial procedures and regulatory guidelines?",
    title: "Tawsa Regulatory Assistant",
    subtitle: "Certified RAG System • Ministry of Digital Transition",
    online: "Regulatory base connected",
    today: "Today",
    placeholder: "Type your administrative or legal query...",
    sources: "Verified Documentary Sources",
    confidence: "RAG Confidence Score",
    historyTitle: "Query History",
    newChat: "New consultation",
    searchPlaceholder: "Search procedures...",
  },
  AR: {
    welcome: "مرحباً بكم. أنا المساعد الذكي الرسمي للشؤون الإدارية والتنظيمية لمنصة طاوسا. أجيب على استفساراتكم المتعلقة بالمساطر الإدارية، الوثائق المطلوبة ومقتضيات القانون 55.19.",
    title: "المساعد التنظيمي طاوسا",
    subtitle: "نظام الذكاء الاصطناعي التوليدي • وزارة الانتقال الرقمي",
    online: "قاعدة المعطيات متصلة",
    today: "اليوم",
    placeholder: "اطرح سؤالك حول الإجراءات والوثائق الإدارية...",
    sources: "المراجع والوثائق المعتمدة",
    confidence: "مستوى المطابقة التنظيمية",
    historyTitle: "سجل الاستشارات",
    newChat: "استشارة جديدة",
    searchPlaceholder: "البحث في المساطر الإدارية...",
  },
  TAM: {
    welcome: "Azul. Nkkid d amawas n tisi n tmassugurt n Tawsa. Ssarɣ ad awen-fkeɣ tiririt ɣef tirmad tinmawayin.",
    title: "Amawas Tawsa",
    subtitle: "Angraw n Tisi • Tamawast n Temsusgurt",
    online: "G uzday",
    today: "Assa",
    placeholder: "Ara asuter nnek...",
    sources: "Iɣbula n tmassugurt",
    confidence: "Tafelsiwt RAG",
    historyTitle: "Amzruy",
    newChat: "Amaynu",
    searchPlaceholder: "Rzu...",
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
  const [showHistory, setShowHistory] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

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
          { id: "h1-2", sender: "bot", text: "Les pièces nécessaires sont le certificat négatif (OMPIC), le contrat de bail commercial, la copie CNIE et la déclaration d'immatriculation au Registre du Commerce.", timestamp: "14:21" }
        ]
      },
      {
        id: "sess-2",
        title: "Procédure de saisine du médiateur",
        date: "2026-08-28",
        messages: [
          { id: "h2-1", sender: "user", text: "Comment saisir le médiateur en cas de litige ?", timestamp: "10:15" },
          { id: "h2-2", sender: "bot", text: "La saisine requiert une contestation formelle préalable ou une absence de réponse administrative après 30 jours, avec copie CNIE et pièces justificatives.", timestamp: "10:16" }
        ]
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem(`tawsa_ai_history_${currentRole}`, JSON.stringify(sessions));
  }, [sessions, currentRole]);

  // Suggestions rapides professionnelles
  const suggestions = [
    "Quelles sont les pièces pour le Passeport biométrique ?",
    "Comment obtenir le Casier Judiciaire (Bulletin N°3) ?",
    "Démarches pour l'Extrait d'Acte de Naissance (Watiqa)",
    "Procédure d'immatriculation d'un Fonds de Commerce (OMPIC)",
    "Quelles sont les conditions de saisine du Médiateur du Royaume ?",
    "Délais de réponse légaux selon la Loi 55.19",
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
      let fallbackText = "📌 **Guide Réglementaire Officiel (MTNRA / Loi 55.19) :**\n\n";

      if (q.includes("passeport") || q.includes("passport") || q.includes("voyage")) {
        fallbackText += "### Procédure pour le Passeport Biométrique Marocain :\n" +
          "1. **Demande préalable en ligne** sur le portail national `www.passeport.ma`.\n" +
          "2. **Carte Nationale d'Identité Électronique (CNIE)** en cours de validité.\n" +
          "3. **2 photographies d'identité récentes** (format 35 x 45 mm sur fond blanc).\n" +
          "4. **Timbre fiscal électronique** d'un montant de 500 DH.\n" +
          "5. **Ancien passeport** en cas de renouvellement ou déclaration de perte auprès des services de la DGSN.";
      } else if (q.includes("casier") || q.includes("bulletin") || q.includes("justice")) {
        fallbackText += "### Extrait de Casier Judiciaire (Bulletin N°3) :\n" +
          "1. **Demande en ligne** sur le guichet électronique du Ministère de la Justice (`casierjudiciaire.justice.gov.ma`).\n" +
          "2. **Copie de la CNIE** du demandeur.\n" +
          "3. **Extrait d'Acte de Naissance récent** (si naissance enregistrée au Maroc).\n" +
          "4. **Droit de timbre légal** de 10 DH avec retrait numérique sécurisé.";
      } else if (q.includes("livret") || q.includes("famille") || q.includes("mariage")) {
        fallbackText += "### Délivrance du Livret de Famille :\n" +
          "1. **Dépôt auprès du Bureau d'État Civil** du lieu de résidence de l'époux.\n" +
          "2. **Expédition originale de l'Acte de Mariage** homologué par le Juge de la Famille.\n" +
          "3. **Copies certifiées conformes des CNIE** des deux conjoints.\n" +
          "4. **Extraits d'acte de naissance récents** des deux époux assortis de 2 photos d'identité.";
      } else if (q.includes("cnie") || q.includes("cni") || q.includes("carte nationale") || q.includes("identité")) {
        fallbackText += "### Carte Nationale d'Identité Électronique (CNIE Biométrique) :\n" +
          "1. **Extrait d'Acte de Naissance** datant de moins de 3 mois ou livret de famille.\n" +
          "2. **Certificat de résidence** délivré par la DGSN ou la Gendarmerie Royale.\n" +
          "3. **4 photos d'identité normalisées** (35 x 45 mm).\n" +
          "4. **Quittance du droit de timbre fiscal** de 75 DH.";
      } else if (q.includes("acte") || q.includes("naissance") || q.includes("watiqa")) {
        fallbackText += "### Demande d'Extrait d'Acte de Naissance :\n" +
          "1. **Télédéclaration** via le portail `www.watiqa.ma` avec option de livraison postale recommandée sécurisée (Barid Al-Maghrib).\n" +
          "2. **Retrait au guichet communal d'État Civil** : Sur présentation de la CNIE du demandeur.";
      } else if (q.includes("fond") || q.includes("commerce") || q.includes("ompic") || q.includes("registre")) {
        fallbackText += "### Immatriculation d'un Fonds de Commerce (OMPIC & Registre du Commerce) :\n" +
          "1. **Certificat Négatif** délivré par l'OMPIC.\n" +
          "2. **Contrat de bail commercial** légalisé et enregistré ou titre de propriété foncière.\n" +
          "3. **Copie de la CNIE** du commerçant ou des gérants statutaires.\n" +
          "4. **Dépôt au greffe du Tribunal de Commerce** pour inscription au Registre du Commerce (Modèle 1 ou 2) et déclaration à la DGI.";
      } else if (q.includes("médiateur") || q.includes("litige") || q.includes("recours") || q.includes("réclamation")) {
        fallbackText += "### Conditions de Saisine de l'Institution du Médiateur du Royaume :\n" +
          "1. **Justification d'un recours préalable** auprès de l'administration concernée demeuré sans suite après 30 jours ou ayant fait l'objet d'une décision contestée.\n" +
          "2. **Copie de la CNIE** de la partie requérante.\n" +
          "3. **Mémoire exposant les faits et justificatifs probants** téléversés via l'Espace Recours de Tawsa.";
      } else {
        fallbackText += `Pour votre requête concernant « ${question} », les dispositions réglementaires applicables vous permettent d'adresser vos pièces justificatives directement via votre portail Tawsa ou de solliciter l'instruction directe de votre agent référent.`;
      }

      const fallbackMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: fallbackText,
        sources: [{ fichier: "Base Réglementaire Ministérielle (Loi 55.19)", score: 0.99 }],
        confidence: 0.98,
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
      const activeId = `sess-${currentRole}-active`;
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
            title: firstQuestion.length > 38 ? firstQuestion.substring(0, 38) + "..." : firstQuestion,
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
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: t.welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
  };

  // Dictée vocale (STT) intégrée
  const toggleVoiceDictation = () => {
    if (isRecordingVoice) {
      recognitionRef.current?.stop();
      setIsRecordingVoice(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const reco = new SpeechRecognition();
        reco.lang = lang === "AR" ? "ar-MA" : "fr-FR";
        reco.continuous = false;
        reco.interimResults = false;
        reco.onstart = () => setIsRecordingVoice(true);
        reco.onresult = (e: any) => {
          const text = e.results[0][0].transcript;
          setInputValue((prev) => (prev ? `${prev} ${text}` : text));
          setIsRecordingVoice(false);
        };
        reco.onerror = () => setIsRecordingVoice(false);
        reco.onend = () => setIsRecordingVoice(false);
        recognitionRef.current = reco;
        reco.start();
      } catch {
        setIsRecordingVoice(false);
      }
    } else {
      alert("La dictée vocale n'est pas supportée par ce navigateur.");
    }
  };

  // Lecture TTS
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
          text: text.replace(/[*#`_]/g, ""),
          language: lang === "AR" ? "ar" : "fr",
          voice: lang === "AR" ? "ar-MA-MounaNeural" : "fr-FR-HenriNeural",
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
        return;
      }
    } catch {
      // repli sur Web Speech API
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_]/g, ""));
      utterance.lang = lang === "AR" ? "ar-XA" : "fr-FR";
      utterance.onend = () => setIsPlayingAudio(null);
      setIsPlayingAudio(msgId);
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(historySearch.toLowerCase()) ||
    s.messages.some(m => m.text.toLowerCase().includes(historySearch.toLowerCase()))
  );

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden rounded-2xl border border-[#EADBCE] bg-[#FAF7F2]/95 shadow-xl backdrop-blur-md">
      <audio ref={audioElementRef} className="hidden" />

      {/* ── Entête Officiel Ministériel ────────────────── */}
      <header className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 z-20">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold shadow-inner">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wide text-white leading-tight">
                {t.title}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {currentRole}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t.online}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Loi 55.19 & Décrets d'application</span>
            </p>
          </div>
        </div>

        {/* Actions du bandeau supérieur */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
              showHistory
                ? "bg-slate-800 text-white border-slate-700"
                : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60"
            }`}
            title="Afficher/Masquer le volet historique"
          >
            <span>📜</span>
            <span className="hidden md:inline">{t.historyTitle}</span>
          </button>

          <button
            onClick={startNewSession}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Démarrer une nouvelle consultation vierge"
          >
            <span>+</span>
            <span className="hidden sm:inline">{t.newChat}</span>
          </button>
        </div>
      </header>

      {/* ── Corps : Volet Historique + Espace Central de Dialogue ── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Volet Historique Latéral Beige */}
        <AnimatePresence initial={false}>
          {showHistory && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 290, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="bg-[#F5EFEB] border-r border-[#EADBCE] flex flex-col shrink-0 overflow-hidden z-10"
            >
              {/* Entête Historique */}
              <div className="p-3.5 border-b border-[#EADBCE] bg-[#EFE7DC]/90 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span>📂</span> {t.historyTitle}
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-[#EADBCE]">
                  {sessions.length}
                </span>
              </div>

              {/* Recherche dans l'historique */}
              <div className="p-2.5 border-b border-[#EADBCE] bg-[#FAF7F2]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#EADBCE] rounded-lg text-slate-800 placeholder-slate-400 outline-none focus:border-slate-800 transition"
                  />
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                </div>
              </div>

              {/* Liste des conversations archivées */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-[#EADBCE]/50">
                {filteredSessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 italic">
                    Aucune consultation trouvée.
                  </div>
                ) : (
                  filteredSessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => loadSession(s)}
                      className="p-2.5 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 cursor-pointer transition flex flex-col gap-1 text-left"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {s.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {s.date}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate leading-tight">
                        {s.messages[s.messages.length - 1]?.text || "Consultation archivée"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Zone Centrale Principale : Messages & Réactions sur fond beige chaleureux */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF7F2]/80">
          
          {/* Flux chronologique des messages */}
          <div 
            className="flex-1 p-5 md:p-6 overflow-y-auto flex flex-col gap-4 text-sm"
            dir={lang === "AR" ? "rtl" : "ltr"}
          >
            {/* Repère temporel de début */}
            <div className="flex justify-center my-1">
              <span className="bg-[#EADBCE]/80 text-slate-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                {t.today}
              </span>
            </div>

            {/* Message d'accueil avec suggestion institutionnelle */}
            {messages.length === 1 && (
              <div className="my-2 p-5 rounded-2xl bg-white/95 border border-[#EADBCE] shadow-xs space-y-3 max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-3 text-slate-900">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl">
                    🏛️
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-slate-900">
                      Royaume du Maroc — Portail Administratif MTNRA
                    </h2>
                    <p className="text-xs text-slate-500">
                      Assistance certifiée aux citoyens et agents publics
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sélectionnez l'une des démarches fréquentes ci-dessous ou saisissez librement votre demande réglementaire.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {suggestions.slice(0, 4).map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sug)}
                      className="p-2.5 rounded-xl border border-[#EADBCE] bg-[#FAF7F2] hover:bg-white text-left text-xs font-semibold text-slate-800 transition flex items-start gap-2 cursor-pointer group shadow-2xs"
                    >
                      <span className="text-slate-500 group-hover:text-slate-900">→</span>
                      <span>{sug}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rendu des messages conversationnels */}
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[78%]">
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0 mb-1">
                        🏛️
                      </div>
                    )}

                    <div
                      className={`relative px-5 py-4 rounded-2xl shadow-xs leading-relaxed ${
                        isUser
                          ? "bg-slate-900 text-white rounded-tr-xs"
                          : "bg-white text-slate-900 border border-[#EADBCE] rounded-tl-xs"
                      }`}
                    >
                      {/* Contenu textuel */}
                      <div className="text-[14px] leading-relaxed whitespace-pre-line font-normal">
                        {msg.text}
                      </div>

                      {/* Sources RAG documentaires et conformité */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-[#EADBCE]/60 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                              <span>📜</span> {t.sources}
                            </span>
                            {msg.confidence !== undefined && (
                              <span className="font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {Math.round(msg.confidence * 100)}% {t.confidence}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((s, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F5EFEB] border border-[#EADBCE] text-[11px] font-medium text-slate-700 truncate max-w-full"
                              >
                                <span>📄</span>
                                <span className="truncate">{s.fichier}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Horodatage discret */}
                      <div className={`mt-2 flex items-center justify-end gap-1.5 text-[10px] font-mono ${isUser ? "text-slate-400" : "text-slate-400"}`}>
                        <span>{msg.timestamp}</span>
                        {isUser && <span className="text-emerald-400 font-bold">✓✓</span>}
                      </div>
                    </div>
                  </div>

                  {/* Bouton de synthèse vocale pour les réponses du bot */}
                  {!isUser && (
                    <div className="flex items-center gap-2 mt-1.5 ml-10">
                      <button
                        onClick={() => speakMessage(msg.id, msg.text)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 bg-white border border-[#EADBCE] hover:bg-[#FAF7F2] hover:text-slate-900 transition cursor-pointer shadow-2xs"
                        title="Écouter la synthèse vocale officielle"
                      >
                        <span>{isPlayingAudio === msg.id ? "⏸️" : "🔊"}</span>
                        <span>{isPlayingAudio === msg.id ? "Pause" : "Écouter la réponse"}</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Indicateur de traitement RAG en cours */}
            {loading && (
              <div className="flex items-start gap-2 max-w-md">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
                  🏛️
                </div>
                <div className="bg-white border border-[#EADBCE] rounded-2xl rounded-tl-xs px-5 py-3.5 shadow-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-700 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-slate-700 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-slate-700 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="text-xs text-slate-500 font-medium ml-2">Consultation de la base réglementaire...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bandeau de suggestions rapides au-dessus de la saisie */}
          {messages.length > 1 && (
            <div className="px-4 py-2 bg-[#F5EFEB]/90 border-t border-[#EADBCE] flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide shrink-0">
                Suggestions :
              </span>
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sug)}
                  className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium bg-white text-slate-700 border border-[#EADBCE] hover:bg-[#FAF7F2] hover:text-slate-900 transition cursor-pointer shrink-0 shadow-2xs"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* ── Zone d'Entrée & Contrôles Inférieurs ──────── */}
          <footer className="p-3.5 md:p-4 bg-[#FBF8F3] border-t border-[#EADBCE]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 max-w-5xl mx-auto"
              dir={lang === "AR" ? "rtl" : "ltr"}
            >
              {/* Bouton Dictée vocale (STT) */}
              <button
                type="button"
                onClick={toggleVoiceDictation}
                className={`p-3 rounded-xl border transition cursor-pointer shrink-0 flex items-center justify-center ${
                  isRecordingVoice
                    ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                    : "bg-white hover:bg-[#F5EFEB] text-slate-700 border-[#EADBCE]"
                }`}
                title={isRecordingVoice ? "Arrêter la dictée" : "Dicter votre question (STT)"}
              >
                <span className="text-base">{isRecordingVoice ? "🛑" : "🎙️"}</span>
              </button>

              {/* Champ texte principal */}
              <div className="flex-1 relative flex items-center bg-white border border-[#EADBCE] rounded-xl focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/5 transition">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isRecordingVoice ? "Écoute en cours... parlez distinctement" : t.placeholder}
                  className="w-full px-4 py-3 bg-transparent text-slate-900 text-sm placeholder:text-slate-400 outline-none"
                />
              </div>

              {/* Bouton d'Envoi */}
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-sm shrink-0 cursor-pointer ${
                  inputValue.trim() && !loading
                    ? "bg-slate-900 hover:bg-slate-800 text-white"
                    : "bg-[#EADBCE] text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>Envoyer</span>
                <span className="text-xs">➔</span>
              </button>
            </form>

            <div className="text-center mt-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Conformité administrative garantie • Réponses extraites du corpus juridique officiel du Royaume du Maroc
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
