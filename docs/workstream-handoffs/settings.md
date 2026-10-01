# Settings / Health / helpers: route coverage handoff

1 October 2026. Branch `codex/complete-settings-20261001`, worktree
`/Users/paramveer/.codex/worktrees/3ds-complete-settings-20261001`.
Base: `f5ed204c7955880d59b097a632d48deaa7d80252`.
Delivery: the commit containing this handoff and the test below (exact SHA in
chat delivery; no self-referential commit hash). Status: ready for coordinator
review/integration; native scenarios remain unaccepted.

Owned edits: [settings-completion-routes.test.mjs](../../tests/settings-completion-routes.test.mjs)
and this handoff only. S-01–S-08, G-01–G-06/G-08 audited; G-07 Camera/Sound/Notes
helpers stay delegated. No runtime, source assets, shared map, private matrix or
shared handoff changed. No GUI, browser, native process or audio was used.

## Compact route ledger

Paths below start at Settings main. Existing action-level coverage is in
[stock-apps tests](../../tests/stock-apps.test.mjs); the new 19 tests cover
previously missing full-menu touch/reducer wiring and directional A equivalence,
button-up nonactivation, every leaf's touch/B return and A reopening, blocked
operations and unchanged shared data. Touch points come from the production
[shared target layout](../../src/os/stock-screen-layout.ts), so these tests do
not independently establish source geometry, readiness or physical raycasting.

| ID | Menu and every choice | Return / implemented boundary |
| --- | --- | --- |
| S-01 | Main: Internet, Parental, Data, Other, NNID | First four enter menus; NNID emits only its helper launch. Main B/HOME/close already covered elsewhere. |
| S-02 | Internet: Connections, SpotPass, DS Connections, Other Information; Connections: Connection 1, 2, 3, New Connection | All seven detail leaves are read-only; Back restores immediate parent row, A reopens it. No connection setup/network effect. |
| S-03 | Parental Set → explanation Next → PIN notice OK | Touch OK dismisses to explanation/Next. Restriction/PIN actions have no reachable entry; native OK would continue to PIN (adaptation). |
| S-04 | Data: Nintendo 3DS, DSiWare, StreetPass, Reset blocked users; Nintendo 3DS: Software, Extra Data, Add-on Content, Save Data Backup | Seven leaves; Back restores row. No deletion/reset/backup operations. |
| S-05 | Other 1: Profile, Date & Time, Touch Screen; Profile: User Name, Date of Birth, Region, DS Profile; Date & Time: Date, Time | Seven leaves; values cannot be edited. Existing tests explicitly cover Profile/Clock Back rebuilding Other 1 unfocused at logical Profile, rather than restoring Clock focus. |
| S-06 | Other 2: 3D Calibration, Sound, Mic Test | Three leaves; mode/OK/device operations inert; Sound Cancel returns to row 1. |
| S-07 | Other 3: Outer Cameras, Circle Pad, System Transfer | First two are read-only leaves. Transfer emits its helper launch only; Circle Pad does not invoke `extrapad`. |
| S-08 | Other 4: Language, System Update, Format | Language/Format read-only leaves; Update emits helper launch only. Existing language input/motion tests own arrow/drag/clamp behavior. |
| G-01/02 | Health: 3D, General, Usage → article → Back → same article | All three touched/direction-selected entries checked. Scroll then Back drops article controls; current menu return resets row 0, not the departed article. Re-entry begins at scroll 0. Native return focus still needs comparison. |
| G-04 | Settings HOME Manual → Contents → Important Information (index 0) → Back → reopen | Added touch Back/reopen and all remaining page-action guards; X/A/B and first-row touch already tested. Later pages 1–31, Language/Enlarge and scroll remain inert. No-title Portfolio Guide's three local article/Back routes already covered by helper tests. |

There are 28 Settings detail leaves in the ledger. Four Other pages are reached
through their actual numbered touch tabs. Existing tests cover Left/Right bounds,
source inactive entry focus, Data tile neighbors and Settings main neighbors.
Helper touch entry retains the parent's inactive pose; directional A retains its
active pose. The test compares the same destination/selection/effect and explicitly
preserves this difference, rather than asserting identical parent focus.

[Helper-return tests](../../tests/settings-helper-return.test.mjs) own NNID,
Transfer/Update retained-parent, HOME, close and return sequences. This slice
adds no duplicate host ownership sequences; Lifecycle owns that workstream.

## Missing screens, inert controls and callers

