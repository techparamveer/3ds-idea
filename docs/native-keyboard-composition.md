# Lower nickname capture and settled composition

`native-keyboard-composition.ts` assembles the captured keyboard texture contents
and the first live settled component for the ordinary existing-profile Settings
name request. It consumes the global schedule's retained frames, the existing
QWERTY initialization helper and `nativeNicknameTextPose`. It does not display
the transition texture, advance the fade, handle input or supply an upper LCD.

## API and ownership

```ts
const state = nativeNicknameComposition(
  sourcePack, normalizedName, 'capture', callerButtons, fontMetrics,
);
// Construct the renderer with state.pack under a distinct immutable alias.
drawNativeNicknameComposition(ctx, renderer, alias, state);
```

Use `phase: 'settled'` for the first resumed live draw. The font argument is
`{width, height, glyphs}` from the bound shared font; `glyphs` maps UTF-16 code
units to records containing `advance`. These advances drive selector auto-fit.
`callerButtons` contains plain
`{cancel, confirm}` strings from the normalized caller request; no Settings
message style transfers with those strings. The pack contains the twelve
required layouts, seven clips, English messages/style table and texture records.

The result includes the posed pack, painter order, fourteen child instances,
exact ordered pane submission audit, footer enabled state, cursor frame and
explicit remaining gaps. It changes no source pack fields. Keep each result
immutable and give it a separate renderer alias; changing a live renderer bank
in place is outside this API. The draw helper neither allocates nor disposes
the renderer, textures or fonts. The caller owns their lifetime.

The name must already be normalized to at most ten UTF-16 units. The cursor is
at its end with selection inactive. Empty, `Ada` and `ABCDEFGHIJ` are the three
original global-schedule cases verified here. The implementation retains the
native empty/all-U+0020/U+3000 validity predicate, but does not broaden this
checkpoint to other keyboard variants, editing or a general lifecycle.

## Native retained state

The immutable global contract SHA-256 is
`469bcfd540448437c5ec6e4d0da72a9c702d864cb59b08e551b40b67227293c0`;
its full `global-schedule.json` journal is
`596cfd4fa317e10706adff71cff7074d781ab72d1ed47af18e69768e80b4a094`.
They select capture during pass 1 and settled display during pass 16 of the
immediately ready fixture. These are CPU pass counts, not loading durations.

| Painter order | Layout | Retained state |
| --- | --- | --- |
| 1 | BG | Authored |
| 2 | Btm2Btn | Caller labels; empty OK group02 i0 frame0 at capture, frame1 settled; nonempty footer authored |
| 3 | TextArea_02 | Native ten-cell text pose and inline children |
| 4 | KeytopModeSelect | Root Y4, English labels; only group00 n0s1 frame1 |
| 5 | Keytop_qwerty | Root Y8; eight immediate writes retained, five Enter/dictionary i0 writes at global frame1 |
| 6 | LncArw_00 | Root Y8, both caller groups Appear frame0 |
| 7 | WaitIcon | Authored alpha0, no animation submission |

The arrow caller's table at `0x1b7a88` contains `G_arwL_00` and `G_arwR_00`.
These replace the resource's default `G_Scene*` groups. The module makes a local
clip descriptor with the caller-selected groups; it does not edit the source
clip or shared binder. Immediate calls follow group member order; root updates
visit the bound panes in layout traversal order. The audit includes bound panes
with no channels, matching the native journal without inventing channel writes.

At `N_decor`, four separate `DecorArea_select` instances draw in order and stay
hidden. At `N_transDecor`, one cellphone, four Roman, four conversion and one
cursor instance draw in that order. The first nine stay hidden. These instances
are inline children, not independent painter roots or a late overlay. Their
root InfluenceAlpha flag is enabled. Cursor frame1 is retained for empty input,
frame0 for both nonempty fixtures; both are visible. The MS cursor picture is
visible, the ordinary picture hidden. All local text/cursor/selection poses use
the existing text helper and renderer attachment API.

## Reproduction and checks

First replay the component-local fields with the research Python environment
containing Unicorn:

```sh
"$RESEARCH_PYTHON" -B scripts/verify-native-keyboard-composition-fields.py \
  --reference-root "$NATIVE_KEYBOARD_REFERENCE_ROOT" \
  --artifact-dir "$NATIVE_KEYBOARD_COMPOSITION_FIELDS_DIR" \
  --font-manifest "$NATIVE_KEYBOARD_FONT_MANIFEST"
```

Set `NATIVE_KEYBOARD_COMPOSITION_FIELD_EVIDENCE` to the resulting absolute
`verification.json` path, then run:

```sh
node scripts/verify-native-keyboard-composition.mjs \
  --artifact-dir "$NATIVE_KEYBOARD_COMPOSITION_ARTIFACT_DIR" \
  --reference-root "$NATIVE_KEYBOARD_REFERENCE_ROOT" \
  --font-manifest "$NATIVE_KEYBOARD_FONT_MANIFEST" \
  --canvas-module "$NATIVE_CANVAS_MODULE" \
  --field-evidence "$NATIVE_KEYBOARD_COMPOSITION_FIELD_EVIDENCE"
```

