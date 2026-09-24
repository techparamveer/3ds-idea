# Native Settings date, time and birthday fields

The field screens now use the original `DateTime_D_00`, `DateTime_D_01` and
`Birthday_D_00` layouts. The fabricated `_ReadOnly` layouts, cloned text
digits, added lower `TextBG_U_00`, caption font overrides and hidden arrow
mounts have been removed. Original digit pictures, materials, backgrounds,
captions and `R_UpLarge` / `R_DownLarge` / `R_UpSmall` / `R_DownSmall` children
remain at their source runtime positions. Arrows and OK are visual/inert.

## Source evidence

This uses Settings `0004001000022000`, content 0 / `0000003d`, code SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`,
mapped at `0x100000`, and the original `table_LZ.bin` recorded in
[Settings scene validation](settings-main-source-validation.md).

- `date.bin`, `time.bin` and `birthday.bin` name the three exact layouts.
  Each has footer kind 2, selecting `Base_D_01`, and labels
  `base_2b_cancel` / `base_2b_decide` (Cancel / OK).
- The locale-name pointer array at `0x26a134` identifies `EU_English` as
  index **5**. The field initializer `0x20f8bc` reads the same locale index
  used by the native message/style lookup (`0x297604`).
- In the EU English date branch, the source year pane group moves **+168**
  in X, month **−54**, day **−222**, and both separators **−54**. This gives
  **DD/MM/YYYY**. Each group includes its pictures, caption and arrow mounts;
  the caption's child white backgrounds move with it.
- In the birthday branch, month moves **+86**, day **−86**, `Picture_05`
  is hidden and `Picture_02` takes `Sign_01`'s texture: **DD/MM**. Keeping the
  layout's default separator would incorrectly show a colon. Time retains
  the original hour/minute arrangement and colon.
- Caption bindings at `0x20fb60..0x20fba4`, `0x20fdd0..0x20fdfc` and
  `0x20fe0c..0x20fe38` select the exact `year`, `month`, `day`, `hour`,
  `minute` messages. Their English message styles are preserved.
- The native value update at `0x20ecac` takes digit picture samplers from
  `Number_00` through `Number_09`; separator setup uses `Sign_01` for this
  locale. The bounded painter substitutes sampler 0's source texture name
  while retaining picture geometry, UVs, material colors and sampling
  settings. It does not render numbers with a generic font.

The settled parent is `Null_00` at `(0,0)` with alpha 255, consistent with
the surrounding settled Settings presentation. This slice does not add native
transition scheduling, arrow repeat or editable field state.

Only supplied field strings are rendered: date `YYYY-MM-DD`, time `HH:MM`,
birthday `MM-DD` (or its existing year-prefixed form). No wall-clock value,
placeholder date or sample number is invented. Missing/unrecognized values
leave the digit pictures blank; separators and source controls remain. The
birthday upper profile panel likewise substitutes only supplied strings.
This absence state is a portfolio adaptation, not native device initialization.

## Input contract

Integration owns input geometry. All three lower screens have Cancel/back
`(0,208,120,32)` and visual OK `(200,208,120,32)`. OK must not save values.
The arrows stay inert. If geometry is needed for visual input feedback, their
source `Bounding_00` rectangles are:

| Screen / field | Up rectangle | Down rectangle |
| --- | --- | --- |
| Date / day | `(16,39,66,40)` | `(16,136,66,40)` |
| Date / month | `(100,39,66,40)` | `(100,136,66,40)` |
| Date / year | `(184,39,120,40)` | `(184,136,120,40)` |
| Time / hour, Birthday / day | `(84,39,66,40)` | `(84,136,66,40)` |
| Time / minute, Birthday / month | `(170,39,66,40)` | `(170,136,66,40)` |

## Verification

Assets commit `d874b10` supplies six missing English labels; arrow layouts,
digit textures and signs were already delivered. `verify-stock-settings.mjs`
passes 24 paired renders, including explicit renderer-only supplied-value
specimens (`2024-02-29`, `23:07`, `02-29`) and missing-value cases. It checks
arrow mounts, original layouts, footer labels, source styles, EU positions,
digit/separator texture substitutions, source-pack immutability and renderer
diagnostics. Typecheck passes. Supplied date/time/birthday and absent-value
images were visually inspected; no live browser was controlled here.

Artifacts and bounded code disassembly/scene hashes are in the SSD directory
`firmware-10.7.0-32E/presentation/settings-native-fields/` (`source/` contains
the provenance record). Earlier before images remain in
`presentation/settings-ds-profile/`. These checks do not establish complete
native application behavior or 1:1 matched LCD fidelity.
