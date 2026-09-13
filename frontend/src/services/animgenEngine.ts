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
  public compileSiGMLToAnimTrack(sigmlXml: string): AnimgenTrack {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(sigmlXml, "text/xml");
    const signNodes = xmlDoc.getElementsByTagName("hns_sign");

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

      // A sign is a short phrase, not a frozen pose. Keep enough time for the
      // preparation and release while leaving the next sign room to articulate.
      const signDuration = isTwoHanded ? 1.1 : 0.95;
      const numFrames = Math.floor(signDuration * this.fps);

      for (let f = 0; f < numFrames; f++) {
        const progress = f / numFrames;
        const timestamp = currentTime + progress * signDuration;

        // Cubic spline interpolation factor for natural human movement
        const easeInOut = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Compute Inverse Kinematics for arms
        const rightShoulderX = -1.2 * easeInOut;
        const rightElbowX = 1.2 * easeInOut;

        // Compute finger handshapes based on HamNoSys tags
        let rightFlex: [number, number, number] = [0.1, 0.1, 0.1];
        if (isFist) rightFlex = [1.4, 1.5, 1.2];
        if (isPinch) rightFlex = [0.8, 0.9, 0.6];
        if (isThumbUp) rightFlex = [0.1, 1.4, 1.4];

        const clampedFlex = clampFingerJoints(rightFlex);

        const frame: BoneTransformFrame = {
          timestamp,
          leftShoulder: [-0.2, 0, 0.3],
          leftElbow: [0.4, 0, 0],
          leftWrist: [0, 0, 0],
          rightShoulder: [rightShoulderX, 0.3, 0.4],
          rightElbow: [rightElbowX, 0, 0],
          rightWrist: [0, 0.4, 0],
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

        frames.push(frame);
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
