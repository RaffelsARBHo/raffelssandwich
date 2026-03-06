// components/TableNumberDetector.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTableStore } from '@/store/tableAndBranchStore';

export function TableNumberDetector() {
  const searchParams = useSearchParams();
  const { setTableNumber, setBranchNo } = useTableStore();

  useEffect(() => {
    const tableFromUrl = searchParams.get('table');
    if (tableFromUrl) {
      console.log('📍 Table number detected from URL:', tableFromUrl);
      setTableNumber(tableFromUrl);
    }

    const branchFromUrl = searchParams.get('branch');
    if (branchFromUrl) {
      console.log('🏢 Branch detected from URL:', branchFromUrl);
      setBranchNo(branchFromUrl);
    }
  }, [searchParams, setTableNumber, setBranchNo]);

  return null;
}