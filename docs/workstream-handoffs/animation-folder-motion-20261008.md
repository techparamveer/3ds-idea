# Folder Recovery Entry Scope

Worker base: `ab58b6e963c95e18d44b4ba668248592d744f902`, branch
`codex/folder-motion-20261008`. AN-03 remains **fail**. This is a demonstrated
browser lifecycle correction, not a native epoch, duration or pixel match.

## Reproduced Defect

The existing captured root -> shrink -> blank -> child sequence and its source
mapping are retained in the [folder handoff](animation-folder-home-20261007.md#an-03-child-host-ordering-follow-up).
One bounded review found a missing recovery boundary after child publication:

1. Present lower16, the original upper hide endpoint, then the child pair.
2. Fail the folder's native lower chrome, then use its B/HOME recovery.
3. Re-enter the same folder before any root paint and Retry.

`escapeUnreadyNativeScreen` leaves through `reduceMenu('back')`, without
allocating a normal close transition. The released entry compared only folder,
application, firmware/System generation and close sequence. Those fields remain
equal, so its completion and host gates admitted the new entry. The actual
painter could publish the settled child immediately, skipping the entry sequence
without a new presented root source. Both a helper regression and the actual
painter regression failed before the correction; their original logs remain in
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/folder-motion-runtime-20261008/`.

## Contract and Integration

`HomeFolderEntryBannerOwner.rootView` now retains the existing immutable
`getHomeNavigation(state).rootView` record by reference. Child selection updates
only the active folder record. `enterHomeFolder` selects the root slot before
entry, creating a new root record even when its geometry is unchanged. No
reducer field, second state system, controller, reset, timer or frame was added.

The first entry still consumes exactly presented root revision + 1: the source
and incoming root records need not be the same object. Thereafter, pending pose,
hidden endpoint and release receipts require the established root-view scope.
Released child cursor revisions are permitted only in that same scope. A new
entry without an eligible root receipt remains an explicit paired failure.

Coordinator-owned `screens.ts` needs only this field in `folderEntryBannerOwner`:

```ts
rootView: getHomeNavigation(state).rootView
```

The coordinator approved an unstaged temporary copy of that exact caller field
for local verification. It is **excluded** from this worker commit, as is STATUS.
Integrate the coordinator's isolated caller commit together with this helper;
the required type deliberately disallows silently omitting the lifetime token.

## Unchanged Source and Adaptations

Native HOME `0004003000009802` v24576, content0/00000082 has decrypted SHA
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Existing code SHA `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`
and [native lifecycle](../native-banner-lifecycle.md) identify child refresh
after successful lower-controller completion (`0x29b9bc..0x29bb5c`,
`0x29a4dc`), original visibility producer `0x1f9e64/0x1fa344`, and fresh folder
activation `0x24b444/0x1f9324/0x24b850`. No new ARM extraction/execution occurred.

Rehashed delivered assets, unchanged:

| Manifest key / delivered path | SHA-256 |
| --- | --- |
| `home.launcher` / `packs/home/launcher.json` | `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044` |
| `models.folder` / `models/folder/model.json` | `9518fc61118875d7989e84b4b5d15ae32a9bd495f73fbdff87ada5d14c376015` |
| `models.bannerDefault` / `models/banner-default/model.json` | `d0d771a36fe3cc054db94582bd6c7ebbec2d2c9eedbba9a09946c20e3488dfb6` |
| `home.banner` / `packs/home/banner.json` | `44622f5f4607489a9ab7788d528faa63bb093bd80a8785411c4bcdc7835357aa` |
| `fonts.shared` / `fonts/shared/font.json` | `d48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27` |

Paths above are below `public/os/firmware/10.7.0-32E/`. Internal archive/member
hashes and converter versions remain in the linked handoff and manifests.
No asset was changed or exported. Banner pack per-member provenance remains
limited as previously recorded. Root-view reference identity is a browser
lifetime guard, not a recovered native pointer. Lower16 -> hide -> child receipt
boundaries, one producer pass per receipt, source readiness quarantine, shared
cadence and existing fonts/viewport/portfolio differences remain adaptations.
No native graphics, geometry, scale, UVs, easing, sound or clock were fitted.

## Verification and Remaining Work

With the exact temporary caller dependency:

```sh
node --test --test-reporter=spec tests/home-entry-motion.test.mjs tests/home-folder-entry-assets.test.mjs tests/home-folder-entry-banner.test.mjs tests/home-folder-entry-banner-live.test.mjs tests/home-folder-entry-host-scene-policy.test.mjs tests/home-banner-host.test.mjs tests/home-banner-service.test.mjs tests/home-banner-lifecycle.test.mjs tests/home-folder-close.test.mjs tests/native-screen-input.test.mjs tests/native-home-controls-paint.test.mjs tests/home-gestures.test.mjs tests/home-folder-close-system.test.mjs
npm run typecheck -- --incremental false
git diff --check
```

Results: **297 pass, 0 fail/skip/TODO**; typecheck and diff-check exit0.
Tests cover normal/reduced recovery, ordinary child selection, foreign/stale
receipts, fresh root re-entry, context/sleep/diagnostic/stall rebasing, existing
root hide/child growth, close, pickup, generation replacement and disposal.
Private focused log SHA `e98b27802efe88d816975dc069c77e8cc62905f179368adf71d5ed2e687bd784`;
typecheck log SHA `4fc0605d19e61064e88aacb22f7ce2f8e4f6fb7310ec41794d4c846765c72382`.
Original live red log SHA `b6e92150b2fac8098eb2ad57c2f5e2ec6700fa08a97e7da971a26b0fa351dfe4`;
helper red log SHA `d611425755706550367fa85d6cc68df285812bbe15eefe1dd6aec7c0fce6c160`.

Root must integrate the two dependencies, run full checks, and visibly recapture
normal/reduced entry, early Back/re-entry and the failed-resource recovery case.
Require a fresh valid root banner pair before a recovered entry. No worker GUI,
server, build, native capture or pixel comparison was performed. Native input,
source epochs, motion cadence/duration and muted audio acceptance stay open.
