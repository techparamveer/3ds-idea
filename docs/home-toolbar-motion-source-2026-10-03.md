# HOME Toolbar Generic-Primary Motion - 3 October 2026

## Scope and correction

The captured Browser toolbar primary is close to edge-on in the current native
pair while production remains broad and front-facing. Notes and Miiverse had the
same implementation boundary: their decoded models were selected through the
ticketed HOME host, but their painters discarded the host pose and derived clip
frames from browser elapsed time.

This slice removes that painter-only divergence. Notes, Browser and Miiverse now
consume the existing immutable hosted visibility, scale, yaw, skeletal frame and
material frame, as Friends and Notifications already did. No resource, shader,
camera, stencil, label, readiness, request-ticket or publication policy changed.

## Source trace

The pinned EUR 10.7.0-32E HOME title remains `0004003000009802`, version 24576,
content index 0 / `00000082`. Its `exefs/code.bin` is SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Addresses below use its virtual base `0x100000`.

The existing dispatcher excerpt
`/Users/paramveer/.codex/3ds-artifact-overflow/presentation/banner-targets/dispatcher.asm`
(SHA-256 `9edfe5fdbd41b1118e637ada07d5583852d4d8bbde1d2bc853bba4e8687d4266`)
proves the focus/category/type mapping:

| Toolbar primary | Focus / category / native type | Request branch |
| --- | --- | --- |
| Notes | 1 / 5 / 15 | `0x1d7598..0x1d75b8` |
| Friends | 2 / 4 / 14 | `0x1d75bc..0x1d75dc` |
| Notifications | 3 / 6 / 16 | `0x1d75e0..0x1d7600` |
| Browser | 4 / 7 / 17 | `0x1d7604..0x1d7624` |
| Miiverse | 5 / 8 / 18 | `0x1d7628..0x1d7648` |

A bounded direct disassembly of the same pinned binary's `0x1f9324` type jump
table and its five branches establishes the shared outer-primary class:
the retained excerpt is
`A/home-toolbar-motion-20261003/source/generic-toolbar-primary.asm`, where `A`
is `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`,
SHA-256 `b8575bd012ed8ef20de58c3178b18422376c30799dd8019c82d31b0f4e3d091a`.

| Type | Branch | Resource pointer / name | Allocate / construct | Manager slot |
| --- | --- | --- | --- | --- |
| 14 Friends | `0x1f98d0` | table `+0x38` / `BannerAppletFriend` | `0xa4`; `0x1fa0fc` | `+0x5c` |
| 15 Notes | `0x1f9828` | table `+0x3c` / `BannerAppletMemo` | `0xa4`; `0x1fa0fc` | `+0x60` |
| 16 Notifications | `0x1f9978` | table `+0x40` / `BannerAppletNews` | `0xa4`; `0x1fa0fc` | `+0x64` |
| 17 Browser | `0x1f9a20` | table `+0x44` / `BannerAppletWeb` | `0xa4`; `0x1fa0fc` | `+0x68` |
| 18 Miiverse | `0x1f9b34` | table `+0x48` / `BannerAppletMvs` | `0xa4`; `0x1fa0fc` | `+0x6c` |

Each branch then invokes the constructed object's same resource-binding virtual
method. The common constructor installs the already documented generic-primary
update path: vtable `0x3210f0`, update slot `+0x14` at `0x1fa344`, quarter-step
visibility/scale, then common 600-count yaw at `0x24e0c0`. See the
[native banner lifecycle](native-banner-lifecycle.md) and the earlier
[Friend trace](home-friend-banner-source-2026-09-28.md).
The manager pass at `0x24c23c..0x24c264` gates retained primaries on resource
readiness and invokes that shared update slot.

The five existing decoded resources retain their own looping 600-frame skeletal
and 300-frame material clips. Their manifest mappings, source hashes and
`ctr-cgfx-web` 1.4.2 conversion identity remain in the
[toolbar source inventory](home-toolbar-banner-source-inventory-2026-09-28.md).
No extraction or asset conversion was performed for this slice.

## Implemented boundary

`src/os/screens.ts` forwards the active host's exact `HomeBannerMotion` object to
all five toolbar callbacks. `src/scene/console-scene.ts` applies the same existing
reduced-motion endpoint adaptation to each: visible ownership is retained while
scale becomes 1, yaw and both clip frames become 0. Otherwise the renderer uses
the host values unchanged. Native displacement and extra offsets remain zero.

`src/scene/firmware-banner.ts` samples Notes, Browser and Miiverse through the
same `renderPrimaryFrame` path as Friends and Notifications. Hidden hosted frames
return without painting. A missing or rejected selected resource still returns
an explicit failure, and the supplied native applet label remains bound only to
that selected model.

## Limits and required comparison

The common class proves shared ownership of outer visibility, scale and yaw; the
decoded resources prove their source clip identities and durations. It does not
establish the precise native activation epoch, first submitted skeletal or
material frame, wall-clock cadence, frame-to-presentation scheduling, native Y
displacement, or a resource-specific offset. This change therefore reuses the
existing host's counted lifecycle without adding a phase fit, elapsed-time
fallback or capture-derived constant.

The current native/browser pairs are the visible-defect baseline, not acceptance
evidence. Coordinator recapture must drive matched toolbar inputs, preserve the
raw 400x240 LCD targets, and compare motion checkpoints. Static and whole-scenario
pixel fidelity, exact input timing, cue timing and audio remain unproved.
