# Friends and Notifications incoming covers

## Scope and visible defect

Worker B starts at integration `9882f97c2bf77fb1ee5a45b294fcbe77828555f9`
on `codex/applet-incoming-motion-20261007`, in the existing assigned folder/HOME
worktree. Local STATUS reconciliation remains unstaged and outside delivery.
Only the applet controller, title-specific incoming helper, focused tests and
this handoff are owned. The coordinator owns loader/composition and Worker A
owns public resource publication. No GUI, emulator, server, package install or
production build belongs to this worker slice.

The existing browser completes the receipt-backed HOME outgoing cover and
immediately hands off the settled Friends or Notifications destination. Their
original title incoming covers are missing. The coordinator inspected native
Friends own PNG `native-manual-slow/screenshots-friends-normal/_07.10.26_16.52.15.314.png`,
SHA-256 `6739be6a291650b5ca7ba7b45a5f6df024e23c63f1cf44ba1b3c9ea47eb1687b`,
and Notifications own PNG
`native-manual-slow/screenshots-notifications-normal/_07.10.26_16.22.50.365.png`,
SHA-256 `968fc663d29c059297c97629b9ca6f336bfd68f984689a2f5f5fcdf7282431c9`.
Private paths are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/`.

The Friends first-use help/no-Mii body differs from the existing own-card
portfolio adaptation. This change preserves the latter. Notifications' upper
HUD/unread is already visible while its lower belt clears in the native PNG.
The new cover does not resolve lower row/button/background activation or
independent LCD phases. Neither source-stage identification nor a passing
helper test establishes a matching capture frame or duration. AN-01 stays fail.

## Controller and caller contract

The existing selected HOME source, outgoing poses 0..20 and owner/caller/
request/application/generation identity remain authoritative. Only Friends
and Notifications add `incoming` candidates. Notes, Browser and Miiverse keep
their existing outgoing-only handoff; hidden Notes poses are not consumed here.

The controller's `sample` adds optional `incomingResources`, an opaque stable
validated current title renderer/resource token. `present` takes it as its
final argument, `bindPreparedPair` as its second and `active` as its third.
The stock destination pair remains separate and is recreated by actual paired
painting. An incoming candidate carries both that pair and the resource token.
After destination drawing, rebind the candidate to the exact new pair, draw
the title cover, and acknowledge only after a valid paired WebGL render with
the identical current pair/token. Offscreen or diagnostic painting is not a
receipt. Failure/hidden/context paths revoke candidates.

Outgoing 20 needs its own receipt before incoming 0. Missing destination or
resource preparation holds the original outgoing 20. Mid-incoming loss revokes
pending pixels and retains the last presented source frame; the coordinator
must render existing paired loading/error or the original outgoing hold, never
a naked ready destination. A changed resource instance first re-presents the
same-owner outgoing 20, then starts the new incoming producer at 0. Incoming 20
also needs a real receipt, followed by a distinct fresh complete destination
handoff receipt before readiness. After that handoff the controller retires
entry progression and cannot replay covers for the completed owner.

Normal motion advances at most one source pose per successful eligible
receipt. Existing greater-than100ms observation inhibition/rebase remains a
browser stall policy. Revoke repeats the acknowledged pose before advancing;
reduced motion presents each producer's source endpoint20 and still requires
the distinct receipts. Toggling reduction cannot commit an offscreen endpoint
or revive an acknowledged midpoint. Owner replacement, Back/power escape,
retry, resource generation and disposal reject stale tickets.

The shared 60Hz observation and paired start/clock are browser sequencing
adaptations, not measured native epochs, duration or LCD phase-lock. No new
timer, source clip, reset of the user's body state or native body/HUD is added.

## Title helper and provenance

`appletTitleEntrySelection(string)` returns a narrowed Friends/Notifications
selection or null for every other applet. `validateAppletTitleEntryAssets(pack,
appId)` validates the selected original pair. `drawAppletTitleEntry(renderer,
top,bottom,{appId,frame})` consumes that selection's renderer pack and source
SceneIn pose 0..20, after the unchanged destination pair. It overrides both
`T_Aplt_00` and `T_Home_00` with the selected original localized text only.
It uses no HOME incoming selector and no reconstructed geometry, tint, UV,
font size, easing or label. Unsupported selected resources fail explicitly.

| Title | Alias and public pack | Original member prefix | Label/style |
| --- | --- | --- | --- |
| Friends EUR `0004003000009f02`, v6144, content0/internal `00000017` | `friends-incoming`, `packs/friends/incoming.json` | `romfs/friend_LZ.bin/{blyt,anim}/FrdCmnFade_U/D_00` | `friend_msbt_LZ/fri_title_fri`, style39 |
| Notifications EUR `000400300000a002`, v4097, content0/internal `00000012` | `notifications-incoming`, `packs/notifications/incoming.json` | `romfs/common_LZ.bin/{blyt,anim}/CmnFade_U/D_00` | `newslist_msbt_LZ/new_title_new`, style13 |

The selected original member mapping is below. The Friends prefix is
`romfs/friend_LZ.bin/`; Notifications uses `romfs/common_LZ.bin/`.

| Element | Friends member/hash | Notifications member/hash |
| --- | --- | --- |
| Upper layout | `blyt/FrdCmnFade_U_00.bclyt`, `727986552371a72c62a0a24f11e2ef778d90156b210b9d009f9e1c301aa9620b` | `blyt/CmnFade_U_00.bclyt`, same member hash |
| Lower layout | `blyt/FrdCmnFade_D_00.bclyt`, `a3adb9f1740fac45c2e3b19d169cadb0f9e9e40805f6b5e47da2c27883900f6e` | `blyt/CmnFade_D_00.bclyt`, `e8fb04c1e1dbea4523423f4e7b18d3ae50801f6b5b312c02a1510869e1c5b1c6` |
| Upper SceneIn | `anim/FrdCmnFade_U_00_SceneIn.bclan`, `d5e5dad524a7d074362ddc5de840dd64be715c021229c0fb8b0d1aa93d54d805` | `anim/CmnFade_U_00_SceneIn.bclan`, same member hash |
| Lower SceneIn | `anim/FrdCmnFade_D_00_SceneIn.bclan`, `3a261531e2a41fbb117cc231600a8925cc8892edb9c1e3042f1e0babd7d0393f` | `anim/CmnFade_D_00_SceneIn.bclan`, `e47fa2508f3aa924cea2d5901ed04d8c271ba19730915f2265509cf1956d3fe2` |

The original content hashes are Friends
`cd0708d08b31ea67d008fbe42869fd55bab765ec7b69e786abbc619f8dff610a`
and Notifications
`80e73dc01348a7e68975073ba4317856e9b79821b27ce4d65692612c500dacc8`.
The compressed archives are respectively
`4d576b34d017cacd0267e0327aea390b620b51da38799d66f5c6769eed37472d`
and `1ac03207aa03eb4f447e7ae5d4fe7f64fba08dca055717b8ff0ce9067db8e4ae`.
Conversion uses existing `ctr-native-web` 1.5.4 and CTRTool 1.2.0. Full original
texture/message/code hashes, converter executable/script identities and
startup/writer addresses are retained in the existing
[Friends source handoff](friends-incoming-source-gap-20261007.md) and
[corrected Notifications source handoff](notifications-incoming-source-gap-20261007.md).
Worker A owns each new pack's manifest/resourceSources/PNG publication, not B.
Lower layout font table remains exactly `cbf_std.bcfnt`; the coordinator binds
that original alias to the existing shared native BitmapFont. This is an
explicit shared-font presentation binding, not proof of internal font dispatch.
No title-owned font or substitute community font is invented. A's bounded
pinned path proof establishes that the selected incoming callers bypass the
named-style metrics branch and use a plain UTF-16 TextBox setter. No
`messageStyle` is attached; the layout's original size, spacing and color remain
untouched. Native style39/13, exact original unresolvedWords and diagnostics
remain strictly validated non-applied reference data, not a style-support
exception. Identical metric blocks elsewhere do not establish selected-path
reachability. This correction adds no guessed metrics or unsupported semantics.

Notifications' source descending list draws unread500 then HUD100 then cover3;
the final title overlay preserves that traced relative order. Friends' final
cover overlay is an adaptation because equivalent component traversal was not
proved. Neither result repairs first-use selection, title component visibility,
activation or the separate LCD animator completion epochs.

## Integration and acceptance

Controller delivery is `df1da09afa1711b61c49e441785eb36ef204e171`.
The helper commit follows it. A's source-only proof/publisher delivery is
`363aee720921c928e50253ec767f68b42d6767ed`. At this handoff, no incoming public
pack, texture export or manifest addition has been delivered. Publication
approval is pending. This helper delivery must not be reported as a usable
runtime capture or an asset export.

Focused verification reads A's temporary converted source fixtures directly,
without copying them to `public/`:

```sh
APPLET_TITLE_ENTRY_PACK_ROOT=/private/tmp/3ds-applet-incoming-fixtures-20261007 node --test --test-reporter=spec tests/applet-entry-assets.test.mjs tests/applet-entry-painter.test.mjs tests/applet-entry-presentation.test.mjs tests/applet-title-entry-presentation.test.mjs tests/applet-title-entry-assets.test.mjs
```

Result: 41 pass, 0 fail, 0 skip. The title helper tests run its actual source
selection/validator and `poseNativeLayout` for all 21 poses; only GPU transport
is replaced by a draw spy. Mutation tests cover original tracks and binding
indices, visibility, groups, pane parents/UV/geometry, text metrics/color,
material/texture/font closure, plain-writer metadata, and non-applied style
diagnostics. Controller tests cover receipts, resource replacement, delayed
preparation, failures, monotonic retry/stalls, reduced toggles, stale identity,
fresh handoff and unchanged outgoing-only applets.

Read-only fixture hashes are Friends
`361a6838c840f69fdf92c6ab520aa1cbced463a1d4f8cffe6824fe398af2db1c`
and Notifications
`9137c1da5bdf61584dddfa14a090b9e79d7b1f20dba6736cc33c9fbede231d74`.
The test defaults to the public pack paths when this verification-only variable
is absent. Those paths are deliberately missing until authorized publication;
an absent pack fails rather than skips. An unconfigured local run therefore
reported 32 pass and the missing-pack test-file failure before the explicit
fixture run above.

Nonincremental typecheck reports only the known root-owned integration boundary
at `src/os/screens.ts:884`: this assigned base still declares diagnostics
`cover|handoff`, while the controller also emits `incoming`. The coordinator
has already added that variant in its reserved composition. No owned-module
type error was reported. `git diff --check` and handoff relative links pass.
No full suite, build, GUI or native comparison was run by B.

The coordinator must integrate A's exact resources and B's helpers with its
loader/composition candidate wiring. Root alone runs integrated full checks,
production build and repeated physical/touch first/reentry normal/reduced
capture. Preserve delayed/failed/retry/hidden/context/disposal and previously
captured Notes/Browser/Miiverse/outgoing-cover regressions. Require exact
destination readiness after incoming 20 plus handoff, not merely menu app ID.

Matched native/browser input, complete source-pose coverage, mask, diff report
and inspected LCD sheets remain required. Existing own-card/portfolio content,
14px Friends title adapter, HUD clock/profile, scrollbar fits and local service
destinations remain unchanged adaptations. Native timing, component activation,
pixels and muted audio remain unaccepted. This is a bounded visible incoming
cover correction, not universal native applet sequencing or a1:1 claim.
