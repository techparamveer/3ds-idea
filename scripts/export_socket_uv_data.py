"""Capture chassis triangles for build_socket_surface_maps.py inside Blender."""
from pathlib import Path
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]

def main():
    assert Path(bpy.data.filepath).name in ('silver-socket.blend', 'silver-recess.blend')
    mesh = bpy.data.objects['Sourced graphite chassis'].data
    assert all(len(face.loop_indices) == 3 for face in mesh.polygons)
    points = np.array([vertex.co[:] for vertex in mesh.vertices])
    faces = np.array([[mesh.loops[i].vertex_index for i in face.loop_indices]
                      for face in mesh.polygons])
    uv = np.array([[mesh.uv_layers.active.data[i].uv[:] for i in face.loop_indices]
                   for face in mesh.polygons])
    path = ROOT / '.local/socket-uv-data.npz'
    path.parent.mkdir(parents=True, exist_ok=True)
    np.savez(path, points=points, faces=faces, uv=uv)
    print(str(path), len(points), len(faces))

if __name__ == '__main__':
    main()
