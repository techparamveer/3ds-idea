# HOME cold-boot reveal endpoint handoff

Base: `513a8fcd32c54a728a7c5b16a1e3381bd928cd4b`

Branch: `codex/home-power-reveal-20261002`

Feature IDs: L-01

## Delivered correction

The existing browser boot phase remains 3000 ms, with its source-backed reveal
inside the final 350 ms. Reduced motion remains 300 ms with a final 120 ms
reveal. This slice does not replace either adapted duration with guessed native
timing and does not add a startup logo.

The old mapping divided the reveal window into 20 transitions and first selected
source frame 20 at exactly 3000 ms. `tickSystem` changes `boot` to `home` at
that same deadline, so the boot overlay could only offer frames 0 through 19 to
a live pre-deadline paint. The authored transparent endpoint had no boot-phase
presentation interval.

`bootRevealFrame` now treats the non-looping clip as its declared 21 poses. In
the normal 350 ms window, each pose receives one nominal 60 Hz slot: frame 0
begins at 2650 ms, frame 19 remains selected at 2983 ms, and frame 20 is selected
from 2984 ms through the final pre-deadline millisecond. Both LCDs consume the
same frame in one overlay call. The reduced-motion window compresses the same 21
poses without changing its existing 120 ms duration.

This makes the transparent endpoint eligible before logical phase completion;
it does not prove that every host display cadence publishes that slot. A strict
last-pose publication barrier would cross the coordinator-owned `system.ts` /
screen-paint contract. It should not be added until matched capture or a traced
native completion rule establishes the required ordering.

## Native element and provenance mapping

| Visible element | Manifest and converted key | Decrypted dump source | SHA-256 |
| --- | --- | --- | --- |
| Upper black-to-transparent reveal | `manifest.home.common` -> `packs/home/common.json` -> layout `CmnFadeNinLogo_U_00`, animation `CmnFadeNinLogo_U_00_SceneIn` | `romfs/common_LZ.bin/blyt/CmnFadeNinLogo_U_00.bclyt`; `romfs/common_LZ.bin/anim/CmnFadeNinLogo_U_00_SceneIn.bclan` | layout `4fa249b4622c382f56cee46d431c73922dc1dfce3985219eb81d27fa02a216e4`; animation `e6754c338e1c3683da21eb59a0b69c84fa9b5005b2e5629d898cd36dd9bb7f05` |
| Lower black-to-transparent reveal | `manifest.home.common` -> `packs/home/common.json` -> layout `CmnFadeNinLogo_D_00`, animation `CmnFadeNinLogo_D_00_SceneIn` | `romfs/common_LZ.bin/blyt/CmnFadeNinLogo_D_00.bclyt`; `romfs/common_LZ.bin/anim/CmnFadeNinLogo_D_00_SceneIn.bclan` | layout `85066557c7a3e7605d01d853673ca4ea4f64abdc7a455c4aaaf2d34d63ad2d6b`; animation `e6754c338e1c3683da21eb59a0b69c84fa9b5005b2e5629d898cd36dd9bb7f05` |

The transitive source is pinned EUR 10.7.0-32E HOME Menu title
`0004003000009802` v24576, content index 0 / ID `00000082`.
`common_LZ.bin` has SHA-256
`543fbf31b7ca5c44580075c0632f2d99d6e88843cd85f801fb9ada1da5ec2af8`;
the selected decrypted content has SHA-256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
The encrypted owner-supplied CIA recorded by `docs/firmware-inventory.json` has
SHA-256 `011d0276fb947315ef06f385cdb444f5e194d23573caf0e3efbeb2c82673654e`.
The delivered `common.json` has SHA-256
`eb472b6a6c60668cdbdb88314fd010bc97b354c472adc47a9fc78629d1eb9b82`
and was converted by `ctr-native-web` 1.2.0 with CTRTool 1.3.0. The manifest
records the title-level source identity
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
this handoff does not relabel that field as the encrypted CIA hash.

Both SceneIn clips declare 21 frames, no loop, source range 140..160, and one
Hermite alpha track on `P_00`: frame 0 / alpha 255 and frame 20 / alpha 0, with
zero slopes at both keys. No upper/lower delay or three-second hold is authored
in these resources.

## Verification boundary

Focused Node coverage verifies the normal and reduced schedules, the frame-19
to frame-20 boundary before phase completion, paired upper/lower SceneIn
bindings, and preservation of the un-erased HOME underlay. Type checking and
`git diff --check` are required before handoff. This worker operated no browser,
Azahar, GUI, audio session, or production build.

Coordinator recapture should power on from the existing portfolio off state and
record raw upper/lower LCD targets across the final reveal window with paint
timestamps, especially the last two pre-deadline paints and first HOME paint.
Compare the same input sequence against an isolated original-hardware-mode
native capture. If host cadence skips the endpoint slot, record the skip rather
than calling this scenario passed; then trace or capture a native completion
barrier before changing phase duration or paint ordering.

## Remaining adaptations and gaps

- 3000 ms boot duration, 350 ms normal reveal window, and the reduced-motion
  300/120 ms schedule remain browser adaptations.
- The exact native cold-entry predicate, animation advancement/completion order,
  first LCD/backlight publication and blue-indicator timing remain unresolved.
- Native evidence does not establish an app-launch Nintendo logo during cold
  boot, so none is rendered.
- The current source-backed SceneIn endpoint is only eligible for a host paint;
  guaranteed terminal-pose publication is not claimed.
- Exact input, motion, audio and matched native/browser scenario acceptance
  remain coordinator work.
