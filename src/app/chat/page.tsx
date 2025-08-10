'use client';

import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatStore } from '@/stores/chatStore';

export default function ChatPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { activeConversationId } = useChatStore();

  if (!isLoaded) {
    return <div className="p-8">Loading session...</div>;
  }

  if (!isSignedIn) {
    return <div className="p-8">Please sign in to use the chat feature.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height))]">
      <style jsx global>{`
        :root {
          --header-height: 65px; /* Corresponds to h-16 + 1px border */
        }
      `}</style>
      
      {/* Left Pane: Conversation List */}
      <aside className="w-1/3 border-r bg-gray-50 overflow-y-auto">
        <ConversationList />
      </aside>

      {/* Right Pane: Chat Window */}
      <main className="w-2/3 flex flex-col">
        {activeConversationId ? (
          <ChatWindow conversationId={activeConversationId} key={activeConversationId} />
        ) : (
          <div className="flex-grow flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <p className="text-xl font-medium">Select a conversation</p>
              <p>or start a new one to begin chatting.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}