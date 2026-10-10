# Common cover raster reuse

## Delivered change

Worker `ae0f74d` integrates as `5dc7b83`; clean verification `b62b559` has an
identical committed `src/tests/scripts` tree. Different-model review found no
actionable issue. Only the native common cover's `P_Bg_U_00` and `P_Bg_D_00`
reuse their fully opaque sampled RGB in the existing 8 MiB LRU. Each integer
pose replaces alpha bytes with the exact scalar result. Source material,
texture, vertex alpha, blend, TEV and alpha-compare checks reject unsupported
resources. Eviction, disposal, owner/readiness and animation clocks are unchanged.

The belt stays on the generic path. Its attempted opaque reuse failed with
14,788 alpha-byte differences and was rejected. No native assets or provenance
changed. The unchanged [Manual element mapping](workstream-handoffs/animation-manual-entry-20261007.md#source-mapping)
binds the cover, icon, belt and animation tracks to the pinned decrypted dump.

## Supporting checks

All252 Manual/five-applet outgoing/incoming poses preserve1440 source buffers,
208,588,800 RGBA bytes. These tests use recording Canvas with text ink stubbed;
they do not establish actual destination Canvas filtering, GPU or native pixels.
Worker51 focused and independent9 checks pass; two optional real-Canvas checks
skip. Full suite2570 pass,98 skip,one TODO andone unchanged historical missing
Camera PNG failure. Nonincremental typecheck, build and post-build typecheck pass.

The isolated recording-Canvas probe changes warm cycle median485.16 to173.51ms,
and cold cycle533.94 to301.97ms. Warm-JS fresh-cache first draw regresses11.21
to14.46ms; retain that result. These are CPU probes, not browser frame rates.

## Frozen production observations

Private root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/`.

Served commit `b62b559547ee4dca056e7b2af3b2863f0c611c3e`, build
`lID3eD82N1uOOIOHnluwn`, BUILD_ID SHA-256
`3207acd15457d701b85021faad76c55ad30cc7388e6afa991ed9e9811e69ada8`.
Build/source binding is coordinator attestation, not collector discovery.
Source, assets and build stayed frozen. All seven muted first/repeat collectors
exited0; server19681 exited130 and port3025 was empty afterwards.

| Capture directory | First pairs | Repeat pairs |
| --- | ---: | ---: |
| cover-reuse-camera | 97 | 96 |
| cover-reuse-settings | 95 | 97 |
| cover-reuse-notes | 101 | 102 |
| cover-reuse-friends | 89 | 88 |
| cover-reuse-notifications | 88 | 89 |
| cover-reuse-browser | 97 | 102 |
| cover-reuse-miiverse | 99 | 101 |

`audit-cover-reuse.mjs` verifies1341 paired receipts/2682 raw400x240/320x240
PNGs, hashes, complete pair inventory, chronological receipts and identical
paint/publication records. Errors are empty. Its report deliberately leaves
visualInspection false. Coordinator opened four Manual chronology sheets,
four Manual console images and four Camera ready contact sheets. Independent
different-model review verifies the956 top-row pairs/1912 PNGs and opens all10
top-row chronology sheets/10 consoles. No obvious wrong-app, tearing, stale
panel or terminal regression is visible. Sampling gaps remain; Browser repeat
alone contains every outgoing/incoming source pose. Browser endpoint status
differs by202 upper pixels in the live clock/battery region, lower identical.
The separate `cover-reuse-coordinator-attestation.json` records these actual
inspections and the build/window binding; it is not generator proof.

Actual pre-navigation windows were resized/read back at1950,420,1102x700
inside Sidecar display4 at1920,367,1164x802. Post-navigation bounds were also
observed before setup input and remain coordinator-attested. Playwright's
1440x1000 viewport exceeds the physical window: the OS content view is clipped.
Raw LCD regression remains usable, but this is not full visible physical-input
parity. Future visible captures must fit their viewport inside the owned window.
Codex stayed on Dell; browser audio remained muted. System audio was untouched.

New Settings maximum first/repeat overlay cost is68.2/61.1ms atout13/out17,
with77.4/70.1ms CPU. In0 now costs0..0.1ms overlay and1.3..2.6ms CPU. Camera
maxima are72.6/64.8ms overlay atout16/out3. The earlier in0 stall is no longer
observed there; expensive work remains under the outgoing cover. This is an
observation, not a proved causal localization or removal of destination delay.

Live unique Manual pose coverage is37/42 Camera-first,36/42 Camera-repeat,
34/42 Settings-first and39/42 Settings-repeat. Pose order does not regress,
but rAF publications coalesce. Do not claim every pose was presented.

## Native comparison and remaining work

Fresh isolated Camera Manual own PNGs both hash
`187ad2e67e97fbe12f4d041e0679a8ff2ade2e8282065cc81264a8f80b8bea1f`.
First chronological browser in20 versus that fixed endpoint still differs by
106upper/9lower pixels over RGB delta2 in both cycles. Empty mask; report and
contact sheets live in `cover-reuse-audit/camera-0-diff` and `camera-1-diff`.
Unmatched native epochs prevent motion acceptance.

Silent first/repeat native movies hash
`cfffdc451c0b98def31f4627e49c8c3a3d22d22a79bd36adf79872e9ff4ac7cd` and
`54b8d533399177f29ed4f2a4d68461b74fa2cb6bc68c0b5d25b97717617c4770`.
Both have zero audio tracks, two invalid PTS entries and108.33ms maximum gap
among sorted valid timestamps. Decode-order PTS arrays are not monotonic.
They support supplementary ordering observations, not exact native cadence.
Native Quit/Yes exited139; its windows were absent afterwards. Volume0,
Null output1 and Static input2 remain. Audio acceptance is unverified.

Next bounded workers target cold Manual destination text preparation and the
106/9 ready residual separately. No further fix is integrated in this record.
All four whole animation flows remain fail/unproven. Existing portfolio
population, persisted folder fixture, reduced-motion endpoints and recorded
native-source gaps remain labelled adaptations; no new native visual substitute
was introduced. Icon moving/pickup/hover/drop remains excluded.
