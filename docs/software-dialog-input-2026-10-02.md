# Software Dialog Input Correction

Runtime `7dd76afac25ec45481cb83a64d6d30659df51540` implements modal-button
ownership for L-06/L-07, not the unfinished native dialog or closing animation.
The preceding goal turn made progress by committing the design-to-ship map;
this turn changes the first task's real interaction path.

## Implementation

The retained `work-close-dialog-20261002/browser/lower.png` shows authored
buttons at `(23,173,128,29)` and `(169,173,128,29)`, but input accepted the entire
LCD below y170, split at x160. Four regression tests failed before correction:
margins/footer could act, and Cancel-to-Close drags could confirm.

`stock-screen-layout.ts` now owns the existing rectangles, shared by painter
and input. Only a release in the same button where that pointer began activates.
Blank space, gutter, another pointer, cancellation, input release and sleep do
not confirm. Dialog entry clears earlier contact. The existing active-button
feedback highlights the owned button and clears when dragged away. A/B and
compatibility one-shot touch keep the same reducer actions. Native Power and
Save/Load geometry are unchanged. No new state owner, native asset/font/cue or
shader was added. These bounds/feedback are authored-placeholder adapters, not
native measurements; replace them with source-established geometry later.

## Verification

Focused32/32; full **1658 pass,0 fail,23 skip,1 TODO**; typecheck/build pass.
Tests cover both dialogs, edges, invalid coordinates, pointer ownership, cancel,
interruption, retained application and A/B parity. No shader/material change.

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/software-dialog-input/`.
Ten paired raw LCDs, dimensions/nonblank checks, per-file SHA-256s and histories
are indexed in `summary.json`, SHA
`3d7507de75eda857d446222545786d4a8aa22432c7bc042d1dff906bf6cfffac`.
Capture prefix: `reference/scenario-matrix/v1/captures/software-dialog-`;
suffix: `-20261002/browser/`.

| Captures | Browser outcome |
| --- | --- |
| close-idle, footer-inert | Tap233,225 leaves dialog/Work intact |
| cancel-pressed, cancel-dragged-to-confirm | Cancel highlights; dragging to Close clears highlight; release is inert |
| cancelled | Cancel retains Work at HOME |
| switch-idle, switch-cross-drag-inert | About prompts; gutter and cross-button drag cannot switch |
| switch-confirm-pressed, about-open | Owned Close press highlights, release launches About |
| close-confirmed | About -> HOME -> Close -> Confirm returns HOME without an app owner |

Inspected lower LCDs: Cancel pressed/dragged, switch Confirm pressed, About main,
final HOME. Inspected upper: close idle and About. Cancel's rectangle changes3658
pixels >2 while pressed and returns exactly to idle pixels after dragging away.
This is a browser-only feedback comparison, not native parity.

Setup used existing DOM accessibility buttons; dialog actions used mouse
down/move/up projected from four live LCD targets with viewport rounding.
Native timing is unmatched. Recursive capture history initially exceeded CLI
argument size. Earlier pairs were preserved, logging corrected, and the observed
pending press resumed; both histories remain. Browser errors were empty.

Sidecar verified at `(1800,367,1357,935)`; Chrome51615/window2548 was
`(1810,397,1150,780)` before navigation. Browser launch and all captured app
states were muted. CDP close/launcher exit0 verified. Preview server59641 remains
on3021. No Azahar was launched or changed.

## Remaining Work

**Native-compared: not performed.** Actual application -> HOME return remains
unestablished in retained Health attempts. No native pair, mask or native diff
exists for this slice; historical matrix unchanged. These browser checks do not
accept L-06/L-07. Authored artwork, missing button glyphs, immediate close,
missing closing/switch presentation and suspended upper window remain defects.
Next is native close/switch presentation, then power-on and HOME interactions.
Portfolio/offline content, local persistence, preview timing, source-dialog
assembly and Settings scroll/mask fits remain adaptations. Native pixels,
input, motion and audio remain open; no1:1 claim.
