'use client';

// view/products/CategoryFilter.tsx
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { ca } from 'zod/v4/locales';

export function CategoryFilter() {
  const { categories, isLoading } = useCategories();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategoryId = searchParams.get('categoryId') || null;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories, checkScroll]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  const handleSelect = useCallback(
    (categoryId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (categoryId) {
        params.set('categoryId', categoryId);
      } else {
        params.delete('categoryId');
      }
      // Reset to page 1 when category changes
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }

  console.log("categs", categories);
  if (!categories.length) return null;

  return (
    <div className="relative flex items-center gap-1">
      {/* Left fade + arrow */}
      <button
        onClick={() => scroll('left')}
        className={cn(
          'absolute left-0 z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm transition-opacity',
          canScrollLeft ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-label="Scroll categories left"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scroll-smooth px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* "All" pill */}
        <button
          onClick={() => handleSelect(null)}
          className={cn(
            'inline-flex h-8 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-all duration-150',
            !activeCategoryId
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
          )}
        >
          All
        </button>

        {categories.map((cat) => {
          const isActive = activeCategoryId === String(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => handleSelect(String(cat.id))}
              className={cn(
                'inline-flex h-8 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Right fade + arrow */}
      <button
        onClick={() => scroll('right')}
        className={cn(
          'absolute right-0 z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm transition-opacity',
          canScrollRight ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-label="Scroll categories right"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
