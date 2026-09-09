# Original HOME Menu resource pipeline

This increment prepares real resource loading, without installing invented graphics. It does not yet render BCLYT materials/panes or evaluate BCLAN tracks. Existing `createScreens()` calls and the hardware/runtime surface files are untouched.

## Required owner input

Preferred input is the **complete decrypted European HOME Menu `0004003000009802` RomFS directory**, retaining original names and subdirectories, plus the standalone decrypted shared font from `0004009B00014002`. Keep the complete dump outside `public/`; selectively convert the needed assets.

If providing selected resources instead, include:

- HOME Menu launcher archive, containing `blyt/LncBase_D_01.bclyt`, `blyt/LncBase_U_00.bclyt`, and all of its `anim` and texture resources.
- HUD archive, containing `blyt/HudMenu_00.bclyt` plus its animation and texture dependencies.
- Sleep/shutdown archive if those interactions are in scope.
- The HOME Menu font directory, including `Hud_JP.bcfnt` when present, and the shared-font BCFNT. Both remain necessary until text-pane font references establish which font each label uses.
- English message resources and original sound/banner/model resources referenced by those layouts.

Published modding documentation calls the unpacked archives `launcher.LZ`, `hud.LZ`, and `sleep.LZ`; compressed names may end in `_LZ.bin`. These are reference names, not filenames verified inside the still-encrypted supplied ZIP. The exact required leaf assets can only be resolved by inspecting the actual archive. [HOME Menu layout guide](https://aromakitsune.github.io/3DS-Home-Menu-UI-Layout-Customization)

Neither the encrypted CIA nor a screenshot supplies these decoded resources. A fully decrypted CIA/CXI/CFA is also acceptable, but must first be unpacked using the container steps in `firmware-assets.md`. This increment does not decrypt CIA/NCCH.

## Implemented extraction

```sh
python3 scripts/unpack_home_resources.py /path/to/launcher_LZ.bin .local/home/launcher
```

Accepts a plain DARC archive or one LZ10/LZ11 wrapper around DARC. Produces `inventory.json` and `resources/<original relative path>`. No recursion into nested archives and no implicit copying to the website. Output directories must be new. The complete archive is validated before files are written.

Implemented checks and decoding:

- LZ10 and all three LZ11 match-length encodings, including overlapping backreferences and the extended size header; a 64 MiB output limit.
- Little-endian DARC names, directory ranges and file contents, with traversal/duplicate/path and bounds validation.
- SHA-256 for compressed source, decoded archive and every resource.
- Content-based classification for layout, animation, font, messages, CGFX models and BCLIM footer signatures. A filename extension alone does not establish a format.
- CLYT/CLAN header and section-boundary inspection, preserving unknown sections rather than guessing their semantics.

Format references: [yellows8 DARC implementation](https://github.com/yellows8/darctool/blob/master/darctool.c), [DSDecmp project](https://github.com/Barubary/dsdecmp), and its [LZ11 format description in the 3DS Explorer copy](https://github.com/svn2github/3DS-Explorer/blob/master/3DSExplorer/DSDecmp/Formats/Nitro/LZ11.cs). The new code is an independent implementation; no upstream source was vendored.

## Implemented browser loading

`src/os/resources.ts` exposes an opt-in resource loader:

```ts
const archive = await loadResourceArchive(
  new URL('/os/launcher/inventory.json', window.location.href).href,
);
const layoutBytes = await archive.read('blyt/LncBase_D_01.bclyt');
```

The loader validates inventory paths and metadata, bounds streamed responses, and checks each file's size and SHA-256 before returning bytes. It does not automatically request nonexistent assets, execute content, create a render loop, or alter screen textures. The existing bitmap font converter and renderer remain separate.

## Verification and next gate

`python3 -B -m unittest discover -s tests -p 'test_home_resources.py'`: 7 synthetic-fixture tests, covering literals, all LZ match forms, overlap, truncation, excessive size, invalid distance, path traversal, directory/payload bounds and layout sections.

`node --test tests/resources.test.mjs`: 3 tests covering valid loading, hash/length/stream-limit rejection and invalid inventory data. All data is authored test data, outside `public/`; it is not Nintendo artwork or an extracted original asset.

Next implementation gate: feed an actual decrypted launcher/HUD archive through this pipeline, inspect its section versions, then implement pane/material/texture interpretation and animation-track evaluation against those bytes and native reference frames. The generic archive layer is tested, but original-asset compatibility and pixel equality remain unverified. No original graphics were extracted in this increment.
