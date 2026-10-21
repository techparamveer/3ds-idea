# Camera text readback experiment

The generic temporary-ink candidate `f43f640` was tested in production but is
not integrated. It fails the exact first/repeated Resume closure required by
the predeclared policy. The experiment narrows the remaining difference; it
does not complete an animation or establish a browser-backend cause.

## Source and checks

The candidate starts at coordinator `00c6423` in the separate
`camera-text-readback-20261011` worktree. Two context-allocation changes request
`willReadFrequently` for generic temporary text ink. Direct-alpha controls,
geometry, sampling, material evaluation, readback count and timing are unchanged.
Five caller-path tests cover single and multiple spans, direct-alpha controls,
cache reuse and disposal. Their Canvas/font substitutes are not raster proof.

Worker checks pass 36 cases; independent source review passes 88. The full
suite has 2,755 passes, one known missing historical Camera PNG failure,
102 skips and one TODO. Both typechecks and the final production build pass.
Build `HJ8WGQGtilfahWVf4KDYM` is frozen under manifest `1bd8fe17`.
Independent review `d36d7815` and the coordinator verify all 2,854 frozen files.
The coordinator's before/after capture checks find no changes.

The source font remains `cbf_std.bcfnt`, declared SHA-256
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`,
through `public/os/firmware/10.7.0-32E/fonts/shared/font.json`.
Existing title, version, content, internal-path and converter provenance is
unchanged. No native visual or sound asset is added or replaced.

## Fixed production result

The coordinator used normal GUI inputs on the muted MacBook. A fresh boot and
Camera's five guide pages preceded six recorded windows. All user Stops follow
visible destination readiness; all exports completed before the next window.

| Window | Saved LCD pairs |
| --- | ---: |
| HOME | 206 |
| Manual entry | 306 |
| Manual Close | 258 |
| First Resume | 458 |
| Repeated HOME | 352 |
| Repeated Resume | 360 |

The total is 1,940 pairs. The candidate tab and server are closed. Older
sessions, source trees, frozen builds and recordings are untouched.

Closed audit `a37234c1`, manifest `14cdb49b`, verifies all 5,820 originals,
3,880 PNGs and 1,940 dictionary-expanded receipts. Original hashes, sizes,
mtimes and directory inventories remain unchanged. PNG CRC checks and two
independent decoders agree. No fully black LCD or pair occurs. Both Resume
windows contain footer frames 0..14 followed by departure frames 0..40.
First Resume pairs 70..458 are stable; repeated pairs 70..360 are stable.
These source-pose records and browser clocks do not prove native cadence.

The first fixed comparison uses HOME pair 1,
`live-lcd-dca2f5d6-2ece-4afe-bfbb-b8ecefee0b12-0001`, against Resume pair 458,
`live-lcd-4e779869-6fb2-4a77-b09e-1d224bfa313c-0458`.
The upper PNG and decoded RGBA bytes are exact. The lower differs by 225
pixels, with maximum RGB delta 18; 148 pixels exceed delta 2. Four connected
regions cover the photo-count labels. No alpha bytes differ.

The repeated fixed comparison uses repeated HOME pair 1,
`live-lcd-d656cbac-481f-4561-92c7-008f96a1fc19-0001`, against Resume pair 360,
`live-lcd-47a4319d-2925-4f1f-bdef-08462ce4bccf-0360`.
Both PNGs and both decoded RGBA arrays are exact. All comparisons use entire
LCDs, empty masks and no alignment, resampling or replacement baselines.

The earlier unchanged-production comparison was 252 upper / 623 lower pixels.
The candidate therefore reduces the observed first-run difference but does not
meet its exact-closure gate. Nine recorded text-draw keys, fonts, options,
destinations, pre-color and colored fingerprints agree in the new fixed pair.
Those noncryptographic fingerprints are not proof of equal intermediate bytes.
The remaining composition path needs a bounded discriminator, not guessed
sampling offsets or a broader native-fidelity claim.

Read-only triage `72aca8ba` maps all 225 pixels to four `P_BrwsFld/TxtThmb`
draws using three 50x20 cached fills. They draw into fractional 49.92x19.2
destinations. The recorded fingerprints precede both `putImageData` and that
composite. The stock lower Canvas and default context survive title-session
reset; post-write ink, stock-pair pixels and its final copy remain unobserved.
This identifies an allocation/lifetime hypothesis, not an established cause.

The next separate experiment retains the temporary-ink candidate only as an
experimental base and requests `willReadFrequently` at the persistent stock
lower context's first acquisition. Leave the upper and outer LCD contexts,
sampling, geometry, cache lifecycle and readback count unchanged. Require the
same exact first/repeat production closure and reject any remaining residual.
All stock lower drawing is affected, so successful closure still needs the
relevant native-text regressions and matched native capture before acceptance.

## Evidence and limits

Private root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/camera-text-readback-v1/`.

- `policy.md`, hash `cb688af2`, fixes the route and selectors before input.
- `coordinator-ledger.md`, hash `13818c5f`, records inputs, exports and cleanup.
- `implementation/` records the source, checks, asset hydration and build freeze.
- `review-astra-v1/` records the independent source/build review.
- `audit-astra-v1/report.md`, hash `a37234c1`, and manifest `14cdb49b` close the six-window audit.
- `audit-astra-v1/fixed-text-diagnostics.json`, hash `7c57173c`, records the fixed comparisons.
- `audit-astra-v1/fixed-connected-regions.json` retains all changed pixel values.
- `source-triage-astra-v1/report.md`, hash `72aca8ba`, maps the four regions and bounds the next experiment.
- `coordinator-inspection.md`, hash `e56835be`, records inspection of all 16 compact sheets.

Recorded boundary samples show the Manual entry and HOME Menu return covers,
and retained Camera beneath HOME departure. These samples and source-pose
metadata do not establish native input epochs, motion cadence or fidelity.
Camera's read-only main/gallery route, portfolio photo/count fixtures and
retained-compositor behavior remain adaptations. Other native pixel residuals
and all four whole-flow acceptances remain open. Audio stays muted and unverified.

Implementation, audit, source triage and review helpers use GPT-6 Astra with
extra-high reasoning. Tools cannot change or verify this running coordinator's
model or service tier. The unrelated human `system.ts` edit remains unstaged.
