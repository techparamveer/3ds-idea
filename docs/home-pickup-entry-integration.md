# Live stationary pickup checkpoint

2026-09-23. The browser now runs the native tile threshold and the bounded
ordinary pickup entry through the shared HOME clock. The authorities are the
unchanged43-case [tap audit](../scripts/firmware/GRID_STYLUS_EVIDENCE.md),
16-case [threshold audit](../scripts/firmware/GRID_LONG_PRESS_EVIDENCE.md) and
four-case [completed-entry audit](../scripts/firmware/GRID_PICKUP_ENTRY_EVIDENCE.md).
The latter source report is SHA-256
`6f18a19bed6bf3daf39fb5ba41e2852cb3a8b1e19bb184cc1eac4d82c446330c`.

The initial press records an eligible app candidate without selecting it. H20
reverses tile Select; H21 emits callback3. The occupied ordinary entry copies
candidate to selection without ordinary acceptance effects, requests primary2
and emits native grab once in input. The later footer hides primary and original
tile before2D, so Loop and the original Select retain H20 values. Pickup and
PickUpBlank each submit their own mode5 Scale frame. The pure painters consume
these applied frames and host-supplied centers. The blank is not an ordinary
vacancy substitute; both layouts retain their source resources/materials.

The retained pickup source drives original-tile hiding. Painting and screenshot
capture do not advance state. Reduced-motion invalidation observes changed
pickup state as well as tile poses. Scene diagnostics expose candidate, pickup,
mode14 and current/applied frames for read-only verification.

Vacant H21 finishes reverse Select instead of creating pickup. Its release emits
callback4 without Decide/selection, followed by the existing two-step capture
cleanup. Release after H20 still uses ordinary Decide/R+3 acceptance. Candidate
clearing on leave persists through reentry. A review caught an ownership bug
where physical up cleared `strokeOwned` before release classification, allowing
the old450ms recognizer to lift a candidate-cleared stroke. Native ownership now
also covers pending edges and retained widget capture. The actual-input
leave/reenter/hold/coalesced-release regression prevents an unintended icon swap.

## Supplied behavior and unfinished fidelity

The browser maps installed app records to eligible ordinary records. Special
title, cartridge, folder-icon and toolbar pickup eligibility are not established
by these fixtures. Folder/toolbar pickup retains its authored fallback. Native
control-disable flags outside the stationary held route are not fully hosted.
Browser blur, overlays, sleep, context replacement and release/drop explicitly
clear pickup ownership; this is not a native release/drop trace.

`home-tile-pickup.ts` requires a supplied anchor. The browser currently retains
zero anchor, positioning pickup at the sampled pointer; the source trace proves
addition of supplied touch and stored offset, not how the offset is acquired.
The source trace supplies content installation rather than executing texture/UV
service work. Portfolio artwork intentionally uses `menuArtwork` at native
P_Icon bounds/alpha; native IconMask/TEV and PicToggle installation are still
unresolved. The existing browser movement, hover, edge-scroll and drop logic
continues after pickup entry. No complete native drag or Azahar pickup pixel
parity is claimed.

## Verification

The combined host/view/painter checks pass75/75 with actual offscreen Canvas
resources, and typecheck passes. The full suite passes924 tests with two existing
optional audio-diagnostic skips (926 total, zero failures); production build
passes. No shader changed. Logs are on the SSD under `reference/`:
`pickup-entry-combined-tests.log`, `pickup-entry-combined-typecheck.log`,
`pickup-entry-full-tests.log`, and `pickup-entry-build.log`.

`scripts/verify-home-pickup-entry.mjs` uses real projected pointer and keyboard
input. Its read-only observer checks press before pickup, retained candidate,
hidden primary/original controllers across held updates, submitted pickup and
blank Scale, grab identity, stationary release through the browser bridge, and
vacant hold/release without selection. It restores the saved folder afterward.
Desktop evidence is `reference/live-native-pickup-entry.json`, its log and
`-held.png`; the native-resolution held LCD was visually inspected. These checks
verify the browser connection to the bounded controller state, not a fresh
Azahar comparison. Fresh native GUI capture still requires the Mac to be unlocked.

The same projected-input scenarios also pass at390×844 mobile and with reduced
motion (`live-native-pickup-entry-mobile` and `live-native-pickup-entry-reduced`).
The reduced test checks the live painted pickup snapshot before requesting a
capture, so screenshot painting cannot conceal a missing LCD refresh. Ordinary
tap/Decide behavior passes afterward (`pickup-entry-ordinary-touch`), and a
temporarily failed native manifest keeps fallback keyboard input working
(`pickup-entry-fallback`); the route is removed and native loading restored.
Browser media emulation is restored with `set media light`—the CLI token
`reduced-motion` enables reduction regardless of a following `no-preference`.
