# uifix: HOME Menu audit and visual rebuild

> Historical empty-menu pass. The working portfolio implementation and current verification commands are in [portfolio-os-validation.md](portfolio-os-validation.md).

Branch `uifix` was created from a clean `main` checkout for the user's new UI request. This supersedes the earlier direction to do new UI edits in the separate OS worktree **for this task only**. Neither independent OS worktree was edited. No Blender file, GLB, model texture, scene lighting or shader was changed.

## Scope and findings

Reviewed the Next.js entry points, client lifecycle, global styling, display textures/materials, screen placement and pointer/keyboard routing; audited the live OS state/renderer and existing bitmap/layout/resource/animation modules. The latter are decoding infrastructure, not proof that native OS resources are loaded. The page remains only the console and background.

| Before | Change / evidence |
| --- | --- |
| Yellow desktop-style folders and pale green background | Blue upright folder cases, neutral grey lower screen and drifting pale tile background on the top screen. Compared against native Nintendo screenshots and manual folder images. |
| Generic Arial text | Loaded a pinned, subsetted NTLG web-font conversion. Metadata and source hashes are in `public/os/README.md`. Browser checks assert the actual loaded FontFace, not just a CSS font-family declaration. |
| Roughly drawn, misplaced toolbar icons | Native-resolution Nintendo screenshot crop for notes, friends, notifications, browser, Miiverse and density controls. Settings icon remains authored. |
| Every empty slot looked like an installed app tile | Empty positions are small recessed outlines; occupied folders retain raised rounded tiles. |
| Footer carried page arrows; fixed 16-slot layout | Side arrows at icon-field mid-height; native-style Settings/Open or Create Folder footer, scroll indicator, 300 HOME slots, 60 folder slots, 60-folder creation limit. |
| Density changed column spacing but retained two rows | One through six rows, independent zoom-in/out touch controls, column-major selection and shared drawing/hit geometry. |
| Empty slots could do nothing | Create Folder adds an empty folder; the next activation opens it. Initial portfolio folders remain unnamed and empty. |
| Open folder was an empty framed rectangle | Empty folder grid with independent selection, back strip and Close action. Returning restores the parent selection. |
| Toolbar mostly ignored input | Settings, five brightness levels, power-saving dimming, theme list with scrolling, six local colour choices, and dismissible applet panels. No Nintendo online service is contacted. |
| No folder actions | Rename with a touch/physical keyboard and cancellable draft; delete requires a separate confirmation. |
| Pulse existed in renderer but never ran | Scene uploads animated screens at up to 30fps while powered, visible and motion is permitted. Reduced motion freezes both backdrop and cursor; clock still updates. |
| Touchscreen drags rotated the console | Horizontal screen gestures navigate the menu. Vertical gestures scroll the theme list. Dragging the shell still rotates the model. |

## Visual iterations and evidence

`docs/validation/uifix/before-console.png` records the rejected starting UI. `first-console.png` records the first replacement pass. Native capture then exposed a stray green edge in the toolbar crop and overly wide folders; the crop and folder proportions were corrected.

The next settings/theme comparison corrected the selection fill, drawer focus bounds, shared brightness strip, theme row heights, scrolling layout, and saturated colour swatches. Native screenshot art replaces invented Change Theme and Theme Shop symbols.

Final browser exports use **400×240** for the top screen and **320×240** for the bottom. The runtime's 800×240 top texture is deliberately normalized with `fit: fill`, not cropped; it retains the existing full-width UV contract. The hardware display remains 5:3.

Evidence files:

- `final-console.png`, `final-top.png`, `final-bottom.png`: actual rendered console and native screen output.
- `settings-comparison.png`, `themes-comparison.png`: Nintendo reference at left, implementation at right.
- `folder-*.png`, `three-rows-*.png`, `rename-*.png`, `blue-theme-*.png`: interaction states.
- `mobile-console.png`: 390×844 viewport, without page overflow.
- `browser-checks.json`: checks made using actual keys and projected screen/button clicks.

## Verification

- `npm test`: 144 tests passed (full suite).
- Updated menu tests cover all six densities, scrolling, touch/physical parity, folder isolation, power gating, creation, settings, theme changes, transactional rename, delete confirmation and toolbar return.
- `npm run typecheck` and `npm run build`: passed.
- `scripts/verify-home-menu.mjs`: passed using agent-browser. Verifies loaded font, moving artwork, frozen reduced-motion artwork, D-pad navigation, physical A/B and power buttons, native touch targets, brightness/theme panels, rename cancel, mobile framing and no browser errors. VGPU reports `ready` with the unchanged model.

Reproduce the browser verification against a development server:

```sh
npm run dev
AGENT_BROWSER=/path/to/agent-browser node scripts/verify-home-menu.mjs
```

The development-only screen canvas handles are read-only capture aids. Real interaction checks go through the browser's keys and mouse; no synthetic state setter is used. No debug page or controls are shown on the portfolio.

## Remaining fidelity limits — not pixel-identical

This is a reference-driven reconstruction, not firmware emulation or a finished copy of the entire 3DS OS.

- Folder/banner geometry, backdrop motion, cursor timing and settings icon are still authored approximations. No frame-matched animation measurement was possible from the unavailable attached videos / blocked video download.
- Browser-rasterized NTLG is closer than Arial, but it does not reproduce the native CFNT texture sampling, all native metrics, or unverified HUD-specific glyphs. The source is a community conversion, not an authenticated dump from the supplied firmware.
- Notes, Friend List, Notifications, Internet Browser and Miiverse panels are limited local presentations, not the full original applets. The keyboard is functional but is not the complete native software keyboard. There is no camera, Mii editor, shop, title launcher, sound/music, or Nintendo network implementation.
- No drag-to-reorder / drag-into-folder, saved layouts, theme-shop catalogue, or persistent folder content. The portfolio folders intentionally contain no invented content.
- The owner's firmware archive remains encrypted. Layout, model, sprite, shader and animation resources from it have not been recovered. Original folder/banner resources and native applet assets are the next fidelity dependency; this work does not turn a passing test suite into evidence of identical visuals.
