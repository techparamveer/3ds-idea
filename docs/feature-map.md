# 3DS portfolio feature map

Checkpoint: integration **`a6b74c8`** on `codex/firmware-os-10-7`,
24 September 2026. This map coordinates **status, owners and next actions**.
It is not a completion claim and does not hold evidence of its own.

- Evidence and its tiers (tested, browser-inspected, native-compared) are
  recorded in the [progress checkpoint](progress-2026-09-24.md) and the linked
  validation notes. If this map disagrees with them, they win; correct this map.
- Scope and exclusions come from [portfolio UI scope](portfolio-ui-scope.md);
  design contracts from [architecture](architecture/README.md).
- **Strict 1:1 fidelity is unproven for every row.** No row has a whole-screen
  matched native comparison of pixels, motion, audio and input timing. Do not
  turn test counts into a completion percentage.

A worker commit is delivered only after it is integrated, built and checked in
the browser by the coordinator.

## Status words

| Word | Meaning |
| --- | --- |
| Implemented | The integration code path exists and the stated tests pass. |
| Adaptation | Deliberate portfolio behaviour that differs from native; keep it labelled. |
| Defect | A known visible or behavioural error in the integrated build. |
| Source gap | Required original content or format support is missing. |
| Blocked | Waiting on user-supplied input. |

## Features

