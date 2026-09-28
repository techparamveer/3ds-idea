# Game Notes switch audio delivery audit

At `865a435`, both original switch sounds can be decoded from the supplied
archive, but the existing validated HOME audio exporter cannot deliver them.
This pass identifies their concrete sample dependencies, verifies private
candidate renders, and records the missing sound ownership contract. No audio
is published or connected to the live switch.

## Source dependencies

The [title/HUD audit](native-notes-title-hud-source-audit.md) identifies ordered
calls for `SE_CTR_CHERRY_CHANGE_SCREEN` followed by `SE_CTR_COMMON_TOGGLE`.
The exact `cherry.bcsar` SHA-256 is
`545434bf549fc1ab7328123d29a6fccce52510a8ecf6a0485bed474a4dc756a7`.
Both calls occur before the display mode advances. Different native player IDs
mean this is not a serial playlist waiting for one WAV to end.

| Property | Change screen | Toggle |
| --- | --- | --- |
| Sound ID | `0x0100000a` | `0x01000007` |
| Resource | CSEQ file 1, offset 129 | CWSD file 4, item 3 |
| Bank / item | Bank 1 | One event at 0; note 0 |
| Archive volume | 127 | 64 |
| Native player | `0x04000001` | `0x04000002` |
| Referenced sample inventory | Bank contains CWAR 3, waves 0–4 | CWAR 1, wave 2 |

The CSEQ file hash is
`6d1009b506212312b033d8263aac7614999972191c143077fe76551702a2a9ad`.
The bank inventory is a conservative inventory, not a claim that this one entry
plays all five samples; complete hashes/rates/loop flags are in the private
report. Two bank samples loop, so playing raw bank WAVs would not recreate the
short sequence's note/release behavior.

Toggle's CWSD file hash is
`f1b79bb20925a67f6b04858cd348a930571e4d136721a56b86e40b52840f3b8e`.
Its note has original key 60, volume 127, pan 64, pitch 1, and all five
attack/decay/sustain/hold/release bytes 127. The item has pan 64 and pitch 1.
The CWAV is **16,000 Hz, 1,033 decoded samples, non-looping**, hash
`d0acdc87d8c602ee6e2ac55fde303b031aea650ada44fefb67672ae9b18d8b07`.
These resource facts are proven independently of a browser sound engine.

## Private diagnostic checks

The pinned, unpatched DualRip revision
`c00e809ad4fcc44056a5b3c11d30f6a698b92be0` was given only the embedded archive,
with no neighboring external groups. At requested 32,728 Hz it produces:

| Cue | Stereo frames | Absolute peak | Loop / unapplied commands |
| --- | --- | --- | --- |
| Change screen | 5,113 | 4,940 | none / none reported |
| Toggle | 2,113 | 5,751 | none / none reported |

The hash-gated source probe was run twice with identical metadata and PCM
hashes. Both candidates have positive, non-clipped output. These are **uncertified
diagnostics**: absence of reported unapplied commands does not validate driver
gain, pan, sample onset, interpolation, release timing or native mixing.

Everything remains private under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-switch-audio/`:
`probe.py`, `source-audio-audit.json`, `checks.json`, `repeat.log`, and the
explicitly named `*-UNCERTIFIED.wav` files. No firmware executable is run.
No listening or matched native capture comparison is claimed.

## Why these candidates are not published

`render_firmware_audio.py` intentionally accepts only HOME's exact archive,
title record, cue aliases, sound options and mono bank inventory. Passing this
Notes archive to `validate_source` produces the expected rejection:
“Unsupported archive: HOME profile requires the exact validated archive hash”.
The guard was not weakened.

The existing exporter also parses every selected cue as CSEQ; Toggle is CWSD.
DualRip's separate `render_wsd` path uses a sustain-table volume sum, `/160`
amplitude conversion and linear pan factors. The current HOME profile's traced
sequence/voice/DSP corrections do not validate that wave-sound path. Reusing
that unpatched output solely because it renders successfully would reproduce
known old model assumptions without evidence that they match Notes.

The bounded next asset step is a separately versioned, hash-gated Notes profile
for these two entries, with a validated CWSD path and native PCM or equivalent
source-derived checks for their gain/onset/mix. Extending audio internals is
outside this UI-focused slice; no hardware backend reconstruction was started.

## Safe runtime integration contract

Once the two delivered cues are validated, existing audio infrastructure still
needs a narrow owner-scoped extension:

1. A switch cue pair belongs to the active Game Notes **instance**, accepted
   switch revision and drawing screen. The instance must be foreground,
   awake and not closing. Repeated taps during the source clip produce no pair.
2. Require an existing suspended application slot. The current pure Notes
   reducer can cycle an invisible mode without software while presentation shows
   Invalid. Adding unconditional effects there would make that adaptation
   audibly wrong. Do not use capture-pixel readiness as the software test:
   suspended software may exist even when its complete LCD pair is missing.
3. Check ownership when consuming effects **and after asynchronous fetch/decode**.
   HOME, applet close/relaunch, suspend/sleep and disposal invalidate pending and
   active sources. A new Notes instance cannot inherit the old instance's cue.
4. Preserve the two native dispatches as one accepted cue pair; do not wait for
   the first sound to finish. Use the current master volume/mute at playback.

Today `runtime-effects.ts` forwards a bare sound name to `onSound`;
`console-scene.ts` accepts only HOME cue keys. `audio.ts` owns a global effect
generation and checks it after decoding, but increments it on power-off/sleep,
not foreground-owner changes. Its 250 ms stale-decode cutoff is not an owner
check. Adding new names to `Sound` and emitting two effects is insufficient.

Verification for that eventual runtime change must cover delayed decode after
HOME and close/relaunch, sleep/mute/disposal, repeat-tap suppression, no-software
Invalid state, missing-capture-but-present-software, and independent current
volume. The user-visible switch remains silent until this path is complete;
no generic HOME cue is substituted for either source sound.

This audit changes no application behavior. Source audio checks, relative links
and `git diff --check` pass; no application build or browser session is needed.
Strict 1:1 audio and UI acceptance remains open.
