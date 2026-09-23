# Persistent TypeScript HOME music implementation

The pure engine now reproduces the pinned Python v8 model **exactly** for both
music entries across 70,000 native frames per entry. Every PCM sample and all
219 selected complete states match. This establishes bounded model conformance,
not native voice-allocation or hardware DSP parity. Public delivery and browser
scheduling remain outside this commit.

## Implemented boundary

The accepted integration contract is `docs/native-home-audio-contract.md`
(originally committed as `07b1eeb`, subsequently clarified for unused programs).
`src/os/native-home-audio/index.ts` exports an asynchronous resource decoder and
synchronous `createNativeHomeMusic(resources, entry)`.

The decoder accepts an already-loaded manifest and map of resource bytes. It
copies every input buffer and the metadata before awaiting SHA-256 checks,
validates the exact profile/schema, sizes, reference graph, wave loops, seven
arithmetic table hashes, command grammar and reachable program/key/velocity
selections, then returns an opaque frozen handle. Decoded buffers stay private.
There is no network or storage access. Web Crypto is used only by decoding;
the render engine has no browser or host dependencies.

The engine's `renderFrame()` returns `{ startSample, pcm }`, with a fresh
`Int16Array(320)` representing 160 interleaved stereo sample frames at 32728 Hz.
Sample positions are contiguous. Sequence ticks run before track parameters,
voice envelope/LFO updates and DSP. The exact float32 rounding, 24-bit phase,
source history, source-loop behavior, initial dequeue, main/aux gain ramps and
integer bus truncation from v8 are retained. All 24 ordered voice slots and their
allocation values survive frames and bytecode jumps. There is no fitted loop,
splice, fade, normalization, scheduled stop or bytecode pass limit.

The accepted grammar is notes plus the 27 forms listed in
[repeat-state evidence](home_audio_REPEAT_STATE_EVIDENCE.md). There are no
reachable ties, portamento, variable/random/conditional prefixes, extended
operations, finite-loop commands or FIN. Those operations are rejected, not
approximated. Default sweep and RNG/variable state remain represented in the
copied diagnostics. `music-resume` initializes its own source entry; it is not
state restored from a main-entry pause.

## Resource export and unused bank programs

`export_home_music.py` runs only against the guarded owner archive and a clean
pinned DualRip checkout. It exports original sequence DATA, decoded mono PCM16,
original loop bounds, exact packed arithmetic tables and a complete bank tree,
with title/source/converter/profile/dependency and delivery hashes. It does not
export ARM code, whole firmware containers, credentials or neighboring assets.
Source files are interpreted as data. The renderer checkout is never changed.

Bank 1 has unused programs 0/1 referencing archive-3 waves 5/6. The agreed
boundary retains those original nodes as provenance and declares the programs
**unavailable**. Programs 5/6/11/14 are explicitly whitelisted. Only their five
waves, 0–4, are delivered. Every reachable program's full 128-key × 128-velocity
selection domain is validated. Decoding excludes unavailable programs from the
usable bank; execution rejects unavailable program and bank selections too.
No missing PCM is represented as a playable instrument.

The actual private pack contains **nine files, 192,774 bytes**, including the
expanded provenance manifest. Two independent export runs have identical file
sets and bytes. The raw sequence/PCM/table payload remains 173,919 bytes; the
manifest accounts for the remainder. All five waves are mono source PCM at
44100 Hz; the source DSP resamples them to the native 32728 Hz output timeline.
The seven tables contain exactly the checked bytes, not regenerated JavaScript
transcendentals.
The `music.json` SHA-256 is
`12e4cfec0b906379272ddeb61545720714ff7c0aa3cf6ec175bc76710bdc7310`.

## Exact conformance

`home_audio_conformance.py` independently drives the pinned Python v8 renderer
and writes full PCM plus copied state fixtures to the SSD. Each entry contains
11,200,000 stereo sample frames (about 342.2 seconds), spanning six observed
track-0 repeat jumps, the former baked seam and the later clock-only divergence.
Its PCM also equals the corresponding prefix of the preserved earlier
12-interval audit WAV, independently of the new TypeScript engine.

| Reference coverage | Main | Resume |
| --- | ---: | ---: |
| Native frames | 70,000 | 70,000 |
| Full state checkpoints | 219 | 219 |
| Frames at all 24 voices active | 7,246 | 13,313 |
| Frames containing release voices | 69,832 | 69,990 |
| PCM differences versus TypeScript | 0 | 0 |
| State differences versus TypeScript | 0 | 0 |

