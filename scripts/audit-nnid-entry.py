"""Inventory supplied NNID entry resources without executing firmware or networking.

This is an evidence report, not a test that missing account content is desirable.
New page/message candidates are reported for inspection rather than suppressed.
"""
import argparse
import base64
from collections import Counter
import hashlib
import json
from pathlib import Path
import re

from unpack_home_resources import decompress, unpack_darc


def digest(data):
    return hashlib.sha256(data).hexdigest()


def audit(romfs, converted):
    files = sorted(p for p in romfs.rglob('*') if p.is_file())
    archives, members = [], []
    for path in files:
        if path.suffix != '.arc':
            continue
        raw = path.read_bytes()
        decoded = raw
        for _ in range(4):
            if decoded[:1] not in (b'\x10', b'\x11'):
                break
            decoded = decompress(decoded)
        content = unpack_darc(decoded)
        relative = path.relative_to(romfs).as_posix()
        archives.append({'path': relative, 'sha256': digest(raw), 'members': len(content)})
        members.extend({'archive': relative, 'path': name, 'sha256': digest(value)}
                       for name, value in sorted(content.items()))
    pack_path = converted / 'packs/nnid-settings/messages-and-loose.json'
    pack_bytes = pack_path.read_bytes()
    pack = json.loads(pack_bytes)
    if pack['titleId'] != '000400100002c100':
        raise ValueError('Expected the supplied EUR NNID Settings title')
    bank = pack['messages']['cave']
    messages = {label: bank['messages'][index]['text'] for label, index in bank['labels'].items()}
    # Report all likely text instead of assuming one particular label spelling.
    candidates = {label: value for label, value in messages.items()
                  if re.search(r'account|network.?id|create|regist|link.?id', label + ' ' + value, re.I)}
    css_path = romfs / 'browser/UserCss.dat'
    css_bytes = css_path.read_bytes()
    prefix = b'data:text/css;charset=utf-8;base64,'
    if not css_bytes.startswith(prefix):
        raise ValueError('Unexpected UserCss format; inspect the new resource')
    css = base64.b64decode(css_bytes[len(prefix):].rstrip(b'\0\r\n '), validate=True).decode('utf-8')
    page_extensions = {'.html', '.htm', '.xhtml', '.css', '.js', '.mht', '.mhtml'}
    root_path = converted / 'packs/nnid-settings/layout-Root.json'
    root = json.loads(root_path.read_bytes())['layouts']['Root']
    wanted = {'AccountHeaderPos', 'ToolBarPos', 'MenuPos', 'DialogPos', 'DialogHeaderPos'}
    mounts = {}
    def visit(panes):
        for pane in panes:
            if pane['name'] in wanted:
                mounts[pane['name']] = {key: pane[key] for key in ['translation', 'size', 'origin']}
            visit(pane['children'])
    visit(root['roots'])
    return {
        'titleId': pack['titleId'], 'sourceContentSha256': pack['sourceSha256'],
        'romfsFiles': len(files), 'romfsExtensions': dict(Counter(p.suffix for p in files)),
        'archives': archives, 'archiveMemberCount': len(members),
        'archiveMemberExtensions': dict(Counter(Path(m['path']).suffix for m in members)),
        'pageFileCandidates': [p.relative_to(romfs).as_posix() for p in files if p.suffix.lower() in page_extensions],
        'pageArchiveCandidates': [m for m in members if Path(m['path']).suffix.lower() in page_extensions],
        'nonLayoutArchiveMembers': [m for m in members if Path(m['path']).suffix not in {'.bclyt', '.bclan', '.bclim'}],
        'englishMessageCount': len(bank['messages']), 'englishLabelCount': len(messages),
        'englishMessagePackSha256': digest(pack_bytes),
        'englishSource': pack['resourceSources']['messages']['cave'],
        'accountMessageCandidates': candidates,
        'userCss': {'sha256': digest(css_bytes), 'bytes': len(css_bytes), 'decoded': css},
        'rootMounts': mounts,
        'limits': [
            'Archive and message inventory does not establish executable initial-state composition.',
            'Shared Link ID toolbar text does not establish unsigned-in Create/Link page layout.',
            'No firmware execution, service connection, or browser/native LCD verification performed.',
        ],
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--romfs', type=Path, required=True)
    parser.add_argument('--converted-root', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    for path in [args.romfs, args.converted_root, args.report]:
        if not path.is_absolute():
            parser.error('Use absolute source and report paths')
    result = audit(args.romfs, args.converted_root)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({key: result[key] for key in [
        'titleId', 'romfsFiles', 'archiveMemberCount', 'archiveMemberExtensions',
        'englishMessageCount', 'pageFileCandidates', 'pageArchiveCandidates',
    ]}, indent=2))
