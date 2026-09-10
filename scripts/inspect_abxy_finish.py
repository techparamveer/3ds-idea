"""Reversible ABXY finish diagnostic; never changes other source materials."""
import bpy
import importlib
import render_sourced_dimensions as renderer

def main(normal_strength=0.0,roughness=None):
    objects=[bpy.data.objects['Button_'+key] for key in 'ABXY']
    originals=[o.active_material for o in objects]
    trial=originals[0].copy()
    try:
        for obj in objects:obj.active_material=trial
        for node in trial.node_tree.nodes:
            if node.type=='NORMAL_MAP':node.inputs['Strength'].default_value=normal_strength
            if node.type=='BSDF_PRINCIPLED' and roughness is not None:
                for link in list(node.inputs['Roughness'].links):trial.node_tree.links.remove(link)
                node.inputs['Roughness'].default_value=roughness
        importlib.reload(renderer)
        renderer.VIEWS=[('abxy',-155,(61,-45,150),(61,9,14),33,0)]
        renderer.main('abxy-finish-n'+str(normal_strength)+'-r'+str(roughness))
    finally:
        for obj,original in zip(objects,originals):obj.active_material=original
        bpy.data.materials.remove(trial)

if __name__=='__main__':main()
