# BCLYT pane decoding and animation evaluation

This is an implementation increment toward using original resources. Tests are synthetic binary structures, not captures or Nintendo graphics. Passing them establishes parser and interpolation behavior only.

## Implemented

`src/os/layout.ts` decodes little-endian CLYT section streams into:

- Canvas origin and dimensions (`lyt1`).
- Texture and font name tables (`txl1`, `fnl1`), with offsets relative to the name-offset array.
- The common 0x4C-byte pane fields for `pan1`, `pic1`, `bnd1`, `txt1`, and `wnd1`: raw flags/origin, alpha, name, user bytes, translation, rotation, scale and size.
- Nested pane relationships using `pas1` and `pae1`.
- Picture vertex colours, material index, and UV coordinate sets.

Unknown sections are returned verbatim in `unsupported`; pane extension bytes are preserved. Text and window extensions are **not interpreted**. Material/TEV interpretation, origin semantics, font binding and group/userdata behavior are not guessed. The parser records the file revision but original HOME Menu revision compatibility is still unverified. Source: [CLYT format reverse-engineering documentation](https://www.3dbrew.org/wiki/CLYT_format), which links the existing viewers and their source. Its picture-UV table contains inconsistent per-vertex offsets; this decoder reads the four consecutive Vector2 values within each documented 0x20-byte set.

`src/os/animation.ts` provides a normalized scalar-keyframe evaluator:

- Step, linear, and cubic Hermite curves.
- Slopes expressed in value-per-frame units.
- Clamping outside the key range, explicit clip looping, and exact key boundaries.
- Input validation and copied keys so caller mutations do not change compiled playback.

This is **not a binary BCLAN decoder**. It deliberately does not assume that BRLAN/BFLAN entry sizes, track IDs, flags, or key encodings apply to CLAN. The [CLAN documentation](https://www.3dbrew.org/wiki/CLAN_format) identifies animation tags but leaves several entry fields unresolved. Needed to implement that mapping responsibly: an original decrypted `anim/*.bclan` from the launcher or HUD archive and a trustworthy decoder/capture to verify target names, properties, key types, tangents, clip duration and looping semantics. The normalized evaluator can be used once that mapping is established.

## Integration

No scene or runtime surface file changed. The archive loader's returned bytes feed the pane parser directly:

```ts
const archive = await loadResourceArchive(new URL('/os/launcher/inventory.json', location.href).href);
const layout = decodeLayout(await archive.read('blyt/LncBase_D_01.bclyt'));
```

The returned model exposes original pane coordinates and resource names for a future renderer. Do not substitute it into `createScreens()` until materials, textures, text and animation application are implemented: null/bounding panes are not visible artwork. Keep the current `createScreens()` return signature and CanvasTexture ownership when integrating that renderer. No test fixture is loaded into the website.

The previously implemented BCFNT converter and bitmap renderer remain available; this increment does not modify them. Actual font validation still requires standalone decrypted font files, with particular attention to atlas orientation, baseline and label sizing.

## Verification

```sh
node --test tests/layout.test.mjs tests/animation.test.mjs
```

Eight tests pass: nested panes and picture data; canvas/name tables; malformed hierarchies, offsets and non-finite coordinates; typed-array subviews; step/linear endpoints; Hermite slope scaling; clip boundaries; invalid keys/time. Strict standalone TypeScript checks also pass for both modules. No visual equality or full HOME Menu support is claimed.
