// app/page.tsx
'use client';

import { Suspense } from 'react';
import { ProductsPage } from '@/view/products/products-page';
import Maxwidth from '@/components/Maxwidth';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div>
      <div id="menu">
        <Suspense
          fallback={
            <div className="p-6 text-muted-foreground">Loading menu…</div>
          }
        >
          <ProductsPage />
        </Suspense>
      </div>
    </div>
  );
}
