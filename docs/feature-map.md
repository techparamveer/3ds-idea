# 3DS App Completion Map

**Start with the [remaining UI design and shipping map](feature-map/design-to-ship.md).**
It separates missing/placeholder UI from existing designs and verification,
covers every in-scope app/menu/helper, and assigns work to the existing lanes.
Latest user request refocuses **HOME screen 1:1 fidelity**: suspended backing,
compact retained icon, footer states, banners and interaction. Close/switch,
power-on and buttons remain pending; preserve the other existing designs.

Current plan, 3 October 2026. This is the execution map for the **whole in-scope
app**, not just HOME pixel polishing. The coordinator owns this index, dispatch,
integration and native/browser acceptance. Each workstream has its own Codex
chat, Git branch and worktree, recorded in the [workstream registry](feature-map/workstreams.md).
The latest user-supplied repository instructions select GPT-5.6 Sol/high for
new delegated work. Model overrides do not switch the coordinator; service
tier is not exposed or verified by the collaboration tool.

Latest [HOME toolbar News receive lamp](home-toolbar-icon-2026-10-04.md),
`0f7e9c26` from worker `4b58f490`: the 162-pixel 1-row toolbar residual
is empty `N_NewsRcv_00`, not the house. No unique HOME receive-state /
`LncRcvLampSrc_01` frame. Docs and tests only. Coordinator APPROVE.
Not 1:1.

Latest [Settings Other page 2 overlap](settings-other-p2-overlap-2026-10-04.md),
`d574bfc9` from worker `59024aba`: settled page 2 stays **0 / 960**.
The 959-pixel left adjacent-page/arrow overlap has no unique settled
owner (`Special_00` Scroll −276 is transition-only). Painter unchanged.
Coordinator review of the docs/tests commit: APPROVE. Not 1:1.

Earlier [Sound remaining residual](sound-remaining-residual-2026-10-04.md),
`acaf59a9` from worker `ed19cb3a`: empty-entry / guide HUD battery
`C_HudBut_B_Pattern` follows Sound-local seconds parity (odd→5 plug,
even→4). Clock ROI stays 0. Title/Span/birds/volume/guide remain open.
Independent review APPROVE-WITH-NITS. Not recaptured. Not 1:1.

Latest [Settings HudMset previous-seconds](settings-hud-prev-seconds-2026-10-04.md),
`4ebabed9` from worker `02367ba5`: constructor writes sentinel year
`0x76c` to `+dc` and never `+e5`. Seeding previous seconds from `lcdDate`
is not source-justified; sampler unchanged. Pages 3/4 stay **169 / 8**
and **169 / 35**. Independent review APPROVE-WITH-NITS. Not 1:1.

Earlier [Settings Other p3/p4 recapture](settings-other-p34-recapture-2026-10-04.md),
`357a7703`: still **169 / 8** and **169 / 35**. The 169 is Settings
`HudMset` previous-displayed seconds (colon + Bat 4/5), not HOME HUD.
Browser LCDs are byte-identical to `bfe467b`. Lower 8/35 stay sparse
glyph-edge clusters. No runtime change. Not 1:1.

Earlier [HOME HUD charging battery](home-hud-battery-2026-10-04.md),
`98b7e2a0`: HOME/Settings use sourced seconds 4/5; eShop welcome freezes
Bat at ctor frame 4 with a static colon; Zone follows `Charge_anim`.
Independent review APPROVE-WITH-NITS; stale eShop 4/5 scope sentences
corrected. Not native-compared. Not 1:1.

Earlier [Settings main S-01 20-pixel source gap](settings-main-residual-2026-10-04.md),
`74ac999e`: 0 upper / 20 lower remain. Fifteen pixels are Other Settings
t/n/s endpoints just below `*.5`; two are two-line Management **g**; three
are Internet left chrome. No raster guess. Recapture only after a
source-backed general edge rule.

Earlier [Sound HudTime recapture](sound-clock-recapture-2026-10-04.md),
`983ef5ed`: clock ROI `[95,216,194,240]` is 0 over 2/255 on both stills
(`22 27` even / `22:31` odd). First-run whole upper 6,627→6,094 (old 533
clock box gone). Whole LCDs still fail (title/Span/birds, guide/empty
chrome). 12/10 pitch stays a labelled adaptation.

Earlier [HOME zoom-route banner settle](home-zoom-banner-2026-10-04.md),
`dc0e719f`: the 11,868 upper miss was a too-early capture (incoming Settings
while Camera was still the painted primary). After ~500 ms both zoom and
Right-walk freeze to the same 190-pixel upper (`2a2d920e…`). No banner-clock
change.

Earlier [Sound empty-entry HudTime clock](sound-empty-clock-2026-10-04.md),
`8b206f26` / `605f39fe`: type-47 selects `:` on odd seconds and ` ` on even
seconds; group-5 12/10 values stay a labelled fixed-pitch adaptation. The
paint key follows seconds parity only on the empty entry. Not native-compared
yet.

Earlier [HOME 1-row viewport route](home-row-viewport-2026-10-04.md): walking Right
from 1-row origin to Settings (native Activity Log | Download Play |
Settings, both out-of-scope neighbours) gives 190 upper / 12,000 lower, and
5,426 lower with the two portfolio neighbour faces masked. No runtime change.
Remaining lower: edge peeks (portfolio placement), cursor-37 halo, and the
[162-pixel News receive lamp](home-toolbar-icon-2026-10-04.md) (not the house).

Earlier [HOME Settings yaw re-search](home-settings-yaw-research-2026-10-04.md), `dde43424`:
frozen yaw 304 / COMMON 303 / Loop 338 / cursor 37 gives 190 upper pixels
(HUD, title and wallpaper 0). The yaw-310 source-gap notes are superseded.
The lower residual is the 1-row viewport position and neighbour identities
(native Health | StreetPass | Settings; StreetPass is out of scope).

Earlier [HOME Settings cursor loop freeze](home-cursor-loop-frame-2026-10-04.md),
`a1590273`, lets Settings captures freeze `LncCsr_00_Loop`. Frozen search
picks cursor 37 at yaw 310 / COMMON 309 / Loop 338 (2,900 / 12,544). Do not
adopt 37 as a live clock. Remaining residuals are wrench-edge coverage,
title glyphs and labelled portfolio tiles. WalkCoin on this still is
already inside 2/255. Outer-icon `mt_pict` is labelled
[source-gap](home-mtpict-source-gap-2026-10-04.md).

Earlier [HOME Settings mt_pict source gap](home-mtpict-source-gap-2026-10-04.md)
maps COMMON2 / `texture-1.png` as already-bound unlit artwork. No unused
key. Do not invent a sampler, mip or lighting change.

Earlier [HOME WalkCoin fade](home-walkcoin-fade-2026-10-04.md) already
follows elapsed `time * 0.06`. Not a wallpaper/cursor freeze. Do not
adopt frame 97 as a live clock.

Earlier [HOME Settings wrench residual](home-settings-wrench-residual-2026-10-04.md)
splits the 2,900 upper pixels as wrench 792 / `mt_pict` 1,298 / title 810.
No bind/pane/texture/blend change. Do not adopt yaw−1.

Earlier [HOME Settings banner skeletal search](home-settings-banner-skeletal-2026-10-04.md)
picks COMMON 309 at frozen yaw 310 / Loop 338 (2,900 / 13,522). Do not adopt
yaw−1 as a live clock. Remaining upper residuals are wrench/`mt_pict` icons.

Earlier [HOME Settings wallpaper freeze](home-settings-wallpaper-frame-2026-10-04.md),
`27f313d3`, lets Settings captures freeze `BannerBG_Loop`.

Earlier [HOME Settings one-row recapture](home-hud-settings-recapture-2026-10-04.md)
on `c33f1c4e` (runtime `b51f135b`) matches HUD content on the 26 September
still. Whole 1:1 still fails.

Earlier [HOME HUD colon blink](home-hud-colon-2026-10-04.md), `b51f135b`, hides
`T_TimeC_00` on odd seconds to match the native still (fitted adaptation).

Earlier [HOME reference-profile HUD](home-hud-profile-2026-10-04.md), `82ab64c7`,
paints Internet, three signal bars, 42 coins and the orange battery from the
isolated Azahar profile (labelled adaptation). WalkCoin stays time-driven.

Earlier [HOME launch music stop30](home-launch-music-stop-2026-10-04.md), `d8b3e982`,
keeps HOME music through Open's Decide, then applies the traced stop30 ramp
from the fitted preparation update.

