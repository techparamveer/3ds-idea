import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '3DS XL', description: 'A silver Nintendo 3DS XL. An interactive personal portfolio.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
