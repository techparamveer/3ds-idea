"""Replace the generic underside wordmark with sourced Nintendo SVG outlines.

Run through Blender MCP against the current native millimetre model. This pass
does not save or export. It imports via Blender's bundled io_curve_svg module;
no font package or third-party add-on is required. See docs/wordmark-source.md.
"""
from pathlib import Path
import hashlib

import addon_utils
import bmesh
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


ROOT = Path('/Volumes/DeveloperStorage/GitHub/3ds-idea')
SOURCE = ROOT / 'public/textures/branding/nintendo-3ds-xl-original.svg'
SOURCE_SHA256 = '2d93fc6993eac6a69c7f49fca0d6c27b84838db7968012b4e36deb7b47888780'
WIDTH_MM = 50.0
CENTER_XY = (0.0, 12.0)
INK_OFFSET_MM = .015
MAX_EDGE_MM = .50


def subdivide_triangles(vertices, triangles, max_edge=.50, triangle_limit=500_000):
    """Bisect each longest edge until all edges meet the physical-size limit.

    This uses shared vertex-index pairs for midpoints. It avoids repeated bmesh
    subdivision/triangulation, which can introduce fresh long diagonals and fail
    to converge even after many passes. No Blender calls occur in this function.
    """
    points = [tuple(p) for p in vertices]
    pending = [tuple(t) for t in triangles]
    complete = []
    midpoints = {}
    max_squared = max_edge * max_edge
    while pending:
        a, b, c = pending.pop()
        edges = [(a, b, c), (b, c, a), (c, a, b)]
        lengths = [sum((points[u][axis]-points[v][axis])**2 for axis in range(3))
                   for u, v, _ in edges]
        longest = max(range(3), key=lengths.__getitem__)
        if lengths[longest] <= max_squared * (1+1e-12):
            complete.append((a, b, c))
            continue
        u, v, opposite = edges[longest]
        key = (min(u, v), max(u, v))
        midpoint = midpoints.get(key)
        if midpoint is None:
            midpoint = len(points)
            points.append(tuple((points[u][axis]+points[v][axis])/2 for axis in range(3)))
            midpoints[key] = midpoint
        pending.extend([(u, midpoint, opposite), (midpoint, v, opposite)])
        if len(complete)+len(pending) > triangle_limit:
            raise RuntimeError('Wordmark subdivision exceeded the mesh-size guard; original preserved.')
    return points, complete


def import_outlines():
    """Return filled XY mesh data, then remove only temporary imported objects."""
    old_objects = set(bpy.data.objects)
    old_collections = set(bpy.data.collections)
    old_materials = set(bpy.data.materials)
    vertices, faces = [], []
    try:
        if not addon_utils.check('io_curve_svg')[1]:
            addon_utils.enable('io_curve_svg', default_set=False, persistent=False)
        result = bpy.ops.import_curve.svg(filepath=str(SOURCE))
        if result != {'FINISHED'}:
            raise RuntimeError('SVG import failed; original wordmark was preserved.')
        imported = set(bpy.data.objects) - old_objects
        curves = [o for o in imported if o.type == 'CURVE']
        if len(curves) < 10:
            raise RuntimeError('SVG produced too few outlines; original wordmark was preserved.')
        for obj in curves:
            obj.data.dimensions = '2D'
            obj.data.fill_mode = 'BOTH'
            obj.data.extrude = 0
            obj.data.bevel_depth = 0
            obj.data.resolution_u = 24
        bpy.context.view_layer.update()
        deps = bpy.context.evaluated_depsgraph_get()
        for obj in curves:
            evaluated = obj.evaluated_get(deps)
            mesh = evaluated.to_mesh()
            try:
                offset = len(vertices)
                vertices.extend(evaluated.matrix_world @ v.co for v in mesh.vertices)
                faces.extend(tuple(offset+i for i in f.vertices) for f in mesh.polygons)
            finally:
                evaluated.to_mesh_clear()
    finally:
        for obj in set(bpy.data.objects) - old_objects:
            data = obj.data
            bpy.data.objects.remove(obj, do_unlink=True)
            if isinstance(data, bpy.types.Curve) and data.users == 0:
                bpy.data.curves.remove(data)
        for collection in set(bpy.data.collections) - old_collections:
            bpy.data.collections.remove(collection)
        for material in set(bpy.data.materials) - old_materials:
            if material.users == 0:
                bpy.data.materials.remove(material)
    if not vertices or not faces:
        raise RuntimeError('Empty SVG fill; original wordmark was preserved.')
    return vertices, faces


