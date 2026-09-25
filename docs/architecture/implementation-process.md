# Implementation and integration process

Checked against UI integration `2d5a7ca`, 25 September 2026. [AGENTS.md](../../AGENTS.md)
owns project instructions; this document describes how a defect becomes a
reviewable change and how its evidence enters the design record.

## Start with the visible defect

Name the user action, observed result and expected result from a source or
matched native scenario. Record whether the failure is in selection/state,
resource preparation, lifecycle ownership, rendering or input. Trace the live
call path before assigning more extraction work: a published model cannot fix
a painter that never requests it.

The immediate HOME example is stock title selection. Settings has a
**provisional** selected-banner path, while other stock selections remain
unsupported/blank. Settings materials, first visible pose and timing still
have failing raw browser/Azahar LCD diagnostic pairs. Their entry input and
animation phase differ. A same-input, phase-aligned pair is still needed;
published resources alone do not establish visible fidelity.

## Worktree ownership and integration

1. Inspect `git status`, `git worktree list`, branch and HEAD in the intended
   repository. The UI coordinator checkout is
   `/Users/paramveer/.codex/worktrees/3ds-ui-continuation` on
   `codex/health-ui-scratch`. It has a different Git object database from
   `/Volumes/DeveloperStorage/GitHub/3ds-idea`. Create worktrees from the UI
   checkout when continuing its commits; verify the base commit resolves there.
2. Use the five long-lived lanes listed in [AGENTS.md](../../AGENTS.md):
   Design, Assets, HOME, Stock and Experience. Each lane is advanced to the
   current integration HEAD after its previous commits are confirmed integrated.
   Assign each slice owned paths and a concrete exit condition. Check dirty
   files before reuse; never edit or reset another worker's worktree. Stage
   explicit files only; **never `git add -A`**. Creating a worktree does not
   itself deliver an improvement.
3. A handoff contains the commit SHA, changed behavior or source fact, tests,
   skipped/private fixtures, artifact paths, evidence tier, firmware asset list, target capture pair,
   remaining diff regions and whether runtime changed. The coordinator alone drives production browser and Azahar
   sessions. Workers do not drive either session. Source workers may produce
   fixtures/renders but must label them accordingly.
4. Integrate coherent commits sequentially into the coordinator checkout and
   inspect their diff/ancestry. Run relevant combined checks. For runtime/assets,
   rebuild, restart the production server and run the [native/browser loop](verification.md)
   for the affected scenario and regression set. Do not call a worker's passing build evidence for a later integrated
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
| Live integration | State-to-host-to-draw path, retarget cancellation, explicit unsupported/failure handling and Frame/camera composition | Settings is provisional; other stock titles remain unsupported |
| Visible and native acceptance | Same-input Azahar/raw production-browser capture pair, diff report, contact-sheet inspection and frame/audio/input checks | No stock-title HOME banner has complete acceptance |

The historical Settings source chain stopped at OS service `0x139008`
before the provisional banner was wired. That history does not prove its current
pose. The existing **HOME with Settings selected** pair is a failing diagnostic
with unmatched selection input and animation phase. The next step is a
same-input, phase-aligned capture, then a concrete diff-driven correction. Allow at most one
source-only slice before visible change; fit decoded native resources to
Azahar and label fitted camera/timing if an original path remains unresolved.
Do not publish a guessed banner. See the
[Settings gate](../settings-home-banner-activation-gap.md).

## Evidence handoff

For each claim record: commit/build, title and entry state, exact input sequence,
manifest/dump identity for every visible native element or native cue,
resource/profile identity, clock or frame sampling, evidence tier, native and
raw-browser capture paths/hashes, mask, diff report, result and residual defect. Use the tiers in
[verification](verification.md). Report **implemented**, **tested**,
**browser-inspected** and **native-compared** independently. An executed original
instruction fixture is source evidence; synthetic dependencies must stay visible.
A fitted settled source render is not live browser motion. A working route does
not establish a pixel match.

Store new artifacts under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`.
Keep private firmware/executables out of public delivery. Begin with HOME
idle and Settings → Other Settings page 1 native-resolution pairs under the
private `reference/scenario-matrix/v1/captures/` directory. Existing diagnostic
pairs fail; HOME idle remains unmatched. Then capture selected stock previews, rapid retargeting,
launch/return, focus, sleep/wake and cold-power focus at matched states.
