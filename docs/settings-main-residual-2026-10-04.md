# Settings main S-01 residual — 4 October 2026

No runtime change. Worker checkout `codex/settings-main-residual-20261004`
from HOME fidelity HEAD `7ef27bb73f415887b8bf4e9053cd885c610ae8fa`. The assigned
pair is production `settings-app-open-live-v85` @ `566c989`, empty mask,
threshold 2/255: **0 upper / 20 lower**, maximum RGB error 51. This is not a
1:1 claim, not matched input/motion/audio, and not whole-scenario acceptance.

The isolated native volume
`/Volumes/Codex3DSIsolated/camera-guide-replay-20260926/screenshots/_27.09.26_03.00.59.899.png`
was unmounted here. Native lower pixels were taken from the contact-sheet left
pane at `(8,8)` (320×240). That crop reproduces the report's 20 coordinates and
maximum channel error 51. Browser lower SHA-256 matches the report.

## Pair

| Item | Path / identity |
| --- | --- |
| Report | `/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260927/reference/scenario-matrix/v1/captures/settings-app-open-live-v85/diff/report.json` SHA-256 `43c3b0c95ac5419130f8bd9f8e8e47a0beaee403cf11a3bb8731411bb1576b9b` |
| Native combined (declared) | `_27.09.26_03.00.59.899.png` SHA-256 `7e030f8120c3b338d3df3a113b8a9370837296fe208bc6213271004b446505f9` |
| Browser lower | same capture `browser/lower.png` SHA-256 `708211ad94247bc6c87f740c0e1961befea4cec5fdb1e57b4cfc342952e189d0` |
| Lower contact | `diff/lower-contact-sheet.png` SHA-256 `1f240504602a46e63a219759b345423bcb7f7f175635b2d97bfddb3647aef0cf` |
| Lower heatmap | `diff/lower-heatmap.png` SHA-256 `091b56326cf8247586a4107ca03332f88897307f18e39b5062fbac861f6bbd8c` |
| Native lower from contact | artifact `native-lower-from-contact.png` SHA-256 `b77d014319acd4bec782c64d7f5e841ed655941c1ba8f9947896a562c0f87d7a` |
| Worker artifacts | `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/settings-main-residual-20261004/` |

Inspected the lower contact sheet and heatmap. Residuals are missing ink or
button-edge AA, not focus chrome and not HUD phase. `Top_D_02_SceneIn_00`
stays at settled frame 35. Main still does not pass `textCoverageAdaptation`,
`textSampling` or `pictureSampling`.

## Cluster identity

English `mset/top_settings` is the single line `Other Settings` (style 302,
font scale `0.699999988079071`). `I_TopRBs/TextBox_00` is a centered 134×42
pane whose screen origin is x167. Writer-local float32 rights plus that origin:

| Cluster | Pixels | Visual | Owner |
| --- | --- | --- | --- |
| `(273,175)` 1×9 | 9, max 51 | vertical stem in “Settings” | **n** right edge. Local right `106.49999237060547`, screen `273.49999237060547`. Native RGB ~`(180,174,159)` vs browser button fill ~`(228,225,209)`. |
| `(259,174)` 1×2 and `(259,182)` 1×2 | 4 | second **t** of “Settings” | Local right `92.49999618530273`, screen `259.49999618530273`. |
| `(294,180)` 1×2 | 2 | final **s** | Local right `127.49999237060547`, screen `294.49999237060547`. |
| `(76,191)` 1×2 | 2 | **g** in “Management” | Two-line `mset/top_software` (`Data\nManagement`) on `I_TopLBs`. Generic Canvas path; not the traced single-line 0x111 writer. |
| `(20,45)`, `(18,105)`, `(22,110)` | 3, delta 3 | Internet button left rounded chrome | `N_I_TopLTs_00` AABB left 22, top 38, bottom 116. Not the globe icon (centre ~86) and not Parental (x≥160). Earlier notes labelled the last two as Parental icon; the contact sheet shows they are Internet chrome. |

The 15 Other Settings pixels are the same coordinates as
[the 26 September lower endpoint gap](settings-lower-endpoint-source-gap-2026-09-26.md).
Browser lower SHA-256 is unchanged from that pair. v85 only matched the upper
clock; it did not remove these lower columns.

## Bounded source trace (no renderer change)

EUR Settings title `0004001000022000`, content 0/`0000003d`, `code.bin`
SHA-256 `1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
Re-ran `scripts/audit_settings_cached_writer_identity.py` against the verified
HOME/Settings images. Windows still match uniquely. Capstone at Settings
`0x1eb35c` is byte-identical to HOME `0x1ac050`:

```
vmla.f32 s2, s10, s7   ; float32 right endpoint
vmov.f32 s7, s1
vmla.f32 s7, s9, s8    ; float32 vertical endpoint
vstr     s2 / s1 / s0 … into the quad
```

That is the already-implemented writer-local endpoint store. It does not prove
later cached expansion, projection, viewport or screen-space rounding. The
text-writer shader remains SHA-256
`87e9a661a499dfe18818310d6758855eba5d56892fe266c155b18e3e0f4d881e`.

Upright coverage includes an exact right-edge pixel-centre tie
(`floor(right-0.5)+1`). These three screen rights sit just below `*.5`, so the
current raster leaves columns 259, 273 and 294 empty. Native shows glyph ink
there. The first **t** of “Settings” also ends at screen `253.1999969482422`
and is excluded locally, but **253 is not in the live residual**, so a blanket
screen snap or 1/16 edge fit is not uniquely determined by this still.

`azahar-12p4-fit` would paint the 15 Other Settings columns. It is a labelled
capture fit on Other Settings' upper title and Health Back, not a proven GPU
rule, and main does not opt into it. Applying it here would be guessing.

`top_internet`, `top_parental` and `top_software` remain two-line. Direct alpha
sampling requires a single line (or writer 0x111 with `lineSpacing===0`). The
English styles keep `lineSpacing` −2/−3, so those labels stay on the generic
Canvas path. The Management **g** and the three Internet chrome pixels are
outside the endpoint probes. Do not invent LCD picture sampling or a multiline
writer origin from this pair.

## Tests

`tests/settings-main-residual.test.mjs` asserts the t/n/s endpoints, that the
rejected 1/16 fit would cover those columns, that column 253 is not a live
discriminator, that main draw does not pass coverage/sampling opts, and that
the three delta-3 pixels sit on the Internet left fringe.

## Remaining

The 0/20 static remainder is an unexplained source gap on later vertex/screen
precision (15 Other Settings glyph columns) plus untraced two-line Management
coverage and Internet button-edge AA (delta 3). Recapture after a source-backed
general edge rule; regress Other Settings page 1 and Health first. Upper on
this pair is already 0 over 2. Exact input, motion and audio remain open.
