# Verification and evidence architecture

[Banner-return verification](../home-banner-return-2026-10-03.md) distinguishes
request, readiness, activation metadata and the first retained visible PNG.
Close phase/frame-only capture keys can omit a second asynchronous paint of
the same terminal state; do not infer absence for that whole update from its
first pending paint. Keep loaded initial runs and clean sole-tab recaptures
separate. Compare native pixel order without inferring common frame epochs.

[Open-return verification](../home-open-return-2026-10-03.md) also keys on
`footerReturnFrame`, checks retired app ownership throughout return0..8, and
captures subsequent banner activation separately. Reduced-motion production
replay exposed synchronous retirement effects consuming return0 before paint;
the deterministic runtime regression alone is not a substitute for the fixed
build's paired capture. Keep failed runs and recapture all viewport modes.
Banner requests, resource readiness and visible activation are distinct events;
an Open-footer pixel improvement does not prove upper growth or native timing.

[Post-modal footer verification](../home-postmodal-footer-2026-10-02.md)
must record `footerExitFrame` in capture keys, otherwise all intermediate
footer samples collapse into one. Check entry, dialog exit, footer0/footer6
and later owner retirement separately. Whole-LCD metrics remain unmasked;
reasoned dialog/footer ROIs rank structural samples but do not prove epochs.
Inspect sheets even when tests pass: SceneOut's static child alpha caused a
captured first-frame Resume regression that required narrower source binding.
The [compact departure](../home-compact-footer-2026-10-02.md) uses ChangeDw,
not SceneOut; compare left Close and right Resume separately. Decoded source
curves and nearest structural samples do not establish native frame timing.

[Suspended folder software Close](../home-folder-software-close-2026-10-02.md)
requires checking semantic action and native resource selection together:
folder Close and software Close have different white/black panes and messages.
Capture the retained owner, active folder, selected child and both terminal
paint phases; verify the endpoint returns to the same folder with Open.
Count native own-PNG files, not successful screenshot-command dispatches.
The [F9 recapture](../home-close-icon-exit-2026-10-02.md) now obtains39 actual
entry/hold/exit/return PNGs. Preserve earlier failed menu-capture logs. Separate
modal entry, stable held dialog, exit, post-modal footer departure and banner
reacquisition using raw pixels: index8 is still transitional, while10..19 have
byte-identical lower pixels. A5% run and17.481-second gap are not timing proof.
Use browser source-phase metadata rather than matching ordinal frame numbers.
Exercise missing selected icon-exit resources through paired paint recovery,
not only renderer helper tests; the application owner must survive failure.
Exclude runs with incorrect commit metadata from final comparisons.

[Folder re-entry](../home-folder-reentry-2026-10-02.md) compares one continuous
held stroke through Back and the same folder, not a committed root placement.
Match folder coordinates with reversible real-input fixture preparation;
verify exact layout/children restoration. Capture both owner/latch state and
raw pixels: a surviving fallback ghost can conceal native pickup ownership
loss while its lift, backing and footer are wrong. Check repeated visits,
different-folder/root-source Back, counted clock remainders and outside cancel.
Keep initial held, root held, re-entered held and released pairs distinct;
missed native phases cannot be inferred from browser captures. A shortened
settled replay and a nominal phase-paced replay are not exact native epochs.

[Held artwork](../home-held-title-artwork-2026-10-02.md) distinguishes authored
material binding from its picture transport. Compare small/root and large/folder
poses separately, including artwork, shell and shadow; a draw-wide sampler can
improve one while regressing another. Preserve rejected experiment reports and
verify restored source/captures instead of keeping a change because tests pass.
Do not claim a phase or small-icon-source explanation without evidence.

[Folder-held backing](../home-folder-held-dimming-2026-10-02.md) uses a fresh
isolated CTM repeat: byte-identical lower pixels do not imply identical upper
epochs. Verify the decoded material endpoint separately from its adapted
selection/timing, and retain ordinary/root-held/release/cancel controls to
show that the held-only change does not alter other composition states.

Held-visibility verification reuses the named genuine CTM PNGs as immutable
references and recaptures the changed production build. Keep this distinct
from a fresh native run or exact timing replay. Test footer painting and hit
testing together, preserve banner readiness/ownership while paint is hidden,
and verify release/cancel restoration through actual gesture paths.

[Genuine held pickup evidence](../home-held-pickup-2026-10-02.md) uses long
constant-touch CTM phases so Tools > Capture Screenshot can write native PNGs
without a live host drag. Preserve the stopped seed/profile and CTM/config
hashes. Native screenshot capture pauses/resumes internally; pad-derived
counters and nominal HID durations are not exact rendered-frame identities.
Browser wall-time replay of the same phase plan still has no common native
boot/frame epoch. Keep the earlier short-hold pairs separately labelled.
Exercise scene order: counted clock advance, raw-time reducer, outer control
reconciliation. Vary clock remainder so both transition owners are covered;
a successful browser sample does not rule out a phase-dependent boundary bug.

[Folder Back drag-out](../home-folder-drag-out-2026-10-02.md) separates a
functional endpoint correction from native timing and pixel acceptance. Match
the same child-to-Back path, retain the source owner through the root preview,
and verify committed item conservation, reverse placement and cancellation.
Browser occupied-root swap is an explicit portfolio-content adaptation when
the native target is vacant. Do not label queued-after-release native PNGs as
held captures, or infer the browser's adapted500ms deadline from a settled
native endpoint. All whole-screen differences remain in empty-mask reports.
Test the scene's outer `reconcileHomeControls` wrapper as well as direct
`tickSystem`: the original direct-only test missed a context reset that cleared
pickup in production. Assert the held source and touch latch in a captured
root preview, then cleanup after cancel. Keep the old immediate band exit's
control-reset policy distinct from the timed Back transition.

[Pickup endpoint comparison](../home-pickup-endpoints-2026-10-02.md) separates
semantic placement, selected/blank artwork, stable chrome and cursor epochs.
Matched child2 ->1 ->2 placement and static artwork tolerance do not establish
held animation, release motion or exact native sample cadence. Browser held
frames without native counterparts must remain excluded from native pixel
acceptance. Repeated divider/footer shade errors remain fail even when small;
do not infer HOME framebuffer format from another title's descriptor.

[Create Folder footer text](../home-footer-text-2026-10-02.md) now meets the
static delta2 tier across desktop/mobile/reduced captures against three
preserved native own-PNGs. The 1/16 coverage fit is a labelled adaptation, not
a recovered native raster rule. It applies to every Create Folder action pose;
settled-only native evidence cannot validate pressed/transition pixels or
cadence. Browser hold/drag-out cancellation and four unchanged control ROIs
are supporting checks only. No fresh native boot or whole-scenario pass is
claimed; capture epochs and other full-screen residuals remain unresolved.

