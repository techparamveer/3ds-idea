// Offline asset exporter using SPICA's Unlicense parser. No firmware code is executed.
using System.Collections;
using System.Numerics;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;
using SPICA.Formats.CtrGfx;
using SPICA.Formats.CtrGfx.Model;
using SPICA.Formats.CtrH3D;
using SPICA.Formats.CtrH3D.Model.Mesh;
using SPICA.PICA.Converters;
using SPICA.PICA.Commands;
using SPICA.PICA;

static class Exporter {
  static readonly JsonSerializerOptions Json = new() { WriteIndented=false };
  static float[] V(Vector4 v) => new[]{v.X,v.Y,v.Z,v.W};
  static uint[] LutWords(object sampler) {
    var bytes=(byte[])sampler.GetType().GetField("RawCommands",BindingFlags.NonPublic|BindingFlags.Instance).GetValue(sampler);
    var commands=new uint[bytes.Length/4];Buffer.BlockCopy(bytes,0,commands,0,bytes.Length);
    var reader=new PICACommandReader(commands);var words=new uint[256];int index=0;
    while(reader.HasCommand) {
      var command=reader.GetCommand();
      if(command.Register==PICARegister.GPUREG_LIGHTING_LUT_INDEX) index=(int)(command.Parameters[0]&255);
      else if(command.Register>=PICARegister.GPUREG_LIGHTING_LUT_DATA0&&command.Register<=PICARegister.GPUREG_LIGHTING_LUT_DATA7)
        foreach(uint value in command.Parameters) {if(index>=256)throw new InvalidDataException("LUT overflow");words[index++]=value;}
    }
    return words;
  }
  static object Clean(object value, int depth=0) {
    if(value==null || depth>24) return null;
    Type t=value.GetType();
    if(t.IsEnum) return value.ToString();
    if(value is string || value is bool || t.IsPrimitive || value is decimal) return value;
    if(value is byte[] bytes) return Convert.ToBase64String(bytes);
    if(value is IEnumerable enumerable) { var result=new List<object>(); foreach(object entry in enumerable) result.Add(Clean(entry,depth+1)); return result; }
    var obj=new SortedDictionary<string,object>();
    foreach(var field in t.GetFields(BindingFlags.Public|BindingFlags.Instance)) obj[field.Name]=Clean(field.GetValue(value),depth+1);
    foreach(var property in t.GetProperties(BindingFlags.Public|BindingFlags.Instance)) {
      if(property.GetIndexParameters().Length>0 || property.GetMethod==null) continue;
      try { obj[property.Name]=Clean(property.GetValue(value),depth+1); } catch {}
    }
    return obj;
  }
  public static int Main(string[] args) {
    if(args.Length!=2) { Console.Error.WriteLine("Exporter input.bcres output-directory");return 2; }
    var source=File.ReadAllBytes(args[0]);
    if(source.Length<20 || System.Text.Encoding.ASCII.GetString(source,0,4)!="CGFX") throw new InvalidDataException("Expected decompressed CGFX");
    var native=LegacyGfxReader.Open(args[0]);
    var scene=native.ToH3D();
    Directory.CreateDirectory(args[1]);
    var textures=new List<object>();
    for(int i=0;i<scene.Textures.Count;i++) {
      var texture=scene.Textures[i];
      if(texture.IsCubeTexture) throw new NotSupportedException("Cube textures require six-face delivery");
      var rgba=texture.ToRGBA();
      // SPICA DecodeBuffer returns bottom-up RGBA for OpenGL. PNG writer flips rows.
      File.WriteAllBytes(Path.Combine(args[1],$"texture-{i}.rgba"),rgba);
      textures.Add(new {name=texture.Name,url=$"texture-{i}.png",width=texture.Width,height=texture.Height,format=texture.Format.ToString(),bottomUp=true});
    }
    var models=new List<object>();
    foreach(var model in scene.Models) {
      var meshes=new List<object>();
      foreach(var mesh in model.Meshes) {
        var vertices=VerticesConverter.GetVertices(mesh);
        // SPICA's vertex decoder only applies fixed bone attributes; preserve other fixed inputs too.
        foreach(var attr in mesh.FixedAttributes ?? new List<PICAFixedAttribute>()) {
          for(int i=0;i<vertices.Length;i++) {
            var v=new Vector4(attr.Value.X,attr.Value.Y,attr.Value.Z,attr.Value.W);
            switch(attr.Name) {case PICAAttributeName.Color: vertices[i].Color=v;break;case PICAAttributeName.Normal:vertices[i].Normal=v;break;}
          }
        }
        meshes.Add(new {material=mesh.MaterialIndex,node=mesh.NodeIndex,layer=mesh.Layer,priority=mesh.Priority,
          position=vertices.Select(v=>V(v.Position).Take(3).ToArray()),normal=vertices.Select(v=>V(v.Normal).Take(3).ToArray()),
          color=vertices.Select(v=>V(v.Color)),uv0=vertices.Select(v=>V(v.TexCoord0).Take(2).ToArray()),uv1=vertices.Select(v=>V(v.TexCoord1).Take(2).ToArray()),uv2=vertices.Select(v=>V(v.TexCoord2).Take(2).ToArray()),
          joints=vertices.Select(v=>Enumerable.Range(0,4).Select(i=>v.Indices[i]).ToArray()),weights=vertices.Select(v=>Enumerable.Range(0,4).Select(i=>v.Weights[i]).ToArray()),
          submeshes=mesh.SubMeshes.Select(s=>new {indices=s.Indices,bones=s.BoneIndices.Take(s.BoneIndicesCount),skinning=s.Skinning.ToString(),primitive=s.PrimitiveMode.ToString()})});
      }
      var sourceModel=native.Models.First(m=>m.Name==model.Name);
      var materials=model.Materials.Select((mat,i)=>{var clean=(SortedDictionary<string,object>)Clean(mat); clean["ConstantAssignments"]=sourceModel.Materials[i].FragmentShader.TextureEnvironments.Select(stage=>(int)stage.Constant).ToArray();return clean;});
      // ToH3D copies bone transforms but drops BillboardMode. Preserve the native
      // enum by bone identity, including BannerFolder/Text's ScreenViewpoint.
      var skeleton=model.Skeleton.Select(bone=>{var clean=(SortedDictionary<string,object>)Clean(bone);if(sourceModel is GfxModelSkeletal skeletal)clean["BillboardMode"]=skeletal.Skeleton.Bones.First(b=>b.Name==bone.Name).BillboardMode.ToString();return clean;});
      models.Add(new{name=model.Name,transform=Clean(model.WorldTransform),skeleton,materials,nodes=Clean(model.MeshNodesVisibility),nodeNames=Clean(model.MeshNodesTree),meshes});
    }
    // Retain PICA interpolation words and the native zero-based light subtype;
    // ToH3D drops the former and incorrectly ORs the latter into a one-based enum.
    var luts=scene.LUTs.Select(lut=>new{Name=lut.Name,Samplers=lut.Samplers.Select(s=>new{s.Name,Flags=s.Flags.ToString(),s.Table,RawWords=LutWords(native.LUTs.First(l=>l.Name==lut.Name).Samplers.First(n=>n.Name==s.Name))})});
    var lights=scene.Lights.Select(light=>{var clean=(SortedDictionary<string,object>)Clean(light);var original=native.Lights.First(l=>l.Name==light.Name);var type=original.GetType().GetField("Type");if(type!=null)clean["NativeType"]=type.GetValue(original).ToString();return clean;});
    var result=new{schema=1,sourceSha256=Convert.ToHexString(SHA256.HashData(source)).ToLowerInvariant(),
      converter="SPICA headless CGFX exporter",models,textures,luts,cameras=Clean(scene.Cameras),lights,
      skeletalAnimations=Clean(scene.SkeletalAnimations),materialAnimations=Clean(scene.MaterialAnimations),visibilityAnimations=Clean(scene.VisibilityAnimations),cameraAnimations=Clean(scene.CameraAnimations)};
    File.WriteAllText(Path.Combine(args[1],"model.json"),JsonSerializer.Serialize(result,Json));
    Console.WriteLine($"Exported {scene.Models.Count} models, {scene.Textures.Count} textures, {scene.SkeletalAnimations.Count} skeletal, {scene.MaterialAnimations.Count} material animations");
    return 0;
  }
}