Earlier [HOME launch START_EFFECT cue](home-launch-start-effect-2026-10-04.md), `3d90106d`,
delivers the source-traced second launch cue (`0x0100001f`) at launch fade
pose 0 (adaptation).

Earlier [HOME entry banner release](home-entry-banner-release-2026-10-04.md), `458606cb`,
releases the post-boot banner worker on a presented footer frame 10 so the
banner activates with the footer terminal, as on native.

Earlier [HOME close banner return timing](home-close-banner-delay-2026-10-04.md), `bbe557cd`,
requests the returning close banner at footer departure frame 4, so it
activates at Open return 6 as on native.

Earlier [HOME entry footer and HUD delay](home-entry-delay-2026-10-04.md), `5973bcd6`,
staggers post-boot footer (+3) and HUD (+7) SceneIn to the native grid.

Earlier [HOME launch logo wait and C fade](home-launch-logo-wait-2026-10-04.md), `9376f3c9`,
plays native's second SceneOutB pass, keeps B beneath C's fade and holds
C14 before the app (fitted adaptations).

Earlier [HOME launch Open Decide and dwells](home-launch-decide-dwell-2026-10-04.md),
`7a44bff9`, plays the source Open Decide on intact HOME and fits the Decide5
hold and black dwell to Azahar's frame grid (adaptations). A-down vs
A-release vs touch-release and the five-frame pressed length are now
source-identified with no runtime change
([open press](home-open-press-2026-10-04.md)). Open tone/audio remain the
next launch residuals; mobile and reduced were recaptured.

Earlier [HOME launch decide ring](home-launch-ring-2026-10-03.md), `8fada42d`,
draws the source `LncCsrEfct_01` ring that native grows from the selected
icon during the launch fade; a no-visible-change cursor-loop candidate was
reverted. Open pressed/release tone is the next visible launch residual.

Earlier [HOME launch cursor](home-launch-cursor-2026-10-03.md), `4cefc716`, keeps
the selected icon's native brackets beneath the launch fade, as captured.
N065/B000 selected-icon MAE 1.7971 -> 0.7135. Native icon glow during the fade
and Open pressed/release tone are the next visible launch residuals.

Earlier [HOME launch logo order](home-launch-logo-order-2026-10-03.md), `01cc3224`,
fades HOME to source black before the Nintendo logo instead of drawing the
logo over it. The desktop A-input recapture against the frozen 150-PNG native
run shows HOME, then black, then the faint logo, matching native order.
Full 1991 tests, build/typecheck and independent review pass. Native black
dwell, cursor retention, pressed/release timing and whole 1:1 remain open.

Earlier [HOME launch onset](home-launch-onset-2026-10-03.md), `b4077380`,
retains the settled selected banner and native Open footer during launch.
150 native PNGs expose the prior missing-banner/Close-Resume flash;
128 final desktop/mobile/reduced pairs verify the targeted correction.
Optional exact-host eligibility preserves helper and fast-launch paths.
Full 1991 tests, build/typecheck and exact review pass. Logo overlap (since
corrected above), cursor retention, pressed/release timing and 1:1 remained open.

Earlier [launch exit capture](home-launch-exit-2026-10-03.md) closes the missing
exit/reveal evidence interval and identifies Health's absent upper-only reveal.
The source chat's `codex/health-launch-reveal-20261003` now integrates as
`fbb194fa` / `c6c567d7`: decoded upper fade, readiness-safe paired origin and
no same-owner replay. Full1978 tests/build/typecheck and independent review pass;
205 final desktop/late/mobile/reduced pairs visibly verify the correction.
Exact native dispatch, pixels/input/audio and whole1:1 stay open.

Latest runtime [launch publication](home-launch-publication-2026-10-03.md),
`27a85a4a` with test follow-up `60ecf08f`, preserves terminal C14 presentation
before app entry under a host stall. Paired launch failure recovery and target
loading/error escape are guarded by owner/context identity. Normal/reduced
1750/120ms clocks remain adaptations. Full1973 tests, build/typecheck and
independent review pass. Exact native frame epochs, input, timing,
audio and whole pixels remain open; this is not normal-speed pixel improvement.
Desktop/narrow/reduced/stall/context and four power controls complete with mute
and fixture restoration. All24 native/browser paired diagnostics still fail;
10 lower LCDs meet delta2 only. The newer capture above supplies the next visible
Health reveal mismatch; no additional generic launch source-only audit is needed.

Earlier runtime [toolbar motion](home-toolbar-motion-source-2026-10-03.md),
`15630913`, replaces the Notes/Browser/Miiverse front-pose/browser-time
override with hosted visibility, scale, yaw and decoded clip frames. All five
toolbar types share the source-identified generic-primary class. Native
activation/first-frame phase, cadence and displacement remain unproved;
reduced-motion endpoints remain an explicit adaptation. Full1966 tests,
production build, sequential typecheck and independent exact-commit review pass.
The [inspected comparison](home-toolbar-motion-comparison-2026-10-03.md)
shows visible turning on desktop/narrow, with static reduced adaptation.
All120 whole comparisons remain fail at unmatched epochs;213 records and480
metrics independently verify. Eighteen Manual/Open controls and two7-pair rapid
retarget runs pass. Keep exact native motion/input/audio and residual pixels open.

Earlier runtime [Browser Manual/Open](home-browser-manual-footer-2026-10-03.md),
`b3e03f32`, replaces Browser's full Open footer with native-source Manual/Open
and routes Manual to Browser-owned Contents/page0 resources. Other applets,
retained grid identity and existing contact ownership remain unchanged.
Full1964 tests, build/typecheck,10 converter tests and independent review pass.
Other manual pages, Language and Enlarge remain unsupported. Existing fitted
manual placement and whole pixels/input/motion/audio remain open.
Desktop/narrow full manual-return routes and18 browser control pairs pass.
The matched HOME footer improves1391->0 pixels above2/max2 on both sizes;
whole comparisons still fail. Manual Contents761/4521 and page0 2665/2680
upper/lower pixels remain above2. Final sheet and80 metrics are independently
checked; keep those residuals separate from the corrected HOME footer route.

Earlier runtime [toolbar banner ownership](home-toolbar-host-2026-10-03.md),
`6d6e29a2`, adds Notes/Web/Miiverse to the guarded host lifecycle. Their settled
artwork already rendered through fallback; this is not a missing-banner fix.
Its front-pose/browser-time adaptation is superseded by the motion correction
above. Full1958 tests,
build/typecheck and independent135-test review pass. Its captured Browser
Manual/Open defect is addressed above; whole fidelity remains open.

Earlier evidence [folder fixture alignment](home-folder-alignment-2026-10-03.md)
at unchanged `e3b4f061` matches folder density, Health slot and viewport through
real controls. Fresh native idle replaces the missing neutral endpoint.
Panel interior and Health artwork meet delta2 diagnostically; whole pixels,
cursor phase, parent content and retained-capture precision remain unresolved.
The bounded shadow audit found no justified renderer change. Do not repeat
the density mismatch as a geometry defect or guess a shadow correction.

Latest runtime [folder Back re-entry correction](home-folder-back-reentry-2026-10-03.md),
`e3b4f061`, restores pressed Back on same-owner return and closes the folder on
release. Pointer/navigation guards prevent activation transfer. Existing
physical B, grid-drag hover and counted footer transitions are unchanged.
Full1956 tests, build/typecheck and independent118-test review pass. Exact
native caller, cadence/motion/audio and whole HOME fidelity remain open.
Desktop/narrow re-entry closes to root;15 browser control pairs preserve
non-transfer and physical B. Back re-entry ROI improves2002->714 above2,
not a pixel match; all12 after whole-LCD comparisons remain fail.

Earlier runtime [toolbar re-entry correction](home-toolbar-reentry-2026-10-03.md),
`eacae23c`, restores Select and first-touch applet selection after a captured
out-and-back contact. Repeated selected touch activates; Settings stays direct.
Exact-owner guards preserve footer, density and grid behavior. Full1954 tests,
build/typecheck and independent185-test review pass. Native touch caller,
cadence/motion/audio and whole HOME fidelity remain open. Preserve existing designs.
Desktop/mobile re-entry toolbar improves666->0 pixels above2; held/outside
also meet delta2. Release selection is correct but cursor-region pixels still
fail (498/514), and all whole pairs remain fail. Completed21-pair controls
retain density/footer behavior, errors[] and mute.

