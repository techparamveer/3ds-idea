# Workstream Registry

## Empty Folder Delete - 2 October 2026

Both existing Sol5.6/high chats continued from `e6802cfd` in fresh owned
worktrees. Source chat `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` used
`3ds-home-folder-delete-20261002` / `codex/home-folder-delete-20261002`;
`7d6cdbf2` integrated as `2f074d64`. Comparison chat
`01a0f9a7-3b9c-7640-b7f6-3528982b4929` used
`3ds-home-folder-delete-compare-20261002` /
`codex/home-folder-delete-compare-20261002`; baseline `668db401` -> `e870043c`
and browser baseline `04beba19` -> `c34c3926`. An independent read-only
Sol5.6/high subagent found no concrete runtime issue. Workers did not drive GUI.
Coordinator captured two native empty-delete runs, production before/after,
touch/A/reload/mobile and stock regressions. Full 1,801 tests/typecheck/build
pass; whole-scenario fidelity remains fail. Prior trees are preserved; no
service-tier or coordinator-model change is claimed. The source chat and
reviewer are idle. Comparison results are recorded in the
[owned handoff](../workstream-handoffs/home-folder-delete-compare.md).

## Folder Settings - 2 October 2026

The two Sol5.6/high chats continued at `5fd6a99c` in fresh worktrees, preserving
the earlier cursor trees. Source chat `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13`
used `3ds-home-toolbar-interaction-20261002` /
`codex/home-toolbar-interaction-20261002`: toolbar audit `268feb10`/`553b176e`
integrated as `7fc88634`/`1fb41a02`, then native Folder Settings `238319b6`
as `79e77f58`. Comparison chat `01a0f9a7-3b9c-7640-b7f6-3528982b4929`
used `3ds-home-folder-interaction-compare-20261002` /
`codex/home-folder-interaction-compare-20261002`; baseline `224427cc` integrated
as `91eb20b1`. Independent read-only subagent caught the newly gated panel's
B/HOME recovery trap; it was fixed and tested before integration. Workers did
not drive GUI. Coordinator alone captured muted native/production workflows
on the authorized full Mac, integrated and ran full checks. Worktrees remain
preserved; no service-tier/coordinator-model claim.
Final comparison `87e195b3` -> `9efb2a53` and bounded source-gap note
`8e200c60` -> `29cc7ea3` are integrated. Both chats and the review subagent are
idle. Full 1,800 tests/typecheck/build and muted desktop/mobile folder Cancel
checks pass. The 107 modal pixels remain explicit; no guessed sampler patch
or whole-scenario acceptance follows. Dedicated Chrome closed cleanly;
production preview 3021 remains available.

## Cursor Replay - 2 October 2026

The same two Sol5.6/high chats continued from `7404afd2` in separate worktrees.
Source chat `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` used
`3ds-home-touch-projection-20261002` / `codex/home-cursor-replay-20261002`:
source notes `5af177f1`/`b4fa7aca` -> `0961d207`/`d6aa95e2`, candidate
`425ffa83` -> `68c69bcf`. Comparison chat
`01a0f9a7-3b9c-7640-b7f6-3528982b4929` used
`3ds-home-density-compare-20261002` / `codex/home-cursor-compare-20261002`:
baseline `b9ed8f27` -> `2199fb3d`, owning its handoff and private artifacts.
Independent read-only Sol5.6/high subagent reviewed capture identity, candidate
scope and comparison controls; it caught the selected-title mismatch before
acceptance. Coordinator recaptured aligned Health, rejected the mixed candidate
result and restored transport at `b8773a90`. Workers did not drive GUI.
Full checks, native capture, production phase families and actual-input tests
are coordinator evidence; whole scenarios remain fail. Worktrees are preserved.
Final comparison `a22737ec` -> `5ddc4ee7` is integrated; both chats and the
read-only subagent are idle. Restored runtime passes full checks and inspected
production preview. No service-tier or coordinator-model change is claimed.

## Touch Projection And Density - 2 October 2026

Two existing Sol5.6/high chats use dedicated branches/worktrees at `6e1a2252`.
Source chat `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` used
`3ds-home-touch-projection-20261002` / `codex/home-touch-projection-20261002`,
delivering `43cbf493` -> `a751b2dd`. It owns only scene QA projection,
focused tests and its source note. Independent Sol5.6/high read-only subagent
found no confirmed issue. Real raycasting/UV input and reducers are unchanged.

