"""Select and decompress a 3DS CBMD HOME banner model without executing firmware."""

import hashlib
import struct
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from unpack_home_resources import decompress

LANGUAGES = (
    'eur-en', 'eur-fr', 'eur-de', 'eur-it', 'eur-es', 'eur-nl', 'eur-pt',
    'eur-ru', 'jpn-ja', 'usa-en', 'usa-fr', 'usa-es', 'usa-pt',
)
MAX_CGFX = 0x80000


def extract_cbmd(data: bytes, language: str = 'eur-en') -> tuple[bytes, dict]:
    """Return the selected clear CGFX and its source offsets and hashes.

    CBMD's region entries override the common CGFX when nonzero. The audio
    offset bounds the model area; no BCWAV data is copied into the result.
    """
    if language not in LANGUAGES:
        raise ValueError('Unsupported CBMD language')
    if len(data) < 0x88 or data[:4] != b'CBMD' or data[4:8] != b'\0' * 4:
        raise ValueError('Expected CBMD header')
    offsets = struct.unpack_from('<14I', data, 8)
    audio = struct.unpack_from('<I', data, 0x84)[0]
    if audio and (audio < 0x88 or audio >= len(data)):
        raise ValueError('Invalid CBMD audio offset')
    end_of_models = audio or len(data)
    for offset in offsets:
        if offset and (offset < 0x88 or offset >= end_of_models):
            raise ValueError('Invalid CBMD model offset')
    selected = offsets[1 + LANGUAGES.index(language)] or offsets[0]
    if not selected:
        raise ValueError('CBMD has no model for the selected language')
    end = min((offset for offset in offsets if offset > selected), default=end_of_models)
    compressed = data[selected:end]
    if not compressed or compressed[0] != 0x11:
        raise ValueError('Expected LZ11 CBMD model')
    decoded = decompress(compressed, limit=MAX_CGFX)
    if decoded[:4] != b'CGFX':
        raise ValueError('CBMD model did not decode to CGFX')
    return decoded, {
        'language': language,
        'modelOffset': selected,
        'modelEnd': end,
        'usedCommon': selected == offsets[0],
        'cbmdSha256': hashlib.sha256(data).hexdigest(),
        'compressedModelSha256': hashlib.sha256(compressed).hexdigest(),
        'cgfxSha256': hashlib.sha256(decoded).hexdigest(),
    }
