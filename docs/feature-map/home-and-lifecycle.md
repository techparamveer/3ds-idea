# HOME and cross-app lifecycle feature map

Checkpoint: `5232b9c5` (2 October 2026), with older per-feature evidence retained. This is an implementation and
verification backlog, not an acceptance record. Scope comes from
[portfolio-ui-scope](../portfolio-ui-scope.md); evidence authority remains the
[progress record](../progress-2026-09-24.md) and the matched-input
[verification loop](../architecture/verification.md).

Every strict whole scenario is still unaccepted. Unit tests prove contracts,
not pixels, input cadence, motion, or audio. All future visible verification is
coordinator-only on Sidecar and all 3DS audio remains muted. "Adaptation" below
means an intentional browser/portfolio difference; "source gap" means the
pinned dump has not yet established the required native producer or content.
Software Keyboard, network/account/PIN operations, capture/recording/import,
and the six excluded stock titles are not backlog.

## First bounded implementation slices

The [design-to-ship queue](design-to-ship.md#work-first) supersedes the earlier
H-12-first ordering: L-06/L-07 close/switch and modal button ownership first,
then L-01 power-on, then HOME controls/interactions. H-12 remains an explicit
missing state but is gated on native return evidence. HOME Settings polish is
deferred at the user's request; preserve all already-designed surfaces.

## HOME

### H-01 - HOME two-LCD composition and wallpaper
**Code/tests/evidence:** [screens.ts](../../src/os/screens.ts), [home-presentation.ts](../../src/os/home-presentation.ts), [home-banner-host.ts](../../src/os/home-banner-host.ts), [host tests](../../tests/home-banner-host.test.mjs), [background owner note](../home-background-host-2026-10-01.md).
**Now/gap/dependency:** Native packs paint the white HOME chrome, grid, footer, hosted wallpaper, and selected banners. The background is now System-generation-owned and advances on eligible scene passes. [Live evidence](../home-live-verification-2026-10-02.md) verifies same-frame paint stability, selection-independent epoch and visible frame210 ->240 progression; retained-native margins match within1/255, while the whole pair fails4940/19125. Exact native epoch, HUD/battery/clock phase, non-white themes, and suspend/restart event mapping remain unproved. Depends on firmware presentation assets and the shared 60 Hz HOME clock.
**Next/acceptance:** Capture Notifications selected at two known host background frames before and after a pause/resume, then replay the same sequence natively. Accept only when raw 400x240/320x240 pairs, phase progression, and repeat-at-same-frame checks pass; audio remains separately open.

### H-02 - Installed grid, empty slots, and scoped population
**Code/tests/evidence:** [app-registry.ts](../../src/os/app-registry.ts), [home-layout.ts](../../src/os/home-layout.ts), [state.ts](../../src/os/state.ts), [runtime tests](../../tests/app-runtime.test.mjs), [scope](../portfolio-ui-scope.md).
**Now/gap/dependency:** Root capacity is 300 and folders 60, but only in-scope stock titles plus eight portfolio apps are installed. SMDH art is used when delivered; portfolio tiles/content are adaptations. Excluded native titles must not be added merely to match a screenshot.
**Next/acceptance:** From the clean saved layout, traverse every occupied and adjacent empty root slot at each visible edge. Compare the same scoped native arrangement or record population masks as adaptations; require stable identities through reload and no excluded launch routes.

### H-03 - D-pad navigation and grid/toolbar focus transfer
**Code/tests/evidence:** [home-scroll-consumer.ts](../../src/os/home-scroll-consumer.ts), [home-controls.ts](../../src/os/home-controls.ts), [control tests](../../tests/home-controls.test.mjs), [accepted toolbar touch tests](../../tests/home-accepted-toolbar-touch.test.mjs), [runtime note](../home-controls-runtime.md).
**Now/gap/dependency:** Source masks, 20/5 repeats, diagonal rejection, toolbar focus tables, departed cursor effects, and mode-3 pending replay are implemented. Native HID sample alignment and real key-hold timing are not accepted. Depends on the input sampler/producer and lower-pass ordering.
**Next/acceptance:** Replay root Right-hold through one viewport edge, Up into toolbar, Left/Right across all eight focus positions, then Down to the remembered column. Require identical selections/focus per sampled update and matched settled/moving LCD pairs.

### H-04 - Density, paging, and viewport motion
**Code/tests/evidence:** [home-navigation.ts](../../src/os/home-navigation.ts), [home-density-controls.ts](../../src/os/home-density-controls.ts), [home-navigation-motion tests](../../tests/home-navigation-motion.test.mjs), [density tests](../../tests/home-density-controls.test.mjs), [navigation note](../home-navigation-runtime.md).
**Now/gap/dependency:** Six native density indices, root/folder geometry, 15-update density interpolation, 16-update page motion, arrow eligibility, and independent histories exist. Selection-status 0, mode 14, and some overlay/motion branches are explicit unsupported subsets.
**Next/acceptance:** At root and inside one folder, press both density controls to each boundary, page left/right, interrupt one density change, and reload. Compare every motion endpoint and retained viewport; unsupported native branches stay source-gap rather than guessed.

### H-05 - Tile touch, press, selection, and activation
**Code/tests/evidence:** [home-tile-touch.ts](../../src/os/home-tile-touch.ts), [home-tile-widget.ts](../../src/os/home-tile-widget.ts), [tile system tests](../../tests/home-tile-touch-system.test.mjs), [integration note](../home-tile-touch-integration.md).
**Now/gap/dependency:** One stylus stream, native widget states, Select/Decide clips, 20/21-poll long-press threshold, gap rejection, one-tap select, and second-tap activation share the normal HOME path. Exact physical touch sampling versus browser pointer timestamps remains open.
**Next/acceptance:** On an unselected occupied tile perform down/up, then a second down/up; repeat on a vacant slot and cancel outside the LCD. Require the same callback/order, visible poses, launch/create result, and paired raw frames in native and browser.

### H-06 - Long-press pickup, reorder, folder hover, and edge scroll
**Code/tests/evidence:** [home-tile-pickup.ts](../../src/os/home-tile-pickup.ts), [home-gestures.ts](../../src/os/home-gestures.ts), [home-layout.ts](../../src/os/home-layout.ts), [gesture tests](../../tests/home-gestures.test.mjs), [pickup contract](../home-pickup-entry-contract.md).
**Now/gap/dependency:** The callback-3 stationary mode-14 pickup and atomic swaps are source-backed. Movement, drop, folder hover, drag-out, and edge timings are working browser adaptations explicitly marked authored; folder-icon/toolbar pickup remains untraced.
**Next/acceptance:** Hold one portfolio tile, drag across a vacant slot, into/out of a folder, and against each edge, including cancel. Record callback frame and authored deadlines, compare visible ghost/source blanking and final layout, and classify each differing continuation as adaptation or source-gap.

### H-07 - Folder create, enter, close, and retained histories
**Code/tests/evidence:** [state.ts](../../src/os/state.ts), [home-folder-close-system.ts](../../src/os/home-folder-close-system.ts), [folder close tests](../../tests/home-folder-close-system.test.mjs), [folder input tests](../../tests/home-folder-input.test.mjs), [system contract](../home-folder-close-system.md).
**Now/gap/dependency:** Vacant-slot creation, 1..99 fullwidth naming, independent child histories, native Back target, deferred close/restoration, cursor resumption, and offscreen root repair are implemented. New folder default naming is supported without opening Software Keyboard.
**Next/acceptance:** Create/open a folder, change child density/viewport, close via B and touch, reopen, then close with the root selection offscreen. Match C+18/C+23-or-28 boundaries, selection/footer visibility, and both LCDs.

### H-08 - Folder settings, rename exclusion, and delete confirmation
**Code/tests/evidence:** [state.ts](../../src/os/state.ts), [screens.ts](../../src/os/screens.ts), [menu tests](../../tests/menu.test.mjs), [folder naming note](../folder-naming-runtime.md).
**Now/gap/dependency:** Settings and delete-confirm panels exist; nonempty deletion is refused and empty deletion clears identity/history. Rename is intentionally inert because Software Keyboard is excluded, but the visible Rename choice is an authored UI ambiguity rather than accepted native behavior.
**Next/acceptance:** Open settings for empty and nonempty folders, activate Rename, cancel, and attempt Delete/confirm. Verify no keyboard/editor state appears, no content is lost, and the visible disabled/adaptation treatment is compared to native before publication.

### H-09 - Toolbar groups and five system applets
**Code/tests/evidence:** [state.ts](../../src/os/state.ts), [system.ts](../../src/os/system.ts), [home-cursor-presentation.ts](../../src/os/home-cursor-presentation.ts), [toolbar touch tests](../../tests/home-accepted-toolbar-touch.test.mjs), [footer evidence](../home-applet-footer-2026-10-01.md).
**Now/gap/dependency:** Settings/Home Design, Notes, Friends, Notifications, Browser, Miiverse, and two density groups have native focus geometry. Focuses 1..5 invoke system applets and use one full-width Open footer; applet interiors may be source-gap/adaptations per their own maps.
**Next/acceptance:** From the same grid selection, traverse and open all five applets via D-pad+A and footer touch, close each, and confirm the grid selection never launches instead. Compare toolbar cursor, label, banner, footer, and transition frames.

### H-10 - HOME footer actions and Manual route
**Code/tests/evidence:** [home-presentation.ts](../../src/os/home-presentation.ts), [screens.ts](../../src/os/screens.ts), [folder input tests](../../tests/home-folder-input.test.mjs), [applet footer tests](../../tests/home-accepted-toolbar-touch.test.mjs), [residual audit](../home-applet-footer-residual-audit-2026-10-01.md).
**Now/gap/dependency:** Open, Resume, Close folder, Close software, Settings, Create Folder, and the Settings Manual route are state-derived. Applet glyph text now matches within threshold, but 694 footer material-edge pixels and other footer states remain unresolved.
**Next/acceptance:** Capture each footer variant from a named state, exercise left/centre/right inclusive edges, and compare native/browser inputs and raw lower LCDs. No action may leak from the retained grid under toolbar focus.

### H-11 - HOME Design, themes, brightness, power-saving, and preferences
**Code/tests/evidence:** [state.ts](../../src/os/state.ts), [screens.ts](../../src/os/screens.ts), [system.ts](../../src/os/system.ts), [menu tests](../../tests/menu.test.mjs), [portfolio validation](../portfolio-os-validation.md).
**Now/gap/dependency:** Source lower Settings, Save/Load, brightness/power, scrolling and eight local saved arrangements are implemented at `e923487d`. Empty plates/Delete/footer and current paired preview follow through `5232b9c5`; see [latest comparison](../home-layout-native-comparison-2026-10-02.md). Saved thumbnails/Zoom, first-use preparation and later Settings rows remain missing. Theme picker is authored; preferences/reset and local persistence are adaptations. No whole native match.
**Next/acceptance:** Deferred behind close/switch, power-on and HOME interactions. Later finish saved previews and source-established rows/first-use states, then compare white-theme Settings, theme selection, brightness/power, layout save/load/delete and cancel. Preserve selected tile/suspended owner; match motion/input separately from settled composition.

### H-12 - Cursor, balloons, selected-title window, and suspended-software upper
**Code/tests/evidence:** [home-primary-cursor.ts](../../src/os/home-primary-cursor.ts), [home-cursor-loop.ts](../../src/os/home-cursor-loop.ts), [home-balloon-presentation.ts](../../src/os/home-balloon-presentation.ts), [balloon tests](../../tests/home-balloon-presentation.test.mjs), [upper composition audit](../native-upper-composition.md).
**Now/gap/dependency:** Primary cursor visibility/position, loop phase, folder balloon, and Settings/Health/Sound/Camera title balloons have bounded native routes. The source `LncBase_U_00` suspended-software window/title/icon subtree is still hidden, so HOME-with-software-suspended is visibly incomplete. The [Health native attempt](../home-live-verification-2026-10-02.md) reached Health main but not suspended HOME after bounded input retries; no native window pose/gate was captured.
**Next/acceptance:** Establish native HOME return with measured delivered HOME input before implementing the first bounded slice above. Then capture Work active -> HOME and no-software HOME at identical selected tile/phase. Require correct window gate, title/icon metadata, cursor/balloon coexistence, and no stale capture after close/switch. Do not repeat unmeasured short-key attempts as timing evidence.

The [APT-debug follow-up](../home-design-native-comparison-2026-10-02.md#health-home-return-diagnostic)
adds two unchanged Health lower captures and no logged APT inquiry/jump. It does
not distinguish host-delivery failure from the native notification boundary.

### H-13 - Selected banner host, readiness, motion, and failure
**Code/tests/evidence:** [home-banner-host.ts](../../src/os/home-banner-host.ts), [home-banner-service.ts](../../src/os/home-banner-service.ts), [firmware-banner.ts](../../src/scene/firmware-banner.ts), [host tests](../../tests/home-banner-host.test.mjs), [News comparison](../home-news-motion-comparison-2026-10-01.md).
**Now/gap/dependency:** Folder/default, Settings, common stock banners, Friend type14, and Notifications type16 reuse generation/ticket/readiness/disposal paths. Memo/Web/Miiverse use separate renderers; failures are explicit. Activation first-frame, offsets, and several toolbar handoffs remain unproved.
**Next/acceptance:** Reselect Settings, Friend, Notifications, Notes, Browser, and Miiverse under one fixed input movie; capture two motion phases each. Require no stale banner, blank pending state, or borrowed ticket, then compare pose/material/label pixels without guessing an epoch.

### H-14 - Physical, keyboard, analog, touch, repeat, and cancellation
**Code/tests/evidence:** [console-scene.ts](../../src/scene/console-scene.ts), [app-input.ts](../../src/os/app-input.ts), [home-input-adapter.ts](../../src/os/home-input-adapter.ts), [adapter tests](../../tests/home-input-adapter.test.mjs), [input comparison](../home-input-comparison-2026-10-01.md).
**Now/gap/dependency:** Physical model controls, keyboard, accessible controls, D-pad/circle-pad, and lower-LCD pointers enter one phase protocol; blur, visibility, lid, launch, and overlays release held input. Browser trusted holds were measured, but wall time does not prove native 4.273504 ms sampling.
**Next/acceptance:** Use the same serialized down/up sequence for D-pad hold/repeat, A, B, HOME, touch, cancel, and two simultaneous sources. Compare sampled masks, repeat edges, actions, and visible frames; treat audio as open while muted.

### H-15 - HOME persistence and reset
**Code/tests/evidence:** [app-persistence.ts](../../src/os/app-persistence.ts), [system.ts](../../src/os/system.ts), [home-layout.ts](../../src/os/home-layout.ts), [persistence tests](../../tests/app-persistence.test.mjs), [history tests](../../tests/home-navigation-history.test.mjs).
**Now/gap/dependency:** Versioned preferences retain layout, folders, root/child views, theme, brightness, power-saving, mute, and volume while rejecting corrupt/duplicate/retired entries. Transient gestures, clocks, controls, close sessions, and applet owners are not persisted.
**Next/acceptance:** Save a rearranged multi-folder layout with independent densities, reload, reset, and cold boot. Require exact stable identities/views, safe migration of the prior default only, explicit storage failure notice, and no resurrection of transient owners.

### H-16 - HOME cues, mute, and accessibility
**Code/tests/evidence:** [audio.ts](../../src/os/audio.ts), [menu-action-sound.ts](../../src/os/menu-action-sound.ts), [console-scene.ts](../../src/scene/console-scene.ts), [sound tests](../../tests/menu-action-sound.test.mjs), [audio contract](../native-home-audio-contract.md).
**Now/gap/dependency:** Native menu cues, HOME music entry policy, announcements, focusable controls, mute, and volume exist. Audio timing/balance is unaccepted and must remain muted until the user permits validation; some descriptions summarize rather than reproduce native accessibility text.
**Next/acceptance:** While muted, verify cue scheduling identifiers and accessible announcements for every H-03/H-05/H-07/H-09 action. Defer audible waveform/timing comparison and keep the matrix audio tier open.

## Cross-app lifecycle

### L-01 - Cold boot, Power menu, shutdown, and off
**Code/tests/evidence:** [system.ts](../../src/os/system.ts), [native-system-presentation.ts](../../src/os/native-system-presentation.ts), [system-transitions.ts](../../src/os/system-transitions.ts), [transition tests](../../tests/system-transitions.test.mjs), [power note](../portfolio-power-transitions.md).
**Now/gap/dependency:** Boot/home/power/shutdown/off phases, sourced fades and Power panes exist. The 3000/550 ms durations and final 350 ms reveal are browser adaptations; physical backlight/order and native cold-entry caller remain open.
**Next/acceptance:** From running software and from HOME, press Power, cancel with B/HOME, confirm off, then cold boot. Match phase gates, LCD/backlight frames, selected HOME context, and ignored inputs during boot/shutdown.

### L-02 - Lid close, sleep, wake, and document visibility
**Code/tests/evidence:** [console-scene.ts](../../src/scene/console-scene.ts), [app-host.ts](../../src/os/app-host.ts), [home-navigation-motion tests](../../tests/home-navigation-motion.test.mjs), [runtime tests](../../tests/app-runtime.test.mjs).
**Now/gap/dependency:** Hinge closure cancels pointers/controls, sends sleep to every instance, releases capabilities, freezes HOME clocks, and wake resumes without hidden catch-up. Browser-tab visibility similarly releases input but is not a 3DS lid event.
**Next/acceptance:** Close/reopen the lid from HOME motion, an application, a system applet, and a loading screen. Require retained state/phase, no stuck input or late capability result, and matched first wake frames; visibility blur remains a labelled browser safety policy.

### L-03 - Application launch fade and logo
**Code/tests/evidence:** [system-transitions.ts](../../src/os/system-transitions.ts), [native-system-presentation.ts](../../src/os/native-system-presentation.ts), [presentation tests](../../tests/native-system-presentation.test.mjs), [performance record](../performance-2026-10-01.md).
**Now/gap/dependency:** HOME SceneOutA/B/C 60/30/15 clips composite under the source logo; 1750 ms is clip-derived, not measured title-load latency. Reduced motion jumps to a bounded pose.
**Next/acceptance:** Launch one portfolio and one firmware application from settled HOME with identical A pulses. Compare all transition boundaries, first application pair, ownership, and cancellation-to-HOME; do not infer wall-clock parity from clip frame counts.

### L-04 - Application owner creation, foreground tick, and close
**Code/tests/evidence:** [app-host.ts](../../src/os/app-host.ts), [app-registry.ts](../../src/os/app-registry.ts), [runtime tests](../../tests/app-runtime.test.mjs), [OS validation](../portfolio-os-validation.md).
**Now/gap/dependency:** One application owner, instance sequence, bounded tick delta, save migration, activity accounting, nested children, close callbacks, and owner removal are implemented. This is a browser runtime model, not full native APT equivalence.
**Next/acceptance:** Launch, navigate, idle, close, relaunch, and inject a stale result for one portfolio and one firmware title. Require a new owner, correct restored state policy, no old frame/effect, and stable HOME selection.

### L-05 - HOME suspend, same-owner resume, and Notes retirement
**Code/tests/evidence:** [app-host.ts](../../src/os/app-host.ts), [system.ts](../../src/os/system.ts), [runtime tests](../../tests/app-runtime.test.mjs), [Notes owner note](../notes-home-owner-exit.md), [eShop close route](../eshop-close-investigation.md).
**Now/gap/dependency:** HOME suspends the active owner, releases capabilities, stores `homeReturn`, and A/HOME resumes it. Accepted Notes HOME exit is special: Notes retires while its caller stays suspended. Native per-title resume animation and clocks vary and remain app-specific.
**Next/acceptance:** For Work, Settings, eShop, and Notes-with-Work-caller, run launch -> HOME -> resume -> HOME -> close. Require exact owner graph, retained page, first resumed LCD pair, Notes retirement semantics, and no stale resource generation.

### L-06 - Close-software dialog
**Code/tests/evidence:** [system.ts](../../src/os/system.ts), [portfolio-screens.ts](../../src/os/portfolio-screens.ts), [portfolio tests](../../tests/portfolio.test.mjs), [power note](../portfolio-power-transitions.md).
**Now/gap/dependency:** B on root HOME with suspended software opens `dialog:'close'`; B cancels/resumes and A closes the owner. The visible dialog is a shared authored painter and is not a source-mapped native composition.
**Next/acceptance:** Work -> HOME -> B, capture, cancel, reopen, confirm. Require correct frozen/suspended background, owner preservation/removal, selection, dialog text/buttons, touch bounds, and native/browser raw pairs.

### L-07 - Switch-software confirmation and pending launch
**Code/tests/evidence:** [system.ts](../../src/os/system.ts), [app-host.ts](../../src/os/app-host.ts), [portfolio tests](../../tests/portfolio.test.mjs), [performance record](../performance-2026-10-01.md).
**Now/gap/dependency:** Selecting a different application while one is suspended stores `pending`, opens `dialog:'switch'`, cancels back to the old owner, or closes then launches the pending title. The current painter is visually shared with L-06 and does not establish native switch wording/composition.
**Next/acceptance:** Work -> HOME -> select About -> A, capture, cancel and resume Work; repeat and confirm About. Require no premature close/start, one fresh owner after confirm, correct pending cleanup, and distinct source/capture-backed switch presentation.

### L-08 - System/library applet invoke, result, cancel, and nesting
**Code/tests/evidence:** [app-host.ts](../../src/os/app-host.ts), [system.ts](../../src/os/system.ts), [runtime tests](../../tests/app-runtime.test.mjs), [Notes lifecycle](../native-notes-accepted-home-entry-audit.md).
**Now/gap/dependency:** System and library applet slots suspend callers, cap nesting, route typed results, recursively close children, and reject stale completions. Toolbar applets opened from HOME have explicit caller identities; Software Keyboard cannot be invoked.
**Next/acceptance:** With and without a suspended application, open Notes plus one nested read-only applet, cancel and complete each, then close the caller. Require exact active/caller slots, returned state, frozen capture ownership, and no keyboard/network path.

### L-09 - Settings helper launch and return
**Code/tests/evidence:** [app-host.ts](../../src/os/app-host.ts), [system.ts](../../src/os/system.ts), [helper tests](../../tests/settings-helper-return.test.mjs), [validation](../settings-transfer-update-return-validation.md).
**Now/gap/dependency:** NNID, System Transfer, and Updater replace the Settings application slot while retaining the exact parent page, then HOME/back returns correctly. Operations are inert/read-only adaptations; account/update/network work is excluded.
**Next/acceptance:** From the documented Settings pages, enter each helper, HOME suspend/resume, Back return, and Power cancel. Match parent focus/page, helper opening/closing frames, and no editable or online side effect.

### L-10 - Native loading, paired publication, timeout, failure, retry, and escape
**Code/tests/evidence:** [stock-screen-presentation.ts](../../src/os/stock-screen-presentation.ts), [native-screen-input.ts](../../src/os/native-screen-input.ts), [native-screen-system.ts](../../src/os/native-screen-system.ts), [preparation tests](../../tests/stock-screen-preparation.test.mjs), [readiness note](../native-screen-readiness.md).
**Now/gap/dependency:** Owner/generation guards, atomic black/loading pairs, preparation deadline, explicit failure, retry, B/HOME escape, input quarantine, cache bounds, and disposal exist. The recovery screen is explicitly authored browser UI, not a native firmware dialog.
**Next/acceptance:** Force delayed, failed, retried, replaced-owner, sleep, and HOME-escape cases for Settings and Sound. Require no partial/old pair, no action begun while hidden, deterministic recovery ownership, and explicit adaptation labelling.

### L-11 - Manual and overlay ownership
**Code/tests/evidence:** [stock-apps.ts](../../src/os/stock-apps.ts), [stock-native-helpers.ts](../../src/os/stock-native-helpers.ts), [manual tests](../../tests/stock-manual-application.test.mjs), [Manual detail](../manual-upper-detail-fidelity-2026-09-27.md).
**Now/gap/dependency:** Settings Manual opens only with its explicit title argument, draws delivered Contents/page resources, supports page 1/Back/Close, and leaves unfinished controls inert. Later pages, Enlarge, full scrolling, and generic per-title Manual routes remain incomplete/source-gap.
**Next/acceptance:** Settings selected -> footer Manual -> Contents -> page 1 -> Back -> X/Close, using touch and buttons. Match owner/caller return, scroll position, both LCDs, and inert unsupported controls; do not invent missing pages.

### L-12 - Effects, storage, capabilities, links, and late-result cancellation
**Code/tests/evidence:** [runtime-effects.ts](../../src/os/runtime-effects.ts), [app-capabilities.ts](../../src/os/app-capabilities.ts), [app-persistence.ts](../../src/os/app-persistence.ts), [effect tests](../../tests/runtime-effects.test.mjs), [capability tests](../../tests/app-capabilities.test.mjs).
**Now/gap/dependency:** Ordered saves, safe links, owner-token capability results, offline Nintendo services, and suspend/close releases are implemented. Camera capture, recording, imports, NFC/network, and account actions are excluded even though generic adapters retain test coverage for portfolio use.
**Next/acceptance:** Begin a permitted portfolio capability, then HOME, sleep, switch, close, and dispose before completion; separately attempt every excluded stock action. Require resource release, ignored late results, ordered saves, explicit offline/read-only UI, and no prompt from stock apps.

### L-13 - Persistence restore, corruption, migration, and failure notice
**Code/tests/evidence:** [app-persistence.ts](../../src/os/app-persistence.ts), [system.ts](../../src/os/system.ts), [persistence tests](../../tests/app-persistence.test.mjs), [runtime effects tests](../../tests/runtime-effects.test.mjs).
**Now/gap/dependency:** IndexedDB v2 stores saves/shared/preferences/media with validation, transaction ordering, quotas, legacy import, corruption reporting, and version-change closure. Storage failures surface one authored runtime notice without blocking navigation.
**Next/acceptance:** Restore valid, old, corrupt, quota-failed, blocked, and unavailable profiles; then launch/close/reload. Require valid records only, no layout loss from unrelated corrupt data, one visible failure notice, and no duplicated write/effect.

### L-14 - Scene startup, retry boundary, and teardown/disposal
**Code/tests/evidence:** [console-scene.ts](../../src/scene/console-scene.ts), [runtime-effects.ts](../../src/os/runtime-effects.ts), [native-title-session.ts](../../src/os/native-title-session.ts), [session tests](../../tests/native-title-session.test.mjs), [performance architecture](../performance-architecture.md).
**Now/gap/dependency:** React owns async scene creation; model-load failure aborts firmware work and disposes renderer resources. Normal teardown releases input/effects/audio/screens/models/textures/listeners/capture hooks. Initial scene startup is not uniformly deadline-bounded, and broad failure/leak verification remains open.
**Next/acceptance:** Abort during model load, firmware load, active title load, capture, and queued save; recreate twice. Require no live listener/timer/GPU/media owner, no stale callback mutation, one clean retry, and bounded memory/resources.

### L-15 - Reduced motion and browser scheduling policy
**Code/tests/evidence:** [system-transitions.ts](../../src/os/system-transitions.ts), [console-scene.ts](../../src/scene/console-scene.ts), [home-navigation-motion tests](../../tests/home-navigation-motion.test.mjs), [performance record](../performance-2026-10-01.md).
**Now/gap/dependency:** Reduced motion shortens presentation transitions and freezes selected visual clips while preserving logical HOME update counts; hidden documents rebase rather than catch up. These are accessibility/browser adaptations, not native behavior.
**Next/acceptance:** Repeat H-03, H-04, L-01, and L-03 with reduced motion toggled mid-transition and after tab hiding. Require identical final state/ownership, no accumulated hidden time, bounded first frame, and explicit adaptation metadata rather than native parity claims.
