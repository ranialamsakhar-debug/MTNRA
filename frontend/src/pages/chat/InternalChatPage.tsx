import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";

interface AgentSummary {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  serviceAffectation: string;
  role: string;
}

interface MessageItem {
  idMessage: number;
  canalId: number;
  expediteurId: number;
  expediteurNom: string;
  expediteurPrenom: string;
  expediteurService: string;
  contenu: string;
  dateEnvoi: string;
  lu: boolean;
}

interface CanalItem {
  idCanal: number;
  nom: string;
  description: string;
  type: "PRIVE_DIRECT" | "GROUPE_DEPARTEMENT" | "GROUPE_INTER_DEPARTEMENT";
  departement?: string;
  unreadCount?: number;
}

const DEFAULT_CHANNELS: CanalItem[] = [
  {
    idCanal: 7,
    nom: "📢 Guichet & Échanges Citoyens",
    description: "Canal direct d'échanges entre citoyens, guichet unifié et agents référents.",
    type: "GROUPE_DEPARTEMENT",
    departement: "RECLAMATION",
  },
  {
    idCanal: 1,
    nom: "🏢 Service Réclamations",
    description: "Canal officiel pour l'instruction et la qualification des dossiers citoyens.",
    type: "GROUPE_DEPARTEMENT",
    departement: "RECLAMATION",
  },
  {
    idCanal: 2,
    nom: "🔍 Service Validation & Conformité",
    description: "Examen des pièces justificatives et conformité réglementaire.",
    type: "GROUPE_DEPARTEMENT",
    departement: "VALIDATION",
  },
  {
    idCanal: 3,
    nom: "📜 Service Certification & Attestation",
    description: "Attestation légale et délivrance des certificats conformes.",
    type: "GROUPE_DEPARTEMENT",
    departement: "CERTIFICATION",
  },
  {
    idCanal: 4,
    nom: "✍️ Service Signature Officielle",
    description: "Signataires habilités et formalités de clôture administrative.",
    type: "GROUPE_DEPARTEMENT",
    departement: "SIGNATURE",
  },
  {
    idCanal: 5,
    nom: "⚖️ Pôle Médiation du Royaume",
    description: "Instruction des recours citoyens suite à rejet et arbitrage amiable.",
    type: "GROUPE_DEPARTEMENT",
    departement: "MEDIATION",
  },
  {
    idCanal: 6,
    nom: "🏛️ Coordination Inter-Services",
    description: "Échanges transversaux entre différents départements ministériels.",
    type: "GROUPE_INTER_DEPARTEMENT",
  },
];

const DEFAULT_COLLEAGUES: AgentSummary[] = [
  { id: 101, matricule: "MAT-REC-2001", nom: "BENALI", prenom: "Ahmed", serviceAffectation: "Service Réclamations", role: "AGENT_RECLAMATION" },
  { id: 102, matricule: "MAT-VAL-2002", nom: "EL IDRISSI", prenom: "Karim", serviceAffectation: "Service Validation", role: "AGENT_VALIDATION" },
  { id: 103, matricule: "MAT-CER-2003", nom: "ZAHRA", prenom: "Fatima", serviceAffectation: "Service Certification", role: "AGENT_CERTIFICATION" },
  { id: 104, matricule: "MAT-SIG-2004", nom: "MANSOURI", prenom: "Samira", serviceAffectation: "Service Signature", role: "AGENT_SIGNATURE" },
  { id: 105, matricule: "INST-IJ11223", nom: "TAZI", prenom: "Dr. Youssef", serviceAffectation: "Institution Médiateur", role: "MEDIATEUR" },
  { id: 106, matricule: "MAT-ADM-2007", nom: "CHRAIBI", prenom: "Meryem", serviceAffectation: "Administration IT", role: "ADMINISTRATEUR" },
];

