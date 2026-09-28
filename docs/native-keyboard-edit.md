# Plain native nickname editing

`src/os/native-keyboard-edit.ts` implements the non-composing text-model branch
for the ordinary English Settings name request. `editNativeNicknameText`
accepts a normalized value of at most ten UTF-16 units, a cursor, an anchor,
selection activity, and either one inserted unit or backspace. It returns the
new state, the original function's acceptance result, and ordered paragraph
cache invalidation offsets. It performs no renderer or audio work.

This module is not wired into the live scaffold yet. Its caller still needs
the native input/selection gestures, modifier state, filtering/validation,
submit/cancel and timing behavior. Composition and pending accent handling
are outside this plain branch. The API rejects C0 controls and invalid state
instead of pretending to implement those other branches. Acceptance here means
the text model accepted the operation; it is not a submit-validity result.

Insertion occurs at the cursor. An active selection is removed before the
capacity check, allowing replacement in an otherwise full buffer. Backspace
removes an active nonempty selection, or the one UTF-16 unit before the cursor;
at position zero without a selection it returns false. Both operations collapse
the anchor to the resulting cursor and clear selection activity. The source
operates on UTF-16 units: deleting within a surrogate pair can leave a lone
surrogate. This describes model behavior, not which sequences the UI permits.

## Original-code replay

`scripts/firmware/keyboard_text_model.py` executes original keyboard entrypoints
`0x1401f8` (insert) and `0x140050` (backspace), including selection deletion
`0x13eb30`, insertion `0x15a578`, range deletion `0x15a98c`, capacity handling,
character access and original UTF-16 memory-moving helpers. The only execution
endpoint is paragraph cache invalidation `0x1568f0`, recorded by owner and offset.
It neither models layout caches nor supplies a fake text-acceptance result.

The supplied source is title `000400300000d002` v4096, executable SHA-256
`a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0`.
The existing-profile normalized request fixture (`Ada-normalized-config.bin`)
has SHA-256 `0583eafa16bde7ac9685bb62dba3a50c57cc042b91c5471f744fce86a99f40f0`.
Both identities are pinned before execution. Original binaries remain private.

The memory fixture explicitly supplies a ten-unit buffer model, its paragraph
owner, cursor/anchor/selection, English language byte1, status words `[1,0,0,0]`,
and zero composition counts/flag, candidate pointer, pending unit and character
override. It supplies no prediction-owner updates. These are bounded state
inputs, not a complete applet startup. Unexpected code boundaries, instruction
budget exhaustion, wrong paragraph owners and any source-image/global mutation
after setup fail the replay.

The 256 cases include empty, one-character, `Ada`, a ten-character buffer and
`A` + a surrogate pair + `B`; start/middle/end cursors and anchors; selection
active/inactive; insertion of space, `X` and `é`; and backspace. The committed
`tests/fixtures/native-keyboard-edit.json` contains numeric inputs, native
results and invalidation observations, with no source executable bytes. The
TypeScript test compares every state field and the invalidation order against
those original results and checks source-state immutability.

Reproduce using the SSD's Unicorn environment:

```sh
python -B scripts/firmware/keyboard_text_model.py \
  --code "$KEYBOARD_CODE" --config "$NICKNAME_NORMALIZED_CONFIG" \
  --output "$SSD_REPLAY_OUTPUT" \
  --golden tests/fixtures/native-keyboard-edit.json
node --test tests/native-keyboard-edit.test.mjs
```

The replay output must be outside the repository. The integration replay and
test log are under the firmware artifact root's
`reference/keyboard-text-model/verified.json` and `typescript-tests.log`.
All 256 original cases agree; the two TypeScript checks pass. The separate
text-component integration check passes all 11 tests with real resources and
Canvas. Native input eligibility, paragraph/glyph rendering and the complete
keyboard experience still require their own evidence.
