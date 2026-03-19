// components/ui/Pagination.tsx
'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  // Core props
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  
  // Optional props with defaults
  siblingCount?: number;
  showFirstLast?: boolean;
  showPageSize?: boolean;
  showPageInfo?: boolean;
  showPageNumbers?: boolean;
  
  // Page size options
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  
  // Total items for info display
  totalItems?: number;
  
  // Styling
  className?: string;
  buttonClassName?: string;
  activeButtonClassName?: string;
  
  // Labels
  prevLabel?: string;
  nextLabel?: string;
  firstLabel?: string;
  lastLabel?: string;
  rowsPerPageLabel?: string;
  ofLabel?: string;
}

export function Pagination({
  // Core
  currentPage,
  totalPages,
  onPageChange,
  
  // Optional with defaults
  siblingCount = 1,
  showFirstLast = true,
  showPageSize = true,
  showPageInfo = true,
  showPageNumbers = true,
  
  // Page size
  pageSize = 12,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 48, 96],
  
  // Total items
  totalItems,
  
  // Styling
  className,
  buttonClassName,
  activeButtonClassName,
  
  // Labels
  prevLabel,
  nextLabel,
  firstLabel,
  lastLabel,
  rowsPerPageLabel = "Rows per page:",
  ofLabel = "of",
}: PaginationProps) {
  
  // Generate page numbers with ellipsis
  const generatePages = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range
      const leftSibling = Math.max(currentPage - siblingCount, 2);
      const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1);

      // Add dots if needed
      if (leftSibling > 2) {
        pages.push('...');
      }

      // Add pages between dots
      for (let i = leftSibling; i <= rightSibling; i++) {
        pages.push(i);
      }

      // Add dots if needed
      if (rightSibling < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePages();
  
  // Calculate displayed items range
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        
        {/* Page info - Left side */}
        {showPageInfo && totalItems && totalItems > 0 && (
          <p className="text-sm text-muted-foreground order-2 sm:order-1">
            Showing <span className="font-medium">{startItem}</span>-
            <span className="font-medium">{endItem}</span> {ofLabel}{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
        )}

        {/* Pagination controls - Right side */}
        <div className="flex items-center gap-2 order-1 sm:order-2">
          
          {/* First page button */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              aria-label="Go to first page"
              title={firstLabel || "First page"}
              className={buttonClassName}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Previous button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
            title={prevLabel || "Previous page"}
            className={buttonClassName}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          {showPageNumbers && (
            <div className="hidden md:flex items-center space-x-1">
              {pages.map((page, index) => {
                if (page === '...') {
                  return (
                    <span
                      key={`dots-${index}`}
                      className="px-3 py-2 text-sm text-muted-foreground"
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={cn(
                      buttonClassName,
                      currentPage === page && activeButtonClassName
                    )}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Mobile page indicator */}
          {showPageNumbers && (
            <span className="text-sm md:hidden">
              Page {currentPage} of {totalPages}
            </span>
          )}

          {/* Next button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
            title={nextLabel || "Next page"}
            className={buttonClassName}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page button */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Go to last page"
              title={lastLabel || "Last page"}
              className={buttonClassName}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Page size selector - Bottom for mobile, side for desktop */}
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {rowsPerPageLabel}
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}