Comparison chat `01a0f9a7-3b9c-7640-b7f6-3528982b4929` uses
`3ds-home-density-compare-20261002` / `codex/home-density-compare-20261002`,
owning only its density handoff and private comparison artifacts. Coordinator
alone captured native/production pairs, verified resized controls, integrated
and ran full 1793 tests/typecheck/build/shader. All worktrees are preserved.
Comparison `2a04f177` integrated as `e1b0441c`; both chats are now idle.
Native long-hold behavior and whole-LCD residuals remain open; no scenario pass.

## Ordinary Plate And Icon Corners - 2 October 2026

Both ordinary-plate workers completed from base `1e5fb200`; their worktrees
remain preserved and clean. Source chat `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13`
used `3ds-home-ordinary-plate-20261002` / `codex/home-ordinary-plate-20261002`,
delivering `14489f83` -> `476f05be`: both sampling replays regressed the
captured plate and were rejected. Comparison chat
`01a0f9a7-3b9c-7640-b7f6-3528982b4929` used
`3ds-home-ordinary-plate-compare-20261002` /
`codex/home-ordinary-plate-compare-20261002`, delivering `6d703ef7` ->
`ee133aa8`. Its 963-pixel plate baseline repeats exactly; the separate icon
fringe has 23 high pixels. Comparison chat is idle; no runtime change.

Source chat completed `3ds-home-icon-corners-20261002` /
`codex/home-icon-corners-20261002`, created at `5da749da`, GPT-5.6 Sol/high.
It owns the narrow stock-grid artwork path in `src/os/screens.ts`, the
necessary native presenter method in `src/os/firmware-presentation.ts`,
focused tests and its source note. The captured target is the rounded native
icon fringe versus the browser's plain image draw. Reuse decoded
`LncIconDist_01/P_Icon_00` and `IconMask.bclim`; no CSS reconstruction,
new colors/positions or re-audit of the plate/footer gap. Source `01fb8e4a`
integrated as `3bb6c6f3` after independent Sol5.6/high subagent review.
Full 1789 tests/typecheck/build/shader pass. Comparison chat uses separate
`3ds-home-icon-corners-compare-20261002` /
`codex/home-icon-corners-compare-20261002`, base `da6dfced`, with baseline
`db2dbe5c` -> `d0ea7f24` and coordinator provenance correction `ef435fe5`.
Production-after delivery `b8700f1e` integrated as `74237496`; both chats are idle.
Four actual production-after captures close fringe23 and artwork1 to zero
pixels above delta 2. The [comparison handoff](../workstream-handoffs/home-icon-corners-compare.md)
retains controls and whole-LCD failures. Both owned worktrees are preserved;
coordinator alone operated muted GUI, built, integrated and compared on the
full Mac. The next captured input target is the mobile density-increase tap,
which fails in both before and after. No whole-scenario pass.

## Notes Toolbar - 2 October 2026

The source chat/tree below delivered `1329ddd1` and `5d1239b3`, integrated
as `6cbe378d` and `79597372`. Independent Sol5.6/high read-only subagent review
required an exact-shape guard and honest sampling-adaptation label before
integration. Coordinator fixture follow-up is `58205d29`; full 1782 tests,
typecheck/build/shader pass. The comparison chat owns the new
[Notes handoff](../workstream-handoffs/home-notes-toolbar-compare.md) in its
existing tree, delivered `89d325b8` -> `ef9e891a`. Four production-after/native ROIs reach 0 pixels above 2,
maximum 1; no whole scenario passes. Coordinator alone operated muted GUI
sessions, on the Mac after explicit user authorization. The earlier idle/
pending Notes status below is historical, not the current verification state.

## Power Footer Raster - 2 October 2026

Following integration checkpoint `88319a91`, comparison chat
`01a0f9a7-3b9c-7640-b7f6-3528982b4929` continues in
`3ds-home-idle-next-compare-20261002` / `codex/home-idle-next-compare-20261002`.
It completed `b83b1274` -> `bdefbf59`, owning only
`docs/workstream-handoffs/home-idle-next-compare.md` and internal artifacts.
The unselected Notes toolbar glyph has 201/598 high pixels, maximum 25;
matched-state repetition remains required. Comparison chat is idle.

Source chat `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` continues with Sol5.6/high in
`3ds-home-notes-toolbar-raster-20261002` /
`codex/home-notes-toolbar-raster-20261002`, base `a9da4ef7`. It owns a bounded
`P_Memo_10` source/rendering candidate, focused tests and
`docs/home-notes-toolbar-raster-2026-10-02.md`, if justified. No guessed color
or position; no GUI/build/matrix/shared-doc authority. Any source-only result
remains pending coordinator repeat, integration and native/browser recapture.