Checkpoints cover the first 64 frames, every 512th frame, each loop frame and
its following two frames, and the final frame. Complete copied player, track,
clock, ordered voice, envelope, sweep, LFO, source/DSP and aux state is compared
with strict deep equality. The snapshots use the audit's documented exclusions
for export-only counters and overwritten inactive payloads. They are not
selected just for a waveform seam or bounding property.

Main PCM SHA-256:
`f9eaf99f377931a4b41fbad2538e53ff936acc92ec2dece1b4d6b6dddac08033`.
Resume PCM SHA-256:
`9c080e3e002b878b801cef124b892dbb8287174cbb8ce384b169a04f50119e2a`.

The checker renders the full timeline again using varying chunk groupings
(1, 7, 128, 3 and 257 frames) and obtains the same hashes. Returned PCM buffers
are fresh. Mutating diagnostic snapshots, metadata and caller buffers—including
while decoder hashes are pending—does not change output.

Nine negative pack checks reject wrong source identity, truncated/corrupted PCM,
invalid loops, missing selected banks, misrepresented program availability,
changed table bytes, unsupported reachable commands and unavailable program
selection. The latter sequence mutations update their delivery digest, so a
hash mismatch alone cannot satisfy those rejection checks. Five asset-free
Node tests separately cover grammar/operand targets, resource handles, schema,
DSP history/negative interpolation and clock carry.

## JavaScript cost and verification limits

On Apple M2, Node 22.23.2 arm64, an uninstrumented prewarmed engine renders
8,192 frames per entry, in eight batches of 1,024. Initial full conformance runs
measured roughly **0.13–0.14 ms CPU/wall time per frame**, compared with the
native frame interval of about 4.889 ms. Exact batch measurements and engine
source hashes are in the recorded conformance report. This is a Node throughput
measurement on one host; browser scheduling, per-frame GC tails, buffering,
output-rate conversion and underruns still require integration verification.

The final source-hashed run records:

| Entry | CPU ms/frame | Wall ms/frame | Audio/wall ratio |
| --- | ---: | ---: | ---: |
| Main | 0.12732 | 0.12898 | 37.90× |
| Resume | 0.12845 | 0.13030 | 37.52× |

Verification performed:

- Independent resource exports: all nine files byte-identical.
- Complete PCM/state and chunk-group conformance: both entries pass.
- Nine invalid-pack rejection checks and five focused Node tests pass.
- `npm run typecheck` passes.
- `npm test`: 66 pass, 39 fail in model/GLB checks because this assets worktree
  contains Git LFS pointer files. No model or public assets are changed here.
- `npm run build` cannot compile in this worktree: the pre-existing
  `node_modules` symlink points outside Turbopack's filesystem root. A Webpack
  fallback reaches the unrelated WGSL import and fails because its loader is
  configured only for Turbopack. These are not reported as passing builds.

No browser/Azahar session, shader change, audio transport change or public asset
promotion is performed. Native allocator priority/stealing behavior under load,
pinned-emulator interpolation versus hardware polyphase, runtime overrides and
stereo startup assumptions remain the v8 fidelity limits. Browser integration
must preserve the generator and its own output-resampler history across chunks.

## Reproduce and private artifacts

Run from the repository with the existing Python audio environment (NumPy and
pinned renderer dependencies), using fresh SSD output directories:

```sh
PYTHONPATH=scripts python -B -m firmware.export_home_music \
  /path/to/romfs/sound/menu.bcsar /Volumes/YourSSD/music-pack \
  --renderer /path/to/pinned/DualRip --scratch /Volumes/YourSSD/audio-scratch \
  --source-record /path/to/extracted/home/source.json

PYTHONPATH=scripts python -B -m firmware.home_audio_conformance \
  /path/to/romfs/sound/menu.bcsar /Volumes/YourSSD/music-reference \
  --renderer /path/to/pinned/DualRip --scratch /Volumes/YourSSD/audio-scratch \
  --source-record /path/to/extracted/home/source.json --frames 70000

node scripts/check-native-home-audio.mjs \
  /Volumes/YourSSD/music-pack /Volumes/YourSSD/music-reference \
  /Volumes/YourSSD/music-conformance.json
node --test tests/native-home-audio.test.mjs
```

Private artifact root:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets`.
Candidate packs are `audio-music-engine-v1` and `audio-music-engine-v1-repro`.
Reference PCM/state is `audio-music-engine-reference-v1`.
`audio-research/music-engine-conformance-v1-recorded.json` records source hashes,
reference/pack identity, rejection checks and timing. Repository test and build
logs use the `audio-research/music-engine-` prefix. No generated resource or PCM
fixture is checked into Git. DualRip's MIT attribution accompanies the bounded
sequencer adaptation; Nintendo resource rights remain separate.
