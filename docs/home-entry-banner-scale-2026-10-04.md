# HOME entry Camera banner scale — 4 October 2026

Visible-first correction for the HOME-entry Camera banner that still first-painted small at browser update 18 against native N057 (~0.8 with footer terminal) on the frozen staging run.

## Evidence this slice does not close

This is not 1:1. Offline LCD re-measure against hashed natives was not possible here (preview 3021 / CDP 9320 are coordinator-owned). Pixel counts over 2/255 await coordinator recapture.

## Native pair and owners

- Frozen after-desktop: `home-entry-banner-release-20261004/after-desktop` (27 pairs), result SHA-256 `e8aa155f25237ee89c0dcc9493ecc7b8004ddf5dc7c9881a069f3bd80a201000`.
- Native N056 none, N057 ~0.8 with footer terminal, N058 full. PNG57 `_03.10.26_04.23.49.262.png` SHA-256 `17d3ecc01a01d0e05a1eb1b31fc4f1782a7985bfe5211786a52287955e69a1db`.
- Collector `capture-entry.mjs` SHA-256 `c36374abd43a73f539983d256725ada51a56409ac35bc2da1a4cc6c6a84e7a63`.
- Camera title `0004001000022400` v4097 content `0000001a`.
- HOME `0004003000009802` code.bin `243a728e…`. First visible manager update writes scale `0.8` (`0x1fa344` VMLA float32), then four more updates to `1.0`.

## What was wrong

Worker release at footer SceneIn 10 still left loading and activate on later manager passes, so browser first-small landed at captured delta 18 versus native ≈17. The four post-release stages each consumed a HOME update.

## Source-backed fix

Keep SceneIn 10 release / frame 14 terminal. Do not retune labelled footer+3 / HUD+7.

- `homeEntryBannerActivationDue` is true for ordinary hosts (`startedAtUpdate === null`) and for live entry only on footer SceneIn 14 or after that terminal receipt.
- Banner service takes optional `activationReady` (omit = true). Gate can still go loading when it is false. Activate requires `nativeWorkerReady && activationReady && (clear || resourceReady)`. Close-return still requests at exit frame 4 and activates at return 6 through unchanged gates.
- Host retains `activationReady`. Screens export `homeEntryActivationReady`. Observe and `stepHomeBannerHost` sample it on the current HOME update so footer-14’s manager pass can activate at scale 0.8 on that same paint.

The source 0.8→1 ramp is unchanged (four manager updates after the shared terminal).

## Tests

`tests/home-entry-banner-scale.test.mjs` plus existing host/service/presentation/scene-policy tests: 69 pass, 0 fail after correcting the ordinary-host due sample (boot-owned empty samples hold until footer 14).

## Recapture for the coordinator

Run `capture-entry.mjs` SHA-256 `c36374abd43a73f539983d256725ada51a56409ac35bc2da1a4cc6c6a84e7a63`. Inspect banner box `x40..360,y80..170` against N057/N058. Do not claim a pixel pass until that pair is diffed.
