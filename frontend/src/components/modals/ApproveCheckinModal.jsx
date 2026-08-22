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

  const analysis = checkin.analysis_output || checkin.analysis || {};
  const status = checkin.analysis_status || analysis.analysis_status || 'ON_TRACK';
  const adherence = Number(checkin.nutrition_adherence_percent || checkin.adherence || 95);
  const weightChange = checkin.weight_change_kg !== undefined ? checkin.weight_change_kg : -0.4;
  const waistChange = checkin.waist_change_cm !== undefined ? checkin.waist_change_cm : -0.5;

  const getStatusBadge = () => {
    switch (status) {
      case 'BODY_RECOMP_SUCCESS':
        return <span className="badge rounded-pill bg-success px-3 py-1.5 fw-bold">إعادة تكوين عضلي ناجحة (Recomp)</span>;
      case 'TRUE_PLATEAU':
      case 'PLATEAU_DETECTED':
        return <span className="badge rounded-pill bg-warning text-dark px-3 py-1.5 fw-bold">ثبات وزن يحتاج تعديل</span>;
      case 'RAPID_LOSS_WARNING':
        return <span className="badge rounded-pill bg-info text-dark px-3 py-1.5 fw-bold">نزول سريع (+150 سعرة مقترحة)</span>;
      case 'INJURY_FLAGGED':
      case 'DELOAD_RECOMMENDED':
        return <span className="badge rounded-pill bg-danger px-3 py-1.5 fw-bold">تفريغ أحمال / ألم مفاصل (Deload)</span>;
      case 'POOR_ADHERENCE':
        return <span className="badge rounded-pill bg-secondary px-3 py-1.5 fw-bold">تثبيت السعرات (التزام منخفض)</span>;
      default:
        return <span className="badge rounded-pill bg-success-subtle text-success border border-success px-3 py-1.5 fw-bold">التقدم ممتاز (On Track)</span>;
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }} dir="rtl">
          
          {/* Header */}
          <div className="modal-header border-bottom p-4 bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', background: '#E5F0FF', color: '#0284C7', border: '1px solid #BAE6FD' }}>
                <i className="ti ti-checkup-list fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>مراجعة واعتماد متابعة الأسبوع {checkin.week_number || 1}</h5>
                <small className="text-muted" style={{ fontSize: '0.78rem' }}>المتدرب: {checkin.full_name || checkin.client_code || 'كريم عادل'}</small>
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
            
            {/* Status Header */}
            <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded-3 border" style={{ background: '#f8faff', borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark small">قرار النظام الذكي:</span>
                {getStatusBadge()}
              </div>
              <small className="text-muted">الالتزام بالدايت: <strong className="text-success">{adherence}%</strong></small>
            </div>

            {/* Quick Metrics */}
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <div className="p-3 rounded-3 text-center border" style={{ background: '#F0F9FF', borderColor: '#F0F9FF' }}>
                  <small className="text-muted d-block" style={{ fontSize: '0.76rem' }}>الوزن المسجل</small>
                  <span className="fw-bold fs-5 text-dark font-monospace">{checkin.average_weight_kg || checkin.weight_kg || '84.5'} كجم</span>
                  <small className="d-block text-muted" style={{ fontSize: '0.7rem' }}>
                    {weightChange ? `التغير: ${weightChange > 0 ? '+' : ''}${weightChange} كجم` : 'وزن البداية'}
                  </small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded-3 text-center border" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
                  <small className="text-muted d-block" style={{ fontSize: '0.76rem' }}>محيط الخصر (عند السرة)</small>
                  <span className="fw-bold fs-5 text-success font-monospace">{checkin.waist_circumference_cm || '88'} سم</span>
                  <small className="d-block text-success fw-bold" style={{ fontSize: '0.7rem' }}>
                    {waistChange ? `التغير: ${waistChange > 0 ? '+' : ''}${waistChange} سم` : 'القياس الأولي'}
                  </small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded-3 text-center border" style={{ background: '#E5F0FF', borderColor: '#F0F9FF' }}>
                  <small className="text-muted d-block" style={{ fontSize: '0.76rem' }}>جلسات التمرين المنجزة</small>
                  <span className="fw-bold fs-5 font-monospace" style={{ color: '#0284C7' }}>{checkin.workouts_completed || 4} / 4 جلسات</span>
                  <small className="d-block text-muted" style={{ fontSize: '0.7rem' }}>انضباط تام</small>
                </div>
              </div>
            </div>

            {/* System Auto-Regulation Recommendation Box */}
            <div className="p-3 mb-3 rounded-4 border" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
              <h6 className="fw-bold text-dark mb-1.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.88rem' }}>
                <i className="ti ti-brain text-primary fs-5"></i> التفسير الرياضي والتوصية المقترحة للأسبوع القادم:
              </h6>
              <p className="small mb-0 text-dark" style={{ lineHeight: '1.7', fontSize: '0.84rem' }}>
                {analysis.recommendations_ar?.[0] || 'التقدم ممتاز واستجابة الجسم مثالية. استمر على نفس الخطة الحالية مع تدوير الأصناف.'}
              </p>
            </div>

            {/* Photo Comparison Toggle */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="fw-bold small text-dark mb-0">مقارنة الصور وتطور القياسات:</label>
                <button 
                  type="button" 
                  className="btn btn-sm rounded-pill px-3 fw-semibold shadow-xs"
                  style={{ fontSize: '0.78rem', background: '#E5F0FF', color: '#0284C7', border: '1px solid #BAE6FD' }}
                  onClick={() => setShowPhotoCompare(!showPhotoCompare)}
                >
                  <i className="ti ti-photo me-1"></i> {showPhotoCompare ? 'إخفاء الصور' : 'عرض صور التطور'}
                </button>
              </div>

              {showPhotoCompare && (
                <div className="p-3 bg-light rounded-4 border">
                  <div className="row g-3 text-center">
                    <div className="col-4">
                      <div className="border rounded-3 p-2 bg-white">
                        <small className="text-muted fw-bold d-block mb-1">أمامي (Front)</small>
                        <div className="bg-secondary-subtle rounded d-flex align-items-center justify-content-center" style={{ height: '120px' }}>
                          <i className="ti ti-user fs-1 text-muted"></i>
                        </div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border rounded-3 p-2 bg-white">
                        <small className="text-muted fw-bold d-block mb-1">جانبي (Side)</small>
                        <div className="bg-secondary-subtle rounded d-flex align-items-center justify-content-center" style={{ height: '120px' }}>
                          <i className="ti ti-user fs-1 text-muted"></i>
                        </div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border rounded-3 p-2 bg-white">
                        <small className="text-muted fw-bold d-block mb-1">خلفي (Back)</small>
                        <div className="bg-secondary-subtle rounded d-flex align-items-center justify-content-center" style={{ height: '120px' }}>
                          <i className="ti ti-user fs-1 text-muted"></i>
                        </div>
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
              className="btn btn-sm rounded-pill px-4 fw-bold shadow-sm text-white d-flex align-items-center gap-1.5"
              style={{ height: '38px', background: 'linear-gradient(135deg, #0284C7 0%, #0284C7 100%)', border: 'none', boxShadow: '0 2px 10px rgba(38, 28, 106, 0.22)', fontSize: '0.84rem' }}
            >
              {approving ? (
                <><span className="spinner-border spinner-border-sm"></span> جاري التحديث...</>
              ) : (
                <><i className="ti ti-circle-check fs-6"></i> اعتماد وتحديث الخطة فوراً (Approve & Update)</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

