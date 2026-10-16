# HOME lower pause release - 9 October 2026

Worker base `11349f2166ad8bd55bdc731999d09069663413af`, branch
`codex/pause-release-20261009`. This updates the schedule described in the
[lower transition handoff](home-pause-lower-transition-20261008.md).

The old host update 14 combined the first lower fade frame 40 with footer
frame 0. Pinned HOME code instead applies lower frame 40 twice before the
following lower-state poll can hide the layout. The helper now holds fade 40
without a footer at updates 14 and 15, releases to footer 0 at update 16, and
retains the existing six-update footer span through update 22. The upper
SceneIn, AppPause, HUD and window schedules still settle at update 20. Pause
motion remains active until the complete update 22 pair receives its receipt.
Reduced motion selects that complete endpoint through the same receipt path.
The compact capture verifier now requires both upper `pauseFrame === 20` and
`pauseLower === null` before reporting `firstTerminalReceipt`. Upper frame 20
with a moving footer no longer counts as a complete pause endpoint.

The source is HOME title `0004003000009802`, version 24576, EUR 10.7.0-32E,
content index 0 / content ID `00000082`, internal `exefs/code.bin`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Lower mode 12 calls `0x29ed58`; `0x29ed60..0x29ed80` rejects playing and
stopped before hiding scene+0xabc. The layout update at `0x269430` applies
the current frame before controller advance `0x1bbd94`, which traverses
playing, stopped and idle across the terminal applications. The source review
is `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/home-pause-timeline/source-review.md`.
Existing decoded resource hashes, manifest keys and `ctr-native-web` 1.2.0
conversion provenance remain in the linked handoff. No assets changed.

The browser still maps one eligible receipt to one host step. Mapping native
layout advances to those receipts remains an adaptation. Starting footer 0 on
release also remains an adaptation because its asynchronous request epoch is
unresolved. The upper schedule and exact native duration remain unverified.

Focused tests cover the complete active lifetime, both terminal holds,
duplicate sampling and receipts, pending and failed pairs, replacement owners
and capture generations, reduced motion and unchanged folder cadence.
`node --test tests/home-entry-motion.test.mjs tests/home-pause-lower.test.mjs tests/home-pause-window-entry-live.test.mjs tests/native-home-controls-paint.test.mjs tests/home-suspended-window-entry-policy.test.mjs`
passes 138 tests. `npm run typecheck -- --incremental false` passes.
`node --test tests/animation-flow-pause-compact.test.mjs` passes 24 tests,
including normal and reduced endpoint evidence with incomplete, absent and
settled lower motion.
Logs are under `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/home-pause-release/`.

No browser, server or Azahar session ran in this worker. Coordinator integration
still requires the complete test/build gate and matched muted iPad captures.
This source correction does not establish a passing native scenario. Audio
remains unverified while muted.
