import { create } from 'zustand';

export interface DocumentItem {
  id: string;
  nomFichier: string;
  typeDocument: string;
  tailleFormatted: string;
  dateAjout: string;
  hash: string;
  verifie: boolean;
  scoreFiabilite: number;
  extractedTextPreview: string;
  dataUrl?: string;
}

export interface AgentInfo {
  matricule: string;
  nom: string;
  prenom: string;
  role: string;
  service: string;
  email: string;
  telephone: string;
}

export const DEFAULT_AGENT_RECLAMATION: AgentInfo = {
  matricule: "MAT-REC-2001",
  nom: "Benali",
  prenom: "Ahmed",
  role: "Agent Réclamation & Orientation (Niveau 1)",
  service: "Service Réclamation & Guichet Unifié",
  email: "ahmed.benali@tawsa.ma",
  telephone: "05 37 20 20 20"
};

export interface DossierActionHistory {
  id: string;
  date: string;
  auteur: string;
  auteurRole: string;
  action: "QUALIFICATION" | "DEMANDE_PIECE" | "VALIDATION" | "CERTIFICATION" | "SIGNATURE" | "REJET";
  commentaire: string;
}

export interface DossierItem {
  id: string;
  numeroDossier: string;
  citoyenNom: string;
  citoyenCnie: string;
  typeDemande: string;
  description: string;
  dateCreation: string;
  statut: "SOUMIS" | "EN_COURS" | "EN_ATTENTE_PIECE" | "VALIDE" | "CERTIFIE" | "SIGNE" | "REJETE" | "SUSPECT_FRAUDE";
  documents: DocumentItem[];
  agentAffecte: AgentInfo;
  montant?: number;
  estPayant?: boolean;
  
  // Gestion conditionnelle de la demande de pièces urgentes et des remarques/décisions
  demandeDocumentsSupplementaires?: boolean;
  motifDemandePiece?: string;
  remarqueAgent?: string;
  historiqueActions?: DossierActionHistory[];
}

const SAMPLE_DOSSIERS: DossierItem[] = [
  {
    id: "DOS-2026-89421",
    numeroDossier: "DOS-2026-89421",
    citoyenNom: "Rania Lamsakhar",
    citoyenCnie: "AI225",
    typeDemande: "Réclamation Administrative Générale",
    description: "Demande de vérification de délai concernant l'instruction du registre de commerce et le transfert de propriété.",
    dateCreation: "2026-08-31 10:15",
    statut: "EN_ATTENTE_PIECE",
    montant: 0,
    estPayant: false,
    agentAffecte: DEFAULT_AGENT_RECLAMATION,
    demandeDocumentsSupplementaires: true,
    motifDemandePiece: "Copie récente du Registre de Commerce (Modèle J) et justificatif de domicile réactualisé de moins de 3 mois.",
    remarqueAgent: "⚠️ Dossier en attente : Merci de transmettre la pièce complémentaire réclamée pour débloquer l'instruction.",
    historiqueActions: [
      {
        id: "act-1",
        date: "2026-08-31 11:30",
        auteur: "Ahmed Benali",
        auteurRole: "Agent Réclamation",
        action: "DEMANDE_PIECE",
        commentaire: "Demande de pièce complémentaire envoyée au citoyen (Copie Registre de Commerce)."
      }
    ],
    documents: [
      {
        id: "doc-1",
        nomFichier: "Copie_CNIE_Rania_Lamsakhar.pdf",
        typeDocument: "Copie de la CNI / CNIE",
        tailleFormatted: "1.4 MB",
        dateAjout: "2026-08-31 10:15",
        hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        verifie: true,
        scoreFiabilite: 0.98,
        extractedTextPreview: "ROYAUME DU MAROC - CARTE NATIONALE D'IDENTITE ELECTRONIQUE. Nom: LAMSAKHAR, Prénom: RANIA, N° CNIE: AI225."
      },
      {
        id: "doc-2",
        nomFichier: "Justificatif_Domicile_Casablanca.pdf",
        typeDocument: "Preuves ou courriers échangés",
        tailleFormatted: "850 KB",
        dateAjout: "2026-08-31 10:15",
        hash: "8f4e3c2b1a0d9e8f7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4",
        verifie: true,
        scoreFiabilite: 0.95,
        extractedTextPreview: "ATTESTATION DE RESIDENCE. Délivrée à Mme Rania Lamsakhar résidant à Bd Mohamed V, Casablanca."
      }
    ]
  },
  {
    id: "DOS-2026-75392",
    numeroDossier: "DOS-2026-75392",
    citoyenNom: "Khadija Alami",
    citoyenCnie: "CD789012",
    typeDemande: "Immatriculation & Fonds de Commerce",
    description: "Demande d'immatriculation du nouveau fonds de commerce pour la société Tifawin Tech SARL.",
    dateCreation: "2026-08-30 14:30",
    statut: "VALIDE",
    montant: 200,
    estPayant: true,
    demandeDocumentsSupplementaires: false,
    remarqueAgent: "✅ Dossier examiné et validé par l'Agent Karim El Idrissi. Conformité certifiée sans réserve.",
    agentAffecte: {
      matricule: "MAT-VAL-2002",
      nom: "El Idrissi",
      prenom: "Karim",
      role: "Agent Validation & Conformité (Niveau 2)",
      service: "Service Instruction des Actes",
      email: "karim.elidrissi@tawsa.ma",
      telephone: "05 37 20 20 22"
    },
    historiqueActions: [
      {
        id: "act-2",
        date: "2026-08-30 16:45",
        auteur: "Karim El Idrissi",
        auteurRole: "Agent Validation",
        action: "VALIDATION",
        commentaire: "Validation de conformité effectuée avec succès. Statuts et paiement conformes."
      }
    ],
    documents: [
      {
        id: "doc-3",
        nomFichier: "Statuts_Societe_Tifawin.pdf",
        typeDocument: "Statuts (si société)",
        tailleFormatted: "3.2 MB",
        dateAjout: "2026-08-30 14:30",
        hash: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        verifie: true,
        scoreFiabilite: 0.99,
        extractedTextPreview: "STATUTS CONSTITUTIFS DE LA SOCIETE TIFAWIN TECH SARL. Capital social: 100 000 DH."
      }
    ]
  }
];

