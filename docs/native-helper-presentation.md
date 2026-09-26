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
`invokeSystemApplet(state, 'manual', now, { manualTitleId })`). No HOME control,
footer button or portfolio slot passes it yet. Without it, the Portfolio Guide is
unchanged. An unknown 16-hex title ID is retained and then fails its native load
explicitly, as no manual pack is listed for it. The view has no rows, no text and
no touch targets; A and directional input are inert, and B/HOME close the applet.

**Source mapping.**

| Element | Source |
| --- | --- |
| Row titles, numbers and order; category bands' order and titles | Settings content 1 `Manual.bcma/EUR_en_index.arc/blyt/Index.bclyt` (`packs/settings/contents/0001-00000038/manual-EUR_en.json`, loaded with owner title `0004001000022000`). `src/os/stock-manual-index.ts` reads `MetaData` `PageNum`/`CategoryNum` and each `Category_nnn` `IsValid`, `CategoryPageNum` and `PageID_nnn`. Category 0 (`IsValid` 0) gives page 1 without a band. Malformed metadata fails. |
| Upper header text | Settings SMDH English long description (manifest `titles[0004001000022000].longDescription`, `ExeFS/icon` of content `0000003d`), drawn in applet `SoftTitleHeader/TextBoxTxt_00`. |
| Header position | Applet `IndexNull` `SoftTitleHead` Y+262 in its 400×480 root, also `IndexNull_Wait` (`layout/IndexNull.arc/blyt/IndexNull.bclyt`, SHA-256 `af65d3ac…43c9`; private converted inventory, not a public pack): upper centre y = 240 − 262. |
| Lower card, Contents label, rows | Applet `IndexBase00`, `ContentsTxt` with `ebird/ContentsText`, `BtnHeadLineTxt` with `BtnHeadLineTxt_Wait` frame 1. |
| List clip | `BtnClose00`/`BtnCloseLng00` `P_Btn_01` (y−120, height 28): y212. |

**Adaptations.** Contents label centre y42, first row centre y86 and advances of
54px per row and 34px per category band are fitted to the capture, because
the applet places the list in code under `IndexNull/HeadLineAll`. The source
render matched the capture's chip and label rows at x80 and x160. The LCDs have
an opaque white base below the source chrome.

**Source gaps, omitted rather than drawn.** The following are absent from public
packs. `HLTxt` category bands (such as the green *Getting Started* band) exist
only in private inventory; their colour is set in code. So are the
`CsrHeadLine00` green cursor, the `ScrollIndicator` teal upper bar and the
`BtnCloseLng00` X Close / Y Language footer. The Language button has no layout
among the delivered packs. Per-category number-chip colours are code-set, so
chips render the source default. `P_Icon_00` hides the applet `IconBlank`,
because the SMDH icon binding is unimplemented. The upper striped grey page
base is unidentified. The native “Using the System Settin...” truncation rule
is unknown, so the full source title is drawn. Row selection/scrolling, opening
pages (only page 0 is converted), Language and Close input are absent. The
source-render verifier (`scripts/verify-stock-helpers.mjs`,
`manual-settings-contents`) checks composition and immutability only. No
native/browser diff has been made.

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
