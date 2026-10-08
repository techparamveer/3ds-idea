# STATUS — 1:1 firmware UI

Rewrite this file whenever `HEAD` moves or localhost starts or stops.
If this SHA disagrees with `git rev-parse HEAD`, git wins; rewrite this file before any worker.

Updated: 8 October 2026.

## Nvidia animation branch

This isolated user-requested portfolio branch is `codex/nvidia-transform` at
`/Users/paramveer/.codex/worktrees/nvidia-transform/3ds-idea`, based on
`5ee6fd7a42b0239c5f55f375f85593289a0ff532` from current clean `main`.
The historical fidelity checkout below no longer exists. Git inventory wins.
Scope: Blender-authored transparent Nvidia box-to-logo banner, a labelled
portfolio adaptation. No native firmware scenario is changed.
Private scratch uses `/Users/paramveer/.codex/3ds-artifact-overflow/nvidia-transform-20261008/`
because the repository instructions prohibit new artifacts on DeveloperStorage.
Preview: `http://127.0.0.1:3048/?lcdCapture=1`, production build from this branch.
The isolated browser session has app mute enabled and volume zero.
Delivered and browser-inspected; see [Nvidia notes](docs/nvidia-transform-2026-10-08.md).
Implementation commit: `efe4e8da743a90ed67e817c7bd0b0da4d7d87e7f`.
This checkpoint records that implementation; use Git for the current documentation HEAD.
Revision 2 starts from checked HEAD `7f06ecf3a60894d5682817c05a5e3e7f2951227f`.
User correction: follow reference proportions and reveal, add opening cube spin,
play once and hold logo; remove reverse and loop.
Revision 2 implementation: `a524cee`. Implemented and browser-verified: full opening spin, closer reference
reveal, visibly extruded white lettering with dark sides, one-shot playback and
indefinite logo hold. This earlier preview is superseded by revision 3.
Revision 3 starts from checked HEAD `4409fb4eddead4a86141f278c5b92bed56bef565`.
User rejected the eye motion. Scope: cube/eye only; preserve wordmark, opening
spin and one-shot hold. Compare every source frame and inspect other banners.
Revision 3 implementation: `26148697835b5c6920caf21f03d18b9682fb61f9`.
This documentation checkpoint records that implementation; Git supplies its own HEAD.
Revision 3 implemented: video-derived extruded pixel poses replace the eye wipe;
source timing is 30000/1001 fps. Wordmark is unchanged. Muted preview at port
3048 serves revision 3. Full video silhouette comparison and one-shot browser
checks pass with documented raster-edge residuals; exact 1:1 remains unclaimed.
Revision 4 starts from checked HEAD `605858d2cce583fe862f43f61a943527384ceacd`.
User asks for flat lettering again; remove wordmark depth, bevel and tilt.
Revision 4 rendered and served on the isolated muted port 3048 preview.
Revision 4 implementation: `9ef09d407c34b999b6d7b114a4182643eec89215` (Git supplies the documentation checkpoint HEAD).
Revision 4 browser-inspected: flat graphite text on the NVIDIA HOME banner.
Typecheck, build and shader pass; full suite retains the known missing Camera
fixture failure (2,167 pass, one fail). Next: user visual review. Native queue remains unrelated.
The historical serving/seats/evidence below are preserved, not verified live.


## Product

The page shows only an original **2012 Silver + Black Nintendo 3DS XL (SPR-001)** and its background. Firmware on the two LCDs is **EUR 10.7.0-32E**, English. Eight portfolio apps sit on HOME (Work, Side Projects, Hobbies, Life, HackUK, NVIDIA/Renu, About, Contact). In-scope stock UI: HOME, Settings and helpers, Health, Camera (gallery), Sound, eShop, Zone, Notes, Friends, Notifications, local Browser and Miiverse, amiibo opening, power and launch. Software Keyboard and the six plaza-style titles stay out.

**Done-means:** same inputs in isolated Azahar and the production browser; Azahar 400×480 PNG versus raw LCDs 400×240 / 320×240. Tests, source renders, and a browser look never pass a scenario. Whole-scenario 1:1 is unproven.

