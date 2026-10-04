# Media, social and portfolio feature map

Checkpoint: `dda25e9e`, 2 October 2026. Scope is EUR 10.7.0-32E on the original
2012 3DS XL, English locale. This inventories reachable source state, not visual
acceptance. The private matrix has no whole-scenario pass: tests, source renders
and browser inspection do not close pixels, input, motion or native-cue timing.
Camera is read-only and Sound may play user-supplied songs. Capture, editing,
recording, import, remote services, accounts and text entry stay out.

Stable IDs use `M-*` for Camera/Sound, `C-*` for Notes/Friends/Notifications,
and `P-*` for the eight portfolio apps. App open/close, HOME suspension, lid and
power ownership are listed in the coordinator's lifecycle map; dependencies on
those owners are called out here without duplicating their route inventory.
## Camera

Code: `src/os/stock-apps.ts`, `camera-browse.ts`, `stock-native-camera.ts`,
`stock-screen-layout.ts`, `portfolio-media.ts`, and scene-owned
`camera-shoot-background.ts`. Tests: `stock-apps.test.mjs`,
`camera-browse.test.mjs`, `stock-native-camera.test.mjs`,
`camera-welcome-p1-1401.test.mjs`, and the Camera replay,
publication and generation tests.
| ID | Reachable screen or route | Implemented behavior | Gap or adaptation |
| --- | --- | --- | --- |
| M-CAM-01 | `camera/guide`, pages 1-5 | Application cold entry; Next, Back after page 1, and final OK; source dialogs, finder, capacity, SD icon and guide art | Seen-state is not persisted, so every new application instance repeats Welcome; page-1 remaining **0 / 1,401** is a labelled [source gap](../camera-welcome-p1-1401-2026-10-04.md) (top Disable pose, Grid1 registration, counter glyph); guide motion/audio stay unverified |
| M-CAM-02 | `camera/main` folder grid | `View Photos/Videos` combines all five unique portfolio images; individual source-content folders remain reachable; 3-column physical/touch navigation | Portfolio folders, labels and counts are intentional content adaptations; Slideshow, Shoot, Settings and zoom chrome are visual and inert |
| M-CAM-03 | `camera/gallery` | Date group when supplied, photo cells, 3-column selection, padded final page, replayed horizontal strip, slider, held-key cancellation and direct touch targets | Date cell is display-only; slider Rate mapping is fitted; native paging, Parakeet phase and dynamic scene replacement remain unverified |
| M-CAM-04 | `camera/photo` | Selected photo on upper LCD; physical Left/Right wrap; B/footer Back restore the activated photo's gallery row and settled page (`38bab8b7`, `dda25e9e`), including a touch on a non-focused cell; both entry paths and reopen/footer Back browser-inspected | Native Back behavior/timing remains unmatched. Photo touch sides are inert; portfolio JPEGs have no native MPO equivalence |
| M-CAM-05 | empty media destination | After Welcome, source no-data presentation has no selectable rows | No capture/import escape hatch is permitted; application Back remains governed by the host route |
| M-CAM-06 | internal `camera-applet` alias | Starts at folder grid and shares main/gallery/photo navigation | No HOME entry and no Welcome owner; not a second Camera state system |

Evidence: Welcome page 1 has a source-backed production pair but remains a
whole-session failure. The reused `0d7bfea` pair is **0 / 1,401** over
2/255; shoot underlay / `P_Shoot_D` / modal black-alpha128 already bind,
and the leftover is a labelled [source gap](../camera-welcome-p1-1401-2026-10-04.md).
Populated gallery comparisons use different media and cannot establish photo fidelity.
The 28 September production QA confirms only the source 2D cube placement
(0.971 foreground IoU), not whole-screen parity.
The [2 October route replay](../completion-routes-2026-10-02.md) adds captured
keyboard and touch selection-loss defects and separately records their fixes.
It uses portfolio photos, not the private native HNI fixture, and is not a
native acceptance pair.

Dependency: paired native layouts must be ready before publication; the scene
owns the shoot background and the app reducer owns only semantic browse state.
Portfolio image URLs come from `apps.ts`; no browser or device camera access is
allowed.

First task: coordinator captures identical `View Photos/Videos` fixture content,
selection and page in native and production, then records a reasoned content-only
mask before any renderer correction. Acceptance scenario:
`camera-readonly-view-photos-page1` (Welcome -> combined folder -> page 1 ->
photo -> physical Right -> B -> gallery), with paging motion and inert Shoot/
zoom checks.

## Sound

