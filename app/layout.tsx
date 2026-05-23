import type { Metadata } from 'next';
import Script from 'next/script';
import {
  Cormorant_Garamond,
  Fraunces,
  Inter,
  Libre_Baskerville,
  Newsreader,
  Playfair_Display,
  Urbanist,
} from 'next/font/google';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { DreamProvider } from '@/lib/state';
import { ThemeProvider, themeInitScript } from '@/lib/theme';
import { NavMenu } from '@/components/NavMenu';
import { FloatingThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: 'variable',
  style: ['normal', 'italic'],
});
const titleUrbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-title-urbanist',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
});
const serif = Newsreader({
  subsets: ['latin'],
  variable: '--font-body-serif',
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
const titleFraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-title-fraunces',
  weight: 'variable',
  style: ['normal', 'italic'],
  axes: ['SOFT', 'WONK', 'opsz'],
});
const titleLibre = Libre_Baskerville({
  subsets: ['latin'],
  variable: '--font-title-libre',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Dream Interpreter',
  description: 'Turn your dream into a 9-second video or image series.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${titleUrbanist.variable} ${serif.variable} ${serifItalic.variable} ${wordmark.variable} ${titleFraunces.variable} ${titleLibre.variable}`}
      suppressHydrationWarning
    >
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
