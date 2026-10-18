# Browser and Miiverse common incoming

## Scope

Branch `codex/web-common-incoming-20261009` starts from integration
`37b743a5f6fee9250393093d1e2fa5d51934f734`. This bounded change implements
the missing common `SceneIn` publication for Browser and Miiverse only. It
does not alter Notes, the title-owned Friends/Notifications incoming packs,
destination content, native assets, animation curves, input handling or audio.

The captured defect and exact production pairs are recorded in
`top-row-cover-cadence/remaining-top-row-verdict.md` under the private
animation artifact root. Both c73 first/repeat runs held outgoing cover20 and
then published the exact ready endpoint pair, with no incoming source pose.

## Source identity

The existing resources are from EUR HOME `0004003000009802`, v24576,
content0/contentId `00000082`. Decrypted content SHA-256 is
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`;
`romfs/common_LZ.bin` SHA-256 is
`543fbf31b7ca5c44580075c0632f2d99d6e88843cd85f801fb9ada1da5ec2af8`.
The delivered `packs/home/common.json` SHA-256 is
`eb472b6a6c60668cdbdb88314fd010bc97b354c472adc47a9fc78629d1eb9b82`.

| Original member | SHA-256 |
| --- | --- |
| `anim/CmnFade_U_00_SceneIn.bclan` | `78435c2e74c129ccf1290dacc6c59dfdea80964f0a95933e570b59640ec1a996` |
| `anim/CmnFade_D_00_SceneIn.bclan` | `696f40776f3908f1cf9fb2a342ab131dd2e941c3b8635ddb52e2119c155bc430` |

The unchanged common pack supplies 21 upper/lower SceneIn poses with source
ranges `[20,40]`. Browser retains selector3/pattern6, the Web icon and
`menu_msbt_LZ/lau_title_web`. Miiverse retains selector7/pattern5, the Olv icon
and authored `Miiverse_logo_01` pane with `Miiverse_logo_00.bclim`; no Miiverse
message label or placeholder is invented.

## Runtime contract

`appletEntryIncomingKind` classifies Friends/Notifications as title-owned,
Browser/Miiverse as HOME-common and Notes as no incoming producer. The existing
receipt-gated controller now sends Browser and Miiverse through common
incoming0..20 after an acknowledged outgoing20. Incoming20 must receive its
own valid paired-render receipt before a distinct destination handoff can
complete readiness.

Common incoming carries the exact prepared destination pair but no title-pack
resource token. `screens.ts` first lets the stock renderer paint that pair,
then overlays the original HOME common SceneIn through `firmware-presentation`.
Pair replacement, absence, source/render failure, stale owner/caller/request/
application/generation, hidden publication, revocation and disposal keep the
existing guards. Friends/Notifications still use `drawAppletIncoming` and
their title resource identity; Notes still hands off directly after cover20.

Normal motion retains the existing bounded accepted-sample clock at 60Hz
source updates, including its six-update stall bound. No elapsed credit crosses
the outgoing20 to incoming0 producer boundary. Reduced motion still publishes
outgoing20, incoming20 and handoff as three separately acknowledged poses.
This scheduling is the existing browser-observation adaptation: native caller
epoch and duration remain untraced, and no 1:1 timing claim is made.

## Verification

Focused applet sweep: 85 passed.

```sh
node --test --test-reporter=spec \
  tests/applet-entry-assets.test.mjs \
  tests/applet-entry-presentation.test.mjs \
  tests/applet-entry-painter.test.mjs \
  tests/applet-entry-live.test.mjs \
  tests/applet-entry-scene-policy.test.mjs \
  tests/applet-incoming-publication.test.mjs \
  tests/applet-title-entry-assets.test.mjs \
  tests/applet-title-entry-presentation.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
git diff --check
```

The focused coverage includes Browser and Miiverse source poses0..20 at
20/30/45/60Hz, destination-first overlay order, exact-pair replacement,
missing pair, explicit painter failure, retry, reduced motion, final handoff,
existing title-owned incoming regressions and unchanged Notes direct handoff.

No GUI, native session, server, production build, full suite, extraction,
asset publication or audio comparison was run. The dependency symlink used
for checks was read-only and removed before handoff.

## Coordinator recapture

After integration, recapture Browser and Miiverse toolbar opening at normal
motion and reduced motion, including one repeated open per app. Require the
chronological sequence outgoing20 receipt -> common incoming poses ->
incoming20 receipt -> distinct destination handoff receipt. Compare both raw
LCDs and confirm Browser retains its source label, Miiverse retains only the
authored wordmark, and neither replays title-owned Friends/Notifications
resources. Re-run Notes opening plus Friends and Notifications incoming as
regressions. Native/browser epoch, duration, endpoint adaptations, pixels and
muted audio remain unaccepted until that root-owned comparison.
