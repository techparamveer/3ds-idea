# Manual Entry Cover

## Checkpoint and Scope

Worker B: `codex/animation-folder-home-20261007`, checkout
`/Users/paramveer/.codex/worktrees/3ds-animation-folder-home-20261007/3ds-idea`.
Actual starting HEAD is `77bd7320da969cd39ab1ba4e9a9790f37f6e7abc`, not the
old `81f09bf` worker-base SHA in the coordinator-owned dirty STATUS update.
That update is preserved and excluded from staging. Coordinator reported
`21694975c0d6e89391f15aea9c038d159b007e96` during this slice; integration must
use the coordinator's actual git HEAD. No system reducer, settled Manual
painter, Notes painter, private evidence, server, browser or native session
was changed by this delivery.

AN-02 previously jumped from HOME Manual invocation to settled Contents. This
delivery applies the decoded common cover over a retained, **WebGL-presented**
caller pair: SceneOut0..20, opaque acknowledged hold, complete Manual pair
beneath SceneIn0..20. Both frame zero and terminal poses wait for valid paired
render receipts. Asset readiness cannot synthesize the SceneOut20 receipt.
AN-02 remains **fail**, not accepted 1:1, until matched coordinator recapture.

## Captured Defect

Private root: `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/`.
`baseline/camera-manual/capture.json`, SHA-256
`823ba539eb96302df7382e71811736a06d218e00a9e37f47c08707e32d6141da`,
records 51 chronological raw pairs at nominal `5ee6fd7`, actual Right x5 then
Manual touch50,226, before HOME selected10 and after app. It records no page
errors, a muted browser and `nativeCompared:false`; it is not a forced pose.

Native `native-manual-slow/screenshots/` supplies order-only evidence:

| Screenshot | Observation | SHA-256 |
| --- | --- | --- |
| `_07.10.26_13.00.43.252.png` | Camera HOME below partial Manual belt/wash | `36f64508a3752084a17e412000ca10af85d3b3793c0316a728d0d5e15254b147` |
| `_07.10.26_13.00.45.247.png` | Opaque common cover | `2c1738dd4099858798ccdc3a5cd6d937f3526e060f5d6ba0632f2aa08c6f4880` |
| `_07.10.26_13.01.11.964.png` | Settled Camera Manual | `187ad2e67e97fbe12f4d041e0679a8ff2ade2e8282065cc81264a8f80b8bea1f` |

The slowed/cold pipeline does not establish native phase duration or the
Manual-specific caller epoch. No screenshot pixels are used as assets.

## Source Mapping

Every newly selected native element comes from EUR HOME title
`0004003000009802` v24576 / `CTR-N-HMMP`, content index0 / `00000082`,
EUR10.7.0-32E English. CIA SHA-256
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted content SHA-256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Converter `ctr-native-web`1.2.0, extractor CTRTool1.3.0; script and extractor
hashes remain in the unchanged firmware manifest.

Wash, belt and icon -> `manifest.home.common` -> `packs/home/common.json`:
delivered SHA-256 `eb472b6a6c60668cdbdb88314fd010bc97b354c472adc47a9fc78629d1eb9b82`;
CIA-internal `romfs/common_LZ.bin` SHA-256
`543fbf31b7ca5c44580075c0632f2d99d6e88843cd85f801fb9ada1da5ec2af8`.
Its unchanged `resourceSources` maps these archive entries:

| Element | Entry in common_LZ.bin | Original SHA-256 |
| --- | --- | --- |
| Upper wash | `blyt/CmnFade_U_00.bclyt` | `b8b7baff90e549b61e252e6d34c0d223d6edb16203693dba2fedf0036e032de4` |
| Lower wash/belt/title parent tree | `blyt/CmnFade_D_00.bclyt` | `267c9a5bff07e6146931531812ef789bbd0a0348f12cc19045a2ed03485d0881` |
| Upper outgoing | `anim/CmnFade_U_00_SceneOut.bclan` | `26090911fde2bd34c172040b9136264be9f6e5b3ed2d7e76a434ab3432371fc9` |
| Lower outgoing | `anim/CmnFade_D_00_SceneOut.bclan` | `7cabf3001ad29eef32862806e59e48e9ab31e74c06227a45214b05a7e6ed55c5` |
| Upper incoming | `anim/CmnFade_U_00_SceneIn.bclan` | `78435c2e74c129ccf1290dacc6c59dfdea80964f0a95933e570b59640ec1a996` |
| Lower incoming | `anim/CmnFade_D_00_SceneIn.bclan` | `696f40776f3908f1cf9fb2a342ab131dd2e941c3b8635ddb52e2119c155bc430` |
| Fixed Manual selector4 | `anim/CmnFade_D_00_Aplt.bclan` | `1a63a18209ece9d5bd7dbf86f2ead1f008cce5a665ff6cc408f014168a85a801` |
| Ebird Manual icon | `timg/LncApltPictEbird_00.bclim` | `f1e05c8aa9a2919401f65ae47b766b19ae51f3460bd3be7861b1bf578c8829ff` |
| Belt | `timg/LncApltBelt_01.bclim` | `01cbe29144d86291bafef0f0105b24dae1c5b0e231e012f66ab49ff79baa6ebc` |
| Belt mask | `timg/LncApltBeltMask_01.bclim` | `dfe47304cf6b3917a5f4ec979327db082649b8933807d9a742bf62a5f8e847b3` |
| Wash light | `timg/BgLgt.bclim` | `c0d63a4ee5205e77b89b18b334ffbd13df83a06912ac258119a46160791f983b` |
| Wash line | `timg/BgLine.bclim` | `5c1ff31e996b2367dd8ed15973e4fa9e1863c2d08927eda513c0a97e00699836` |

