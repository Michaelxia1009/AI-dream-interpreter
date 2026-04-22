import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { DreamProvider } from '@/lib/state';
import { SettingsMenu } from '@/components/SettingsMenu';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const serif = Instrument_Serif({ weight: '400', subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Dream Interpreter',
  description: 'Turn your dream into a 10-second video or carousel.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} dark`}>
      <body className="min-h-dvh bg-zinc-950 text-zinc-100 antialiased">
        <DreamProvider>
          <div className="fixed top-0 right-0 z-50 p-3">
            <SettingsMenu />
          </div>
          {children}
          <Toaster theme="dark" position="top-center" />
        </DreamProvider>
        <Analytics />
      </body>
    </html>
  );
}
