# HOME pause retained-upper backdrop direction

This worker slice corrects the retained application backdrop during ordinary
HOME suspension. It advances the decoded `BannerBG_SceneIn` geometry from
frame 0 through frame 20 alongside the existing `BannerBG_AppPause` material
track. The previous browser path held SceneIn at frame 20, so its first pause
sample was already compact and AppPause then made the retained image grow.

This is visible progress, not whole-scenario acceptance or proof of native
caller timing.

## Captured defect

The coordinator's production capture at base
`f2c09f49d41e7d028f1c7b095c7c58d3a6d5ac82` is under:

`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261008/home-pause-upper-mac/browser-normal/`

Its `repeat-1-capture.json` SHA-256 is
`c8a794aba46432e470b86b23b5579f10938e9f15b13f20edd441d4ebbfdc1473`.
The upper pause samples show the retained Health image at x51..349 in
`repeat-1-001-top.png`, larger by `repeat-1-006-top.png`, and settled at
x24..375 in `repeat-1-021-top.png`. Their SHA-256 values are respectively
`2550d7339d506d5c8d0fb62d6415210ac088bb4a30fd58cd057e72448e95b91a`,
`c3b6eaa7b98f32aee064e44b4acaf95d3d6e5c3a7025088db6267424adcb443b`,
and `bf18b0704e70fe24e5720feeebd330c56f2a3ce97a4efe405257ec2676bf92af`.

The fresh native first cycle is under the sibling
`home-pause-upper-review/newmac/first-onset-late/` directory. Original frames
004, 008, 012, 013, 020, and 026 show a full application view contracting into
the curved retained backdrop before and during HUD/card entry. The review does
not assign native animation frames or caller epochs to those movie samples.
`native-review.md` SHA-256 is
`52760fa10aa75834b7445793ca8e77b8ffed70f4253bb27ee66ad70102580288`.

## Source mapping

| Visible element | Manifest key / source resource | Identity |
| --- | --- | --- |
| Retained upper geometry | `models.homeBackground` -> `models/home-background/model.json`; `BannerBG`; `BannerBG_SceneIn` | HOME `0004003000009802` v24576, content index 0 / `00000082`, `romfs/3D/BannerBG_LZ.bin` |
| Retained upper tint and UV motion | Same model; `BannerBG_AppPause` | Same title and resource |
| Close/switch override | Same model; settled SceneIn20 + AppPause20, then `BannerBG_AppQuit` | Same title and resource |

CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`.
Decrypted content SHA-256 is
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Compressed resource SHA-256 is
`27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711`.
Decoded CGFX SHA-256 is
`092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595`.
The delivered model SHA-256 is
`45b3c6a470f681a10443f90fc73aff016b97a077b977b62649465524dffd3615`;
converter `ctr-cgfx-web` 1.1.0.

The delivered SceneIn clip has one `BG` bone transform and 20 frames. Its
source keys are now validated before the suspended model becomes available:

| Channel | Key frames `(frame, value)` |
| --- | --- |
| Scale X/Y | `(0, .777129)`, `(12, .942945)`, `(19, .998914)`, `(20, 1)` |
| Scale Z | `(0, .001)`, `(2, .109891)`, `(19, .99513)`, `(20, 1)` |
| Translation Y | `(0, .223)`, `(20, 0)` |
| Translation Z | `(0, -34.786)`, `(2, -35.876)`, `(19, -44.7373)`, `(20, -44.786)` |

Interpolation, slopes, pre/post repeat modes, element count, frame count, and
clip flags are also pinned. A mutation or missing/duplicate clip fails the
suspended resource explicitly.

## Implementation and invariants

`homePauseEntryPresentation` now supplies the same bounded pause frame to
SceneIn and AppPause. Normal presentation exposes frames 0 through 20 in
receipt order. Reduced motion uses frame 20. The renderer playback boundary
accepts integer SceneIn frames 0 through 20 only for the one-material entry
stack, and requires its SceneIn and AppPause frames to match.

The null/default settled pose remains SceneIn20 + AppPause20. The close/switch
stack still requires SceneIn20 + AppPause20 before AppQuit0..20, so entry motion
cannot leak into close. Existing owner/generation capture binding, playback-key
cache, paired failure, stale-candidate handling, texture reuse, reset, and GPU
disposal paths are unchanged. No asset, shader, material definition, or
`firmware-model.ts` code changed.

The renderer test projects the decoded mesh through the real firmware camera
and verifies that SceneIn frames 0, 10, and 20 contract in strict order. It
also verifies that frame 20 equals the prior settled null presentation.

## Adaptations and limits

Running SceneIn0..20 and AppPause0..20 on the existing browser pause receipt
clock is a fitted host timeline adaptation. The native caller epoch and exact
relationship between these two source clips remain untraced. The source clips,
geometry, mask, UVs, colors, and terminal pose are unchanged.

The retained application pixels are still a host capture/padding/binding
adaptation. Portfolio content, duplicate captured HUD content, caption fits,
footer policy, and previously recorded offline/native-screen differences remain
adaptations or residuals. No new native visual or audio asset was added.

This worker inspected the pre-change browser PNGs and the native movie frames.
It did not operate Azahar, the production browser, or audio. The coordinator
must recapture normal and reduced pause entry after integration, verify the
first valid paired receipt and owner/generation metadata, compare motion and
terminal pixels with the fixed native evidence, and rerun close/switch controls.
Exact input, timing, framebuffer epoch, audio, and whole-scenario 1:1 remain
unproven.

## Checks

- Focused: `node --test tests/home-entry-motion.test.mjs tests/home-suspended-background.test.mjs tests/firmware-banner.test.mjs` passes 91 tests.
- TypeScript: `npm run typecheck` passes.
- Full suite: 2,430 pass, 37 fail, 98 skip, 1 TODO. All 37 failures are missing private Camera evidence or sparse hardware model/source files, outside this slice.
- Default Turbopack build cannot follow this worker's temporary external `node_modules` symlink. The webpack retry reaches the pre-existing unconfigured WGSL import and stops there.
- Shader validation was not run because this slice changes no shader or material definition.

No post-change browser capture, native capture, mask, or pixel diff exists at
worker handoff. The private scenario matrix remains unchanged and the HOME
pause scenario remains `fail` pending coordinator integration and recapture.
