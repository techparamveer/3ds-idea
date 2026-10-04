# System and online app feature map

Checkpoint: integration base `f5ed204c`, 1 October 2026. Scope: System Settings, Health and Safety, system helpers, Manual, amiibo Settings, eShop, Nintendo Zone, local Internet Browser and local Miiverse. The coordinator maps shared launch/suspend/close/HOME behavior; this map includes local return paths where they change a screen.

Every acceptance scenario named below remains **fail/unaccepted as a whole**. Tests, source renders, browser inspection and static pixel tiers are separate evidence. Other Settings page 1 and Health Usage initial/8 px-scrolled reach two-LCD static maximum delta 2, but exact input, motion and audio acceptance remain open. "Implemented" means a code path exists; "adaptation" is intentional local behavior; "source gap" means native content or behavior is unestablished. Network, account, PIN, destructive storage and device operations remain inert under [scope](../portfolio-ui-scope.md).

## Settings evidence

- Runtime: `src/os/stock-apps.ts`, `stock-settings-navigation.ts`, `stock-native-settings.ts`, `stock-settings-hud.ts`, `stock-screen-layout.ts`; callers in `app-host.ts`, `system.ts`, `stock-native-helpers.ts`.
- Tests: `tests/stock-apps.test.mjs`, `settings-helper-return.test.mjs`, `settings-other-page-tab.test.mjs`, `settings-language-*.test.mjs`, `settings-data-lists-delivery.test.mjs`, `settings-sound-footer.test.mjs`.
- Evidence: [navigation](../settings-ui-navigation.md), [source subpages](../native-settings-subpages.md), [parental notice](../settings-parental-pin-presentation.md), [helper return](../settings-transfer-update-return-validation.md).

### S-01 - Settings main and exit

**Flow:** Source upper title/version/HUD; lower Internet Settings, Parental Controls, Data Management, Other Settings and full-width NNID. Entry looks unfocused while A retains Internet; directions establish focus. B returns HOME. HOME Manual invokes `manual` separately.

**Status/next:** Implemented from Settings packs. Latest main pair is 0 upper / 20 lower. The 20 are a labelled [source gap](../settings-main-residual-2026-10-04.md) (Other Settings t/n/s endpoints, Management **g**, Internet left chrome). Do not guess a snap. Recapture after a source-backed general edge rule; regress Other page 1 and Health first. Motion/input/audio still fail.

### S-02 - Internet and Connection Settings

**Flow:** Internet exposes Connection Settings, SpotPass, Nintendo DS Connections and Other Information. Connections exposes Connection 1-3 and New Connection. Read-only leaves return to the selected immediate parent.

**Status/next:** Menus and empty connection presentation are source-backed; setup, SpotPass, DS and information bodies are local adapters. No network runs. Capture Internet and Connections before correction: `settings-internet-connections-roundtrip`.

### S-03 - Parental Controls boundary

**Flow:** Intro Back/Set -> explanation Back/Next -> PIN notice OK. OK/B dismisses to the explanation. Restriction rows exist in the model but stay unreachable because PIN/account operations are excluded.

**Status/next:** Notice/layout/text are source-backed; PIN dismissal and retained explanation upper LCD are adaptations. Capture the native notice route before changes: `settings-parental-pin-boundary`.

### S-04 - Data Management

**Flow:** Nintendo 3DS, DSiWare, StreetPass Management and Reset blocked users. Nintendo 3DS contains Software, Extra Data, Add-on Content and Save Data Backup. Software/Extra Data use source accessible-empty SD lists; all leaves are read-only and B restores their row.

**Status/next:** Software/Extra Data composition is native; other bodies are informational adapters. Free blocks, wait icon and entry motion remain gaps. Capture then correct one list: `settings-data-software-empty`.

### S-05 - Other page 1: Profile, Date & Time, Touch Screen

**Flow:** Profile -> User Name, Date of Birth, Region Settings, Nintendo DS Profile. Date & Time -> Today's Date, Current Time. Touch Screen is a read-only calibration preview. Values never write settings; B rebuilds page 1 in its source unfocused pose.

**Status/next:** Profile, DS Profile, date/time/birthday controls and return geometry use source layouts; Region, nickname and Touch behavior are local adapters. Page 1 only has a static 0/0 tier match. Next: exact replay `settings-other-page1-home-a-touch`.

### S-06 - Other page 2: 3D Calibration, Sound, Mic Test

**Flow:** Sound shows source Surround/Stereo/Mono and Cancel/OK; Cancel/B returns, while modes and OK are inert. 3D Calibration and Mic Test show read-only information and Back.

**Status/next:** Sound settled composition is source-backed; calibration/mic bodies are generic previews and perform no hardware operation. Capture each leaf before replacement; first `settings-sound-cancel-return`.