def apply_underside_branding():
    for name in ('3DS_XL', 'Base', 'Battery cover'):
        if name not in bpy.data.objects:
            raise RuntimeError('Required object missing: '+name+'; no edits made.')
    if not SOURCE.is_file() or hashlib.sha256(SOURCE.read_bytes()).hexdigest() != SOURCE_SHA256:
        raise RuntimeError('SVG source missing or changed; no edits made.')
    root = bpy.data.objects['3DS_XL']
    if any(abs(value-1) > 1e-5 for value in root.scale):
        raise RuntimeError('Expected native millimetres with root scale1; no edits made.')
    base = bpy.data.objects['Base']
    cover = bpy.data.objects['Battery cover']
    if cover.parent != base:
        raise RuntimeError('Battery cover must be a direct Base child; no edits made.')
    vertices, faces = import_outlines()
    lo = Vector(tuple(min(v[i] for v in vertices) for i in range(3)))
    hi = Vector(tuple(max(v[i] for v in vertices) for i in range(3)))
    source_width, source_height = hi.x-lo.x, hi.y-lo.y
    if not 9.4 < source_width/source_height < 9.8:
        raise RuntimeError('Imported wordmark proportions differ from source; original preserved.')
    factor = WIDTH_MM/source_width
    cx, cy = (lo.x+hi.x)/2, (lo.y+hi.y)/2
    # The original SVG importer yields readable XY outlines with top toward +Y.
    # To read the underside with the hinge toward the top, right is local -X.
    # Flip X only: local Y=pi, NOT X=pi. Root Y=pi then presents it upright.
    points = [(CENTER_XY[0]-(v.x-cx)*factor,
               CENTER_XY[1]+(v.y-cy)*factor, 0) for v in vertices]
    temporary_mesh = bpy.data.meshes.new('Wordmark temporary SVG triangulation')
    temporary_mesh.from_pydata(points, [], faces)
    temporary_mesh.update()
    bm = bmesh.new()
    bm.from_mesh(temporary_mesh)
    try:
        bmesh.ops.triangulate(bm, faces=list(bm.faces))
        bm.verts.index_update()
        points = [tuple(vertex.co) for vertex in bm.verts]
        triangles = [tuple(vertex.index for vertex in face.verts) for face in bm.faces]
    finally:
        bm.free()
        bpy.data.meshes.remove(temporary_mesh)
    # Long fill triangles otherwise bridge into the convex silver surface.
    # Bisect in physical millimetres before projecting each vertex.
    points, triangles = subdivide_triangles(points, triangles, MAX_EDGE_MM)
    bpy.context.view_layer.update()
    tree = BVHTree.FromObject(cover, bpy.context.evaluated_depsgraph_get())
    to_base = cover.matrix_local.copy()
    to_cover = to_base.inverted()
    direction = (to_cover.to_3x3() @ Vector((0, 0, 1))).normalized()
    projected = []
    for x, y, _z in points:
        origin = to_cover @ Vector((x, y, -20))
        hit, _normal, _index, _distance = tree.ray_cast(origin, direction)
        if hit is None:
            raise RuntimeError('Wordmark misses the cover at a projected vertex; original preserved.')
        surface = to_base @ hit
        projected.append((x, y, surface.z-INK_OFFSET_MM))
    # Underside normals point toward -Z. The projection preserves signed XY area.
    faces = []
    for a, b, c in triangles:
        pa, pb, pc = projected[a], projected[b], projected[c]
        signed = (pb[0]-pa[0])*(pc[1]-pa[1])-(pb[1]-pa[1])*(pc[0]-pa[0])
        faces.append((a, c, b) if signed > 0 else (a, b, c))
    mesh = bpy.data.meshes.new('Sourced Nintendo 3DS XL wordmark')
    mesh.from_pydata(projected, [], faces)
    mesh.update()
    ink = bpy.data.materials.get('Underside black wordmark') or bpy.data.materials.new('Underside black wordmark')
    ink.use_nodes = True
    shader = ink.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (.007, .008, .009, 1)
    shader.inputs['Metallic'].default_value = 0
    shader.inputs['Roughness'].default_value = .60
    ink.diffuse_color = (.007, .008, .009, 1)
    mesh.materials.append(ink)
    obj = bpy.data.objects.new('Bottom branding replacement', mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = base
    obj['source'] = 'https://commons.wikimedia.org/wiki/File:Nintendo_3DS_XL_logo.svg'
    obj['source_attribution'] = 'Nintendo; Commons source cites SPR_EN_NA.pdf'
    obj['source_sha256'] = SOURCE_SHA256
    obj['wordmark_width_mm'] = WIDTH_MM
    obj['placement_estimated_from'] = 'User supplied underside photo image-5.png'
    obj['orientation'] = 'Readable from underside with hinge toward +Y; glyph-right is -X'
    old = bpy.data.objects.get('Bottom branding')
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
    obj.name = 'Bottom branding'
    bpy.context.view_layer.update()
    print({'wordmark': obj.name, 'width_mm': WIDTH_MM,
           'height_mm': source_height*factor, 'center_xy_mm': CENTER_XY,
           'vertices': len(mesh.vertices), 'triangles': len(mesh.polygons),
           'source': str(SOURCE), 'saved': False, 'exported': False})


if __name__ == '__main__':
    apply_underside_branding()
