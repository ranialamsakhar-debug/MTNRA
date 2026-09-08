import { create } from 'zustand';

export interface User {
  cin: string;
  nom: string;
  prenom: string;
  role: string;
  token: string;
  email?: string;
  matricule?: string;
  serviceAffectation?: string;
  cniPhotoUrl?: string;
  cniPhotoUploadedAt?: string;
}

export interface ProfileInfo {
  nom: string;
  prenom: string;
  cin: string;
  email: string;
  telephone: string;
  matricule?: string;
  service?: string;
  defaultAvatar: string;
}

export const ROLE_PROFILES: Record<string, ProfileInfo> = {
  CITOYEN: {
    nom: "LAMSAKHAR",
    prenom: "Rania",
    cin: "AI225",
    email: "rania.lamsakhar@tawsa.ma",
    telephone: "0639475920",
    defaultAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  AGENT_RECLAMATION: {
    nom: "BENALI",
    prenom: "Ahmed",
    cin: "BK50312",
    email: "ahmed.benali@tawsa.ma",
    telephone: "0661223344",
    matricule: "MAT-REC-2001",
    service: "Service Réclamations & Qualification",
    defaultAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"
  },
  AGENT_VALIDATION: {
    nom: "EL IDRISSI",
    prenom: "Karim",
    cin: "CD78901",
    email: "karim.elidrissi@tawsa.ma",
    telephone: "0662334455",
    matricule: "MAT-VAL-2002",
    service: "Service Validation & Instruction",
    defaultAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"
  },
  AGENT_CERTIFICATION: {
    nom: "ZAHRA",
    prenom: "Fatima",
    cin: "EF12345",
    email: "fatima.zahra@tawsa.ma",
    telephone: "0663445566",
    matricule: "MAT-CER-2003",
    service: "Service Certification & Attestation",
    defaultAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
  },
  AGENT_SIGNATURE: {
    nom: "MANSOURI",
    prenom: "Samira",
    cin: "GH67890",
    email: "samira.mansouri@tawsa.ma",
    telephone: "0664556677",
    matricule: "MAT-SIG-2004",
    service: "Service Signature & Clôture",
    defaultAvatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80"
  },
  MEDIATEUR: {
    nom: "TAZI",
    prenom: "Youssef",
    cin: "IJ11223",
    email: "youssef.tazi@tawsa.ma",
    telephone: "0665667788",
    matricule: "INST-IJ11223",
    service: "Institution du Médiateur du Royaume",
    defaultAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  RESPONSABLE_SERVICE: {
    nom: "ALAMI",
    prenom: "Rachid",
    cin: "KL44556",
    email: "rachid.alami@tawsa.ma",
    telephone: "0666778899",
    matricule: "MAT-RES-2006",
    service: "Direction Générale Centralisée",
    defaultAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  ADMINISTRATEUR: {
    nom: "CHRAIBI",
    prenom: "Meryem",
    cin: "MN77889",
    email: "meryem.chraibi@tawsa.ma",
    telephone: "0667889900",
    matricule: "MAT-ADM-2007",
    service: "Administration IT & Sécurité",
    defaultAvatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80"
  }
};

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  uploadCniPhotoOnce: (photoUrl: string) => boolean;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const getSavedCniPhoto = (cin?: string): string | null => {
  try {
    if (cin) {
      const p1 = localStorage.getItem('tawsa_cni_photo_' + cin);
      if (p1 && p1.length > 20) return p1;
    }
    const p2 = localStorage.getItem('tawsa_cni_photo_AI225');
    if (p2 && p2.length > 20) return p2;
    const p3 = localStorage.getItem('tawsa_cni_photo');
    if (p3 && p3.length > 20) return p3;
  } catch (e) {
    console.error("Erreur lecture photo localStorage", e);
  }
  return null;
};

const getInitialUser = (): User | null => {
  try {
    const stored = localStorage.getItem('tawsa_user');
    if (stored) {
      const parsed = JSON.parse(stored) as User;
      if (parsed && parsed.role) {
        const defaultProfile = ROLE_PROFILES[parsed.role] || ROLE_PROFILES.CITOYEN;
        
        parsed.prenom = defaultProfile.prenom;
        parsed.nom = defaultProfile.nom;
        parsed.cin = defaultProfile.cin;
        parsed.email = defaultProfile.email;
        parsed.matricule = defaultProfile.matricule;
        parsed.serviceAffectation = defaultProfile.service;

        // Récupérer la photo scannée réellement par l'utilisateur si elle existe
        const savedCustomPhoto = getSavedCniPhoto(parsed.cin);
        parsed.cniPhotoUrl = savedCustomPhoto || (parsed.role === 'CITOYEN' ? undefined : defaultProfile.defaultAvatar);
        parsed.cniPhotoUploadedAt = savedCustomPhoto 
          ? (localStorage.getItem('tawsa_cni_photo_date_' + parsed.cin) || '2026-08-31') 
          : undefined;

        localStorage.setItem('tawsa_user', JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erreur lecture utilisateur localStorage', e);
  }

  const defaultProfile = ROLE_PROFILES.CITOYEN;
  const savedCustomPhoto = getSavedCniPhoto(defaultProfile.cin);

  const defaultUser: User = {
    cin: defaultProfile.cin,
    nom: defaultProfile.nom,
    prenom: defaultProfile.prenom,
    role: 'CITOYEN',
    token: 'jwt-demo',
    email: defaultProfile.email,
    cniPhotoUrl: savedCustomPhoto || undefined,
    cniPhotoUploadedAt: savedCustomPhoto ? '2026-08-31' : undefined
  };

  try {
    localStorage.setItem('tawsa_user', JSON.stringify(defaultUser));
  } catch (e) {
    console.error('Erreur écriture utilisateur par défaut', e);
  }
  return defaultUser;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUser(),
  login: (userData) => {
    const roleKey = userData.role || 'CITOYEN';
    const roleProfile = ROLE_PROFILES[roleKey] || ROLE_PROFILES.CITOYEN;

    const cinClean = roleProfile.cin;
    const prenomClean = roleProfile.prenom;
    const nomClean = roleProfile.nom;

    // Charger uniquement la photo scannée réellement par l'utilisateur du CIN concerné
    const savedCustomPhoto = getSavedCniPhoto(cinClean);
    const savedDate = savedCustomPhoto ? (localStorage.getItem('tawsa_cni_photo_date_' + cinClean) || '2026-08-31') : undefined;

    const cleanUser: User = {
      ...userData,
      role: roleKey,
      prenom: prenomClean,
      nom: nomClean,
      cin: cinClean,
      email: roleProfile.email,
      matricule: roleProfile.matricule,
      serviceAffectation: roleProfile.service,
      cniPhotoUrl: savedCustomPhoto || (roleKey === 'CITOYEN' ? undefined : roleProfile.defaultAvatar),
      cniPhotoUploadedAt: savedDate
    };

    localStorage.setItem('tawsa_user', JSON.stringify(cleanUser));
    set({ user: cleanUser });
  },

  uploadCniPhotoOnce: (photoUrl: string) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    const cinKey = currentUser.cin;
    const uploadDate = new Date().toISOString().replace('T', ' ').substring(0, 16);

    try {
      // Persistance stricte par CIN individuel
      localStorage.setItem('tawsa_cni_photo_' + cinKey, photoUrl);
      localStorage.setItem('tawsa_cni_photo_date_' + cinKey, uploadDate);
    } catch (e) {
      console.error('Erreur stockage de la photo CNI', e);
    }

    const updatedUser: User = {
      ...currentUser,
      cniPhotoUrl: photoUrl,
      cniPhotoUploadedAt: uploadDate
    };

    try {
      localStorage.setItem('tawsa_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Erreur mise à jour utilisateur avec photo CNI', e);
    }

    set({ user: updatedUser });
    return true;
  },

  logout: () => {
    const currentUser = get().user;
    if (currentUser?.cniPhotoUrl && currentUser.cin) {
      try {
        localStorage.setItem('tawsa_cni_photo_' + currentUser.cin, currentUser.cniPhotoUrl);
        if (currentUser.cniPhotoUploadedAt) {
          localStorage.setItem('tawsa_cni_photo_date_' + currentUser.cin, currentUser.cniPhotoUploadedAt);
        }
      } catch (e) {
        console.error('Erreur sauvegarde photo lors de la déconnexion', e);
      }
    }
    localStorage.removeItem('tawsa_user');
    set({ user: null });
  },

  isAuthenticated: () => get().user !== null,
}));
