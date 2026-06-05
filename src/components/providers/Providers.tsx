'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1A1A',
            color: '#FAFAFA',
            border: '1px solid rgba(255,255,255,0.05)',
            fontSize: '14px',
            fontFamily: 'var(--font-jost), sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#F5F0EB',
              secondary: '#0A0A0A',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#FAFAFA',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
