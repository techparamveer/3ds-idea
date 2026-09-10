"""Retain the audio insert's source maps with restrained normal strength."""
from pathlib import Path
import bpy
import render_sourced_dimensions as render
import texture_sourced_model as exporter
import curve_sourced_shell as frames

FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'


def main(persist=False,preview=True):
    assert Path(bpy.data.filepath).name=='silver-audio-socket.blend'
    obj=bpy.data.objects['Source_0_part_19'];original=obj.data.materials[0]
    mat=original.copy();mat.name='Sourced audio socket restrained normal'
    normal=next(n for n in mat.node_tree.nodes if n.type=='NORMAL_MAP')
    normal.inputs['Strength'].default_value=.2
    views=render.VIEWS;keep=False
    try:
        obj.data.materials[0]=mat
        render.VIEWS=[('front',0,(-59.5,-160,6.3),(-59.5,-45,6.3),18,0),
                      ('under',0,(-90,-130,-55),(-59.5,-44,5.7),22,0)]
        if preview:render.main('audio-finish-final',resolution=(1000,750))
        if persist:
            root,hinge=bpy.data.objects['3DS_XL'],bpy.data.objects['Hinge']
            root['audio_socket_normal_strength']=.2
            root['source_changes']+=' Audio insert retains its maps with normal strength reduced to 0.2 on an independent material.'
            render.VIEWS=views
            render.main('audio-finish-console',only=['front','underside'],resolution=(1000,750))
            bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'silver-audio-finish.blend'));keep=True
            exporter.export_static(root,hinge,FOLDER/'silver-audio-finish.glb',restore_frames=False,export_attributes=True)
            frames.restore_export_frames(FOLDER/'silver-audio-finish.glb')
    finally:
        render.VIEWS=views
        if not keep:
            obj.data.materials[0]=original;bpy.data.materials.remove(mat)

if __name__=='__main__':main()
