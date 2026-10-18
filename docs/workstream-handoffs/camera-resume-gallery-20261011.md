# Camera Gallery Retained Resume

Base: `daf0eb7ed994bafc024271a5f4ceb967ff85e083`. Implementation is limited
to `src/os/screens.ts`, its existing retained-Resume behavior test and this note.
No assets, reducer, lifecycle, scene, input geometry or timing controller changed.

## Captured Defect

The closed `camera-gallery-resume-browser-v1` audit `3ced32e9`, independently
reviewed as `34ac4567`, records fully black paired LCDs at Resume198/199 before
gallery200..318 exactly reproduces the initial browser gallery pair. The
coordinator inspected all consecutive native movie frames605..719 under
`native-camera-gallery-v1`: retained gallery remains beneath outgoing HOME,
with no fully black pair visible in that bracket. Native/browser photo counts
and content differ; the lossy movie is ordering evidence, not raw-LCD or cadence
acceptance. Both evidence sets remain unchanged.

## Repair And Guards

The same eligibility predicate now admits Health and Camera `main`/`gallery`
at all three boundaries: resumed identity, footer-free HOME readback and accepted
source capture. Camera Welcome, photo, settings and shooting are not enabled by
this extension. Existing read-only portfolio gallery content is an adaptation;
no shooting mode was added.

The compositor retains the accepted paired application capture while Camera's
native title session reloads asynchronously after HOME inactivity. The existing
footer0..14 and departure0..40 source poses are reused unchanged. Completion
still requires the exact current prepared destination pair and its accepted
visible terminal receipt. Owner, capture/resource generation, settled HOME
origin, visibility, sleep, failure, revoke and disposal guards are unchanged.
Resource errors remain explicit paired recovery, never a substituted native UI.
Recovery labels and the private recovery key are generalized to retained Resume.

The HOME scheduling, shared source epoch, settled button feedback and paired
receipt cadence remain host adaptations. This patch establishes neither original
Camera feedback timing nor exact native departure duration.

## Native Resource Identity

No delivered resource or provenance record changed. HOME EUR title
`0004003000009802`, version 24576, content index 0 / CIA content `00000082` supplies
`home.launcher` footer/window/lower departure, `home.hud` and
`models.homeBackground`. Exact internal paths, hashes and converter identities
remain in the [retained Resume mapping](health-resume-retained-20261010.md#original-caller-and-selected-resources)
and [footer mapping](health-resume-footer-20261010.md#native-resources).
The unchanged lower SceneOut SHA is
`9880faca7e0caa8d3fa401cc8bfa59e823e1c33a36e1e2ce35d7d29fe0c834fd`;
footer SceneOut is
`df95bfcc74135a116fe14b39604cdd1300197e48b2c864989d3b40d35f13cf1d`;
BannerBG source container is
`27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711`.
Existing Camera pack/font/photo mappings remain unchanged.

## Supporting Checks

Private logs live under the top-row artifact root's
`camera-resume-gallery-fix-v1`. Focused retained/footer/controller/capture and
Camera route/lifecycle tests pass 50/50 (exit 0). Typecheck and final build exit 0.
Hydrated full suite: 2847 tests, 2743 pass, 1 fail, 102 skipped, 1 TODO (exit 1).
The sole failure remains the absent historical
`camera-3d-badge-sdmc-recapture-20261005/browser/lower.png` fixture; it was not
manufactured and its assertion was not weakened.

The new behavior tests drive actual system/lifecycle paths and deferred title
loads with delivered decoded pack layouts, but canvas pixels/readbacks and
renderer markers are synthetic fixture evidence. They cover main/gallery first
and repeated touch Resume, rejected footer/departure publication, all footer
and departure source poses, delayed readiness, exact terminal handoff, load and
draw errors/retry, stale owner/origin/resources and excluded Welcome. Existing
Health tests remain unchanged apart from fixture support for Camera.

Preserved setup failures: the first test attempt used the middle Manual footer
coordinate; corrected Resume coordinates reproduce the missing retained pair.
One intermediate test assumed a nonexistent portfolio folder ID, corrected to
the actual view's folder action. Initial typecheck caught nullable suspended
identity. The first full suite had40 additional unhydrated GLB/LFS-pointer
failures. Own-worktree hydration verified all donor OIDs/sizes before and after
copy; the frozen donor was read-only. Node forced clone returned ENOSYS, so
`cp -c` performed the verified copies. All earlier logs remain preserved.

Independent review, integration and coordinator production recapture are still
required. No GUI/server/native operation was performed by this worker. All
whole flows remain fail/unproven and audio remains muted/unverified.
