# Health HOME-launched motion samples — 26 September 2026

The coordinator captured four isolated Azahar Tools screenshots during the same
HOME-launched Health session as the [entry phase sample](health-home-launch-phase-2026-09-26.md).
Files are under `/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/`,
with prefix `_26.09.26_` and the timestamps below. The original offline fit
compared only the complete raw upper 400×240 LCD, with no mask, rescale or color
adjustment. During capture, the coordinator observed transient black lower
buffers. Inspection of the four **saved PNGs** for this burst shows valid lower
LCD pixels in all four; the black-buffer observation does not describe these
files.

The existing private `health-toploop-fit/native-fresh-fit.mjs` machinery was
adapted temporarily to compile the current OS renderer and exhaustively sample
every integer source `Bg_U_00_TopLoop` frame from 0 through 719. No runtime or
asset edits were made.

| Filename time | Best frames | Phase mod 360 | Pixels >2 / 96,000 | RGB MAE |
| --- | --- | ---: | ---: | ---: |
| `04.44.03.531` | 144 / 504 | 144 | 0 | 0.0718472222 |
| `04.44.04.532` | 204 / 564 | 204 | 0 | 0.0711701389 |
| `04.44.05.548` | 265 / 625 | 265 | 0 | 0.0704930556 |
| `04.44.06.567` | 326 / 686 | 326 | 0 | 0.0707048611 |

The observed phase increments are 60, 61 and 61 frames. Filename intervals are
1.001, 1.016 and 1.019 seconds; at the nominal 59.826 Hz these imply 59.885826,
60.783216 and 60.962694 frames. Across the full 3.036 seconds, observed advancement
is 182 frames, versus nominal 181.631736. This is consistent with the existing
animation rate and needs no speed correction.

Production browser follow-up at integration commit `9539e1c` used the browser
HOME Health shortcut and the loopback-only `lcdHealthFrame` gate to capture
live observed source frames 144, 204, 265 and 326. Each browser capture, native
file and empty-mask diff is preserved under
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/health-home-burst-frame<frame>-20260926/`.
The four `capture.json` files report `healthTopLoopFrame` equal to the requested
frame. The coordinator inspected the upper and lower contact sheets. Both
LCDs in **every** saved pair have zero pixels with any RGB channel difference
above 2/255, maximum channel difference 2, and zero masked pixels. Upper
RGB MAEs are 0.0718472222, 0.0711701389, 0.0704930556 and 0.0707048611;
lower RGB MAE is 0.0248524306 in all four. These are production browser
render-target captures, not just offline source renders. The burst is
supplemental evidence and does not add a whole-scenario pass to the matrix.

These are screenshot pose fits, not shared-event clock measurements. Filename
creation time is not established as the exact emulated update or buffer-present
time, and screenshot latency/quantization remain unknown. The loop repeats its
visible pose after 360 frames, so the half-cycle is ambiguous. This result does
**not** establish ±1-frame synchronization, the launch origin or browser motion
acceptance. The browser captures deliberately waited for selected source
frames in separate launches, so they do not verify free-running browser motion
or ±1-frame synchronization. Paired event/capture timing remains necessary.

Combined screenshot SHA-256 values in table order:

- `5430bb3fda491c84e599f7dbb505ea14b84bebaf86ff03eb6c75ad71b6733cc8`
- `fe6a04bccfe730f6cd0e295134e021ea6d49b3bdb886f8039c5fb96fa6492df5`
- `128a7cdf34178d86a9ab2abdd8d642eec7b6d816dc7f7765cc5d5dc315085cfd`
- `822d7161e61e5fa76fc6495e02caae15fb4c70720724ebc11bdf900ce9a4cd2d`

Firmware provenance remains Health title `0004001000022300`,
`bg_LZ.bin/anim/Bg_U_00_TopLoop.bclan`, SHA-256
`c0fa9a144892bf146eedf53edd34ba13edc9622294a8ad2fbe38c5024f402ff6`.
