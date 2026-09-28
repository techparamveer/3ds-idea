> UI update: the later `uifix` rebuild, source record, browser evidence and remaining limits are documented in [uifix-audit.md](uifix-audit.md). The Arial/no-bundled-font statements below describe the September 10 integration, not the current branch.

# HOME Menu worktree integration

Integrated `codex/home-menu-assets` through `06e7729` into the hardware/site checkout on 2026-09-10. The separate branch and worktree remain preserved. The completed task was inactive during integration; no active edits were interrupted.

The live menu now shares tile geometry between drawing and touch hit testing. Empty slots do not open or show a folder banner, touch gaps and footer margins do not trigger actions, non-finite touches are ignored, and zoom cannot change the grid behind an open folder. The four unnamed folders remain empty.

The integration also brings the standalone BCFNT converter and bitmap renderer, LZ/DARC resource extraction and validated browser loading, a narrow BCLYT decoder, and normalized animation math into the main project. These modules remain opt-in and are not evidence that original assets have been extracted or rendered. The archive is still encrypted, no Nintendo font is bundled, and the live renderer still falls back to Arial. No invented substitute is labelled firmware-derived.

The earlier bitmap renderer test had not been updated to supply the manifest fields required by later validation changes. Its synthetic fixture now declares schema, source hash, baseline, and sheet names; the existing bearing, alignment, scaling and tint-cache assertions pass unchanged.

Verification: all 115 JavaScript tests and 13 Python tests pass, as do TypeScript checking and the production build. The format tests use synthetic fixtures; compatibility with the owner's real decrypted resources remains unverified.

At 1280 × 720 in the live browser:

- Navigating to slot 4 and pressing A leaves HOME active; no folder banner or Open button is shown for that unoccupied slot.
- Tapping the gap between rows retains slot 4.
- Tapping the second folder selects slot 2; tapping it again opens the folder.
- Clicking physical B returns HOME.
- Model ready and VGPU ready remain true; no warnings/errors were returned.

No model or texture assets were changed. Selection-pulse and decoded resource APIs are available but were not activated without their authenticity dependencies. Exact HOME Menu layout, graphics, typography, native animations, toolbar applets and other behavior remain unfinished.
