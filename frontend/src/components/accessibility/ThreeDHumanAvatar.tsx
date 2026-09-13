import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type GestureMotionType =
  | "salut-bienvenue"
  | "explication-paumes"
  | "reflexion-menton"
  | "applaudissement"
  | "pointage-direction"
  | "couronne"
  | "etoile"
  | "salut-solennel"
  | "tampon-main"
  | "livre-ouvert"
  | "pouce-haut"
  | "demande-soumettre"
  | "main-coeur"
  | "v-victoire"
  | "sceau-droit"
  | "ecriture-paume"
  | "clock-tsa"
  | "main-bouche"
  | "comptage-doigts"
  | "bras-croises"
  | "mains-bas-ventre"
  | "paumes-bas-ventre"
  | "croisement-bas-ventre"
  | "mains-sur-bouche"
  | "main-poitrine"
  | "doigt-verso-main"
  | "mains-jointes"
  | "index-paume"
  | "frappe-poing-paume"
  | "entrelacement-doigts"
  | "neutre";

export type CameraPreset = "face" | "upper" | "full";

export interface ThreeDHumanAvatarProps {
  motion?: GestureMotionType;
  glossText?: string;
  speed?: number;
  isPlaying?: boolean;
  avatarUrl?: string;
  cameraPreset?: CameraPreset;
  showControls?: boolean;
  isFullWindow?: boolean;
  sigmlXml?: string;
  gestureIndex?: number;
  gestureDurations?: number[];
}

interface ProfessionalPoseKeyframe {
  headRot: [number, number, number];
  leftArmRot: [number, number, number];
  leftForearmRot: [number, number, number];
  leftWristRot: [number, number, number];
  rightArmRot: [number, number, number];
  rightForearmRot: [number, number, number];
  rightWristRot: [number, number, number];
}

