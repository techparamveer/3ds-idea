# HOME Held Pickup - 2 October 2026

## Native Evidence

Private artifact root `A` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`;
`H` is `A/home-pickup-held-20261002`. No new DeveloperStorage artifacts.
Only the coordinator operated GUI, on the authorized Mac. Native and browser
audio stayed muted; system audio, Spotify and microphone settings were untouched.

A fresh launch of the stopped private reference restored Health in folder
child2. The preceding run's final root screenshot did not establish persisted
placement. The stopped profile was copy-on-write cloned to
`A/native-held-ctm-20261002`, with clone-local paths and no user symlinks.
Original hardware, EUR/English, Vulkan, native screenshot factor1, Static
input2, Null output1 and volume0. The profile audit has no issues.

The verified neutral CTM template was transformed using the existing helper,
preserving its header, revision, record order and length. `H/held.ctm` SHA256
`cb054af5637b2f7664767552682276940f90f3e9e2ba2c6ae071daa9b66f84da`;
config snapshot SHA256
`e91312841378516cae0cfd613ca03a42050fba8aac532077171fe4350d040f40`.
Samples0..7020 are neutral,7020..14040 hold lower244,137,
14040..21060 hold59,54 and21060..27596 release. These are nominal30s HID
phases, not shared browser/rendered-frame timing. Native CTM clock is22September.

The exact isolated executable has SHA256
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
It ran with supported `-p MOVIE CONTENT.app`, then Tools > Capture Screenshot
while playback ran. Unlike the previous live-drag attempt, no host mouse button
had to remain down. All four own PNGs are400x480, with lower320x240 at40,240:

| Phase | Filename under clone/screenshots | SHA256 |
| --- | --- | --- |
| Neutral | `_02.10.26_20.33.41.497.png` | `192bd751e31e4174e7b4a8e8e4038b6ed736b84c8e980e06a758980b63fb53e1` |
| Folder held | `_02.10.26_20.33.56.197.png` | `48a18cabbc26a3eacc41926a97dc95f2b75fd7743a6d6c4e953d5adf87750607` |
| Root held | `_02.10.26_20.34.26.428.png` | `83c6db6ad50711219e688ee6505c5ad846017520fc141986ff0240e2a8ddab7d` |
| Released | `_02.10.26_20.34.58.311.png` | `caa65ad5968372b35cf6a92191f8ad03cc853e25c8fd2799aeebb7cfd4547ce1` |

Playback reached EOF with no logged mismatch and exited0 after normal Quit.
This is observed replay evidence, not deterministic replay from multiple seeds.
See `H/held-ctm-input-record.md` for process IDs, counters and exclusions.

## Captured Defects

Prior runtime1089c78c draws the folder-held icon about14 raw pixels too low.
Native bright shell is74x69 at x207..280,y86..154; browser is74x68 at
x207..280,y100..167. On returning to six-row HOME, native changes the held
shell to28x26 while browser retains its74-pixel folder width.

Source9794f8c2 is integrated as runtime652520ee plus regression follow-up
1d682a85. The adapter supplies an explicitly fitted anchor at observed Scale1
and Scale5 only; other frames retain the earlier zero-anchor adaptation.
The exact timed Back carry retargets moving Scale to the destination grid,
retaining source-folder Blank Scale, source identity, touch and atomic drop.
The native painter and decoded resources are unchanged. This is not a recovered
native anchor initializer. [Contract](home-pickup-entry-contract.md).

The first production retarget captures show folder bright shell74x68 at
center243.5,119.5 versus native243.5,120; root28x26 at58.5,47.5 versus
native58.5,48.5. The root lift therefore needs a further measured one-pixel
correction. The initial proportional -5.25 fit is not the final acceptance
value. `bcc3dcb6` refines Scale5 to `(0,-4.25)`, a direct capture fit rather
than proportional inference. The full raw pair still fails; geometry
improvement is not pixel parity.

Independent review found a real phase-dependent defect even though the first
browser replay succeeded: a counted update could cross Back before the scene
captured its pre-action state. Raw-time crossing worked; counted crossing left
the departed Scale1 and widgets. `a751722b` reconciles folder changes within
each counted pass, before its control submission. Same-context passes keep
their existing path. The regression models actual scene order rather than only
wrapping the full reducer, and the reviewer confirms the boundary correction.
The old release/swap test is retained separately from resize/cancel coverage.

## Comparison Boundaries

`H/ctm-before-browser` and `H/retarget-first-browser` use the earlier short
regression script. They must not be labelled30s phase-matched. Separate
`H/ctm-phases-before` and `H/ctm-phases-after` use actual projected pointer
input with nominal30s neutral/hold/move/release phases, preserving elapsed
timestamps. All replays restore their browser fixture using actual reverse
drag, with no state injection. Native root6 is empty while browser root6 holds
portfolio content: atomic swapping is an intentional content adaptation.

Native dump visuals, title/content/CIA paths, archive/texture/layout/animation
hashes and converter provenance remain exactly those in the
[folder drag-out mapping](home-folder-drag-out-2026-10-02.md). No new assets,
font substitution, reconstructed shell or guessed native cue were added.

Still open: native hides the footer during both held phases and hides the upper
title during root-held preview; production still shows them. Folder-held
toolbar dimming, composited icon color/contrast, one-pixel folder shell height,
other density anchors, native anchor initialization, exact hover/cadence/motion
and audio remain unresolved. Existing portfolio content, hover/movement/drop/
edge timing and previously recorded lifecycle/coverage/high-slot adaptations
remain explicit. Empty-mask whole LCD comparisons remain fail; no scenario
matrix acceptance or strict1:1 claim.

## Final Verification

Implemented and delivered at `bcc3dcb6`: fitted Scale1/5 anchor, destination
moving Scale and counted-pass context reconciliation. No new native assets;
the existing dump-identified Pickup/Blank layouts and Scale animation are reused.
Source-fit policy is an adaptation, distinct from source-identified resources.

Tested in the coordinator checkout:1,836 pass,0 fail,23 skip,1 TODO;
typecheck and production build pass. Final logs are `H/final-tests.log`,
`H/final-typecheck.log` and `H/final-build.log`. No shader/material change.
Worker build's external-node_modules restriction does not apply to this
successful integration build.

Browser-inspected: `H/retarget-final-desktop`, `retarget-final-mobile` and
`retarget-final-reduced` each contain seven raw LCD pairs and a successful
result. Their actual-pointer script asserts moving Scale5, source Blank Scale1,
anchor-4.25, source19/2, hidden primary, held touch, atomic swap with all eight
apps retained, reverse byte-identical preferences and outside-release cancel.
Every run is muted with no page errors. The mobile console image was inspected.

Native-compared: the same fixed native held PNGs are compared without masks,
pixel shifts, fitted comparison alignment or exclusions. The final root bright
shell bounds28x26 and center58.5,48.5 agree; mint halo bounds/center and artwork
center also agree. Folder bright shell remains one row shorter. This measured
geometry result does not establish a static pixel tier: composited artwork
color differs, and the full screens retain the visibility and content defects
listed above. Native-input timing, motion and audio remain unaccepted.

Final30s-phase replay is `H/ctm-phases-final` atbcc3dcb6. Recorded browser
events occur at30063/60052/90031ms relative to the prepared fixture; all four
phases plus actual-pointer reverse restoration complete without errors. This
matches nominal phase intent, not native render epoch or exact HID cadence.
Whole unmasked pixels above delta2 (upper/lower): neutral24123/6564,
folder-held58666/33504, root-held59403/17666, released51361/9282. All fail.
Coordinator opened the final geometry, phase and variant sheets. The raw LCDs
and per-file hashes remain under `H/comparison/`; private matrix is unchanged.

Final report `native-held-final-report-bcc3dcb6.json` SHA256
`231e70f7c686432a04ce4766c8bcaecb28efb8cc0516bcc16833776456f0f2a4`;
manifest `native-held-final-manifest-bcc3dcb6.json` SHA256
`3a550472e3cb0489fc5fa1f688752b71f2423803b719236b6eacd0a93f264309`.
Final phase sheet SHA256
`ab7e1be9fb94b2d63dbfcc3e525595a782489673b51402dd291941ca9fb6f883`;
geometry `7ecbd9e39acbef7d6a06836695fac735bad5709c09621bb974d2fa42b11a1e72`;
variants `4c4332f96a2e1b6f612e0a2b7cf9654a2e8dedd482b2304dee1e18ea11bfab11`.
The phase-sheet caption was corrected from the earlier runtime label; initial
final-report/manifest/phase hashes are superseded by these values.

Owned Azahar PID98858/session56407 and Chrome PID6746/session29768 both closed
normally with exit0; no owned GUI windows remain. Preview3021/session45664
is retained and returns HTTP200. No firmware originals, default profile,
system audio, unrelated crash reporter, push or deployment changed.