Two existing Sol5.6/high chats used dedicated worktrees based on `34be5b98`;
both are complete and idle. Coordinator alone operated native/browser sessions.
Worktree names below are under `/Users/paramveer/.codex/worktrees/`, branches
use the `codex/` prefix.

| Chat | Worktree / branch | Integrated result |
| --- | --- | --- |
| `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | `3ds-home-power-footer-raster-20261002` / `home-power-footer-raster-20261002` | Source `bc37da53` -> `d4c96f26` |
| `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | `3ds-home-power-footer-compare-20261002` / `home-power-footer-compare-20261002` | `ec6325a0` -> `a8b8dda7`; [handoff](../workstream-handoffs/home-power-footer-compare.md) |

[Evidence](../home-power-footer-raster-2026-10-02.md): both complete LCD pairs
meet static delta-2 tolerance with empty masks. Full 1780 tests/typecheck/build
pass; 65 browser motion pairs and desktop/mobile controls inspected. Whole
scenarios still fail for exact input, native motion/shutdown/audio and prior
unexplained app variance. No matrix or global 1:1 change; no push/merge/deploy.

## Power Block Centering - 2 October 2026

Two existing GPT-5.6 Sol/high chats used separate internal worktrees from
`b51e2818`; no service-tier claim. Only the coordinator operated GUI.

| Chat | Worktree / codex branch suffix | Delivery |
| --- | --- | --- |
| `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | `3ds-home-power-centering-20261002` / `home-power-centering-20261002` | Source `294dfb0c` -> `57c4c824` |
| `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | `3ds-home-power-centering-compare-20261002` / `home-power-centering-compare-20261002` | `bf0c0376` -> `74fc7d5f`; [handoff](../workstream-handoffs/home-power-centering-compare.md) |

[Evidence](../home-power-centering-2026-10-02.md): upper 4334 -> 3, changed
list 4331 -> 0, lower static pixel tier preserved. Full 1778 tests/typecheck/
build pass; repeated app capture identical, controls and 64 browser motion
pairs inspected. Three footer pixels and exact input/motion/audio remain open.
Native stopped/restored/muted; temporary server/browser stopped, 3021 refreshed.
Both whole scenarios fail. Both workers completed their bounded deliveries;
worktrees are clean and preserved.

## Power Text Raster - 2 October 2026

The two existing chats used GPT-5.6 Sol/high and separate internal worktrees
from `97c954db`; no service-tier claim. Only the coordinator operated GUI.

| Chat | Worktree / codex branch suffix | Delivery |
| --- | --- | --- |
| `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | `3ds-home-power-raster-20261002` / `home-power-raster-20261002` | Candidate `e1836ae2` -> `459d623f`; measured cleanup `60289548` -> `766888a2` |
| `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | `3ds-home-power-raster-compare-20261002` / `home-power-raster-compare-20261002` | Diagnostic/candidate `ab13f48e` -> `8bfe8607`; final `1dbc6761` -> `31f4220b` |

[Verification and residuals](../home-power-raster-2026-10-02.md): lower668 ->0
above2; rejected upper experiment removed. HOME upper4334/app6512 remain;
disabled-lower-sampler control reproduces upper variance. Full1777 tests,
typecheck/build pass; final controls and73 browser motion pairs inspected.
Native stopped, temporary inputs restored, muted fixture preserved. Whole
scenarios remain fail. Both bounded deliveries complete; trees preserved.

## Power Menu - 2 October 2026

Existing chats used GPT-5.6 Sol/high in dedicated internal trees from
`ff6ffe24`. No service-tier claim; coordinator alone operated GUI. Trees
are preserved; both bounded deliveries are committed.

| Chat | Worktree / codex branch suffix | Delivery |
| --- | --- | --- |
| `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | `3ds-home-power-ui-20261002` / `home-power-ui-20261002` | Source spacing `25440bec` -> `82d26a8b` |
| `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | `3ds-home-power-compare-20261002` / `home-power-compare-20261002` | Baseline `8c03a910` -> `042fb526`; after `3810ee64` -> `7315d36a` |

Coordinator touch-boundary fix `9db08e24`.
[Verification and residuals](../home-power-menu-2026-10-02.md):1776 tests,
typecheck/build pass; fresh native and before/after production capture pairs,
desktop/mobile physical controls inspected. Whole scenarios still fail at
4334/668 upper/lower pixels above2. Native/browser test sessions stopped;
temporary native inputs restored, silent fixture preserved.

## Balloon Density - 2 October 2026

Existing chats used GPT-5.6 Sol/high in separate internal trees from `34d77726`.
No service-tier claim; coordinator alone operated GUI. Trees preserved.

