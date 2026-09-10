"""Install independently audited smooth engraving maps from silver-legends.blend."""
from pathlib import Path
import json,hashlib
import bpy
import texture_sourced_model as exporter
import curve_sourced_shell as frames

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def main():
    assert Path(bpy.data.filepath).resolve()==(FOLDER/'silver-legends.blend').resolve()
    audit=json.loads((FOLDER/'etched-pixel-audit.json').read_text())
    for name,entry in audit['maps'].items():
        assert entry['outside_edit_changed']==0
        assert hashlib.sha256((FOLDER/'derived-textures'/('body-etched-'+name+'.png')).read_bytes()).hexdigest()==entry['sha256']
    source=bpy.data.materials['Sourced silver photographic lower-key legends']
    material=source.copy();material.name='Sourced silver fitted etched legends'
    replaced=[]
    for node in material.node_tree.nodes:
        if node.type!='TEX_IMAGE' or not node.image:continue
        for name in audit['maps']:
            if node.image.name!='Key legends '+name:continue
            node.image=bpy.data.images.load(str(FOLDER/'derived-textures'/('body-etched-'+name+'.png')),check_existing=False)
            node.image.name='Etched legends '+name
            node.image.colorspace_settings.name='sRGB' if name=='basecolor' else 'Non-Color';node.image.pack()
            replaced.append(name);break
    assert sorted(replaced)==['basecolor','normal']
    root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge']
    for obj in root.children_recursive:
        if obj.type=='MESH' and obj.get('source_mesh_index')==0:
            assert obj.data.materials[0]==source;obj.data.materials[0]=material
    root['etched_legends']=json.dumps({'words':['MIC','POWER'],'depth_mm_estimate':.025,
        'cavity_colour_multiplier':.6,'glyph_source':'Manually fitted smooth paths from original-XL photographs; not a verified factory font.',
        'reference':'https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg'})
    root['source_changes']+=' Fitted smooth MIC/POWER recess stencils with bounded colour/normal maps; other artwork and all geometry retained.'
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-etched.blend'))
    output=FOLDER/'silver-etched.glb'
    exporter.export_static(root,hinge,output,restore_frames=False,export_attributes=True)
    frames.restore_export_frames(output)
    print('Saved audited silver-etched checkpoint.')

if __name__=='__main__':main()