| ID | Source components / current behavior | Concrete remaining gap or adaptation |
| --- | --- | --- |
| S-01/02 | Main, Internet and empty Connections source layouts exist | Internet SpotPass/DS/info and connection details/setup use local informational bodies; native leaf composition/entry motion unverified. |
| S-03 | Intro, explanation and PIN notice layouts/messages exist | Configured restrictions source layouts are delivered but unreachable; no PIN/account operations. Notice dismisses locally and keeps explanation upper LCD (adaptation/unverified upper mask). |
| S-04 | Software/Extra Data accessible-empty SD source lists exist | DSiWare/StreetPass/blocked users/Add-on Content/Backup bodies are informational adapters. Native free-block data, wait icon and entry sequencing remain open. |
| S-05 | Profile, Birthday, DS Profile and Date/Time components exist | User-name/region presentation and Touch preview are local adapters; arrows, value fields and confirmations do not edit. Region/native calibration flows absent. |
| S-06/07 | Sound source Surround/Stereo/Mono and Cancel/OK; Other icons | Sound modes/OK inert by scope. 3D/Mic/Outer Cameras/Circle Pad bodies are generic previews; no capture, microphone permission or calibration. |
| S-08 | EUR Language source list, slide bar and Back/OK | Rows/OK cannot change locale; held-arrow/groove/D-pad behavior still unproven. Format has an informational body; destructive confirmation absent by scope. |
| G-02 | Three source Health articles, scroll reducer and original glyphs | Upper phase fit, browser catch-up/cancellation and Back press/release adapter remain adaptations; native timing/cues and return-focus comparison open. |
| G-03 | amiibo opening renders source menu; only Close works | Register/Delete/Reset/Update inert. No established production caller; no HOME tile may be added to fill the gap. |
| G-04 | Manual source Contents lists 32 pages; first article and adjacent page-2 preview delivered | No later-page navigation, actual scrollbar, Language/Enlarge; adjacent preview is not an enabled page. Capture-fitted Contents/page placement and Portfolio Guide body remain adaptations. |
| G-05 | NNID Back, Transfer choices/read-only details, Update Cancel/source OK | NNID unsigned-in native body absent; authored unavailable notice. Update OK inert. Direct helper launch/caller arguments and local availability text are adaptations. |
| G-06 | `extrapad` Next/info/Back; Mii selector source chrome and saved-name/empty projection | Both internal registry entries have no established production caller. Selector confirmation inert. Settings Circle Pad stays a detail, not an invented caller. |
| G-08 | `error` generic message/OK completion reducer | No native stock presentation mapping or established in-scope caller; source/route gap, not a Nintendo dialog. |

The new stale-action checks prevent the Settings paths under test from becoming
amiibo/extrapad/Mii/error callers. They are not a global proof of caller absence;
that audit also inspected `system.ts`, `app-host.ts`, registry and stock dispatch.
No new helper entrypoint, native graphic, sound or behavior was invented.

## Evidence and source identities

This is a test/documentation delivery, not a new extraction or visual change.
No firmware pack was materialized in the sparse checkout. Source identities below
are inherited from checked-in evidence, not freshly rehashed private inputs:

