# Friend List Close candidate

12 October 2026. Worker base `a1ca6f594c3a0dafafd7afe69d4c6b4292395933`,
branch `codex/friends-close-transition-20261012`. This is a recapture candidate,
not an integrated or native-matched result.

## Captured defect and scope

The coordinator's first and repeated ordinary Friend List main Close recordings
retain the app through sequence 27, then show HOME at sequence 28 without a
cover. The five closed browser windows contain 1,397 raw LCD pairs. Their ledger
and independent audits are in the private `friends-motion-20261012-v1` bundle.
Native repeat no-Mii OK automatically returns after dismissing its dialog, with
a HOME belt before HOME reveal. That is a different trigger/body from a main
footer Close. Direct native footer parity is not claimed.

The existing close-effect boundary now retains HOME-owned Friends main Close
for touch, semantic Back and keyboard/physical Back. Profile Back and
caller-owned completion retain their old routes. HOME suspension clears the
request; unready escape still suspends the applet. Power, stale owners and
disposed presentation cannot complete it accidentally.

The existing receipt controller draws Friends `Decide` frames 0..5, its title
`SceneOut` frames 0..20, and retires the owner only after a valid paired terminal
publication. Existing HOME `SceneIn` frames 0..20 precede a fresh handoff. The
shared controller's default feedback policy is unchanged for other applets.
Friends close prevents concurrent opening/re-entry and gates HOME banner reuse.
The existing renderer, source geometry, materials, text sampling and caches are
unchanged. New drawing uses actual loaded aliases and texture maps.

## Pinned source

EUR title `0004003000009f02`, version 6144, content index 0, content ID
`00000017`; CIA SHA-256
`9bb38762d1dc6c3ece8d22de1c0590787f3227f14f7cad866d59255ff78a396b`;
content SHA-256
`cd0708d08b31ea67d008fbe42869fd55bab765ec7b69e786abbc619f8dff610a`.
The pinned extracted `ExeFS/code.bin`, image base `0x100000`, hashes to
`a5d86ac04922f63feb0c3cfcc8390867f358ba8b3a3970acb211be7b8d9f923e`.
At `0x1d0164..0x1d017c` the caller loads `fri_title_menu` and the custom
`FrdCmnFade_D_00` / `FrdCmnFade_U_00` names, then calls `0x1cce60`.
That helper sets command type 2 and calls the common cover constructor
`0x185ee0`. The caller branch can be reached through mask `0x40` or the title
flag at `+0x164`; a writer to that flag is at `0x1d81d0`. Exact footer/no-Mii
trigger semantics were not established by this bounded trace.

`RomFS/friend_LZ.bin` SHA-256 is
`4d576b34d017cacd0267e0327aea390b620b51da38799d66f5c6769eed37472d`.
The only newly published clips in `packs/friends/incoming.json` are:

| Manifest animation | Internal archive member | SHA-256 |
| --- | --- | --- |
| `FrdCmnFade_D_00_SceneOut` | `anim/FrdCmnFade_D_00_SceneOut.bclan` | `afb19094d82a90713372ff20fee4169cc66d70b0b4a28cbcedc0f9bee981e29e` |
| `FrdCmnFade_U_00_SceneOut` | `anim/FrdCmnFade_U_00_SceneOut.bclan` | `4c5894701ad75a21285eb046501a186056c9951e58dc0a7002463a575c3b3c82` |

Both decode to 21 supported frames, authored range `[-20,0]`. All pre-existing
layouts, textures, incoming clips and typography remain byte-equivalent in
the pack. Existing `FrdTopUIDw_D_00_Decide` in `packs/friends/friend.json`
is now explicitly requested: six frames, range `[36,41]`, original group
`G_BtnBakHM_00`, member SHA-256
`2e168e9d45696d81958e20eb70d5a15565b272024bc176c942fa7d45a9a7e063`.
Its exact input dispatch is not claimed from the resource alone.

The original `message/EU_English/friend_msbt_LZ.bin` provides `fri_title_menu`,
source index 7, `HOME Menu`, style reference 40. Compressed SHA-256
`9931113b89fe9bd8352a880fb500ff3f73a23b0187121c313bcb8d0b9a9c530d`;
decoded SHA-256
`cb671ae85f9212848f8a9ebf0ca07bf85e3bb08d62e114a1971abb796a0d0567`.
The established plain-label writer proof is retained; style metrics are not
applied. Existing title-native `P_Home_00` selects the delivered HOME pictogram.
No reconstructed graphics or new font/audio resources are introduced.

Conversion uses unchanged `ctr-native-web` 1.5.4 modules. The pack manifest
records the converter hashes and private bounded publisher hash. Decoded pack
SHA-256 is `71aa6906925dc9b04ecea8b666d7360dc9e5f36280c39c275f382346891766f8`.

## Checks and limits

Private output only:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/friends-motion-20261012-v1/candidate-verification-v1`.
It contains immutable source-disassembly/resource reports, publication proof,
red regression log, dependency identity and exact 77-file LFS hydration record.
The red test observed immediate `home` instead of retained `app`; the focused
run now passes 138 tests, including actual loader, PNG/font decoding, production
renderer calls, compositor receipts, resource replacement and repeated entry.
Canvas transport tests are not pixel acceptance or a Chromium-cause probe.

Full-suite/typecheck/postcommit build results and final source/build hashes are
reported in the private report and freeze manifest after this source commit.
The known missing historical Camera PNG must remain an explicit suite failure.
No shader/material changes require a shader check. No GUI/server runs are owned
by this worker. Coordinator review and normal-production recapture are pending.

Remaining adaptations: local own-card body without native Mii/first-use state;
browser Close-to-return mapping; six-frame feedback scheduling; 60 Hz bounded
publication clock; cover hold/lifecycle handoff; final overlay composition and
shared HOME reveal. Native trigger equivalence, full motion/cadence, input
timing and muted audio remain unverified. The existing body and all other
applets remain outside this candidate's visual acceptance claim.
