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
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }} dir="rtl">
          
          {/* Header */}
          <div className="modal-header border-bottom p-4 bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}>
                <i className="ti ti-checkup-list fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>مراجعة واعتماد متابعة الأسبوع {checkin.week_number || 1}</h5>
                <small className="text-muted" style={{ fontSize: '0.78rem' }}>المتدرب: {checkin.full_name || checkin.client_code}</small>
              </div>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
              style={{ width: '34px', height: '34px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
              title="إغلاق"
            >
              <i className="ti ti-x fs-6"></i>
            </button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 text-start bg-white" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            
            {/* Quick Metrics */}
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <div className="p-3 rounded-3 text-center border" style={{ background: '#fbfaff', borderColor: '#ede9fe' }}>
                  <small className="text-muted d-block" style={{ fontSize: '0.76rem' }}>متوسط الوزن الحالي</small>
                  <span className="fw-bold fs-5 text-dark font-monospace">{checkin.average_weight || checkin.weight || '84.4'} كجم</span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded-3 text-center border" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
                  <small className="text-muted d-block" style={{ fontSize: '0.76rem' }}>معدل التغير</small>
                  <span className="fw-bold fs-5 text-success font-monospace">-0.44 كجم</span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded-3 text-center border" style={{ background: '#f5f3ff', borderColor: '#ede9fe' }}>
                  <small className="text-muted d-block" style={{ fontSize: '0.76rem' }}>الالتزام بالدايت</small>
                  <span className="fw-bold fs-5 font-monospace" style={{ color: '#261c6a' }}>{adherence}%</span>
                </div>
              </div>
            </div>

            {/* Smart Refeed / Cheat Guidance Box */}
            <div className="p-3 mb-3 rounded-4 border" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
              <h6 className="fw-bold text-warning-emphasis mb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.88rem' }}>
                <i className="ti ti-flame text-warning fs-5"></i> توصية وجبة الريفيد الذكية (Smart Refeed Guidance)
              </h6>
              <p className="small mb-0 text-dark" style={{ lineHeight: '1.6', fontSize: '0.82rem' }}>
                {isRefeedRecommended ? (
                  <>الالتزام ممتاز ({adherence}%) ونزول الوزن يسير بانضباط. يُقترح منح المتدرب <strong>وجبة ريفيد عالية الكاربوهيدرات (Refeed Meal)</strong> يوم الجمعة لرفع كفاءة هرمون الليبتين وتجديد مخازن الجليكوجين.</>
                ) : (
                  <>نسبة الالتزام أقل من 90%؛ يُفضل تثبيت الوجبات الحالية بدون وجبة فري إضافية لضمان استمرار حرق الدهون.</>
                )}
              </p>
            </div>

            {/* Meal Rotation Notice */}
            <div className="p-3 mb-3 rounded-4 border" style={{ background: '#fbfaff', borderColor: '#ede9fe' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong className="text-dark small d-block">تفضيل وجبات الأسبوع القادم:</strong>
                  <small className="text-muted" style={{ fontSize: '0.76rem' }}>طلب المتدرب تجديد أصناف البروتين والكارب لكسر الروتين.</small>
                </div>
                <span className="badge rounded-pill fw-semibold px-3 py-1" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7', fontSize: '0.75rem' }}>
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
                  className="btn btn-sm rounded-pill px-3 fw-semibold shadow-xs"
                  style={{ fontSize: '0.78rem', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}
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
                      <div className="border rounded-3 p-2 bg-white" style={{ borderColor: '#ddd6fe' }}>
                        <small className="fw-bold d-block mb-1" style={{ color: '#261c6a' }}>الأسبوع الحالي</small>
                        <div className="rounded d-flex align-items-center justify-content-center" style={{ height: '140px', background: '#f5f3ff', color: '#261c6a' }}>
                          <i className="ti ti-user-check fs-1"></i>
                        </div>
                        <small className="text-success fw-bold mt-1 d-block">الوزن: 84.4 كجم (-2.1 كجم)</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Coach Notes */}
            <div className="mb-2">
              <label className="form-label fw-bold small text-dark">ملاحظات وتوجيهات الكابتن للمتدرب:</label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="اكتب توجيهاتك أو ملاحظاتك التشجيعية للمتدرب هنا..."
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                style={{ fontSize: '0.86rem', borderRadius: '12px' }}
              ></textarea>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer p-3 bg-light d-flex justify-content-between border-top" style={{ borderColor: '#f1f5f9' }}>
            <button type="button" className="btn btn-light btn-sm rounded-pill px-4 border text-dark" style={{ height: '36px' }} onClick={onClose}>
              إلغاء
            </button>
            <button 
              type="button" 
              disabled={approving}
              onClick={onApprove}
              className="btn btn-sm rounded-pill px-4 fw-bold shadow-sm text-white"
              style={{ height: '36px', background: 'linear-gradient(135deg, #261c6a 0%, #4338ca 100%)', border: 'none', boxShadow: '0 2px 10px rgba(38, 28, 106, 0.22)', fontSize: '0.82rem' }}
            >
              {approving ? 'جاري الاعتماد...' : 'اعتماد المتابعة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
