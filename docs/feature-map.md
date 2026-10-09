# Feature map — 1:1 queue

9 October HOME release checkpoint: `44a060c` preserves two lower fade-terminal
receipts; `77de274` waits for the lower footer before classifying completion.
Three iPad first/repeat runs capture 326 pairs and two fresh native suspension
movies. Timing variability and native pixels remain unresolved; AN-01 through
AN-04 remain fail. See [release verification](home-pause-release-2026-10-09.md).

9 October Browser/Miiverse checkpoint: reviewed `5c5c5bb` adds the missing
firmware common incoming. Seven iPad normal/reduced and regression runs verify
1143 pairs/2286 PNGs; native movie ordering supports leftward belt clearing.
Timing gaps, exact input epochs, endpoint adaptations, pixel residuals and muted
audio remain open. AN-01 through AN-04 remain fail. See
[incoming verification](browser-miiverse-incoming-2026-10-09.md).

9 October Notes checkpoint: `855c079` removes the captured frozen cover by
honoring each supplied native pose. All 343 pairs, 686 PNGs, ten sheets and
four console views are checked. Shared Camera/Sound static baselines hold;
Camera's first live photo-loading frame remains an explicit residual.
Browser/Miiverse common SceneIn is committed in its worker and under review.
AN-01 through AN-04 remain fail. See
[Notes evidence](notes-supplied-pose-2026-10-09.md).

8 October Manual checkpoint: reviewed `a264973` retains elapsed sample time.
Final497pairs/994PNGs,16 sheets and6 consoles are audited/inspected. Camera
incoming is266.5/285.2ms; ready residual106/9 and Settings repeat terminal gap
remain. Notes cache fix `855c079` is integrated and under production regression.
AN-01 through AN-04 remain fail. See [Manual cadence](manual-elapsed-cadence-2026-10-08.md).

Earlier8 October incoming checkpoint: `c73f9fb` removes overlap starvation and
`a057600` retains elapsed rendering time. Friends incoming299.3/315.7ms and
Notifications312.9/329.1ms replace the intermediate540.1/558.0ms and
508.0/642.6ms intervals. All511 pairs/1022 PNGs pass independent audit;
23 final sheets and six console views are inspected. Native epochs, input,
pixels and muted audio remain open. Notes' pre-posed cache reuse is now a
captured defect, with a separate renderer worker; Manual elapsed timing is
the disjoint worker. AN-01 through AN-04 remain fail.
See [incoming cadence](applet-incoming-cadence-2026-10-08.md).

8 October common-cover checkpoint: `94696e5` improves but does not resolve the
captured slow opening. Reviewed `cbbee26` retains elapsed rendering time and
recaptures Friends at321.0/332.7ms instead of830.7/764.7ms. Friends normal,
reduced and Notifications regression complete six cycles without errors.
Source graphics are unchanged; title incoming, native epochs, pixels and audio
remain open. See [cover cadence](applet-cover-cadence-2026-10-08.md).