| Chat | Worktree / codex branch suffix | Delivery |
| --- | --- | --- |
| `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | `3ds-home-balloon-source-20261002` / `home-balloon-source-20261002` | Audit `5c554650` -> `e0b31b17`; fix `f90c0c2f` -> `5de1f381` |
| `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | `3ds-home-balloon-compare-20261002` / `home-balloon-compare-20261002` | Health `3c3f0708` -> `008fb964`; Settings `52e4021b` -> `bce9dc83` |

[Verification and residuals](../home-balloon-density-2026-10-02.md).
Both workers completed their bounded deliveries and are idle.

## Closing Exit - 2 October 2026

Existing chats ran GPT-5.6 Sol/high in dedicated internal trees from `a79ce550`.
No service-tier claim. All workers idle, trees preserved; no worker GUI.

| Chat / subagent | Worktree / codex branch suffix | Delivery |
| --- | --- | --- |
| `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | `3ds-home-closing-fade-source-20261002` / `home-closing-fade-source-20261002` | `e285cb59` -> `374ac94b` |
| `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | `3ds-home-closing-fade-fit-20261002` / `home-closing-fade-fit-20261002` | `1daac05c` -> `66992054` |
| `/root/closing_fade_clock` | `3ds-home-closing-fade-clock-20261002` / `home-closing-fade-clock-20261002` | `92ab4123` -> `1d52d671`; review fix `ce35a0fe` -> `229e864c` |

Coordinator wiring `3530bec2`; [verification and remaining adaptations](../home-closing-fade-2026-10-02.md).

## Upper Close - 2 October 2026

Existing chats used GPT-5.6 Sol/high, new dedicated internal trees from
`4f44e500`. No service-tier claim. Both are idle; trees are preserved.

| Chat ID | Worktree / codex branch suffix | Delivery |
| --- | --- | --- |
| `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | `3ds-home-upper-close-owner-20261002` / `home-upper-close-owner-20261002` | Source `beff2738` -> `ed7bf6f3` |
| `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | `3ds-home-close-fit-20261002` / `home-close-fit-20261002` | Corrected fit `3138dbaa` -> `28b1d8ef` |

Coordinator runtime `1fbfd6be`; read-only Sol/high subagent review found no
actionable issues. No worker GUI. Coordinator alone used muted Sidecar native
and production browser. Native is stopped/restored; secondary profile unused.
[Evidence, fit correction and residuals](../home-upper-close-2026-10-02.md).

## Software Closing - 2 October 2026

Existing chats ran GPT-5.6 Sol/high from `100f2a94`, with separate internal
worktrees under `/Users/paramveer/.codex/worktrees/`. No service-tier claim.

| Chat ID | Worktree / codex branch suffix | Delivery |
| --- | --- | --- |
| `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | `3ds-home-panel-departure-20261002` / `home-panel-departure-20261002` | `69b2b39e` candidate and `9dfec708` audit; code not integrated; idle |
| `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | `3ds-home-footer-departure-20261002` / `home-footer-departure-20261002` | `204137c8` footer candidate not integrated; closing renderer `b32a06dc` -> `3c06173e`; idle |

Coordinator identity/wiring/repair `9c109091`/`794539b4`/`cf38daf8`.
One read-only Sol/high subagent reviewed integration. No worker GUI/build.
Coordinator alone operated muted Sidecar sessions; only primary native profile
ran and is now stopped/restored. Both profiles and all worktrees preserved.
[Delivery and open native residuals](../home-software-closing-2026-10-02.md).

## Footer Contact and Native Border - 2 October 2026

Both existing chats ran GPT-5.6 Sol/high from `9c72c168`; no service-tier claim.
New internal worktrees under `/Users/paramveer/.codex/worktrees/`:

| Chat ID | Worktree / codex branch suffix | Delivery |
| --- | --- | --- |
| `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | `3ds-home-native-border-20261002` / `home-native-border-20261002` | `e5f0d09d` -> `eb97635f`; idle |
| `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | `3ds-home-footer-contact-20261002` / `home-footer-contact-20261002` | `e519cf69` -> `a3c67599`; idle |

Coordinator wiring `46254ee7`, review repair `25d4f367`. No worker GUI/build;
coordinator alone used muted Sidecar native/browser. Both native profiles and
all trees preserved; only primary was launched in this slice. Source mappings,
checks and explicit limitations: [delivery record](../home-buttons-border-2026-10-02.md).

## Power Reveal and Close Mask - 2 October 2026

Both existing chats worked concurrently from `513a8fcd` in new internal trees:

