# 3DS portfolio feature map

Checkpoint: integration **`b6fb55e`** on `codex/firmware-os-10-7`,
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

| Feature | Status at `b6fb55e` | Next action | Owner | Evidence |
| --- | --- | --- | --- | --- |
| Console model and physical controls | Implemented. Live GLB is the compact `silver-audio-finish` delivery | Headphone contacts (preserved unpromoted `silver-audio-contacts` candidate), hardware lettering and local curves. Hardware appearance is not accepted | Coordinator for scene integration. Blender rig refinement has no active worker | [Model index](model-validation-index.md) |
| Page, spin, lid, framing | Implemented. Reduced motion is an adaptation | Keep mobile/desktop framing checks with any scene change | Coordinator | [Framing](responsive-framing-validation.md), [experience design](architecture/experience-design.md) |
| HOME Menu | Implemented from native resources: folders, density, pickup, cursor, banners, suspension | Whole-screen motion, input timing, indicators and banner GPU behaviour against native | Coordinator | [HOME comparison](native-home-comparison-2026-09-22.md), [integration](home-menu-integration.md) |
| HOME audio | Implemented: native sequence and short cues | Input-to-sound timing and music balance against native | Coordinator | [Menu audio](native-menu-audio-integration.md) |
| Eight portfolio apps | Implemented. Content and navigation preserved | Full content and mobile navigation pass | Coordinator; presentation for painters | [Portfolio OS](portfolio-os-validation.md) |
| Power on/off, startup | Implemented from source layouts and fades. Adaptation: cold boot reveals HOME directly | Native timing of shutdown and boot | Coordinator | [Power transitions](portfolio-power-transitions.md) |
| App opening | Implemented: source logo clips and fade | Launch/logo hold timing and animated raster cost | Coordinator | [Power transitions](portfolio-power-transitions.md) |
| Loading and recovery | Implemented for stock views: paired publication, timeout, retry, input gate | Initial scene startup is not deadline-bounded; broader leak scenarios | Coordinator; runtime | [Readiness](native-screen-readiness.md) |
| Settings main and subpages | Implemented from source scenes: Internet, Data, Other pages, Connection, Date & Time, Profile, DS Profile. Missing values stay blank; editing is excluded | EU eight-choice Language layout is unverified (read-only value only). Matched native comparison | Presentation; coordinator for browser | [Settings trace](settings-main-source-validation.md), [fields](settings-native-fields-validation.md) |
| Settings helpers (NNID, Transfer, Updater) | Implemented: helper Back restores the exact Settings page, and HOME suspends the helper (`251f88f` tests) | Browser check of helper return is not recorded. The older "returns to HOME" note in [screen presentation](stock-screen-presentation.md) predates `251f88f` and is superseded | Runtime; coordinator for browser | [Helper return tests](../tests/settings-helper-return.test.mjs) |
| Parental Controls | Implemented: intro Back/Set → source explanation (Back/Next) → source PIN notice (`Dialog_D_01`, one OK). Adaptation: OK/B return to the explanation with Next selected, but native OK continues to PIN setup. The old restrictions list is unreachable. Touch targets follow source bounds. Integrated live flow was operated, including an inert obscured background | Upper LCD during the notice keeps the explanation page, and the native upper mask and timing are unverified. Matched native comparison remains open | Coordinator (browser, touch geometry); presentation (upper mask) | [Source flow](settings-parental-source-audit.md), [PIN notice](settings-parental-pin-presentation.md), [dialog assets](native-parental-dialog-assets.md) |
| Camera | Implemented as a read-only portfolio folders/photo gallery | Native gallery composition, full navigation pass | Presentation; runtime | [Screen presentation](stock-screen-presentation.md) |
| Sound | Implemented UI and owner-scoped playback. **Blocked:** track manifest is empty | Real playback check after the user supplies songs | Runtime; presentation | [Screen presentation](stock-screen-presentation.md) |
| Health and Safety | Implemented. Adaptation: bounded pagination instead of continuous scroll | Remaining document scenarios | Presentation | [Screen presentation](stock-screen-presentation.md) |
| Game Notes | Implemented grid/editor and source-pane capture of the suspended app (`f9219d7`). Full suite and build pass; live Health → HOME → selected Note check shows frozen Health LCDs | Trace initial Double/Up/Down mode and switch animation; compare the delivered screen to native capture. Standalone canvas verifier still needs its optional module | Coordinator; assets audit integrated | [Capture validation](native-notes-suspended-capture.md), [source contract](native-notes-capture-assets.md) |
| Friend List, Notifications | Implemented source initial/empty states | Interior fidelity; nonempty states only if brought into scope | Presentation; runtime | [Personal tools](native-personal-tools.md) |
| Internet Browser, Miiverse | Implemented source chrome. Adaptation: local read-only interiors | Interior fidelity. No remote browsing or keyboard | Presentation; runtime | [Interiors](native-browser-miiverse-interiors.md) |
| eShop, Nintendo Zone | Implemented source welcome/offline chrome. Adaptation: Zone projection/viewport | Service-screen fidelity | Presentation; assets | [Service assets](native-service-ui-assets.md) |
| NNID | **Source gap:** the unsigned-in body is absent from supplied data. Adaptation: native header plus local notice | Obtain a defensible reference if possible; otherwise keep it labelled | Assets; runtime | [NNID audit](nnid-entry-source-audit.md) |
| amiibo settings | Implemented bounded FLYT parts. **Source gap:** header and `PortalBtnSub` materials unsupported | Support them or omit them explicitly; no accepted opening-screen comparison | Assets | [amiibo limits](native-amiibo-initial-ui.md) |
| Other helpers and selectors | Implemented source UI with parent routing (Circle Pad, manual, selectors) | Per-helper native comparison | Runtime; presentation | [Helper presentation](native-helper-presentation.md) |
| Accessibility | Implemented shared physical, keyboard, touch and accessible controls. Switch/power announcements corrected | Screen-specific announcements, full accessibility pass | Coordinator | [Experience design](architecture/experience-design.md) |
| Asset conversion, provenance | Implemented. The `b6fb55e` public audit reports 1,561 resources, 571 layouts and 1,820 animations with zero errors | Keep unsupported fields explicit and rerun after further asset integration | Assets | [Asset architecture](architecture/assets-and-materials.md) |
| Final acceptance | Open | Versioned browser + Azahar scenario matrix, requirement audit, then push/PR on the user's request | Coordinator | [Verification](architecture/verification.md) |

