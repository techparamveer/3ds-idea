# Native read-only helper presentation

`stock-native-helpers.ts` exports `nativeHelperView`, `nativeHelperTargets`, and
`drawNativeHelperFrame`. The shared coordinator owns integrating those exports.
All selected layouts are loaded with the helper's own title identity. Native
messages retain source English text and styles. The runtime supplies only local
read-only state; no system operation is performed.

## System Transfer

Title `0004001000022a00` uses `CARDBOARD-layout-layout-lz77.json` and its own
English `cardboard_ctr` bank. The main lower screen attaches `button_D_01` at
`position_D_00/N_button_20` and `N_button_21`; the settled parent is y5 and the
button centres are (160,50) and (160,142). Runtime actions remain `3ds` and `dsi`.
The source `Title_Name`, `CM_00_Header`, transfer choices and `Button_Return`
labels are used. Details reuse the source title panel for the runtime's local
availability message, without asserting connected hardware or a transfer.

The parent and button Select clips carry archive-level animation shares. A
bounded derived copy drops only the three observed absent-endpoint pairs and
rejects any applicable or unknown share. Original resources remain immutable.
The alternate return-text pair is hidden so two labels do not overlap.

Touch regions: choices (27,18,266,64) and (27,110,266,64); Back (0,208,120,32).

## Circle Pad Pro

Runtime ID `extrapad`, title `000400300000cd02`, uses `extrapad.json` plus the
`extrapad_msbt_LZ` bank. The initial lower screen shows the source readiness
message `cepd_dlg_ready` in `Dialog_D_00`. Its source Cancel/Next footer maps
only to runtime Back and the read-only `information` detail. The detail displays
the supplied availability text and a full-width Cancel control returning Back.
No calibration animation, connected-accessory state or success is simulated.

Upper `TextBG_U_00` uses `top_comm_u`. Its three signed-size panel quadrants are
normalized to absolute sizes and reflected scales in derived pane overrides,
retaining their source origins, as in the existing Settings adapter.

Touch regions: initial Cancel (0,212,160,28), Next (160,212,160,28); detail Cancel
(0,212,320,28). Next opens information and does not start calibration.

## Verification

Run `scripts/verify-stock-helpers.mjs` with absolute `--artifact-dir`,
`--asset-root`, `--canvas-module`, and `--font-manifest` paths. It renders each
LCD, checks native load/render diagnostics and source resource immutability,
and validates visible action targets. It also retains NNID and updater coverage.
The paired outputs require visual inspection; successful asset loading does not
establish a matched native LCD reproduction. Browser verification remains the
integration coordinator's responsibility. Details and notice panel placement are
bounded web compositions using source components, not operation reenactments.

## Integration check — 2026-09-24

The integration routes Transfer and Circle Pad Pro through the native helper
renderer and maps touch targets to its source control rectangles. The focused
runtime/layout suite passes 54 tests; type checking and the production build
pass. Seven paired native helper renders pass without renderer diagnostics.
Artifacts: `CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/helper-wiring*`.

The rebuilt localhost preview was checked using the Settings touchscreen NNID
entry and physical B control. Back restores Settings with NNID selected, without
a close-software dialog. Settings still has unresolved source composition/colour
differences; NNID's authored availability body is not a verified native prompt.
These checks do not establish strict 1:1 fidelity.
## Manual viewer and supplied guide

Runtime `manual`, title `0004003000009b02`, uses the source `SoftTitleHeader`,
`IndexBase00`, `ContentsTxt`, numbered `BtnHeadLineTxt`, `PageBg00`, `PageNum`,
Close and Back components. The title is **Portfolio Guide**. Its three section
names and document paragraphs come from the existing runtime helper view;
Japanese sample chapter text is never treated as supplied manual content.
The original viewer's application manual body was not supplied.

