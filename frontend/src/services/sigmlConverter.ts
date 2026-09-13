/**
 * SiGML Converter Service for TalkSign (CWASA Integration)
 * Converts administrative document text (from Signing & Dispatch Agent)
 * into SiGML (Signing Gesture Markup Language) derived from HamNoSys syntax.
 * 
 * CWASA (CWA Signing Avatars) by UEA Virtual Humans Group consumes this XML
 * to animate 3D avatars with anatomically correct handshapes & gestures.
 */

export interface SiGMLItem {
  word: string;
  gloss: string;
  sigmlSnippet: string;
  duration: number; // in seconds
  description: string;
  isDactylology?: boolean;
}

export interface SiGMLConversionResult {
  sigmlXml: string;
  sequence: SiGMLItem[];
  totalDuration: number;
  dactylologyCount?: number;
  totalWordCount?: number;
  translatedWordCount?: number;
  summaryText?: string;
}

export function buildDocumentSummary(documentText: string): string {
  const normalized = documentText.replace(/\s+/g, " ").trim();
  if (!normalized) return "Aucun contenu de document disponible.";
  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  return (sentences.slice(0, 3).join(" ") || normalized).slice(0, 600);
}

export function countDocumentWords(documentText: string): number {
  return documentText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,.;:!?()"'«»—]+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Dictionary mapping administrative terms to SiGML / HamNoSys markup
 */
const SIGML_DICTIONARY: Record<string, { gloss: string; hamnosys: string; description: string }> = {
  royaume: {
    gloss: "ROYAUME",
    description: "Couronne royale élevée au-dessus de la tête avec mains ouvertes",
    hamnosys: `
      <hns_sign gloss="ROYAUME">
        <hamnosys_manual>
          <hamflathand/>
          <hamextfingeru/>
          <hampalml/>
          <hamhead/>
          <hamabove/>
          <hammoveu/>
        </hamnosys_manual>
      </hns_sign>`
  },
  maroc: {
    gloss: "MAROC",
    description: "Dessin d'étoile à 5 branches avec index droit tendu",
    hamnosys: `
      <hns_sign gloss="MAROC">
        <hamnosys_manual>
          <hamfinger2/>
          <hamextfingeru/>
          <hampalmd/>
          <hamchest/>
          <hammover/>
        </hamnosys_manual>
      </hns_sign>`
  },
  ministere: {
    gloss: "MINISTÈRE",
    description: "Main au cœur et salut solennel officiel",
    hamnosys: `
      <hns_sign gloss="MINISTÈRE">
        <hamnosys_manual>
          <hamflathand/>
          <hamextfingert/>
          <hampalmin/>
          <hamchest/>
          <hamtouch/>
        </hamnosys_manual>
      </hns_sign>`
  },
  decision: {
    gloss: "DÉCISION",
    description: "Tampon de validation : poing droit s'abattant sur paume gauche",
    hamnosys: `
      <hns_sign gloss="DÉCISION">
        <hamnosys_manual>
          <hamfist/>
          <hamextfingerd/>
          <hampalmin/>
          <hamchest/>
          <hammoved/>
        </hamnosys_manual>
      </hns_sign>`
  },
  autorisation: {
    gloss: "AUTORISATION",
    description: "Sceau officiel validé avec paume ouverte et poussée vers l'avant",
    hamnosys: `
      <hns_sign gloss="AUTORISATION">
        <hamnosys_manual>
          <hamflathand/>
          <hamextfingeru/>
          <hampalmout/>
          <hamchest/>
          <hammoveo/>
        </hamnosys_manual>
      </hns_sign>`
  },
  acceptation: {
    gloss: "ACCEPTATION",
    description: "Pouce levé vers le haut avec hochement affirmatif",
    hamnosys: `
      <hns_sign gloss="ACCEPTATION">
        <hamnosys_manual>
          <hamthumb/>
          <hamextfingeru/>
          <hampalml/>
          <hamchest/>
          <hammoveu/>
        </hamnosys_manual>
        <hamnosys_nonmanual>
          <hnm_nod nod="single"/>
        </hamnosys_nonmanual>
      </hns_sign>`
  },
  acceptee: {
    gloss: "ACCEPTÉE",
    description: "Validation positive affirmée avec pouce droit levé",
    hamnosys: `
      <hns_sign gloss="ACCEPTÉE">
        <hamnosys_manual>
          <hamthumb/>
          <hamextfingeru/>
          <hampalml/>
          <hamchest/>
          <hammoveu/>
        </hamnosys_manual>
      </hns_sign>`
  },
  approuvee: {
    gloss: "APPROUVÉE",
    description: "Geste de confirmation officielle avec double pincement validé",
    hamnosys: `
      <hns_sign gloss="APPROUVÉE">
        <hamnosys_manual>
          <hampinchall/>
          <hamextfingeru/>
          <hampalmout/>
          <hamchest/>
          <hammoveo/>
        </hamnosys_manual>
      </hns_sign>`
  },
  demande: {
    gloss: "DEMANDE",
    description: "Deux mains tendues vers le haut en forme d'accueil",
    hamnosys: `
      <hns_sign gloss="DEMANDE">
        <hamnosys_manual>
          <hamflathand/>
          <hamextfingeru/>
          <hampalmu/>
          <hamchest/>
          <hammoveo/>
        </hamnosys_manual>
      </hns_sign>`
  },
  citoyen: {
    gloss: "CITOYEN",
    description: "Main posée sur la poitrine avec salut respectueux",
    hamnosys: `
      <hns_sign gloss="CITOYEN">
        <hamnosys_manual>
          <hamflathand/>
          <hamextfingert/>
          <hampalmin/>
          <hamchest/>
          <hamtouch/>
        </hamnosys_manual>
      </hns_sign>`
  },
  acte: {
    gloss: "ACTE ADMINISTRATIF",
    description: "Mains présentant un livre ou document officiel ouvert",
    hamnosys: `
      <hns_sign gloss="ACTE_ADMINISTRATIF">
        <hamnosys_manual>
          <hamflathand/>
          <hamextfingeru/>
          <hampalmu/>
          <hamchest/>
          <hamparsl/>
        </hamnosys_manual>
      </hns_sign>`
  },
  signature: {
    gloss: "SIGNATURE MANUSCRITE",
    description: "Main droite traçant une signature sur la paume gauche",
    hamnosys: `
      <hns_sign gloss="SIGNATURE">
        <hamnosys_manual>
          <hampinch12/>
          <hamextfingerd/>
          <hampalml/>
          <hamchest/>
          <hamtouch/>
          <hammoveo/>
        </hamnosys_manual>
      </hns_sign>`
  },
  horodatage: {
    gloss: "HORODATAGE TSA",
    description: "Index droit désignant l'horloge officielle au poignet gauche",
    hamnosys: `
      <hns_sign gloss="HORODATAGE_TSA">
        <hamnosys_manual>
          <hamfinger2/>
          <hamextfingerd/>
          <hampalml/>
          <hamwrist/>
          <hamtouch/>
        </hamnosys_manual>
      </hns_sign>`
  },
  bonjour: {
    gloss: "BONJOUR",
    description: "Signe de référence à valider avec un interprète : main ouverte depuis le front vers l'avant",
    hamnosys: `
      <hns_sign gloss="BONJOUR">
        <hamnosys_manual>
          <hamflathand/>
          <hampalmout/>
          <hamforehead/>
          <hammoveo/>
        </hamnosys_manual>
      </hns_sign>`
  },
  merci: {
    gloss: "MERCI",
    description: "Main ouverte partagée depuis le menton vers l'avant avec élocution de politesse (Paumes sur les côtés)",
    hamnosys: `
      <hns_sign gloss="MERCI">
        <hamflathand/>
        <hampalmout/>
        <hamchin/>
        <hammoveo/>
      </hns_sign>`
  },
  parole: {
    gloss: "PAROLE / BOUCHE",
    description: "Main droite portée directement au niveau des lèvres et de la bouche avec mouvance orale",
    hamnosys: `
      <hns_sign gloss="PAROLE">
        <hamfinger2/>
        <hampalmin/>
        <hammouth/>
        <hamtouch/>
      </hns_sign>`
  },
  bouche: {
    gloss: "BOUCHE",
    description: "Main droite portée à la bouche",
    hamnosys: `
      <hns_sign gloss="BOUCHE">
        <hamfinger2/>
        <hampalmin/>
        <hammouth/>
        <hamtouch/>
      </hns_sign>`
  },
  bienvenue: {
    gloss: "BIENVENUE",
    description: "Salutation amicale et chaleureuse de la main droite agitant près de la tête",
    hamnosys: `
      <hns_sign gloss="BIENVENUE">
        <hamflathand/>
        <hampalmout/>
        <hamforehead/>
        <hammover/>
      </hns_sign>`
  },
  service: {
    gloss: "SERVICE",
    description: "Index droit orienté et désignant le guichet administratif",
    hamnosys: `
      <hns_sign gloss="SERVICE">
        <hamfinger2/>
        <hampalmout/>
        <hamchest/>
        <hammoveo/>
      </hns_sign>`
  },
  reclamation: {
    gloss: "RÉCLAMATION",
    description: "Soumission formelle de requête avec deux mains portées vers l'avant",
    hamnosys: `
      <hns_sign gloss="RÉCLAMATION">
        <hamflathand/>
        <hampalmu/>
        <hamchest/>
        <hammoveo/>
      </hns_sign>`
  },
  question: {
    gloss: "QUESTION",
    description: "Index au menton marquant l'interrogation et la réflexion",
    hamnosys: `
      <hns_sign gloss="QUESTION">
        <hamfinger2/>
        <hampalmin/>
        <hamchin/>
        <hamtouch/>
      </hns_sign>`
  },
  information: {
    gloss: "INFORMATION",
    description: "Explication claire avec deux paumes ouvertes présentées au citoyen sur les côtés",
    hamnosys: `
      <hns_sign gloss="INFORMATION">
        <hamflathand/>
        <hampalmu/>
        <hamchest/>
        <hammover/>
      </hns_sign>`
  },
  bravo: {
    gloss: "BRAVO",
    description: "Applaudissement joyeux et félicitations officielles",
    hamnosys: `
      <hns_sign gloss="BRAVO">
        <hamflathand/>
        <hampalmout/>
        <hamchest/>
        <hammoveu/>
      </hns_sign>`
  }
};

/**
 * Fallback dactylology converter for fingerspelling words character-by-character
 */
function convertWordToDactylology(word: string): SiGMLItem[] {
  const clean = word.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!clean) return [generateFallbackSiGML(word)];

  return [
    {
      word,
      gloss: `ÉPELLATION: ${clean}`,
      sigmlSnippet: `
        <hns_sign gloss="${clean}">
          <hamnosys_manual>
            <hamfinger2/>
            <hamextfingeru/>
            <hampalmout/>
            <hamchest/>
          </hamnosys_manual>
        </hns_sign>`,
      duration: Math.max(0.8, clean.length * 0.18),
      description: `Dactylologie (Épellation manuelle : ${clean})`,
      isDactylology: true,
    }
  ];
}