Code: `src/os/stock-apps.ts`, `stock-native-sound.ts`, `stock-sound-record.ts`,
`stock-screen-layout.ts`, `portfolio-media.ts`, `portfolio-music.ts`, and the
scene-owned Sound room. Tests: `stock-apps.test.mjs`, `portfolio-music.test.mjs`,
`sound-entry-native.test.mjs`, `sound-room.test.mjs`,
`sound-record-background.test.mjs`, and transport/scheduler tests.
| ID | Reachable screen or route | Implemented behavior | Gap or adaptation |
| --- | --- | --- | --- |
| M-SND-01 | empty-track `sound/guide`, pages 1-3 | Next, Back after page 1 and final OK; source dialog, messages, page counter and page-3 volume art | Guide repeats because no firmware-backed first-run flag exists; entry/exit motion, bird scheduling and cues are open |
| M-SND-02 | empty `sound/main` | Source Record & Edit Sounds room, row, slider and controls; HudTime separator follows seconds parity (`:` odd / space even) with a labelled 12/10 fixed-pitch adaptation (`605f39fe`) | Production manifest intentionally has zero tracks; Record, StreetPass, Add, Settings, Open and root Back are inert; clock ROI 0 over 2/255 vs `22:31` (`983ef5ed`); whole empty-entry still 6,404 / 16,021 |
| M-SND-03 | supplied-track `sound/main` | Song rows show title/artist; selection opens playback and emits ordered load then play | Requires user-supplied track manifest; supplied-song entry currently has tests but no production content or native comparison |
| M-SND-04 | `sound/playback` transport | Play/pause, previous/next, bounded seek, progress/duration, and one mode control cycling no-loop/folder/single/random | Effect buttons, filters, pull cord, speed/pitch, percussion and visualizer behavior are inert or absent by scope; direct repeat/shuffle reducer actions have no separate visible route |
| M-SND-05 | playback error dialog | Source Could-not-play dialog blocks transport; A/OK or B dismisses it without changing track | Error timing/audio and recovery against native are unverified |
| M-SND-06 | suspend/sleep/close and resume | Owner-scoped player pauses; live instance retains position; user must explicitly resume | Module saves `{}`: reload/new instance loses selection and position; automatic resume is intentionally absent |

Evidence: after the HudTime recapture (`983ef5ed`) first-run is 6,094 / 6,267
and empty-entry is 6,404 / 16,021; clock ROI is 0 over 2/255 on both stills.
Source checks isolate unresolved cursor-icon overlap, footer blending,
bird timing and the capture-fitted Span material/placement. No supplied-song
browser/native pair exists.

Dependency: `portfolioMedia.tracks` must remain empty until the user supplies
songs; playback uses one foreground audio owner and console mute/volume. All 3DS
audio stays muted during verification, so audio acceptance remains open.

First task: after a user track is supplied, add only its provenance-backed
manifest record and capture the already-implemented transport before extending
the UI. Acceptance scenarios: `sound-empty-first-run-transport` for current
empty entry, and `sound-supplied-song-playback` for select -> play -> seek ->
mode -> next -> HOME pause -> explicit resume -> error recovery.

## Game Notes

Code: `src/os/stock-apps.ts`, `stock-native-personal-tools.ts`,
`notes-*`, `stock-screen-layout.ts`, and suspended-capture ownership in the
screen composer. Tests: `stock-apps.test.mjs`, `notes-capture-switch.test.mjs`,
`notes-suspended-capture.test.mjs`, `notes-intro-session.test.mjs`,
`notes-panel-publication.test.mjs`, and `notes-home-owner-exit.test.mjs`.
| ID | Reachable screen or route | Implemented behavior | Gap or adaptation |
| --- | --- | --- | --- |
| C-NOT-01 | `game-notes/main` | Source 4x4 grid, bounded D-pad/touch selection, owner-clock intro/title panel and full-width Close | Initial title cadence is provisionally 60 Hz; only browser raw LCD evidence exists |
| C-NOT-02 | `game-notes/drawing` | Displays immutable saved legacy strokes; B returns to the selected grid slot | Pen colours, eraser, clear, export, save and canvas touch are visible/inert; stroke widths are portfolio display choices, not native pen behavior |
| C-NOT-03 | suspended capture in drawing | Last complete paired LCD capture; Switch cycles Double -> Up -> Down after the 0-25 frame gate | Missing capture pixels are never fabricated; switch timing, wave cue and native transition remain unmatched |
| C-NOT-04 | no suspended application | Source no-suspended message and disabled Switch pose | Combination of source panes is a labelled composition adaptation |
| C-NOT-05 | internal `memo` alias | Shares 4x4 navigation and immutable drawing state | No HOME entry; it does not select the dedicated Game Notes native painter, so its presentation is not acceptance-ready |

