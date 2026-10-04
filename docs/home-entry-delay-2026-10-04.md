# HOME Entry Footer And HUD Delay

Runtime `5973bcd6` (integrated in `3ds-home-fidelity-20261001`). This pass
times the post-boot footer and HUD SceneIn against the frozen Azahar HOME
initialization from the [entry staging pass](home-entry-staging-2026-10-03.md).
That pass delivered their order but started both clips at the first HOME
update.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-entry-delay-20261004/`.
Native PNGs: `native-folder-switch-20261002/screenshots/home-entry-staging-20261003/`
(73 own PNGs at 5% playback, about 1.07s apart).

## Native Time Base

`R/entry-band-fit2.mjs` compares native bands, in direct coordinates, with
actual browser LCD pairs at recorded HOME update deltas:

- Footer band (lower y 212..240): native shows no footer through N053, pose
  about 5 at N054 and 8 at N055, settled by N057 (MAE 0.15..0.26).
- HUD band, restricted to columns where the settled native and browser HUD
  agree (excluding clock, labels and counters): before the HUD appears these
  columns show wallpaper. Its phase steps exactly three updates per capture
  (N051..N054), which gives the capture rate. N061..N066 fit HUD poses 22..38.
- The boot fade's upper luminance places SceneIn pose 13.8 at N049 and 16.8
  at N050, so pose 20 first shows near N051.

On that grid, footer SceneIn 0 lands about 3.8 frames after fade pose 20
first shows. HUD SceneIn 0 lands 3.8-4.5 frames after the footer (average
over N061..N066). Browser boot pose 20 shows one frame before HOME update 0.

## Change

Worker `3ds-home-entry-delay-20261004` / `codex/home-entry-delay-20261004`:
`1609d7b3` -> `03dd2450` offsets the entry owner's footer by three updates and
its HUD by nine. Recapture cross-check `93f7ddf8` -> `5973bcd6` corrects the HUD
to seven, after the first fit had used 3.2 rather than three updates per
capture. Footer SceneIn now runs at updates 3..17, and the HUD stays at zero
alpha until 27 and first shows at 28. The footer terminal and banner receipts,
banner gating and reduced motion are unchanged in kind. Both delays are
**fitted adaptations**; the native clip caller is untraced.

## Verification

Independent review of `1609d7b3` found no defect and confirmed that no other
consumer assumes frame equals elapsed. Integrated `5973bcd6`: full suite 1994
pass, 0 fail; typecheck and production build pass (`R/tests-7.log`,
`R/build-7.log`).

Warm power-off/on recaptures (`R/capture-entry.mjs`, SHA `c36374ab...`, from the
staging pass) through the muted CDP 9320 browser and preview 3021, errors `[]`:

| Run | Pairs | `result.json` SHA-256 |
| --- | --- | --- |
| `R/hud7-desktop` | 28 | `c16a3ef782085aad7cb0b932438a1d167c976e727dd5ef70d9a88d38a2a1e280` |
| `R/hud7-mobile` | 28 | `c65c6fca9e03e5ff0c835e16ad4e026bedbf7aa4a6f9793e5e253638f4161f5c` |
| `R/hud7-reduced` | 3 | `fdb9dc343af64da2fda28b7662bc7bd81c36bfd441045d979a1b1162162f34e6` |

`R/entry-band-fit-hud7.txt` (SHA `b07143fb...`): native footer N054 maps to
browser update 8 (pose 5). Aligned on it, native HUD captures N061..N063
land exactly on browser updates 29, 32 and 35. N064..N066, mid-transition,
fit within two updates. The wallpaper phase stays about eleven updates ahead,
consistent with native HOME updating during the boot fade. That shift is
visually negligible (column MAE about 0.05) and remains open.

## Remaining

Capture spacing (three frames) limits both delays to about one frame. Native
HOME updates during the boot fade, the exact native boot epoch, banner pixels,
HUD content (clock, status) and whole-scenario acceptance remain open.
Whole-scenario status remains fail.
