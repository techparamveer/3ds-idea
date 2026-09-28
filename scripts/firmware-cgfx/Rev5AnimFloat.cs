// Pinned SPICA scalar reader, with a Zone-only ownership fix. The upstream
// SetVector scalar overload assigns its parameter rather than the stored field.
using SPICA.Serialization;
using SPICA.Serialization.Attributes;

namespace SPICA.Formats.CtrGfx.Animation
{
    public class GfxAnimFloat : ICustomSerialization
    {
        [Ignore] private GfxFloatKeyFrameGroup _Value;
        public GfxFloatKeyFrameGroup Value => _Value;
        public GfxAnimFloat() { _Value = new GfxFloatKeyFrameGroup(); }

        void ICustomSerialization.Deserialize(BinaryDeserializer deserializer)
        {
            if (!GfxFloatKeyFrameGroup.DecodeZoneSegments)
            {
                GfxAnimVector.SetVector(deserializer, _Value);
                return;
            }
            uint flags = GfxAnimVector.GetFlagsFromElem(deserializer, deserializer.BaseStream.Position);
            if ((flags & 2) == 0)
                _Value = GfxFloatKeyFrameGroup.ReadGroup(deserializer, (flags & 1) != 0);
        }

        bool ICustomSerialization.Serialize(BinarySerializer serializer)
        {
            GfxAnimVector.WriteVector(serializer, _Value);
            return true;
        }
    }
}
