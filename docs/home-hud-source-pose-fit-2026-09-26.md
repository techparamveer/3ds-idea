# HOME HUD source-pose diagnostic fit

This is an offline field-pose search at `c24d2ce`, not a production browser
comparison or a service-to-pane trace. The coordinator owns native/browser
capture and integration. Default product HUD state is unchanged.

## Native target and assets

The inspected genuine Azahar screenshot is
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/_26.09.26_04.14.35.203.png`,
SHA-256 `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb`.
It is 400×480; the native upper LCD is the unscaled `[0,0,400,240]` crop.
The screenshot shows Internet, three signal bars, 42 coins, orange battery,
26/09 (Sat) and 04 14 with the colon absent. There is no known native frame
counter, charging update phase or identical browser input prefix.

The existing EUR 10.7.0-32E HOME title `0004003000009802` supplies all HUD artwork.
Delivered `packs/home/hud.json` SHA-256 is
`76df2ed42d3bbe09bef599bc242ac2946b811a3c5ee362a8776483a257b4c775`.
Its `resourceSources` identifies:

| Resource under `hud_LZ.bin/` | Source SHA-256 |
| --- | --- |
| `blyt/HudMenu_00.bclyt` | `c27b927db06ec234601e3fc1bfa3f55f1c9570353ac8016c5ad9812ebaab28de` |
| `anim/HudMenu_00_NetMode.bclan` | `fa013723747c08701cf202cf9386af96065ce80815264dd5da181b9ef340b1e8` |
| `anim/HudMenu_00_NetAtn.bclan` | `f9dc8c0981840d949e2ec112a3080877073a28ba1e85bf7153346f5f9cbe3bd2` |
| `anim/HudMenu_00_Bat.bclan` | `7f2906be6975fa97b14f72f10e0d7f5a3648ec996c43ad5930a0fb3c9b32d046` |
| `anim/HudMenu_00_WalkCoin.bclan` | `b7db095d0b521d43c24fcdbcbabf2514fb80628f77a74cd71f549882346043b8` |

`hud_msbt_LZ/lau_connect0` supplies Internet. The [profile audit](home-hud-profile-state-audit-2026-09-26.md)
records the native profile's 42 coins and emulator defaults. Steps are hidden in
this coin pose and remain an unobserved zero placeholder in the diagnostic.

## Reproducible source-pose sample

```json
{
  "kind": "source-pose",
  "evidence": "Offline white-backdrop fit to _26.09.26_04.14.35.203.png; native service mapping and phase untraced",
  "networkMessage": "lau_connect0",
  "netModeFrame": 0,
  "netAtnFrame": 3,
  "batteryFrame": 4,
  "walkCoinFrame": 258,
  "coins": 42,
  "steps": 0
}
```

This uses the renderer seam from `c24d2ce`. The offline script invokes the same
native layout renderer and source HUD bindings as `createFirmwareHome().hud`;
it supplies the captured date/time strings and uses the native bitmap fonts and
unpremultiplied decoded textures. It makes no color, coordinate or glyph edits.
Bat 4 selects visible `P_BatF_01` using `HudBatLgt_01.bclim`; the blue fill
`P_BatF_00` and plug branches `P_BatF_02/03` are hidden. WalkCoin 258 makes
`P_Coin_00` alpha 103 with hidden `P_Walk_00`; its count inherits the coin fade.
The source coin fade runs out after frame 247 and reaches zero at 270. Its
incoming fade from 90 to 112 can produce a similar still-image appearance.

## Method and bounded results

Fixed upper-LCD ROIs are `[x,y,width,height]`: network `[0,0,137,20]`, counter
`[139,0,61,20]`, battery `[370,0,30,20]`, and complete HUD `[0,0,400,20]`.
The offline canvas uses an opaque white backdrop, rather than synthesizing the
animated HOME background or copying reference pixels beneath the candidate.
No registration, resizing, acceptance mask or native-pixel replacement occurs.
For each field, rank integer source frames by pixels with any RGB delta above
2/255, then mean RGB delta. Search NetMode 0–4, NetAtn 0–9, Bat 0–6 and WalkCoin
0–359 sequentially. This is a bounded field search, not an exhaustive Cartesian
search or a proof of a global optimum. The message and 42 count come from the
observed/profile evidence. The test baseline uses Disabled, 0, NetMode 4,
NetAtn 8, Bat 3 and WalkCoin 180; it is not a captured production frame.

| Fixed ROI | Baseline pixels over 2 | Fitted pixels over 2 | Baseline mean RGB delta | Fitted mean RGB delta |
| --- | ---: | ---: | ---: | ---: |
| Network, 2,740 pixels | 2,498 | 601 | 54.108394 | 2.084550 |
| Counter, 1,220 pixels | 1,212 | 1,119 | 21.305191 | 6.429781 |
| Battery, 600 pixels | 294 | 104 | 44.746667 | 1.432778 |
| Complete HUD, 8,000 pixels | 6,196 | 4,016 | 27.575250 | 4.240042 |

NetMode 0 outranks the next frame 4 (601 versus 2,317 network pixels).
NetAtn 3 outranks 2 (601 versus 661). Bat 4 outranks 0 (104 versus 254).
WalkCoin 258 outranks 98 (1,119 versus 1,187); opaque coin frame 180 has
1,210 counter pixels over threshold and mean delta 19.817760.

The unknown animated background contributes to these residuals and biases the
coin-alpha fit. As a sensitivity probe, repeating the same search over constant
`#f8f8f8` and `#f0f0f0` backdrops keeps NetMode 0 / NetAtn 3 / Bat 4 but selects
WalkCoin **97** and **259**, respectively. Those are not alternative accepted
backgrounds. They demonstrate that the exact coin phase is **not identified**.
Use 258 only as the recorded white-backdrop diagnostic, and bracket 97/259 if
production pixels require a phase probe. Do not adopt it as a runtime clock.

