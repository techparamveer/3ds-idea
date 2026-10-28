import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '3DS XL', description: 'A silver Nintendo 3DS XL. An interactive personal portfolio.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#eae8e4' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
