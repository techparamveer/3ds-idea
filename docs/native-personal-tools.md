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
Populated notifications, notification detail, Friends and Notes return null /
false until their own visual slice is verified. Existing fallback UI can handle
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

Notes first render exposed four-frame window FlipH support missing from the
shared renderer; the coordinator fixed that separately. Its draft remains
private until the source grid can render successfully with that fix.
