'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatStore } from '@/stores/chatStore';
import { ensureSession } from '@/lib/api-client';
import { RelevancePrompt } from '@/components/relevance/RelevancePrompt';

export default function ChatPage() {
  const { activeConversationId } = useChatStore();

  // Identity is a server-issued session, and this call is what establishes it:
  // GET /api/session returns the current session or mints one. Doing it here
  // rather than on the first message means the cookie is set by a request the
  // page controls, so the conversation list and the first send both already
  // carry it. The original gated this page on Clerk being signed in and then
  // never used the token.
  const { isLoading, error } = useQuery({
    queryKey: ['session'],
    queryFn: ensureSession,
    staleTime: Infinity,
  });

  if (isLoading) {
    return <div className="p-8 text-muted">Starting session...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-warn font-medium">Could not reach the API.</p>
        <p className="text-muted text-sm mt-2">
          {(error as Error).message}
        </p>
        <p className="text-muted text-sm mt-2">
          Check that NEXT_PUBLIC_API_BASE_URL points at a running instance.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-65px)]">
      <aside className="w-1/3 border-r border-line bg-canvas overflow-y-auto">
        <ConversationList />
      </aside>

      <main className="w-2/3 flex flex-col">
        {activeConversationId ? (
          <ChatWindow conversationId={activeConversationId} key={activeConversationId} />
        ) : (
          <div className="flex-grow flex items-center justify-center bg-canvas">
            <div className="w-full max-w-md px-6">
              {/* Offered once, before there is a conversation to tailor. */}
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
