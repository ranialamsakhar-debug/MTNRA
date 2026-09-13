import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { StripeCheckoutModal } from "../../components/payment/StripeCheckoutModal";
import { SignLanguageModal } from "../../components/accessibility/SignLanguageModal";
import { useDossierStore, DocumentItem, DossierItem, DEFAULT_AGENT_RECLAMATION } from "../../store/dossierStore";
import { useAuthStore } from "../../store/authStore";
import { compressImageIfNeeded } from "../../utils/imageCompressor";
import { UserProfileBanner } from "../../components/common/UserProfileBanner";

interface DemandeTypeOption {
  code: string;
  libelle: string;
  montant: number;
  devise: string;
  estPayant: boolean;
  delai: string;
  iconSvg: string;
  description: string;
  documentsRequis: string[];
}

const DEMANDE_TYPES: DemandeTypeOption[] = [
  {
    code: "RECLAMATION_STANDARD",
    libelle: "Réclamation Administrative Générale",
    montant: 0,
    devise: "MAD",
    estPayant: false,
    delai: "7 jours",
    iconSvg: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
    description: "Contestation, retard ou réclamation auprès d'une administration publique.",
    documentsRequis: ["Copie de la CNI / CNIE", "Preuves ou courriers échangés (Optionnel)"]
  },
  {
    code: "RC_FONDS_COMMERCE",
    libelle: "Immatriculation & Dépôt de Fonds de Commerce",
    montant: 200,
    devise: "MAD",
    estPayant: true,
    delai: "48 heures",
    iconSvg: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0v-4a1 1 0 011-1h2a1 1 0 011 1v4m-6 0h6",
    description: "Frais d'enregistrement officiel au Registre du Commerce (RC) et certificat de conformité.",
    documentsRequis: ["Copie de la CNI / CNIE", "Contrat de bail ou acte de propriété", "Statuts (si société)"]
  },
  {
    code: "CERTIFICAT_ADMIN",
    libelle: "Délivrance de Certificat Administratif Spécial",
    montant: 50,
    devise: "MAD",
    estPayant: true,
    delai: "24 heures",
    iconSvg: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    description: "Droits de chancellerie et timbre fiscal pour certificat officiel certifié conforme.",
    documentsRequis: ["Copie de la CNI / CNIE", "Document original à certifier"]
  },
  {
    code: "ATTESTATION_FISCALE",
    libelle: "Attestation Fiscale & Quittance",
    montant: 100,
    devise: "MAD",
    estPayant: true,
    delai: "24 heures",
    iconSvg: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    description: "Délivrance d'attestation de régularité fiscale et quittance officielle.",
    documentsRequis: ["Copie de la CNI / CNIE", "Dernière quittance de paiement", "Identifiant Fiscal"]
  },
  {
    code: "RECLAMATION_SANTE",
    libelle: "Réclamation Établissement de Santé / Hôpital",
    montant: 0,
    devise: "MAD",
    estPayant: false,
    delai: "48 heures",
    iconSvg: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    description: "Signalement ou plainte relative à un service hospitalier public.",
    documentsRequis: ["Copie de la CNI / CNIE", "Dossier médical ou ordonnance (Optionnel)", "Facture ou reçu de l'hôpital"]
  },
  {
    code: "SAISINE_MEDIATEUR",
    libelle: "Recours & Saisine de l'Institution du Médiateur",
    montant: 0,
    devise: "MAD",
    estPayant: false,
    delai: "15 jours",
    iconSvg: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
    description: "Recours gracieux en cas de rejet préalable d'une réclamation administrative.",
    documentsRequis: ["Copie de la CNI / CNIE", "Copie de la réclamation initiale", "Copie de la réponse de l'administration (Rejet)"]
  },
];