Selector4 chooses texture pattern0/Ebird, native grey160 and identity icon UV
transform. Selected icon/belt RGB, title material alpha, icon texture matrix and exact selector range
are strictly validated. Eight selector
frames are **not a duration**. The Ebird decoded 32x32 LA4 PNG is
`textures/e55163e5c28e46fd6d951a1669e16eccb5ec2cfc2d7e6eb53c807c9011a66d7d.png`.
SceneOut and SceneIn each contain 21 poses; source ranges are [-20,0] and
[20,40]. Alpha and belt-X Hermite keys/slopes are validated before use,
along with clip/group/range identity and the resulting visible parent binding.

Instruction Manual label -> `manifest.home.messages` ->
`packs/home/messages-and-loose.json` -> `menu_msbt_LZ/lau_title_manu` ->
`RomFS/message/EU_English/menu_msbt_LZ.bin`, SHA-256
`1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`.
Delivered message pack SHA-256
`3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.
The existing native font/style path is unchanged; `manifest.fonts.shared`
selects the shared bitmap font with source SHA-256
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
Missing selected label, layout, parent, curve or texture enters explicit
paired host recovery; no hand-drawn native substitute is introduced.

Generic dispatch ordering is documented in
[the cold-boot audit](../native-cold-boot-reveal-source-audit.md): table0x32ea28,
kind2 SceneOut and kind1 SceneIn through0x231ba8, and completion/hold through
0x105860. That audit does not trace Manual-specific start gates or native rate.

## Runtime Contract

- `screens.presentManualEntry(state,elapsedMs)` runs only after successful
  `renderer.render` with awake, visible, powered paired LCDs and valid context.
  It snapshots eligible non-Manual caller pixels and acknowledges Manual poses.
- Backing identity includes caller owner, runtime application, requested title
  and firmware generation. Manual identity additionally includes applet owner
  and request identity. A nonmatching or absent presented backing fails.
- `revokeManualEntryCandidate()` discards unpresented poses. The first resumed
  receipt repeats/rebases the last presented pose; hidden, sleep, failure,
  Retry, diagnostic, HOME suspension, lost-context and stalled gaps cannot backfill progress.
  Existing scene restore wiring repaints/rearms before rendering again.
- `manualEntryActive(state)` joins the existing transition LCD cadence, never
  overrides render quality budgets, and stops while an acknowledged opaque
  cover waits for resources or a destination/cover failure is selected.
- `stockStatus` remains loading until complete destination readiness **and**
  incoming20 receipt. Existing input quarantine and B/HOME/power escape remain
  active. Unready Manual recovery closes only the Manual applet before returning
  HOME with the original application suspended and homeReturn restored to it;
  it cannot replace that owner with Manual. Ready Manual Back remains unchanged.
- Reduced motion selects outgoing20 then incoming20, with separate receipts.
  Disabling it cannot replay an already presented endpoint. Firmware replacement,
  power-off, owner change and disposal invalidate backing; four bounded retained
  canvases are released on disposal. Settled Manual painting is unchanged.

**Declared adaptations:** host observations use nominal60Hz elapsed time;
successful receipts spend at most one source pose even at30/45Hz render
budgets. More than six adapted updates (100ms) is treated as a browser stall:
retain pose and rebase. This scheduling policy neither asserts native timing
nor skips poses to meet a guessed duration. Entry ownership begins at the
browser's existing Manual invocation; source caller epoch is untraced. The
existing browser recovery UI remains non-native. No new native audio is guessed.

## Verification and Integration

Selected 15-file run: **208 tests pass**, including 23 new pure source/session
and real-screen-painter cases. Coverage includes all outgoing/incoming poses,
frame-zero/endpoint receipts, opaque resource hold, malformed clips/curves/label,
paired draw refusal, offscreen-backing rejection, monotonic Retry, diagnostic,
sleep/HOME-suspend/context/stall rebasing, reduced endpoints, input quarantine/escapes,
owner/title/generation changes, asset replacement, power-off and disposal.
`npm run typecheck -- --incremental false` and `git diff --check` pass.
No worker build, full-suite, browser inspection or native comparison was run.

Integrate `c2c5f20` then its lifecycle/recovery/selector follow-up onto the reviewed coordinator chain containing the
previous B receipt and A Notes hooks. It needs no new reducer/portfolio API;
the follow-up has a separately approved Manual-only native-screen recovery branch.
The only shared APIs are the three screen hooks above and
`nativeHome.manualEntry(top,bottom,pose)`. Source assets/manifests are unchanged;
the existing loader now selects CmnFade_U/D resources. Diagnostics add
`screenPaint.manualEntry` and retain them in `screenPresented.paint` for
chronological recapture.

Coordinator must rebuild/typecheck/full-test and capture actual Camera HOME
Manual touch50,226 at normal native speed, then the app-origin equivalent.
Include outgoing partial/opaque20, hold, incoming0/partial/20, failure/Retry,
B/HOME/power, reduced motion and context/sleep resumes. Compare named native
400x480 PNGs to raw400x240/320x240 LCD pairs using declared masks and inspected
sheets. Pixel equivalence, caller start epoch, phase duration, cadence and audio
acceptance remain open; tests and extracted source do not pass the scenario.

## Mobile reduced-motion clock follow-up

Starting worker HEAD is `476aee60cb7cbd7a048ddfc98b729b77bc9e46e6`.
The dirty coordinator-authored STATUS update remains preserved and unstaged.
Folder upper-departure work is paused for this bounded Manual regression fix.

Production `127da9797f61dfefd83f8c84c1287585614113d3`, Camera Manual at
390x844 with reduced motion, exposes the failure under
`integrated-127da97/manual-camera-mobile-reduced/` in the private artifact root:

- `capture.json`, SHA-256
  `fcc3ff00fc8abf2ea7320dc993cb0c2109d427b0fa384dbc755d2279cfb2df5d`,
  has 71 raw pairs. Pair001 presents outgoing20; pair003 enters paired recovery
  with `Manual entry clock moved backwards`. Final nativeScreen is error.
- `repeat-1-capture.json`, SHA-256
  `88b530764d3d1ea86484742393e525aaafa6062d5a720b312ba83596ae46f9b5`,
  has 71 pairs and reaches ready. It does not excuse the failed first cycle.
- Visible recovery `console.png`, SHA-256
  `606126624cbd195e6e6da0fffc258813be96dbed2c48c38181312474ac77d3d3`.

The cadence painter sampled Manual from the rAF callback timestamp, while the
render receipt used a fresh `performance.now() - start`. A subsequent rAF
timestamp may predate that receipt and cross the previous adapted update
boundary. The real-painter regression reproduced the exact error before the
fix. This is a browser observation-order defect, not a source clip defect.

`paintScreens` now passes a fresh `manualEntryObservedElapsedMs` option.
Only live Manual sampling consumes it; all other system/HOME clocks, screen
cadence bookkeeping and diagnostic frame metadata retain their existing frame
timestamp. Manual receipts still require a successful valid WebGL publication
and use the same monotonic clock origin. State-driven/context-restoration
paints use the fresh field too; diagnostic finally paints already sample their
fresh `restoredAt`. A field-only options object remains a live paint, not a
diagnostic capture. Existing finite/nonnegative and genuine backwards guards,
pending-pose identity, one-pose-per-receipt, rebase and reduced endpoint rules
remain unchanged. No clamping, receipt backdating or synthetic acknowledgement
was added. Source mappings above and all native resources are unchanged.

Regression coverage includes stale rAF below the prior receipt with a fresh
eligible observation, reduced first/repeat cycles, normal pending poses,
context rebase and invalid/backwards fresh observations. The scene test
executes its actual transpiled `paintScreens` function to check separate
Manual/frame clocks for cadence, state-driven and restoration calls.
The selected 16-file run passes **213 tests**; nonincremental typecheck and
`git diff --check` pass. No worker full suite or production build was run.
Coordinator must recapture both mobile reduced cycles and require nativeScreen
ready rather than accepting menu=app alone. This fix has not been browser-
inspected or native-compared by the worker. Mobile remains fail until that
recapture; source rate/caller epoch, full native motion/pixels and audio remain
unaccepted. The scheduling adaptations described above are unchanged.