interface DossierState {
  dossiers: DossierItem[];
  addDossier: (dossier: DossierItem) => void;
  addDocumentsToDossier: (dossierId: string, newDocuments: DocumentItem[]) => void;
  requestAdditionalDocuments: (dossierId: string, motif: string, agentName: string) => void;
  updateDossierDecision: (dossierId: string, newStatut: DossierItem["statut"], commentaire: string, agentName: string, agentRole: string) => void;
  getDossierByNumero: (numero: string) => DossierItem | undefined;
}

const getInitialDossiers = (): DossierItem[] => {
  try {
    const stored = localStorage.getItem('tawsa_dossiers');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erreur chargement dossiers depuis localStorage', e);
  }
  return SAMPLE_DOSSIERS;
};

export const useDossierStore = create<DossierState>((set, get) => ({
  dossiers: getInitialDossiers(),
  
  addDossier: (dossier: DossierItem) => {
    set((state) => {
      const updated = [dossier, ...state.dossiers];
      try {
        localStorage.setItem('tawsa_dossiers', JSON.stringify(updated));
      } catch (e) {
        console.error('Erreur persistance localstorage dossiers', e);
      }
      return { dossiers: updated };
    });
  },

  addDocumentsToDossier: (dossierId: string, newDocuments: DocumentItem[]) => {
    set((state) => {
      const updated = state.dossiers.map(dossier => {
        if (dossier.id === dossierId || dossier.numeroDossier === dossierId) {
          return {
            ...dossier,
            // Une fois le document urgent ajouté par le citoyen, réinitialiser la demande de pièces
            demandeDocumentsSupplementaires: false,
            statut: dossier.statut === "EN_ATTENTE_PIECE" ? ("EN_COURS" as const) : dossier.statut,
            remarqueAgent: `✅ Document urgent transmis par le citoyen le ${new Date().toISOString().substring(0, 10)}. Instruction reprise par l'agent.`,
            documents: [...dossier.documents, ...newDocuments]
          };
        }
        return dossier;
      });
      try {
        localStorage.setItem('tawsa_dossiers', JSON.stringify(updated));
      } catch (e) {
        console.error('Erreur persistance localstorage dossiers', e);
      }
      return { dossiers: updated };
    });
  },

  requestAdditionalDocuments: (dossierId: string, motif: string, agentName: string) => {
    set((state) => {
      const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const updated = state.dossiers.map(dossier => {
        if (dossier.id === dossierId || dossier.numeroDossier === dossierId) {
          const actionHistory: DossierActionHistory = {
            id: 'act-' + Date.now(),
            date: nowFormatted,
            auteur: agentName,
            auteurRole: 'Agent Instructeur',
            action: 'DEMANDE_PIECE',
            commentaire: motif
          };
          return {
            ...dossier,
            demandeDocumentsSupplementaires: true,
            motifDemandePiece: motif,
            remarqueAgent: `⚠️ Demande de pièce urgente émise par ${agentName} : ${motif}`,
            statut: "EN_ATTENTE_PIECE" as const,
            historiqueActions: [...(dossier.historiqueActions || []), actionHistory]
          };
        }
        return dossier;
      });
      try {
        localStorage.setItem('tawsa_dossiers', JSON.stringify(updated));
      } catch (e) {
        console.error('Erreur sauvegarde demande pièces', e);
      }
      return { dossiers: updated };
    });
  },

  updateDossierDecision: (dossierId: string, newStatut: DossierItem["statut"], commentaire: string, agentName: string, agentRole: string) => {
    set((state) => {
      const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const actionType = newStatut === "VALIDE" ? "VALIDATION" : newStatut === "REJETE" ? "REJET" : "QUALIFICATION";
      const updated = state.dossiers.map(dossier => {
        if (dossier.id === dossierId || dossier.numeroDossier === dossierId) {
          const actionHistory: DossierActionHistory = {
            id: 'act-' + Date.now(),
            date: nowFormatted,
            auteur: agentName,
            auteurRole: agentRole,
            action: actionType,
            commentaire: commentaire
          };
          return {
            ...dossier,
            statut: newStatut,
            remarqueAgent: commentaire,
            demandeDocumentsSupplementaires: false,
            historiqueActions: [...(dossier.historiqueActions || []), actionHistory]
          };
        }
        return dossier;
      });
      try {
        localStorage.setItem('tawsa_dossiers', JSON.stringify(updated));
      } catch (e) {
        console.error('Erreur sauvegarde décision dossier', e);
      }
      return { dossiers: updated };
    });
  },

  getDossierByNumero: (numero: string) => {
    return get().dossiers.find(d => d.numeroDossier === numero || d.id === numero);
  }
}));
