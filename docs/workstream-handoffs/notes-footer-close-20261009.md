# Notes Main-List Footer Close

## Scope And Evidence

Worker branch `codex/notes-close-presentation-20261009` starts at
`969d59c924270f4b52967c763c7bfa600a8612d3`. This implements one captured
defect: a HOME-launched Notes main-list footer Close immediately removed its
runtime owner without presenting the observed outgoing screens.

Private evidence is under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/`:

- `toprow-exit-observation/offline-notes-audit/report.md` and inspected
  `notes-close-keyframes-LOSSY-DIAGRAM.png`, SHA-256
  `032551a6a67d11d99599adf16027d6aae535435f2c829262696d6fe694eb4b97`.
- `toprow-exit-audit/handoff.md` and `source-audit.json`, SHA-256
  `cad1674adb56d941f11abc0058707fb3550e2be3a5af98e38a7742d9290985f4`.

The recording establishes footer feedback, cursor removal, a HOME Menu belt
over fading Notes, an opaque paired cover and HOME recovery. It does not
establish the accepted input epoch, native footer dispatch, exact durations or
LCD update cadence. Its lossy keyframes are diagrams, not pixel references.
The prior accepted-HOME source audit identifies the Notes boot SceneOut family;
it does not prove that the footer dispatches that controller.

## Native Resources

No native graphic, font, cue, decoded pack or manifest byte changes. All keys
below are under `public/os/firmware/10.7.0-32E/`. The manifest SHA-256 is
`83a495b50cf199babc8505dc95b1b2186574db4e857501e9d9e4e0b5757bd1d7`.

| Visible Element | Manifest Key | Decrypted Member | SHA-256 |
| --- | --- | --- | --- |
| Upper Notes outgoing cover | `packs/game-notes/memo-ApltBoot_U_00-arc-l.json` | `memo/ApltBoot_U_00.arc.l/anim/ApltBoot_U_00_SceneOut.bclan` | `4c5894701ad75a21285eb046501a186056c9951e58dc0a7002463a575c3b3c82` |
| Lower HOME belt and Notes cover | `packs/game-notes/memo-ApltBoot_D_00-arc-l.json` | `memo/ApltBoot_D_00.arc.l/anim/ApltBoot_D_00_SceneOut.bclan` | `afb19094d82a90713372ff20fee4169cc66d70b0b4a28cbcedc0f9bee981e29e` |
| White footer feedback | `packs/game-notes/contents/0000-00000007/memo-MemoListDown-empty-thumbnail.json` | `memo/MemoListDown.arc.l/anim/MemoListDown_Decide.bclan` | `376ed7b0d1c714df94a07b86665e5b19051545e5b3e26432ee09a1f402071730` |
| Upper HOME reveal | `packs/home/common.json` | `common_LZ.bin/anim/CmnFade_U_00_SceneIn.bclan` | `78435c2e74c129ccf1290dacc6c59dfdea80964f0a95933e570b59640ec1a996` |
| Lower HOME reveal | Same HOME common key | `common_LZ.bin/anim/CmnFade_D_00_SceneIn.bclan` | `696f40776f3908f1cf9fb2a342ab131dd2e941c3b8635ddb52e2119c155bc430` |
| Selected HOME icon/belt material | Same HOME common key | `common_LZ.bin/anim/CmnFade_D_00_Aplt.bclan` | `1a63a18209ece9d5bd7dbf86f2ead1f008cce5a665ff6cc408f014168a85a801` |
| HOME Menu text | `packs/home/messages-and-loose.json`, `menu_msbt_LZ/lau_title_menu` | `RomFS/message/EU_English/menu_msbt_LZ.bin` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |

Notes title is `0004003000009c02`, version4096, content0/`00000007`.
HOME title is `0004003000009802`, version24576. Legacy Notes boot and HOME
resource records omit version/content fields; the prior audit preserves those
omissions and joins pinned title metadata rather than inventing per-member
fields. Its baseline converter is `ctr-native-web`1.2.0 / CTRTool1.3.0. The
unchanged derived list pack records `ctr-native-web`1.5.4 / CTRTool1.2.0 and its
existing source-backed RGB565 empty-thumbnail initializer. Original archives
were not re-extracted or reverified by this implementation worker.

Delivered pack SHA-256: upper Notes boot
`d9b2d8b88c2b1c907e22fac31d5079710012bda0a68c2ad7f6bcc36797ba0bc3`;
lower Notes boot `e8721549694aec66c51afe72e27fd0f08b408d1f7c10e7ba10134454f370a167`;
derived Notes list `34da4da5a90b2bb632529dcbd49c4e783c0babdb6f5286eda022ad26f877ec48`;
HOME common `eb472b6a6c60668cdbdb88314fd010bc97b354c472adc47a9fc78629d1eb9b82`;
HOME messages `3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.

