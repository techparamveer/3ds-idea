"""Isolate audio-rim map defects without changing other shared material users."""
from pathlib import Path
import bpy
import render_sourced_dimensions as render


def main():
    assert Path(bpy.data.filepath).name=='silver-audio-socket.blend'
    obj=bpy.data.objects['Source_0_part_19'];original=obj.data.materials[0]
    trial=original.copy();trial.name='Audio rim diagnostic only'
    views=render.VIEWS
    render.VIEWS=[('under',0,(-90,-130,-55),(-59.5,-44,5.7),22,0)]
    try:
        obj.data.materials[0]=trial
        normal=next(n for n in trial.node_tree.nodes if n.type=='NORMAL_MAP')
        bsdf=next(n for n in trial.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        render.main('audio-finish-current',resolution=(1000,750))
        normal.inputs['Strength'].default_value=0
        render.main('audio-finish-no-normal',resolution=(1000,750))
        for link in list(bsdf.inputs['Roughness'].links):trial.node_tree.links.remove(link)
        bsdf.inputs['Roughness'].default_value=.45
        render.main('audio-finish-uniform-roughness',resolution=(1000,750))
        normal.inputs['Strength'].default_value=.2
        render.main('audio-finish-restrained-trial',resolution=(1000,750))
    finally:
        obj.data.materials[0]=original
        bpy.data.materials.remove(trial)
        render.VIEWS=views

if __name__=='__main__':main()
