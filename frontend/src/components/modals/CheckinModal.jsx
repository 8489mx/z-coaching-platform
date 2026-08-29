import React, { useEffect, useState } from 'react';

export default function CheckinModal({
  isOpen,
  onClose,
  checkinForm,
  setCheckinForm,
  onSubmit,
  loading,
  checkinResult
}) {
  const [hasPain, setHasPain] = useState(false);

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
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '620px' }}>
        <div 
          className="modal-content border-0 shadow-2xl bg-white position-relative overflow-hidden" 
          style={{ 
            borderRadius: "24px", 
            border: '1px solid #edf2f7',
            boxShadow: '0 25px 60px -15px rgba(38, 28, 106, 0.22), 0 0 0 1px rgba(0,0,0,0.03)'
          }} 
          dir="rtl"
        >
          
          {/* Header */}
          <div 
            className="p-4 bg-white d-flex justify-content-between align-items-center" 
            style={{ borderBottom: '1px solid #f1f5f9' }}
          >
            <div className="d-flex align-items-center gap-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  background: 'linear-gradient(135deg, #E5F0FF 0%, #F0F9FF 100%)', 
                  color: '#0284C7', 
                  border: '1.5px solid #BAE6FD',
                  boxShadow: '0 2px 8px rgba(38, 28, 106, 0.08)'
                }}
              >
                <i className="ti ti-clipboard-check fs-4"></i>
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-0 lh-1" style={{ fontSize: '1.1rem', letterSpacing: '-0.3px', color: '#1e144f' }}>
                  استمارة المتابعة الأسبوعية والتعديل التلقائي
                </h5>
                <small className="text-muted mt-1 d-block" style={{ fontSize: '0.76rem' }}>
                  سجل قياساتك ومؤشراتك الحيوية لتحديث خطتك للأسبوع القادم
                </small>
              </div>
            </div>

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
          <div className="p-4 bg-white" style={{ maxHeight: 'calc(85vh - 120px)', overflowY: 'auto' }}>
            <form onSubmit={onSubmit}>
              
              {/* 1. Weekly Morning Weigh-in & Measurements */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', background: '#0284C7', color: '#fff', fontSize: '0.7rem' }}>1</span>
                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>
                      الوزن الصباحي والقياسات:
                    </h6>
                  </div>
                  <span className="badge rounded-pill px-2 py-1" style={{ background: '#E5F0FF', color: '#0284C7', fontSize: '0.68rem', border: '1px solid #BAE6FD' }}>
                    على الريق صباحاً
                  </span>
                </div>

                <div className="row g-2">
                  <div className="col-4">
                    <div className="p-2.5 rounded-3 text-center border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <label className="form-label text-muted d-block mb-1 fw-bold" style={{ fontSize: '0.72rem' }}>
                        وزن اليوم (كجم) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="مثال: 84.5"
                        className="form-control form-control-sm text-center fw-bold text-dark border-0 shadow-xs"
                        style={{ height: '36px', borderRadius: '8px', fontSize: '0.92rem', background: '#ffffff' }}
                        value={checkinForm.weight_kg !== undefined ? checkinForm.weight_kg : (checkinForm.weightDay1 || '')}
                        onChange={(e) => setCheckinForm({ ...checkinForm, weight_kg: e.target.value, weightDay1: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-4">
                    <div className="p-2.5 rounded-3 text-center border" style={{ background: '#F0F9FF', borderColor: '#BAE6FD' }}>
                      <label className="form-label fw-bold d-block mb-1" style={{ color: '#0284C7', fontSize: '0.72rem' }}>
                        محيط الخصر عند السرة (سم) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="مثال: 88"
                        className="form-control form-control-sm text-center fw-black border-0 shadow-xs"
                        style={{ height: '36px', borderRadius: '8px', fontSize: '0.92rem', background: '#ffffff', color: '#0284C7', fontWeight: '900' }}
                        value={checkinForm.waistCm || ''}
                        onChange={(e) => setCheckinForm({ ...checkinForm, waistCm: e.target.value, waist_circumference_cm: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-4">
                    <div className="p-2.5 rounded-3 text-center border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <label className="form-label text-muted d-block mb-1 fw-bold" style={{ fontSize: '0.72rem' }}>
                        محيط الأرداف (سم)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="اختياري"
                        className="form-control form-control-sm text-center fw-bold text-dark border-0 shadow-xs"
                        style={{ height: '36px', borderRadius: '8px', fontSize: '0.92rem', background: '#ffffff' }}
                        value={checkinForm.hipCm || ''}
                        onChange={(e) => setCheckinForm({ ...checkinForm, hipCm: e.target.value, hip_circumference_cm: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Adherence & Workouts Completed */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <span className="badge rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', background: '#0284C7', color: '#fff', fontSize: '0.7rem' }}>2</span>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>
                    الالتزام بالدايت والتمرين:
                  </h6>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <div className="p-3 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label text-muted small mb-0" style={{ fontSize: '0.76rem' }}>
                          نسبة الالتزام بالدايت
                        </label>
                        <span className="badge bg-success fw-bold" style={{ fontSize: '0.78rem' }}>
                          {checkinForm.nutritionAdherence || checkinForm.nutrition_adherence_percent || 95}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        className="form-range"
                        value={checkinForm.nutritionAdherence || checkinForm.nutrition_adherence_percent || 95}
                        onChange={(e) => setCheckinForm({ ...checkinForm, nutritionAdherence: Number(e.target.value), nutrition_adherence_percent: Number(e.target.value) })}
                      />
                      <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>
                        * الالتزام فوق 80% يتيح التعديل وتطبيق خطة التنشيف.
                      </small>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-3 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <label className="form-label text-muted small mb-1 d-block" style={{ fontSize: '0.76rem' }}>
                        عدد الجلسات المنجزة أسبوعياً
                      </label>
                      <select
                        className="form-select form-select-sm fw-bold text-dark border"
                        style={{ height: '36px', borderRadius: '8px', fontSize: '0.82rem', background: '#fff' }}
                        value={checkinForm.workoutsCompleted !== undefined ? checkinForm.workoutsCompleted : 4}
                        onChange={(e) => setCheckinForm({ ...checkinForm, workoutsCompleted: Number(e.target.value), workouts_completed: Number(e.target.value) })}
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n}>{n} من أصل 4 جلسات مخططة</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Biofeedback Sliders */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <span className="badge rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', background: '#0284C7', color: '#fff', fontSize: '0.7rem' }}>3</span>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>
                    المؤشرات الحيوية والاستشفاء (Biofeedback):
                  </h6>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <div className="p-2.5 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <label className="form-label text-muted small mb-1 d-block" style={{ fontSize: '0.74rem' }}>
                        طاقة الجيم والنشاط اليومي
                      </label>
                      <select
                        className="form-select form-select-sm fw-bold text-dark border"
                        style={{ height: '34px', borderRadius: '8px', fontSize: '0.8rem', background: '#fff' }}
                        value={checkinForm.energyLevel || 4}
                        onChange={(e) => setCheckinForm({ ...checkinForm, energyLevel: Number(e.target.value), energy_level: Number(e.target.value) })}
                      >
                        <option value="5">5 - طاقة ممتازة وأداء عالي</option>
                        <option value="4">4 - نشاط جيد وطبيعي (مثالي)</option>
                        <option value="3">3 - طاقة متوسطة</option>
                        <option value="2">2 - خمول وإرهاق ملحوظ</option>
                        <option value="1">1 - إجهاد شديد جداً</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-2.5 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <label className="form-label text-muted small mb-1 d-block" style={{ fontSize: '0.74rem' }}>
                        شدة الجوع خلال اليوم
                      </label>
                      <select
                        className="form-select form-select-sm fw-bold text-dark border"
                        style={{ height: '34px', borderRadius: '8px', fontSize: '0.8rem', background: '#fff' }}
                        value={checkinForm.hungerLevel || 2}
                        onChange={(e) => setCheckinForm({ ...checkinForm, hungerLevel: Number(e.target.value), hunger_level: Number(e.target.value) })}
                      >
                        <option value="1">1 - شبع تام طوال اليوم</option>
                        <option value="2">2 - مريح ومناسب (مثالي)</option>
                        <option value="3">3 - جوع خفيف قبل الوجبات</option>
                        <option value="4">4 - جوع ملحوظ</option>
                        <option value="5">5 - جوع شديد ومجهد</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-2.5 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <label className="form-label text-muted small mb-1 d-block" style={{ fontSize: '0.74rem' }}>
                        جودة النوم والاستيقاظ
                      </label>
                      <select
                        className="form-select form-select-sm fw-bold text-dark border"
                        style={{ height: '34px', borderRadius: '8px', fontSize: '0.8rem', background: '#fff' }}
                        value={checkinForm.sleepQuality || 4}
                        onChange={(e) => setCheckinForm({ ...checkinForm, sleepQuality: Number(e.target.value), sleep_quality: Number(e.target.value) })}
                      >
                        <option value="5">5 - نوم عميق ومريح جداً</option>
                        <option value="4">4 - نوم جيد ومستقر (7-8 ساعات)</option>
                        <option value="3">3 - نوم متوسط مع بعض التقطع</option>
                        <option value="2">2 - أرق وصعوبة استغراق</option>
                        <option value="1">1 - نوم سيء وأقل من 5 ساعات</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="p-2.5 rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <label className="form-label text-muted small mb-1 d-block" style={{ fontSize: '0.74rem' }}>
                        هل شعرت بألم مفاصل في التمرين؟
                      </label>
                      <button
                        type="button"
                        className={`btn btn-sm w-100 fw-bold ${hasPain ? 'btn-outline-danger' : 'btn-outline-secondary'}`}
                        style={{ height: '34px', borderRadius: '8px', fontSize: '0.78rem' }}
                        onClick={() => setHasPain(!hasPain)}
                      >
                        {hasPain ? 'نعم، لدي ألم مفصلي' : 'سليم تماماً ولا يوجد ألم'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conditional Pain Input */}
                {hasPain && (
                  <div className="mt-2 p-2.5 rounded-3 border border-danger-subtle bg-danger-subtle">
                    <label className="form-label text-danger fw-bold small mb-1 d-block" style={{ fontSize: '0.76rem' }}>
                      حدد المفصل أو التمرين المسبب للألم لاستبداله فوراً:
                    </label>
                    <div className="row g-2">
                      <div className="col-6">
                        <select 
                          className="form-select form-select-sm"
                          value={checkinForm.painBodyPart || 'LOWER_BACK'}
                          onChange={(e) => setCheckinForm({ 
                            ...checkinForm, 
                            painBodyPart: e.target.value,
                            pain_reports: [{ body_part: e.target.value, pain_level: checkinForm.painLevel || 5, description: checkinForm.painDesc || '' }]
                          })}
                        >
                          <option value="LOWER_BACK">أسفل الظهر</option>
                          <option value="SHOULDER">مفصل الكتف</option>
                          <option value="KNEE">مفصل الركبة</option>
                          <option value="ELBOW">الكوع أو المعصم</option>
                          <option value="NECK">الرقبة</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <input 
                          type="text" 
                          placeholder="ملاحظات (مثال: وجع في السكوات)"
                          className="form-control form-control-sm"
                          value={checkinForm.painDesc || ''}
                          onChange={(e) => setCheckinForm({ 
                            ...checkinForm, 
                            painDesc: e.target.value,
                            pain_reports: [{ body_part: checkinForm.painBodyPart || 'LOWER_BACK', pain_level: 5, description: e.target.value }]
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Progress Photos & Meal Rotation */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <span className="badge rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', background: '#0284C7', color: '#fff', fontSize: '0.7rem' }}>4</span>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>
                    تفضيل وجبات الأسبوع القادم:
                  </h6>
                </div>

                <div className="d-flex flex-column gap-2">
                  <label 
                    className="p-2.5 rounded-3 border d-flex align-items-start gap-3 cursor-pointer transition-all"
                    style={{ 
                      background: checkinForm.rotateMeals === true ? '#E5F0FF' : '#ffffff', 
                      borderColor: checkinForm.rotateMeals === true ? '#7DD3FC' : '#e2e8f0',
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
                      <div className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>
                        نعم، أريد تجديد وتغيير أصناف الوجبات (Smart Meal Rotation)
                      </div>
                      <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.7rem' }}>
                        تدوير مصادر البروتين والكارب مع الحفاظ بدقة على نفس السعرات والماكروز.
                      </small>
                    </div>
                  </label>

                  <label 
                    className="p-2.5 rounded-3 border d-flex align-items-start gap-3 cursor-pointer transition-all"
                    style={{ 
                      background: checkinForm.rotateMeals === false ? '#E5F0FF' : '#ffffff', 
                      borderColor: checkinForm.rotateMeals === false ? '#7DD3FC' : '#e2e8f0',
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
                      <div className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>
                        لا، أفضل الاستمرار على نفس وجباتي الحالية
                      </div>
                      <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.7rem' }}>
                        الاحتفاظ بنفس جدول الأكل الحالي دون أي تغيير.
                      </small>
                    </div>
                  </label>
                </div>
              </div>

              {/* Footer Actions */}
              <div 
                className="d-flex justify-content-between align-items-center pt-3" 
                style={{ borderTop: '1px solid #f1f5f9' }}
              >
                <button 
                  type="button" 
                  className="btn btn-sm btn-light rounded-pill px-3 fw-semibold transition-all" 
                  style={{ height: '36px', fontSize: '0.8rem', border: '1px solid #cbd5e1', color: '#475569' }}
                  onClick={onClose}
                >
                  إلغاء
                </button>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 text-slate-900 transition-all"
                  style={{ 
                    height: '36px', 
                    fontSize: '0.82rem', 
                    background: 'linear-gradient(135deg, #0284C7 0%, #0284C7 100%)', 
                    border: 'none', 
                    boxShadow: '0 2px 10px rgba(38, 28, 106, 0.22)' 
                  }}
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm"></span> جاري التحليل...</>
                  ) : (
                    <><i className="ti ti-send fs-6"></i> إرسال المتابعة وتحليل النتيجة</>
                  )}
                </button>
              </div>
            </form>

            {checkinResult && (
              <div className="mt-3 p-3 rounded-3 border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <h6 className="fw-bold text-success mb-1" style={{ fontSize: '0.86rem' }}>
                  <i className="ti ti-circle-check me-1"></i> نتيجة التقييم: {checkinResult.status || checkinResult.analysis?.analysis_status}
                </h6>
                <p className="small text-muted mb-0" style={{ fontSize: '0.78rem' }}>
                  {checkinResult.analysis?.recommendations_ar?.[0] || 'تم تقييم التقدم بنجاح.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