8 October upper HOME checkpoint: `f2c09f4` corrects the early status bar and
has 83/83 audited Mac production pairs. Fresh native comparison exposes early
card/camera hints and reversed retained-upper size progression. Corrections
`caeff9b` and `8abfd42` are reviewed and recaptured in normal81/82, reduced5/5
and compact Camera86/86 pairs without page errors. The corrected direction and
late card/hints are visible. Root114 focused/typecheck/build/shader checks pass.
Exact native timing, input and pixel residuals remain. All four whole animation
flows remain fail. See [the upper checkpoint](animation-fidelity-workflow-2026-10-07.md#home-upper-suspension-8-october).

8 October combined checkpoint: `b572961`/`d2a80ec` deliver the decoded lower
HOME pause transition and accepted-receipt snapshot lifetime. Runtime `1c58f50`
shows retained Health, HOME crossfade and footer last in first/repeat captures.
Upper HUD timing remains open. Manual incoming cadence is implemented; normal
Camera opening then revealed a reproducible outgoing clock stall. Reviewed
`a52bdfe` fixes it. Camera normal/reduced and Settings normal now reach Contents
in all six first/repeat cycles; native timing and 106/9 ready residual remain.
All 1360 corrected raw PNGs are independently checked and chronological sheets
are inspected. Next bounded runtime target is the early upper HOME HUD.
All four whole scenarios remain fail. The older helper preference is historical.
See the [combined checkpoint](animation-fidelity-workflow-2026-10-07.md#home-lower-delivery-and-manual-stall-8-october).

8 October HOME capture: native first/repeat and157 audited browser pairs expose
the missing outgoing lower-screen suspension transition. Browser shows HOME and
Close/Resume at frame0; native shrinks/darkens Health, crossfades HOME, then
reveals the footer. This is the next worker-owned correction. Upper HUD timing,
static residuals and exact native epochs remain open. All four scenarios fail.
See the [HOME capture checkpoint](animation-fidelity-workflow-2026-10-07.md#home-lower-transition-capture-8-october).

8 October folder correction: native first/repeat Sidecar movies revealed the
premature child cursor. `dbd3010` fixes the ordering; `1d0b8e4` removes the
folder-only render-count slowdown. Corrected normal/reduced first/repeat
production captures verify the visible change; all394 raw PNGs are checked.
Exact native timing, input parity, audio and existing pixel residuals remain
open. AN-01 through AN-04 still fail. Next is native HOME suspension motion,
then matched top-row/Manual motion. See the
[folder checkpoint](animation-fidelity-workflow-2026-10-07.md#folder-cursor-and-cadence-correction-8-october).

8 October approved incoming checkpoint: decoded Friends/Notifications packs and
live callers are integrated through `a8b06ca`. Sidecar testing caught and
verified the fix for a mixed-pack font conflict. All eight normal/reduced
first/repeat browser cycles complete without errors; typecheck/build pass.
Full tests have one missing historical Camera fixture failure. New silent
native Manual/Friends movies show the opening sequences, but they are not
matched frame-exact comparisons. A same-input Camera Manual run now reproduces
the known ready-screen106/9 pixel residual with an empty mask; no source change.
AN-01 through AN-04 remain fail. Native motion comparison remains next. See the
[approved incoming record](animation-fidelity-workflow-2026-10-07.md#approved-incoming-delivery-8-october).
Earlier pending approvals and quota stops below are historical.

8 October human resume revokes the historical quota threshold. New visual tests
must run on iPad Sidecar with muted audio. Reviewed collector1e58e04 now waits
for verified placement before loading the site. Portfolio compact pause has
two completed Sidecar cycles74/79 on unchanged runtime d392ae3; all306 raw
PNGs are checked and the chronological sheet is inspected. Only early frame9
is observed. Camera/Sound historical raw checks and sheets are now inspected.
All four whole animation scenarios remain fail. See the
[Sidecar checkpoint](animation-fidelity-workflow-2026-10-07.md#sidecar-only-testing-8-october).

8 October quota checkpoint: weekly allowance reached75% remaining, so the
user's stop instruction applies. Camera and Sound compact suspension each
completed two browser capture cycles. The reviewer checked all318 Camera raw
PNGs; Sound verification, sheet inspection and portfolio capture remain pending.
All four whole animation scenarios remain fail. STATUS has the paused restart.

7 October priority override: finish [AN-01 through AN-04](animation-fidelity-workflow-2026-10-07.md)
for top-row opening, Manual opening, folder entry and HOME suspension. GitHub
restart base is `5ee6fd7`; the historical static queue below is preserved.
All four motion flows are currently fail pending matched frame-sequence proof.

The 8 October human resume supersedes the historical blocked checkpoint below.
Newest collector `7404d7f` captures frame9 in both normal compact pause runs,
with stable Camera10 and retained Health. Independent reports check334 raw
PNGs, and the new chronological sheet is opened. Frames0..8, the full fade
and native activation/timing remain unproven. Runtime on3024 is unchanged.
All four whole scenarios remain fail; goal active,76% remaining, stop75%.
See [early coverage](animation-fidelity-workflow-2026-10-07.md#compact-early-coverage-checkpoint-8-october).

Current release recovery is integrated as `b7bb5c6`; corrected capture tooling
as `7451a9f`/`5e33943`. Replacement workers/reviews use GPT-6 Astra high.
Clean `d392ae3` on3024 passes focused198/198, typecheck/build, with the same
six full-suite failures. The trusted-key before run reproduces slot58 despite
an observed key-up. Fixed normal72/79 and reduced-mobile11 pairs retain
Camera10 and Health, without errors. Supporting checks cover all480 compact
raw PNGs. Both normal runs miss early appearance0..9; reduced is endpoint-only.
This proves the browser release correction, not the compact fade or native
1:1. All four whole scenarios fail. Goal active,77% remaining, pause75%.
See [the release checkpoint](animation-fidelity-workflow-2026-10-07.md#home-release-recovery-and-recapture-8-october).

Reviewed runtime `9a72454`/`c6f74ed`, caller `1308786` and fixtures `c658382` fix
compact pause opacity and stale released-folder lifetime. Clean production
`5386572` on3023 passes focused328/328, typecheck/build. Full2427 pass and six
pending-assets or historical failures remain recorded. Normal folder92/89 and
pause78/81, reduced mobile folder11/10 and pause5/5 pairs are checked and
console-inspected. No native animation pass follows. Compact before is invalid:
one ArrowRight after HOME continues from slot10 to58 after the tap. The release
worker now owns that concrete defect; no same-premise retry before a fix.
Decoded export remains separately pending. See [compact pause](home-pause-compact-entry-2026-10-08.md)
and [folder lifetime](workstream-handoffs/animation-folder-motion-20261008.md).
Goal active, weekly78%, pause75%.

Manual later-window attempt at `b78ee5c` aborts at its reviewed complete-cover
gate. One healthy selected-Camera baseline `cd0be885` and one actual Manual
touch precede a single partial translucent-cover AX/image. No batch, retry,
browser or comparison is performed; incoming/Contents selectors remain null.
Session31843 exits0 and current global/custom restore byte-exact. Runtime,
assets and served16e2067 are unchanged. This does not improve animation fidelity.
All four flows fail; weekly79%, stop75%. See [the gate abort](animation-fidelity-workflow-2026-10-07.md#manual-later-window-gate-abort---8-october-2026).
Checked closeout `0029b897` verifies the sole baseline and exact restoration.
Bounded census `0ec8c5aa` finds no incoming/ready in the prior Notes/Manual
bursts and only closed-root folder output. It does not justify another
same-premise burst or prove capture impossible; HOME remains unknown there.
Independent review finds no authorized meaningful runtime task. Goal is
checkpointed blocked pending human export approval or a supported different
native capture method, with79% remaining; the75% stop rule is not triggered.
Whole-scenario animation status remains fail, not pass.

Latest folder capability run at `e3ee6a5` does not demonstrate native A opening.
Reviewed plan, fresh six-row empty-slot creation and healthy selected-folder
baseline precede one original `a` plus32 Command-P calls. Index `a71ae71c` checks
22 surviving PNGs,23 saves/10 ignores and one lost overwritten version; all
survivors show the closed folder. Sheet and original endpoint are opened.
Browser/comparison are null, with no fallback or runtime/build change. Session
exits0; screenshot field restores, two Qt geometry differences remain and
current global is`ccd30d00`. Isolated HOME/NAND test-folder creation is explicit.
Do not repeat the short-A route. All four flows still fail; weekly79% at closeout, stop75%.
See [the capability record](animation-fidelity-workflow-2026-10-07.md#original-a-folder-capability-capture---8-october-2026).

Latest8 October Camera Manual checkpoint at `df4856a`: fresh selected-Camera
baseline and one actual Manual touch capture partial outgoing6 and complete
cover7, but no incoming/ready native stage. Index `8163500d` preserves19 PNGs,
19 saves/14 ignores, no lost versions and one noise readback. Browser174 pairs
reach Contents without errors; report `4a072d14` checks all348 raw PNGs and
paired receipts. Fixed native7/browser59 static report `89a71998` gives0/0 above
delta2 with an empty mask, maxima1/2; sheets/console opened. Session ends134,
process absent; owned screenshot field restores, two GUI geometry changes remain
explicit at current global`ffab8532`. No runtime/assets/build change or whole-flow
acceptance. Weekly80% remaining; stop75%. See [the Manual capture](animation-fidelity-workflow-2026-10-07.md#camera-manual-keyboard-capture-8-october-2026).

Newer 8 October capture checkpoint at `08ef2ac`: a reviewed raised-window
Command-P diagnostic establishes own-PNG delivery. Index `2ac33ab0` keeps22
surviving PNGs,24 save events, two lost versions and nine ignored overlaps;
request timing is not native cadence. One bounded Notes touch/Open run captures
partial outgoing poses and a healthy complete cover, but no incoming clear or
ready destination. Index `0bc137d5` preserves17 PNGs, including three unusable
readbacks. Fixed native7/browser52 comparison `91ce8906` gives0/0 above delta2
with an empty mask; both sheets are opened. Normal browser capture125 pairs
reaches readiness without errors. This is static cover evidence, not animation
acceptance. Supporting report `629f3771` checks all250 raw LCD PNGs and125
matching valid receipts, with no orphans. Runtime/assets/build/caller WIP are unchanged; both native sessions
exit0 with exact profile restoration. All four whole flows fail. Weekly
remaining80%; stop75%. See [the keyboard checkpoint](animation-fidelity-workflow-2026-10-07.md#raised-window-keyboard-capture-8-october-2026).

Earlier capture transport trial at `8b7fe61` is incomplete: the existing Manual
movie enters Health in the current profile, and `ctrl+p` produces no own PNG.
The actual menu command produces one valid Health still, not opening motion.
Root closes the process and restores the temporary screenshot path exactly.
No repository runtime/build/browser or public asset change; all four scenarios still fail.
Original closeout `0e94593d` and additive provenance `f57a5f69` distinguish
verified file identities from UI/process attestations. No Manual retry or
repeated closed source audit is scheduled. See
[the trial record](animation-fidelity-workflow-2026-10-07.md#existing-ctm-capture-transport-trial-8-october-2026).

Notifications touch-only follow-up `904ab3db` preserves all but eight A bytes;
helper11/11 and independent byte review pass. Native index `b7f0f21` has one
Health-selected baseline and17 later Notifications-selected idle PNGs, all18
decoded400x480 and sheet-inspected. The52second gap misses motion; early Quit
also fails before completion. Actual config bytes restore exactly after exit.
No low-latency path or opening-animation acceptance is established. Both trials
are closed; no further late CTM burst or repeated closed audit is scheduled.
Run supplement `53856090` separates checked derivative identities from the
coordinator-attested launch and sheet interpretation; no native run identity
or motion epoch is inferred from the shared movie header ID.

Latest 8 October Manual checkpoint: guarded Contents-only `PageTitleNumB02`
visibility correction `dcdefc9` is integrated and served from `16e2067` on
3022. The original constructor clears that pane's visibility bit; no asset,
geometry, glyph or clock was changed. Nine muted entry cycles and two actual
Page round-trips produce 1,653 valid pairs / 3,306 checked raw PNGs. All 13
console views and 12 fixed comparison sheets were opened. Both unchanged
Camera ready diagnostics improve 106/23 to 106/9, empty mask / delta 2.
Upper bytes are unchanged; lower row1/row2/footer residuals are now 3/0/6,
with no added mismatches. Coordinate attribution is not native GPU execution.
Cover 0/0 and incoming 11,520/74,829 are unchanged. Root full tests pass 2,444;
isolated full tests pass 2,382, each retaining the historical Camera PNG
failure. Ordinary typecheck and isolated build pass. Whole motion/input/audio
acceptance remains open. Sidecar `6d37dfdf` pins 36 identities and rehashes
the 19 unchanged mapped assets. Weekly remaining is 81%; pause at 75%. No further
upper/lower source-only audit or fitted geometry is authorized. See
[the visibility checkpoint](animation-fidelity-workflow-2026-10-07.md#manual-contents-decoration-visibility)
for source identity, captures, failures and remaining dependencies.

Earlier 8 October Manual checkpoint: reviewed number, header and footer corrections
integrate through `0a6e205`, after the title-row correction and caller guards.
Port 3022 serves reviewed `43b0780`, build `6_xvB78tkOAgNJilSVLa5`, excluding
pending incoming assets/caller WIP. Existing model LFS bytes are unchanged.
Nine entry cycles yield 1,557 valid paired paints/3,114 decoded raw PNGs; both
Settings/Browser Page round-trips yield 127 pairs/254 PNGs and exact lower hash
closure. No browser errors. Both fixed Camera ready diagnostics improve from
446/368 to 106/23, empty mask/delta 2. Upper icon/indicator bands are 60/46;
lower row1/row2/footer bands are 11/6/6. Other bands stay 0. Complete cover
0/0 holds, while incoming 11,520/74,829 remains mismatched and unaligned.
Root full tests pass 2,441 with one historical Camera PNG failure/98 skips/one
TODO; isolated build has 2,379 passes with the same failure/96 skips/one TODO.
Typecheck/build pass. Static and browser evidence do not pass any whole flow.
Weekly remaining is 83% at this checkpoint; stop and pause at 75%. Next are
bounded source checks of the remaining edge regions and unresolved native
input/LCD clocks, not fitted phases or repeated late native bursts. See the
[combined Manual checkpoint](animation-fidelity-workflow-2026-10-07.md#manual-number-header-and-footer-corrections).

Earlier supporting checkpoint `2431ed5`: reviewed optional held-HOME collector
and type-only receipt fix are integrated. Private full tests pass 2,410 with
the unchanged missing historical Camera PNG failure, 98 skips and one TODO.
Clean worker typecheck/build pass; root caller WIP remains unstaged/unserved.
Physical, keyboard, default-tap and reduced-mobile repeats produce 481 valid
paired raw captures with no page errors. Fixed held-HOME pause pairs still
differ by17638/37574 and12510/37690, with empty masks. Native measured hold and
entry epochs are unknown. The shorter native burst captured only settled HOME.
Manual's exact private executable is now recovered and its original row
writer is independently traced. A guarded common-Contents row-only sampler
candidate is under implementation/review, then visible verification from a
separate served98342a8-based worktree. No fitted phase/cursor change or pending
incoming asset export is authorized. Stop and pause the goal when weekly
allowance remaining reaches75%. See
[recorded holds](animation-fidelity-workflow-2026-10-07.md#recorded-browser-home-holds).
Earlier checkpoints below remain historical evidence.

Incoming preparation: reviewed controller `df1da09` integrates as `aab39d7`,
and source-only publisher/proof `363aee7` as `c08406d`. Private-fixture helper
`72d88ef` integrates as `c771cff`; reviewed material/picture-closure correction
`d63dcf1` integrates as `940f4af`. All 37 source mutations per title now reject
before either LCD draws. The incoming labels use
the source-proven plain-text writer, not the RI named-style metrics branch.
Current private full suite: 2,392 pass, one unchanged historical Camera PNG
failure, 98 skip and one TODO; typechecking passes. Combined checks pass 104
with two publication-only skips. Controller/live-render and affected checks
pass 45 and 55 separately. Composition remains unstaged and unserved.
Public asset export is pending explicit user approval after tool review rejected
it. Private fixture checks do not establish delivery or visible/native fidelity.
The preview remains on `98342a8`. Separate-window native touch is recovered.
Normal-speed Manual, Notifications and folder captures now exist. Manual's
full cover matches both browser cycles at threshold2 with an empty mask;
incoming diagnostic pairs differ by11520 upper/74833 lower pixels and ready
Contents by446/1038. The new folder panel-completion diagnostic differs
by37226/8007. Native corruption and Manual clear-before-partial ordering remain
explicit; no phase/epoch repair or timing acceptance is claimed. Native upper
exposure before lower-belt clearing does not prove separate LCD clocks.
Earlier mapped HOME/A taps left Health unchanged and remain input diagnostics.
The later held-HOME run dismisses a hidden startup warning, launches Health,
suspends, resumes and suspends again. Its56 own PNGs establish the route, not
entry cadence. Production pause79/82 pairs are error-free. Predeclared settled
pause comparisons differ by17487/37604 and12408/37748 above delta2, with empty
masks. Requested native hold500ms is not measured native input duration; the
browser comparison used a click. No fixed cursor defect or source-proven
Manual sampling correction emerged from the bounded audits. Next is recorded
held-input browser collection and native entry recapture, not a fitted fix.
[Held-HOME evidence](animation-fidelity-workflow-2026-10-07.md#held-home-recovery-and-fixed-pause-diagnostics).
[Recovered touch and fixed comparisons](animation-fidelity-workflow-2026-10-07.md#native-touch-recovery-and-fixed-stage-diagnostics).
[Current preparation boundary](animation-fidelity-workflow-2026-10-07.md#incoming-plain-label-preparation).

Latest runtime `98342a8`, collector `9882f97`: original HOME suspended-window
Appear0..10 is now visible on first pause and re-entry. Stock Health/Camera/
Sound and portfolio Work retain exact owners and all normal pause poses0..20;
reduced captures publish terminal20. Seven fresh-pair two-cycle pause replays
and four affected regressions are error-free. Sixteen console views and the
first/repeat raw pause sheet are inspected. Full2457 tests:2359 pass,1 unchanged
historical Camera PNG failure,96 skip,1 TODO; typecheck/build pass at98342a8.
The portfolio native-status precondition is correctly inactive, not fake-ready.
The earlier invalid Work collector attempt stays preserved.

Corrected Notifications source order is NewsUnread500 -> HUD100 -> cover3;
activation/visibility and independent LCD phases remain open. Friends original
incoming cover/writer is identified, but native first-use help/no-Mii differs
from the existing own-card portfolio adaptation. These source gaps are reviewed.
Next visible slice publishes the two original title-specific incoming pairs and
adds receipt-guarded browser sequencing, without redesigning destination screens
or claiming native phase-lock. [Current pause and incoming evidence](animation-fidelity-workflow-2026-10-07.md#pause-window-and-title-owned-incoming-boundaries).
All four whole animation scenarios still fail; muted audio is unverified.

Earlier runtime `8558a1e`: reviewed outgoing top-row covers and folder child-host
gates are integrated. Folder repeat now visibly shrinks the retained root,
shows the blank interval and grows the child through its original producer;
it no longer reveals an already-grown child. Full2341 tests pass,1 historical
Camera PNG fixture fails,96 skip,1 TODO; typecheck/build pass. Desktop folder
88/91 pairs, reduced mobile11/10/12, physical-HOME Health80/83, reduced Camera
Manual70/71 and Notes118/119 complete without errors. All five accessibility
shortcuts reach their exact destination and paired readiness; those shortcuts
remain an explicit browser adaptation. Ten console views are inspected.

Declared first complete outgoing covers at runtime18d3fa3, empty masks, U/L:
Notes0/0, Friends0/17, Notifications0/0, Browser0/5, Miiverse0/0. All ten LCD
sheets are inspected; these are static diagnostics, not native timing proof.
Latest strict repeat folder lower16 is57578/7606 against the immutable native
reference; both sheets are inspected. Native motion order/epochs, title-owned
incoming covers and exact HOME-hold input remain open. Notifications incoming
draw/start order and suspended-window entry tracks were that checkpoint's source
boundaries. [Current evidence](animation-fidelity-workflow-2026-10-07.md#outgoing-covers-and-folder-child-host-gates)
records identities, adaptations and next work. Earlier checkpoints follow.

Animation runtime `2169497`: Notes source boot-cover and no-software body are
visible; folder/pause receipt guards are integrated. Empty-mask diagnostics:
Notes complete cover0/0, first-ready9198/46427; folder re-entry first terminal
61126/7478; Camera Manual baseline endpoint446/1038. None passes the scenario.
Manual runtime `127da97` now has the source outgoing/hold/incoming cover.
Opaque-cover static diagnostic0/0; first-ready446/1038 is unchanged. Camera
and Settings desktop repeat captures reach ready, but the first reduced-mobile
Camera run exposed mixed-clock recovery. All motion flows remain fail.
Runtime `61f8b4e` fixes that clock regression and integrates the source Notes
HUD. Repeated normal/reduced mobile Manual and Notes, Settings Manual, folder
tile and physical-HOME browser captures complete without recovery. Notes
first-ready diagnostic is now1263/46427; upper residual is live HUD state,
lower empty-thumbnail brightness remains. Full tests2260 pass,1 historical
Camera PNG failure,96 skip,1 TODO; typecheck/build pass.
Next: source-derived empty Notes thumbnail binding, folder upper-banner
terminal receipt, and remaining top-row common-cover callers. Exact native
input epochs, timing and muted audio remain unverified.
Reviewed source thumbnail runtime `19ee552` is now recaptured: first-ready
1039/731, empty mask, down from46427 lower pixels. Tile interiors match;
footer edge/text and live HUD state remain. Full2266 pass,1 historical PNG
failure,96 skip,1 TODO; typecheck/build and6 source Python tests pass.
Normal native Manual140 own PNGs reproduce cover0/0 and endpoint446/1038;
Notifications94 own PNGs now show the missing outgoing-HOME common cover.
Reviewed folder retention is integrated in0128f2f, served52af0c5. Strict
repeat lower16 comparison57712/7602 keeps the root banner visible, but native
shrink-out/pose/background phase remain. Full2285 pass,1 historical PNG
failure; typecheck/build pass. Notes/Manual/physical-HOME regressions are
error-free. Reviewed e574778 binds fixture readiness to a later same-owner
WebGL root receipt; earlier race-limited setup records stay preserved.
Reviewed top-row source selectors are integrated07c9f2c; runtime outgoing
cover wiring and retained folder source hide are assigned in separate worktrees.
Friends128 own PNGs show entry before the native service-error boundary.
Historical next at52af0c5 was outgoing common cover and folder hide; those
corrections are now integrated and recaptured above. Exact motion epochs and
muted audio remain unaccepted.
See [the current evidence and limitations](animation-fidelity-workflow-2026-10-07.md#integrated-corrections-and-recapture).

6 October 2026. Checkout `f53fbeef` (`codex/home-fidelity-20261001`). This index is the queue. Evidence: [leftover queue](feature-map/leftover-queue-2026-10-05.md), [STATUS.md](../STATUS.md), [progress](progress-2026-09-24.md). If they disagree, evidence wins.

Pixel-tier **0/0 is not pass**. Whole scenarios still **fail** on input, motion, and audio unless a row says otherwise. Tests, source renders, and browser inspection are not acceptance.

**LIVE-AZAHAR:** isolated copy `/Volumes/Sandisk1/3ds-portfolio-azahar-isolated-20260926` (Static 2 / Null 1 / Vulkan 2). Nintendo Zone skipped. Do not A on Activity Log / excluded titles. Never `/Applications/Azahar.app`.

Pick the first unmatched **Next** row, then any in-scope surface whose gap is `fail` and whose pair is usable. Closed leftover-§5 labels (Sound upper 316, y=177, Camera plus-tint, Settings Other HUD 169) stay in evidence, not this queue.

## Next

| # | Slice | Evidence | Seat |
| ---: | --- | --- | --- |
| 1 | Browser HUD fade **1200 → 0**; chrome **81** | leftover + review **APPROVE-WITH-NITS**: `LoadingIconW` wait-dots at `LoadingIconPos`. Unpublished. Do not guess-paint. Phase mask after attach | Closed leftover |
| 2 | Health Usage **0 / 0** at `lcdHealthFrame=327` | leftover + review **APPROVE-WITH-NITS**; coordinator recapture `/Volumes/Sandisk1/3ds-fidelity-artifacts/health-usage-frame327-20261005/` report `7b8ea2c2…` max 2. Receipt `healthTopLoopFrame=327`. Pixel-tier 0/0 is not pass | Closed leftover. Input/motion/audio open |
| 3 | HOME Design **42073 / 9581** | leftover [REJECT](/Users/paramveer/.codex/worktrees/home-design-9581-review-20261005/docs/home-design-9581-review-2026-10-05.md) then [revised](/Users/paramveer/.codex/worktrees/home-design-9581-20261005/docs/home-design-9581-2026-10-05.md) + [re-review](/Users/paramveer/.codex/worktrees/home-design-9581-rereview-20261005/docs/home-design-9581-rereview-2026-10-05.md) **APPROVE-WITH-NITS**: HOME backing, `PtCsr_00` corners, Brightness state. No unique pane. Upper wallpaper/HUD epoch | Closed leftover |
| 4 | Browser Manual footer **1684** | leftover + [review](/Users/paramveer/.codex/worktrees/browser-manual-1684-review-20261005/docs/browser-manual-1684-review-2026-10-05.md) **APPROVE-WITH-NITS**: footer AA. Page-path omits `ScrollIndicator` **894** (native teal 4×149; do not size from 6×151). Close 40-px hairline is edge, not glyph AA | Closed leftover |
| 5 | Owed recaptures | leftover §3: Settings Manual p0 `d0ecf020` recaptured **2543 / 1821** title ROI **332→0**. Entry banner `7b773b71` browser frames collected `/Volumes/Sandisk1/3ds-fidelity-artifacts/home-entry-banner-20261005/run/` (26 pairs; homeUpdateDelta **17** at frame-008). Native N057 `17d3ecc0…` not on volume; pixel box still owed. Remaining: post-`8dc72ac6` regressions | Coordinator |
| 6 | HOME 1:1 + incomplete animations | Idle pair **23182 / 14754** holds. Compact H-12 **30032 / 47436**. U19 STOP `2b384723` + U19R **APPROVE** `421ed134` ([note](home-compact-h12-2026-10-06.md) / [review](home-compact-h12-review-2026-10-06.md)). N057 box owed | Coordinator |
| 7 | Settings Internet / Data / Parental pairs | Re-dated to native screenshot time (HUD now matches): Internet settled **169 / 1008**, Data root **14 / 177**, Software empty **6 / 22** after U24 `SD Card` lcd sampling `22490950` ([note](settings-sdcard-label-2026-10-06.md), [review](settings-sdcard-label-review-2026-10-06.md) **APPROVE-WITH-NITS**), Parental intro **169 / 0**, Other p1 **117 / 0** (`settings-title-sampling-20261006/*-dated/`). Undated: Internet **1405 / 1008**, Data **1388 / 177**, Software **1939 / 22**, Parental **1414 / 0** after U22 title centre `1cb43fe2` + U23 title LCD sampling `73db7a2b` ([note](settings-title-sampling-2026-10-06.md), [review](settings-title-sampling-review-2026-10-06.md); `settings-title-sampling-20261006/`, title ROI 0/14/0/0; upper rest ≈ HUD). Earlier U22 ([note](settings-title-centre-2026-10-06.md), [review](settings-title-centre-review-2026-10-06.md) **APPROVE-WITH-NITS**; `settings-title-centre-20261006/`). U23 shares Other's `lcd` + `azahar-12p4-fit` title raster on every Settings `CommonBG_U_00` ([note](settings-title-sampling-2026-10-06.md)); offline title ROI **1896/1007/1256/796 → 0/14/0/0**. Coordinator recapture owed. Earlier U21 [data-root state](settings-data-root-state-2026-10-06.md) ([review](settings-data-root-state-review-2026-10-06.md) **APPROVE-WITH-NITS**); recapture `settings-data-root-state-20261006/`. Software empty **6011 / 22** after U20 `c579683b` (number ROI **841→0**; title group left-pinned vs centred → U22). Parental intro **4595 / 0**. NNID unsigned-in native `cc610faa…`. Extra Data **6989 / 51927**. Health General **0 / 0** at `lcdHealthFrame=252` (pixel-threshold-pass). Health General held-down **24904 / 19206**. Transfer **22816 / 76797** (eShop-required vs 3DS/DSi; labelled adaptation). Exact Other p1 official **217 / 0**. Browser HOME→Open is System Update gate `e8562da9…` (**blocked**, update excluded). Remaining §4: Camera folder native / empty browse (six-cell **94661 / 16898**; shoot reached, View Photos/AX blocked), Sound guide p2/p3 native (splash hang), Notifications scroll native, Notes editor native vs `50cb7097…` / `33daea28…`, Friends card native vs `04afa1ba…` / `4c78b5cb…` | Coordinator |

## In-scope surfaces

| Surface | Native pair? | Pixel U / L | Input | Motion | Audio | Gap | Next slice |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| HOME idle | yes (Health 1-row left-anchor) | 23182 / 14754 | fail | fail | fail | fail | official `_06.10.26_13.55.03.154.png` `ebbc2743…` vs raw LCDs `441d366d…` / `656f808f…`; empty mask; native vacant vs Settings; HUD clock/battery. Not pass |
| HOME 1-row (yaw 304) | yes | 190 / 5426 | fail | fail | fail | fail | U17 leftover **APPROVE**: no unused idle pane (`LncCsr_00` already bound). Tail labelled. Still fail |
| HOME Design | yes | 42073 / 9581 | fail | fail | fail | fail | Next #3 leftover APPROVE-WITH-NITS; owed matched HOME backing / cursor / brightness / wallpaper |
| HOME entry banner | browser frames only | none | fail | fail | fail | adaptation | U16 leftover **APPROVE**: no unique writer (`0x1fa344` shared). Footer-14 capture-fit. N057 pixel box still owed |
| HOME compact H-12 | yes (Health sleep + Camera) | 30032 / 47436 | fail | fail | fail | fail | official `93058283…` vs `b368f61d…` / `ac6485d2…`; native compact Health vs browser Camera banner; 2-row/Mii vs 1-row Settings-right. Settings half `8d1b17ab…` / `50d721ec…` kept |
| Power / launch | partial | none whole | fail | fail | fail | fail | timing / audio; durations adapted |
| Settings main | yes | 0 / 20 | fail | fail | fail | fail | labelled; not pass |
| Settings Other p1 | yes | 117 / 0 | fail | fail | fail | fail | official `_06.10.26_15.43.46.991.png` `98d0fc9d…` vs `96ae87a2…` / `809e0f98…`; lower 0; upper **217** HUD clock/battery. Held 0/0 vs older `424ffb45…` remains. Not pass |
| Settings Other p2 | yes | 0 / 960 | fail | fail | fail | fail | overlap source-gap |
| Settings Other p3 | yes | 169 / 8 | fail | fail | fail | fail | HUD 169 labelled |
| Settings Other p4 | yes | 169 / 35 | fail | fail | fail | fail | HUD 169 labelled |
| Settings Internet | yes (settled after first-run OK) | 169 / 1008 | fail | fail | fail | fail | official `f0c5d093…` vs `f9b85092…` / `f9d2a956…`; HUD clock + unfocused blue vs selected yellow + native helper face. U21 unfocused entry recaptured: lower **24076→1008** (native first-run helper face + AA), report `981e35ee…`. First-run helper kept `9fbcbb5c…` **95922 / 76800**. U23 predicted title ROI **1256→0**. Not pass |
| Settings Parental | yes (intro Back/Set) | 169 / 0 | fail | fail | fail | fail | official `98fb3d62…` vs `b0829071…` / `b571493f…`; lower 0; upper HUD/title. No PIN. U23 predicted title ROI **796→0**. Not pass |
| Settings Data | yes (root + Software empty) | 14 / 177 and 6 / 22 | fail | fail | fail | fail | root `686d3dfb…` **4956 / 177** after U21 empty Reset `B_L_Invalid` + unfocused entry (lower **20096→177** AA, report `50fd454f…`). Software empty `9c5cb75c…` vs `21608571…` / `379919e6…` **6011 / 22** report `86cce230…` after U20 dump `TextBox_05` bind of portfolio fixture `65,536` ([note](settings-open-blocks-2026-10-06.md), [review](settings-open-blocks-review-2026-10-06.md) **APPROVE-WITH-NITS**); number ROI **0**. Title group centred (U22); U23 predicted title ROI Software **1896→0**, Data **1007→0–14**. Extra Data still has native `?` row |
| Settings Manual p0 | yes (reconstructed native) | 2543 / 1821 | fail | fail | fail | fail | leftover U11 + U11R **APPROVE-WITH-NITS**: title ROI 0; unique unused ScrollIndicator 858; remaining already-bound AA. Not pass |
| Settings NNID / Transfer | yes | Transfer 22816 / 76797 and NNID 82096 / 74907 | fail | fail | fail | fail | Transfer official `01ff4af3…` vs `0e531310…` / `b1d9a863…`; native eShop-required vs portfolio 3DS/DSi. NNID official `cc610faa…` vs `6ea86f3a…` / `c1a5b348…` **82096 / 74907** report `6ca33395…` (`settings-nnid-20261006/`). Native Sign in chrome vs portfolio Account-services-unavailable. Labelled adaptation. Do not paint / Sign in / launch eShop |
| Health Usage | yes | 0 / 0 | fail | fail | fail | fail | Next #2 pixel-tier 0/0 at frame 327; not pass |
| Health General / articles | yes (article top) | 0 / 0 | fail | fail | fail | fail | official `c63b1153…` vs `bfdf9da2…` / `1d829435…` at `lcdHealthFrame=252` **pixel-threshold-pass** max Δ2 (`health-general-frame-sweep-20261006/`, report `f6d1afbb…`). Was 23993 (TopLoop frame 15). Held-down **0 / 19206** at `lcdHealthFrame=292` (`health-held-down-frame-sweep-20261006/`, report `3743d387…`; lower = native held-key scroll lands between browser tap steps — needs controlled-hold native capture). Static tier only |
| Camera browse p1 | yes | 33522 / 7491 | fail | fail | fail | fail | labelled interiors; date/slider remain |
| Camera Welcome p1 | yes | 0 / 1401 | fail | fail | fail | fail | perimeter 1401 |
| Camera Welcome p2 | mismatch | 93408 / — | — | — | — | blocked | leftover §5 #6; LIVE-AZAHAR ☐ |
| Camera Welcome p3 | yes | 7615 / 2479 | fail | fail | fail | fail | TxtDlg 1078 |
| Camera Welcome p4 | yes | 7615 / 2093 | fail | fail | fail | fail | TxtDlg 692 |
| Camera Welcome p5 | yes | 7615 / 1401 | fail | fail | fail | source-gap | live-feed APPROVE |
| Camera folder / empty / full / paging | six-cell yes; folder native owed | 94661 / 16898 | fail | fail | fail | fail | six-cell official `_06.10.26_16.19.55.191.png` `7f67f64b…` vs `d6086990…` / `1649ce00…` **94661 / 16898** report `7194813a…` (`camera-folder-20261006/`). Native date-group + 3 thumbs vs browser 6-photo grid. Folder list browser kept; native folder / empty browse still owed |
| Sound first-run | yes | 6094 / 6072 | fail | fail | fail | fail | perimeter 6072 |
| Sound empty-entry | yes | 6222 / 7216 | fail | fail | fail | fail | labelled leftovers |
| Sound guide p2 / p3 | no | none | fail | fail | fail | fail | leftover §4 pair |
| Sound supplied-song playback | no | none | — | — | — | blocked | no user songs |
| eShop | yes | 44880 / 76486 | fail | fail | fail | fail | leftover + review **APPROVE-WITH-NITS**: NNID vs welcome scene-mismatch; HUD 194 phase; welcome source-gap (account). Do not paint |
| Nintendo Zone | browser only | none | fail | fail | fail | fail | **skipped** (user). Browser half `0697ac09…` / `76af1ed7…`; `semanticRouteMatched=false`. Native `0000000d.app` not this leftover |
| Game Notes | yes | 89343 / 76679 | fail | fail | fail | fail | leftover U13B + U13R2 **APPROVE**: tutorial vs Note 1 **89343 / 76679** and empty-grid `0f1f7eb5…` **90386 / 46427**. Scene-mismatch. Do not paint |
| Friends | yes | 95998 / 40951 | fail | fail | fail | fail | leftover U12 + U12R **APPROVE-WITH-NITS**: scene-mismatch Error 002-0121 vs Friend List card. Post-OK no-Mii `0dbe3669…` is excluded Mii Maker, not an empty own-card. Do not paint |
| Notifications unread-dot | yes | 0 / 0 | fail | fail | fail | fail | held; not pass |
| Notifications scroll / detail | no | none | fail | fail | fail | fail | leftover §4 pair |
| Internet Browser HUD | yes | 81 / — | fail | fail | fail | fail | Next #1 leftover U08; fade 1200 closed |
| Internet Browser Manual p0 | yes | 2154 / 2430 | fail | fail | fail | fail | Next #4 leftover APPROVE-WITH-NITS; page-path omits ScrollIndicator 894 |
| Internet Browser start menu | native-only (update gate) | none usable | fail | fail | fail | blocked | HOME toolbar `(189,16)` → Open is official `_06.10.26_15.37.10.852.png` `e8562da9…` System Update required. Not start menu. Update excluded. Welcome pair still mismatch |
| Miiverse | yes | 96000 / 30822 | fail | fail | fail | fail | leftover + review **APPROVE-WITH-NITS**: 022-5362 vs Communities; empty interior source-gap. Close-frame upper body 0 vs browser. Do not paint error |
| amiibo opening | no | none | — | — | — | blocked | no in-scope caller |
| Work | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| Side Projects | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| Hobbies | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| Life | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| HackUK | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| NVIDIA / Renu | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| About | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| Contact | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |

HUD charging (HOME / Settings / Notifications / eShop / Zone / Sound) is a declared reference-session **adaptation**, not a live telemetry pass. See [scope](portfolio-ui-scope.md).

## Excluded (not backlog)

Software Keyboard · Activity Log · Download Play · Mii Maker · StreetPass Mii Plaza · AR Games · Face Raiders.

Remote web, network, account, PIN, capture, and microphone stay out. Internal helpers do not get invented HOME tiles.

## Also

| Doc | Use |
| --- | --- |
| [leftover queue](feature-map/leftover-queue-2026-10-05.md) | Residual counts, owed recaptures, missing pairs |
| [leftover log 5 Oct](feature-map/history-2026-10-05.md) | Archived diary; not the queue |
| [design-to-ship](feature-map/design-to-ship.md) | Implemented vs missing UI |
| [HOME / lifecycle](feature-map/home-and-lifecycle.md) · [Settings / services](feature-map/system-and-online-apps.md) · [media / social / portfolio](feature-map/media-social-and-portfolio.md) | Route inventories |
| [progress](progress-2026-09-24.md) · [verification](architecture/verification.md) · [workstreams](feature-map/workstreams.md) | Evidence and owners |
