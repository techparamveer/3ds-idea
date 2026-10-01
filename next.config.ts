import type { NextConfig } from 'next';
const config: NextConfig = {
  devIndicators: false, poweredByHeader: false,
  turbopack: { rules: { '*.wgsl': { loaders: ['@vgpu/wgsl/loader-webpack'], as: '*.js' } } },
  // Delivered console models carry a content hash in their names
  // (scripts/pack-model.mjs), so a returning visitor never refetches them.
  async headers() {
    return [{ source: '/models/candidates/:file([\\w-]+\\.[0-9a-f]{12}\\.packed\\.glb)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }];
  },
};
export default config;
