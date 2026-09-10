"""Build an underside ink plate from photographed glyphs through Blender MCP.

This is a photographic reconstruction, not a verified factory font. The user's
image supplies unobstructed symbols and serial ink. A lower-resolution inspected
EUR reference supplies the four-line block and the obscured GS group. All source
photographs stay intact. No photo lighting or silver background is composited
onto the console; this script extracts only dark ink coverage.
"""
import bpy
import hashlib
import json
import uuid
from pathlib import Path

ROOT = Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
FOLDER = ROOT/'model/candidates/joshua-xl'
USER_PHOTO = Path('/Users/paramveer/.codex/attachments/0e128f9f-d25c-400d-ad5f-ca2b96c1b3d9/image-5.png')
WEB_PHOTO = ROOT/'.local/references/eur/konsolen-chips-underside.jpg'
PLATE = {'width_mm': 120, 'height_mm': 67.5, 'center_y_mm': -8, 'pixels': [2048, 1152]}


def rectangle(x0, y0, x1, y1):
    return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]]


# Source quadrilaterals run top-left, top-right, bottom-right, bottom-left.
# Target X reads right on the underside (native -X), Y points toward the hinge.
# Placement is estimated from the user's photograph using the 156 mm envelope.
ELEMENTS = [
    {'name':'wordmark', 'source':'atlas', 'quad':[[2715,2382],[3387,2382],[3387,2310],[2715,2310]], 'center':[0,12], 'size':[50.8,5.75]},
    {'name':'four-line-eur', 'source':'web', 'quad':[[197,396],[600,385],[600,425],[197,436]], 'center':[.25,-5.4], 'size':[92.5,10.2], 'threshold_srgb':[75,165]},
    {'name':'gs-group', 'source':'web', 'quad':[[195,439],[291,436],[292,477],[195,480]], 'center':[-35.8,-16.0], 'size':[21.5,9.0], 'threshold_srgb':[85,160]},
    {'name':'ce', 'source':'user', 'quad':rectangle(612,612,694,669), 'center':[-13.48,-16.75], 'size':[9.69,6.87], 'threshold_srgb':[25,65]},
    {'name':'rcm', 'source':'user', 'quad':rectangle(735,610,800,667), 'center':[0.06,-16.51], 'size':[7.68,6.87], 'threshold_srgb':[40,78]},
    {'name':'pct-with-caption', 'source':'user', 'quad':rectangle(806,612,865,683), 'center':[8.1,-17.59], 'size':[6.97,8.55], 'threshold_srgb':[40,80]},
    {'name':'weee', 'source':'user', 'quad':rectangle(872,590,942,695), 'center':[16.55,-16.99], 'size':[8.27,12.65], 'threshold_srgb':[45,85]},
    {'name':'nintendo-oval', 'source':'user', 'quad':rectangle(973,614,1143,666), 'center':[34.4,-16.69], 'size':[20.09,6.27], 'threshold_srgb':[55,105]},
    {'name':'address', 'source':'user', 'quad':rectangle(558,666,738,692), 'center':[-14.1,-21.39], 'size':[21.28,3.13], 'threshold_srgb':[25,65]},
    {'name':'serial-ink', 'source':'user', 'quad':rectangle(619,732,933,780), 'center':[.6,-30.27], 'size':[37.1,5.74], 'threshold_srgb':[95,175]},
]


def linear(byte):
    value = byte/255
    return value/12.92 if value<=.04045 else ((value+.055)/1.055)**2.4


