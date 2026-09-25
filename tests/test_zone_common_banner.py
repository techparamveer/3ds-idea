"""Opt-in checks of the private Zone conversion against the public bounded fixture."""

import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'scripts/firmware-cgfx/audit_zone_common.py'
SPEC = importlib.util.spec_from_file_location('audit_zone_common', SCRIPT)
import sys
sys.path.insert(0, str(SCRIPT.parent))
AUDIT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUDIT)


@unittest.skipUnless(os.environ.get('CGFX_ZONE_PRIVATE'), 'requires private Zone conversion directory')
class ZoneCommonTests(unittest.TestCase):
    def setUp(self):
        self.folder = Path(os.environ['CGFX_ZONE_PRIVATE'])

    def test_static_fixture_and_source_identity(self):
        actual = AUDIT.inspect(self.folder / 'common.bcres', self.folder / 'converted', self.folder / 'selected')
        fixture = json.loads((ROOT / 'docs/evidence/zone-common-banner-static.json').read_text())
        self.assertEqual(actual, fixture)

    def test_hash_gate_rejects_other_cgfx(self):
        with self.assertRaisesRegex(ValueError, 'common CGFX'):
            AUDIT.inspect(self.folder / 'selected-scratch/input.bcres', self.folder / 'converted', self.folder / 'selected')

    @unittest.skipUnless(os.environ.get('CGFX_ZONE_DOTNET') and os.environ.get('CGFX_ZONE_EXPORTER'),
                         'requires built pinned exporter')
    def test_exporter_fails_closed_and_static_mode_is_labelled(self):
        command = [os.environ['CGFX_ZONE_DOTNET'], os.environ['CGFX_ZONE_EXPORTER']]
        with tempfile.TemporaryDirectory(dir=self.folder) as directory:
            output = Path(directory)
            normal = subprocess.run([*command, str(self.folder / 'common.bcres'), str(output)], capture_output=True, text=True)
            self.assertNotEqual(normal.returncode, 0)
            self.assertIn('ReadHermite128', normal.stderr)
            static = subprocess.run([*command, str(self.folder / 'common.bcres'), str(output), '--zone-static'], capture_output=True, text=True)
            self.assertEqual(static.returncode, 0, static.stderr)
            record = json.loads((output / 'model.json').read_text())
            self.assertEqual(record['animationStatus'], 'omitted: unsupported Zone common CGFX curve')
            self.assertEqual(len(record['models'][0]['meshes']), 4)
            rejected = subprocess.run([*command, str(self.folder / 'selected-scratch/input.bcres'), str(output), '--zone-static'], capture_output=True, text=True)
            self.assertNotEqual(rejected.returncode, 0)
            self.assertIn('limited to the verified Nintendo Zone common CGFX', rejected.stderr)


if __name__ == '__main__':
    unittest.main()
