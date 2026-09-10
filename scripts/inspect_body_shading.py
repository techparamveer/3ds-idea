"""Reversible channel isolation renders; no saved model or export mutations."""
import bpy
import importlib
import render_sourced_dimensions as renderer

def main(mode='normal-off'):
    assert mode in ('normal-off', 'constant-pbr', 'constant-colour', 'metallic-off', 'roughness-fixed')
    assignments = []
    copies = {}
    try:
        for obj in bpy.data.objects:
            if obj.type != 'MESH':
                continue
            for slot in obj.material_slots:
                original = slot.material
                if original is None or original.get('console_material_role') != 'sourced-body':
                    continue
                if original.name not in copies:
                    copies[original.name] = original.copy()
                assignments.append((slot, original))
                slot.material = copies[original.name]
        for material in copies.values():
            shader = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
            names = ['Normal'] if mode == 'normal-off' else ['Roughness', 'Metallic']
            if mode == 'metallic-off':
                names = ['Metallic']
            elif mode == 'roughness-fixed':
                names = ['Roughness']
            elif mode == 'constant-colour':
                names = ['Base Color']
            for name in names:
                socket = shader.inputs[name]
                for link in list(socket.links):
                    material.node_tree.links.remove(link)
                if name == 'Roughness':
                    socket.default_value = .65
                elif name == 'Metallic':
                    socket.default_value = 0
                elif name == 'Base Color':
                    socket.default_value = (.018, .018, .018, 1)
        importlib.reload(renderer)
        renderer.main('body-' + mode, only={'front'})
    finally:
        for slot, original in assignments:
            slot.material = original
        for material in copies.values():
            bpy.data.materials.remove(material)

if __name__ == '__main__':
    main()
