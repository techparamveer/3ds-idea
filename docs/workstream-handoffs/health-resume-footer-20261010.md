# Health Resume Footer Withdrawal - 10 October 2026

Source candidate: `ba19fd19643bb76182c9f6b10dbb8351ce65e3f8`, based on
`c3f74d52711c974a3d17bf33ced41d0cac66df74`. Independent GPT-6.1 Sol high
review is pending. No browser inspection or native comparison of this candidate
has occurred. Full checks and a fresh production build remain pending review.
The older retained build and its source/public/tests/server are frozen unchanged.

Worker checkout: `/Users/paramveer/.codex/worktrees/health-resume-footer-20261010/3ds-idea`,
branch `codex/health-resume-footer-20261010`. Private artifact root, abbreviated R:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/health-resume-footer-20261010`.
This slice uses no GUI, native session or server. The coordinator owns comparison.

## Captured Defect And Red

Native raw `17.48.52.354` and `.458` show partial footer withdrawal; `.511`
shows no footer while the upper HUD/dialog and lower tray/tiles remain.
The prior first/repeat browser audit `181440a5` has no separate footer stage.
Those observations establish ordering, not a native duration or host cadence.
The coordinator's additional native attempt stopped as a setup failure before
any burst; `R/native-v1/report.md` is not new timing evidence.

Deterministic red command at the base:

```sh
node --test tests/health-resume-footer-live.test.mjs
```

`R/red-01-footer.log`: exit 1, one test failed because actual Resume pointer
down/up immediately started `LncPauseFade_D_00_SceneOut`. The real compositor,
input/reducer, native layout pose engine and decoded assets run in the fixture;
only I/O, GPU rendering and canvas raster storage are stand-ins. This does not
constitute browser or native pixel acceptance.

Ranked hypotheses before runtime edits:

1. Missing independent footer phase before retained HOME departure. Confirmed
   by the red and the pinned absent-state gate below.
2. The accepted lower HOME image contains a baked footer, so merely adding a
   footer overlay would restore it during departure. Confirmed by composition
   order; the fix accepts the pre-footer underlay with the same visible pair.
3. Wrong footer action/binding. The earlier `ChangeDw` assumption is rejected:
   original Resume waits for absent state 0, reached through `SceneOut`.

## Bounded Pinned Trace

Pinned HOME code: `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/home-pause-source/exefs/code.bin`,
virtual base `0x100000`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
The existing disassembly `runtime/reference/folder-navigation/native-code.asm`
under the historical firmware artifact root is read-only, SHA-256
`656187735b0ac3f3352e060308bf65ff54d0c460c581d6ee6c851cbaadd770b5`.

- `0x2a2268` calls footer wrapper `0x25381c`; it requires layout ready via
  `0x258374` and wrapper flags `+0x45/+0x46` both zero.
- `0x258374` requires absent state `+0x5e0 == 0` and request flags
  `+0x12c/+0x12d` both zero. This differs from visible state 2 readiness.
- Wrapper exit `0x1df8d4` sets flag `+0x46`. Wrapper update around `0x253714`
  calls layout `0x258078`, which requests exit only while enabled (`+0x12e`)
  and in a nonzero state. Layout state 2 starts controller `+0x100`;
  state 3 rejects controller statuses 1/2, then clears state and exit request.
- Constructor `0x257f58` stores the SceneOut controller at `+0x100`.
  Original table `0x33c6bc` resolves suffix 3 to `SceneOut`; suffix 5 is
  `ChangeDw`, stored at `+0x108`. ChangeDw state 5 subsequently starts
  ChangeUp `+0x104`, state 4, and returns to visible state 2, not absent state 0.
- After the footer/upper readiness gate, `0x2a22b0..0x2a22dc` redraws and
  captures lower HOME. Only then `0x2a22f8` starts the retained lower departure
  and `0x2a2320` starts the upper departure. No opening clip is reversed.

The actual input-category writer, button feedback epochs, native start epoch,
controller update cadence and cross-LCD host receipt mechanism remain untraced.
This trace selects order and resources; it does not recover those timings.

## Native Resources

HOME EUR `0004003000009802`, version 24576, `CTR-N-HMMP`, content index 0,
CIA-internal content `00000082`. All resources were already delivered; no asset
or manifest changed. Manifest alias is `home.launcher`, delivered pack
`public/os/firmware/10.7.0-32E/packs/home/launcher.json` (SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`).

