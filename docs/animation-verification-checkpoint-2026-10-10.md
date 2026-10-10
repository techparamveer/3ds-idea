# Animation verification checkpoint, 10 October 2026

This checkpoint follows the reviewed folder Back correction `52faeda` and
touch-dispatch tests `07052d0`, already pushed to draft PR7. It changes no
runtime, native assets or sounds. All four whole animation flows remain fail.

## Production candidate and delivery

Clean source `5dab02752cfcb42e2a1a7e0efc97525966c71515` builds successfully in
the separate `folder-back-verification-20261010/3ds-idea` worktree. Production
build ID is `AbU0doePk5fpJYzR19WW_`. Its log SHA-256 is
`0aa3c2e115a4604e7b961efd9e1fc28a8e8a10f3e9c42a6197222c4c0118969d`.
The owned old 3029 server stops before the new candidate starts at the same
loopback address. The old source, assets, build and exports remain unchanged.
Current listener is PID73083. An ordinary browser Reload loads the candidate.
No security permission, browser input restriction or system audio setting changes.

All GUI testing uses the dedicated muted MacBook browser. Its attested window
is at650,150 with size1102x700. New recordings save under the private root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/folder-back-verification-20261010/`.
Recordings and firmware remain outside GitHub. No recorder remains running.

## Folder Back recapture

Policy `policy.md` precedes the inputs; SHA-256 is
`5ea60bbced00579eb87701b3cdaae6496aa2897f133be44bdd9b7df746f5f8f2`.
Session `8386d00c-9ecb-4417-98d3-ee37ecb7acab` saves all466 pairs at the duration
limit. It includes entry and first Back. Session
`64f5721c-12a0-47f5-929f-6f2831bd68b4` begins inside the already re-entered folder
and saves all182 pairs after user Stop. It includes repeated Back, not repeated
entry. Both actual Back-tab inputs recover selected folder HOME.

Coordinator inspected paired chronological page015 of the first session and
page002 of the repeat. First Back shows the orbit through261, upper wallpaper
at262, root cursor at268 and the returning selected graphic later. Repeat shows
upper wallpaper at19, root cursor at25 and graphic at27. Unlike the pre-fix
capture, the selected root cursor no longer coexists with the orbit in these
samples. Faint root/tray content still overlaps the shrinking orbit before
the blank upper state. This is a remaining comparison question, not closure
of all Back ordering differences. Final scoped audit closes648 triples,
1944 unchanged originals and1296 decoded LCD PNGs without structural errors
or warnings. It excludes every adjacent session. Coordinator also inspected
the final first/repeat Back semantic sheets. Private report SHA-256 is
`c0ea06a0813ea63f386425d66875b138761b5391e991ae20123643209384062d`;
root manifest is
`bef21010d1be47c65323a6580f90762597d829a4b3c6743a4f98f980a06705d3`.
Corrected chronological selection is
`9817eae2ca6ee733ab9ca247072e7cda9b9f3727fecf50394202d673656b40eb`.
The original selection remains preserved; native-size inspection corrects the
first-entry wallpaper stage from31 to30. Audit files live under
`offline-audit/folder-back-v4/`.

Native root28 differs from browser22. Native movie samples are not aligned
browser epochs. No pixel mask, static pixel diff, exact timing or held-Back
acceptance follows. The caller boundary remains capture-fitted. Empty-folder
evidence does not replace populated-folder verification.

Adjacent Notes opening/footer-close saves420 user-stopped pairs; Notifications
saves466 user-stopped pairs. Both visibly reach their ready screens, show the
HOME cover on closing and recover selected HOME. These are browser inspections
only; their scoped raw audits and native comparisons remain pending.

## Health HOME suspension

Native audit report SHA-256 is
`5e78d3327ea54ff262e1678f696c3c1d7a1da58604616a96354807884aafb495`.
It verifies13 unchanged originals, ten own400x480 PNGs and69 decoded extracted
samples. Both movies have zero audio tracks. Coordinator inspected the own-PNG
chronology and repeat-suspension closer sheet. Repeat shows inset/dimmed Health,
then upper HOME dialog and lower tray over retained Health, then Close/Resume.
The first movie's inspected samples show only ready Health. Neither movie
proves resume motion. Compressed/decoded sample-count differences remain open.
Selection SHA-256 is
`8b7955fa3a4ea97194c840fc82d98840c88c8fae3a376b2ca56621143f620735`.
Native held-Shift click and browser physical HOME are different input paths.

The browser setup deviates from the predeclared `health-home-policy.md`.
After reducing HOME density, an accessibility Open Health action replaces the
intended actual tile opening. Physical HOME then reports software suspended in
accessibility text, but the later visible upper remains Notifications and the
lower footer says Open, not Close/Resume. All451 duration-limited pairs save.
This is a captured inconsistency, not a successful suspension comparison or
an established runtime cause. A normal tile-open reproduction and scoped raw
audit are required before diagnosis or implementation. No resume/repeat browser
coverage is claimed from this recording.

## Remaining work

Explain the fading overlap against native chronology without claiming aligned
epochs. Audit adjacent applet recordings. Reproduce Health through ordinary
tile input before comparing suspension/resume. Manual retains the known60 upper
and9 lower endpoint residual. Native motion/input timing, gated applet exits,
populated folders and muted audio acceptance remain open. Supporting runtime
checks are recorded in the [folder correction handoff](workstream-handoffs/folder-back-orbit-20261010.md).
