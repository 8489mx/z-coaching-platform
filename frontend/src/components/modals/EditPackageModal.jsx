import React, { useState, useEffect } from 'react';

export default function EditPackageModal({ isOpen, onClose, packageData, onSave, saving }) {
  const [formData, setFormData] = useState({
    id: '',
    name_ar: '',
    badge_ar: '',
    price_egp: 2500,
    duration_months: 3,
    free_months: 1,
    featuresText: '',
    is_featured: false,
    active: true
  });

  useEffect(() => {
    if (packageData) {
      setFormData({
        id: packageData.id || '',
        name_ar: packageData.name_ar || '',
        badge_ar: packageData.badge_ar || '',
        price_egp: packageData.price_egp || 2500,
        duration_months: packageData.duration_months || 3,
        free_months: packageData.free_months || 0,
        featuresText: Array.isArray(packageData.features) ? packageData.features.join('\n') : '',
        is_featured: Boolean(packageData.is_featured),
        active: packageData.active !== undefined ? packageData.active : true
      });
    } else {
      setFormData({
        id: `PKG_${Date.now()}`,
        name_ar: '',
        badge_ar: '',
        price_egp: 2500,
        duration_months: 3,
        free_months: 1,
        featuresText: 'خطة تغذية ذكية مع توزين الماكروز\nجدول تمارين مخصص\nمتابعة وتكيف أسبوعي',
        is_featured: false,
        active: true
      });
    }
  }, [packageData, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name_ar.trim()) {
      alert('يرجى كتابة اسم الباقة بالعربية');
      return;
    }

    const payload = {
      id: formData.id,
      name_ar: formData.name_ar.trim(),
      badge_ar: formData.badge_ar.trim(),
      price_egp: Number(formData.price_egp) || 0,
      duration_months: Number(formData.duration_months) || 1,
      free_months: Number(formData.free_months) || 0,
      features: formData.featuresText.split('\n').map(s => s.trim()).filter(Boolean),
      is_featured: formData.is_featured,
      active: formData.active
    };

    onSave(payload);
  };

  const totalMonths = (Number(formData.duration_months) || 0) + (Number(formData.free_months) || 0);

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 1065 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
        <div 
          className="modal-content border-0 shadow-2xl bg-white" 
          style={{ borderRadius: '24px', overflow: 'hidden' }}
          dir="rtl"
        >
          {/* Header */}
          <div className="modal-header border-bottom p-4 bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', background: '#f5f3ff', color: '#261c6a', border: '1.5px solid #ddd6fe' }}>
                <i className="ti ti-crown fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>
                  {packageData ? 'تعديل بيانات الباقة والسعر' : 'إضافة باقة اشتراك جديدة'}
                </h5>
                <small className="text-muted" style={{ fontSize: '0.78rem' }}>ضبط مسمى الباقة، المدة، الأسعار، والمميزات</small>
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

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 bg-white" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              
              {/* Package Name */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.82rem' }}>
                  اسم الباقة بالعربية <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  style={{ height: '40px', borderRadius: '10px', fontSize: '0.85rem' }}
                  placeholder="مثال: باقة إيليت (Elite Package)"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  required
                />
              </div>

              {/* Badge text */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.82rem' }}>
                  الشارة الترويجية (Badge)
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  style={{ height: '40px', borderRadius: '10px', fontSize: '0.85rem' }}
                  placeholder="مثال: عرض خاص 3 شهور + 1 مجاناً"
                  value={formData.badge_ar}
                  onChange={(e) => setFormData({ ...formData, badge_ar: e.target.value })}
                />
              </div>

              {/* Price & Duration Row */}
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.82rem' }}>
                    السعر (ج.م) <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="number" 
                    className="form-control"
                    style={{ height: '40px', borderRadius: '10px', fontSize: '0.85rem' }}
                    value={formData.price_egp}
                    onChange={(e) => setFormData({ ...formData, price_egp: e.target.value })}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.82rem' }}>
                    المدة الأساسية (شهور)
                  </label>
                  <input 
                    type="number" 
                    className="form-control"
                    style={{ height: '40px', borderRadius: '10px', fontSize: '0.85rem' }}
                    value={formData.duration_months}
                    onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Free Months & Total */}
              <div className="row g-2 mb-3 align-items-center">
                <div className="col-6">
                  <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.82rem' }}>
                    شهور مجانية إضافية
                  </label>
                  <input 
                    type="number" 
                    className="form-control"
                    style={{ height: '40px', borderRadius: '10px', fontSize: '0.85rem' }}
                    value={formData.free_months}
                    onChange={(e) => setFormData({ ...formData, free_months: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <div className="p-2 rounded-3 bg-light border text-center mt-3">
                    <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>إجمالي مدة الاشتراك:</small>
                    <strong className="text-primary" style={{ fontSize: '0.92rem' }}>{totalMonths} شهور ({totalMonths * 30} يوم)</strong>
                  </div>
                </div>
              </div>

              {/* Features list */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.82rem' }}>
                  مميزات الباقة (اكتب كل ميزة في سطر مستقل)
                </label>
                <textarea 
                  className="form-control"
                  rows="4"
                  style={{ borderRadius: '12px', fontSize: '0.84rem' }}
                  placeholder="خطة تغذية ذكية مع توزين الماكروز&#10;جدول تمارين مخصص&#10;متابعة وتكيف أسبوعي"
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                ></textarea>
              </div>

              {/* Flags (Featured & Active) */}
              <div className="d-flex gap-4 pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                  <label className="form-check-label small fw-bold text-dark" htmlFor="is_featured">
                    تمييز كباقة رئيسية (Featured)
                  </label>
                </div>

                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <label className="form-check-label small fw-bold text-dark" htmlFor="active">
                    باقة مفعلة ونشطة
                  </label>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="modal-footer p-3 px-4 bg-light d-flex justify-content-between border-top" style={{ borderColor: '#f1f5f9' }}>
              <button 
                type="button" 
                className="btn btn-sm btn-light rounded-pill px-3 fw-semibold border"
                style={{ height: '36px', fontSize: '0.8rem', color: '#475569' }}
                onClick={onClose}
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="btn btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 text-white"
                style={{ 
                  height: '36px', 
                  fontSize: '0.82rem', 
                  background: 'linear-gradient(135deg, #261c6a 0%, #4338ca 100%)', 
                  border: 'none', 
                  boxShadow: '0 2px 10px rgba(38, 28, 106, 0.22)' 
                }}
              >
                {saving ? (
                  <><span className="spinner-border spinner-border-sm"></span> جاري الحفظ...</>
                ) : (
                  <><i className="ti ti-check fs-6"></i> حفظ الباقة</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
