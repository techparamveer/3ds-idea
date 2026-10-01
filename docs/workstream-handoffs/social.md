# Social/applets bounded route handoff

Base: `f5ed204c7955880d59b097a632d48deaa7d80252` on
`codex/complete-social-20261001`. Delivery is the commit containing this file;
the coordinator report records its exact SHA. Owned feature IDs are `C-NOT-01`
through `C-NOT-05`, `C-FRD-01` through `C-FRD-04`, and `C-NTF-01` through
`C-NTF-04`. This slice changes only
[`tests/social-completion-routes.test.mjs`](../../tests/social-completion-routes.test.mjs)
and this handoff.

The new fixture-driven contract test ties together only already-implemented
routes:

- Game Notes 4x4 selection, immutable drawing, B return to the same slot, and
  the rule that a complete frozen LCD pair belongs to the suspended application
  instance rather than the Notes applet.
- Friend own-profile data and B return, plus reachability and B return for a
  populated local friend ID. It deliberately does not assert generic detail
  pixels or text as correct.
- Notifications' nine disabled source-profile rows (eight unread), explicit
  empty state, enabled custom records, movement to row 6, the four actionable
  rows in that list window, custom detail/B, and main B/close. It deliberately
  does not assert the current fixed scrollbar thumb.

No reducer, renderer, source resource, persistence, network/account operation,
notification body, or stock save changed. The test's custom bodies are local
test fixtures only and are not production-generated content. Existing source
rows remain inert because their bodies are unverified.

## Evidence boundary