The guide body is a derived `ContentsTxt` text pane with the same native font
and material, resized and left-aligned for the supplied paragraphs. Source
resources remain immutable. A document has one supplied page, shown as 1/1;
no nonexistent chapters, scrolling, or page actions are exposed. Paper placement
and the guide body are explicit web content composition, not verified original
application-manual pixels.

The Back button's separate glyph and text panes both start at x0 in the source
layout. Their horizontal placement is computed from the source message styles
and actual native font advances, while retaining each pane's vertical baseline.
This prevents the B glyph overlapping the translated Back label.

Touch regions: main section buttons (24,56.5 + 44*i,272,37); main Close
(0,212,320,28); document Back (40,212,140,28), matching the source button pane.
The dedicated verifier now renders the contents screen and all three supplied
sections, alongside the earlier helpers. All paired images were inspected.

## Settings electronic manual: Contents (26 September 2026)

Target: the first native Contents screen, capture
`/Volumes/Codex3DSIsolated/camera-guide-replay-20260926/screenshots/_26.09.26_23.19.14.606.png`
(400×480, SHA-256
`2efb7fa73192641b7448735f407cfaeebf7b79445ee1b92bf256f39c1566799b`).

**State.** `manual` enters this view only when opened with the explicit applet
argument `manualTitleId: '0004001000022000'` (for example
`invokeSystemApplet(state, 'manual', now, { manualTitleId })`). The Settings
HOME left footer now supplies it through the source `lau_2b_manual` label;
portfolio slots do not. Without it, the Portfolio Guide is
unchanged. An unknown 16-hex title ID is retained and then fails its native load
explicitly, as no manual pack is listed for it. The view has no rows or guide
text. X Close and B/HOME close the applet; A, Y Language and directional input
are inert.

**Source mapping.**

| Element | Source |
| --- | --- |
| Row titles, numbers and order; category bands' order and titles | Settings content 1 `Manual.bcma/EUR_en_index.arc/blyt/Index.bclyt` (`packs/settings/contents/0001-00000038/manual-EUR_en.json`, loaded with owner title `0004001000022000`). `src/os/stock-manual-index.ts` reads `MetaData` `PageNum`/`CategoryNum` and each `Category_nnn` `IsValid`, `CategoryPageNum` and `PageID_nnn`. Category 0 (`IsValid` 0) gives page 1 without a band. Malformed metadata fails. |
| Upper header text | Settings SMDH English long description (manifest `titles[0004001000022000].longDescription`, `ExeFS/icon` of content `0000003d`), drawn in applet `SoftTitleHeader/TextBoxTxt_00`. |
| Upper header icon | Manifest `titles[0004001000022000].icon` (`icons/settings.png`, extracted SMDH) drawn at 32×32 in the `SoftTitleHeader/P_Icon_00` slot, replacing the applet's `IconBlank`. |
| Upper/lower LCD base | Applet `AllNull/P_Bg_U_00` and `P_Bg_D_00` from `layout/AllNull.arc`. Both panes combine `BgLgt.bclim`, tiled `BgLine.bclim`, source vertex colours and the original TEV stages. The paired root is drawn at the upper-screen origin `[200,240]` and, for the separately published lower LCD, at `[160,0]`. |
| Header position | Delivered applet `IndexNull` `SoftTitleHead` Y+262 in its 400×480 root, also `IndexNull_Wait` (`layout/IndexNull.arc/blyt/IndexNull.bclyt`, SHA-256 `af65d3ac…43c9`): upper centre y = 240 − 262. |
| Lower card, Contents label, rows | Applet `IndexBase00`, `ContentsTxt` with `ebird/ContentsText`, `BtnHeadLineTxt` with `BtnHeadLineTxt_Wait` frame 1. |
| List clip | `BtnClose00`/`BtnCloseLng00` `P_Btn_01` (y−120, height 28): y212. |