- Settings `0004001000022000`, EUR 10.7.0-32E, content 0/`0000003d`,
  `ExeFS/code.bin` SHA-256 `1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
  Internet `NetTop_D_01`, Connections `NetSetTop_D_00`, `B_CnctW1/2/3`,
  English `mset/net_set`, `net_bg24`, `net_ds_card`, `net_option` bind through
  `packs/settings/contents/0000-0000003d/{layout,button,message_EU}.json`.
  [Source subpages](../native-settings-subpages.md) and
  [PIN presentation](../settings-parental-pin-presentation.md) specify mounts.
- Manual applet `0004003000009b02`, `ExeFS/code.bin` SHA-256
  `cf4658f9f618a41f8d32ff7aed40d0ea565da78a2ace349cb93698ff5f7df5d8`;
  Settings Manual content 1/`00000038`,
  `Manual.bcma/EUR_en_index.arc/blyt/Index.bclyt`, manifest pack
  `packs/settings/contents/0001-00000038/manual-EUR_en.json`.
  [Helper presentation](../native-helper-presentation.md) and
  [scrollbar audit](../manual-page0-scrollbar-source-audit-2026-09-27.md)
  retain element mappings and unresolved owner/vector/initial-offset writes.
- Health `0004001000022300` v3077, `code.bin` SHA-256
  `74c813cc1f00a67c06ad85e10723b1440949b2d448e2e1f5532d2a61fb57600c`;
  [scroll audit](../health-touch-scroll-source-audit.md) records replay provenance.
  Pack title versions, per-resource hashes, exact CIA-internal paths and converter
  versions not quoted here must be resolved from the manifest/resourceSources
  before any new source claim or asset edit. This slice adds no provenance claim.

Implemented: existing runtime only. Tested: 19 new regressions pass with Node
v22.23.2, command `/Users/paramveer/.local/bin/node --test tests/settings-completion-routes.test.mjs`.
Focused regression run: **134 passed, 0 failed/skipped**, adding existing
`stock-apps.test.mjs`, `stock-screen-layout.test.mjs`,
`settings-language-input.test.mjs` and `health-scroll.test.mjs` to that command.
Log: `/tmp/3ds-settings-completion-focused.log` (internal temporary disk).
Independent read-only review found one documentation count error (Data has seven
leaves, 28 total); corrected before commit. No remaining actionable findings.
Relative handoff links and `git diff --check` pass. No dependency install,
full suite, typecheck or build was run; coordinator owns integrated checks.
Browser-inspected/native-compared this slice: none. No capture pair, mask, diff
report or private artifact was produced. Historical [progress](../progress-2026-09-24.md)
records Settings main 0/20 over 2, Other 1 static 0/0 (max 2), Health Usage top/8px
static tier, and Manual page 0 at 3,054/2,071 over 2 after `8cbee36`.
All remain failing whole scenarios; no new acceptance follows from these tests.

## Coordinator capture tickets

**First: `settings-internet-connections-roundtrip` (S-01/S-02).** Use a stopped
isolated EUR/English/original-hardware seed with empty Connection 1–3; record seed,
profile/title/build hashes and confirm actual initial connection state. Keep native
and browser muted, verify each window on Sidecar before interaction. Start with
Settings selected at HOME, use one complete A press/release and wait for both LCDs
ready. Capture `00-main`; touch lower logical `(86,77)` to Internet, capture
`01-internet`; touch `(160,56)` to Connection Settings, capture `02-connections`.
Then B press/release → `03-internet-return`; B → `04-main-return`; A →
`05-internet-reopen` to verify Internet selection retention. Browser and native
must receive the same semantic press/release sequence; retain input/update timing,
not repeated typed characters. Do not tap New Connection or run connection tests.
If the seed has configured connections, stop this empty-state comparison and record
the dependency instead of changing the profile or asserting a match.

Capture Azahar-owned 400×480 PNGs and raw browser upper 400×240/lower 320×240 for
every named checkpoint, settled plus first visible/transition frames with measured
update counts. Native crops: upper `(0,0,400,240)`, lower `(40,240,320,240)`.
Start with empty masks; record HUD date/colon/battery phase and explain any later
mask. Diff whole LCDs, plus lower Internet `(28,23,264,175)`, Connections
`(12,19,296,168)` and Back `(0,208,120,32)`. Hash all inputs/PNGs/masks/reports and
open both LCD comparison sheets. Scope-limited bodies/operations remain adaptations,
not pixel excuses. Exact input/motion unverified; audio remains open while muted.
Store under internal
`/Users/paramveer/.codex/3ds-artifact-overflow/settings-completion-20261001/settings-internet-connections-roundtrip/`.

**Manual: `settings-manual-page0-scrollbar` (G-04).** From Settings-selected HOME,
activate Manual, capture Contents, then touch first row `(160,86)`. Capture article
entry and settled page 1 before input. Record native page identity and scroll offset;
upper diagnostic crop is `(363,41,6,145)`, with full upper/lower comparisons retained.
Apply one Down press/release, then a measured held Down (record actual sampled
updates), release and capture each outcome; if native ignores Down, retain that
result and do not invent scrolling. B returns to Contents, reopen page 1 and capture
reset state. Browser currently ignores article directions; record that route gap.
No upper-LCD touch is possible. Required source dependency before implementation:
resolve Manual vtable `0x1b8f20` to the Settings page scene, indicator vector and
initial offset feeding `0x139de4`/`0x143074`; existing 145px observation alone is not
source geometry. Use the same raw formats/hash/mask/sheet procedure above under
internal `.../settings-completion-20261001/settings-manual-page0-scrollbar/`.
Stop after recording these defects; dispatch a bounded source/render task from the
named pair. No guessed scrollbar or later chapter route is authorized by this ledger.