### S-07 - Other page 3: Outer Cameras, Circle Pad, System Transfer

**Flow:** Cameras and Circle Pad are read-only details. Transfer launches retained `system-transfer`; 3DS/DSi choices open local details, B returns to helper, then B restores page 3 and selection. The Circle Pad row does not invoke `extrapad`.

**Status/next:** Transfer chrome/choices/return are source-backed; direct child launch is an adaptation and calibration bodies are generic. Capture `settings-transfer-choice-back`.

### S-08 - Other page 4: Language, System Update, Format

**Flow:** Language renders eight EUR rows in a four-row viewport with arrow/drag motion; rows/OK never change locale. Update launches source Cancel/OK: Cancel returns, OK is inert. Format is an informational leaf.

**Status/next:** Language list and Update entry are source-backed. D-pad focus, held-arrow/groove behavior, confirmations and sequencing remain open; Format is an adaptation. Capture `settings-language-scroll-drag`, then implement only source-proved behavior.

## Health and helper evidence

- Runtime: `src/os/stock-native-health.ts`, `stock-health-article.ts`, `stock-health-scroll.ts`, `stock-native-helpers.ts`, `stock-native-amiibo.ts`, `stock-native-selectors.ts`.
- Tests: `tests/health-article.test.mjs`, `health-scroll.test.mjs`, `amiibo-opening.test.mjs`, `stock-manual-application.test.mjs`, `settings-helper-return.test.mjs`, `stock-screen-layout.test.mjs`.
- Evidence: [Health touch/scroll](../health-touch-scroll-source-audit.md), [helper presentation](../native-helper-presentation.md), [amiibo opening](../native-amiibo-opening.md).

### G-01 - Health entry menu

**Flow:** 3D Display, General and Usage Precautions; entry looks unfocused while A retains 3D, directions focus, root B returns HOME.

**Status/next:** Source layouts/messages and inactive pose are implemented. General and complete input cadence lack matched evidence. Capture `health-entry-home-a-down` at identical phase; do not tune the moving upper background from an unphased frame.

### G-02 - Health articles and Back

**Flow:** Three source articles support Up/Down, drag/inertia, scrollbar thumb/groove and full-width Back. Left/Right/A are inert; Back discards scroll and restores the menu.

**Status/next:** Source-replayed reducer/glyph composition is implemented; browser catch-up/cancellation are adaptations and scroll cues are absent. Usage top/8 px pass only static tier. Capture `health-general-held-down-and-thumb-drag` first.

### G-03 - amiibo Settings

**Flow:** Internal applet opening shows Register Owner and Nickname, Delete Game Data, Reset amiibo, Update and Close. Only Close works; NFC scan, registration, update and deletion remain inert.

**Status/next:** English opening/two-texture materials are source-backed, but no visible in-scope caller exists and no matched native pair covers font/motion. Establish a real caller and capture `amiibo-opening-read-only`; never add a HOME tile.

### G-04 - Manual

**Flow:** Settings HOME Manual opens source Contents with 32 indexed pages/categories; only Important Information page 1 is implemented. A/touch opens, B returns, X/Close closes. Language, Enlarge, directions, later pages and scrolling are inert. No-title Portfolio Guide supplies three authored local pages in source chrome.

Camera at `0e59c1a0` also opens its source English index from the middle
suspended HOME footer. Its 15-page/four-category metadata and SMDH header icon
are delivered, but only index/Close works: Camera page content is not delivered.
Close retains the suspended Camera owner, including explicit resource-failure
recovery. [Source and comparison limits](../home-camera-manual-footer-2026-10-03.md).

**Status/next:** Settings chrome/text are source-backed with documented capture-fitted placement; Portfolio Guide body is an adaptation. Page 1 materially differs and lacks scrollbar behavior. Source-prove scrollbar before `settings-manual-page0`.

### G-05 - Settings-launched helpers

**Flow:** NNID is Back-only source chrome plus an authored unavailable notice; Transfer has two read-only details; Update has source Cancel/OK with inert OK. Back removes the child and restores exact Settings page/selection; HOME may suspend/resume it first.

**Status/next:** Transfer/Update composition and returns are tested. NNID unsigned-in body and native cross-title arguments are gaps. Capture `settings-nnid-transfer-update-return`; keep the authored NNID label.

### G-06 - Other supported internal helpers

**Flow:** Circle Pad Pro (`extrapad`) has Cancel/Next -> read-only information -> Back. Mii selector projects a saved name or empty state; Back closes and confirmation is inert. Neither has a HOME entry.

**Status/next:** Source chrome exists, but neither has a production caller. Establish one before `circle-pad-info-back` or `mii-selector-empty-back`.

