import type { Metadata } from 'next';
import Console from '@/components/Console';

export const metadata: Metadata = {
  title: '3DS XL — source rig inspection',
  description: 'Textured silver adaptation of the Joshua P. 3DS XL rig with live displays and controls.',
  robots: { index: false, follow: false },
};

export default function SourcePreview() {
  return <Console modelUrl="/models/candidates/joshua-xl.glb" />;
}
