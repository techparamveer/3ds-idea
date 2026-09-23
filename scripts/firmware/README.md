# Owner firmware conversion

[Folder-close overlay evidence](FOLDER_CLOSE_OVERLAY_EVIDENCE.md) records the
native cursor hide, footer SceneOut request and conditional balloon lifecycle.

`build.py` reads the owner's **decrypted** CIA packages with an explicitly selected CTRTool. It verifies the CIA/NCCH plaintext flags and title identity before extraction. Only known native visual/message formats become browser PNG/JSON. Raw packages, executable sections, certificates, keys, shaders and private state never become public assets. AR Games and Face Raiders are excluded by title ID.

Example (use the actual installed paths):

```sh
python3 -B scripts/firmware/build.py --home-only \
  --source /path/to/3ds-system-files-decrypted \
  --ctrtool /path/to/ctrtool \
  --artifacts /Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets
```

Keep `--home-only` until the orchestrator accepts the representative HOME slice against Azahar. Broader application extraction is available by omitting it after that gate. Native font sheets are repacked without scaling; the shared font's 1,501 narrow sheets become six PNG atlases. Luminance in LA4 font sheets is retained. BCLIM textures are unswizzled with their actual formats; 5/6-bit channels use native bit replication. JSON serialization is deterministic and every output carries SHA-256 provenance through the manifest.

`manifest.json` has relative `fonts.shared`, `fonts.hud`, `home` pack URLs, `titles` keyed by lowercase title ID, and `resources` keyed by relative URL. Paths always resolve against the entry manifest. The compiler preserves independently compiled `audio` and `models` fields and records with those path prefixes.

The additive `converter` record identifies converter version, every conversion script's SHA-256, and the chosen CTRTool version/binary SHA-256. Source records include CIA basenames; personal absolute paths and Python/zlib/platform build details stay in the private artifact `build-report.json`. No timestamp enters delivery JSON. A tool version identifies the implementation, not a visual acceptance level.

Each pack contains `layouts`, `animations`, `textures`, `messages`, `resourceSources` and `unsupported`, plus `styles` when a supported HOME style table is present. `resourceSources` maps each resource category and name to original member paths and decoded SHA-256 hashes. Layouts contain pane hierarchy, native transforms, text metrics, groups, window frames, texture mapping, blend state and TEV stages. Windows expose `inflation` (four unsigned fixed-point values divided by 16) and `frameSize` (four unsigned integers), both in left/right/top/bottom order. These replace the earlier incorrectly decoded `stretch` float array. Fonts also expose FINF `width`, `cellWidth`, `cellHeight` and `maxCharWidth` alongside baseline, ascent, line feed and per-glyph metrics.

Animation tracks retain target/binding/tag/index/component/property, step or Hermite keys, clip duration/looping and texture names. Duplicate-frame Hermite keys represent split tangents and must not be collapsed. MSBT messages retain control tokens and arguments separately from printable text, plus `styleIndex` (`null` for the native -1 sentinel). ATR1 count, record width, attribute records and trailing string table are preserved; typed attribute semantics require the title's definition. The HOME ATR1 tables have zero-width records. The two English HOME `RI_mstl` tables are converted into `styles`, keyed by full member path because their basenames are identical. Messages link with `styleTable`; `styleIndex` indexes that table's `styles` array. Each 44-byte record exposes `fontScale` in X/Y order, `lineSpacing`, `characterSpacing` and `unresolvedWords` keyed by decimal byte offset. The four named fields are confirmed by native HOME code; the remaining seven words stay unnamed. Font scales multiply native font width/height, and spacings replace the corresponding CLYT text fields. A null style index leaves the layout values intact. These tables are selected only by the two known paths, since this format has no magic signature.

These are resource conversions, not proof that the website reproduces firmware appearance or behaviour. In particular, material extensions, shader equivalence, text alignment, animation binding and audio/model conversion require runtime verification against Azahar. Package binaries are not executed by this pipeline.

Run an integrity and provenance audit (reports must be outside the checkout):

```sh
python3 -B scripts/firmware/audit.py \
  --artifacts /Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets \
  --repository /Volumes/DeveloperStorage/GitHub/3ds-idea-worktrees/assets \
  --report /Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/delivery-audit.json
```

The audit checks actual public bytes, source/member hashes against private extraction, converter hashes, all font rectangles, group/pane/material/texture references, texture pattern indices and message label indices. It reports unsupported fields, checks linked message style indices, and identifies unallocated texture-matrix animation slots. Native HOME explicitly skips those slots: the audit reports `behavior: nativeSkip` and distinguishes identity keys from nonidentity values/tangents. HOME has 351 such CLTS tracks; 336 remain identity, while 15 vary, including cursor loops. Preserve indices; never remap a skipped index to zero. CLMC register 0 is the buffer and 1..6 are constants, confirmed by the native constructor and color setter. See [native format evidence](FORMAT_EVIDENCE.md) for the source identity, code addresses, and limits; static format confirmation does not establish visual equivalence.

For reproducibility, build twice with different fresh `--artifacts` and `--output` directories under the SSD artifact root, then add `--output FIRST/public --compare SECOND/public` to the audit. It compares the complete file sets and actual bytes, including the manifest. Old generated files in a reused output directory are reported as unreferenced, never automatically deleted; use a fresh output for an unambiguous comparison.

Run focused tests:

```sh
python3 -B -m unittest discover -s tests -p test_bcfnt.py
python3 -B -m unittest discover -s tests -p test_home_resources.py
FIRMWARE_ARTIFACTS=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets \
  python3 -B -m unittest discover -s tests -p test_firmware.py
```

Format references: [libctru GPU format definitions](https://github.com/devkitPro/libctru/blob/master/libctru/include/3ds/gpu/enums.h), [libctru font definitions](https://github.com/devkitPro/libctru/blob/master/libctru/include/3ds/font.h), [EveryFileExplorer CLYT material reader](https://github.com/Gericom/EveryFileExplorer/blob/master/3DS/NintendoWare/LYT1/mat1.cs), [window field reader](https://github.com/Gericom/EveryFileExplorer/blob/master/3DS/NintendoWare/LYT1/wnd1.cs), [SPICA packed texture decoding](https://github.com/gdkchan/SPICA/blob/master/SPICA/PICA/Converters/TextureConverter.cs), [MSBT attribute/style research](https://tlmodding.com/documentation/file-formats/lms/msbt/), [3dbrew CLYT research](https://www.3dbrew.org/wiki/CLYT_format), [png2bclim format mapping](https://github.com/kwsch/png2bclim/blob/master/png2bclim/BCLIM.cs). No third-party implementation is vendored. Nintendo/Fontworks rights in the owner's firmware resources are distinct from the website source licence.