[Page boundary](../home-page-boundary-2026-10-02.md) distinguishes stored
capacity from captured exposed slots. Verify six-row no-arrow/no-scroll state,
five-row centered/origin/endpoint poses, density restoration and keyboard
last-column rejection with the same real inputs. High-slot save compatibility
is a labelled adaptation, not proof of native allocation. All six fixed
right-edge regions now meet delta2, without masks or fits; unmatched population
and cursor/banner/HUD epochs still prevent whole-screen acceptance. Compare
the footer edge separately from arrow art: its y212..213 strip is outside the
arrow clip and was affected by the incorrectly extended tray/shadow.
First-root motion comparison also closes that footer ROI to maximum1. A
small-image visual suspicion of a missing folder arrow was disproved by
byte-identical fixed arrow crops and identical source poses; do not infer a
missing control from full-frame cursor/backdrop differences. Candidate47915d8b
is reverted at e83d55de, retaining an actual folder-painter routing regression.

[Footer backing](../home-footer-backing-2026-10-02.md) compares native own-PNG
pixels with actual production first-root LCDs in the fixed x0/y212/320x28 ROI,
without fitting or masking. The source base is the complete320x240 layout;
the footer is a later overlay. Test settled root/Create Folder controls as well
as the revealed transition because the clip correction applies to every root
paint. A temporary10% native frame limit can expose an intermediate pixel
state but cannot validate timing. Restore the isolated configuration, verify it
byte-for-byte, and capture normal-speed controls separately. The later boundary
correction above closes the41 edge pixels; whole-screen residuals remain fail.

[Folder footer return](../home-folder-footer-return-2026-10-02.md) separates
desktop diagnostic motion from native own-PNG pixel evidence. The recorder's
pointer/badge obscures held Back and must never become a firmware asset or an
acceptance mask. Native video establishes root-before-footer temporal ordering;
actual production raw LCDs establish the old instant footer and the corrected
staged SceneIn. Compare counted HOME updates, not host hold durations alone.
The selection-ready-to-SceneIn binding remains a fitted adaptation until an
exact native call-site/input/pose mapping is captured. Empty-mask settled pairs
still fail. The subsequent backing correction above supersedes the missing
stripe diagnosis, not the remaining shade/edge or timing residuals.

Folder-gutter comparisons must align the retained **root viewport**, not only
the selected folder's screen position. Different folder slots can coincide at
x90 while the first root column differs x6 versus x34. The 2 October root-zero
replay removes the apparent icon strip through input alone at runtime5b82c896.
An unmatched-scroll ROI cannot justify masking or hiding the root capture.
Keep backing shade, population differences and native input/motion/audio gates
separate. Native contents restored on this cold boot; earlier failure to persist
must not be generalized to every launch.

[Open-folder footer](../home-open-folder-footer-2026-10-02.md) at `5b82c896`
separates selected-child action policy from surrounding population. Native
occupied children show full-width Open; vacant children show no footer, even
in a populated folder. A left-side touch launches Health. Compare occupied
before/after fixed footer crops separately from already-button-free controls;
do not interpret backing-shade pixels as leaked controls. The before left tap
returns root, so its result is a semantic diagnostic, not an equivalent-state
pixel baseline. Suspended-folder variants, native press/launch timing and audio
remain unverified. Browser tests and regional pixels do not pass the scenario.

[Populated-folder Delete](../home-populated-folder-2026-10-02.md) at `43b8be55`
uses two fresh native touch-OK cycles and byte-identical native lower notice
captures. Compare its source-backed one-button panel separately from surrounding
HOME population/scroll/animation differences. The former generic confirmation
is a same-action semantic diagnostic, not an equivalent-state pixel baseline.
Preserve intermediate captures: production inspection found a footer ownership
omission and the final correction suppresses that footer. Actual touch/A,
cross-target rejection, mobile, reload and empty-delete controls support behavior;
B/HOME recovery is adapted, exact native input/motion/audio remains unverified.

[Empty-folder Delete](../home-folder-delete-native-2026-10-02.md) at `2f074d64`
is a behavior correction established by two fresh native before/after runs.
One Delete activation returns to root HOME/Create Folder without confirmation.
The old browser generic confirmation is an unpaired semantic mismatch, not
an equivalent-state pixel baseline. Compare after root to native root and
retain unchanged Folder Settings controls separately. Actual touch, physical A,
reload and mobile browser checks pass; exact native timing/input/audio remain
open. Failed attempts to populate the native folder cannot establish its policy.

[Folder Settings verification](../home-folder-settings-native-2026-10-02.md)
at `79e77f58` uses fresh native own-PNG and production before/after captures.
The fixed modal ROI improves 55,945 -> 107 pixels above delta 2 with empty
masks; header/Delete row meet the static tier, but Rename and corner residuals
remain. Full pair 51,800/12,610 still fails. Actual touch Cancel, physical B,
Escape and desktop/mobile controls plus unchanged static stock LCDs are
supporting evidence, not native motion/input/audio acceptance. The newly
native panel participates in paired-LCD loading/failure publication and must
allow B/HOME escape from either state. Default display-name Azahar binding is
unsafe; see the updated [isolation contract](../native-reference-profile-isolation.md).

[Resize verification](../home-touch-projection-2026-10-02.md) at `a751b2dd`
corrects the former mobile-density failure diagnosis: a stale diagnostic
desktop target survived the resize and lay outside the mobile viewport.
Actual raycast/UV input is unchanged. Check target bounds plus resulting state;
five resized viewport runs, including same-aspect pairs, now pass 1 -> 2 -> 1.
Fresh six-density native comparisons retain toolbar/density-control static
tolerance and unchanged production control pixels. Native 200 ms repeat differs
from browser behavior; host hold duration does not establish matched HID or
emulated update cadence. Whole scenarios remain fail.

[Ordinary icon verification](../workstream-handoffs/home-icon-corners-compare.md)
at `3bb6c6f3` uses four fresh native own-PNGs and actual production raw LCDs,
not a source replay. Fringe 23 -> 0 and artwork core 1 -> 0 pixels above 2,
maximum 2 for fringe and 1 for core; Notes, unselected plate and footer controls
are unchanged. Whole
LCDs still fail with unmatched input/epochs/population/motion/audio. The
preserved y=138 replay is an invalid-coordinate experiment; actual y=137 is
byte-proven. Six desktop grid densities work; mobile density increase fails
both before and after. Record that limitation rather than treating a nonblank
mobile screenshot as interaction acceptance.

[Notes toolbar verification](../workstream-handoffs/home-notes-toolbar-compare.md)
at `79597372` records four fresh native own-PNG and production before/after
pairs. The 26x23 unselected Notes ROI improves 201 -> 0 pixels above delta 2,
maximum 25 -> 1, without a mask. Native and after ROIs each repeat exactly.
This validates a labelled, narrowly guarded missing-UV sampling adaptation,
not native initialization. Full LCDs, exact input, motion and muted audio
remain unaccepted. Desktop/mobile Notes touch/HOME return and unchanged
Power/Settings/static Health regressions are supporting evidence only.

