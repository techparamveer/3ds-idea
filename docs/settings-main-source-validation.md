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

Remaining differences after this palette slice included DS Profile and the
parental introductory lower layout (corrected below), the restriction list
and other generic detail cards.
Background and title selection do not establish complete native scene
scheduling or 1:1 visual fidelity.

## Date & Time and Connection Settings layouts

The next bounded correction consumes the exact `NetType2_D_00` named by
`date_time.bin`, replacing the borrowed `Btn2Text_D_00` and duplicated help
text. Its settled child mounts are `N_B_L_00` at `(0,60)` and `N_B_L_01` at
`(0,-36)`, with `date_btn` and `time_btn` source messages. Each source `B_L`
has a centered `Bounding_00` of 264 × 66. The lower-LCD hit rectangles are
therefore `(28,27,264,66)` and `(28,123,264,66)`. Integration owns the matching
input geometry change; the existing Back footer stays in place.

`net_set.bin` names `Connect_U_00` rather than `TextBG_U_00`. The painter now
uses that source upper layout and its `TextFadeIn` endpoint. Original panes
display `net_connect1_u` through `net_connect3_u`, the source empty value
`net_none_set_u`, and `net_set_comm_u`, all with their English source styles.
The local portfolio has no configured console networks; the sample `%` names
and key icons are not presented as saved device data. This is the source empty
presentation, not an inspection of the visitor's network configuration.

These two layouts require assets publication `e7d885c` (integrated by root as
`b08ac64`). No converter or shared renderer code changes. The focused verifier
checks the two clock mounts, original connection labels, empty values, hidden
keys, absence of the substituted upper text panel and immutable packs. All 21
paired renders and typecheck pass; the two changed pairs were visually
inspected. Before images remain in `presentation/settings-scene-variants/`,
and after images are in `presentation/settings-clock-connections/`.

## Parental introduction

`pare_new_set.bin` names `MessageOnly_D_00` with `par_top_comm0_n`; the
previous `Btn2Text_D_00` / `par_top_comm1` combination was not this scene.
The correction retains all eight source message lines, the English message
style and `MessageOnly_D_00_SceneIn_00` frame 20. It removes the extra scaled
lower text-panel backdrop and the font-size override.

The table's first byte is 2. The executable's footer name table at `0x2987bc`
maps index 2 (`0x2987c4`) to `Base_D_01`, whose two source labels are
`base_2b_back` and `base_2b_set`. Its native bound rectangles are Back
`(0,208,120,32)` and Set `(200,208,120,32)`. Integration owns those targets,
the Set row label and footer navigation. The existing `next` action remains
an inert UI route to the restrictions list; this slice does not claim to
recreate the following native PIN/setup flow (`pare_explain`).

`base_2b_set` must be present in the published English message subset; an
empty fallback is not accepted by the verifier. Source table hashes and raw
records are saved in `presentation/settings-source-audit/parental-ds-scenes.json`.
Assets publication `91d1213` supplies the missing label. All 21 paired render
checks and typecheck pass; the complete introduction and both footer labels
were visually inspected in `presentation/settings-parental-intro/`.

## Nintendo DS Profile

`ds_user_info.bin` names `LsMenu_D_00` and `LsCommonBG_U_00`, with state 2.
Its footer kind 4 selects `LsBase_D_00` through the same executable name
table (`0x2987cc`). The painter now uses those three layouts, their original
materials and settled SceneIn frame 20, plus the two source `B_LsMenu`
children. It no longer overlays modern Settings chrome or a generic detail
card. The two buttons retain the original `ds_comment` / `ds_user_color`
messages; the header is `ds_info_comm` and the full-width footer is
`ds_base_1b_back`.

Executable initialization at `0x210d10..0x210e9c` establishes the upper text
bindings: `ds_info_comm_u` → `TextBoxTitle_01`, stored nickname →
`TextBox_00`, stored comment → `TextBox_01`, `ds_birthday_u` → `TextBox_02`,
and formatted birthday → `TextBox_03`. It reads the stored favorite-color
low nibble and starts a corresponding color clip. The private disassembly is
`presentation/settings-source-audit/ds-profile-upper-init.asm`.

No stored DS profile was supplied. The three value panes are blank rather
than showing the layout's sample nickname, percent characters or `88/88`.
The original layout materials remain; no favorite-color selection is
invented. Message and Colour controls retain their source artwork but are
inert; the full-width Back target is `(0,208,320,32)`. Their source bounds
are Message `(42,72,236,32)` and Colour `(42,132,236,32)` if a subsequent
UI-only route is implemented. No keyboard or profile editing is added.

Assets `91d1213` supplies the exact Legacy layouts, button and English
messages. The verifier asserts the `Ls*` composition, the two original child
mounts, cleared value panes, original footer labels and absence of modern
title/text panels. All 21 paired render checks and typecheck pass. Both
DS Profile LCDs were visually inspected under `presentation/settings-ds-profile/`;
the earlier generic pair remains in `presentation/settings-parental-intro/`.
Browser and matched native LCD verification remain separate checks.

