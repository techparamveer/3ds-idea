# Settings main background source trace

2026-09-24. The main Settings painter no longer forces `SceneIn_Legacy` to
frame 40. It draws the original `Bg_U_00` and `Bg_D_00` defaults. This corrects
the main screen's dark background without recoloring textures, materials,
vertices or text. The supplied source defaults render pale yellow through the
current renderer; this is not a claim of matched native LCD color reproduction.

## Provenance and runtime choice

Settings title `0004001000022000`, content 0 / `0000003d`, executable mapped at
`0x100000`, SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
The verified original `romfs/table_LZ.bin` SHA-256 is
`1df90f560d13eb1fbc46f0a1c33b9f743b2686ad64eb5c0f980ac75224de7794`.
Its decompressed `top4btn.bin` member is 216 bytes, SHA-256
`fea73c10a5e76b2ca9ff8463acd42f3afbdb70802630a9784d3636636e49e872`.

- `0x2344dc..0x2344fc` copies the first `0x24` bytes of each scene table
  verbatim into its runtime record, then parses the string fields. The record
  stride is `0x233`; `0x19f028` returns that same record array.
- `top4btn.bin[0x23]` is **3**. Its strings name `Top_D_02`, `TopText_U_00`,
  the five existing button message labels, and `top_sysset_title`.
- `0x216c18..0x216c40` obtains the current record and passes it to
  `0x2353f8`. That function reads byte `+0x23` and calls `0x234ae8`.
- The background constructor sets state `+0x180` to **0** at `0x235568`.
  `0x234cf8` loads both backgrounds and their Legacy animations; loading does
  not start playback. The animation base constructor `0x131240` initializes
  playback state and direction to zero.
- `0x234ae8..0x234bac` starts the two Legacy animations only for **1 → 2**,
  and reverses them for **2 → 1**. Other changes only store the new state.
  Thus main's initial **0 → 3** does not apply the Legacy transition.
- The other scene-change path at `0x2348bc` reads the same byte and falls
  through into that setter at `0x234ae8`.

Both original backgrounds have `P_BG_White` visible and `P_BG_Legacy` hidden.
Legacy frame 40 explicitly hides White and exposes Legacy. The old painter
forced that end state irrespective of the scene table.

## Separate subpage states

The source byte is not a universal boolean and is also used in scene animation
name selection at `0x2358dc`. It must not be generalized from the main screen.

| Source scene | Byte `0x23` |
| --- | --- |
| `top4btn`, `net_top` | 3 |
| `basic_top1` through `basic_top5`, `user_info`, `sound` | 1 |
| `datamng_top`, `datamng_ctr_top` | 4 |
| `ds_user_info`, `ds_user_color`, `ds_comment_input` | 2 |

The state-2 Nintendo DS profile route demonstrates an actual Legacy use.
Runtime writes found at `0x2147d4`, `0x214808`, `0x21485c`, `0x214918` and
`0x215058` target outer-camera scenes (`ocam_check` / `ocam_auto1`), not
`top4btn`. The first correction changed main only. The subsequent subpage
correction below uses each identified scene's separate value.

## Subpage correction

`settingsSceneVariant` maps Internet/Connection Settings to state 3, Data
Management/3DS data to 4, ordinary Other Settings/Profile/Clock to 1, and
Parental Controls/restrictions to 5. `net_set`, `date_time`, `date`, `time`,
`birthday`, `sound`, `language_eu`, `user_name_input`, `pare_new_set` and
`pare_fact_top` were read from the same original archive, not inferred from
their appearance. DS Profile alone requests state 2. Other adapted detail
cards explicitly inherit their parent section's palette; they are not claimed
to implement the source detail scene.

The executable also consumes byte `0x23` at `0x2358dc..0x235920`: state 2
maps to 0, and the resulting number formats `SceneIn_%2.2d.bclan` for the
upper scene layout. Consequently `CommonBG_U_00` now uses the exact `_01`,
`_03`, `_04` and `_05` clips. Their source title-material RGB endpoints are
respectively `(233,137,14)`, `(96,154,178)`, `(50,168,101)` and `(246,100,118)`.
No RGB values are hardcoded into the painter. Previously every section used
the pink `_00` variant and the dark Legacy background.

The identified Sound, Language, Date, Time, Birthday and User Name details now
use their source upper title, icon and instruction messages with English mset
styles. Profile, User Name and Birthday use `UserInfo_U_00` without the extra
`TextBG_U_00` that their source scene tables do not name. Existing preference
values remain supplied by the runtime. This does not add device data.

The subpage verifier adds 16 paired scenes including the state-2 route and
source-styled detail text. Original resource objects remain immutable and
renderer diagnostics are empty. Images are under
`presentation/settings-scene-variants/`; the matching 19 scene records and
hashes are saved in `presentation/settings-source-audit/subpage-scenes.json`.

Remaining differences: DS Profile still uses adapted detail composition and
needs its `Ls*` layouts; the parental introductory lower layout, restriction
list and other generic detail cards still differ from their native scenes.
Date & Time and Connection Settings need their source-specific layouts in a
following change. Background and title selection do not establish complete
native scene scheduling or 1:1 visual fidelity.

## Composition, typography and verification

Main retains source child mounts, the settled `Top_D_02_SceneIn_00` frame 35,
`TopText_U_00_SceneIn_00` frame 20 and each button's source Select endpoints.
The title and button text retain English `mset` styles and source pane sizes;
there is no guessed font-size or material-color override. The bounded native
font-scale/spacing evidence remains in
[Settings locale validation](firmware-settings-locale-validation.md).

`scripts/verify-stock-settings.mjs` renders five paired main-screen selections,
checks the default background against a separately rendered source background,
checks source visibility, English title style, five mounts, distinct focus
images, immutable original packs and empty renderer diagnostics. Typecheck
also passes. Paired corrected images were inspected locally; root owns actual
browser and matched native LCD verification. These checks do not establish
1:1 typography, native animation scheduling or complete material fidelity.

Private before/after images, original table extraction hashes and code range
hashes are under the SSD artifact directory
`firmware-10.7.0-32E/presentation/settings-source-audit/`; corrected verification
images are in `presentation/settings-main-correction/`. No executable or scene
table binaries are added to public delivery.


Integration browser check: after a production rebuild, the normal localhost
preview displays the original pale-yellow main background on both LCDs, with
all five original controls and version text visible. Browser error/warning log
was empty. Subpage legacy-background/title-variant corrections remain open;
this main-screen inspection is not full Settings fidelity acceptance.
