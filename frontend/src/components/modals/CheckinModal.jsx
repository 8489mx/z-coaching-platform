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
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(5px)", zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "24px", overflow: "hidden" }} dir="rtl">
          
          {/* Header */}
          <div className="modal-header bg-success text-white py-3 px-4 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-white mb-0">
              <i className="ti ti-clipboard-check me-2"></i> استمارة المتابعة الأسبوعية والتكيف التلقائي
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 text-start">
            <form onSubmit={onSubmit}>
              
              {/* 1. Daily Weights */}
              <h6 className="fw-bold text-primary mb-3">1. أوزان أيام الأسبوع الـ 7 على الريق (كجم):</h6>
              <div className="row g-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <div className="col-md-3 col-6" key={d}>
                    <label className="form-label small text-muted">يوم {d}</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control text-center"
                      value={checkinForm[`weightDay${d}`] !== undefined ? checkinForm[`weightDay${d}`] : ''}
                      onChange={(e) => setCheckinForm({ ...checkinForm, [`weightDay${d}`]: e.target.value })}
                      required
                    />
                  </div>
                ))}
                <div className="col-md-3 col-6">
                  <label className="form-label small fw-bold text-primary">محيط الخصر (سم)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-control text-center fw-bold border-primary"
                    value={checkinForm.waistCm || ''}
                    onChange={(e) => setCheckinForm({ ...checkinForm, waistCm: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 2. Adherence & Biofeedback */}
              <h6 className="fw-bold text-primary mb-3">2. تقييم الالتزام والمؤشرات الحيوية:</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label small">نسبة الالتزام بالدايت (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    className="form-control text-center"
                    value={checkinForm.nutritionAdherence || 95}
                    onChange={(e) => setCheckinForm({ ...checkinForm, nutritionAdherence: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">مستوى الجوع (1 شبعان - 5 جائع جداً)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-control text-center"
                    value={checkinForm.hungerLevel || 2}
                    onChange={(e) => setCheckinForm({ ...checkinForm, hungerLevel: e.target.value })}
                  />
                </div>
              </div>

              {/* 3. Meal Rotation Preference */}
              <h6 className="fw-bold text-primary mb-2">3. تفضيل وجبات الأسبوع القادم (تجديد أم تثبيت):</h6>
              <div className="p-3 bg-light rounded-4 border mb-4">
                <div className="form-check mb-2">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="mealRotation" 
                    id="rotateMeals" 
                    checked={checkinForm.rotateMeals === true}
                    onChange={() => setCheckinForm({ ...checkinForm, rotateMeals: true })}
                  />
                  <label className="form-check-label fw-bold text-dark" htmlFor="rotateMeals">
                    نعم، أريد تجديد وتغيير أصناف الوجبات لكسر الروتين (Smart Meal Rotation)
                  </label>
                  <small className="text-muted d-block ps-4">سيقوم النظام بتدوير مصادر البروتين والكارب الذكية مع الحفاظ على نفس الماكروز.</small>
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
                  <label className="form-check-label fw-bold text-dark" htmlFor="keepMeals">
                    لا، أفضل الاستمرار على نفس وجباتي الحالية
                  </label>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-success btn-lg w-100 py-3 fw-bold rounded-pill shadow-sm">
                {loading ? "جاري التحليل والتكيّف..." : "إرسال تقرير المتابعة للكابتن"}
              </button>
            </form>

            {checkinResult && (
              <div className="mt-4 p-3 bg-light rounded-3 border border-success">
                <h6 className="fw-bold text-success mb-2">
                  نتيجة التقييم: {checkinResult.status}
                </h6>
                <p className="small text-muted mb-0">
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
