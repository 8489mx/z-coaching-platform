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
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "20px", overflow: "hidden" }} dir="rtl">
          {/* Header */}
          <div className="modal-header border-bottom p-4 bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}>
                <i className="ti ti-arrows-exchange fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>محرك التبديل الذكي (Smart Swap)</h5>
                <small className="text-muted" style={{ fontSize: '0.78rem' }}>نظام التكافؤ الماكروزي الآلي</small>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} title="إغلاق"></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 text-start bg-white">
            <div className="p-3 rounded-3 mb-3 border" style={{ background: '#fbfaff', borderColor: '#ede9fe' }}>
              <small className="text-muted d-block" style={{ fontSize: '0.76rem' }}>الصنف الحالي المراد استبداله:</small>
              <h6 className="fw-bold mb-0" style={{ color: '#261c6a', fontSize: '0.92rem' }}>
                {formatFoodTitle ? formatFoodTitle(selectedFoodItem) : (selectedFoodItem.name_ar || selectedFoodItem.food_code)}
              </h6>
            </div>

            <h6 className="fw-bold mb-3 text-dark" style={{ fontSize: '0.88rem' }}>البدائل المتاحة المتوافقة مع الوجبة:</h6>

            {swapLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted small">جاري احتساب المقادير المكافئة بدقة...</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2" style={{ maxHeight: "320px", overflowY: "auto" }}>
                {swapCandidates.length === 0 ? (
                  <div className="p-3 text-center text-muted small">
                    لا توجد بدائل مباشرة مطابقة حالياً لهذا الصنف.
                  </div>
                ) : (
                  swapCandidates.map((candidate) => (
                    <button
                      key={candidate.food_code}
                      onClick={() => onExecuteSwap(candidate.food_code)}
                      className="btn btn-light text-dark p-3 text-start d-flex justify-content-between align-items-center border rounded-3 transition-all"
                      style={{ backgroundColor: '#fff', borderColor: '#e2e8f0' }}
                    >
                      <div>
                        <strong className="d-block text-dark mb-1" style={{ fontSize: '0.88rem' }}>{candidate.name_ar}</strong>
                        <span className="badge rounded-pill fw-semibold font-monospace" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.75rem' }}>
                          {candidate.serving_display_ar || candidate.display_ar || `${candidate.target_grams || 100} جرام`}
                        </span>
                      </div>
                      <span className="btn btn-sm rounded-pill px-3 py-1 fw-bold text-white shadow-xs" style={{ background: '#261c6a', border: 'none', fontSize: '0.78rem' }}>
                        تبديل 
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light border-top p-3 d-flex justify-content-end" style={{ borderColor: '#f1f5f9' }}>
            <button type="button" className="btn btn-light btn-sm px-4 rounded-pill border text-dark" style={{ height: '36px' }} onClick={onClose}>
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
