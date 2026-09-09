import type { Metadata } from 'next';
import Console from '@/components/Console';

export const metadata: Metadata = {
  title: '3DS XL — source rig inspection',
  description: 'Geometry and interaction inspection of the Joshua P. 3DS XL rig. Source textures are pending.',
  robots: { index: false, follow: false },
};

export default function SourcePreview() {
  return <Console modelUrl="/models/candidates/joshua-xl.glb" />;
}
