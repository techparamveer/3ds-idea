// Pinned SPICA bd29a78 GfxFloatKeyFrameGroup with a bounded revision-5 Zone
// multi-segment reader. The upstream serializer and ordinary reader remain
// unchanged; only the hash-gated Zone path below decodes every curve pointer.
using SPICA.Formats.Common;
using SPICA.Serialization;
using SPICA.Serialization.Attributes;

using System;
using System.Collections.Generic;
using System.IO;

namespace SPICA.Formats.CtrGfx.Animation
{
    public class GfxFloatKeyFrameGroup : ICustomSerialization
    {
        public sealed class ZoneSegment
        {
            public float StartFrame { get; init; }
            public float EndFrame { get; init; }
            public uint FormatFlags { get; init; }
            public string Quantization { get; init; }
            public List<KeyFrame> Keys { get; init; }
        }

        public sealed class ZoneGroup
        {
            public long Offset { get; init; }
            public List<ZoneSegment> Segments { get; init; }
        }

        public static bool DecodeZoneSegments;
        public static readonly List<ZoneGroup> ZoneGroups = new List<ZoneGroup>();
        private float _StartFrame;
        private float _EndFrame;

        public GfxLoopType PreRepeat;
        public GfxLoopType PostRepeat;

        private ushort Padding;

        private enum KeyFrameCurveFlags : uint
        {
            IsConstantValue  = 1 << 1,
            IsQuantizedCurve = 1 << 2
        }

        private KeyFrameCurveFlags CurveFlags;

        [Ignore] public float StartFrame;
        [Ignore] public float EndFrame;

        [Ignore] public bool IsLinear;

        [Ignore] public KeyFrameQuantization Quantization;

        [Ignore] public readonly List<KeyFrame> KeyFrames;

        public bool Exists => KeyFrames.Count > 0;

        public GfxFloatKeyFrameGroup()
        {
            KeyFrames = new List<KeyFrame>();
        }

        void ICustomSerialization.Deserialize(BinaryDeserializer Deserializer)
        {
            if ((CurveFlags & KeyFrameCurveFlags.IsConstantValue) != 0)
            {
                float Value = Deserializer.Reader.ReadSingle();

                KeyFrames.Add(new KeyFrame(0, Value));

                return;
            }

            if (DecodeZoneSegments)
            {
                ReadZoneSegments(Deserializer);
                return;
            }

            int CurveCount = Deserializer.Reader.ReadInt32();

            Deserializer.BaseStream.Seek(Deserializer.ReadPointer(), SeekOrigin.Begin);

            StartFrame = Deserializer.Reader.ReadSingle();
            EndFrame   = Deserializer.Reader.ReadSingle();

            uint  FormatFlags = Deserializer.Reader.ReadUInt32();
            int   KeysCount   = Deserializer.Reader.ReadInt32();
            float InvDuration = Deserializer.Reader.ReadSingle();

            Quantization = (KeyFrameQuantization)(FormatFlags >> 5);

            IsLinear = (FormatFlags & 4) != 0;

            float ValueScale  = 1;
            float ValueOffset = 0;
            float FrameScale  = 1;

            if (Quantization != KeyFrameQuantization.Hermite128       &&
                Quantization != KeyFrameQuantization.UnifiedHermite96 &&
                Quantization != KeyFrameQuantization.StepLinear64)
            {
                ValueScale  = Deserializer.Reader.ReadSingle();
                ValueOffset = Deserializer.Reader.ReadSingle();
                FrameScale  = Deserializer.Reader.ReadSingle();
            }

            for (int Index = 0; Index < KeysCount; Index++)
            {
                KeyFrame KF;

                switch (Quantization)
                {
                    case KeyFrameQuantization.Hermite128:       KF = Deserializer.Reader.ReadHermite128();       break;
                    case KeyFrameQuantization.Hermite64:        KF = Deserializer.Reader.ReadHermite64();        break;
                    case KeyFrameQuantization.Hermite48:        KF = Deserializer.Reader.ReadHermite48();        break;
                    case KeyFrameQuantization.UnifiedHermite96: KF = Deserializer.Reader.ReadUnifiedHermite96(); break;
                    case KeyFrameQuantization.UnifiedHermite48: KF = Deserializer.Reader.ReadUnifiedHermite48(); break;
                    case KeyFrameQuantization.UnifiedHermite32: KF = Deserializer.Reader.ReadUnifiedHermite32(); break;
                    case KeyFrameQuantization.StepLinear64:     KF = Deserializer.Reader.ReadStepLinear64();     break;
                    case KeyFrameQuantization.StepLinear32:     KF = Deserializer.Reader.ReadStepLinear32();     break;

                    default: throw new InvalidOperationException($"Invalid Segment quantization {Quantization}!");
                }

                KF.Frame = KF.Frame * FrameScale;
                KF.Value = KF.Value * ValueScale + ValueOffset;

                KeyFrames.Add(KF);
            }
        }

