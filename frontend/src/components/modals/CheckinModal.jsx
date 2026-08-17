import React, { useEffect } from 'react';

export default function CheckinModal({
  isOpen,
  onClose,
  checkinForm,
  setCheckinForm,
  onSubmit,
  loading,
  checkinResult
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

  if (!isOpen) return null;

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)", zIndex: 1065 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '540px' }}>
        <div 
          className="modal-content border-0 shadow-2xl bg-white position-relative" 
          style={{ 
            borderRadius: "24px", 
            border: '1px solid #edf2f7',
            boxShadow: '0 25px 60px -15px rgba(38, 28, 106, 0.22), 0 0 0 1px rgba(0,0,0,0.03)'
          }} 
          dir="rtl"
        >
          
          {/* Header */}
          <div className="modal-header border-bottom p-4 bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px', background: '#f5f3ff', color: '#261c6a', border: '1.5px solid #ddd6fe' }}>
                <i className="ti ti-clipboard-check fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.08rem', letterSpacing: '-0.3px' }}>
                  استمارة المتابعة الأسبوعية والتكيف
                </h5>
                <small className="text-muted" style={{ fontSize: '0.78rem' }}>سجل أوزانك وقياساتك لتحديث خطتك الذكية</small>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close rounded-circle p-2" 
              onClick={onClose} 
              aria-label="Close" 
              title="إغلاق (Esc)"
              style={{ fontSize: '0.8rem' }}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-white">
            <form onSubmit={onSubmit}>
              
              {/* 1. Daily Weights & Waist */}
              <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                <h6 className="fw-bold mb-0" style={{ color: '#261c6a', fontSize: '0.86rem' }}>
                  1. أوزان أيام الأسبوع الـ 7 على الريق (كجم):
                </h6>
                <span className="badge rounded-pill" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.66rem' }}>
                  ميزان الصباح
                </span>
              </div>

              <div className="row g-2 mb-3">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <div className="col-3" key={d}>
                    <label className="form-label text-muted d-block text-center mb-1" style={{ fontSize: '0.68rem' }}>يوم {d}</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control form-control-sm text-center fw-semibold"
                      style={{ height: '36px', borderRadius: '10px', fontSize: '0.82rem', border: '1.5px solid #e2e8f0' }}
                      value={checkinForm[`weightDay${d}`] !== undefined ? checkinForm[`weightDay${d}`] : ''}
                      onChange={(e) => setCheckinForm({ ...checkinForm, [`weightDay${d}`]: e.target.value })}
                      required
                    />
                  </div>
                ))}
                <div className="col-3">
                  <label className="form-label fw-bold text-center d-block mb-1" style={{ color: '#261c6a', fontSize: '0.68rem' }}>محيط الخصر (سم)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-control form-control-sm text-center fw-bold"
                    style={{ height: '36px', borderRadius: '10px', fontSize: '0.82rem', borderColor: '#ddd6fe', background: '#fbfaff', color: '#261c6a' }}
                    value={checkinForm.waistCm || ''}
                    onChange={(e) => setCheckinForm({ ...checkinForm, waistCm: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 2. Adherence & Biofeedback */}
              <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                <h6 className="fw-bold mb-0" style={{ color: '#261c6a', fontSize: '0.86rem' }}>
                  2. تقييم الالتزام والمؤشرات الحيوية:
                </h6>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-muted small mb-1" style={{ fontSize: '0.74rem' }}>نسبة الالتزام بالدايت (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    className="form-control form-control-sm text-center fw-semibold"
                    style={{ height: '36px', borderRadius: '10px', fontSize: '0.82rem', border: '1.5px solid #e2e8f0' }}
                    value={checkinForm.nutritionAdherence || 95}
                    onChange={(e) => setCheckinForm({ ...checkinForm, nutritionAdherence: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small mb-1" style={{ fontSize: '0.74rem' }}>مستوى الجوع (1 شبعان - 5 جائع جداً)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-control form-control-sm text-center fw-semibold"
                    style={{ height: '36px', borderRadius: '10px', fontSize: '0.82rem', border: '1.5px solid #e2e8f0' }}
                    value={checkinForm.hungerLevel || 2}
                    onChange={(e) => setCheckinForm({ ...checkinForm, hungerLevel: e.target.value })}
                  />
                </div>
              </div>

              {/* 3. Meal Rotation Preference */}
              <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                <h6 className="fw-bold mb-0" style={{ color: '#261c6a', fontSize: '0.86rem' }}>
                  3. تفضيل وجبات الأسبوع القادم:
                </h6>
              </div>

              <div className="p-3 rounded-3 border mb-4" style={{ background: '#fbfaff', borderColor: '#ede9fe' }}>
                <div className="form-check mb-2">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="mealRotation" 
                    id="rotateMeals" 
                    checked={checkinForm.rotateMeals === true}
                    onChange={() => setCheckinForm({ ...checkinForm, rotateMeals: true })}
                  />
                  <label className="form-check-label fw-bold text-dark" style={{ fontSize: '0.82rem' }} htmlFor="rotateMeals">
                    نعم، أريد تجديد وتغيير أصناف الوجبات (Smart Meal Rotation)
                  </label>
                  <small className="text-muted d-block ps-4" style={{ fontSize: '0.72rem' }}>تدوير مصادر البروتين والكارب مع الحفاظ على نفس الماكروز والسعرات.</small>
                </div>
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="mealRotation" 
                    id="keepMeals" 
                    checked={checkinForm.rotateMeals === false}
                    onChange={() => setCheckinForm({ ...checkinForm, rotateMeals: false })}
                  />
                  <label className="form-check-label fw-semibold text-dark" style={{ fontSize: '0.82rem' }} htmlFor="keepMeals">
                    لا، أفضل الاستمرار على نفس وجباتي الحالية
                  </label>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="d-flex gap-2 justify-content-between align-items-center pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
                <button 
                  type="button" 
                  className="btn btn-light rounded-pill px-4 fw-semibold" 
                  style={{ height: '40px', fontSize: '0.82rem', border: '1px solid #e2e8f0', color: '#475569' }}
                  onClick={onClose}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 text-white"
                  style={{ 
                    height: '40px', 
                    fontSize: '0.84rem', 
                    background: 'linear-gradient(135deg, #372896 0%, #261c6a 100%)', 
                    border: 'none', 
                    boxShadow: '0 4px 14px rgba(38, 28, 106, 0.28)' 
                  }}
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm"></span> جاري التحليل والتكيّف...</>
                  ) : (
                    <><i className="ti ti-send fs-6"></i> إرسال تقرير المتابعة للكابتن</>
                  )}
                </button>
              </div>
            </form>

            {checkinResult && (
              <div className="mt-3 p-3 rounded-3 border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <h6 className="fw-bold text-success mb-1" style={{ fontSize: '0.86rem' }}>
                  <i className="ti ti-circle-check me-1"></i> نتيجة التقييم: {checkinResult.status}
                </h6>
                <p className="small text-muted mb-0" style={{ fontSize: '0.78rem' }}>
                  متوسط الوزن: {checkinResult.weight_analysis?.current_average_kg} كجم | معدل التغير: {checkinResult.weight_analysis?.delta_kg} كجم
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
