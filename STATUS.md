# STATUS: animation fidelity

## Checkout

Reconciled HEAD: `ce633d96182dd50e96c76f03308cd04909939097`.
Git wins if this differs from HEAD. Reconcile before another slice or worker.
Keep this file current, not append-only.

Coordinator checkout:
`/Users/paramveer/.codex/worktrees/applet-alpha-retention-20261015/3ds-idea`
on `codex/applet-alpha-retention-20261015`. Its Git object database is
`/Volumes/DeveloperStorage/GitHub/3ds-idea/.git`. Do not work in the original
checkout. Create new source worktrees from this coordinator HEAD.

Draft [PR #7](https://github.com/techparamveer/3ds-idea/pull/7) uses remote
branch `codex/animation-fidelity-20261007`. Latest verified pushed SHA is
`ce633d96182dd50e96c76f03308cd04909939097`. Review coherent changes, stage
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

Latest user-supplied AGENTS instructions select GPT-5.6 Sol high for new helpers,
normal speed. A different-model independent reviewer uses GPT-6.1 Sol high.
Tools cannot change or verify the in-flight coordinator model or service tier.
One coordinator, at most two workers and one reviewer. Root alone owns shared
docs, integration, Azahar and the production browser.

Both native auditors are done and their reservations released. Root inspected
all four sheets and rehashed each audit's originals and derivatives unchanged.
One bounded offline cold-draw worker
owns only new private `applet-cold-draw-diagnosis` outputs, distinguishing
raster/kernel setup from Canvas costs through existing actual rendering paths.
No worker may modify originals, source, build or shared docs, or operate GUI.
No runtime optimization is assigned yet. See [registry](docs/feature-map/workstreams.md).
Independent GPT-6.1 Sol high checkpoint review is complete. Its one stale
RESTART serving sentence was corrected; its reservation is released. Report
is private `applet-native-opening/checkpoint-review/report.md`.

Latest account reading is 70% used / 30% weekly remaining. Check before new
heavy work and at least every ten minutes. At **10% remaining or less**, stop
new work, interrupt helpers, close owned sessions, preserve a minimal checkpoint
and pause the goal. The user cancelled the Grok/My King bot message. Send no
external message and do not resume automatically after reset. Existing heartbeat
`3ds-weekly-usage-stop-guard` enforces the same rule; do not duplicate it.

## Serving and display

No owned GUI, test server or recorder remains active. The last Chrome Guest,
port 3047 server and both isolated native processes have closed. The original
regular browser New tab was preserved. Do not treat old historical previews
as current or alter unrelated sessions.

Test only on the MacBook built-in display. Last verified geometry is display 1,
1800x1169 logical, 3600x2338 backing pixels. Recheck display/window bounds
before inputs. Keep dedicated test browsers muted and isolated Azahar at
volume 0, Null output 1 and Static input 2. Never change system or Spotify audio.
Use CuaREPL for GUI. The approved silent exact-window recorder requires a
decoded scope pilot before each new native motion run.

Frozen production runtime is `b83b7683aaba2f50ce9a7724e1a7e370deac19bd`, build
`g-qLVPFQLrJnvHrbuaS0e`, in the coordinator checkout. Capture HEAD was
`1ea60b619e1d9ee205a19522a036c28354aa3311`; later documentation commits do not
change that identity. Keep this build and earlier captured builds frozen.

## Evidence

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

1. Finish the bounded cold-title diagnosis against the existing first-draw cost.
   Preserve both closed native audits, Friends error and Notifications fixture
   differences. No broad-order correction follows from these comparisons.
2. Use measured raster/kernel/Canvas costs to choose a bounded correction in a
   new source worktree, if supported. Preserve exact bytes and existing clocks,
   cache bounds, resource failures and publication guards. No prewarming or
   guessed delay. Sampled-pose gaps and native timing remain separate issues.
3. Integrate reviewed fixes in separate source worktrees. Run focused/full
   checks, typecheck and build, then perform the matched muted verification loop.
   Update evidence, commit explicit paths and push to draft PR #7. Continue the
   four-flow goal until complete, genuinely blocked or the 10% stop threshold.

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
