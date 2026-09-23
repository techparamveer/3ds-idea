# Native nickname text component

`src/os/native-keyboard-text.ts` builds the local first-text-update overrides
for the ordinary existing-profile Settings name request: `TextArea_02`, maximum
10 UTF-16 units, one row, fixed width, no composition, cursor and selection
anchor at the end. It is not wired into the live keyboard yet.

The input must already be normalized and contain no control units. The helper
rejects other input instead of implementing the still-unverified keyboard
filters. It indexes UTF-16 units, including separate surrogate halves, as the
source set-text calls do. Native replay validation currently covers ASCII only;
the indexing test does not establish Unicode filtering or glyph appearance.

The helper retains source text styles, material references, sizes and hierarchy.
Occupied and empty cell colors come from the decoded first and second picture
panes. It moves the first ten cells to the native local positions, hides cells
11–32 without rewriting their authored text or geometry, fills unused visible
cells and `T_trans` with one space, and places the decoration parents at the
first text cell. It returns separate cursor-layout overrides and the names of
decoration layouts whose instances must remain hidden. Child attachment,
animation sampling and world transforms remain the composition owner's work.

`NativeLayoutRenderer.withPaneParent` now accepts parent overrides as its final
argument, after the draw callback. The caller must pass the same overrides used
for the parent draw. This applies the moved `N_transDecor` and scaled text-area
ancestor to the cursor instead of using their authored positions. The pose
cache includes those overrides. Existing callers without overrides retain
their prior behavior; tests cover placement, scale, inherited alpha, visibility,
changed override values and restoration to the source pose.

At lengths below 10, the initial plain-text cursor X is 17 times the UTF-16
length. At the full buffer it is 168.11111450195312. The helper preserves the
native float32 width/offset arithmetic, including the adjustment made only at
the full-buffer end. It does not generalize this initial state to middle edits,
selection, composition, blink timing or an entire keyboard frame.

## Evidence and checks

Keyboard title `000400300000d002` v4096, executable SHA-256
`a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0`.
Original constructor `0x187670`, initialization `0x186d48`, and update
`0x1891c0` / `0x186718` execute in the bounded private fixture. The fixture
stops before layout/controller pass `0x187868`. Resource, font metrics and
world-transform endpoints are explicit; it does not rasterize native glyphs.
Cursor advance comes from `0x189cd0–0x189d6c` / `0x1894c8–0x189504`, with the
full-buffer adjustment at `0x186c54–0x186ca0` and offset construction at
`0x187310–0x187324`.

Private evidence is under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/keyboard-native/settings-nickname/lower-first-paint/`:

- `text-pane-contract-frozen.json`: local pane outputs for empty, `Ada` and
  `ABCDEFGHIJ`;
- `text-pane-fixture-frozen.py`, SHA-256
  `d885cf4e192c4cbe0fa68516ea6f9ef5367d0c029b838c4505746a36010652c4`;
- `text-pane-result-frozen.json`, SHA-256
  `d1fbacbeaf61072d7298377ba313b1f74430b8c74ec730d03c8acf14cf1e69ea`.

`tests/native-keyboard-text.test.mjs` checks every visible cell's captured
position, text/color selection, full-buffer cursor placement, hidden-cell
preservation, asset isolation and input boundaries. Setting
`NATIVE_KEYBOARD_REFERENCE_ROOT` to the private `runtime/keyboard-native`
directory also checks all emitted fields against the frozen original-ARM output
and real decoded layouts, after verifying fixture/result hashes. All five
checks pass with those resources. The combined animation/binding/title-resource
suite passes 64 checks with no skips; type checking passes. Logs are in the
artifact root's `reference/native-keyboard-{text,integration}*` files.

Full lower composition, capture/transition ordering, interaction and actual
browser/native LCD comparison remain required before this is accepted as the
keyboard experience.
