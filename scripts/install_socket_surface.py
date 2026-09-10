"""Install baked socket maps on the separately refined recess checkpoint."""
from pathlib import Path
import json
import bpy
import texture_sourced_model as exporter
import curve_sourced_shell as frames
ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'model/candidates/joshua-xl'
def main():
 assert Path(bpy.data.filepath).name=='silver-socket.blend'
 obj=bpy.data.objects['Sourced graphite chassis'];material=obj.data.materials[0].copy();material.name='Sourced graphite socket finish'
 replacements={'body-etched-basecolor.png':'basecolor','body-etched-normal.png':'normal','body-legends-metallic-roughness.png':'metallic-roughness'}
 replaced=[]
 for node in material.node_tree.nodes:
  if node.type!='TEX_IMAGE' or node.image is None:continue
  kind=replacements.get(Path(node.image.filepath).name)
  if kind is None:continue
  image=bpy.data.images.load(str(FOLDER/'derived-textures'/('body-socket-'+kind+'.png')),check_existing=False)
  image.colorspace_settings.name='sRGB' if kind=='basecolor' else 'Non-Color';image.pack();node.image=image;replaced.append(kind)
 assert len(replaced)==3
 obj.data.materials[0]=material
 root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge']
 root['socket_surface']=json.dumps(json.loads((FOLDER/'socket-surface-report.json').read_text()))
 root['source_changes']+=' Localized matte graphite socket finish with attenuated baked normal relief; independent chassis material and bounded image edits.'
 bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-recess.blend'))
 exporter.export_static(root,hinge,FOLDER/'silver-recess.glb',restore_frames=False,export_attributes=True)
 frames.restore_export_frames(FOLDER/'silver-recess.glb')
if __name__=='__main__':main()