[Shutdown publication verification](../home-shutdown-publication-2026-10-03.md)
uses a documented1400ms host stall and separately tracked actual WebGL
loss/restoration. Require an unmasked native-black paired LCD target with a
matching presented paint before off, and a live context after restoration.
Do not treat `data-screen-presented` alone during context loss as successful
GPU publication. A forced render and off in the same callback is insufficient.
Keep original no-stall/reduced controls and distinguish native reused endpoint
pixels from this unmatched keyboard/stall experiment or real hardware timing.

[Power input verification](../home-power-input-2026-10-03.md) at `b0814dd4`
uses three byte-identical native settled/cross-boundary controls and a fresh
held-to-black sequence. Corrected desktop settled, both release outcomes,
held and black shutdown endpoints meet maximum2 on unmasked raw pairs.
Browser input assertions also pass on mobile/reduced/app-origin routes;
continuous re-entry has no native capture. Exact timing, whole motion/audio
and physical backlight order remain open. A separate presented-attribute
observer avoids assuming every GPU publication causes a new LCD paint.

[Shutdown verification](../home-shutdown-fade-2026-10-03.md) at `cdc2926f`
compares actual production frames against 14 retained native own PNGs. Native
Decide and partial sleep SceneOut are available; native black/off is not.
Pose-fitted comparisons must not be reported as matched input epochs or native
timing. Desktop/mobile/app/reduced production runs exercise Off/restart with
audio muted; source terminal eligibility and observed GPU publication remain
separate, with no stall guarantee. Whole scenarios remain fail.

[Power footer verification](../home-power-footer-raster-2026-10-02.md) at
`d4c96f26` closes the captured three-pixel defect. Both HOME/app Power origins
have zero pixels above delta 2 across both complete LCDs with empty masks;
maximum is 2, not RGB identity. Lower before/after and app repeat are exact.
All four sheets and 65 browser-only motion pairs were inspected. Full 1780
tests/typecheck/build pass. Native event epochs, exact input, shutdown and
LCD/backlight timing, muted audio and older app variance remain unproven;
both whole scenarios remain fail. No matrix or global 1:1 acceptance follows.

[Power block-centering verification](../home-power-centering-2026-10-02.md)
at `57c4c824` compares fresh native own-PNG repeats and immutable production
before/after pairs. Both upper LCDs improve 4334 -> 3 pixels above 2; the
changed list has zero, maximum 2. Both lower LCDs remain byte-identical to
their baselines. App-only repeat is identical, but prior run variance remains
unexplained. All four contact sheets, desktop/mobile controls and 64 browser
motion pairs were inspected. Presentation sampling at 120000 ms is not native
event synchronization. Three footer pixels and input/motion/audio still fail
whole-scenario acceptance; no mask, matrix pass or global 1:1 claim.

[Power text-raster verification](../home-power-raster-2026-10-02.md) at
`766888a2` records fresh native repeats and immutable before/candidate/final
production pairs. Both lower LCDs have0 pixels above2, maximum2 with no mask;
the upper experiment was rejected. HOME upper remains4334, app upper6512.
A build with only the lower opt-in disabled reproduces the app upper variance
and restores the lower mismatch. Do not infer an upper cause or hide the first
discrepancy. Browser captures at120000ms clamp presentation, not native epochs;
the restored-build app repeat returns to baseline4334 with unchanged lower.
73 final browser motion pairs and1777 passing tests do not establish native
input/motion/audio. Both whole scenarios remain fail.

[Power menu verification](../home-power-menu-2026-10-02.md) at `82d26a8b`
records two fresh native origins and production before/after. Source spacer
advances correct list geometry; both after pairs remain4334/668 pixels above2
on empty masks. Native footer no-op has a same-method Power Off positive
control; desktop/mobile browser physical controls and footer behavior pass.
Input holds/entry paths and epochs differ, motion/audio remain unaccepted.
No whole-scenario or matrix pass is inferred from1776 passing tests.

[Closing exit verification](../home-closing-fade-2026-10-02.md) at `229e864c`
adds97 production motion pairs and two endpoints across seven routes. Actual
AppQuit and exit-terminal WebGL publication is asserted. Sleep/visibility
boundary recovery has focused policy tests; the browser lid replay covers
mid-close pause, not exhaustive boundary interleavings. All seven sheets and
desktop/mobile views were opened. Native best-pose exit diagnostic improves
mean RGB but remains fail; no native epoch or exact input/audio match. Source
selection is resolved, host start/retirement scheduling remains an adaptation.

[Power reveal verification](../home-power-reveal-2026-10-02.md) through
`2c992dd7` separates boot LCD paint from actual render acknowledgment. Reduced
motion requests changed-pose paints; pose 20 requests a paint in every mode,
and pending publication can bypass the ordinary render-rate gate. No native
phase-completion barrier or hold was added. Four browser runs publish pose 20;
stalls, native cold timing and compositor timing remain unproven. Seven close
regressions preserve terminal render publication. Native startup AX/screenshot
failure prevented new comparison; no whole scenario or matrix status changed.

[Close motion verification](../home-close-motion-2026-10-02.md) at `f8334ec2`
records93 raw production pairs from seven muted Sidecar flows. Actual
`renderer.render` terminal publication is observed, including30fps and reduced
motion; offscreen LCD paint alone is insufficient evidence. Mid-close lid
pause/resume is covered, boundary hide/sleep publication is not. Two independent
native profile retries failed launch input; no new native motion match.
Retained before/after diagnostic pairs10260/33902 and55126/27533 still fail.
Abrupt AppQuit mask backing and stationary window/footer until retirement remain
visible gaps. All native copies stopped; no matrix or whole-scenario acceptance.

The [highlight/pulse comparison](../home-suspended-highlight-2026-10-02.md)
through `47845dc5` uses two real independent muted Azahar copies on Sidecar,
18 static and10 pulse browser pairs. Both48x48 icon interiors visibly change;
that is not proof of native phase or cadence. Latest expanded8242/33756,
Camera12119/22004 and switch14257/10542 pixels >2 all fail. Translated icon
and footer-strip diagnostics are explicitly regional, not acceptance masks.
Copies are stopped after captures, temporary bindings restored; both native
Quit/Yes exits139 remain abnormal. Workers never drive either reference.
No matrix change or whole-scenario pass.

The [suspended-background comparison](../home-suspended-background-2026-10-02.md)
at `fc6e5983` adds nine inspected production pairs and four fresh native PNGs.
Expanded upper differs at 12,137 pixels >2 (prior 95,276); whole scenarios still
fail with unmatched input/population/density/phases. Original source backdrop
is delivered through a fitted binding/padding/sampler adapter. Native Quit/Yes
exited 139; absence and stopped-profile restoration verified, not a clean exit.
All audio muted; no matrix acceptance.

