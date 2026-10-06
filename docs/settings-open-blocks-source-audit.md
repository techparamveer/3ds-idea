# Settings Open Blocks: device value and source material

2026-09-24, audited from integration `85137b9` in
`codex/settings-open-blocks-source`. This pass left Software and Extra Data
blank because no SD fixture existed. **6 October 2026:** U20 now binds the
empty-SD portfolio fixture `65,536` through dump `TextBox_05` /
`cbf_std.bcfnt`. See [the bind note](settings-open-blocks-2026-10-06.md).
The IPC provenance below is unchanged. This extends the
[Data lists audit](settings-data-lists-source-audit.md).

## Value provenance

The same pinned Settings code image applies: title `0004001000022000`, content
`0000003d`, SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`,
mapped at `0x100000`.

| Source address | Observed operation |
| --- | --- |
| `0x19aa88`–`0x19aa98` | Application media 1 selects filesystem system-media 2 and calls `0x1b1274`. |
| `0x1b12ac` → `0x159a98` | Send filesystem IPC `0x08490040`; the four response words are copied into the caller's resource structure. |
| `0x1b12b8`–`0x1b12c8` | Multiply response fields `+0x0c` and `+0x04` with unsigned 64-bit result and return the byte count. |
| `0x19b200`–`0x19b21c` | Divide that byte count by `0x20000` (131072) and store the quotient at `0x299ca8 + media*4`, hence `0x299cac` for SD. |
| `0x218598`–`0x2185cc` | Only SD state 2 reads this SD entry, formats it through `0x19a0b8` with limit `0xf423f` (999999), and assigns `TextBox_05`. |
| `0x19a0c0`–`0x19a0c8` | The formatter clamps values above the supplied limit before locale-dependent number formatting. |

The protocol matches libctru's
[FSUSER_GetArchiveResource](https://github.com/devkitPro/libctru/blob/master/libctru/source/services/fs.c#L1058).
Its [resource structure](https://github.com/devkitPro/libctru/blob/master/libctru/include/3ds/services/fs.h#L160)
identifies `+0x04` as cluster size and `+0x0c` as free cluster count. Thus the
source derives the displayed value from `floor(clusterSize * freeClusters /
131072)`, subject to the formatter's upper limit. These SDK names corroborate
the binary trace; they are not values extracted from the portfolio.

`SMng_U_01`'s raw `TextBox_05` contains **`888888`**, an editor placeholder.
Both the constructor (`0x21802c`–`0x218054`) and update path overwrite it with
runtime data. Zero installed software, an empty Extra Data list, the presence
of gallery photos, browser storage quota and host disk free space do not specify
the native SD allocation state. None may substitute for the missing value.
The deliberately blank field therefore remains a portfolio adaptation, not
strict native parity. A supplied reference SD resource tuple or an explicitly
specified portfolio SD fixture would be needed to populate it honestly.

## Window material

Decoded source `SMng_U_01` matches the delivered layout exactly. `SDWindow` is
a 126×36 window at `(102,-29)`. Its content material `SDWindowC ` and frame
material `SDWindowLT` both select `NetBaseLT.bclim`, have no explicit TEV stages,
and contain these registers:

| Material | Buffer RGBA | First constant RGBA |
| --- | --- | --- |
| `SDWindowC ` | `(230,150,20,255)` | `(255,255,255,255)` |
| `SDWindowLT` | `(230,150,20,0)` | `(255,255,255,255)` |

The `NonSD` animation changes `SDWindow` and `TextBox_05` visibility only;
it contains no track for either material. The updater at `0x21853c`–`0x218558`
finds the window and toggles pane flag bit 0, not a colour register. The orange
seen in the software render is therefore grounded in source registers; this
does **not** prove the shared implicit-material renderer reproduces the native
final pixels. Keep that material acceptance gap open until a matched native
capture is available. No palette override or recolouring was made.

## Reproduction and evidence

`scripts/audit_settings_open_blocks.py` validates the complete code hash,
checks 25 source instruction/literal words, records six range hashes, decodes
the original upper layout/clip, and compares the delivered layout. It reports
`portfolioValue: null` explicitly. It executes no firmware or filesystem IPC.

```sh
python3 -B scripts/audit_settings_open_blocks.py \
  --code <absolute Settings exefs/code.bin> \
  --up-archive <absolute Settings romfs/up_LZ.bin> \
  --published-up <absolute Settings delivery up.json> \
  --report <absolute artifact audit.json>
```

Artifacts are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/settings-open-blocks-source/`:

- `audit.json`: hash/instruction checks and source/delivery comparison pass.
- `render/`: existing Settings verifier passes five main and 29 subpage paired
  renders, immutable-resource and diagnostic checks. Its assertions confirm
  Software and Extra Data leave `TextBox_05` empty. Both upper PNGs were
  inspected: the source orange window remains empty and both titles/instructions
  remain distinct.
- Existing `test_settings_data_audit.py`: six tests pass.

No runtime or public asset changed. No browser/emulator was operated in this
worker; no new native visual acceptance is claimed.
