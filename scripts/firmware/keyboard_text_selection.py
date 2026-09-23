"""Original TextArea02 update with explicit non-composing cursor/selection state.

Reuses the hash-pinned private constructor/resource fixture. Its resource,
font, world and controller endpoints remain explicit; this is not a native LCD.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

BASE_SHA = 'd885cf4e192c4cbe0fa68516ea6f9ef5367d0c029b838c4505746a36010652c4'


def load_fixture(reference_root):
    path = reference_root/'settings-nickname/lower-first-paint/text-pane-fixture-frozen.py'
    if hashlib.sha256(path.read_bytes()).hexdigest() != BASE_SHA:
        raise ValueError('Unexpected base TextArea02 replay fixture')
    spec = importlib.util.spec_from_file_location('frozen_text_pane', path)
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module.Run


def cases():
    for text in ['', 'Ada', 'ABCDEFGHIJ']:
        for cursor in range(len(text)+1):
            yield {'text': text, 'cursor': cursor, 'anchor': None}
            for anchor in range(len(text)+1):
                yield {'text': text, 'cursor': cursor, 'anchor': anchor}


def replay(run_class, case):
    text, cursor, anchor = case['text'], case['cursor'], case['anchor']
    r = run_class(text)
    # The frozen local-pose fixture stubbed language family as zero. Execute
    # the original query with English1, matching the corrected owner replay.
    r.hooks.pop(0x15bcfc); r.u.mem_write(0x1b7744, b'\1')
    r.call(0x187670, [r.obj, 0, 500, 0], stage='constructor')
    r.call(0x186d48, [r.obj, 0], stage='initialize')
    r.call(0x13f190, [r.model, cursor if anchor is None else anchor, 1, 1], stage='anchor')
    if anchor is not None:
        r.call(0x13f190, [r.model, cursor, 1, 0], stage='selection')
    r.w(r.para+0x10, 1)  # Explicit one-line paragraph-cache boundary.
    r.call(0x1891c0, [r.obj, 0], stage='update')

    def pane(pointer):
        return {'position': r.fs(pointer+0x28, 3), 'size': r.fs(pointer+0x48, 2),
                'visible': bool(r.u.mem_read(pointer+0xb7, 1)[0] & 1)}
    selections = []
    for pointer, record in r.panes.items():
        if record['id'].startswith('DecorArea_select.bclyt:RootPane@'):
            children = [p for p,n in r.panes.items() if n['name'] == 'P_decorArea' and r.word(p+0xc) == pointer]
            if len(children) != 1: raise ValueError('Unexpected selection decoration hierarchy')
            selections.append({'root': pane(pointer), 'picture': pane(children[0])})
    if len(selections) != 4: raise ValueError('Expected four selection decoration instances')
    cursor_panes = {n['name']: pane(p) for p,n in r.panes.items() if n['id'].startswith('DecorCursor.bclyt:')}
    return {'input': case, 'model': {'cursor': r.word(r.model+0x14), 'anchor': r.word(r.model+0x1c),
            'selection': bool(r.u.mem_read(r.model+0x20, 1)[0])}, 'cursor': cursor_panes, 'selections': selections}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference-root', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--golden', type=Path)
    args = parser.parse_args()
    if args.output.resolve().is_relative_to(Path(__file__).resolve().parents[2]):
        raise ValueError('Native replay output belongs outside the repository')
    run_class = load_fixture(args.reference_root)
    rows = [replay(run_class, case) for case in cases()]
    if args.golden:
        golden = json.loads(args.golden.read_text())
        assert golden['baseFixtureSha256'] == BASE_SHA and golden['cases'] == rows
    report = {'schema': 1, 'baseFixtureSha256': BASE_SHA,
              'fixtureSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'cases': rows}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'cases': len(rows), 'goldenCompared': bool(args.golden), 'output': str(args.output)}))
