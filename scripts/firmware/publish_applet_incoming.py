"""Publish only pinned Friends/Notifications title-owned incoming covers."""
import argparse
import copy
import json
from pathlib import Path
import struct
import tempfile

from build import Builder, converter_provenance, decode_layers, digest, encode, public_path
from stock_ui import select_pack, supported
from unpack_home_resources import unpack_darc

SPECS = {
    'friends': {
        'titleId': '0004003000009f02', 'version': 6144, 'contentId': '00000017',
        'ciaHash': '9bb38762d1dc6c3ece8d22de1c0590787f3227f14f7cad866d59255ff78a396b',
        'contentHash': 'cd0708d08b31ea67d008fbe42869fd55bab765ec7b69e786abbc619f8dff610a',
        'codeHash': 'a5d86ac04922f63feb0c3cfcc8390867f358ba8b3a3970acb211be7b8d9f923e',
        'archive': 'friend_LZ.bin',
        'archiveHash': '4d576b34d017cacd0267e0327aea390b620b51da38799d66f5c6769eed37472d',
        'layouts': ['FrdCmnFade_U_00', 'FrdCmnFade_D_00'],
        'bank': 'friend_msbt_LZ', 'label': 'fri_title_fri', 'index': 6, 'style': 39, 'text': 'Friend List',
        'messageHash': '9931113b89fe9bd8352a880fb500ff3f73a23b0187121c313bcb8d0b9a9c530d',
        'messageDecodedHash': 'cb671ae85f9212848f8a9ebf0ca07bf85e3bb08d62e114a1971abb796a0d0567',
        'styleHash': '00e989ccd873a219df4321e2bcc3291d5f200c04caeceb363b77e5ceae1b8261',
        'styleDecodedHash': 'a34aa6cdc06595c8504d2dc6de299b4012a9b1fb57f7ad671391c1e7d0d9ef1a',
        'members': {
            'blyt/FrdCmnFade_U_00.bclyt': '727986552371a72c62a0a24f11e2ef778d90156b210b9d009f9e1c301aa9620b',
            'blyt/FrdCmnFade_D_00.bclyt': 'a3adb9f1740fac45c2e3b19d169cadb0f9e9e40805f6b5e47da2c27883900f6e',
            'anim/FrdCmnFade_U_00_SceneIn.bclan': 'd5e5dad524a7d074362ddc5de840dd64be715c021229c0fb8b0d1aa93d54d805',
            'anim/FrdCmnFade_D_00_SceneIn.bclan': '3a261531e2a41fbb117cc231600a8925cc8892edb9c1e3042f1e0babd7d0393f',
            'timg/LncApltPictFrd_00.bclim': '3d64c84503298e0d05520e919a92a41fa62d7b67ca4c70e5e62be4b060d64f4f',
        },
    },
    'notifications': {
        'titleId': '000400300000a002', 'version': 4097, 'contentId': '00000012',
        'ciaHash': 'edbe3dec63e8ac70a033df4216baafe27d94e4ee11ea9407d88567a1ed5190ae',
        'contentHash': '80e73dc01348a7e68975073ba4317856e9b79821b27ce4d65692612c500dacc8',
        'codeHash': 'b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228',
        'archive': 'common_LZ.bin',
        'archiveHash': '1ac03207aa03eb4f447e7ae5d4fe7f64fba08dca055717b8ff0ce9067db8e4ae',
        'layouts': ['CmnFade_U_00', 'CmnFade_D_00'],
        'bank': 'newslist_msbt_LZ', 'label': 'new_title_new', 'index': 26, 'style': 13, 'text': 'Notifications',
        'messageHash': 'cd9261dd122c66ff8feaddc68f2bd5f8e199ebb90feb7067976fa34fa0966652',
        'messageDecodedHash': '72d4794bb526ae90bb7d06e99a039ea1701044dad3b850983217a8a63b2cbb62',
        'styleHash': 'bd8b581be5f49d28cbf81321595c1451e6634e701563696d1e41aa4fc20bcf03',
        'styleDecodedHash': '23833acc620efbf4f5119ce7c0dace5ac68e9055f79eb54cc3489c60b6d65834',
        'members': {
            'blyt/CmnFade_U_00.bclyt': '727986552371a72c62a0a24f11e2ef778d90156b210b9d009f9e1c301aa9620b',
            'blyt/CmnFade_D_00.bclyt': 'e8fb04c1e1dbea4523423f4e7b18d3ae50801f6b5b312c02a1510869e1c5b1c6',
            'anim/CmnFade_U_00_SceneIn.bclan': 'd5e5dad524a7d074362ddc5de840dd64be715c021229c0fb8b0d1aa93d54d805',
            'anim/CmnFade_D_00_SceneIn.bclan': 'e47fa2508f3aa924cea2d5901ed04d8c271ba19730915f2265509cf1956d3fe2',
            'timg/LncApltPictNews_00.bclim': 'dfded3b8d750da95d921f06468e02d87dccc3ca86c62a700c5edcb4da3fd9a1e',
        },
    },
}
SHARED_MEMBERS = {
    'timg/BgLgt.bclim': 'c0d63a4ee5205e77b89b18b334ffbd13df83a06912ac258119a46160791f983b',
    'timg/BgLine.bclim': 'f9d858867fbd4c5db9d3fccb83819b9ed41052e96aeac9bcde0b63ed262134cc',
    'timg/LncApltBelt_00.bclim': 'd41841f80d82c1f95eb3efb62103f13af506ccb12c5ab30ff153f9702870fd71',
    'timg/LncApltBeltLine_00.bclim': 'e89489c43f81e212a19b5370dc2905f4b1580ffcc011ee0ecb05c010d4c1e434',
    'timg/LncApltBeltMask_00.bclim': '1dd62f26e7387aea82f14c80bfdd89b0316d9a773eb7aac42b8349b8d91b4e55',
    'timg/LncApltPictHome_00.bclim': 'c50f34febfce1b655d775997c7e8fa252e436626b5b283342e970114df00c406',
}
FONT_URL = 'fonts/shared/font.json'
FONT_HASH = 'd48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27'
STYLE_PATH = 'message/EU_English/RI_mstl_LZ.bin'
STYLE_DIAGNOSTIC = [{'kind': 'styleFields', 'offsets': [0, 4, 8, 12, 16, 20, 40]}]
STYLE_RECORD = {'fontScale': [0.8999999761581421]*2, 'lineSpacing': 0,
                'characterSpacing': 0, 'unresolvedWords':
                {'0': 270, '4': 1, '8': 0, '12': 0, '16': 0, '20': 0, '40': 4}}
