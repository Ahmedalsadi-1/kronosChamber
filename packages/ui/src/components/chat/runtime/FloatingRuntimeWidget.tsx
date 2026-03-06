// packages/ui/src/components/chat/runtime/FloatingRuntimeWidget.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import KronosMascot from '@/components/ui/KronosMascot';
import { MASCOT_COLLAGE_A } from '@/lib/branding/mascotFrames';

interface FloatingRuntimeWidgetProps {
  isVisible: boolean;
  isBrowserTabActive: boolean;
  isExpanded: boolean;
  onExpand: () => void;
  onDismiss: () => void;
}

const FloatingRuntimeWidget: React.FC<FloatingRuntimeWidgetProps> = ({
  isVisible,
  isBrowserTabActive,
  isExpanded,
  onExpand,
}) => {
  if (!isVisible || isExpanded) {
    return null;
  }

  const positionClasses = isBrowserTabActive
    ? 'bottom-4 right-4'
    : 'bottom-20 left-1/2 -translate-x-1/2';

  return (
    <div
      className={cn(
        'fixed z-50 cursor-pointer rounded-full border border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2 shadow-lg backdrop-blur-md transition-all duration-200 ease-in-out hover:border-blue-400/50 animate-in fade-in zoom-in-95',
        positionClasses
      )}
      onClick={onExpand}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <KronosMascot src={MASCOT_COLLAGE_A} rotating rotationInterval={150} className="h-14 w-14 rounded-full" />
        <span className="absolute right-0 top-0 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-green-500" />
      </div>
    </div>
  );
};

export { FloatingRuntimeWidget };
export default FloatingRuntimeWidget;
