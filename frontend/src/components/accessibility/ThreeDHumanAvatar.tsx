import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type GestureMotionType =
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
    headRot: [0.05, 0, 0],
    leftArmRot: [-0.1, 0.2, -1.3], // Ventre / Bas
    leftForearmRot: [-0.6, 0.1, 0.2],
    leftWristRot: [0.1, 0.1, 0],
    rightArmRot: [-0.1, -0.2, 1.3],
    rightForearmRot: [-0.6, -0.1, -0.2],
    rightWristRot: [0.1, -0.1, 0],
  },
  "main-bouche": { // Toucher de la bouche / Lèvres (Niveau Visage / Haut)
    headRot: [0.05, 0, 0],
    leftArmRot: [-0.1, 0.2, -1.3],
    leftForearmRot: [-0.6, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.8, -0.2, 0.5],
    rightForearmRot: [-2.1, -0.2, 0.3], // Main portée directement à la bouche
    rightWristRot: [-0.2, 0.4, -0.2],
  },
  "comptage-doigts": { // Comptage des doigts (Niveau Ventre / Bas)
    headRot: [0.12, 0, 0],
    leftArmRot: [-0.2, 0.4, -1.1], // Paume gauche ouverte au niveau du ventre
    leftForearmRot: [-0.9, 0.4, 0.5],
    leftWristRot: [0.3, 0.2, 0],
    rightArmRot: [-0.3, -0.2, 1.0], // Main droite énumérant les doigts
    rightForearmRot: [-1.0, -0.3, -0.3],
    rightWristRot: [0.2, -0.2, 0],
  },
  "bras-croises": { // Bras croisés sur le torse (Niveau Poitrine / Milieu)
    headRot: [0, 0, 0],
    leftArmRot: [-0.6, 0.5, -0.6], // Bras gauche croisé sous bras droit
    leftForearmRot: [-1.8, 0.5, 0.4],
    leftWristRot: [0.2, 0, 0],
    rightArmRot: [-0.6, -0.5, 0.6], // Bras droit croisé au-dessus
    rightForearmRot: [-1.8, -0.5, -0.4],
    rightWristRot: [0.2, 0, 0],
  },
  couronne: { // Haut / Tête
    headRot: [0.1, 0, 0],
    leftArmRot: [-0.6, 0.4, -0.8],
    leftForearmRot: [-1.6, 0.2, 0.3],
    leftWristRot: [-0.2, 0.3, 0],
    rightArmRot: [-0.6, -0.4, 0.8],
    rightForearmRot: [-1.6, -0.2, -0.3],
    rightWristRot: [-0.2, -0.3, 0],
  },
  etoile: { // Poitrine / Milieu
    headRot: [0.05, 0.1, 0],
    leftArmRot: [-0.1, 0.2, -1.3],
    leftForearmRot: [-0.6, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.5, -0.5, 0.9],
    rightForearmRot: [-1.5, -0.3, -0.2],
    rightWristRot: [0.2, -0.2, 0.1],
  },
  "salut-solennel": { // Haut / Front
    headRot: [0.05, -0.1, 0],
    leftArmRot: [-0.1, 0.2, -1.3],
    leftForearmRot: [-0.6, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.7, -0.4, 0.7],
    rightForearmRot: [-1.8, -0.2, 0.1],
    rightWristRot: [0.1, 0.2, -0.1],
  },
  "tampon-main": { // Poitrine / Milieu
    headRot: [0.12, 0, 0],
    leftArmRot: [-0.4, 0.4, -1.0],
    leftForearmRot: [-1.4, 0.4, 0.5],
    leftWristRot: [0.3, 0.2, 0],
    rightArmRot: [-0.6, -0.3, 0.9],
    rightForearmRot: [-1.5, -0.2, -0.3],
    rightWristRot: [-0.4, 0, 0],
  },
  "livre-ouvert": { // Ventre / Bas
    headRot: [0.1, 0, 0],
    leftArmRot: [-0.2, 0.3, -1.1], // Présentation du document au niveau du ventre
    leftForearmRot: [-0.9, 0.3, 0.4],
    leftWristRot: [0.2, -0.3, 0],
    rightArmRot: [-0.2, -0.3, 1.1],
    rightForearmRot: [-0.9, -0.3, -0.4],
    rightWristRot: [0.2, 0.3, 0],
  },
  "pouce-haut": { // Poitrine / Milieu
    headRot: [0.05, 0.1, 0],
    leftArmRot: [-0.1, 0.2, -1.3],
    leftForearmRot: [-0.6, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.5, -0.3, 1.0],
    rightForearmRot: [-1.4, 0, 0],
    rightWristRot: [0.3, 0.2, 0.2],
  },
  "demande-soumettre": { // Ventre vers Poitrine
    headRot: [0.08, 0, 0],
    leftArmRot: [-0.3, 0.2, -1.1],
    leftForearmRot: [-1.0, 0.2, 0.2],
    leftWristRot: [0.3, -0.2, 0],
    rightArmRot: [-0.3, -0.2, 1.1],
    rightForearmRot: [-1.0, -0.2, -0.2],
    rightWristRot: [0.3, 0.2, 0],
  },
  "main-coeur": { // Poitrine / Cœur
    headRot: [0.08, -0.1, 0],
    leftArmRot: [-0.1, 0.2, -1.3],
    leftForearmRot: [-0.6, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.5, 0.2, 0.8],
    rightForearmRot: [-1.6, -0.4, 0.3],
    rightWristRot: [0.1, 0.2, 0],
  },
  "v-victoire": { // Poitrine vers Haut
    headRot: [0.05, 0, 0.05],
    leftArmRot: [-0.1, 0.2, -1.3],
    leftForearmRot: [-0.6, 0, 0],
    leftWristRot: [0, 0, 0],
    rightArmRot: [-0.6, -0.3, 0.8],
    rightForearmRot: [-1.5, 0, 0],
    rightWristRot: [0.1, 0, 0],
  },
  "sceau-droit": { // Poitrine
    headRot: [0.1, 0, 0],
    leftArmRot: [-0.4, 0.3, -1.0],
    leftForearmRot: [-1.4, 0.3, 0.4],
    leftWristRot: [0.2, 0, 0],
    rightArmRot: [-0.6, -0.3, 0.9],
    rightForearmRot: [-1.5, -0.2, -0.2],
    rightWristRot: [0.3, -0.3, 0],
  },
  "ecriture-paume": { // Poitrine / Paume
    headRot: [0.15, 0.1, 0],
    leftArmRot: [-0.4, 0.3, -1.0],
    leftForearmRot: [-1.4, 0.4, 0.4],
    leftWristRot: [0.2, 0.1, 0],
    rightArmRot: [-0.5, -0.3, 0.9],
    rightForearmRot: [-1.6, -0.3, -0.3],
    rightWristRot: [0.2, -0.4, 0.1],
  },
  "clock-tsa": { // Poitrine / Poignet
    headRot: [0.1, -0.15, 0],
    leftArmRot: [-0.4, 0.3, -1.0],
    leftForearmRot: [-1.4, 0.4, 0.4],
    leftWristRot: [0.3, 0.3, 0],
    rightArmRot: [-0.5, -0.2, 0.9],
    rightForearmRot: [-1.6, -0.3, -0.2],
    rightWristRot: [0.2, -0.2, 0],
  },
};

