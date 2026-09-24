# 3DS portfolio feature map

Checkpoint: 24 September 2026, integration `1be4133` on
`codex/firmware-os-10-7`. This is a coordination map, not a completion claim.
Update evidence and commit identifiers when work is integrated. A worker commit
is not delivered until it is integrated, built and checked in the browser.

## Reading the status

- **Implemented** means a code path exists; it does not establish visual fidelity.
- **Browser checked** applies only to the scenarios stated below.
- **Source backed** means original resources or traced source behavior are used.
- **Native comparison open** means strict 1:1 acceptance remains unproven.

The current scope is [portfolio UI](portfolio-ui-scope.md). The architecture
entry point is [architecture/README.md](architecture/README.md). All rows below
still require matched native comparison unless their linked evidence explicitly
proves a narrower comparison. Do not convert test counts into a completion percentage.

## Features and evidence

| Feature | Current implementation and verification | Remaining work | Main files / evidence | Owner |
| --- | --- | --- | --- | --- |
| Console model and physical controls | Sourced silver XL model, intro and physical controls preserved; visible in live app checks | Hardware fidelity gaps remain in model validation notes | `src/scene/`; [source validation](source-silver-validation.md) | Integration; separate hardware work only when assigned |
| HOME Menu | Native resource pipeline, selection, folders and software suspension implemented; HOME return exercised live | Complete matched native screen/animation/input comparison | `src/os/system.ts`, native HOME modules; [integration](home-menu-integration.md) | Integration |
| Eight portfolio apps | Existing content and navigation preserved; Work opened in browser | Full content and mobile navigation acceptance | `src/os/portfolio-screens.ts`, `portfolio-media.ts` | Integration |
| Power on/off | Source power menu and fades; live shutdown to black LCDs and boot to HOME verified | Hardware timing/cadence comparison | [power transitions](portfolio-power-transitions.md) | Integration |
| App opening | Source Nintendo logo clips and source fade implemented | Animated rendering cost and matched timing remain open | `native-system-presentation.ts`; [power transitions](portfolio-power-transitions.md) | Integration |
| Loading and recovery | Native screens publish complete pairs; timeout, retry and input gating implemented; delayed/error asset scenarios exercised | Finish any specifically pending recovery scenarios in evidence notes | `stock-screen-presentation.ts`, `native-screen-input.ts` | Integration/runtime |
| System Settings main | Source scene, palette, tiles and controls integrated and browser checked | Matched reference comparison | [Settings evidence](settings-main-source-validation.md) | Presentation + integration |
| Settings submenus | Source Internet, Connections, Data, Profile, Other Settings and Date & Time layouts; page order corrected | Generic leaf screens and remaining controls need source replacement | `stock-native-settings.ts`, `stock-settings-navigation.ts` | Presentation/runtime |
| DS Profile | Source legacy layouts and full-width Back; browser checked | Original profile data absent; Message/Colour intentionally inert | [Settings evidence](settings-main-source-validation.md) | Presentation + integration |
| Date/time/birthday | Original arrows, digit textures, EU ordering and Cancel/OK; live screens and Cancel checked | Values absent remain blank; editing intentionally excluded | [native fields](settings-native-fields-validation.md) | Presentation + integration |
| Parental Controls | Original introduction and Back/Set integrated; source next introduction painter integrated | Connect original explanation/PIN notice together; replace incorrect Set-to-restrictions shortcut | [source flow](settings-parental-source-audit.md) | Runtime + presentation + assets; integration owns touch geometry |
| Camera | Existing portfolio folders/gallery, read-only; entry and folder navigation checked | Matched native gallery composition and full navigation pass | `stock-native-camera.ts`, `portfolio-media.ts` | Presentation/runtime |
| Sound | Source music UI and playback effects; empty music screen checked | User song manifest is empty; live favourite-track playback needs supplied media | `stock-native-sound.ts`, `portfolio-media.ts` | Runtime/presentation |
| Health and Safety | Source screens and document pages; entry and two-page navigation checked | Remaining document/reference scenarios | `stock-native-health.ts`; [screen evidence](stock-screen-presentation.md) | Presentation |
| Game Notes | Source grid/editor; open and Back/close checked | **Known defect:** editor shows no suspended software while Health is suspended; source snapshot slots need wiring | `stock-native-personal-tools.ts`; [screen evidence](stock-screen-presentation.md) | Integration + assets source audit |
| Friend List | Source initial screen; entry and Back checked | Profile/supplied-data and interior fidelity gaps | `stock-native-personal-tools.ts` | Presentation/runtime |
| Notifications | Source empty state; zero counts and right-edge Close checked | Native comparison; nonempty scenarios only if in scope | `stock-native-personal-tools.ts` | Presentation/runtime |
| Internet Browser | Source chrome; entry checked; local UI routes implemented | Interior/offline fidelity; no remote browsing or keyboard required | `stock-native-web.ts`, `stock-browser-navigation.ts` | Presentation/runtime |
| eShop / Nintendo Zone / Miiverse | Source-backed UI paths implemented | Service-screen fidelity and full live scenarios remain open; known projection gaps retained | `stock-native-services.ts`, `stock-native-web.ts` | Presentation/assets |
| NNID | Local native shell/control resources available | **Missing source:** original unsigned-in account-page content; current adaptation is not a native match | [NNID audit](nnid-entry-source-audit.md) | Assets/runtime |
| amiibo settings | Bounded original-model FLYT parts supported; 13 real-source Python and 14 renderer checks pass | Header/PortalBtnSub material behavior and native reference unresolved | [amiibo evidence](native-amiibo-initial-ui.md) | Assets |
| Other internal helpers | Updater, transfer, Circle Pad, manual and selectors have source UI paths and parent routing | Per-helper native comparison and remaining adaptations | `stock-native-helpers.ts`, `stock-native-selectors.ts`, `stock-helper-views.ts` | Runtime/presentation |
| Accessibility | Physical, keyboard, touchscreen paths; software-switch/power announcements corrected and checked live | Further screen-specific announcements and full accessibility pass | `src/scene/console-scene.ts` | Integration |
| Asset conversion/provenance | Fonts, layouts, animations, images and messages published with provenance; audited resources | Explicit unsupported styles/materials/animations remain; private-source checks are separate from public audit | `scripts/firmware/`, `public/os/firmware/10.7.0-32E/` | Assets |
| Final acceptance / PR | Integration branch and evidence exist | Full requirement audit, matched native comparisons, final validation, push and PR still outstanding | Original brief; `GOAL.md` | Integration |

