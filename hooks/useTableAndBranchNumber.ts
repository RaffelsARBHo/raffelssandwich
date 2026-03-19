// hooks/useTableNumber.ts
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTableStore } from '@/store/tableAndBranchStore';

export function useTableNumber() {
  const searchParams = useSearchParams();
  const { tableNumber, setTableNumber, branchNo, setBranchNo } = useTableStore();

  useEffect(() => {
    const tableFromUrl = searchParams.get('table');
    if (tableFromUrl && tableFromUrl !== tableNumber) {
      setTableNumber(tableFromUrl);
    }

    const branchFromUrl = searchParams.get('branch');
    if (branchFromUrl && branchFromUrl !== branchNo) {
      setBranchNo(branchFromUrl);
    }
  }, [searchParams, tableNumber, setTableNumber, branchNo, setBranchNo]);

  return {
    tableNumber,
    setTableNumber,
    branchNo,
    setBranchNo,
  };
}