const PROF_POSES: Record<GestureMotionType, ProfessionalPoseKeyframe> = {
  neutre: {
    headRot: [0.02, 0, 0],
    leftArmRot: [-0.15, 0.35, 0.85], // Mains posées naturellement sur les hanches/côtés
    leftForearmRot: [-1.35, 0.4, 0.5],
    leftWristRot: [0.3, 0.2, 0],
    rightArmRot: [-0.15, -0.35, -0.85], // Mains posées naturellement sur les hanches/côtés
    rightForearmRot: [-1.35, -0.4, -0.5],
    rightWristRot: [0.3, -0.2, 0],
  },
  "salut-bienvenue": {
    headRot: [0.08, 0.1, 0],
    leftArmRot: [0.1, 0.1, 1.25],
    leftForearmRot: [0.2, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.4, 0.2, -0.6],
    rightForearmRot: [-1.2, 0.2, 0.2],
    rightWristRot: [0.1, 0.2, 0],
  },
  "explication-paumes": {
    headRot: [0.05, 0, 0],
    leftArmRot: [-0.2, 0.4, 0.75],
    leftForearmRot: [-0.9, 0.2, 0.2],
    leftWristRot: [0.2, -0.1, 0],
    rightArmRot: [-0.2, -0.4, -0.75],
    rightForearmRot: [-0.9, -0.2, -0.2],
    rightWristRot: [0.2, 0.1, 0],
  },
  "reflexion-menton": {
    headRot: [0.15, -0.12, 0],
    leftArmRot: [-0.5, 0.6, 0.4],
    leftForearmRot: [-1.6, 0.4, 0.3],
    leftWristRot: [0.1, 0, 0],
    rightArmRot: [-1.15, 0.35, 0.05], // Doigts touchant directement le menton
    rightForearmRot: [-2.35, -0.3, 0.35],
    rightWristRot: [-0.35, 0.45, -0.15],
  },
  applaudissement: {
    headRot: [0.05, 0, 0],
    leftArmRot: [-0.4, 0.3, 0.4],
    leftForearmRot: [-1.4, 0.2, 0.3],
    leftWristRot: [0.1, 0.1, 0],
    rightArmRot: [-0.4, -0.3, -0.4],
    rightForearmRot: [-1.4, -0.2, -0.3],
    rightWristRot: [0.1, -0.1, 0],
  },
  "pointage-direction": {
    headRot: [0.05, 0.15, 0],
    leftArmRot: [0.1, 0.1, 1.25],
    leftForearmRot: [0.2, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.5, -0.3, -0.5],
    rightForearmRot: [-0.9, 0.1, -0.1],
    rightWristRot: [0.2, -0.1, 0],
  },
  "main-bouche": {
    headRot: [0.1, 0, 0],
    leftArmRot: [0.1, 0.1, 1.25],
    leftForearmRot: [0.2, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-1.25, 0.45, 0.1], // Doigts touchant directement les lèvres/bouche
    rightForearmRot: [-2.5, -0.3, 0.4],
    rightWristRot: [-0.4, 0.5, -0.2],
  },
  "comptage-doigts": {
    headRot: [0.1, 0, 0],
    leftArmRot: [-0.2, 0.3, 0.6],
    leftForearmRot: [-1.0, 0.3, 0.3],
    leftWristRot: [0.2, 0.1, 0],
    rightArmRot: [-0.3, -0.2, -0.5],
    rightForearmRot: [-1.1, -0.2, -0.2],
    rightWristRot: [0.2, -0.1, 0],
  },
  "bras-croises": {
    headRot: [0, 0, 0],
    leftArmRot: [-0.65, 0.65, 0.35], // Bras croisés naturellement sur le torse pendant la parole
    leftForearmRot: [-1.95, 0.45, 0.35],
    leftWristRot: [0.2, 0, 0],
    rightArmRot: [-0.65, -0.65, -0.35], // Bras croisés naturellement sur le torse pendant la parole
    rightForearmRot: [-1.95, -0.45, -0.35],
    rightWristRot: [0.2, 0, 0],
  },
  "mains-bas-ventre": {
    headRot: [0.03, 0, 0],
    leftArmRot: [-0.3, 0.45, 0.45], // Mains jointes et posées bas au niveau du ventre
    leftForearmRot: [-0.95, 0.35, 0.3],
    leftWristRot: [0.25, 0.2, 0],
    rightArmRot: [-0.3, -0.45, -0.45], // Mains jointes et posées bas au niveau du ventre
    rightForearmRot: [-0.95, -0.35, -0.3],
    rightWristRot: [0.25, -0.2, 0],
  },
  "paumes-bas-ventre": {
    headRot: [0.04, 0.05, 0],
    leftArmRot: [-0.25, 0.4, 0.5], // Paumes ouvertes gesturing bas à hauteur du ventre
    leftForearmRot: [-0.8, 0.2, 0.2],
    leftWristRot: [0.3, -0.1, 0],
    rightArmRot: [-0.25, -0.4, -0.5], // Paumes ouvertes gesturing bas à hauteur du ventre
    rightForearmRot: [-0.8, -0.2, -0.2],
    rightWristRot: [0.3, 0.1, 0],
  },
  "croisement-bas-ventre": {
    headRot: [0.02, -0.05, 0],
    leftArmRot: [-0.2, 0.5, 0.4], // Mains superposées doucement sous le nombril / niveau ventre
    leftForearmRot: [-1.05, 0.3, 0.25],
    leftWristRot: [0.2, 0.1, 0],
    rightArmRot: [-0.2, -0.5, -0.4], // Mains superposées doucement sous le nombril / niveau ventre
    rightForearmRot: [-1.05, -0.3, -0.25],
    rightWristRot: [0.2, -0.1, 0],
  },
  couronne: {
    headRot: [0.08, 0, 0],
    leftArmRot: [-0.6, 0.3, 0.1],
    leftForearmRot: [-1.4, 0.2, 0.2],
    leftWristRot: [-0.1, 0.2, 0],
    rightArmRot: [-0.6, -0.3, -0.1],
    rightForearmRot: [-1.4, -0.2, -0.2],
    rightWristRot: [-0.1, -0.2, 0],
  },
  etoile: {
    headRot: [0.05, 0.1, 0],
    leftArmRot: [0.1, 0.1, 1.25],
    leftForearmRot: [0.2, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.4, -0.4, -0.5],
    rightForearmRot: [-1.2, -0.2, -0.1],
    rightWristRot: [0.2, -0.1, 0],
  },
  "salut-solennel": {
    headRot: [0.05, -0.1, 0],
    leftArmRot: [0.1, 0.1, 1.25],
    leftForearmRot: [0.2, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.6, -0.3, -0.3],
    rightForearmRot: [-1.6, -0.1, 0.1],
    rightWristRot: [0.1, 0.1, 0],
  },
  "tampon-main": {
    headRot: [0.1, 0, 0],
    leftArmRot: [-0.3, 0.3, 0.5],
    leftForearmRot: [-1.2, 0.3, 0.3],
    leftWristRot: [0.2, 0.1, 0],
    rightArmRot: [-0.5, -0.3, -0.4],
    rightForearmRot: [-1.3, -0.2, -0.2],
    rightWristRot: [-0.3, 0, 0],
  },
  "livre-ouvert": {
    headRot: [0.08, 0, 0],
    leftArmRot: [-0.2, 0.3, 0.6],
    leftForearmRot: [-0.9, 0.3, 0.3],
    leftWristRot: [0.2, -0.2, 0],
    rightArmRot: [-0.2, -0.3, -0.6],
    rightForearmRot: [-0.9, -0.3, -0.3],
    rightWristRot: [0.2, 0.2, 0],
  },
  "pouce-haut": {
    headRot: [0.05, 0.1, 0],
    leftArmRot: [0.1, 0.1, 1.25],
    leftForearmRot: [0.2, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.4, -0.2, -0.5],
    rightForearmRot: [-1.2, 0, 0],
    rightWristRot: [0.2, 0.1, 0],
  },
  "demande-soumettre": {
    headRot: [0.06, 0, 0],
    leftArmRot: [-0.3, 0.2, 0.5],
    leftForearmRot: [-0.9, 0.2, 0.2],
    leftWristRot: [0.2, -0.1, 0],
    rightArmRot: [-0.3, -0.2, -0.5],
    rightForearmRot: [-0.9, -0.2, -0.2],
    rightWristRot: [0.2, 0.1, 0],
  },
  "main-coeur": {
    headRot: [0.06, -0.1, 0],
    leftArmRot: [0.1, 0.1, 1.25],
    leftForearmRot: [0.2, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.4, 0.2, -0.3],
    rightForearmRot: [-1.4, -0.3, 0.2],
    rightWristRot: [0.1, 0.1, 0],
  },
  "v-victoire": {
    headRot: [0.05, 0, 0],
    leftArmRot: [0.1, 0.1, 1.25],
    leftForearmRot: [0.2, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.5, -0.2, -0.4],
    rightForearmRot: [-1.2, 0, 0],
    rightWristRot: [0.1, 0, 0],
  },
  "sceau-droit": {
    headRot: [0.08, 0, 0],
    leftArmRot: [-0.3, 0.3, 0.5],
    leftForearmRot: [-1.2, 0.3, 0.3],
    leftWristRot: [0.2, 0, 0],
    rightArmRot: [-0.5, -0.3, -0.4],
    rightForearmRot: [-1.3, -0.2, -0.2],
    rightWristRot: [0.2, -0.2, 0],
  },
  "ecriture-paume": {
    headRot: [0.12, 0.1, 0],
    leftArmRot: [-0.3, 0.3, 0.5],
    leftForearmRot: [-1.3, 0.3, 0.3],
    leftWristRot: [0.2, 0.1, 0],
    rightArmRot: [-0.4, -0.3, -0.4],
    rightForearmRot: [-1.4, -0.2, -0.2],
    rightWristRot: [0.2, -0.3, 0.1],
  },
  "clock-tsa": {
    headRot: [0.08, -0.1, 0],
    leftArmRot: [-0.3, 0.3, 0.5],
    leftForearmRot: [-1.3, 0.3, 0.3],
    leftWristRot: [0.2, 0.2, 0],
    rightArmRot: [-0.4, -0.2, -0.4],
    rightForearmRot: [-1.4, -0.2, -0.2],
    rightWristRot: [0.2, -0.1, 0],
  },
  // Les deux mains couvrant la bouche — surprise / silence / émotion forte
  "mains-sur-bouche": {
    headRot: [0.1, 0, 0],
    leftArmRot: [-1.05, 0.35, 0.15], // Bras gauche levé vers le visage
    leftForearmRot: [-2.3, -0.25, 0.35],
    leftWristRot: [-0.3, 0.4, -0.15],
    rightArmRot: [-1.05, -0.35, -0.15], // Bras droit levé en miroir vers le visage
    rightForearmRot: [-2.3, 0.25, -0.35],
    rightWristRot: [-0.3, -0.4, 0.15],
  },
  // Main droite posée à plat sur la poitrine — sincérité / engagement / émotion
  "main-poitrine": {
    headRot: [0.08, -0.08, 0],
    leftArmRot: [-0.15, 0.35, 0.85], // Bras gauche au repos naturel
    leftForearmRot: [-1.35, 0.4, 0.5],
    leftWristRot: [0.3, 0.2, 0],
    rightArmRot: [-0.55, -0.2, -0.3], // Main droite ramenée sur la poitrine
    rightForearmRot: [-1.55, -0.15, 0.1],
    rightWristRot: [0.2, -0.15, 0],
  },
  // Index droit touche le dos de la main gauche — signer ici, pointer un document, référence précise
  "doigt-verso-main": {
    headRot: [0.12, 0.05, 0],
    leftArmRot: [-0.35, 0.12, 0.30], // Main gauche paume vers le bas, tenue à plat devant soi
    leftForearmRot: [-1.0, 0.10, 0.10],
    leftWristRot: [0.30, 0.10, 0],
    rightArmRot: [-0.42, -0.08, -0.28], // Index droit vient pointer/toucher le dos de la main gauche
    rightForearmRot: [-1.15, -0.10, -0.05],
    rightWristRot: [0.10, -0.15, 0],
  },
  // Les deux mains jointes devant soi, paumes rapprochées — accord, alliance, engagement officiel
  "mains-jointes": {
    headRot: [0.06, 0, 0],
    leftArmRot: [-0.60, 0.15, 0.28], // Bras gauche ramené vers le centre
    leftForearmRot: [-1.50, 0.08, 0.10],
    leftWristRot: [0.10, -0.05, 0],
    rightArmRot: [-0.60, -0.15, -0.28], // Bras droit ramené en miroir vers le centre
    rightForearmRot: [-1.50, -0.08, -0.10],
    rightWristRot: [0.10, 0.05, 0],
  },
  // Index droit pointé dans la paume gauche ouverte — indiquer un article, une référence légale
  "index-paume": {
    headRot: [0.10, 0.08, 0],
    leftArmRot: [-0.32, 0.14, 0.32], // Paume gauche ouverte et tournée vers le haut
    leftForearmRot: [-0.88, 0.14, 0.14],
    leftWristRot: [0.42, -0.10, 0],
    rightArmRot: [-0.48, -0.06, -0.26], // Index droit vise le centre de la paume gauche
    rightForearmRot: [-1.30, -0.10, -0.10],
    rightWristRot: [-0.10, -0.20, 0],
  },
  // Poing droit frappe la paume gauche — emphase forte, décision, validation
  "frappe-poing-paume": {
    headRot: [0.10, 0, 0],
    leftArmRot: [-0.50, 0.14, 0.30], // Paume gauche tendue et ouverte pour recevoir
    leftForearmRot: [-1.30, 0.10, 0.14],
    leftWristRot: [0.16, 0.10, 0],
    rightArmRot: [-0.50, -0.14, -0.26], // Poing droit ramassé, prêt à frapper la paume
    rightForearmRot: [-1.26, -0.10, -0.10],
    rightWristRot: [0.0, -0.10, 0],
  },
  // Doigts des deux mains entrelacés devant soi — solidarité, unité, lien officiel
  "entrelacement-doigts": {
    headRot: [0.07, 0, 0],
    leftArmRot: [-0.56, 0.10, 0.24], // Bras gauche très proche du centre
    leftForearmRot: [-1.46, 0.05, 0.10],
    leftWristRot: [0.10, 0, 0],
    rightArmRot: [-0.56, -0.10, -0.24], // Bras droit en miroir, mains qui se rejoignent
    rightForearmRot: [-1.46, -0.05, -0.10],
    rightWristRot: [0.10, 0, 0],
  },
};