METRIC_BLOCK_HASH = 'b2a4d54f6a3bfdb1993e20aea4c512818d700eed65efb5ca0190b21c5fde6d1c'
TEXT_PROOFS = {
    'friends': {
        'ranges': {
            'caller': [0x186384, 0x1863ec, '73cb48bd6c72795fa96cf9f913f667ae497565e19fa695486eea87a2bc7d37df'],
            'resolver': [0x17ed30, 0x17ed54, 'd6d14f015659fd1997d8bb1c4b08dd7409562a1bc927efddc8b7878290eff4c2'],
            'textGetter': [0x124c34, 0x124c70, '631710d1f6481a7cbd3949421436dcca1d63dd85ea1ad5cbdb13dd3c995a7cc4'],
            'wrapper': [0x17f5d4, 0x17f66c, '4e1af41a456126271d75ec68c7f6d75915e01e3b6e73c7da6ab90761fb67da62'],
            'plainWriter': [0x11cbbc, 0x11cd20, '9e3edd01720ea5170e2b9be36dc359c1fb7b96af8493902acfee9f809d3fcd22'],
            'unreachedStyleGetter': [0x12ab58, 0x12abb8, 'b8856f3889cdd1a42f578a646c1b654c69592b7ba5c968cde718309466589e7a'],
            'unreachedMetricBlock': [0x11c9e4, 0x11caa4, METRIC_BLOCK_HASH],
        },
        'branches': [[0x186394, 0x17ed30, True], [0x1863b8, 0x17f5d4, True],
                     [0x1863c4, 0x17ed30, True], [0x1863e8, 0x17f5d4, True],
                     [0x17ed50, 0x124c34, False], [0x17f648, 0x11cbbc, True]],
        'unreachedStyleWriter': 0x11c960,
    },
    'notifications': {
        'ranges': {
            'caller': [0x14fd34, 0x14fd98, 'c0fa6a10b940c014c80e19dba1a2312aaac296f2ea0ae20d17eaac9e94b56aaf'],
            'resolver': [0x149d8c, 0x149db0, '658039cc1277fc5e3cad5ea4cb4e91bac995757f14a8db262fa091cd3e1005db'],
            'textGetter': [0x11f434, 0x11f470, '631710d1f6481a7cbd3949421436dcca1d63dd85ea1ad5cbdb13dd3c995a7cc4'],
            'wrapper': [0x14a680, 0x14a720, 'ea6527b55cd40926a4e9e837228ebe159efde7cd3c9a6986e146bbd6d7fc3070'],
            'plainWriter': [0x116948, 0x116c14, '9cb3777cc7f62f160af4ad71168a09eacbe2b4b6fdd13a7ba7f574fcde052b03'],
            'unreachedStyleGetter': [0x1244cc, 0x12452c, '1541c9812859ec32d1c262f18d3fbe7ee99366fc76b2726c5aeeb90592ba0a1d'],
            'unreachedMetricBlock': [0x116770, 0x116830, METRIC_BLOCK_HASH],
        },
        'branches': [[0x14fd44, 0x149d8c, True], [0x14fd68, 0x14a680, True],
                     [0x14fd74, 0x149d8c, True], [0x14fd94, 0x14a680, True],
                     [0x149dac, 0x11f434, False], [0x14a6fc, 0x116948, True]],
        'unreachedStyleWriter': 0x1166ec,
    },
}


