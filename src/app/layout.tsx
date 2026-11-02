import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { DemoNoticeBanner } from '@/components/layout/DemoNoticeBanner';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'MediCare — Full-Stack Healthcare Platform',
  description: 'Verified doctor consultations, healthcare store, diagnostics, and patient care platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen bg-slate-50 text-slate-900">
        <Providers>
          <DemoNoticeBanner />
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
