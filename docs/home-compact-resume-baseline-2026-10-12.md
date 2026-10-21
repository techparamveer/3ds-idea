# Suspended HOME window baseline

## Captured defects

Frozen runtime `0b890db58ec3ca4089b4c3ff31baabf5c0f30e86`, production build
`aliq5AWB4-hIMEWfdtw6D`, jumps between compact and expanded suspended-Health
window poses when selection moves away and back. Its renderer binds the
decrypted `LncBase_U_00_ScaleUpDown` at frame 0 or 15 only. Native captures
show intermediate geometry in both directions, first and repeated.

The first browser away boundary is session `a4e23e54-509e-43ae-a5bc-c49d8206f6a8`,
pairs 88/89, consecutive receipt frames 2966/2967. The clean Back boundary is
session `e5fd2c63-abdb-4554-b06f-decb27ab4927`, pairs 3/4, receipt frames
5367/5368. Their receipt gaps are 441.7 and 370.4 ms. The saved poses alone
cannot exclude unsampled animation; the endpoint-only source binding confirms
the missing interpolation. These gaps are not native animation durations.

First actual touchscreen Resume also contains fully black upper and lower
LCDs at pairs 6 through 16 of its 183-pair recording. Pair 17 shows Health
again. The raw PNGs and valid paired receipts confirm the output, not its
cause. This is a newly captured failure requiring diagnosis and recapture,
not a withdrawal of earlier, differently scoped retained-Resume evidence.

The repeated recordings confirm both defects. Repeated Back jumps from compact
to expanded at pairs 3/4. Repeated Resume has black paired LCDs at pairs 7..17,
then Health at pair 18. The seven closed recordings contain 1,366 paired
samples and 2,732 PNGs. Each run's audit validates its originals; these are
baseline failures, not candidate acceptance.

On 14 October, a controls-enabled regression reproduced the missing retained
Resume path after keyboard-away/touch-return. The selection widget retains
its completed Decide1 pose with idle controllers, but the capture guard
accepted only Select0. Commit `d793a21` admits that completed idle pose while
keeping the active-touch, origin and paired-publication checks. Its focused
suite passes 95 tests. Combined build and actual browser recapture remain
pending; this does not establish native Resume parity.

## Native evidence

Private bundle `home-compact-resume-20261012-v1` is under the current
top-row continuation artifact root in [STATUS](../STATUS.md). Its
`native-audit-astra-v1/report.md` has SHA-256
`4a282786d7ac3a1ff9c623301458a3afaaf730cfcae98f2fe816cf08a0736440`;
manifest SHA-256 is
`d15e56f0d4ad22038ee7506edc0b7d179ac50f1155d0c477c7bde9426c9919f7`.
All 71 native 400x480 PNGs, 71 request brackets and nine input records validate.
Root inspected all twelve paired 1x sheets. Originals are unchanged.

Both departures shrink/move the Health window before the incoming Camera
banner appears. Both returns select Health while Camera's banner remains,
then remove that banner during expansion. Captions and footer also change.
The ignored first 500 ms Back attempt remains separate from its successful
1500 ms recovery. Direction captures run at global 5% diagnostic speed;
Resume endpoints were taken after restoring 100%. Their long endpoint gaps
do not establish continuous Resume motion, exact input epochs or normal cadence.

Azahar PID 99256 quit with exit 0. Restoring the temporary HOME binding and
screenshot path returned the exact original muted profile SHA-256
`031bc53517a1557c1b6fab2d341a2b9b10a304eb79665decaeccdb89a05ed1ad`.

## Source and limits

Manifest key `home.launcher/animations.LncBase_U_00_ScaleUpDown` maps to EUR
HOME title `0004003000009802`, v24576, content 0/`00000082`, internal path
`launcher_LZ.bin/anim/LncBase_U_00_ScaleUpDown.bclan`, SHA-256
`e1669ce6c081b61200d24d99cd4f61fd24b8c4967fef9b4a99728c29ee10f8d8`,
converter `ctr-native-web 1.2.0`. See the existing
[source contract](home-pause-compact-entry-2026-10-08.md).

The ScaleUpDown implementation is assigned separately; this baseline document
does not claim delivery or candidate verification. Native activation/cadence,
banner/footer scheduling, moving-pixel equality and muted audio stay open.
Browser portfolio neighbours differ from the native fixture. No masks,
nearest-frame selection, clock forcing or whole-flow pass were used.

All GUI work used the MacBook built-in display and muted dedicated sessions.
Normal preview 3040 was preserved during those captures. Capture 3041 used
a separate instance of the same frozen build and was stopped afterward.
The current continuation uses a new muted Helium profile on the MacBook.
