# Guarded Azahar frame-advance capture helper

Worker branch `codex/applet-handoff-gap-20261009`, base `d5c1c5a`.
The coordinator proved manual pause/advance behavior on muted iPad Sidecar.
This worker added a bounded CLI and offline tests without operating the GUI.

Run [the helper](../../scripts/reference/azahar-frame-advance.mjs) with explicit
`--pid`, `--main-window`, `--render-window`, `--output`, `--steps` and
`--sidecar-x`, `--sidecar-y`, `--sidecar-width`, `--sidecar-height`.
`--help` describes the complete contract. The output must be a new absolute
directory with an existing parent. Steps must be an integer from 1 through 120.
Negative display coordinates use the `--sidecar-y=-50` form.

Before each capture or menu request, `list_windows` must identify both exact
Azahar-owned windows, visibly on their current Space and wholly inside the
supplied rectangle. The main window title must start with `Azahar`. A unique
named CUA lifecycle is ended afterward; that cleanup does not invoke emulator
menus. No pause, resume, quit, audio, configuration or screenshot-own command
is sent. The installed `cua-driver` command is fixed in the child-process
transport; the CLI exposes no transport or arbitrary-command override.

Two sequential render-window captures must be byte-identical before the first
`Tools > Advance Frame` request. Each requested step then receives its own
full-resolution `get_window_state` PNG. Exact PID/window, capture validity,
path, bounds, scale and PNG dimensions are checked. Sharp fully decodes each
file, and its SHA-256 and capture metadata enter the manifest. Unchanged step
images are retained. Menu `effect: unverifiable` is an expected dispatch result
and supplies no proof that a native frame advanced.

`events.jsonl` records UTC and monotonic host times before every call and after
its response or failure. A failed run keeps its PNGs, event log and exclusive
final `manifest.json`. `menuRequests` includes attempted requests;
`menuDispatches` counts successful driver responses. Neither counts verified
native frames. There are no automatic retries or overwrites.

The pinned [Azahar source](https://raw.githubusercontent.com/azahar-emu/azahar/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/citra_qt/citra_qt.cpp)
connects Advance Frame to the limiter only while emulation and frame advancing
are active at lines 1095-1099. Pause enables frame advancing at lines 2438-2445.
The screenshot-own handler calls `OnResumeGame(false)` at lines 2967-3005, which
disables frame advancing at lines 2402-2407. The helper therefore captures the
render window through CUA rather than that handler.

Focused checks are in [azahar-frame-advance.test.mjs](../../tests/azahar-frame-advance.test.mjs).
All 12 tests and nonincremental typecheck pass. Tests inject transport responses
and real generated PNGs; they do not operate Azahar. The installed schema was
inspected with `cua-driver 0.30.4`. No package, build, server, native asset or
runtime animation changed.

The coordinator still owns real execution and evidence inspection. Two equal
images are a frozen-image precondition, not an internal pause-state attestation.
Requested step ordinals are not native layout epochs. These full window PNGs
are not raw 400x480 LCD acceptance captures. Host times do not establish native
input/render timing, and audio remains muted and unverified. No 1:1 claim follows.
