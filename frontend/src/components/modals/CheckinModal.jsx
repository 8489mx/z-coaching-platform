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
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '580px' }}>
        <div 
          className="modal-content border-0 shadow-2xl bg-white position-relative overflow-hidden" 
          style={{ 
            borderRadius: "24px", 
            border: '1px solid #edf2f7',
            boxShadow: '0 25px 60px -15px rgba(38, 28, 106, 0.22), 0 0 0 1px rgba(0,0,0,0.03)'
          }} 
          dir="rtl"
        >
          
          {/* Header (Clean, Spacious, No Overlapping X) */}
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
                  border: '1.5px solid #ddd6fe',
                  boxShadow: '0 2px 8px rgba(38, 28, 106, 0.08)'
                }}
              >
                <i className="ti ti-clipboard-check fs-4"></i>
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-0 lh-1" style={{ fontSize: '1.1rem', letterSpacing: '-0.3px', color: '#1e144f' }}>
                  استمارة المتابعة الأسبوعية والتكيف
                </h5>
                <small className="text-muted mt-1 d-block" style={{ fontSize: '0.76rem' }}>
                  سجل أوزانك وقياساتك لتحديث خطتك التدريبية والغذائية آلياً
                </small>
              </div>
            </div>

            {/* Custom Close Button (Never overlaps in RTL) */}
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 transition-all"
              style={{ 
                width: '34px', 
                height: '34px', 
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b'
              }}
              title="إغلاق (Esc)"
            >
              <i className="ti ti-x fs-6"></i>
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-white">
            <form onSubmit={onSubmit}>
              
              {/* 1. Daily Weights Section (7 Clear Day Boxes) */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', background: '#261c6a', color: '#fff', fontSize: '0.7rem' }}>1</span>
                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>
                      أوزان أيام الأسبوع الـ 7 على الريق (كجم):
                    </h6>
                  </div>
                  <span className="badge rounded-pill px-2 py-1" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                    ميزان الصباح
                  </span>
                </div>

                <div className="row g-2 mb-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <div className={d <= 4 ? "col-3" : "col-4"} key={d}>
                      <div className="p-2 rounded-3 text-center border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                        <label className="form-label text-muted d-block mb-1 fw-bold" style={{ fontSize: '0.68rem' }}>يوم {d}</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control form-control-sm text-center fw-bold text-dark border-0 shadow-xs"
                          style={{ height: '34px', borderRadius: '8px', fontSize: '0.86rem', background: '#ffffff' }}
                          value={checkinForm[`weightDay${d}`] !== undefined ? checkinForm[`weightDay${d}`] : ''}
                          onChange={(e) => setCheckinForm({ ...checkinForm, [`weightDay${d}`]: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  ))}
                  
                  {/* Dedicated Waist Measurement Card in the 8th slot */}
                  <div className="col-4">
                    <div className="p-2 rounded-3 text-center border" style={{ background: '#fbfaff', borderColor: '#ddd6fe' }}>
                      <label className="form-label fw-bold d-block mb-1" style={{ color: '#261c6a', fontSize: '0.68rem' }}>
                        محيط الخصر (سم)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        className="form-control form-control-sm text-center fw-black border-0 shadow-xs"
                        style={{ height: '34px', borderRadius: '8px', fontSize: '0.86rem', background: '#ffffff', color: '#261c6a', fontWeight: '900' }}
                        value={checkinForm.waistCm || ''}
                        onChange={(e) => setCheckinForm({ ...checkinForm, waistCm: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Adherence & Biofeedback */}
              <div className="mb-3">
                <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <span className="badge rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', background: '#261c6a', color: '#fff', fontSize: '0.7rem' }}>2</span>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>
                    تقييم الالتزام والمؤشرات الحيوية:
                  </h6>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <div className="p-2 px-3 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <label className="form-label text-muted small mb-1 d-block" style={{ fontSize: '0.74rem' }}>
                        نسبة الالتزام بالدايت (%)
                      </label>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="number"
                          min="50"
                          max="100"
                          step="5"
                          className="form-control form-control-sm text-center fw-bold text-success border"
                          style={{ height: '36px', borderRadius: '8px', fontSize: '0.88rem', width: '80px', background: '#fff' }}
                          value={checkinForm.nutritionAdherence || 95}
                          onChange={(e) => setCheckinForm({ ...checkinForm, nutritionAdherence: e.target.value })}
                        />
                        <div className="progress flex-grow-1" style={{ height: '6px', background: '#e2e8f0' }}>
                          <div className="progress-bar bg-success" style={{ width: `${checkinForm.nutritionAdherence || 95}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-2 px-3 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <label className="form-label text-muted small mb-1 d-block" style={{ fontSize: '0.74rem' }}>
                        مستوى الجوع (1 شبعان - 5 جائع)
                      </label>
                      <select
                        className="form-select form-select-sm fw-bold text-dark border"
                        style={{ height: '36px', borderRadius: '8px', fontSize: '0.82rem', background: '#fff' }}
                        value={checkinForm.hungerLevel || 2}
                        onChange={(e) => setCheckinForm({ ...checkinForm, hungerLevel: Number(e.target.value) })}
                      >
                        <option value="1">1 - شبع تام وممتلئ</option>
                        <option value="2">2 - مريح ومناسب (مثالي)</option>
                        <option value="3">3 - جوع خفيف قبل الوجبات</option>
                        <option value="4">4 - جوع ملحوظ</option>
                        <option value="5">5 - جوع شديد ومجهد</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Meal Rotation Preference */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <span className="badge rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', background: '#261c6a', color: '#fff', fontSize: '0.7rem' }}>3</span>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>
                    تفضيل وجبات الأسبوع القادم:
                  </h6>
                </div>

                <div className="d-flex flex-column gap-2">
                  <label 
                    className="p-3 rounded-3 border d-flex align-items-start gap-3 cursor-pointer transition-all"
                    style={{ 
                      background: checkinForm.rotateMeals === true ? '#f5f3ff' : '#ffffff', 
                      borderColor: checkinForm.rotateMeals === true ? '#c4b5fd' : '#e2e8f0',
                      cursor: 'pointer'
                    }}
                  >
                    <input 
                      className="form-check-input mt-1 flex-shrink-0" 
                      type="radio" 
                      name="mealRotation" 
                      id="rotateMeals" 
                      checked={checkinForm.rotateMeals === true}
                      onChange={() => setCheckinForm({ ...checkinForm, rotateMeals: true })}
                    />
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.86rem' }}>
                        نعم، أريد تجديد وتغيير أصناف الوجبات (Smart Meal Rotation)
                      </div>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                        تدوير وتغيير مصادر البروتين والكارب مع الحفاظ بدقة على نفس السعرات والماكروز.
                      </small>
                    </div>
                  </label>

                  <label 
                    className="p-3 rounded-3 border d-flex align-items-start gap-3 cursor-pointer transition-all"
                    style={{ 
                      background: checkinForm.rotateMeals === false ? '#f5f3ff' : '#ffffff', 
                      borderColor: checkinForm.rotateMeals === false ? '#c4b5fd' : '#e2e8f0',
                      cursor: 'pointer'
                    }}
                  >
                    <input 
                      className="form-check-input mt-1 flex-shrink-0" 
                      type="radio" 
                      name="mealRotation" 
                      id="keepMeals" 
                      checked={checkinForm.rotateMeals === false}
                      onChange={() => setCheckinForm({ ...checkinForm, rotateMeals: false })}
                    />
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.86rem' }}>
                        لا، أفضل الاستمرار على نفس وجباتي الحالية
                      </div>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                        الاحتفاظ بنفس الخطة الغذائية الحالية دون تغيير في الأصناف.
                      </small>
                    </div>
                  </label>
                </div>
              </div>

              {/* Footer Actions */}
              <div 
                className="d-flex justify-content-between align-items-center pt-3" 
                style={{ 
                  borderTop: '1px solid #f1f5f9' 
                }}
              >
                <button 
                  type="button" 
                  className="btn btn-light rounded-pill px-4 fw-bold" 
                  style={{ height: '42px', fontSize: '0.84rem', border: '1px solid #cbd5e1', color: '#334155' }}
                  onClick={onClose}
                >
                  إلغاء
                </button>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn rounded-pill px-4 fw-bold shadow-md d-flex align-items-center gap-2 text-white"
                  style={{ 
                    height: '42px', 
                    fontSize: '0.86rem', 
                    background: 'linear-gradient(135deg, #261c6a 0%, #4338ca 100%)', 
                    border: 'none', 
                    boxShadow: '0 4px 15px rgba(38, 28, 106, 0.3)' 
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
