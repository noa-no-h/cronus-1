import type { Metadata, Viewport } from 'next';
import { Hedvig_Letters_Serif, Inter } from 'next/font/google';
import './globals.css';

const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const serif = Hedvig_Letters_Serif({
  variable: '--font-serif',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'Cronus',
  description:
    'Cronus is an AI-powered time tracking tool that helps you understand how you spend your time.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
