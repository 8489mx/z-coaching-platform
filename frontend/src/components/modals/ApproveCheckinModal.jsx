import React, { useEffect, useState } from 'react';

export default function ApproveCheckinModal({
  checkin,
  onClose,
  coachNotes,
  setCoachNotes,
  onApprove,
  approving
}) {
  const [showPhotoCompare, setShowPhotoCompare] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };
    if (checkin) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checkin, onClose]);

  if (!checkin) return null;

  const adherence = Number(checkin.adherence || checkin.nutrition_adherence_percent || 95);
  const isRefeedRecommended = adherence >= 90;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden' }} dir="rtl">
          
          {/* Header */}
          <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 bg-primary text-white rounded-circle">
                <i className="ti ti-checkup-list fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0">مراجعة واعتماد متابعة الأسبوع {checkin.week_number || 1}</h5>
                <small className="text-muted">المتدرب: {checkin.full_name || checkin.client_code}</small>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 text-start" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            
            {/* Quick Metrics */}
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <div className="p-3 bg-light rounded-3 text-center border">
                  <small className="text-muted d-block">متوسط الوزن الحالي</small>
                  <span className="fw-bold fs-5 text-dark">{checkin.average_weight || checkin.weight || '84.4'} كجم</span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded-3 text-center border">
                  <small className="text-muted d-block">معدل التغير</small>
                  <span className="fw-bold fs-5 text-success">-0.44 كجم</span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded-3 text-center border">
                  <small className="text-muted d-block">الالتزام بالدايت</small>
                  <span className="fw-bold fs-5 text-primary">{adherence}%</span>
                </div>
              </div>
            </div>

            {/* Smart Refeed / Cheat Guidance Box */}
            <div className="p-3 mb-3 rounded-4 border border-warning-subtle" style={{ backgroundColor: '#fffbeb' }}>
              <h6 className="fw-bold text-warning-emphasis mb-1 d-flex align-items-center gap-1">
                <i className="ti ti-flame text-warning fs-5"></i> توصية وجبة الريفيد الذكية (Smart Refeed Guidance)
              </h6>
              <p className="small mb-0 text-dark" style={{ lineHeight: '1.6' }}>
                {isRefeedRecommended ? (
                  <>الالتزام ممتاز ({adherence}%) ونزول الوزن يسير بانضباط. يُقترح منح المتدرب <strong>وجبة ريفيد عالية الكاربوهيدرات (Refeed Meal)</strong> يوم الجمعة لرفع كفاءة هرمون الليبتين وتجديد مخازن الجليكوجين.</>
                ) : (
                  <>نسبة الالتزام أقل من 90%؛ يُفضل تثبيت الوجبات الحالية بدون وجبة فري إضافية لضمان استمرار حرق الدهون.</>
                )}
              </p>
            </div>

            {/* Meal Rotation Notice */}
            <div className="p-3 mb-3 rounded-4 bg-light border">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong className="text-dark small d-block">تفضيل وجبات الأسبوع القادم:</strong>
                  <small className="text-muted">طلب المتدرب تجديد أصناف البروتين والكارب لكسر الروتين.</small>
                </div>
                <span className="badge bg-success-subtle text-success px-3 py-1 rounded-pill fw-bold">
                  <i className="ti ti-arrows-shuffle me-1"></i> تدوير ذكي مفعل
                </span>
              </div>
            </div>

            {/* Before / After Photo Comparison Toggle */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="fw-bold small text-dark mb-0">مقارنة الصور وتطور القياسات:</label>
                <button 
                  type="button" 
                  className="btn btn-outline-primary btn-sm rounded-pill px-3"
                  onClick={() => setShowPhotoCompare(!showPhotoCompare)}
                >
                  <i className="ti ti-photo me-1"></i> {showPhotoCompare ? 'إخفاء المقارنة' : 'عرض صور المقارنة جنباً إلى جنب'}
                </button>
              </div>

              {showPhotoCompare && (
                <div className="p-3 bg-light rounded-4 border">
                  <div className="row g-3 text-center">
                    <div className="col-6">
                      <div className="border rounded-3 p-2 bg-white">
                        <small className="text-muted fw-bold d-block mb-1">الأسبوع 1 (البداية)</small>
                        <div className="bg-secondary-subtle rounded d-flex align-items-center justify-content-center" style={{ height: '140px' }}>
                          <i className="ti ti-user fs-1 text-muted"></i>
                        </div>
                        <small className="text-muted mt-1 d-block">الوزن: 86.5 كجم</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded-3 p-2 bg-white border-primary">
                        <small className="text-primary fw-bold d-block mb-1">الأسبوع الحالي</small>
                        <div className="bg-primary-subtle rounded d-flex align-items-center justify-content-center" style={{ height: '140px' }}>
                          <i className="ti ti-user-check fs-1 text-primary"></i>
                        </div>
                        <small className="text-success fw-bold mt-1 d-block">الوزن: 84.4 كجم (-2.1 كجم)</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Coach Notes */}
            <div className="mb-3">
              <label className="form-label fw-bold small text-dark">ملاحظات وتوجيهات الكابتن للمتدرب:</label>
              <textarea 
                className="form-control bg-light border-0" 
                rows="3" 
                placeholder="اكتب توجيهاتك أو ملاحظاتك التشجيعية للمتدرب هنا..."
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer p-3 bg-light d-flex justify-content-between">
            <button type="button" className="btn btn-secondary btn-sm rounded-pill px-4" onClick={onClose}>
              إلغاء
            </button>
            <button 
              type="button" 
              disabled={approving}
              onClick={onApprove}
              className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm"
              style={{ background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)', border: 'none' }}
            >
              {approving ? 'جاري الاعتماد...' : 'اعتماد التكيف وتحديث الخطة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
