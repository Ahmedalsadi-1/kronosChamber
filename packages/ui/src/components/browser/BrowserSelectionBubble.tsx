import React from 'react';
import { RiMagicLine, RiSearch2Line, RiTerminalLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { desktopBrowserSelectionState, type DesktopBrowserSelection } from '@/lib/desktop';
import { useUIStore } from '@/stores/useUIStore';
import { runtimeSdk } from '@/lib/runtimeSdk';
import { useSessionStore } from '@/stores/useSessionStore';

export const BrowserSelectionBubble: React.FC = () => {
  const [selection, setSelection] = React.useState<DesktopBrowserSelection | null>(null);
  const activeMainTab = useUIStore((state) => state.activeMainTab);
  const setActiveMainTab = useUIStore((state) => state.setActiveMainTab);
  const currentSessionId = useSessionStore((state) => state.currentSessionId);

  // Poll for selection state when in browser tab
  React.useEffect(() => {
    if (activeMainTab !== 'browser') {
      setSelection(null);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const state = await desktopBrowserSelectionState();
        if (state && state.text.length > 0) {
          setSelection(state);
        } else {
          setSelection(null);
        }
      } catch {
        setSelection(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMainTab]);

  if (!selection) return null;

  const handleAsk = () => {
    const prompt = `Based on my selection from ${selection.url}:\n\n"${selection.text}"\n\n`;
    // We'd ideally prefill chat input here. For now, we'll switch to chat.
    setActiveMainTab('chat');
    // TODO: implement prefill in ChatView
  };

  const handleRunTask = async (mode: 'openbrowser' | 'e2b') => {
    if (!currentSessionId) return;
    try {
      await runtimeSdk.createTask({
        prompt: `Process this selection from ${selection.url}:\n\n${selection.text}`,
        mode,
        sessionID: currentSessionId
      });
      setActiveMainTab('chat');
    } catch (error) {
      console.error('Failed to run selection task:', error);
    }
  };

  return (
    <div 
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full border border-border/80 bg-background/95 p-1 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <button
        onClick={handleAsk}
        className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <RiMagicLine className="h-3.5 w-3.5" />
        Ask KronosCoder
      </button>
      
      <div className="h-4 w-px bg-border/60 mx-1" />

      <button
        onClick={() => handleRunTask('openbrowser')}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <RiSearch2Line className="h-3.5 w-3.5" />
        Analyze with OpenBrowser
      </button>

      <button
        onClick={() => handleRunTask('e2b')}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <RiTerminalLine className="h-3.5 w-3.5" />
        Process in Sandbox
      </button>
    </div>
  );
};
