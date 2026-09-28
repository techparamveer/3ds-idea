"""Native HOME sequence tick scheduling; see home_audio_CLOCK_EVIDENCE.md."""
from .home_audio_math import f32

NATIVE_RATE = 32728
FRAME_SAMPLES = 160
FRAME_HZ = NATIVE_RATE / FRAME_SAMPLES
ARM11_HZ = 268111856.0
FRAME_BUDGET = 0x4E200000  # 160 * 8192 ARM11 cycles, scaled by 1000.
TICKS_PER_MS = f32(1 / 60000)
INVERSE_ARM11_HZ = f32(1 / ARM11_HZ)


class NativeSequenceClock:
    def __init__(self):
        self.remaining_fraction = 0.0

    @staticmethod
    def rate(parameters, initial):
        tempo, timebase, ratio = parameters()
        value = f32(tempo * timebase)
        # Preserve the two multiply orders in 0x1aa1a4 and 0x1aa2ac.
        return f32(f32(value * ratio) * TICKS_PER_MS) if initial else f32(f32(value * TICKS_PER_MS) * ratio)

    def advance(self, parameters, tick):
        rate = self.rate(parameters, initial=True)
        if rate == 0:
            return 0
        cost = int(f32(f32(self.remaining_fraction * ARM11_HZ) / rate))
        budget = FRAME_BUDGET
        ticks = 0
        if cost < budget:
            while True:
                budget -= cost
                tick()
                ticks += 1
                rate = self.rate(parameters, initial=False)
                if rate == 0:
                    return ticks
                cost = int(f32(ARM11_HZ / rate))
                if cost >= budget:
                    break
        self.remaining_fraction = f32(f32(f32(cost - budget) * rate) * INVERSE_ARM11_HZ)
        return ticks
