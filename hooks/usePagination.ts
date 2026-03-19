// hooks/usePagination.ts
import { useState, useCallback, useMemo } from 'react';

interface UsePaginationProps {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
  pageSizeOptions?: number[];
}

interface UsePaginationReturn {
  // State
  page: number;
  pageSize: number;
  totalPages: number;
  
  // Actions
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  
  // Helpers
  startIndex: number;
  endIndex: number;
  canNextPage: boolean;
  canPrevPage: boolean;
  
  // For API
  paginationParams: {
    page: number;
    pageSize: number;
    offset: number;
  };
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 12,
  totalItems = 0,
  pageSizeOptions = [12, 24, 48, 96],
}: UsePaginationProps = {}): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate total pages
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  // Ensure page is within bounds
  const safePage = useMemo(
    () => Math.min(Math.max(1, page), totalPages),
    [page, totalPages]
  );

  // Calculate indices
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Navigation actions
  const goToPage = useCallback(
    (newPage: number) => {
      const validPage = Math.min(Math.max(1, newPage), totalPages);
      setPage(validPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (safePage < totalPages) {
      setPage(safePage + 1);
    }
  }, [safePage, totalPages]);

  const prevPage = useCallback(() => {
    if (safePage > 1) {
      setPage(safePage - 1);
    }
  }, [safePage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      // Reset to first page when changing page size
      setPage(1);
    },
    []
  );

  return {
    // State
    page: safePage,
    pageSize,
    totalPages,
    
    // Actions
    setPage: goToPage,
    setPageSize: handlePageSizeChange,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    
    // Helpers
    startIndex,
    endIndex,
    canNextPage: safePage < totalPages,
    canPrevPage: safePage > 1,
    
    // For API calls
    paginationParams: {
      page: safePage,
      pageSize: pageSize,
      offset: startIndex,
    },
  };
}