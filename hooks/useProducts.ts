// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { useTableStore } from '@/store/tableAndBranchStore';

interface PaginationParams {
  page: number;
  pageSize: number;
  offset?: number;
}

async function fetchProducts(
  params: PaginationParams,
  search?: string,
  branchNo?: string | null,
  categoryId?: string | null,
) {
  const urlParams = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  });

  if (search) urlParams.append('search', search);
  if (branchNo) urlParams.append('branchNo', branchNo);
  if (categoryId) urlParams.append('categoryId', categoryId);

  const res = await fetch(`/api/accurate/products?${urlParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export function useProducts(
  searchTerm: string = '',
  paginationParams: PaginationParams,
  categoryId?: string | null,
) {
  const debouncedSearch = useDebounce(searchTerm, 500);
  const { branchNo } = useTableStore();

  // "All branches" can come from the URL/store as a label (not an id).
  // Normalize it to null so our API doesn't treat it as an invalid numeric branch id.
  const normalizedBranchNo =
    branchNo &&
    typeof branchNo === 'string' &&
    branchNo.toLowerCase().includes('all') &&
    branchNo.toLowerCase().includes('branch')
      ? null
      : branchNo &&
          typeof branchNo === 'string' &&
          branchNo.toLowerCase().includes('semua cabang')
        ? null
      : branchNo;

  return useQuery({
    queryKey: [
      'products',
      debouncedSearch,
      paginationParams.page,
      paginationParams.pageSize,
      normalizedBranchNo,
      categoryId ?? null, // ✅ Re-fetch when category changes
    ],
    queryFn: () =>
      fetchProducts(paginationParams, debouncedSearch, normalizedBranchNo, categoryId),
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
