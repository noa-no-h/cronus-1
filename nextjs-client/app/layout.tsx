import type { Metadata, Viewport } from 'next';
import { Hedvig_Letters_Serif, Inter } from 'next/font/google';
import './globals.css';

const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const serif = Hedvig_Letters_Serif({
  variable: '--font-serif',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Cronus',
  description:
    'Cronus is an AI-powered time tracking tool that helps you understand how you spend your time.',
  metadataBase: new URL('https://cronushq.com'),
  openGraph: {
    url: 'https://cronus.so',
    siteName: 'Cronus',
    locale: 'en_US',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: 'white',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="!scroll-smooth">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className={`${sans.variable} ${serif.variable} font-sans antialiased`}>
        {children}
        <div id="modal-root" />
      </body>
    </html>
  );
}