All paths must be absolute. The reference root is private
`runtime/keyboard-native`; the output directory must be on the SSD. The font
manifest has adjacent sheets, and Canvas points to `@napi-rs/canvas/index.js`.
The runner invokes `prepare-native-keyboard-composition.py` with Python 3,
freshly decodes original layouts/clips/styles/messages and writes a private pack,
caller strings and source-hash provenance beneath the output directory. Duplicate
texture names must have identical original bytes. No firmware data is committed.

The six-case check verifies the exact initial/capture/settled submission order,
root painter order, captured native non-animated properties, text writes,
selected mode scope, hidden child instances, cursor visibility, transparent
arrows/WaitIcon, source immutability and reverse repaint cache isolation. Native
pane journals record animation submissions without applying channels; therefore
raw pre-channel arrow alpha/position is not misrepresented as a final pose.

Real rendering uses 56 original textures and the shared bitmap font. All
required selector glyphs (`ËαЯ` included) are present. Removing the cursor
changes 74 pixels per case; removing arrows and WaitIcon changes none. The
capture and settled images are pixel-identical for each input, including empty:
the footer's distinct frame0/frame1 submissions currently yield the same source
clip pixels. The implementation nevertheless preserves both exact frame values.

The empty, Ada and full-buffer PNGs were inspected. The top row contains ten
cells and an orange cursor at the proper endpoint. English QWERTY fills the
middle, ABC is selected in the mode row, and Cancel/OK occupy the footer. Empty
OK appears disabled. No renderer diagnostics were emitted.

Artifacts live under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/keyboard-composition/`.
`verification.json` records hashes, ordered calls, per-case cursor contributions,
pixel identities and gaps. The matching test consumes the five corresponding
environment variables, writes a `test/` subdirectory and skips the private
resource check when they are absent. Always-on tests cover attachment wiring,
root order, checkpoint validation and failed child draws.
The component field report also binds the original code, message/style resources,
selector/text layouts, shared font manifest and immutable fixture dependencies
by SHA-256. The renderer runner checks these hashes before comparing the replay.
The focused composition/QWERTY/text/renderer checks passed all 26 tests with no
skips, including the text renderer rerun with its required title pack. TypeScript
and diff checks passed.

## Selector style and auto-fit fields

The selector initializer calls named wrapper `0x155e38` for `char_type_00..03`
with auto-fit enabled (`0x19326c`, `0x193288`, `0x1932a4`, `0x1932c0`). The new
field fixture executes that caller, named style setter, complete `0x12b278`
auto-fit helper and native string measurement using actual font advances.
Label/TSY1 lookup, resource construction, allocation and font metric queries
remain explicit endpoints. Styles 225–228 produce font size
`[15.000000953674316, 18]`, line spacing 0 and character spacing 0, matching the
authored values. Distinct incoming metric sentinels prove all four fields are
assigned; retaining authored values alone would fail those probes.

Measured widths for ABC, ËαЯ, Symbol and Mobile are respectively
`31.200000762939453`, `29.400001525878906`, `54.000003814697266` and
`48.60000228881836`. All fit their original panes. The native helper shrinks
only X when measured width reaches pane width: it subtracts one percentage
point from the available ratio, truncates, and clamps to an 80% floor, with
float32 rounding at the original operations. Width probes 12, 30 and 52 verify
the shrinking branch, including `[14.250000953674316, 18]` for ABC at width 30.
These probes are diagnostics, not additional native keyboard modes. All five
cases compare the implementation's final metrics to original CPU writes.

## Blank overlay material field

The complete original text initializer identifies the English write at
`0x1873f8`, reading zero from `0x1b8464`. Executing the original material color
constructor (`0x141130..0x141188`) maps seven source RGBA registers beginning at
source +0x14 to runtime +0x10. Therefore the runtime +0x14 write clears the first
constant RGBA, represented by `constantColors[0]`, to `[0, 0, 0, 0]`.
Bounded replay of the actual caller write against both original and distinct
sentinel registers confirms that only those four bytes change.

The authored constant is `[50, 50, 50, 255]`. The real space glyph has zero
width, so the normal blank overlay is pixel-empty before and after the write.
A separate real-font A probe produces 65 covered pixels with the authored
material and zero after clearing the register. This verifies its renderer
effect without relying on a blank glyph. All six normal component image hashes
remain unchanged. The field evidence lives under the adjacent
`presentation/keyboard-composition-fields/` directory; overlay probe PNGs are
in the component output directory.

## Explicit gaps

Original native world/anchor evaluation, clipping/material/glyph pixels, matched LCD captures,
browser comparison and transition caller-image content remain unverified.
These complete component specimens do not establish native LCD or 1:1 acceptance.