## Parental explanation after Set

The `parental-explain` screen paints the exact `pare_explain.bin` composition:
`StartChild_D_00`, `st_start_comm`, state-5 upper Parental chrome and
`Base_D_01` Back/Next. The source ParentChild picture's bottom origin and the
instruction pane's top origin place them on either side of the same anchor;
no position, scale or typography override is added. The English source style
is preserved. Assets publication `87bdb89` supplies the layout, picture and
message. The runtime owns the route from Set and stops before keyboard entry.

The footer rectangles remain Back `(0,208,120,32)` and Next
`(200,208,120,32)`. The renderer uses the screen ID agreed with runtime;
it does not implement navigation. The following PIN notice requires its
separately traced source dialog and must not be replaced by the old generic
restriction list or an authored availability card.

All 25 paired render checks and typecheck pass. Both explanation LCDs were
rendered, and the lower illustration/instruction/footer composition was
visually inspected in `presentation/settings-parental-explanation/`.

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


Integration checkpoint: per-scene palettes, source detail instructions,
NetType2_D_00 Date & Time buttons and Connect_U_00 empty connection rows are
integrated. Clock touch bounds now match the source 264×66 B_L buttons at
(28,27) and (28,123), with gap/edge regression tests. The 53 focused navigation
checks pass; the 21-pair scene-variant verifier passes. Native-resolution clock
and Internet renders were inspected. Live browser verification of this subpage
batch remains pending after browser control disconnected; the earlier main
screen check remains valid for that narrower screen.

### Integrated source Settings checkpoint, 2026-09-24

Parental introduction and DS Profile are now integrated with the published
source packs. Parental Back/Set targets match the two footer ends and horizontal
navigation; DS Profile uses its full-width Back target with Message/Colour
read-only. Other Settings page two follows basic_top2.bin: 3D Calibration,
Sound, Mic Test.

The combined renderer/parental batch passed 1,125 tests (18 skipped). After the
DS footer and source-order change, all 48 focused input tests passed; the old
page-order assertion was updated to the verified source order. Type checking
and the production build passed. Public asset audit passed: 1,552 resources,
567 layouts, 1,812 animations; existing unsupported-field warnings remain.
The audit did not check private source files.

Evidence is under the SSD firmware artifact root, reference/parts-settings-*
and reference/ds-footer-tests.log. The source-resolution Parental and DS Profile
renders were inspected. The production server was restarted with this build
at localhost:3000. Actual browser verification remains pending: CUA getState
timed out and reset its kernel. These checks do not establish matched native
1:1 fidelity or close the wider goal.

### Browser follow-up, 2026-09-24

CUA reconnected to existing IAB tab3 at localhost:3000 after the earlier
observation timeouts. Reloaded the production build and visually inspected
Settings main, the complete Parental introduction/footer, DS Profile upper
and lower LCDs, and Other Settings page2 inside the console at its current
593×787 viewport. This supersedes the pending browser check for these screens.

Parental Back touch returned to its main tile. Keyboard Down/A opened Other
Settings; Profile → DS Profile opened the legacy screen. Touching the right
end of the full-width Back footer returned to Profile with DS Profile selected.
B then Right showed page2 with 3D Calibration, Sound, Mic Test in that order.
Browser warn/error logs were empty at this checkpoint.

From Settings, P displayed native power controls; touching Power Off produced
black LCDs, and P returned through boot to HOME. Camera then opened its existing
portfolio folders, A opened Renu's folder, and HOME suspended it. Opening Sound
displayed Close software?, A confirmed, and Sound showed the empty music state.
No user music is supplied, so this does not verify live track playback. No
matched emulator capture or transition timing comparison was performed.

## Data Management Software and Extra Data

These two leaves remain adapted detail cards. Their source scenes
(`datamng_ctr_soft` / `datamng_ctr_data`) use `SMngCTRData_D_00` and
`SMng_U_01` with executable-selected empty messages. The lower layout and
eleven labels are unpublished, and the native SD state is a pending portfolio
decision. See the [Data Management list source audit](settings-data-lists-source-audit.md).

## Language

The Language leaf's lower screen is no longer an adapted card. On EUR,
`language` is replaced by `language_eu`: `Country_D_00` holds eight `T_SB`
rows, with slots 2–7 showing English to Nederlands at top 0. It also has an
`R_SlideBar` with a traced 104 px thumb and the `Base_D_01` Back/OK footer.
Configured English is decided with `T_SB_Decide`'s final frame. The upper
title, icon and instruction are unchanged. OK, rows and the slide bar are
inert adaptations. See the [Language source audit](settings-language-source-audit.md).
