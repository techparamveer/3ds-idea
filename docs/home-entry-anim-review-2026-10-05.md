# Independent review — HOME entry first-small / N057→N058 — 5 October 2026

U16R2. Grok 4.7 on
`/Users/paramveer/.codex/worktrees/home-anim-entry-review-20261005`
(`codex/home-anim-entry-review-20261005` at `cb5f9f97`). Review of leftover
`cb5f9f97` / worker note [HOME entry first-small](home-entry-anim-2026-10-05.md).
Different model from the U16 worker. Prior Claude round produced no note.
Docs only. No Azahar, production `:3000`, preview 3021, or CDP. This review
did not edit the painter.

**Verdict: APPROVE** of `cb5f9f97`.

No unique dump writer for the first-small / full step. The stepped ramp is
`0x1fa344`. Camera `COMMON` has no scale curves. Footer-14 `activationReady`
stays a host capture-fit. The note does not invent a pane and does not excuse
a painter change. This is not 1:1. The pixel box is still owed.

Implemented: N/A. Tested: N/A. Browser-inspected: N/A (no new session).
Native-compared: N/A. The recount below is from the pinned HOME `code.bin`
and the Camera CBMD, plus hashes of the already captured private run.

## Assigned leftover

Worker commit `cb5f9f97` on parent `bd0f8b72`. Note:
[home-entry-anim](home-entry-anim-2026-10-05.md). Footer-14 gate remains
`7b773b71` ([scale note](home-entry-banner-scale-2026-10-04.md)).

## HOME executable

EUR HOME `0004003000009802`. Pinned
`/Users/paramveer/.codex/3ds-artifact-overflow/assets/extracted/home/exefs/code.bin`
SHA-256 `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Virtual base `0x100000`. Instructions below are the file words, not the
worker listing.

`0x1fa344` loads this pool:

| Address | Word | Value |
| --- | --- | --- |
| `0x1fa494` | `0x3e800000` | `0.25` into `s19` (`vldr` at `0x1fa360`) |
| `0x1fa498` | `0x3e4ccccc` | `0.19999998807907104` into `s20` (`0x1fa364`) |
| `0x1fa49c` | `0x3f4ccccd` | `0.800000011920929` into `s16` (`0x1fa368`) |
| `0x1fa4a0` | `0x00000000` | `0.0` into `s18` (`0x1fa36c`) |

`0x3e4ccccc` occurs once in this `code.bin`. The show path, when actual
visibility `+0x3c` is 0, zeros counter `+0xa0` and calls `0x1f7c78`
(`bl` at `0x1fa398`). `0x1f7c78` calls `0x24f3b0`. The scale block then
converts the counter, multiplies by `0.25`, and `vmla.f32` (`0x1fa3cc`,
word `0xee008a0a`) does `s16 = 0.8 + progress * 0x3e4ccccc`. `0x1f8450`
returns the object; `add r0, #0x50` then `vstr s16` at `+0x30`, `+0x34`,
and `+0x38` (`0x1fa3d4..0x1fa3e0`). The counter increments. Hide uses the
same `vmla` at `0x1fa458` after `sub` at `0x1fa43c`. The function tails to
`0x24e0c0` at `0x1fa490`.

Float32 results of that VMLA:

| Counter | Scale |
| ---: | --- |
| 0 | `0.800000011920929` |
| 1 | `0.8500000238418579` |
| 2 | `0.8999999761581421` |
| 3 | `0.949999988079071` |
| 4 | `1.0` |

A counter above 4 is stored back as 4 and skips the store (`0x1fa3ac`).
The first eligible update is 0.8. Four more updates reach 1.0.

Other `0x3f4ccccd` words exist (`0x22dc48`, `0x249888`, `0x2670f8`,
`0x2b8884`, and three unreferenced words near `0x30f3fc`). None is paired
with `0x3e4ccccc`. They are not this ramp.

## Who reaches `0x1fa344`

Constructor `0x1fa0fc` stores vtable `0x3210f0` (`ldr` literal `0x1fa188`,
`str` at `0x1fa110`). That vtable's `+0x14` is the only pointer to
`0x1fa344` (`0x321104`). The manager pass `0x24c258..0x24c264` loads
`[object]`, then `[vtable, #0x14]`, then `blx`.

| Caller | How it reaches the ramp |
| --- | --- |
| Type 1 primary / secondary | `bl 0x1fa0fc` at `0x24ca24` / `0x24ca60`, stores `+0x50` / `+0x54`, leaves vtable `0x3210f0` |
| Default type 7 | `bl 0x1fa0fc` at `0x1f9404`, stores `+0x58`, leaves `0x3210f0` |
| Toolbar 14–18 | same constructor from `0x1f994c`, `0x1f98a4`, `0x1f99f4`, `0x1f9a9c`, `0x1f9bb0`; Friends stores `+0x5c` and does not replace the vtable |
| Folder types 9–12 | thunk `0x2492b0` constructs with `0x1fa0fc`, then stores vtable `0x3210b8`. Slot `+0x14` is `0x249164`, a tail `b 0x1fa344` |
| Type 5 | thunk `0x248f10` stores vtable `0x321070`. Slot `+0x14` is `0x248d54`, which `bl`s `0x1fa344` |

