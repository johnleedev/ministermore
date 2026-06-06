import React from 'react';
import './Pagination.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 한 번에 표시할 번호 버튼 수 (기본 5) */
  windowSize?: number;
  /** 페이지 변경 직후 추가 동작 (예: 스크롤) */
  onAfterChange?: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  windowSize = 5,
  onAfterChange,
  className,
}: PaginationProps) {
  if (totalPages <= 0) return null;

  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  const pageNumbers: number[] = [];
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  const showLeftEllipsis =
    pageNumbers.length >= windowSize && pageNumbers[0] > 1;
  const showRightEllipsis =
    pageNumbers.length >= windowSize &&
    pageNumbers[pageNumbers.length - 1] < totalPages;

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    onPageChange(newPage);
    onAfterChange?.(newPage);
  };

  return (
    <div className={['pagination', className].filter(Boolean).join(' ')}>
      <div className="pagination__numbers">
        {showLeftEllipsis && (
          <span
            className="pagination__ellipsis pagination__ellipsis--left"
            aria-hidden="true"
          >
            ···
          </span>
        )}
        {pageNumbers.map((page) => (
          <button
            type="button"
            key={page}
            className={`pagination__btn${
              page === currentPage ? ' pagination__btn--on' : ''
            }`}
            onClick={() => changePage(page)}
          >
            {page}
          </button>
        ))}
        {showRightEllipsis && (
          <span
            className="pagination__ellipsis pagination__ellipsis--right"
            aria-hidden="true"
          >
            ···
          </span>
        )}
      </div>
      <div className="pagination__arrows">
        <button
          type="button"
          className="pagination__btn pagination__btn--first"
          onClick={() => changePage(1)}
          disabled={currentPage === 1}
        >
          {'<<'}
        </button>
        <button
          type="button"
          className="pagination__btn pagination__btn--prev"
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          {'<'}
        </button>
        <button
          type="button"
          className="pagination__btn pagination__btn--next"
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          {'>'}
        </button>
        <button
          type="button"
          className="pagination__btn pagination__btn--last"
          onClick={() => changePage(totalPages)}
          disabled={currentPage === totalPages}
        >
          {'>>'}
        </button>
      </div>
    </div>
  );
}
