import type { NextConfig } from 'next';
const config: NextConfig = { devIndicators: false, poweredByHeader: false, turbopack: { rules: { '*.wgsl': { loaders: ['@vgpu/wgsl/loader-webpack'], as: '*.js' } } } };
export default config;