**Adaptations.** Contents label centre y42, first row centre y86 and advances of
54px per row and 34px per category band are fitted to the capture, because
the applet places the list in code under `IndexNull/HeadLineAll`. The source
render matched the capture's chip and label rows at x80 and x160. The LCDs have
an opaque white base below the source chrome. The category band centre is
10px above the next row slot, fitted to the same capture. The applet supplies
`CategoryColor00` and `PageTitleNumBase` masks but sets their RGB registers in
code; this bounded render uses the capture's interior RGB samples
`(154,212,105)` for the first category and page-2 chip and `(237,136,136)`
for the page-1 chip. Source shapes and alpha remain unchanged.
The selected cursor is 4px below the first row's layout centre, and the
first long English page title is shortened to the native visible
“Using the System Settin...” using a 23-character prefix. These are
capture-fitted applet behaviours, not verified source-code constants.
The second category begins at y205, so its top seven pixels use the same
source `HLTxt` layout before the footer clip. Because source `BtnShdw00` is
drawn afterward and lifts the visible colour, the fitted pre-shadow register is
`(118,183,218)`; the settled source render then reaches the native strip's
`(124,186,219)`. The source row body's Y+3 is fitted to Y+2 while its slot,
category and cursor centres remain unchanged; this aligns both chips and the
row shadow edges without moving the already matching cursor. Contents, row and
category text use the renderer's LCD sampling path. Footer Language and Close
bitmap-font text use its source-size LCD path, rasterizing the delivered
`cbf_std` glyphs at their composed LCD resolution.
The Language glyph is translated to x−43 and its label to x+13, matching the
separately delivered glyph and label panes in the native footer. These
component positions are capture-fitted; source animation,
messages and text materials remain intact.

The delivered applet `HLTxt`, `CsrHeadLine00`, `ScrollIndicator`,
`BtnCloseLng00`, `BtnLngSel00` and `BtnShdw00` form the category, cursor,
upper bar and two-button footer. Their source animations and original `ebird`
messages are loaded explicitly. X Close has the source lower-left 160×28 touch
region and closes the applet. The Language button is visible but its screen
is not delivered, so its touch region and Y command remain inert.

**Upper detail follow-up.** The Settings SMDH large icon now enters the source
`P_Icon_00` material through its original `IconMask` and linear texture maps;
the Manual executable's 64×64 texture branch and assignment are traced in
[the upper-detail validation](manual-upper-detail-fidelity-2026-09-27.md).
Source-size LCD glyph sampling clears the header-title residual, and mounting
the unchanged scrollbar at y32 clears its eight-pixel vertical offset.

**Important Information text raster follow-up (27 September 2026).** The
Settings content-1 BCMA `Page_000_small_0` supplies each visible body line as a
separate source text pane, with its text, shared BCFNT font, fractional pane
origin and size. For these alpha-font, top-left panes the renderer samples the
source glyph atlas at final LCD pixel centres, preserving the fractional pane
translation without a second Canvas resize. This is scoped to the Settings
page's source layout; the source panes and strings are unchanged.

