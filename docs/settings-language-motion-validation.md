# Settings Language source scroll motion

The Language arrow adapter now plays the original `Country_D_00_ScrollDw`
and `Country_D_00_ScrollUp` clips before recycling the list slots. English
remains configured; rows, OK and D-pad selection remain inert. This extends
[the Language source audit](settings-language-source-audit.md), whose first
arrow pass displayed settled outcomes only.

## Source evidence

The Settings EUR 10.7.0-32E executable is mapped at `0x100000`; its full
SHA-256 is `1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
Firmware was inspected as data, never executed.

- Constructor `0x19f58c` loads `_ScrollDw` into r6; `0x19f5b4` loads
  `_ScrollUp` into r7. Stores at `0x19f878`/`0x19f880` pass these in argument
  fields +0x1c/+0x20. Constructor `0x19f204` copies that structure to
  instance +4, yielding controller fields +0x20/+0x24.
- Dispatcher `0x19f044` rejects arrows while either controller is in state
  1 or 2. Arrow 0 uses +0x20 (`ScrollDw`), arrow 1 +0x24 (`ScrollUp`).
  Bounds stay 0–4. Update routines `0x1983d4`/`0x198434` wait for state 2,
  then decrement/increment the top row.
- Both original clips contain four frames, 0–3. Their `Group_01` names only
  `Null_Slideanim`. Its Hermite Y track moves 0→−44 for `ScrollDw` and
  0→44 for `ScrollUp`, with zero endpoint slopes. Binding that group avoids
  unrelated constant tracks in the same CLAN changing the rest of the page.
- `0x198484` computes thumb ratio `(top × 44 + animatedOffset) / 176`.
  The painter samples the same source Y track for the thumb; rows keep their
  old slot labels until the endpoint, when the top changes by one.

Only those two original clips were added to the Settings publication plan.
The publisher preserves their source-member hashes; the delivery test checks
both. Of the public manifest resource records, only the Settings layout pack
changed. No firmware executable or reconstructed audio is published.

## Browser adaptation and limits

The browser clock maps elapsed time to integer frames at nominal 60 Hz and
commits at 50 ms. This is a timing adaptation, not measured native latency.
Overlapping arrows are ignored. Back discards transient motion; suspend/sleep
settle it. Reduced motion paints the target pose immediately. No shared
preference, save, device or network operation is emitted.

Original arrow `R_SlideBar_Select`/`_Invalid` clips and the constructor's
`Group_00`/`Group_01` controls exist, but their press/release/repeat and D-pad
focus dispatch are not sufficiently traced. They are deliberately unpublished
and unused. Drag, hold/repeat, row selection and language confirmation also
remain unsupported. The earlier initial centred-thumb and hidden-slot source
questions remain open. No native LCD comparison or live browser verification
was performed in this worktree; strict 1:1 acceptance remains unproven.

## Verification

- 65 focused runtime, delivery and screen-layout tests pass. They include
  overlapping arrows, malformed ticks, bounds, completion, lifecycle cleanup,
  immutable English/shared data/save, source group binding and clip geometry.
- TypeScript checking and production build pass.
- Settings source rendering passes for five main and 38 subpage pairs
  (86 PNGs), with zero renderer diagnostics and immutable source packs.
  Each direction has four distinct lower poses; all upper frames match.
  Both animation endpoints exactly match their corresponding settled row
  pixels. Reduced motion exactly matches the target settled lower image.
- Intermediate lower renders in both directions were visually inspected.
  Browser QA is delegated to the integration task.

Private artifacts are under the SSD firmware root
`reference/language-arrow-motion/`: `tests.log`, `typecheck.log`, `build.log`,
`render/verification.json` and paired images. Existing source listings are
`presentation/settings-language-source/asm/list-object.asm` and
`reference/language-scroll/list-arrow-{dispatch,update}.asm`.
