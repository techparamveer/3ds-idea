# Health Close and Native Switch Reference

Runtime `3d5e533c1101ac77303fb5fda2f542d92b545474` in the assigned
`3ds-home-fidelity-20261001` worktree. This is partial L-06/H-14 delivery,
not whole-scenario acceptance. No push, shared-branch merge or deployment.

## Delivered

Selected, suspended Health closes directly from the HOME footer or X without
the former universal confirmation. The existing B compatibility command uses
the same path. Eligibility checks the retained application's identity,
selection, suspended/nonclosing state, inactive foreground and HOME-return
owner. Cleanup uses the existing application host and clears input/pending
state. Unselected Health, other titles and switching retain existing policy;
their policy is not established by this Health observation.

The footer now uses original `lau_3b_quit` (U+E071 plus Close), not folder
`lau_2b_close`. Keyboard/physical X and touch feed the existing reducer.
Native X was identified from the source message and visible footer; the new
native replay exercised touch, not a measured native X press. Immediate host
cleanup remains an adaptation until closing motion is captured and matched.

## Native Reference

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/health-close-native/`.
Own 400x480 captures are in sibling `native-close-clean-20261002/screenshots/`:

| File | Observed state |
| --- | --- |
| `_02.10.26_05.31.30.313.png` | Health running |
| `_02.10.26_05.32.00.16.png` | Selected Health suspended; dark X Close / Resume |
| `_02.10.26_05.32.21.538.png` | Health closed directly; ordinary HOME |
| `_02.10.26_05.34.04.245.png` | Camera selected with Health retained; Manual / Open |
| `_02.10.26_05.34.37.288.png` | Health-to-Camera icon-header switch confirmation |

The last dialog has Health icon, dotted arrow, Camera icon, separator and
"Close the suspended software and launch this one?" without an unsaved-data
warning. Cancel visibly returned to Camera-selected HOME retaining Health.
This is the next concrete source-backed correction; the browser still uses
the generic warning variant and shows a stale Health upper banner.

PID42940/window3466 was verified at1810,397,1153,781 inside Sidecar
1800,367,1357,935. Startup warning was explicitly dismissed and keyboard-to-touch
mapping disabled before successful input; neither change is isolated as the
cause of earlier failures. Held Open/Close/selection touches were200ms;
temporary Shift HOME used an upper-screen500ms drag. Exact coordinates/input
history and config/log hashes are in `summary.json`. Menu HOME boot, not CTM.
Normal Quit/Yes completed session57192 exit0; PID absence verified. Temporary
HOME and touch-mapping fields restored while stopped. Static input2, Null
output1 and volume0 preserved. No host microphone/system/Spotify changes.

## Production Evidence

Eleven raw LCD pairs under `reference/scenario-matrix/v1/captures/` cover Health
running, suspension, keyboard close, relaunch, resume, touch close, Camera
switch/cancel, Work close, portfolio switch and final close. Four browser
sheets plus six native/browser sheets were opened and inspected. Trusted
keyboard X and projected200ms footer touch both closed Health without a modal;
resume/relaunch and Work/About confirmation paths worked. Browser errors: none.
Native/browser input prefix, density, population and timing remain unmatched.

| Empty-mask diagnostic | Upper pixels >2 | Lower pixels >2 | Result |
| --- | ---: | ---: | --- |
| Suspended Health | 95284 | 51196 | fail |
| Health closed via touch | 35123 | 47525 | fail |
| Health-to-Camera switch | 96000 | 24433 | fail |

No mask hides HUD, population or unexplained differences. These are fresh
semantically corresponding state diagnostics, not matched-input acceptance.
Suspended warp/tint, compact window, dark Close background, closed footer
segmentation, banner phase and switch header/upper publication remain wrong.
The generic switch capture selects slot10 but retains the Health upper image;
do not attribute that to native behavior. Motion and muted audio remain open.
The historical private matrix is unchanged.

`summary.json` SHA-256:
`8e332ebcd1cea0290eac93fa79ca0bfc107526f460b5f8d55e7f9327a77e3a13`.
It tracks each native/browser file, input history, empty masks, diff reports,
contact sheets, source packs and test logs. No DeveloperStorage artifacts.

## Source and Checks

No new asset conversion. Footer element -> `home.launcher/LncBtmBtn_02`;
label -> `home.messages/menu_msbt_LZ/lau_3b_quit`; glyph -> `fonts.shared`.
HOME title0004003000009802 v24576, content0/00000082. Launcher source
`launcher_LZ.bin` SHA826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834;
delivered pack SHA f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044.
Messages source `RomFS` SHA c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d;
pack SHA3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2.
Shared font title0004009b00014002 v0, `cbf_std.bcfnt.lz`
SHA95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581.
Converter ctr-native-web1.2.0/CTRTool1.3.0. Legacy exact internal MSBT-member
and shared-font content-index/id gaps remain explicit; no completeness claim.

Full `npm test`:1677 pass,0 fail,23 skip,1 TODO. Typecheck/build pass.
No shader/material edits. Earlier full run failed the capture fixture whose
Health owner was unselected; its original confirm path was restored and the
full suite rerun. New tests cover direct-close inputs, single cleanup,
relaunch identity, resume, mismatched/closing owners, other-title policy and
original source footer glyph. Tests do not establish native timing.

Chrome55462/window3765 was verified on Sidecar at1810,397,1150,780; launch mute
and every capture's app mute were verified. CDP closed it; launcher exit0.
Verifier55755 stopped, session53821 exit143. Updated intentional preview60223
serves this build at `http://127.0.0.1:3021/`, cwd verified and HTTP200.
Existing Settings fits, local persistence/preview sampling, generic dialog
assembly/inline size and offline/portfolio differences remain adaptations.

Next: source icon-header Health-to-Camera switch, selected Camera upper-screen
publication and native closing motion; then power-on and HOME interactions.
