'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { AI_SENDER_ID, getMessages, postMessage } from '@/lib/api-client';
import { relevancePayload } from '@/lib/relevance';
import { useTrialStore } from '@/stores/trialStore';
import { RelevancePrompt } from '@/components/relevance/RelevancePrompt';

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const queryClient = useQueryClient();
  const filters = useTrialStore((s) => s.filters);
  const relevance = relevancePayload(filters);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // No token and no identity header: the session cookie travels with the
  // request and the server resolves who this is. The original awaited a Clerk
  // token here and then discarded it, hardcoding a single shared user id, which
  // meant every visitor read every other visitor's messages.
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: !!conversationId,
  });

  const postMessageMutation = useMutation({
    mutationFn: (content: string) => {
      if (!content.trim()) throw new Error('Message cannot be empty');
      return postMessage(conversationId, content, relevance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setNewMessage('');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) postMessageMutation.mutate(newMessage);
  };

  // The API cites trials by NCT number. Link them out to ClinicalTrials.gov
  // rather than to /trials/<nct>, which was a route rendering mock data and
  // 404ing on Next 15 because it read `params` synchronously.
  const renderMessageContent = (content: string) => {
    const nctRegex = /(NCT\d{8,})/g;
    return content.split(nctRegex).map((part, index) =>
      nctRegex.test(part) ? (
        <a
          key={index}
          href={`https://clinicaltrials.gov/study/${part}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline text-white/90 hover:text-white"
        >
          {part}
        </a>
      ) : (
        <React.Fragment key={index}>{part}</React.Fragment>
      ),
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-grow p-6 overflow-y-auto">
        {isLoading && <p className="text-muted">Loading messages...</p>}
        {error && <p className="text-warn">Error: {(error as Error).message}</p>}

        {/* Offered once, only before the conversation has any messages. */}
        {messages && messages.length === 0 && <RelevancePrompt className="mb-4" />}

        <div className="space-y-4">
          {messages?.map((msg) => {
            const isAssistant = msg.sender_id === AI_SENDER_ID;
            return (
              <div key={msg.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-md p-3 rounded-lg whitespace-pre-wrap ${
                    isAssistant ? 'bg-canvas text-ink' : 'bg-accent text-white'
                  }`}
                >
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            );
          })}

          {/* v5 renamed isLoading to isPending on mutations. */}
          {postMessageMutation.isPending && (
            <div className="flex justify-start">
              <div className="max-w-md p-3 rounded-lg bg-canvas text-ink animate-pulse">
                Searching trials...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-line text-ink bg-canvas">
        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask about trials, e.g. 'recruiting melanoma trials'"
            className="flex-grow p-2 border border-line rounded-full bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={postMessageMutation.isPending}
          />
          <button
            type="submit"
            className="p-3 bg-accent text-white rounded-full hover:bg-accent-hover disabled:opacity-40"
            disabled={postMessageMutation.isPending || !newMessage.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
