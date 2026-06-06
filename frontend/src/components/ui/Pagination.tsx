import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface Props { currentPage: number; totalPages: number; onPageChange: (p: number) => void; totalItems: number; itemsPerPage: number; }
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: Props) => {
  if (totalPages <= 1) return null;
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) for (let i = 1; i <= totalPages; i++) pages.push(i);
    else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };
  return (
    <div className="flex items-center justify-between gap-4 mt-6 px-2" aria-label="Navigazione paginazione">
      <div className="text-xs text-gray-500 dark:text-gray-400">{start}–{end} di {totalItems} risultati</div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-30" aria-label="Pagina precedente"><ChevronLeft size={16} /></button>
        {getPageNumbers().map((p, i) => p === '...' ? <span key={i} className="w-9 h-9 flex items-center justify-center text-gray-400">…</span> : <button key={i} onClick={() => onPageChange(p as number)} className={`w-9 h-9 rounded-xl text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500 ${currentPage === p ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`} aria-current={currentPage === p ? 'page' : undefined}>{p}</button>)}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-30" aria-label="Pagina successiva"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};
export default Pagination;