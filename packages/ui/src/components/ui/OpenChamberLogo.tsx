import React from 'react';
import { cn } from '@/lib/utils';

interface KronosChamberLogoProps {
  className?: string;
  width?: number;
  height?: number;
  isAnimated?: boolean;
}

const MAIN_LOGO_SRC = '/branding/kronos/main-logo.png';
const ANIMATED_FRAMES = ['/branding/kronos/coursel-1.png', '/branding/kronos/coursel-2.png'] as const;

export const KronosChamberLogo: React.FC<KronosChamberLogoProps> = ({
  className = '',
  width = 70,
  height = 70,
  isAnimated = false,
}) => {
  const size = Math.max(24, Math.round((width + height) / 2));
  const [frameIndex, setFrameIndex] = React.useState(0);

  React.useEffect(() => {
    if (!isAnimated) {
      setFrameIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % ANIMATED_FRAMES.length);
    }, 2800);

    return () => {
      window.clearInterval(interval);
    };
  }, [isAnimated]);

  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl border border-border/40 bg-card/50', className)}
      style={{ width: size, height: size }}
      aria-label="KronosChamber logo"
    >
      {!isAnimated ? (
        <img src={MAIN_LOGO_SRC} alt="KronosChamber" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <>
          {ANIMATED_FRAMES.map((src, index) => (
            <img
              key={src}
              src={src}
              alt="KronosChamber"
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
                frameIndex === index ? 'opacity-100' : 'opacity-0',
              )}
              draggable={false}
            />
          ))}
          <img
            src={MAIN_LOGO_SRC}
            alt="KronosChamber"
            className="pointer-events-none absolute inset-[18%] h-[64%] w-[64%] rounded-xl object-cover shadow-lg"
            draggable={false}
          />
        </>
      )}
    </div>
  );
};

export const OpenChamberLogo = KronosChamberLogo;
