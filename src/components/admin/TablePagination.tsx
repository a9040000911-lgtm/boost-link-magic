import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  goTo: (p: number) => void;
  next: () => void;
  prev: () => void;
}

export function TablePagination({ page, totalPages, total, from, to, goTo, next, prev }: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between shrink-0 px-1 py-1.5">
      <span className="text-[11px] text-muted-foreground">
        {from}–{to} из {total}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => goTo(1)}>
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={prev}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs font-medium px-2 min-w-[60px] text-center">
          {page} / {totalPages}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={next}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => goTo(totalPages)}>
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
