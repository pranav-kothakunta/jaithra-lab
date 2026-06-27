import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jaithra Lab - Book Blood Tests Online',
  description: 'Book lab tests with free home collection. NABL certified, 24-hour reports delivered on WhatsApp. No registration needed.',
  metadataBase: new URL('https://jaithra-lab.com'),
  openGraph: {
    title: 'Jaithra Lab - Book Blood Tests Online',
    description: 'Book lab tests with free home collection. NABL certified, 24-hour reports.',
    images: [
      {
        url: '/og-image.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: '/og-image.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
