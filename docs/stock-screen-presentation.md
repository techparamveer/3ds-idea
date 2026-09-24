# Stock screen presentation, first live slice

`stock-screen-presentation.ts` replaces the shared stock four-row drawing with
Camera folder/photo surfaces, a Sound library/player and native Settings main
assembly. It consumes the existing `AppView`; navigation and audio transport
remain owned by the runtime and scene. The eight portfolio app painters are
unchanged. Root calls `graphics.syncStockView(state)` before every paint,
including the powered-off early return, to release inactive native sessions.

Camera uses the real portfolio photo records, asynchronous bounded image loading,
six thumbnails per page, a source `P_FinderVS_U` upper browse screen and a
full-photo view. It has no capture, edit or import controls. Sound paints supplied track metadata,
play/pause, previous/next, seek and a single source loop-mode control. Production
music is empty pending the user's tracks; the verification player is explicitly
synthetic.
`stock-screen-layout.ts` supplies the same controls to runtime touch navigation.

Settings consumes source Bg_U/D, TopText_U_00, Top_D_02 and the five I_Top*s child
layouts, plus English mset message styles. Its title-owned `HudMset_00` is the
final upper layer on main and subpages. The Internet/full-signal and battery
frames are a fixed state observed in the native reference, not device
telemetry; date/time uses the source English HUD messages and injected local
clock. See the [bounded source audit](settings-native-status-source-audit.md).
Settled scene frames and each button's
source Select clip paint focus (frame 1 selected, frame 0 inactive). The bounded
Settings adapter creates derived direct-track clips, omitting only the archive's
`Button → AS_Picture_00` and `BottunPage01 → AS_Picture_16` share records after
asserting both endpoints are absent in each button layout. It preserves original
clips and source packs; any new or applicable share fails explicitly. This is a
presentation adapter, not a general native binding claim.
Main now retains the source default background, following the executable's
initial state 0 → scene state 3 rather than forcing Legacy frame 40. See
[the source trace and subpage distinctions](settings-main-source-validation.md).
Missing/failed native assets retain a per-app fallback. Native
assets belong to an application instance through `createNativeTitleSession`;
owner changes, suspension and disposal release them. Completed screens are
cached until view/font/image/native readiness changes; Settings also repaints
when its year/date/hour/minute key changes. `prepare(view,owner,font)`
starts resource acquisition without drawing. `syncStockView(state,context)`
primes during launch and app phases, and cancels on HOME, off or suspension;
the scene passes its font-bearing upper context before painting the launch.

`scripts/verify-stock-screens.mjs` accepts absolute `--artifact-dir`,
`--asset-root`, `--canvas-module` and `--font-manifest` paths. The first run wrote
seven 400×240 / 320×240 screen pairs and a contact sheet under the SSD artifact
directory `presentation/stock-ui-first`, with no renderer diagnostics. The
Settings assembly, gallery images and player controls were visually inspected.

These are reviewable UI changes, not 1:1 acceptance. Camera consumes the original browser background, folder and photo thumbnails,
selection frame and album mount. Folder/photo cells now bind the published
large PicL clips so the 66×52 frames use their 2×3 textures instead of
stretched 5×7 placeholders. Portfolio photos draw under `ThmbMask` at the
source 56×42 slot; the opened photo uses `-PhoMntPos` at `[32, 43, 256, 128]`.
Invented heading, cell labels and photo-view arrows were removed. The six-cell
placement and Back/Open footer remain portfolio adaptations. Folder/empty uppers
use source `P_FinderVS_U` browse panes; gallery and photo replace the native
viewfinder framebuffer with portfolio pixels. Native capture and zoom controls
are hidden. The generic Camera chrome remains only as a non-native fallback.
The neutral source
transition BG remains visible in place of UserBG's blue replacement default;
native runtime background binding is still unresolved. See
[the gallery comparison](camera-gallery-source-validation.md).
Sound now consumes the source background/grid, title and
track panels, parakeet, Back button, list cursor and transport art. Track strings
and artwork come from AppView. The transport, loop-mode icon, `C_SldT` slider,
Open ("Play") button, Back width and the "Could not play." dialog sit at their
source mounts and touch bounds; see
[the Sound source validation](sound-source-validation.md) for the mounts,
adaptations and open gaps.
Source animation frames are settled snapshots, not a claim of native scheduling.
Health consumes the source upper background/title, three precaution buttons,
reading frame, footer and exact English messages. The menu hit regions match
the native button bounds. Documents use eight source lines per page with base
message styles; the shared counts are 12/44/27 pages for 3D/general/usage.
Verification checks those counts against delivered text. Rich inline message
runs and native continuous scrolling remain explicit adaptations.
Browser assembles the source StartDialog and six button children at their native
mounts, with matching touch regions and English message labels. Its
outer dialog frame now uses its original four source textures with horizontal,
vertical and 180-degree texture orientations. The search
button shows the source Google provider variant and hides the mutually exclusive
regional logos; it does not perform searches. Browser and
Miiverse crop their original 400×480 background separately to the two LCDs;
the lower screen is not scaled from 400 to 320 pixels. Miiverse uses the four
source navigation icons and a Back control in a documented local toolbar
assembly. Website content, remote feeds, detailed browser settings and native
navigation scheduling remain absent. The title-bound `font.bcfnt` resources
load through the normal manifest font bindings, including in the render verifier.
Where Browser/Miiverse messages reference an unavailable sibling style table,
the adapter applies their English text while retaining the source pane's font
size and spacing; those unresolved message styles are not treated as verified.
The remaining titles still need their native screen composition;
Settings colours, pose and typography need matched native/browser review.
The integration task owns browser verification and audio transport.

