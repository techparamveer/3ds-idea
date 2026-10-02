# HOME Menu Settings native comparison

Runtime `747f840d08ed8a63ef78ac2f4198787b8dcdb604`, coordinator branch
`codex/home-fidelity-20261001`. H-11 is still **fail**. This change replaces the
incorrect upper helper-icon strip and camera hints with the native Settings
caption. It does not complete the lower Design panel or its navigation.

Private root `R` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
`R/home-design/summary.json` records all named capture, config, source, report
and sheet hashes; SHA-256
`561c092cfbf43648d4af689996a46cdbc8652a0e4925c06e4e481f04ab46927a`.
Historical matrix entries are unchanged. No new DeveloperStorage artifacts.

## Native observation

The closed seed was cloned to `R/native-home-design-20261002`. Its 467 NAND/SD
files matched the seed (`R/home-design/storage-check.json`); profile paths were
rebased only while closed, no user symlinks, original hardware/EUR/English,
Vulkan and volume 0. Executable SHA-256 remains
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
The final native log confirms Vulkan. The clone-local HOME pipeline cache was
preserved outside the profile before launch; other shader caches were retained.

`R/home-design/open.ctm`, SHA-256
`3fd802e8c5ed0f23a5a91152d147bb7b5580fc37fd69466f185a69407d563580`,
touches lower `(24,16)` at samples 7020..7028, then releases until sample27596.
At nominal234Hz this is a 34.188ms hold starting at30s. The movie manifest
binds launch config SHA
`c46cdc4441a5d68e0197fd78bd6f47dd444fef6a1fd5d09c5737790aa61bbec8`.
Its offline `playbackVerified:false` is not rewritten; the subsequent live
observation establishes that this route opened Design, not exact native timing.

Azahar's own 400x480 capture is
`R/native-home-design-20261002/screenshots/_02.10.26_02.08.07.154.png`, SHA
`e9a87578a05c08e428f4c83669501c5744541c37245df1dcd9b135cbde53d839`.
It shows the upper HOME Menu Settings caption; below, Change Theme, then
HOME Menu Layout / Save/Load Layout, then Screen Brightness at the lower edge.
The existing browser incorrectly places Brightness and Power-Saving immediately
after Change Theme. The native scrollbar, close button, symbols and panel
material also differ. This is a captured defect, not an inferred missing menu.

Sidecar was freshly verified at `(1800,367,1357,935)`. Native main window
`(1810,397,1153,781)` and each startup/Quit modal were independently checked
there before input. Capture preceded EOF; normal Quit exited0. The final log
is `R/home-design/native-final.log`, SHA
`6972ae1230a0904721b10889bcd402dc72ef67f558046b15589d4bd51ff6acd2`.

## Source and implementation

HOME title `0004003000009802` v24576, content index0 / ID `00000082`.
The clone TMD was decoded again and identifies the content SHA
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
CIA SHA is `2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`.
Converter: `ctr-native-web`1.2.0 and CTRTool1.3.0; manifest retains script hashes.

| Visible element | Manifest and decoded member | Source SHA-256 |
| --- | --- | --- |
| Caption band and text pane | `home.petit` -> `romfs/petit_LZ.bin/blyt/PtDlgBg_U_00.bclyt` | `fc2dbde9b196987a8b74697551e2c742b135f5b12097c1c7f5f448dc04f1704e` |
| Settled band pose | same archive, `anim/PtDlgBg_U_00_FadeIn.bclan`, frame20 | `76021e5956d25fffd228f4c77b4eea55a5e29b74ec13b3e4972fef112b4d1b7d` |
| Band texture | same archive, `timg/BarGrd.bclim` | `b8409c238fef9073c3daa951c00c384d497cdd3e7510baa245984519b99e3e41` |
| English caption | `home.messages` -> decoded `romfs/message/EU_English/menu_msbt_LZ.bin`, `ptt_title_u` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |
| Caption style488 | decoded `romfs/message/EU_English/RI_mstl_LZ.bin` | `224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555` |