| Feature | Status at `a6b74c8` | Next action | Owner | Evidence |
| --- | --- | --- | --- | --- |
| Console model and physical controls | Implemented. Live GLB is the compact `silver-audio-finish` delivery | Headphone contacts (preserved unpromoted `silver-audio-contacts` candidate), hardware lettering and local curves. Hardware appearance is not accepted | Coordinator for scene integration. Blender rig refinement has no active worker | [Model index](model-validation-index.md) |
| Page, spin, lid, framing | Implemented. Reduced motion is an adaptation | Keep mobile/desktop framing checks with any scene change | Coordinator | [Framing](responsive-framing-validation.md), [experience design](architecture/experience-design.md) |
| HOME Menu | Implemented from native resources: folders, density, pickup, cursor, banners, suspension | Whole-screen motion, input timing, indicators and banner GPU behaviour against native | Coordinator | [HOME comparison](native-home-comparison-2026-09-22.md), [integration](home-menu-integration.md) |
| HOME audio | Implemented: native sequence and short cues | Input-to-sound timing and music balance against native | Coordinator | [Menu audio](native-menu-audio-integration.md) |
| Eight portfolio apps | Implemented. Content and navigation preserved | Full content and mobile navigation pass | Coordinator; presentation for painters | [Portfolio OS](portfolio-os-validation.md) |
| Power on/off, startup | Implemented from source layouts and fades. Adaptation: cold boot reveals HOME directly | Native timing of shutdown and boot | Coordinator | [Power transitions](portfolio-power-transitions.md) |
| App opening | Implemented: HOME `SceneOutA/B/C` fade is composited under the source logo (`667a15a`); focused tests and source-frame verifier pass; live Work launch was inspected | Matched native launch/logo timing and animated raster cost | Coordinator | [Power transitions](portfolio-power-transitions.md) |
| Loading and recovery | Implemented for stock views: paired publication, timeout, retry, input gate | Initial scene startup is not deadline-bounded; broader leak scenarios | Coordinator; runtime | [Readiness](native-screen-readiness.md) |
| Settings main and subpages | Implemented from source scenes: Internet, Data, Other pages, Connection, Date & Time, Profile, DS Profile. Software/Extra Data empty lists use original layout and labels (`9586990`); the source EU eight-choice Language page is integrated (`0e2309b`). Both were operated live; unknown Open Blocks stays blank | Verify Language scroll/thumb and Data list motion/material; whole-screen native comparison remains open | Presentation; coordinator for browser | [Settings trace](settings-main-source-validation.md), [Data lists](settings-data-lists-source-audit.md), [Language audit](settings-language-source-audit.md), [fields](settings-native-fields-validation.md) |
| Settings helpers (NNID, Transfer, Updater) | Implemented: helper Back restores the exact Settings page, and HOME suspends the helper (`251f88f` tests). NNID helper return was operated in the live browser | Transfer/Updater return and matched native helper comparison remain. The older "returns to HOME" note in [screen presentation](stock-screen-presentation.md) predates `251f88f` and is superseded | Runtime; coordinator for browser | [Helper return tests](../tests/settings-helper-return.test.mjs) |
| Parental Controls | Implemented: intro Back/Set → source explanation (Back/Next) → source PIN notice (`Dialog_D_01`, one OK). Adaptation: OK/B return to the explanation with Next selected, but native OK continues to PIN setup. The old restrictions list is unreachable. Touch targets follow source bounds. Integrated live flow was operated, including an inert obscured background | Upper LCD during the notice keeps the explanation page, and the native upper mask and timing are unverified. Matched native comparison remains open | Coordinator (browser, touch geometry); presentation (upper mask) | [Source flow](settings-parental-source-audit.md), [PIN notice](settings-parental-pin-presentation.md), [dialog assets](native-parental-dialog-assets.md) |
| Camera | Read-only gallery uses source lower `PicL` browse and upper `P_FinderVS_U` (`ea4cdfe`); source verifier, combined tests and live folder → gallery → photo pass | Six-cell centres and footer are adapters; gallery/photo upper uses portfolio pixels as a viewfinder replacement; matched native comparison remains open | Coordinator for browser; presentation | [Camera source validation](camera-gallery-source-validation.md) |
| Sound | Source-position transport, seek, loop-mode and error dialog integrated from Sound resources (`5c5709f`); owner-scoped playback remains. Empty state was checked live. The production track manifest is empty | Live favourite-track playback needs supplied songs; native player/visualiser comparison remains open | Runtime; presentation | [Sound source validation](sound-source-validation.md) |
| Health and Safety | Implemented. Adaptation: bounded pagination instead of continuous scroll | Remaining document scenarios | Presentation | [Screen presentation](stock-screen-presentation.md) |
| Game Notes | Implemented grid/editor and source-pane capture of the suspended app (`f9219d7`). The source-traced Double → Up → Down cycle (`251d988`) and 0–25 frame Switch clip (`e4d52b8`) are integrated; live Double → Up and frozen Health capture were inspected with no errors | Source HUD/title-panel motion and sounds; matched native comparison | Coordinator | [Capture validation](native-notes-suspended-capture.md), [switch source audit](native-notes-switch-source-audit.md), [source contract](native-notes-capture-assets.md) |
| Friend List, Notifications | Implemented source initial/empty states | Interior fidelity; nonempty states only if brought into scope | Presentation; runtime | [Personal tools](native-personal-tools.md) |
| Internet Browser, Miiverse | Implemented source chrome. Adaptation: local read-only interiors | Interior fidelity. No remote browsing or keyboard | Presentation; runtime | [Interiors](native-browser-miiverse-interiors.md) |
| eShop, Nintendo Zone | Implemented source welcome/offline chrome. Zone status icons use original HUD clips (`410e8b4`) and were inspected live | Banner depth projection, clock repaint, service-screen native comparison | Presentation; assets | [Service HUD trace](native-service-screen-trace.md) |
| NNID | **Source gap:** the unsigned-in body is absent from supplied data. Adaptation: native header plus local notice | Obtain a defensible reference if possible; otherwise keep it labelled | Assets; runtime | [NNID audit](nnid-entry-source-audit.md) |
| amiibo settings | Implemented bounded FLYT parts. **Source gap:** header and `PortalBtnSub` materials unsupported | Support them or omit them explicitly; no accepted opening-screen comparison | Assets | [amiibo limits](native-amiibo-initial-ui.md) |
| Other helpers and selectors | Implemented source UI with parent routing (Circle Pad, manual, selectors) | Per-helper native comparison | Runtime; presentation | [Helper presentation](native-helper-presentation.md) |
| Accessibility | Implemented shared physical, keyboard, touch and accessible controls. Switch/power announcements corrected | Screen-specific announcements, full accessibility pass | Coordinator | [Experience design](architecture/experience-design.md) |
| Asset conversion, provenance | Implemented. The `a6b74c8` public audit reports 1,605 resources, 580 layouts and 1,833 animations with zero errors; private-source cross-check was unavailable in this worktree | Keep unsupported fields explicit and rerun after further asset integration | Assets | [Asset architecture](architecture/assets-and-materials.md) |
| Final acceptance | Open | Verify an isolated Azahar profile before further native sessions, then run a versioned browser/native scenario matrix and requirement audit | Coordinator | [Verification](architecture/verification.md) |