Persistence: Notes reads `shared.notes` but never creates, edits or saves strokes;
module save output is empty. Capture and switch mode are owner/session state.

First task: no visual correction until the coordinator captures the same native
route. Acceptance scenario: `notes-grid-editor-switch` (suspended application ->
HOME -> Notes -> grid slot -> Double/Up/Down -> B -> same slot), plus a no-caller
variant. Required evidence includes owner identity, raw LCD pair, input history,
switch frames and the still-open cue.

## Friend List

Code: `src/os/stock-apps.ts`, `stock-native-personal-tools.ts`, `app-host.ts`,
and persistence. Tests: Friend profile coverage in `stock-apps.test.mjs`, applet
stacking in `app-runtime.test.mjs`, and shared/save migration tests.
| ID | Reachable screen or route | Implemented behavior | Gap or adaptation |
| --- | --- | --- | --- |
| C-FRD-01 | local `friends/main`, empty friend list | Source offline own-card composition; profile row opens locally; settings/register chrome is inert | Nickname is local saved Settings data; no Mii, friend code, favourite title, network or account data is invented |
| C-FRD-02 | `friends/profile` | Read-only nickname/status card; B returns to main; saved `message` and `miiId` are retained unchanged | Edit/Favourite/Message controls are visual only; native card-turn/task sequencing is unverified |
| C-FRD-03 | populated local friend row -> `friends/friend` | Reducer can enter a saved friend ID and B can return | No native painter, friend data projection, readable detail, or dedicated tests; this is a hard implementation gap, not a finished screen |
| C-FRD-04 | unavailable operations/errors | Register, edit, account and network actions cannot launch; no Friend-specific error dialog is implemented | General library `error` applet stacking exists elsewhere; do not invent Friend errors without a captured native route |

First task: capture the native offline own-card entry/profile/Back route before
changing the source composition. Acceptance scenario: `friend-list-local-profile-return`.
A separate captured defect is required before
building any `friends/friend` detail; otherwise keep saved friend rows out of the
native-ready claim.

## Notifications

Code: `src/os/stock-apps.ts`, `stock-native-personal-tools.ts`, persistence,
and delivered Notifications/receive-lamp/slidebar packs. Tests:
`stock-apps.test.mjs`, `notifications-source-ownership.test.mjs`, and
`app-persistence.test.mjs`.
| ID | Reachable screen or route | Implemented behavior | Gap or adaptation |
| --- | --- | --- | --- |
| C-NTF-01 | populated `notifications/main` | Nine source-profile titles in timestamp order, eight unread flags, neutral entry, four full rows plus clipped fifth, decoded information badges and source blue lamps | Default source rows are deliberately disabled because bodies are unverified; opening does not mark read |
| C-NTF-02 | directional list movement | Activates focus, advances the selected row and windows later rows into view | Scrollbar thumb is hardcoded at `[0,55]`; native count rule, motion and lamp pulse are unverified |
| C-NTF-03 | empty `notifications/main` | Explicit saved empty array remains empty and shows the no-notifications state | Earlier empty-state assumption is superseded for new profiles, which seed the nine-row fixture |
| C-NTF-04 | custom saved row -> `notifications/notification` | Non-source custom rows can open stored message text and B returns | Generic fallback only: no native detail painter, title/body provenance, read transition or detail scroll; not acceptance-ready |

Persistence preserves explicit empty/custom arrays and never ships `news.db`.
Default and custom rows remain read-only.

Evidence: matrix v99 compares the source-profile list at 6,239 upper / 3,876
lower pixels over 2/255. Badge and three unread-marker crops each have zero
pixels above 2/255, but the full scenario fails. Remaining regions include the
fixed scrollbar/footer and upper HUD; input cadence, pulse/motion and audio are
open.

First task: trace the final slidebar thumb translation/effective item count and
capture selection movement before replacing the hardcoded pose. Acceptance scenario:
`notifications-list-scroll-and-readonly-detail` (neutral entry -> move
through row 6 -> verify thumb/window -> source-row Open remains inert -> custom
row detail/Back adaptation), with default read flags unchanged.

## Eight portfolio apps

