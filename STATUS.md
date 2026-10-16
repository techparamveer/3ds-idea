# STATUS: animation fidelity

## Checkout

Reconciled HEAD: `216e964` plus this evidence commit (git wins).
Git wins if this differs from HEAD. Reconcile before another slice or worker.
Keep this file current, not append-only.

Coordinator checkout:
`/Users/paramveer/.codex/worktrees/applet-alpha-retention-20261015/3ds-idea`
on `codex/applet-alpha-retention-20261015`. Its Git object database is
`/Volumes/DeveloperStorage/GitHub/3ds-idea/.git`. Do not work in the original
checkout. Create new source worktrees from this coordinator HEAD.

Draft [PR #7](https://github.com/techparamveer/3ds-idea/pull/7) uses remote
branch `codex/animation-fidelity-20261007`. Latest verified pushed SHA is
`8eb24f9` (nine-unread fixture `05dc0d1` and lamp epoch `8eb24f9` integrated). Review coherent changes, stage
explicit paths and push normally. Do not merge, deploy, reset or clean.

Preserve the human edit in
`/Users/paramveer/.codex/worktrees/3ds-animation-fidelity-20261007/3ds-idea/src/os/system.ts`.
Its last verified SHA-256 is
`c627fd3fc6e02e06267390fc2e23b9e9223255a0a4bad73f18b2d2d5a8936c82`.
Do not stage it or edit another worktree.

## Product

Show only the sourced 2012 Silver + Black Nintendo 3DS XL, SPR-001, and its
background. Preserve its leftward spin, lid, physical controls, touchscreen
and existing portfolio apps, including the merged Hack LDN 2025 addition.
Native target is EUR 10.7.0-32E, original hardware mode, English. Follow
[UI scope](docs/portfolio-ui-scope.md).

The active goal covers HOME top-row opening/Close/return, Manual entry/Close,
folder entry/exit, and HOME suspend/Resume. Moving/reordering/pickup animation
work is excluded. All four whole flows remain **fail/unproven**.

Done means matched ordinary inputs, pinned decrypted firmware sources,
isolated Azahar own 400x480 PNGs versus raw browser 400x240 / 320x240 LCDs,
named hashed pairs, justified masks, inspected diffs and recapture of fixes.
Tests, source renders, browser regression matches or scaled H264 movies alone
cannot establish whole native motion, input or cadence. Follow
[verification](docs/architecture/verification.md).

No guessed native graphics, community fonts or audio. Keep element-to-manifest
provenance; unsupported selected resources fail explicitly. Portfolio content,
read-only Camera fixtures, first-use differences, font-resolution uncertainty,
selected-first return population and other documented compositor/timing fits
remain adaptations or gaps. Muted audio acceptance is unverified.

## Seats and usage

16 October handover: the Codex plan ended and the Codex coordinator thread
`01a0f8e9` can no longer run. Claude Opus 5.5 in Claude Code is now the sole
coordinator, continuing from this file. Codex helpers (GPT-5.6/6.1 Sol) are
unavailable; use Claude subagents for workers and a different-model reviewer
where available. The Codex weekly-usage heartbeat no longer applies.
On handover, root reran the PR head 7e4c337: 2,996 pass, the one known Camera
fixture failure, 103 skips, one TODO; typecheck and build pass. Ten local-only
worker branches and one uncommitted folder-hover WIP (commit 7626654) are
pushed unmerged as `preserve/codex/*` on origin; none is integrated.

One coordinator, at most two workers and one reviewer. Root alone owns shared
docs, integration, Azahar and the production browser.

The historical assignments below are closed. Both native auditors are done
and their reservations released. Root inspected
all four sheets and rehashed each audit's originals and derivatives unchanged.
The bounded cold-draw diagnosis is complete at private report `a36272ee`.
It identifies local Node raster first-execution cost; its Canvas transport is
an emulator, so it does not rule out real browser Canvas cost. Root reran one
Friends child without overwriting the results. No production change follows.
The private headed probe is complete: eight first-page runs, two per app/mode,
all 21 paired source poses equal across modes and repeats. First-draw samples
favor generic title backgrounds; later-frame medians are higher in that mode.
This small standalone sample is not a production performance verdict. The
GPT-6.1 Sol high review is complete at private `applet-cold-browser-probe/review`,
report 272dad8a. It supports one scoped production experiment only, with later
cost as an explicit rejection gate. Its PICA-normalization fixture finding has
no effect on the 160 visible rasters but must be corrected in future probes.
All workers and reviewers are released. Experimental source a3094c2, test
correction 5e1dec9 and handoff 74db674 are frozen in the separate
`applet-generic-background-20261015/3ds-idea` worktree, branch
`codex/applet-generic-background-20261015`. Source review cf22e0da and follow-up
077fb86e are complete with no remaining finding. Full suite has 2,993 passes,
one known Camera PNG failure, 103 skips and one TODO. Nonincremental typecheck
and build pass. The candidate is preserved in separate closed, unmerged
[PR #8](https://github.com/techparamveer/3ds-idea/pull/8), based on PR #7; it is
not integrated or adopted. See [candidate](docs/applet-generic-candidate-2026-10-15.md).
Root corrected private `applet-generic-production/audit-tools` pair selection
and requested/observed hold labels. Tool dc346145 passes syntax and 14 in-memory
checks. The sole real campaign audit, 1980935a, validates 253 A1 pairs but
rejects the incomplete experiment. AC power and Energy Saver changed during
A1, so root stopped without retry. No candidate production run occurred and
PR #8 is closed without adoption. All helpers are released. The read-only
next-defect review selects Notifications unread-marker appearance for one
bounded native idle series before any source change.
See [registry](docs/feature-map/workstreams.md).
Independent GPT-6.1 Sol high checkpoint review is complete. Its one stale
RESTART serving sentence was corrected; its reservation is released. Report
is private `applet-native-opening/checkpoint-review/report.md`.

Independent review b70fc11c is complete at f68f3fd in the separate
notifications-marker-pulse-20261016/3ds-idea worktree. Both findings are fixed:
Close no longer jumps to frame 60, and only rendered unread rows key redraws.
The GPT-5.6 Sol high source worker completed candidate checks/build and is
released. The GPT-5.6 Sol high auditor completed the pulse audit and now owns
only private notifications-marker-close/audit, now completed and released.
No source edits are assigned.
Focused 66 checks pass. The initial full run exposed 40 unhydrated LFS model
failures and two missing test-stub exports; all are corrected without changing
assertions. The hydrated rerun has 2,996 passes, one known Camera PNG failure,
103 skips and one TODO. Source dbefd3a is integrated through ab73c31; src,
public, tests and package/build config exactly match the candidate commit.
Native title-specific
clock and start epoch remain unknown. Host elapsed phase and LCD VBlank rate
are explicit adaptations; feedback continues that same curve.
Typecheck and candidate build pass. Root alone owns shared docs and GUI.
The baseline build stays frozen.

The Codex weekly 10% stop rule and its `3ds-weekly-usage-stop-guard` heartbeat
belonged to the ended Codex account. The user cancelled the Grok/My King bot
message; send no external message.

## Serving and display

No owned test server, Guest window, recorder or Azahar process is active.
The native Close run finalized a silent 30.198333-second movie and two own PNGs.
Root inspected the scoped pilot and both anchors. One ordinary Close reached
HOME; PID 20838/session 93351 exited 0 and is absent. screenshotPath is restored.
Final config is 031bc53517a1557c1b6fab2d341a2b9b10a304eb79665decaeccdb89a05ed1ad;
only Qt gameListHeaderState differs from pre-config. The audited native run is
preserved under private `notifications-native-close`; see `run.md`. No source,
server, Guest window or further native inputs remain active.
The idle candidate run saved all 295 pairs, then closed Guest 5787 and server
13235. The separate Close regression saved all 511 pairs, then closed Guest
5839 and server 12327, exit 130; port 3047 has no listener. Native follow-up
closed Azahar 6247/session 15662, exit 0, and restored config d460f825.
Latest power readback reports AC attached, 40% battery and charging. The earlier
low-power hold is resolved. Recheck power before capture; battery percentage
is separate from the weekly account stop rule.

Earlier closed probe: root completed all eight private
probe runs on the built-in MacBook, then closed owned Guest window 5092 and
stopped server 3048 (session 56904, exit 130); the port has no listener. The
browser was Chrome for Testing 153.0.8010.12, V8 15.3.76.4, PID 55412, at
88,61,1200,1028. Executable is under Library/Caches/ms-playwright/chromium-1243.
Root verified "Unmute Site" on inert /health before loading any probe. There
was one rejected navigation before slot 3; state was refreshed, and no Run was
retried. Eight unique receipts exist, in policy order, with distinct page IDs.
Root inspected Friends and Notifications final paired LCDs. Other regular New
tabs and unrelated applications remain untouched. The earlier attempted
agent-browser binding timed out and may have opened a regular New tab.

Test only on the MacBook built-in display. Last verified geometry is display 1,
1800x1169 logical, 3600x2338 backing pixels. Recheck display/window bounds
before inputs. Keep dedicated test browsers muted and isolated Azahar at
volume 0, Null output 1 and Static input 2. Never change system or Spotify audio.
Use CuaREPL for GUI. The approved silent exact-window recorder requires a
decoded scope pilot before each new native motion run.

The preserved baseline production runtime is `b83b7683aaba2f50ce9a7724e1a7e370deac19bd`, build
`g-qLVPFQLrJnvHrbuaS0e`, in the coordinator checkout. Capture HEAD was
`1ea60b619e1d9ee205a19522a036c28354aa3311`; later documentation commits do not
change that identity. Keep this build and earlier captured builds frozen.
Coordinator source now includes the pulse fix, so its old build is not current
source. Serve the matching reviewed candidate from its separate worktree only.
The current matching candidate is
`/Users/paramveer/.codex/worktrees/notifications-marker-pulse-20261016/3ds-idea`,
branch `codex/notifications-marker-pulse-20261016`, HEAD
`dbefd3a37510f70a13174c1354157b07f51001df`, build `SlhhiQG_tCeNraLO8aw43`.
Its source/public/tests/config exactly match integrated ab73c31. All 2,425
files in private `notifications-marker-pulse/candidate-before.json` rehash
unchanged before/after both browser runs. Do not rebuild this captured candidate.
The older generic experiment build `qrqJDhOcclmu2RuyNXUMi`, checkout 74db674,
also stays frozen and is not adopted. The coordinator's old baseline `.next`
has 231 unchanged files; its full old source inventory no longer matches
because reviewed source was integrated. Keep build and source claims separate.

## Evidence

The [pulse fix](docs/workstream-handoffs/notifications-marker-pulse-20261016.md)
is integrated and pushed through ab73c31. Native follow-up has 43 own PNGs;
the candidate browser has 295 pairs and 254 ready frames. Fixed first-ready
comparison, empty masks, no phase fitting. Browser rows 2-4 now have 57 raw
states, with 224 ready frames changing above delta 2. No lower changes above
that threshold occur outside all four marker regions. Four chronological native
samples locally match common marker rows at delta 2, not exact RGB. Native
phase/cadence, first-row read fixture, upper residuals and all whole flows remain
open. Root inspected six pages and rehashed 928 originals and 19 derivatives.
Audit report 0b125779 and seal 2e90176a live under
`notifications-marker-pulse/audit`. Close audit bafcc8d7 under
`notifications-marker-close/audit` verifies all 511 pairs, complete source-frame
coverage and no forced-60 jump at first feedback. Root inspected its sheet and
rehashed 1,533 originals and seven derivatives.

The native Notifications Close audit is closed: private
`notifications-native-close/audit/report.md`, SHA-256
`a36ed9f01629e49145d417d16bcd2666dbb8af9afed4539146f18195909738b5`.
Frozen semantic selectors find the same broad order as the 511-pair browser
recording: ready, footer feedback, white outgoing footer, full cover with HOME
belt, HOME population, then banner. No broad-order Close defect is shown and
no source change follows. Native 13 and browser 1,533 originals rehash
unchanged; all 1,678 movie frames decode and frames 394-639 were reviewed on
ten pages. Static anchors, empty mask, delta 2: ready 2,427 / 1,371, settled
HOME 55,048 / 25,135. Those totals are fixture-dominated: native unread 9 versus
browser 8, ordinary versus portfolio HOME icons. The H264 movie cannot prove
moving LCD pixels, native input epoch, cadence or marker-freeze semantics.

Nine-unread fixture, 16 October: the live `native-folder-slow` news.db
(`4b35c1b2`) has all nine records unread; the browser fixture still followed
the older `4b9ed183` profile (record 53 read). Candidate 343df3d flips news053
to unread (Sonnet review APPROVE-WITH-NITS, nits fixed in 3a57a0a); full
checks 2,996 pass plus the known Camera failure; typecheck/build pass, build
`JxxeiXraVDydQH_b7bWFg`. Integrated as 05dc0d1. Muted Playwright recapture
of the ready list against native `_16.10.26_00.52.39.526.png` (`eced67c9`),
lcdDate = native time, empty mask, delta 2: upper **2,427 -> 1,623** (count 9
and Unread 9 now match; glyph-edge AA and clock remain), lower 2,608 confined
to the four lamp discs x0..28 (pulse phase differs; row-1 lamp now present).
No phase fitted. Private `notifications-unread-fixture/run.md`, metrics
`88dc6e62`, sheet `8ad25b38`. The held `f073581` unread-dot pair predates the
fixture and needs recapture before reuse. Static still only; not a pass.

The completed Notifications idle audit is private
`notifications-marker-idle/audit/report.md`, SHA-256
`dc5b612ad13388ff67066d60ff189dcbd2a3165a57ac101f323483a4e641af17`.
All 985 originals rehash unchanged; 660 PNGs fully decode. Native markers have
five raw states in 0.775 seconds, while all 263 ready browser pairs over
13.0394 seconds retain one state. Root inspected both all-ten comparison
sheets. Common rows 2-4 differ at 1,866-1,977 pixels above RGB delta 2.
The other 189 persistent lower pixels are precisely the row-1 read fixture;
none persist outside all four marker regions. Supplemental localization code
and seal preserve that calculation without changing the original audit.
This proves a missing pulse, not a geometry error, native cadence or phase.

[Alpha retention](docs/applet-alpha-retention-2026-10-15.md) bounds opaque-alpha
scratch canvases inside the existing 8 MiB LRU. Source review `e64b0eb0` has
no findings. Focused 104 checks, nonincremental typecheck and build pass.
Full suite: 2,992 pass, 103 skip, one TODO and one known failure, the missing
historical Camera PNG in `tests/camera-date-group.test.mjs:44`.
Do not weaken it or call the suite green. No shader/material change occurred.

Browser audit `11d5d1dd` validates 859 pairs and 1,718 complete PNG decodes.
All 2,649 candidate/selected-baseline originals rehash unchanged. Root inspected
all nine sheets. Every Friends comparison and lower LCD is exact. Nine
Notifications upper clock/battery residuals remain unmasked. The 600-pair
Notifications frame-limit is a preserved protocol deviation. Missing source
values, first-cold title costs and native motion/cadence remain open.

The closed native Friends run saves a silent 90.21-second movie and two
own 400x480 PNGs. It reaches first-use help then error 002-0121. No normal
Close, Notifications input, error dismissal or account/network changes followed.
Root inspected the pilot and anchors. Process 4443 exited and is absent.

A separate first native Notifications opening saves a silent 30.051667-second
movie and two own 400x480 PNGs. It reaches the list, unread 9 versus browser 8.
There was no further in-title input, Close or retry. Root inspected its pilot
and anchors. Process 23650 exited and is absent. Both
[native audits](docs/applet-native-opening-2026-10-15.md) are closed with root
inspection. No broad-order or Notifications belt-direction defect was found.
Notifications ready endpoints differ at 2,407 upper and 2,237 lower pixels
above RGB delta 2, empty masks. Read-state/clock differences and remaining
unread-marker pixels stay explicit. Neither movie supplies raw moving LCD PNGs
or native input epochs.

After both runs, the temporary screenshot path was restored. Final isolated
config SHA-256 is
`d460f825fc8e490e6e59648f40dd426b8807bcacc71a7872bf671817ce0c8750`.
Only Qt game-list header state changed across the last run.

Earlier repairs and remaining defects are in the
[progress record](docs/progress-2026-09-24.md),
[feature map](docs/feature-map.md) and
[workflow](docs/animation-fidelity-workflow-2026-10-07.md). Do not repeat closed
Manual feedback, folder tray-path, HOME scale interpolation, retained Resume,
missing Close-cover or selected-first return repairs without a new defect.

## Native reference

Use only
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/native-folder-slow/Azahar.app`.
Executable SHA-256:
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
Pinned HOME `00040030/00009802/content/00000082.app` SHA-256:
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Recheck process absence, mute, private storage, no escaping symlinks, original
hardware, region 2, en_GB, normal 100% and disabled RPC/GDB before launch.
Never launch generic Azahar or mutate original firmware/profile files. Restore
only approved temporary HOME/screenshot fields after GUI Quit and PID absence.
See [reference isolation](docs/native-reference-profile-isolation.md).

## Next

The four-flow goal stays active under the Claude coordinator. The native
Notifications Close audit is closed with no broad-order defect.

1. Notifications lamp epoch is integrated (`8eb24f9`, worker candidate
   c9159f3, Sonnet review APPROVE-WITH-NITS, nits logged in the workflow).
   Native movie: period 2.0059 s, loop frame 0 at -11.9 ms from the first
   destination pixels. Browser 208-pair ordinary opening on build
   `SMk_vghgoea7lOUb0Z2Fo`: period 2.0035 s, loop frame 0 at -22.6 ms from
   incoming frame 0 (receipt spacing ~45 ms). Private
   `notifications-lamp-epoch/report.md` `496dbea4`, `browser-run.md` `80b4eb4f`.
   Native feedback-freeze and suspend-return lamp semantics remain untraced.
2. HOME neighbour reveal after toolbar-applet Close is integrated (`5afea42`,
   worker b22e57d, Sonnet review APPROVE-WITH-NITS). Browser 268-pair ordinary
   Notifications Close (build `bGhH0zgNObb_zhiBrYC_S`): first group +105 ms,
   remaining +322 ms, banner +368 ms after handoff, against native +94..124 /
   +309..375 / with last group. Open: native footer-to-HOME-base takes
   2.95-3.08 s versus browser 0.98 s (long native white cover, possibly
   emulator reload time); group 1 differs because the browser retains a grid
   selection; other toolbar apps use the Notifications schedule by extension.
   Private `home-reveal-groups/browser-run.md`.
3. Native covered hold integrated (`991a908`, worker 09fe41f, Sonnet review
   APPROVE-WITH-NITS: `back` during Notes/Notifications close can still end it
   early; close cue timing unverified while muted). Browser 390-pair Close
   (build `CSwmV7jBter1bceL0yJMM`): hold 1.978 s, HOME starts +2.489 s after
   release versus native +2.334/+2.475. Remaining: browser HOME incoming
   (in:0..20, 0.47 s) versus native population-to-base ~0.07-0.11 s, so the
   browser finishes ~0.4-0.5 s later. Native frames 556-600 show HOME fading in
   while the belt exits over ~0.28-0.33 s, close to the 20-frame source track;
   the browser's 0.47 s comes from ~44 fps paints under synchronous recording
   (one source frame per paint, an existing adaptation). No source change.
   Native also shows Camera a few frames before Sound/Mii and the banner
   scaling in. Private `close-cover-hold/`.
4. Native Manual Close (Camera; private `manual-native-close/`): same white
   cover + "HOME Menu" belt, static hold 2.115 s, then selected Camera first and
   all neighbours together ~0.4 s later, banner after. The reveal already matches
   the selected-first Manual fit. The 120-frame hold now covers Manual Close
   (`216e964`, worker 9bece56, Sonnet review APPROVE). Browser 456-pair Camera
   Manual Close (build `w4AEwZuz3KgwEnPEpGUv-`): hold 1.984 s versus native
   2.115 s. Private `manual-cover-hold/`.
5. Next leftover: native grid-title Close (e.g. Health or Camera app) and
   HOME suspend/Resume timing, measured the same way.
6. Keep the generic production experiment closed and PR #8 unmerged. No retry,
   replacement tuning campaign or rebuild of either frozen build. Keep Manual
   loader and folder cursor source-only investigations closed until a new
   captured defect supports a change.
7. Integrate reviewed fixes in separate source worktrees. Run focused/full
   checks, typecheck and build, then perform the matched muted verification loop.
   Update evidence, commit explicit paths and push to draft PR #7. Continue the
   four-flow goal until complete or genuinely blocked.

## Storage and history

Write new private artifacts only under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/`.
Do not write new artifacts to the full DeveloperStorage sparsebundle. Preserve
originals and closed evidence. Append handoffs to
`/Volumes/Sandisk1/3ds-claude-codex-handoff/LOG.md`.

The previous 1,358-line STATUS is preserved byte-for-byte at private
`status-before-native-opening-audit-20261015.md`, SHA-256
`6349eef3236497206fe4c552cdf1224338f973679d0d23e0664688bb8977b6c9`.
Git also retains earlier checkpoints. Historical seats, servers, models and
next steps are not current instructions.