        private void ReadZoneSegments(BinaryDeserializer deserializer)
        {
            Stream stream = deserializer.BaseStream;
            long groupAt = stream.Position;
            int count = deserializer.Reader.ReadInt32();
            if (count < 1 || count > 64 || groupAt + 4L + count * 4L > stream.Length)
                throw new InvalidDataException("Invalid Zone curve segment count");
            long tableEnd = groupAt + 4L + count * 4L;
            var segments = new List<ZoneSegment>();
            bool sawQuantizedSegment = false;
            for (int i = 0; i < count; i++)
            {
                // Revision-5 stores a table of self-relative pointers, one per
                // segment. SPICA's original reader follows only pointer zero.
                stream.Position = groupAt + 4L + i * 4L;
                long segmentAt = deserializer.ReadPointer();
                if (segmentAt < tableEnd || segmentAt + 16 > stream.Length)
                    throw new InvalidDataException("Invalid Zone curve segment pointer");
                stream.Position = segmentAt;
                float start = deserializer.Reader.ReadSingle();
                float end = deserializer.Reader.ReadSingle();
                uint flags = deserializer.Reader.ReadUInt32();
                if (!float.IsFinite(start) || !float.IsFinite(end) || end < start ||
                    (segments.Count > 0 && start < segments[segments.Count - 1].EndFrame))
                    throw new InvalidDataException("Invalid Zone curve segment frames");
                var keys = new List<KeyFrame>();
                string quantization = "Constant";
                // Flag 1 is a 16-byte constant segment, including zero-length
                // boundary holds. Treating its value as KeysCount caused the
                // original Hermite128 EndOfStreamException.
                if (flags == 1)
                {
                    float value = deserializer.Reader.ReadSingle();
                    if (!float.IsFinite(value)) throw new InvalidDataException("Invalid Zone constant curve value");
                    keys.Add(new KeyFrame(start, value));
                }
                else
                {
                    if ((flags & 0x1f) != 0 && (flags & 0x1f) != 4 && (flags & 0x1f) != 8)
                        throw new InvalidDataException($"Unsupported Zone curve flags {flags:x}");
                    if (segmentAt + 20 > stream.Length) throw new InvalidDataException("Truncated Zone curve header");
                    int keyCount = deserializer.Reader.ReadInt32();
                    float invDuration = deserializer.Reader.ReadSingle();
                    if (keyCount < 1 || keyCount > 4096 ||
                        (!float.IsFinite(invDuration) && !(start == end && float.IsPositiveInfinity(invDuration))))
                        throw new InvalidDataException($"Invalid Zone curve key count or duration at {groupAt:x}/{segmentAt:x}: {keyCount}, {invDuration}, flags {flags:x}");
                    var format = (KeyFrameQuantization)(flags >> 5);
                    quantization = format.ToString();
                    float valueScale = 1, valueOffset = 0, frameScale = 1;
                    if (format != KeyFrameQuantization.Hermite128 &&
                        format != KeyFrameQuantization.UnifiedHermite96 &&
                        format != KeyFrameQuantization.StepLinear64)
                    {
                        if (stream.Position + 12 > stream.Length) throw new InvalidDataException("Truncated Zone curve scale");
                        valueScale = deserializer.Reader.ReadSingle();
                        valueOffset = deserializer.Reader.ReadSingle();
                        frameScale = deserializer.Reader.ReadSingle();
                    }
                    int bytesPerKey = format switch {
                        KeyFrameQuantization.Hermite128 => 16,
                        KeyFrameQuantization.Hermite64 => 8,
                        KeyFrameQuantization.Hermite48 => 6,
                        KeyFrameQuantization.UnifiedHermite96 => 12,
                        KeyFrameQuantization.UnifiedHermite48 => 6,
                        KeyFrameQuantization.UnifiedHermite32 => 4,
                        KeyFrameQuantization.StepLinear64 => 8,
                        KeyFrameQuantization.StepLinear32 => 4,
                        _ => 0
                    };
                    if (bytesPerKey == 0 || stream.Position + (long)keyCount * bytesPerKey > stream.Length)
                        throw new InvalidDataException("Truncated or unsupported Zone curve keys");
                    float prior = float.NegativeInfinity;
                    for (int keyIndex = 0; keyIndex < keyCount; keyIndex++)
                    {
                        KeyFrame key = format switch {
                            KeyFrameQuantization.Hermite128 => deserializer.Reader.ReadHermite128(),
                            KeyFrameQuantization.Hermite64 => deserializer.Reader.ReadHermite64(),
                            KeyFrameQuantization.Hermite48 => deserializer.Reader.ReadHermite48(),
                            KeyFrameQuantization.UnifiedHermite96 => deserializer.Reader.ReadUnifiedHermite96(),
                            KeyFrameQuantization.UnifiedHermite48 => deserializer.Reader.ReadUnifiedHermite48(),
                            KeyFrameQuantization.UnifiedHermite32 => deserializer.Reader.ReadUnifiedHermite32(),
                            KeyFrameQuantization.StepLinear64 => deserializer.Reader.ReadStepLinear64(),
                            KeyFrameQuantization.StepLinear32 => deserializer.Reader.ReadStepLinear32(),
                            _ => throw new InvalidDataException("Unsupported Zone curve quantization")
                        };
                        // Source key frames are local to their segment. The
                        // 0x6a44 sequence has 80..600 with local 0,200,400,520.
                        key.Frame = start + key.Frame * frameScale;
                        key.Value = key.Value * valueScale + valueOffset;
                        if (!float.IsFinite(key.Frame) || !float.IsFinite(key.Value) ||
                            !float.IsFinite(key.InSlope) || !float.IsFinite(key.OutSlope) ||
                            key.Frame < prior || key.Frame < start - 0.001f || key.Frame > end + 0.001f)
                            throw new InvalidDataException("Invalid Zone curve key");
                        prior = key.Frame;
                        keys.Add(key);
                    }
                    if (!sawQuantizedSegment)
                    {
                        Quantization = format;
                        IsLinear = (flags & 4) != 0;
                        sawQuantizedSegment = true;
                    }
                }
                segments.Add(new ZoneSegment { StartFrame = start, EndFrame = end,
                    FormatFlags = flags, Quantization = quantization, Keys = keys });
                KeyFrames.AddRange(keys);
            }
            StartFrame = segments[0].StartFrame;
            EndFrame = segments[segments.Count - 1].EndFrame;
            ZoneGroups.Add(new ZoneGroup { Offset = groupAt, Segments = segments });
        }