**This run:** reconcile (git wins on SHA) then continue from **Next**. Scope fights: [docs/portfolio-ui-scope.md](docs/portfolio-ui-scope.md). Hardware photographs: [GOAL.md](GOAL.md).

## Checkout

| Field | Value |
| --- | --- |
| Path | `/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001` |
| Branch | `codex/home-fidelity-20261001` |
| HEAD | `3b2655a15fd791402bfd40a172bd828b11fc2242` (Settings pairs re-dated). U23 title sampling `73db7a2b` + U23R `30ca4634` on top of Grok native-pair docs `35171903`. `:3000` rebuilt at `a1ee775a` after the Grok coordinator stopped; integration preview at `:3001` from `/Users/paramveer/.codex/worktrees/3ds-integration-preview` |

Runtime clamp `c8a56cba`. Recapture note `eb501e00`. Camera HNI badge bind `d9ddf309`. Date-group bind `5c0199f4` recaptured (fill `(255,161,0)`). Slider source-gap `e6bcca9f` (Grok 4.6 **APPROVE** `90be3135`). Photo-crop source-gap `b75f275d` (Grok 4.6 **APPROVE** `9d3237b6`). Date-text source-gap `82a16d1c` (Grok 4.6 **APPROVE** `62457c68`). Selection source-gap `9c431d1d` (Grok 4.6 **APPROVE** `43173720`). Settings-footer X-scale `99a4362e` (Grok 4.6 **APPROVE**; recapture `d6ce9913` Settings **954→630**). Remaining Settings third then `TxtSet` source-size `9580641b` (Grok 4.6 **APPROVE** `3e9c5170`; recapture `3bdc3192` Settings **630→0**). Welcome p5 live-feed source-gap `679db045` (Grok 4.6 **APPROVE** `f14c2241`). Sound Next `Guid1TxtW` source-size `269e8757` (Grok 4.6 **APPROVE**; recapture `a5b8aa9e` interior **195→0**). Sound volume live-slider source-gap `11f3cb3c` (Grok 4.6 **APPROVE** `c4f0fb90`). Sound Span live-spectrum source-gap `57b04572` (Grok 4.6 **APPROVE** `7614c291`). Sound birds held-offset source-gap `9e335f3a` (Grok 4.6 **APPROVE** `f67628f3`). Sound battery underbar-partition source-gap `76a3635a` (Grok 4.6 **APPROVE** `684a3418`). Sound UnderBar Line01 partition source-gap `6db7e7ef` (Grok 4.6 **APPROVE** `d0d96201`). Sound empty-entry row 1916 source-gap (Grok 4.6 **APPROVE** `2807aeb5`). Sound first-run guide perimeter compositor source-gap `02a60c52` (Grok 4.6 **APPROVE** `6cc31903`). Sound empty-entry mid `S_BG` constant source-gap `636976ad` **REJECTED** by Grok 4.6 (native is dump `S_BG_Grid` ETC1 checker `(223,215,206)`/`(231,223,215)`, bound on library path only); grid bind `603c5388` (Opus 5.5) recaptured: empty-entry lower **16021→7216**, mid **2255→0** / **1024→0**; Grok 4.6 **APPROVE-WITH-NITS** `de5c6445`. Leftover queue `cccf162e`. Camera Welcome p3 `TxtDlg` **1079** source-gap `57af95dd` (Grok 4.6 **APPROVE-WITH-NITS** `7e8e13a1`; host-gate probe `1863c4e4` **APPROVE-WITH-NITS** `42d62c69`). Sound upper 316 labelled `14533857` (volume overhang **42** + `S_Back_U` **274**; Grok 4.6 **APPROVE** `daa93bca`). Camera large thumbs `PicL_SD` bind `89efb7a3` (recapture `6499f0af` lower **10158→8958**). Camera Slideshow header source-size `04f3d6bf` (recapture `5d25e2a5` header **837→0**). Camera thumb interiors 56×42 sample source-gap `84d636e3` (Grok 4.6 **APPROVE** `2258268a`). Product `acabb7af` kept. y=177 `22e8b0a4` (Grok 4.6 **APPROVE** `9fe268f8`). Slider 57 (Grok 4.7 **APPROVE-WITH-NITS** `444ba8e0`). GitHub `/Volumes/DeveloperStorage/GitHub/3ds-idea` on `dev-size-opt` is not this site.

