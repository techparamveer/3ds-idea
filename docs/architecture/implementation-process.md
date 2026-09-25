# Implementation and integration process

Checked against UI integration `1bf5178`, 25 September 2026. [AGENTS.md](../../AGENTS.md)
owns project instructions; this document describes how a defect becomes a
reviewable change and how its evidence enters the design record.

## Start with the visible defect

Name the user action, observed result and expected result from a source or
matched native scenario. Record whether the failure is in selection/state,
resource preparation, lifecycle ownership, rendering or input. Trace the live
call path before assigning more extraction work: a published model cannot fix
a painter that never requests it.

The immediate HOME example is stock tile selection leaving the upper preview
blank. At this checkpoint `home-banner-host.ts` returns `unsupported` for app
selections, `screens.ts` draws native folder/default primaries only, and the
four-title resource host has no live caller. Camera and Settings blank previews
are recorded browser defects. Settings and four common title packs are published;
Zone's decoded common model is withheld. This is an activation/composition gap,
not a blanket claim that decrypted assets are still unavailable.

## Worktree ownership and integration

1. Inspect `git status`, `git worktree list`, branch and HEAD in the intended
   repository. The UI coordinator checkout is
   `/Users/paramveer/.codex/worktrees/3ds-ui-continuation` on
   `codex/health-ui-scratch`. It has a different Git object database from
   `/Volumes/DeveloperStorage/GitHub/3ds-idea`. Create worktrees from the UI
   checkout when continuing its commits; verify the base commit resolves there.
2. Use the five long-lived lanes listed in [AGENTS.md](../../AGENTS.md):
   Design, Assets, HOME, Stock and Experience. Their common base for this
   onboarding pass is `1bf5178b6bd827b9804e67233cc076309708728b`.
   Assign each slice owned paths and a concrete exit condition. Check dirty
   files before reuse; never edit or reset another worker's worktree. Stage
   explicit files only; **never `git add -A`**. Creating a worktree does not
   itself deliver an improvement.
3. A handoff contains the commit SHA, changed behavior or source fact, tests,
   skipped/private fixtures, artifact paths, remaining gates and whether runtime
   changed. The coordinator alone drives production browser and Azahar
   sessions. Workers do not drive either session. Source workers may produce
   fixtures/renders but must label them accordingly.
4. Integrate coherent commits sequentially into the coordinator checkout and
   inspect their diff/ancestry. Run relevant combined checks. For runtime/assets,
   rebuild, restart the production server and inspect the actual integrated
   scenario. Do not call a worker's passing build evidence for a later integrated
   build. Documentation-only work needs links and `git diff --check`, no rebuild.
5. Update the [progress record](../progress-2026-09-24.md) with evidence and the
   [feature map](../feature-map.md) with status/next action. Update the matching
   architecture contract when ownership, ordering, degradation or verification
   changes. Preserve earlier checkpoints as history; mark worktree tables by
   date and use Git for current inventory.

Earlier `3ds-home-process-design` and many short-lived replay worktrees are
historical checkpoints, not current assignments. The original checkout and
older `uifix`, `codex/home-menu-assets` and `codex/3ds-os` work remain preserved.

## HOME title-banner promotion gates

| Gate | Required evidence before claiming it | Current boundary |
| --- | --- | --- |
| Source and delivery | Correct title/region identities, decoded resource closure and named texture replacement | Settings and four common title packs are published; Zone is withheld |
| Prepared resource | Validated model/material/clip inputs and current generation/request owner; stale completion and disposal checks | Camera/Sound/Health/eShop resource host is dormant; its readiness is preparation only |
| Native lifecycle | Linked title worker result, presentation completion, identity-matched show/hide, attachment and actual pose submission | Scene insertion reaches render dispatch with a synthetic candidate. The real Settings worker decodes banner.bin and constructs candidates; a supplied allocator lets the native graphics constructor and initializer run, then state-4 binding stops at OS thread-local service 0x139008 |
| Live integration | State-to-host-to-draw path, retarget cancellation, explicit unsupported/failure handling and Frame/camera composition | Only folder/default native primary paths are live |
| Visible and native acceptance | Operated integrated browser scenario plus matched native/source or native/browser captures explicitly distinguished; timed sequences for motion claims | Blank stock previews remain defects; no stock-title HOME banner has complete acceptance |

For Settings, the historical next source question was binding the real worker
candidate/`COMMON` model past OS service `0x139008`, then linking the render
owner to a submitted pose. This is an open gate, not an instruction to start a
chain of standalone source replays. A controller clock reaching frame 1 or a
scene-list count reaching 1 does not show visible pixels. See the detailed
[Settings gate](../settings-home-banner-activation-gap.md). The HOME lane should
first name the integrated visible defect and deliver the narrowest linked
source-to-runtime correction through browser verification. Do not add guessed
waits, reuse folder activation as title completion or advance animation during
paint to bypass the missing branch.

## Evidence handoff

For each claim record: commit/build, title and entry state, exact input sequence,
manifest/dump identity for every visible native element or native cue,
resource/profile identity, clock or frame sampling, evidence tier, artifact
path/hash, result and residual defect. Use the tiers in
[verification](verification.md). Report **implemented**, **tested**,
**browser-inspected** and **native-compared** independently. An executed original
instruction fixture is source evidence; synthetic dependencies must stay visible.
A fitted settled source render is not live browser motion. A working route does
not establish a pixel match.

Store new artifacts under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`.
Keep private firmware/executables out of public delivery. The next HOME browser
pass should capture selected stock previews, rapid folder/title retargeting,
launch/return, toolbar/grid focus, sleep/wake and the repaired cold-power focus
sequence. Compare native pixels only for matching entry states and describe any
intentional portfolio adaptation.