| Element / Manifest Key | CIA-Internal Source | SHA-256 |
| --- | --- | --- |
| Footer layout / `layouts.LncBtmBtn_02` | `romfs/launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| Footer withdrawal / `animations.LncBtmBtn_02_SceneOut` | `romfs/launcher_LZ.bin/anim/LncBtmBtn_02_SceneOut.bclan` | `df95bfcc74135a116fe14b39604cdd1300197e48b2c864989d3b40d35f13cf1d` |
| Settled footer / `animations.LncBtmBtn_02_SceneIn` | `romfs/launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan` | `9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e` |
| Settled Resume button / `animations.LncBtmBtn_02_Decide` | `romfs/launcher_LZ.bin/anim/LncBtmBtn_02_Decide.bclan` | `65eb55af8110e51cf8efdc9bafb70d681fdbf528a211a0df5d9ca172546de4bc` |

Converter: `ctr-native-web` 1.2.0; extractor: CTRTool 1.3.0. Existing text,
textures, fonts, captures, upper/window/HUD and lower departure mappings remain
in the [retained Resume handoff](health-resume-retained-20261010.md).

## Implementation And Supporting Checks

Only `screens.ts`, `home-resume-presentation.ts`, `firmware-presentation.ts`
and three reserved tests changed. No reducer, scene, assets or controls changed.

The presenter now distinguishes footer frames 0..14 from departure frames
0..40. Only the exact current successful visible paired footer terminal receipt
may start departure. Reduced motion still needs separate footer and departure
receipts. The final departure retains the existing real native-pair/input gate.

The stable accepted source stores full upper bytes and pre-footer lower bytes
with the existing owner, capture/resource generation and origin guard. Candidate
sampling/promotion still excludes transient gestures/motion/control states.
The prior stable source survives down/cancel and up-out. Footer withdrawal copies
those accepted bytes and draws the native footer independently; departure then
uses the footer-free lower texture. Dialogs, panels and runtime notices are
excluded. Two fixed scratch canvases are released on disposal; retained source
and presentation state also reset on disposal and resource replacement.

`R/focused-final.log`: exit 0, 54 passed, no failures/skips. Command:

```sh
node --test tests/health-resume-footer-live.test.mjs tests/health-resume-retained-live.test.mjs tests/home-resume-presentation.test.mjs tests/home-pause-lower.test.mjs tests/home-suspended-window.test.mjs tests/home-application-transition.test.mjs tests/application-close-scene-policy.test.mjs
```

`R/typecheck-final.log`: `npx tsc --noEmit --incremental false`, exit 0.
`git diff --check`: exit 0. No asset was staged; all 77 GLBs were mechanically
hydrated into this new checkout by the coordinator with exact identity checks
in `R/glb-preflight.log`.

New real-compositor regressions cover actual enabled-controls launch/HOME/footer
down/up, complete accepted upper/lower byte-array preservation across all 15
withdrawal poses, authored y/alpha channels and absent terminal, no footer replay
in the retained departure texture, reduced barriers, hidden/revoked/diagnostic/
sleeping/stale receipts, cancel/up-out physical HOME recovery and unsupported
selected motion channels. Existing retained-departure tests explicitly complete
footer setup before executing their unchanged departure/readiness assertions.
Presenter and retained live tests separately cover changed destination and owner receipts.

Historical setup/check logs remain: focused-01 fixed the old HUD test's missing
new-stage setup; focused-02/03 corrected fixture tray identity/readiness-paint
assumptions; footer-04/focused-05 corrected alpha assertions to the renderer's
rounded 0..255 representation. No native assertion was weakened. focused-06
passed all 25 directly affected tests before the final 54-test expansion.

## Adaptations And Remaining Work

The direct SceneOut binding (`childBinding:false`), settled right-button Decide5,
one-source-frame-per-successful-visible-pair cadence, stage boundary and held
upper/sleep/HUD bytes are host adaptations. They do not prove a native feedback
0..5 sequence, native delay, native curve timing or input-category epoch. Source
SceneOut keys are used unchanged; no guessed easing, reverse entry or substitute
ChangeDw motion was introduced. Prior renderer/raster, host publication and
portfolio adaptations remain as documented in the retained handoff.

Delivered/source-identified: existing native resources and bounded caller trace.
Implemented/tested: candidate source and supporting checks above.
Browser-inspected/native-compared: not yet, so strict 1:1 remains unproven.
Independent review, full suite/typecheck/shader/build/freeze and coordinator
matched first/repeat Resume recapture remain next. The known missing private
Camera PNG fixture must remain an explicit full-suite failure, not a skip.
