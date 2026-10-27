import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Check, Loader2, Trash2, Plus } from 'lucide-react';
import CurvedSelect from '../common/CurvedSelect';

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
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
        dir="rtl"
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #EAECF0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              background: '#F4F0FD',
              color: '#673DE6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#101828' }}>
                {question ? 'تعديل سؤال في الاستمارة' : 'إضافة سؤال جديد إلى الاستمارة'}
              </h3>
              <span style={{ fontSize: '11.5px', color: '#667085' }}>
                التحكم الكامل في صياغة السؤال ونوع الإدخال ودرجة الإلزامية
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              border: '1px solid #EAECF0',
              background: '#F8FAFC',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Question Title */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                نص السؤال (بالعربية) <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '9999px',
                  border: '1px solid #D0D5DD',
                  padding: '0 12px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="مثال: هل تعاني من حساسية لأي نوع طعام؟"
                value={formData.title_ar}
                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                required
              />
            </div>

            {/* Section & Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                  قسم الاستمارة
                </label>
                <CurvedSelect
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  style={{ width: '100%', height: '40px' }}
                >
                  <option value="personal">البيانات الشخصية</option>
                  <option value="goals">الأهداف الرياضية</option>
                  <option value="measurements">القياسات البدنية</option>
                  <option value="lifestyle">أسلوب الحياة والنشاط</option>
                  <option value="medical">الحالة الطبية والإصابات</option>
                  <option value="nutrition">التغذية والوجبات</option>
                  <option value="training">التدريب والكارديو</option>
                </CurvedSelect>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                  نوع الحقل / الإجابة
                </label>
                <CurvedSelect
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', height: '40px' }}
                >
                  <option value="text">نص قصير (Text)</option>
                  <option value="textarea">نص تفصيلي (Textarea)</option>
                  <option value="number">رقمي (Number)</option>
                  <option value="pill-select">أزرار اختيار فردي (Pill Select)</option>
                  <option value="multi-pill-select">أزرار اختيار متعدد (Multi Pill)</option>
                  <option value="select">قائمة منسدلة (Dropdown)</option>
                  <option value="date">تاريخ (Date)</option>
                  <option value="boolean">نعم / لا (Boolean)</option>
                </CurvedSelect>
              </div>
            </div>

            {/* Placeholder Text */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                نص توضيحي داخل الحقل (Placeholder)
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '9999px',
                  border: '1px solid #D0D5DD',
                  padding: '0 12px',
                  fontSize: '12.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="مثال: اكتب الإجابة بالتفصيل..."
                value={formData.placeholder_ar}
                onChange={(e) => setFormData({ ...formData, placeholder_ar: e.target.value })}
              />
            </div>

            {/* Options builder for Select / Pill-Select */}
            {(formData.type === 'select' || formData.type === 'pill-select' || formData.type === 'multi-pill-select') && (
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #EAECF0'
              }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '8px' }}>
                  خيارات الإجابة المعروضة للمتدرب:
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                  {formData.options.map((opt, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#FFFFFF',
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        border: '1px solid #EAECF0'
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#101828' }}>{opt.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#DC2626',
                          cursor: 'pointer',
                          padding: '2px 4px'
                        }}
                        title="حذف الخيار"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {formData.options.length === 0 && (
                    <span style={{ fontSize: '11.5px', color: '#94A3B8', fontStyle: 'italic' }}>
                      لم تتم إضافة خيارات بعد. أضف خيارات في الحقل أدناه.
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    style={{
                      flex: 1,
                      height: '36px',
                      borderRadius: '9999px',
                      border: '1px solid #CBD5E1',
                      padding: '0 10px',
                      fontSize: '12px',
                      outline: 'none',
                      background: '#FFFFFF'
                    }}
                    placeholder="اسم الخيار الجديد..."
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    style={{
                      height: '36px',
                      padding: '0 14px',
                      borderRadius: '9999px',
                      background: '#F4F0FD',
                      color: '#673DE6',
                      border: '1px solid #DDD6FE',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} />
                    <span>إضافة</span>
                  </button>
                </div>
              </div>
            )}

            {/* Clean Segmented Buttons for Required & Active */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '10px', borderTop: '1px solid #F2F4F7' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '6px' }}>
                  درجة الإلزامية:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, required: true })}
                    style={{
                      flex: 1,
                      height: '34px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: formData.required ? '1px solid #DC2626' : '1px solid #D0D5DD',
                      background: formData.required ? '#FEF2F2' : '#FFFFFF',
                      color: formData.required ? '#DC2626' : '#475467',
                      cursor: 'pointer'
                    }}
                  >
                    إجباري *
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, required: false })}
                    style={{
                      flex: 1,
                      height: '34px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: !formData.required ? '1px solid #673DE6' : '1px solid #D0D5DD',
                      background: !formData.required ? '#F4F0FD' : '#FFFFFF',
                      color: !formData.required ? '#673DE6' : '#475467',
                      cursor: 'pointer'
                    }}
                  >
                    اختياري
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '6px' }}>
                  حالة الظهور في الاستمارة:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: true })}
                    style={{
                      flex: 1,
                      height: '34px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: formData.active ? '1px solid #16A34A' : '1px solid #D0D5DD',
                      background: formData.active ? '#F0FDF4' : '#FFFFFF',
                      color: formData.active ? '#16A34A' : '#475467',
                      cursor: 'pointer'
                    }}
                  >
                    مفعّل
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: false })}
                    style={{
                      flex: 1,
                      height: '34px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: !formData.active ? '1px solid #64748B' : '1px solid #D0D5DD',
                      background: !formData.active ? '#F1F5F9' : '#FFFFFF',
                      color: !formData.active ? '#475569' : '#475467',
                      cursor: 'pointer'
                    }}
                  >
                    مخفي
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 20px',
            background: '#F9FAFB',
            borderTop: '1px solid #EAECF0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '9999px',
                border: '1px solid #D0D5DD',
                background: '#FFFFFF',
                color: '#344054',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                height: '36px', 
                padding: '0 20px',
                borderRadius: '9999px',
                background: '#673DE6',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(103, 61, 230, 0.25)' 
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>حفظ السؤال</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
