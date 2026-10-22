'use client';

import { ChatPanel } from '@/components/chat/ChatPanel';

// The full-page conversation view. The floating dock is the normal entry point;
// this route remains for direct links and for a wider layout on desktop.
export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-65px)]">
      <ChatPanel variant="page" />
    </div>
  );
}
