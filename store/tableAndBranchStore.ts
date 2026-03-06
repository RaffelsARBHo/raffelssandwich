// store/tableStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TableStore {
  tableNumber: string | null;
  branchNo: string | null;
  setTableNumber: (tableNumber: string) => void;
  clearTableNumber: () => void;
  setBranchNo: (branchNo: string) => void;
  clearBranchNo: () => void;
}

export const useTableStore = create<TableStore>()(
  persist(
    (set) => ({
      tableNumber: null,
      branchNo: null,
      setTableNumber: (tableNumber) => set({ tableNumber }),
      clearTableNumber: () => set({ tableNumber: null }),
      setBranchNo: (branchNo) => set({ branchNo }),
      clearBranchNo: () => set({ branchNo: null }),
    }),
    {
      name: 'table-storage',
    }
  )
);