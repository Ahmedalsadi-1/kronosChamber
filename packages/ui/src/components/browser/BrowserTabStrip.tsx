import React from 'react';
import { RiAddLine, RiCloseLine, RiPushpin2Line, RiPushpin2Fill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type BrowserPage = {
  id: string;
  index: number;
  url: string;
  title: string;
  active: boolean;
  isLoading: boolean;
  isPinned?: boolean;
};

interface BrowserTabStripProps {
  pages: BrowserPage[];
  onSelectPage: (index: number) => void;
  onClosePage: (index: number) => void;
  onNewPage: () => void;
  onTogglePin?: (index: number) => void;
  disableActions?: boolean;
}

export const BrowserTabStrip: React.FC<BrowserTabStripProps> = ({
  pages,
  onSelectPage,
  onClosePage,
  onNewPage,
  onTogglePin,
  disableActions,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="flex items-center gap-1 bg-card/20 px-2 py-1 border-b border-border/40">
      <div 
        ref={scrollRef}
        className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-none no-scrollbar"
      >
        {pages.map((page) => (
          <div
            key={page.id}
            onClick={() => !disableActions && onSelectPage(page.index)}
            className={cn(
              "group relative flex h-8 min-w-[120px] max-w-[240px] flex-1 cursor-pointer items-center gap-2 rounded-md px-3 transition-all",
              page.active 
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" 
                : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
            )}
          >
            {page.isPinned && (
              <RiPushpin2Fill className="h-3 w-3 shrink-0 text-primary/70" />
            )}
            <span className="min-w-0 flex-1 truncate text-xs font-medium">
              {page.title || page.url || 'Untitled'}
            </span>
            
            {page.isLoading && (
              <div className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary" />
            )}

            {!page.isPinned && pages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disableActions) onClosePage(page.index);
                }}
                className={cn(
                  "ml-1 flex h-4 w-4 items-center justify-center rounded-sm opacity-0 transition-opacity hover:bg-muted-foreground/20 group-hover:opacity-100",
                  page.active && "opacity-60"
                )}
              >
                <RiCloseLine className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onNewPage}
            disabled={disableActions}
          >
            <RiAddLine className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New Tab</TooltipContent>
      </Tooltip>
    </div>
  );
};
