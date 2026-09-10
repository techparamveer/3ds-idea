"""Install inspected grain and hairline maps on the two silver shell panels."""
from pathlib import Path
import json
import bpy
import texture_sourced_model as exporter
import curve_sourced_shell as frames

FOLDER = Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main():
    assert Path(bpy.data.filepath).name == 'silver-abxy-openings.blend'
    for panel, name, old_mr, old_normal in [
        ('lid', 'Sourced outer lid', 'body-legends-metallic-roughness.png', 'body-etched-normal.png'),
        ('cover', 'Sourced graphite chassis', 'socket-graphite-metallic-roughness.png', 'body-socket-normal.png'),
    ]:
        obj = bpy.data.objects[name]
        material = obj.active_material.copy()
        material.name = 'Sourced restrained silver '+panel
        obj.active_material = material
        replaced = 0
        for node in material.node_tree.nodes:
            if node.type != 'TEX_IMAGE' or not node.image:
                continue
            channel = {old_mr: 'metallic-roughness', old_normal: 'normal'}.get(Path(node.image.filepath).name)
            if channel:
                image = bpy.data.images.load(str(FOLDER/f'derived-textures/paint-{panel}-restrained-{channel}.png'), check_existing=False)
                image.colorspace_settings.name = 'Non-Color'
                image.pack()
                node.image = image
                replaced += 1
        assert replaced == 2
    root, hinge = bpy.data.objects['3DS_XL'], bpy.data.objects['Hinge']
    root['restrained_paint'] = json.dumps(json.loads((FOLDER/'restrained-paint-report.json').read_text()))
    root['source_changes'] += ' Silver shell panels retain 35% of the added paint grain with sparse authored hairlines; source wear, colour, legends, unpainted pixels and geometry retained.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-restrained-paint.blend'))
    output = FOLDER/'silver-restrained-paint.glb'
    exporter.export_static(root, hinge, output, restore_frames=False, export_attributes=True)
    frames.restore_export_frames(output)


if __name__ == '__main__':
    main()
