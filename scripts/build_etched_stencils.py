"""Render smooth, manually fitted MIC/POWER curve stencils in Blender.

These are authored approximations of the photographed monoline glyphs, not a
factory font. Isolated emission renders avoid tracing JPEG noise into grooves.
"""
from pathlib import Path
import math
import bpy

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def arc(cx,cy,rx,ry,start,end):
    return [(cx+rx*math.cos(math.radians(start+(end-start)*i/64)),
             cy+ry*math.sin(math.radians(start+(end-start)*i/64))) for i in range(65)]

P=[[(0,0),(0,1),(.5,1)]+arc(.5,.75,.5,.25,90,-90)[1:]+[(0,.5)]]
GLYPHS={
    'P':P, 'O':[arc(.5,.5,.5,.5,0,360)],
    'W':[[(0,1),(.23,0),(.5,.85),(.77,0),(1,1)]],
    'E':[[(1,1),(0,1),(0,0),(1,0)],[(0,.5),(.88,.5)]],
    'R':P+[[ (.48,.5),(1,0)]],
    'M':[[(0,0),(0,1),(.5,.28),(1,1),(1,0)]],
    'I':[[(.5,0),(.5,1)]],
    'C':[arc(.53,.5,.53,.5,42,318)],
}
WORDS={
    'POWER':{'widths':[1.4,1.6,2,1.2,1.5],'height':1.5,'gap':.38,'stroke':.105,'box':(10.39818,2.92046)},
    'MIC':{'widths':[1.14,.12,1.15],'height':1.35,'gap':.4,'stroke':.095,'box':(4.21391,2.52729)},
}

def main():
    scene=bpy.data.scenes.new('Temporary smooth glyph plate')
    objects=[];meshes=[];camera_data=world=mat=None
    try:
        scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=4
        scene.cycles.use_denoising=False;scene.cycles.use_adaptive_sampling=False
        scene.render.resolution_percentage=100;scene.render.dither_intensity=0
        scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='BW'
        scene.view_settings.view_transform='Raw';scene.view_settings.look='None'
        scene.render.use_compositing=False;scene.render.use_sequencer=False
        world=bpy.data.worlds.new(scene.name);world.use_nodes=True
        world.node_tree.nodes['Background'].inputs['Color'].default_value=(0,0,0,1);scene.world=world
        mat=bpy.data.materials.new(scene.name);mat.use_nodes=True;mat.node_tree.nodes.clear()
        output=mat.node_tree.nodes.new('ShaderNodeOutputMaterial');emission=mat.node_tree.nodes.new('ShaderNodeEmission')
        emission.inputs['Color'].default_value=(1,1,1,1);mat.node_tree.links.new(emission.outputs[0],output.inputs['Surface'])
        camera_data=bpy.data.cameras.new(scene.name);camera_data.type='ORTHO'
        camera=bpy.data.objects.new(scene.name,camera_data);camera.location=(0,0,10)
        scene.collection.objects.link(camera);objects.append(camera);scene.camera=camera
        for word,spec in WORDS.items():
            word_objects=[];cursor=-(sum(spec['widths'])+spec['gap']*(len(word)-1))/2
            for char,width in zip(word,spec['widths']):
                vertices=[];faces=[];radius=spec['stroke']/2
                def polygon(points):
                    start=len(vertices);vertices.extend([(x,y,0) for x,y in points]);faces.append(tuple(range(start,len(vertices))))
                for path in GLYPHS[char]:
                    points=[(cursor+x*width,(y-.5)*spec['height']) for x,y in path]
                    for (ax,ay),(bx,by) in zip(points,points[1:]):
                        length=math.hypot(bx-ax,by-ay);nx,ny=-(by-ay)*radius/length,(bx-ax)*radius/length
                        polygon([(ax+nx,ay+ny),(ax-nx,ay-ny),(bx-nx,by-ny),(bx+nx,by+ny)])
                    for x,y in points:polygon(arc(x,y,radius,radius,0,360)[:-1])
                mesh=bpy.data.meshes.new('Fitted '+char);meshes.append(mesh);mesh.from_pydata(vertices,[],faces);mesh.materials.append(mat)
                obj=bpy.data.objects.new('Fitted '+char,mesh)
                scene.collection.objects.link(obj);objects.append(obj);word_objects.append(obj)
                cursor+=width+spec['gap']
            camera_data.ortho_scale=spec['box'][0]
            scene.render.resolution_x=1024;scene.render.resolution_y=round(1024*spec['box'][1]/spec['box'][0])
            scene.render.filepath=str(FOLDER/'derived-textures'/('etched-stencil-'+word.lower()+'.png'))
            with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0]):bpy.ops.render.render(write_still=True,scene=scene.name)
            for obj in word_objects:obj.hide_render=True
            print('Rendered smooth '+word+' stencil.',flush=True)
    finally:
        bpy.data.scenes.remove(scene)
        for obj in objects:bpy.data.objects.remove(obj,do_unlink=True)
        for mesh in meshes:bpy.data.meshes.remove(mesh)
        if camera_data:bpy.data.cameras.remove(camera_data)
        if world:bpy.data.worlds.remove(world)
        if mat:bpy.data.materials.remove(mat)

if __name__=='__main__':main()
