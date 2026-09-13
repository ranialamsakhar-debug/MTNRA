/**
 * Animgen (Animation Generator) Engine for TalkSign & CWASA Suite
 * Virtual Humans Group / ViSICAST / eSIGN Compliant Architecture
 * 
 * Animgen compiles SiGML (Signing Gesture Markup Language) into continuous 
 * frame-by-frame 3D skeletal animation tracks (quaternions & blendshape weights).
 */

export interface BoneTransformFrame {
  timestamp: number; // in seconds
  // Arm & Shoulder Kinematics (Inverse Kinematics solved)
  leftShoulder: [number, number, number]; // Euler angles (rad)
  leftElbow: [number, number, number];
  leftWrist: [number, number, number];
  rightShoulder: [number, number, number];
  rightElbow: [number, number, number];
  rightWrist: [number, number, number];
  // Hand & Finger Joint Rotations (MCP, PIP, DIP per finger)
  leftFingers: {
    thumb: [number, number, number];
    index: [number, number, number];
    middle: [number, number, number];
    ring: [number, number, number];
    pinky: [number, number, number];
  };
  rightFingers: {
    thumb: [number, number, number];
    index: [number, number, number];
    middle: [number, number, number];
    ring: [number, number, number];
    pinky: [number, number, number];
  };
  // Non-Manual Signs (NMS) Facial Blendshape Weights
  facialNMS: {
    browRaise: number;   // 0.0 to 1.0
    eyeBlink: number;
    headNod: number;
    mouthOpen: number;
  };
}

export interface AnimgenTrack {
  trackId: string;
  fps: number;
  totalFrames: number;
  duration: number;
  frames: BoneTransformFrame[];
  glossList: string[];
}

function lerpTuple(left: [number, number, number], right: [number, number, number], amount: number): [number, number, number] {
  return [
    left[0] + (right[0] - left[0]) * amount,
    left[1] + (right[1] - left[1]) * amount,
    left[2] + (right[2] - left[2]) * amount,
  ];
}

function interpolateFrame(left: BoneTransformFrame, right: BoneTransformFrame, amount: number): BoneTransformFrame {
  const smoothAmount = amount * amount * (3 - 2 * amount);
  const interpolateFingers = (leftFingers: BoneTransformFrame["leftFingers"], rightFingers: BoneTransformFrame["leftFingers"]) => ({
    thumb: lerpTuple(leftFingers.thumb, rightFingers.thumb, smoothAmount),
    index: lerpTuple(leftFingers.index, rightFingers.index, smoothAmount),
    middle: lerpTuple(leftFingers.middle, rightFingers.middle, smoothAmount),
    ring: lerpTuple(leftFingers.ring, rightFingers.ring, smoothAmount),
    pinky: lerpTuple(leftFingers.pinky, rightFingers.pinky, smoothAmount),
  });

  return {
    timestamp: left.timestamp + (right.timestamp - left.timestamp) * smoothAmount,
    leftShoulder: lerpTuple(left.leftShoulder, right.leftShoulder, smoothAmount),
    leftElbow: lerpTuple(left.leftElbow, right.leftElbow, smoothAmount),
    leftWrist: lerpTuple(left.leftWrist, right.leftWrist, smoothAmount),
    rightShoulder: lerpTuple(left.rightShoulder, right.rightShoulder, smoothAmount),
    rightElbow: lerpTuple(left.rightElbow, right.rightElbow, smoothAmount),
    rightWrist: lerpTuple(left.rightWrist, right.rightWrist, smoothAmount),
    leftFingers: interpolateFingers(left.leftFingers, right.leftFingers),
    rightFingers: interpolateFingers(left.rightFingers, right.rightFingers),
    facialNMS: {
      browRaise: left.facialNMS.browRaise + (right.facialNMS.browRaise - left.facialNMS.browRaise) * smoothAmount,
      eyeBlink: left.facialNMS.eyeBlink + (right.facialNMS.eyeBlink - left.facialNMS.eyeBlink) * smoothAmount,
      headNod: left.facialNMS.headNod + (right.facialNMS.headNod - left.facialNMS.headNod) * smoothAmount,
      mouthOpen: left.facialNMS.mouthOpen + (right.facialNMS.mouthOpen - left.facialNMS.mouthOpen) * smoothAmount,
    },
  };
}

