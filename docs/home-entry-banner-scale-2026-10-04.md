# HOME entry Camera banner scale — 4 October 2026

**Capture-fit adaptation.** `7b773b71` holds HOME-entry banner activation until the live footer SceneIn 14 sample, so the first scale-0.8 paint sits on the captured N057 footer-terminal frame. The `activationReady` conjunction only delays that activate branch. The 4 October four-slice review (LOG) rejected the previous "source-backed fix" wording: this gate does not recover a firmware activation writer, and it does not pull a one-update-late browser paint earlier.

## Evidence this slice does not close

This is not 1:1. Offline LCD re-measure against hashed natives was not possible here (preview 3021 / CDP 9320 are coordinator-owned). Pixel counts over 2/255 await coordinator recapture.

Claude four-slice review (LOG, 4 Oct) **APPROVE-WITH-NITS**. This note closes the label nit. The other nit stays open: the entry sampler can throw on a backwards clock, and the scene loop now calls it.

## Native pair and dump facts

- Frozen after-desktop: `home-entry-banner-release-20261004/after-desktop` (27 pairs), result SHA-256 `e8aa155f25237ee89c0dcc9493ecc7b8004ddf5dc7c9881a069f3bd80a201000`.
- Captured stills: N056 none, N057 ~0.8 with the footer terminal, N058 full. PNG57 `_03.10.26_04.23.49.262.png` SHA-256 `17d3ecc01a01d0e05a1eb1b31fc4f1782a7985bfe5211786a52287955e69a1db`.
- Collector `capture-entry.mjs` SHA-256 `c36374abd43a73f539983d256725ada51a56409ac35bc2da1a4cc6c6a84e7a63`.
- Camera title `0004001000022400` v4097 content `0000001a`.
- HOME `0004003000009802` code.bin `243a728e…`. The first visible manager update writes scale `0.8` (`0x1fa344` VMLA float32), then four more updates reach `1.0`. That ramp writer is unchanged. The float store does not schedule activation from footer SceneIn 14.

## Capture-fit gate

Keep SceneIn 10 release / frame 14 terminal. Do not retune labelled footer+3 / HUD+7.

The frozen staging run first-painted the banner small at browser update 18 against native N057 (about update 17). Waiting for footer 14 lines the 0.8 paint up with that captured terminal frame. It leaves the one-update gap unmeasured.

- `homeEntryBannerActivationDue` is true for ordinary hosts (`startedAtUpdate === null`) and for live entry only on footer SceneIn 14 or after that terminal receipt.
- Banner service takes optional `activationReady` (omit = true). The gate can still enter loading while it is false. Activate requires `nativeWorkerReady && activationReady && (clear || resourceReady)`.
- Host retains `activationReady`. Screens export `homeEntryActivationReady`. Observe and `stepHomeBannerHost` sample it on the current HOME update.
- Close-return still requests at exit frame 4 and activates at return 6 through unchanged gates.

The 0.8→1 ramp remains four manager updates after activation.

## Tests

`tests/home-entry-banner-scale.test.mjs` plus existing host/service/presentation/scene-policy tests: 69 pass, 0 fail after correcting the ordinary-host due sample (boot-owned empty samples hold until footer 14).

## Recapture for the coordinator

Run `capture-entry.mjs` SHA-256 `c36374abd43a73f539983d256725ada51a56409ac35bc2da1a4cc6c6a84e7a63`. Inspect banner box `x40..360,y80..170` against N057/N058. Do not claim a pixel pass until that pair is diffed.
