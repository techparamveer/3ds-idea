# HOME live background and Health return evidence

Coordinator branch `codex/home-fidelity-20261001`, evidence base `84138f89`,
production runtime `dda25e9e` including background integration `f5ed204c`.
This checkpoint adds observations, not a renderer change or whole-scenario pass.

Private root `R` below is the absolute directory
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
No new artifacts were written to DeveloperStorage. The historical private
matrix is unchanged; these diagnostics do not replace its acceptance rows.

## H-01: live background

The dedicated production browser ran at `127.0.0.1:3020`, with
`?lcdCapture=1&diagnostics=1`, `--mute-audio`, and app mute verified true.
Fresh Sidecar desktop bounds were `(1800,367,1357,935)`. The blank browser was
independently verified on that display before navigation, then its final frame
was `(1810,397,1150,780)`. Session `3ds-background-20261002`, PID 57432,
profile `R/background-host/browser-profile`; browser and verifier were closed.

Ordinary input selected Notes, Friends, then Notifications from initial Work.
A density-minus touch changed rows 2 to rows 1. Its successful trusted down/up
events were at browser timestamps 164283.9/164661.1ms (377.2ms hold); a preceding
short attempt did not change density and is not counted as successful. The
comparison is not a matched native input replay.

Five raw captures are under
`R/background-host/reference/scenario-matrix/v1/captures/<name>/browser/`.
Each contains `capture.json`, `upper.png` (400x240) and `lower.png` (320x240).
All report `synthetic:false` and muted true. Source-frame overrides were not
used: the scripts waited for the naturally advancing host frame.

| Capture name | HOME updates | Background Loop | Purpose |
| --- | --- | --- | --- |
| `news-live-210` | 12210 | 210 | First live sample |
| `news-live-210-repeat` | 12210 | 210 | Repeat paint without state advance |
| `news-live-210-time72k` | 12210 | 210 | Presentation elapsed 72000ms instead of 12000ms |
| `friend-live-210` | 20010 | 210 | Same background phase, different primary selection |
| `friend-live-240` | 20040 | 240 | Later live phase |

The three News upper PNGs are byte-identical, SHA-256
`eb5e1f5aab5872875b9ad1910623d06410a1978431fca20f348dafdc122c9bc2`.
During ordinary News -> Friend Left input, HOME updates 17305 ->17328 and
background frames 505 ->528 advanced together; Loop epoch remained 1. The
background did not reset when the primary selection changed. Friend frames210
and 240 visibly differ. These establish the bounded browser clock/paint behavior,
not native activation, pause/resume timing or a shared animation epoch.

### Retained-native diagnostic

Native input is the previously inspected Azahar 400x480 PNG
`R/native-frame-step/screenshots/_01.10.26_23.09.38.376.png`, SHA-256
`673e24c50c13a9ff0d583126ea66c3709f4d78938e10b46a2ab73562eb3fc8b0`.
The earlier coarse phase audit selected 210; it did not prove a live epoch.
The new browser sample is paired with that retained image, not a fresh replay.

Full empty-mask comparison `R/background-host/compare-news-live-210/`:

| LCD | Pixels above 2/255 | Mean RGB error | Maximum |
| --- | ---: | ---: | ---: |
| Upper | 4940 | 3.959479 | 238 |
| Lower | 19125 | 10.411072 | 255 |

Report SHA-256 `d26e29ecca6faaa3b9ad7578fac21d8278c6ad0a62de586109f16f685e77478b`;
empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Both upper/lower contact sheets were opened and inspected. Visible residuals
include opposite News banner orientation, HUD network/battery state, title-plate
edges, footer edges and intentional portfolio tile population/placement.
The result is **unexplained-differences**, not acceptance or a phase-controlled
improvement over older full-screen totals.

### Bounded margin measurements

Wallpaper-only diagnostic margins `(0,25,60,175)` and `(340,25,60,175)` cover
21000 pixels, excluding the central banner and HUD/footer. These are measurement
regions, **not acceptance masks**. Native versus live News 210 has 0 pixels above 2,
maximum 1 and mean 0.051095; 1911 pixels differ by 1. News 210 versus Friend 210 is
exact RGB in these margins. Friend 210 ->240 changes 7724 pixels, 2324 above 2,
maximum 13. No claim extends this bounded static result to the whole wallpaper,
full LCD, native motion, or app return.

Reproduce the assertions with `R/background-host/summarize.mjs`, passing absolute
background-root, worktree and native-PNG paths. It validates captured dimensions,
mute/synthetic flags, repeated pixels and retained-file hashes. Summary SHA-256
`e4a3f6563dbadbaaa0a8e3321ab1e2483c6497b10a409da9074806e19be566a2`.
Capture-script SHAs: `capture-live-background.js`
`319c466baa363534a587790875740af6c753d694b5163d5bee1391633524ebe3`;
`capture-friend-background.js`
`bc83908e9e126cfcdd241f53efca889dfe33fb464fb5f43b0bb9e2703797fabe`.
All five capture JSONs and ten PNG identities are in that summary.

No resource changed. Element -> `models.homeBackground` -> HOME
`0004003000009802` v24576, content 0/`00000082`,
`romfs/3D/BannerBG_LZ.bin`, decoded/delivered SHA-256s and converter
`ctr-cgfx-web` 1.1.0 remain in the [source contract](home-background-host-2026-10-01.md).

