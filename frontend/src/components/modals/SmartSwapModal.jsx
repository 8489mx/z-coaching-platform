import React, { useEffect } from 'react';

export default function SmartSwapModal({
  isOpen,
  onClose,
  selectedFoodItem,
  swapCandidates,
  swapLoading,
  onExecuteSwap,
  formatFoodTitle
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !selectedFoodItem) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(5px)", zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "20px", overflow: "hidden" }}>
          {/* Header */}
          <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 bg-primary text-white rounded-circle">
                <i className="ti ti-arrows-exchange fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0">محرك التبديل الذكي (Smart Swap)</h5>
                <small className="text-muted">نظام التكافؤ الماكروزي الآلي</small>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 text-end">
            <div className="p-3 bg-light rounded-3 mb-3 border">
              <small className="text-muted d-block">الصنف الحالي المراد استبداله:</small>
              <h6 className="fw-bold text-primary mb-0">
                {formatFoodTitle ? formatFoodTitle(selectedFoodItem) : (selectedFoodItem.name_ar || selectedFoodItem.food_code)}
              </h6>
            </div>

            <h6 className="fw-bold mb-3 text-dark">البدائل المتاحة المتوافقة مع الوجبة:</h6>

            {swapLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">جاري احتساب المقادير المكافئة بدقة...</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2" style={{ maxHeight: "320px", overflowY: "auto" }}>
                {swapCandidates.length === 0 ? (
                  <div className="p-3 text-center text-muted">
                    لا توجد بدائل مباشرة مطابقة حالياً لهذا الصنف.
                  </div>
                ) : (
                  swapCandidates.map((candidate) => (
                    <button
                      key={candidate.food_code}
                      onClick={() => onExecuteSwap(candidate.food_code)}
                      className="btn btn-light text-dark p-3 text-end d-flex justify-content-between align-items-center border rounded-3 shadow-sm"
                      style={{ backgroundColor: '#fff' }}
                    >
                      <div>
                        <strong className="d-block text-dark mb-1">{candidate.name_ar}</strong>
                        <span className="badge bg-primary-subtle text-primary fw-bold" style={{ fontSize: '0.82rem' }}>
                          {candidate.serving_display_ar || candidate.display_ar || `${candidate.target_grams || 100} جرام`}
                        </span>
                      </div>
                      <span className="btn btn-primary btn-sm rounded-pill px-3 py-1 fw-semibold">
                        تبديل ➜
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light border-0 py-2">
            <button type="button" className="btn btn-secondary px-4 rounded-pill" onClick={onClose}>
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
