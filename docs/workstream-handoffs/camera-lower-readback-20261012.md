# Camera persistent lower readback experiment

Branch `codex/camera-lower-readback-20261012` starts at experimental candidate
`f43f640d4ac5327d03176758184cd90eb1aa523f`. That candidate is not integrated:
its first fixed production resume still differs by 225 lower RGBA pixels,
with maximum RGB delta 18 and 148 pixels exceeding delta 2. Upper is exact,
and the repeated fixed pair is exact on both LCDs. Integration remains at
the coordinator's documentation checkpoint `94bc9f8` when this work starts.

## Scope and hypothesis

The remaining pixels lie in four Camera main photo-count labels. All nine
recorded text draws agree in pre-color and colored ink fingerprints, keys,
font metadata and destination metadata. Those noncryptographic fingerprints
do not prove byte equality. Source tracing places the labels' fractional
drawImage composition into a persistent stock lower context after the ink
diagnostic boundary. This suggests a destination allocation/lifetime
discriminator; it does not establish a Chromium, GPU or backend cause.

This commit changes only the first persistent lower 2D context request in
`src/os/stock-screen-presentation.ts` to `{willReadFrequently:true}`. It keeps
the predecessor's generic ink options as an experimental base. Upper and
caller-owned outer contexts, canvas dimensions and lifetime, sampling,
material math, caches, diagnostics, pixel-read count and timing are unchanged.
No public resource, scene, controller, font or audio change is included.
The lower context is shared by stock presentations, so regressions in other
stock apps remain possible and require coordinator verification.

## Supporting checks

Focused checks pass 70/70 across Camera gallery lifecycle, generic ink
allocation, native Camera painting, stock preparation and diagnostic export.
The added case calls the real stock presentation, Camera reducer/runtime and
Camera painter. Its recorded canvas and native-loader/renderer substitutes
observe first context requests before any test acquisition, persistent
identity and dimension writes across HOME/resume and close/relaunch, paired
pending/ready publication, cached-pair reuse, disposal, and zero new pixel
reads. It also observes real painter arguments for generic count labels and
the existing Slideshow/Settings sampling allowlist. It cannot verify browser
context implementation or production raster bytes.

Full tests, standard and nonincremental typechecks, the final postcommit build,
exact command exits and frozen build identity are recorded in the private
implementation directory below. The sole known baseline failure is the
missing historical Camera date-group PNG:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`.
That assertion is not weakened. No shader or material code changes.

Dependencies are copied into this worktree from the frozen predecessor,
without external symlinks or sibling mutations. Seventy-seven LFS GLBs are
hydrated only after matching both the local Git pointer and prior SHA-256/size
records. Hydration and the worker's local STATUS reconciliation are not staged.
Only runtime allocation, the focused test file and this handoff are committed.

## Evidence and acceptance boundary

Private root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/`.

- Rejected predecessor audit: `camera-text-readback-v1/audit-astra-v1/`.
- Bounded source triage: `camera-text-readback-v1/source-triage-astra-v1/`.
- Predeclared next experiment: `camera-lower-readback-v1/policy.md`.
- This candidate's checks, hydration, report and full build freeze:
  `camera-lower-readback-v1/implementation/`.

Fixed predecessor baseline is
`live-lcd-dca2f5d6-2ece-4afe-bfbb-b8ecefee0b12-0001`; first resume terminal is
`live-lcd-4e779869-6fb2-4a77-b09e-1d224bfa313c-0458`. Originals stay frozen.
The source font remains `cbf_std.bcfnt`, declared SHA-256
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`, with
existing title/content/path/converter provenance in the delivered manifests.

Independent source review can authorize production recapture only. The
coordinator alone serves and drives the muted production browser. The fixed
six-window workflow requires exact first and repeated PNG/RGBA closure,
empty masks and stable endpoints; any residual rejects this candidate. No
alternate baseline, selected similar endpoint or new CPU probe is introduced.

Source identification, implementation and supporting tests are distinct
from browser inspection and native comparison. This worker runs no server,
GUI, Azahar or audio. Existing read-only Camera behavior, fixture photos/counts
and compositor adaptations remain. Native pixels, exact input, motion, cadence
and muted-audio acceptance remain unverified; no whole scenario is passed.