## Runtime Contract

Only a footer hit on Notes main with `caller:null` requests this presentation.
Physical B, physical HOME, subscreen Back, caller-owned Notes and all other
applets retain their existing paths. Caller-owned Notes still resumes its
retained caller; it is not redirected to HOME or assigned uncaptured motion.

The reducer sets a request without deleting the owner. The receipt-bound
controller presents feedback0/1, Notes SceneOut0..20, HOME common SceneIn0..20
and a separate uncovered HOME handoff. Only a valid current paired-render
receipt for outgoing20 permits the existing `completeApplet` lifecycle. Until
then the owner, native renderer and complete outgoing LCD pair remain live.
Recovery is tied to the same application, runtime sequence and generation.
Resource identity replacement, stale pair/owner, hidden or invalid publication,
failure, disposal and revoked candidates cannot complete the outgoing owner.

Source failures use existing explicit paired recovery. B/HOME can escape an
outgoing failure; incoming HOME-cover failure also has a local cancel path so
it cannot quarantine HOME input indefinitely. Retry can reacquire resources.

Adaptations are explicit: footer Decide frame5 is applied only to `G_Btn_end`,
cursor suppression occurs on feedback1, HOME's decoded localized label is
reused on Notes' outgoing HOME text pane, common selector frame6 supplies the
HOME icon, and the observed order is fitted at bounded 60Hz source updates.
No native cadence or observed two-second opaque hold is claimed. Hidden/stall
intervals accrue no catch-up credit. Reduced motion still requires separately
accepted feedback1, outgoing20, incoming20 and handoff publications.

## Diagnostics And Checks

`dataset.screenPaint.notesClose` is
`{kind:'feedback'|'out'|'in'|'handoff',frame:number|null,owner:string,adaptation:true}`.
The owner is the outgoing Notes owner. Collector completion requires HOME,
paint phase `home`, `kind:'handoff'`, null frame, exact same
`dataset.screenPresented.paint` and `validPublication:true`. That receipt
contains the uncovered current HOME pair. A later ordinary HOME paint has no
Notes close diagnostic and inactive native stock screen. Native stock status
may be ready or inactive at handoff while existing renderer cleanup settles.

Focused source regressions:218 passed,0 failed,0 skipped. Command:
`node --test tests/notes-*.test.mjs tests/applet-*.test.mjs tests/social-completion-routes.test.mjs tests/native-screen*.test.mjs`.
Nonincremental typecheck and `git diff --check` pass. Tests exercise actual
reducer, renderer, compositor and scene-receipt behavior, delivered source
poses/labels, retained owner, caller routing, B/HOME/power escapes, stale and
replaced pair/resources, failure/retry, hidden/stall/dispose and reduced motion.
Logs are under the private `notes-close-implementation/` sibling directory.

No GUI, browser, native session, server, build, full suite or audio comparison
was run. No private scenario status changed. After independent source review
and integration, the coordinator must capture ordinary Notes first/repeat
tap/open/footer-close with identical native inputs, raw paired LCDs, named
SHA-256 pairs, reasoned masks and chronological sheets. Recheck physical HOME,
B, subscreen Back and caller-owned close as regressions. Pixels, native dispatch,
timing, cold/repeat toolbar behavior and muted audio remain unaccepted.
