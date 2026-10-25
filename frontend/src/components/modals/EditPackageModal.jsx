import React, { useState, useEffect } from 'react';
import { Crown, X, Check, Loader2 } from 'lucide-react';

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
          borderRadius: '16px',
          maxWidth: '520px',
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
              borderRadius: '8px',
              background: '#F4F0FD',
              color: '#673DE6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Crown size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#101828' }}>
                {packageData ? 'تعديل بيانات الباقة والسعر' : 'إضافة باقة اشتراك جديدة'}
              </h3>
              <span style={{ fontSize: '11.5px', color: '#667085' }}>
                ضبط مسمى الباقة، المدة، الأسعار، والمميزات
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Package Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                اسم الباقة بالعربية <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input 
                type="text" 
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #D0D5DD',
                  padding: '0 12px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="مثال: باقة ELITE"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                required
              />
            </div>

            {/* Badge Text */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                الشارة الترويجية (Badge)
              </label>
              <input 
                type="text" 
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #D0D5DD',
                  padding: '0 12px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="مثال: عرض خاص 3 شهور + 1 مجاناً"
                value={formData.badge_ar}
                onChange={(e) => setFormData({ ...formData, badge_ar: e.target.value })}
              />
            </div>

            {/* Price & Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                  السعر (ج.م) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input 
                  type="number" 
                  style={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #D0D5DD',
                    padding: '0 12px',
                    fontSize: '13px',
                    fontFamily: 'JetBrains Mono, Cairo',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  value={formData.price_egp}
                  onChange={(e) => setFormData({ ...formData, price_egp: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                  المدة الأساسية (شهور)
                </label>
                <input 
                  type="number" 
                  style={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #D0D5DD',
                    padding: '0 12px',
                    fontSize: '13px',
                    fontFamily: 'JetBrains Mono, Cairo',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Free Months & Total */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                  شهور مجانية إضافية
                </label>
                <input 
                  type="number" 
                  style={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #D0D5DD',
                    padding: '0 12px',
                    fontSize: '13px',
                    fontFamily: 'JetBrains Mono, Cairo',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  value={formData.free_months}
                  onChange={(e) => setFormData({ ...formData, free_months: e.target.value })}
                />
              </div>
              <div>
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#F4F0FD',
                  border: '1px solid #DDD6FE',
                  textAlign: 'center',
                  marginTop: '16px'
                }}>
                  <span style={{ fontSize: '11px', color: '#667085', display: 'block' }}>إجمالي مدة الاشتراك:</span>
                  <strong style={{ fontSize: '13px', color: '#673DE6', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {totalMonths} شهور ({totalMonths * 30} يوم)
                  </strong>
                </div>
              </div>
            </div>

            {/* Features list */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                مميزات الباقة (اكتب كل ميزة في سطر مستقل)
              </label>
              <textarea 
                rows={3}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #D0D5DD',
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
                placeholder="خطة تغذية ذكية مع توزين الماكروز&#10;جدول تمارين مخصص&#10;متابعة وتكيف أسبوعي"
                value={formData.featuresText}
                onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
              />
            </div>

            {/* Flags (Featured & Active) */}
            <div style={{ display: 'flex', gap: '20px', paddingTop: '10px', borderTop: '1px solid #F2F4F7' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#344054', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#673DE6' }}
                />
                <span>تمييز كباقة رئيسية (Featured)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#344054', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#673DE6' }}
                />
                <span>باقة مفعلة ونشطة</span>
              </label>
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
                borderRadius: '8px',
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
              disabled={saving}
              style={{ 
                height: '36px', 
                padding: '0 20px',
                borderRadius: '8px',
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
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>حفظ الباقة</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
