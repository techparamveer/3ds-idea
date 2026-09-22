# Owner firmware conversion

`build.py` reads the owner's **decrypted** CIA packages with an explicitly selected CTRTool. It verifies the CIA/NCCH plaintext flags and title identity before extraction. Only known native visual/message formats become browser PNG/JSON. Raw packages, executable sections, certificates, keys, shaders and private state never become public assets. AR Games and Face Raiders are excluded by title ID.

Example (use the actual installed paths):

```sh
python3 -B scripts/firmware/build.py --home-only \
  --source /path/to/3ds-system-files-decrypted \
  --ctrtool /path/to/ctrtool \
  --artifacts /Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets
```

Omit `--home-only` to compile the included application/app-let resource sets. Native font sheets are repacked without scaling; the shared font's 1,501 narrow sheets become six PNG atlases. Luminance in LA4 font sheets is retained. BCLIM textures are unswizzled with their actual formats, not traced or recreated. JSON serialization is deterministic and every output carries SHA-256 provenance through the manifest.

`manifest.json` has relative `fonts.shared`, `fonts.hud`, `home` pack URLs, `titles` keyed by lowercase title ID, and `resources` keyed by relative URL. Paths always resolve against the entry manifest. The compiler preserves independently compiled `audio` and `models` fields and records with those path prefixes.

Each pack contains `layouts`, `animations`, `textures`, `messages` and `unsupported`. Layouts contain pane hierarchy, native transforms, text metrics, groups, window frames, texture mapping, blend state and TEV stages. Animation tracks retain target/binding/tag/index/component/property, step or Hermite keys, clip duration/looping and texture names. Duplicate-frame Hermite keys represent split tangents and must not be collapsed. MSBT messages retain control tokens and arguments separately from printable text. Unknown extensions and unsupported containers are recorded explicitly.

These are resource conversions, not proof that the website reproduces firmware appearance or behaviour. In particular, material extensions, shader equivalence, text alignment, animation binding and audio/model conversion require runtime verification against Azahar. Package binaries are not executed by this pipeline.

Run focused tests:

```sh
python3 -B -m unittest discover -s tests -p test_bcfnt.py
python3 -B -m unittest discover -s tests -p test_home_resources.py
FIRMWARE_ARTIFACTS=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets \
  python3 -B -m unittest discover -s tests -p test_firmware.py
```

Format references: [libctru GPU format definitions](https://github.com/devkitPro/libctru/blob/master/libctru/include/3ds/gpu/enums.h), [libctru font definitions](https://github.com/devkitPro/libctru/blob/master/libctru/include/3ds/font.h), [EveryFileExplorer CLYT material reader](https://github.com/Gericom/EveryFileExplorer/blob/master/3DS/NintendoWare/LYT1/mat1.cs), [3dbrew CLYT research](https://www.3dbrew.org/wiki/CLYT_format), [png2bclim format mapping](https://github.com/kwsch/png2bclim/blob/master/png2bclim/BCLIM.cs). No third-party implementation is vendored. Nintendo/Fontworks rights in the owner's firmware resources are distinct from the website source licence.
