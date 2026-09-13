import fs from "node:fs";
import path from "node:path";

const modelPath = path.resolve("public/model.glb");
const buffer = fs.readFileSync(modelPath);
if (buffer.toString("ascii", 0, 4) !== "glTF") {
    throw new Error("model.glb is not a valid GLB file");
}

const jsonLength = buffer.readUInt32LE(12);
const gltf = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8").trim());
const nodes = gltf.nodes || [];
const skin = (gltf.skins || [])[0];
const jointNames = (skin ? .joints || []).map((index) => nodes[index] ? .name).filter(Boolean);
const jsonText = buffer.subarray(20, 20 + jsonLength).toString("utf8");
const requiredJoints = [
    "Head",
    "LeftArm",
    "LeftForeArm",
    "LeftHand",
    "RightArm",
    "RightForeArm",
    "RightHand",
    "LeftHandIndex1",
    "LeftHandIndex2",
    "LeftHandIndex3",
    "RightHandIndex1",
    "RightHandIndex2",
    "RightHandIndex3",
];
const requiredMorphs = ["mouthOpen", "jawOpen", "browInnerUp", "eyeBlinkLeft", "eyeBlinkRight"];
const missingJoints = requiredJoints.filter((name) => !jointNames.includes(name));
const missingMorphs = requiredMorphs.filter((name) => !jsonText.includes(`\"${name}\"`));

if (missingJoints.length || missingMorphs.length) {
    throw new Error(JSON.stringify({ missingJoints, missingMorphs, jointCount: jointNames.length }));
}

console.log(JSON.stringify({
    model: "public/model.glb",
    jointCount: jointNames.length,
    meshCount: (gltf.meshes || []).length,
    requiredJoints: requiredJoints.length,
    requiredMorphs: requiredMorphs.length,
    status: "PASS",
}, null, 2));