import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SimplePaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (pageNumber: number) => void;
  className?: string;
}

export default function SimplePagination({
  pageNumber,
  pageSize,
  totalCount,
  onPageChange,
  className,
}: SimplePaginationProps) {
  if (totalCount === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = (pageNumber - 1) * pageSize + 1;
  const endItem = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div
      className={cn(
        "mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-xs text-muted-foreground">
        Hiển thị {startItem}-{endItem} / {totalCount}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pageNumber <= 1}
          onClick={() => onPageChange(pageNumber - 1)}
        >
          Trước
        </Button>
        <span className="min-w-20 text-center text-xs text-muted-foreground">
          Trang {pageNumber}/{totalPages}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pageNumber >= totalPages}
          onClick={() => onPageChange(pageNumber + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}
