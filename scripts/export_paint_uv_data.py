"""Capture closed-shell world millimetres and original atlas UVs for scratch baking."""
from pathlib import Path
import bpy,numpy as np
ROOT=Path(__file__).resolve().parents[1]
def main():
 scene=bpy.context.scene;root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge']
 frame=scene.frame_current;saved=[(o,o.matrix_basis.copy(),o.animation_data.action) for o in [root,hinge]]
 try:
  for o,_,_ in saved:o.animation_data.action=None;o.rotation_euler=(0,0,0)
  bpy.context.view_layer.update()
  for kind,name in [('lid','Sourced outer lid'),('cover','Sourced graphite chassis')]:
   obj=bpy.data.objects[name];mesh=obj.data
   points=np.array([list(obj.matrix_world@v.co) for v in mesh.vertices])
   faces=np.array([[mesh.loops[i].vertex_index for i in p.loop_indices] for p in mesh.polygons])
   uv=np.array([[list(mesh.uv_layers[0].data[i].uv) for i in p.loop_indices] for p in mesh.polygons])
   np.savez(ROOT/('.local/paint-'+kind+'-uv.npz'),points=points,faces=faces,uv=uv)
 finally:
  for o,m,a in saved:o.animation_data.action=a
  scene.frame_set(frame)
  for o,m,a in saved:o.matrix_basis=m
  bpy.context.view_layer.update()
if __name__=='__main__':main()