def arm_branch(raw, address):
    word = struct.unpack_from('<I', raw, address-0x100000)[0]
    if word >> 24 not in (0xea, 0xeb):
        raise ValueError('Expected pinned unconditional ARM branch')
    relative = word & 0xffffff
    if relative & 0x800000:
        relative -= 0x1000000
    return address+8+relative*4, bool(word & 0x1000000)


def verify_branches(raw, proof):
    for address, target, link in proof['branches']:
        if arm_branch(raw, address) != (target, link):
            raise ValueError('Selected plain-label writer branch changed')
    forbidden = {proof['unreachedStyleWriter'], proof['ranges']['unreachedStyleGetter'][0]}
    for name in ('caller', 'resolver', 'textGetter', 'wrapper', 'plainWriter'):
        start, end, _ = proof['ranges'][name]
        for at in range(start, end, 4):
            word = struct.unpack_from('<I', raw, at-0x100000)[0]
            if word >> 24 in (0xea, 0xeb) and arm_branch(raw, at)[0] in forbidden:
                raise ValueError('Selected plain-label path reaches a style function')


def text_binding(spec):
    name = next(name for name, source in SPECS.items() if source == spec)
    return {'kind': 'title-plain-label-writer', 'titleId': spec['titleId'],
            'codeSha256': spec['codeHash'], 'bank': spec['bank'], 'label': spec['label'],
            'sourceMessageIndex': spec['index'], 'styleIndex': spec['style'],
            'styleApplied': False, 'retainedStyleTable': 'non-applied-reference',
            'proof': copy.deepcopy(TEXT_PROOFS[name])}


def verify_text_source(raw, spec):
    proof = text_binding(spec)['proof']
    for name, (start, end, sha) in proof['ranges'].items():
        checked(raw[start-0x100000:end-0x100000], sha, name)
    verify_branches(raw, proof)