const DEFAULT_RPM_MODEL = "https://models.readyplayer.me/6460d37574d568d784d6b631.glb";

/**
 * Universal H-Anim ↔ Avaturn / ReadyPlayerMe / Mixamo Cross-Mapping Dictionary
 */
const HANIM_BONE_ALIASES: Record<string, string[]> = {
  head: ["vc4", "vc1", "skull", "Head", "head", "mixamorigHead", "Bip01_Head"],
  neck: ["vc7", "neck", "Neck", "mixamorigNeck", "Bip01_Neck"],
  spine: ["vt6", "vt12", "vl5", "spine", "Spine", "Spine1", "Spine2", "mixamorigSpine", "mixamorigSpine1", "mixamorigSpine2"],
  leftShoulder: ["l_shoulder", "l_clavicle", "LeftShoulder", "leftShoulder", "mixamorigLeftShoulder"],
  leftArm: ["l_arm", "l_upperarm", "LeftArm", "LeftUpperArm", "leftArm", "mixamorigLeftArm"],
  leftForearm: ["l_elbow", "l_forearm", "l_lowerarm", "LeftForeArm", "LeftLowerArm", "leftForeArm", "mixamorigLeftForeArm"],
  leftWrist: ["l_wrist", "l_hand", "LeftHand", "leftHand", "mixamorigLeftHand"],
  rightShoulder: ["r_shoulder", "r_clavicle", "RightShoulder", "rightShoulder", "mixamorigRightShoulder"],
  rightArm: ["r_arm", "r_upperarm", "RightArm", "RightUpperArm", "rightArm", "mixamorigRightArm"],
  rightForearm: ["r_elbow", "r_forearm", "r_lowerarm", "RightForeArm", "RightLowerArm", "rightForeArm", "mixamorigRightForeArm"],
  rightWrist: ["r_wrist", "r_hand", "RightHand", "rightHand", "mixamorigRightHand"],
};

/**
 * Resolves bone using H-Anim alias table with fuzzy string matching across Avaturn/Mixamo skeletons
 */
function resolveHAnimBone(bones: Record<string, THREE.Object3D>, category: keyof typeof HANIM_BONE_ALIASES): THREE.Object3D | null {
  const aliases = HANIM_BONE_ALIASES[category] || [];
  for (const alias of aliases) {
    if (bones[alias]) return bones[alias];
    const lowerAlias = alias.toLowerCase();
    for (const key of Object.keys(bones)) {
      if (key.toLowerCase() === lowerAlias || key.toLowerCase().endsWith(lowerAlias)) {
        return bones[key];
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
        const SIDES = ["RightHand", "LeftHand"];
        SIDES.forEach((side) => {
          FINGER_BONE_PATTERNS.forEach((finger) => {
            for (let seg = 1; seg <= 3; seg++) {
              const boneName = `${side}${finger}${seg}`;
              const altBoneName = `mixamorig${side}${finger}${seg}`;
              const bone = gltfBones[boneName] || gltfBones[altBoneName];
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

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold px-2 uppercase">📷 Caméra :</span>
            {(["face", "upper", "full"] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => setActiveCamPreset(preset)}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeCamPreset === preset ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                {preset === "face" ? "Visage" : preset === "upper" ? "Buste (Signes)" : "Plein Pied"}
              </button>
            ))}
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
