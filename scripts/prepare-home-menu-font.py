"""Subset the pinned NTLG conversion; see public/os/README.md for provenance.

Run with: uv run --with fonttools --with brotli python scripts/prepare-home-menu-font.py /path/to/nintendo_NTLG-DB_001.ttf
"""
import hashlib
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset

source = Path(sys.argv[1])
expected = '92f7d01e40e3d140f2f38caf1c9601dc1d5409b813599258d3ea797e875a2c80'
if hashlib.sha256(source.read_bytes()).hexdigest() != expected:
    raise SystemExit('Source differs from the pinned font. Review provenance before updating.')
font = TTFont(source)
options = subset.Options()
options.flavor = 'woff2'
options.name_IDs = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=list(range(0x20, 0x250)) + list(range(0x2000, 0x2800)) + list(range(0xe000, 0xe100)))
subsetter.subset(font)
font.flavor = 'woff2'
font.save('public/os/home-menu.woff2')