Dead T3 parents `4a686b7b` / `d4492840` / `d1bc835d` / `580fab2c` / `42eb773b` / `f3c9a760` / `1b455c11` / `3144c062` / `bdb9a612` are not this Coordinator. Do not reconstruct them. The 2485-item orchestration thread `bdb9a612-2378-4e0c-b7e1-6ca2c022ef42` died; this thread is the living coordinator.

## Serving

`127.0.0.1:3000` `LCD_CAPTURE_OUTPUT_ROOT=/Volumes/Sandisk1/3ds-fidelity-artifacts/lcd-export-20261006 npm run start:verify` listen 98253 from this checkout at `a1ee775a` build. Playwright reinstalled at `/Users/paramveer/.codex/3ds-artifact-overflow/claude-browser`. No Sidecar attached (built-in display only). Isolated Azahar **not running** since ~17:05 BST (was pid 1137; `./Azahar.app/Contents/MacOS/azahar` from `/Volumes/Sandisk1/3ds-portfolio-azahar-isolated-20260926`). SHA `3dfdfbed…`. Never `/Applications/Azahar.app`. One isolated NAND only. Volume 0. Nintendo Zone skipped. Pixel acceptance remains Azahar own 400×480 vs raw browser 400×240 / 320×240.

## Seats

| Seat | Who | Cap |
| --- | --- | --- |
| Coordinator | Claude Opus 5.5, T3 `mcp:2b23e5fb` (sole live coordinator). Grok 4.6 Cursor session `agent-36cc596c` stopped ~17:05 BST (Cursor app closed; last edit committed in `6d89c7d6`). Subagents via `cursor-agent -p` CLI (T3 delegate_task returns `parent_not_active`) | one |
| Worker | none running. Next U25 Settings Manual p0 (`ScrollIndicator` bind + text raster) waits on an official native Manual p0 | two |
| Reviewer | U20R–U23R Claude Opus 5.5 **APPROVE-WITH-NITS**; U24R2 Grok 4.7 xhigh **APPROVE-WITH-NITS** `8dc8c1c6` (Claude rate-limited; T3 delegate_task `parent_not_active` → subagents via `cursor-agent -p` CLI, outputs in `/Volumes/Sandisk1/3ds-fidelity-artifacts/agent-runs-20261006/`). Nits logged, not fixed | one, different model from the worker |

## Evidence on this tree (static stills; input, motion and audio not compared)

