# Remaining HOME selection resource audit

Audited in the Assets lane from `ae5c96a`, 26 September 2026. This audit
classifies source delivery requirements after Settings, Camera, Sound, Health
and eShop. It does not declare the remaining selections visually complete.

## Ordinary grid title: Nintendo Zone

`app-registry.ts` includes `nintendo-zone` as an application with `home: true`.
It is the remaining in-scope ordinary grid title, title `0004001000022b00`,
version 1034. Its private ExeFS CBMD is present and independently hashes to
`258aa3167be080eacb396539c5c3d76001d5ca12dc9d8b87955f7a977c4b2ec3`.
Independent LZ11 extraction gives:

- Common CGFX: `3e2b2896e8439ea88a767e71fedf6921936a49aae724065ac0bc3701a8a4b83e`.
- EUR-English CGFX: `57b8a0b278379dad8619d6eecc71a9354881b988775404d5dfc8b61485bbb992`.

Existing private conversions contain the common four-mesh model, eight
textures, skeletal and material `COMMON` clips (600 source frames), and the
selected EUR texture replacement. No Zone banner model is registered in the
public manifest. The transparent EUR `JPN_JP` texture does not make the common
model empty; common textures remain visible.

Publication through the current converter is not sound: its flattened curves
misinterpret mixed step bridges and lose four scalar groups. Re-ran
`audit_zone_playback.py` against the pinned private common source and existing
full conversion; it reproduces the documented mismatches (source value 1 vs
browser 15.5 at frame 119.5; source 5 vs browser 77.5 at frame 279.5).
The private report is `delegation/zone-playback-audit-20260926.json` under the
firmware artifact root, SHA-256
`28a1558cfc239c5ef40e9bf62690432b28c615a0a849c5146c9ea6be89e42f0f`.

Keep the existing publication block until a conversion/evaluation path preserves
segment interpolation and the missing scalar groups. Static pose substitution
would omit required source animation. See [playback boundary](native-zone-banner-playback-audit.md)
and [source slot audit](stock-2d-banner-boundary.md). No assets were published.

## Toolbar and indirect routes

| Selection | Registry title ID | Current route | Private extracted ExeFS banner |
| --- | --- | --- | --- |
| Game Notes | `0004003000009c02` | HOME toolbar | Absent |
| Friend List | `0004003000009f02` | HOME toolbar | Absent |
| Notifications | `000400300000a002` | HOME toolbar | Absent |
| Internet Browser | `0004003000009d02` | HOME toolbar | Absent |
| Miiverse | `000400300000be02` | HOME toolbar | Absent |
| amiibo Settings | `000400300000b902` | Indirect helper | Absent |
| System Transfer | `0004001000022a00` | Settings helper | Absent |
| System Update | `0004001000022f00` | Settings helper | Absent |
| NNID Settings | `000400100002c100` | Settings helper | Present |

The extracted directories exist for every row; the absence statements describe
those pinned extraction directories. All rows are `home: false` in the registry.
NNID's private banner hashes to
`4b8171abfcf0150c1f976291f85ba0de37a5e858a05ed670bb3d784badc3c7c8`;
its presence does not justify adding a HOME grid tile outside the chosen scope.

Toolbar selections are **not completed by ordinary-title activation**. The
HOME resolver records separate categories `[2,5,4,6,7,8,2,2]`, and the five
nondefault toolbar categories still require their dedicated resource/loading
path and native comparison. An absent applet ExeFS banner does not prove the
native upper screen has no banner. Do not replace it with the previously
selected grid application's CBMD. See [selection resolver](home-banner-observation-resolution.md).

Validation: live source directory inspection and hashes, independent Zone
common/EUR extraction, reproduced Zone playback audit, registry and resolver
inspection, and `git diff --check`. No runtime edits or UI operation; native
pixels, timing and toolbar presentation remain open.