def main():
    prefix = 'EurInk_'+uuid.uuid4().hex[:8]
    scene = bpy.data.scenes.new(prefix)
    objects, meshes, materials, images = [], [], [], []
    camera_data = world = None
    try:
        scene.render.engine = 'CYCLES'
        scene.cycles.device = 'CPU'
        scene.cycles.samples = 4
        scene.cycles.use_denoising = False
        scene.cycles.use_adaptive_sampling = False
        scene.cycles.max_bounces = 0
        scene.cycles.pixel_filter_type = 'BOX'
        scene.cycles.filter_width = .5
        scene.render.resolution_x, scene.render.resolution_y = PLATE['pixels']
        scene.render.resolution_percentage = 100
        scene.render.dither_intensity = 0
        scene.render.image_settings.file_format = 'PNG'
        scene.render.image_settings.color_mode = 'BW'
        scene.render.image_settings.color_depth = '8'
        scene.render.image_settings.compression = 100
        scene.render.use_compositing = False
        scene.render.use_sequencer = False
        scene.view_settings.view_transform = 'Raw'
        scene.view_settings.look = 'None'
        scene.view_settings.exposure = 0
        scene.view_settings.gamma = 1
        world = bpy.data.worlds.new(prefix)
        world.use_nodes = True
        world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0
        scene.world = world
        sources = {'atlas':bpy.data.images['Sourced silver base colour']}
        for name,path in [('user',USER_PHOTO),('web',WEB_PHOTO)]:
            image = bpy.data.images.load(str(path), check_existing=False)
            image.colorspace_settings.name = 'sRGB'
            sources[name] = image
            images.append(image)
        for item in ELEMENTS:
            material = bpy.data.materials.new(prefix+' '+item['name'])
            materials.append(material)
            material.use_nodes = True
            nodes,links = material.node_tree.nodes,material.node_tree.links
            nodes.clear()
            output = nodes.new('ShaderNodeOutputMaterial')
            emission = nodes.new('ShaderNodeEmission')
            links.new(emission.outputs[0],output.inputs['Surface'])
            texture = nodes.new('ShaderNodeTexImage')
            texture.image = sources[item['source']]
            texture.interpolation = 'Linear'
            gray = nodes.new('ShaderNodeRGBToBW')
            links.new(texture.outputs['Color'],gray.inputs['Color'])
            ramp = nodes.new('ShaderNodeMapRange')
            low,high = item.get('threshold_srgb',[35,150])
            ramp.inputs['From Min'].default_value = linear(low)
            ramp.inputs['From Max'].default_value = linear(high)
            ramp.inputs['To Min'].default_value = 1
            ramp.inputs['To Max'].default_value = 0
            ramp.clamp = True
            links.new(gray.outputs[0],ramp.inputs['Value'])
            coverage=ramp.outputs[0]
            if item['name']=='four-line-eur':
                # The fourth line ends before this corner. Exclude a photographed
                # scuff there without redrawing or clipping any visible glyph.
                coordinates=nodes.new('ShaderNodeTexCoord')
                separate=nodes.new('ShaderNodeSeparateXYZ')
                links.new(coordinates.outputs['Generated'],separate.inputs[0])
                right=nodes.new('ShaderNodeMath');right.operation='GREATER_THAN';right.inputs[1].default_value=.845
                bottom=nodes.new('ShaderNodeMath');bottom.operation='LESS_THAN';bottom.inputs[1].default_value=.25
                links.new(separate.outputs[0],right.inputs[0]);links.new(separate.outputs[1],bottom.inputs[0])
                corner=nodes.new('ShaderNodeMath');corner.operation='MULTIPLY'
                links.new(right.outputs[0],corner.inputs[0]);links.new(bottom.outputs[0],corner.inputs[1])
                keep=nodes.new('ShaderNodeMath');keep.operation='SUBTRACT';keep.inputs[0].default_value=1
                links.new(corner.outputs[0],keep.inputs[1])
                gated=nodes.new('ShaderNodeMath');gated.operation='MULTIPLY'
                links.new(coverage,gated.inputs[0]);links.new(keep.outputs[0],gated.inputs[1]);coverage=gated.outputs[0]
            links.new(coverage,emission.inputs['Color'])
            x,y = item['center'];w,h = item['size']
            mesh = bpy.data.meshes.new(prefix+' '+item['name'])
            meshes.append(mesh)
            mesh.from_pydata([(x-w/2,y+h/2,0),(x+w/2,y+h/2,0),(x+w/2,y-h/2,0),(x-w/2,y-h/2,0)],[],[(0,3,2,1)])
            mesh.update()
            layer = mesh.uv_layers.new(name='ReferenceUV')
            width,height = texture.image.size
            for loop in mesh.loops:
                u,v = item['quad'][loop.vertex_index]
                layer.data[loop.index].uv = u/width,1-v/height
            mesh.materials.append(material)
            obj = bpy.data.objects.new(prefix+' '+item['name'],mesh)
            objects.append(obj)
            scene.collection.objects.link(obj)
        camera_data = bpy.data.cameras.new(prefix)
        camera_data.type = 'ORTHO'
        camera_data.ortho_scale = PLATE['width_mm']
        camera = bpy.data.objects.new(prefix+' camera',camera_data)
        objects.append(camera)
        scene.collection.objects.link(camera)
        camera.location = (0,PLATE['center_y_mm'],100)
        camera.rotation_euler = (0,0,0)
        scene.camera = camera
        output_path = FOLDER/'derived-textures/eur-ink-plate.png'
        scene.render.filepath = str(output_path)
        with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0]):
            bpy.ops.render.render(write_still=True,scene=scene.name,use_viewport=False)
        report = {'plate':PLATE,'elements':ELEMENTS,'source_photos':{
            'user':{'file':str(USER_PHOTO),'sha256':hashlib.sha256(USER_PHOTO.read_bytes()).hexdigest()},
            'web':{'url':'https://konsolen-chips.de/media/image/product/7758/lg/nintendo-3ds-xl-konsole-silber-schwarz-gebraucht~4.jpg','sha256':hashlib.sha256(WEB_PHOTO.read_bytes()).hexdigest()}},
            'limitations':'Photographic ink extraction with manually selected bounds and approximate physical placement. Lower-resolution web text and GS detail retain capture limits. No factory font or barcode encoding is claimed.'}
        (FOLDER/'eur-ink-plate-report.json').write_text(json.dumps(report,indent=2)+'\n')
        print(str(output_path))
    finally:
        bpy.data.scenes.remove(scene)
        for obj in objects:bpy.data.objects.remove(obj,do_unlink=True)
        for mesh in meshes:bpy.data.meshes.remove(mesh)
        for material in materials:bpy.data.materials.remove(material)
        for image in images:bpy.data.images.remove(image)
        if camera_data is not None:bpy.data.cameras.remove(camera_data)
        if world is not None:bpy.data.worlds.remove(world)


if __name__ == '__main__':
    main()
