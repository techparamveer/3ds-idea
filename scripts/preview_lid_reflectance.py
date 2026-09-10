"""Isolate upper-lid specular contribution in the matched camera."""
import bpy,importlib
import render_reference_camera

def main(roughness=None):
    obj=bpy.data.objects['Sourced inner lid'];old=obj.active_material;mat=old.copy();mat.name='Upper lid no-specular diagnostic'
    try:
        shader=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');socket=shader.inputs['Specular IOR Level'] if roughness is None else shader.inputs['Roughness']
        for link in list(socket.links):mat.node_tree.links.remove(link)
        socket.default_value=0 if roughness is None else roughness;obj.active_material=mat
        importlib.reload(render_reference_camera);render_reference_camera.main('reference-lid-no-specular' if roughness is None else 'reference-lid-roughness')
    finally:obj.active_material=old;bpy.data.materials.remove(mat)
if __name__=='__main__':main()
