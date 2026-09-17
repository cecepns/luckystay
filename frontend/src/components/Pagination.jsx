import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
}) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-gray-100">
      
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>
          Menampilkan <strong className="text-gray-800">{Math.min(totalItems, (currentPage - 1) * limit + 1)}</strong> - <strong className="text-gray-800">{Math.min(totalItems, currentPage * limit)}</strong> dari <strong className="text-gray-800">{totalItems}</strong>
        </span>
        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <label htmlFor="per-page" className="text-gray-400">Per hal:</label>
            <select
              id="per-page"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50">1</button>
            {pages[0] > 2 && <span className="px-1 text-gray-300">...</span>}
          </>
        )}

        {pages.map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
              pageNum === currentPage
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {pageNum}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-gray-300">...</span>}
            <button onClick={() => onPageChange(totalPages)} className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50">{totalPages}</button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
