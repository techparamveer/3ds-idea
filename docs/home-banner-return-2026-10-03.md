# HOME Banner Return - 3 October 2026

## Captured Defect and Change

The preceding [Open return](home-open-return-2026-10-03.md) desktop replay at
`0172842b` kept the upper banner pending throughout ChangeUp0..8 and first
showed it after controller completion. Native41 already has a returning Health
banner while Open is still completing. This is structural evidence, not a
shared native/browser epoch.

Worker `71ebad00` integrates as `78fa7325`; coordinator boundary regression
is `c01e1219`. The same-identity `exit-terminal -> footer-exiting:0` boundary
requests the underlying selected content six updates earlier than before.
Return0 does not request again. The fallback resolver preserves the selection
from departure0 so it cannot cancel the request with clear. Cancellation,
replacement-generation checks and exact runtime ownership remain enforced.

No service delay, resource readiness, pose, renderer or asset is changed.
With immediate readiness the existing service stages yield departure1 hiding,
2 gate, 3..6 wait1..4, return0 wait5, return1 loading and return2 earliest active
at scale0.8. Pending primary remains null through return1. Asynchronous resource
preparation can delay actual activation; this is explicitly not guaranteed
native frame timing.

## Source Identity

No extraction or new delivery. Unchanged Health keys `healthBannerCommon` and
`healthBannerEur` map to title `0004001000022300` v3077, `exefs/banner.bin`,
SHA-256 `bb810ecddba00bf196d7f480d8c1c13fc569a707416fded522b78ae5679f0755`.
The [banner asset audit](stock-home-banner-asset-audit.md) retains full content,
model, texture and converter provenance. The [preceding source record](home-open-return-2026-10-03.md#source-identity)
retains HOME title/version/content, ChangeUp archive/internal path, SHA-256
and ctr-native-web1.2.0 / CTRTool1.3.0 identities.

## Verification and Limits

Private root: `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-banner-return-20261003`.
Full suite: 1,869 pass, zero fail, 23 skipped, one existing TODO (1,893 total).
Typecheck and production build pass. Independent read-only host, boundary,
painter and resource review: 185 pass, zero fail, one TODO; no findings.
No shader/material changes.

Actual-input production captures at `c01e1219`: final `desktop-recheck`46,
`mobile`44 and `reduced`54 close pairs plus four endpoints each. All pass
departure0/6, return0/8, one owner, retired app throughout return, exact saved
fixture restoration, muted state and no page errors. Coordinator inspected
desktop/mobile viewport screenshots and raw upper return pixels. Agent-browser
also reports a ready, muted stage, expected controls and no error overlay.

Clean desktop first active is return2/scale0.8, then return4/0.9,5/0.95 and6/1;
reduced captures every return0..8 and likewise activates at2. Mobile first
captured active is return4/0.8 and reaches1 at8. Initial `desktop`36 is retained
as a load-sensitive diagnostic: seven restored dedicated test tabs were open.
Its first terminal paint was still pending; motion metadata places activation
later in that same update, but the first retained active PNG is completion.
The phase-keyed observer deduplicates same-phase paints, so it cannot prove
absence throughout that terminal update. Extra test tabs were closed before
mobile/reduced and the sole-tab desktop replay. This is not proof of robust
timing under arbitrary load.

Read-only resource tracing confirms preparation begins at request time, before
the service loading stage. A new exact requestEpoch creates a fresh resource
owner; asynchronous decode/model/GPU preparation can finish later. No cache,
service gate or stale-ticket/disposal contract was altered to hide that delay.

Native run uses the exact isolated executable in `native-folder-switch-20261002`,
volume0%, Null output, Static input, 5%/3FPS and matching folder13/Healthchild2.
Own400x480 PNGs are under its `screenshots/banner-return-20261003` directory.
Preparation captures before `00.20.57.337` are excluded. That file is suspended
baseline; `00.21.40.778` is the closing dialog, followed by the regular capture
sequence beginning `00.21.46.079`. Early close entry is not covered by this run.
The filesystem has47 regular PNGs, not48 dispatched requests; regular index0
contains a corrupt surface and is excluded, leaving46 usable regular frames.
The inspected crop sheet shows grey footer19, fade20..21, blank22, faint Open
without banner23, first banner while Open changes24, and footer settled25.
These are inventory indices, not native frame counters.
After normal Quit, PID22843 is absent and the original config is restored
byte-exact, SHA-256 `d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.

## Native Comparison

Named raw pairs compare the fresh native sequence with preceding0172842b,
initial desktop and final `desktop-recheck`, mobile and reduced. The coordinator
opened `banner-return-comparison-sheet.png` and the native crop inventory.
No mask, registration, shift, colour fit, constructed proxy or wallpaper-phase
search is used. Upper ROI `[40,80,360,180)` includes wallpaper; footer ROI
`[0,212,320,240)` and Open label `[110,212,210,240)` localize diagnostics only.

At native25 versus final return8, upper ROI pixels over delta2 fall from22,779
to17,889 and maximum delta209->33; whole paired LCD count67,540->61,156.
The settled Open label retains0 pixels over delta2/max2; complete footer
still has54/max5. Direct previous-to-final footer controls at departure0/6
and return0/4/7/8 are byte-exact. No footer change is hidden by upper metrics.

The named first-retained-onset pair is not a pixel match: native24 versus
final return2 has21,881 upper-ROI and8,633 footer pixels over delta2. Its Open
footer is visibly fainter than native24. Coarse native capture intervals can
skip earlier poses, so these first-retained samples do not prove a too-early
native scheduling boundary. The new event order is closer, but exact relative
pose, cadence and resource-load robustness remain unresolved.

Frozen report SHA-256:
`69e898fdd2c6e1c3c7c81aead7a0b15eff10b214b772ec1cb60249b27ec0d41b`.
Manifest (`banner-return-comparison-manifest.json`):
`9f5eeddf317fa106bc195acb92a23689b7bd09bdb6ce5bdabc9d4a1f98413b2a`.
Inspected sheet: `65161a1b57719364f05e0fe9af1a10119a3736ec1776eb4fcf04b0e1a0dd2088`.
Generator: `7e7f00fe55d916f08372e6babc446211e09855e877c7683e48ed85e1e50c7aca`.
Coordinator independently re-hashed all396 manifest records; comparator
confirmed byte-stable regeneration. Report status remains diagnostic-fail.

Chrome32915 closed via CDP Browser.close, exited0 and is absent. Capture/test
sessions finished; production preview3021 remains HTTP200 at runtime78fa7325.
Browser stderr contains navigation framebuffer and service endpoint warnings;
empty pageerror arrays do not establish a warning-free process.

Still non-native: capture-fitted request boundary, source binding/epoch,
entry donor/clock, departure binding/clock, upper opacity/icon policies,
folder anchors/visibility/hover/drop/glyph coverage and portfolio adaptations.
Whole scenarios remain fail; exact input, motion and audio acceptance remain
open. Private matrix unchanged. No system audio, Spotify, microphone, default
Azahar profile, original firmware or DeveloperStorage artifact writes.