The [compact HOME comparison](../home-compact-window-2026-10-02.md) at `17eebbb0`
adds four fresh native captures and nine inspected browser pairs. Its compact
pose is visible, but icon tint/pulse, backing and all full pairs still fail.
Native input/phase/density differ from browser; no matched acceptance or matrix
update. Private Azahar exited0 and temporary bindings were restored.

The [HOME switch/footer comparison](../home-switch-footer-2026-10-02.md)
records source/modal-clock/footer corrections through `645ae96d`,19 inspected
production pairs, four fresh native captures and retained Health references.
Dialog/footer region improvements are not whole-LCD passes; all full pairs fail.
The native run isolated hidden startup-warning dismissal as the input recovery
step without changing config between attempts. Preflight must list all windows
and dismiss that warning explicitly. Quit/Yes exited139; absence, not clean exit,
was verified. Audio stays muted and the historical matrix remains unchanged.

The [Health Close replay](../health-close-native-2026-10-02.md) at `3d5e533c`
adds five fresh native captures and eleven inspected production pairs. Native
Health closes directly; its Camera switch uses an icon header without the
generic unsaved warning. Empty-mask suspended/closed/switch diagnostics remain
95284/51196,35123/47525,96000/24433. Input/timing/population differ, all audio
is muted, no matrix acceptance. Startup modal dismissal and disabling mapped
touch both preceded recovered native input; do not claim an isolated cause.

The [source close/switch dialog](../home-software-dialog-2026-10-02.md) at
`f17a1007` has eleven inspected production pairs, source-bounded touch checks
and full1668 passing tests. Native menu boot supplied a fresh HOME capture,
but held launch attempts left HOME unchanged. Its53673/47561 empty-mask HOME
diagnostic is not a native dialog comparison. Generic assembly, inline size,
per-title policy and motion remain open; no scenario acceptance is inferred.

The [source suspended-window delivery](../home-suspended-window-2026-10-02.md)
at `81d0b3d8` has nine final raw production pairs and an inspected retained-native
diagnostic (95286/51107 upper/lower pixels >2, empty mask). Different input,
population/density and flat backing remain explicit failures. Fresh native
replay did not boot; no new native pair or matrix acceptance is inferred.

The [2 October held-HOME replay](../native-home-return-2026-10-02.md) now
establishes Health -> suspended HOME with native PNGs and logged APT return.
Its500ms Shift-modified drag used cua-driver MCP's retained screenshot
context; separate CLI calls lost that context. EOF interrupted timing, so
do not call this measured native hold/motion parity. Health Close returned
HOME without an observed confirmation; other-app close/switch remains open.

The [2 October silent-reference recovery](../native-silent-reference-2026-10-02.md)
supersedes the earlier Null-microphone recommendation: the clean private clone
uses synthetic Static input2, Null output1 and volume0. HOME and Health render
again. That checkpoint preceded the successful HOME return described above.
Do not repeat black-screen launches with Null input1 or use host microphone/
output as a workaround. This fixture is not microphone/audio acceptance.

The [fresh Save/Load native route](../home-layout-native-comparison-2026-10-02.md)
at `72fa1865` has two semantically corresponding touches, but not matched timing,
population or initial selection. The empty-slot comparison improves lower36454
to4115; upper21259 remains fail. Native first-use preparation is window-observed
only. Keep the initial occupied-browser diagnostic separate from empty-slot
before/after captures; do not reuse its total as a controlled baseline.

Latest HOME Settings integration `e923487d`: [evidence](../home-settings-integration-2026-10-02.md)
records actual Sidecar browser captures and a retained-native diagnostic,
not a fresh matched replay. Whole pair36195/9630 pixels >2 remains fail.
Settings Other page1 exact browser regression does not establish native acceptance.

The **isolated Azahar profile running the user's EUR 10.7.0-32E firmware** is ground truth for in-scope software screens. A scenario is accepted only after the coordinator operates Azahar and the integrated production browser with identical inputs, captures both raw LCD outputs, diffs them, inspects the side-by-side sheet and resolves every unexplained difference. Tests, source traces, source renders and browser operation are supporting evidence. Hardware appearance has a separate matched-photograph/browser-model gate.

| Tier | Establishes | Does not establish |
| --- | --- | --- |
| Implemented | The integrated path exists | Visual correctness |
| Tested | Bounded code, resource or shader contracts | Integrated pixels or timing |
| Browser-inspected | A named production-browser route was operated and seen | Native equivalence |
| Source-identified/rendered | A resource or bounded original-code behavior | A live native/browser match |
| Native-compared | Azahar's own capture or audio directly paired with raw production-browser output at a named state | Other states or whole-title fidelity |

## Isolated reference

The [1 October HOME CTM diagnostic](../home-ctm-live-replay-2026-10-01.md)
adds a coordinator-only replay path: short `-p` on the pinned macOS executable,
independent stopped seed clones, explicit eight-sample holds/releases, verified
Sidecar placement and volume0. The [measured follow-up](../home-input-comparison-2026-10-01.md)
repeats the final native launch outcome and exercises trusted browser down/up
events, but exact timing, native initial-title rendering and pixel/phase parity
remain open. Long `--movie-play` is rejected by this binary's outer parser.
Native EOF opens a blocking completion modal. Resolve it before further menu
work, or capture/quit before EOF; a status label is not proof it was dismissed.
Quitting inside it left one owned clone waiting in `ShutdownGame`.
The [subsequent reselection run](../home-friend-motion-comparison-2026-10-01.md)
captured before EOF and exited0. Initial Notifications again rendered only `N`,
but Left/Right restored its full label. Use that named reselected capture for
normal label comparisons; do not silently replace the startup anomaly or infer
its cause. Friend live hosted counters now appear in raw capture metadata;
matching one browser counter across builds does not establish the native epoch.
Treat older repeated-host-key methods below as historical diagnostics, not
evidence that event cadence matches the browser.

The [Notifications follow-up](../home-news-motion-comparison-2026-10-01.md)
adds News hosted counters and a byte-identical Friend counter250 regression;
native phase remains unaligned. Its footer memory diagnostic could not save
state with LLE enabled. Pinned RPC/GDB servers bind wildcard addresses and
expose unauthenticated writes: leave disabled, not an implicit fallback.
Delayed menu tracking can outlive a Quit request; verify process exit and inspect
the exact owned process before recovery. Native modal placement can differ from
the main window: independently verify/move each dialog to Sidecar before input.

Browser replay can reuse the repository CDP client on an already verified
Sidecar tab. Real key/pointer down/up events and a read-only observer establish
delivered event timestamps/trust. Schedule releases from dispatch deadlines,
not after acknowledgements, and report measured durations. Neither DOM
timestamps nor the presentation-only `captureScreensAt` elapsed/date parameters
establish native HID sampling or a shared animation clock. Keep the app muted;
audio acceptance remains open.

