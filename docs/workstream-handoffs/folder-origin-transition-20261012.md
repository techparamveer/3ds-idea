# Folder transition origin, 12 October 2026

Candidate based on `e61dd22bf910d639069a7d6abd6679cd0cc0fa12`. Not native acceptance.
Only `home-presentation.ts`, `firmware-presentation.ts` and the focused origin test change runtime/test behavior. No asset, renderer, clock, reducer, scene or input change.

## Captured defect

The closed aligned-origin run is under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/folder-origin-aligned-20261012-v1`.
Its `geometry-investigation-astra-v1` uses predeclared direct tray edges with +/-2px uncertainty, without native/browser frame matching. Native and browser placement intervals are disjoint in first/repeated Open and Back. The existing browser scales around the LCD center and omits the independent caller translation. Diagnostic native 5% speed and 2000ms touches do not establish normal-speed timing.

## Original source and change

Private `fix-astra-v1/source-contract.md`, SHA-256
`37a31a13137c9fea312aef39362055a359de321190b3de96fa6803c6997785ce`,
records four hash-verified disassembly excerpts. Original EUR HOME title
`0004003000009802`, v24576, executable SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`
is read-only at `animation-20261007/home-pause-source/exefs/code.bin`.

Ordinary setup `0x2a3228..0x2a324c` saves selected root grid X minus scroll and grid Y before child history loads. Opening `0x29b964..0x29b9b8` and closing `0x29f0bc..0x29f10c` multiply each saved coordinate twice by float32 `1 - current/(end-start)`, then write the folder layout RootPane translation through `0x1d9f38`. This is not a constant pivot or captured244,84 offset.

The helper derives that root coordinate from the existing retained root view, with its own selected slot, density and viewport. Chrome and occupied/blank children receive the same RootPane translation. Authored scale, alpha, window material, panel extents, Back feedback, capture backdrop, resource identities and source frames remain unchanged. Frame16 and reduced-motion endpoints retain zero offset.

The lower task reads current before the layout pass; `0x269470` applies that current frame and `0x269478` then advances the controller. Presentation therefore uses the existing `appliedFrame`, not the post-advance `frame`. The first reverse pair retains frame16/zero translation even though the stored clock is already15. Existing [close ordering](../native-folder-close-boundary.md) and [child parent bindings](../home-folder-close-system.md) remain authoritative.

Existing delivered source mapping is unchanged: manifest `home.launcher`, pack `packs/home/launcher.json`, `LncFolder_00` from `launcher_LZ.bin/blyt/LncFolder_00.bclyt` SHA-256 `9581b9f24f79646159ee161e589fd62b92edd7b55dd5e0e2b2f1db6980fb6a24`, and `LncFolder_00_FadeIn` from `launcher_LZ.bin/anim/LncFolder_00_FadeIn.bclan` SHA-256 `0cc21b182087829e94470dbd171a2c0af5d61118668eeb9a550b70e74cdecfda`. No new extraction/converter or firmware delivery is required.

## Verification and limits

The new real-caller test first reproduced the absent RootPane write. It runs the actual presenter, native renderer, decoded delivered textures and pane inheritance across five root slot/density/viewport cases in forward entry, every reverse-close pose and repeated entry. It checks preserved source alpha/scale, root/child history, applied-versus-current frames, reduced motion, endpoints and transform restoration. Canvas transport records transforms/raster publication; it does not claim browser compositing parity.

The 11-file focused command in private `focused-verified.json` passes 224 tests with one existing skip. Precommit typecheck passes. Full tests, both final typechecks and the postcommit build are recorded separately in `fix-astra-v1/report.md` and its final source/build manifest. The known unavailable historical Camera date-group PNG remains an explicit full-suite limitation, not an assertion change.

Coordinator owns production recapture. Native display epochs, normal-speed input/cadence, exact moving pixels and muted audio remain unverified. Existing browser receipt timing and portfolio contents remain adaptations; this change does not expand pickup/moving/reordering or special native folder routes.
