# Settings retained HUD runtime

Evidence tier: implemented, tested and source-rendered. Production/native timed
acceptance remains open. This supersedes the fixed-phase decision in
[the earlier audit](settings-hud-phase-boundary-2026-09-26.md), using the
[resolved seconds ownership](settings-upper-seconds-source-audit-2026-09-26.md).

## Source mapping

EUR 10.7.0-32E System Settings `0004001000022000`, content 0 / `0000003d`,
`exefs/code.bin` SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`:

- Constructor `0x23986c..0x239874` initializes signed counter `+c8` to -1;
  `0x23987c..0x239884` initializes flag `+cc` to 1.
- `0x2389d4..0x238a18` refreshes the calendar at counter <=0. Converter
  `0x1b01a4` supplies seconds in sampled-date byte `+f1`.
- `0x238aec..0x238b10` chooses colon visibility from the **previous displayed**
  seconds `+e5`; odd hides it. The current date is copied to the displayed
  date only afterward, at `0x238bb0..0x238bbc`.
- `0x238e4c..0x238e5c` refreshes battery at counter 2 or negative, skipping 0.
  `0x238f10..0x238f20` chooses frame4 for odd sampled seconds, frame5 for even.
- `0x238f7c..0x238f90`: counter <=0 becomes29; otherwise decrement.

The original `hud_LZ.bin/anim/HudMset_00_Bat.bclan` SHA-256 is
`e8c70db4c5f366e5251aba8c93e2a32a7622e595e511d000ac063f567de83729`.
Frames4/5 use the unchanged `HudBat_04/05.bclim` resources, with decoded PNG
hashes recorded in the earlier phase audit. The colon is source pane
`T_TimeC_00`; no graphics, font or audio resources were added or altered.

## Ownership and adapters

`stock-apps.ts` owns Settings-local active elapsed time, resets it on creation,
and retains it through page navigation. Presentation owns the corresponding
HUD counter and sampled/previous dates per application owner. Repainting or
changing pages cannot bypass the source refresh branches. The paired cache
uses displayed minute/date, colon visibility and battery pose, not every tick.

The browser maps local elapsed time to updates at 268111856/4481136 Hz, the
existing native display cadence adapter. Missed paints replay source updates
with wall dates interpolated backward from the injected Date and local elapsed
remainder. This is an explicit browser scheduling adaptation, not a claim that
native callbacks or a suspended host execute at exactly that cadence. Previously
sampled values survive until the relevant refresh branch, including a host
wall-clock change. New owners and rewound local elapsed reset the sampler.

The constructor's **prior displayed seconds** are not established by this
bounded source trace. Zero is the explicit first-update adaptation, replaced
by the sampled date on that update. Fixed charging/network telemetry remains
the portfolio adaptation; real battery/services are unavailable. Reduced motion
does not suppress this status update. Legacy standalone fixtures without local
elapsed retain their static HUD; live AppModule-created Settings supplies it.

For deterministic capture, advance Settings-local ticks and inject the matching
wall Date. Changing only Date while freezing the local update count intentionally
retains the old sample. Direct source rendering accepts an explicit sampled HUD
pose. Tests use a synthetic entry at 03:32:20 followed by 25.868,26.856,27.825;
that entry origin is a test input, **not** an inferred native launch timestamp.

## Bounded verification

Genuine isolated Azahar 400x480 screenshots at 03:32:25.868,26.856,27.825 on
26 September are in the private `reference/screenshots/` root. Adjacent native
frames differ by169 upper pixels (colon32 + battery137), lower0; odd frames
are identical. Coordinator's additional native 04:04:06.49 and04:04:17.185
pair has the same169 upper/0 lower phase difference. Native/browser even06
baseline before this change is155 upper/20 lower, of which137 is battery.

- Focused state/lifecycle/cache tests:31 passed. They cover distinct date and
  battery retention, prior-date colon ordering, repaint partition invariance,
  odd/even/odd phases, navigation ownership and reopening reset.
- `verify-stock-settings.mjs`: five main selections and44 subpages pass.
  Added actual source renders have identical odd frames and lower PNGs.
  Their adjacent upper difference is177: unchanged battery137 plus cold
  offline shared-font colon40. This cold-font edge discrepancy is explicit;
  it does not establish the production colon's native32-pixel coverage.
- Expanded Settings/Health/lifecycle tests:114 passed, one pre-existing TODO.
  Language tick assertions now check unchanged language state plus advancing HUD.
- Typecheck and production build passed.
- Outputs are local `.local/settings-hud/` in the Stock lane.

No GPU/shader code changed. Settings title/font edges, the existing lower20
residual, full timing/input equivalence and audio acceptance remain open.
The coordinator must recapture odd/even production LCDs with matching native
calendar/phase inputs and inspect the sheets before declaring native equivalence.