### G-07 - Delegated media/personal helpers

**Boundary:** `camera-applet`, `photo-selector`, `sound-selector` and `memo` are internal/no-HOME-entry registry titles. Selector chrome exists, but Camera/Sound/Notes ownership belongs to the media/personal map; this map claims neither caller routes nor next tasks.

### G-08 - Error applet

**Flow/status:** `error` has generic message + OK -> complete state, but no `nativeStockView` mapping or source-native composition. It is an internal source gap, not an accepted Nintendo dialog. Require a named in-scope caller/native capture before `error-ok-complete`.

## Online and local-web evidence

- Runtime: `src/os/stock-native-services.ts`, `stock-eshop-welcome.ts`, `stock-native-web.ts`, `stock-browser-navigation.ts`, `stock-apps.ts`.
- Tests: `tests/eshop-welcome-lifecycle.test.mjs`, `native-services-render.test.mjs`, `stock-apps.test.mjs`, `stock-screen-layout.test.mjs`, `zone-banner-playback.test.mjs`.
- Evidence: [eShop lifecycle](../eshop-welcome-lifecycle-source-audit.md), [Zone local pages](../native-zone-local-pages.md), [Browser/Miiverse interiors](../native-browser-miiverse-interiors.md), [Miiverse source gap](../miiverse-empty-interior-source-gap.md).

### O-01 - Nintendo eShop welcome and return

**Flow:** Source entrance/balloon/wait at 30 Hz; OK activates at pass 12, plays source out/curtain, returns HOME and resets. B returns HOME; resume restarts welcome. Store/account/purchase operations do not exist.

**Status/next:** Welcome/HUD/exit are source-backed, but the genuine direct native capture shows a different NNID-information state. First obtain a native HOME-launched welcome pair: `eshop-welcome-home-a-ok`.

### O-02 - eShop service helper (`mint`)

**Flow/status:** Registered internal applet with one Information row, no native presentation dispatch and no established caller. It is a source/route gap, not another eShop screen. Capture a caller before `eshop-mint-information-back`.

### O-03 - Nintendo Zone offline and Info

**Flow:** Main shows bundled offline lower bitmap with Search and What is Nintendo Zone, source upper EU banner and HUD. Detail shows bundled no-content/info imagery; B returns main then HOME. No `nzv:` routing or remote service runs.

**Status/next:** Source bitmaps/chrome are delivered, but `drawZone` ignores `data.field`; Search and Information collapse to one detail. Capture both routes, then split only source-established outcomes: `zone-offline-search-info-back`.

### O-04 - Internet Browser start menu

**Flow:** Search, Bookmarks, Add, Settings, Page Info and Enter URL. Search/URL show read-only input chrome; Add cannot write; Page Info shows saved URL. B returns to selected start item, then closes to caller.

**Status/next:** Source chrome/local messages are implemented; input-dialog assembly is an adaptation because Software Keyboard is excluded. Obtain native start-menu pair `browser-start-menu-local` before corrections.

### O-05 - Browser Settings and saved entries

**Flow:** Settings exposes Text Wrap, Search Engine, Delete Cookies, Delete History, Network Information, Proxy, Version and Clear Save Data; details are inert and Back restores rows. Bookmarks show saved title/URL. History renderer/state exists but has no start-menu route.

**Status/next:** Read-only paths are tested; no data changes or page loads. Missing History entry is a functional gap. Capture native menu before adding a route: `browser-settings-bookmark-roundtrip`.

### O-06 - Local Miiverse

**Flow:** Communities, Activity Feed, My Menu and Notifications select the source toolbar; local details intentionally stay empty. Back restores main; root Back closes. No account/feed/post operation runs.

**Status/next:** Title, BG, toolbar and Back are source components. Interior, toolbar mount/selection and suppressed labels are adaptations; no source-supported offline body exists. First capture `miiverse-local-toolbar-back`; keep blank pending evidence.

### O-07 - Post to Miiverse

**Flow/status:** `miiverse-post` is registered with an Information row but lacks native presentation and a production caller. It is an internal source/route gap; infer neither composer nor keyboard. Capture a caller before `miiverse-post-information-close`.

## Registry boundary

- HOME apps here: `system-settings`, `health-safety`, `eshop`, `nintendo-zone`. Browser and Miiverse are toolbar applets, not tiles.
- Supported internal/no-HOME-entry titles: `manual`, `amiibo-settings`, `extrapad`, `mii-selector`, `nnid-settings`, `system-transfer`, `system-updater`.
- Explicit source/route gaps: `error`, `mint`, `miiverse-post`.
- Delegated internal titles: `camera-applet`, `photo-selector`, `sound-selector`, `memo`. They remain registered but belong to the media/personal map. No internal helper gets an invented HOME entry.
