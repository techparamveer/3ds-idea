"""Matched whole-console views for the sourced dimension correction."""
from pathlib import Path
import math
import bpy
from mathutils import Vector, Quaternion

FOLDER = Path(__file__).resolve().parents[1] / 'model/candidates/joshua-xl'
VIEWS = [
    ('front', -155, (0, -260, 250), (0, 8, 35), 235, 0),
    ('open', -155, (40, -280, 235), (0, 8, 36), 240, 0),
    ('top', 0, (0, 0, 300), (0, 0, 10), 180, 0),
    ('side', 0, (300, 0, 11), (0, 0, 11), 115, 0),
    ('rear', 0, (35, 250, 135), (0, 0, 10), 180, 0),
    ('underside', 0, (0, -80, -260), (0, 0, 8), 185, math.pi),
]


def main(prefix='dimensions-before', only=None, resolution=(1000, 750), perspective_lens=None, light_offsets=None):
    scene = bpy.context.scene
    root, hinge, camera = scene.objects['3DS_XL'], scene.objects['Hinge'], scene.camera
    frame = scene.frame_current
    actions = [(o, o.animation_data.action) for o in (root, hinge)]
    lights = [o for o in scene.objects if o.type == 'LIGHT']
    transforms = [(o, o.matrix_world.copy()) for o in [camera, *lights]]
    settings = (scene.render.engine, scene.cycles.samples, scene.cycles.device,
                scene.render.resolution_x, scene.render.resolution_y,
                scene.render.resolution_percentage, scene.render.filepath,
                camera.data.type, camera.data.ortho_scale, camera.data.lens)
    try:
        for o, _ in actions:
            o.animation_data.action = None
        root.rotation_euler = (0, 0, 0)
        scene.render.engine = 'CYCLES'
        scene.cycles.device = 'CPU'
        scene.cycles.samples = 12
        scene.render.resolution_x, scene.render.resolution_y = resolution
        scene.render.resolution_percentage = 100
        camera.data.type = 'PERSP' if perspective_lens is not None else 'ORTHO'
        if perspective_lens is not None:
            camera.data.lens = perspective_lens
        for name, angle, location, target, scale, roll in VIEWS:
            if only is not None and name not in only:
                continue
            hinge.rotation_euler.x = math.radians(angle)
            camera.location = location
            camera.rotation_euler = ((Vector(target)-camera.location).to_track_quat('-Z', 'Y')
                                     @ Quaternion((0, 0, 1), roll)).to_euler()
            camera.data.ortho_scale = scale
            basis = camera.rotation_euler.to_matrix()
            for light, local in zip(lights, light_offsets or [(-110, 100, 170), (140, 0, 100)]):
                light.location = Vector(target)+basis@Vector(local)
                light.rotation_euler = (Vector(target)-light.location).to_track_quat('-Z', 'Y').to_euler()
            scene.render.filepath = str(FOLDER/(prefix+'-'+name+'.png'))
            bpy.context.view_layer.update()
            bpy.ops.render.render(write_still=True)
            print('Saved '+scene.render.filepath, flush=True)
    finally:
        for obj, action in actions:
            obj.animation_data.action = action
        scene.frame_set(frame)
        for obj, matrix in transforms:
            obj.matrix_world = matrix
        (scene.render.engine, scene.cycles.samples, scene.cycles.device,
         scene.render.resolution_x, scene.render.resolution_y,
         scene.render.resolution_percentage, scene.render.filepath,
         camera.data.type, camera.data.ortho_scale, camera.data.lens) = settings
        bpy.context.view_layer.update()


if __name__ == '__main__':
    main()