const DEFAULT_RPM_MODEL = "https://models.readyplayer.me/6460d37574d568d784d6b631.glb";

/**
 * Universal H-Anim ↔ Avaturn / ReadyPlayerMe / Mixamo / VRM Cross-Mapping Dictionary
 */
const HANIM_BONE_ALIASES: Record<string, string[]> = {
  head: ["vc4", "vc1", "skull", "Head", "head", "mixamorigHead", "mixamorig:Head", "Bip01_Head", "J_Bip_C_Head"],
  neck: ["vc7", "neck", "Neck", "mixamorigNeck", "mixamorig:Neck", "Bip01_Neck", "J_Bip_C_Neck"],
  spine: ["vt6", "vt12", "vl5", "spine", "Spine", "Spine1", "Spine2", "mixamorigSpine", "mixamorig:Spine", "mixamorigSpine1", "mixamorigSpine2", "J_Bip_C_Spine"],
  leftShoulder: ["l_shoulder", "l_clavicle", "LeftShoulder", "leftShoulder", "mixamorigLeftShoulder", "mixamorig:LeftShoulder", "Clavicle_L", "Shoulder_L", "J_Bip_L_Shoulder"],
  leftArm: ["l_arm", "l_upperarm", "LeftArm", "LeftUpperArm", "leftArm", "mixamorigLeftArm", "mixamorig:LeftArm", "mixamorigLeftUpperArm", "mixamorig:LeftUpperArm", "UpperArm_L", "Arm_L", "J_Bip_L_UpperArm"],
  leftForearm: ["l_elbow", "l_forearm", "l_lowerarm", "LeftForeArm", "LeftLowerArm", "leftForeArm", "mixamorigLeftForeArm", "mixamorig:LeftForeArm", "mixamorigLeftLowerArm", "mixamorig:LeftLowerArm", "LowerArm_L", "Forearm_L", "J_Bip_L_LowerArm"],
  leftWrist: ["l_wrist", "l_hand", "LeftHand", "leftHand", "mixamorigLeftHand", "mixamorig:LeftHand", "Hand_L", "Wrist_L", "J_Bip_L_Hand"],
  rightShoulder: ["r_shoulder", "r_clavicle", "RightShoulder", "rightShoulder", "mixamorigRightShoulder", "mixamorig:RightShoulder", "Clavicle_R", "Shoulder_R", "J_Bip_R_Shoulder"],
  rightArm: ["r_arm", "r_upperarm", "RightArm", "RightUpperArm", "rightArm", "mixamorigRightArm", "mixamorig:RightArm", "mixamorigRightUpperArm", "mixamorig:RightUpperArm", "UpperArm_R", "Arm_R", "J_Bip_R_UpperArm"],
  rightForearm: ["r_elbow", "r_forearm", "r_lowerarm", "RightForeArm", "RightLowerArm", "rightForeArm", "mixamorigRightForeArm", "mixamorig:RightForeArm", "mixamorigRightLowerArm", "mixamorig:RightLowerArm", "LowerArm_R", "Forearm_R", "J_Bip_R_LowerArm"],
  rightWrist: ["r_wrist", "r_hand", "RightHand", "rightHand", "mixamorigRightHand", "mixamorig:RightHand", "Hand_R", "Wrist_R", "J_Bip_R_Hand"],
};

