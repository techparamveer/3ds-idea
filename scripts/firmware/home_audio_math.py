"""Narrow HOME mono/stereo pan and send arithmetic; see AUDIO_EVIDENCE.md.

This is not a complete CTR mixer. Native interpolation, envelopes, modulation,
DSP quantization and runtime gains are outside this correction.
"""
import math
import struct


def f32(value):
    return struct.unpack('<f', struct.pack('<f', value))[0]


def clamp(value, low, high):
    return max(low, min(high, value))


PAN_SCALE = f32(1 / 63)
SEND_SCALE = f32(1 / 127)
# All native entries equal rounded sqrt except index 2, one float32 ULP above.
_lut = [f32(math.sqrt(1 - i / 256)) for i in range(257)]
_lut[2] = 0.9960861206054688
PAN_LUT = tuple(_lut)
del _lut


def capture_pan(region_raw, initial_raw):
    # Do not clamp: live pan can bring this sum back into range.
    return f32((region_raw - 64 + initial_raw - 64) * PAN_SCALE)


def live_pan(signed_raw):
    return clamp(f32(signed_raw * PAN_SCALE), -1, 1)


def pan_gains(captured, live, modulation=0):
    pan = clamp(f32(f32(captured + live) + modulation), -1, 1)
    # Native float32 add/multiply, positive truncation after +0.5.
    left = int(f32(f32(f32(pan + 1) * 128) + 0.5))
    right = int(f32(f32(f32(1 - pan) * 128) + 0.5))
    return PAN_LUT[left], PAN_LUT[right]


def send_gain(raw, offset=0):
    return clamp(f32(f32(raw * SEND_SCALE) + offset), 0, 1)


def stereo_span(raw, output_mode=1):
    if output_mode != 1:
        raise ValueError('HOME audio profile only supports explicit stereo mode 1')
    # Retain normalized state for diagnosis. Native stereo uses fixed 0/2
    # front/rear values and does not use this voice value to change L/R gains.
    return clamp(f32(raw * PAN_SCALE), 0, 2)


def amplitude_gain(table_units, region_raw=127):
    # Native envelope units are 0.1 dB; region volume is independent and linear.
    # Other driver state/floors are still the pinned renderer's approximation.
    region = clamp(f32(region_raw * SEND_SCALE), 0, 1)
    return math.pow(10.0, table_units / 200.0) * region
