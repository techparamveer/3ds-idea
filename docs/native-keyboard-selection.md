# Native nickname cursor and selection

`nativeNicknameTextPose` extends the existing first-text-update helper to accept
an explicit plain-text model cursor and selection anchor. It covers the same
single-line, ten-UTF-16-unit Settings nickname request. Initial callers retain
`nativeNicknameInitialTextPose`; text editing remains in `native-keyboard-edit`.

The original ARM replay in `scripts/firmware/keyboard_text_selection.py` executes
constructor187670, initializer186d48, cursor/selection setter13f190 and text
update1891c0, including186718. It uses the immutable, hash-pinned private text
fixture, correcting its language endpoint by executing15bcfc with English1.
Its resource/font/world/controller endpoints and one-line paragraph-cache
boundary remain explicit. The local update stops before shared-layout187868.

The numeric fixture contains154 cases: every cursor and anchor for empty, Ada
and ABCDEFGHIJ, plus each cursor with selection disabled. It contains no firmware
binary bytes. Regenerate and compare using the private research Python runtime:

```sh
python -B scripts/firmware/keyboard_text_selection.py \
  --reference-root "$NATIVE_KEYBOARD_REFERENCE_ROOT" \
  --output "$SELECTION_ARTIFACT_DIR/replayed.json" \
  --golden tests/fixtures/native-keyboard-selection.json
```

The source setter uses its final argument to clear or extend selection, and
preserves the anchor while extending. The pose keeps all four separate selection
layout instances. Only the first can be visible for this one-row request. Its
local X is17 times the lesser endpoint; its width is the float32 span minus
1.2592594623565674 and its height is18. The maximum-position cursor retains the
native end correction. Equal endpoints hide the selection even when its model
flag remains active. Hidden decoration geometry is deliberately not presented
as a history-preserving native state; only its invisibility is consumed.

## Child-layout ordering

Native attachment appends decoration roots to named parent panes. In
TextArea_02, N_decor lies after the cell pictures and before the glyphs.
Drawing the entire text layout and then overlaying a selection would tint the
text incorrectly. `NativeLayoutRenderer.draw` now accepts `attachments`, whose
callbacks run after each pane's authored children and before later siblings.
They inherit the current pane transform and InfluenceAlpha chain. Hidden
ancestors suppress them. Exceptions restore Canvas state and inherited alpha.
The callback is looked up per draw, independently of the retained pose cache.

Child draws use the parent's normal canvas center to cancel the attachment
translation. These keyboard layouts all have a320×240 canvas. A differently
sized child must supply the parent's half-size through its `center` option.
`withPaneParent` remains available for independently ordered composition.

## Verification and remaining work

All154 original-ARM cases agree with the TypeScript model/visible decoration
writes. Renderer tests cover authored-child/attachment/sibling order, replaced
callbacks with a cached pose, transforms, alpha, hidden parents and exception
cleanup. The seven-case real-resource check uses original TextArea_02,
DecorCursor and DecorArea_select, both required textures, the shared bitmap
font and the strict title loader. It compares original numeric overrides,
reverse repaint cache stability and source immutability.

```sh
node scripts/verify-native-keyboard-selection.mjs \
  --artifact-dir "$SELECTION_ARTIFACT_DIR/render" \
  --reference-root "$NATIVE_KEYBOARD_REFERENCE_ROOT" \
  --pack "$NATIVE_KEYBOARD_SELECTION_PACK" \
  --font-manifest "$NATIVE_KEYBOARD_FONT_MANIFEST" \
  --canvas-module "$NATIVE_CANVAS_MODULE"
```

The private review is under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/keyboard-text-selection/`.
`prepare.py` builds the private three-layout pack from original resources;
`pack/provenance.json` records texture identities. The rendered Ada selection
was inspected: the green selection covers d/a behind the visible glyphs and the
orange cursor sits at its active endpoint. The four nonempty selection cases
produce1400–7460 changed pixels. Intentionally painting the highlight late
changes439–2260 pixels, demonstrating that attachment order matters.

These are component and original local-write checks. Pointer selection,
directional input, repeat, filtering, blink timing, keyboard lifecycle and
integration are separate work. Native world matrices, glyph pixels and full
LCD screenshots have not been matched by this check. It does not establish
whole-keyboard or browser 1:1 acceptance.

Integration checks:25 focused real-resource tests passed without skips. The
full suite passed992 tests with15 optional-environment skips; four of those
skipped keyboard checks are included in the focused run. Type checking and the
production build passed. Other optional Canvas/animation/audio environment
checks were not repeated in this pass; their prior evidence remains separate.