export function InternalChatPage() {
  const { user } = useAuthStore();
  const [canaux, setCanaux] = useState<CanalItem[]>(DEFAULT_CHANNELS);
  const [activeCanal, setActiveCanal] = useState<CanalItem>(DEFAULT_CHANNELS[0]);

  // Vrais messages entre acteurs — pas de messages système automatiques
  const defaultMessages: MessageItem[] = [
    {
      idMessage: 2,
      canalId: 1,
      expediteurId: 101,
      expediteurNom: "BENALI",
      expediteurPrenom: "Ahmed",
      expediteurService: "Réclamations",
      contenu: "Le dossier DOS-2026-89421 nécessite une vérification urgente du registre de commerce.",
      dateEnvoi: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      lu: false,
    },
    {
      idMessage: 3,
      canalId: 1,
      expediteurId: 102,
      expediteurNom: "EL IDRISSI",
      expediteurPrenom: "Karim",
      expediteurService: "Validation",
      contenu: "Reçu. Nous validons la conformité de l'acte de propriété aujourd'hui.",
      dateEnvoi: new Date(Date.now() - 1800000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      lu: false,
    },
  ];

  const loadInitialMessages = (): MessageItem[] => {
    const saved = localStorage.getItem("tawsa_chat_messages_v2");
    if (saved) {
      try { return JSON.parse(saved); } catch { return defaultMessages; }
    }
    return defaultMessages;
  };

  const [messages, setMessages] = useState<MessageItem[]>(loadInitialMessages);
  const [inputValue, setInputValue] = useState("");
  const [colleagues] = useState<AgentSummary[]>(DEFAULT_COLLEAGUES);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Calculer dynamiquement le nombre de messages non lus par canal
  const getUnreadCount = (canalId: number) =>
    messages.filter((m) => m.canalId === canalId && !m.lu && m.expediteurId !== 999).length;

  // Marquer comme lus tous les messages du canal actif
  const markCanalAsRead = (canalId: number) => {
    setMessages((prev) =>
      prev.map((m) => m.canalId === canalId ? { ...m, lu: true } : m)
    );
  };

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem("tawsa_chat_messages_v2", JSON.stringify(messages));
  }, [messages]);

  // Marquer comme lus quand on change de canal
  useEffect(() => {
    markCanalAsRead(activeCanal.idCanal);
  }, [activeCanal.idCanal]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg: MessageItem = {
      idMessage: Date.now(),
      canalId: activeCanal.idCanal,
      expediteurId: user ? 999 : 101,
      expediteurNom: user?.nom || "CONNECTÉ",
      expediteurPrenom: user?.prenom || "Utilisateur",
      expediteurService: user?.role === "CITOYEN" ? "Citoyen(ne)" : (user?.serviceAffectation || activeCanal.departement || "MTNRA"),
      contenu: inputValue.trim(),
      dateEnvoi: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      lu: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");

    // ── Pas de réponse automatique système ── (comme WhatsApp : seuls les acteurs écrivent)

    fetch("http://localhost:8081/api/features/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canalId: activeCanal.idCanal,
        expediteurId: 1,
        contenu: newMsg.contenu,
      }),
    }).catch(() => {});
  };

  const startPrivateChat = (agent: AgentSummary) => {
    const chatPriveId = 1000 + agent.id;
    const existing = canaux.find((c) => c.idCanal === chatPriveId);

    if (existing) {
      // Marquer comme lu en ouvrant
      setCanaux((prev) =>
        prev.map((c) => c.idCanal === chatPriveId ? { ...c, unreadCount: 0 } : c)
      );
      setActiveCanal({ ...existing, unreadCount: 0 });
    } else {
      const newPrivateCanal: CanalItem = {
        idCanal: chatPriveId,
        nom: `💬 ${agent.prenom} ${agent.nom}`,
        description: `Chat privé direct avec ${agent.prenom} ${agent.nom} (${agent.serviceAffectation})`,
        type: "PRIVE_DIRECT",
      };
      setCanaux((prev) => [...prev, newPrivateCanal]);
      setActiveCanal(newPrivateCanal);
      // ── Pas de message de bienvenue système ── (comme WhatsApp : conversation vide au départ)
      setMessages((prev) => prev.filter((m) => m.canalId !== chatPriveId));
    }
  };

  const handleCreateCustomGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: CanalItem = {
      idCanal: Date.now(),
      nom: `👥 ${newGroupName.trim()}`,
      description: "Groupe de travail et coordination inter-services.",
      type: "GROUPE_INTER_DEPARTEMENT",
    };

    setCanaux((prev) => [...prev, newGroup]);
    setActiveCanal(newGroup);
    setShowNewGroupModal(false);
    setNewGroupName("");
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Panneau latéral gauche : Canaux & Collègues */}
      <div className="w-80 bg-slate-900/90 backdrop-blur-md rounded-3xl border border-white/20 p-5 flex flex-col justify-between shadow-2xl text-white">
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Titre & Bouton Nouveau Groupe */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="font-extrabold text-base flex items-center gap-2">
                <span>💬</span> Messagerie Interne
              </h2>
              <p className="text-[11px] text-slate-400">Collaboration MTNRA</p>
            </div>
            <button
              onClick={() => setShowNewGroupModal(true)}
              className="px-2.5 py-1 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition cursor-pointer shadow"
              title="Créer un nouveau groupe inter-services"
            >
              + Groupe
            </button>
          </div>

          {/* Section 1 : Canaux Départementaux */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Canaux de Départements
            </span>
            <div className="space-y-1">
              {canaux
                .filter((c) => c.type !== "PRIVE_DIRECT")
                .map((canal) => {
                  const isActive = activeCanal.idCanal === canal.idCanal;
                  
                  const handleSelectCanal = () => {
                    setActiveCanal(canal);
                    if (canal.unreadCount && canal.unreadCount > 0) {
                      setCanaux((prev) =>
                        prev.map((c) =>
                          c.idCanal === canal.idCanal ? { ...c, unreadCount: 0 } : c
                        )
                      );
                    }
                  };

                  return (
                    <button
                      key={canal.idCanal}
                      onClick={handleSelectCanal}
                      className={`w-full text-left p-2.5 rounded-2xl text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "bg-primary text-white shadow-lg ring-1 ring-white/30"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{canal.nom}</span>
                      {(() => {
                        const unread = getUnreadCount(canal.idCanal);
                        return unread > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black min-w-[18px] text-center animate-pulse">
                            {unread}
                          </span>
                        ) : null;
                      })()}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Section 2 : Discussions Privées 1-à-1 */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Chat Privé (Employés)
            </span>
            <div className="space-y-1">
              {colleagues.map((agent) => {
                const privateUnread = getUnreadCount(1000 + agent.id);
                return (
                  <button
                    key={agent.id}
                    onClick={() => startPrivateChat(agent)}
                    className="w-full text-left p-2.5 rounded-2xl text-xs hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="truncate font-medium">
                        {agent.prenom} {agent.nom}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {privateUnread > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black min-w-[18px] text-center animate-pulse">
                          {privateUnread}
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 px-1.5 py-0.5 rounded bg-white/5 truncate max-w-[80px]">
                        {agent.serviceAffectation.replace("Service ", "")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Profil connecté en bas */}
        <div className="pt-3 border-t border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-400/60 shadow-sm shrink-0 bg-slate-800">
            {user?.cniPhotoUrl ? (
              <img src={user.cniPhotoUrl} alt={user.prenom} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                👤
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user ? `${user.prenom} ${user.nom}` : "Utilisateur Connecté"}</p>
            <p className="text-[10px] text-emerald-400 font-semibold truncate">● {user?.role === "CITOYEN" ? "Espace Citoyen" : (user?.serviceAffectation || "En Ligne")}</p>
          </div>
        </div>
      </div>

      {/* Panneau central : Zone de Discussion Active */}
      <div className="flex-1 bg-slate-900/90 backdrop-blur-md rounded-3xl border border-white/20 flex flex-col shadow-2xl overflow-hidden text-white">
        {/* En-tête du canal */}
        <div className="p-5 border-b border-white/15 bg-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <span>{activeCanal.nom}</span>
              {activeCanal.type === "PRIVE_DIRECT" && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  🔒 Chat Privé Sécurisé
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{activeCanal.description}</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-300 font-medium">
            🏛️ MTNRA Network
          </span>
        </div>

        {/* BANNIÈRE D'EMPLACEMENT DES MESSAGES */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-white/10 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
              <span>📍</span> <span>Emplacement des Messages & Échanges avec l'Administration :</span>
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
              Canal Actif
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-200">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="font-bold text-cyan-300 block">1. 💬 Hub Messagerie (Ici)</span>
              <span>Échanges en direct avec les agents et canaux des services.</span>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="font-bold text-amber-300 block">2. 📁 Dans "Gestion des Dossiers"</span>
              <span>Consultez vos dossiers pour voir les demandes de pièces et remarques d'agents.</span>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="font-bold text-emerald-300 block">3. ⚡ Sur "Suivi Public"</span>
              <span>Entrez la référence de votre demande pour consulter le statut officiel.</span>
            </div>
          </div>
        </div>

        {/* Fil des messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.filter((m) => m.canalId === activeCanal.idCanal).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 select-none">
              <span className="text-5xl opacity-30">💬</span>
              <p className="text-sm font-semibold">Aucun message pour l'instant</p>
              <p className="text-xs text-slate-500">Soyez le premier à écrire dans ce canal.</p>
            </div>
          ) : (
            messages
              .filter((m) => m.canalId === activeCanal.idCanal)
              .map((msg) => {
                const isMe = msg.expediteurId === 999;
                return (
                  <motion.div
                    key={msg.idMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    {!isMe && (
                      <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
                        <span className="font-bold text-slate-200">
                          {msg.expediteurPrenom} {msg.expediteurNom}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] text-amber-300">
                          {msg.expediteurService}
                        </span>
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] p-4 rounded-3xl text-xs shadow-lg leading-relaxed ${
                        isMe
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-white/10 border border-white/15 text-slate-100 rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.contenu}</p>
                    </div>

                    <span className="text-[10px] text-slate-400 mt-1 px-2">{msg.dateEnvoi}</span>
                  </motion.div>
                );
              })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Formulaire d'envoi de message */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/15 bg-slate-950/60 flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Écrire un message dans ${activeCanal.nom}...`}
            className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-primary outline-none transition"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <span>Envoyer</span>
            <span>➤</span>
          </button>
        </form>
      </div>

      {/* Modal Création Nouveau Groupe */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 w-full max-w-md text-white space-y-4">
            <h3 className="font-extrabold text-base">Créer un Groupe de Travail Inter-Services</h3>
            <p className="text-xs text-slate-400">
              Créez un canal de discussion transversal pour collaborer entre plusieurs départements.
            </p>
            <form onSubmit={handleCreateCustomGroup} className="space-y-4">
              <input
                type="text"
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Ex: Commission Litiges Urgents"
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewGroupModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-xs font-bold hover:bg-white/20 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-xs font-bold hover:bg-primary/90 transition cursor-pointer shadow"
                >
                  Créer le Groupe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
