import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Space_Grotesk } from 'next/font/google';
import './globals.css';

// Bricolage Grotesque is the closest free alternative to Acma (elegant grotesk
// with strong contrasts) — used for headlines.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '600', '700', '800'],
});

// Space Grotesk is the closest free alternative to Guaruja Grotesk — used for
// body copy.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Civic Futures · Center for Civic Futures',
  description: 'Share your vision for a better civic future',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#fff9ee',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
