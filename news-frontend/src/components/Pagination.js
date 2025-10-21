import React from 'react';

const Pagination = ({
  page,
  totalPages,
  onChange,
  disableFirstLast = false,
}) => {
  const isFirst = page <= 0;
  const isLast = totalPages === 0 || page >= totalPages - 1;

  const handlePrev = () => {
    if (!isFirst) onChange(page - 1);
  };

  const handleNext = () => {
    if (!isLast) onChange(page + 1);
  };

  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div className="text-muted small">
        Trang {totalPages === 0 ? 0 : page + 1}/{totalPages}
      </div>
      <div className="btn-group">
        {!disableFirstLast && (
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => onChange(0)}
            disabled={isFirst}
          >
            <i className="fas fa-angle-double-left me-1"></i>Đầu
          </button>
        )}
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={handlePrev}
          disabled={isFirst}
        >
          <i className="fas fa-arrow-left me-1"></i>Trước
        </button>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={handleNext}
          disabled={isLast}
        >
          Sau<i className="fas fa-arrow-right ms-1"></i>
        </button>
        {!disableFirstLast && (
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => onChange(totalPages - 1)}
            disabled={isLast}
          >
            Cuối<i className="fas fa-angle-double-right ms-1"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;




