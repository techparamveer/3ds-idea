"""Isolate normal-map versus geometry defects around the outer cameras."""
import bpy
import importlib
import render_sourced_dimensions as renderer

def main():
    objects=[bpy.data.objects[n] for n in ['Sourced outer lid','Source_0_part_13','Source_0_part_14']]
    originals=[o.active_material for o in objects]
    trial=originals[0].copy()
    for obj in objects:obj.active_material=trial
    try:
        shader=next(n for n in trial.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        for link in list(shader.inputs['Normal'].links):trial.node_tree.links.remove(link)
        importlib.reload(renderer)
        renderer.VIEWS=[('camera-left',0,(-18,-90,180),(-18,-40,21),18,0),('rear',0,(35,250,135),(0,0,10),180,0)]
        renderer.main('outer-housing-all-normal-off')
    finally:
        for obj,original in zip(objects,originals):obj.active_material=original
        bpy.data.materials.remove(trial)

if __name__=='__main__':main()
