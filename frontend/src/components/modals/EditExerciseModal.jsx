import React, { useState, useEffect } from 'react';

export default function EditExerciseModal({
  isOpen,
  onClose,
  exercise,
  onSave,
  loading
}) {
  const [formData, setFormData] = useState({
    id: '',
    name_ar: '',
    name_en: '',
    muscle_group: 'CHEST',
    muscle_ar: 'عضلات الصدر',
    equipment: 'BARBELL',
    equipment_ar: 'بار مستوي',
    difficulty: 'متوسط',
    video_url: '',
    video_id: '',
    cues_ar: '',
    mistakes_ar: ''
  });

  useEffect(() => {
    if (exercise) {
      setFormData({
        id: exercise.id || exercise.exercise_code || '',
        name_ar: exercise.name_ar || '',
        name_en: exercise.name_en || '',
        muscle_group: exercise.muscle_group || 'CHEST',
        muscle_ar: exercise.muscle_ar || 'عضلات الصدر',
        equipment: exercise.equipment || 'BARBELL',
        equipment_ar: exercise.equipment_ar || 'بار مستوي',
        difficulty: exercise.difficulty || 'متوسط',
        video_url: exercise.video_url || (exercise.video_id ? `https://www.youtube.com/watch?v=${exercise.video_id}` : ''),
        video_id: exercise.video_id || '',
        cues_ar: exercise.cues_ar || '',
        mistakes_ar: exercise.mistakes_ar || ''
      });
    } else {
      setFormData({
        id: `EX_${Date.now()}`,
        name_ar: '',
        name_en: '',
        muscle_group: 'CHEST',
        muscle_ar: 'عضلات الصدر',
        equipment: 'BARBELL',
        equipment_ar: 'بار مستوي',
        difficulty: 'متوسط',
        video_url: '',
        video_id: '',
        cues_ar: '',
        mistakes_ar: ''
      });
    }
  }, [exercise, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMuscleChange = (val) => {
    const map = {
      CHEST: "عضلات الصدر",
      BACK: "عضلات الظهر",
      LEGS: "الأرجل والأرداف",
      SHOULDERS: "الأكتاف",
      ARMS: "الذراعين (باي وتراي)",
      CORE: "البطن والكور"
    };
    setFormData({
      ...formData,
      muscle_group: val,
      muscle_ar: map[val] || val
    });
  };

  const handleEquipmentChange = (val) => {
    const map = {
      BARBELL: "بار مستوي / أولمبي",
      DUMBBELL: "دمبلز",
      CABLE: "جهاز الكابل",
      MACHINE: "ماكينات العزل",
      BODYWEIGHT: "وزن الجسم"
    };
    setFormData({
      ...formData,
      equipment: val,
      equipment_ar: map[val] || val
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name_ar.trim()) return alert('يرجى إدخال اسم التمرين بالعربية');
    onSave(formData);
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)", zIndex: 1070 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '620px', margin: '1.75rem auto' }}>
        <div 
          className="modal-content border-0 shadow-2xl bg-white position-relative" 
          style={{ 
            borderRadius: "20px", 
            border: '1px solid #edf2f7',
            boxShadow: '0 25px 60px -15px rgba(38, 28, 106, 0.22)',
            overflow: 'hidden'
          }} 
          dir="rtl"
        >
          {/* Header */}
          <div className="p-4 bg-white d-flex align-items-center justify-content-between border-bottom" style={{ borderColor: '#f1f5f9' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px', background: '#f5f3ff', color: '#261c6a', border: '1.5px solid #ddd6fe' }}>
                <i className="ti ti-barbell fs-5"></i>
              </div>
              <div className="text-end">
                <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
                  {exercise ? 'تعديل بيانات ورابط التمرين' : 'إضافة تمرين جديد للمكتبة'}
                </h5>
                <small className="text-muted d-block mt-1" style={{ fontSize: '0.78rem' }}>تخصيص الاسم وروابط يوتيوب والتوجيهات الفنية</small>
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 text-muted" 
              style={{ width: '32px', height: '32px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
              onClick={onClose} 
              aria-label="Close" 
              title="إغلاق (Esc)"
            >
              <i className="ti ti-x fs-6"></i>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-4 bg-white text-end">
              
              {/* Names row */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1 d-block text-end" style={{ fontSize: '0.84rem' }}>
                    اسم التمرين بالعربية <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control fw-semibold text-end"
                    style={{ height: '44px', borderRadius: '10px', fontSize: '0.86rem', border: '1.5px solid #e2e8f0', padding: '0 14px' }}
                    placeholder="مثال: بنش برس بالبار مستوي"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1 d-block text-end" style={{ fontSize: '0.84rem' }}>
                    اسم التمرين بالإنجليزية
                  </label>
                  <input
                    type="text"
                    className="form-control fw-semibold font-monospace"
                    style={{ height: '44px', borderRadius: '10px', fontSize: '0.84rem', border: '1.5px solid #e2e8f0', padding: '0 14px', direction: 'ltr', textAlign: 'left' }}
                    placeholder="Barbell Bench Press"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  />
                </div>
              </div>

              {/* Muscle & Equipment row */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1 d-block text-end" style={{ fontSize: '0.84rem' }}>
                    العضلة المستهدفة
                  </label>
                  <select
                    className="form-select fw-semibold text-end"
                    style={{ height: '44px', borderRadius: '10px', fontSize: '0.84rem', border: '1.5px solid #e2e8f0', paddingRight: '14px', paddingLeft: '35px' }}
                    value={formData.muscle_group}
                    onChange={(e) => handleMuscleChange(e.target.value)}
                  >
                    <option value="CHEST">عضلات الصدر (Chest)</option>
                    <option value="BACK">عضلات الظهر (Back)</option>
                    <option value="LEGS">الأرجل والأرداف (Legs)</option>
                    <option value="SHOULDERS">الأكتاف (Shoulders)</option>
                    <option value="ARMS">الذراعين (Arms)</option>
                    <option value="CORE">البطن والكور (Core)</option>
                  </select>
                </div>

                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1 d-block text-end" style={{ fontSize: '0.84rem' }}>
                    الأداة / الجهاز المستخدم
                  </label>
                  <select
                    className="form-select fw-semibold text-end"
                    style={{ height: '44px', borderRadius: '10px', fontSize: '0.84rem', border: '1.5px solid #e2e8f0', paddingRight: '14px', paddingLeft: '35px' }}
                    value={formData.equipment}
                    onChange={(e) => handleEquipmentChange(e.target.value)}
                  >
                    <option value="BARBELL">بار أولمبي / مستوي</option>
                    <option value="DUMBBELL">دمبلز (Dumbbells)</option>
                    <option value="CABLE">جهاز الكابل (Cable)</option>
                    <option value="MACHINE">ماكينات الجيم (Machine)</option>
                    <option value="BODYWEIGHT">وزن الجسم (Bodyweight)</option>
                  </select>
                </div>
              </div>

              {/* YouTube Video Link */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1 d-flex align-items-center justify-content-end gap-1 text-end" style={{ fontSize: '0.84rem' }}>
                  <span>رابط فيديو شرح التكنيك من يوتيوب (YouTube Video URL)</span>
                  <i className="ti ti-brand-youtube text-danger fs-5"></i>
                </label>
                <input
                  type="url"
                  className="form-control text-start font-monospace"
                  style={{ height: '42px', borderRadius: '10px', fontSize: '0.82rem', border: '1.5px solid #e2e8f0', padding: '0 14px', direction: 'ltr' }}
                  placeholder="https://www.youtube.com/watch?v=XXXXXX"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                />
                <small className="text-muted d-block mt-1 text-end" style={{ fontSize: '0.72rem' }}>
                  ضع رابط الفيديو أو معرّف الفيديو (Video ID)، وسيتم تشغيله للمتدرب تلقائياً في بوابة العميل والـ PDF.
                </small>
              </div>

              {/* Coaching Cues */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1 d-block text-end" style={{ fontSize: '0.84rem' }}>
                  التوجيهات الحركية والتكنيك الصحيح (Coaching Cues)
                </label>
                <textarea
                  className="form-control text-end"
                  rows="2"
                  style={{ borderRadius: '10px', fontSize: '0.84rem', border: '1.5px solid #e2e8f0', padding: '10px 14px' }}
                  placeholder="مثال: ثبّت لوحي الكتف للخلف، وانزل بالبار إلى منتصف الصدر مع كوع 45 درجة..."
                  value={formData.cues_ar}
                  onChange={(e) => setFormData({ ...formData, cues_ar: e.target.value })}
                ></textarea>
              </div>

              {/* Common Mistakes */}
              <div className="mb-2">
                <label className="form-label text-danger fw-bold small mb-1 d-block text-end" style={{ fontSize: '0.84rem' }}>
                  الأخطاء الشائعة لتجنب الإصابة (Common Mistakes)
                </label>
                <textarea
                  className="form-control text-end"
                  rows="2"
                  style={{ borderRadius: '10px', fontSize: '0.84rem', border: '1.5px solid #fecdd3', background: '#fff5f5', padding: '10px 14px' }}
                  placeholder="مثال: فتح الكوع 90 درجة بالكامل مما يضغط على مفصل الكتف..."
                  value={formData.mistakes_ar}
                  onChange={(e) => setFormData({ ...formData, mistakes_ar: e.target.value })}
                ></textarea>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-3 px-4 bg-light border-top d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
              <button 
                type="button" 
                className="btn btn-outline-secondary rounded-pill px-4 fw-semibold" 
                style={{ height: '40px', fontSize: '0.84rem' }}
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
                  fontSize: '0.86rem', 
                  background: 'linear-gradient(135deg, #372896 0%, #261c6a 100%)', 
                  border: 'none', 
                  boxShadow: '0 4px 14px rgba(38, 28, 106, 0.28)' 
                }}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm"></span> جاري الحفظ...</>
                ) : (
                  <><i className="ti ti-device-floppy fs-6"></i> حفظ التمرين</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
