# Title-owned incoming cover assets

## Scope and status

Asset-only slice on `codex/applet-incoming-assets-20261007`, base
`9882f97c2bf77fb1ee5a45b294fcbe77828555f9`. Dirty STATUS is preserved and is
not a delivery path. The owned publisher and tests select only the original
Friends/Notifications incoming covers. Existing selection configs, title
endpoint painters, loaders, controllers, screens, scene, Manual, Notes and
folder behavior are unchanged here. Coordinator owns visible integration and
native comparison; B owns the incoming controller/helper.

Current checkpoint: original source conversion and private fixtures validate;
public publication is awaiting explicit user export approval. The default
command failed to create its assigned Sandisk scratch directory. The subsequent
permission review rejected public firmware-derived export without specific
human authorization. No public assets or manifest records were written by
either attempt. Private converter fixtures at
`/private/tmp/3ds-applet-incoming-fixtures-20261007/{friends,notifications}/incoming.json`
support read-only helper verification, not asset delivery or acceptance.

## Resource contract

| Caller | Alias / relative URL | Original layouts / clips | Selected native label |
| --- | --- | --- | --- |
| Friends | `friends-incoming` / `packs/friends/incoming.json` | `FrdCmnFade_U_00`, `FrdCmnFade_D_00`; each `_SceneIn` | `friend_msbt_LZ/fri_title_fri`, original index 6, retained style index 39, `Friend List` |
| Notifications | `notifications-incoming` / `packs/notifications/incoming.json` | `CmnFade_U_00`, `CmnFade_D_00`; each `_SceneIn` | `newslist_msbt_LZ/new_title_new`, original index 26, retained style index 13, `Notifications` |

Each NativePack contains only those two layouts, two clips, one English label,
its original full sibling style table and the seven selected texture records.
Clips retain 21 poses 0..20, no loop, childBinding=true and sourceFrameRange
`[20,40]`. Original split-frame keys, slopes, group bindings, material tints,
UVs, icon selection, geometry and text pane records are unchanged.

Upper has no font record; lower retains `cbf_std.bcfnt`. Proposed title font
keys `contents/0000-00000017/cbf_std.bcfnt` and
`contents/0000-00000012/cbf_std.bcfnt` map to the existing dump-derived native
shared font `fonts/shared/font.json`, SHA-256
`d48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27`.
Its original shared title is `0004009b00014002`, source
`cbf_std.bcfnt.lz`, SHA-256
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
`incomingFontBinding.titleRuntimeResolutionEstablished=false` explicitly marks
this native shared-font presentation binding, not proof of either title's
internal font acquisition. No HOME HUD font, substitute or fabricated font is
published. All required texture PNGs already exist and match their current
manifest hashes; publication needs no new PNG or alteration of old records.

## Plain-label writer proof

The incoming caller resolves localized UTF-16 and calls a plain TextBox writer.
It does **not** transfer the RI message style. Runtime overrides must be
`{text: selectedMessage.text}` for `T_Aplt_00` and `T_Home_00`, without
`messageStyle`, font-size, spacing, color or alignment overrides. Preserve the
original TextBox size `[22.5,27]` and all other source properties. Do not use
`nativeMessageOverride` on this bounded path: that API would attach the style.
This supersedes any inference in the earlier source handoffs that a retained
bank style index establishes metric application for the incoming title label.

| Title | Selected caller, resolver and wrapper | Plain writer | Separate, unreached style path |
| --- | --- | --- | --- |
| Friends | `0x186384..0x1863ec` calls resolver `0x17ed30` twice and wrapper `0x17f5d4` twice; resolver tails to UTF-16 getter `0x124c34` | wrapper BL at `0x17f648` -> `0x11cbbc..0x11cd20` | named style writer `0x11c960`, getter `0x12ab58`, metric block `0x11c9e4..0x11caa4` |
| Notifications | `0x14fd34..0x14fd98` calls resolver `0x149d8c` twice and wrapper `0x14a680` twice; resolver tails to UTF-16 getter `0x11f434` | wrapper BL at `0x14a6fc` -> `0x116948..0x116c14` | named style writer `0x1166ec`, getter `0x1244cc`, metric block `0x116770..0x116830` |

Range ends are exclusive; subtract image base `0x100000` for code.bin offsets.
`incomingTextBinding` pins title/code, bank, label, original index, style index,
`styleApplied=false`, `retainedStyleTable=non-applied-reference`, range hashes
and exact ARM branch targets/link bits. Its `proof.ranges` entries are
`[start,endExclusive,sha256]`; `proof.branches` entries are
`[instructionAddress,target,link]`. The publisher verifies the original bytes
and branch edges before conversion. Tests redirect the selected wrapper call
to both the named-style writer and getter, and remove its link bit; each is
rejected. This is a pinned decoded-instruction check, not original ARM execution
or a complete title/controller emulator.

Both separate 192-byte metric blocks are byte-identical to verified HOME
`0x11e634..0x11e6f4`, SHA-256
`b2a4d54f6a3bfdb1993e20aea4c512818d700eed65efb5ca0190b21c5fde6d1c`.
Read-only HOME reference `home-pause-source/exefs/code.bin` is pinned by
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
The block reads style offsets 24/28/32/36 into TextBox width/height/spacing
destinations `+0xe4/+0xe8/+0xec/+0xf0`. Presence of this block is **not** selected
writer reachability or grounds to apply its metrics to these labels.

