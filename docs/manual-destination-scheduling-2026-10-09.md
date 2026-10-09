# Manual destination scheduling, 9 October 2026

## Change and source boundary

The approved worker stack `97252bf` + `9b2c066` + `fee1885` integrates as
`e96e76a` + `cc8cc0b` + `a5e4e44`. Manual destination composition requires
the same owner/title/caller/request/application/generation identity and either
an accepted opaque outgoing frame 20 without rebase or an accepted incoming
pose, including incoming rebase. Pending or revoked outgoing poses cannot
authorize composition. Acquisition continues while outgoing motion plays.
The first expensive destination draw stays beneath another outgoing frame 20;
incoming starts only after a current-owner pair existed at paint start.
Other stock apps and diagnostic paints are not deferred. Existing failure
recovery, paired readiness and stale-owner disposal remain active.

This is a browser scheduling adaptation, not recovered native caller order
or a native duration. The visible motivation is recorded in the previous
production ledgers: Camera out15/out17 overlay83.2/67.6ms and Browser
out15/out8 overlay68.9/61.8ms. These are measured overlay costs, not native
epochs or proof of every displayed pose. Cold draw cost is not reduced.

Independent different-model review found a cold incoming-rebase defect in
the initial candidate. After losing its destination pair, accepted in9 could
resume at in15 following a five-tick cold draw. Correction `9b2c066` keeps
rebase through the cold receipt and clears it only after an already-ready
held receipt. A real screens-painter regression now holds in9, then advances
to in10. A terminal in20 regression also prevents premature readiness.

The second P1 finding concerned a late image/native-session revision after a
pair had been published. Final correction `fee1885`, integrated as `a5e4e44`,
makes `changed()` invalidate `preparedPair` before invoking `onChange`.
The actual stock-presentation tests cover Manual and Sound late images,
invalidation observed inside `onChange`, failed lower-LCD copying and a retry
that publishes only after both current LCD copies succeed. The revised pair
remains owner-scoped and has a new revision key. This also protects shared
applet incoming-resource consumers. The final correction changes readiness,
not raster math. No native curve, asset, input or raster-cost reduction is claimed.

Native visuals and provenance are unchanged. Their pinned title/content,
manifest keys, CIA paths, hashes and converter identities remain in the
[Manual entry handoff](workstream-handoffs/animation-manual-entry-20261007.md)
and [source/runtime record](manual-source-runtime-2026-10-09.md).
Capture-fitted Manual absolute mounts, portfolio population, seeded folder
fixture, nominal60Hz host sequencing and reduced-motion endpoints remain
adaptations. Sparse icon/glyph pixels, native input/epochs and muted audio
remain unresolved. No whole-flow pass follows.

## Evidence

