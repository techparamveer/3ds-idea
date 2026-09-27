# Native personal-tool screens

`stock-native-personal-tools.ts` exports `nativePersonalToolView(view)` for the
existing title-session loader and `drawNativePersonalToolFrame(renderer, top,
bottom, view, options)` for the coordinator's stock painter. It does not edit
shared presentation, layout, renderer, runtime or manifest modules.

The first slice covered the empty Notifications main screen. It requests the
original `news.json` layouts `NewsTopUI_U_00`, `NewsTopUI_D_00`,
`NewsUnread_U_00` and `NewsTopBtn_D_00`, plus the EU English
`newslist_msbt_LZ` bank and its retained styles. The original unread counter
uses NumAnim frame 0 in that empty state; SceneIn is held at settled frame 20. Japanese source text
placeholders are overridden with supplied English messages. Native Close spans
the whole lower footer; the coordinator should use a full-width Back target.

The upper background is drawn before the source translucent unread overlay.
The HUD title uses the shared source bitmap font and native English title;
the lower empty-state line comes from the existing AppView text. These two text
placements are portfolio adapters, not claims about native text-task placement.
Notification detail, populated/detail Friends and non-main Notes views remain
outside this native painter. This module never fetches notifications or marks them read.

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

## Notifications isolated-profile list

The isolated Vulkan replay establishes that the initial applet is populated,
superseding the earlier empty-state assumption above. The exact input route was
HOME Notifications selected, followed by 32 discrete A presses. The resulting
native PNG is
`/Volumes/Codex3DSIsolated/native-home-replay-20260927/screenshots/_27.09.26_12.12.20.627.png`
(SHA-256 `d9bd30ef373ce06bcc1a041ea9b3f15a9ffbf8d0d97798fe1a7d98e11e0d8591`).

The profile database at
`user/nand/data/00000000000000000000000000000000/sysdata/00010035/00000000/news.db`
is 11,216 bytes with SHA-256
`4b9ed183eff258590911d8aa4402f2e523aeb5cfd272873aa8cb2c3bcfbf28dc`.
It has a 16-byte header and 100 fixed 0x70-byte records. Each record contains
0x30 bytes of metadata and a 0x40-byte UTF-16LE title. Active records sorted by
the little-endian timestamp at record offset 0x28 give HOME Menu Settings,
Touching and Sliding, Sleep Mode, HOME Menu Functionality, Using microSD Cards,
Play Coins, About the `U+E073`HOME Button, New Software via SpotPass and About
Notifications. Record byte 1 is zero only for HOME Menu Settings; the other
eight records are unread. This matches the native Unread Notifications count 8,
the missing blue dot on the first row and the first four visible titles.

The browser initial shared profile carries only those source titles, order and
read flags; no private database bytes are delivered. Record 50's exact source
title contains the private-use glyph U+E073 immediately before HOME. Newly
created profiles receive this fixture; an explicit persisted empty array stays
empty. The main renderer reuses
`NewsWndwNews_D_00`, its SceneIn/Select clips and the source SlideBar in addition
to the existing upper unread and Close layouts. Source fixture rows are inert
and omit the generic OK action because their bodies/detail view have not been
verified. Populated saved arrays remain intact with existing behavior. List
scrolling/animation has not been native compared.

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


## Friend List initial screen

The third slice covers main with just the existing `profile` row. Eight layouts
from `friend.json` supply upper/lower backgrounds, both card layers, toolbar and
curved Close footer. The `friend_msbt_LZ` English bank supplies Settings,
Register Friend, Offline, Favourite Title, unknown friend code and Close labels.
The source SceneIn frame 20, offline palette and selected card clips are held
for this static composition. The nickname comes only from AppView settings;
missing nickname remains empty. Friend count is zero and the code retains the
source `???? - ???? - ????` placeholder. No avatar, friend, account, title or
network status data is invented. The two dynamic Mii surfaces remain absent.

Settings/Register Friend are source visual chrome, with no account operations.
The selected lower card is approximately x107,y114,width106,height66 in this
composition. Its target maps to the existing profile row. The curved Close
source bounds form six centered horizontal strips: widths 110/150/186/214/242/270
and heights 32/27/22/17/12/6, all bottom-aligned to y240. Populated main and detail
views retain fallback presentation. Upper HUD title placement remains an adapter.
This is a resource-based read-only composition, not a verified native initial
session or a substitute for missing dynamic Mii rendering.