## Worktrees on 24 September 2026

Branch names change between slices. Run `git worktree list` before relying on
this table.

| Role | Worktree | Branch @ head | Not yet integrated |
| --- | --- | --- | --- |
| Coordinator / integration | `3ds-idea-worktrees/integration` | `codex/firmware-os-10-7` through `b93976f` | — |
| Assets | `3ds-idea-worktrees/assets` | `codex/settings-native-assets` @ `b30bcc0` | Service-screen visual fix remains uncommitted/unverified; Notes audit integrated |
| Presentation | `3ds-idea-worktrees/presentation` | `codex/settings-native-fields` @ `5090b10` | None found (subject match) |
| Runtime | `3ds-idea-worktrees/runtime` | `codex/parental-flow-audit` @ `057173b` | None found (subject match) |
| Notes capture | `3ds-idea-worktrees/notes-suspended-capture` | `codex/notes-suspended-capture` @ `a6ba824` | Integrated as `f9219d7` |
| Camera gallery | `3ds-idea-worktrees/camera-native-gallery` | `codex/camera-native-gallery` | Cursor/Grok source-backed gallery work in progress |
| Sound favourites | `3ds-idea-worktrees/sound-native-favorites` | `codex/sound-native-favorites` | Cursor/Fable source-backed Sound work in progress |
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