| Chat ID | Worktree / branch suffix | Delivery |
| --- | --- | --- |
| `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | `3ds-home-close-mask-20261002` / `home-close-mask-20261002` | Source-gap audit `7e95180a` -> `6066c315`; no runtime change; idle |
| `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | `3ds-home-power-reveal-20261002` / `home-power-reveal-20261002` | Runtime `10b97058` -> `72f73270`; idle |

Coordinator fixes `e96d25b6`/`2c992dd7` implement reduced-motion paint and
actual-render acknowledgment. GPT-5.6 Sol/high, no service-tier claim; one
read-only helper reviewed integration. No worker GUI/build. Only primary
Azahar was retried this slice; startup observation failed and it is stopped,
config unchanged/muted. Both independent profiles and all trees remain
preserved. [Browser checks, source identities and limitations](../home-power-reveal-2026-10-02.md).

## Close Motion Integration - 2 October 2026

The same two user-owned chats delivered a second parallel implementation slice,
both based on `cd6400fb` in new internal worktrees with `codex/` branches:

| Chat ID | Worktree / branch suffix | Delivery |
| --- | --- | --- |
| `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | `3ds-home-close-presentation-20261002` / `home-close-presentation-20261002` | `ec0da207` -> `990e9fe0`; idle |
| `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | `3ds-home-close-runtime-20261002` / `home-close-runtime-20261002` | `d165c95a` -> `5cd0daef`; idle |

Explicit bounded renderer/runtime ownership was released for these deliveries;
coordinator alone integrated, wired and repaired shared boundaries through
`f8334ec2`. Earlier controller `43b18bf0` is now integrated as `cd6400fb`.
GPT-5.6 Sol/high, no service-tier claim. One read-only helper reviewed integration.
No worker GUI. Both muted private Azahar copies reused sequentially on Sidecar;
fresh native close input failed and both copies are now stopped. Profiles and
all worker trees remain preserved. [Evidence and residuals](../home-close-motion-2026-10-02.md).

## Active Parallel HOME Work - 2 October 2026

The user's renewed parallel-work request is dispatched, not merely queued.
Both existing chats delivered from runtime `7b243793` in new internal worktrees;
their old worktrees are preserved. New turns use GPT-5.6 Sol/high as required
by the latest user-supplied instructions. Service tier remains unverified.

| Chat ID | Branch / worktree | Current owned implementation |
| --- | --- | --- |
| `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | `codex/home-sleep-motion-20261002` / `3ds-home-sleep-motion-20261002` | Delivered `366e9342`, integrated as `dc6d19f7` and wired at `47845dc5`; idle after handoff |
| `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | `codex/home-transition-motion-20261002` / `3ds-home-transition-motion-20261002` | Delivered `43b18bf0`, reviewed pure close controller; not runtime-integrated, idle after handoff |

Paths are under `/Users/paramveer/.codex/worktrees/`. Shared `system.ts`,
`screens.ts`, `firmware-presentation.ts`, scene banner/console composition and
progress/map remain coordinator-reserved. Workers supply integration hunks,
focused checks and commits; they do not operate GUI or run competing builds.
Each may use one read-only helper, no nested fan-out.

Coordinator used two separate real Azahar profile copies under the
internal artifact root: `native-close-clean-20261002` for app suspension/switch
and `native-home-motion-20261002` for idle HOME reference. Both executables
match the pinned hash, have independent NAND/config/log/screenshot paths and
use Static input2 / Null output1 / volume0. Two 630x780 windows were verified
side by side at 1810,397 and 2460,397 on Sidecar. Both are now stopped after
capture; profiles preserved. Keep unused sessions paused during later passes;
concurrent renderer slowdown is not timing acceptance. Only the coordinator
supplies inputs. [Delivery, evidence and next integration](../home-suspended-highlight-2026-10-02.md)
keep the close controller's paint barrier and owner guards explicit.

Coordinator: the Codex chat **Explain the 3DS project**,
`01a0f8e9-441b-76a2-b3ee-bec359217934`. The user explicitly requested separate
Codex chats and worktrees, with this chat orchestrating their work and allowing
bounded subagents inside each lane. The latest user-supplied repository
instructions select GPT-5.6 Sol/high for new delegated work.
Existing in-flight helpers were not claimed switched. Chat messaging sets
model/reasoning but not service tier. The saved global priority override was
removed; existing chat speed overrides remain unverified. Computer use refused
Codex's own controls; do not bypass it or claim the message changed service tier.
The collaboration route exposes no service-tier control; do not claim a
normal/Fast setting was applied through its model override.

