"""Render the underside upright for comparison with the user's photograph 5."""
from pathlib import Path
import math
import bpy
from mathutils import Vector,Quaternion

FOLDER=Path('/Volumes/DeveloperStorage/GitHub/3ds-idea/model/candidates/joshua-xl')


def main(include_before=False):
    scene=bpy.context.scene
    root,hinge,camera=scene.objects['3DS_XL'],scene.objects['Hinge'],scene.camera
    frame=scene.frame_current
    actions=[(o,o.animation_data.action) for o in (root,hinge)]
    lights=[o for o in scene.objects if o.type=='LIGHT']
    transforms=[(o,o.matrix_world.copy()) for o in [camera,*lights]]
    settings=(scene.render.engine,scene.cycles.device,scene.cycles.samples,scene.render.resolution_x,scene.render.resolution_y,
              scene.render.resolution_percentage,scene.render.filepath,camera.data.type,camera.data.ortho_scale)
    meshes=[o for o in root.children_recursive if o.type=='MESH' and o.get('source_mesh_index')==0]
    originals=[(o,o.data.materials[0]) for o in meshes]
    current=bpy.data.materials['Sourced silver EUR photographic markings']
    variants=[('eur-after-underside',current)]
    if include_before:variants.insert(0,('eur-before-underside',bpy.data.materials['Sourced silver fine paint and graphite PBR']))
    try:
        for o,_ in actions:o.animation_data.action=None
        root.rotation_euler=(0,0,0);hinge.rotation_euler=(0,0,0)
        target=Vector((0,0,8));camera.location=(0,-80,-260)
        camera.rotation_euler=((target-camera.location).to_track_quat('-Z','Y')@Quaternion((0,0,1),math.pi)).to_euler()
        camera.data.type='ORTHO';camera.data.ortho_scale=185
        basis=camera.rotation_euler.to_matrix()
        for light,local in zip(lights,[(-110,100,170),(140,0,100)]):
            light.location=target+basis@Vector(local)
            light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
        scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24
        scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
        for name,material in variants:
            for obj in meshes:obj.data.materials[0]=material
            scene.render.filepath=str(FOLDER/(name+'.png'))
            bpy.context.view_layer.update();bpy.ops.render.render(write_still=True)
            print('Saved '+scene.render.filepath,flush=True)
    finally:
        for obj,material in originals:obj.data.materials[0]=material
        for obj,action in actions:obj.animation_data.action=action
        scene.frame_set(frame)
        for obj,matrix in transforms:obj.matrix_world=matrix
        (scene.render.engine,scene.cycles.device,scene.cycles.samples,scene.render.resolution_x,scene.render.resolution_y,
         scene.render.resolution_percentage,scene.render.filepath,camera.data.type,camera.data.ortho_scale)=settings
        bpy.context.view_layer.update()


if __name__=='__main__':main()