def checked(raw, expected, label):
    if digest(raw) != expected:
        raise ValueError('Pinned incoming source hash mismatch: '+label)
    return raw


def identity(spec):
    return {'contentIndex': 0, 'contentId': spec['contentId'], 'titleVersion': spec['version']}


def validate_manifest(manifest):
    if manifest['firmware'] != '10.7.0-32E' or manifest['locale'] != 'EU_English':
        raise ValueError('Wrong incoming firmware or locale')
    for spec in SPECS.values():
        title, source = manifest['titles'][spec['titleId']], manifest['sources'][spec['titleId']]
        if title['titleId'] != spec['titleId'] or title['version'] != spec['version'] or title['sourceSha256'] != spec['ciaHash']:
            raise ValueError('Wrong incoming title version or CIA')
        contents = source['contents']
        if source['titleId'] != spec['titleId'] or source['version'] != spec['version'] or \
           source['sourceSha256'] != spec['ciaHash'] or source['resourceContentIndex'] != 0 or len(contents) != 1:
            raise ValueError('Wrong incoming source metadata')
        if contents[0]['index'] != 0 or contents[0]['id'] != spec['contentId'] or contents[0]['sha256'] != spec['contentHash']:
            raise ValueError('Wrong incoming content identity')
    if manifest['fonts'].get('shared') != FONT_URL or manifest['resources'][FONT_URL]['sha256'] != FONT_HASH or \
       manifest['resources'][FONT_URL]['kind'] != 'font':
        raise ValueError('Unverified native shared-font presentation binding')


def source_resources(root, content, spec):
    checked(content.read_bytes(), spec['contentHash'], spec['titleId']+'/content')
    code = checked((root/'exefs/code.bin').read_bytes(), spec['codeHash'], spec['titleId']+'/ExeFS/code.bin')
    verify_text_source(code, spec)
    romfs = root/'romfs'
    archive = checked((romfs/spec['archive']).read_bytes(), spec['archiveHash'], spec['archive'])
    members = unpack_darc(decode_layers(archive))
    selected = {}
    for path, sha in {**SHARED_MEMBERS, **spec['members']}.items():
        if path not in members:
            raise ValueError('Missing selected incoming source member: '+path)
        selected[path] = checked(members[path], sha, path)
    message = 'message/EU_English/'+spec['bank']+'.bin'
    style = 'message/EU_English/RI_mstl_LZ.bin'
    for path, raw_hash, decoded_hash in ((message, spec['messageHash'], spec['messageDecodedHash']),
                                         (style, spec['styleHash'], spec['styleDecodedHash'])):
        raw = checked((romfs/path).read_bytes(), raw_hash, path)
        selected[path] = checked(decode_layers(raw), decoded_hash, path+' decoded')
    return selected


