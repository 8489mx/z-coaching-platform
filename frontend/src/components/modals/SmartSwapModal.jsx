import React, { useEffect } from 'react';

export default function SmartSwapModal({
  isOpen,
  onClose,
  selectedFoodItem,
  swapCandidates = [],
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

  // Helper to extract clean portion text
  const currentGrams = selectedFoodItem.portion_g_rounded || selectedFoodItem.grams || selectedFoodItem.portion_g || 100;
  const currentTitle = formatFoodTitle ? formatFoodTitle(selectedFoodItem) : (selectedFoodItem.name_ar || selectedFoodItem.food_code || 'صنف غذائي');

  return (
    <div 
      className="modal show d-block" 
      tabIndex="-1" 
      style={{ 
        backgroundColor: "rgba(15, 23, 42, 0.6)", 
        backdropFilter: "blur(6px)", 
        zIndex: 1060 
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
        <div 
          className="modal-content border-0 shadow-2xl overflow-hidden" 
          style={{ 
            borderRadius: "22px", 
            background: "#ffffff",
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25), 0 0 30px rgba(38, 28, 106, 0.08)' 
          }} 
          dir="rtl"
        >
          {/* Header */}
          <div 
            className="p-4 bg-white d-flex justify-content-between align-items-center" 
            style={{ 
              borderBottom: '1px solid #f1f5f9'
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', 
                  color: '#261c6a', 
                  border: '1px solid #ddd6fe',
                  boxShadow: '0 2px 8px rgba(38, 28, 106, 0.08)'
                }}
              >
                <i className="ti ti-arrows-exchange fs-4"></i>
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-0 lh-1" style={{ fontSize: '1.08rem', letterSpacing: '-0.3px', color: '#1e144f' }}>
                  محرك التبديل الذكي <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: '600' }}>(Smart Swap)</span>
                </h5>
                <small className="text-muted mt-1 d-block" style={{ fontSize: '0.74rem' }}>
                  احتساب المقادير المكافئة بدقة لتثبيت نفس سعرات وماكروز الخطة
                </small>
              </div>
            </div>

            {/* Non-overlapping Close Button */}
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 transition-all"
              style={{ 
                width: '32px', 
                height: '32px', 
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b'
              }}
              title="إغلاق"
            >
              <i className="ti ti-x fs-6"></i>
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-white">
            {/* Current Item Card */}
            <div 
              className="p-3 rounded-4 mb-3 position-relative overflow-hidden" 
              style={{ 
                background: 'linear-gradient(135deg, #faf8ff 0%, #f5f0ff 100%)', 
                border: '1px solid #ede9fe',
                borderRight: '4px solid #261c6a'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: '#ffffff', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                  الصنف الحالي في الوجبة
                </span>
                <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: '#f5f3ff', color: '#4338ca', fontSize: '0.72rem' }}>
                  الكمية الحالية: {currentGrams} جرام
                </span>
              </div>
              <h6 className="fw-bold mb-0 mt-2" style={{ color: '#1e144f', fontSize: '0.98rem' }}>
                {currentTitle}
              </h6>
            </div>

            {/* Candidates Header */}
            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
              <span className="fw-bold text-dark" style={{ fontSize: '0.86rem' }}>
                البدائل الغذائية المتكافئة ماكروزياً:
              </span>
              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                {swapCandidates.length} بدائل مطابقة
              </span>
            </div>

            {/* Swap Candidates List */}
            {swapLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                <p className="mt-2 text-muted small">جاري احتساب المقادير المكافئة للماكروز...</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2" style={{ maxHeight: "310px", overflowY: "auto", paddingLeft: '2px', paddingRight: '2px' }}>
                {swapCandidates.length === 0 ? (
                  <div className="p-4 text-center text-muted small bg-light rounded-3 border">
                    لا توجد بدائل مباشرة مسجلة لهذا الصنف حالياً في نفس الوجبة.
                  </div>
                ) : (
                  swapCandidates.map((candidate) => {
                    const targetGrams = candidate.target_grams || (
                      candidate.serving_display_ar?.match(/\((\d+)\s*جرام\)/)?.[1]
                    ) || (
                      candidate.serving_display_ar?.match(/(\d+)\s*[gG]/)?.[1]
                    ) || 100;

                    return (
                      <div
                        key={candidate.food_code}
                        className="p-3 border rounded-3 bg-white d-flex justify-content-between align-items-center transition-all shadow-xs"
                        style={{ 
                          borderColor: '#e2e8f0',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div className="flex-grow-1">
                          <strong className="d-block text-dark mb-1" style={{ fontSize: '0.92rem' }}>
                            {candidate.name_ar}
                          </strong>
                          <div className="d-flex align-items-center gap-2">
                            <span 
                              className="badge rounded-pill fw-bold px-2 py-1" 
                              style={{ 
                                background: '#ecfdf5', 
                                color: '#059669', 
                                border: '1px solid #a7f3d0', 
                                fontSize: '0.74rem' 
                              }}
                            >
                              المقدار البديل: <strong className="text-dark">{targetGrams} جرام</strong>
                            </span>
                            <small className="text-muted" style={{ fontSize: '0.68rem' }}>مكافئ غذائياً</small>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onExecuteSwap(candidate.food_code)}
                          className="btn btn-sm rounded-pill px-3 py-1 fw-bold text-white d-flex align-items-center gap-1 shadow-xs flex-shrink-0"
                          style={{ 
                            background: 'linear-gradient(135deg, #261c6a 0%, #4338ca 100%)', 
                            border: 'none', 
                            fontSize: '0.8rem',
                            height: '34px'
                          }}
                        >
                          <i className="ti ti-arrows-exchange"></i>
                          <span>تبديل</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div 
            className="p-3 bg-light d-flex justify-content-between align-items-center" 
            style={{ 
              borderTop: '1px solid #f1f5f9' 
            }}
          >
            <small className="text-muted" style={{ fontSize: '0.72rem' }}>
              التبديل يقوم بتحديث الخطة آلياً دون الإخلال بإجمالي السعرات.
            </small>

            <button 
              type="button" 
              className="btn btn-light btn-sm px-4 rounded-pill border text-dark fw-bold" 
              style={{ height: '34px', fontSize: '0.8rem' }} 
              onClick={onClose}
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
