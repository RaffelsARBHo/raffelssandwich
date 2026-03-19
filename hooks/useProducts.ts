// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { useTableStore } from '@/store/tableAndBranchStore';

interface PaginationParams {
  page: number;
  pageSize: number;
  offset?: number;
}

async function fetchProducts(params: PaginationParams, search?: string, branchNo?: string | null) {
  const urlParams = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  });

  if (search) {
    urlParams.append('search', search);
  }

  // ✅ Pass branchNo to the API
  if (branchNo) {
    urlParams.append('branchNo', branchNo);
  }

  const res = await fetch(`/api/accurate/products?${urlParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export function useProducts(
  searchTerm: string = '',
  paginationParams: PaginationParams
) {
  const debouncedSearch = useDebounce(searchTerm, 500);
  const { branchNo } = useTableStore(); // ✅ Read branchNo from store

  return useQuery({
    queryKey: [
      'products',
      debouncedSearch,
      paginationParams.page,
      paginationParams.pageSize,
      branchNo, // ✅ Re-fetch when branch changes
    ],
    queryFn: () => fetchProducts(paginationParams, debouncedSearch, branchNo),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

async function fetchProductDetail(id: string) {
  const res = await fetch(`/api/accurate/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product detail');
  return res.json();
}

export function useProductDetail(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductDetail(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}