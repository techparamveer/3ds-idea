# System Settings main Close footer: source audit

25 September 2026. This is a bounded source and native-capture audit of the
**settled main** lower LCD. It does not edit the live painter or claim whole-page
visual acceptance. The repeatable checks and full hashes are in
[`scripts/audit_settings_main_footer.py`](../scripts/audit_settings_main_footer.py)
and [`evidence/settings-main-footer-source.json`](evidence/settings-main-footer-source.json).

## Source binding

The original EUR 10.7.0-32E Settings `table_LZ.bin/top4btn.bin` is SHA-256
`fea73c10a5e76b2ca9ff8463acd42f3afbdb70802630a9784d3636636e49e872`.
Its first byte is **6**. In the original Settings executable (mapped from
`0x100000`), footer-name pointer table `0x2987bc` entry 6 points to
`0x28f340`, the string **`TopBase_D_00`**. Entry 1 instead names `Base_D_00`,
the short Back-only footer used by subpages. This is a direct table lookup, not
a visual guess from similar button sprites.

`TopBase_D_00` is `base_LZ.bin/blyt/TopBase_D_00.bclyt`, SHA-256
`21a2935b586913c21017f79967fbed9b1a825ec2a05d9f9069e2e0ce7852b399`.
The delivered `base.json` resource provenance matches that original member.
Its lower-screen canvas is 320×240; `Bounding_00` is 320×32 at `(0,-104)`,
covering native lower coordinates `(0,208,320,32)`. The visible bar uses a
256×38 center pane, 38×38 round end panes, shadow panes and light panes, all
from the delivered `BaseBtnL`, `BaseBtnLShdw` and `BaseBtnLgt` textures. The
default layout is the settled pose: there is no `TopBase_D_00` animation in
the source pack. The English `message_EU` label `top_btm_text` is
`U+E071` (the native HOME glyph) followed by ` Close`, style index 576.

The isolated Azahar capture
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/screenshots/System Settings_25.09.26_13.03.55.629.png`
(SHA-256 `a02c39244e7175da7d0eaa8e0678b6518b3f4b058f9f0c53b014e92c66b53558`)
is 400×480 with the 320×240 lower LCD at x=40–359, y=240–479. Its Close
footer starts near image y=449 and continues through the lower edge. It has
the dark gray full-width pill, a white glyph and white “Close”, matching the
source layout's shape and placement. This capture is evidence for the static
settled pose only; it does not establish pressed or transition frames.

## Integration recommendation

Load `TopBase_D_00` in `settingsScreenPacks`' base layouts. On main, draw it
**after** `Top_D_02` and its five button attachments, using no animation
binding. Override `TextBox_00` and `TextBoxShdw_00` with
`nativeMessageOverride(messages, 'mset', 'top_btm_text', '')` so source text,
style and glyph remain intact. The draw order puts the bar over the lower
edge of the main button composition, as in the native capture. Keep the main
background's existing default state and the top status draw order. Use the
source `Bounding_00` rectangle for the Close touch target.

The current painter does not request `TopBase_D_00`; it places `top_btm_text`
only in the 15 px `Top_D_02/TextBoxTitle_01` instruction pane at the bottom.
That produces the tiny gray glyph/Close on pale yellow seen in the current
`verify-stock-settings` render. The source footer is an additional layout,
not a larger font or a recolor of that instruction pane. Binding the same
message to the source footer avoids inventing alternate wording while the
underlying pane is occluded.

The next integration check should render the corrected 320×240 main lower LCD
and compare its footer crop to this native capture. A pixel score should
account for the capture's 40 px horizontal border and exclude the unobserved
transition frames. The source audit alone does not validate browser output.
