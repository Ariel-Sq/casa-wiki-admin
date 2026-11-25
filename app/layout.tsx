import type React from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const workSans = localFont({
  src: './fonts/WorkSans-Variable.woff2',
  variable: '--font-work-sans',
  weight: '400 800',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Casa Wiki · Panel',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`font-sans ${workSans.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
