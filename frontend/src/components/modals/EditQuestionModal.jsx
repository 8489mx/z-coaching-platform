import React, { useState, useEffect } from 'react';

export default function EditQuestionModal({
  isOpen,
  onClose,
  question,
  onSave,
  loading
}) {
  const [formData, setFormData] = useState({
    id: '',
    section: 'personal',
    title_ar: '',
    type: 'text',
    required: false,
    active: true,
    placeholder_ar: '',
    options: []
  });

  const [newOptionText, setNewOptionText] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');

  useEffect(() => {
    if (question) {
      setFormData({
        id: question.id || '',
        section: question.section || 'personal',
        title_ar: question.title_ar || '',
        type: question.type || 'text',
        required: question.required ?? false,
        active: question.active ?? true,
        placeholder_ar: question.placeholder_ar || '',
        options: question.options ? [...question.options] : []
      });
    } else {
      setFormData({
        id: `q_${Date.now()}`,
        section: 'personal',
        title_ar: '',
        type: 'text',
        required: false,
        active: true,
        placeholder_ar: '',
        options: []
      });
    }
  }, [question, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    const val = newOptionValue.trim() || `opt_${Date.now()}`;
    setFormData({
      ...formData,
      options: [...formData.options, { value: val, label: newOptionText.trim() }]
    });
    setNewOptionText('');
    setNewOptionValue('');
  };

  const handleRemoveOption = (index) => {
    const updated = formData.options.filter((_, idx) => idx !== index);
    setFormData({ ...formData, options: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title_ar.trim()) return alert('يرجى إدخال نص السؤال');
    onSave(formData);
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)", zIndex: 1070 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '580px', margin: '1.75rem auto' }}>
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
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px', background: '#E5F0FF', color: '#0284C7', border: '1.5px solid #BAE6FD' }}>
                <i className="ti ti-edit fs-5"></i>
              </div>
              <div className="text-end">
                <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
                  {question ? 'تعديل سؤال في الاستمارة' : 'إضافة سؤال جديد إلى الاستمارة'}
                </h5>
                <small className="text-muted d-block mt-1" style={{ fontSize: '0.78rem' }}>التحكم الكامل في صياغة وإلزامية السؤال</small>
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
              
              {/* Question Title */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1 d-block" style={{ fontSize: '0.84rem' }}>
                  نص السؤال (بالعربية) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control fw-semibold text-end"
                  style={{ height: '44px', borderRadius: '10px', fontSize: '0.86rem', border: '1.5px solid #e2e8f0', padding: '0 14px' }}
                  placeholder="مثال: هل تعاني من حساسية لأي نوع طعام؟"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  required
                />
              </div>

              {/* Section & Type */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1 d-block" style={{ fontSize: '0.84rem' }}>
                    قسم الاستمارة
                  </label>
                  <select
                    className="form-select fw-semibold text-end"
                    style={{ height: '44px', borderRadius: '10px', fontSize: '0.84rem', border: '1.5px solid #e2e8f0', paddingRight: '14px', paddingLeft: '35px' }}
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  >
                    <option value="personal">1. البيانات الشخصية والأهداف</option>
                    <option value="body">2. القياسات وأسلوب الحياة</option>
                    <option value="medical">3. الحالة الطبية والإصابات</option>
                    <option value="nutrition">4. التغذية والوجبات والحساسية</option>
                    <option value="training">5. التدريب وأيام الجيم والكارديو</option>
                  </select>
                </div>

                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1 d-block" style={{ fontSize: '0.84rem' }}>
                    نوع الحقل / الإجابة
                  </label>
                  <select
                    className="form-select fw-semibold text-end"
                    style={{ height: '44px', borderRadius: '10px', fontSize: '0.84rem', border: '1.5px solid #e2e8f0', paddingRight: '14px', paddingLeft: '35px' }}
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="text">نص قصير (Text)</option>
                    <option value="textarea">نص تفصيلي (Textarea)</option>
                    <option value="number">رقمي (Number)</option>
                    <option value="select">قائمة اختيارات فردية (Dropdown)</option>
                    <option value="date">تاريخ (Date)</option>
                  </select>
                </div>
              </div>

              {/* Placeholder text */}
              <div className="mb-3">
                <label className="form-label text-muted small mb-1 d-block" style={{ fontSize: '0.8rem' }}>
                  نص توضيحي داخل الحقل (Placeholder)
                </label>
                <input
                  type="text"
                  className="form-control text-end"
                  style={{ height: '42px', borderRadius: '10px', fontSize: '0.84rem', border: '1.5px solid #e2e8f0', padding: '0 14px' }}
                  placeholder="مثال: اكتب الإجابة بالتفصيل..."
                  value={formData.placeholder_ar}
                  onChange={(e) => setFormData({ ...formData, placeholder_ar: e.target.value })}
                />
              </div>

              {/* Options builder for Select / Dropdown */}
              {formData.type === 'select' && (
                <div className="p-3 rounded-3 border mb-3" style={{ background: '#F0F9FF', borderColor: '#F0F9FF' }}>
                  <label className="form-label fw-bold text-dark small mb-2 d-block text-end" style={{ fontSize: '0.82rem' }}>
                    خيارات القائمة المنسدلة:
                  </label>
                  
                  <div className="d-flex flex-column gap-1 mb-2">
                    {formData.options.map((opt, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center bg-white p-2 px-3 rounded-2 border" style={{ borderColor: '#e2e8f0' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="btn btn-sm text-danger p-0 border-0"
                          title="حذف الخيار"
                        >
                          <i className="ti ti-trash fs-6"></i>
                        </button>
                        <span className="fw-semibold text-dark text-end" style={{ fontSize: '0.82rem' }}>{opt.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="btn btn-sm px-3 fw-bold rounded-pill text-slate-900 flex-shrink-0"
                      style={{ background: '#0284C7', fontSize: '0.8rem', height: '36px' }}
                    >
                      إضافة خيار
                    </button>
                    <input
                      type="text"
                      className="form-control form-control-sm text-end"
                      style={{ borderRadius: '8px', fontSize: '0.82rem', height: '36px' }}
                      placeholder="اسم الخيار الجديد..."
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Clean Segmented Buttons for Required & Active */}
              <div className="row g-3 pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1 d-block text-end" style={{ fontSize: '0.8rem' }}>
                    درجة الإلزامية:
                  </label>
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, required: true })}
                      className={`btn btn-sm fw-bold ${formData.required ? 'btn-danger text-slate-900' : 'btn-outline-secondary'}`}
                      style={{ fontSize: '0.78rem', height: '38px', borderRadius: '0 8px 8px 0' }}
                    >
                      إجباري *
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, required: false })}
                      className={`btn btn-sm fw-bold ${!formData.required ? 'btn-primary text-slate-900' : 'btn-outline-secondary'}`}
                      style={{ 
                        fontSize: '0.78rem', 
                        height: '38px', 
                        borderRadius: '8px 0 0 8px',
                        background: !formData.required ? '#0284C7' : undefined,
                        borderColor: !formData.required ? '#0284C7' : undefined
                      }}
                    >
                      اختياري
                    </button>
                  </div>
                </div>

                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1 d-block text-end" style={{ fontSize: '0.8rem' }}>
                    حالة الظهور في الاستمارة:
                  </label>
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, active: true })}
                      className={`btn btn-sm fw-bold ${formData.active ? 'btn-success text-slate-900' : 'btn-outline-secondary'}`}
                      style={{ fontSize: '0.78rem', height: '38px', borderRadius: '0 8px 8px 0' }}
                    >
                      مفعّل بالاستمارة
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, active: false })}
                      className={`btn btn-sm fw-bold ${!formData.active ? 'btn-secondary text-slate-900' : 'btn-outline-secondary'}`}
                      style={{ fontSize: '0.78rem', height: '38px', borderRadius: '8px 0 0 8px' }}
                    >
                      مخفي مؤقتاً
                    </button>
                  </div>
                </div>
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
                  background: '#0F172A', 
                  border: 'none', 
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.28)' 
                }}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm"></span> جاري الحفظ...</>
                ) : (
                  <><i className="ti ti-device-floppy fs-6"></i> حفظ التغييرات</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
