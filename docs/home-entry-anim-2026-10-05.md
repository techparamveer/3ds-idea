# HOME entry first-small / N057→N058 scale — leftover — 5 October 2026

Worker U16 on `codex/home-anim-entry-20261005` at `bd0f8b72`. Sparse
worktree; no `model/`. One bounded source-only slice. No painter change.
No Azahar. No production `:3000`. No preview 3021. No CDP. No recapture.
Do not CSS-reconstruct the banner.

This is not a 1:1 claim. Tests and this note do not close pixels, input,
motion, or audio. Footer-14 `activationReady` at `7b773b71` stays a
labelled capture-fit adaptation
([scale note](home-entry-banner-scale-2026-10-04.md)).

## Decision

**No unique dump writer.** Stop.

The first-small / N057→N058 size change is not owned by a Camera CGFX
scale track, a layout pane, or an entry-only ARM store. The only scale
writer that produces a first-visible 0.8 then a later full size is the
already-kept generic primary updater `0x1fa344`. That routine is shared
by folder, default, toolbar types 14–18, and ordinary type-1 titles. It
is not unique to HOME-entry Camera or to the N057/N058 still pair.

## Shared writer (not unique)

Pinned EUR HOME `0004003000009802` `exefs/code.bin` SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Virtual base `0x100000`. Isolated folder-lifecycle excerpt
`folder-update.asm` and host-order proof
`proof-1fa344-1fa3b0.asm` remain the executed source for this path
([native banner lifecycle](native-banner-lifecycle.md)).

On a show request, `0x1fa344` attaches through `0x1f7c78`, then
`vmla.f32` of float32 `0x3f4ccccd` (0.8) with progress × `0x3e4ccccc`
(`0.19999998807907104`) writes the outer transform scale at
`transform+0x30/+0x34/+0x38`. The first eligible manager update is
scale `0.800000011920929`. Four more updates reach `1.0`
(`0.85`, `0.90`, `0.95`, `1.0`). Hide decrements the same counter.
Type-1 Camera reaches that slot through constructor `0x1fa0fc` /
vtable `0x3210f0` `+0x14` — the same generic path as Settings
([type-1 lifecycle](native-settings-type1-lifecycle.md)).

`home-banner-lifecycle.ts` already samples that float32 ramp. The
footer-14 `activationReady` conjunction only delays the activate
branch. It does not recover a firmware activation writer and does not
schedule the float store from SceneIn 14.

## Camera dump is not a second scale writer

Camera title `0004001000022400` v4097 content `0000001a`. Published
common CGFX SHA-256
`068d2d09cddc0f9c23f9b3e126f7a4942ce52957910102a831298e14fa1b361d`.
Skeletal `COMMON` is 600 frames, looping. Bones `p0` / `p1` / `p2`
have bind scale `(0.78, 0.78, 0.78)`
([asset audit](camera-home-banner-asset-audit.md)). Every element's
`ScaleExists` is **false**; `ScaleX` / `ScaleY` / `ScaleZ` curves do
not exist. EUR is texture replacement only. The 0.78 bind is constant
across N057 and N058, so it cannot own the first-small → full delta.

`firmware-banner.ts` `drawStockTitleFrame` applies host `frame.scale`
to the outer group and samples `COMMON` skeletal frame. There is no
unused Camera scale clip to bind instead.

## Browser frames at this HEAD

Private run
`/Volumes/Sandisk1/3ds-fidelity-artifacts/home-entry-banner-20261005/run/`
at checkout `bd0f8b72`, 26 pairs, collector
`capture-entry-3000.mjs` SHA-256
`e4d411fb040ceb0573055123ec5b8b2a040eec8bfc7c2daaf04d67ce602d475d`.
`result.json` SHA-256
`c2f8bfde11899f651e9b3dadd4e96de668442d547bbf349a3c363ae707bd19df`.
`nativeEpochMatched` is false. Banner box remains
`x40..360, y80..170`.

| Frame | `homeUpdateDelta` | Host | Motion scale | Upper SHA-256 |
| --- | ---: | --- | ---: | --- |
| `frame-008` | **17** | `loading` / `pending`, no primary | — | `3f1a17f306663409fc208814d00a0712d7e144e51cee321388657440b82d74dd` |
| `frame-009` | **20** | `active` | `0.8999999761581421` (`visibilityCounter` 3) | `212217926fcc07d50f69cfd52ee1518fa9f2ed6863590d0f71d8172bb4284435` |
| `frame-010` | **24** | `active` | `1` | `43754ae515e09722243b3e68ca29686d21bd989cd4840a12fb4852a36402ea72` |

Native first-small is about update 17 (N057). This run is still
loading at that delta: wallpaper only, no Camera primary. The first
captured active paint is delta 20 at mid-ramp 0.90, which is the
third `0x1fa344` write (yaw counter 3). That implies first-small
around update 18, the same one-update-late gap the 4 October staging
run already recorded. The collector spacing cannot show 0.80 / 0.85
between 17 and 20.

## Native pair

N057 own 400×480 PNG `_03.10.26_04.23.49.262.png` SHA-256
`17d3ecc01a01d0e05a1eb1b31fc4f1782a7985bfe5211786a52287955e69a1db`
is **unmounted** on this worker. The hashed identity is kept from
[banner restart](home-entry-banner-2026-10-03.md) and the
[scale note](home-entry-banner-scale-2026-10-04.md). N056 none,
N057 ~0.8 with the footer terminal, N058 (≈20) full / nearly full.
Those stills were not opened here. Do not invent pixels.

Coordinator recapture in leftover-queue §3 for `7b773b71` stays
owed: `capture-entry.mjs` `c36374ab…` against N057 / N058, banner
box, first-small update versus native ≈17.

## Why this slice does not change code

A unique writer would have been a Camera-only CGFX scale track, a
layout/TEV owner, or an ARM store that writes first-small / N057→N058
and nothing else. None of those exists. Retuning `activationReady`,
compressing the four post-activation manager updates, or painting a
guessed 0.8 box would be another capture-fit, not a recovered dump
bind. The existing `0x1fa344` ramp and the labelled footer-14 gate
stay.

Painter unchanged. Whole-scenario status remains fail.