def selected_pack(pack, spec):
    if any(pack.get(key) != expected for key, expected in {
        'titleId': spec['titleId'], 'titleVersion': spec['version'],
        'contentIndex': 0, 'contentId': spec['contentId'],
    }.items()):
        raise ValueError('Unexpected incoming selected title/content identity')
    clips = [name+'_SceneIn' for name in spec['layouts']]
    selected, fonts = select_pack(pack, {'layouts': spec['layouts'], 'animations': clips,
                                        'messages': {spec['bank']: [spec['label']]}})
    previous_indices = pack.get('uiSelection', {}).get('sourceMessageIndices', {}).get(spec['bank'])
    if previous_indices is not None:
        selected['uiSelection']['sourceMessageIndices'][spec['bank']] = [
            previous_indices[index] for index in selected['uiSelection']['sourceMessageIndices'][spec['bank']]]
    if fonts != {'cbf_std.bcfnt'} or selected['layouts'][spec['layouts'][0]]['fonts'] != [] or \
       selected['layouts'][spec['layouts'][1]]['fonts'] != ['cbf_std.bcfnt']:
        raise ValueError('Unexpected incoming original font table')
    message = selected['messages'][spec['bank']]['messages'][0]
    if message['text'] != spec['text'] or message['styleIndex'] != spec['style'] or \
       selected['uiSelection']['sourceMessageIndices'][spec['bank']] != [spec['index']]:
        raise ValueError('Unexpected incoming localized label/style')
    table = selected['messages'][spec['bank']].get('styleTable')
    style_table = selected.get('styles', {}).get(table, {})
    styles = style_table.get('styles', [])
    if table != STYLE_PATH or set(style_table) != {'recordSize', 'styles', 'unsupported'} or \
       style_table['recordSize'] != 44 or style_table['unsupported'] != STYLE_DIAGNOSTIC or \
       len(styles) <= spec['style'] or styles[spec['style']] != STYLE_RECORD:
        raise ValueError('Unexpected non-applied incoming style reference')
    expected_binding = text_binding(spec)
    if ('incomingFontBinding' in pack or 'incomingTextBinding' in pack) and \
       pack.get('incomingTextBinding') != expected_binding:
        raise ValueError('Unexpected incoming plain-label source proof')
    # Only this exact non-applied table diagnostic is quarantined; all other
    # selected unsupported fields still fail through the unchanged validator.
    checked_selection = copy.deepcopy(selected)
    checked_selection['styles'][table]['unsupported'] = []
    supported(checked_selection)
    for name in clips:
        clip = selected['animations'][name]
        if clip['frames'] != 21 or clip['loop'] or not clip['childBinding'] or clip['sourceFrameRange'] != [20, 40]:
            raise ValueError('Unexpected incoming original SceneIn range')
    expected_textures = {Path(path).name for path in {**SHARED_MEMBERS, **spec['members']} if path.startswith('timg/')}
    if set(selected['textures']) != expected_textures:
        raise ValueError('Unexpected incoming selected texture closure')
    for bucket in ('messages', 'styles'):
        for key, source in selected['resourceSources'][bucket].items():
            path = 'message/EU_English/'+key+'.bin' if bucket == 'messages' else key
            expected_hash = spec['messageDecodedHash'] if bucket == 'messages' else spec['styleDecodedHash']
            if source.get('path') not in (path, spec['archive']+'/'+path) or \
               source.get('sha256') != expected_hash or source.get('titleId') != spec['titleId'] or \
               any(source.get(field) != value for field, value in identity(spec).items()):
                raise ValueError('Unexpected incoming message/style source identity')
            source['path'] = source['path'].removeprefix(spec['archive']+'/')
            source['compressedSha256'] = spec['messageHash'] if bucket == 'messages' else spec['styleHash']
    selected['incomingFontBinding'] = {
        'layoutName': 'cbf_std.bcfnt', 'url': FONT_URL, 'sha256': FONT_HASH,
        'kind': 'native-shared-presentation', 'titleRuntimeResolutionEstablished': False,
    }
    selected['incomingTextBinding'] = expected_binding
    return selected


def verify_existing(output, manifest, url):
    raw = public_path(output, url).read_bytes()
    record = manifest['resources'][url]
    if digest(raw) != record['sha256'] or len(raw) != record['size']:
        raise ValueError('Delivered incoming dependency hash mismatch: '+url)
    return raw


