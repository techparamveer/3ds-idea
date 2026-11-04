"""Flatten the supplied OxHack SVGs into per-letter contours for Blender.

Usage: python3 extract-oxhack-logo.py ABS_COMPACT.svg ABS_WORDMARK.svg ABS_OUT.json
Standard library only. The SVGs use mix-blend-mode overlays that duplicate each
shape, so only the base shapes are read; their colour comes from the gradients
recorded in the output. Coordinates stay in each SVG's own user units.
"""
import hashlib, json, re, sys
from pathlib import Path

TOKEN = re.compile(r'[MmLlHhVvCcZz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?')

def flatten(d, curve_steps=6):
    """Return closed polylines for path data using only M L H V C Z commands."""
    tokens, i = TOKEN.findall(d), 0
    contours, points, x, y, command = [], [], 0.0, 0.0, None
    start = (0.0, 0.0)
    def number():
        nonlocal i
        value = float(tokens[i]); i += 1
        return value
    while i < len(tokens):
        if tokens[i].isalpha():
            command = tokens[i]; i += 1
            if command in 'Zz':
                if points: contours.append(points); points = []
                x, y = start
                continue
        relative = command.islower()
        kind = command.upper()
        if kind == 'M':
            nx, ny = number(), number()
            x, y = (x + nx, y + ny) if relative else (nx, ny)
            if points: contours.append(points)
            points, start = [(x, y)], (x, y)
            command = 'l' if relative else 'L'  # Later pairs are implicit line-tos.
        elif kind == 'L':
            nx, ny = number(), number()
            x, y = (x + nx, y + ny) if relative else (nx, ny)
            points.append((x, y))
        elif kind == 'H':
            value = number(); x = x + value if relative else value
            points.append((x, y))
        elif kind == 'V':
            value = number(); y = y + value if relative else value
            points.append((x, y))
        elif kind == 'C':
            c = [number() for _ in range(6)]
            if relative: c = [v + (x if k % 2 == 0 else y) for k, v in enumerate(c)]
            for step in range(1, curve_steps + 1):
                t = step / curve_steps; u = 1 - t
                points.append((u**3*x + 3*u*u*t*c[0] + 3*u*t*t*c[2] + t**3*c[4],
                               u**3*y + 3*u*u*t*c[1] + 3*u*t*t*c[3] + t**3*c[5]))
            x, y = c[4], c[5]
        else:
            raise ValueError(f'Unsupported path command {command}')
    if points: contours.append(points)
    cleaned = []
    for contour in contours:
        out = [contour[0]]
        for p in contour[1:]:
            if abs(p[0] - out[-1][0]) > 1e-3 or abs(p[1] - out[-1][1]) > 1e-3: out.append(p)
        if len(out) > 1 and abs(out[0][0] - out[-1][0]) < 1e-3 and abs(out[0][1] - out[-1][1]) < 1e-3: out.pop()
        if len(out) >= 3: cleaned.append([[round(a, 2), round(b, 2)] for a, b in out])
    return cleaned

def path_data(svg):
    data = {}
    for tag in re.findall(r'<path\b[^>]*>', svg, re.S):
        name, d = re.search(r'\bid="([^"]+)"', tag), re.search(r'\sd="([^"]+)"', tag)
        if name and d: data[name.group(1)] = d.group(1)
    return data

def contours(data, ids):
    return [c for name in ids for c in flatten(data[name])]

def box(contour):
    xs, ys = [p[0] for p in contour], [p[1] for p in contour]
    return min(xs), min(ys), max(xs), max(ys)

def by_columns(contour_list, labels, gap=0.0):
    """Group contours into glyphs by horizontal overlap, labelling left to right."""
    spans = []
    for contour in sorted(contour_list, key=lambda c: box(c)[0]):
        x0, _, x1, _ = box(contour)
        if spans and x0 <= spans[-1]['x1'] + gap:
            spans[-1]['x1'] = max(spans[-1]['x1'], x1); spans[-1]['contours'].append(contour)
        else:
            spans.append({'x1': x1, 'contours': [contour]})
    if len(spans) != len(labels):
        raise ValueError(f'Expected {len(labels)} glyph columns for {labels}, found {len(spans)}')
    return {label: span['contours'] for label, span in zip(labels, spans)}

def assign_to_faces(contour_list, faces):
    """Give each backing contour to the face glyph whose centre it is closest to."""
    centres = {k: ((min(box(c)[0] for c in v) + max(box(c)[2] for c in v)) / 2,
                   (min(box(c)[1] for c in v) + max(box(c)[3] for c in v)) / 2) for k, v in faces.items()}
    out = {k: [] for k in faces}
    for contour in contour_list:
        x0, y0, x1, y1 = box(contour)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        best = min(centres, key=lambda k: (centres[k][0] - cx) ** 2 + (centres[k][1] - cy) ** 2)
        out[best].append(contour)
    return out

