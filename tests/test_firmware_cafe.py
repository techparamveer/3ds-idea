"""Bounded amiibo 7.2 readers; optional owner-supplied real archive regressions."""
import hashlib
import os
from pathlib import Path
import struct
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
from firmware.cafe import decode_bflim, decode_flyt, decode_flan
from firmware.build import unpack_archive, decompress
from firmware.stock_ui import supported, validate_part_links


def section(tag, body):
    return tag.encode()+struct.pack('<I', 8+len(body))+body


def file(magic, chunks):
    payload = b''.join(chunks)
    return struct.pack('<4sHHIIHH', magic, 0xfeff, 20, 0x07020000, 20+len(payload), len(chunks), 0)+payload


def pane(name='RootPane', origin=0):
    return struct.pack('<4B24s8s10f', 3, origin, 255, 2, name.encode(), b'user', 1, 2, 3, 0, 0, 0, 1, 1, 320, 240)


def layout(chunks):
    return file(b'FLYT', [section('lyt1', struct.pack('<I4f', 1, 320, 240, 0, 0)+b'test\0\0\0\0'), *chunks])


def flim(swizzle):
    # Independent Morton encoder for a non-square, non-power-of-two L8 image.
    w, h = 5, 11
    rw, rh = (h, w) if swizzle else (w, h)
    sw, sh = 1 << max(3, (rw-1).bit_length()), 1 << max(3, (rh-1).bit_length())
    pixels = bytearray(sw*sh)
    for y in range(sh):
        for x in range(sw):
            address = (y//8*sw//8+x//8)*64
            for bit in range(3):
                address |= ((x>>bit)&1) << (2*bit)
                address |= ((y>>bit)&1) << (2*bit+1)
            pixels[address] = (y*17+x*3) % 256
    return bytes(pixels)+struct.pack('<4sHHIIHH4sIHHHBBI', b'FLIM', 0xfeff, 20,
        0x07020000, len(pixels)+40, 1, 0, b'imag', 16, w, h, 128, 0, swizzle, len(pixels))


class CafeTests(unittest.TestCase):
    def test_texture_orientation_before_crop(self):
        for swizzle in (0, 4, 8):
            meta, rgba = decode_bflim(flim(swizzle))
            self.assertEqual((meta['width'], meta['height']), (5, 11))
            for y in range(11):
                for x in range(5):
                    sx, sy = (x, y) if not swizzle else (10-y, x) if swizzle == 4 else (y, x)
                    value = (sy*17+sx*3) % 256
                    self.assertEqual(rgba[(y*5+x)*4:(y*5+x+1)*4], bytes([value]*3+[255]))

    def test_texture_rejects_unverified_headers_extents_and_orientation(self):
        for offset, value in [(-32, b'\x01\x00\x02\x07'), (-5, b'\x02'), (-12, b'\xff\xff'), (-8, b'\x40\x00')]:
            raw = bytearray(flim(4)); raw[offset:offset+len(value) if offset+len(value) else None] = value
            with self.assertRaises(ValueError): decode_bflim(bytes(raw))
        with self.assertRaises(ValueError): decode_bflim(flim(4)[:-1])

    def test_pane_name_userdata_origins_and_hierarchy(self):
        raw = layout([section('pan1', pane('parent')), section('pas1', b''),
                      section('pan1', pane('abcdefghijklmnopqrstuvwx', 5)), section('pae1', b'')])
        parsed = decode_flyt(raw); root = parsed['roots'][0]; child = root['children'][0]
        self.assertEqual(root['origin'], 4)
        self.assertEqual(child['origin'], 0)
        self.assertEqual(child['name'], 'abcdefghijklmnopqrstuvwx')
        self.assertEqual(child['userData'], b'user\0\0\0\0'.hex())
        self.assertEqual(child['translation'], [1, 2, 3])
        with self.assertRaises(ValueError): decode_flyt(layout([section('pas1', b'')]))
        with self.assertRaises(ValueError): decode_flyt(layout([section('pan1', pane()), section('pas1', b'')]))

    def test_strict_version_and_material_bounds(self):
        data = bytearray(layout([section('pan1', pane())])); data[8] = 1
        with self.assertRaises(ValueError): decode_flyt(bytes(data))
        data[8] = 0; data[:4] = b'CLYT'
        with self.assertRaises(ValueError): decode_flyt(bytes(data))
        with self.assertRaises(ValueError): decode_flyt(layout([section('mat1', struct.pack('<II', 1, 8))]))

    def test_part_link_is_retained_and_cannot_be_published_as_complete(self):
        parsed = decode_flyt(layout([section('prt1', pane()+struct.pack('<I2f', 0, 1, 1)+b'PortalBtn\0')]))
        self.assertEqual(parsed['roots'][0]['part']['layout'], 'PortalBtn')
        with self.assertRaisesRegex(ValueError, 'unsupported'): supported(parsed)

    def test_selected_part_dependencies_must_resolve_before_publication(self):
        leaf = {'sourceFormat': 'FLYT', 'roots': []}
        parent = {'sourceFormat': 'FLYT', 'roots': [{'part': {'layout': 'Button'}, 'children': []}]}
        validate_part_links([('Portal', parent), ('Button', leaf)])
        for layouts in [[('Portal', parent)], [('Portal', parent), ('Button', leaf), ('Button', leaf)],
                        [('Button', parent)]]:
            with self.assertRaises(ValueError): validate_part_links(layouts)

    def test_multi_texture_material_is_not_silently_approximated(self):
        material = struct.pack('<28s4B4BI', b'header', 0, 0, 0, 0, 255, 255, 255, 255, 0x40)+b'\x01\x00\0\0'
        parsed = decode_flyt(layout([section('mat1', struct.pack('<II', 1, 16)+material)]))
        self.assertEqual(parsed['materials'][0]['sourceCombiners'][0]['color'], 1)
        with self.assertRaisesRegex(ValueError, 'unsupported'): supported(parsed)

    def test_animation_group_stride_and_unknown_material_channel(self):
        # Two 36-byte group names and one material channel beyond black/white.
        pat = struct.pack('<HHIIhhB3x', 0, 2, 28, 32, 0, 10, 1)+b'In\0\0'+struct.pack('<36s36s', b'first', b'second')
        key = struct.pack('<BBHHHI3f', 0, 8, 2, 1, 0, 12, 0, 1, 0)
        tag = b'FLMC'+struct.pack('<II', 1, 12)+key
        target = struct.pack('<28sBBHI', b'mat', 1, 1, 0, 36)+tag
        pai = struct.pack('<HBBHHII', 10, 0, 0, 0, 1, 20, 24)+target
        parsed = decode_flan(file(b'FLAN', [section('pat1', pat), section('pai1', pai)]))
        self.assertEqual(parsed['groups'], ['first', 'second'])
        self.assertEqual(parsed['tracks'][0]['property'], 'unsupported')
        with self.assertRaisesRegex(ValueError, 'unsupported'): supported(parsed)


@unittest.skipUnless(os.environ.get('FIRMWARE_AMIIBO_ROMFS'), 'Owner-supplied amiibo RomFS not configured')
class AmiiboResourceTests(unittest.TestCase):
    def members(self, path):
        return unpack_archive(decompress((Path(os.environ['FIRMWARE_AMIIBO_ROMFS'])/'layout'/path).read_bytes()))

    def test_original_portal_parts_and_inline_labels(self):
        members = self.members('Body/Portal/PortalSceneCTR.arc.cmp')
        raw = members['blyt/PortalSceneCTR.bflyt']
        self.assertEqual(hashlib.sha256(raw).hexdigest(), '9d59ce932079029d0e32a69678b57d0196983be68ff0e24a29f3acf70daad4f3')
        parsed = decode_flyt(raw)
        def walk(panes):
            for pane in panes:
                yield pane
                yield from walk(pane['children'])
        parts = [p for p in walk(parsed['roots']) if p['kind'] == 'prt1']
        self.assertEqual([p['name'] for p in parts], ['L_EditBtn', 'L_DeleteBtn', 'L_InitializeBtn', 'L_UpdateBtn', 'L_StopBtn'])
        self.assertEqual([p['part']['layout'] for p in parts], ['PortalBtn']*3+['PortalBtnSub', 'BtnBtm_03'])
        self.assertEqual([p['translation'][1] for p in parts], [87, 35, -17, -65, 0])
        calls = [e['property']['text']['callName'] for p in parts for e in p['part']['entries'] if 'text' in e.get('property', {})]
        self.assertEqual(calls, ['BtnSetNicknameOwner', 'BtnEraseGameData', 'BtnInitializeAmiibo', 'BtnUpdateFangate', 'Finish', 'Finish'])
        supported(parsed)
        self.assertEqual(parts[0]['part']['capability'], 'amiibo-portal-v1')
        entry = parts[0]['part']['entries'][0]
        self.assertEqual(entry['basicUsageFlags'], 0x10)
        self.assertEqual(entry['basicInfo']['size'], [290.0, 54.0])

    def test_selected_buttons_and_source_animation_channels(self):
        members = self.members('Parts/Portal/PortalBtn.arc.cmp')
        parsed = decode_flyt(members['blyt/PortalBtn.bflyt']); supported(parsed)
        self.assertEqual(parsed['fonts'], ['cbf_std.bffnt'])
        clip = decode_flan(members['anim/PortalBtn_Select.bflan']); supported(clip)
        self.assertEqual((clip['frames'], len(clip['tracks']), clip['groups']), (1, 45, ['G_Btn_00']))
        self.assertTrue(any(t['property'] == 'materialColor.1.0' for t in clip['tracks']))

    def test_header_projection_dependencies_remain_explicit(self):
        for archive, name in [('Body/Common/Header/Header.arc.cmp', 'Header'), ('Parts/Portal/PortalBtnSub.arc.cmp', 'PortalBtnSub')]:
            parsed = decode_flyt(self.members(archive)['blyt/'+name+'.bflyt'])
            with self.assertRaises(ValueError): supported(parsed)
            self.assertTrue(any(m.get('sourceCombiners') for m in parsed['materials']))

    def test_rectangular_source_texture_identity_and_orientation(self):
        raw = self.members('Body/Common/Header/Header.arc.cmp')['timg/HeaderBg.bflim']
        self.assertEqual(hashlib.sha256(raw).hexdigest(), '3d9dbe5b971df0ee74441e72772c991bc666df6510335fbcb3e7be20477c89ef')
        metadata, rgba = decode_bflim(raw)
        self.assertEqual((metadata['width'], metadata['height'], metadata['storageSize']), (46, 26, [32, 64]))
        self.assertEqual(hashlib.sha256(rgba).hexdigest(), '4acc3f6bf2a23317f19addb2505375ca8c0f7a311b6d0f5144daf42dbe7f7cb0')

    def test_all_layout_archive_structures(self):
        counts = [0, 0, 0]
        root = Path(os.environ['FIRMWARE_AMIIBO_ROMFS'])/'layout'
        for archive in sorted(root.rglob('*.arc.cmp')):
            for raw in unpack_archive(decompress(archive.read_bytes())).values():
                if raw[:4] == b'FLYT': decode_flyt(raw); counts[0] += 1
                elif raw[:4] == b'FLAN': decode_flan(raw); counts[1] += 1
                elif raw[-40:-36] == b'FLIM': decode_bflim(raw); counts[2] += 1
        self.assertEqual(counts, [76, 159, 159])


if __name__ == '__main__': unittest.main()
