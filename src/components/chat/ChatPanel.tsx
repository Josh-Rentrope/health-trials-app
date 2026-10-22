'use client';

// The chat body, shared by the /chat page and the floating dock. One
// implementation means the session, the conversation list, the relevance prompt
// and the message window behave identically in both places.

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { ensureSession } from '@/lib/api-client';
import { useChatStore } from '@/stores/chatStore';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { RelevancePrompt } from '@/components/relevance/RelevancePrompt';

export function ChatPanel({ variant }: { variant: 'page' | 'panel' }) {
  const { activeConversationId, setActiveConversationId } = useChatStore();

  // Identity is a server-issued session. Doing it here rather than on the first
  // message means the cookie exists before the conversation list asks for it.
  const { isLoading, error } = useQuery({
    queryKey: ['session'],
    queryFn: ensureSession,
    staleTime: Infinity,
  });

  if (isLoading) {
    return <div className="p-4 text-[13px] text-muted">Starting session…</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-[13px]">
        <p className="font-medium text-warn">Could not reach the API.</p>
        <p className="mt-1 text-muted">{(error as Error).message}</p>
      </div>
    );
  }

  if (variant === 'panel') {
    // One column: the list, then the conversation. Side-by-side at 420px would
    // leave neither enough room to read.
    return activeConversationId ? (
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-b border-line px-2 py-1.5">
          <button
            type="button"
            onClick={() => setActiveConversationId(null)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted hover:text-ink"
          >
            <ArrowLeft size={14} /> Chats
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <ChatWindow
            conversationId={activeConversationId}
            key={activeConversationId}
          />
        </div>
      </div>
    ) : (
      <div className="h-full overflow-y-auto">
        <RelevancePrompt className="m-3" />
        <ConversationList />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="w-1/3 overflow-y-auto border-r border-line bg-canvas">
        <ConversationList />
      </aside>

      <main className="flex min-h-0 w-2/3 flex-col">
        {activeConversationId ? (
          <ChatWindow
            conversationId={activeConversationId}
            key={activeConversationId}
          />
        ) : (
          <div className="flex flex-grow items-center justify-center bg-canvas">
            <div className="w-full max-w-md px-6">
              <RelevancePrompt className="mb-6" />
              <div className="text-center text-muted">
                <p className="text-xl font-medium text-ink">
                  Select a conversation
                </p>
                <p>or start a new one to begin chatting.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
