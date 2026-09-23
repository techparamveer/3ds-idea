# Native read-only selector screens

`stock-native-selectors.ts` exports `nativeSelectorView`,
`drawNativeSelectorFrame` and `nativeSelectorTargets`. It owns only source screen
composition; shared wiring, input layout and host return stay coordinator-owned.
The view descriptor is stable across main/detail for each title, so opening a
saved-name detail does not require a new native asset session.

| Runtime title | Native title | Source packs |
| --- | --- | --- |
| mii-selector | 000400300000d102 | mii-selector/layout-Select + message-EU_English |
| photo-selector | 000400300000d302 | camera-picker/P_AptDlg_U, P_Brws_D + msg-EU_English |
| sound-selector | 000400300000d402 | sound-picker/S_ApVoicSele_D + msg-EU_English |

Only main/detail views are routed. Empty collections show their absence, and
supplied names are displayed in source chrome without generated Miis, thumbnails,
waveforms, audio, dates or selection results. Main uses the existing selected row
label; detail uses the saved `data.entry.name/title` projection. Names are bounded
and stripped of control/private-use characters, then clipped by native text panes
or the adapter's text region. No media URL is dereferenced.

## Composition and explicit adapters

Mii uses `AplSelectBase` and `AplSelectBase_Up` at FadeIn frame20. Original empty
text `appm_text_03` and prompt `appm_text_00` occupy their native panes. The source
Mii mounts, guest/room rows, cursors and scroll arrows are hidden because there is
no rendered Mii data. The original two-button footer shows `appm_btn_back_down` (B Cancel) and
`appm_btn_dec_down` (A Confirm). The native Invalid clip at frame0 disables the
Confirm appearance; the central alternate footer is hidden.

Photo uses the original upper dialog, lower frame/Back, AptTxt title strip and
P_BrwsTxt_D message pane. AptTxt In is held at frame20. The source blue lower body
is a replacement surface, so the neutral upper dialog body is composed beneath
the lower frame at 0.8 horizontal scale. The lower message pane is widened to
280 × 60 to fit supplied English empty text. The photo prompt's original glyph
colours are white on its white strip; its supplied `L_D_03_00` text is therefore
drawn with the shared bitmap font in a dark colour. Upper empty text has no native
text mount and also uses an explicit bitmap-font placement. No placeholder photo
or black preview mask is shown. Confirm remains visible with its source Disable
clip at frame0 and has no action target.

Sound retains Apt_D window/frame/Back and AptTxt source title strip at In frame20.
The source upper `App_VoiceSelectU.bclim` is a dated sample recording waveform
(2009/11/19) and is deliberately not loaded or displayed as user content. Instead,
Apt_D's neutral dialog body is reused at 1.25 horizontal scale on the upper screen.
The red lower user-surface placeholder is hidden. Confirm remains visible with
its native Disable clip at frame0 and has no action target. Supplied names or
an authored empty-collection notice use the shared bitmap font. These body/text
choices are documented portfolio composition adapters, not proof of the original
applet's dynamic media rendering or native execution sequence.

## Input and verification

The exported target helper returns Back only:

- Mii: x5, y215, width155, height24, from left B_Base_00.
- Photo and Sound: x20, y202, width88, height28, from BB-Apt2BtnB.

There are no confirmation, editing or capture targets. Existing runtime saved-item
inspection remains read-only; its hardware Open can reach the already-supported
name detail, which uses the same native frame. The coordinator must use these
Back-only targets instead of generic list/footer targets when this view is active.

Run `scripts/verify-native-selectors.mjs` with absolute `--artifact-dir`,
`--asset-root`, `--canvas-module` and `--interface-root` paths. It strictly checks
the new module against current integration interfaces, uses the normal native
asset loader, renders each empty/main-name/detail-name view at 400 × 240 and
320 × 240, verifies distinct states and Back-only targets, and checks immutable
views/packs plus loader/renderer diagnostics. The nine paired renders are stored
under `runtime/selectors` in the firmware SSD artifact root and visually inspected.
This verifies source-based Canvas composition; browser integration and matched
native LCD evidence remain separate checks. No existing runtime or shared layout
file is changed by this batch.