The implemented route facts come from `stock-apps.ts`,
`notes-suspended-capture.ts`, and `stock-screen-layout.ts`. Source presentation
and known limitations are recorded in [native personal tools](../native-personal-tools.md)
and [Notes suspended capture](../native-notes-suspended-capture.md). The pinned
Notifications list identity is title `000400300000a002`, version 4097, content
index `00000012`; its code SHA-256 is
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`.
The delivered unread lamp and CIC badge mappings, including their ROMFS hashes,
are in [the unread-marker trace](../notifications-unread-marker-source-trace-2026-09-27.md)
and [CIC validation](../notifications-cic-badge-validation-2026-09-27.md).

The retained Notifications settled pair remains a whole-scenario failure at
6,239 upper / 3,876 lower pixels over 2/255 with an empty mask. Its three unread
marker crops are locally at zero pixels over threshold, but that does not accept
the list. Notes has browser/source evidence and no matched native app capture.
Friend has source renders for the empty main and own profile, but no accepted
native own-profile or populated-friend detail pair. None of the tests added here
is browser inspection, native comparison, motion evidence, or 1:1 acceptance.

## Prioritized coordinator capture tickets

### Game Notes — `notes-grid-editor-switch`

1. On both the isolated EUR/English original-hardware profile and the integrated
   browser, open Health and wait for a complete paired LCD publication; press
   HOME; open Game Notes; select slot 10 by lower touch `(200,132)`; capture the
   initial Double pose; touch Switch `(252,226)` and capture source frames 0 and
   25 for Up, then repeat for Down; press B and capture the returned grid.
2. Save Azahar's own 400x480 PNG at each checkpoint and crop upper
   `(0,0,400,240)` and lower `(40,240,320,240)`. Save the browser's raw 400x240
   upper and 320x240 lower targets. Use empty masks initially. Record input
   down/up times, Notes owner, suspended application owner, capture generation,
   and open cue status (audio stays muted and therefore unaccepted).
3. Inspect the full two-LCD sheets. Name residuals specifically for the selected
   slot rectangle `(165,110,70,44)`, lower Back `(0,212,44,28)`, lower Switch
   `(230,212,44,28)`, the captured upper/lower application panes on Notes'
   upper LCD, and the returned slot-10 cursor. Expected ownership is the
   suspended Health instance; Notes must not overwrite the frozen pair.

Dependency/stopping rule: this needs a native route capture with the same
suspended caller and switch checkpoints. Without it, keep C-NOT visual/timing
status `fail` or `source-gap`; do not fit pixels, add editable tools, invent a
software title panel, or claim the provisional 60 Hz cadence/cue timing.

### Friend List — `friend-list-local-profile-and-populated-gap`

1. First capture the native offline main -> own card -> B -> main route if it is
   reachable without changing accounts/network/profile data. Replay the same
   inputs against a browser fixture with nickname `Ada`, status `Existing
   status`, and no invented Mii/friend code/favourite title. Capture entry,
   profile and returned main as complete raw LCD pairs.
2. Inspect the full sheets and name residuals for the lower selected own-card
   rectangle `(107,114,106,66)` and the curved Back footer union at
   `y=208..239`. Preserve the card-turn/task sequence as open unless frame
   checkpoints are captured.
3. Separately use an already-authorized local saved fixture containing friend
   ID `friend-7`, select that row, open it, and capture the full two LCDs plus B
   return. The reducer route is reachable, but `friends/friend` has no native
   view selection, friend data projection, or dedicated painter. The capture
   must identify that visible gap; it must not be used to bless generic fallback.

Dependency/stopping rule: the current isolated launch has previously reached
native error `002-0121`. If the own-card or populated row cannot be reached
without network/account/profile mutation, record the ticket `blocked` and keep
the local Friend behavior an explicit offline adaptation. A captured native
detail state and source element mapping are prerequisites to any painter work;
shared presentation changes also require a coordinator reservation.

### Notifications — `notifications-list-scroll-and-readonly-detail`

1. Start at the neutral nine-row source profile (row 0 read, rows 1-8 unread).
   From settled entry, issue six discrete Down presses with recorded down/up
   timing, capturing neutral entry, each window shift, and selection 6. Attempt
   Open on source row 6 and confirm it remains inert/read flags unchanged.
2. Capture complete native/browser pairs at selection 6. Inspect the full sheets
   and separately report the lower visible row strip from `(0,27)` through
   `(288,212)`, the declared 53 px row boxes starting at y `27`, `80`, `133`,
   and `186` (the footer owns their overlap from y 212), the clipped fifth row
   above the footer, and the complete SlideBar connected component. Do not
   copy the current browser `N_Slide_00` translation `[0,55,0]` into an expected
   value: the effective item count, thumb translation, motion, and pulse remain
   untraced.
3. In the browser-only adaptation checkpoint, load one explicit custom record,
   open its stored detail, and press B. Capture both raw LCDs and label the
   generic detail as an adaptation. Do not create a body for any of the nine
   source rows or mark a row read.

Dependency/stopping rule: coordinator must provide the native selection-6
capture/input history and either executable evidence for the SlideBar item-count
writer or an accepted capture fit explicitly labelled as an adaptation. Native
detail layout/title/body provenance is required before replacing the generic
custom detail. Until then C-NTF-02 and C-NTF-04 remain gaps and the whole list
scenario remains `fail`.

## Verification and remaining gaps

Focused clean run:

`NODE_PATH=/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001/node_modules /Users/paramveer/.local/bin/node --test tests/social-completion-routes.test.mjs tests/stock-apps.test.mjs tests/notes-capture-switch.test.mjs`

Result: 54 passed, 0 failed, 0 skipped. The new file alone passed 3/3. A first
attempt also named `tests/notes-suspended-capture.test.mjs`, but that existing
test imports the `typescript` package and Node ESM did not resolve it across the
worker's absent local `node_modules`; that file did not execute. No install,
symlink, or dependency mutation was made. Relative links and `git diff --check`
passed. Full suite, typecheck, build, browser/Azahar operation, raw LCD capture,
diffing, and matrix mutation are coordinator work and were not run in this
source-only worker.

Still non-native or unaccepted: legacy Notes stroke widths/eraser display,
no-software pane composition, hidden software-title panel, switch timing/cue;
Friend missing Mii/dynamic card data and all populated detail presentation;
Notifications fixed scrollbar, generic custom detail, unverified source bodies,
read transition, pulse/motion, HUD/footer residuals, input cadence, and audio.

Model-policy acknowledgement: during this task the coordinator relayed the
human's new GPT-6 Astra/high workstream preference and GPT-6.1 Sol/medium helper
policy, with no Fast mode. No helper was spawned. This handoff does not claim
the already-running turn changed models or that a Fast/service-tier setting was
technically changed without settings evidence.
