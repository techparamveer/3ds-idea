# HOME Density Re-entry - 3 October 2026

## Captured Defect

Base `165624e2`, runtime `632646d2`: a continuous press on density decrease,
excursion downward and return to the same button restores native Select and
changes six rows to five on release. The production browser cancels at generic
eight-pixel slop, does not restore Select and stays at six rows.

Runtime `d53cbe32` integrates worker `08acf423` from that base. A genuine
density-origin contact now retains its semantic owner across travel. Shared
`ownedHomeDensityContact` gates both Select and release using the original
and current enabled state, action half, density target, panel and container.
It cannot transfer into the other density half, footer, grid or applet toolbar.
Existing footer re-entry, unrelated chrome slop and density geometry remain
unchanged. This is a capture-backed input adaptation, not recovery of the
native controller or its timing.

The native replay starts with Camera selected and six rows in a fresh isolated
`native-density-reentry-20261003` clone. It uses the verified CTM template's
unchanged header, revision, length and input-record order. Touch coordinates
are decrease `(280,12)`, outside `(280,60)`, return `(280,12)`, then release,
with sample boundaries 7020, 11700, 15210 and 18720 of 27596. Nominal
30/50/65/80-second phases do not establish exact browser/native cadence.

Private evidence root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-density-reentry-20261003`.
The preparation report, CTM/config manifests and `native-input-record.md`
record complete launch identity and actual input/capture history. CTM SHA:
`6409cf29d80fcf0345ec8106b79f90c52ef15f78f10ec3f1d70c28ce0127dbbc`.
Launch config SHA:
`fe7adb798244ee46b9dfc10ac0a0918cd6570a0048cbacd6b16dd5feb53e719e`.
Source profile config remains:
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Original hardware, EUR, factor 1, Static mic 2, Null output 1 and volume 0
are audited; no user symlinks. The coordinator independently verified all
11 preparation files and five external anchors before launching.

## Capture Selection

Native own 400x480 PNGs under the new clone's `screenshots/` directory:

| Pair | Native PNG | Observation |
| --- | --- | --- |
| camera-idle | `_03.10.26_06.19.13.964.png` | Camera, six rows, idle density |
| decrease-held | `_03.10.26_06.19.49.437.png` | Decrease Select, still six rows |
| decrease-reentered | `_03.10.26_06.20.21.382.png` | Decrease Select restored, still six rows |
| released | `_03.10.26_06.20.33.494.png` | Five rows, Camera retained |

The intended outside capture arrived late: `_03.10.26_06.20.09.237.png` is
already re-entered. It is preserved but excluded from the four selected pairs.
There is **no native outside-held PNG** in this run; browser outside-held is
browser-only. Clipped movie status counters are not exact screenshot frames.
Native EOF reports playback completed with no logged mismatch. Normal Quit
exits 0, PID 79532 is absent and the CUA session is ended. The new clone retains
its post-run five-row state, not a silently restored baseline.

## Supporting Checks

Integrated full suite: 1,949 pass, zero fail, 23 skipped and one TODO
(1,973 total). Production build and sequential post-build typecheck pass.
Worker focused checks pass 109/109 and broader HOME checks pass 197/197.
Independent exact-commit review finds no actionable issues, with 143 focused
and adjacent checks passing, including original eligibility, lifecycle
invalidation and import-cycle safety.
No shader/material change requires shader validation. Test success does not
establish native pixel, cadence or audio acceptance.

The production desktop replay uses the same nominal phase boundaries and
records five actual-painted raw LCD pairs, with no page errors and mute
retained. Coordinator inspection confirms restored Select and five rows on
release, with the complete console framed in the 1150x690 viewport. A real
increase-button tap restores Camera/six rows before the separate mobile replay;
no state injection or modified native capture is used.

The 390x844 mobile replay also retains five pairs, no errors and mute, with
the same restored Select and five-row release. Both full console viewports
and the final side-by-side sheet were opened. `browser-controls-v2` separately
retains 17 paired captures covering cross-density, disabled-origin, footer,
grid and outside-release cancellation; both directions of re-entry; and
Manual re-entry/return. All assertions pass and the fixture ends at Camera6.
The initial `browser-controls` run is incomplete: its final accessibility
button click was intercepted by the scene canvas. Its 18 earlier captures
and original harness are preserved, not used as a completed control run.
The corrected harness uses the actual lower-screen Close control.

## Native Comparison

Frozen density ROI `(266,0,54,32)`, empty masks and channel delta 2, with no
registration, phase fitting or best-frame selection. Re-entry improves from
522 pixels above tolerance to zero on desktop and mobile; released density
controls improve from 120 to zero. All eight after ROIs have maximum delta 2,
independently recomputed by the coordinator. Initial-held and returned-held
browser density crops are byte-identical after the fix. Release semantics
now agree at five rows; this is separate from whole-screen pixel acceptance.

All 16 after whole-LCD comparisons remain **fail**. Upper differences range
45,088..54,911 pixels above 2. Six-row lower pairs retain 9,659..9,681;
five-row released lower pairs retain 15,468 desktop / 15,451 mobile, compared
with 22,755 before. Content, placement, status and animation epochs remain
different and are not masked away. Outside-held has no native parity claim.

The coordinator rehashed all 74 final and 33 frozen-before manifest records
without discrepancies. The before generator and outputs are unchanged.
Artifacts under `comparison/`:

- `frozen-plan.json`: `6e13621e4b464cf48fa3381cd0ac75d78129bfb7795e600a42625aaae0ec5b9d`.
- Classification addendum: `614ad5815d5d867af5700121a6d1d13637ba2b927f99a8a102ef9b59d3e58ed1`.
- After-path addendum: `5ec505e29ebe46fef597a2459ad3a27579377945f484649acce4c2a62f1bc568`.
- `report.json`: `4b33c1e7dc32ab72a6ce6397d3c8556ebca1ba095cbf781ef032ea275830bb0f`.
- `comparison-sheet.png`: `552c2e079d87272a10c5e70afd256b8903697a0a0dbe8a7815f4b7e9a7c1fa2e`.
- `manifest.json`: `6e64e8d535c8830171a4341c93aacf551cff8dba88a386b8188425909da0cec6`.

Owned browser PID 77400 and native PID 79532 both exit 0 and are absent.
Preview `http://127.0.0.1:3021/` remains HTTP 200 at `d53cbe32`. Default
Azahar, system audio, Spotify, source firmware and DeveloperStorage artifacts
remain untouched. All 3DS sessions stayed muted.

## Provenance and Limits

Visible density base/Select map to `home.launcher`, HOME title
`0004003000009802` version 24576, content index 0 / `00000082`,
`launcher_LZ.bin/blyt/LncBase_D_01.bclyt` and
`anim/LncBase_D_01_Select.bclan`. Complete title, CIA-internal source, decoded
pack SHA-256 and converter identities are unchanged and recorded in the
[density boundary provenance](home-density-boundary-2026-10-03.md#source-identity).
No asset, graphic, font, geometry or native cue is added by this input slice.

Whole HOME fidelity remains unproven. Portfolio population, placement, content
and status; reduced-motion endpoints; fitted lifecycle/source-clock schedules;
and static microphone input remain adaptations. Native/browser banner,
wallpaper and cursor epochs, input cadence, motion and audio are unmatched.
No private matrix or whole-scenario pass follows from this bounded replay.
