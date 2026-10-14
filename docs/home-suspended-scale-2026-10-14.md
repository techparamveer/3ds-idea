# Suspended HOME scale progression

This patch replaces the immediate compact/expanded switch with samples from the
delivered `LncBase_U_00_ScaleUpDown` clip. The initial HOME Appear still starts at
the selected scale endpoint. Subsequent selection away/back advances one source
frame per accepted LCD pair and changed HOME update. Reversal starts from the
last accepted pose. This receipt cadence is a host adaptation; native activation
epochs, duration and frame timing have not been recovered.

The scale receipt binds the retained application, capture generation, firmware
generation, runtime sequence and HOME origin. Hidden, sleeping, covered, failed,
diagnostic, stale and revoked candidates cannot advance it. Reduced motion also
requires its own endpoint receipt. Resume can capture its HOME source only after
the expanded scale endpoint is painted and accepted. Existing Resume input
settling is outside this patch.

The window uses the decoded geometry, opacity, visibility and caption tracks.
All 23 bound channels are checked against the source contract. Caption centring
keeps the existing fitted endpoints and interpolates them with the source
`N_TextBtm_00` curve. That centring remains an adaptation because the native
`N_TestCenter_00` writer is untraced. No firmware resource or asset was changed.

## Source

EUR HOME title `0004003000009802`, v24576, content index 0 / `00000082`,
converter `ctr-native-web 1.2.0`. Decrypted content SHA-256:
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Manifest key `home.launcher/animations.LncBase_U_00_ScaleUpDown` maps to
`romfs/launcher_LZ.bin/anim/LncBase_U_00_ScaleUpDown.bclan`, SHA-256
`e1669ce6c081b61200d24d99cd4f61fd24b8c4967fef9b4a99728c29ee10f8d8`.
The clip contains frames 0 through 15 and binds `G_WndwScale_00` with children.
The unchanged layout and archive identities are in
[the compact Appear record](home-pause-compact-entry-2026-10-08.md#source-identity).

## Verification and limits

The existing private `home-compact-resume-20261012-v1/native-audit-astra-v1/report.md`
records intermediate native shrinking and expanding poses in both cycles.
Its browser baseline records endpoint-only switching. This patch has not yet
been browser-inspected or compared with new matched native captures. The native
outgoing banner persists into expansion and the incoming banner follows compact
arrival; that visibility ordering remains unresolved in the existing banner path.

Worker checks pass 76 focused tests and `npm run typecheck`. Tests run the real
HOME compositor and native sessions with Canvas/GPU boundaries supplied by the
fixture. They cover all scale frames, initial Appear, reversal, rejected receipts,
identity/resource replacement, disposal, reduced motion and Resume's endpoint
barrier. Source geometry checks also preserve both prior endpoints and fail on
changed or unsupported bound channels.

Logs are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261014/scale-worker/`.
The coordinator owns combined tests/build and GUI verification. Exact native
pixels, input epochs, banner ordering, cadence and muted audio remain unproven.
