// Revision-5 HOME resources have 15 root dictionaries, ending at 0x94.
// SPICA's generic root includes a later Emitters field and reads the first DICT
// header as that sixteenth field. Keep SPICA's typed dictionary/object parsing.
using System.Buffers.Binary;
using System.Security.Cryptography;
using SPICA.Formats.Common;
using SPICA.Formats.CtrGfx;
using SPICA.Serialization;
using SPICA.Serialization.Serializer;

static class LegacyGfxReader {
  const string ZoneCommonSha256="3e2b2896e8439ea88a767e71fedf6921936a49aae724065ac0bc3701a8a4b83e";
  static uint U32(byte[] source,int at) => BinaryPrimitives.ReadUInt32LittleEndian(source.AsSpan(at,4));
  static void Read<T>(BinaryDeserializer reader,GfxDict<T> destination) where T:INamed {
    foreach(var value in reader.Deserialize<GfxDict<T>>()) destination.Add(value);
  }
  public static Gfx Open(string path,bool geometryOnly=false) {
    var source=File.ReadAllBytes(path);
    if(geometryOnly && Convert.ToHexString(SHA256.HashData(source)).ToLowerInvariant()!=ZoneCommonSha256)
      throw new NotSupportedException("Animation omission is limited to the verified Nintendo Zone common CGFX");
    // Restrict the adapter to the observed old root shape. Other versions and
    // roots still take the unmodified pinned parser path.
    if(source.Length<0xa0 || U32(source,8)!=0x05000000 || U32(source,0x94)!=0x54434944) {
      if(geometryOnly)throw new NotSupportedException("Geometry-only extraction requires the verified revision-5 root");
      return Gfx.Open(path);
    }
    if(U32(source,0)!=0x58464743 || BinaryPrimitives.ReadUInt16LittleEndian(source.AsSpan(4,2))!=0xfeff ||
       BinaryPrimitives.ReadUInt16LittleEndian(source.AsSpan(6,2))!=0x14 || U32(source,12)!=source.Length || U32(source,0x14)!=0x41544144)
      throw new InvalidDataException("Invalid legacy CGFX header");
    long dataEnd=0x14L+U32(source,0x18);
    if(dataEnd<0xa0 || dataEnd>source.Length)throw new InvalidDataException("Invalid legacy CGFX DATA bounds");
    for(int index=0;index<15;index++) {
      int slot=0x1c+index*8;uint count=U32(source,slot),relative=U32(source,slot+4);
      if(relative==0){if(count!=0)throw new InvalidDataException("Missing legacy CGFX dictionary");continue;}
      long at=slot+4L+unchecked((int)relative);
      if(at<0x94 || at+12>dataEnd || U32(source,(int)at)!=0x54434944)throw new InvalidDataException("Invalid legacy CGFX dictionary pointer");
      long length=U32(source,(int)at+4),entries=U32(source,(int)at+8);
      if(entries!=count || length<12+(entries+1)*16 || at+length>dataEnd)throw new InvalidDataException("Invalid legacy CGFX dictionary bounds");
    }
    using var input=new MemoryStream(source,false);
    var reader=new BinaryDeserializer(input,new SerializationOptions(LengthPos.BeforePtr,PointerType.SelfRelative));
    reader.Deserialize<GfxHeader>(); // Also establishes SPICA's source version.
    var scene=new Gfx();
    Read(reader,scene.Models);Read(reader,scene.Textures);Read(reader,scene.LUTs);Read(reader,scene.Materials);Read(reader,scene.Shaders);
    Read(reader,scene.Cameras);Read(reader,scene.Lights);Read(reader,scene.Fogs);Read(reader,scene.Scenes);
    if(geometryOnly) {
      // The six animation dictionaries occupy root slots 9..14. Model, texture,
      // material and scene dictionaries above are still parsed by SPICA. Do not
      // deserialize the unresolved curve or silently publish animation clips.
      input.Position=0x94;
    } else {
      Read(reader,scene.SkeletalAnimations);Read(reader,scene.MaterialAnimations);Read(reader,scene.VisibilityAnimations);
      Read(reader,scene.CameraAnimations);Read(reader,scene.LightAnimations);Read(reader,scene.FogAnimations);
    }
    if(input.Position!=0x94)throw new InvalidDataException("Unexpected legacy CGFX root size");
    return scene;
  }
}