Shared code: `src/os/apps.ts`, `portfolio-app.ts`, `portfolio-screens.ts`,
`system.ts`, `app-host.ts`, and persistence. Tests: `portfolio.test.mjs`,
`app-runtime.test.mjs`, gesture/navigation tests, and `portfolio-os-validation.md`.
All interiors and outbound links are user-scoped adaptations, not Nintendo UI.
| ID | HOME title | Entry routes | Detail actions and known gaps |
| --- | --- | --- | --- |
| P-WORK | `work` | `alora`, `microsoft`, `myucat`, `hackuk-work` | URLs for first three; `hackuk-work` launches P-HACKUK. Alora is intentionally sparse |
| P-PROJ | `projects` | `ankicram`, `cognilink`, `renu` | Each has an explicit Visit URL; Renu has 2 pages and 1 image |
| P-HOB | `hobbies` | `buildings` | 2 pages, 3 bounded photos, explicit Gumroad Visit; images also seed Camera |
| P-LIFE | `life` | `keele`, `hack-keele`, `rws`, `school` | One-page local details; A is Done and returns to entries; no external effect |
| P-HACKUK | `hackuk` | `mission`, `leafhacks`, `campfire`, `counterspell` | Explicit HackUK links; mission has 2 pages and an image, counterspell reuses that image |
| P-NVIDIA | `nvidia` | `renu` | Same Renu content identity as P-PROJ; explicit portfolio URL |
| P-ABOUT | `about` | `intro`, `stack` | Intro has 2 pages and Visit; toolkit is local Done |
| P-CONTACT | `contact` | `email`, `book`, `github`, `instagram`, `youtube`, `twitter`, `tiktok` | Explicit mail/web link effects only after Visit; no form, keyboard or account flow |

Shared routes: bounded Up/Down selects an entry; A opens `detail`; detail
Up/Down changes page and Left/Right changes photo; A emits `launch`, explicit
`link`, or Done; B resets page/photo and returns to entries, then HOME. HOME
suspension retains live item/detail/page/photo, but every module saves `{}`;
reload or a new instance starts at entry 0. HOME layout persistence is a separate
system owner. Reused Renu and HackUK image identities intentionally deduplicate
Camera media.

First tasks: run one complete route per app at iPad Sidecar dimensions, then repair
only captured overflow, focus or unreachable-content defects. Named scenarios are
`portfolio-work-cross-launch`, `portfolio-projects-pages`,
`portfolio-hobbies-gallery`, `portfolio-life-done`, `portfolio-hackuk-pages`,
`portfolio-nvidia-renu`, `portfolio-about-local-and-visit`, and
`portfolio-contact-explicit-links`. Each must cover entry/detail return,
longest text, last entry, outbound intent, HOME suspend/resume and fresh-instance
reset. Native comparison applies only to surrounding HOME/launch/lifecycle
chrome; portfolio interior differences stay explicitly labelled adaptations.

## Cross-app dependencies

### Internal media selectors

`M-SEL-01` Photo selector and `M-SEL-02` Sound selector are registered internal
helpers, never HOME tiles. `stock-native-selectors.ts` selects delivered picker
packs for `main` and `detail`; existing saved item names/IDs are projected without
loading media or returning a chosen result. Only Back is a native touch target;
confirmation, text entry, capture, recording and import are inert. Existing
`stock-apps.test.mjs` tests cover empty/read-only navigation and saved identity.

The source chrome is delivered, but the reused/stretched dialog bodies, custom
text placement, hidden sample waveform and photo prompt repaint are explicit
composition adaptations. No in-scope production caller or matched native route
is established here. Camera owns Photo selector; Sound owns Sound selector.
Their next task is a caller/evidence ticket, not an invented HOME entry or media
operation. Named future scenarios are `photo-selector-readonly-back` and
`sound-selector-readonly-back`, only after a real caller is identified.

- All groups reuse `AppDescriptor`, `AppView`, `AppModule` and the single app
  host. Physical, keyboard and touch input must continue through that owner.
- Stock paired-LCD publication, generation guards, readiness, bounded caches and
  disposal remain mandatory. An unsupported selected resource is a visible
  failure, never permission for reconstructed native fallback.
- Camera and portfolio apps share static portfolio images; Sound shares console
  mute/volume but owns the only allowed stock-app playback effect.
- Notes depends on a complete suspended-application LCD pair. Friends and
  Notifications depend only on local persisted data; they never request network
  or account capabilities.
- Coordinator owns the first captured defect, integration, native/browser replay
  and matrix update for every named scenario above. No source-only correction is
  authorized merely because a route is incomplete.
