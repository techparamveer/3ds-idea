# Native personal-tool screens

`stock-native-personal-tools.ts` exports `nativePersonalToolView(view)` for the
existing title-session loader and `drawNativePersonalToolFrame(renderer, top,
bottom, view, options)` for the coordinator's stock painter. It does not edit
shared presentation, layout, renderer, runtime or manifest modules.

The first slice covers the empty Notifications main screen. It requests the
original `news.json` layouts `NewsTopUI_U_00`, `NewsTopUI_D_00`,
`NewsUnread_U_00` and `NewsTopBtn_D_00`, plus the EU English
`newslist_msbt_LZ` bank and its retained styles. The original unread counter
uses NumAnim frame 0; SceneIn is held at settled frame 20. Both source
notification categories show zero unread items. All Japanese source text
placeholders are overridden with supplied English messages. Native Close spans
the whole lower footer; the coordinator should use a full-width Back target.

The upper background is drawn before the source translucent unread overlay.
The HUD title uses the shared source bitmap font and native English title;
the lower empty-state line comes from the existing AppView text. These two text
placements are portfolio adapters, not claims about native text-task placement.
Populated notifications, notification detail, Friends and non-main Notes views
return null / false until their own visual slice is verified. Existing fallback UI can handle
those views. This module never fetches notifications or marks them read.

Run `scripts/verify-native-personal-tools.mjs` with `--title notifications`,
`--artifact-dir`, `--asset-root`, `--canvas-module` and `--interface-root`.
All paths are absolute. The interface root supplies existing shared source
modules read-only, permitting isolated worktrees to verify against the current
integration API without copying shared files. The verifier performs a strict
TypeScript check of this module against those interfaces, loads through the
existing native title loader, checks renderer diagnostics and source immutability,
and exports 400 × 240 / 320 × 240 PNGs. Output was visually inspected on the SSD
under `runtime/personal-tools/notifications` in the existing firmware artifact
root. The source-based render is not a matched native LCD/browser capture.

## Game Notes initial screen

The second slice adds Game Notes main via five explicit packs: Bg_U_00,
Bg_D_00, MemoListDown, MemoTutorialUp and English messages. It retains the
source 16-note thumbnail grid, frames, cursor and full-width Close artwork.
SceneIn is held at settled frame 20; Base is evaluated separately. Cursor
placement follows source B_BtnMemo00..15 centres (42+79×column,30+51×row),
matching source hit rectangles (7+79×column,8+51×row,70,44). Source textures show
blank note pages; no invented note content or suspended-game image is supplied.
The upper screen reuses the original introductory help panel and English text.
Combining that help panel with the grid is an explicit portfolio UI composition,
not proof of the native app's initial task sequence. Editing remains disabled.

This requires the coordinator's four-frame horizontal reflection support
(commit 3d6d50d). With that fix, strict interface type checking and four complete
400/320-pixel paired renders pass with no diagnostics. Four tested cursor cells
have distinct pixel hashes and the source packs remain byte-identical in memory.
Outputs under `runtime/personal-tools/notes` were visually inspected. Use the
same verifier with `--title notes`. Source blank cards, cursor, close lettering,
and introductory panel all appear; matched browser/native LCD comparison is
still the coordinator's integration check.
