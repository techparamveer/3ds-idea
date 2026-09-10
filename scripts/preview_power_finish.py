"""Reversible comparison of power rim normal and satin roughness changes."""
from pathlib import Path
import importlib
import bpy
import render_sourced_dimensions as renderer
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'
def main():
    assert Path(bpy.data.filepath).name=='silver-power-fit.blend'
    obj=bpy.data.objects['Button_POWER'];old=obj.active_material
    try:
        for label,normal,rough in [('normal',True,False),('roughness',False,True),('both',True,True)]:
            mat=old.copy();mat.name='Power finish trial '+label
            for n in mat.node_tree.nodes:
                if n.type!='TEX_IMAGE' or not n.image:continue
                name=Path(n.image.filepath).name
                if normal and name=='body-etched-normal.png':
                    n.image=bpy.data.images.load(str(FOLDER/'derived-textures/power-rim-normal.png'),check_existing=True);n.image.reload();n.image.colorspace_settings.name='Non-Color'
                if rough and name=='body-legends-metallic-roughness.png':
                    n.image=next(n.image for n in bpy.data.objects['Button_A'].data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE' and n.image and Path(n.image.filepath).name=='abxy-metallic-roughness.png')
            obj.active_material=mat
            importlib.reload(renderer);c=obj.location
            renderer.VIEWS=[('power',-155,(c.x,c.y-30,145),(c.x,c.y,14),26,0)]
            renderer.main('power-finish-'+label)
            obj.active_material=old;bpy.data.materials.remove(mat)
    finally:obj.active_material=old
if __name__=='__main__':main()