## Worktrees on 24 September 2026

Branch names change between slices. Run `git worktree list` before relying on
this table.

| Role | Worktree | Branch @ head | Not yet integrated |
| --- | --- | --- | --- |
| Coordinator / integration | `3ds-idea-worktrees/integration` | `codex/firmware-os-10-7` through `a6b74c8` | — |
| Assets | `3ds-idea-worktrees/assets` | `codex/settings-native-assets` @ `b30bcc0` | Service-screen visual fix remains uncommitted/unverified; Notes audit integrated |
| Presentation | `3ds-idea-worktrees/presentation` | `codex/settings-native-fields` @ `5090b10` | None found (subject match) |
| Runtime | `3ds-idea-worktrees/runtime` | `codex/parental-flow-audit` @ `057173b` | None found (subject match) |
| Notes capture | `3ds-idea-worktrees/notes-suspended-capture` | `codex/notes-suspended-capture` @ `a6ba824` | Integrated as `f9219d7` |
| Notes switch | `3ds-idea-worktrees/notes-switch-native` | `codex/notes-switch-native` @ `63386a9` | Integrated as `251d988`; browser cycle inspected |
| Notes motion | `3ds-idea-worktrees/notes-switch-motion` | `codex/notes-switch-motion` @ `3aea14a` | Integrated as `e4d52b8`; live Double → Up inspected |
| Camera gallery | `3ds-idea-worktrees/camera-native-gallery` | `codex/camera-native-gallery` @ `3bae6ca` | Integrated as `9b50576` |
| Sound favourites | `3ds-idea-worktrees/sound-native-favorites` | `codex/sound-native-favorites` @ `7c22239` | Integrated as `5c5709f` |
| Settings Data lists | `3ds-idea-worktrees/settings-data-source` | `codex/settings-data-source` @ `cd13051` | Integrated as `fa731dc` and `9586990` |
| Camera upper LCD | `3ds-idea-worktrees/camera-upper-source` | `codex/camera-upper-source` @ `fd7183a` | Integrated as `ea4cdfe` |
| Settings Language | `3ds-idea-worktrees/settings-language-source` | `codex/settings-language-source` @ `29b60ed` | Integrated as `3be6851`, `0e2309b`, `3797de6`; browser entry/return inspected |
| amiibo materials | `3ds-idea-worktrees/amiibo-source-materials` | `codex/amiibo-source-materials` @ `fa46764` | Audit integrated as `a6b74c8`; material support still missing |
| Documentation | `.codex/worktrees/b047/3ds-idea` | `codex/system-design-docs` @ `91fe40f` | Integrated as `24d7aa6` and `ee036df` |
| Preserved | Original checkout, `3ds-idea-os`, `.codex/worktrees/b94c` | `uifix`, `codex/3ds-os`, `codex/home-menu-assets` | Keep, don't modify |

Workers stay inside their own worktree and files, as the scope note describes. Only the coordinator
drives the browser and the Azahar reference session. Store evidence under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`.
Label each item as a source render, a browser capture or a matched emulator
comparison, and cite its commit and scenario.

## Intentionally excluded

Software Keyboard, Activity Log, Download Play, Mii Maker, StreetPass Mii
Plaza, AR Games and Face Raiders. No capture permissions, recording, imports,
text entry, PIN entry, account operations, editable stock profiles or network
emulation. Camera is read-only. Sound playback is the only interactive
stock-app exception. Excluded features are not backlog.
