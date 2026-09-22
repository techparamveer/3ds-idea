"""Bounded mono DSP path for the pinned Azahar HOME capture, independently expressed.

This models the identified emulator's interpolation/history, initial dequeue and
float32 source-gain ramps. It is not a hardware DSP transcription. See
home_audio_DSP_EVIDENCE.md for source identities and the emulator's own caveats.
"""
import numpy as np

FRAME_SAMPLES = 160
FRACTION_BITS = 24
SCALE = 1 << FRACTION_BITS
MASK = SCALE - 1
_FRAME_INDEX = np.arange(FRAME_SAMPLES, dtype=np.int64)
_RAMP = np.arange(FRAME_SAMPLES, dtype=np.float32) * np.float32(1 / 159)


class CaptureDsp:
    """One fixed mono source, with history preserved across rate and loop changes."""
    __slots__ = ('samples', 'loop', 'loop_start', 'cursor', 'fraction', 'history',
                 'loaded', 'enabled', 'gains')

    def __init__(self, samples, loop, loop_start):
        self.samples = np.asarray(samples, dtype=np.int64)
        if not len(self.samples) or self.samples.ndim != 1:
            raise ValueError('HOME DSP requires a nonempty mono source')
        if np.any(self.samples < -32768) or np.any(self.samples > 32767):
            raise ValueError('HOME DSP requires decoded PCM16 samples')
        if loop and not 0 <= loop_start < len(self.samples):
            raise ValueError('Invalid HOME source loop')
        self.loop = loop
        self.loop_start = loop_start
        self.cursor = 0
        self.fraction = 0
        self.history = np.zeros(2, dtype=np.int64)
        self.loaded = False
        self.enabled = True
        self.gains = np.zeros((3, 2), dtype=np.float32)

    def frame(self, rate):
        """Generate one PCM16 source frame; initial dequeue consumes no PCM."""
        rate = np.float32(rate)
        if not np.isfinite(rate) or rate <= 0:
            raise ValueError('Invalid HOME DSP source rate')
        pcm = np.zeros(FRAME_SAMPLES, dtype=np.int64)
        if not self.loaded:
            self.loaded = True
            return pcm
        if self.cursor == len(self.samples):
            if not self.loop:
                self.enabled = False
                return pcm
            self.cursor = self.loop_start
        step = int(np.float32(rate * SCALE))
        if step == 0 or step > (1 << 40):
            raise ValueError('Unsupported HOME DSP rate range')
        written = 0
        while written < FRAME_SAMPLES:
            available = len(self.samples) - self.cursor
            positions = self.fraction + _FRAME_INDEX[:FRAME_SAMPLES - written] * step
            indices = positions >> FRACTION_BITS
            count = int(np.searchsorted(indices, available))
            used = indices[:count]
            # Avoid copying an entire source buffer for a 160-sample frame.
            def fetch(index):
                return np.where(index < 2, self.history[np.minimum(index, 1)],
                                self.samples[np.maximum(index - 2, 0) + self.cursor])
            if count:
                first = fetch(used)
                delta = np.clip(fetch(used + 1) - first, -32768, 32767)
                value = first + (((positions[:count] & MASK) * delta) // SCALE)
                # C++ u64*s64/division then s16 conversion has these low bits,
                # including floor for negative products. Verified by C++ oracle.
                pcm[written:written + count] = ((value + 32768) % 65536) - 32768
            consumed = available if count < len(positions) else int(used[-1])
            self.history = np.array([fetch(consumed), fetch(consumed + 1)], dtype=np.int64)
            self.fraction += count * step - consumed * SCALE
            self.cursor += consumed
            written += count
            if self.cursor == len(self.samples):
                if not self.loop:
                    break
                self.cursor = self.loop_start
        return pcm

    def mix(self, rate, gains):
        """Float32 endpoint ramps, then per-source/per-bus integer truncation."""
        target = np.asarray(gains, dtype=np.float32)
        if target.shape != (3, 2) or not np.all(np.isfinite(target)):
            raise ValueError('HOME DSP needs finite main/aux-A/aux-B stereo gains')
        pcm = self.frame(rate)
        if self.enabled:
            ramps = self.gains[:, None, :] + (target - self.gains)[:, None, :] * _RAMP[None, :, None]
            mixed = np.trunc(ramps * pcm.astype(np.float32)[None, :, None]).astype(np.int64)
        else:
            mixed = np.zeros((3, FRAME_SAMPLES, 2), dtype=np.int64)
        self.gains = target.copy()
        return mixed