function cleanBoneName(name: string): string {
  return name.toLowerCase().replace(/[:_\-.\s]/g, "");
}

/**
 * Resolves bone using H-Anim alias table with fuzzy string matching across Avaturn/Mixamo skeletons
 */
function resolveHAnimBone(bones: Record<string, THREE.Object3D>, category: keyof typeof HANIM_BONE_ALIASES): THREE.Object3D | null {
  const aliases = HANIM_BONE_ALIASES[category] || [];
  
  // 1. Direct key match
  for (const alias of aliases) {
    if (bones[alias]) return bones[alias];
  }
  
  // 2. Normalized match stripping punctuation and casing
  const normalizedBoneKeys = Object.keys(bones).map((k) => ({ original: k, clean: cleanBoneName(k) }));
  
  for (const alias of aliases) {
    const cleanAlias = cleanBoneName(alias);
    for (const item of normalizedBoneKeys) {
      if (item.clean === cleanAlias || item.clean.endsWith(cleanAlias)) {
        return bones[item.original];
      }
    }
  }
  
  return null;
}

function blendEuler(target: [number, number, number], rest: [number, number, number], amount: number): [number, number, number] {
  return [
    rest[0] + (target[0] - rest[0]) * amount,
    rest[1] + (target[1] - rest[1]) * amount,
    rest[2] + (target[2] - rest[2]) * amount,
  ];
}

