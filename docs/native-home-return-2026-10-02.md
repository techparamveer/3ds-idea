# Native HOME Return - 2 October 2026

Latest [software-closing verification](home-software-closing-2026-10-02.md)
repeats native Health -> HOME using held Shift-modified drag500ms with temporary
HOME QtShift16777248. Held Open500ms and Close1000ms produced37 closing PNGs
at diagnostic5% speed. Native stopped with100% speed and input bindings
restored, still muted. This supersedes intervening HOME-return failure notes;
exact normal-speed input and motion acceptance remain open.

Reference-only progress at runtime `7dd76afa`, following `f668e13a`.
Native Health -> suspended HOME is now observed. No website code changed;
no browser pair, mask/diff, motion acceptance or scenario pass is claimed.

## Replay and Input

Private root: `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
The isolated `native-close-clean-20261002` executable retains SHA-256
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
User tree has no symlinks and custom storage is disabled. Static input2,
Null output1 and volume0 remain explicit non-default values; no host audio
devices or system/Spotify settings were used.

The retained `native-held-home/health.ctm` selects and launches Health from
HOME. It cannot encode APT HOME. For this bounded run, the stopped clone's
HOME binding was temporarily Qt Shift/code16777248, with APT debug logging.
`native-held-home/config.retry-launch.ini` SHA-256:
`cd0c1d40bfa8d48ef85a009858b9f73f318283adb6252ff8838309cfbeea6fa1`.

After Health was visibly running, cua-driver MCP posted a foreground
Shift-modified upper-LCD drag `(1100,400)` -> `(1110,400)`, 500 ms/20 steps,
against PID93269/window3004 at native screenshot size2306x1562. The CLI
attempt was refused with missing screenshot context and delivered no input;
MCP maintained the required observation context. Use MCP for this workflow.

The application log records InquireNotification at141.528126,
PrepareToJumpToHomeMenu at141.573858 and JumpToHomeMenu at141.595468.
Replay EOF then opened its blocking completion modal. After dismissing it
and invoking Emulation -> Continue, the first-use suspended notice and
upper suspended-software window were visibly present. This establishes the
observed return, not exact native key-hold duration or uninterrupted timing.

A 200 ms/8-step held touch on the notice's OK button dismissed it. Another
200 ms/8-step touch on the visible Close footer returned Health to ordinary
HOME. No intervening confirmation was observed; this sparse observation
does not rule out a transient closing frame. Do not infer other apps' dialog
policy from this read-only Health route.

## Native Captures

Azahar's own Capture Screenshot command wrote these inspected400x480 PNGs
under `native-close-clean-20261002/screenshots/`:

| State / filename | SHA-256 |
| --- | --- |
| First-use notice: `_02.10.26_04.57.13.02.png` | `e902cefa88771c534262a0f540bb83eadf2907e7985d155c8b544bbb424067a5` |
| Suspended HOME: `_02.10.26_04.57.45.252.png` | `929a8623f8f5061ad5dfc7c4d0b8772eb4ee04503bf04101e0979d97a1945d75` |
| Health closed: `_02.10.26_04.57.56.664.png` | `873a11b98b5b5e7667c3a771e2cdfacc9c734bc785ec3634c5b300b254f3b4f7` |

Preserved log: `native-held-home/successful-return.log`, SHA-256
`6e991971b7b4e745a6e6d6b302666026dca852ef22c569b52ab2b160a45e7ca0`.
These are native references, not matched native/browser evidence.

## Cleanup and Next Delivery

Fresh Sidecar bounds were1800,367,1357,935; main and each interacted modal
were independently verified inside them. Normal Quit/Yes completed;
session56122 exited0 and PID93269 is absent. While closed, HOME was restored
to B/code66/defaulttrue and logging to *:Info/defaulttrue. Audio stays silent.

H-12 now has a real suspended-window capture for source-backed composition.
L-06/L-07 still need application-specific close/switch reference and motion;
the browser's universal authored confirmation is not established by Health.
Existing fitted composition, local persistence/preview sampling, portfolio
content and offline adaptations remain. No private matrix was changed.
