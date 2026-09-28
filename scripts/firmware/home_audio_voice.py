"""EUR HOME v24576 voice arithmetic, transcribed from the identified ARM routines.

The tables below reproduce every native byte; they are not fitted to a capture.
See home_audio_VOICE_EVIDENCE.md for addresses, state order and scope limits.
"""
from .home_audio_math import f32, clamp


_ATTACK = (0, 1, 5, 14, 26, 38, 51, 63, 73, 84, 92, 100, 109, 116, 123, 127, 132, 137, 143)
ATTACK_LUT = tuple(f32(round(((_ATTACK[127 - raw] if raw >= 109 else 255 - raw) / 256) ** .2, 7))
                   for raw in range(128))
PITCH_SEMITONE = tuple(f32(2 ** (i / 12)) for i in range(12))
PITCH_FRACTION = tuple(f32(2 ** (i / 3072)) for i in range(256))
GAIN_LUT = (0.0,) + tuple(f32(round(10 ** ((i - 904) / 200), 10 if i <= 104 else 9))
                         for i in range(1, 965))
SUSTAIN_LUT = (
    -723, -722, -721, -651, -601, -562, -530, -503,
    -480, -460, -442, -425, -410, -396, -383, -371,
    -360, -349, -339, -330, -321, -313, -305, -297,
    -289, -282, -276, -269, -263, -257, -251, -245,
    -239, -234, -229, -224, -219, -214, -210, -205,
    -201, -196, -192, -188, -184, -180, -176, -173,
    -169, -165, -162, -158, -155, -152, -149, -145,
    -142, -139, -136, -133, -130, -127, -125, -122,
    -119, -116, -114, -111, -109, -106, -103, -101,
    -99, -96, -94, -91, -89, -87, -85, -82,
    -80, -78, -76, -74, -72, -70, -68, -66,
    -64, -62, -60, -58, -56, -54, -52, -50,
    -49, -47, -45, -43, -42, -40, -38, -36,
    -35, -33, -31, -30, -28, -27, -25, -23,
    -22, -20, -19, -17, -16, -14, -13, -11,
    -10, -8, -7, -6, -4, -3, -1, 0,
)
SINE_LUT = (0, 6, 12, 19, 25, 31, 37, 43, 49, 54, 60, 65, 71, 76, 81, 85,
            90, 94, 98, 102, 106, 109, 112, 115, 117, 120, 122, 123, 125,
            126, 126, 127, 127)
DB_FLOOR = f32(-90.4)
_TENTH = f32(.1)
_FIFTH = f32(.2)
_CUBIC_SCALE = f32(1 / 127 ** 3)


def fall_rate(raw):
    if not 0 <= raw <= 127:
        raise ValueError('Native envelope parameter outside 0..127')
    if raw == 127:
        return 65535.0
    if raw == 126:
        return 24.0
    if raw < 50:
        return f32(f32((2 * raw + 1) * f32(1 / 128)) * _FIFTH)
    return f32(f32(60.0 / f32(126 - raw)) * _FIFTH)


def decibel_gain(db):
    return GAIN_LUT[int(f32(clamp(db, DB_FLOOR, 6.0) * 10)) + 904]


def note_gain(velocity, region_volume):
    return f32(f32(velocity * velocity * region_volume) * _CUBIC_SCALE)


def track_gain(volume, expression, main_volume, player_gain):
    value = f32(f32(volume * expression * main_volume) * _CUBIC_SCALE)
    return f32(player_gain * f32(value * value))


def pitch_bend(raw, bend_range):
    return f32(f32(raw * f32(1 / 128)) * f32(bend_range))


def pitch_ratio(semitones):
    units = int(f32(semitones * 256))
    octave, remainder = divmod(units, 3072)
    return f32(f32(f32(2.0 ** octave) * PITCH_SEMITONE[remainder >> 8]) *
               PITCH_FRACTION[remainder & 255])