def gradient(svg, name):
    tag = re.search(r'<linearGradient\b[^>]*\bid="%s"[^>]*>.*?</linearGradient>' % name, svg, re.S).group(0)
    head = tag.split('>')[0]
    value = lambda k: float(re.search(r'\b%s="([^"]+)"' % k, head).group(1))
    stops = []
    for stop in re.findall(r'<stop\b[^>]*>', tag):
        stops.append([float(re.search(r'offset="([^"]+)"', stop).group(1)),
                      re.search(r'stop-color[:=]"?(#[0-9a-fA-F]{6})', stop).group(1)])
    return {'p1': [value('x1'), value('y1')], 'p2': [value('x2'), value('y2')], 'stops': stops}

TRACES = ['path9', 'path133', 'path134', 'path135', 'path136', 'path137', 'path138', 'path139',
          'path145', 'path146', 'path147', 'path148', 'path149', 'path158-1-0']
LABEL_0X4F = ['path130']
LABEL_0X58 = ['path140']

def triangle_layers(data):
    return {'frame': contours(data, ['OutlineTriangle']), 'panel': contours(data, ['Outline2']),
            'traces': contours(data, TRACES),
            'label0x4f': contours(data, LABEL_0X4F), 'label0x58': contours(data, LABEL_0X58)}

def main(compact_path, wordmark_path, out_path):
    compact_raw, wordmark_raw = Path(compact_path).read_bytes(), Path(wordmark_path).read_bytes()
    compact, wordmark = compact_raw.decode(errors='replace'), wordmark_raw.decode(errors='replace')
    c, w = path_data(compact), path_data(wordmark)

    faces_compact = {**by_columns(contours(c, ['OX']), ['O', 'X']), 'yr': contours(c, ['path57']),
                     **by_columns(contours(c, ['HACK']), ['H', 'A', 'C', 'K'])}
    back_compact = assign_to_faces(contours(c, ['OX-', 'path53']), faces_compact)
    faces_word = by_columns(contours(w, ['path18', 'path19', 'path20', 'path21']), ['O', 'x', 'H', 'A', 'C', 'K'])
    # path78 and path14 repeat the white face; path4 and path15 are the coloured outline rings.
    outline_word = assign_to_faces(contours(w, ['path4']), faces_word)
    faces_year = by_columns(contours(w, ['26']), ['2', '6'])
    outline_year = assign_to_faces(contours(w, ['path15']), faces_year)

    result = {
        'source': {
            'compact': {'file': 'OxHack Logo (Compact, Blue Outline) (1).svg', 'sha256': hashlib.sha256(compact_raw).hexdigest()},
            'wordmark': {'file': 'OxHack Logo (Wordmark, No Glowing Year) (1).svg', 'sha256': hashlib.sha256(wordmark_raw).hexdigest()},
        },
        'compact': {
            'canvas': [4000, 4000],
            'colors': {'navy': '#002147', 'face': '#ffffff'},
            'gradients': {'shape': gradient(compact, 'linearGradient28'), 'panel': gradient(compact, 'linearGradient1'), 'text': gradient(compact, 'linearGradient26')},
            'panelOpacity': 0.6,
            'layers': {**triangle_layers(c), 'navy': contours(c, ['path91'])},
            'glyphs': {name: {'face': faces_compact[name], 'back': back_compact[name]} for name in faces_compact},
        },
        'wordmark': {
            'canvas': [3500, 2000],
            'colors': {'navy': '#002147', 'face': '#ffffff'},
            'gradients': {'shape': gradient(wordmark, 'linearGradient26'), 'panel': gradient(wordmark, 'linearGradient1'), 'text': gradient(wordmark, 'linearGradient27'), 'year': gradient(wordmark, 'linearGradient29')},
            'panelOpacity': 0.6,
            'layers': triangle_layers(w),
            'glyphs': {**{name: {'face': faces_word[name], 'back': outline_word[name]} for name in faces_word},
                       **{name: {'face': faces_year[name], 'back': outline_year[name]} for name in faces_year}},
        },
    }
    Path(out_path).write_text(json.dumps(result, separators=(',', ':')))
    for logo in ('compact', 'wordmark'):
        print(logo, {k: len(v) for k, v in result[logo]['layers'].items()},
              {k: (len(v['face']), len(v['back']), [round(a) for a in box([p for c in v['face'] for p in c])]) for k, v in result[logo]['glyphs'].items()})

if __name__ == '__main__':
    main(*sys.argv[1:4])
