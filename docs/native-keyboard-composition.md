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
`{width, height}` from the bound shared font. `callerButtons` contains plain
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

```sh
node scripts/verify-native-keyboard-composition.mjs \
  --artifact-dir "$NATIVE_KEYBOARD_COMPOSITION_ARTIFACT_DIR" \
  --reference-root "$NATIVE_KEYBOARD_REFERENCE_ROOT" \
  --font-manifest "$NATIVE_KEYBOARD_FONT_MANIFEST" \
  --canvas-module "$NATIVE_CANVAS_MODULE"
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
pixel identities and gaps. The matching test consumes the four corresponding
environment variables, writes a `test/` subdirectory and skips the private
resource check when they are absent. Always-on tests cover attachment wiring,
root order, checkpoint validation and failed child draws.
The combined composition/QWERTY/text/renderer selection passed all 23 tests
with no skips; TypeScript and diff checks passed.

## Explicit gaps

The selector initializer calls named wrapper `0x155e38` for `char_type_00..03`
with auto-fit enabled (`0x19326c`, `0x193288`, `0x1932a4`, `0x1932c0`). The global
fixture stops at its named-message boundary. Resulting style/auto-fit writes
have not been replayed here; this component retains authored selector metrics
and reports the gap. This is distinct from the resolved QWERTY conversion style.

The blank `T_trans` material write at +0x14 remains unresolved. Original native
world/anchor evaluation, clipping/material/glyph pixels, matched LCD captures,
browser comparison and transition caller-image content remain unverified.
These complete component specimens do not establish native LCD or 1:1 acceptance.