## Integrated browser checkpoint, 23 September

The localhost integration was reloaded and visually checked on the actual
console: Settings source menu, Sound source title/parakeet/checkerboard/Back,
Camera source folder frames/cursor with existing photos, and Health source
upper title/three precaution buttons all rendered. Camera horizontal navigation
and opening an existing photo folder were exercised. Assets can still settle
after the first app frame; launch preparation starts their request earlier but
is not a guarantee of zero fallback frames on a cold load.

The production build through Health and the horizontal window-frame fix passes.
The full JavaScript run had1064 passes,17 skips and one outdated launch-time
assertion; that assertion was corrected and its46-test focused suite passes.
The native window/raster suite passes38 checks, including306 raster comparisons.
A subsequent Notifications composition is wired but awaits browser inspection.
This is an integration checkpoint, not full1:1 acceptance. Remaining toolbar
and service compositions, inline text/layout differences, native reference
comparisons and transition raster performance remain open.
## Settings subpages

Settings retains one native title session from launch through all subpages.
Identified subpages now select background and upper-title animation variants
from their source scene-table state. Internet is state 3, Data state 4,
ordinary Settings state 1 and Parental state 5; DS Profile selects Legacy state
2. Known detail instructions use their source English messages and styles.
Profile, User Name and Birthday retain their source `UserInfo_U_00` upper
composition without an added generic text panel. The source trace and remaining
adaptations are recorded in [Settings scene validation](settings-main-source-validation.md).
Internet uses `NetTop_D_01` and its four source child buttons. Parental Controls
now uses `pare_new_set`'s `MessageOnly_D_00`, complete English introduction
and `Base_D_01` Back/Set footer. The borrowed two-button card, added backdrop
and font-size override have been removed. It does not imply saved restrictions
or a PIN. The following `parental-explain` screen now consumes the exact
`StartChild_D_00` illustration, `st_start_comm` instruction and Back/Next
footer. PIN notice composition is audited separately; no keyboard is added.

Data Management, Nintendo 3DS data, Profile, Connection Settings and Other
Settings mount the original button components in their source layouts. Other
Settings uses the source three-row layout, numbered pages and side arrows;
the four-page ordering is portfolio navigation, not a verified executable
ordering. The source `Appear` arrow clip is visible at frame zero and disappears
at its end. Read-only restriction lists use source buttons in four-row pages.
Details reuse source information panels with existing preferences or explicitly
absent data. Profile also mounts the source user-name/birthday/region summary.
Sound uses the source three-option layout with its saved choice marked. Birthday,
date and time now use the original layouts, digit textures, visible inert arrows
and Cancel/OK footers. The source EU English runtime offsets place date as
DD/MM/YYYY and birthday as DD/MM. Missing values leave digit panes blank;
no cloned text or added backdrop remains. See
[native field validation](settings-native-fields-validation.md).
The exact eight-choice European language layout remains
unverified, so Language shows only its existing read-only value.

The source upper panel has three signed-size picture quadrants. The Settings
adapter converts only those derived panes to absolute sizes and reflected
scales, retaining pane origins and immutable source resources. Fractional lower
panel centres align the scaled quadrant edges to whole pixels. The bounded
Select adapter also accepts the source `BottunUser/AS_Picture_00` share used by
numbered page buttons, only after proving both endpoints absent in that layout.
No shared renderer semantics are changed by these adapters.

Canvas verification covers the main screen, both initial subpages, Data,
Profile, Nintendo 3DS data, Connection Settings, Date & Time, restriction lists,
Other Settings pages 1 and 4, and an empty nickname detail. Touch checks cover
native button centres, gaps and bounded arrows. Final browser integration and
matched native LCD comparison remain separate checks.

## Local service screens, 23 September

