#!/usr/bin/env python3
"""Read-only source/capture audit; candidate offsets are diagnostics, not native semantics."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def metrics(native, candidate):
    left, right = native.tobytes(), candidate.tobytes()
    errors = [tuple(abs(left[i + c] - right[i + c]) for c in range(3))
              for i in range(0, len(left), 3)]
    return {'pixelsOver2': sum(max(pixel) > 2 for pixel in errors),
            'maxRgbError': max(max(pixel) for pixel in errors),
            'meanRgbError': sum(sum(pixel) for pixel in errors) / (len(errors) * 3)}


def audit(pack_path, font_path, native_path, browser_path):
    pack = json.loads(pack_path.read_text())
    bank = pack['messages']['P']
    message = bank['messages'][bank['labels']['Finder_Pho_00_00']]
    assert message['styleIndex'] == 110 and message['text'] == '\ue01e'
    style = pack['styles']['RI.mstl']['styles'][110]
    controls = [token for token in message['tokens'] if token.get('group') == 2]
    assert controls == [{'arguments': '0200', 'control': 14, 'group': 2, 'type': 0}] * 2
    assert style['unresolvedWords']['0'] == 176
    font = json.loads(font_path.read_text())
    assert font['sourceSha256'] == '7b115deda29adce0faccb352d412a3ef9e10247850be6ded7856ba2714d32932'
    glyph = font['glyphs'][str(0xe01e)]
    assert (glyph['left'], glyph['advance'], glyph['width'], glyph['height']) == (0, 22, 23, 24)
    native = Image.open(native_path).convert('RGB').crop((0, 0, 400, 240))
    browser = Image.open(browser_path).convert('RGB')
    assert browser.size == native.size
    region = (0, 0, 28, 24)
    # Diagnostic only: hold all other captured pixels fixed, translate the icon -2.
    shifted = browser.copy()
    shifted.paste((0, 0, 0), region)
    shifted.paste(browser.crop((2, 0, 28, 24)), (0, 0))
    sheet_path = font_path.parent / font['sheets'][glyph['sheet']]
    sheet = Image.open(sheet_path).convert('RGBA')
    icon = sheet.crop((glyph['x'], glyph['y'], glyph['x'] + glyph['width'], glyph['y'] + glyph['height']))
    source_candidate = Image.new('RGB', (28, 24))
    source_candidate.paste(icon, (3, 1), icon)
    return {
        'source': {'fontSha256': font['sourceSha256'], 'glyph': glyph,
                   'styleIndex': 110, 'style': style, 'controls': controls},
        'inputs': {name: {'path': str(path), 'sha256': digest(path)} for name, path in
                   [('pack', pack_path), ('font', font_path), ('sheet', sheet_path),
                    ('native', native_path), ('browser', browser_path)]},
        'upperBefore': metrics(native, browser),
        'outsideSymbol': metrics(native.crop((28, 0, 400, 240)), browser.crop((28, 0, 400, 240))),
        'upperWithDiagnosticSymbolShiftMinus2': metrics(native, shifted),
        'sourceGlyphAtDiagnosticOrigin3_1': metrics(native.crop(region), source_candidate),
        'limitation': 'Origin (3,1) and symbol-only -2px shift are capture diagnostics. '
                      'Style word +0=176 and group2/type0 argument2 consumption are untraced; '
                      'this report does not authorize a fitted runtime translation.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('pack', 'font', 'native', 'browser', 'output'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    assert all(path.is_absolute() for path in vars(args).values())
    report = audit(args.pack, args.font, args.native, args.browser)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key not in ('source', 'inputs')}, indent=2))
