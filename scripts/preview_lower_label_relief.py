"""Reversible lower-key engraving study; never changes the saved model or GLB.

The independent Dejiki original-XL photo shows narrow light/dark label edges.
Depths are appearance trials, not factory measurements. Existing photographic
stencils retain their known low-resolution defects.
"""
from pathlib import Path
import importlib,json
import bpy
import render_sourced_dimensions as renderer
FOLDER=Path(__file__).resolve().parents[1]/'model/candidates/joshua-xl'

def main():
    assert Path(bpy.data.filepath).name=='silver-lid-face.blend'
    controls=[bpy.data.objects[n] for n in ['Button_SELECT','Button_HOME','Button_START']]
    saved=[o.data.materials[0] for o in controls]
    assert all(m==saved[0] for m in saved)
    trial=saved[0].copy();trial.name='Temporary lower-key recessed label study'
    nodes,links=trial.node_tree.nodes,trial.node_tree.links
    texture=nodes.new('ShaderNodeTexImage')
    stencil=bpy.data.images.load(str(FOLDER/'derived-textures/body-legends-ink-mask.png'),check_existing=False)
    stencil.colorspace_settings.name='Non-Color';texture.image=stencil
    bump=nodes.new('ShaderNodeBump');bump.invert=True
    links.new(texture.outputs['Color'],bump.inputs['Height'])
    shader=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    normal=shader.inputs['Normal'].links[0].from_socket
    links.new(normal,bump.inputs['Normal']);links.new(bump.outputs['Normal'],shader.inputs['Normal'])
    try:
        for depth in [0,.02,.05]:
            for o in controls:o.data.materials[0]=saved[0] if depth==0 else trial
            bump.inputs['Distance'].default_value=depth
            importlib.reload(renderer)
            renderer.VIEWS=[('keys',-155,(0,-40,160),(0,-40,14),95,0)]
            renderer.main('lower-label-depth-'+str(depth).replace('.','p'),resolution=(1400,650))
        (FOLDER/'lower-label-relief-study.json').write_text(json.dumps({
            'source_checkpoint':'silver-lid-face.blend',
            'reference_url':'https://dejiki.com/2013/07/nintendo-3ds-xl-review/',
            'reference_image':'https://farm4.staticflickr.com/3665/9248853256_d8506f1f7a_z.jpg',
            'depth_trials_mm':[0,.02,.05],
            'method':'Temporary inverted Bump driven by the photographic ink mask, layered over existing normal. Same camera and lighting for all trials.',
            'limits':'Not calibrated depth. Low-resolution stencil remains; no geometry or public asset changes.'},indent=2)+'\n')
    finally:
        for o,m in zip(controls,saved):o.data.materials[0]=m
        bpy.data.materials.remove(trial);bpy.data.images.remove(stencil)
        importlib.reload(renderer)
    print('Lower label relief trials rendered; source bindings restored.')
