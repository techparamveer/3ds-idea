# Lifecycle workstream handoff

Base: `f5ed204c7955880d59b097a632d48deaa7d80252`  
Branch: `codex/complete-lifecycle-20261001`  
Delivery: the focused commit containing this handoff  
Feature IDs: L-06, L-07, L-09

## Delivered contract

`tests/lifecycle-completion-routes.test.mjs` adds the three named semantic
routes without changing runtime or presentation code:

- `life-close-cancel-confirm`: Work launches, returns HOME suspended, opens the
  close dialog, cancels, reopens, and confirms. Cancel retains the same owner,
  state, sequence, and `homeReturn`; confirmation removes every publication of
  that owner without creating a replacement.
- `life-switch-cancel-confirm`: suspended Work selects About and enters a
  pending switch. Cancel creates no About instance and Work resumes under the
  same owner. The repeated switch creates exactly one fresh About owner only
  after confirmation, removes Work, and remains the sole active/application
  publication after the launch settles.
- `life-helper-return`: System Transfer and System Update each replace the
  Settings application slot with a caller-linked child, then Back removes that
  child and republishes the exact Settings parent at Other Settings page/focus
  `(2,2)` and `(3,1)` respectively.

The assertions cover `System.app`, dialog/pending fields, runtime application,
active and `homeReturn` owners, instance membership, suspension, instance
sequence, and the active `AppView`. This is a compact cross-route regression
for existing semantic state; it is not a new APT/native-lifecycle claim.

## Deterministic replay inputs

The test file is the executable replay script. Its input order is:

1. `life-close-cancel-confirm`: boot settle -> launch Work -> launch settle ->
   HOME -> B -> B (cancel) -> B -> A (confirm).
2. `life-switch-cancel-confirm`: boot settle -> launch Work -> launch settle ->
   HOME -> select About -> A -> B (cancel) -> HOME (resume Work) -> HOME -> A
   -> A (confirm) -> launch settle.
3. `life-helper-return`, repeated for Transfer and Update: boot settle -> launch
   Settings -> launch settle -> Other Settings -> Next x2/x3 -> activate helper
   -> launch settle -> B.

For coordinator-native/browser capture, use the same inputs from clean state
and retain paired LCDs at each dialog, the post-cancel HOME/Work resume, helper
main, and final owner-return boundary. Required scenario names remain
`life-close-cancel-confirm`, `life-switch-cancel-confirm`, and
`life-helper-return`; record exact input timestamps, raw LCD hashes, empty or
reasoned masks, and inspected diff sheets. Workers did not operate Azahar or a
browser in this slice.

## Evidence and remaining gaps

- Existing source evidence only: Settings scene-table records identify Transfer
  as Other Settings page 3 row 3 and Update as page 4 row 2; existing helper
  packs place their Back controls at lower-LCD `(0,208,120,32)`. This slice adds
  no asset and no new source/native identification.
- L-06/L-07 dialog visuals remain the shared authored painter. There is still no
  source-mapped distinct close/switch composition or coordinator native capture;
  the first visual follow-up must be the named Sidecar capture, not a guessed
  painter change.
- Settings helpers remain inert/read-only adaptations. Native return arguments,
  cross-title timing, motion, and audio are unproved. Audio must stay muted.
- No deterministic reducer defect emerged, so no production fix is proposed.

## Model-policy acknowledgement

The coordinator relayed the 1 October 2026 update after this turn began: all
workstream chats use GPT-6 Astra with high reasoning, and any new bounded helper
uses GPT-6.1 Sol with medium reasoning. No helper was created for this slice,
and this handoff makes no claim that the already in-flight coordinator model or
Fast-mode/service tier changed.