The [2 October live check](../home-live-verification-2026-10-02.md) confirms the
integrated background host's browser clock/paint behavior, with a bounded
retained-native margin match but failing full LCDs. Its Health CTM reached main;
manual HOME attempts did not reach HOME. Pinned Azahar polls APT HOME at 16666us,
separate from 234Hz HID/CTM polling. Requested host key counts are not native
notification counts or measured holds. The native EOF modal was resolved on
Sidecar and normal shutdown exited 0; neither remains a live wait. Use native
Capture Screenshot/Qt macOS Command+P; F12 is not verified for that profile.

The [HOME Settings capture](../home-design-native-comparison-2026-10-02.md)
uses a verified seed clone and CTM toolbar touch to open Design. It establishes
the missing lower Save/Load Layout section and supports the source upper-caption
correction, not matched browser input or animation epochs. Caption121 pixels/max4
still fail. The separate Health APT-debug run has no logged inquiry/jump and no
visible HOME return; absent log calls alone do not prove host input was absent.
Its process is closed. Browser-only Settings regression sheets are explicitly
not native acceptance evidence, even when the comparison reports zero error.

Use the current isolated copy under `/Volumes/Codex3DSIsolated/camera-guide-replay-20260926/` on the Sandisk APFS sparsebundle. The prior DeveloperStorage copy and the user's original reference remain preserved. Never launch `/Applications/Azahar.app` or touch the default profile. Before each launch, verify copied executable SHA-256 `3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`; no symlinks under isolated `user/`; and `user/config/qt-config.ini` values `use_custom_storage=false`, `graphics_api=2` (Vulkan for this Apple build), both resolution factors 1, `layout_option=0`, `swap_screen=false`, and screenshot path inside the isolated reference. Back up config before edits and version the working config with date/hash. Launch the copied app with its adjacent `user/` profile. After boot, verify the actual backend in `user/log/azahar_log.txt`; the 2126.1.2 macOS build rejects `graphics_api=1` and falls back to Vulkan, so a config value alone does not prove the renderer. Record original-3DS mode, EUR/English, white HOME theme, clock policy and photo/song population in the scenario matrix. See [profile isolation](../native-reference-profile-isolation.md).

Click Azahar before keyboard input. The isolated map uses A=`A`, B=`S`, HOME=`B`, START=`M`, SELECT=`N`, L=`Q`, R=`W`, D-pad up/down/left/right=`T`/`G`/`F`/`H`; read X/Y/Circle Pad from config. Prefer configured `touch_from_button` keys at 320×240 lower-LCD coordinates. Both `profiles\\1\\use_touch_from_button=true` and `profiles\\1\\use_touch_from_button\\default=false` retain those keys. Edit config only while Azahar is closed. Calibrate any mouse touch from a window screenshot and confirm it landed. The coordinator recovered native key input with CUA `typeText` using repeated characters; a single press was too brief for the controller poll. Record repetition and resulting state rather than treating one character as one frame. Look after **every** input; fix lost focus, dialogs or black frames before continuing. Frame-advance motion at explicit counts. Record audio capture method or leave audio open.

## Native capture, browser capture and diff

1. Use Azahar's own Capture Screenshot command for a **400×480 PNG**. Crop upper `(0,0,400,240)` and lower `(40,240,320,240)`, verifying offsets against a known screen. Window grabs and computer-use screenshots guide navigation only.
2. Run `npm run build`, then start the integrated build with `LCD_CAPTURE_OUTPUT_ROOT=/absolute/private/artifact/root npm run start:verify` for normal production verification. This binds the local capture endpoint to `127.0.0.1`. A Next development server bound to `0.0.0.0` may normalize its internal request URL to the wildcard address; the capture endpoint accepts that form only when the explicit Host and Origin headers both match a loopback origin. Capture raw upper **400×240** and lower **320×240** render targets. A scaled page/console screenshot is not a comparison input. The Experience lane owns a verification-only raw LCD capture hook if needed.
3. The Assets lane owns `scripts/native-compare/` with a parameterized output root. Each pair/mask yields per-LCD mean/max RGB error, count of pixels with any channel delta greater than 2/255, connected difference regions and bounding boxes, heatmap, side-by-side sheet and JSON with both SHA-256s, commit and scenario ID.
4. **Open the side-by-side sheet.** Fix unexplained regions and repeat both captures after integration. Masks require named reasons and may cover only intentional clock/battery, portfolio content, read-only Camera footer, inert OK and other [feature-map](../feature-map.md) adaptations. A mask created merely to pass a diff is a defect.

Store a versioned scenario matrix under the private artifact root (currently on the home disk at `/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v63/matrix.json`); bump the version when entries change. Each entry records ID, title/version, entry state, exact keys/touches/frame counts, clock sampling, native and browser capture paths/hashes, mask, latest diff report and status `pass`, `fail`, `adaptation`, `source-gap` or `blocked`.

The historical `sound-first-run-span-mounted` browser capture JSON was
overwritten. Matrix v17 marked it unavailable; v25 preserves that repair and links an upper PNG recovered
pixel-for-pixel from the preserved contact sheet, an unchanged lower PNG and a
reproduced failing diff. This repair cannot replace a complete fresh capture
pair for acceptance.