export const ThreeDHumanAvatar: React.FC<ThreeDHumanAvatarProps> = ({
  motion = "neutre",
  glossText,
  speed = 1.0,
  isPlaying = true,
  avatarUrl = "/model.glb",
  cameraPreset: initialCameraPreset = "upper",
  showControls = true,
  isFullWindow = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeCamPreset, setActiveCamPreset] = useState<CameraPreset>(initialCameraPreset);
  const [customGlbUrl, setCustomGlbUrl] = useState<string>(avatarUrl);
  const [userFileName, setUserFileName] = useState<string>("");
  const targetGlbUrl = customGlbUrl || avatarUrl || "/model.glb";

  const [gltfStatus, setGltfStatus] = useState<string>("Initialisation du moteur 3D...");

  const motionRef = useRef<GestureMotionType>(motion);
  const glossTextRef = useRef<string | undefined>(glossText);
  const lastGlossRef = useRef<string | undefined>(glossText);
  const gestureStartedAtRef = useRef(0);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const speedRef = useRef<number>(speed);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => { motionRef.current = motion; }, [motion]);
  useEffect(() => { glossTextRef.current = glossText; }, [glossText]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const handleLocalAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setCustomGlbUrl(objectUrl);
      setUserFileName(file.name);
      setGltfStatus(`Avatar Avaturn Chargé : ${file.name}`);
    }
  };

  // Adjust Camera Framing
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (activeCamPreset === "face") {
      cam.position.set(0, 1.55, 0.85);
      ctrl.target.set(0, 1.50, 0);
    } else if (activeCamPreset === "upper") {
      cam.position.set(0, 1.25, 1.85);
      ctrl.target.set(0, 1.10, 0);
    } else {
      cam.position.set(0, 0.95, 3.0);
      ctrl.target.set(0, 0.85, 0);
    }
    ctrl.update();
  }, [activeCamPreset]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scène 3D WebGL Studio
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050814");

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.25, 1.85);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.10, 0);
    controls.enablePan = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 4.5;
    controls.update();
    controlsRef.current = controls;

    const updateDimensions = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => updateDimensions());
    resizeObserver.observe(container);

    // 2. Éclairage Studio PBR 3 Points
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffebd7, 2.6);
    keyLight.position.set(2.5, 4.5, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.3);
    fillLight.position.set(-2.5, 3, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xf59e0b, 3.5, 12);
    rimLight.position.set(0, 3.8, -2.2);
    scene.add(rimLight);

    const shadowFloor = new THREE.Mesh(
      new THREE.CircleGeometry(3.0, 32),
      new THREE.MeshStandardMaterial({ color: 0x050814, roughness: 0.9 })
    );
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.y = 0;
    shadowFloor.receiveShadow = true;
    scene.add(shadowFloor);

    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    let loadedGltfModel: THREE.Group | null = null;
    let gltfBones: Record<string, THREE.Object3D> = {};
    let initialQuaternions: Record<string, THREE.Quaternion> = {};
    let morphMeshes: THREE.Mesh[] = [];

    // Fallback procédural (masqué par défaut pour n'afficher QUE le modèle model.glb)
    const proceduralGroup = new THREE.Group();
    proceduralGroup.visible = false;
    avatarGroup.add(proceduralGroup);

    // 3. Charger le modèle 3D Avaturn / GLTF
    const loadGltfModel = (urlToLoad: string) => {
      console.log("🔍 [GLTF LOAD START] Loading model from URL:", urlToLoad);
      setGltfStatus(`Chargement de l'Avatar Avaturn/3D (${userFileName || urlToLoad})...`);
      const loader = new GLTFLoader();
      loader.load(
        urlToLoad,
        (gltf) => {
          proceduralGroup.visible = false;
          if (loadedGltfModel) avatarGroup.remove(loadedGltfModel);

          loadedGltfModel = gltf.scene;
          loadedGltfModel.scale.set(1, 1, 1);
          loadedGltfModel.position.set(0, 0, 0);

          gltfBones = {};
          initialQuaternions = {};
          morphMeshes = [];

          loadedGltfModel.traverse((node) => {
            if ((node as THREE.Mesh).isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              const mMesh = node as THREE.Mesh;
              if (mMesh.morphTargetDictionary && mMesh.morphTargetInfluences) {
                morphMeshes.push(mMesh);
              }
            }
            if (node.name) {
              gltfBones[node.name] = node;
              initialQuaternions[node.name] = node.quaternion.clone();
            }
          });

          console.log("✅ [GLTF BONES FOUND]:", Object.keys(gltfBones));

          // Test de résolution H-Anim sur le modèle Avaturn chargé
          (Object.keys(HANIM_BONE_ALIASES) as Array<keyof typeof HANIM_BONE_ALIASES>).forEach((cat) => {
            const b = resolveHAnimBone(gltfBones, cat);
            if (b) {
              console.log(`🟢 [H-ANIM RESOLVER] ${cat} -> FOUND: "${b.name}"`);
            } else {
              console.warn(`🔴 [H-ANIM RESOLVER] ${cat} -> MISSING!`);
            }
          });

          avatarGroup.add(loadedGltfModel);
          setGltfStatus(`Avatar Avaturn H-Anim Mapping Actif : ${userFileName || "model.glb"}`);
        },
        undefined,
        (err) => {
          console.warn("❌ Échec chargement GLB local, fallback ReadyPlayerMe:", err);
          if (urlToLoad !== DEFAULT_RPM_MODEL) {
            loadGltfModel(DEFAULT_RPM_MODEL);
          } else {
            proceduralGroup.visible = true;
            setGltfStatus("Avatar 3D Procédural HD Actif");
          }
        }
      );
    };

    loadGltfModel(targetGlbUrl);

    // 4. Boucle d'Animation Squelettique 60 FPS avec Adaptateur H-Anim ↔ Avaturn
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const currentSpeed = speedRef.current;
      const playing = isPlayingRef.current;
      const currentMotion = motionRef.current;

      // Each glose gets its own preparation, stroke and release phase.
      if (lastGlossRef.current !== glossTextRef.current) {
        lastGlossRef.current = glossTextRef.current;
        gestureStartedAtRef.current = elapsedTime;
      }
      const gestureDuration = 1.2 / Math.max(currentSpeed, 0.1);
      const gestureProgress = playing
        ? ((elapsedTime - gestureStartedAtRef.current) % gestureDuration) / gestureDuration
        : 1;
      const gestureElapsed = Math.max(0, elapsedTime - gestureStartedAtRef.current);
      const articulation = playing ? Math.sin(gestureProgress * Math.PI) : 0;
      const poseBlend = playing ? 0.2 + articulation * 0.8 : 0;

      const targetPose = PROF_POSES[currentMotion] || PROF_POSES.neutre;
      const restPose = PROF_POSES.neutre;
      const lerpSpeed = 0.28 * currentSpeed;

      const headSwayX = Math.sin(elapsedTime * 1.2) * 0.015;

      // Trajectoires dynamiques 3D en fonction du geste courant
      let trajX = 0;
      let trajY = 0;
      let trajZ = 0;
      let facialBrow = 0;
      let facialMouthO = 0;
      let facialSmile = 0;

      if (playing) {
        switch (currentMotion) {
          case "salut-bienvenue":
            trajX = Math.sin(gestureElapsed * 8.0) * 0.16 * articulation;
            trajY = Math.cos(gestureElapsed * 4.0) * 0.06 * articulation;
            facialSmile = 0.9;
            facialBrow = 0.4;
            break;
          case "explication-paumes":
            trajX = Math.sin(gestureElapsed * 3.5) * 0.18 * articulation;
            trajZ = Math.cos(gestureElapsed * 3.5) * 0.10 * articulation;
            facialMouthO = 0.3;
            break;
          case "reflexion-menton":
            trajY = Math.sin(gestureElapsed * 2.5) * 0.04 * articulation;
            facialBrow = 0.6;
            break;
          case "applaudissement":
            trajX = Math.sin(gestureElapsed * 10.0) * 0.08 * articulation;
            facialSmile = 0.8;
            break;
          case "pointage-direction":
            trajZ = Math.sin(gestureElapsed * 4.0) * 0.14 * articulation;
            facialBrow = 0.4;
            break;
          case "main-bouche":
            // Cercle des deux mains et doigts interagissant directement devant la bouche
            trajX = Math.sin(gestureElapsed * 7.0) * 0.12 * articulation;
            trajY = Math.cos(gestureElapsed * 7.0) * 0.12 * articulation;
            trajZ = Math.sin(gestureElapsed * 14.0) * 0.05 * articulation;
            facialMouthO = 0.5; // Ouverture/élocution orale devant les lèvres
            facialBrow = 0.5;
            break;
          case "comptage-doigts":
            // Main droite venant énumérer/toucher chaque doigt de la main gauche
            trajX = Math.sin(gestureElapsed * 6.0) * 0.10 * articulation;
            trajY = Math.cos(gestureElapsed * 6.0) * 0.08 * articulation;
            facialBrow = 0.5;
            break;
          case "bras-croises":
            // Mouvement de croisement et resserrement des avant-bras sur la poitrine
            trajX = Math.sin(gestureElapsed * 3.0) * 0.04 * articulation;
            trajZ = Math.cos(gestureElapsed * 3.0) * 0.04 * articulation;
            break;
          case "couronne":
            trajX = Math.sin(gestureElapsed * 3.5) * 0.12 * articulation;
            trajY = Math.cos(gestureElapsed * 3.5) * 0.08 * articulation;
            facialBrow = 0.7; // Sourcils levés pour majesté
            break;
          case "etoile":
            trajX = Math.sin(gestureElapsed * 5.0) * 0.15 * articulation;
            trajY = Math.sin(gestureElapsed * 10.0) * 0.08 * articulation;
            facialBrow = 0.5;
            break;
          case "salut-solennel":
            trajY = Math.abs(Math.sin(gestureElapsed * 3.0)) * 0.14 * articulation;
            facialBrow = 0.3;
            facialMouthO = 0.2;
            break;
          case "tampon-main":
            trajY = Math.sin(gestureElapsed * 6.5) * 0.22 * articulation; // Frappe de tampon verticale
            facialBrow = 0.8; // Froncement des sourcils pour décision officielle
            break;
          case "livre-ouvert":
            trajX = Math.sin(gestureElapsed * 2.5) * 0.14 * articulation; // Écartement des paumes
            facialMouthO = 0.3;
            break;
          case "pouce-haut":
            trajY = Math.sin(gestureElapsed * 4.5) * 0.10 * articulation;
            facialSmile = 0.8; // Sourire d'approbation
            break;
          case "demande-soumettre":
            trajZ = Math.sin(gestureElapsed * 3.0) * 0.18 * articulation; // Poussée vers l'avant
            facialBrow = 0.6;
            break;
          case "ecriture-paume":
            trajX = Math.sin(gestureElapsed * 9.0) * 0.08 * articulation; // Trajectoire rapide de signature
            trajY = Math.cos(gestureElapsed * 9.0) * 0.06 * articulation;
            facialMouthO = 0.4;
            break;
          case "clock-tsa":
            trajY = Math.sin(gestureElapsed * 7.5) * 0.12 * articulation; // Tapotement rapide du poignet
            break;
          case "mains-sur-bouche":
            // Les deux mains montent vers la bouche en miroir — ébahissement / surprise / silence
            trajY = Math.sin(gestureElapsed * 5.0) * 0.08 * articulation;
            trajX = Math.cos(gestureElapsed * 5.0) * 0.04 * articulation;
            facialBrow = 0.9; // Sourcils très levés (surprise)
            facialMouthO = 0.6; // Bouche entrouverte
            break;
          case "main-poitrine":
            // La main droite se pose sur le cœur / la poitrine — sincérité / promesse
            trajY = Math.sin(gestureElapsed * 2.5) * 0.05 * articulation; // Léger battement sur la poitrine
            trajZ = Math.cos(gestureElapsed * 2.5) * 0.03 * articulation;
            facialBrow = 0.3;
            facialSmile = 0.5; // Sourire sincère
            break;
          case "doigt-verso-main":
            // Index droit qui pointe/tape le dos de la main gauche — signer, valider, pointer
            trajY = Math.sin(gestureElapsed * 8.0) * 0.06 * articulation; // Petits tapotements verticaux de l'index
            trajX = Math.cos(gestureElapsed * 8.0) * 0.02 * articulation;
            facialBrow = 0.5;
            facialMouthO = 0.2;
            break;
          case "mains-jointes":
            // Mains jointes qui s'unissent — légère pression rythmique des paumes l'une contre l'autre
            trajZ = Math.sin(gestureElapsed * 3.0) * 0.04 * articulation; // Micro-compression vers l'avant
            trajY = Math.cos(gestureElapsed * 3.0) * 0.03 * articulation;
            facialBrow = 0.3;
            facialSmile = 0.6; // Sourire d'accord
            break;
          case "index-paume":
            // Index qui désigne un point précis dans la paume ouverte — lire un article
            trajY = Math.sin(gestureElapsed * 6.0) * 0.06 * articulation; // Index qui rebondit dans la paume
            trajX = Math.sin(gestureElapsed * 3.0) * 0.03 * articulation;
            facialBrow = 0.6;
            facialMouthO = 0.25;
            break;
          case "frappe-poing-paume":
            // Poing qui frappe la paume avec insistance — frappe énergique et répétée
            trajY = Math.sin(gestureElapsed * 9.0) * 0.12 * articulation; // Frappe rythmée et nette
            trajZ = Math.cos(gestureElapsed * 4.5) * 0.04 * articulation;
            facialBrow = 0.85; // Sourcils contractés — emphase forte
            facialMouthO = 0.4;
            break;
          case "entrelacement-doigts":
            // Doigts entrelacés — micro-oscillation douce, comme serrer les mains dans ses propres mains
            trajY = Math.sin(gestureElapsed * 2.0) * 0.03 * articulation;
            trajX = Math.cos(gestureElapsed * 2.0) * 0.02 * articulation;
            facialBrow = 0.2;
            facialSmile = 0.4;
            break;
          default:
            trajX = Math.sin(gestureElapsed * 2.0) * 0.03 * articulation;
            trajY = Math.cos(gestureElapsed * 2.0) * 0.02 * articulation;
            break;
        }
      }

      const applyHAnimDelta = (category: keyof typeof HANIM_BONE_ALIASES, deltaEuler: [number, number, number], extraX = 0, extraY = 0, extraZ = 0) => {
        const bone = resolveHAnimBone(gltfBones, category);
        if (!bone) return;
        const restQ = initialQuaternions[bone.name];
        if (!restQ) return;

        const deltaQ = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(deltaEuler[0] + extraX, deltaEuler[1] + extraY, deltaEuler[2] + extraZ, "XYZ")
        );

        const targetQ = restQ.clone().multiply(deltaQ);
        bone.quaternion.slerp(targetQ, lerpSpeed);
      };

      if (loadedGltfModel && Object.keys(gltfBones).length > 0) {
        // Correction de la posture des épaules (Épaule et clavicules ramenées vers l'avant)
        applyHAnimDelta("leftShoulder", [0.15, -0.08, 0.08], trajY * 0.2, trajX * 0.15, trajZ * 0.15);
        applyHAnimDelta("rightShoulder", [0.15, 0.08, -0.08], trajY * 0.2, -trajX * 0.15, -trajZ * 0.15);
        applyHAnimDelta("spine", [0.06, 0, 0], articulation * 0.025, trajX * 0.12, trajZ * 0.12);

        applyHAnimDelta("head", blendEuler(targetPose.headRot, restPose.headRot, poseBlend), headSwayX + (facialBrow * 0.05));

        applyHAnimDelta("leftArm", blendEuler(targetPose.leftArmRot, restPose.leftArmRot, poseBlend), trajY * 0.5, trajX, trajZ);
        applyHAnimDelta("leftForearm", blendEuler(targetPose.leftForearmRot, restPose.leftForearmRot, poseBlend), -trajY, trajX * 0.5);
        applyHAnimDelta("leftWrist", blendEuler(targetPose.leftWristRot, restPose.leftWristRot, poseBlend), trajX * 0.3);

        applyHAnimDelta("rightArm", blendEuler(targetPose.rightArmRot, restPose.rightArmRot, poseBlend), trajY * 0.5, -trajX, -trajZ);
        applyHAnimDelta("rightForearm", blendEuler(targetPose.rightForearmRot, restPose.rightForearmRot, poseBlend), -trajY, -trajX * 0.5);
        applyHAnimDelta("rightWrist", blendEuler(targetPose.rightWristRot, restPose.rightWristRot, poseBlend), -trajX * 0.3);

        // Curvatures des doigts pour un rendu ultra-naturel des mains en langue des signes
        const FINGER_BONE_PATTERNS = ["Index", "Middle", "Ring", "Pinky", "Thumb"];
        const SIDES = [
          { name: "RightHand", prefixes: ["RightHand", "mixamorigRightHand", "mixamorig:RightHand", "r_", "Right", "Hand_R"] },
          { name: "LeftHand", prefixes: ["LeftHand", "mixamorigLeftHand", "mixamorig:LeftHand", "l_", "Left", "Hand_L"] },
        ];
        SIDES.forEach(({ prefixes }) => {
          FINGER_BONE_PATTERNS.forEach((finger) => {
            for (let seg = 1; seg <= 3; seg++) {
              let bone: THREE.Object3D | null = null;
              for (const pref of prefixes) {
                const candidates = [
                  `${pref}${finger}${seg}`,
                  `${pref}_${finger.toLowerCase()}_${seg}`,
                  `${pref}${finger.toLowerCase()}${seg}`,
                  `${pref}_${finger}_${seg}`,
                ];
                for (const cand of candidates) {
                  if (gltfBones[cand]) {
                    bone = gltfBones[cand];
                    break;
                  }
                }
                if (bone) break;
              }

              if (!bone) {
                // Fallback avec cleanBoneName
                const targetClean = cleanBoneName(`${prefixes[0]}${finger}${seg}`);
                for (const key of Object.keys(gltfBones)) {
                  if (cleanBoneName(key).endsWith(targetClean)) {
                    bone = gltfBones[key];
                    break;
                  }
                }
              }

              if (bone && initialQuaternions[bone.name]) {
                const restQ = initialQuaternions[bone.name];
                const flexAngle = (finger === "Thumb" ? -0.2 : (seg === 1 ? -0.35 : -0.45)) * poseBlend;
                const fingerQ = restQ.clone().multiply(
                  new THREE.Quaternion().setFromEuler(new THREE.Euler(flexAngle, 0, 0, "XYZ"))
                );
                bone.quaternion.slerp(fingerQ, lerpSpeed);
              }
            }
          });
        });

        // Signes faciaux non-manuels (Expressions, Grimaces, Mouvance des lèvres)
        morphMeshes.forEach((mesh) => {
          if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
          const dict = mesh.morphTargetDictionary;
          const inf = mesh.morphTargetInfluences;

          // Ouverture bouche & mouvance des lèvres
          if (dict["mouthOpen"] !== undefined) {
            inf[dict["mouthOpen"]] = playing ? 0.15 + facialMouthO + Math.abs(Math.sin(elapsedTime * 6)) * 0.3 : 0.05;
          }
          if (dict["jawOpen"] !== undefined) {
            inf[dict["jawOpen"]] = playing ? 0.1 + facialMouthO * 0.5 : 0.0;
          }
          if (dict["mouthSmile"] !== undefined) {
            inf[dict["mouthSmile"]] = facialSmile;
          }

          // Sourcils (Haussement / Froncement)
          if (dict["browInnerUp"] !== undefined) {
            inf[dict["browInnerUp"]] = facialBrow;
          }
          if (dict["browOuterUpLeft"] !== undefined) {
            inf[dict["browOuterUpLeft"]] = facialBrow * 0.8;
          }
          if (dict["browOuterUpRight"] !== undefined) {
            inf[dict["browOuterUpRight"]] = facialBrow * 0.8;
          }

          // Clignotement naturel des yeux
          const isBlinking = Math.sin(elapsedTime * 2.8) > 0.96;
          if (dict["eyeBlinkLeft"] !== undefined) {
            inf[dict["eyeBlinkLeft"]] = isBlinking ? 1.0 : 0.0;
          }
          if (dict["eyeBlinkRight"] !== undefined) {
            inf[dict["eyeBlinkRight"]] = isBlinking ? 1.0 : 0.0;
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [avatarUrl, targetGlbUrl, userFileName]);

  return (
    <div className={`w-full ${isFullWindow ? "h-screen rounded-none" : "h-full min-h-[520px] rounded-3xl"} relative overflow-hidden bg-slate-950 flex flex-col justify-between shadow-2xl`}>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleLocalAvatarUpload}
        className="hidden"
      />

      <div ref={containerRef} className="w-full h-full absolute inset-0 z-0"></div>

      {showControls && (
        <div className="relative z-10 p-3 bg-slate-900/80 backdrop-blur-md m-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition cursor-pointer flex items-center gap-2 shadow-lg"
              title="Charger votre propre avatar Avaturn (.glb)"
            >
              <span>📥</span>
              <span>{userFileName ? `Avatar : ${userFileName.slice(0, 18)}` : "Charger mon Fichier Avatar Avaturn (.GLB)"}</span>
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 p-3 bg-slate-900/90 backdrop-blur-md m-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-300 shadow-xl">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-black text-amber-300 tracking-wide uppercase">
            🎬 ADAPTATEUR H-ANIM ↔ AVATURN CONNECTÉ (RESOLUTION D'OS EN TEMPS RÉEL)
          </span>
        </div>
        {gltfStatus && <span className="text-xs font-mono text-emerald-400 font-bold">{gltfStatus}</span>}
      </div>

    </div>
  );
};
