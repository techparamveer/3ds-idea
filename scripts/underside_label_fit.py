"""Rebuild the underside serial label and make retained captions readable.

Run through Blender MCP; no save/export is performed. Barcode runs were sampled
from user image-5.png, row band746..752, X626..921, threshold125sRGB. They are a
photographic silhouette, NOT a verified/decodeable barcode encoding. The visible
serial is SUH100767841. Courier New is an explicit unverified outline fallback.
Existing generic captions remain placeholders; no obscured text or symbols are
invented. Their source glyphs are preserved and turned upright.
"""
from pathlib import Path
import math
import runpy

import bmesh
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
SERIAL = 'SUH100767841'
FONT_PATH = '/System/Library/Fonts/Supplemental/Courier New.ttf'
BAR_RUNS = [(1,3),(4,7),(9,13),(14,15),(19,21),(22,25),(27,29),(30,32),(35,37),(38,42),(43,47),(48,50),(51,55),(58,60),(61,63),(64,66),(67,71),(72,74),(77,79),(80,84),(85,89),(90,94),(95,97),(100,101),(103,105),(107,108),(109,111),(113,116),(119,123),(124,126),(128,131),(132,136),(137,139),(143,144),(145,147),(148,150),(152,155),(156,160),(163,165),(167,168),(170,171),(173,176),(178,181),(185,186),(188,189),(191,194),(196,197),(199,200),(204,205),(207,210),(212,213),(215,218),(222,223),(225,226),(228,231),(233,236),(238,239),(241,242),(244,245),(249,252),(254,255),(259,262),(264,265),(267,270),(271,273),(275,276),(277,281),(283,286),(288,289),(293,294)]


def ink_material(name, rgb, roughness):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*rgb, 1)
    shader.inputs['Metallic'].default_value = 0
    shader.inputs['Roughness'].default_value = roughness
    material.diffuse_color = (*rgb, 1)
    return material


def rounded_rectangle(width, height, radius, center=(0, -29)):
    # A regular surface grid avoids the very skinny triangles of a centre fan.
    # Those formerly expanded to41k triangles per tiny sticker during fitting.
    columns=math.ceil(width/.5); rows=math.ceil(height/.3)
    points=[]; faces=[]
    for row in range(rows+1):
        y=-height/2+height*row/rows
        dy=max(0,abs(y)-(height/2-radius))
        edge=width/2-radius+math.sqrt(max(0,radius*radius-dy*dy))
        for column in range(columns+1):
            points.append((center[0]-edge+2*edge*column/columns,center[1]+y,0))
    for row in range(rows):
        for column in range(columns):
            a=row*(columns+1)+column; b=a+1; c=b+columns+1; d=a+columns+1
            faces.extend([(a,b,c),(a,c,d)])
    return points, faces


def glyph_outlines(font, character):
    curve = bpy.data.curves.new('Temporary serial glyph', 'FONT')
    curve.body = character
    curve.font = font
    curve.size = 1
    curve.extrude = 0
    curve.bevel_depth = 0
    curve.resolution_u = 16
    obj = bpy.data.objects.new('Temporary serial glyph', curve)
    bpy.context.scene.collection.objects.link(obj)
    try:
        bpy.context.view_layer.update()
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        try:
            return [tuple(v.co) for v in mesh.vertices], [tuple(f.vertices) for f in mesh.polygons]
        finally:
            evaluated.to_mesh_clear()
    finally:
        bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.curves.remove(curve)


def serial_outlines():
    if not Path(FONT_PATH).is_file():
        raise RuntimeError('Documented Courier New fallback is unavailable; no font substitution made.')
    font = bpy.data.fonts.load(FONT_PATH, check_existing=True)
    glyphs = {char: glyph_outlines(font, char) for char in set(SERIAL)}
    ymin = min(p[1] for vertices, _ in glyphs.values() for p in vertices)
    ymax = max(p[1] for vertices, _ in glyphs.values() for p in vertices)
    scale = 1.60/(ymax-ymin)
    points, faces = [], []
    for index, char in enumerate(SERIAL):
        vertices, polygons = glyphs[char]
        cx = (min(p[0] for p in vertices)+max(p[0] for p in vertices))/2
        logical_x = (index-(len(SERIAL)-1)/2)*2.20
        offset = len(points)
        # Reading-right on this underside is model -X; reading-up is model +Y.
        points.extend((-(logical_x+(p[0]-cx)*scale),
                       -30.65+(p[1]-(ymin+ymax)/2)*scale,0) for p in vertices)
        faces.extend(tuple(offset+i for i in face) for face in polygons)
    return points, faces


def barcode_outlines():
    points, faces = [], []
    for begin, end in BAR_RUNS:
        left = (begin/295-.5)*33.5
        right = (end/295-.5)*33.5
        offset = len(points)
        points.extend([(-left,-28.80,0),(-right,-28.80,0),
                       (-right,-26.65,0),(-left,-26.65,0)])
        faces.append(tuple(range(offset,offset+4)))
    return points, faces


