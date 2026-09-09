"""Photo-calibrated control placement; apply once before the lettering pass."""
import bpy
for name,dy in [('A',2.5),('B',3.3),('X',1.9),('Y',2.5)]:
    o=bpy.data.objects['Button_'+name]
    o.location.y+=dy
    o.scale.x*=7.35/o.dimensions.x;o.scale.y*=7.35/o.dimensions.y
    # The recess follows the cap; avoid leaving the old small inset exposed.
    for obj in bpy.data.objects:
        if obj.name.startswith(name+' button recess'):
            obj.location.y+=dy;obj.scale.x*=1.20;obj.scale.y*=1.20
for o in bpy.data.objects:
    if o.name=='Button_Dpad' or o.name.startswith('Dpad direction mark'):o.location.y+=2.4
for name,x in [('SELECT',-27),('START',27)]:bpy.data.objects['Button_'+name].location.x=x
bpy.context.view_layer.update()
print('Updated cap size and row positions from calibrated photographic estimates.')
