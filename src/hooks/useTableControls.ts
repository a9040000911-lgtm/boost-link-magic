import { useMemo, useState } from "react";

interface UseTableControlsOptions<T> {
  data: T[];
  pageSize?: number;
}

export function useTableControls<T>({ data, pageSize = 50 }: UseTableControlsOptions<T>) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safeCurrentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safeCurrentPage, pageSize]);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const next = () => goTo(safeCurrentPage + 1);
  const prev = () => goTo(safeCurrentPage - 1);

  // Reset to page 1 when data changes length significantly
  const resetPage = () => setPage(1);

  return {
    page: safeCurrentPage,
    totalPages,
    paginated,
    goTo,
    next,
    prev,
    resetPage,
    total: data.length,
    from: (safeCurrentPage - 1) * pageSize + 1,
    to: Math.min(safeCurrentPage * pageSize, data.length),
  };
}

export function exportToCsv(filename: string, headers: string[], rows: string[][]) {
  const bom = "\uFEFF"; // UTF-8 BOM for Excel
  const csv = bom + [headers.join(";"), ...rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