The contact sheet was visually inspected: network mode, signal, coin content
and battery color match the captured state. Background differences remain;
the current painter still displays the colon that is absent in the native
capture. Maximum fitted full-strip delta is 188. These are neither a HUD pass
nor whole-HOME acceptance; no motion, native charging service mapping, steps
value or input parity is established.

## Private artifacts and verification

All files are private under
`/Users/paramveer/.codex/3ds-artifact-overflow/presentation/home-hud-pose-fit-20260926/`:

- `fit.mjs`: offline source-render search; compiled dependency snapshots alongside it.
- `report.json`: all frame scores, ROIs, inputs and image hashes.
- `contact.png`: native, declared baseline, fitted source HUD strips, in that order.
- `fit.png` and `baseline.png`: 400×240 offline canvases.
- `bg248/report.json` and `bg240/report.json`: backdrop sensitivity scores.

`fit.png` SHA-256 is `05af18fe7a0081963ab8fe58753caf7d2162828fb4ba5843ec90be7ce52370e1`;
`contact.png` is `7262be296a30bd082e8e3344cf813d4809b2a95349c6af2e53b58464b269fa6e`.
Run `node <private-directory>/fit.mjs` to reproduce the white probe; its
`FIT_BACKDROP` and `FIT_OUT` environment variables select the recorded sensitivity
runs. This documentation change passes `git diff --check`. No runtime change or
new browser capture is included; production capture remains the next gate.

## Production-background phase bracket

A subsequent coordinator production capture at `bdf5fc7` supplies the actual
HOME wallpaper/banner phase beneath the source-pose HUD:

`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/home-settings-hud-source-pose-bdf5fc7-20260926/browser/upper.png`

