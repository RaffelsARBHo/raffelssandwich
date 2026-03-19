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
  initFromUrl: () => void; // ✅ new
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

      // ✅ Automatically read from URL
      initFromUrl: () => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);

        const table = params.get('table');
        const branch = params.get('branch');

        set({
          tableNumber: table || null,
          branchNo: branch || null,
        });
      },
    }),
    {
      name: 'table-storage',
    }
  )
);