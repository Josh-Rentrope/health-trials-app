'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash2 } from 'lucide-react';
import { createConversation, deleteConversation, getConversations } from '@/lib/api-client';
import { useChatStore } from '@/stores/chatStore';

export function ConversationList() {
  const queryClient = useQueryClient();
  const { activeConversationId, setActiveConversationId } = useChatStore();

  // Identity comes from the session cookie, established by the page before this
  // mounts. No Clerk token, no email header.
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  const newConversationMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConversationId(conversation.id);
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_result, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (activeConversationId === deletedId) setActiveConversationId(null);
    },
  });

  const handleDelete = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      deleteConversationMutation.mutate(convId);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4 text-ink">
        <h2 className="text-xl font-bold">Chats</h2>
        <button
          onClick={() => newConversationMutation.mutate()}
          disabled={newConversationMutation.isPending}
          className="p-2 rounded-full hover:bg-canvas disabled:opacity-50"
          title="Start a new conversation"
        >
          <PlusCircle size={24} />
        </button>
      </div>

      {isLoading && <p className="text-muted">Loading conversations...</p>}
      {error && <p className="text-warn">Error: {(error as Error).message}</p>}
      {!isLoading && !error && conversations?.length === 0 && (
        <p className="text-muted text-sm">No conversations yet.</p>
      )}

      <ul className="space-y-2">
        {conversations?.map((conv) => (
          <li
            key={conv.id}
            onClick={() => setActiveConversationId(conv.id)}
            className={`p-3 rounded-lg cursor-pointer flex justify-between items-center ${
              activeConversationId === conv.id
                ? 'bg-accent text-white'
                : 'hover:bg-canvas text-ink'
            }`}
          >
            <div>
              <p className="font-semibold">Conversation</p>
              <p className="text-sm opacity-80">
                Updated: {new Date(conv.updated_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={(e) => handleDelete(e, conv.id)}
              className={`p-2 rounded-full hover:bg-warn-soft ${
                activeConversationId === conv.id ? 'hover:text-white/80' : 'text-muted hover:text-warn'
              }`}
              title="Delete conversation"
            >
              <Trash2 size={18} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
