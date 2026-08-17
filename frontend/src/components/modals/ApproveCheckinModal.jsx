import React, { useEffect } from 'react';

export default function ApproveCheckinModal({
  checkin,
  onClose,
  coachNotes,
  setCoachNotes,
  onApprove,
  approving
}) {
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

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
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
          <div className="modal-body p-4 text-end">
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
                  <span className="fw-bold fs-5 text-success">-0.44 كجم 📉</span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded-3 text-center border">
                  <small className="text-muted d-block">الالتزام بالدايت</small>
                  <span className="fw-bold fs-5 text-primary">{checkin.adherence || '95'}% ⭐</span>
                </div>
              </div>
            </div>

            <div className="p-3 mb-3 rounded-3" style={{ backgroundColor: '#eff6ff', borderRight: '4px solid #3b82f6' }}>
              <div className="fw-bold text-primary mb-1">
                <i className="ti ti-cpu me-1"></i> مقترح التكيف الآلي من Z-Engine V2:
              </div>
              <p className="small mb-0 text-dark">
                حرق الدهون يسير بمعدل مثالي (-0.44 كجم). تم تثبيت السعرات الحالية ({checkin.proposed_calories || 2200} kcal) وزيادة مجموعة تدريبية واحدة (Volume Progression) لعضلات الصدر والظهر.
              </p>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold small text-dark">ملاحظات وتوجيهات الكابتن للمتدرب:</label>
              <textarea 
                className="form-control" 
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
            >
              {approving ? 'جاري الاعتماد...' : 'اعتماد التكيف وتحديث الخطة 💾'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
