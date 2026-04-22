import Link from 'next/link';
import { HeroLoop } from '@/components/HeroLoop';

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <HeroLoop />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-end px-6 pb-16 pt-32 text-center">
        <h1 className="font-serif text-5xl leading-tight tracking-tight sm:text-6xl">
          Turn your dream into a&nbsp;video.
        </h1>
        <p className="mt-4 max-w-md text-base text-zinc-300">
          Describe what you dreamed. We&apos;ll bring it to life in cinematic 10 seconds — or a carousel you can swipe through.
        </p>
        <Link
          href="/capture"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-medium text-black shadow-xl transition hover:scale-[1.02] hover:bg-zinc-100 active:scale-[0.98]"
        >
          Tell us your dream &rarr;
        </Link>
        <p className="mt-8 text-xs text-zinc-500">
          No account needed. 3 dreams a day on the house.
        </p>
      </div>
    </main>
  );
}
