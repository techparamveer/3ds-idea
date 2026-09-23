# Firmware 10.7.0-32E implementation

## Working agreement

The owner requests the supplied original European firmware's UI and bundled applications inside the existing 3DS portfolio. AR Games and Face Raiders are excluded. Portfolio apps occupy the first eight HOME positions. Browser media access is opt-in; Nintendo networking and unavailable peripherals reproduce offline behaviour. Do not claim full fidelity without native-screen comparisons.

The integration branch is `codex/firmware-os-10-7`. The original `uifix` checkout and existing OS worktrees remain preserved. Baseline changes are recorded under `/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/baseline`.

## Interfaces and ownership

- Asset worker: `scripts/firmware/`, existing DARC/CFNT converters, generated `public/os/firmware/10.7.0-32E/`, converter tests. Native layouts/animations are converted to JSON, texture/font images to PNG. Source packages, executables, keys, certificates and private saves must not enter public output.
- Runtime worker: new application host/registry/storage/capability modules under `src/os/`, changes to `system.ts` and `state.ts`, behavioural tests. Preserve existing reducers and portfolio data interfaces while adding stock titles and nested applets. Do not edit scene or screen-rendering modules.
- Presentation worker: native layout/model presentation modules, `screens.ts`, `portfolio-screens.ts`, bitmap-font integration, CGFX conversion tools and model-specific generated files. Coordinate JSON layouts directly with the asset worker. Do not edit `console-scene.ts`, `system.ts` or `state.ts`.
- Orchestrator: shared contracts, scene integration, audio extraction/playback, artifact paths, Azahar reference, browser verification, integration and PR. All UI automation is centralized.

These are the initial subsystem assignments. A committed slice contract takes
precedence for active work. For live HOME controls, the orchestrator owns
`system.ts`, `home-controls.ts`, browser adaptation and scene journals; runtime
owns the bounded pure controllers and presentation owns the screen painter.
See [the current tile-touch contract](home-tile-touch-contract.md). Reuse the
three separate worker tasks/worktrees, each on Astra Extra High.

The entry manifest lives at `/os/firmware/10.7.0-32E/manifest.json` and has `schema: 1`, `firmware: "10.7.0-32E"`, `region: "EUR"`, `locale: "EU_English"`, source title/version/SHA records, relative `fonts.shared` and `fonts.hud` URLs, relative HOME pack URLs, title metadata, and converted resource size/hash/provenance records. Audio and model records can be appended by separate deterministic compilation commands without changing existing fields. All relative paths resolve against this manifest URL.

OS state and format types must remain independent of Three.js. Presentation receives state, injected calendar/monotonic time and assets. Upper logical pixels are 400×240, lower 320×240; retain the existing 800×240 upper canvas adapter and full-width UVs. No second React copy of OS state.

## Acceptance and evidence

Artifacts, temporary extraction, native and browser captures, recordings, logs and comparisons belong under `/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`, outside the repository. Each worker uses a separate subdirectory. Commit source, necessary browser delivery assets and concise provenance; do not commit scratch files.

First validate native text, HOME chrome, folder banner animation, selection, an effect and HOME music end-to-end. Then expand to included titles. Compare against Azahar at native display sizes and measure animation/audio timing. Passing parser tests or finding a file does not establish visual accuracy. Record unresolved records or rendering differences explicitly.

Run meaningful converter/behaviour tests, type checking, production build and actual browser interactions. Review failures before broadening. Workers commit only their owned changes, send commit IDs and tests to the orchestrator, and do not merge into integration themselves.

## Current HOME checkpoint

Native fonts/chrome, source folder/default banners, retained cursor/effects,
counted direction input, ordinary tile press/release, normal folder close and
native cues/sequenced HOME music are integrated. The renderer and runtime keep
source resource/controller evidence separate from browser scheduling and
lifecycle policies. See [live controls](home-controls-runtime.md),
[tile touch](home-tile-touch-integration.md) and their linked source reports.

The tile-touch checkpoint passed889 tests with two existing optional skips,
typecheck and production build. Its follow-up passed56 focused checks plus a
fresh build. Actual browser checks cover desktop/mobile pointer input, physical
controls, circle pad, keyboard, ordinary app handoff, reduced motion, fallback
and close. Nine static lower-screen regions preserve their prior comparison
metrics against the saved Azahar capture; this is not whole-screen parity.

Stationary long-press entry is the next bounded source audit. Complete native
drag/drop/scroll behavior, broader opening and overlay lifecycles, missing
banner categories and included stock title packs/workflows remain unfinished.
Most stock application screens are still scaffolds. Fresh Azahar interaction
remains dependent on unlocking the Mac. The full goal and final implementation
PR are not complete; do not publish a finished-fidelity claim from this HOME
checkpoint alone.