On 2 October, all eight registered workstream chats accepted explicit
`gpt-6-astra` / `high` follow-ups with the new no-Fast policy. These were
settings-only acknowledgements, not implementation dispatches. Completed
subagents remain stopped; their in-flight model was not changed retroactively.

HOME Settings delivery: renderer `23f21485` integrated as `6c31e2f6`, state
`183b4965` as `e4a30ab0`, System tests `eaf4cf20` as `ca326367`, MyMenu painter
`61cf9509` as `8fd2f4bf`; runtime wiring/review fixes `e923487d`. Workers used
assigned `3ds-home-design-native-panel-20261002` and `3ds-home-design-state-20261002`
worktrees without GUI. [Evidence and residuals](../home-settings-integration-2026-10-02.md).

The [completion map](../feature-map.md) defines scope, status and acceptance.

Coordinator `fc6e5983` delivers the [source suspended backdrop](../home-suspended-background-2026-10-02.md)
after compact retained presentation at `17eebbb0`. One read-only GPT-5.6 Sol/high
source-audit helper confirmed mask/TEV evidence and bounded the unresolved
runtime binding contract; no worker code or GUI changes.
Next reserved slice: upper/lower sleep highlight, modal footer, HUD residuals
and matched transition replay.

Coordinator `0330d13c`/`e3503cc7`/`645ae96d` adds source switch icon header,
advancing pending banner and selected-title/dark Close footer. [Evidence](../home-switch-footer-2026-10-02.md)
still fails whole-scenario acceptance. Newest user priority is HOME 1:1;
the compact icon was subsequently delivered above. Backing and modal footer
visibility remain. No new worker dispatch.

Coordinator close/switch delivery `f17a1007` replaces authored modal art with
source dialog/masks/messages, source button bounds and paired readiness.
[Eleven-pair browser evidence](../home-software-dialog-2026-10-02.md) verifies
cancel/confirm and cross-drag behavior. Native caller/policy, inline size and
closing motion remain open. This was coordinator work, not a worker dispatch.
This file is the dispatch ledger. Feature IDs and route details live in
[HOME/lifecycle](home-and-lifecycle.md), [system/services](system-and-online-apps.md)
and [media/social/portfolio](media-social-and-portfolio.md).

## Ownership

Current queued deliverables are in the [design-to-ship map](design-to-ship.md):
Lifecycle close/switch plus modal buttons, then power-on; HOME interaction fixes;
other lanes preserve existing design and take only captured Finish/Replace gaps.
These assignments do not mean a worker is running. No new chat or agent was
dispatched for this mapping update, and no new shared-file reservation is taken.

| Lane | Branch | Worktree under `/Users/paramveer/.codex/worktrees/` | Ownership |
| --- | --- | --- | --- |
| HOME | `codex/complete-home-ui-20261001` | `3ds-complete-home-ui-20261001` | HOME layout, toolbar, density, cursor, folders, drag, selected-title banners |
| Lifecycle | `codex/complete-lifecycle-20261001` | `3ds-complete-lifecycle-20261001` | Boot, launch, loading, suspend/resume, close/switch, sleep/power and ownership boundaries |
| Settings/helpers | `codex/complete-settings-20261001` | `3ds-complete-settings-20261001` | Settings menus, Health, Manuals, amiibo and Settings/internal helper UI |
| Camera | `codex/complete-camera-20261001` | `3ds-complete-camera-20261001` | Read-only Camera guide, folders, gallery, paging, photo and native chrome |
| Sound | `codex/complete-sound-20261001` | `3ds-complete-sound-20261001` | Sound guide, room, menus, supplied-song library/transport and music-owner cleanup |
| Social/applets | `codex/complete-social-20261001` | `3ds-complete-social-20261001` | Notes, Friends, Notifications; their local storage/navigation and supported native UI |
| Local services | `codex/complete-services-20261001` | `3ds-complete-services-20261001` | eShop, Zone, local Browser/Miiverse and their scope-limited service UI |
| Portfolio | `codex/complete-portfolio-20261001` | `3ds-complete-portfolio-20261001` | Eight portfolio apps, content routes, asset delivery, responsive console usability |

The original five lanes remain historical ownership guidance. These new
assignments are the current user-authorized execution split. The Assets lane's
provenance rules apply to every lane; shared converter/native-renderer changes
require coordinator review and regression coverage across consuming apps.

## Shared File Reservations

- Coordinator completed the selected-owner suspended-window slice at `81d0b3d8`
  in its assigned checkout. `home-suspended-window.ts`, firmware metadata,
  screens, portfolio capture access and native recovery changed together; no
  worker edited those interfaces concurrently. Reservation released after full
  checks and muted Sidecar recapture. [Evidence](../home-suspended-window-2026-10-02.md).

