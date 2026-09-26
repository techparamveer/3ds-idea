# Camera Welcome static shoot underlay adaptation

This visible slice consumes `manifest.models.cameraShootBackground`, the delivered
`models/camera-shoot-background/model.json` from EUR Camera `P_Shoot_D.bcenv.LZ`.
Its decompressed source SHA-256 is
`728ff7412764350ab15fd978236e29dfc0a5bd850803b7a2f343ad82ca0294a1`.
The preceding [source handoff](camera-guide-underlay-source-handoff.md) and
[state audit](camera-welcome-underlay-state-audit.md) remain authoritative about
unresolved native runtime state. This is an explicitly labelled adaptation,
not source controller replay or 1:1 acceptance.

## What is rendered

The scene-owned lazy `camera-shoot-background.ts` uses the existing
`StockModelBackground` contract. It prepares only while a Camera owner is on
`guide`, caches a 320×240 RGB readback, and draws beneath the native guide body.
Readiness, error, timeout, retry and paired LCD publication include this owner.
Leaving guide, replacement, recovery and scene teardown invalidate/release it.
No extra WebGL context or animation loop is created.

All delivered models are decoded without editing their geometry, UVs, vertex
colours, textures, materials, LUTs or light records. Only the static `P_Shoot_D`
model is visible. X_Arw, Z_Arw and A_stick remain hidden because the source audit
did not establish their settled Welcome visibility or pose. No constructor
phase values are asserted to be the displayed state.

## Projection and composition choices

The preserved native reference is
`reference/scenario-matrix/v1/captures/camera-first-run/native/combined.png` in
the private firmware evidence directory. Its lower LCD is 320×240 and exposes
a shoot scene around the guide. The only projection adaptation is source
camera aspect **1.5 → 4/3**, to fit that LCD viewport. Source Aim position
`(0,680,661.113)`, target `(0,0,20.4593)`, FOVY `0.660595`, near/far
`0.34/34000` and the static model's identity placement remain unchanged. This
is a viewport fit, not a measured match of source grid lines to native pixels.

The source fragment/vertex alpha blends into a black offscreen clear. Its
already-composited RGB is copied once as an opaque LCD background. There is no
new colour replacement or guessed modal dimmer. The renderer continues to use
its existing bounded CGFX lighting/sampling support; unchanged source material
inputs do not prove native GPU equivalence.

## Remaining differences and coordinator comparison

The source P_Shoot_D **2D layout** and its active clips/theme are not composed
by this slice. The visible native top strip and side/footer controls therefore
remain incomplete. Guide attenuation, final camera selection, interactive-model
pose/visibility and grid registration remain unverified. The static background
is used beneath every guide page but has only the page-1 reference as initial
evidence; later pages and guide exit need separate checks.

Coordinator target: capture the raw Camera Welcome page 1 LCD pair and compare
against the preserved `camera-first-run/native` pair and the previous
`camera-guide-page1-69d570a-20260926` browser/diff directory. Inspect the narrow
lower perimeter, the guide body (which should stay unaffected), and both LCDs.
Then check pages 2–5 and guide exit for resource release/input continuity.
No production browser or Azahar was driven in this implementation lane.

Focused CPU tests cover source validation, camera adaptation, unchanged source
data, static-only visibility, late load invalidation, one cached readback,
renderer restoration after exceptions, draw order and paired readiness/retry.
These tests do not establish visible browser pixels.

Verification on this worktree: the 22 focused Camera/background/readiness tests,
`npm run typecheck`, `npm run build` and `git diff --check` pass. The complete
`npm test` run reports 1,372 passes, 40 failures, 23 skipped and one todo. Its
failures are unavailable private hardware model/report fixtures plus the Notes
specimen test's hard-coded external-drive write failing with ENOSPC. Camera
and stock readiness tests pass in that run. The full suite is not claimed green.

## Follow-up: source 2D Welcome perimeter

The live guide now also loads the already delivered
`packs/camera/contents/0000-0000001a/lyt-P_Shoot_D-arc-LZ.json` and draws its
`P_Shoot_D` layout after CGFX and before `C_DlgChA`. Its source layout SHA-256
is `3000aa79b92564e0cf495403adaa1c5d835fc44c1c64449075c369137d23ef5b`.
The `P_Shoot_D_Disable` clip (source SHA-256
`a129d382126a52af8f615d4348f80fc9a20425134c1d2c3c789abc8b007fc1a1`)
is held at local frame 0: it raises PhoBase/MovBase by 8 source units and
retains the source footer/header geometry. This is a capture-fit choice for
the inactive controls behind Welcome, not a proven native controller binding.
Messages follow the layout's `MSG` metadata and retain their RI.mstl colours.

The four named constant slot-5 materials ShootLBase, ShootRBase, Lever1 and
UserWdw1 receive the existing orange `(255,161,0,255)` user theme. The three
blue source slots and the turquoise UserWdw1 slot are checked before cloning;
all other materials, including UserWdw0 and the text-window materials, retain
their distinct source constants. No source JSON or textures are changed.
The photo/movie, left/right shoulder and footer graphics all come from this
layout's delivered firmware textures. They remain inert behind the guide.

Native lower pixels at `(0,0)`, `(40,0)` and `(0,210)` are `(127,81,0)`.
A Canvas `brightness(0.5)` filter is applied only during the source 2D draw,
then restored before the guide. This is an explicit capture-fitted attenuation
adaptation; it does not assert C_BkMask use or native compositing equivalence.
The expected half theme `(127.5,80.5,0)` motivates this bounded fit. C_BkMask
is absent from delivered packs, so this implementation does not claim to
load it. CGFX brightness remains unchanged.

An offline CPU Canvas probe confirmed the source layout/textures draw without
renderer diagnostics and expose the expected brown shoulder/footer graphics.
This does not verify browser output. The missing `-L-BtnIOcam` child resource
leaves the top strip near x80–128 incomplete, and tool child layouts are not
instantiated (covered by the guide). Native CGFX grid brightness/registration,
full native attenuation and settled runtime bindings remain unresolved. Pages
2–5 reuse this static underlay and require their own coordinator comparisons.
The prior paragraph describing absent 2D composition is superseded by this
follow-up; its other acceptance limits still apply.

Follow-up verification: 41 focused Camera/background/preparation tests pass,
including source immutability, draw ordering, missing-pack failure and Canvas
filter restoration after a thrown source draw. `npm run typecheck`,
`npm run build` and `git diff --check` pass. No production browser or emulator
was driven; coordinator raw LCD comparison remains the acceptance gate.

The omitted child resources are now [published with source provenance](camera-shoot-child-delivery.md).
The anchor resolves to `P_CamBtn` and then `P_CamIcon` in the same shoot pack.
This closes the delivery gap; runtime child instantiation and native comparison
remain separate integration work.

## Source modal/base follow-up

The original warm lower clear and black-alpha128 guide pass are now traced and
implemented in [Camera guide modal composition](camera-guide-modal-composition.md).
This supersedes the black CGFX clear and 2D-only brightness fit described above.
Projection, visible model selection, theme and button-clip limitations remain;
coordinator LCD comparison is still required for the new composition.