## H-12: Health launched, HOME not reached

The existing isolated `R/native-health-suspend-20261002` session was confirmed
live before input; it was not restarted after an observation timeout. Its
seed clone passed all 467 NAND/SD hashes. Executable SHA-256
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`;
launch config `21338fbf97b052acc72b8e146d5f5c792381a14a7f92cf42b83463b8b7cb9d39`.
The correct live-path audit has issues[], SHA-256
`7780fa2f08518f12a9a020fdc4aa0afcc2cb23b06f0af0214cb86148731da122`.
The older `profile-audit.json` incorrectly inferred the snapshot's directory as
the profile root; it is retained but is not isolation evidence.

Original hardware, EUR/English, volume 0, native resolution, standard stacked
layout and actual Vulkan backend were verified. No default/original profile,
firmware package or live config was modified. Only the clone's HOME pipeline
cache had been preserved outside its active cache before launch. Native main
window 15380 was independently read back at `(1810,397,1153,781)` on Sidecar.

The launch uses short `-p R/health-suspend/health-open.ctm` plus this clone's
HOME content. CTM SHA-256
`7387503b9efda52b96e0d5f71d4e49a579ecaccd5d6fcb64a90f4f03330439d0`;
27596 pad/touch pairs, 55192 records. At nominal 234Hz, touch `(10,170)` uses
samples 7020..7028, A uses 11700..11708, with neutral/release elsewhere. Each
hold is 34.188ms. This once reached Health title `0004001000022300` v3077.
Health source/manifest identities remain in the [HOME handoff](workstream-handoffs/home.md).

Movie EOF paused emulation and opened a completion dialog. A Quit request made
the previously unlisted EOF dialog addressable; Quit was cancelled. EOF dialog
15435 was separately verified at `(2226,664,301,167)` on Sidecar before OK.
`Emulation -> Continue` then resumed Health at approximately 60FPS. No user popup
action is outstanding. Native screenshots came from Tools Capture Screenshot
and Command+P (Qt config Ctrl+P); the earlier F12 attempt did not establish a
capture and must not be repeated as a verified shortcut.

| Azahar 400x480 PNG under clone `screenshots/` | Observation | SHA-256 |
| --- | --- | --- |
| `_02.10.26_00.53.33.574.png` | Health main | `97d0908f7bbd31752c7fa5fc86085a2bcbd6830568cbc1adad143269b2d2137a` |
| `_02.10.26_00.54.03.537.png` | Health main again | `0677335cce06b6ead3a9a58e63216768e51526c99b0e3b55877762a5898ec5b2` |
| `_02.10.26_01.00.33.014.png` | After one HOME attempt | `dfa962f3527c057145266806fcf48cd11de176227b47cca957ea31db195ff987` |
| `_02.10.26_01.03.13.802.png` | After bounded fallback | `a37e4666a8595e6521dddf18319513fae96ca4498da0afb70019f3f22602afc4` |

Requested HOME input was one CUA `pressKey('b')`, then eight `b` characters,
then one exact-window foreground `b` through cua-driver after its background
route refused same-PID keyboard ambiguity. These are requested host events, not
measured native holds or notification counts. Each observation briefly lost
the lower controls, but later native PNGs still show Health main. All four raw
lower LCDs are exactly equal. There is **no captured suspended HOME window**,
Resume/Close footer, close dialog or successful native return in this run.
Input delivery versus native-service behavior remains unresolved.

The pinned emulator's [APT button callback](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/hle/service/apt/applet_manager.cpp#L1583)
samples HOME every 16666us and sends a rising-edge notification only with HOME
registered. This is distinct from 234Hz HID/CTM polling; a short host key attempt
cannot be labelled a matched native hold. That source fact does not identify
the cause of the failed route. No RPC/GDB service or unsupported LLE save was used.

Normal Quit confirmation 15521 was independently verified on Sidecar at
`(2227,664,298,167)` before Yes. Native PID 43751/session 52041 exited 0. Final
log `R/health-suspend/log.final.txt` SHA-256
`cf7c81b6cbf282cf1692ac8cd65a20961fd2af731622e71079083f36eea6073f`;
summary `R/health-suspend/summary.json` SHA-256
`0e8ac574ea6221529ccaf39363892c26f8eecbd418dbdea3a83c4fec61398edc`.
The summary retains launch/final config identities, movie plan, inputs and all
PNG hashes. This is a native route diagnostic, not a browser/native pair.

## Remaining work

Obtain a reliable native HOME return before binding a suspended-window pose.
Do not infer that Health cannot suspend, nor call source ScaleUpDown frame 15 a
native settled frame. H-12 implementation stays gated on that observation.
Next background evidence needs matched native/browser activation and advancing
frames, plus launch/pause/resume lifecycle mapping; the bounded margin match
does not close those gaps. HOME idle and Settings Other page 1 remain the first
whole-scenario baseline requirements.

Portfolio content/population, offline service behavior, authored HOME Design/
close-switch UI, fitted native compositions and reduced-motion presentation
remain labelled adaptations or defects. Native banner/HUD/cursor/footer pixels,
input/motion/cue timing, unsupported helpers and suspended-window composition
remain open. Every 3DS session stayed muted; audio acceptance remains open.
No whole scenario passes. No push, shared-branch merge or deployment.
