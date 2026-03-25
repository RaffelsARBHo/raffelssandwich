// hooks/useCategories.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface Category {
  id: number;
  name: string;
  no: string;
}

export function useCategories() {
  const { data, isLoading, error } = useSWR<{
    success: boolean;
    categories: Category[];
    count: number;
  }>('/api/accurate/products/categories?pageSize=100', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10 * 60 * 1000,
  });

  return {
    categories: data?.categories || [],
    isLoading,
    error,
  };
}
