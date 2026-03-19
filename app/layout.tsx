// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { Header } from '@/view/layout/header';
import { Footer } from '@/view/layout/footer';
import Script from 'next/script';
import { Providers } from '@/components/Providers';

const appUrl =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000';

export const metadata: Metadata = {
  title: "Raffel's Sandwich",
  description: "Order management for Raffel's Sandwich.",
  metadataBase: new URL(appUrl),
  openGraph: {
    type: 'website',
    title: "Raffel's Sandwich",
    description: "Order management for Raffel's Sandwich.",
    url: appUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: "Raffel's Sandwich",
    description: "Order management for Raffel's Sandwich.",
  },
  themeColor: '#111827',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Toaster position="top-center" />
        <ShadcnToaster />

        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>

        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}