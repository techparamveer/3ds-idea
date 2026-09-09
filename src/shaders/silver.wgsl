// One UV unit spans 16 mm, matching the exported color and normal maps.
// Roughness is absolute linear data; preserve the normal map's physical grain.
fn hash(p: vec2f) -> f32 {
  let a = dot(p, vec2f(127.1, 311.7));
  return fract(sin(a) * 43758.5453);
}
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let tiled = fract(uv);
  let pixel = floor(tiled * 512.0);
  let grain = hash(pixel);
  let line = floor(tiled.y * 512.0);
  let segment = floor(tiled.x * 16.0);
  let hair = select(0.0, 0.045, hash(vec2f(segment,line)) > 0.998);
  let roughness = clamp(0.345 + (grain - 0.5) * 0.075 + hair, 0.27, 0.44);
  return vec4f(roughness, roughness, roughness, 1.0);
}
