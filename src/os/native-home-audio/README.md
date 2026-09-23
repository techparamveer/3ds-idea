# Pure HOME music engine

This implements the pinned v8 HOME music model for `music` and `music-resume`.
It is not a general CSEQ player. Native allocation under pressure and hardware
DSP parity remain unverified; see
[implementation evidence](../../../scripts/firmware/home_audio_ENGINE_EVIDENCE.md).

The public entry point is `index.ts`:

```ts
const resources = await decodeNativeHomeMusicResources(manifest, resourceBytes);
const music = createNativeHomeMusic(resources, 'music');
const { startSample, pcm } = music.renderFrame();
```

`resourceBytes` is a `ReadonlyMap<string, Uint8Array>` containing exactly the
files listed in `music.json`. The caller owns loading and cancellation. Decoding
performs no I/O: it snapshots inputs synchronously, checks SHA-256 through Web
Crypto, validates the bounded resource graph, and owns the decoded copies behind
an opaque frozen handle. Do not import internal buffer accessors. Callers cannot
mutate resources through the public interface or by changing their input buffers.

Each synchronous `renderFrame()` returns a fresh `Int16Array(320)`: 160 stereo
sample frames at 32728 Hz. `startSample` begins at zero and increases by 160.
Keep the same engine for continuous playback, including all bytecode jumps and
transport chunks. `music-resume` creates a distinct entry, not a paused-main
snapshot. Scheduling, sample-rate conversion, lifecycle and short cues belong
to `audio.ts` and are not implemented here.

`snapshot()` returns a copied diagnostic state after the most recently rendered
frame. It allocates and serializes state; do not call it on a playback hot path.
The engine itself performs no fetching, DOM, Web Audio, worker, host-clock or
storage operations. Unsupported commands and unavailable programs throw.
Programs 0/1 remain in the source bank provenance but cannot be selected. Only
programs 5/6/11/14 and the five delivered waves are usable.

The bounded sequencer/bank-selection adaptation derives from DualRip
`c00e809ad4fcc44056a5b3c11d30f6a698b92be0`; its MIT notice is in `LICENSE.txt`.
The arithmetic and pinned-capture DSP model follow the separately documented
v8 helpers. Nintendo's source-resource rights are separate from that licence.
