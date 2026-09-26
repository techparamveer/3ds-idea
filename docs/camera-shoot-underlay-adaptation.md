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
