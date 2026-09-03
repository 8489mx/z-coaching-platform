import { getClientTier, getTierColors, ClientCodeBadge, ClientPackageBadge } from '../../utils/tierBadgeHelper';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function EditSubscriptionModal({
  isOpen,
  client,
  onClose,
  formData,
  setFormData,
  onSave,
  saving
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };
    if (isOpen || client) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, client, onClose]);

  if (!client) return null;

  const cleanCode = String(client.client_code || client.id).replace(/^client[-_]?/i, '');

  return (
    <div 
      dir="rtl"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(4px)', 
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: 'Cairo, sans-serif'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        style={{ 
          width: '100%',
          maxWidth: '480px',
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div 
          style={{ 
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '3px', height: '18px', background: '#0284C7', borderRadius: '2px' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                تعديل بيانات الاشتراك
              </h3>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                المشترك: <strong style={{ color: '#0F172A' }}>{client.full_name || 'مشترك جديد'}</strong> (#{cleanCode})
              </span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Package Tier Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                نوع الباقة:
              </label>
              <select
                value={formData.subscription_package}
                onChange={(e) => {
                  const val = e.target.value;
                  const isMax = getClientTier(val) === 'MAX';
                  setFormData({
                    ...formData,
                    subscription_package: val,
                    subscription_price: isMax ? 3500 : 2500
                  });
                }}
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  padding: '0 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0F172A',
                  outline: 'none'
                }}
              >
                <option value="MAX_3_PLUS_1">باقة MAX (3 شهور + 1 مجاناً)</option>
                <option value="MAX_6_PLUS_2">باقة MAX (6 شهور + 2 مجاناً)</option>
                <option value="3_MONTHS">باقة ELITE (3 شهور + 1 مجاناً)</option>
                <option value="6_MONTHS">باقة ELITE (6 شهور + 2 مجاناً)</option>
                <option value="1_MONTH">باقة شهر واحد (تجريبية)</option>
              </select>
            </div>

            {/* Price Input */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                سعر الاشتراك (ج.م):
              </label>
              <input
                type="number"
                value={formData.subscription_price}
                onChange={(e) => setFormData({ ...formData, subscription_price: Number(e.target.value) })}
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '0 10px',
                  fontSize: '13px',
                  fontWeight: 800,
                  fontFamily: 'JetBrains Mono, Cairo',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* Start and End Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  تاريخ البدء:
                </label>
                <input
                  type="date"
                  value={formData.subscription_start_date}
                  onChange={(e) => setFormData({ ...formData, subscription_start_date: e.target.value })}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '0 8px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, Cairo',
                    color: '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  تاريخ الانتهاء:
                </label>
                <input
                  type="date"
                  value={formData.subscription_end_date}
                  onChange={(e) => setFormData({ ...formData, subscription_end_date: e.target.value })}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '0 8px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, Cairo',
                    color: '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div 
            style={{ 
              padding: '14px 20px',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <button 
              type="button"
              onClick={onClose}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '11.5px',
                fontWeight: 700,
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
                borderRadius: '6px',
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)'
              }}
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
