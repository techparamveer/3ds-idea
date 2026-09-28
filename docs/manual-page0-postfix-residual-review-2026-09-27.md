# Settings Manual page-0 postfix residual review — 27 September 2026

This bounded review uses the settled native/browser raw LCD pair recorded as
`settings-manual-page0-postfix-8cbee36-20260927`. Its empty-mask report has
3,054 upper and 2,071 lower pixels over 2/255. The native frame is
`_27.09.26_00.44.30.298.png` (SHA-256
`50264d734cdc3a44a1a253f89365ab76a6e97473700a76ec6442935114bf81ed`);
the browser upper/lower PNG hashes are `29a0b067a72d5d9110ee194cd5aebd45e76a13303db62`
and `6b8e1ec2c1d26a4ad462f2447762ceeb9d2c0fde1b46b2930d40373fdd9364bf`.
The private report is under
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/settings-manual-page0-postfix-8cbee36-20260927/report.json`.

The upper contact sheet shows the largest region as the native 6×145 scrollbar
at `(363,41)`, 858 pixels. The renderer draws no page indicator in
`drawApplicationManualPage`; its Contents indicator is a separate
`ScrollIndicator` layout. The [source audit](manual-page0-scrollbar-source-audit-2026-09-27.md)
identifies a count-driven resize routine in the Manual executable, but does not
establish that routine's ownership, vector contents or starting scroll pose for
this page. The visible 145-pixel span is therefore insufficient to set page
geometry in code.

The lower contact sheet shows the largest regions in the Back and Enlarge
footer, especially `(76,216,22,20)`, `(202,216,22,20)` and
`(256,222,28,15)`. The renderer already uses delivered `BtnBack00` and
`BtnTextSize00` layouts, original applet messages and scene-in frame 20. Its
text/glyph positions are partly capture-fitted. The report does not isolate a
wrong source register, frame or font raster rule for these remaining pixels.
Changing translations, colours or sampling based on these rectangles alone
would be another screenshot fit, not a source-backed correction.

No runtime or asset change is justified by this review. It is a source and
existing-pair audit, not a new browser recapture. Page input timing, motion,
audio and whole-scenario acceptance remain open. A useful next source step is
to trace the page scene's scrollbar instance and its initial size/position
writes, then separately trace footer glyph material/font sampling before
altering those regions.
