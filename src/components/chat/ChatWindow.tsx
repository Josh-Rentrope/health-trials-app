'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// MODIFIED: Import all functions from the updated client
import { getMessages, getMessages_demo, postMessage, postMessage_demo } from '@/lib/api-client';
import { Send } from 'lucide-react';

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      // Use the new getMessages function
      console.log(conversationId);
      return getMessages_demo(userId||"demo", conversationId);
      //return getMessages(token, conversationId);
    },
    enabled: !!conversationId,
  });

  const postMessageMutation = useMutation({
    mutationFn: (content: string) => {
      if (!content.trim()) throw new Error("Message cannot be empty");
      return (async () => {
        const token = await getToken();
        if (!token) throw new Error("Not authenticated");
        // <--- CORRECTION: Use the correct argument order for postMessage ---
        return postMessage_demo(conversationId, content, userId||"demo");
        //return postMessage(token, conversationId, content);
      })();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setNewMessage('');
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if(newMessage.trim()) {
        postMessageMutation.mutate(newMessage);
    }
  };

  // Function to parse message content for NCT numbers
const renderMessageContent = (content: string) => {
  const nctRegex = /(NCT\d{8,})/g;
  const parts = content.split(nctRegex);

  return parts.map((part, index) => {
    if (part.match(nctRegex)) {
      return (
        <a
          key={index}
          href={`/trials/${part}`} // Assuming a route like /trials/NCT...
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline text-blue-300 hover:text-blue-100"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Message Display Area */}
      <div className="flex-grow p-6 overflow-y-auto">
        {isLoading && <p>Loading messages...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}
        <div className="space-y-4">
          {messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${(msg.sender_id === userId || msg.sender_id != "00000000-0000-0000-0000-000000000000") ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md p-3 rounded-lg ${
                  (msg.sender_id === userId || msg.sender_id != "00000000-0000-0000-0000-000000000000") ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >

                {renderMessageContent(msg.content)}
                
              </div>
            </div>
          ))}

          {postMessageMutation.isLoading && (
            <div className="flex justify-start">
              <div className="max-w-md p-3 rounded-lg bg-gray-200 text-gray-800 animate-pulse">
                Assistant is typing...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input Form */}
      <div className="p-4 border-t text-gray-800 bg-gray-50">
        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={postMessageMutation.isLoading}
          />
          <button
            type="submit"
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-blue-300"
            disabled={postMessageMutation.isLoading || !newMessage.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}