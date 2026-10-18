# Notes and Notifications footer return banner

10 October 2026. Candidate branch `codex/applet-return-banner-20261010`, based
on `5df8132b4bc13e0a9579e011a1604d0e2ea0df1f`. The candidate is the commit
containing this handoff. Worker checkout is
`/Users/paramveer/.codex/worktrees/applet-return-banner-20261010/3ds-idea`.
Only the already reviewed HOME-origin, caller-null main-list touchscreen footer
Close paths for Notes and Notifications acquire this fitted return boundary.

## Defect and diagnosis

The host retains the selected visible toolbar primary while its manager and
scene passes are inhibited by foreground applet ownership. At the accepted
footer outgoing endpoint, the existing applet completion releases that owner.
The prior scene immediately observed HOME without clearing the primary. Its
same-target request therefore reused the still-visible object. The HOME painter
drew that banner before the incoming common cover was composited over it.
Ordinary application-close clear/request boundaries inspect
`homeApplicationTransition`; neither reviewed footer path creates one.

Private evidence root `R` is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion`.
The worker read and rehashed these existing records, and inspected the native
close sheet and all four concise browser transition sheets offline:

| Record under R | SHA-256 |
| --- | --- |
| `toprow-exit-audit/source-audit.json` | `cad1674adb56d941f11abc0058707fb3550e2be3a5af98e38a7742d9290985f4` |
| `toprow-four-observation/offline-audit/prior-source-candidates.json` | `7f4899821fd8186754776dcb326b869e41b3f3b1170af11a65b4bc36d39fa0db` |
| `toprow-four-observation/offline-audit/notifications-close-keyframes-LOSSY-DIAGRAM.png` | `00fdf55329bf777db6992a29df0154ac8f6d6f8d348858a003a1a95d2c31ba85` |
| `notifications-close-verification/offline-browser-audit-20261010/report.md` | `dfe67a2daf0e5a81acf2bf97004803ecb5c2feb481dcabb7c42c963b568059b2` |

Native samples expose HOME before its selected banner. Both browser close
sheets already show the banner under the departing HOME cover. These are lossy
window diagrams with different unread counts and HOME contents, not a matched
raw LCD pair. They establish a qualitative defect, not a native duration,
accepted input epoch, dispatch, activation update or frame alignment. The
[Notifications delivery](../notifications-footer-close-delivery-2026-10-10.md)
records the individual browser sheet hashes and comparison limits.

## Implemented adaptation

After a valid `presentNotesFooterClose` or `presentNotificationsFooterClose`
returns its outgoing owner, the existing completion must actually change the
state before `resetHomeBannerPrimary` runs. Only that primary service, active
presentation, pending presentation and resource acknowledgement are retired.
The session-owned wallpaper, global HOME counter and primary scope allocator
are preserved. The next ordinary observation allocates a fresh primary scope
and request ticket using the unchanged selected toolbar target.

`screens.homeAppletFooterBannerReady(state)` reads the two existing footer
controllers' `active(state,generation)` queries. Both scene observation and
the per-pass manager boundary include it in the existing `activationReady`
gate. Pending load/wait work can proceed. The new primary cannot activate or
advance yaw or source clips while either matched controller still owns its
return. The wallpaper and shared HOME counter continue their existing passes.
The accepted uncovered `handoff` sets the controller done and releases this
gate on the next ordinary observation. There is no added timer or counter.

The readiness query deliberately excludes input/render eligibility filters.
Hidden, sleeping, context-lost, failed or revoked publication cannot finish
the controller or release its retained return merely by becoming ineligible.
The existing cancellation, generation reset, owner replacement and disposal
contracts remain authoritative; an explicitly abandoned return releases its
hold through that same controller lifecycle. All outgoing owner, sequence,
generation, candidate ticket, pair and resource checks remain unchanged.

This reset trigger and handoff gate are **capture-fitted adaptations**. The
native footer-to-HOME banner caller remains untraced. The generic source
mechanics below support the reused motion, not this exact dispatch or cadence.
No native asset, font, manifest, cue, public file, shader or material changes.
Opening, B, physical HOME, subscreen Back, callers, folders and other applets
retain their existing routes.

## Source and provenance

The pinned HOME title is `0004003000009802`, version24576, content0/`00000082`.
Its decrypted `exefs/code.bin` SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
[Generic-primary source](../home-toolbar-motion-source-2026-10-03.md) identifies
Notes type15 and Notifications type16, their shared `0x1fa0fc` constructor,
`0x1fa344` quarter-step visibility/scale update and `0x24e0c0` yaw update.
[Lifecycle evidence](../native-banner-lifecycle.md) distinguishes same-current
reuse, immediate detach, normal hidden visibility reset and background clocks.
Neither trace proves the missing footer-return caller. The source audit and
prior candidate inventory explicitly leave dispatch and native timing open.
The ordinary Health close's fitted request frame4 is not reused here.

| Visible element | Manifest key | CIA-internal member | Compressed source SHA-256 |
| --- | --- | --- | --- |
| Notes returning pencil/banner | `models.bannerAppletMemo` | `romfs/3D/BannerAppletMemo_LZ.bin` | `ac476f4901148b4ca1dbd85db9d8c6780945539f40cddab47e11d3dfe96097e0` |
| Notifications returning balloon/banner | `models.bannerAppletNews` | `romfs/3D/BannerAppletNews_LZ.bin` | `5170a1c67eed6dd6536a85c0a83689552fe335ad9fa51d88085d0c5084c1a931` |

Both existing models use `ctr-cgfx-web`1.4.2 and their own looping600-frame
skeletal/300-frame material clips. Their native label mappings are unchanged.
[Notes mapping](../home-toolbar-banner-mapping-2026-10-01.md) and
[Notifications source](../home-news-motion-source-2026-10-01.md) preserve decoded
and delivered identities. Unchanged footer cover/feedback/label resources,
converter versions and legacy unsupported provenance fields remain in the
[Notes handoff](notes-footer-close-20261009.md) and
[Notifications handoff](notifications-footer-close-20261009.md).
This worker performed no extraction or source conversion.

## Verification and remaining work

Focused regression command:

```sh
node --test tests/notifications-*.test.mjs tests/notes-*.test.mjs tests/applet-*.test.mjs tests/home-banner-*.test.mjs tests/social-completion-routes.test.mjs tests/native-screen*.test.mjs tests/application-close-scene-policy.test.mjs tests/boot-publication-scene-policy.test.mjs tests/camera-gallery-lifecycle.test.mjs tests/eshop-welcome-lifecycle.test.mjs tests/home-entry-banner-scene-policy.test.mjs tests/home-entry-motion-scene-policy.test.mjs tests/manual-entry-clock-scene-policy.test.mjs tests/stock-screen-preparation.test.mjs
```

Result454 tests:442 passed,12 existing private-evidence skips,0 failures.
Nonincremental `tsc --noEmit --incremental false` and `git diff --check` pass.
No dependencies were installed. The worker used a local symlink to the frozen
verification checkout's existing dependencies without modifying them.
Logs are under `R/applet-return-banner-implementation-20261010/`:

| Log | SHA-256 |
| --- | --- |
| `focused-tests-final.log` | `269a6c3c13f4ea1e6530aaf5622dbf167af6ceda0d47c5f202deb4691fa51496` |
| `typecheck-final.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

