import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import type { Viewport } from 'next'
 

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Cronus',
  description: '',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
