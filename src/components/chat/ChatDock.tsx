'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';

import { ChatPanel } from '@/components/chat/ChatPanel';

/**
 * The assistant as a popup, not a destination. The button sits lower-left on
 * every page except /chat (where the full page already is), and the window
 * floats above the page without a backdrop, so the reader keeps their results.
 */
export function ChatDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname?.startsWith('/chat')) return null;

  return (
    <>
      {open && (
        <section
          aria-label="Assistant"
          className="fixed bottom-20 left-5 z-50 flex h-[min(560px,calc(100vh-7rem))] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-lift)]"
        >
          <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h2 className="text-[14px] font-semibold text-ink">
              Ask the assistant
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-md p-1.5 text-muted hover:bg-canvas hover:text-ink"
            >
              <X size={16} />
            </button>
          </header>
          <div className="min-h-0 flex-1">
            <ChatPanel variant="panel" />
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Ask the assistant'}
        className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-[13px] font-medium text-white shadow-lift transition-colors hover:bg-accent-hover"
      >
        {open ? <X size={20} aria-hidden /> : <MessageCircle size={20} aria-hidden />}
        <span className="hidden sm:inline">
          {open ? 'Close' : 'Ask the assistant'}
        </span>
      </button>
    </>
  );
}
