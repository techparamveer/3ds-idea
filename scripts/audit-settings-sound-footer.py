"""Read-only original scene-table/footer evidence for Settings Sound."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from audit_settings_data_lists import CODE_SHA256, TABLE_SHA256, FOOTER_TABLE, c_string, scene_record
from unpack_home_resources import decompress, unpack_darc

parser = argparse.ArgumentParser(description=__doc__)
for key in ('romfs', 'code', 'published', 'report'):
    parser.add_argument('--' + key, type=Path, required=True)
args = parser.parse_args()
assert all(getattr(args, key).is_absolute() for key in ('romfs', 'code', 'published', 'report'))
sha = lambda b: hashlib.sha256(b).hexdigest()
code = args.code.read_bytes()
assert sha(code) == CODE_SHA256
table = (args.romfs / 'table_LZ.bin').read_bytes()
assert sha(table) == TABLE_SHA256
record = scene_record(unpack_darc(decompress(table))['sound.bin'])
assert record['sha256'] == 'd5f023a1e5554463fd4de73987e6271f195617e12fdcdadd993b996b2cd24e5b'
assert record['footer'] == 2
assert record['strings'][2:4] == ['base_2b_cancel', 'base_2b_decide']
address = struct.unpack_from('<I', code, FOOTER_TABLE + 4 * record['footer'] - 0x100000)[0]
footer = c_string(code, address)
assert footer == 'Base_D_01'
member = unpack_darc(decompress((args.romfs / 'base_LZ.bin').read_bytes()))['blyt/Base_D_01.bclyt']
base = json.loads((args.published / 'base.json').read_text())
assert sha(member) == base['resourceSources']['layouts'][footer]['sha256']
bank = json.loads((args.published / 'message_EU.json').read_text())['messages']['mset']
labels = {label: bank['messages'][bank['labels'][label]]['text'] for label in record['strings'][2:4]}
assert list(labels.values()) == ['Cancel', 'OK']
report = {'passed': True, 'codeSha256': CODE_SHA256, 'tableSha256': TABLE_SHA256,
          'scene': record, 'footer': footer, 'footerMemberSha256': sha(member), 'labels': labels,
          'limits': ['Read-only rendering; no native configuration/confirmation operation.']}
args.report.parent.mkdir(parents=True, exist_ok=True)
args.report.write_text(json.dumps(report, indent=2) + '\n')
print('PASS: original Sound scene, executable footer map, delivered layout identity and labels')
