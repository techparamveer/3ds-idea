"""Capture native silver rig inspection views through Blender MCP.

Leaves the saved model, animation, camera and lights unchanged. Native Blender
uses its reconstructed tangent basis; the postprocessed browser GLB is the final
source-frame reference. These images are inspection records, not new textures.
"""
from pathlib import Path
import bpy
from mathutils import Vector

FOLDER = Path('/Volumes/DeveloperStorage/GitHub/3ds-idea/model/candidates/joshua-xl')


def main(prefix='silver'):
    scene = bpy.context.scene
    root, hinge, camera = scene.objects['3DS_XL'], scene.objects['Hinge'], scene.camera
    assert root.get('source_finish') == 'silver-adaptation'
    frame = scene.frame_current
    actions = [(o, o.animation_data.action) for o in (root, hinge)]
    lights = [o for o in scene.objects if o.type == 'LIGHT']
    transforms = [(o, o.matrix_world.copy()) for o in [camera, *lights]]
    settings = (scene.render.engine, scene.cycles.samples, scene.cycles.device,
                scene.render.resolution_x, scene.render.resolution_y,
                scene.render.resolution_percentage, scene.render.filepath,
                camera.data.type, camera.data.ortho_scale)
    try:
        for o, _ in actions:
            o.animation_data.action = None
        root.rotation_euler = (0, 0, 0)
        scene.render.engine = 'CYCLES'
        scene.cycles.device = 'CPU'
        scene.cycles.samples = 12
        scene.render.resolution_x, scene.render.resolution_y = 1000, 800
        scene.render.resolution_percentage = 100
        camera.data.type = 'ORTHO'
        for name, angle, location, target, scale in [
            (prefix+'-open', -155, (40, -280, 235), (0, 8, 36), 210),
            (prefix+'-closed', 0, (35, -180, 210), (0, 0, 10), 185),
            (prefix+'-underside', 0, (0, -80, -260), (0, 0, 8), 185),
        ]:
            hinge.rotation_euler.x = angle * 3.141592653589793 / 180
            camera.location = location
            camera.rotation_euler = (Vector(target) - camera.location).to_track_quat('-Z', 'Y').to_euler()
            camera.data.ortho_scale = scale
            basis = camera.rotation_euler.to_matrix()
            for light, local in zip(lights, [(-110, 100, 170), (140, 0, 100)]):
                light.location = Vector(target) + basis @ Vector(local)
                light.rotation_euler = (Vector(target) - light.location).to_track_quat('-Z', 'Y').to_euler()
            scene.render.filepath = str(FOLDER / (name + '.png'))
            bpy.context.view_layer.update()
            bpy.ops.render.render(write_still=True)
            print('Saved ' + scene.render.filepath, flush=True)
    finally:
        for o, action in actions:
            o.animation_data.action = action
        scene.frame_set(frame)
        for o, matrix in transforms:
            o.matrix_world = matrix
        (scene.render.engine, scene.cycles.samples, scene.cycles.device,
         scene.render.resolution_x, scene.render.resolution_y,
         scene.render.resolution_percentage, scene.render.filepath,
         camera.data.type, camera.data.ortho_scale) = settings
        bpy.context.view_layer.update()


if __name__ == '__main__':
    main()
