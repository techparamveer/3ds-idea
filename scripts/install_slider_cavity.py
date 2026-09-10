"""Install bounded source-glyph cavity shading on the inner lid alone."""
from pathlib import Path
import bpy,json
import texture_sourced_model as exporter
import curve_sourced_shell as frames
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
 assert Path(bpy.data.filepath).name=='silver-rubber.blend'
 mat=bpy.data.objects['Sourced inner lid'].data.materials[0]
 assert mat.users==1
 replacements={'body-etched-basecolor.png':('body-slider-basecolor.png','sRGB'),'body-etched-normal.png':('body-slider-dot-normal.png','Non-Color')};done=[]
 for node in mat.node_tree.nodes:
  if node.type!='TEX_IMAGE' or node.image is None:continue
  pair=replacements.get(Path(node.image.filepath).name)
  if pair is None:continue
  image=bpy.data.images.load(str(FOLDER/'derived-textures'/pair[0]),check_existing=False);image.colorspace_settings.name=pair[1];image.pack();node.image=image;done.append(pair[0])
 assert len(done)==2
 root=bpy.data.objects['3DS_XL'];hinge=bpy.data.objects['Hinge'];root['slider_cavities']=json.dumps(json.loads((FOLDER/'slider-cavity-report.json').read_text()))
 root['source_changes']+=' Bounded 3D/OFF and triangular-indicator cavity colour; corrected OFF-dot relief direction; glyph outlines retained.'
 bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-slider.blend'))
 exporter.export_static(root,hinge,FOLDER/'silver-slider.glb',restore_frames=False,export_attributes=True);frames.restore_export_frames(FOLDER/'silver-slider.glb')
if __name__=='__main__':main()