Earlier diagnostic [Settings banner compositing A/B](home-settings-banner-edge-source-gap-2026-09-26.md#compositing-ab-rejection---3-october-2026)
rejects combining background and primary into one GPU target as a residual fix:
the current fixed-pose body exactly reproduces preserved production, while
native residuals change190->192. Diagnostic runtime was `d53cbe32`; do not repeat this
experiment or infer a timing/whole-scenario pass. No native assets changed.

Earlier runtime [density re-entry correction](home-density-reentry-2026-10-03.md),
`d53cbe32`, restores the native-captured same-button press and release after
an excursion. Original eligibility and layout ownership prevent transfer;
no asset, timing or other app design change. Full 1,949 tests, build and
sequential typecheck pass. Outside-native pixels and whole fidelity remain open.
Desktop/mobile after pairs restore Select and release at five rows; all eight
density ROIs meet delta2, while every whole pair remains fail. Independent143
checks and the completed17-pair browser regression replay pass.

Earlier [footer re-entry correction](home-footer-reentry-2026-10-03.md),
`632646d2`, fixes the fresh CTM-captured Manual -> Open -> Manual -> release
mismatch. The original button regains held feedback and opens on release;
cross-button/outside/cancelled contacts remain blocked. Full1944 tests and
build/sequential typecheck pass; independent146-test review has no findings.
Other app designs and native assets are unchanged; exact cadence/audio and
whole HOME1:1 remain open.

Earlier [stationary density-hold replay](home-density-hold-2026-10-03.md)
does not reproduce the old apparent repeat: native two-second holds and browser
release endpoints both change6->5->6 once. No runtime change or speculative
repeat timer is warranted. Density held native pixels/activation edge remain
open; footer out-and-back evidence is now captured in the correction above.

Latest runtime [density boundary correction](home-density-boundary-2026-10-03.md),
`f85e1396`, aligns native-source pressed feedback with the existing release
action at x293. Full1940 tests/build/typecheck and independent103-test review
pass. Native cross-footer cancellations and density release are observed;
native held-frame/input-cadence/audio and whole1:1 remain open. Preserve the
other app designs and continue named HOME visual/input residuals.

Earlier [entry recovery](home-entry-recovery-2026-10-03.md), `650daa79`,
corrects the captured HUD-before-banner restoration defect: normal HUD waits
for an identity-validated visible banner, then plays its remaining source
clip on the existing clock. Normal footer/banner/HUD order, reduced endpoints and
portfolio startup policy are retained. Full1937 tests/build/typecheck and
independent review pass; production recovery is browser-inspected. This is
host-recovery evidence, not a native-equivalent scenario or whole1:1 pass.
Continue remaining HOME banner pixel and physical/touch interaction comparisons.

Earlier [entry ordering](home-entry-order-2026-10-03.md), through `5bd0f99a`,
releases the prepared primary only after the source footer terminal has been
visibly presented. Normal production first banner now has settled footer and
absent HUD, matching observed sequence order. Exact epochs/cadence, banner
pixels and whole-scenario/input/audio acceptance remain open. The publication
dependency is a capture-supported adaptation; preserve it and the restart fix.
Its captured context-recovery failure (HUD75 before banner78) is corrected
above; normal/stall evidence alone did not clear it.

Earlier [banner restart correction](home-entry-banner-2026-10-03.md), `e069925c`,
removes the stale selected primary across Off/On. Fresh primary scope and
existing loading/entrance now replay; global clock/background remain intact.
Full1926 tests, build/typecheck and21 live functional controls pass. Its normal
early-banner defect is corrected above; native epochs and all whole scenarios
remain fail. Do not repeat the reset.

Earlier [HOME entry staging](home-entry-staging-2026-10-03.md), `a655e4ed`,
plays the decoded footer and delayed HUD SceneIn clips after boot instead of
showing both settled immediately. Boot-relative ownership and live preemption
are tested; native epoch/cadence and reduced endpoints remain adaptations.
Preserve this change. Next visible entry gap is the selected Camera banner's
early appearance relative to native footer entry; whole HOME/input/motion/audio
remain fail. Do not repeat HUD/footer source extraction or redesign other apps.

Earlier [power-on staging and publication](home-power-on-staging-2026-10-03.md),
`ce493657` / `ee38f862`, hides premature HUD/footer during paired reveal and
holds a stalled boot until its native terminal pair is visibly rendered.
Through `cbfaa053`, unavailable boot resources expose Retry-only host recovery
with matching accessible wording. Fixed pose10 HUD3747 ->6 and footer8598 ->0
above delta2 support the staging correction, not whole-scenario acceptance.
Native startup ordering is observed, but exact entry clips, timing/input/audio
and whole pixels remain fail. Preserve the corrected base layers and banner
ownership; do not repeat this staging fix or call it physical boot acceptance.

Earlier [Camera confirmation upper-mask correction](home-camera-close-upper-mask-2026-10-03.md),
runtime `f0143f1f`, removes the extra upper dimming for Camera Close only.
Switch remains lower-only; other ordinary titles retain their existing policy,
and post-OK closing is unchanged. Full 1,903 tests, build and typecheck pass.
The per-title selection is capture-supported, not a traced native caller.
Whole scenarios remain fail; Camera content and exact input/motion/audio stay open.

Earlier [Camera capture boundary](home-camera-capture-boundary-2026-10-03.md)
at unchanged `0e59c1a0` finds the black finder already in the foreground app,
with its graphics retained by HOME. Native's different static-image feed
prevents assigning the whole upper residual to the HOME compositor. No backing
patch or pass follows. Next backing comparison needs matched read-only content
or deterministic Health; do not repeat this source audit or fit HOME shading
to unrelated app pixels. Continue native lifecycle reveal/power-on evidence.

Earlier [Camera Manual/footer correction](home-camera-manual-footer-2026-10-03.md),
through `0e59c1a0`, restores Close/Manual/Resume and the real Camera English
index, preserves the suspended owner, and retains decoded Decide tone through
ordinary close. Lower close-dialog residual improves3,841 ->2,120 ->82 above
delta2; footer3,776 ->2,055 ->17. Close and Manual meet maximum2; Resume retains
17/max27. Full1,902 tests, Python9, typecheck/build pass; independent reviews
find no actionable issue. Whole scenarios remain fail, with upper content,
exact input/motion/audio, Manual pages and index geometry adaptations open.
Preserve this visible correction and continue lifecycle timing/power-on; do
not schedule the missing middle button again.

Earlier [close warning correction](home-close-warning-2026-10-03.md),
`8634178b` then `03d01e2b`, implements the source 85% size control and a
font-derived baseline adaptation only for HOME close/switch body text.
Body/modal residual improves 5,168 -> 1,611 -> 7 above delta 2; final seven
pixels occupy one glyph-raster column at x188/y163..169, maximum 86. Icon and
no-warning switch controls remain unchanged. Both runtimes pass 1,893 tests,
typecheck/build; independent 161-test review finds no issues. Whole scenarios
still fail. Its captured missing Manual footer is corrected above; retain the
text-edge, upper, input/motion/audio and adaptation gaps.

Earlier [Camera close header](home-camera-close-dialog-2026-10-03.md),
`10be5b69`, restores the source single-icon header and body placement. Desktop
icon residual improves 2,278 -> 0 above delta 2 (maximum 1); modal 9,584 ->
5,168. Full 1,888 tests and production build pass; independent 123-test review
has no findings. Warning typography and Camera's middle Manual footer are
refined above. Native epochs/input/motion/audio and whole
scenarios remain unaccepted; other title headers are unverified adaptations.

Earlier [switch backing correction](home-switch-backing-2026-10-03.md),
`e231163d`, preserves decoded dark suspended backing while switching. Upper
terminal residual improves83,889 ->16,700 pixels above delta2; lower unchanged
at91. Full1884 tests/typecheck/build/shader pass, independent177-test review
has no findings. Native epochs, input/motion/audio and whole1:1 remain open.
Its captured Camera ordinary-close header defect is addressed above.

Earlier [switch closing correction](home-switch-closing-2026-10-03.md),
`65d75466`, restores the missing decoded lower closing dialog/mask after
Health-to-Camera confirmation, hides the footer, and preserves the compact
suspended Health window. Switch still skips ordinary-close exit/return stages.
Lower terminal residual improves76,304 ->91 pixels above delta2; full1884
tests/typecheck/build pass. Source timing and whole-scenario fidelity remain
unaccepted. The missing dark retained upper backing is corrected above;
preserve these states and owner guards.

Earlier [settled Open footer investigation](home-open-footer-residual-2026-10-03.md)
confirms54 edge pixels above delta2/max5 at unchanged `ea6265de`. A retained
capture candidate is rejected because maximum error and MAE worsen; no runtime
change. Stop this palette/filter path pending discriminating capture evidence,
and take the next captured HOME/lifecycle defect. Whole scenarios still fail.

Earlier [Power re-entry comparison](home-power-reentry-2026-10-03.md) confirms
the existing continuous-contact behavior at unchanged runtime `ea6265de`:
native clears held feedback outside, restores it inside, and shuts down on
inside release. Four primary unmasked two-LCD pairs meet maximum delta2;
held/re-entered button ROImax1. No runtime change was indicated. Exact native/browser epochs,
motion/audio, physical backlight and cold boot remain open. Preserve this
verified ownership behavior; do not repeat the same gesture audit as missing.

Earlier [shutdown publication](home-shutdown-publication-2026-10-03.md),
`19376463` + `ea6265de`, closes a captured host-stall endpoint skip. A guarded
native-pair/render acknowledgment precedes off; forced publication spans an
animation callback boundary and suspension/context changes invalidate it.
Full1882 tests/typecheck/build pass; native epochs, motion/audio, backlight
and restart timing remain open. Preserve the source poses and earlier Power
input correction; next lifecycle comparison still needs
exact cold-boot/input timing, not another fitted shutdown duration.

Earlier [Power input](home-power-input-2026-10-03.md), `b0814dd4`, fixes
outside-origin release activation and missing source held-button feedback.
Fresh native controls confirm both cross-boundary releases stay in Power;
held ROI6708->0 pixels above delta2 and five desktop endpoint pairs reach
maximum2, including exact black shutdown. Full1874 tests/typecheck/build and
four browser modes pass implementation checks. Continuous native re-entry is
now compared above; exact input/motion/audio, physical backlight and restart timing remain open.
Preserve settled Power and completed close/return; next lifecycle acceptance
targets those specific gaps, not another reconstruction of the same screen.

Earlier [shutdown fade](home-shutdown-fade-2026-10-03.md), `cdc2926f`, uses
delivered paired sleep SceneOut after Decide, replacing the wrong generic
fade. Browser 1200/120 ms timing remains an adaptation. Full 1872 tests,
typecheck/build and four production modes pass implementation checks. Native
partial fade is captured; exact epochs/input/audio, physical off/backlight and
terminal publication under stalls remain open. Continue those lifecycle/button
gaps; preserve the previously implemented close/return and settled Power UI.

Earlier [banner return](home-banner-return-2026-10-03.md), `78fa7325` + `c01e1219`,
requests selected content at guarded footer departure0 while retaining all
readiness gates. Clean desktop/reduced show growth from return2 and mobile
from return4, before Open completes. Full1869 tests/typecheck/build pass;
load-sensitive initial desktop is preserved, not hidden. Exact native epochs,
input/motion/audio and whole scenarios remain fail/open.
Its remaining target is measured relative banner/footer pose and load variability,
without treating sparse first-captured native onset as an exact scheduling
boundary; power/buttons acceptance also remains open.

Earlier [Open return](home-open-return-2026-10-03.md), `03500c6c` + `65b758af`
with publication fix `0172842b`, adds ChangeUp0..8 and selected-banner
reacquisition. Owner retirement precedes return; quarantine and paired endpoint
publication continue through8. Reduced replay exposed and then verified the
fix for synchronous cleanup skipping return0. Full1867 tests/typecheck/build
pass. Native banner activation/growth, intermediate alpha/epochs and exact
input/motion/audio remain open; whole scenarios still fail. Preserve this
implementation and target those measured gaps, then remaining power/buttons.

Earlier [compact footer correction](home-compact-footer-2026-10-02.md) at
`c44e88d7` + `be54ea30` selects ChangeDw0..6 and black-left Decide5 after
dialog exit. Native25 Close2590->37 mismatched pixels, Resume unchanged45;
whole scenarios still fail. Open return/banner reacquisition, intermediate
alpha/epochs and input/motion/audio remain open. Fresh46 native frames and
desktop/mobile/reduced actual-input replays are recorded in the progress note.

Earlier [closing entry and post-modal footer](home-postmodal-footer-2026-10-02.md),
`54152a33` + `0bb044d5` + `062a486b`, adds decoded entry FadeIn and close-only SceneOut0..14
after dialog exit. Owner retirement waits for the footer terminal pair;
switch remains unchanged. Full1,858 tests/typecheck/build pass; independent
138-test review finds no actionable regression. Donor/epoch binding remains
capture-fitted. The first comparison's Resume dimming regression is corrected;
intermediate footer geometry/alpha still differs. Next: native Close tone, Open return/banner reacquisition,
exact timing/input/audio, then power-on/buttons. Whole scenarios remain fail.

Earlier [close exit icon](home-close-icon-exit-2026-10-02.md), `7d0b4a9f`,
selects source DisAppear20 only during close dialog exit, preserving owner,
switch and earlier close behavior.39 fresh native own-PNGs now capture actual
entry/exit and return; earlier endpoint-only limitations are superseded.
Full1856 tests/typecheck/build pass; test follow-up `fcb05a71` covers paired
failure/recovery. The later entry/footer implementation above supersedes those
two missing stages; exact timing/input/audio and whole1:1 remain open.

Earlier [folder pulse diagnostic](home-suspended-highlight-2026-10-02.md#folder-pulse-diagnostic---2-october-2026)
at unchanged `a40d597e` explains the full-icon tint residual through observed
animation phase: fixed-ROI3,136/max34 becomes8/max4 at the best live pose.
No palette or runtime change.218 paints cover106/120 modulo residues; native
epoch/cadence remain unknown and the result still fails strict tolerance.
Do not repeat a tint fit or the same best-pose sweep; target native activation
timing or another captured interaction. Whole scenarios remain unaccepted.

Earlier [suspended folder software Close](home-folder-software-close-2026-10-02.md),
`a40d597e`, corrects both the white folder-action resource and its wrong Back
route. Selected suspended Health now uses native black X Close, runs the
existing close transition, and returns to the same folder/child with Open.
Full 1,853 tests, typecheck/build pass. Fresh native idle/suspended endpoint
captures are available; exit capture failed, so exact motion/timing and whole
scenario acceptance remain open. No guessed fade or renderer change.
Same-native footer mismatch improves 2,895 -> 73 pixels above delta 2;
desktop/mobile/reduced close and fixture-restoration routes pass.

Earlier [continuous folder re-entry](home-folder-reentry-2026-10-02.md),
`d58bc92a` / `95989614` / `7727fa35`, keeps the native pickup/stroke across
root-folder hover, preserves observed title suppression, and handles Back out
of a visited folder with immutable source ownership. Fresh native comparison
reduces re-entry lower mismatch 37,137 -> 5,284 pixels above delta 2.
Desktop phase-paced/mobile/reduced eight-pair runs and old seven-pair Back
regression pass; full 1,848 tests/typecheck/build pass. Whole pixel states,
native cadence/motion/audio and existing source/sampling gaps still fail/open.
Next: a new captured interaction or unfinished lifecycle transition; preserve
this correction and do not repeat the bounded small-icon/footer source audits.

Earlier [held stock artwork](home-held-title-artwork-2026-10-02.md),
`e911e475`, retains the authored material binding from `edc0090e`. Folder-held
art now reaches static delta-2 tolerance; root-held art improves but remains
236 pixels above delta 2, maximum 54. The direct-LCD experiment regressed root
art and was withdrawn. Full 1,842 tests/typecheck/build/shader pass. Next are
the unresolved small held artwork source/sampling, shell edge, and footer/gutter
raster, without guessed colours or another unmeasured transport change. The
bounded fractional-Y sweep did not explain root width; retain its current
anchor instead of repeating an anchor fit.

Bounded small-icon follow-up: the genuine Health SMDH24 plane matches native
ink bounds but its offline substitution worsens the above-delta2 count
236 -> 253 (maximum improves54 ->31). No asset/runtime selection is shipped.
Treat root-held source selection as a recorded gap and its pixels as fail;
no further source-only iteration without discriminating native evidence.

The bounded [held-footer check](home-folder-held-dimming-2026-10-02.md#held-footer-residual-check)
finds no new dimming-material error. Gutter/toolbar change residuals meet delta2;
the held footer still fails at1,576 / maximum4, consistent with the existing
retained-capture precision gap. No guessed raster correction is integrated.
Next: new matched root-to-folder hover or edge-continuation evidence, not a
repeat small-icon, footer or transport source audit.

Earlier [folder-held backing](home-folder-held-dimming-2026-10-02.md),
`4e18d7c9`, selects the decoded native pickup dimming endpoint before the
folder foreground. Full1,840 tests/typecheck/build and three production
interaction variants pass. A fresh CTM native lower capture repeats exactly;
controller timing remains adapted. Toolbar now reaches delta-2 static tolerance
(0 mismatching pixels, maximum 2); footer improves to 1,576 pixels above delta
2, maximum 4. Whole lower still differs at 6,696 pixels; scenario remains fail.
Keep residual backing raster, pickup
artwork/height, other anchors and exact motion/input/audio open.

Earlier [held pickup comparison](home-held-pickup-2026-10-02.md) obtains genuine
native held PNGs through CTM playback. `652520ee` corrects fitted lift and held
tile size after Back; `a751722b` fixes a counted-clock boundary missed by the
initial successful browser replay. `bcc3dcb6` refines the measured root lift;
1,836 tests/build/typecheck and all three production interaction variants pass.
Native resources remain unchanged. Then-captured
defects: folder toolbar dimming and composited artwork color; other
density anchors and exact timing/audio remain open. Visibility follow-up
`eeea99e7` now hides held footers and the root-held upper title through an
explicit capture-fitted policy; 1,839 tests/build/typecheck pass. See the
linked evidence for production comparison. Do not repeat the resolved size
diagnosis or claim1:1.
Production desktop/mobile/reduced and the nominal phase replay pass. Reused
native CTM references show root footer at delta2 tolerance (max1), while the
folder's newly exposed band remained too bright (max30). The backing follow-up
above addresses that source selection; whole LCDs still fail.

Earlier [folder drag-out](home-folder-drag-out-2026-10-02.md), `dd73c4ee` with
production ownership/scope fixes `35846d2e` and `1089c78c`,
fixes a fresh native/browser semantic mismatch: dragging a folder child over
Back now reaches root HOME instead of remaining in the folder. Desktop/mobile/
reduced-motion pointer replays verify the occupied-root swap, item conservation,
reverse restoration and outside-LCD cancellation. Final full1,832 tests and
typecheck/build pass. The 500ms deadline remains an explicit adaptation;
whole-LCD, native held animation, exact cadence and audio remain fail/open.
Next: matched root-to-folder/edge continuation or the specific backing source
gap, not another audit of the fixed Back-exit endpoint.

Earlier [pickup endpoint comparison](home-pickup-endpoints-2026-10-02.md) at
unchanged `28083c79` verifies native folder child2 ->1 ->2 placement against
desktop/mobile/reduced. Selected artwork and vacated blank cores meet delta2;
held animation/timing remain unverified. Divider and footer-edge shade remain
repeatable failures, with HOME capture format/raster precision unproved. No
speculative runtime correction. Next: unverified held/drop/hover/edge scenarios
or a source-supported backing correction, not another settled-endpoint audit.

Earlier [Create Folder footer text](home-footer-text-2026-10-02.md), `f031cca9`,
reduces the fixed whole-footer residual19 ->0 above delta2/max2 against three
preserved native captures. Desktop/mobile/reduced agree; four non-target
footer ROIs are byte-identical. The coverage fit is a labelled adaptation in
all Create Folder poses, with settled-only native proof. Browser hold/cancel
passes; full1,827 tests/build/typecheck pass. Whole HOME, remaining text/shade,
cursor/banner/HUD epochs and exact motion/input/audio stay open. Next: capture
and fix the next unmatched control/cursor state, not another resolved footer
backing or page-boundary audit. Preserve other designs.

Earlier [page boundary](home-page-boundary-2026-10-02.md), `ddea6d53`, fixes
the persistent right arrow, open-ended tray and keyboard/gesture escape beyond
the captured root slot59. Source geometry/input use60 exposed slots while
preserving300 stored slots through labelled high-slot compatibility. Six native
right-edge regions now have zero pixels above delta2, maximum2; the settled
footer edge also meets tolerance. Desktop/mobile/reduced endpoint sequences
match59 ->53 ->59 ->59. Final1,827 tests/build/typecheck pass. The exposed
first-root footer ROI also improves41 ->0 above2/max1. A suspected missing
folder arrow was a visual misread, disproved by exact regional bytes; candidate
47915d8b is reverted by e83d55de. Runtime remains equivalent to ddea6d53.
Whole LCDs, exact
input/motion/audio, native growth rules, population/epochs and shade/text remain
open. Next: matched remaining footer/text or cursor states, not another arrow
or tray-boundary audit. Preserve other designs.

Earlier [footer backing](home-footer-backing-2026-10-02.md), `8e2a29a1`,
restores the decoded native stripe band beneath the separate footer. Fixed raw
native/browser ROI improves from 8,960 to41 pixels above delta2 without a mask
or fit. Keep the remaining top-right edge, settled footer shade and whole-screen
differences open. Full1,820 tests/build/typecheck pass; desktop/mobile pointer
replays and seven unchanged stock LCD targets support the change. The slowed
native capture establishes pixels only, not cadence. Preserve other designs.
Folder Settings backing also improves6,814 ->31 above2 against existing native
own-PNG controls. The subsequent boundary correction above resolves its settled
top-right edge; footer text/shade remains open. Do not reopen the resolved
full-base composition decision.

Earlier [folder footer return](home-folder-footer-return-2026-10-02.md),
9371c576, restores staged Settings/Open entry after root selection returns.
Before, the first root paint already contained the settled footer; after,
production motion samples show SceneIn0,3,6,8,11,14,15. Native desktop video
supports the ordering, not exact raw-pixel timing. The clock binding remains a
labelled adaptation, and held Back pixels are obscured by a recorder overlay.
Full1818 tests/typecheck/build pass. Exposed footer backing, native cadence,
press pixels and audio remain open; do not repeat the already-fixed instant
footer defect. Other user-designed screens remain unchanged.

Earlier folder-gutter replay corrects the defect diagnosis: the browser retained
a root viewport shifted28px from native. Actual left paging to root-zero removes
the exposed icon strip with unchanged runtime `5b82c896`. Do not mask or hide
retained root content. Five fresh native captures and two eleven-pair production
runs support this distinction; exact timing/audio and whole-screen fidelity
remain open. Next: matched pressed/fade states, preserving delivered designs.
The aligned gutter retains816 pixels above delta2, maximum4; keep that backing
shade residual open. [Audit](home-folder-gutter-2026-10-02.md) and
[comparison](workstream-handoffs/home-folder-gutter-compare.md).

Earlier [open-folder footer](home-open-folder-footer-2026-10-02.md) at
`5b82c896` replaces occupied Close/Open with native full-width Open. Fresh
native left-footer touch and production desktop/mobile routes launch Health;
vacant children remain button-free and inert. Full1,813 tests/typecheck/build
pass, with static stock regression LCDs unchanged. Test follow-up21079a0d
retains true Back/B close coverage. [Comparison](workstream-handoffs/home-open-folder-footer-compare.md).
Footer shade, suspended-folder variants and exact input/motion/audio remain
open. The root-icon gutter attribution is superseded by the root-zero replay
above. Next is captured pressed/fade states, not another footer audit.

Earlier [populated-folder Delete notice](home-populated-folder-2026-10-02.md)
at `2ee79ae3`/`43b8be55` replaces the authored confirmation with the captured
native one-button message, retaining the upper folder banner and contents.
Two native touch-OK runs return to root; production desktop/mobile OK, physical
A, cross-target rejection, empty-delete and reload checks pass. B/HOME recovery
remains an adaptation. Full 1,808 tests/typecheck/build pass. A visible leaked
HOME footer was corrected after the first after capture. [Comparison](workstream-handoffs/home-populated-folder-compare.md).
Final modal retains98 corner pixels above delta2, max8; full pair49,352/12,601
remains fail, with unexplained backing shade and unmatched root/upper state.
Whole scenarios and exact motion/input/audio remain open.
Next: captured pressed/fade states or the open-folder root-icon gutter and
incorrect Close/Open footer (native Open-only); preserve
the delivered create/open/close design and excluded Rename boundary.

Earlier [Create Folder footer audit](home-create-folder-footer-2026-10-02.md)
at `8272c0b9`/`fd0e4cf9` adds a source-selection regression, not new pixels.
The stable 799-pixel residual splits spatially into 780 edge-shaped and 19
ink-intersecting pixels; causal layer ownership remains unproved. No palette
or glyph fit was introduced. Full 1,802 tests/typecheck/build pass; new native
and production controls are in the [comparison](workstream-handoffs/home-create-folder-footer-compare.md).
Do not repeat the source-only audit without new runtime evidence. Runtime
stays `2f074d64`; next work returns to unresolved folder interaction/press states.

Earlier [empty-folder Delete correction](home-folder-delete-native-2026-10-02.md)
at `2f074d64` removes the incorrect confirmation: two fresh native runs go
directly from Folder Settings Delete to root HOME/Create Folder. Desktop touch,
physical A, reload persistence and mobile touch pass in production, muted and
without page errors. Full 1,801 tests/typecheck/build and static stock regressions
pass. Populated-folder deletion remains an explicitly non-native adapter;
failed native population attempts establish no behavior. Exact motion/input/
audio and whole-screen fidelity remain open. [Comparison](workstream-handoffs/home-folder-delete-compare.md).
Post-delete Create Folder footer retains 799 pixels above delta 2 in both
native repeats (maximum 66); it is a bounded visible follow-up, separate from
population/scroll and cursor/banner epoch differences.

Earlier [Folder Settings replacement](home-folder-settings-native-2026-10-02.md)
at `79e77f58` removes the captured generic modal, restores the folder banner
and delivers source-derived touch Cancel with loading/error escape. Fixed
modal mismatch improves 55,945 -> 107 pixels above delta 2; header/Delete row
meet static tolerance, but Rename/corners, outside backing and upper epochs
remain. Full 1,800 tests/typecheck/build, desktop/mobile Cancel routes and
static stock regressions pass. [Comparison](workstream-handoffs/home-folder-interaction-compare.md).
Whole scenarios remain fail; pressed/fade states, populated-folder Delete and
opened-folder root-icon gutter are the next bounded folder gaps. Preserve
existing creation/open/close designs and the excluded text-entry boundary.

Earlier [cursor replay](home-cursor-replay-2026-10-02.md) establishes 60 phases
at each of six densities. The LCD-sampling candidate `68c69bcf` is rejected;
`b8773a90` restores the prior transport. Small best-fit corner improvements do
not clear the four-row full-ROI regression or unexplained outside-ROI changes.
No shipped visual fix, native epoch, matrix or whole-scenario pass follows.
Production input/responsive and static stock-app regression checks pass.
Next: native-visible pressed/toolbar/folder interactions, preserving the
existing source graphics and documented adaptations. See the
[comparison handoff](workstream-handoffs/home-cursor-compare.md).

Latest accepted [resize correction](home-touch-projection-2026-10-02.md) at `a751b2dd`
resolves the previous mobile density diagnosis: the QA projection retained a
desktop point outside the resized viewport; actual raycast input already worked.
Production resize/same-aspect resize, desktop all-density/boundary controls and
Notes desktop/mobile touch/HOME checks pass. Full 1793 tests/typecheck/build/
shader pass. Fresh native comparison extends toolbar/density-control static
pixel tolerance to all six densities, with unchanged before/after controls.
Whole scenarios still fail; native longer-press repeat, exact timing, motion,
audio and remaining visual gaps stay open. No app redesign or new native asset.
The [density comparison](workstream-handoffs/home-density-compare.md) identifies
selected cursor phase as the next bounded replay target; establish matched
frames before any geometry or timing correction.

Latest [ordinary icon correction](home-icon-corners-2026-10-02.md) at
`3bb6c6f3` uses the firmware's authored icon mask. Four production-after/native
pairs improve the Camera fringe 23 -> 0 pixels above delta 2, maximum 2;
the artwork edge improves 1 -> 0. Notes, unselected plate and footer controls
are unchanged; selected cursor epochs remain unmatched.
Full 1789 tests/typecheck/build/shader pass. Six desktop densities, Notes
desktop/mobile touch and HOME return work; static Health/Settings and both
Power origins remain exact before/after. Mobile density increase fails both
before and after at this historical checkpoint; the later resize diagnosis
above supersedes that open-target label. Whole scenarios remain
fail for the remaining visual, input, motion and audio gaps. See the
[comparison](workstream-handoffs/home-icon-corners-compare.md).

The [ordinary Camera plate baseline](workstream-handoffs/home-ordinary-plate-compare.md)
at `ee133aa8` repeats 963 high-delta plate pixels across three fresh browser
and preserved native pairs: shadow 415, rim/body 548. Its separate icon defects
are resolved by the later correction above. The bounded
[source replay](home-ordinary-plate-2026-10-02.md) at `476f05be` worsened the
plate mismatch and was rejected; target orientation/clear/precision remain a
source gap. No plate or scenario pass is inferred. GUI testing may use the full
Mac, with 3DS audio muted.

Latest [Notes toolbar comparison](workstream-handoffs/home-notes-toolbar-compare.md)
at runtime `79597372` resolves the captured H-09 glyph residual: 201 -> 0
pixels above delta 2, maximum 25 -> 1, across four native/production pairs.
The missing-UV rule is a narrowly guarded, labelled sampling adaptation, not
proven native initialization. Full 1782 tests/typecheck/build/shader pass;
desktop/mobile Notes touch and HOME return pass. Power and static Settings/
Health regression LCDs remain unchanged. Whole HOME scenarios still fail for
remaining visual gaps, population, epochs and exact input/motion/audio.

Latest runtime [Power footer correction](home-power-footer-raster-2026-10-02.md) at
`d4c96f26` resolves the last three high-delta footer pixels. Both HOME/app
Power routes now have zero pixels above delta 2 on both LCDs, maximum 2,
empty masks. Lower before/after and app repeat are byte-identical. Full 1780
tests/typecheck/build pass; desktop/mobile controls and 65 browser motion pairs
inspected. L-01 remains partial for exact input, native motion/shutdown/audio
and earlier app-output variance; no whole-scenario or matrix pass. Next work
returns to captured HOME interaction/visual defects, not this resolved footer.

Earlier [Power block-centering correction](home-power-centering-2026-10-02.md)
at `57c4c824` uses the decrypted multiline writer rule. Upper mismatch falls
4334 -> 3 on both origins; list 4331 -> 0, lower remains 0 above 2 and exact
before/after. App-only repeat is identical. Full 1778 tests/typecheck/build
pass; desktop/mobile controls and 64 browser motion pairs inspected. L-01
remains partial: three footer pixels, native input/motion/shutdown/audio and
prior upper variance remain open. No whole-scenario or matrix pass.

Earlier [Power text raster correction](home-power-raster-2026-10-02.md) at
`766888a2` resolves lower-label668 ->0 pixels above2, maximum2, both origins.
The ineffective upper experiment was removed. HOME upper4334 and app upper6512
remain; the app variance repeats even with the lower sampler disabled.
The restored-build app repeat returns to4334; upper stability remains open.
Full1777 tests/typecheck/build pass, final controls and73 browser motion pairs inspected.
L-01 remains partial: upper text, exact input/motion/shutdown and muted audio
are open. Whole scenarios still fail; no matrix or1:1 pass.

Earlier [Power menu correction](home-power-menu-2026-10-02.md) at `82d26a8b`
uses ROM-marked20% spacer advances and the sole native touch boundary. Full1776
tests/typecheck/build pass; native/browser settled comparison improves upper
7848 ->4334 pixels above2, lower668 unchanged. Physical Power/HOME and inert
footer pass on desktop/mobile. L-01 remains partial: text raster, phase timing,
input and muted audio are open; whole scenarios fail and matrix stays unchanged.

Earlier [balloon density correction](home-balloon-density-2026-10-02.md) at
`5de1f381` removes the native-inconsistent two-row Settings title balloon and
preserves one-row behavior. Final1771 tests and runtime typecheck/build pass; production
before/after and fresh native own-PNGs inspected. Same-anchor Health balloon
needs no offset. H-04/H-12 remain partial: whole LCDs/input/motion/audio still
unmatched, no matrix pass. Worktrees and muted Sidecar discipline preserved.

Earlier [closing exit delivery](home-closing-fade-2026-10-02.md) at `229e864c`
uses the ROM-selected dialog donor and mask FadeOut00 clips. Two worker chats/
trees and one clock subagent delivered; owner retention, readiness recovery and
resume publication are guarded. Full1765 tests/typecheck/build pass; seven
production routes/99 pairs inspected. Preserved native intermediate comparison
improves lower mean RGB51.984 ->18.735, but best-pose selection is diagnostic,
not epoch matching. H-10/H-12/L-04 remain partial. Exact timing/input/audio and
HOME residuals remain; no matrix update or whole-scenario pass.

Earlier [upper-close delivery](home-upper-close-2026-10-02.md) at `1fbfd6be`
adds fixed-bounds panel departure and source light camera hints. Two separate
worker trees/chats supplied a source audit and corrected edge fit; the panel
alpha is explicitly adapted, not a traced native writer. Full1755 tests,
typecheck/build pass; seven production routes/95 pairs inspected. Seven fresh
100%-speed native PNGs; upper mean RGB difference51.596 ->4.978, whole pair
still fails. H-10/H-12/L-04 remain partial: closing-dialog parent fade-out,
matched epochs/input/audio and existing HOME residuals are next. Matrix unchanged.

Earlier [software-closing delivery](home-software-closing-2026-10-02.md) through
`cf38daf8` adds the source lower closing window/text/scrim and guarded recovery.
Held Shift now reliably returns native Health to HOME;37 own-PNGs informed the
correction. Two separate chats/worktrees used; unsupported upper/footer
departure candidates remain unwired. Full1747 tests/typecheck/build pass;
seven production routes/98 pairs inspected. Local lower dialog interior has
zero pixels above2, but whole comparisons fail. H-10/H-12/L-04 remain partial:
upper fixed-bounds departure, parent fade, exact cadence and audio are next.
Private matrix unchanged. See the registry for current worker status.

Earlier [button/border delivery](home-buttons-border-2026-10-02.md) through
`25d4f367` fixes footer touch transfers and the close-start backing disappearance.
Two separate worktrees/chats delivered; full1738 tests/typecheck/build/shader
pass, final pointer routes and seven close flows inspected. Native Health launch
recovered, HOME return did not. Retained close-start upper diagnostic improves
74145 ->10769 pixels above2; all whole scenarios still fail. H-10/H-12/L-06/L-07
remain partial: panel/footer departure, native cadence/audio and residuals open.
The sampler slice has a visible correction; next is departure motion, not
another binding audit. Worktrees preserved, workers idle, muted preview updated.

Earlier [power-reveal delivery](home-power-reveal-2026-10-02.md) through
`2c992dd7` fixes endpoint eligibility, reduced-motion fade painting and actual
render acknowledgment. Full 1725 tests/typecheck/build pass; four power routes
and seven close regressions are browser-inspected. Native startup observation
failed, so L-01 remains partial, with adapted timing and no native motion pass.
Parallel close-mask audit `6066c315` identifies a sampler conflict but leaves
the unproven native binding unchanged. Its next gate is native frame/descriptor
evidence, not another source-only audit. Both new worktrees are preserved.

The [close-motion delivery](home-close-motion-2026-10-02.md) through `f8334ec2`
integrates two dedicated worktrees plus the pure controller. Retained-owner
AppQuit, terminal GPU publication, sleep pause and input quarantine are live.
Full1721 tests/typecheck/build/shader pass; seven browser flows and93 pairs
inspected. Both private Azahar retries failed launch input; retained before/after
diagnostics still fail. L-06/L-07/H-12 remain partial: abrupt initial mask backing,
window/footer departure and native timing are unresolved. Workers idle, trees
preserved. Next visible gaps remain close departure, power-on and buttons.

Earlier [suspended highlight and pulse](home-suspended-highlight-2026-10-02.md) at
`7b243793`/`dc6d19f7`/`47845dc5` adds source lower tint, hidden modal footer and
paired owner-scoped animation. Two new dedicated worktrees delivered commits;
two independent muted Azahar copies supplied Sidecar references. Full1695 tests
pass,28 production pairs inspected; all whole native pairs still fail. H-12
remains partial: timing/HUD/background shades need work. Reviewed close
controller `43b18bf0` is not yet runtime-integrated; that is the next visible
delivery before power-on. Earlier checkpoints below describe their own state.

The [suspended HOME backdrop](home-suspended-background-2026-10-02.md) at
`fc6e5983` now uses the source curved capture, mask and AppPause material.
Nine browser pairs and four fresh native captures show substantial improvement:
expanded upper 95,276 -> 12,137 differing pixels, unoccluded strip 8,544 -> 46.
H-12 remains partial: binding/padding/sampler/settled pose are fitted adaptations;
sleep pulse, lower icon tint, modal footer, HUD and exact motion remain open.
No whole scenario passes.

The [compact HOME window](home-compact-window-2026-10-02.md) at `17eebbb0`
restores the source retained icon/HOME glyph beside another selected title.
Four fresh native captures and nine browser pairs verify this bounded delivery,
not exact tint/pulse/motion. H-12 remains partial; next is suspended dark
backing/warp and sleep presentation. No whole scenario passes.

The [HOME switch/footer correction](home-switch-footer-2026-10-02.md) at
`0330d13c`/`e3503cc7`/`645ae96d` delivers source icon header, moving pending
banner, dark selected X Close and correct Health/Camera footer actions.
Nineteen inspected browser pairs and native comparisons support local progress;
no whole scenario passes. Next: suspended tint/warp, compact icon and modal
footer hiding. Camera Manual content is an explicit source gap.

The [Health Close correction](health-close-native-2026-10-02.md) at `3d5e533c`
delivers selected Health direct close and source X Close glyph/input. Fresh
native and eleven browser pairs support that bounded outcome, not motion or
whole-scenario parity. Native Health-to-Camera switch now supplies the next
defect: icon header/no unsaved warning, correct Camera upper presentation.
Suspended/closed/switch diagnostics all fail; L-06/L-07 remain partial.

The [source close/switch dialog](home-software-dialog-2026-10-02.md) at
`f17a1007` replaces the authored frame/glyphs and touch bounds, preserving
same-button ownership and paired failure recovery. Eleven browser pairs and
full1668 tests pass supporting checks; native dialog composition, inline text
size, per-title policy and closing motion remain open. L-06/L-07 are partial.

The [close/switch input correction](software-dialog-input-2026-10-02.md)
at `7dd76afa` is implemented, tested and browser-inspected: bounded same-button
touch and press feedback. Its authored artwork was superseded by the source
assembly above; native acceptance and closing motion remain unfinished.

[Silent reference recovery](native-silent-reference-2026-10-02.md) restores
native HOME/Health rendering with synthetic input2, Null output1 and volume0.
It supersedes Null input1, which stalled the reference. The subsequent
[held-HOME reference](native-home-return-2026-10-02.md) reached suspended HOME
and captured its upper window, first-use notice and Health close outcome.
The subsequent [source-window delivery](home-suspended-window-2026-10-02.md)
at `81d0b3d8` restores its expanded panel and owned frozen frame. Tests/build
and nine browser pairs pass their supporting checks; retained-native diagnostic
95286/51107 still fails. Flat backing, compact window, tint and motion remain
open. This is partial H-12 delivery, not completed close/switch or a scenario pass.

## Scope and Evidence

Preserve the original 2012 Silver + Black 3DS XL, spin/opening, physical controls,
two native-proportion LCDs and all eight portfolio apps. Target EUR 10.7.0-32E,
original hardware, English. [UI scope](portfolio-ui-scope.md),
[architecture](architecture/README.md), [progress](progress-2026-09-24.md) and
[verification](architecture/verification.md) remain authoritative. The previous
map is retained as [history](feature-map-history-2026-10-01.md), not a live queue.

**No whole native scenario is accepted 1:1.** Some individual static frames have
pixel-threshold matches; those do not prove input, motion or audio. Workstream
rows separately identify implementation, tests, inspected browser states and
native evidence. A missing screenshot is an evidence gap, not evidence that the
feature is absent. Native residuals remain fail until explained and accepted.

The [2 October live evidence](home-live-verification-2026-10-02.md) verifies
selection-independent background progression and repeated-paint stability.
A retained-native wallpaper-margin diagnostic matches within 1/255, but the full
pair still fails at 4940/19125 upper/lower pixels above 2. Native Health launched;
bounded HOME attempts did not return to HOME, so H-12 window composition still
needs its native gate. All owned verification processes are stopped.

The [HOME Settings correction](home-design-native-comparison-2026-10-02.md)
at `747f840d` replaces unrelated upper icons/hints with the native caption.
The later [lower-panel integration](home-settings-integration-2026-10-02.md)
at `e923487d` replaces authored Settings graphics and adds source Save/Load,
brightness/power rows, scrolling, local saved layouts and guarded confirmations.
Retained-reference lower residual is9630 pixels >2 (previous61485); differing
population/phase/input make this diagnostic only. Whole pair36195/9630 still
fails. Saved thumbnails/zoom and later Settings rows remain incomplete.
Settings Other page1 browser regression is exactly unchanged on both LCDs.
Health APT-debug follow-up still did not establish native HOME return.

The [fresh Save/Load comparison](home-layout-native-comparison-2026-10-02.md)
now includes `18bc33c0`, `6c24da03` and `5232b9c5`: empty-slot plates/Delete,
footer correction and current-layout paired preview are implemented. Against
the retained native frame, the final diagnostic is7899/1122 upper/lower pixels
above2; a fresh native frame gives8383/1217. Timing/population differ, so neither
is acceptance. Saved thumbnails/Zoom, first-use preparation and exact motion/
input/audio remain open. Full1648 tests, typecheck/build pass.

All 3DS sessions stay muted. The user now permits the entire Mac for visible
verification; check current display geometry before input. Only the coordinator operates Azahar and
the shared production browser. No default Azahar profile; no new artifacts on
DeveloperStorage. Private artifacts use the internal disk. No push, merge to a
shared branch or deployment without authorization.

## Coverage Index

| Workstream | Required user-visible coverage | Detailed map |
| --- | --- | --- |
| HOME | Upper wallpaper/HUD/selected banners; lower toolbar/grid/icons/labels/footer; selection/cursor; every density; scroll; folders; pickup/drop; HOME settings/manual/suspended controls; keyboard, touch and physical routes | [HOME and lifecycle](feature-map/home-and-lifecycle.md) |
| App lifecycle | Cold boot; opening/fade/logo/loading; cancellation/failure/retry; HOME suspend/resume; close confirmation; switching apps; nested helper return; lid sleep/wake; power menu/shutdown/restart; readiness/owner cleanup/persistence | [HOME and lifecycle](feature-map/home-and-lifecycle.md) |
| Settings, Health and helpers | Settings main, Internet/Data/Other pages, Profile/Date/Language/Sound and remaining in-scope menus; Parental notice; NNID/Transfer/Update UI; Manual contents/articles; Health articles/scroll; amiibo; internal helper surfaces | [System apps](feature-map/system-and-online-apps.md) |
| Camera | First-run guide; gallery folders; empty/populated browse; paging/strip gestures; photo view; read-only menu/chrome; exit and HOME return | [Media/social/portfolio](feature-map/media-social-and-portfolio.md) |
| Sound | First-run guide; entry room; source menus; empty/populated song library; supplied-song selection and playback transport; return/suspend/close cleanup | [Media/social/portfolio](feature-map/media-social-and-portfolio.md) |
| Notes, Friends, Notifications | Notes grid/editor/tools/save/return; Friend local screens and source error differences; Notifications empty/populated/read markers/list/scroll/detail policy; applet return to suspended software | [Media/social/portfolio](feature-map/media-social-and-portfolio.md) |
| Local services | eShop welcome/wait/exit; Zone entry/no-service UI; local Browser navigation/menu/return; Miiverse source chrome/local content and helper return; offline boundaries | [System apps](feature-map/system-and-online-apps.md) |
| Portfolio and console experience | Work, Side Projects, Hobbies, Life, HackUK, NVIDIA, About, Contact; list/detail/page/photo/cross-app/link actions; actual device controls; startup/retry/teardown; desktop/mobile framing and accessibility | [Media/social/portfolio](feature-map/media-social-and-portfolio.md), [experience contract](architecture/experience-design.md) |

## Shared Completion Matrix

Every app and helper must have an explicit answer for each applicable route.
Record N/A with a scope reason rather than silently omitting a route.

| Gate | Required behavior and evidence |
| --- | --- |
| Entry | Correct HOME identity and selection, source banner, Open action, matching touch/physical/keyboard outcome |
| Launch | Correct outgoing HOME, logo/fade/upper-lower publication, input gate and measured transition checkpoints |
| First run | Guide/welcome pages, forward/back/skip/dismiss where actually supplied; repeat-visit policy and saved state |
| Main screen | All visible labels, icons, panes, native fonts, animations, toolbars, footers and enabled/disabled states |
| Navigation | Each submenu/page/tab/list/detail, first/last item, scroll limits, touch hit areas, back/cancel and focus restoration |
| Dialogs | Each reachable confirmation/error/notice, modal input ownership, obscured background behavior, safe Cancel/Back |
| Content | Empty and populated states, selected content, pagination, missing-resource failure and declared local fixtures |
| HOME | Suspend, HOME presentation, suspended software indicator, Resume, and persistence of app selection/content |
| Close | Normal close, confirm/cancel, close-from-HOME and helper-return distinction, correct next HOME selection |
| Switch | Current app to different app, cancel switch, accepted switch, cleanup of outgoing owners before new publication |
| Interrupt | Lid sleep/wake, power menu/cancel/off/on, loading interruption, rapid retarget and stale async completion |
| Persistence | Reload, explicit reset, previous save migration, malformed save, no unintended network/device operations |
| Cleanup | No leaked renderer/audio/effect owner, no old app frame published, bounded caches, retry works after failure |
| Verification | Source identity + focused tests + full integrated checks + raw paired LCD evidence + inspected sheets + input/motion/cue timing |

## Work Order

1. **Close and switch software.** Replace the captured authored dialogs, finish
   closing/next-app presentation and correct modal button press/release bounds.
2. **Power-on, then HOME interactions.** Complete source-backed power/LCD
   sequencing; fix captured physical/touch/keyboard feedback and navigation
   defects. Preserve the existing model, HOME layout and app designs.
3. **Finish remaining missing UI.** Use the ordered design map's Finish/Replace
   rows; gated source/caller/content work must not monopolize the coordinator.
4. **Run one acceptance queue.** Coordinator captures each workstream's named
   native/browser scenarios, returns exact residual regions to its chat and
   integrates fixes sequentially. HOME idle and Settings Other page 1 remain
   baseline regressions. A browser startup failure does not stop code inventory
   or other independent workstreams.
5. **Finish fidelity and integration.** Correct unexplained pixels, input and
   motion, retest shared consumers, then audio only when the user permits it.
   Adaptations and source gaps stay visible; no completion percentage hides them.

At most one bounded source-only slice per feature before a visible correction
or a recorded source gap/adaptation. No repeated research loop without a named
defect, next observable result and stopping condition. A blocked item yields the
worker to the next ready item; it does not consume the entire coordinator.

## Task Protocol

Each task has a stable feature ID from a detailed map, one owner, explicit
allowed files, dependencies, captured defect or route repro, exact deliverable,
focused tests, and coordinator acceptance scenarios. The worker reports its
commit and unresolved items. The coordinator reviews the diff, integrates only
coherent commits, runs required checks and updates evidence before marking a
row accepted. Subagents may help inside a workstream but do not own shared UI.

Shared files (`system.ts`, `app-host.ts`, `stock-apps.ts`, `screens.ts`,
`stock-screen-layout.ts`, `console-scene.ts`, registry and native loaders) need
a named edit reservation in the registry. Worktrees prevent accidental writes,
not logical merge conflicts. Workers do not cherry-pick each other's work or
rebase a branch under another active worker. They never stage all files.

Use statuses **queued**, **active**, **review**, **integrated**,
**verification-needed**, **accepted**, or **blocked** for work. Separately retain
the native scenario status **fail**, **pass**, **adaptation**, **source-gap**, or
**blocked**. An integrated task is not automatically accepted. A source gap is
not a reduction of the user's completion criteria.

## Scope Boundaries

- Required adaptations: eight portfolio apps/content/tile population; read-only
  Camera; supplied-song playback; local/offline Browser, Miiverse and service
  flows. Document exact per-screen differences in the detailed maps.
- Excluded: Software Keyboard, Activity Log, Download Play, Mii Maker,
  StreetPass Mii Plaza, AR Games, Face Raiders; remote web/network/account/PIN
  actions; camera/microphone capture, recording/import and editable stock
  profiles. Internal helper registration does not invent a HOME entry.
- Native visuals/fonts/audio come only from the pinned dump with complete
  element -> manifest -> title/version/content/path/hash/converter provenance.
  Raw firmware, credentials, executables and private captures never go public.
- Supplied songs are a user-input dependency; the empty song manifest is not a
  completed playback demonstration. Silent tests may continue without unmuting.

## Coordinator Checkpoint

Working integration is `/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001`
on `codex/home-fidelity-20261001`, not the original DeveloperStorage checkout.
All eight first tests/handoff deliveries are integrated. The muted Sidecar
browser recovered and supplied raw Work launch/HOME/close/cancel/confirm,
Health launch/HOME/resume and Camera guide/gallery/photo/Back observations.
The [capture record](completion-routes-2026-10-02.md) separates those from native
evidence. H-12's missing suspended window is visibly confirmed; its native
Health activation/frame reference remains pending before renderer work.

Camera physical-selection correction `38bab8b7` is integrated and visibly
verified; direct-touch correction `dda25e9e` follows the independently reviewed
and captured stale-focus defect. Portfolio's actual-effect test correction is
integrated at `54497736`. Final checks/recapture are recorded in progress, not
inferred from worker success. No native acceptance was added. The latest native
frame-step PNGs still do not establish a shared browser epoch.

This map and the chat registry supersede the old five-lane task ordering, not
the source-of-truth, isolation, ownership or verification rules in AGENTS.md.
