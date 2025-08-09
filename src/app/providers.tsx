// app/providers.tsx
'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();


import { ChatBotProvider } from 'react-chatbotify';

export function ChatBotClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ChatBotProvider>
      {children}
    </ChatBotProvider>
  );
}


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <ChatBotClientProvider>
        {children}  
      </ChatBotClientProvider>
    </QueryClientProvider>
  );
}