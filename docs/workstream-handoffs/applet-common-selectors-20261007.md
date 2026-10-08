# Applet common-cover selectors

The [8 October cadence correction](../applet-cover-cadence-2026-10-08.md) changes
only outgoing host scheduling. It preserves this source mapping and paired
terminal publication, with the source clock anchored to acknowledged samples
so normal rendering time is retained. Earlier per-receipt cadence is historical.

Initial selector base `19ee552a0b9dbbfbdf38c660e289a8337c44c464`, branch
`codex/applet-common-cover-20261007`, assigned checkout
`/Users/paramveer/.codex/worktrees/3ds-applet-common-cover-20261007/3ds-idea`.
Initial selector commit `5513268` delivered only the helper, its focused test
and this handoff, without runtime wiring. Runtime follow-up `6030ef2` adds the
outgoing presentation, HOME paired backing/readiness, screen/scene receipt and
cadence hooks, and the Notes common-cover pause described below. Existing
Manual/folder source paths, Notes painter/scene-9/10 clips, system, manifest
and assets are unchanged. Dirty STATUS stays unstaged.

## Visible target and evidence tier

Coordinator captured the Notifications native opening at normal 100% speed:
HOME touch at145,16 then CTM A at25 seconds, 94 Azahar-own 400x480 PNGs. The
coordinator inspected `notifications-normal-unique-sheet.png`, which shows the
common cover over outgoing HOME and then the destination. Native inventory is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/notifications-normal-native-index.json`;
PNGs are under `native-manual-slow/screenshots-notifications-normal` in that
artifact root. Browser replay `integrated-19ee552/notifications-before-common`
is coordinator-owned. The existing browser omits this common cover.

The initial selector slice was source-identified and helper-tested, not wired.
The runtime delivery below now supplies the outgoing cover wiring. Neither
delivery creates a capture-pixel asset or private artifact. Native/browser
epochs, rates, input parity and audio are unaccepted. Whole AN-01 remains fail.
The next action is coordinator runtime integration and visible recapture, not
another source-only slice. The source helper assigns no milliseconds or easing.

## Selector contract

`src/os/applet-entry-assets.ts` exports four pure entry points:

- `appletEntrySelection(appId)` returns a message or authored-logo discriminant.
- `appletEntryBindings({appId,phase,frame})` accepts `out`/`in` and integer
  source poses0..20. It returns upper and lower animation bindings.
- `appletEntryOverrides(messages,appId)` returns the original label/style on
  `T_Aplt_00`, or an empty override object for the authored Miiverse logo.
- `validateAppletEntryAssets(common,appId)` validates the existing paired
  source curves and the exact selector tracks/resources/posed binding.

| Caller | Aplt frame / pattern | Selected icon | Label or logo |
| --- | --- | --- | --- |
| `game-notes` | 0 / 3 | `LncApltPictMemo_00.bclim` | `menu_msbt_LZ/lau_title_memo`: Game Notes |
| `friends` | 1 / 1 | `LncApltPictFrd_00.bclim` | `menu_msbt_LZ/lau_title_fri`: Friend List |
| `notifications` | 2 / 4 | `LncApltPictNews_00.bclim` | `menu_msbt_LZ/lau_title_news`: Notifications |
| `browser` | 3 / 6 | `LncApltPictWeb_00.bclim` | `menu_msbt_LZ/lau_title_web`: Internet Browser |
| `miiverse` | 7 / 5 | `LncApltPictOlv_00.bclim` | Authored `Miiverse_logo_01` material and pane, `Miiverse_logo_00.bclim` texture |

Manual selector4 remains in `manualEntryBindings` and is not accepted as a
top-row applet caller. The new helper composes that unchanged validator for
SceneOut/In curve/group/range checks. It separately poses each selected applet
and validates that applet's own values, never Manual4's grey/UV values.

The common selector's 13 original tracks are validated key-for-key, including
duplicate frames, interpolation, binding/index/component and slopes. No key is
sorted, collapsed or rewritten. Runtime binding still samples the original
`NativePack` through `poseNativeLayout`. Source selector frames are choices,
not elapsed-time frames or eight-frame motion.

| Caller | Belt/icon RGB | Icon UV translation / scale | Title alpha | Logo UV Y |
| --- | --- | --- | ---: | ---: |
| Notes | 205,210,45 | 0,0 / 1,1 | 255 | 1 |
| Friends | 230,135,60 | .5,0 / 2,1 | 255 | 1 |
| Notifications | 55,205,165 | .5,0 / 2,1 | 255 | 1 |
| Browser | 40,165,230 | .5,.5 / 2,2 | 255 | 1 |
| Miiverse | 0,200,0 | .5,0 / 2,1 | 1 | 0 |

These numbers are source validation fixtures, not color or matrix overrides.
The original icon buffer alpha0, belt constant alpha255 and title RGB50 remain.
Miiverse title material alpha is exactly1, not0. Its original `Applet Title`
source text remains because no caller-label proof authorizes clearing it.
No `lau_title_mvs` is invented. The authored logo is 128x32, scaled by the
original `.8500000238418579`, translated `[-120,4.25,0]`, with original white
vertex colors/UVs and its own green buffer material.

## Existing source and delivery

All resources are already public from EUR HOME title `0004003000009802`,
v24576, `CTR-N-HMMP`, content index0 / contentId`00000082`, English10.7.0-32E.
CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted content SHA-256 is
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Existing manifest resource records retain titleId and source path/hash; the
content identity above follows the existing pinned Manual source mapping.
No manifest identity fields are added or rewritten here.

Wash/belt/icon/logo maps through `manifest.home.common` to
`packs/home/common.json`, delivered SHA-256
`eb472b6a6c60668cdbdb88314fd010bc97b354c472adc47a9fc78629d1eb9b82`.
CIA-internal `romfs/common_LZ.bin` archive SHA-256 is
`543fbf31b7ca5c44580075c0632f2d99d6e88843cd85f801fb9ada1da5ec2af8`.
The unchanged pack `resourceSources` identifies these archive members:

| Member in common_LZ.bin | Original SHA-256 |
| --- | --- |
| `blyt/CmnFade_U_00.bclyt` | `b8b7baff90e549b61e252e6d34c0d223d6edb16203693dba2fedf0036e032de4` |
| `blyt/CmnFade_D_00.bclyt` | `267c9a5bff07e6146931531812ef789bbd0a0348f12cc19045a2ed03485d0881` |
| `anim/CmnFade_U_00_SceneOut.bclan` | `26090911fde2bd34c172040b9136264be9f6e5b3ed2d7e76a434ab3432371fc9` |
| `anim/CmnFade_D_00_SceneOut.bclan` | `7cabf3001ad29eef32862806e59e48e9ab31e74c06227a45214b05a7e6ed55c5` |
| `anim/CmnFade_U_00_SceneIn.bclan` | `78435c2e74c129ccf1290dacc6c59dfdea80964f0a95933e570b59640ec1a996` |
| `anim/CmnFade_D_00_SceneIn.bclan` | `696f40776f3908f1cf9fb2a342ab131dd2e941c3b8635ddb52e2119c155bc430` |
| `anim/CmnFade_D_00_Aplt.bclan` | `1a63a18209ece9d5bd7dbf86f2ead1f008cce5a665ff6cc408f014168a85a801` |
| `timg/LncApltPictMemo_00.bclim` | `22dffcf3453b73b3ff8b33ef468f02062d3069cd5d779e58fcebe08ab298be13` |
| `timg/LncApltPictFrd_00.bclim` | `3d64c84503298e0d05520e919a92a41fa62d7b67ca4c70e5e62be4b060d64f4f` |
| `timg/LncApltPictNews_00.bclim` | `dfded3b8d750da95d921f06468e02d87dccc3ca86c62a700c5edcb4da3fd9a1e` |
| `timg/LncApltPictWeb_00.bclim` | `de90e94e900a481f109802bececc19792131160199cf34700d50ddf721eecde1` |
| `timg/LncApltPictOlv_00.bclim` | `79e2c0c6817a83043101063a9bc5e1ac9ecb8d86a62040bf56a52d87ef9d7740` |
| `timg/Miiverse_logo_00.bclim` | `1814b55ced47189421c8c27f58522932724df2f76f0bc0168d7416d386fff9c5` |
| `timg/LncApltBelt_01.bclim` | `01cbe29144d86291bafef0f0105b24dae1c5b0e231e012f66ab49ff79baa6ebc` |
| `timg/LncApltBeltMask_01.bclim` | `dfe47304cf6b3917a5f4ec979327db082649b8933807d9a742bf62a5f8e847b3` |
| `timg/BgLgt.bclim` | `c0d63a4ee5205e77b89b18b334ffbd13df83a06912ac258119a46160791f983b` |
| `timg/BgLine.bclim` | `5c1ff31e996b2367dd8ed15973e4fa9e1863c2d08927eda513c0a97e00699836` |

The icon PNG manifest keys are `textures/<decoded SHA-256>.png`:

| Icon | Decoded SHA-256 |
| --- | --- |
| Memo | `d2763ad44e823cb514911381b1cab29df55b7f1a9e1f96516b328c0a0f67cd09` |
| Frd | `7b0eb1bf39218ad934496940cd1d7b71311fe17179021aebf88ab4760aac9d77` |
| News | `ceefe5e6b8604b390a7d7bd320c3b599174ed68f5de974c6691dba99b73b8e38` |
| Web | `cc8636e04268573274dc023aa0b1d65550e0565a5caeecb0107443bffa14573d` |
| Olv | `3883cb96e8036f186f1b4920c6b8669f87b5a4214ebda35244cda1af4854d6cf` |
| Miiverse logo | `8c54324fccacfe05733ec6a5a99736781a4eeafbc2d2d950ce59bda52ff5b50d` |

Labels map through `manifest.home.messages` to
`packs/home/messages-and-loose.json`, delivered SHA-256
`3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`,
then `RomFS/message/EU_English/menu_msbt_LZ.bin`, original SHA-256
`1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`.
All four selected labels use style12 from
`RomFS/message/EU_English/RI_mstl_LZ.bin`, SHA-256
`224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555`.
Existing `manifest.fonts.shared` bitmap source SHA-256 is
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.

Unchanged converter is `ctr-native-web`1.2.0 / CTRTool1.3.0. Extractor SHA-256
`e4bae2eb1b254af5f4849d5807c92b3caff768fab5d5ead5f50ca0fe4ac7ff81`.
The manifest retains converter script hashes, including native.py
`d11982727a732fc826d2c41e46fddfc262609568f74513c27af3ecae9a30b059`
and texture.py
`399be43d43fc6d92363386c0a5347135e875ec35edca8d1a1e36145366aed38f`.
No extraction or conversion is performed in this slice.

## Coordinator wiring and boundaries

Validate `renderer.packs.common` for the current applet before composing its
cover. Obtain `appletEntryBindings(pose)` and `appletEntryOverrides` from the
current `renderer.packs.messages`. Draw `CmnFade_U_00` and `CmnFade_D_00` in
the common bank, using the returned upper/lower bindings and lower overrides.
Do not supply material, UV, visibility or tint overrides. Only a successfully
published paired render may acknowledge a transition pose.

The coordinator retains lifecycle ownership, outgoing HOME snapshot, source-terminal
hold/readiness, input quarantine and escapes, valid-render receipts, visibility/
stall rebasing and existing transition paint cadence. Source SceneOut/In each
has21 poses; ranges are [-20,0] and [20,40]. The generic dispatch/completion
ordering is recorded in [the cold-boot audit](../native-cold-boot-reveal-source-audit.md).
That source fact does not establish applet-specific start epochs or duration.
The common Notes caller must preserve the existing title-local scene9/10 cover
sequence; this helper does not reset or replace it. Manual selector4 remains
on its existing presentation path.

Missing/malformed selected texture, logo texture/material/parent, selector keys,
curves, group membership, label or style fails explicitly. Existing title/font/
texture preparation and paired publication guards must remain in place; helper
validation is not a publication receipt. Retire/revalidate cached validation
when firmware generation or resource ownership changes.

## Checks and remaining gaps

41 focused tests pass, including the10 new selector tests, existing Manual
assets/live/presentation/recovery tests and Notes lower-intro tests. Each caller
is posed at outgoing/incoming0 and20. Mutations cover every selector track,
duplicate keys, source slopes, texture patterns/formats/sizes, title alpha1,
authored logo material/UV/geometry/group/parents, and selected labels/styles.
Manual4 remains unchanged and packs are not mutated. Typecheck and diff checks
pass, using the coordinator-approved read-only dependency symlink.

```sh
node --test --test-reporter=spec tests/applet-entry-assets.test.mjs tests/manual-entry-assets.test.mjs tests/manual-entry-presentation.test.mjs tests/manual-entry-live.test.mjs tests/manual-entry-recovery.test.mjs tests/notes-lower-intro.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
git diff --check
```

No GUI, server, build, full suite or new private artifact was created by the
worker. Original Notes thumbnail recapture is coordinator-owned and requires
no further worker change. Existing local Browser/Miiverse content, reference
status/time, nonzero Notes history/capture and host-clock timing adaptations
remain outside this selector helper. The common-cover resource selection is
source-backed; visible integration and matched native motion remain pending.

## Outgoing runtime delivery

The follow-up implements only outgoing common SceneOut0..20, then hands off
the destination's existing entry path. It does not implement common SceneIn
or claim a recovered caller dispatch epoch. Source identities, decoded assets,
manifest records, layout geometry, curves, tints and UVs above are unchanged.

The runtime starts from the matching last valid WebGL-presented HOME LCD pair.
The source identity includes selected toolbar applet, HOME selection revision,
runtime application and firmware generation. Canvas-only paints cannot supply
it. A valid grid HOME receipt clears an old toolbar source. Before a matching
selected source receipt, the existing native-screen input gate quarantines
rapid second touch, keyboard A and physical A. A fresh activation after that
receipt opens normally; HOME/power remain available. This is browser publication
readiness, not a recovered native input epoch.

The dedicated presentation identity binds applet owner, app ID, caller, request,
runtime application and firmware generation. Each source pose needs a valid
paired render receipt. Multiple paints before that receipt retain the same
pose. Hidden/context/sleep/failure/Retry revocation repeats the last acknowledged
pose. A clock stall does not permit source-frame catch-up. Normal motion consumes
at most one source pose per receipt. Reduced motion requires a valid source20
receipt before a separate destination handoff receipt.

The source20 hold is rendered over the retained HOME pair with the exact source
geometry and material alpha. There is no forced opaque fill. Source pane alpha
alone is not a native opacity/dispatch proof for every caller. A failed native
title preparation/draw exposes the existing explicit browser recovery pair and
stops transition cadence; a pending pair retains the common source terminal.
Retry rebases; it neither changes native source resources nor invents a pose.

`stockScreens.preparedPair(owner)` is an opaque token for the current native
title renderer, paint key, complete pair and successful outward LCD copies.
It is not a WebGL publication receipt and does not bypass local input readiness.
The token clears before every outward copy attempt, failure, replacement and
disposal. A destination handoff candidate is rebound to the actual pair drawn
on that pass and accepts only that same current token after a valid render.
Invalid handoff publication retains/rebases source20 instead of releasing it.

Notes' local scenes9/10 pause while the common cover owns the visible pair.
The title's prepared-pair token is separate from `NotesBootGate.ready`, avoiding
a readiness deadlock. Hidden Notes poses cannot receive local receipts, even
in the render that acknowledges common source20. The painted-cover flag survives
that acknowledgement. The subsequent destination handoff makes the existing
Notes scene9/10 path visible, and its own terminal gate still quarantines input.
Suspended title metadata/capture, local list/HUD/thumbnail painting and the
declared nonzero-history adaptation are unchanged.

The existing sr-only direct applet buttons are an explicit accessibility
adaptation. They have no selected HOME render, so their exact presentation
identity skips the common cover without fabricating a backing pair. Only those
five callbacks call `skipAppletEntryForAccessibilityShortcut`. Physical/touch/
keyboard routes still require matching source backing. A successful same-owner
resume/title retry remains completed as for a completed visual entry; another
owner/request/application/generation cannot inherit the exception. Reset/dispose
clear it, and post-dispose calls cannot resurrect readiness. Notes' local gate
remains unchanged for accessibility opens. This is not native visual acceptance.

Scene integration calls `presentAppletEntry(state, performance.now()-start)`
after successful `renderer.render` under the existing powered/open/visible/
awake/live-context guards, before Notes' local receipt. Sampling uses the same
fresh clock origin through the existing `manualEntryObservedElapsedMs` field,
not a potentially older rAF timestamp. `appletEntryActive` joins the existing
transition LCD paint budget only; render-quality budgets do not change.
The 60Hz host observation policy and >100ms stall rebase reuse Manual's browser
scheduling adaptation, not a sourced native duration, rate or easing.

Diagnostics add `screenPaint.appletEntry` with kind, source frame or null, and
owner. `screenPresented.paint` retains that record behind validPublication.
No collector script is changed by this runtime delivery.

## Runtime checks and review

170 focused tests pass across the new helper, actual screen/painter/scene
adapters, prepared-pair lifecycle, existing Manual/folder paths, Notes local
boot/metadata paths, native session ownership and input recovery. Typecheck
and diff checks pass. The existing `source-render specimens` Notes test is
excluded because it writes private artifacts to the old DeveloperStorage
root. An earlier unfiltered run failed that producer with EPERM; no private
artifact was written. No test assertions or files were changed to mask it.

```sh
node --test --test-skip-pattern='source-render specimens' --test-reporter=spec tests/applet-entry-assets.test.mjs tests/applet-entry-presentation.test.mjs tests/applet-entry-live.test.mjs tests/applet-entry-painter.test.mjs tests/applet-entry-scene-policy.test.mjs tests/manual-entry-assets.test.mjs tests/manual-entry-presentation.test.mjs tests/manual-entry-live.test.mjs tests/manual-entry-clock-scene-policy.test.mjs tests/home-folder-entry-assets.test.mjs tests/home-folder-entry-banner.test.mjs tests/home-folder-entry-banner-live.test.mjs tests/home-entry-motion-scene-policy.test.mjs tests/notes-boot-cover.test.mjs tests/notes-intro-clock.test.mjs tests/notes-intro-session.test.mjs tests/notes-intro-publication.test.mjs tests/stock-screen-preparation.test.mjs tests/native-title-session.test.mjs tests/native-screen-input.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
git diff --check
```

Dependency commits are the already-integrated selector5513268 and root folder
0128f2f/diagnostics52af0c5, locally8f089c0/7750042. Deliver only the runtime
follow-up, not those dependencies. STATUS stays dirty and excluded. B's later
folder-only query/selection/hide changes remain independently owned; preserve
both workers' return-object hooks during sequential integration.

Independent precommit review found and corrected the direct accessibility
shortcut regression, rapid activation before source receipt, source checks
under a suspended-owner panel key, stale same-applet HOME revision reuse and
post-dispose shortcut resurrection. Independent immutable review of `6030ef2`
found no source/runtime behavioral blocker and requested this handoff scope
correction. Native pixel/timing acceptance remains pending; review clearance
does not establish it. No GUI/server/build/full suite was run by A.

## Visible evidence still required

The coordinator's immutable normal-speed native index/unique sheets are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/`:
`notifications-normal-native-index.json`, `friends-normal-native-index.json`,
`browser-normal-native-index.json` and `miiverse-normal-native-index.json`.
The coordinator inspected preceding partial and complete source covers. Named
complete targets include Friends `_07.10.26_16.52.12.016.png` prefix SHAa241e1f9,
Browser `_07.10.26_17.02.23.21.png` prefix SHA09df5cc3 and Miiverse
`_07.10.26_17.05.24.701.png` prefix SHAe013d5b3. These are reference data only,
never inputs for assets/colors/curves. Full hashes are in their private indexes.

After runtime integration, select the first valid chronological source20
browser pair, compare raw400x240/320x240 against those immutable own400x480
native PNGs with empty masks, and inspect both comparison sheets. Repeat each
top-row entry, Notes no-software and suspended-owner paths, reduced motion,
and affected Manual/folder regression sequences. Root alone owns that work.

Miiverse's current pack pose deliberately retains the authored text alpha1
and logo with no invented `lau_title_mvs`. The native complete cover shows only
the graphical wordmark, no visible placeholder. Pack-pose validation is not
proof of the native caller's text binding. A visible placeholder residual must
remain fail until its original writer/binding is established or a permitted
decoded-pane adaptation is labelled. Common incoming SceneIn dispatch, caller
epoch/rate, matched timing, input/audio acceptance, live HUD state and existing
destination adaptations remain open. Whole AN01 and strict1:1 are not passed.
