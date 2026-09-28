# eShop close investigation

Investigation recorded 26 September 2026. No runtime defect was established and
no runtime change was made. This is bounded input/lifecycle evidence, not a
native-fidelity pass. See [OS state and input](architecture/os-state-and-input.md)
and the [verification contract](architecture/verification.md).

## Initial observation

The coordinator initially observed NVIDIA portfolio after accepting a close
confirmation during an eShop route at `93741d7`. A later accessibility snapshot,
without an intervening coordinator action, instead showed HOME with an empty
slot and suspended software; the viewport also changed. That tab subsequently
vanished from the session. The cause remains unconfirmed; stale automation
indexes or other session activity are hypotheses, not findings.

## Pure state/input reproduction

At `93741d7`, an in-memory Node reproduction used `createPortfolioState`,
`tickSystem`, `launchHomeShortcut`, `dispatchSystemEvent`, and
`enableHomeControls`. It followed this exact sequence:

1. Complete boot at 3001 ms and open the eShop HOME accessibility shortcut.
2. Advance 3000 ms in steps of at most 16 ms, press A (`open`), then advance
   4000 ms through the welcome source exit to HOME with eShop suspended.
3. Press A to resume the same owner with welcome elapsed time reset to zero.
4. Press HOME, then B; confirm the close dialog has no pending launch.
5. Press A, then advance another 4000 ms.

Each press used down/up events with source `accessible:<command>`. The route
was run with native HOME controls both enabled and disabled, and repeated with
A held for 1000 ms during close, a browser repeat event and a duplicate down
before release. All four cases ended in HOME with eShop selected, no dialog,
no application or active owner, empty runtime instances, and both pending launch
fields null. The close handler returns immediately after closing; it launches
another title only when a pending switch already exists. Clock-owned input
repeats are restricted to directions.

Existing targeted checks passed **33/33**:

```sh
node --test tests/portfolio.test.mjs tests/eshop-welcome-lifecycle.test.mjs tests/app-input.test.mjs tests/home-controls.test.mjs
```

The diagnostic reproduction was executed from standard input, not added as a
regression fixture because the suspected bug did not reproduce.

## Coordinator production-browser evidence

At integration `a53fe45`, the coordinator used the named Open eShop shortcut and
keyboard inputs: welcome → `a` → settled HOME with eShop suspended → `a` resumes
welcome → `h` suspends → `b` opens close confirmation → `a` returns HOME. The
coordinator visually inspected the final screenshot: eShop remained selected,
the footer offered Open, and no application remained. This independently agrees
with the pure lifecycle result. The L4 investigator did not operate the browser
or Azahar.

Raw final browser LCD evidence is under:

`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/eshop-close-keyboard-verified/browser/`

| File | SHA-256 |
| --- | --- |
| `upper.png` (400 × 240) | `887904df8c75fd8d13f99bd00cb2db10fce0061b9d11b0aa70382201b1760c2c` |
| `lower.png` (320 × 240) | `5da804fd4dd5beb9e0dd39875cb2d2d9a95a4f19ea49f2182954dcd0b22356c5` |
| `capture.json` | `d8ac9a201c986c30d816b5130c368487a18a1c092a311daa1e1f65a3508e93c7` |

The capture records selected/visible slot 12 and eShop selection. Its injected
presentation date is `2026-09-25T21:27:00.000Z`; this is not a capture wall-clock
timestamp. No matched native capture, comparison mask or diff report is available
for this route. Native behavior, pixels, motion and audio remain unverified;
no scenario status is promoted to pass by this investigation.
