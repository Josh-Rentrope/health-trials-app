'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

/**
 * The assistant's entry point, lower left, on every page except its own.
 *
 * It is a link rather than an embedded panel on purpose: the assistant uses the
 * same conversation history and relevance answers as /chat, so opening a second
 * implementation here would be a second place for that state to disagree.
 */
export function ChatFab() {
  const pathname = usePathname();
  if (pathname?.startsWith('/chat')) return null;

  return (
    <Link
      href="/chat"
      aria-label="Ask the assistant"
      title="Ask the assistant"
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-[13px] font-medium text-white shadow-lift transition-colors hover:bg-accent-hover"
    >
      <MessageCircle size={20} aria-hidden />
      <span className="hidden sm:inline">Ask the assistant</span>
    </Link>
  );
}
