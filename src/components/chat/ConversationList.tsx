'use client';

import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConversations, createConversation, deleteConversation, Conversation, getConversations_demo, createConversation_demo, deleteConversation_demo } from '@/lib/api-client';
import { useChatStore } from '@/stores/chatStore';
import { PlusCircle, Trash2 } from 'lucide-react';

export function ConversationList() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const { activeConversationId, setActiveConversationId } = useChatStore();

  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return getConversations_demo(userId||"demo");
      //return getConversations(token);
    },
  });

  const newConversationMutation = useMutation({
    mutationFn: async () => {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        return createConversation_demo(userId||"demo", [userId||"demo"]);
        //return createConversation(token);
    },
    onSuccess: (newConversation) => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        setActiveConversationId(newConversation.id);
    },
  });
  
  const deleteConversationMutation = useMutation({
    mutationFn: async (convId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return deleteConversation_demo(userId||"demo", convId);
      //return deleteConversation(token, convId);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (activeConversationId === deletedId) {
        setActiveConversationId(null);
      }
    },
  });


  const handleDelete = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation(); // Prevent selection when deleting
    if (window.confirm("Are you sure you want to delete this conversation?")) {
        deleteConversationMutation.mutate(convId);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4 text-gray-800">
        <h2 className="text-xl font-bold">Chats</h2>
        <button 
            onClick={() => newConversationMutation.mutate()} 
            className="p-2 rounded-full hover:bg-gray-200"
            title="Start new conversation"
        >
          <PlusCircle size={24} />
        </button>
      </div>

      {isLoading && <p className="text-gray-800">Loading conversations...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}

      <ul className="space-y-2">
        {conversations?.map((conv) => (
          <li
            key={conv.id}
            onClick={() => setActiveConversationId(conv.id)}
            className={`p-3 rounded-lg cursor-pointer flex justify-between items-center ${
              activeConversationId === conv.id ? 'bg-blue-700 text-white' : 'hover:bg-gray-200 text-gray-800'
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
              className={`p-2 rounded-full hover:bg-red-500/20 ${activeConversationId === conv.id ? 'hover:text-red-500' : 'text-gray-500 hover:text-red-600'}`}
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