# Sound entry birds: source identities and live motion gate

The current settled entry composition repeats `ParakeetA_U_Wait` at frame zero.
The original resources contain more poses, but simply advancing this Wait clip
cannot reproduce native idle behavior. This audit makes **no live UI change**.

## Distinct native owners

Do not conflate the two upper bird families because they share child artwork.

- `0x231a84..0x231ac4` constructs two direct `ParakeetA_U` layouts at global
  app+0xf0/+0xf4 and passes them to app+0x60's `0x2484d8`. That owner stores
  them at +0xc98/+0xcdc, places them at x −24/+24 and y −72, binds Wait, and
  disables both with flags 0x1e. Later `0x24ddfc..0x24de94` enables them and
  selects InL_U/InR_U. Their existence does not establish empty-entry eligibility.
- `0x231ad8..0x231bb0` separately constructs **three** `ParakeetEx_U` objects
  through `0x1e052c`, stored at global app+0xd8/+0xdc/+0xe0. Original base x is
  `−157 + 50*i`, y −72, with random horizontal extent 10 and variant byte zero.
  `ParakeetEx_U.bclyt` has the `-L-ChaA` metadata mount
  `LYT=Parakeet/ParakeetA_U`; its two button panes are separate from that child.
- Extended initialization `0x1e030c` binds child Wait, sets state 9, disables
  the layout, initializes fields and picks an initial integer delay 0..20.
  The range helper at `0x1fcf60` uses an inclusive high endpoint and advances
  four-word shared XOR-shift state. This is not `Math.random()` or a constant
  phase offset assigned independently to each bird.

The supplied settled upper screenshot shows two birds near x35/x95 and not the
third. Initial coordinates alone do not explain that complete frame. The third
extended bird participates in a paired flight trigger with the lower bird at
`0x236394..0x236408`; eligibility includes other owner fields and a countdown.
Those fields have not been mapped to the website's empty-library state.

## Confirmed idle selection and clock consumer

`0x2364ac..0x2364c8` visits all three extended upper objects in index order and
calls `0x1fc830` with float **global app+0x38** in s0. The same pass then updates
three lower objects. The consumer subtracts that float from its countdowns;
this slice does not establish the producer's units, pause rules or relation to
child layout animation advancement.

`0x1fcd8c` selects a clip through variant tables and restarts the child controller
via `0x20bed8`. Variant-zero table at `0x371f14` is:

| State | Clip |
| --- | --- |
| 0 | Wait |
| 1–6 | RandomA, RandomB, RandomC, RandomD, RandomF, RandomG |
| 7–8 | RandomI, RandomJ |
| 9 / 10 | OutL_U / InL_U |
| 11 / 12 | Wait / FlyLoopL |

Entering state zero draws an integer **50..300** into +0xfc. The idle updater
subtracts its supplied delta and selects an integer **1..6 only when the result
is strictly negative** (`0x1fc934..0x1fc96c`). Zero is not expiry. States 7/8 are
not part of this ordinary random draw. Entering from the hidden state also draws
a horizontal offset in −extent..+extent and submits InL_U; clip completion and
other flags later determine visibility and state changes.

The original Wait resource is 60 frames, looping; its texture keys are image 0
at frame 0 and image 1 at frame 60. Frames 0..59 therefore share one pose.
The six ordinarily selected Random clips are each **61 frames, nonlooping**,
with authored intermediate texture keys and a return to the base image at frame
60. They must not be replaced by a sine bob or a loop of Wait.

## Precise implementation gate

Before enabling motion in the live empty-entry view, establish all of:

1. Empty-entry owner activation and the +0x108/+0x109/+0x104 writers controlling
   each extended bird, including the third bird's flight/visibility sequence.
2. The producer of app+0x38, pause/resume rules, and ordering of `0x1fc830`,
   `0x20bed8` reset, native child-layout frame advancement and completion reads.
3. Shared RNG initialization and ordered consumption, or an explicitly labelled
   deterministic portfolio adaptation. The current task requires exact evidence,
   so a new browser seed is not silently substituted.
4. A presentation-owned clock/cache key that cannot advance through loading,
   recovery, HOME suspension, playback or stale async completions. Painting alone
   must not advance an independent random controller.

The archive resources are available. The blocker is owner/scheduling evidence,
not a missing file. No animation packs or runtime files were changed by this slice.

## Executable evidence and visual inspection

`scripts/firmware/sound_bird_audit.py` checks the pinned executable SHA, 38 exact
instructions, native lookup table, wrapper mount, initial coordinates and twelve
original clips. [Source report](evidence/sound-entry-bird-source.json) records
instruction facts and individual resource hashes. The script can independently
decode required BCLIM images into a private `--textures` directory.

`scripts/verify-sound-bird-poses.mjs` makes a contact sheet of 49 explicit texture
checkpoints. These are original texture poses, **not a composited upper LCD or
native schedule replay**. The Wait endpoint is shown explicitly even though a
loop sampler may wrap it. The sheet and supplied settled native capture were
visually inspected; there is no native motion sequence or frame-phase comparison.

Artifacts: `/Users/paramveer/.codex/artifacts/sound-bird-source/`, including
`pattern-checkpoints.png`, controller disassembly and decoded texture specimens.
The supplied native capture remains
`/Users/paramveer/.codex/artifacts/native-settings-2026-09-24/screenshots/Nintendo 3DS Sound_24.09.26_10.52.20.238.png`.
Run the audit with absolute `--code`, `--archive`, `--report`, `--textures` paths;
run the pose verifier with absolute `--report`, `--textures`, `--output` paths.
No browser/emulator session was driven. As this is evidence-only, an application
build is not required; the preceding live mipmap commit passed its production build.

## Settled entry pose comparison

The single pinned SD-absent native capture can resolve the **placement** of its
three visible Wait sprites without resolving their idle schedule. The published
source layout and Wait clips remain in use; the empty-entry painter now centres
the upper sprites at `(35,192)` and `(94,192)` and the lower sprite at `(21,123)`
in their respective 400×240 and 320×240 LCDs. The earlier positions were
`(35,198)`, `(95,198)` and `(20,128)`. No other Sound view was changed.

`scripts/compare-sound-bird-pose.mjs` checks the pinned capture SHA and compares
vivid green/yellow silhouette pixels in fixed matched LCD crops. This avoids
judging the upper room, which the source-screen verifier does not compose.

| Bird | Earlier silhouette IoU | Corrected IoU | Earlier / corrected RGB error on native bird pixels |
| --- | ---: | ---: | ---: |
| Upper left | 0.576 | 1.000 | 51.342 / 0.762 |
| Upper right | 0.563 | 1.000 | 52.603 / 0.698 |
| Lower | 0.594 | 1.000 | 47.990 / 0.027 |

Each native crop has 478 coloured bird pixels; all 478 occur at the same
coordinates after the correction. The RGB metric is mean absolute difference
per channel out of 255. These measurements establish one settled screenshot
pose only. The pose comparison JSON and source-screen renders are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/sound-bird-pose-2026-09-25/`.
The pinned executable/archive audit was rerun there and verified 38 instruction
facts and 12 original clips. The 57-pair source-screen verifier, focused Sound
entry test, typecheck and production build pass in the isolated worktree.
The animation, visibility, third-bird and presentation-clock gates above remain
open. A live browser inspection remains the integration coordinator's gate.