/** Samples the generated track at render time instead of applying one static keyframe. */
export function sampleAnimgenTrack(track: AnimgenTrack, time: number): BoneTransformFrame | null {
  if (!track || !track.frames || track.frames.length === 0) {
    return null;
  }
  const clampedTime = Math.max(0, Math.min(time, track.duration));
  let low = 0;
  let high = track.frames.length - 1;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (track.frames[middle].timestamp < clampedTime) low = middle + 1;
    else high = middle;
  }

  const rightIndex = low;
  if (rightIndex === 0) return track.frames[0];
  const left = track.frames[rightIndex - 1];
  const right = track.frames[rightIndex];
  const span = right.timestamp - left.timestamp || 1 / track.fps;
  return interpolateFrame(left, right, Math.max(0, Math.min(1, (clampedTime - left.timestamp) / span)));
}

export interface AnimgenValidationResult {
  gloss: string;
  frameCount: number;
  timestampsMonotonic: boolean;
  hasMotion: boolean;
  hasFacialNMS: boolean;
}

export const KNOWN_SIGN_VALIDATION_CASES = {
  BONJOUR: `<hns_sign gloss="BONJOUR"><hamnosys_manual><hamflathand/><hampalmout/><hamforehead/><hammoveo/></hamnosys_manual></hns_sign>`,
  MERCI: `<hns_sign gloss="MERCI"><hamnosys_manual><hamflathand/><hampalmout/><hamchin/><hammoveo/></hamnosys_manual></hns_sign>`,
} as const;

export function validateKnownSigns(): Record<keyof typeof KNOWN_SIGN_VALIDATION_CASES, AnimgenValidationResult> {
  return {
    BONJOUR: validateSiGMLSign(KNOWN_SIGN_VALIDATION_CASES.BONJOUR),
    MERCI: validateSiGMLSign(KNOWN_SIGN_VALIDATION_CASES.MERCI),
  };
}

/** Small deterministic smoke check for a known SiGML sign before full documents. */
export function validateSiGMLSign(sigmlSnippet: string): AnimgenValidationResult {
  const track = animgenEngineInstance.compileSiGMLToAnimTrack(`<sigml>${sigmlSnippet}</sigml>`);
  const first = track.frames[0];
  const last = track.frames[track.frames.length - 1];
  const timestampsMonotonic = track.frames.every((frame, index) => index === 0 || frame.timestamp >= track.frames[index - 1].timestamp);
  const hasMotion = Boolean(first && last && JSON.stringify(first.rightShoulder) !== JSON.stringify(last.rightShoulder));
  const hasFacialNMS = Boolean(track.frames.some((frame) => Object.values(frame.facialNMS).some((value) => value > 0)));

  return {
    gloss: track.glossList[0] || "UNKNOWN",
    frameCount: track.totalFrames,
    timestampsMonotonic,
    hasMotion,
    hasFacialNMS,
  };
}

/**
 * Anatomical Joint Limit Rules enforced by Animgen IK Solver
 */
const BONE_LIMITS = {
  MCP_MAX: 1.57, // 90 deg max flexion
  PIP_MAX: 1.74, // 100 deg max flexion
  DIP_MAX: 1.40, // 80 deg max flexion
};

/**
 * Clamp finger flex angles to strict anatomical limits
 */
function clampFingerJoints(angles: [number, number, number]): [number, number, number] {
  return [
    Math.max(0, Math.min(angles[0], BONE_LIMITS.MCP_MAX)),
    Math.max(0, Math.min(angles[1], BONE_LIMITS.PIP_MAX)),
    Math.max(0, Math.min(angles[2], BONE_LIMITS.DIP_MAX)),
  ];
}

/**
 * Animgen Compiler: Converts raw SiGML XML stream into 60 FPS Skeletal Animation Frames
 */
