// packages/ui/src/components/ui/KronosMascot.tsx
import React, { useMemo, useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { getMascotFrameCoords, MASCOT_COLLAGE_A, MASCOT_COLLAGE_B, MASCOT_DEFAULT } from '../../lib/branding/mascotFrames';

interface KronosMascotProps {
  /**
   * The source image for the mascot. Defaults to MASCOT_DEFAULT.
   * Can be MASCOT_COLLAGE_A, MASCOT_COLLAGE_B, or MASCOT_DEFAULT.
   */
  src?: string;
  /**
   * If the src is a collage, specifies the 0-indexed frame to display (0-8).
   * If omitted or src is not a collage, the entire image is displayed.
   */
  frameIndex?: number;
  /**
   * If true, and src is a collage, the mascot will automatically rotate through frames.
   */
  rotating?: boolean;
  /**
   * Duration in milliseconds for each frame when rotating. Defaults to 200ms.
   */
  rotationInterval?: number;
  /**
   * Additional class name for styling.
   */
  className?: string;
  /**
   * Inline styles for the mascot container.
   */
  style?: CSSProperties;
}

const KronosMascot: React.FC<KronosMascotProps> = ({
  src = MASCOT_DEFAULT,
  frameIndex: initialFrameIndex,
  rotating = false,
  rotationInterval = 200,
  className,
  style,
}) => {
  const isCollage = src === MASCOT_COLLAGE_A || src === MASCOT_COLLAGE_B;
  const [currentFrameIndex, setCurrentFrameIndex] = useState(initialFrameIndex ?? 0);

  useEffect(() => {
    if (rotating && isCollage) {
      const interval = setInterval(() => {
        setCurrentFrameIndex((prevIndex) => (prevIndex + 1) % 9); // 9 frames in a 3x3 grid
      }, rotationInterval);
      return () => clearInterval(interval);
    }
  }, [rotating, isCollage, rotationInterval]);

  const frameStyles: CSSProperties = useMemo(() => {
    if (isCollage) {
      const { x, y } = getMascotFrameCoords(rotating ? currentFrameIndex : (initialFrameIndex ?? 0));
      return {
        backgroundImage: `url(${src})`,
        backgroundSize: '300% 300%', // 3x3 grid, so image is 3x larger than visible area
        backgroundPosition: `${x * 100}% ${y * 100}%`, // Position based on frame coordinates
        width: '100%', // The visible area for the frame
        height: '100%',
      };
    }
    return {};
  }, [src, isCollage, currentFrameIndex, initialFrameIndex, rotating]);

  // For non-collage or when not rotating, display the image directly
  if (!isCollage || (!rotating && initialFrameIndex === undefined)) {
    return (
      <img
        src={src}
        alt="Kronos Mascot"
        className={className}
        style={style}
      />
    );
  }

  // For collage with specific frame or rotating
  return (
    <div
      className={className}
      style={{
        overflow: 'hidden', // Hide parts of the background image outside the frame
        ...style,
      }}
    >
      <div style={frameStyles} />
    </div>
  );
};

export default KronosMascot;
