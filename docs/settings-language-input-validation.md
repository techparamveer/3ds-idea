# Language thumb input source validation

This extends the [Language motion adapter](settings-language-motion-validation.md)
with source-derived thumb dragging and release snapping. It keeps the portfolio's
read-only English configuration. It does not claim complete native Language
input fidelity. The earlier [input-routing audit](settings-language-input-source-audit.md)
is preserved; callback identity and numeric splitting are extended here.

The implementation is isolated in home-disk clone
`/Users/paramveer/.codex/worktrees/3ds-language-input`, based on `a20ffa7`.
The SSD was read for existing firmware data only. New artifacts are under
`/Users/paramveer/.codex/artifacts/3ds-language-input/`.

## Source trace

Settings EUR 10.7.0-32E code SHA-256:
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
All addresses below use code base `0x100000`; firmware was never executed.

- Scene constructor `0x1976a0..0x1976a8` installs callback `0x206f0c`
  through `0x1f375c`, together with the owning scene pointer. EUR construction
  `0x22c9ac..0x22c9b0` stores the slider at owner +0x18, index 2 of the
  auxiliary-widget array starting at +0x10. The slider's `0x1d28c4` trampoline
  tail-calls the registered callback synchronously. Its kind-1 path scans that
  array at `0x206fb0..0x206fd8`, then invokes the owner's event vtable with
  kind 2 and matched index 2. Language therefore calls `0x19f044(2)`, entering
  thumb-controlled list mode 1. This closes the prior callback identity gate;
  exact polling-to-draw scheduling remains outside this adapter.
- Slider idle dispatch `0x1f3bd8..0x1f3c7c` distinguishes thumb hit kind 1
  from groove hit kind 2. Thumb capture records touch Y minus current thumb Y
  in instance `+0x1c`, starts its Select controller and enters state 1.
- Thumb state 1, `0x1f38c0..0x1f39b0`, exits on release before reading a new
  coordinate. Otherwise it subtracts the captured grab offset, clamps the
  result to midpoint ± half travel, writes both the visible `N_Slide` and
  `B_Slide_00`, and publishes the applied slider value in `+0x18`.
- With the already traced 104-pixel thumb in the 144-pixel groove, travel is
  40 pixels and local Y bounds are −20 and +20. The source thumb bound is
  24 × 104 after its constructor resize; its Country mount is (304,101).
  The shared touch geometry therefore follows `[292,316)` in X and
  `[49−thumbY,153−thumbY)` in touchscreen Y.
- `0x1f3cbc` converts local slider Y into `1 − (Y + 20) / 40`.
  List drag mode 1 (`0x1f03d8`) multiplies this by the 176-pixel scroll range,
  divides by the 44-pixel pitch, and splits integer/fractional parts through
  `0x138b00`. That helper masks the IEEE fraction bits and returns the signed
  fractional remainder. A remainder of at least half a row increments top and
  subtracts one pitch, retaining a residual in [−22,22).
- The list writes that residual to `Null_Slideanim.y`; its ordinary refresh
  rebinds row `top + slot − 2`. Rebinding and residual translation preserve
  continuous row positions across each half-row boundary.
- Once the slider is inactive, `0x1f0478` enters list mode 5. Its handler
  `0x1f01c8` moves the residual toward zero by 8.0 per update, clamps a crossing
  to zero, and updates the thumb from the applied list position. At most three
  updates finish a half-row residual. A captured release retains the last
  applied sample; it does not jump to a late release coordinate.

`scripts/audit_settings_language_thumb.py` verifies the full executable hash,
relevant ARM words, list-mode jump table and delivered slider geometry, and
records traced range hashes in `source-audit.json`.

## Browser adaptation

The existing AppModule owns transient drag fields; there is no new state host.
`stock-screen-layout.ts` owns the thumb hit region. One pointer owns a capture,
including motion beyond the thumb/LCD boundary. Other pointers and overlapping
arrow actions cannot steal it. Release cannot activate a Back or arrow target
underneath it. No language row is selected or applied and no save/shared/device
effect is emitted.

Browser move events supply samples in place of native polling. The snap clock
uses the existing nominal 60 Hz adapter and preserves elapsed fractions across
ticks. Source row arithmetic uses float32 operations. Pointer cancellation,
suspend, sleep and close settle and release input ownership; this is browser
cleanup behavior, not a claim about native APT timing. Reduced motion settles
release snapping immediately in presentation while direct dragging stays direct.

The initial centred-thumb question remains open. An untouched list still uses
layout Y=0. Capturing it keeps that pose; its first applied move maps that
centre to top=2, as the traced ratio function dictates. A matched native capture
is needed to establish whether a different earlier initialization changes this
entry case. The implementation does not silently assume top-aligned entry.

## D-pad, arrow press/repeat and groove status

No guessed behavior was added for these controls:

- Language handler `0x22ce1c` delegates scene events through `0x195358`.
  A type-2 list event reaches `0x19f044` at `0x22cf70`; a decided row instead
  maps the visible slot back to the absolute item and updates cached language
  state. The complete physical-key → focus-manager → scene event path is not
  established by those calls alone.
- The arrow constructor at `0x19f63c..0x19f708` binds two group-specific
  Select/UnSelect/Invalid controllers and passes flag word `0x01000021` to
  `0x1f31b4`. That word has not been decoded into verified press/repeat timing.
- Groove state 2 (`0x1f39c0`) moves by 8 pixels per update toward its target and
  may transition to captured dragging. Its hit arbitration and held-pointer
  scheduling are not ported in this change. Groove clicks remain inert.
- Existing completed-touch arrow scrolling stays as documented. Thumb Select/
  UnSelect visuals, D-pad focus, row decisions, held-arrow repeat and groove
  paging remain acceptance gaps.

The coordinator attempted native Settings observation, but the computer-use
screen-observation pipe failed. No new native interaction result or live-browser
result is claimed here. Browser and native acceptance remain open.

## Verification

- 77 focused runtime, screen-target and Language-delivery tests pass. The seven
  added input tests cover moving grab offsets, full-range/out-of-bounds drag,
  half-row rounding, signed snap steps, split tick equivalence, foreign pointers,
  release over Back, invalid samples, cancellation/lifecycle cleanup, shared/save
  immutability and untouched centred entry.
- TypeScript checking passes.
- The Settings source verifier passes five main and 44 subpage pairs: 98 PNGs,
  zero diagnostics and immutable source packs. Five drag/snap residual poses
  have distinct lower-screen hashes; all upper images stay unchanged. Zero
  residual and reduced-motion snap match the settled top=1 lower image exactly.
- `language-drag--22-bottom.png` and `language-drag-11-bottom.png` were visually
  inspected for continuous list positioning, row masking and thumb alignment.
- Build and live browser checks remain with integration; this isolated sparse
  source clone does not contain the preserved model delivery.

Artifacts: `tests.log`, `typecheck.log`, `source-audit.json`, `render.log`,
`render/verification.json` and the paired PNGs under the home-disk root above.