- Coordinator completed the bounded L-06/L-07 modal-input slice at `7dd76afa` in
  its assigned
  `3ds-home-fidelity-20261001` worktree: `system.ts`, `stock-screen-layout.ts`,
  `portfolio-screens.ts` and dedicated dialog tests. No worker is dispatched
  or editing those paths for this slice. Reservation released after tests/build
  and muted Sidecar replay. Native replacement remains separate and first in
  the queue; [evidence](../software-dialog-input-2026-10-02.md).

- Lifecycle owns changes to `src/os/system.ts`, `app-host.ts`, `app-input.ts`,
  `app-types.ts`, `system-transitions.ts`, `runtime-effects.ts` for its assigned
  lifecycle tasks. Other lanes submit a narrow required contract change first.
- HOME owns `src/os/home-*` and HOME-only input/state changes. Lifecycle-related
  `home-*` changes are coordinated explicitly with HOME before either edits.
- `src/os/stock-apps.ts`, `stock-screen-layout.ts`, `screens.ts`,
  `stock-screen-presentation.ts`, `app-registry.ts` and shared native loaders are
  **coordinator-reserved**. App lanes may diagnose and propose exact hunks but
  must not concurrently edit these monoliths. Coordinator grants one narrow
  reservation at a time, then records the integrated commit before the next.
- `src/scene/console-scene.ts` is coordinator-reserved for cross-lane integration.
  Portfolio may inspect it, but needs a reservation before changing it.
- App-specific `stock-native-*.ts`, dedicated navigation/model helpers and tests
  belong to their named lane. Every task still states its allowed file set.
- No lane edits the coordinator's progress/index/registry or another lane's
  worktree. A worker appends its result to a lane-local handoff and commits it.

## Dispatch Rules

Each worker starts with git status/branch/HEAD and the feature-map task, then
names its scope and available evidence before editing. Never assume the chat's
initial project working directory is the assigned worktree: use the absolute
path above for every command. The registered project points at a different Git
object database on DeveloperStorage; it is not the continuation checkout.

All chats use local project association and explicitly assigned existing
worktrees. Do not create an app-managed worktree from the project's unrelated
original checkout or import its dirty state. Source base and final delivery SHA
must be recorded for each lane. The coordinator integrates by reviewed
cherry-pick only in its own continuation branch, never by a shared-branch merge.

Start with one bounded task per lane. Limit each lane to at most one additional
subagent and give it a disjoint file set or a read-only review. No nested agent
fan-out. Workers run focused non-GUI checks; coordinator runs the complete
integrated suite/build and all GUI/native comparison. Do not run eight full
builds simultaneously on the user's machine.

If native evidence is missing, request the exact scenario/inputs/frame/region
from the coordinator and move to a ready task. Do not invent graphics or native
behavior. Every task ends with commit, feature IDs, tests, source identities,
evidence needed and remaining defects, not an unbounded status loop.

## Integration Gate

1. Worker commit is clean, scoped and independently reviewed.
2. Coordinator checks interface overlap and cherry-picks sequentially.
3. Code/assets: full tests, typecheck, build; shader/material changes also shader
   validation. Documentation: relative links and whitespace checks.
4. Coordinator performs muted Sidecar browser/native scenarios and affected
   regressions, retaining raw LCD hashes, input history, masks and inspected diff
   sheets. Audio remains open while muted. No tests-only 1:1 claim.
5. Update task state and progress with the integrated SHA and evidence. Failed
   comparisons return to the owning chat with a specific region and next action.

## Chat Dispatch

All eight worktrees were created and verified clean from `f5ed204c` before
dispatch. They are source-focused sparse checkouts; workers use the integrated
dependency installation read-only and do not install packages. The associated
Codex project is `3ds-idea`, but each prompt assigns the absolute worktree above.
The tools cannot attach an arbitrary existing checkout as the chat's initial
project directory. The assigned path, not the initial project cwd, is mandatory.