The type switch at `0x1f9334` is `sub r0, r4, #3` and `ldrcc pc, [pc, r0, lsl #2]`
into the table at `0x1f9344`. Type 1 is outside that table and uses the
worker above. Camera's ordinary title is that type-1 path. Folder does not
keep `0x3210f0`, but its update slot is still this function. The ramp is
not a Camera-only writer.

## Camera CGFX

Private `exefs/banner.bin` for `0004001000022400` v4097 content
`0000001a`, SHA-256
`e4808dcf84e490c73200ee5f9cb2ba72d096c93d6ccdf08d88d733988fd66280`.
Common LZ11 at CBMD `0x88` decompresses to CGFX SHA-256
`068d2d09cddc0f9c23f9b3e126f7a4942ce52957910102a831298e14fa1b361d`.
EUR-English at `0x7d82` is a different CGFX, SHA-256
`21f8723b955b36b9575d0a92b942889bd978f868163c9b75063528f561105ccb`.

Common skeletal `COMMON`: target `SkeletalAnimation`, loop mode 1,
600 frames, three transform elements (`primitive type 5`). Scale-inexistent
bits 16–18:

| Bone | Flags | Scale X/Y/Z inexistent | ScaleExists |
| --- | --- | --- | --- |
| `p0` | `0x00ef8000` | 1 / 1 / 1 | false |
| `p1` | `0x00f78000` | 1 / 1 / 1 | false |
| `p2` | `0x02c70800` | 1 / 1 / 1 | false |

No constant-scale bits are set. Material, visibility, and camera animation
counts are 0. Bone objects whose name pointer is `p0` / `p1` / `p2` have
bind scale float32 `0x3f47ae14` (`0.7799999713897705`) on X, Y, and Z.
`Logo` and `Nw4cRoot` are unit scale. That bind does not change between
frames, so it cannot own N057→N058.

EUR has no models and no skeletal animation. Its textures are `COMMON1`
and `COMMON2` only.

`drawStockTitleFrame` in the parent tree applies `frame.scale` on the
outer group and samples skeletal `COMMON`. `cb5f9f97` does not change
that file. There is no Camera scale clip to bind instead.

## Footer-14 gate

`7b773b71` is an ancestor of this commit. Its subject is the live
footer-14 activation sample. `HOME_ENTRY_FOOTER_LAST_FRAME` is 14.
`homeEntryBannerActivationDue` is true for an ordinary host, or for a
live entry when the footer sample is frame 14 or the terminal receipt is
already stored. The banner service treats `activationReady === false` as
not yet due. Nothing in `0x1fa344` reads a SceneIn frame. The gate delays
the host activate branch. It is not a firmware scale writer.

## Already captured run

Private
`/Volumes/Sandisk1/3ds-fidelity-artifacts/home-entry-banner-20261005/run/`,
re-hashed here, not recaptured. `result.json` SHA-256
`c2f8bfde11899f651e9b3dadd4e96de668442d547bbf349a3c363ae707bd19df`,
`commit` `bd0f8b72`, 26 frames, `nativeEpochMatched` false, errors empty.
Collector `capture-entry-3000.mjs` SHA-256
`e4d411fb040ceb0573055123ec5b8b2a040eec8bfc7c2daaf04d67ce602d475d`.

| Frame | `homeUpdateDelta` | Host | Scale | Upper SHA-256 |
| --- | ---: | --- | --- | --- |
| `frame-008` | 17 | `stage` `loading`, `status` `pending`, `primary` null | — | `3f1a17f306663409fc208814d00a0712d7e144e51cee321388657440b82d74dd` |
| `frame-009` | 20 | `active`, `visibilityCounter` 3, `visibilityManagerUpdate` 18 | `0.8999999761581421` | `212217926fcc07d50f69cfd52ee1518fa9f2ed6863590d0f71d8172bb4284435` |
| `frame-010` | 24 | `active`, scale already 1 | `1` | `43754ae515e09722243b3e68ca29686d21bd989cd4840a12fb4852a36402ea72` |

Delta 20 at counter 3 is the third VMLA write (operand counter 2). The
same record's `visibilityManagerUpdate` is 18, so the first 0.8 write is
that manager update. Frames 18 and 19 are not in the 26-frame list
(deltas jump 17 → 20). Native first-small remains about update 17. The
one-update gap is still open.

`_03.10.26_04.23.49.262.png` was not present under `/Volumes/Sandisk1` or
`/Volumes/DeveloperStorage/CodexArtifacts`. The note's kept SHA-256
`17d3ecc01a01d0e05a1eb1b31fc4f1782a7985bfe5211786a52287955e69a1db` was not
re-opened. The rectangle `x40..360, y80..170` is the owed ROI from the
scale note; this run's `result.json` does not record a measured box.

## Painter

`git diff --name-only bd0f8b72 cb5f9f97` is only
`docs/home-entry-anim-2026-10-05.md`. No `src/scene` or `src/os` change.
`git diff --check` on this review note is clean.

## Still open

Coordinator recapture with `capture-entry.mjs`
`c36374abd43a73f539983d256725ada51a56409ac35bc2da1a4cc6c6a84e7a63`
against N057 / N058, in the banner box, first-small versus native ≈17.
Whole-scenario status stays fail. Tests, this note, and the private run
hashes do not close pixels, input, motion, or audio.