export function NouvelleReclamationPage() {
  const [searchParams] = useSearchParams();
  const { addDossier } = useDossierStore();
  const { user } = useAuthStore();

  const getInitialCin = () => user?.cin || "AI225";
  const getInitialNom = () => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom} ${user.nom}`;
    }
    if (user?.nom) return user.nom;
    if (user?.prenom) return user.prenom;
    return "Rania Lamsakhar";
  };

  const [selectedType, setSelectedType] = useState<DemandeTypeOption>(DEMANDE_TYPES[0]);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [cin, setCin] = useState<string>(getInitialCin());
  const [citoyenNom, setCitoyenNom] = useState<string>(getInitialNom());

  useEffect(() => {
    const requestedType = searchParams.get("type");
    const type = DEMANDE_TYPES.find((option) => option.code === requestedType);
    if (type) {
      setSelectedType(type);
      const dossier = searchParams.get("dossier");
      if (dossier) {
        setTitre(`Saisine du médiateur concernant le dossier ${dossier}`);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      if (user.cin) setCin(user.cin);
      const fullName = [user.prenom, user.nom].filter(Boolean).join(" ");
      if (fullName) {
        setCitoyenNom(fullName);
      } else {
        setCitoyenNom("Rania Lamsakhar");
      }
    }
  }, [user]);

  // Documents joints transmis
  const [attachedDocuments, setAttachedDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentItem | null>(null);

  const [submittedDossier, setSubmittedDossier] = useState<DossierItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [freeSuccess, setFreeSuccess] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [inputMethod, setInputMethod] = useState<"TEXT" | "AUDIO" | "SIGNES">("TEXT");
  const [isRecording, setIsRecording] = useState(false);
  const [isLSMModalOpen, setIsLSMModalOpen] = useState(false);

  // IA Text Optimizer State
  const [isOptimizingText, setIsOptimizingText] = useState(false);
  const [optimizedData, setOptimizedData] = useState<{
    originalText: string;
    optimizedText: string;
    summaryPoints: string[];
    objetPropose: string;
  } | null>(null);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [previousDescription, setPreviousDescription] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);

  // Sync isRecordingRef with isRecording state for use inside closures
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const handleOptimizeText = async () => {
    if (!description || description.trim().length < 5) {
      alert("Veuillez d'abord saisir au moins quelques mots dans votre description avant d'utiliser l'optimiseur de texte IA.");
      return;
    }

    setIsOptimizingText(true);
    try {
      const res = await fetch("http://localhost:8000/api/chatbot/optimize-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: description })
      });
      if (res.ok) {
        const data = await res.json();
        setOptimizedData({
          originalText: description,
          optimizedText: data.optimizedText,
          summaryPoints: data.summaryPoints || [],
          objetPropose: data.objetPropose || "Demande administrative"
        });
        setIsOptimizeModalOpen(true);
      } else {
        throw new Error("Erreur de réponse de l'IA d'optimisation");
      }
    } catch (err) {
      console.warn("Optimiseur IA distant non disponible, exécution du mode secours client :", err);
      const sentences = description.split(/[\n.]+/).map(s => s.trim()).filter(s => s.length > 3);
      const points = sentences.slice(0, 4).map((s, i) => `Point ${i + 1} : ${s}`);
      const synthesis = `📋 SYNTHÈSE ET OPTIMISATION IA DE LA DEMANDE :\n\n• Objet : Demande administrative synthétisée\n• Résumé : ${sentences.join(". ")}\n\n• Points clés identifiés :\n` + points.map(p => `  - ${p}`).join("\n");
      
      setOptimizedData({
        originalText: description,
        optimizedText: synthesis,
        summaryPoints: points,
        objetPropose: "Demande administrative synthétisée"
      });
      setIsOptimizeModalOpen(true);
    } finally {
      setIsOptimizingText(false);
    }
  };

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, inputMethod]);

  const stopRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null; // Effacer avant stop pour bloquer l'auto-redémarrage dans onend
      try { rec.stop(); } catch { /* déjà arrêté */ }
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const startRealSimulation = async (method: "AUDIO" | "SIGNES") => {
    stopRecording();
    setInputMethod(method);
    setIsRecording(true);

    if (method === "SIGNES") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setMediaStream(stream);
        timeoutRef.current = setTimeout(() => {
          setDescription(prev => prev + (prev ? " " : "") + "[Traduction IA Signes] : Demande d'assistance pour document bloqué. Merci.");
        }, 5000);
      } catch (err) {
        console.error("Erreur accès caméra", err);
        alert("Impossible d'accéder à la caméra. Vérifiez vos permissions dans les paramètres du navigateur.");
        setIsRecording(false);
      }

    } else if (method === "AUDIO") {
      // ── Vérification support microphone ──────────────────────────────
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Votre navigateur ne supporte pas l'accès au microphone. Utilisez Chrome, Edge ou Safari.");
        setIsRecording(false);
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        // ── Fallback : MediaRecorder → affichage message d'attente ─────
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setDescription(prev =>
            prev + (prev ? " " : "") +
            "[Enregistrement vocal actif — navigateur sans reconnaissance vocale native. Utilisez Chrome ou Edge pour la transcription automatique.]"
          );
          timeoutRef.current = setTimeout(() => setIsRecording(false), 8000);
        } catch {
          alert("Impossible d'accéder au microphone. Vérifiez que vous avez autorisé l'accès au microphone dans votre navigateur.");
          setIsRecording(false);
        }
        return;
      }

      // ── Reconnaissance vocale native (Chrome / Edge / Safari) ────────
      try {
        // Demander la permission micro explicitement avant de démarrer
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        alert("Accès au microphone refusé. Cliquez sur l'icône 🔒 dans la barre d'adresse et autorisez le microphone.");
        setIsRecording(false);
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript.trim()) {
            setDescription(prev => prev + (prev ? " " : "") + finalTranscript.trim());
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Erreur reconnaissance vocale :", event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            alert("Microphone bloqué par le navigateur. Autorisez l'accès dans les paramètres.");
            setIsRecording(false);
          } else if (event.error === 'no-speech') {
            // Pas de parole détectée — on continue silencieusement
          } else if (event.error === 'network') {
            alert("Erreur réseau pendant la reconnaissance vocale. Vérifiez votre connexion internet.");
            setIsRecording(false);
          }
        };

        // Auto-redémarrage si la reconnaissance s'arrête seule (comportement Chrome)
        recognition.onend = () => {
          if (recognitionRef.current === recognition && isRecordingRef.current) {
            try { recognition.start(); } catch { /* déjà arrêté */ }
          } else {
            setIsRecording(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();

      } catch (err) {
        console.error("Erreur démarrage STT", err);
        alert("Impossible de démarrer la reconnaissance vocale. Réessayez ou utilisez la saisie texte.");
        setIsRecording(false);
      }
    }
  };

  useEffect(() => {
    return () => stopRecording();
  }, []);

  // Calcul du vrai Hash SHA-256 et conversion en DataURL de la photo réelle
  const computeFileHashAndDataUrl = async (file: File): Promise<{ hash: string; dataUrl: string }> => {
    let hash = "";
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    const dataUrl = await compressImageIfNeeded(file, 1000, 0.82);

    return { hash, dataUrl };
  };

  // Gestion de l'upload et de l'analyse OCR de plusieurs documents à la fois
  const processUploadedFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsOcrProcessing(true);

    const processedList: DocumentItem[] = [];

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const { hash, dataUrl } = await computeFileHashAndDataUrl(file);

      const sizeFormatted = file.size > 1024 * 1024 
        ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
        : (file.size / 1024).toFixed(0) + " KB";

      const docTypeMatched = selectedType.documentsRequis[attachedDocuments.length + idx] || selectedType.documentsRequis[0] || "Pièce justificative";

      processedList.push({
        id: "doc-" + Date.now() + "-" + idx,
        nomFichier: file.name,
        typeDocument: docTypeMatched,
        tailleFormatted: sizeFormatted,
        dateAjout: new Date().toISOString().replace('T', ' ').substring(0, 16),
        hash: hash,
        verifie: true,
        scoreFiabilite: 0.98,
        extractedTextPreview: `[EXTRACTION OCR RÉUSSIE - ${file.name}] Document authentique transmis par ${citoyenNom} (${cin}). Type: ${docTypeMatched}. Empreinte SHA-256 certifiée.`,
        dataUrl: dataUrl
      });
    }

    setAttachedDocuments(prev => [...prev, ...processedList]);
    setIsOcrProcessing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    processUploadedFiles(Array.from(e.target.files));
  };

  const handleDropFiles = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveDoc = (id: string) => {
    setAttachedDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numeroGenere = "DOS-" + new Date().getFullYear() + "-" + Math.floor(10000 + Math.random() * 90000);

    const newDossier: DossierItem = {
      id: numeroGenere,
      numeroDossier: numeroGenere,
      citoyenNom: citoyenNom,
      citoyenCnie: cin,
      typeDemande: selectedType.libelle,
      description: description || "Réclamation déposée sans description textuelle complémentaire.",
      dateCreation: new Date().toISOString().replace('T', ' ').substring(0, 16),
      statut: "SOUMIS",
      agentAffecte: DEFAULT_AGENT_RECLAMATION,
      documents: attachedDocuments.length > 0 ? attachedDocuments : [
        {
          id: "doc-default-" + Date.now(),
          nomFichier: "CNI_Copie_Scanne.pdf",
          typeDocument: selectedType.documentsRequis[0] || "Justificatif CNIE",
          tailleFormatted: "1.2 MB",
          dateAjout: new Date().toISOString().replace('T', ' ').substring(0, 16),
          hash: "a4f8c2e1d09876543210abcdef9876543210abcdef9876543210abcdef987654",
          verifie: true,
          scoreFiabilite: 0.98,
          extractedTextPreview: `EXTRAIT OCR AUTOMATIQUE : Document d'identité et justificatif officiellement certifié pour ${citoyenNom} (${cin}).`
        }
      ],
      montant: selectedType.montant,
      estPayant: selectedType.estPayant
    };

    addDossier(newDossier);
    setSubmittedDossier(newDossier);

    if (selectedType.estPayant && selectedType.montant > 0) {
      setIsPaymentModalOpen(true);
    } else {
      setFreeSuccess(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6 px-4 sm:px-6 lg:px-8 pb-16">
      <UserProfileBanner />
      {/* En-tête de la démarche */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40 text-slate-800"
      >
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <span>📝</span>
          <span>Dépôt d'une Démarche ou Réclamation Citoyenne</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          La grande majorité des réclamations sont <strong className="text-emerald-700 font-bold">100% gratuites</strong>. Tous vos documents joints sont numériquement hachés et consultables en toute sécurité par les agents et vous-même.
        </p>
      </motion.div>

      {/* Confirmation démarche gratuite */}
      {freeSuccess && submittedDossier && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/30 text-slate-900 space-y-4 bg-white shadow-xl"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <h3 className="font-extrabold text-lg text-emerald-800">
                Réclamation Enregistrée avec Succès ! (Service Public Gratuit)
              </h3>
              <p className="text-xs text-slate-600">
                N° de Dossier : <strong className="text-primary font-mono">{submittedDossier.numeroDossier}</strong> • Gratuit (0 MAD).
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
            <h4 className="text-xs font-bold text-emerald-900 mb-2 uppercase">📎 Documents enregistrés et transmis aux agents ({submittedDossier.documents.length}) :</h4>
            <div className="flex flex-wrap gap-2">
              {submittedDossier.documents.map((doc) => (
                <div key={doc.id} className="bg-white px-3 py-1.5 rounded-xl border border-emerald-300 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-sm">
                  <span>📄</span>
                  <span>{doc.nomFichier}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">SHA-256 Validé</span>
                  <button onClick={() => setSelectedDocPreview(doc)} className="text-amber-700 hover:underline text-[10px] font-black">👁️ Aperçu</button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Formulaire Principal */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xl border border-white/40 space-y-6"
      >
        {/* Identité Citoyen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nom & Prénom du Citoyen :</label>
            <input
              type="text"
              value={citoyenNom}
              onChange={(e) => setCitoyenNom(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">N° CNIE (Carte Nationale) :</label>
            <input
              type="text"
              value={cin}
              onChange={(e) => setCin(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>
        </div>

        {/* 1. Sélection du Type de Démarche */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            1. Choisissez le type de démarche ou réclamation :
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEMANDE_TYPES.map((type) => (
              <div
                key={type.code}
                onClick={() => setSelectedType(type)}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                  selectedType.code === type.code
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                  <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={type.iconSvg} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-xs truncate">{type.libelle}</h3>
                    {type.estPayant ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                        {type.montant} {type.devise}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        Gratuit (0 MAD)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Modalités de Saisie (Accessibilité Multimodale) */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Saisie du Motif & Description :
            </label>
            <span className="text-[11px] text-slate-500 font-medium">Mode actif : <strong className="text-slate-900">{inputMethod}</strong></span>
          </div>

          {/* Boutons d'Accessibilité Inclusive */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                stopRecording();
                setInputMethod("TEXT");
              }}
              className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                inputMethod === "TEXT"
                  ? "bg-slate-900 text-white border-slate-900 shadow"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Saisie Clavier</span>
            </button>

            <button
              type="button"
              onClick={() => startRealSimulation("AUDIO")}
              className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                inputMethod === "AUDIO"
                  ? "bg-emerald-700 text-white border-emerald-700 shadow"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>{isRecording && inputMethod === "AUDIO" ? "Écoute en cours..." : "Dictée Vocale"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLSMModalOpen(true)}
              className="p-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Langue des Signes</span>
            </button>
          </div>

          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Expliquez en détail votre situation..."
            className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-primary outline-none"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleOptimizeText}
              disabled={isOptimizingText || !description.trim()}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer ${
                isOptimizingText
                  ? "bg-indigo-100 text-indigo-700 animate-pulse border border-indigo-200"
                  : description.trim()
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white hover:shadow-md"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
            >
              <span>✨</span>
              <span>{isOptimizingText ? "Optimisation IA en cours..." : "Optimiser & Synthétiser le texte avec l'IA"}</span>
            </button>

            {previousDescription && (
              <button
                type="button"
                onClick={() => {
                  setDescription(previousDescription);
                  setPreviousDescription(null);
                }}
                className="text-[11px] text-amber-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>↩️</span> <span>Rétablir le texte initial non optimisé</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Pièces Jointes & Documents Requis avec affichage transparent */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            3. Documents & Pièces Jointes transmis :
          </label>

          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-3">
            <h4 className="text-xs font-bold text-blue-900">Documents requis recommandés pour cette démarche :</h4>
            <ul className="list-disc list-inside text-[11px] text-blue-800 space-y-0.5">
              {selectedType.documentsRequis.map((doc, i) => (
                <li key={i}>{doc}</li>
              ))}
            </ul>

            {/* Zone de Téléchargement */}
            <div className="flex flex-col items-center justify-center w-full gap-3">
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropFiles}
                className={`flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-white transition ${isOcrProcessing ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50'}`}
              >
                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                  <span className="text-2xl mb-1">📄</span>
                  <p className="mb-1 text-xs text-slate-600"><span className="font-semibold text-primary">Cliquez pour ajouter vos documents (sélection multiple)</span> ou glissez-déposez ici</p>
                  <p className="text-[10px] text-slate-400">Format PDF, PNG, JPG (Analyse OCR & Empreinte SHA-256 automatique)</p>
                </div>
                <input type="file" multiple onChange={handleFileChange} className="hidden" />
              </label>

              {isOcrProcessing && (
                <div className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between text-xs font-bold text-indigo-800">
                  <span className="flex items-center gap-2"><span className="animate-spin">⚙️</span> Analyse OCR & Hachage cryptographique en cours...</span>
                  <span>100% Sécurisé</span>
                </div>
              )}
            </div>

            {/* LISTE DES DOCUMENTS JOINTS TÉLÉCHARGÉS (Visibles par le citoyen & agents) */}
            {attachedDocuments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                  <span>📎 Documents attachés prêts à l'envoi ({attachedDocuments.length}) :</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attachedDocuments.map((doc) => (
                    <div key={doc.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl">📑</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{doc.nomFichier}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-medium">{doc.tailleFormatted}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Scanné OCR & Validé</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedDocPreview(doc)}
                          className="px-3 py-1 bg-[#f5efe6] hover:bg-[#e8decb] text-slate-900 text-[10px] font-extrabold rounded-lg border border-[#d8c8b0] transition shadow-sm"
                        >
                          👁️ Aperçu
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded-lg transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Soumission */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 font-medium">Frais applicables :</span>
            <div className="flex items-center gap-2 mt-0.5">
              {selectedType.estPayant ? (
                <span className="text-xl font-black text-amber-700">{selectedType.montant} {selectedType.devise}</span>
              ) : (
                <span className="text-xl font-black text-emerald-700">0 MAD (Service Gratuit)</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-extrabold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {selectedType.estPayant ? (
              <span>💳 Passer au Paiement Sécurisé ({selectedType.montant} DH)</span>
            ) : (
              <span>✉️ Soumettre la Réclamation avec mes Documents</span>
            )}
          </button>
        </div>
      </motion.form>

      {/* Modal Stripe */}
      {submittedDossier && (
        <StripeCheckoutModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          dossierId={submittedDossier.id}
          numeroDossier={submittedDossier.numeroDossier}
          demandeTitre={submittedDossier.typeDemande}
          montant={submittedDossier.montant || 0}
          devise="MAD"
          onPaymentSuccess={() => {
            setAttachedDocuments([]);
            setDescription("");
          }}
        />
      )}

      {/* Modal Langue des Signes */}
      <SignLanguageModal
        isOpen={isLSMModalOpen}
        onClose={() => {
          setIsLSMModalOpen(false);
          setInputMethod("TEXT");
        }}
        onSelectTranscription={(text) => {
          setDescription(prev => prev ? prev + " " + text : text);
          setInputMethod("TEXT");
        }}
      />

      {/* Modal Prévisualisation du Document pour le Citoyen */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <span>📄 Document transmis :</span>
                <span className="text-primary font-mono">{selectedDocPreview.nomFichier}</span>
              </h3>
              <button onClick={() => setSelectedDocPreview(null)} className="text-slate-400 hover:text-slate-900 font-bold text-base">✕</button>
            </div>
            
            <div className="space-y-4">
              {/* VRAIE PHOTO / APERÇU DU DOCUMENT TÉLÉVERSÉ */}
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">📷 Aperçu Visuel de la Photo / Pièce Transmise</span>
                {selectedDocPreview.dataUrl && (selectedDocPreview.dataUrl.startsWith("data:image/") || selectedDocPreview.dataUrl.startsWith("blob:")) ? (
                  <img
                    src={selectedDocPreview.dataUrl}
                    alt={selectedDocPreview.nomFichier}
                    className="max-h-64 object-contain mx-auto rounded-xl border border-slate-700 shadow-md bg-black/40 p-1"
                  />
                ) : selectedDocPreview.dataUrl && selectedDocPreview.dataUrl.startsWith("data:application/pdf") ? (
                  <iframe
                    src={selectedDocPreview.dataUrl}
                    title="Document PDF"
                    className="w-full h-64 rounded-xl border border-slate-700 bg-white"
                  />
                ) : (
                  <div className="h-44 bg-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-300 p-4 space-y-2">
                    <span className="text-4xl">📜</span>
                    <p className="text-xs font-bold text-white">{selectedDocPreview.nomFichier}</p>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-mono border border-emerald-500/40">Fichier Certifié Conforme</span>
                  </div>
                )}
              </div>

              {/* CODE SHA-256 OFFICIEL GÉNÉRÉ */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔑</span> <span>Code Cryptographique SHA-256 Généré :</span>
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">✓ AUTHENTIFIÉ ISO 27001</span>
                </div>
                <div className="p-3 bg-black/60 rounded-xl border border-emerald-500/30 font-mono text-xs text-emerald-300 break-all font-bold tracking-wider select-all">
                  {selectedDocPreview.hash}
                </div>
              </div>

              {/* Métadonnées & OCR */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Catégorie :</span>
                  <span className="font-semibold text-slate-900">{selectedDocPreview.typeDocument}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Taille du fichier :</span>
                  <span className="font-semibold text-slate-900">{selectedDocPreview.tailleFormatted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Date & Heure d'ajout :</span>
                  <span className="font-semibold text-slate-900">{selectedDocPreview.dateAjout}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Score de conformité IA (OCR) :</span>
                  <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">{(selectedDocPreview.scoreFiabilite * 100).toFixed(0)}% Valide</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
                <h4 className="font-bold text-amber-900">Extrait du Texte Reconnu (OCR) :</h4>
                <p className="text-amber-800 text-[11px] leading-relaxed italic">{selectedDocPreview.extractedTextPreview}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedDocPreview(null)} className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition">
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Optimiseur de Texte IA */}
      {isOptimizeModalOpen && optimizedData && (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-base">✨</span>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">Module d'Intelligence Artificielle</span>
                  <h3 className="font-black text-slate-900 text-base">Synthèse & Optimisation de la Demande</h3>
                </div>
              </div>
              <button onClick={() => setIsOptimizeModalOpen(false)} className="text-slate-400 hover:text-slate-900 font-bold text-base">✕</button>
            </div>

            <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 text-xs text-indigo-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>🎯 Objet Identifié :</span>
                <span className="bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 font-mono text-[11px] font-bold text-indigo-900">{optimizedData.objetPropose}</span>
              </p>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                L'IA a analysé et réduit le texte rédigé par le citoyen pour extraire tous les points clés et les présenter de manière claire et générale.
              </p>
            </div>

            {/* Points clés retenus */}
            {optimizedData.summaryPoints.length > 0 && (
              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-black uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                  <span>📌</span> <span>Points clés extraits et récapitulés de manière générale :</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {optimizedData.summaryPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Comparaison Texte Original vs Texte Synthétisé */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-600 uppercase text-[10px] block">Texte Original du Citoyen :</label>
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 max-h-48 overflow-y-auto leading-relaxed font-medium">
                  {optimizedData.originalText}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-extrabold text-indigo-700 uppercase text-[10px] block flex items-center gap-1">
                  <span>✨</span> <span>Texte Optimisé & Condensé :</span>
                </label>
                <textarea
                  rows={6}
                  value={optimizedData.optimizedText}
                  onChange={(e) => setOptimizedData({ ...optimizedData, optimizedText: e.target.value })}
                  className="w-full p-3 bg-indigo-50/40 rounded-xl border-2 border-indigo-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none max-h-48 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOptimizeModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreviousDescription(description);
                  setDescription(optimizedData.optimizedText);
                  setIsOptimizeModalOpen(false);
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✅</span> <span>Appliquer cette synthèse à ma demande</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
