"""Reversible reduced-fill study at the matched reference camera."""
import bpy,importlib,json
from pathlib import Path
import render_reference_camera

def main(off_axis=False):
    scene=bpy.context.scene;lights=[o for o in scene.objects if o.type=='LIGHT'];saved=[(o,o.data.energy,o.data.size) for o in lights]
    background=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND');old=background.inputs['Strength'].default_value
    try:
        scene.objects['Import fill'].data.energy=1313000 if off_axis else 200000
        scene.objects['Import key'].data.energy=1173750 if off_axis else 750000
        background.inputs['Strength'].default_value=.3 if off_axis else .2
        importlib.reload(render_reference_camera)
        render_reference_camera.main('reference-off-axis' if off_axis else 'reference-reduced-fill',light_offsets=[(-180,210,80),(200,120,70)] if off_axis else None)
        report={'key_energy':scene.objects['Import key'].data.energy,'fill_energy':scene.objects['Import fill'].data.energy,'world_strength':background.inputs['Strength'].default_value,'area_size_mm':180,'scope':'Matched-camera Blender study, not website lighting; original settings restored.'}
        (Path(bpy.data.filepath).parent/('reference-off-axis-study.json' if off_axis else 'reference-lighting-study.json')).write_text(json.dumps(report,indent=2)+'\n')
    finally:
        for o,energy,size in saved:o.data.energy=energy;o.data.size=size
        background.inputs['Strength'].default_value=old
if __name__=='__main__':main()