Behavioral tests execute the actual extracted scene render/observer functions,
real host and real footer controllers for both first/repeat normal/reduced
returns. They verify primary-only retirement, a new ticket/scope, wallpaper
progression without epoch reset, no primary through incoming20 or rejected
handoff, and fresh source scale growth after accepted handoff. Real
`createScreens` tests cover the new gate during both return compositors, error,
retry/cancel and unaffected opening. Existing invalid render, hidden, sleep,
lid, context and stale-owner cases additionally retain the old primary.
Recorded test times and update counts are fixtures, not native measurements.

Source-identified and delivered resources are recorded above; the fitted
boundary is implemented and source-tested. Candidate browser inspection,
native comparison, raw capture pair, reasoned mask and diff report do not yet
exist. No GUI, server, production build, full suite or audio comparison was run
by this worker. Frozen18137f4/3027 and the user's `system.ts` remain untouched.
Coordinator review, clean production checks and first/repeat visible comparison
must precede integration. Recheck B/HOME, cancellation/retry, callers and prior
opening/folder/Manual/HOME regressions.

Remaining non-native behavior includes this fitted return boundary, the prior
footer Decide/common-cover selection and60Hz presentation fit, reduced-motion
endpoint selection, zero native displacement/offset gaps, perspective console
presentation and intentional portfolio HOME content. Native dispatch, exact
input/motion and first submitted banner phases remain unresolved. All four
whole animation scenarios remain fail/unproven. Audio acceptance remains
unverified while muted.