| Lane | Codex chat ID | First bounded task | Dispatch state |
| --- | --- | --- | --- |
| HOME | `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | H-12/H-10 contract/tests integrated; Work/Health browser suspension captured, native window gate needed | verification-needed |
| Lifecycle | `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | L-06/L-07/L-09 route tests integrated; Work close/cancel/confirm browser-inspected | verification-needed |
| Settings/helpers | `01a0f9a8-ffa2-7782-9336-915253cf5695` | S-*/G-* menu/leaf/Back, Manual/Health route tests integrated; capture tickets ready | verification-needed |
| Camera | `01a0f9a3-24c9-7e41-ad18-64689e20a28a` | M-CAM-04 keyboard/touch fixes integrated at `38bab8b7`/`dda25e9e`, independently reviewed and browser-inspected; native comparison pending | verification-needed |
| Sound | `01a0f9a3-7cd6-7e82-bddb-f6d2d3900dd8` | M-SND-* silent transport tests integrated; production song input absent | verification-needed |
| Social/applets | `01a0f9a3-bca6-75b1-8981-da3f5b47f12f` | C-* route tests integrated; missing-renderer/scroll capture tickets ready | verification-needed |
| Local services | `01a0f9a9-43a4-7ff3-b708-f5af6c0cb954` | O-* offline route tests integrated; Zone collapsed-detail and History capture tickets ready | verification-needed |
| Portfolio | `01a0f9a4-99cd-7b12-8bd2-b9e0028cdb4c` | Eight content graphs and actual selection-effect assertions integrated (`54497736`); both negative controls caught | verification-needed |

First-task edits are restricted to each lane's new
`tests/<lane>-completion-routes.test.mjs` and
`docs/workstream-handoffs/<lane>.md` (HOME uses `home`). Existing coverage is
reused; do not duplicate tests or commit knowingly failing tests. These are
bounded readiness slices, not claims that missing native UI is complete. Next
visual implementation requires the coordinator's named capture and a narrow
file reservation. No lane repeats source-only investigation indefinitely.

Historical first dispatch (superseded by the policy above): the first six chats initially started before that model request. All six
received accepted `gpt-6-astra`/`high` follow-up overrides; Settings and services
were created directly with those settings. An in-flight old-model turn may
finish before the override takes effect. All new helpers must use
`gpt-6.1-sol`/`medium`; no Fast-mode setting is claimed verified.

## First Deliveries - 2 October 2026

All eight initial commits are tests/handoffs, not new native screens. Integrated
HEAD `75cab5e2` passed 1,595 tests, zero failures, 23 skips and two TODOs;
typecheck passed. The production bundle used runtime `f5ed204c` for the first
browser captures. Full route evidence is in the [coordinator capture record](../completion-routes-2026-10-02.md).

| Lane | Worker commit | Integrated commit | Handoff |
| --- | --- | --- | --- |
| HOME | `9c459370` | `74771823` | [HOME](../workstream-handoffs/home.md) |
| Lifecycle | `9ac6faee` | `33981e97` | [Lifecycle](../workstream-handoffs/lifecycle.md) |
| Settings | `855ebe3f` | `931c6da6` | [Settings](../workstream-handoffs/settings.md) |
| Camera | `ad4b403a` | `bf4e8350` | [Camera](../workstream-handoffs/camera.md) |
| Sound | `8780c64a` | `e69ed6b1` | [Sound](../workstream-handoffs/sound.md) |
| Social | `7c3dadff` | `133ca575` | [Social](../workstream-handoffs/social.md) |
| Services | `2c6597a8` | `a0aea6dd` | [Services](../workstream-handoffs/services.md) |
| Portfolio | `04938361` | `75cab5e2` | [Portfolio](../workstream-handoffs/portfolio.md) |

Completed reservations: Camera's first correction `b6afb008` integrated as
`38bab8b7`, then touch correction `32b8bc60` as `dda25e9e`. The reservation is
released; `stock-apps.ts` is coordinator-reserved again. Portfolio test correction
`dc9876b1` integrated as `54497736`. All worker tasks are bounded and complete;
the verification-needed rows are not still-running chats or accepted scenarios.

Final full checks at `dda25e9e`: 1,605 pass, zero failures, 23 skips and one TODO;
typecheck/build pass. Camera final production keyboard, direct-touch, physical
Back, reopen and footer Back routes were inspected on muted Sidecar. Four
browser-before/after sheets were inspected; no native comparison is implied.
Independent GPT-6.1 Sol/Medium review closed both findings with 17 focused tests
and 12 extra tick/navigation Camera cases. No Fast-mode verification is implied.

## Historical Model Override - 2 October 2026

Historical receipt only; superseded by the supplied repository preference and
normal-speed policy at the top of this file. It is not a new dispatch instruction.

All eight registered chats accepted explicit `gpt-6-astra` / `high` follow-up
overrides. The follow-ups only acknowledge settings; they do not resume completed
implementation tasks. Future helpers require `gpt-6.1-sol` / `medium` with
standard, non-Fast service verified before dispatch. No new helper was started.
The available dispatch tools still cannot toggle or verify Fast mode, so that
part of the user's requested configuration remains unverified.
