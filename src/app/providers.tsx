'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// `ChatBotProvider` from react-chatbotify used to wrap the entire tree here.
// That library touches `window` during render, so importining it at module scope
// in a provider that wraps every page risked breaking prerendering for the whole
// app -- not just the one page that used a chatbot. It is gone along with the
// trial-page chatbot, which was commented out and never rendered.
export function Providers({ children }: { children: React.ReactNode }) {
  // Created inside the component rather than at module scope. A module-level
  // QueryClient is shared across requests on the server and leaks one user's
  // cache into another's response.
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