Both selected style records are retained exactly:
fontScale `[0.8999999761581421,0.8999999761581421]`, zero line/character spacing,
unresolvedWords `{0:270,4:1,8:0,12:0,16:0,20:0,40:4}`. The table retains
recordSize44 and diagnostic
`[{kind:styleFields,offsets:[0,4,8,12,16,20,40]}]`. These seven words remain
uninterpreted; styles39/13 are not claimed render-supported. The publisher
quarantines only this exact non-applied table diagnostic for the pinned selected
bank/label/path/record/proof, and recursively rejects every other unsupported
selected entry. Generic `stock_ui.supported()` is unchanged. B's runtime helper
must repeat the same selected-reference and proof checks, then output text only.

## Source and converter identities

All private paths below are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/`.

| Identity | Friends | Notifications |
| --- | --- | --- |
| Title/version/content | `0004003000009f02` / 6144 / index0, id17 | `000400300000a002` / 4097 / index0, id12 |
| Original content path | `native-manual-slow/user/nand/00000000000000000000000000000000/title/00040030/00009f02/content/00000017.app` | same NAND, `0000a002/content/00000012.app` |
| Full content SHA-256 | `cd0708d08b31ea67d008fbe42869fd55bab765ec7b69e786abbc619f8dff610a` | `80e73dc01348a7e68975073ba4317856e9b79821b27ce4d65692612c500dacc8` |
| Decompressed code path | `friends-entry-source/exefs/code.bin` | `notifications-entry-source/exefs/code.bin` |
| Full code SHA-256 | `a5d86ac04922f63feb0c3cfcc8390867f358ba8b3a3970acb211be7b8d9f923e` | `b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228` |
| Original RomFS archive | `friend_LZ.bin` | `common_LZ.bin` |
| Compressed archive SHA-256 | `4d576b34d017cacd0267e0327aea390b620b51da38799d66f5c6769eed37472d` | `1ac03207aa03eb4f447e7ae5d4fe7f64fba08dca055717b8ff0ce9067db8e4ae` |

The publisher's [pinned specifications](../../scripts/firmware/publish_applet_incoming.py)
include exact layout/clip/texture member hashes, compressed/decompressed English
MSBT and RI hashes, CIA identities and content versions. Every pack category has
its original title/content/member resourceSources mapping. Loose messages/style
paths are `message/EU_English/...`, not falsely archive-owned. Pack manifest
records retain archive plus message/style source hashes and code identity.
Existing global PNG/font provenance records remain unchanged; title-specific
pack resourceSources independently bind reused PNGs to each original archive.
Full prior provenance is in the [Friends source handoff](friends-incoming-source-gap-20261007.md)
and [corrected Notifications handoff](notifications-incoming-source-gap-20261007.md).

Conversion reuses `ctr-native-web`1.5.4, `native.py` SHA-256
`0acd5820861c357a55e2e86f12d58addfc985aeb3b536123f67fe93fa3fe0a06`,
unpack script SHA-256
`02581cb73e4f35c05d9fdd173bb7dbb03a6085c6f5ec40d12c988e19cc28bf7b`,
and existing CTRTool1.2.0 SHA-256
`1b91c6339bab12453fdf06f28d4a40d39a81e785e7eda92e555a9bcabb1d1991`.
No new extraction, installation, package/executable/ticket export, saved note,
capture-derived colors or graphic reconstruction occurs in this slice.

## Integration and open boundaries

Root/B must consume each title's own upper/lower SceneIn tracks independently,
retain owner/application/firmware/generation/source-preparation identities and
acknowledge valid paired render receipts before advancing/releasing or exposing
input. Loading, resource failures, retry/recovery, hidden/stalled clocks, repeated
calls and accessibility adaptation stay subject to existing guards. Browser
scheduling is an adaptation, not proven native dispatch, epoch, rate or duration.
Do not replace Notes Scene9/10 or introduce a universal common incoming overlay.

Friends remains the declared own-card endpoint adaptation rather than captured
native first-use help/no-Mii. Notifications lower-component activation and exact
independent LCD phase remain source gaps. Neither title endpoint/body/HUD is
redesigned here. The immutable native evidence is documented by the preceding
source handoffs, including Friends
`_07.10.26_16.52.15.314.png` SHA-256
`6739be6a291650b5ca7ba7b45a5f6df024e23c63f1cf44ba1b3c9ea47eb1687b`
and Notifications `_07.10.26_16.22.50.365.png` SHA-256
`968fc663d29c059297c97629b9ca6f336bfd68f984689a2f5f5fcdf7282431c9`.
No browser inspection, named new capture pair/mask/diff, motion, native pixel or
audio acceptance is claimed by this asset publication.

## Checks and next action

Focused original-source Python checks with
`APPLET_INCOMING_PACK_ROOT=/private/tmp/3ds-applet-incoming-fixtures-20261007`:
6 passed, 0 failed, 3 publication-only checks skipped. Focused Node pose/plain
label checks with the same fixture environment: 4 passed, 0 failed, 2
publication-only checks skipped. The skipped checks are manifest delta,
published byte/provenance closure and repeat publication; they must run after
authorized publication. Temporary fixture hashes are Friends
`361a6838c840f69fdf92c6ab520aa1cbced463a1d4f8cffe6824fe398af2db1c` and
Notifications
`9137c1da5bdf61584dddfa14a090b9e79d7b1f20dba6736cc33c9fbede231d74`.
All seven texture dependencies per fixture were independently checked against
existing public bytes and manifest hashes. They are reused, not rewritten.

The owned tests skip missing public delivery explicitly while authorization is
pending; they do not report it as source support or acceptance. No full suite,
build, server, GUI or native process was run. After the immutable source/script
review and explicit user approval, run the publisher with absolute original
source/content/output/artifact/ctrtool paths, rerun all focused checks without
fixture overrides, commit only the two JSON packs and additive manifest delta,
then integrate root/B wiring and perform the matched native/browser loop.