        bool ICustomSerialization.Serialize(BinarySerializer Serializer)
        {
            float MinFrame = KeyFrames.Count > 0 ? KeyFrames[0].Frame : 0;
            float MaxFrame = KeyFrames.Count > 0 ? KeyFrames[0].Frame : 0;
            float MinValue = KeyFrames.Count > 0 ? KeyFrames[0].Value : 0;
            float MaxValue = KeyFrames.Count > 0 ? KeyFrames[0].Value : 0;

            for (int Index = 1; Index < KeyFrames.Count; Index++)
            {
                KeyFrame KF = KeyFrames[Index];

                if (KF.Frame < MinFrame) MinFrame = KF.Frame;
                if (KF.Frame > MaxFrame) MaxFrame = KF.Frame;
                if (KF.Value < MinValue) MinValue = KF.Value;
                if (KF.Value > MaxValue) MaxValue = KF.Value;
            }

            float ValueScale  = KeyFrameQuantizationHelper.GetValueScale(Quantization, MaxValue - MinValue);
            float FrameScale  = KeyFrameQuantizationHelper.GetFrameScale(Quantization, MaxFrame - MinFrame);

            float ValueOffset = MinValue;

            float InvDuration = 1f / EndFrame;

            if (ValueScale == 1)
            {
                /*
                    * Quantizations were the value scale is not needed (like the ones that already stores the value
                    * as float) will ignore the offset aswell, so we need to set to to zero.
                    */
                ValueOffset = 0;
            }

            _StartFrame = StartFrame;
            _EndFrame   = EndFrame;

            CurveFlags = KeyFrames.Count < 2
                ? KeyFrameCurveFlags.IsConstantValue
                : KeyFrameCurveFlags.IsQuantizedCurve;

            uint FormatFlags = ((uint)Quantization << 5) | (KeyFrames.Count == 1 ? 1u : 0u);

            if (Quantization >= KeyFrameQuantization.StepLinear64)
            {
                FormatFlags |= IsLinear ? 4u : 0u;
            }
            else
            {
                FormatFlags |= 8;
            }

            Serializer.Writer.Write(_StartFrame);
            Serializer.Writer.Write(_EndFrame);

            Serializer.Writer.Write((byte)PreRepeat);
            Serializer.Writer.Write((byte)PostRepeat);

            Serializer.Writer.Write(Padding);

            Serializer.Writer.Write((uint)CurveFlags);

            if (KeyFrames.Count < 2)
            {
                if (KeyFrames.Count > 0)
                    Serializer.Writer.Write(KeyFrames[0].Value);
                else
                    Serializer.Writer.Write(0f);

                return true;
            }

            Serializer.Writer.Write(1); //Curve Count
            Serializer.Writer.Write(4); //Curve Rel Ptr

            Serializer.Writer.Write(StartFrame);
            Serializer.Writer.Write(EndFrame);
            Serializer.Writer.Write(FormatFlags);
            Serializer.Writer.Write(KeyFrames.Count);
            Serializer.Writer.Write(InvDuration);

            if (Quantization != KeyFrameQuantization.Hermite128       &&
                Quantization != KeyFrameQuantization.UnifiedHermite96 &&
                Quantization != KeyFrameQuantization.StepLinear64)
            {
                Serializer.Writer.Write(ValueScale);
                Serializer.Writer.Write(ValueOffset);
                Serializer.Writer.Write(FrameScale);
            }

            foreach (KeyFrame Key in KeyFrames)
            {
                KeyFrame KF = Key;

                KF.Frame = (KF.Frame / FrameScale);
                KF.Value = (KF.Value - ValueOffset) / ValueScale;

                switch (Quantization)
                {
                    case KeyFrameQuantization.Hermite128:       Serializer.Writer.WriteHermite128(KF);       break;
                    case KeyFrameQuantization.Hermite64:        Serializer.Writer.WriteHermite64(KF);        break;
                    case KeyFrameQuantization.Hermite48:        Serializer.Writer.WriteHermite48(KF);        break;
                    case KeyFrameQuantization.UnifiedHermite96: Serializer.Writer.WriteUnifiedHermite96(KF); break;
                    case KeyFrameQuantization.UnifiedHermite48: Serializer.Writer.WriteUnifiedHermite48(KF); break;
                    case KeyFrameQuantization.UnifiedHermite32: Serializer.Writer.WriteUnifiedHermite32(KF); break;
                    case KeyFrameQuantization.StepLinear64:     Serializer.Writer.WriteStepLinear64(KF);     break;
                    case KeyFrameQuantization.StepLinear32:     Serializer.Writer.WriteStepLinear32(KF);     break;
                }
            }

            while ((Serializer.BaseStream.Position & 3) != 0) Serializer.BaseStream.WriteByte(0);

            return true;
        }

        internal static GfxFloatKeyFrameGroup ReadGroup(BinaryDeserializer Deserializer, bool Constant)
        {
            GfxFloatKeyFrameGroup FrameGrp = new GfxFloatKeyFrameGroup();

            if (Constant)
            {
                FrameGrp.KeyFrames.Add(new KeyFrame(0, Deserializer.Reader.ReadSingle()));
            }
            else
            {
                uint Address = Deserializer.ReadPointer();

                Deserializer.BaseStream.Seek(Address, SeekOrigin.Begin);

                FrameGrp = Deserializer.Deserialize<GfxFloatKeyFrameGroup>();
            }

            return FrameGrp;
        }
    }
}