The member hashes above are the converter's decoded `resourceSources` bytes,
not compressed archive hashes. `romfs/petit_LZ.bin` source SHA is
`ea46084c50d4b3b5238bc8bd8937c71061a723dc1266b8edc34231740091f473`;
delivered `packs/home/petit.json` SHA
`fefab482afa488f4b76d2d9e1839e9bb63d2202354d815f36921940f0c77eef3`.
The unchanged messages pack SHA is
`3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.

`fonts.shared` still supplies title `0004009b00014002` v0,
`romfs/cbf_std.bcfnt.lz`, source SHA
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
Its older font provenance omits the content index; it remains unsupported here,
not guessed. No new font, graphics, texture conversion or native cue was added.

The existing HOME asset loader now decodes the caption layout/texture before
publication. `createFirmwareHome.settingsUpper` uses the original message style
and source pose, and fails explicitly for a missing message/layout. The painter
uses it only for the Settings panel, in place of ordinary upper camera chrome.
It suppresses the unrelated authored applet icons. Closing restores ordinary
HOME composition; renderer cache/disposal and paired readiness remain shared.
The settled frame is source-backed and visually inspected. Opening/closing
animation epochs are not recovered; this static presentation is incomplete.

## Production comparison

The dedicated muted browser session `3ds-design-20261002`, PID67957, remained
at `(1810,397,1150,780)` on Sidecar. Launch used `--mute-audio`; every accepted
capture checked app mute true. Browser lower pointer `(482,321)` projects near
logical `(20,16)`, not native `(24,16)`. Browser starts with Work, two rows and
portfolio population; native starts with Notifications and one row. No matched
input claim. A rejected fractional pointer move and ineffective down/up were
followed by a checked integer-coordinate attempt; only the latter opened Design.

Each scenario below has `capture.json`, upper400x240 and lower320x240 under
`R/home-design/reference/scenario-matrix/v1/captures/<scenario>/browser/`.
Reports and both inspected contact sheets are in `R/home-design/<report>/`.
All use the empty mask, SHA
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.

| Scenario / report | Runtime | Upper/lower pixels >2/255 |
| --- | --- | --- |
| `home-design-initial-20261002` / `compare-initial` | `dda25e9e` | 52769 / 61547 |
| `home-design-upper-source-20261002` / `compare-upper-source` | `747f840d` | 11990 / 61485 |

Browser background frames568/491 differ, so full totals are not a controlled
before/after score. A bounded wait for568 while Design was open timed out; the
retained panel background stayed491. No source-frame override was forced.
Both captures sample the same presentation time/date, but that does not set a
native epoch. In caption rectangle `(108,212,192,28)`, the diagnostic falls
from5376 pixels >2 to121, maximum4, MAE0.26494. These remaining pixels still
fail; the rectangle is not an acceptance mask.

After upper PNG SHA:
`bec0ca3f97653ed73b13cf1c613c3551659b31e258f878ee2950c5669266116f`.
After report SHA:
`f9db7a52e4cb3bdc6bc46d120ad96e6b5b2e4fd676e85dde469e8b1d95d29c83`.
The caption and removal of incorrect icons/hints were visually verified.
Lower reconstruction, HUD status, wallpaper phase, input, motion and cues remain.

Escape restored HOME (`home-design-close-regression-20261002`, upper inspected).
System Settings was then opened through focused accessibility button + Enter,
and lower `(230,170)` opened Other Settings page1. Both raw LCDs were inspected.
`settings-other-byte-regression-20261002`, at the retained 27 September
date/elapsed sample, is exactly RGB-identical on both LCDs to
`R/../captures-20260927-clean-origin/reference/scenario-matrix/v1/captures/settings-other-page1-hud-frame-recheck-20260927/browser/`.
`browser-only-settings-regression/` contains its report and inspected sheets.
This is a **browser regression**, not a new native pair: the historical native
file was absent from its old mount. No scenario pass is inferred.

## Health HOME return diagnostic

The intervening clone `R/native-health-home-trace-20261002` used
`*:Info Service.APT:Debug`, otherwise isolated volume0/Vulkan settings.
It derives from the previous Health run, not a newly verified pristine seed.
The prior Health CTM reached Health main. EOF was resolved on Sidecar, followed
by Continue. Two requested HOME presses, a refused focus action and a background
focus attempt did not visibly reach HOME. Key hold/focus delivery is unproved.

Native captures `_02.10.26_02.00.46.104.png` and
`_02.10.26_02.02.29.538.png` were inspected and have exactly identical lower
RGB, still Health main. Flushed debug log shows Start/WakeupApplication, but no
InquireNotification, PrepareToJumpToHomeMenu or JumpToHomeMenu call. This narrows
the observed boundary; it does not prove a missing host event or impossibility
of Health suspension. Normal Quit exited0; PID36938 and PID59047 were subsequently
confirmed absent. No debugger, RPC listener or firmware patch was used.

`R/health-home-trace/summary.json` SHA
`38388c0219d084157ae5d963085d97ef2c5529f932eedde8bc8a314916405f87`
records the two new PNGs, configs and final log. H-12 stays gated on measured
native HOME return; do not repeat unmeasured short-key attempts indefinitely.

## Checks and next work

38 focused tests; full1607 pass, zero fail,23 skips,1 TODO; typecheck/build pass.
No shader/material changes. Browser and verification server stopped normally;
all native processes are closed, audio stayed muted, system audio untouched.
No helpers were started with unverified non-Fast service. No push/merge/deploy.

Next H-11 correction is the captured lower panel: original-hardware
`PtDlgCnt_CTR`, `PtDlgBg_D_00`, `PtBtnM_Mym_00`, `PtSlideBar`, `PtClose_00` and
their source mounts/messages, then Save/Load navigation and scrolling. Resource
presence is not delivered behavior. Fit only decoded resources if native owner
placement cannot be recovered, explicitly labelling that fit as an adaptation.
Portfolio population/content, offline flows, authored lower Design/close-switch
UI, fitted composition and reduced motion remain non-native/adapted. Strict
whole-scenario fidelity is unproven and the full goal remains active.