## Worktree handoff rules

| Worktree | Responsibility | Coordination boundary |
| --- | --- | --- |
| `3ds-idea-worktrees/integration` | Combined behavior, scene, input geometry, browser verification and acceptance | Integrates coherent commits sequentially; owns final delivery |
| `3ds-idea-worktrees/assets` | Source inspection, converters and selected resources | Supplies exact layout/message/material contracts; no guessed publication |
| `3ds-idea-worktrees/presentation` | Source screen painters and render verification | Reports matching runtime IDs and touch geometry requirements |
| `3ds-idea-worktrees/runtime` | UI routes, state/lifecycle and tests | Coordinates painter dependencies before routes are delivered |
| New progress/system-design worktree | Progress record, feature map, architecture and agent guidance | Documentation ownership; do not change runtime or overwrite active worker edits |

Implementation workers use GPT-6 Astra High. Branch names may change between
slices; inspect `git worktree list` and each task before relying on an old name.
The original checkout and older OS worktrees must remain preserved.

Evidence root:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`.
Use links to specific reports, scenario names and commits in future updates.
Distinguish source-render images from real browser images and matched emulator
comparisons. Browser verification belongs to the integration task to avoid
agents interfering with the same session.

## Intentionally excluded

Activity Log, Download Play, Mii Maker, StreetPass Mii Plaza, AR Games, Face
Raiders and the software keyboard. No capture permissions, recording, imports,
account operations, editable stock profiles or network emulation. Camera is
read-only; Sound playback is the explicit interactive exception. Excluded
features are not unfinished backlog items.
