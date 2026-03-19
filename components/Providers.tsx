// components/Providers.tsx
'use client';

import { Suspense } from 'react';
import { Provider } from 'urql';
import client from '@/client';
import { ReactQueryProvider } from '@/components/ReactQueryProvider';
import { TableNumberDetector } from '@/components/TableNumberDetector';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <Provider value={client}>
        <Suspense fallback={null}>
          <TableNumberDetector />
        </Suspense>
        {children}
      </Provider>
    </ReactQueryProvider>
  );
}