Private root `O` is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion`.

- Final independent exact review: `O/reviewer-manual-deferred-exact/handoff.md`,
  SHA256 `c60ff7adc9cd9d64ab2817bda446f6ab048f80fa34096e6f863359bc59367a43`.
  Actual reviewer GPT-5.6 Sol high approved all three worker commits with no
  remaining findings. Both initial P1 findings are closed. The final independent
  run has 69 focused passes and one optional Canvas skip, with typecheck and
  exact diff checks passing. Its installed-Canvas run has 4 passes and no skips.
- Clean equivalent verifier
  `/Users/paramveer/.codex/worktrees/opus-verification-20261009/3ds-idea`,
  HEAD `76813d80cfbdfcb65adc1c7643620036422a584f`, has an empty committed
  `src/tests/scripts/public` diff against `a5e4e44`. It excludes the unrelated
  user's `system.ts` syntax edit, which remains untouched.
- Final logs `O/deferred-composition-final-{full-tests,build,typecheck,postbuild-typecheck}.log`
  record 2701 tests: 2598 pass, 101 skip, one TODO and one unchanged historical
  Camera PNG failure at `tests/camera-date-group.test.mjs:44`. The missing file is
  `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`.
  No shim or new skip was added. Production build and nonincremental pre/post
  typechecks pass.
- Corrected installed-Canvas profile
  `O/deferred-composition-corrected-canvas/profile.json`, SHA256
  `86b05ba9bda8908964f7135347e0956998d1f0127edcc3dda31b417de65973eb`,
  preserves 1156 text rasters and 31,649,856 source RGBA bytes. Its 20 scheduled
  pairs preserve 13,824,000 target RGBA bytes. The helper/renderer and portfolio
  overlay/Manual presentation are real; the stock adapter and peripheral
  GPU/Notes components are stubbed. This is offline CPU Canvas equivalence,
  with readback overhead, not full production timing. Log
  `O/deferred-composition-corrected-canvas-tests.log` records 4 passes, no skips.

## Production preview and incomplete recapture

The coordinator served frozen clean `76813d8` on port 3025, PID 94968, build
`zxL2Hk7fZpwT2O-Sayh4t`, BUILD_ID SHA256
`23c9ba1141172247f1c2f10adf26c1a7788e28b985c8ab89657e5fe6639cc329`.
Dedicated Helium PID 11353, window 8313, rendered HOME at 1830,420,1102x700 on
Sidecar. The coordinator verified process-level mute. The rendered screenshot
`O/helium-preview-20261009/reviewed-helium-home.png` hashes
`fcbd636cc07c049dd64433b77003960d1dfe8d29a74a26e7e19f3093a68e2f87`.
Process/window/display/mute and source-to-build binding are coordinator
attestations. The screenshot and build identity are separately hash-checked.
This is preview evidence only, not animation acceptance.

The separate Camera collector `O/deferred-production-camera-v3` was stopped
with exit 130 after an unexpected literal `e` appeared in the omnibox before a
gate, as observed by the coordinator. Its first 93 pairs and partial repeat
remain preserved. `failure.json` is explicitly invalid and records a closed
browser; these files are not accepted regression evidence. The test browser
is gone; Helium was left untouched. No native comparison ran for this stack.
Do not automatically retry the GUI route. Production timing improvement,
native cadence/input, sparse pixel residuals and muted audio remain unverified.
All four whole flows remain fail/unproven.

## Earlier candidate evidence

The following records preserve the initial review and worker checks before
the final late-revision correction and integration above.

- Initial exact review: `O/reviewer-manual-deferred-exact/handoff.md`, SHA256
  `f6425c2099c27095041eb9aabd76b6a9e5af39af2315056c6988e00ec334c26f`.
- Worker correction:87 focused passes, one optional Canvas skip; explicit
  installed Canvas4 passes with20 scheduled pairs and13,824,000 identical
  destination RGBA bytes. Typecheck and whitespace checks pass.
- Worker corrected Canvas profile:
  `O/manual-outgoing-raster/scheduling-canvas-reviewed/profile.json`, SHA256
  `73e5dc1462f86ebf1e3a19c6d6140586eee369a31aab699586927b1ae6b71f4c`.

Source tests and offline Canvas are not production motion or native comparison.
The prior Browser60/16 and Camera60/9 diagnostics belong
to runtimefbbd63b, not an automatic recertification of this scheduling change.

## Other open work

The ordinary-folder slice closed without a justified code change. Its orange
underlay differs because native/browser root population differs; Back interior
matches, but boundary precision and cursor epochs remain open. Handoff
`O/folder-entry-residual/handoff.md`, SHA256
`26af0a98254ab5d966633b790810bca7d51035e28c1ec15bca8f2c762ec859eb`.
Next requires matched root, neutral folder and held Back observations, not
another source-only audit or a fitted phase.

The latest human report requires closer top-row tap/open/close/HOME coverage.
The bounded source-only audit is complete at `O/toprow-exit-audit/handoff.md`,
SHA256 `1bcce8e66a568b19dc008c509186a39049120451547a3baecb9d2a46dd514e4c`.
It rechecks 166 identities with zero mismatches. Immediate applet close/delete
still lacks a retained paired exit presentation; toolbar Decide retention is
also missing. Delivered exit candidates do not establish dispatch or elapsed
durations. Native close/B/HOME and unfocused/focused taps need matched
observations before implementation. Do not duplicate this completed audit or
reverse entry clips. Moving, pickup, hover and drop remain excluded; all test
audio remains muted and unverified.
