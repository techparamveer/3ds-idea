"""Round the four sourced deck openings while retaining the rest of the chassis."""
from pathlib import Path
import json
import numpy as np
import bpy
import analyze_sourced_rig as reader
import round_sourced_speaker_holes as refinement
import curve_sourced_shell as frames
import texture_sourced_model as exporter
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
CENTRES=np.array([[68.47909546,9.27863503],[60.73775864,1.53730619],[60.73777008,17.01997185],[52.99642944,9.27864456]])
RADIUS=4.0155

def field(p):
 out=p.copy()
 for centre in CENTRES:
  q=p[:,:2]-centre;r=np.linalg.norm(q,axis=1);angle=np.arctan2(q[:,1],q[:,0]);half=np.pi/16
  factor=np.cos(half)/np.cos(np.mod(angle,2*half)-half)
  weight=(1-refinement.smooth(r,4.25,5.1))*refinement.smooth(p[:,2],10.8,11.8)
  out[:,:2]+=q*((1/factor-1)*weight)[:,None]
 return out

def main():
 assert Path(bpy.data.filepath).name=='silver-abxy-ink.blend'
 _,doc,binary=reader.load_glb(FOLDER/'silver-abxy-ink.glb')
 obj=bpy.data.objects['Sourced graphite chassis'];old=obj.data
 node=next(n for n in doc['nodes'] if n.get('name')==obj.name);prim=doc['meshes'][node['mesh']]['primitives'][0];a=prim['attributes']
 p=reader.accessor(doc,binary,a['POSITION']).astype(float)[:,[0,2,1]];p[:,1]*=-1
 n=reader.accessor(doc,binary,a['NORMAL']).astype(float)[:,[0,2,1]];n[:,1]*=-1
 t=reader.accessor(doc,binary,a['TANGENT']).astype(float)[:,[0,2,1,3]];t[:,1]*=-1
 uv=reader.accessor(doc,binary,a['TEXCOORD_0']).astype(float);faces=reader.accessor(doc,binary,prim['indices']).reshape(-1,3)
 original=p.copy();old_faces=len(faces)
 for centre in CENTRES:
  q=p[:,:2]-centre;r=np.linalg.norm(q,axis=1)
  selected=(r>3.8)&(r<4.2)&(p[:,2]>11.8)
  theta=np.round(np.arctan2(q[selected,1],q[selected,0])/(np.pi/8))*(np.pi/8)
  p[selected,:2]=centre+RADIUS*np.stack([np.cos(theta),np.sin(theta)],axis=1)
 correction=float(np.linalg.norm(p-original,axis=1).max());assert correction<.2
 def eligible(a,b):
  return min(a[2],b[2])>10.8 and any(max(np.linalg.norm(a[:2]-c),np.linalg.norm(b[:2]-c))<5.1 for c in CENTRES)
 p,n,t,uv,faces=refinement.refine_speaker_patch(p,n,t,uv,faces,'lid',edge_filter=eligible)
 changed=field(p);cols=[]
 for axis in range(3):
  step=np.zeros(3);step[axis]=.0005;cols.append((field(p+step)-field(p-step))/.001)
 det=np.linalg.det(np.stack(cols,axis=2));assert det.min()>.7
 mesh=bpy.data.meshes.new('Sourced chassis rounded ABXY openings');mesh.from_pydata(changed.tolist(),[],faces.tolist());mesh.update()
 for poly in mesh.polygons:poly.use_smooth=True
 loops=np.array([l.vertex_index for l in mesh.loops]);uv[:,1]=1-uv[:,1]
 mesh.uv_layers.new(name=old.uv_layers[0].name).data.foreach_set('uv',uv[loops].astype(np.float32).ravel())
 mesh.normals_split_custom_set_from_vertices(n.tolist())
 for key,value in [('_FRAME_N',n[:,[0,2,1]].copy()),('_FRAME_T',t[:,[0,2,1]].copy()),('_FRAME_W',t[:,3])]:
  vector=value.ndim==2
  if vector:value[:,2]*=-1
  attr=mesh.attributes.new(key,'FLOAT_VECTOR' if vector else 'FLOAT','POINT');attr.data.foreach_set('vector' if vector else 'value',value.astype(np.float32).ravel())
 for mat in old.materials:mesh.materials.append(mat)
 obj.data=mesh
 report={'centres':CENTRES.tolist(),'radius_mm':RADIUS,'initial_regularization_mm':correction,'refinement_displacement_mm':float(np.linalg.norm(changed-p,axis=1).max()),'minimum_jacobian':float(det.min()),'triangles_before':old_faces,'triangles_after':len(faces),'source_frames':'interpolated and retained'}
 root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge'];root['abxy_openings']=json.dumps(report)
 root['source_changes']+=' Rounded and centred the four ABXY deck openings; other chassis regions, cap positions, materials and textures retained.'
 bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-abxy-openings.blend'))
 exporter.export_static(root,hinge,FOLDER/'silver-abxy-openings.glb',restore_frames=False,export_attributes=True);frames.restore_export_frames(FOLDER/'silver-abxy-openings.glb')
 (FOLDER/'abxy-openings-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':main()
