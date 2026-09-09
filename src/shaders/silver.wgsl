// Subtle metallic paint grain and sparse hairline scratches; linear roughness.
fn hash(p: vec2f) -> f32 {
  let a = dot(p, vec2f(127.1, 311.7));
  return fract(sin(a) * 43758.5453);
}
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let pixel = floor(uv * 1024.0);
  let grain = hash(pixel);
  let line = floor(uv.y * 790.0);
  let segment = floor(uv.x * 31.0);
  let hair = select(0.0, 0.08, hash(vec2f(segment,line)) > 0.989);
  let roughness = clamp(0.285 + (grain - 0.5) * 0.075 + hair, 0.24, 0.42);
  return vec4f(roughness, roughness, roughness, 1.0);
}