class NativeEnvelope:
    ATTACK, HOLD, DECAY, SUSTAIN, RELEASE = range(5)
    __slots__ = ('state', 'level', 'attack', 'hold', 'remaining', 'decay', 'sustain', 'release')

    def __init__(self, attack, hold, decay, sustain, release):
        if any(not 0 <= raw <= 127 for raw in (attack, hold, decay, sustain, release)):
            raise ValueError('Native envelope parameter outside 0..127')
        self.attack = ATTACK_LUT[attack]
        self.hold = (hold + 1) ** 2 // 4
        self.decay = fall_rate(decay)
        self.sustain = SUSTAIN_LUT[sustain]
        self.release = fall_rate(release)
        self.state = self.ATTACK
        self.level = f32(DB_FLOOR * 10)
        self.remaining = 0

    def db(self):
        if self.state == self.ATTACK and self.attack == 0:
            return 0.0
        return f32(self.level * _TENTH)

    def expired(self):
        # Tested before update; a crossing frame is retained at zero table gain.
        return self.state == self.RELEASE and self.db() < DB_FLOOR

    def update(self, increment=5):
        if self.state == self.ATTACK:
            for _ in range(increment):
                self.level = f32(self.level * self.attack)
                if self.level > -0.03125:
                    self.level = 0.0
                    self.state = self.HOLD
                    self.remaining = self.hold
                    return  # Attack does not carry unused units into hold.
        elif self.state == self.HOLD:
            if self.remaining > increment:
                self.remaining -= increment
                return
            increment -= self.remaining
            self.remaining = 0
            self.state = self.DECAY
            self._decay(increment)
        elif self.state == self.DECAY:
            self._decay(increment)
        elif self.state == self.RELEASE:
            self.level = f32(self.level - f32(self.release * f32(increment)))

    def _decay(self, increment):
        self.level = f32(self.level - f32(self.decay * f32(increment)))
        if self.level < self.sustain:
            self.level = float(self.sustain)
            self.state = self.SUSTAIN


class NativeSweep:
    __slots__ = ('pitch', 'duration', 'counter', 'timed')

    def __init__(self, explicit, enabled, previous_key, key, time, gate):
        self.pitch = f32(explicit)
        if enabled:
            self.pitch = f32(self.pitch + f32(previous_key - key))
        self.counter = 0
        self.timed = time != 0
        self.duration = 5 * (int(f32(abs(self.pitch) * f32(time * time))) >> 5) if time else gate

    def value(self):
        if not self.pitch or self.duration <= self.counter:
            return 0.0
        return f32(f32(f32(self.duration - self.counter) * self.pitch) / f32(self.duration))

    def advance(self, *, sequence_tick=False):
        if sequence_tick != self.timed:
            self.counter = min(self.duration, self.counter + (1 if sequence_tick else 5))


class NativeLfo:
    """Native phase advances even at depth zero; pitch/pan read before update."""
    __slots__ = ('phase', 'elapsed', 'depth', 'speed', 'delay', 'range')

    def __init__(self):
        self.phase = 0.0
        self.elapsed = 0
        self.depth = 0.0
        self.speed = 6.25
        self.delay = 0
        self.range = 1

    def parameters(self, depth, speed, delay, range_):
        self.depth = f32(depth / 128)
        self.speed = f32(speed * .390625)
        self.delay = delay * 5
        self.range = range_

    def update(self, increment=5):
        if self.elapsed < self.delay:
            if self.elapsed + increment <= self.delay:
                self.elapsed += increment
                return
            increment -= self.delay - self.elapsed
            self.elapsed = self.delay
        phase = f32(self.phase + f32(self.speed * f32(f32(increment) * f32(.001))))
        self.phase = f32(phase - f32(int(phase)))

    def value(self):
        if not self.depth or self.elapsed < self.delay:
            return 0.0
        index = int(f32(self.phase * 128))
        if index < 32:
            sine = SINE_LUT[index]
        elif index < 64:
            sine = SINE_LUT[64 - index]
        elif index < 96:
            sine = -SINE_LUT[index - 64]
        else:
            sine = -SINE_LUT[128 - index]
        return f32(f32(self.range) * f32(self.depth * f32(sine * f32(1 / 127))))