Run the same verifier with `--title friends`. Strict interface checking, paired
400/320-pixel rendering, zero loader/renderer diagnostics, guarded view selection
and immutable source packs pass. Both PNGs under `runtime/personal-tools/friends`
were visually inspected; browser verification remains the coordinator's check.

## Friend List own-card profile

Opening `profile` now stays in native presentation. The same source card layers
are reused; `FrdTopUIUp_D_00/N_BtnTopPivot_01` selects the own-card Favourite
Title / Message toolbar and hides the mutually exclusive main/join branches.
The toolbar is visual only. Runtime profile rows are empty, so those labels and
the name/status fields cannot launch editors or generic follow-on pages.

The saved status uses the native lower `N_Blln_00/T_Box_03` bubble. Without a
status, `N_Blln_02/T_NoComment_00` shows source `fri_twitt_none` instead.
Source `fri_dlg_2b_back` supplies the B glyph and Back text in the existing curved
footer. Its hit geometry matches the main footer described above; this is the
only profile action. Saved nickname/message and Mii ID are retained unchanged.
No Mii image, favourite title or friend code is synthesized.

Requires the expanded English message selection from assets commit 6644715.
The source components are held in a settled read-only composition; this does not
claim the original app's complete card-turn/task sequence. Use verifier title
`friends-profile` to render empty and supplied-status fixtures. Both screen pairs
were inspected at `runtime/personal-tools/friends-profile`; the fixture nickname
and status appear in their native text panes, with distinct pixel hashes, zero
loader/renderer diagnostics, strict interface checking and immutable views/packs.
Runtime coverage checks that profile actions and text events cannot open an
editor or change saved values, and Back returns to main. Browser verification is
still a separate integration check.

## Game Notes selected-note screen

Opening a note now routes `game-notes/drawing` to a separate native pack selection:
source Bg_U_00/Bg_D_00, MemoWriteDown, ImageScreenUp and English messages. The lower
paper frame and seven-tool strip are the original MemoWriteDown artwork, held at
Base 0 / SceneIn 20. Extended clear/export controls, shutter/capture transitions
and the pen cursor are hidden. Toolbar icons are noninteractive except the source
Back target `(0,212,44,28)`. The runtime restores the selected note's grid cell on
Back and emits no editing or save effects.

With a suspended application, ImageScreenUp instead shows that application's
last complete LCD pair at settled SwitchDouble, or SwitchUp/SwitchDown after
the source `B_BtnSwitch` target `(230,212,44,28)` cycles the session mode; see
[suspended capture](native-notes-suspended-capture.md) and the
[switch source audit](native-notes-switch-source-audit.md). Otherwise it is held at
PanelNoGameIn frame20 with the lower switch button in its `MemoWriteDown_Invalid` pose. Its screenshot/shadow panes,
dynamic software-title panel and alternate note-up surface remain hidden because
there is no suspended-software capture. Source T_TextList explicitly receives the
complete English `9900NoBreakGameMesList` message and visible/opaque overrides;
T_TextWrite stays hidden. The clip itself hides both text panes, so selecting the
visible native pane is an explicit portfolio composition adapter. The message
represents the absence of a captured software surface; this is not a claim about
native APT/software suspension state. No software screenshot is fabricated.

Existing legacy saved points are displayed at their stored lower-LCD coordinates,
clipped inside the paper. This small read-only raster adapter uses 2px black/red/
blue strokes and a 12px white eraser, round ends, and the legacy limits of 2048
strokes / 4096 points. Those widths are authored display choices, not verified
native pen behavior. Invalid points and unsupported colours are ignored without
mutating saved data. No stroke is created by touchscreen input.

Requires assets6644715 for ImageScreenUp and its message selection. Verifier
`--title notes-selected` renders blank and saved-stroke fixtures and checks their
native-resolution outputs, distinct canvas pixels, red/blue/erased samples,
identical toolbar pixels despite an out-of-canvas stroke, unchanged views/packs,
strict interfaces and zero diagnostics. Both pairs were visually inspected at
`runtime/personal-tools/notes-selected`. Tests confirm that all editing actions
and canvas touches are inert, saved points remain intact, and Back restores slot15.
Browser integration and a matched native LCD session remain separate checks.
