import type { Metadata } from 'next';
import Script from 'next/script';
import { Cormorant_Garamond, Inter, Newsreader } from 'next/font/google';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { DreamProvider } from '@/lib/state';
import { ThemeProvider, themeInitScript } from '@/lib/theme';
import { NavMenu } from '@/components/NavMenu';
import { FloatingThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const serif = Newsreader({
  subsets: ['latin'],
  variable: '--font-display',
  weight: 'variable',
  style: ['normal', 'italic'],
  axes: ['opsz'],
});
const serifItalic = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif-italic',
  weight: 'variable',
  style: ['normal', 'italic'],
  axes: ['opsz'],
});
const wordmark = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Dream Interpreter',
  description: 'Turn your dream into a 10-second video or carousel.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${serifItalic.variable} ${wordmark.variable}`} suppressHydrationWarning>
      <head>
        <Script id="dream-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <ThemeProvider>
          <DreamProvider>
            <div className="fixed top-0 right-0 z-50 flex items-center gap-1 p-3">
              <NavMenu />
              <FloatingThemeToggle />
            </div>
            {children}
            <Toaster position="top-center" />
          </DreamProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