def publish(friends_source, notifications_source, friends_content, notifications_content, output, artifacts, ctrtool):
    if any(not path.is_absolute() for path in (friends_source, notifications_source, friends_content,
                                               notifications_content, output, artifacts, ctrtool)):
        raise ValueError('Every publication path must be absolute')
    manifest_path = output/'manifest.json'
    manifest = json.loads(manifest_path.read_bytes())
    validate_manifest(manifest)
    before = copy.deepcopy(manifest)
    resources = {name: source_resources(root, content, SPECS[name]) for name, root, content in (
        ('friends', friends_source, friends_content), ('notifications', notifications_source, notifications_content))}
    font = json.loads(verify_existing(output, manifest, FONT_URL))
    for sheet in font['sheets']:
        url = str(Path(FONT_URL).parent/sheet)
        if manifest['resources'][url]['kind'] != 'font-sheet':
            raise ValueError('Invalid native shared font sheet')
        verify_existing(output, manifest, url)
    conversion = converter_provenance(ctrtool)
    conversion['publisherSha256'] = digest(Path(__file__).read_bytes())
    artifacts.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='applet-incoming-', dir=artifacts) as tmp:
        candidate = Path(tmp)
        builder, packs = Builder(candidate), {}
        for name, spec in SPECS.items():
            generated, pack = builder.pack(resources[name], 'incoming', spec['titleId'],
                                             spec['archive'], spec['archiveHash'], identity(spec))
            selected = selected_pack(pack, spec)
            url, raw = 'packs/'+name+'/incoming.json', encode(selected)
            record = builder.records.pop(generated)
            record.update(size=len(raw), sha256=digest(raw))
            record['sources'].extend([
                {'titleId': spec['titleId'], **identity(spec), 'path': 'message/EU_English/'+spec['bank']+'.bin',
                 'sha256': spec['messageHash'], 'decodedSha256': spec['messageDecodedHash']},
                {'titleId': spec['titleId'], **identity(spec), 'path': 'message/EU_English/RI_mstl_LZ.bin',
                 'sha256': spec['styleHash'], 'decodedSha256': spec['styleDecodedHash']},
            ])
            record['conversion'] = {**conversion, 'codeSha256': spec['codeHash']}
            builder.records[url] = record
            (candidate/url).parent.mkdir(parents=True, exist_ok=True)
            (candidate/url).write_bytes(raw)
            packs[name] = {'url': url, 'sha256': digest(raw), 'alias': name+'-incoming',
                           'layouts': spec['layouts'], 'animations': [key+'_SceneIn' for key in spec['layouts']]}
            title = manifest['titles'][spec['titleId']]
            if url not in title['packs']:
                title['packs'].append(url)
            font_names = ('cbf_std.bcfnt', 'contents/0000-'+spec['contentId']+'/cbf_std.bcfnt')
            for font_name in font_names:
                previous = title['fonts'].get(font_name)
                if previous and previous != FONT_URL:
                    raise ValueError('Conflicting incoming native shared-font binding')
                title['fonts'][font_name] = FONT_URL
        owned_pack_urls = {entry['url'] for entry in packs.values()}
        pending = {}
        for url, record in builder.records.items():
            data = (candidate/url).read_bytes()
            previous = manifest['resources'].get(url)
            if previous:
                if previous['sha256'] != record['sha256'] or previous['size'] != record['size']:
                    raise ValueError('Conflicting delivered incoming resource: '+url)
                verify_existing(output, manifest, url)
                if url in owned_pack_urls:
                    manifest['resources'][url] = record
                continue
            record.setdefault('conversion', conversion)
            manifest['resources'][url] = record
            pending[url] = data
        if any(manifest[key] != value for key, value in before.items() if key not in ('titles', 'resources')) or \
           any(manifest['titles'][key] != value for key, value in before['titles'].items()
               if key not in {spec['titleId'] for spec in SPECS.values()}) or \
           any(manifest['resources'][key] != value for key, value in before['resources'].items()
               if key not in owned_pack_urls):
            raise ValueError('Unrelated delivered metadata changed')
        for url, data in pending.items():
            target = public_path(output, url)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        manifest_path.write_bytes(encode(manifest))
        report = {'schema': 1, 'packs': packs, 'added': list(pending), 'conversion': conversion,
                  'sources': SPECS, 'manifestSha256': digest(encode(manifest)),
                  'existingResourcesPreserved': True, 'clockPolicy': 'not published; browser scheduling is an adaptation'}
        (artifacts/'applet-incoming-publication.json').write_bytes(encode(report))
        return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('friends-source', 'notifications-source', 'friends-content', 'notifications-content',
                'output', 'artifacts', 'ctrtool'):
        parser.add_argument('--'+key, type=Path, required=True)
    print(json.dumps(publish(**vars(parser.parse_args())), sort_keys=True))


if __name__ == '__main__':
    main()