SHA-256: `9455804f8bdbf1eb7cb4c98244ca2a192a812ef0ecb4dc3f1366f449ca9abedf`.
Its sibling `capture.json` records WalkCoin 258, other sample fields as above,
`elapsedMs=5616.666666666667`, and `date=2026-09-26T03:14:35.203Z` (04:14 local).
The target remains the genuine native screenshot identified above.

Only WalkCoin frames **97, 98, 258, 259** were evaluated. Because this PNG already
contains the frame-258 HUD, this offline diagnostic recovers the production
underlay only where the source layers differ. Render each source frame over
black and white to obtain its premultiplied contribution `C` and background
transmittance `beta=(white-black)/255`, then compute:

```text
candidate = C_candidate + (beta_candidate / beta_258) * (production - C_258)
```

The reference native image is used **only for scoring**, never to reconstruct
the underlay. Source materials, fonts, clips and geometry are unchanged. Where
both source renderings are identical, original production bytes are copied.
Source-difference support is confined to `[142,0,43,20]`; the banner and animated
wallpaper elsewhere are exactly retained. No support component has zero base
transmittance or a recovered background outside the byte range. This is an
inverse-compositing estimate from quantized captured pixels, not a new browser
render. The unchanged frame258 reproduces the original RGBA pixels; re-encoded
PNG bytes need not match the original encoding.

Coordinates below are `[x,y,width,height]` in the unscaled 400×240 upper LCD:

| WalkCoin frame | HUD `[0,0,400,28]` pixels over 2 | Coin `[145,0,85,28]` pixels over 2 | Coin max delta | Complete coin `[139,0,61,28]` pixels over 2 |
| --- | ---: | ---: | ---: | ---: |
| **97** | **34** | **0** | **1** | **0** |
| 98 | 311 | 269 | 16 | 277 |
| 258 (captured baseline) | 215 | 175 | 5 | 181 |
| 259 | 296 | 256 | 10 | 262 |

Frame97's coin mean RGB delta is 0.082073, versus baseline 0.249580. Its whole
HUD mean is 0.224792 versus 0.261310. All 34 remaining above-threshold HUD
pixels are in the clock ROI `[225,0,145,28]`, whose maximum delta remains 188;
the colon remains visible in the browser and absent natively. Battery
`[370,0,30,28]` stays at zero for all four frames. Network `[0,0,145,28]` is zero
for frame97 and six for baseline258; the latter includes six edge pixels of
the coin at x142–144. These exact rectangles govern the counts, so broader
coordinator network rectangles may include additional coin pixels.

The contact sheet was inspected. **97 is the next source-pose capture candidate**
with the other fields unchanged. The result does not establish the native
animation epoch, live runtime timing or a service binding. Browser rerendering
is required to confirm the prediction and quantization effects. No production
default, new mask, renderer change or acceptance status is introduced.

Private evidence directory:
`/Users/paramveer/.codex/3ds-artifact-overflow/presentation/home-hud-production-phase-fit-20260926/`.
It contains `fit.mjs`, compiled source snapshots, `report.json`, four 400×240
`frame-<n>.png` estimates and `contact.png` (native then 97, 98, 258, 259).
Reproduce with `node <directory>/fit.mjs`.

| Artifact | SHA-256 |
| --- | --- |
| `report.json` | `ac8a34f10f61cff78e1c3cc79cc39635d3fc11acd6d3c11fe02450dea77a80c1` |
| `fit.mjs` | `92372036425a47c47e65b5e3f4d6e3bbe2137aad54a0b0d52a8288ae50fbe3eb` |
| `frame-97.png` | `604ba8ab0cb1159baf972d96090704285c65712766f6d0690d695589908c6a83` |
| `contact.png` | `41383b3f1e7a64709c33f58747d286b24af6e8070b8a2de11cce9a0b8a5300f3` |

Validation: baseline ROI counts reproduce 215 HUD / 175 coin; all four source
poses render; no unrecoverable underlay components; contact sheet inspected;
`git diff --check` passes. Documentation only; browser production confirmation
is the coordinator's next check.
