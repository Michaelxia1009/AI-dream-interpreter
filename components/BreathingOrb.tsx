import type { ReactNode } from 'react';

export function BreathingOrb({
  size = 160,
  className = '',
  children,
}: {
  size?: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={!children}
    >
      <div className="absolute inset-0 animate-[breathe_6s_ease-in-out_infinite] rounded-full bg-[var(--dw-gradient)] opacity-50 blur-2xl" />
      <div
        className="absolute inset-4 animate-[breathe_6s_ease-in-out_infinite] rounded-full bg-[var(--dw-gradient)] opacity-30"
        style={{ animationDelay: '1s' }}
      />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