`stock-native-services.ts` now composes the native eShop welcome and Nintendo
Zone offline/Info screens. eShop uses its native message balloon, bag animation,
backgrounds and mounted OK button. The eShop reducer owns the source pass clock
(`stock-eshop-welcome.ts`), and `view.data` carries passes rather than
milliseconds. The painter derives the in/balloonIn/wait/out poses and the BG
curtain from that clock. The pair's cache key holds the pose, so settled passes
do not repaint. OK is inert until pass 12. After a decide, the exit plays and
then returns HOME; see the
[welcome lifecycle audit](eshop-welcome-lifecycle-source-audit.md). No
agreement, account or purchase operation exists. Zone uses original English HTML bitmap pixels at
320×212, without stretching, and the source upper banner or 400×220 MPO frame.
Source HTML links share their exact button rectangles with touch navigation.
Both read-only destinations show the bundled no-content page; the search button
does not invoke wireless. The source footer retains Back; unavailable menu/save
controls are omitted. This is an intentional portfolio adaptation.

Paired renders are in SSD `reference/service-ui`. The
[service screen trace](native-service-screen-trace.md) proves the lower HTML
origin from `B_HtmlArea` and the 20 px HUD bar above the 220 px page. It also
shows that the battery pane's 360° rotation is an exact identity. The HUD now
binds the source full-battery and wireless-off icon frames in place of material
defaults. Open gaps: the `U_top` depth scene still needs the executable
projection; the source clock is blank pending a clock repaint key; the
211/212-row edge, footer mode and native timing are untraced. These are not a
claim of 1:1 acceptance.
Date & Time now uses the scene table's `NetType2_D_00` with two full-size
`B_L` children and source Date/Time labels. Connection Settings uses the
table's `Connect_U_00` upper layout with three source empty connection rows,
source instructions and no fabricated network names/security state. The
[scene validation](settings-main-source-validation.md) records the new clock
hit rectangles and the required source asset publication.

Nintendo DS Profile now uses `LsCommonBG_U_00`, `LsMenu_D_00`, two
`B_LsMenu` children and the full-width `LsBase_D_00` Back footer. Source
English captions remain; absent saved nickname/comment/birthday values are
blank. Original layout materials are retained without inventing a favorite
color. Message and Colour are inert source controls; no keyboard or profile
editing has been resumed.

## Browser and Miiverse interiors

Browser Settings uses eight English source option labels in two four-row pages
of source buttons. Its help text is the corresponding source `Option_Header*`
message. Bookmark lists use the source Item/EmptyMessage components; page info
uses source title/address rows and only existing saved metadata. Search and
address views reuse `DialogInput`/`TextField` as read-only presentation adapters.
The original entry flow depends on the omitted software keyboard, so these are
not claimed as exact original standalone input screens. No field submits data.
Delete/reset options display read-only text and do not mutate saved data.

Miiverse's four destinations use its own source dialog base and information pane
above the original toolbar. These explicitly empty local views do not recreate
remote feeds, profiles, or notifications. The main view uses the same empty
panel so selecting a tab has visible context before opening its local view.

Both titles retain source pane typography when a message references an absent
sibling style table. Dialog backgrounds, controls, English labels and selected
states are native resources; their bounded layout, pagination and read-only
content are web composition choices. The canvas verification run includes both
settings pages, empty and specimen bookmarks, entry panels, page info, a reset
preview, and each Miiverse destination, with no renderer diagnostics.

Friend List main/profile now share one title session. Game Notes list/selected
views request a union of their small native packs under one session identity.
This removes the observed generic-screen flash and redundant asset reload on
interior navigation; owner changes still dispose the entire session.

Native NNID and System Update entry screens are now wired through
`stock-native-helpers.ts`, with their exact Back rectangles shared by input.
Their account/update rows are absent: these screens cannot start account or
update operations. NNID uses its source header and generic native notice with
explicit local text because the remote account body is unavailable. Updater
uses its own source title/icon/background and a readonly notice, never an
invented up-to-date status. Returning from these helper applications currently
goes to HOME rather than restoring the Settings parent; that remains a gap.

## Native preparation and recovery

All native-supported views now hold the source black fade endpoint while
resources/fonts prepare. Load, timeout and render errors show explicit browser
recovery; hidden application input is gated until the first native pair is
published. See [the preparation and recovery contract](native-screen-readiness.md).

### Live app navigation check (2026-09-24)

At localhost:3000 in the existing IAB tab3, Health and Safety main and two
successive 3D precaution pages were visually inspected; Right advanced the
source page. HOME suspended Health. Game Notes opened above it, A opened a
note, B returned to the grid and a second B closed the applet to HOME. Friend
List opened and B returned. Notifications showed zero counts; touching the
right end of its full-width Close footer returned HOME. Internet Browser
opened its source search/bookmarks/settings/URL chrome. These are entry and
navigation checks, not a matched native fidelity sign-off for all interiors.

A remaining visible defect was identified: Notes' selected-note upper LCD
always paints the source no-suspended-software message, even when Health is
suspended. Its source snapshot slots and the presentation boundary need a
suspension-aware capture; this remains open. Sound's actual user-song playback
still requires supplied songs, and NNID original body content remains absent.
