# Portfolio OS implementation — uifix

This pass implements the user's confirmed scope: authentic 3DS navigation with working portfolio collection apps, hardware-style power-on, app-launch splashes, and original sound effects where available. It supersedes the earlier instruction to leave four empty portfolio folders. The sourced SPR-001 model, Blender files, shaders, and independent OS worktrees are preserved.

## Delivered behavior

- Black-screen startup alongside the existing spin/open sequence, fading into HOME. A power-button press shows a confirmation menu; power-on boots again. Closing the lid sleeps without discarding the current app.
- Eight installed apps: Work, Side Projects, Hobbies, Life, HackUK, NVIDIA/Renu, About, Contact. Each has real locally curated content from paramveer.co.uk and hackuk.network. Photography has three images; project links only open after explicit Visit input.
- HOME suspends an app and restores its selection, detail page and photograph on resume. Starting another app prompts to close the suspended one. A/B/D-pad, physical controls and touch share the same state transitions.
- Genuine Three.js dimensional banner plaques, rasterized into the top screen. The upper image is drawn at 400×240 and copied without smoothing into the existing 800×240 texture contract; the lower image remains 320×240. Magnification uses nearest sampling, with linear minification for oblique views.
- Hold an icon for at least 450 ms and drag to another HOME slot to move/swap it. Theme, brightness, power saving, folders, layout, mute and volume persist locally. Sound & Layout is accessible from the music-note control in the settings drawer and the semantic control list. Arrow keys navigate these preferences; left/right adjust volume; A activates the highlighted option.
- Original community-distributed HOME WAVs, with browser gesture unlock, persistent mute/volume and clean disposal. No background music. See `public/os/audio/README.md` for exact filenames and source archive.
- Pinch or scroll to zoom in for screen reading; pinch inward/scroll back returns to full-console framing. This deliberate zoom may crop the shell; initial framing remains unchanged.
- Hidden semantic controls, live screen text, reduced-motion support, missing-photo fallback, and local media with no runtime dependency on the source websites.

## Sources and fidelity

Visual baseline: Nintendo's theme-enabled white HOME screenshot and settings/theme captures in `docs/references/home-menu/`. Hardware startup, HOME suspend/resume and the power menu follow the original XL operations manual linked there. Original HOME sound archive 457282 was downloaded and inspected; the similarly titled Activity Log archive was rejected.

Portfolio text is a curated September 2026 snapshot. Alora/Microsoft/Renu have sparse source descriptions, so no unverified achievements have been added. The live HackUK site takes precedence over stale upcoming-event descriptions on the old portfolio. Media and brand provenance are in `public/portfolio/README.md`.

This is a reference-driven portfolio, **not firmware emulation or a claim of pixel identity**. Native toolbar crops and original sounds are used, but CFNT/HUD rasterization, procedural HOME backdrop/cursor timing, folder artwork, and custom banners remain reconstructions. The supplied firmware remains encrypted. The original videos were not retrievable; precise timing is not claimed to have been measured from them. Portfolio application interiors are custom interfaces using the native visual language, not replicas of stock Nintendo applets. Stock games, Mii editing, Camera and Nintendo network services are outside the confirmed scope.

## Verification and iteration

- All 144 pre-existing tests passed. Eight additional tests cover boot/input gating, every installed app, suspend/resume, switch confirmation, power/sleep, bounded detail/photo navigation, explicit links, layout/storage validation, sound preferences and Done actions. The affected legacy menu tests also passed after integration.
- TypeScript and production build passed. No WGSL or model asset changed; browser VGPU status remains `ready`.
- `scripts/verify-portfolio.mjs` exercises actual keyboard, physical-button clicks and touchscreen hits. It captures native top/bottom images and console screenshots, verifies all apps, galleries, power, sleep, persistence, audio decoding/playback, reduced motion and mobile bounds. Evidence: `docs/validation/uifix-apps/`. `home-reference-comparison.png` places Nintendo’s native lower screen at left and the portfolio at right; differing application art/content is intentional.
- Native detail review found redundant page controls on one-page entries; these are now omitted. A detail without an external link has a working Done action.
- NVIDIA's supplied logo had large source margins; the runtime PNG is trimmed from the preserved SVG before fitting the icon. Typography is rendered at native size before texture upload.
- Matched the native two-row grid origin to the reference (40 px from the lower-screen left, 46 px from the top), and removed a duplicated vertical offset in the one-row density. Hit testing uses the same geometry.
- Native two-finger pinch, icon drag/swap, reload persistence and keyboard layout reset passed in `scripts/verify-portfolio-gestures.mjs`; see `gesture-checks.json`.
- Mobile review established that complete-console framing makes text small. Pinch/scroll zoom now provides a reading view without introducing page chrome.

Reproduce against `npm run dev` with `AGENT_BROWSER=/path/to/agent-browser node scripts/verify-portfolio.mjs`. Run `scripts/verify-portfolio-gestures.mjs` with the same environment variables for the focused gesture checks. The shared T3 preview was used first; its host repeatedly disconnected, so the documented browser fallback was used to complete the repeatable pass. No synthetic OS state setter is used for browser tests.
