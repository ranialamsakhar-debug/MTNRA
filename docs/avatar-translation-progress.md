# Avatar translation and interaction progress

Updated: 2026-09-13

## Completed

- [x] Diagnose the hand-position loop: `ThreeDHumanAvatar.animate()` was applying local poses while ignoring the generated AnimGen frames.
- [x] Sample AnimGen frames by timestamp with `sampleAnimgenTrack()`.
- [x] Apply generated shoulder, arm, forearm, wrist, finger, and facial values to the GLB render loop.
- [x] Use the real duration of each sequence item for the AnimGen timeline.
- [x] Add eased interpolation with smoothstep.
- [x] Add a 12-frame crossfade between consecutive signs in `AnimgenEngine`.
- [x] Add technical runtime traces for SiGML -> AnimGen -> GLB and GLB rig capabilities.
- [x] Add a reproducible first-sign smoke check with `validateSiGMLSign()` and a visible validation status in the player.
- [x] Add reproducible technical cases for `BONJOUR` and `MERCI` with `validateKnownSigns()`.
- [x] Add optional face-anchor detection and constrained hand-to-mouth/forehead IK when the GLB exposes those anchors.
- [x] Preserve full document coverage with dactylology fallback, word counters, and an on-screen summary.
- [x] Extract text from uploaded PDFs with `pdfjs-dist` before translation.
- [x] Lower default AnimGen trajectories and vary them by sign placement/hash to reduce raised/repeated hands.
- [x] Display document coverage, dactylology fallback count, and a bounded document summary.
- [x] Keep coverage metadata consistent for remote LSM responses and local fallback conversion.
- [x] Add automated `npm run test:avatar` validation for the real `model.glb` rig.
- [x] Build frontend successfully with no diagnostics in the modified TypeScript files.

## Partial

- [x] Inspect the real GLB metadata: 54 joints, 11 meshes, individual finger chains, and required facial morph names.
- [ ] Implement real linguistic sign dictionaries per language. Current HamNoSys entries are administrative approximations, not a complete ASL/LSF/LSM lexicon.
- [~] Implement hand-to-face inverse kinematics and contact targets for chin, forehead, cheek, temple, and mouth. Runtime support is present for mouth and forehead; actual GLB anchor availability is still unverified.
- [ ] Validate signs such as `bonjour` and `merci` against interpreter-approved references. Current tests validate technical motion generation only.
- [~] Add a standalone CI test runner for a browser-loaded GLB scene. Metadata validation is automated; WebGL pixel/render validation still needs a browser runner.

## Next execution step

1. Open the avatar with a known single sign.
2. Confirm the visible AnimGen status includes `BONJOUR/MERCI valides techniquement`.
3. Capture `[Rig trace] GLB capabilities` from the browser console.
4. Compare `faceAnchors`, bone count, and morph target count with the required rig.
5. Replace the two reference HamNoSys snippets only after interpreter validation.
