"""Shared OxHack 3D model builder. Runs inside Blender.

Reads scripts/blender/oxhack-logo-contours.json (see extract-oxhack-logo.py).
Every mesh carries a "Logo" UV map in normalized SVG coordinates, so colour
comes from the logo's own gradients and stays put however the object moves.
"""
import json
from pathlib import Path

import bpy


def load_logo(contours_path, logo):
    return json.loads(Path(contours_path).read_text())[logo]


def linear(hex_color):
    def channel(v):
        v /= 255
        return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4
    value = hex_color.lstrip('#')
    return (*[channel(int(value[i:i + 2], 16)) for i in (0, 2, 4)], 1)


def _principled(name):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    return material, next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')


def solid_material(name, hex_color, roughness=.34, metallic=0., emission=0.):
    """A flat logo colour. `emission` keeps it reading as the source colour when unlit."""
    material, bsdf = _principled(name)
    color = linear(hex_color)
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Emission Color'].default_value = color
    bsdf.inputs['Emission Strength'].default_value = emission
    material.diffuse_color = color
    return material


def gradient_material(name, gradient, canvas, alpha=1., roughness=.3, metallic=0., emission=.55):
    """A linear SVG gradient evaluated from the "Logo" UV map in the shader."""
    material, bsdf = _principled(name)
    nodes, links = material.node_tree.nodes, material.node_tree.links
    (x1, y1), (x2, y2) = gradient['p1'], gradient['p2']
    width, height = canvas
    dx, dy = x2 - x1, y2 - y1
    length = dx * dx + dy * dy
    uv = nodes.new('ShaderNodeUVMap')
    uv.uv_map = 'Logo'
    dot = nodes.new('ShaderNodeVectorMath')
    dot.operation = 'DOT_PRODUCT'
    dot.inputs[1].default_value = (dx * width / length, -dy * height / length, 0)
    offset = nodes.new('ShaderNodeMath')
    offset.operation = 'ADD'
    offset.inputs[1].default_value = (-x1 * dx + (height - y1) * dy) / length
    ramp = nodes.new('ShaderNodeValToRGB')
    elements = ramp.color_ramp.elements
    while len(elements) < len(gradient['stops']):
        elements.new(.5)
    for element, (position, color) in zip(elements, gradient['stops']):
        element.position = position
        element.color = linear(color)
    links.new(uv.outputs['UV'], dot.inputs[0])
    links.new(dot.outputs['Value'], offset.inputs[0])
    links.new(offset.outputs[0], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(ramp.outputs['Color'], bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = emission
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Alpha'].default_value = alpha
    if alpha < 1:
        material.surface_render_method = 'BLENDED'
    material.diffuse_color = linear(gradient['stops'][1][1])
    return material


def contour_bounds(contours):
    xs = [p[0] for contour in contours for p in contour]
    ys = [p[1] for contour in contours for p in contour]
    return min(xs), min(ys), max(xs), max(ys)


class LogoSpace:
    """Maps SVG units to Blender units, with `center` at the world origin."""

    def __init__(self, canvas, center, unit):
        self.canvas, self.center, self.unit = canvas, center, unit

    def point(self, x, y):
        return (x - self.center[0]) * self.unit, (self.center[1] - y) * self.unit

    def svg(self, wx, wy):
        return wx / self.unit + self.center[0], self.center[1] - wy / self.unit


def extrude_contours(collection, space, name, contours, z_back, z_front, material, bevel=0., origin=None):
    """A solid mesh between z_back and z_front; the silhouette matches the SVG.

    `origin` is an (x, y) world position for the object's pivot. The mesh stays
    in logo coordinates relative to it, so the rest pose is always the logo.
    """
    ox, oy = origin or (0, 0)
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '2D'
    curve.fill_mode = 'BOTH'
    curve.resolution_u = 1
    half = (z_front - z_back) / 2
    curve.extrude = max(half - bevel, 0)
    curve.bevel_depth = bevel
    curve.bevel_resolution = 2 if bevel else 0
    curve.offset = -bevel  # Bevel inward so the outline does not grow past the logo.
    for contour in contours:
        spline = curve.splines.new('POLY')
        spline.points.add(len(contour) - 1)
        for point, (x, y) in zip(spline.points, contour):
            wx, wy = space.point(x, y)
            point.co = (wx - ox, wy - oy, 0, 1)
        spline.use_cyclic_u = True
    holder = bpy.data.objects.new(name, curve)
    collection.objects.link(holder)
    bpy.context.view_layer.update()
    mesh = bpy.data.meshes.new_from_object(holder.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(holder)
    bpy.data.curves.remove(curve)
    width, height = space.canvas
    mid = (z_front + z_back) / 2
    uv = mesh.uv_layers.new(name='Logo')
    for vertex in mesh.vertices:
        vertex.co.z += mid
    for loop in mesh.loops:
        vertex = mesh.vertices[loop.vertex_index]
        x, y = space.svg(vertex.co.x + ox, vertex.co.y + oy)
        uv.data[loop.index].uv = (x / width, 1 - y / height)
    mesh.materials.clear()
    mesh.materials.append(material)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.location = (ox, oy, 0)
    return obj


def glyph_center(space, glyph):
    x0, y0, x1, y1 = contour_bounds(glyph['face'])
    return space.point((x0 + x1) / 2, (y0 + y1) / 2)