An offline source-render comparison against native capture
`_27.09.26_00.44.30.298.png` (SHA-256
`50264d734cdc3a44a1a253f89365ab76a6e97473700a76ec6442935114bf81ed`), with
empty mask and the standard channel threshold >2/255, changed upper residuals
from **17,675 to 15,116** pixels and lower residuals from **17,765 to 12,640**.
The baseline and updated render use the same offline Canvas backend; this is a
controlled renderer comparison, not a production-browser recapture or a native
fidelity pass. Hashed images and the comparison report are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/manual-text-source-size-20260927/`.
Capture/browser sampling and remaining source-composition differences stay open.

The largest connected production upper residual is still the scrollbar strip
(x363, y41, 6×145; 858 pixels). Delivered `ScrollIndicator` BCMA provides its
host, end/start artwork, orientation and Wait/Limit color animation; it contains
no runtime track length or vertical-position calculation. The decoded Manual
executable evidence currently traces the header icon branch only. Preserve the
scrollbar length/position calculation as a source gap until executable code or
native scroll-state observations establish it.

**Remaining gaps.** The general title truncation rule is unknown. Later category colours,
row selection/scrolling and Language navigation are absent. The
source-render verifier (`scripts/verify-stock-helpers.mjs`,
`manual-settings-contents`) checks composition and immutability only. The
integrated production-browser/native empty-mask pair at `c3066b5` has **471
upper and 1,459 lower** pixels over 2/255. The upper residual is confined to
the icon slot; title, scrollbar and background align. A bounded RGB565
quantization experiment increased the source-render threshold residual from
467 to 481 pixels, so it was reverted; the remaining sampling/combiner source
gap is recorded in the [icon audit](manual-icon-sampling-audit-2026-09-27.md).
Adding the delivered lower
`AllNull/P_Bg_D_00` removes the source render's 6,532-pixel `IndexBase00`
card/frame region, and the footer pane fit removes the prior 873-pixel Language
label region. The resulting production lower diagnostic is 1,459 pixels over
2/255. The unobscured upper
`AllNull` source-render background region `(0,48)..(384,240)` has zero pixels
over 2/255 and a maximum channel delta of 1. The remaining full-screen
differences mean the screen has no whole-scenario fidelity pass.

**Lower text follow-up (27 September 2026).** The delivered `BtnLngSel00` and
`BtnCloseLng00` footer panes retain their original `ebird` messages and layout;
only their bitmap-font sampling mode changes to source-size LCD. Against the
same native capture with an empty mask, the offline `verify-stock-helpers.mjs`
render decreased from **2,102 to 1,899** lower pixels over 2/255. The Language
glyph region decreased from **275 to 256** pixels. This verifies the source
renderer output, not a production browser recapture: the captured production
pair at `0a44f2c` still records 1,664 lower pixels over 2/255 pending
integration and recapture. Small row/footer text residuals remain, and the
screen has no whole-scenario fidelity pass. The offline diff reports are in
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/manual-lower-text-coverage-20260927/`:
before SHA-256 `8f88e8b5e2bfafe21e3a0d08f4698c56f3dc5305317cc6ecb98f596713e1de0d`,
after SHA-256 `d2f3fdc498cf7e390f0ea028a18bcfc2617f2fddfdacdb6e6ae8af328b60a94c`.

## Transfer and Update return follow-up

[Return verification](settings-transfer-update-return-validation.md) checks both
helpers' touch/physical Back, HOME/resume, full parent-state preservation and
reopen behavior. The retained caller already works; this pass adds six focused
regressions and fresh helper renders without changing runtime or artwork.
Direct helper launch and retained-parent navigation remain portfolio adapters;
source scene positions and footer geometry do not prove native cross-title
lifecycle equivalence.

## System Update source confirmation

The [static entry source audit](updater-entry-source-audit.md) replaces the
updater's authored notice with `update.bin`'s original question, background
state, orange title clip and Cancel/OK footer. Cancel returns to the retained
caller; OK is deliberately inert. The source-backed static composition does not
claim native entry timing, launch-argument routing or matched LCD pixels.

## Settings Important Information page (27 September 2026)

The first Contents row now opens page 1 via A or a touch release inside its
source 272×37 `Bounding_00`, mounted at the existing captured row centre y86.
B and the source Back region return to Contents; X and the icon-only Close
region close the applet. Other rows, directions and Enlarge remain inert.
Only Settings receives this path; unknown manual IDs and the Portfolio Guide
retain their existing behavior. Eight portfolio app positions are untouched.

Reference: genuine native `_27.09.26_00.44.30.298.png`, SHA-256
`50264d734cdc3a44a1a253f89365ab76a6e97473700a76ec6442935114bf81ed`.
The coordinator entered with mapped A from selected Important Information.
Its line breaks identify `Page_000_small_0` rather than the large variant.
The page spans **both** LCDs. The initial body origin y38 and header centre y20
are capture-fitted adaptations; no native scroll initialization or timing claim
is made. Source `PageGroup/BaseN` supplies x−160, resulting in x40 upper and
x0 lower. The lower viewport ends at the source footer's y212.

