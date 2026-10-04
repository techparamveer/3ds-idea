# HOME HUD Colon Blink

Runtime `b51f135b` (integrated in `3ds-home-fidelity-20261001`). Follows the
[reference-profile HUD](home-hud-profile-2026-10-04.md).

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-hud-profile-20261004/`.
Native still `_26.09.26_04.14.35.203.png` has no colon at :35.

## Defect

`HudMenu_00` already has `T_TimeC_00`. Live HOME always showed it.
The 26 September still hides it. Settings traces colon visibility from the
previous displayed second; HOME's caller is untraced.

## Change

Worker `3ds-home-hud-colon-20261004` / `codex/home-hud-colon-20261004`,
`e70d62b1` → `b51f135b`: hide `T_TimeC_00` when the painted second is odd.
**Fitted adaptation** to that still, not a HOME service trace.

## Verification

- Full suite 2002 pass / 0 fail / 23 skip; typecheck and production build pass.
- Tests pin odd `:35` hidden and even `:34` visible.
- Recapture `R/browser-colon/upper.png` (SHA `e4f877ae…`) on preview 3021 at
  `b51f135b`: the colon is gone at :35, as on native. Clock hour is still
  05 versus native 04 (ISO-Z versus the local still). HUD-band MAE 3.06 →
  2.95. Whole scenario still fails.

## Remaining

The follow-up [Settings one-row recapture](home-hud-settings-recapture-2026-10-04.md)
fixes the capture clock and selected title for this still. WalkCoin fade,
wallpaper, banner yaw and whole-scenario acceptance remain open. Matrix
unchanged.