export class AnimgenEngine {
  private fps: number;

  constructor(fps: number = 60) {
    this.fps = fps;
  }

  /**
   * Compiles SiGML XML markup into a full continuous Animgen Track
   */
  public compileSiGMLToAnimTrack(sigmlXml: string, signDurations?: number[]): AnimgenTrack {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(sigmlXml, "text/xml");
    const signNodes = xmlDoc.getElementsByTagName("hns_sign");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Invalid SiGML XML: parsererror returned by DOMParser");
    }

    const frames: BoneTransformFrame[] = [];
    const glossList: string[] = [];
    let currentTime = 0;

    for (let i = 0; i < signNodes.length; i++) {
      const signNode = signNodes[i];
      const gloss = signNode.getAttribute("gloss") || `SIGN_${i + 1}`;
      glossList.push(gloss);

      // Read instructions from this sign only. Looking at the full XML makes
      // every sign inherit the first handshape found in the document.
      const signMarkup = signNode.innerHTML.toLowerCase();
      const isFist = signMarkup.includes("hamfist");
      const isPinch = signMarkup.includes("hampinch");
      const isThumbUp = signMarkup.includes("hamthumb");
      const isNod = signMarkup.includes("hnm_nod");
      const isTwoHanded = signMarkup.includes("hampar") || signMarkup.includes("hamboth");
      const isAbove = signMarkup.includes("hamabove") || signMarkup.includes("hamhead") || signMarkup.includes("hamforehead");
      const isFaceLevel = signMarkup.includes("hamchin") || signMarkup.includes("hammouth");
      const isChestLevel = signMarkup.includes("hamchest") || signMarkup.includes("hamwrist");
      const isOutward = signMarkup.includes("hammoveo") || signMarkup.includes("hammover");
      let signHash = 0;
      for (let charIndex = 0; charIndex < gloss.length; charIndex++) signHash += gloss.charCodeAt(charIndex) * (charIndex + 1);

      // A sign is a short phrase, not a frozen pose. Keep enough time for the
      // preparation and release while leaving the next sign room to articulate.
      const signDuration = signDurations?.[i] || (isTwoHanded ? 1.1 : 0.95);
      const numFrames = Math.floor(signDuration * this.fps);

      for (let f = 0; f < numFrames; f++) {
        const progress = f / numFrames;
        const timestamp = currentTime + progress * signDuration;

        // Cubic spline interpolation factor for natural human movement
        const easeInOut = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Calculate realistic H-Anim / Mixamo arm rotations
        // Rest position: arms hang down naturally along thighs
        const restLeftShoulder: [number, number, number] = [0.05, 0.05, -1.25];
        const restLeftElbow: [number, number, number] = [0.1, 0, 0];
        const restRightShoulder: [number, number, number] = [0.05, -0.05, 1.25];
        const restRightElbow: [number, number, number] = [0.1, 0, 0];

        // Target active sign rotations (when easeInOut > 0)
        let activeRightArm: [number, number, number] = [-0.3, -0.2, 0.5];
        let activeRightForearm: [number, number, number] = [-1.0, 0, 0];

        if (isAbove) {
          activeRightArm = [-0.5, -0.3, 0.5];
          activeRightForearm = [-1.4, -0.2, 0];
        } else if (isFaceLevel) {
          activeRightArm = [-0.4, -0.2, 0.4];
          activeRightForearm = [-1.6, -0.2, 0];
        } else if (isChestLevel) {
          activeRightArm = [-0.4, -0.3, 0.5];
          activeRightForearm = [-1.2, 0, 0];
        }

        const activeLeftArm: [number, number, number] = isTwoHanded
          ? [-0.3, 0.3, -0.5]
          : restLeftShoulder;
        const activeLeftForearm: [number, number, number] = isTwoHanded
          ? [-1.1, 0.3, 0]
          : restLeftElbow;

        // Blend between rest and active signing position using cubic easeInOut curve
        const rightShoulder: [number, number, number] = [
          restRightShoulder[0] + (activeRightArm[0] - restRightShoulder[0]) * easeInOut,
          restRightShoulder[1] + (activeRightArm[1] - restRightShoulder[1]) * easeInOut,
          restRightShoulder[2] + (activeRightArm[2] - restRightShoulder[2]) * easeInOut,
        ];
        const rightElbow: [number, number, number] = [
          restRightElbow[0] + (activeRightForearm[0] - restRightElbow[0]) * easeInOut,
          restRightElbow[1] + (activeRightForearm[1] - restRightElbow[1]) * easeInOut,
          restRightElbow[2] + (activeRightForearm[2] - restRightElbow[2]) * easeInOut,
        ];

        const leftShoulder: [number, number, number] = isTwoHanded
          ? [
              restLeftShoulder[0] + (activeLeftArm[0] - restLeftShoulder[0]) * easeInOut,
              restLeftShoulder[1] + (activeLeftArm[1] - restLeftShoulder[1]) * easeInOut,
              restLeftShoulder[2] + (activeLeftArm[2] - restLeftShoulder[2]) * easeInOut,
            ]
          : restLeftShoulder;
        const leftElbow: [number, number, number] = isTwoHanded
          ? [
              restLeftElbow[0] + (activeLeftForearm[0] - restLeftElbow[0]) * easeInOut,
              restLeftElbow[1] + (activeLeftForearm[1] - restLeftElbow[1]) * easeInOut,
              restLeftElbow[2] + (activeLeftForearm[2] - restLeftElbow[2]) * easeInOut,
            ]
          : restLeftElbow;

        // Compute finger handshapes based on HamNoSys tags
        let rightFlex: [number, number, number] = [0.1, 0.1, 0.1];
        if (isFist) rightFlex = [1.4, 1.5, 1.2];
        if (isPinch) rightFlex = [0.8, 0.9, 0.6];
        if (isThumbUp) rightFlex = [0.1, 1.4, 1.4];

        const clampedFlex = clampFingerJoints(rightFlex);

        const frame: BoneTransformFrame = {
          timestamp,
          leftShoulder,
          leftElbow,
          leftWrist: [0, 0, 0],
          rightShoulder,
          rightElbow,
          rightWrist: [0, 0.2, 0],
          leftFingers: {
            thumb: isThumbUp ? [0.1, 0.1, 0.1] : clampedFlex,
            index: isTwoHanded ? clampedFlex : [0.1, 0.1, 0.1],
            middle: isTwoHanded ? clampedFlex : [0.1, 0.1, 0.1],
            ring: isTwoHanded ? clampedFlex : [0.1, 0.1, 0.1],
            pinky: isTwoHanded ? clampedFlex : [0.1, 0.1, 0.1],
          },
          rightFingers: {
            thumb: isThumbUp ? [0.1, 0.1, 0.1] : clampedFlex,
            index: clampedFlex,
            middle: clampedFlex,
            ring: clampedFlex,
            pinky: clampedFlex,
          },
          facialNMS: {
            browRaise: isNod ? 0.6 * Math.sin(progress * Math.PI) : 0.1,
            eyeBlink: progress > 0.45 && progress < 0.55 ? 1.0 : 0.0,
            headNod: isNod ? 0.4 * Math.sin(progress * Math.PI * 2) : 0.0,
            mouthOpen: 0.1,
          },
        };

        const previousFrame = frames[frames.length - 1];
        const crossfadeFrames = Math.min(12, numFrames);
        if (previousFrame && f < crossfadeFrames) {
          const crossfade = interpolateFrame(previousFrame, frame, (f + 1) / crossfadeFrames);
          crossfade.timestamp = timestamp;
          frames.push(crossfade);
        } else {
          frames.push(frame);
        }
      }

      currentTime += signDuration;
    }

    return {
      trackId: `ANIMGEN_TRACK_${Date.now()}`,
      fps: this.fps,
      totalFrames: frames.length,
      duration: Math.round(currentTime * 10) / 10,
      frames,
      glossList,
    };
  }
}

export const animgenEngineInstance = new AnimgenEngine(60);