Body text, warning artwork and background come unchanged from Settings content1
`Manual.bcma/EUR_en_small.arc/blyt/Page_000_small_{0,bg}.bclyt`, under manifest
pack `packs/settings/contents/0001-00000038/manual-EUR_en.json`.
Header text and number come from its `Index`. The applet's original
`BtnHeadLineTxt_ChangeWait` supplies number x−145.5/title x−122, matching the
native page header; existing captured chip RGB is retained as an adaptation.
`PageShdw00`, `PageGroup`, `BtnClose01` and `BtnTextSize00`, and the original
`ebird/BtnTextSize_*` messages are published by the additive opt-in plan
`scripts/firmware/stock-ui-manual-page.json` from `manual-native14`.
Existing `BtnBack00` retains its source messages and font-width glyph grouping;
Enlarge uses the same grouping approach. All shapes, fonts and native text are
firmware resources. No screenshot is delivered.

Remaining gaps: scrollbar, page
scrolling, Enlarge, later-page navigation, native transition/cue timing and
pixel fidelity. The shared source `AllNull` base is now active. Page entry is a
settled presentation with existing readiness/loading gates, not an emulated
native transition. The source-render verifier checks both LCDs, immutable
resources and bounded targets. The first production/native empty-mask pair at
`c3066b5` has **14,716 upper and 12,480 lower** pixels over 2/255, down from
31,818 / 17,463 before the neighbor and source-size page text were mounted. Both contact sheets were
inspected, so pixel, motion and audio tiers remain failing/open.


## Settings Manual neighboring page (2026-09-27)

Page 1 now composes the applet `AllNull_Wait` background and the adjacent
page using `MainNull/ContsR` x340 and `PageGroup/BaseN` x−160. Thus the
neighbor's body starts at upper x380 and lower x340 (outside that LCD).
The header uses the existing source ChangeWait layout and Settings Index page
1 title/number. The separate opt-in `manual_bcma.py --neighbor-preview`
publication selects only `Page_001_small_{0,bg,info}` and its five referenced
table textures, from the same pinned Settings content-1 BCMA. The original
page-0 pack remains byte-identical. This is a preview, not page-2 navigation.
No new input behavior or transition timing is claimed.

Offline source-render comparison to native `_27.09.26_00.44.30.298.png`
(SHA-256 `50264d734cdc3a44a1a253f89365ab76a6e97473700a76ec6442935114bf81ed`),
using empty masks and any RGB channel >2/255:

| Region | Before | After |
| --- | ---: | ---: |
| Upper 400×240 | 32,235 | 17,675 |
| Upper neighbor x374–399 | 3,525 | 595 |
| Lower 320×240 | 17,765 | 17,765 |

These are offline renderer comparisons, not production browser acceptance.
The existing page origin38/header20 and chip color adaptations remain.
The source `MainNull/ScrollIndicator` gives horizontal offset166 (upper x366).
`ScrollIndicator` supplies the rotated StartPic/EndPic artwork and Wait color,
but its layout has only the default 8+24-pixel span; the Wait/Limit tracks
contain no runtime length or vertical-position calculation. Native shows a
longer indicator. That calculation is still an explicit capability gap;
no guessed thumb or scroll/Enlarge semantics are introduced. Need native
scroll/Enlarge observations or executable source evidence before behavior.

Verification: 14 offline native helper pairs render without diagnostics or
resource mutation; focused manual tests and converter tests cover the narrow
preview selection and title ownership. Production recapture: Settings HOME →
Manual → A on Important Information; preserve small text and initial scroll,
compare both LCDs to the native image above. Browser/emulator were not driven
in this lane.
