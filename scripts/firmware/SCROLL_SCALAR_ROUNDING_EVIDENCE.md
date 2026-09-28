# Native scroll scalar rounding

2026-09-23. `0x1d7b50` rounds the interpolated **scroll scalar** with ceiling
when positive and floor when nonpositive. Exact integers remain unchanged.
Grid coordinate arrays and the interpolated density value do not receive this
integer-rounding step. Mode5 uses the same scalar rounding.

The integration implementation in `src/os/home-navigation.ts`,
`sampleHomeGrid`, already applies `scroll > 0 ? Math.ceil(scroll) :
Math.floor(scroll)` after its float32 blend. It matches this rule; no runtime
geometry change is required by this check. The earlier primary-cursor note
has been clarified to avoid implying that current browser scroll is unrounded.

## Source and reproduction

EUR HOME `0004003000009802`, version24576, original executable mapped at
`0x100000`; SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Run [home_scroll_scalar_rounding.py](home_scroll_scalar_rounding.py) using
Unicorn2.1.4 and Capstone5, with `--code` and `--output`. Firmware, numeric
results and six hashed source excerpts remain private under:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-scroll-rounding/verified/`.

| Artifact | SHA-256 |
| --- | --- |
| Fixture | `e1ff61d1285c46a968f63c1ac6e1d27488e27595117110273a4441b806a021fb` |
| `checked.json` | `872f552dc36d14907c54c7f64443ee68e19aaa22f0145c6def912e34867c9822` |

All26 direct helper cases and14 shared interpolation cases pass. This is a
small arithmetic follow-up to [primary cursor boundaries](PRIMARY_CURSOR_BOUNDARY_EVIDENCE.md),
not another lifecycle, gesture or geometry reconstruction audit.

## Exact operation and separate values

At`0x1d7bd0..1d7bec`, the original VFP instructions form the scroll scalar
from float32 weight `w`, start `a=S+0x3a2c` and target `b=S+0x3a30`:

```text
raw = f32(f32(f32(1 - w) * a) + f32(w * b))
scroll = raw > 0 ? ceil(raw) : floor(raw)
```

The code first stores `raw` at`S+0x3a28`, compares it with zero, calls
`0x208688` on the positive branch or`0x208760` on the nonpositive branch,
then overwrites `S+0x3a28` with the result at`0x1d7c18`.

The two helpers implement ceiling/floor with exponent/fraction-bit checks.
An exact integer takes an unchanged return; a binary32 value with exponent
at least23 already has no fractional bits. Direct executions include±2²³,
±17, fractional values around zero,16.8 and the next float32 value above17.
The latter becomes18, proving that no tolerance or “almost integer” exception
is applied. Direct helper calls preserve both signed zeros. This does not
claim that every preceding interpolation preserves the sign of a zero.

The rule is outward from zero, based on the scalar's sign, not on movement
direction. For example, a decreasing but still positive scroll of67.2 rounds
up to68. A negative−16.25 rounds down to−17; exact−16 stays−16. Ordinary valid
viewport offsets in the preceding mode3 sequences are nonnegative. Negative
inputs here establish the shared function's supported arithmetic branch,
not reachability of negative scroll during ordinary navigation or gestures.

The360 grid X/Y values at`S+0x1868` /`S+0x1e08` are written earlier at
`0x1d7b6c..1d7bb4` using float32 `start + w*(target-start)`. Density at
`S+0x1194` uses the same interpolation form later at`0x1d7c48..1d7c60`.
Neither path invokes these ceiling/floor helpers. In the shared weight¼
case, X10.25→14.75 becomes11.375 and density1→3 becomes1.5, while scroll
0→65 becomes raw16.25 then rounded17. Applying integer rounding to all three
would incorrectly change coordinate and density values.

## Mode3 and mode5 scope

The mode3 cases run original tick`0x2a1bbc`, including elapsed increment and
float32 elapsed/duration division, then actual`0x1d7b50`. The mode5 cases run
its original call site`0x1d31a4..0x1d31b4` with the already calculated weight
at`S+0x11a0` supplied. Static source`0x1d2fac` shows that weight comes from
its earlier curve calculation. This follow-up does not revalidate that curve
or the complete density/controller lifecycle.

The mode5/187 check at`0x1d7c20..1d7c28` occurs **after** rounding. It skips
the later scroll-notification call`0x1eb4cc`; it does not bypass rounding or
round the coordinate arrays. Executed mode3/mode5 pairs have identical scalar,
coordinate and density results, with notification present only for mode3.

Grid metrics`0x1d7f3c` and scroll notification`0x1eb4cc` are explicit recording
endpoints. Inputs are supplied finite normal values, exact integers and signed
zeros. No NaN/subnormal/exception-mode behavior, negative-scroll gesture path,
full HOME lifecycle or rendered result is claimed. No application file changed.
