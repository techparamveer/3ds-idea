# Firmware asset inspection

Input: `/Users/paramveer/Downloads/11.17.0-50E-NEW.zip`.

The read-only inspector found 137 CIA packages. It parses archive headers and TMD content flags; it does not execute firmware, follow embedded instructions, or copy firmware into the public website.

The European HOME Menu package is `0004003000009802.cia`, 3,873,024 bytes. Its first TMD content type is `0x0001`: the CIA content is encrypted. No clear NCCH header occurs in the package. Its SHA-256 is `011d0276fb947315ef06f385cdb444f5e194d23573caf0e3efbeb2c82673654e`.

The original firmware graphics are not yet available to this application. A decrypted HOME Menu RomFS/assets folder from the owner is required to replace the current authored placeholders with the real asset set. The user has been asked for its local path. No substitute asset set is described as extracted firmware.

Run `python3 scripts/inspect_firmware.py /path/to/archive.zip` to regenerate `docs/firmware-inventory.json`.

Format references: [CIA](https://www.3dbrew.org/wiki/CIA), [NCCH](https://www.3dbrew.org/wiki/NCCH), [PyCTR library](https://github.com/ihaveamac/pyctr).

`src/os/state.ts` contains the menu input state machine. `src/os/screens.ts` draws a plain placeholder at native screen resolutions. There is no portfolio content yet. This implementation is not an emulator and has not achieved pixel-identical HOME Menu fidelity.

## Follow-up inspection: 2026-09-09

Re-ran the inspector in the separate `codex/home-menu-assets` worktree, starting at `d00de28`. The 137-package inventory is unchanged. Also checked the entire two packages below for the literal `NCCH` marker: neither contains it. This is corroborating evidence, not a decryption test. Content encryption is established by TMD bit 0.

| Package | Size | TMD first content flags | SHA-256 |
| --- | ---: | --- | --- |
| European HOME Menu `0004003000009802.cia` | 3,873,024 | `0x0001` | `011d0276fb947315ef06f385cdb444f5e194d23573caf0e3efbeb2c82673654e` |
| Shared font `0004009B00014002.cia` | 1,481,472 | `0x0001` | `37d076c2e46540c8ddfdef8178a998a5cb44bec79b1a9164f1329e199919806e` |

The shared-font title identification is corroborated by the [3dbrew title list](https://www.3dbrew.org/wiki/Title_list). The HOME Menu also references `/font/Hud_JP.bcfnt`; do not assume every label is drawn from the shared font. [HOME Menu reverse-engineering notes](https://www.3dbrew.org/w/index.php?mobileaction=toggle_view_mobile&title=Home_Menu)

**Missing input:** a local owner-provided decrypted HOME Menu RomFS directory and standalone decrypted font BCFNT file(s), ideally including both the HOME Menu font directory and the shared-font title contents. A fully decrypted CXI/CFA or CIA is another usable starting point. The supplied ZIP is not that input. No keys were found, requested from third parties, or installed; no firmware graphics or fonts were extracted.

## Extraction route and primary technical sources

1. The CIA layer and NCCH layer are separate. Removing a ZIP wrapper or reading the CIA ticket does not make the RomFS readable. PyCTR's CIA reader uses ticket/title-key handling and its crypto engine loads boot9 key material; having the package is not sufficient for that route. Prefer an owner-exported decrypted file over bringing keys into this website project. [PyCTR CIA reader](https://github.com/ihaveamac/pyctr/blob/master/pyctr/type/cia.py), [crypto engine](https://github.com/ihaveamac/pyctr/blob/master/pyctr/crypto/engine.py)
2. GodMode9 is an on-device file browser with access to system contents. An owner who already has that environment can export the relevant decrypted data; this work did not operate their console or change its NAND. [GodMode9 project](https://github.com/d0k3/GodMode9)
3. Once the file is fully decrypted, CTRTool supports CIA content extraction, CXI/CFA RomFS extraction, and unpacking RomFS. Its `--plain` flag explicitly extracts without decrypting; that flag cannot fix this encrypted input. Example stages, using the actual extracted filenames at each stage:

   ```sh
   ctrtool --contents=contents /path/to/decrypted.cia
   ctrtool --romfs=home.romfs /path/to/decrypted-content.cxi
   ctrtool --romfsdir=home-romfs home.romfs
   ```

   These commands are documented capabilities, **not commands successfully run on this archive**. Validate the output and record source hashes before publishing assets. [CTRTool upstream usage](https://github.com/3DSGuy/Project_CTR/tree/master/ctrtool)
4. Inventory the resulting files before selecting a graphics decoder. Preserve layout, animation, texture and message files together; flattening a HOME Menu background screenshot does not recreate selection or navigation. Compressed archives and texture formats need format-specific decoding after extraction. No particular texture filename or decoded icon is asserted here because the RomFS is still unavailable.

## Bitmap font conversion and rendering

BCFNT stores glyph texture sheets, character mappings and widths. The new converter preserves these as PNGs and a JSON manifest; it does not invent a font name or trace pixels into different outlines. Its format handling was checked against [libctru font structures](https://github.com/devkitPro/libctru/blob/master/libctru/include/3ds/font.h), [glyph positioning](https://github.com/devkitPro/libctru/blob/master/libctru/source/font.c), and [ObsidianX's BCFNT tool](https://github.com/ObsidianX/3dstools/blob/master/bcfnt.py). No upstream implementation was vendored.

```sh
python3 scripts/convert_bcfnt.py /path/to/decrypted/font.bcfnt public/os/font
```

Supported: standalone little-endian `CFNT`, UTF-16 CMAP direct/table/scan methods, linked CWDH widths with signed bearings, A4/A8 Morton-tiled sheets. Output includes the font SHA-256, sheet PNGs, glyph rectangles, advances, baseline and height. Existing output directories are refused. Encrypted CIA, relocated shared-memory dumps, other encodings, texture formats and compression are deliberately rejected. This is a narrow converter, not a general firmware extractor.

The converter has **synthetic fixture coverage only**. It has not decoded the owner's actual font; sheet orientation, baseline placement and final label sizing still require comparison with that font and reference captures. Bitmap resampling and Canvas antialiasing may also differ from the console GPU.

`loadBitmapFont()` loads and validates converted sheets; pass the result to `createScreens({ font })`. No speculative missing-asset request is made by the default renderer. Without a supplied font it continues to use the clearly marked Arial development fallback. The repository does not contain a replacement font disguised as Nintendo's.

## Integration and acceptance handoff

The existing synchronous `createScreens()` return value (`top`, `bottom`, `paint`) and all existing inputs remain compatible. The top remains an 800×240 backing canvas drawing in 400×240 logical coordinates for the scene's current full-width UVs. This is horizontal resampling for monoscopic display, **not two packed eye views**. Bottom remains 320×240. Do not pack two 400-wide views without also changing the texture UV sampling in the hardware task.

After assets become available, the scene can load the font before creating its textures:

```ts
const font = await loadBitmapFont('/os/font/font.json');
const screens = createScreens({ font, reducedMotion });
```

`paint(state, date, elapsedMs)` now accepts an optional deterministic animation time. The selection pulse is an authored provisional animation, not firmware timing. Existing calls remain static because the third argument defaults to zero. To enable it, the hardware task must call `paint` from its existing animation loop and mark both CanvasTextures dirty, preferably capped to 30 FPS. Pass `reducedMotion: true` to suppress the pulse. No second animation loop, texture update hook, or hardware/scene mutation was introduced here.

Behavior changes: empty slots no longer open as folders or show the selected-folder preview; drawing and tile hit-testing share `menuTiles`; gaps and footer margins no longer trigger actions; non-finite touches are rejected; zoom cannot alter an open folder. Four plain, unnamed empty folders remain, with no invented portfolio content.

Verification: `npm run typecheck`; 9 JavaScript tests via `node --test tests/menu.test.mjs tests/bitmap-font.test.mjs`; 3 Python tests via `python3 -m unittest discover -s tests -p 'test_bcfnt.py'`; `git diff --check`. Tests cover CMAP variants, signed bearings, A4 nibble order, Morton tile coordinates, rejection of truncated/encrypted/unsupported/cyclic input, empty-slot activation, tile hit-testing through scrolling/density changes, and renderer scaling/alignment/fallback/colour-cache behavior. No browser or pixel-fidelity acceptance is claimed by these checks. The worktree used a temporary link to the main checkout's installed dependencies for checks; no dependencies or lockfiles were changed.

Remaining fidelity gaps: original graphics and typography; actual firmware layout and zoom levels; top banner models/animations; settings and toolbar applets; drag scrolling/reordering; authentic selection/open/close timing; calibrated native-screen visual comparisons. This branch advances asset readiness and input correctness; it does not fulfill final HOME Menu visual acceptance.