| Scenario | Upper | Lower | Artifacts |
| --- | ---: | ---: | --- |
| `home-idle` Health 1-row left-anchor vs official Azahar `_06.10.26_13.55.03.154.png` `ebbc2743…` at `9f14e0cc` (empty mask `dc4b320b…`) | **23182** | **14754** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/home-idle-20261006/` report `f5d9435f…`; browser `441d366d…` / `656f808f…`; lcdDate `2026-09-25T10:52:00Z`; native vacant neighbor vs browser Settings; HUD clock/battery live. Not pass |
| `home-compact-health-camera` vs official `_06.10.26_14.40.41.189.png` `93058283…` at `8c612e04` (empty mask `dc4b320b…`) | **30032** | **47436** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/home-compact-20261006/` report `f2fceb55…`; Camera browser `b368f61d…` / `ac6485d2…`; Settings browser half kept `8d1b17ab…` / `50d721ec…`. Native: Health compact sleep + Camera + 2-row + Mii/StreetPass. Browser: Camera banner + 1-row Health\|Settings\|Camera. U19 STOP `2b384723`. Not pass |
| `settings-internet-connections-roundtrip` vs official `f0c5d093…` after U21+U22+U23 (preview `:3001` build `3186f1ec`; browser lcdDate = native screenshot time; empty mask) | **169** | **1008** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-title-sampling-20261006/internet-dated/` report `1f258627…`; browser `8bd51bb6…` / `7db2f398…`. Upper = HUD clock/battery `[339,5,394,14]` (same 169 class as Other p3/p4). Lower = native first-run helper face + AA. Not pass |
| `settings-data-software-empty` root vs official `686d3dfb…` after U21+U22+U23 (preview `:3001` build `3186f1ec`; browser lcdDate = native screenshot time; empty mask) | **14** | **177** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-title-sampling-20261006/data-dated/` report `0f8c7442…`; browser `c55280db…` / `d99efd12…`. Upper **14** = one title stem column x=248. Lower AA max Δ41. D-pad focus uncaptured. Not pass |
| `settings-data-software-empty` list vs official `9c5cb75c…` after U20+U22+U23+U24 `SD Card` lcd sampling `22490950` (U24R2 Grok 4.7 **APPROVE-WITH-NITS** `8dc8c1c6`) (preview `:3001` build `70c4b070`; lcdDate = native time; empty mask) | **6** | **22** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-sdcard-label-20261006/software/` report `74ee4570…`; browser `928fe9e8…` / `379919e6…`. Upper 6 = description-edge px in `TextBox_00` (319,195-196; 179,212-219). Lower 22 hairline. Not pass |
| `settings-data-extra-empty` vs official `_06.10.26_15.10.40.169.png` `7c7f2f93…` at `8c612e04` (empty mask `dc4b320b…`) | **6989** | **51927** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-data-parental-20261006/extra/` report `df368b47…`; browser `24d456d5…` / `f5b70337…`. Native ? row vs browser empty copy. Same 65536 blocks gap. Not pass |
| `settings-parental-pin-boundary` vs official `98fb3d62…` after U22+U23 (preview `:3001` build `3186f1ec`; browser lcdDate = native screenshot time; empty mask) | **169** | **0** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-title-sampling-20261006/parental-dated/` report `74ecb2b3…`; browser `57362ce8…` / `b571493f…`. Upper = HUD `[339,5,394,14]` 169 class. No PIN. Not pass |
| `health-general` vs official `_06.10.26_15.17.30.791.png` `c63b1153…` at preview `:3001` `70c4b070` (empty mask `dc4b320b…`) | **0** | **0** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/health-general-frame-sweep-20261006/` report `f6d1afbb…` **pixel-threshold-pass** max Δ2; browser `bfdf9da2…` / `1d829435…` at `lcdHealthFrame=252` (sweep; was frame 15 → 23993), lcdDate = native time. Static still only; TopLoop launch timing, input, audio not compared. Not whole-scenario pass |
| `health-general-held-down` vs official `_06.10.26_16.05.17.323.png` `5593d9d3…` at `7b47bd57` (empty mask `dc4b320b…`) | **24904** | **19206** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/health-held-down-20261006/` report `abb7e07a…`; browser `a0e63170…` / `cc80acbe…`. General after 18 Down taps. Upper TopLoop. Lower paneY: native half-clipped WARNING vs browser full bullet. Thumb-drag still owed. Not pass |
| `camera-sixcell-browse` vs official `_06.10.26_16.19.55.191.png` `7f67f64b…` at `7b47bd57` (empty mask `dc4b320b…`) | **94661** | **16898** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/camera-folder-20261006/` report `7194813a…`; browser `d6086990…` / `1649ce00…`. Renu View Photos. Native date-group + 3 thumbs vs browser 6-photo grid. Folder native still owed. Did not Shoot. Not pass |
| `settings-nnid-unsigned` vs official `_06.10.26_15.02.14.961.png` `cc610faa…` at `4bb5d136` (empty mask `dc4b320b…`) | **82096** | **74907** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-nnid-20261006/` report `6ca33395…`; browser `6ea86f3a…` / `c1a5b348…`. Native Sign in chrome vs portfolio Account-services-unavailable. Labelled adaptation. Did not Sign in. Not pass |
| `settings-system-transfer` vs official `_06.10.26_15.45.04.222.png` `01ff4af3…` at `8c612e04` (empty mask `dc4b320b…`) | **22816** | **76797** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-transfer-20261006/` report `dd2ae5b0…`; browser `0e531310…` / `b1d9a863…`. Native eShop-required dialog vs portfolio 3DS/DSi choices. Labelled adaptation. Did not launch eShop. Not pass |
| `settings-other-page1-home-a-touch` vs official `98d0fc9d…` at U23 (preview `:3001` build `3186f1ec`; browser lcdDate = native screenshot time; empty mask) | **117** | **0** | `/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-title-sampling-20261006/other-dated/` report `e5f37367…`; browser `8ed59bee…` / `809e0f98…`. Upper 117 = HUD `[353,2,363,16]` only (was 217). Held 0/0 vs `424ffb45…` remains. Not pass |
| `browser-start-menu-local` vs official `_06.10.26_15.37.10.852.png` `e8562da9…` at `8c612e04` | — | — | `/Volumes/Sandisk1/3ds-fidelity-artifacts/browser-start-20261006/` native-only. HOME toolbar → Open is System Update required, not start menu. Update excluded. **blocked**. Welcome pair still mismatch. Not pass |
| `settings-other-page1` vs native `424ffb45…` at runtime `5c3903da` (Mac built-in, date `2026-09-26T03:31:10Z`, HEAD `22b13f20`) | **0** | **0** | `regression-recapture-20261005/settings-other-page1/` report `c3481bf7…` max Δ2; held |
| `settings-other-page3` / `page4` vs natives `76ff0914…` / `32509749…` at `603c5388` | **169** | **8** / **35** | `regression-recapture-20261005/settings-other-p34/` reports `d7fe7218…` / `5b9a9133…`; counts held; upper **169** dump-bound Bat 4/5 + `T_TimeC_00` `a74309f6` **APPROVE** `1cb78f2f` |
| `notifications-list-unread-dot` vs native `58fff714…` at `c8a56cba` (Mac built-in) | **0** | **0** | `home-fidelity-20261001/notifications-scrollbar-1-clamp-recapture-20261005/` report `34eb7d08…` lower `8a624950…` |
| `camera-readonly-view-photos-page1` HNI vs native `cae793c3…` at `3bdc3192` (Mac built-in, SDMC) | **33522** | **7491** | `home-fidelity-20261001/camera-settings-txtset-recapture-20261005/` report `b7da8109…` lower `2657bb85…`; header y<32 **0**; Settings third **630→0** **APPROVE**; date pane **1006**; slider **1992**; photo crop labelled; selection labelled **APPROVE**; thumbs interiors **846/918** labelled **APPROVE** `2258268a` |
| Camera Welcome p3/p4 vs natives `3ad989b5…` / `38c19ca0…` at `1863c4e4` | — | **2479** / **2093** | interiors **1078** / **692**; p3 **1079→1078** (one pixel); p4 held; host-gate `1863c4e4` **APPROVE-WITH-NITS** `42d62c69`; recapture `camera-welcome-gate-recapture-20261005/` reports `039e9887…` / `7d33cdf2…`; colour spans still keep the direct sampler off |
| Sound first-run vs native `9dea0cc2…` at `a5b8aa9e` (Mac built-in) | **6094** | **6072** | `home-fidelity-20261001/sound-guide-next-recapture-20261005/` report `3aeaf442…` lower `d78f43b6…`; interior **0**; Next **0**; perimeter **6072** = **860** dimmed grid + **4416** half + **728** (**144** row + **53** footer + **531** within 2) + **68** fringe; veil **REJECT** `be862ce6`; subsets **APPROVE-WITH-NITS** `d72ab4b1`; volume **130** labelled **APPROVE**; Span **2314** labelled **APPROVE**; birds **1558** labelled **APPROVE**; battery ROI **1** labelled **APPROVE**; Line01 `(92,220)` labelled **APPROVE** |
| Sound empty-entry vs native `65fc5f88…` at `603c5388` (Mac built-in) | **6222** | **7216** | battery **183→1** labelled **APPROVE**; Line01 labelled **APPROVE**; row **1916** labelled **APPROVE** `2807aeb5`; mid-body `[41,96,47,48]` **2255** / under-lip `[136,116,48,28]` **1024** `S_BG` constant gap `636976ad` **REJECTED**; `S_BG_D-Grid` bind `603c5388` **APPROVE-WITH-NITS** `de5c6445` recaptured lower **16021→7216**, mid **0**/**0** (`sound-grid-recapture-20261005/`, lower `860b3222…`); slider ROI **4271→377** (checker **0**; **57** `C_SldH_L` **APPROVE-WITH-NITS** `444ba8e0`); y=177 **320** **APPROVE** `9fe268f8`; volume **130** labelled **APPROVE**; Span **2442** labelled **APPROVE**; birds **1558** labelled **APPROVE** |
| Camera Welcome p1 vs native `52a6dcf7…` at `1863c4e4` (Mac built-in) | **0** | **1401** | interior **0** / perimeter **1401** held (`camera-welcome-gate-recapture-20261005/page1/`, report `04aa56e1…`) |
| Camera Welcome p5 vs native `616fbeae…` at `1863c4e4` (Mac built-in) | **7615** | **1401** | interior lower **0**; illustration centre **0**; live-feed gap **APPROVE** `f14c2241` held (report `21cbb596…`) |

Unread-dot empty mask, max RGB 2, compare status 0. Sound Next interior 0. Camera Slideshow header 0. Camera Settings third 0. Welcome p5 **7615** live-feed source-gap **APPROVE**. Volume **130** live-slider source-gap **APPROVE**. Span **2314**/**2442** live-spectrum source-gap **APPROVE**. Birds **1558** held-offset source-gap **APPROVE**. Battery `[45,216,85,240]` **1** underbar-partition source-gap **APPROVE**. Line01 `(92,220)` partition source-gap **APPROVE**. Empty-entry row **1916** **APPROVE**. Thumb interiors **846/918** **APPROVE**. Guide perimeter **6072** = **860** dimmed grid + **4416** half + **728** (**144** row + **53** footer + **531** within 2) + **68** fringe; veil **REJECT** `be862ce6`; subsets **APPROVE-WITH-NITS** `d72ab4b1`. Empty-mid **2255**/**1024** → **0**/**0** by grid bind `603c5388` **APPROVE-WITH-NITS** `de5c6445`. p3 `TxtDlg` **1079→1078** after host-gate `1863c4e4` **APPROVE-WITH-NITS** `42d62c69`. Sound upper 316 labelled `14533857` **APPROVE** `daa93bca`. y=177 **320** labelled `22e8b0a4` **APPROVE** `9fe268f8`. Slider **57** **APPROVE-WITH-NITS** `444ba8e0`. Plus-tint strip **1992** kept `ed55865e` **APPROVE** `b6620fa4`. HOME 1-row tail **291** **APPROVE** `f72296ff`. HOME idle Health 1-row left-anchor **23182 / 14754** empty mask (title/wallpaper **12255**, vacant-vs-Settings **7045**, HUD **2328**). **Static still only.** Whole scenarios still fail.

## Next

Queue: [feature map](docs/feature-map.md). Health General **23993 / 0**. Health held-down **0 / 19206** (frame 292; lower = held-key scroll distance). Settings Internet **4899 / 1008**, Data root **4956 / 177**, Software empty **6011 / 22**, Extra Data **6989 / 51927**, Parental intro **4595 / 0**, Transfer **22816 / 76797**, exact Other p1 **217 / 0**, NNID unsigned-in **82096 / 74907**. Browser start menu **blocked** (update gate `e8562da9…`). Coordinator Next: recover isolated Azahar AX (window 7112 unresolved inside Camera shoot; did not Shoot) then Camera folder native / Notifications scroll native / Sound p2/p3 native. Notes editor browser `50cb7097…` / `33daea28…` and Friends card `04afa1ba…` / `4c78b5cb…` kept. N057 owed. Do not A excluded. No PIN. Zone skipped. Do not stop. Not 1:1.

## History

Append-only log: `/Volumes/Sandisk1/3ds-claude-codex-handoff/LOG.md`.
It is not the restart prompt.