def caption_outlines(obj, width, center):
    source = [obj.matrix_local @ v.co for v in obj.data.vertices]
    xmin, xmax = min(p.x for p in source), max(p.x for p in source)
    ymin, ymax = min(p.y for p in source), max(p.y for p in source)
    scale = width/(xmax-xmin)
    # First execution repairs the old X-flipped caption's orientation. The new
    # object records that repair so a later run cannot invert it again.
    orientation = 1 if obj.get('upright_underside_fit',False) else -1
    points = [(center[0]+orientation*(p.x-(xmin+xmax)/2)*scale,
               center[1]+orientation*(p.y-(ymin+ymax)/2)*scale,0) for p in source]
    return points, [tuple(face.vertices) for face in obj.data.polygons]


def apply_underside_label_fit():
    base = bpy.data.objects['Base']
    root = bpy.data.objects['3DS_XL']
    cover = bpy.data.objects['Battery cover']
    if any(abs(s-1)>1e-5 for s in root.scale) or cover.parent != base:
        raise RuntimeError('Expected native millimetres and Battery cover parent Base; no edits made.')
    # run_name prevents the sourced-wordmark script from performing its own pass.
    split = runpy.run_path(str(ROOT/'scripts/underside_branding.py'),
                           run_name='underside_wordmark_helpers')['subdivide_triangles']
    bpy.context.view_layer.update()
    tree = BVHTree.FromObject(cover,bpy.context.evaluated_depsgraph_get())
    to_base = cover.matrix_local.copy()
    to_cover = to_base.inverted()
    direction = (to_cover.to_3x3()@Vector((0,0,1))).normalized()

    def fitted_mesh(name, points, faces, offset):
        temp = bpy.data.meshes.new(name+' planar tessellation')
        temp.from_pydata(points,[],faces)
        temp.update()
        bm = bmesh.new()
        bm.from_mesh(temp)
        try:
            bmesh.ops.triangulate(bm,faces=list(bm.faces))
            bm.verts.index_update()
            points = [tuple(v.co) for v in bm.verts]
            triangles = [tuple(v.index for v in f.verts) for f in bm.faces]
        finally:
            bm.free()
            bpy.data.meshes.remove(temp)
        points,triangles = split(points,triangles,.70 if name.startswith('Serial sticker') else .50)
        fitted = []
        for x,y,_ in points:
            hit,_,_,_ = tree.ray_cast(to_cover@Vector((x,y,-20)),direction)
            if hit is None:
                raise RuntimeError(name+' misses the cover; original objects preserved.')
            z = (to_base@hit).z-offset
            if z < -0.001:
                raise RuntimeError(name+' would exceed the closed envelope; original objects preserved.')
            fitted.append((x,y,z))
        triangles = [(a,c,b) if (fitted[b][0]-fitted[a][0])*(fitted[c][1]-fitted[a][1])-
                     (fitted[b][1]-fitted[a][1])*(fitted[c][0]-fitted[a][0]) > 0 else (a,b,c)
                     for a,b,c in triangles]
        mesh = bpy.data.meshes.new(name+' fitted single surface')
        mesh.from_pydata(fitted,[],triangles)
        mesh.update()
        return mesh

    paper = ink_material('Serial label off white',(.73,.75,.73),.67)
    dark = ink_material('Serial label black ink',(.003,.004,.005),.64)
    rim = ink_material('Serial label dark rim',(.013,.015,.016),.55)
    specs = [('Serial sticker rim',rounded_rectangle(39.7,6.7,1.1),.025,rim),
             ('Serial sticker',rounded_rectangle(39,6,.85),.045,paper),
             ('Serial barcode',barcode_outlines(),.065,dark),
             ('Serial number',serial_outlines(),.066,dark)]
    for name,width,center in [('Bottom model marking',50,(0,-11)),
                              ('Bottom compliance',48,(0,-17))]:
        if name in bpy.data.objects:
            specs.append((name,caption_outlines(bpy.data.objects[name],width,center),.004,dark))
    built = []
    try:
        for name,(points,faces),offset,material in specs:
            mesh = fitted_mesh(name,points,faces,offset)
            mesh.materials.append(material)
            built.append((name,mesh))
    except Exception:
        for _,mesh in built:
            bpy.data.meshes.remove(mesh)
        raise
    # All layers succeeded before any existing object is removed.
    for name,mesh in built:
        old = bpy.data.objects.get(name)
        if old:
            bpy.data.objects.remove(old,do_unlink=True)
        obj = bpy.data.objects.new(name,mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = base
        obj['upright_underside_fit'] = True
        obj['source'] = 'User supplied image-5.png; photographic reconstruction'
        if name == 'Serial barcode':
            obj['encoding_verified'] = False
            obj['bar_source'] = '70 dark runs sampled from image5 X626..921,Y746..752, threshold125'
        elif name == 'Serial number':
            obj['serial_text'] = SERIAL
            obj['font_source'] = FONT_PATH
            obj['font_verified'] = False
        elif name.startswith('Bottom '):
            obj['caption_is_placeholder'] = True
            obj['caption_fit'] = 'Existing text preserved; layout/font not factory-verified; obscured text not invented'
    bpy.context.view_layer.update()
    print({'rebuilt':[name for name,_ in built], 'serial':SERIAL,
           'barcode_encoding_verified':False,'font_verified':False,
           'saved':False,'exported':False})


if __name__ == '__main__':
    apply_underside_label_fit()