The first whole-scenario acceptance targets remain **matched HOME idle** and
**Settings → Other Settings page 1**. [Matrix v58](/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v58/matrix.json)
has 117 failing entries, **all
whole scenarios remain unaccepted**. Through integration `8c0a6d7`, production Health Usage
initial, Health Usage scrolled 8px and Settings Other page 1 have unmasked static
two-LCD pixel-tier matches, maximum delta 2. HOME Settings's independent yaw304 / COMMON303
diagnostic still has **222 upper / 36,258 lower** pixels above 2/255; the coupled
304 control has 1,883 / 36,358. This static sample does not establish a live
one-frame clock offset. See the [current report and capture links](../progress-2026-09-24.md#matrix-v45-independent-home-pose-diagnostics--26-september-2026).
Static matches and explicit phase/calendar samples do not prove identical input,
a recovered native event clock, ±1-frame motion or audio onset. HOME idle still
lacks a matched-input acceptance score. The old scaled Settings JPEG/source
render remains non-acceptance evidence.

Sandisk1 has space again. A byte-verified copy of the isolated app/profile now
runs inside a growable APFS sparsebundle on Sandisk1, and Azahar's screenshot
command writes there. Preserve the original and default profiles. The latest
Settings page 1 and page 2 pairs use fresh native PNGs from that mounted copy;
their distinct title-entry and input routes still prevent a whole-scenario
pass.

The isolated native Camera fixture contains two Camera-created photos sourced from the existing Renu image. The browser now renders a six-cell View Photos browse with native `P_BrwsMenu_D` Slideshow/Shoot/Settings and `P_BrwsBase_D` zoom chrome, but the latest populated pair still differs by **95,350 upper / 23,052 lower pixels over 2/255**. It compares two native stereo MPO fixture photos with five mono portfolio JPEGs, different date folder/selection/chrome and unmatched input. `cc4e383` now follows executable mono contain/no-upscale; the preserved stereo fixture has a different native fit branch, so this diagnostic cannot judge mono photo fidelity. Earlier Camera first-run/empty/populated pairs are preserved diagnostics, not gallery acceptance. The exact source `C_SldH_S` slider now renders at the source parent anchor; its browser paging → Rate mapping and static Parakeet phase are adaptations. Shoot and zoom remain inert under the read-only gallery scope. See the [Camera evidence update](../progress-2026-09-24.md#camera-mono-source-diagnostic-and-sound-strip-finding--26-september-2026). The fixture is private verification data and does not add product capture/editing. Nintendo says only photos created with 3DS Camera can be used on the system ([support](https://en-americas-support.nintendo.com/app/answers/detail/a_id/674/p/605)).

The later [Camera v46 checkpoint](../progress-2026-09-24.md#camera-source-colours-and-five-page-welcome--26-september-2026) applies original message-style colours to browse labels and renders the five-page Welcome route from published Camera resources. Its populated-browse diagnostic is **95,350/22,856**; page-1 Welcome versus preserved native is **1,387/7,026** raw upper/lower pixels above 2/255 with empty masks. Both still fail whole-scenario acceptance. The guide's underlying shoot scene, upper HUD icon treatment, native input route and later page timing/audio remain unresolved.

Matrix v47 adds browser-only Welcome pages 3 and 4 after the original MSBT red
text spans were rendered. Their raw 400×240 and 320×240 canvases were inspected;
no native page-3/4 captures or pixel reports exist. The published source CGFX
shoot environment is not yet composed under the guide.

Matrix v48 adds the page-1 regression and source-CGFX-underlay diagnostics.
The regression is pixel-identical to the previous browser page 1. The CGFX
slice lowers RGB MAE from 8.2033 to 7.2603 on the lower LCD, but the count
above 2/255 stays **7,026**. Source 2D shoot controls and their attenuation
remain unresolved, so the whole scenario still fails.

Matrix v49 adds the source `P_Shoot_D` 2D layout with a documented held clip,
named theme slots and capture-fitted half-brightness. The page-1 lower
diagnostic improves from 7,026 to **2,690** pixels over 2/255 (RGB MAE 7.2603
to **2.6580**); upper remains **1,387**. A missing BtnIOcam top child and
border/grid residuals are visible in the inspected contact sheet. Native
input route, motion and audio remain unmatched.

The eight v25 browser-only records cover selected HOME banners, Zone entry and eShop close. Their target native capture, mask and diff fields are null. The latest two at `8f0eb39` show eShop bags/logo/shadow and Camera photo cards after explicit source Color-presence metadata and provisional source-diffuse binding. Earlier blank/missing mesh records remain unchanged. All eight remain `fail`: visible browser correction is not native shader/pixel acceptance. The earlier relaunch stopped at a notification; that input block was subsequently cleared for Settings. See the [browser correction checkpoint](../progress-2026-09-24.md#browser-absent-color-correction-and-native-input-gap--26-september-2026) and [native Settings recovery](../progress-2026-09-24.md#native-settings-input-recovery--26-september-2026).

Matrix v26 preserves the 40 v25 records and adds browser-only Notes grid and
Miiverse initial captures. Both have null native, mask and diff fields and remain
`fail`. The coordinator inspected both raw LCDs: Miiverse at `255fd30` now has
source title/BG/toolbar and an unpopulated interior after invented text removal.
Its empty interior is a documented source gap and local adaptation, not an
accepted native empty screen. The earlier Raise/repeated-E attempt left Azahar’s
HOME notification visible; later repeated-E input activated the lower touch
target and opened native Settings. That recovery has no Miiverse counterpart.
No notification screenshot is a Miiverse comparison target. See
the [Miiverse checkpoint](../progress-2026-09-24.md#miiverse-empty-interior-browser-checkpoint--26-september-2026)
for capture hashes, provenance and remaining adaptations, and the
[Settings recovery](../progress-2026-09-24.md#native-settings-input-recovery--26-september-2026).
Those historical Settings main and Other Settings page 1 pairs lacked matched
input and had residual pixels. The later page-1 pixel-tier match above supersedes
that pixel result; full input and motion/audio acceptance remain open.
See the [recovered Settings comparison](../progress-2026-09-24.md#recovered-settings-browser-comparisons--26-september-2026).

The browser now renders Sound's three-page first-run guide using delivered source resources. An earlier page-1 pair uses selected HOME Sound + A in both environments and differs by **15,639 upper / 6,579 lower pixels over 2/255**. Source counter messages and shared pane anchors reduced the lower diagnostic to 6,267. After the source Span mount and Base adaptations, `139df79` fits only three title material registers to captured blue `(41,113,238,255)`, removing 8,910 upper over-threshold pixels and yielding the latest **6,627 upper / 6,267 lower** pixels over 2; that pair has different HOME navigation prefixes. The body text is within the pixel threshold; title band, waveform sampling, birds, footer and other residuals remain. The title blue, Base blue, opaque alpha and edge fit are capture-derived visual adaptations, not a native-material claim. The source character frame/bird mount is evidence-best at zero offset. The settled `Record & Edit Sounds` pair still fails at **15,793 / 16,021**. Browser first-run persistence is not firmware-backed. The earlier matched-A pair establishes only that entry input reaches the same page; these counts do not establish complete input, animation or audio parity. The old 1229×768 JPEG Settings grab against a source render is not acceptance evidence.

`captureScreensAt` forces an explicit presentation sample without advancing
host state. It is available in development and in a production build served on
loopback with `?lcdCapture=1`; see [browser LCD capture](../browser-lcd-capture.md).
It exports the 400×240 upper source canvas and 320×240 lower canvas as PNGs,
before the upper source is stretched to the 800×240 display texture.
For the retained HOME cursor, use the capture result's own
`homeCursor.sampledFrame`, not the earlier live `state.screenPaint` diagnostic.
The [cursor replay audit](../home-cursor-replay-2026-10-02.md) verifies the
synchronous draw/diagnostic/PNG contract. The 24 fps idle LCD paint can lag the
60-update retained cursor; this is not proof of a native clock defect. Capture
can repaint canvases and populate caches without advancing application state.
Exhaustive phase fitting and source-center normalization remain diagnostics,
not shared native epochs or acceptance masks.
The opt-in local production verification route has been exercised through a CUA click and saves the exact JSON payload and both PNGs
under the private artifact root when `LCD_CAPTURE_OUTPUT_ROOT` is set. It is gated to loopback with `?lcdCapture=1`; keep it invisible to visitors.
`captureNativeBanner` remains development-only. Source phase samples for the
HOME Settings balloon show a dynamic pose, but no frame-aligned native motion
pass. A sampled pose does not prove that live input reached it with native timing.

## Coverage and pass rule

Cover HOME idle, cursor/rapid retarget, each in-scope selected stock banner, folder open/close, pickup/drop, stock and portfolio launch/return, Settings main/subpages/Language scroll/helpers, Health entry/key/drag, Camera empty and populated gallery/paging, Sound empty/first-run/transport, eShop wait/exit, Zone, Notes, Friends, Notifications, local Browser/Miiverse, amiibo opening, HOME suspend/return and power off/on. Add frame checkpoints for each motion. Excluded keyboard, other stock titles, network/accounts and Camera capture/editing are not matrix work.

A settled or motion frame passes when, after valid masks, **zero pixels** have a channel delta over 2/255, or every remaining connected region has a verified cause and explicit user acceptance. Transition boundaries match within ±1 frame at 60 Hz; identical inputs reach identical screen/selection state; each native cue has the correct identity and onset within ±1 frame. The coordinator inspects the contact sheet. Low mean error with unexplained regions fails. Missing audio capture leaves audio open; the empty song manifest cannot prove playback.

For each failure, give the owning lane the capture pair, diff regions, likely native resource/binding and required pass condition. Review and integrate its commit, rebuild/restart the production server, recapture/re-diff, and rerun previously passing scenarios sharing changed code. Continue until every in-scope matrix entry is `pass` or a reasoned `adaptation`, `source-gap` or `blocked` with evidence. Storage EIO or browser admin-policy blocks must be reported; they do not lower the evidence standard.

## Integration record

Record implemented, tested, browser-inspected and native-compared separately, plus build commit, inputs, capture hashes/paths, mask, diff report, cue evidence and residuals in [progress](../progress-2026-09-24.md) and [feature map](../feature-map.md). Source fixtures identify synthetic owners/callbacks. The user's dump is the only native visual/audio source. Each visible or audible native element needs an element → manifest key → decrypted dump-source mapping, with title/version, content index, CIA-internal path, SHA-256 and converter version. Audit this mapping and list every still non-native element at each handoff. Portfolio tile art/text/photos, the read-only Camera footer, inert actions and local Browser/Miiverse content are user-scoped adaptations; keep their reasons explicit. They do not authorize masking unrelated native pixels or replacing native fonts/sounds. Keep raw CIAs, executables, tickets and Azahar captures private. Documentation edits need link validation and `git diff --check`; runtime/asset edits need relevant tests, typecheck, build, shader and provenance checks. Those checks never change native comparison status.

Current Settings residuals at `94463cd`: Other page 1 **1,477 upper / 3 lower**, main **59 / 20**, empty masks, all fail. Source row widths first reduced Other lower 702→45; horizontal glyph half-pixel boundary ownership reduced 45→3. The three lower pixels are at `(129,168,1,3)`. Native/browser HOME prefixes differ; motion/audio remain open. See the [production checkpoint](../progress-2026-09-24.md#settings-row-width-and-font-boundary-production-checks--26-september-2026) for all four pairs, hashes, overflow storage and integrated checks.

Latest `600bf6f` static Other Settings lower LCD has zero pixels above 2/255 (maximum delta 2, mean 0.15514323), with no mask; it is not byte-identical. Other upper remains 1,477 and main 59/20, so all scenarios remain fail. Source float32 glyph endpoints resolve the prior three lower pixels; motion/audio and full-session input parity remain open. See [v32 production evidence](../progress-2026-09-24.md#settings-float32-endpoint-production-check--26-september-2026).

Production `7221619` preserves Other Settings **1,477/0** and main **59/20** after independent Opus review moved float32 endpoint rounding into writer coordinates before pane translation. Matrix v44 retains the history, empty masks and failing whole-scenario status. The odd-second main probe has identical PNG hashes and is not an improvement. Full suite: **1,414 pass / 0 fail / 23 skip / 1 TODO (1,438 total)**; typecheck/build/shader pass. See the [review and production checkpoint](../progress-2026-09-24.md#writer-local-glyph-endpoints-independent-review-and-production-regression--26-september-2026).

Health entry live frame 198 now has **0/0 pixels above 2/255** after the capture gate and one-pass rotated-picture raster, versus 258/0 before. This single static checkpoint is not byte-identical (maximum delta 2) and does not establish matching launch inputs, motion/audio, articles or CUA key-hold/frame parity. Offline mean 4.137→4.872ms, after p95 6.140ms; browser FPS unvalidated. See the [production checkpoint](../progress-2026-09-24.md#health-live-frame-198-and-rotated-picture-raster--26-september-2026).

Fresh HOME Settings diagnostics at `692c444` retain unmatched/unrecorded input prefixes and unknown native phase. The live pair is 65,074/36,196; synthetic source frames 150/450/136 yield 64,094/36,480, 64,076/36,429, 64,064/36,194 respectively. The later native burst shows a broad settled icon row; the earlier compressed snapshot does not justify a constant projection fit. These source-pose probes do not establish runtime timing or acceptance; see the [v35 evidence](../progress-2026-09-24.md#fresh-home-settings-and-synthetic-source-poses--26-september-2026).

Settings owner-scoped HUD production `f083291` leaves **21 upper / 20 lower** pixels above 2/255. HOME constant projection fit `cfefa16` regressed the settled view and was reverted in `ba0b8d5`; the restored live HOME pair is **56,631 / 36,088**. The genuine twelve-frame native burst retains a broad icon row while the wrench rotates. These empty-mask diagnostics remain `fail`, with unmatched input, unknown phase and open motion/audio. See [v36 evidence](../progress-2026-09-24.md#settings-hud-and-restored-home-projection--26-september-2026).

Production `ba0b8d5` with synthetic `lcdBannerFrame=309` gives **56,409 upper / 36,358 lower** pixels above 2/255. Offline native silhouette fits suggest the existing approximately 600-frame/10-second turn, but no native frame counter or matched activation boundary is established. `captureScreensAt(elapsedMs,date)` repaints without advancing live banner clocks. The pose improves orientation only; runtime timing, shading, profile/input and audio acceptance remain open. See [v37 diagnostic](../progress-2026-09-24.md#home-settings-synthetic-frame-309--26-september-2026).

Production Settings glyph ink correction `87dc835` leaves **2 upper / 20 lower** pixels above 2/255 when the displayed minute matches. HOME frame309 with view-normal sphere mapping at `03b2d31` leaves **53,454 / 36,360**. Both use empty masks and remain fail; the HOME pose is synthetic and Settings inputs are semantically HOME→A but unsynchronized. See [v38 evidence](../progress-2026-09-24.md#settings-sphere-mapping-production-diagnostic--26-september-2026).

Other Settings page 1 at `20ec43e` now has the same semantic **HOME selected Settings → A → Other Settings touch** route in native and browser, with **1,312 upper / 0 lower** pixels above 2/255 and no mask. The lower frame has maximum delta 2, not byte equality. Upper title/icon residuals and two HUD pixels remain; held A timing, ±1-frame motion and audio are unverified. Input tier and whole scenario remain fail. See [v39 route evidence](../progress-2026-09-24.md#other-settings-page-1-shared-home-route--26-september-2026).

Health HOME→A launch at live browser frame156 now has **0/0** pixels above 2/255 (maximum 2, empty masks); the semantic launch route matches, but literal selection/hold history and native elapsed/frame alignment do not. Pixel tier passes for this frame only; whole scenario fails. Independent HOME wallpaper 337/wrench 309 sampling gives **6,194/36,419**; Settings source-centering recapture gives **1,312/0** but paints retained 04:41 despite 04:31 metadata, so no centering production outcome is established. See [v40 evidence](../progress-2026-09-24.md#health-home-launch-and-independent-phase-diagnostics--26-september-2026).

The [Health burst](../health-home-launch-motion-2026-09-26.md), recorded by Experience in `1fcde650`, fits four native screenshots at 04:44:03.531–04:44:06.567 to phases modulo 360 of **144, 204, 265, 326**, each with zero upper pixels above 2/255. Increments **60/61/61** across **1.001/1.016/1.019 seconds** are consistent with the existing approximately 59.826 Hz rate. A production browser follow-up at `9539e1c` captured each observed phase: all four raw upper/lower pairs have **0/0** pixels above 2/255 with empty masks and maximum delta 2. The saved native PNGs have valid lower pixels; the earlier transient black-buffer observation did not apply to these saved files. Each browser launch deliberately waited for the chosen phase. Filename timing is not a shared emulated event clock; visible half-cycle, capture latency and launch origin remain ambiguous. This supplemental set does not establish free-running browser motion, exact input or ±1-frame/audio acceptance and does not change the whole-scenario matrix status.

The `0ad8efd` production calendar replay now paints the requested Other Settings date and gives **17 upper / 0 lower** pixels above 2/255. Health Usage at live frame327 gives **0/146**, with all lower residuals in Back footer; Settings main calendar regression gives **171/20**, including 169 upper HUD phase pixels and two date pixels. All remain whole-scenario fail. Footer patch `734468d` is integrated but has no production recapture in this evidence set. See [v41 diagnostics](../progress-2026-09-24.md#calendar-replay-and-health-usage-production-comparisons--26-september-2026).

Latest diagnostics give Health Usage footer **0/22**, Other Settings bottom edge **9/0**, and HOME with an explicit HUD source pose **3,744/36,318** pixels above 2/255. Health scroll input mismatch gives **16,595/13,837** after one browser Down; two Downs align the article at 8px but retain **24,828/73**, with upper animation unphased. All whole scenarios fail. Capture-fitted text adaptation `b5543c4` awaits production recapture. See [v42 evidence](../progress-2026-09-24.md#footer-hud-and-scroll-production-diagnostics--26-september-2026).

Health Usage initial and 8px-scrolled frames each now have unmasked **0/0** pixels above 2/255, maximum delta 2; only their pixel tiers pass. Other Settings coverage-fit gives **2/0** and diagnostic HOME coin97 gives **3,563/36,071**. Native held/repeated Down versus two discrete browser clicks remains unmatched, and live frame8 does not resolve the source8/368 ambiguity or absolute timing. All whole scenarios fail. Capture endpoint requires a loopback-bound production start. See [v43 evidence](../progress-2026-09-24.md#scrolled-health-two-lcd-threshold-checkpoint--26-september-2026).

Fresh Sandisk-backed System Settings main capture and production browser pair at `ec2c14c` reproduce **0 upper / 20 lower** pixels above 2/255 with an empty mask. The browser was visibly on Settings before capture; an earlier accidental HOME capture was discarded. Azahar used Recent Files while the browser used HOME Settings → A, so input/motion/audio remain unmatched. The 20 lower coordinates reproduce the existing source gap; no unproven edge rounding was shipped. See [matrix v59 evidence](../progress-2026-09-24.md#sandisk-system-settings-main-production-pair--26-september-2026).

A fresh Sandisk Other Settings page 1 pair from the same production build has **0/0** pixels above 2/255, maximum delta 2, with an empty mask and inspected contact sheets. Native Azahar entered Settings from its game list while the browser entered from HOME, so this is static pixel-tier evidence only; the whole scenario remains fail. See [matrix v60 evidence](../progress-2026-09-24.md#sandisk-other-settings-page-1-production-pair--26-september-2026).

The next fresh Sandisk Other Settings page 2 pair has **0 upper / 3,558 lower**
pixels above 2/255 with an empty mask. The lower residual is concentrated in
the left page arrow (3,543 pixels); both contact sheets were inspected. This
pixel tier fails pending a source-supported arrow correction. Native mapped
touch I selected page 2; the browser used physical Right, so input, motion and
audio remain open. See [matrix v61 evidence](../progress-2026-09-24.md#sandisk-other-settings-page-2-production-pair--26-september-2026).

Fresh page 3 and 4 pairs extend that finding. Page 3 has **169 upper / 3,247
lower** pixels above 2/255; page 4 has **169 / 6,702**. Both upper residuals
are battery/clock phase. The left page arrow dominates both lower residuals,
and page 4 has a browser-only right page arrow. No mask was used. Both pairs
remain pixel-tier and whole-scenario failures. See [matrix v62 evidence](../progress-2026-09-24.md#sandisk-other-settings-pages-3-and-4-production-pairs--26-september-2026).

After integrating the source-backed adjacent-page and ScrollBg correction,
production-browser recaptures with numbered page-tab touches give page 2
**0/960**, page 3 **169/8**, and page 4 **169/35** upper/lower pixels above
2/255. All contact sheets were inspected without masks. The page-2 lower
left-edge overlap remains unresolved; page-3/4 upper differences are battery
and colon phase, and their lower rows retain small edge differences. All
pixel and whole-scenario statuses remain `fail` in [matrix v63](../progress-2026-09-24.md#integrated-other-settings-page-edge-recapture--26-september-2026).

Other Settings page1 now has an unmasked **0/0** pixel-threshold checkpoint at `1f7a854`, maximum delta 2, after source-sheet identity/order preservation. Diagnostic date 03:31:10Z at elapsed 12000 aligns the native sampled HUD state; literal screenshot time 03:31:13.302Z instead exposed 169 battery/colon phase pixels. This is pixel-tier acceptance only; navigation/input, motion and audio remain unresolved, so the whole scenario fails. See [v44 evidence](../progress-2026-09-24.md#other-settings-source-sheet-order-two-lcd-checkpoint--26-september-2026).