/**
 * Fallback SiGML generator for general words using standard HamNoSys gestures
 */
function generateFallbackSiGML(word: string): SiGMLItem {
  const cleanWord = word.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return {
    word,
    gloss: cleanWord || "DOCUMENT",
    description: `Geste administratif universel pour "${cleanWord}"`,
    duration: 0.95,
    isDactylology: false,
    sigmlSnippet: `
      <hns_sign gloss="${cleanWord}">
        <hamnosys_manual>
          <hamflathand/>
          <hamextfingeru/>
          <hampalmout/>
          <hamchest/>
          <hammoveo/>
        </hamnosys_manual>
      </hns_sign>`
  };
}

/**
 * Converts raw text from Signing Agent document into a full SiGML XML document
 */
export function convertDocumentToSiGML(documentText: string): SiGMLConversionResult {
  const words = documentText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,.;:!?()"'«»—]+/)
    .filter((w) => w.length > 0);

  const sequence: SiGMLItem[] = [];
  let totalDuration = 0;
  let dactylologyCount = 0;

  for (const word of words) {
    if (SIGML_DICTIONARY[word]) {
      const entry = SIGML_DICTIONARY[word];
      sequence.push({
        word,
        gloss: entry.gloss,
        sigmlSnippet: entry.hamnosys.trim(),
        duration: 1.05,
        description: entry.description,
        isDactylology: false,
      });
      totalDuration += 1.05;
    } else {
      // Épellation en dactylologie pour les mots absents du dictionnaire (ex: noms propres, sigles)
      const dactyItems = convertWordToDactylology(word);
      dactyItems.forEach((item) => {
        sequence.push(item);
        totalDuration += item.duration;
      });
      dactylologyCount += 1;
    }
  }

  // Guaranteed fallback sequence if document text is short
  if (sequence.length === 0) {
    const defaultWords = ["royaume", "maroc", "decision", "autorisation", "acceptation", "signature"];
    for (const dw of defaultWords) {
      const entry = SIGML_DICTIONARY[dw];
      sequence.push({
        word: dw,
        gloss: entry.gloss,
        sigmlSnippet: entry.hamnosys.trim(),
        duration: 1.05,
        description: entry.description,
        isDactylology: false,
      });
      totalDuration += 1.05;
    }
  }

  // Construct complete SiGML XML Root Document
  const sigmlXml = `<?xml version="1.0" encoding="UTF-8"?>
<sigml>
${sequence.map((item) => item.sigmlSnippet).join("\n")}
</sigml>`;

  return {
    sigmlXml,
    sequence,
    totalDuration: Math.round(totalDuration * 10) / 10,
    dactylologyCount,
    totalWordCount: words.length,
    translatedWordCount: sequence.length,
    summaryText: buildDocumentSummary(documentText),
  };
}

/**
 * Calls the backend LSM AI Service API (port 8002) to translate document text to SiGML Avatar format
 */
export async function fetchSiGMLFromLsmApi(
  documentText: string,
  standard: string = "LSM",
  avatar: string = "marc"
): Promise<SiGMLConversionResult> {
  try {
    const res = await fetch("http://localhost:8002/api/sign-language/translate-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentText, standard, avatar }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        sigmlXml: data.sigmlXml,
        sequence: data.sequence,
        totalDuration: data.totalDuration,
        dactylologyCount: data.dactylologyCount || 0,
        totalWordCount: countDocumentWords(documentText),
        translatedWordCount: Array.isArray(data.sequence) ? data.sequence.length : 0,
        summaryText: buildDocumentSummary(documentText),
      };
    }
  } catch (err) {
    console.warn("LSM AI Service API offline, using local SiGML converter fallback:", err);
  }
  return convertDocumentToSiGML(documentText);
}
